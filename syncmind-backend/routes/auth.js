import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../db/index.js';

const router = express.Router();

function sanitizeUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    preferences: row.preferences || {},
    createdAt: row.createdAt
  };
}

async function getAuthenticatedUser(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'No token provided' });
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return null;
    }
    return user;
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    await prisma.user.create({
      data: {
        id,
        name,
        email,
        password: hashedPassword,
        role: 'host',
        preferences: { notifications: true, darkTheme: true }
      }
    });

    const token = jwt.sign(
      { id, email, role: 'host' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const user = await prisma.user.findUnique({ where: { id } });
    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me - Verify token and return user
router.get('/me', async (req, res) => {
  const user = await getAuthenticatedUser(req, res);
  if (!user) return;

  res.json({ user: sanitizeUser(user) });
});

// PUT /api/auth/me - Update profile details and preferences
router.put('/me', async (req, res) => {
  const user = await getAuthenticatedUser(req, res);
  if (!user) return;

  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : user.name;
  const preferences = typeof req.body?.preferences === 'object' && req.body.preferences !== null
    ? req.body.preferences
    : user.preferences || {};

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        preferences
      }
    });

    res.json({ user: sanitizeUser(updated) });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PUT /api/auth/password - Change password
router.put('/password', async (req, res) => {
  const user = await getAuthenticatedUser(req, res);
  if (!user) return;

  const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
  const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  try {
    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

export default router;

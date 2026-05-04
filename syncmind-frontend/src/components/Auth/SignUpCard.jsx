import React, { useState } from 'react';
import Button from '../UI/Button';

export default function SignUpCard({ onSwitchToLogin, onSignUp }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSignUp(name, email, password);
    setLoading(false);
  };

  return (
    <div className="glass-modal p-8 w-full max-w-md">
      <h3 className="text-2xl font-bold text-center mb-2 tracking-tight text-[#1d1d1f]">Create account</h3>
      <p className="text-[#6e6e73] text-center mb-6 text-sm">
        Already have an account?{' '}
        <button onClick={onSwitchToLogin} className="text-[#007AFF] hover:text-[#0A84FF] font-medium transition-colors">Log in</button>
      </p>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)}
          className="input-field" required />
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
          className="input-field" required />
        <input type="password" placeholder="Password (min 6 chars)" value={password} onChange={e => setPassword(e.target.value)}
          className="input-field" required minLength={6} />
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Account'}
        </Button>
      </form>
    </div>
  );
}
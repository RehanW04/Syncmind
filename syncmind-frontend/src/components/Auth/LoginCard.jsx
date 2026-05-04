import React, { useState } from 'react';
import Button from '../UI/Button';

export default function LoginCard({ onSwitchToSignUp, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onLogin(email, password);
    setLoading(false);
  };

  return (
    <div className="glass-modal p-8 w-full max-w-md">
      <h3 className="text-2xl font-bold text-center mb-2 tracking-tight text-[#1d1d1f]">Welcome back</h3>
      <p className="text-[#6e6e73] text-center mb-6 text-sm">
        Don't have an account?{' '}
        <button onClick={onSwitchToSignUp} className="text-[#007AFF] hover:text-[#0A84FF] font-medium transition-colors">Sign up</button>
      </p>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
          className="input-field" required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
          className="input-field" required />
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Logging in...' : 'Log in'}
        </Button>
      </form>
    </div>
  );
}
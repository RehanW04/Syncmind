import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginCard from '../components/Auth/LoginCard';
import SignUpCard from '../components/Auth/SignUpCard';
import {
  Brain,
  Video,
  X,
  ArrowRight,
  Shield,
  Zap,
  MessageSquare,
  Users
} from 'lucide-react';

// Custom hook for scroll reveal animations
function useScrollReveal() {
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.15
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.reveal');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);
}

export default function LandingPage() {
  useScrollReveal();
  const [authMode, setAuthMode] = useState('signup');
  const [authOpen, setAuthOpen] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const openAuth = (mode) => {
    setError('');
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const handleLogin = async (email, password) => {
    setError('');
    const result = await login(email, password);
    if (result?.error) {
      setError(result.error);
      return;
    }
    navigate('/dashboard');
  };

  const handleSignup = async (name, email, password) => {
    setError('');
    const result = await register(name, email, password);
    if (result?.error) {
      setError(result.error);
      return;
    }
    navigate('/dashboard');
  };

  return (
    <main style={{ overflowX: 'hidden', background: 'linear-gradient(135deg, #f0f7ff 0%, #f5f0ff 50%, #fcf7fa 100%)', minHeight: '100vh' }}>
      
      {/* Top Navigation Matching Dashboard but clean for landing page */}
      <nav style={{ position: 'fixed', width: '100%', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 40px' }}>
        <button type="button" onClick={() => window.scrollTo({top:0, behavior:'smooth'})} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'var(--accent)', borderRadius: '8px', color: 'white' }}>
            <Brain className="w-5 h-5" />
          </span>
          <strong style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1d1d1f', letterSpacing: '-0.02em' }}>SyncMind</strong>
        </button>

        <div style={{ display: 'flex', gap: '32px' }}>
          <button type="button" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} style={{ fontWeight: 600, color: '#4a4a4c', background: 'transparent', cursor: 'pointer', border: 'none', fontSize: '1rem' }}>Features</button>
          <button type="button" onClick={() => document.getElementById('security')?.scrollIntoView({ behavior: 'smooth' })} style={{ fontWeight: 600, color: '#4a4a4c', background: 'transparent', cursor: 'pointer', border: 'none', fontSize: '1rem' }}>Security</button>
          <button type="button" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} style={{ fontWeight: 600, color: '#4a4a4c', background: 'transparent', cursor: 'pointer', border: 'none', fontSize: '1rem' }}>Pricing</button>
          <button type="button" onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })} style={{ fontWeight: 600, color: '#4a4a4c', background: 'transparent', cursor: 'pointer', border: 'none', fontSize: '1rem' }}>FAQ</button>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button type="button" onClick={() => openAuth('login')} style={{ color: '#1d1d1f', background: 'transparent', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
            Log in
          </button>
          <button type="button" className="figma-pill-btn-primary" onClick={() => openAuth('signup')}>
            Start for Free
          </button>
        </div>
      </nav>

      {/* Figma Hero with Background Video */}
      <section id="hero" style={{ position: 'relative', width: '100%', paddingTop: '180px', paddingBottom: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
        
        {/* Background Video Layer */}
        <div style={{ position: 'absolute', inset: 0, zIndex: -2 }}>
          <video 
            src="/media/syncmind-hero-1.mp4" 
            autoPlay muted loop playsInline 
            style={{ 
              width: '100%', height: '100%', objectFit: 'cover', display: 'block',
              WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 100%)'
            }} 
          />
        </div>
        
        {/* Soft Light Overlay to ensure Figma text readability and fade into next section */}
        <div style={{ position: 'absolute', inset: 0, zIndex: -1, background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.6) 0%, rgba(240, 247, 255, 0.8) 60%, rgba(245, 240, 255, 0) 100%)', backdropFilter: 'blur(8px)', WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 70%, transparent 100%)' }}></div>

        <div className="reveal" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <h1 className="figma-hero-title">
            Intelligent Meetings for Modern Teams
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#4a4a4c', maxWidth: '700px', margin: '0 auto 40px', lineHeight: 1.6, fontWeight: 500 }}>
            Host secure video calls, get real-time transcripts, and let your personal AI agent summarize action items automatically.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '60px' }}>
            <button type="button" className="figma-pill-btn-primary" onClick={() => openAuth('signup')} style={{ fontSize: '1.1rem', padding: '0 32px', height: '56px' }}>
              Start for Free
            </button>
            <button type="button" className="figma-pill-btn-secondary" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} style={{ fontSize: '1.1rem', padding: '0 32px', height: '56px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)' }}>
              See how it works
            </button>
          </div>
        </div>
      </section>

      {/* Feature Grid (White Glass Cards) matching Figma Asymmetric Style */}
      <section id="features" style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1d1d1f', letterSpacing: '-0.03em', marginBottom: '16px' }}>Everything you need to succeed</h2>
          <p style={{ fontSize: '1.2rem', color: '#4a4a4c', fontWeight: 500 }}>Powerful tools designed for frictionless collaboration.</p>
        </div>
        
        <div className="figma-bento-grid">
          {/* Large Card (Left) */}
          <div className="figma-card figma-card-large reveal">
            <div className="figma-icon-wrapper" style={{ background: 'rgba(0,122,255,0.1)', color: '#007aff' }}><Brain size={32} /></div>
            <h3>Your Personal AI Assistant</h3>
            <p>SyncMind's AI agent quietly takes notes, highlights key moments, and extracts action items so you can focus entirely on the conversation. Never miss a detail again.</p>
          </div>

          {/* Right column cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', gridColumn: 'span 5' }}>
            <div className="figma-card reveal reveal-delay-1" style={{ flex: 1 }}>
              <div className="figma-icon-wrapper" style={{ background: 'rgba(88,86,214,0.1)', color: '#5856d6' }}><Video size={28} /></div>
              <h3>HD Video & Audio</h3>
              <p>Crystal clear 1080p video with ultra-low latency built on enterprise-grade WebRTC.</p>
            </div>
            
            <div className="figma-card reveal reveal-delay-2" style={{ flex: 1 }}>
              <div className="figma-icon-wrapper" style={{ background: 'rgba(255,149,0,0.1)', color: '#ff9500' }}><MessageSquare size={28} /></div>
              <h3>Interactive Q&A</h3>
              <p>Ask the AI assistant questions about the meeting in real-time without interrupting the speaker.</p>
            </div>
          </div>
        </div>

        <div className="figma-bento-grid" style={{ marginTop: '24px' }}>
          <div className="figma-card reveal" style={{ gridColumn: 'span 4' }}>
            <div className="figma-icon-wrapper" style={{ background: 'rgba(52,199,89,0.1)', color: '#34c759' }}><Shield size={28} /></div>
            <h3>Secure by Design</h3>
            <p>End-to-end encryption keeps your sensitive conversations completely private.</p>
          </div>
          <div className="figma-card reveal reveal-delay-1" style={{ gridColumn: 'span 4' }}>
            <div className="figma-icon-wrapper" style={{ background: 'rgba(255,45,85,0.1)', color: '#ff2d55' }}><Zap size={28} /></div>
            <h3>Live Captions</h3>
            <p>Highly accurate real-time speech-to-text ensures you never miss a word.</p>
          </div>
          <div className="figma-card reveal reveal-delay-2" style={{ gridColumn: 'span 4' }}>
            <div className="figma-icon-wrapper" style={{ background: 'rgba(0,199,190,0.1)', color: '#00c7be' }}><Users size={28} /></div>
            <h3>Team Collaboration</h3>
            <p>Share action items and summaries with your team instantly.</p>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="reveal" style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ background: '#f8fafc', borderRadius: '32px', padding: '64px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '64px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1d1d1f', letterSpacing: '-0.03em', marginBottom: '24px' }}>Enterprise-grade security built-in.</h2>
            <p style={{ fontSize: '1.1rem', color: '#4a4a4c', lineHeight: 1.6, marginBottom: '24px' }}>Your conversations are strictly confidential. We employ end-to-end encryption and adhere to strict privacy policies so your meeting data never falls into the wrong hands.</p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: '#1d1d1f', fontWeight: 600 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Shield size={20} color="#2563eb" /> Encrypted WebRTC Connections</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Shield size={20} color="#2563eb" /> Privacy-First AI Processing</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Shield size={20} color="#2563eb" /> Secure JWT Authentication</li>
            </ul>
          </div>
          <div style={{ flex: 1, minWidth: '300px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '200px', height: '200px', background: 'linear-gradient(135deg, #e0efff, #f4e8ff)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
              <Shield size={80} color="#2563eb" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '120px 24px', maxWidth: '1200px', margin: '0 auto', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1d1d1f', letterSpacing: '-0.03em', marginBottom: '16px' }}>Simple, transparent pricing</h2>
          <p style={{ fontSize: '1.2rem', color: '#4a4a4c', fontWeight: 500 }}>Start for free, upgrade when you need more power.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
          <div className="figma-card reveal" style={{ padding: '48px', borderTop: '6px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Free</h3>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: '#1d1d1f', marginBottom: '24px' }}>$0<span style={{ fontSize: '1rem', color: '#6e6e73', fontWeight: 500 }}>/mo</span></div>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px', color: '#4a4a4c' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ color: '#2563eb' }}><Zap size={20}/></div> 40-minute meeting limit</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ color: '#2563eb' }}><Zap size={20}/></div> Standard AI transcription</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ color: '#2563eb' }}><Zap size={20}/></div> Basic meeting summaries</li>
            </ul>
            <button type="button" className="figma-pill-btn-secondary" style={{ width: '100%' }} onClick={() => openAuth('signup')}>Get Started</button>
          </div>
          <div className="figma-card reveal reveal-delay-1" style={{ padding: '48px', borderTop: '6px solid #2563eb', transform: 'scale(1.05)', zIndex: 10 }}>
            <div style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', padding: '6px 12px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 700, display: 'inline-block', marginBottom: '16px' }}>MOST POPULAR</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Pro</h3>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: '#1d1d1f', marginBottom: '24px' }}>$15<span style={{ fontSize: '1rem', color: '#6e6e73', fontWeight: 500 }}>/mo</span></div>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px', color: '#4a4a4c' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ color: '#2563eb' }}><Zap size={20}/></div> Unlimited meeting duration</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ color: '#2563eb' }}><Zap size={20}/></div> Advanced AI action extraction</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ color: '#2563eb' }}><Zap size={20}/></div> Interactive Q&A agent</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ color: '#2563eb' }}><Zap size={20}/></div> Team collaboration tools</li>
            </ul>
            <button type="button" className="figma-pill-btn-primary" style={{ width: '100%' }} onClick={() => openAuth('signup')}>Start Free Trial</button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" style={{ padding: '120px 24px', maxWidth: '800px', margin: '0 auto', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1d1d1f', letterSpacing: '-0.03em', marginBottom: '16px' }}>Frequently asked questions</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="reveal figma-card" style={{ padding: '32px' }}>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '12px' }}>How does the AI Assistant maintain my privacy?</h4>
            <p style={{ color: '#4a4a4c', lineHeight: 1.6 }}>SyncMind is designed around privacy-first architecture. It processes meeting transcripts to generate summaries and extract action items while strictly adhering to data confidentiality constraints.</p>
          </div>
          <div className="reveal figma-card reveal-delay-1" style={{ padding: '32px' }}>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '12px' }}>Do I need to install any extra software to join?</h4>
            <p style={{ color: '#4a4a4c', lineHeight: 1.6 }}>No installation is required. SyncMind uses WebRTC to allow you to host and join secure video meetings directly from any modern web browser.</p>
          </div>
        </div>
      </section>

      {/* High-Impact Pre-Footer CTA */}
      <section className="reveal" style={{ padding: '120px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ background: 'linear-gradient(135deg, #007aff, #5856d6)', borderRadius: '32px', padding: '80px 40px', textAlign: 'center', color: 'white', boxShadow: '0 20px 40px rgba(0,122,255,0.2)' }}>
          <h2 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '24px' }}>Ready to transform your meetings?</h2>
          <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.9)', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>Join thousands of forward-thinking teams using SyncMind.</p>
          <button type="button" onClick={() => openAuth('signup')} style={{ background: 'white', color: '#007aff', fontSize: '1.1rem', fontWeight: 700, padding: '0 40px', height: '64px', borderRadius: '100px', border: 'none', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            Get Started Now <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Dark Figma-style Footer */}
      <footer style={{ background: '#0a0a0b', color: 'white', padding: '80px 24px 40px', marginTop: '60px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '80px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'var(--accent)', borderRadius: '8px', color: 'white' }}>
                <Brain className="w-5 h-5" />
              </span>
              <strong style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>SyncMind</strong>
            </div>
            <p style={{ color: '#888', lineHeight: 1.6 }}>Intelligent meetings powered by advanced AI. Making collaboration seamless and effortless.</p>
          </div>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Product</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><a href="#" style={{ color: '#888', textDecoration: 'none' }}>Features</a></li>
              <li><a href="#" style={{ color: '#888', textDecoration: 'none' }}>Pricing</a></li>
              <li><a href="#" style={{ color: '#888', textDecoration: 'none' }}>Use Cases</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Company</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><a href="#" style={{ color: '#888', textDecoration: 'none' }}>About Us</a></li>
              <li><a href="#" style={{ color: '#888', textDecoration: 'none' }}>Careers</a></li>
              <li><a href="#" style={{ color: '#888', textDecoration: 'none' }}>Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Legal</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><a href="#" style={{ color: '#888', textDecoration: 'none' }}>Privacy Policy</a></li>
              <li><a href="#" style={{ color: '#888', textDecoration: 'none' }}>Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingTop: '40px', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', color: '#666' }}>
          &copy; 2026 SyncMind Inc. All rights reserved.
        </div>
      </footer>

      {authOpen && createPortal(
        <div className="syncmind-auth-overlay" role="dialog" aria-modal="true" aria-label="SyncMind authentication" style={{ background: 'linear-gradient(135deg, #f0f7ff 0%, #f5f0ff 50%, #fcf7fa 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', zIndex: 1000 }}>
          <button
            type="button"
            className="syncmind-auth-close"
            aria-label="Close authentication"
            onClick={() => setAuthOpen(false)}
            style={{ position: 'fixed', top: '32px', right: '32px', zIndex: 1010, width: '48px', height: '48px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', cursor: 'pointer' }}
          >
            <X size={24} color="#1d1d1f" />
          </button>
          
          <div style={{ display: 'flex', width: '100%', maxWidth: '1200px', gap: '80px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            
            {/* Left Side Info */}
            <div style={{ flex: 1, minWidth: '320px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', background: '#2563eb', borderRadius: '10px', color: 'white' }}>
                  <Brain size={24} />
                </span>
                <strong style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1d1d1f', letterSpacing: '-0.02em' }}>SyncMind</strong>
              </div>
              
              <h1 style={{ fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', fontWeight: 900, color: '#1d1d1f', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '24px' }}>
                Smart Meeting <br/>Platform with <span style={{ background: 'linear-gradient(135deg, #007aff, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI<br/>Assistance</span>
              </h1>
              
              <p style={{ fontSize: '1.2rem', color: '#4a4a4c', lineHeight: 1.6, marginBottom: '48px', maxWidth: '400px' }}>
                Real-time transcription, intelligent summaries, and collaborative video meetings.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.6)', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(0,0,0,0.03)' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0efff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}><Video size={20} /></div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1d1d1f', fontSize: '0.95rem' }}>HD Video & Audio</div>
                    <div style={{ fontSize: '0.8rem', color: '#6e6e73' }}>Crystal clear WebRTC</div>
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.6)', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(0,0,0,0.03)' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0efff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}><Brain size={20} /></div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1d1d1f', fontSize: '0.95rem' }}>Live Transcription</div>
                    <div style={{ fontSize: '0.8rem', color: '#6e6e73' }}>AI-powered speech-to-text</div>
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.6)', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(0,0,0,0.03)' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0efff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}><MessageSquare size={20} /></div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1d1d1f', fontSize: '0.95rem' }}>Intelligent Q&A</div>
                    <div style={{ fontSize: '0.8rem', color: '#6e6e73' }}>Context-aware answers</div>
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.6)', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(0,0,0,0.03)' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0efff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}><Zap size={20} /></div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1d1d1f', fontSize: '0.95rem' }}>Auto Summaries</div>
                    <div style={{ fontSize: '0.8rem', color: '#6e6e73' }}>Key points & actions</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side Auth Card */}
            <div className="syncmind-auth-modal" style={{ flex: '0 1 480px', width: '100%' }}>
              {error && <div className="syncmind-auth-error" role="alert" style={{ background: '#fff0f0', color: '#d32f2f', padding: '12px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center', border: '1px solid #ffdcdc' }}>{error}</div>}
              {authMode === 'login' ? (
                <LoginCard
                  onSwitchToSignUp={() => {
                    setAuthMode('signup');
                    setError('');
                  }}
                  onLogin={handleLogin}
                />
              ) : (
                <SignUpCard
                  onSwitchToLogin={() => {
                    setAuthMode('login');
                    setError('');
                  }}
                  onSignUp={handleSignup}
                />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </main>
  );
}

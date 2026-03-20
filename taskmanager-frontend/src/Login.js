import React, { useState } from 'react';

const AUTH_API = 'http://localhost:8080/api/auth';

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    const endpoint = isRegister ? '/register' : '/login';
    try {
      const res = await fetch(`${AUTH_API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Invalid credentials');
      const data = await res.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('userEmail', data.email);
      localStorage.setItem('userName', data.name);
      onLogin(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Segoe UI', sans-serif",
      padding: '20px',
    },
    card: {
      background: '#fff',
      borderRadius: '20px',
      padding: '36px',
      width: '100%',
      maxWidth: '400px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    },
    title: {
      fontSize: '26px',
      fontWeight: '700',
      color: '#2d2d2d',
      marginBottom: '6px',
      textAlign: 'center',
    },
    subtitle: {
      fontSize: '14px',
      color: '#888',
      textAlign: 'center',
      marginBottom: '28px',
    },
    input: {
      width: '100%',
      padding: '12px 14px',
      borderRadius: '10px',
      border: '2px solid #e8e8e8',
      fontSize: '14px',
      marginBottom: '14px',
      outline: 'none',
      boxSizing: 'border-box',
      color: '#2d2d2d',
    },
    btn: {
      width: '100%',
      padding: '13px',
      borderRadius: '10px',
      border: 'none',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      color: '#fff',
      fontWeight: '600',
      fontSize: '15px',
      cursor: 'pointer',
      marginTop: '6px',
    },
    toggle: {
      textAlign: 'center',
      marginTop: '18px',
      fontSize: '14px',
      color: '#888',
    },
    toggleLink: {
      color: '#667eea',
      cursor: 'pointer',
      fontWeight: '600',
    },
    error: {
      background: '#fff0f0',
      color: '#ff4757',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '13px',
      marginBottom: '14px',
      textAlign: 'center',
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>📝 Task Manager</h1>
        <p style={styles.subtitle}>
          {isRegister ? 'Create your account' : 'Welcome back!'}
        </p>

        {error && <div style={styles.error}>{error}</div>}

        {isRegister && (
          <input style={styles.input} placeholder="Your name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} />
        )}
        <input style={styles.input} placeholder="Email address"
          type="email" value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })} />
        <input style={styles.input} placeholder="Password"
          type="password" value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()} />

        <button style={styles.btn} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Login')}
        </button>

        <div style={styles.toggle}>
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <span style={styles.toggleLink}
            onClick={() => { setIsRegister(!isRegister); setError(''); }}>
            {isRegister ? 'Login' : 'Register'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Login;
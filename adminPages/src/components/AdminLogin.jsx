import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import getApiBaseUrl from '../config/apiConfig';
import { IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';

const themeColor = '#3CCF4E';

const styles = {
  wrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '580px',
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',
    backgroundColor: '#f0f2f5',
  },
  container: {
    width: '500px',
    backgroundColor: '#fff',
    border: `2px solid ${themeColor}`,
    borderRadius: '12px',
    padding: '60px 20px 20px',
    boxSizing: 'border-box',
    textAlign: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    color: themeColor,
    marginBottom: '-25px',
  },
  underlineTitle: {
    fontSize: '28px',
    fontWeight: '1000',
    color: themeColor,
    marginBottom: '40px',
  },
  label: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '5px',
    marginTop: '10px',
    display: 'block',
    textAlign: 'left',
  },
  input: {
    width: '100%',
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '15px 12px',
    fontSize: '14px',
    color: '#333',
    boxSizing: 'border-box',
  },
  errorText: {
    color: 'red',
    fontSize: '12px',
    marginTop: '5px',
    textAlign: 'left',
  },
  passwordContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
  },
  eyeIcon: {
    marginLeft: '10px',
    cursor: 'pointer',
    color: 'gray',
    fontSize: '20px',
  },
  forgotPasswordText: {
    fontSize: '14px',
    color: '#2e86de',
    marginTop: '5px',
    textAlign: 'right',
    cursor: 'pointer',
  },
  continueButton: {
    backgroundColor: themeColor,
    borderRadius: '8px',
    padding: '12px',
    marginTop: '20px',
    border: 'none',
    width: '100%',
    cursor: 'pointer',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: '16px',
    textAlign: 'center',
    display: 'block',
  },
  orText: {
    textAlign: 'center',
    marginTop: '30px',
    marginBottom: '50px',
    fontSize: '14px',
    color: '#999',
  },
  guestButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '12px',
    width: '100%',
    cursor: 'pointer',
    backgroundColor: 'transparent',
  },
  guestIcon: {
    width: '30px',
    height: '30px',
    objectFit: 'contain',
  },
  guestButtonText: {
    marginLeft: '8px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
  },
  signupContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '20px',
  },
  signupText: {
    fontSize: '14px',
    color: '#333',
  },
  signupLink: {
    fontSize: '14px',
    color: '#2e86de',
    cursor: 'pointer',
    marginLeft: '4px',
  },
};

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    setErrorMessage('');
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }
    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/api/Auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (response.status === 200) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        navigate('/admin');
    } else {
        setErrorMessage('Login failed');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Login failed');
    }
  };

  const handleForgotPassword = () => console.log('Forgot password pressed');
//   const handleGuestLogin = () => navigate('/admin');
//   const handleSignup = () => navigate('/signup');
  const togglePasswordVisibility = () => setPasswordVisible(v => !v);

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <div style={styles.title}>Log in</div>
        <div style={styles.underlineTitle}>___________</div>

        {errorMessage && <div style={styles.errorText}>{errorMessage}</div>}

        <label style={styles.label}>Your Email</label>
        <input
          type="email"
          style={styles.input}
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <label style={styles.label}>Password</label>
        <div style={styles.passwordContainer}>
          <input
            type={isPasswordVisible ? 'text' : 'password'}
            style={{ ...styles.input, marginBottom: 0 }}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <div onClick={togglePasswordVisibility} style={styles.eyeIcon}>
            {isPasswordVisible ? <IoEyeOffOutline /> : <IoEyeOutline />}
          </div>
        </div>

        <div onClick={handleForgotPassword} style={styles.forgotPasswordText}>
          Forgot password?
        </div>

        <button style={styles.continueButton} onClick={handleLogin}>
          <span style={styles.continueButtonText}>Continue</span>
        </button>
      </div>
    </div>
  );
}
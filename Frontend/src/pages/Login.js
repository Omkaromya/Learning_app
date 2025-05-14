import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';
import { CustomAlert } from '../components/Alert';
import { loginUser } from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'admin'
  });
  const [alert, setAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Check for saved email on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const showAlert = (severity, title, message) => {
    setAlert({ severity, title, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleRememberMeChange = (e) => {
    setRememberMe(e.target.checked);
    if (!e.target.checked) {
      localStorage.removeItem('remembered_email');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await loginUser(formData);
      if (response.user && response.user.role === 'ADMIN') {
        // Handle remember me
        if (rememberMe) {
          localStorage.setItem('remembered_email', formData.email);
          // Store tokens in localStorage for persistent login
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('user', JSON.stringify(response.user));
          if (response.refresh_token) {
            localStorage.setItem('refresh_token', response.refresh_token);
          }
          const expiryTime = Date.now() + (30 * 60 * 1000); // 30 minutes
          localStorage.setItem('token_expiry_time', expiryTime.toString());
        } else {
          // Store tokens in sessionStorage for session-only login
          sessionStorage.setItem('access_token', response.access_token);
          sessionStorage.setItem('user', JSON.stringify(response.user));
          if (response.refresh_token) {
            sessionStorage.setItem('refresh_token', response.refresh_token);
          }
          const expiryTime = Date.now() + (30 * 60 * 1000);
          sessionStorage.setItem('token_expiry_time', expiryTime.toString());
        }

    showAlert('success', 'Success', 'Login successful!');
    setTimeout(() => navigate('/dashboard'), 1000);
      } else {
        showAlert('error', 'Access Denied', 'Only administrators can access this system.');
        // Clear any stored tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('token_expiry_time');
        localStorage.removeItem('user');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        sessionStorage.removeItem('token_expiry_time');
        sessionStorage.removeItem('user');
      }
    } catch (error) {
      showAlert('error', 'Login Failed', error.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    navigate('/signup');
  };

  return (
    <div className="login-container">
      {alert && (
        <CustomAlert
          severity={alert.severity}
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}
      <div className="login-box">
        <div className="login-header">
          <h1>Login</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="role-select"
              disabled
            >
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div className="form-options">
            <label className="remember-me">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={handleRememberMeChange}
              />
              <span>Remember me</span>
            </label>
            <a href="#" className="forgot-password">Forgot Password?</a>
          </div>
          
          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <div className="signup-link">
          Don't have an account? <button onClick={handleSignUp} className="signup-button">Create Account</button>
        </div>
      </div>
    </div>
  );
};

export default Login; 
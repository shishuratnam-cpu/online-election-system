import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
  const navigate = useNavigate();

  // Field states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Validation
    if (password !== confirmPassword) {
      return setErrorMessage('Passwords do not match.');
    }
    if (password.length < 6) {
      return setErrorMessage('Password must be at least 6 characters.');
    }

    setIsLoading(true);

    try {
      const res = await api.post('/auth/register', {
        name,
        email,
        mobile,
        dob,
        address,
        password
      });

      setSuccessMessage(res.data.message || 'Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Registration failed. Try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-5 d-flex align-items-center justify-content-center animate-fade-in" style={{ minHeight: 'calc(100vh - 120px)' }}>
      <div className="w-100" style={{ maxWidth: '540px' }}>
        <div className="glass-panel p-4 p-sm-5 border-top border-4" style={{ borderTopColor: 'var(--accent-success) !important' }}>
          
          <div className="text-center mb-4">
            <span className="fs-1">🗳️</span>
            <h2 className="mt-2 fw-bold">Voter Registration</h2>
            <p className="text-muted small">Create an account to securely participate in active elections.</p>
          </div>

          {errorMessage && <div className="alert alert-danger px-3 py-2" role="alert">{errorMessage}</div>}
          {successMessage && <div className="alert alert-success px-3 py-2" role="alert">{successMessage}</div>}

          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label small text-muted">Full Name</label>
                <input 
                  type="text" 
                  className="form-control custom-input" 
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                />
              </div>
              
              <div className="col-md-6 mb-3">
                <label className="form-label small text-muted">Email Address</label>
                <input 
                  type="email" 
                  className="form-control custom-input" 
                  placeholder="e.g. john@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label small text-muted">Mobile Number</label>
                <input 
                  type="tel" 
                  className="form-control custom-input" 
                  placeholder="e.g. +1 555-0199"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required 
                />
              </div>
              
              <div className="col-md-6 mb-3">
                <label className="form-label small text-muted">Date of Birth</label>
                <input 
                  type="date" 
                  className="form-control custom-input"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small text-muted">Residential Address</label>
              <textarea 
                className="form-control custom-input" 
                rows="2"
                placeholder="Full physical address..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              ></textarea>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label small text-muted">Password</label>
                <input 
                  type="password" 
                  className="form-control custom-input" 
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              
              <div className="col-md-6 mb-4">
                <label className="form-label small text-muted">Confirm Password</label>
                <input 
                  type="password" 
                  className="form-control custom-input" 
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="btn glow-btn w-100 py-2.5 fw-semibold"
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Processing Registration...
                </>
              ) : (
                <>Register Account <i className="fa-solid fa-user-plus ms-2"></i></>
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <span className="text-muted small">Already have an account? </span>
            <Link to="/login" className="text-decoration-none small fw-semibold" style={{ color: 'var(--accent-color)' }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

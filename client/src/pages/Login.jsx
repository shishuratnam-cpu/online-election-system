import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Active role tab: voter, organizer, admin
  const [activeTab, setActiveTab] = useState('voter');

  // Input states
  // const [email, setEmail] = useState('');
  const [voterUsername, setVoterUsername] = useState('');
  const [username, setUsername] = useState('');
  const [uniqueNumber, setUniqueNumber] = useState('');
  const [password, setPassword] = useState('');

  // Status feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Forgot password form state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      let credentials = {};
      if (activeTab === 'voter') {
          credentials = {
          voterId: voterUsername,
          password
      };
      } else if (activeTab === 'organizer') {
          credentials = {
                username,
                uniqueNumber,
                password
            };
        }
        else if (activeTab === 'admin') {
            credentials = {
                username,
                password
            };
        }
      console.log("Username =", credentials.voterId);
      console.log("Password =", credentials.password);
      console.log("Complete =", credentials);
      console.log("Sending Credentials:", credentials);
      console.log("Credentials =", credentials);
      const loggedUser = await login(activeTab, credentials);
      setSuccessMessage('Login successful! Redirecting...');
      
      // Redirect based on role
      setTimeout(() => {
        if (loggedUser.role === 'admin') navigate('/admin/dashboard');
        else if (loggedUser.role === 'organizer') navigate('/organizer/dashboard');
        else if (loggedUser.role === 'voter') navigate('/voter/dashboard');
      }, 1000);
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please verify credentials.');
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      setSuccessMessage(res.data.message || 'Password reset link sent to your email.');
      setForgotEmail('');
      setShowForgot(false);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to send reset link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-5 d-flex align-items-center justify-content-center animate-fade-in" style={{ minHeight: 'calc(100vh - 120px)' }}>
      <div className="w-100" style={{ maxWidth: '480px' }}>
        <div className="glass-panel p-4 p-sm-5 border-top border-4" style={{ borderTopColor: 'var(--accent-color) !important' }}>
          
          <div className="text-center mb-4">
            <span className="fs-1">🔒</span>
            <h2 className="mt-2 fw-bold">{showForgot ? 'Reset Password' : 'Portal Login'}</h2>
            <p className="text-muted small">
              {showForgot
                ? 'Provide your registered email address to reset your password.'
                : 'Login using your assigned Voter ID/Username and password.'}
            </p>
          </div>

          {errorMessage && <div className="alert alert-danger px-3 py-2" role="alert">{errorMessage}</div>}
          {successMessage && <div className="alert alert-success px-3 py-2" role="alert">{successMessage}</div>}

          {!showForgot ? (
            <>
              {/* Role Toggle Tabs */}
              <ul className="nav nav-pills nav-fill mb-4 p-1 bg-dark rounded" style={{ fontSize: '0.85rem' }}>
                <li className="nav-item">
                  <button 
                    onClick={() => { setActiveTab('voter'); setErrorMessage(''); }}
                    className={`nav-link text-uppercase fw-semibold py-2 ${activeTab === 'voter' ? 'active bg-primary' : 'text-muted'}`}
                    style={{ borderRadius: '6px' }}
                  >
                    Voter
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    onClick={() => { setActiveTab('organizer'); setErrorMessage(''); }}
                    className={`nav-link text-uppercase fw-semibold py-2 ${activeTab === 'organizer' ? 'active bg-primary' : 'text-muted'}`}
                    style={{ borderRadius: '6px' }}
                  >
                    Organizer
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    onClick={() => { setActiveTab('admin'); setErrorMessage(''); }}
                    className={`nav-link text-uppercase fw-semibold py-2 ${activeTab === 'admin' ? 'active bg-primary' : 'text-muted'}`}
                    style={{ borderRadius: '6px' }}
                  >
                    Admin
                  </button>
                </li>
              </ul>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit}>
                {/* Voter Inputs */}
                {activeTab === 'voter' && (
                  // <div className="mb-3">
                  //   <label className="form-label small text-muted">Email Address</label>
                  //   <input 
                  //     type="email" 
                  //     className="form-control custom-input" 
                  //     placeholder="e.g. voter@gmail.com" 
                  //     value={email}
                  //     onChange={(e) => setEmail(e.target.value)}
                  //     required 
                  //   />
                  // </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted">
                     Voter Username
                    </label>

                    <input
                     type="text"
                     className="form-control custom-input"
                     placeholder="Voter ID e.g.: 1005247290XY"
                     value={voterUsername}
                     onChange={(e) => setVoterUsername(e.target.value)}
                     required
                    />

                    <small className="text-muted">
                      Format: <strong>1005247290XX</strong> (XX is your unique assigned number)
                    </small>
                  </div>
                )}

                {/* Organizer Inputs */}
                {activeTab === 'organizer' && (
                  <>
                    <div className="mb-3">
                      <label className="form-label small text-muted">Username</label>
                      <input 
                        type="text" 
                        className="form-control custom-input" 
                        placeholder="e.g. john_doe" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small text-muted">Organizer Unique Number</label>
                      <input 
                        type="text" 
                        className="form-control custom-input" 
                        placeholder="e.g. 1005247290AB" 
                        value={uniqueNumber}
                        onChange={(e) => setUniqueNumber(e.target.value)}
                        required 
                      />
                    </div>
                  </>
                )}

                {/* Admin Inputs */}
                {activeTab === 'admin' && (
                  <div className="mb-3">
                    <label className="form-label small text-muted">Admin Username</label>
                    <input 
                      type="text" 
                      className="form-control custom-input" 
                      placeholder="Enter Admin Username" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required 
                    />
                  </div>
                )}

                {/* Common Password Input */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between">
                    <label className="form-label small text-muted">Password</label>
                    {activeTab !== 'organizer' && (
                      <button 
                        type="button" 
                        onClick={() => setShowForgot(true)} 
                        className="btn btn-link p-0 text-decoration-none small"
                        style={{ fontSize: '0.8rem', color: 'var(--accent-color)' }}
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <input 
                    type="password" 
                    className="form-control custom-input" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="btn glow-btn w-100 py-2.5 fw-semibold"
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Authenticating...
                    </>
                  ) : (
                    // <>Sign In <i className="fa-solid fa-arrow-right ms-2"></i></>
                    <>Login <i className="fa-solid fa-arrow-right ms-2"></i></>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Forgot Password Form */
            <form onSubmit={handleForgotSubmit}>
              <div className="mb-4">
                <label className="form-label small text-muted">Registered Email Address</label>
                <input 
                  type="email" 
                  className="form-control custom-input" 
                  placeholder="e.g. user@example.com" 
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required 
                />
              </div>

              <div className="d-flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowForgot(false)} 
                  className="btn btn-outline-secondary flex-grow-1"
                  style={{ borderRadius: '10px' }}
                >
                  Back
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="btn glow-btn flex-grow-1"
                >
                  {isLoading ? 'Sending...' : 'Send Link'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;

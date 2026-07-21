import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
  const { user } = useContext(AuthContext);

  // States
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/profile');
      setProfile(res.data.profile);
    } catch (err) {
      setErrorMessage('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (newPassword !== confirmPassword) {
      return setErrorMessage('New passwords do not match.');
    }
    if (newPassword.length < 6) {
      return setErrorMessage('New password must be at least 6 characters.');
    }

    setIsLoading(true);

    try {
      // Endpoint handles password resetting dynamically
      let endpoint = '';
      if (user.role === 'voter') endpoint = '/auth/reset-password';
      else if (user.role === 'admin') endpoint = '/auth/reset-password';
      
      // Let's implement a clean profile patch/reset password path
      // To support simple password updating for logged in users:
      // We will handle password changes via /auth/reset-password if forgot password,
      // and for logged-in profile password changes, we will provide a universal password updater.
      // Wait! Let's check how we handle it in our backend: we can write a route or reuse reset-password.
      // Let's create an endpoint in authController later if needed or write a small patch.
      // Wait, we have a route POST `/api/auth/reset-password` that takes token and email.
      // Let's see if we should write a specific Change Password endpoint.
      // Wait, the backend doesn't have a direct "change password while logged in" endpoint yet. Let's look at `authController.js`.
      // Let's check if we can add it or mock a change password successfully by sending a message or updating authController!
      // Ah! We can easily use `replace_file_content` to add a `/change-password` endpoint to the backend! This is extremely professional and ensures the feature works perfectly.
      // Let's first write a request to `/auth/change-password` in the frontend, and then we will update the backend router/controller to support it.

      await api.post('/auth/change-password', {
        oldPassword,
        newPassword
      });

      setSuccessMessage('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4 animate-fade-in">
      <h2 className="fw-bold mb-4">My Account Profile</h2>

      {successMessage && <div className="alert alert-success alert-dismissible fade show" role="alert">
        {successMessage}
        <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
      </div>}

      {errorMessage && <div className="alert alert-danger alert-dismissible fade show" role="alert">
        {errorMessage}
        <button type="button" className="btn-close" onClick={() => setErrorMessage('')}></button>
      </div>}

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="glass-panel p-4 h-100 border-top border-4" style={{ borderTopColor: 'var(--accent-color) !important' }}>
            <h5 className="mb-4 text-white">Profile Details</h5>
            
            {profile && (
              <table className="table table-borderless custom-table m-0">
                <tbody>
                  <tr>
                    <td className="fw-bold text-white" style={{ width: '140px' }}>Name/User:</td>
                    <td>{profile.name || profile.username}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold text-white">Role Category:</td>
                    <td>
                      <span className="badge bg-secondary text-uppercase px-2.5 py-1">
                        {user.role}
                      </span>
                    </td>
                  </tr>
                  
                  {user.role === 'voter' && (
                    <>
                      <tr>
                        <td className="fw-bold text-white">Email Address:</td>
                        <td>{profile.email}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold text-white">Mobile Number:</td>
                        <td>{profile.mobile}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold text-white">Date of Birth:</td>
                        <td>{profile.dob}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold text-white">Address:</td>
                        <td className="small">{profile.address}</td>
                      </tr>
                    </>
                  )}

                  {user.role === 'organizer' && (
                    <tr>
                      <td className="fw-bold text-white">Unique Number:</td>
                      <td><code>{profile.unique_number}</code></td>
                    </tr>
                  )}

                  {user.role === 'admin' && (
                    <tr>
                      <td className="fw-bold text-white">Email Contact:</td>
                      <td>{profile.email}</td>
                    </tr>
                  )}

                  <tr>
                    <td className="fw-bold text-white">Account Created:</td>
                    <td>{formatDate(profile.created_at)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="col-lg-6">
          <div className="glass-panel p-4 h-100">
            <h5 className="mb-4 text-white">Update Password</h5>
            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-3">
                <label className="form-label small text-muted">Current Password</label>
                <input 
                  type="password" 
                  className="form-control custom-input" 
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  required 
                />
              </div>

              <div className="mb-3">
                <label className="form-label small text-muted">New Password</label>
                <input 
                  type="password" 
                  className="form-control custom-input" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required 
                />
              </div>

              <div className="mb-4">
                <label className="form-label small text-muted">Confirm New Password</label>
                <input 
                  type="password" 
                  className="form-control custom-input" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required 
                />
              </div>

              <button type="submit" disabled={isLoading} className="btn btn-warning w-100 fw-semibold">
                {isLoading ? 'Saving Changes...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

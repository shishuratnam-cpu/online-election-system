import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ContactHelp from "../components/ContactHelp";

const Navbar = ({ theme, toggleTheme }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-danger';
      case 'organizer': return 'bg-warning text-dark';
      case 'voter': return 'bg-success';
      default: return 'bg-secondary';
    }
  };

  return (
  <nav className="top-navbar d-flex align-items-center justify-content-between px-4 w-100">


      <div className="d-flex align-items-center">
        <h4 className="m-0 d-none d-sm-block">Portal Space</h4>
      </div>

      <div className="d-flex align-items-center gap-3"></div>
      <div className="d-flex align-items-center">
        <h4 className="m-0 d-none d-sm-block">Portal Space</h4>
      </div>

      <div className="d-flex align-items-center gap-3">
        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme} 
          className="theme-toggle-btn" 
          title="Toggle Light/Dark Theme"
          aria-label="Toggle Light/Dark Theme"
        >
          {theme === 'dark' ? (
            <i className="fa-solid fa-sun text-warning"></i>
          ) : (
            <i className="fa-solid fa-moon text-primary"></i>
          )}
        </button>

        {user && (
          <>
            <div className="d-flex flex-column text-end d-none d-md-flex">
              <span className="fw-semibold text-capitalize" style={{ fontSize: '0.95rem' }}>
                {user.name || user.username}
              </span>
              <span className="text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                {user.email || user.uniqueNumber}
              </span>
            </div>

            <span className={`badge ${getRoleBadgeColor(user.role)} text-uppercase px-2.5 py-1.5`} style={{ fontSize: '0.75rem' }}>
              {user.role}
            </span>

            <button onClick={handleLogout} className="btn btn-outline-secondary btn-sm" title="Log Out">
              <i className="fa-solid fa-right-from-bracket"></i> <span className="d-none d-lg-inline ms-1">Logout</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

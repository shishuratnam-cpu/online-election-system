import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Sidebar = () => {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  return (
    <div className="sidebar-wrapper d-flex flex-column p-3">
      <div className="d-flex align-items-center mb-4 px-2">
        <span className="fs-4 fw-bold glow-text" style={{ color: 'var(--accent-color)' }}>
          🗳️ Election Portal
        </span>
      </div>
      
      <hr style={{ borderColor: 'var(--border-color)' }} />
      
      <div className="nav flex-column mb-auto">
        {/* voter sidebar links */}
        {user.role === 'voter' && (
          <>
            <NavLink to="/voter/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="fa-solid fa-chart-line"></i> Dashboard
            </NavLink>
            <NavLink to="/voter/elections" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="fa-solid fa-check-to-slot"></i> Vote / Elections
            </NavLink>
          </>
        )}

        {/* organizer sidebar links */}
        {user.role === 'organizer' && (
          <>
            <NavLink to="/organizer/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="fa-solid fa-chart-pie"></i> Dashboard
            </NavLink>
            <NavLink to="/organizer/candidates" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="fa-solid fa-users-viewfinder"></i> Candidates
            </NavLink>
          </>
        )}

        {/* admin sidebar links */}
        {user.role === 'admin' && (
          <>
            <NavLink to="/admin/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="fa-solid fa-gauge-high"></i> Dashboard
            </NavLink>
            <NavLink to="/admin/organizers" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="fa-solid fa-user-gear"></i> Organizers
            </NavLink>
            <NavLink to="/admin/nominations" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="fa-solid fa-id-card-clip"></i> Nominations
            </NavLink>
            <NavLink to="/admin/voters" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="fa-solid fa-users"></i> Voters
            </NavLink>
            <NavLink to="/admin/audit" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="fa-solid fa-clock-rotate-left"></i> Audit Logs
            </NavLink>
          </>
        )}

        <hr style={{ borderColor: 'var(--border-color)' }} />
        
        <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <i className="fa-solid fa-user-large"></i> My Profile
        </NavLink>
      </div>

      <div className="px-3 py-2 text-center text-muted" style={{ fontSize: '0.8rem' }}>
        v1.0.0 &bull; Secure Voting
      </div>
    </div>
  );
};

export default Sidebar;

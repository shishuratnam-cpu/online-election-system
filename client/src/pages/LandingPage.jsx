import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const LandingPage = ({ theme, toggleTheme }) => {
  const [showNavbar, setShowNavbar] = useState(false);

useEffect(() => {
  const handleScroll = () => {
    if (window.scrollY > window.innerHeight - 80) {
      setShowNavbar(true);
    } else {
      setShowNavbar(false);
    }
  };

  window.addEventListener("scroll", handleScroll);

  return () => window.removeEventListener("scroll", handleScroll);
}, []);
  return (
    <>
      {/* ================= HERO SECTION ================= */}

<section
  style={{
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    textAlign: "center"
  }}
>
  <button
  onClick={toggleTheme}
  style={{
    position: "absolute",
    top: "20px",
    right: "20px",
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    background: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(10px)",
    color: "#fff",
    fontSize: "22px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
  }}
>
  {theme === "dark" ? "☀️" : "🌙"}
</button>

  {/* Welcome */}
  <h3
    className="welcome-text"
    style={{
      fontWeight: "700",
      letterSpacing: "6px",
      color: "#555",
      animation: "fadeDown 1.5s ease"
    }}
  >
    WELCOME
  </h3>

  {/* TO */}
  <h3
    className="welcome-text"
    style={{
      marginTop: "10px",
      fontWeight: "700",
      letterSpacing: "6px",
      color: "#555",
      animation: "fadeDown 2.5s ease"
    }}
  >
    TO
  </h3>

  {/* SEP */}
  <h1
    style={{
      fontSize: "7rem",
      fontWeight: "900",
      color: "#1f3f99",
      letterSpacing: "12px",
      marginTop: "30px",
      animation: "zoomIn 3.5s ease"
    }}
  >
    SEP
  </h1>

  {/* Student Election Portal */}
  <h2
    style={{
      marginTop: "25px",
      color: "#1f3f99",
      fontWeight: "700",
      animation: "fadeUp 4.5s ease"
    }}
  >
    Student Election Portal
  </h2>

  <p
    className="text-muted mt-3"
    style={{
      fontSize: "1.3rem",
      animation: "fadeUp 5.5s ease"
    }}
  >
    Secure • Transparent • Trusted Online Elections
  </p>

  <div className="mt-5">
    <i
      className="fa-solid fa-angles-down bounce"
      style={{
        fontSize: "2.5rem",
        color: "#1f3f99"
      }}
    ></i>

    <p
      className="mt-2"
      style={{
        color: "#1f3f99",
        fontWeight: "600"
      }}
    >
      Scroll Down
    </p>
  </div>

</section>
<div className="container py-5 animate-fade-in">
      {/* Hero Section */}
      <div className="row align-items-center justify-content-between my-5 py-4">
        <div className="col-lg-6 mb-5 mb-lg-0">
          <span className="badge bg-primary px-3 py-2 rounded-pill mb-3 text-uppercase fw-semibold" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>
            Next-Gen E-Voting Platform
          </span>
          <h1 className="display-4 fw-extrabold mb-4 lh-sm">
            Secure, Transparent & <br />
            <span className="glow-text" style={{ color: 'var(--accent-color)' }}>Decentralized Elections</span>
          </h1>
          <p className="lead text-muted mb-4 fs-5" style={{ maxWidth: '520px' }}>
            Empowering organizations, universities, and communities to run seamless, tamper-proof online elections. Easy nomination, voter validation, and real-time result auditing.
          </p>
          <div className="d-flex flex-wrap gap-3">
            <Link to="/login" className="btn btn-lg glow-btn px-4 py-2.5 fw-semibold">
              <i className="fa-solid fa-right-to-bracket me-2"></i> Enter Portal
            </Link>
            <Link to="/nomination" className="btn btn-lg btn-outline-secondary px-4 py-2.5 fw-semibold" style={{ borderRadius: '12px' }}>
              <i className="fa-solid fa-file-signature me-2"></i> Apply as Candidate
            </Link>
          </div>
        </div>
        
        <div className="col-lg-5 text-center">
          <div className="glass-panel p-5 gradient-border text-start">
            <h3 className="mb-4">🗳️ Voting Guidelines</h3>
            <div className="d-flex align-items-start mb-3.5">
              <div className="bg-primary text-white p-2 rounded me-3" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fa-solid fa-user-plus"></i>
              </div>
              <div>
                <h5>Voter Registration</h5>
                <p className="text-muted small mb-0">Register your account with verified information, date of birth, and email validation.</p>
              </div>
            </div>

            <div className="d-flex align-items-start mb-3.5">
              <div className="bg-success text-white p-2 rounded me-3" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fa-solid fa-check-to-slot"></i>
              </div>
              <div>
                <h5>Cast Your Ballot</h5>
                <p className="text-muted small mb-0">View open elections, read candidate manifestos, and submit your vote. One vote per election constraint is strictly enforced.</p>
              </div>
            </div>

            <div className="d-flex align-items-start">
              <div className="bg-warning text-dark p-2 rounded me-3" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fa-solid fa-square-poll-vertical"></i>
              </div>
              <div>
                <h5>Audited Results</h5>
                <p className="text-muted small mb-0">Real-time vote progress is visible to organizers. Voters can access full election outcome reports immediately after voting ends.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Section */}
      {/* Feature Section */}
<div className="row text-center mt-5 pt-5 border-top" style={{ borderColor: 'var(--border-color)' }}>

  <div className="col-md-4 mb-4">
    <div className="glass-panel p-4 glass-card-hover h-100">
      <div className="stat-icon bg-primary text-white mx-auto mb-3">
        <i className="fa-solid fa-shield-halved"></i>
      </div>
      <h4>Cryptographic Security</h4>
      <p className="text-muted">
        Password hashing, JWT authorization tokens, and duplicate vote checking prevent ballot tampering.
      </p>
    </div>
  </div>


  <div className="col-md-4 mb-4">
    <div className="glass-panel p-4 glass-card-hover h-100">
      <div className="stat-icon bg-success text-white mx-auto mb-3">
        <i className="fa-solid fa-user-shield"></i>
      </div>
      <h4>Role-Based Access</h4>
      <p className="text-muted">
        Structured roles for Admins, Organizers, Candidates, and Voters preserve system boundaries.
      </p>
    </div>
  </div>


  <div className="col-md-4 mb-4">
    <div className="glass-panel p-4 glass-card-hover h-100">
      <div className="stat-icon bg-warning text-dark mx-auto mb-3">
        <i className="fa-solid fa-file-csv"></i>
      </div>
      <h4>System Audit Logs</h4>
      <p className="text-muted">
        Complete operation trace details written to database records are exportable for external review.
      </p>
    </div>
  </div>


  <div className="col-md-4 mb-4">
    <div className="glass-panel p-4 glass-card-hover h-100">
      <div className="stat-icon bg-info text-white mx-auto mb-3">
        <i className="fa-solid fa-headset"></i>
      </div>

      <h4>Customer Support</h4>

      <p className="text-muted">
        Get assistance through our official helpline number and email support for any election-related queries.
      </p>

    </div>
  </div>


</div>
    </div>

</>
);
};

export default LandingPage;

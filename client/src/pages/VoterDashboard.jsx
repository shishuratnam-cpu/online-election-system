import React, { useState, useEffect } from 'react';
import api from '../services/api';

const VoterDashboard = ({ selectTab = 'dashboard' }) => {
  const [activeTab, setActiveTab] = useState(selectTab);

  // General States
  const [stats, setStats] = useState({});
  const [history, setHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Active voting election details
  const [votingElection, setVotingElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Finished Results modal state
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [resultsData, setResultsData] = useState(null);

  useEffect(() => {
    setActiveTab(selectTab);
    setErrorMessage('');
    setSuccessMessage('');
  }, [selectTab]);

  useEffect(() => {
    fetchVoterOverview();
    if (activeTab === 'elections') {
      fetchElections();
    }
  }, [activeTab]);

  const fetchVoterOverview = async () => {
    setLoading(true);
    try {
      const res = await api.get('/vote/dashboard');
      setStats(res.data.stats);
      setHistory(res.data.history);
      setNotifications(res.data.notifications);
    } catch (err) {
      setErrorMessage('Failed to fetch voter stats.');
    } finally {
      setLoading(false);
    }
  };

  const fetchElections = async () => {
    setLoading(true);
    try {
      const res = await api.get('/vote/elections');
      setElections(res.data.elections);
    } catch (err) {
      setErrorMessage('Failed to fetch available elections list.');
    } finally {
      setLoading(false);
    }
  };

  // Open candidate picker for election
  const handleOpenVoting = async (electionId) => {
    setErrorMessage('');
    setSelectedCandidateId(null);
    try {
      const res = await api.get(`/vote/elections/${electionId}`);
      setVotingElection(res.data.election);
      setCandidates(res.data.candidates);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to load election details.');
    }
  };

  // Cast Vote confirmation modal triggers
  const handleCastVoteClick = () => {
    if (!selectedCandidateId) {
      return setErrorMessage('Please select a candidate to cast your vote.');
    }
    setShowConfirmModal(true);
  };

  const handleConfirmVoteSubmit = async () => {
    setShowConfirmModal(false);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await api.post('/vote/cast', {
        electionId: votingElection.id,
        candidateId: selectedCandidateId
      });

      setSuccessMessage(res.data.message || 'Your vote has been cast successfully!');
      setVotingElection(null);
      setCandidates([]);
      setSelectedCandidateId(null);
      fetchVoterOverview();
      fetchElections();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to submit vote.');
    }
  };

  // Fetch ended results
  const handleOpenResults = async (id) => {
    setErrorMessage('');
    try {
      const res = await api.get(`/vote/results/${id}`);
      setResultsData(res.data);
      setShowResultsModal(true);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to retrieve results.');
    }
  };

  // Date styling helper
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="animate-fade-in">
      <h2 className="fw-bold mb-4">Voter Dashboard</h2>

      {successMessage && <div className="alert alert-success alert-dismissible fade show" role="alert">
        {successMessage}
        <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
      </div>}

      {errorMessage && <div className="alert alert-danger alert-dismissible fade show" role="alert">
        {errorMessage}
        <button type="button" className="btn-close" onClick={() => setErrorMessage('')}></button>
      </div>}

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4 border-secondary">
        <li className="nav-item">
          <button onClick={() => setActiveTab('dashboard')} className={`nav-link fw-semibold ${activeTab === 'dashboard' ? 'active bg-dark text-white border-secondary' : 'text-muted'}`}>
            Overview
          </button>
        </li>
        <li className="nav-item">
          <button onClick={() => setActiveTab('elections')} className={`nav-link fw-semibold ${activeTab === 'elections' ? 'active bg-dark text-white border-secondary' : 'text-muted'}`}>
            Elections Portal {stats.availableElections > 0 && <span className="badge bg-success ms-1">{stats.availableElections}</span>}
          </button>
        </li>
      </ul>

      {loading && !votingElection && (
        <div className="spinner-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {/* Tab: Dashboard Summary */}
      {activeTab === 'dashboard' && !loading && (
        <div className="row g-4">
          <div className="col-lg-8">
            {/* Stats */}
            <div className="row g-3 mb-4">
              <div className="col-sm-6">
                <div className="glass-panel stat-card text-white bg-primary bg-opacity-25 border border-primary">
                  <div>
                    <span className="text-muted small">My Votes Cast</span>
                    <h3 className="fw-bold m-0">{stats.votesCast}</h3>
                  </div>
                  <div className="stat-icon bg-primary"><i className="fa-solid fa-vote-yea"></i></div>
                </div>
              </div>
              <div className="col-sm-6">
                <div className="glass-panel stat-card text-white bg-success bg-opacity-25 border border-success">
                  <div>
                    <span className="text-muted small">Active Elections Open</span>
                    <h3 className="fw-bold m-0 text-success">{stats.availableElections}</h3>
                  </div>
                  <div className="stat-icon bg-success"><i className="fa-solid fa-check-to-slot"></i></div>
                </div>
              </div>
            </div>

            {/* Voting History */}
            <div className="glass-panel p-4">
              <h5 className="mb-3">My Voting History</h5>
              <div className="table-responsive">
                <table className="table custom-table">
                  <thead>
                    <tr>
                      <th>Election Name</th>
                      <th>Target Position</th>
                      <th>Candidate Voted For</th>
                      <th>Cast Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record, index) => (
                      <tr key={index}>
                        <td className="fw-semibold">{record.title}</td>
                        <td><span className="badge bg-secondary">{record.position}</span></td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <img src={`http://localhost:5000${record.candidate_photo}`} style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '50%' }} alt="" />
                            <span>{record.voted_for_candidate}</span>
                          </div>
                        </td>
                        <td className="small">{formatDate(record.voted_at)}</td>
                      </tr>
                    ))}
                    {history.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center py-4 text-muted">You have not submitted votes in any elections yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            {/* Notifications */}
            <div className="glass-panel p-4 h-100">
              <h5 className="mb-3">📢 Notifications</h5>
              <div className="d-flex flex-column gap-3">
                {notifications.map(n => (
                  <div key={n.id} className="p-3 rounded border border-secondary" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <p className="small mb-1">{n.message}</p>
                    <span className="text-muted" style={{ fontSize: '0.7rem' }}>{formatDate(n.created_at)}</span>
                  </div>
                ))}
                {notifications.length === 0 && <div className="text-center text-muted small py-4">No new notifications.</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Elections Portal */}
      {activeTab === 'elections' && !loading && !votingElection && (
        <div className="row g-4">
          {elections.map(election => (
            <div className="col-md-6 col-lg-4" key={election.id}>
              <div className={`glass-panel p-4 h-100 d-flex flex-column border-top border-4 ${
                election.live_status === 'ongoing' && !election.has_voted ? 'border-success' :
                election.live_status === 'upcoming' ? 'border-primary' : 'border-secondary'
              }`}>
                <div className="d-flex justify-content-between mb-2">
                  <span className={`badge ${
                    election.live_status === 'ongoing' ? 'bg-success' :
                    election.live_status === 'upcoming' ? 'bg-primary' : 'bg-secondary'
                  } text-uppercase`}>
                    {election.live_status === 'ongoing' ? 'ongoing' : election.live_status}
                  </span>
                  
                  {election.has_voted > 0 && <span className="badge bg-success-subtle text-success border border-success">Voted</span>}
                </div>

                <h4 className="fw-bold">{election.title}</h4>
                <span className="badge bg-secondary align-self-start mb-3">{election.position}</span>
                <p className="text-muted small flex-grow-1">{election.description}</p>

                <div className="small border-top border-secondary pt-3 mb-4">
                  <div className="d-flex justify-content-between text-muted mb-1">
                    <span>Voting Starts:</span> 
                    <span className="text-white">{election.start_datetime.split(' ')[0]} {election.start_datetime.split(' ')[1].substring(0,5)}</span>
                  </div>
                  <div className="d-flex justify-content-between text-muted">
                    <span>Voting Ends:</span> 
                    <span className="text-white">{election.end_datetime.split(' ')[0]} {election.end_datetime.split(' ')[1].substring(0,5)}</span>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  {election.live_status === 'ongoing' && (
                    <button 
                      onClick={() => handleOpenVoting(election.id)} 
                      disabled={election.has_voted > 0}
                      className="btn glow-btn btn-sm flex-grow-1"
                    >
                      {election.has_voted > 0 ? 'Ballot Submitted' : 'Enter Voting booth'}
                    </button>
                  )}

                  {election.live_status === 'completed' && (
                    <button onClick={() => handleOpenResults(election.id)} className="btn btn-outline-secondary btn-sm flex-grow-1">
                      <i className="fa-solid fa-square-poll-vertical me-1.5"></i> View Results
                    </button>
                  )}

                  {election.live_status === 'upcoming' && (
                    <button disabled className="btn btn-outline-secondary btn-sm flex-grow-1 text-muted">
                      <i className="fa-solid fa-lock me-1.5"></i> Locked
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {elections.length === 0 && <div className="text-center py-5 text-muted col-12">No active elections currently published.</div>}
        </div>
      )}

      {/* Voting Ballot Box View */}
      {votingElection && (
        <div className="glass-panel p-4 p-sm-5 animate-fade-in">
          <button onClick={() => setVotingElection(null)} className="btn btn-sm btn-outline-secondary mb-4">
            <i className="fa-solid fa-arrow-left me-1"></i> Back to Elections
          </button>

          <div className="mb-4">
            <span className="badge bg-success text-uppercase mb-2">Live Ballot</span>
            <h2 className="fw-bold m-0">{votingElection.title}</h2>
            <h5 className="text-muted mt-1">Target Office: <strong className="text-warning">{votingElection.position}</strong></h5>
            <p className="text-muted small mt-2">{votingElection.description}</p>
          </div>

          <h5 className="mb-3 text-white fw-bold">Select Candidate:</h5>
          <div className="row g-4 mb-4">
            {candidates.map(cand => (
              <div className="col-md-6" key={cand.id}>
                <div 
                  onClick={() => setSelectedCandidateId(cand.id)}
                  className={`glass-panel p-3.5 h-100 d-flex flex-column border-2 cursor-pointer transition ${
                    selectedCandidateId === cand.id ? 'border-success' : 'border-secondary'
                  }`}
                  style={{ cursor: 'pointer', backgroundColor: selectedCandidateId === cand.id ? 'rgba(16,185,129,0.03)' : 'transparent' }}
                >
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <input 
                      type="radio" 
                      name="candidateSelect"
                      className="form-check-input"
                      checked={selectedCandidateId === cand.id}
                      onChange={() => setSelectedCandidateId(cand.id)}
                    />
                    <img 
                      src={`http://localhost:5000${cand.photo_path}`} 
                      alt="" 
                      className="rounded border border-secondary"
                      style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                    />
                    <div>
                      <h6 className="fw-bold m-0 text-white">{cand.full_name}</h6>
                      <span className="text-muted small">{cand.college_org}</span>
                    </div>
                  </div>
                  
                  {/* Manifesto download option */}
                  <div className="mt-auto d-flex justify-content-between align-items-center border-top border-secondary pt-3">
                    <span className="text-muted small">Read details:</span>
                    <a 
                      href={`http://localhost:5000${cand.manifesto_path}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-xs btn-outline-info text-decoration-none py-1 px-2.5"
                      style={{ fontSize: '0.75rem', borderRadius: '6px' }}
                      onClick={(e) => e.stopPropagation()} // Stop triggering candidate card selection
                    >
                      <i className="fa-solid fa-file-pdf me-1"></i> Read Manifesto
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={handleCastVoteClick} className="btn btn-success glow-btn py-2.5 px-4 fw-semibold">
            Cast Vote <i className="fa-solid fa-paper-plane ms-1.5"></i>
          </button>
        </div>
      )}

      {/* CONFIRMATION MODAL: Casting Vote */}
      {showConfirmModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-secondary text-white" style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '16px' }}>
              <div className="modal-body text-center p-4">
                <span className="fs-1 d-block mb-3">🗳️</span>
                <h4 className="fw-bold mb-3">Confirm Your Ballot</h4>
                <p className="text-muted small mb-4">
                  Are you sure you want to vote for <strong className="text-white">
                    {candidates.find(c => c.id === selectedCandidateId)?.full_name}
                  </strong>? <br />
                  <span className="text-danger">This action is permanent and cannot be modified or retrieved.</span>
                </p>
                
                <div className="d-flex gap-3">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary flex-grow-1" 
                    onClick={() => setShowConfirmModal(false)}
                  >
                    No, Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-success flex-grow-1" 
                    onClick={handleConfirmVoteSubmit}
                  >
                    Yes, Cast Vote
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESULTS MODAL: View Ended Results */}
      {showResultsModal && resultsData && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-secondary text-white" style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '16px' }}>
              <div className="modal-header border-secondary">
                <div>
                  <h5 className="modal-title fw-bold m-0">{resultsData.election.title}</h5>
                  <span className="text-muted small text-uppercase">Election Results ({resultsData.election.position})</span>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowResultsModal(false)}></button>
              </div>
              <div className="modal-body">
                
                <div className="d-flex flex-column gap-3">
                  {resultsData.candidates.map((cand, idx) => {
                    const percent = resultsData.totalVotesCast > 0 
                      ? ((cand.vote_count / resultsData.totalVotesCast) * 100).toFixed(1)
                      : 0;
                    const isWinner = idx === 0 && cand.vote_count > 0;
                    
                    return (
                      <div key={cand.id} className={`p-3 border rounded ${isWinner ? 'border-success bg-success bg-opacity-5' : 'border-secondary'}`}>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <span className="fw-bold text-muted" style={{ width: '20px' }}>#{idx+1}</span>
                            <img src={`http://localhost:5000${cand.photo_path}`} style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '50%' }} alt="" />
                            <div>
                              <span className="fw-semibold d-block text-white">
                                {cand.full_name} {isWinner && <span className="ms-1 text-success" title="Winner"><i className="fa-solid fa-crown"></i></span>}
                              </span>
                              <span className="text-muted" style={{ fontSize: '0.75rem' }}>{cand.college_org}</span>
                            </div>
                          </div>
                          <div className="text-end">
                            <span className="fw-bold text-warning d-block">{cand.vote_count} votes</span>
                            <span className="text-muted small">{percent}%</span>
                          </div>
                        </div>
                        <div className="progress bg-dark" style={{ height: '8px' }}>
                          <div className="progress-bar bg-success" style={{ width: `${percent}%` }} role="progressbar" aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-top border-secondary mt-4 pt-3 text-center text-muted small">
                  Total turnout: <strong>{resultsData.totalVotesCast} votes</strong> cast.
                </div>
              </div>
              <div className="modal-footer border-secondary">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowResultsModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoterDashboard;

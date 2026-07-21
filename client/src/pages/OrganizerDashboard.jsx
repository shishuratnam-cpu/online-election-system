import React, { useState, useEffect } from 'react';
import api from '../services/api';

const OrganizerDashboard = ({ selectTab = 'elections' }) => {
  const [activeTab, setActiveTab] = useState(selectTab);

  // States
  const [stats, setStats] = useState({});
  const [elections, setElections] = useState([]);
  const [approvedCandidates, setApprovedCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Create/Edit election form state
  const [showElectionModal, setShowElectionModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedElectionId, setSelectedElectionId] = useState(null);
  
  const [electionTitle, setElectionTitle] = useState('');
  const [electionDesc, setElectionDesc] = useState('');
  const [electionPosition, setElectionPosition] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedCandidates, setSelectedCandidates] = useState([]); // Array of candidate nomination IDs

  // Real-Time Progress State
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressData, setProgressData] = useState(null);
  const [progressPollInterval, setProgressPollInterval] = useState(null);

  useEffect(() => {
    setActiveTab(selectTab);
    setErrorMessage('');
    setSuccessMessage('');
  }, [selectTab]);

  useEffect(() => {
    fetchDashboardData();
    if (activeTab === 'candidates') {
      fetchCandidates();
    }
  }, [activeTab]);

  // Clean poll timer on unmount
  useEffect(() => {
    return () => {
      if (progressPollInterval) clearInterval(progressPollInterval);
    };
  }, [progressPollInterval]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/organizer/dashboard');
      setStats(res.data.stats);
      setElections(res.data.elections);
    } catch (err) {
      setErrorMessage('Failed to load organizer dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async (position = '') => {
    try {
      const res = await api.get(`/organizer/approved-candidates${position ? `?position=${encodeURIComponent(position)}` : ''}`);
      setApprovedCandidates(res.data.candidates);
    } catch (err) {
      setErrorMessage('Failed to retrieve approved candidates list.');
    }
  };

  // Pre-load candidates when position input changes in election form
  useEffect(() => {
    if (showElectionModal && electionPosition) {
      fetchCandidates(electionPosition);
    } else {
      setApprovedCandidates([]);
    }
  }, [showElectionModal, electionPosition]);

  const handleCreateOpen = () => {
    setModalMode('create');
    setSelectedElectionId(null);
    setElectionTitle('');
    setElectionDesc('');
    setElectionPosition('');
    setStartDate('');
    setEndDate('');
    setStartTime('08:00');
    setEndTime('17:00');
    setSelectedCandidates([]);
    setShowElectionModal(true);
  };

  const handleEditOpen = async (election) => {
    setModalMode('edit');
    setSelectedElectionId(election.id);
    
    // Fetch detail mapping
    try {
      const res = await api.get(`/organizer/elections/${election.id}`);
      const data = res.data.election;
      const associated = res.data.candidates;

      setElectionTitle(data.title);
      setElectionDesc(data.description);
      setElectionPosition(data.position);
      setStartDate(data.start_date.split('T')[0]);
      setEndDate(data.end_date.split('T')[0]);
      setStartTime(data.voting_start_time.substring(0, 5));
      setEndTime(data.voting_end_time.substring(0, 5));
      setSelectedCandidates(associated.map(c => c.id));
      setShowElectionModal(true);
    } catch (err) {
      setErrorMessage('Failed to load election details for editing.');
    }
  };

  const handleElectionSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (selectedCandidates.length === 0) {
      return setErrorMessage('Please select at least one approved candidate for this election.');
    }

    const payload = {
      title: electionTitle,
      description: electionDesc,
      position: electionPosition,
      startDate,
      endDate,
      votingStartTime: startTime,
      votingEndTime: endTime,
      candidateIds: selectedCandidates
    };
    console.log("Payload:", payload);

    try {
      if (modalMode === 'create') {
        await api.post('/organizer/elections', payload);
        setSuccessMessage('Election created successfully in Draft mode!');
      } else {
        await api.put(`/organizer/elections/${selectedElectionId}`, { ...payload, status: 'published' });
        setSuccessMessage('Election published/updated successfully!');
      }
      setShowElectionModal(false);
      fetchDashboardData();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Action failed.');
    }
  };

  const handlePublishDraft = async (election) => {
    try {
      // Fetch details and publish
      const res = await api.get(`/organizer/elections/${election.id}`);
      const payload = {
        title: res.data.election.title,
        description: res.data.election.description,
        position: res.data.election.position,
        startDate: res.data.election.start_date.split('T')[0],
        endDate: res.data.election.end_date.split('T')[0],
        votingStartTime: res.data.election.voting_start_time.substring(0, 5),
        votingEndTime: res.data.election.voting_end_time.substring(0, 5),
        candidateIds: res.data.candidates.map(c => c.id),
        status: 'published'
      };
      await api.put(`/organizer/elections/${election.id}`, payload);
      setSuccessMessage(`Election "${election.title}" has been published successfully!`);
      fetchDashboardData();
    } catch (err) {
      setErrorMessage('Failed to publish election draft.');
    }
  };

  const handleDeleteElection = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this election? All votes will be lost.')) return;
    try {
      await api.delete(`/organizer/elections/${id}`);
      setSuccessMessage('Election deleted successfully.');
      fetchDashboardData();
    } catch (err) {
      setErrorMessage('Failed to delete election.');
    }
  };

  const handleEndElection = async (id) => {
    if (!window.confirm('Are you sure you want to close this election immediately? This action is irreversible.')) return;
    try {
      await api.put(`/organizer/elections/${id}/end`);
      setSuccessMessage('Election has been closed.');
      fetchDashboardData();
    } catch (err) {
      setErrorMessage('Failed to end election.');
    }
  };

  // Real-Time Progress monitoring
  const handleProgressOpen = async (id) => {
    if (progressPollInterval) clearInterval(progressPollInterval);
    
    const fetchProgress = async () => {
      try {
        const res = await api.get(`/organizer/elections/${id}/progress`);
        setProgressData(res.data);
      } catch (err) {
        setErrorMessage('Failed to poll real-time voting data.');
      }
    };

    await fetchProgress(); // Initial load
    setShowProgressModal(true);

    // Setup active polling every 6 seconds
    const interval = setInterval(fetchProgress, 6000);
    setProgressPollInterval(interval);
  };

  const handleProgressClose = () => {
    if (progressPollInterval) {
      clearInterval(progressPollInterval);
      setProgressPollInterval(null);
    }
    setShowProgressModal(false);
    setProgressData(null);
  };

  const handleCandidateSelection = (id) => {
    setSelectedCandidates(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Organizer Panel</h2>
        {activeTab === 'elections' && (
          <button onClick={handleCreateOpen} className="btn btn-primary btn-sm">
            <i className="fa-solid fa-plus me-1.5"></i> Create Election
          </button>
        )}
      </div>

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
          <button onClick={() => setActiveTab('elections')} className={`nav-link fw-semibold ${activeTab === 'elections' ? 'active bg-dark text-white border-secondary' : 'text-muted'}`}>
            My Elections
          </button>
        </li>
        <li className="nav-item">
          <button onClick={() => setActiveTab('candidates')} className={`nav-link fw-semibold ${activeTab === 'candidates' ? 'active bg-dark text-white border-secondary' : 'text-muted'}`}>
            Approved Nominees
          </button>
        </li>
      </ul>

      {loading && (
        <div className="spinner-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {/* Tab: Elections list */}
      {activeTab === 'elections' && !loading && (
        <>
          {/* Stats Row */}
          <div className="row g-3 mb-4">
            <div className="col-6 col-lg-3">
              <div className="glass-panel p-3 bg-secondary bg-opacity-25 border border-secondary text-center">
                <span className="text-muted small">Total Created</span>
                <h3 className="fw-bold m-0">{stats.myElections}</h3>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className="glass-panel p-3 bg-success bg-opacity-25 border border-success text-center">
                <span className="text-muted small">Running Now</span>
                <h3 className="fw-bold m-0 text-success">{stats.runningElections}</h3>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className="glass-panel p-3 bg-primary bg-opacity-25 border border-primary text-center">
                <span className="text-muted small">Upcoming</span>
                <h3 className="fw-bold m-0 text-primary">{stats.upcomingElections}</h3>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className="glass-panel p-3 bg-dark bg-opacity-25 border border-dark text-center">
                <span className="text-muted small">Completed</span>
                <h3 className="fw-bold m-0 text-muted">{stats.completedElections}</h3>
              </div>
            </div>
          </div>

          {/* Elections Grid */}
          <div className="row g-4">
            {elections.map(election => (
              <div className="col-md-6 col-xl-4" key={election.id}>
                <div className={`glass-panel p-4 h-100 d-flex flex-column border-top border-4 ${
                  election.status === 'draft' ? 'border-secondary' :
                  election.status === 'ended' ? 'border-danger' : 'border-success'
                }`}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className={`badge ${
                      election.status === 'draft' ? 'bg-secondary' :
                      election.status === 'ended' ? 'bg-danger' : 'bg-success'
                    } text-uppercase`}>
                      {election.status}
                    </span>
                    <span className="text-muted small">ID: {election.id}</span>
                  </div>

                  <h4 className="fw-bold">{election.title}</h4>
                  <span className="badge bg-secondary align-self-start mb-3">{election.position}</span>
                  <p className="text-muted small flex-grow-1">{election.description}</p>
                  
<div className="small border-top pt-3 mb-4">

  <div className="d-flex justify-content-between align-items-center mb-2">
    <span style={{ color: "#374151", fontWeight: "600" }}>
      Start Date
    </span>

    <span style={{ color: "#111827", fontWeight: "700" }}>
      {election.start_date.split("T")[0]} ({election.voting_start_time.substring(0,5)})
    </span>
  </div>

  <div className="d-flex justify-content-between align-items-center mb-2">
    <span style={{ color: "#374151", fontWeight: "600" }}>
      End Date
    </span>

    <span style={{ color: "#111827", fontWeight: "700" }}>
      {election.end_date.split("T")[0]} ({election.voting_end_time.substring(0,5)})
    </span>
  </div>

  <div className="d-flex justify-content-between align-items-center">
    <span style={{ color: "#374151", fontWeight: "600" }}>
      Candidates
    </span>

    <span style={{ color: "#111827", fontWeight: "700" }}>
      {election.candidates_count}
    </span>
  </div>

</div>

                  <div className="d-flex flex-wrap gap-1.5">
                    {election.status === 'draft' && (
                      <>
                        <button onClick={() => handlePublishDraft(election)} className="btn btn-sm btn-outline-success flex-grow-1">
                          Publish
                        </button>
                        <button onClick={() => handleEditOpen(election)} className="btn btn-sm btn-outline-secondary">
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                      </>
                    )}

                    {election.status === 'published' && (
                      <>
                        <button onClick={() => handleProgressOpen(election.id)} className="btn btn-sm btn-outline-primary flex-grow-1">
                          <i className="fa-solid fa-chart-simple me-1"></i> Live Votes
                        </button>
                        <button onClick={() => handleEndElection(election.id)} className="btn btn-sm btn-outline-danger">
                          End Early
                        </button>
                      </>
                    )}

                    {election.status === 'ended' && (
                      <button onClick={() => handleProgressOpen(election.id)} className="btn btn-sm btn-outline-secondary flex-grow-1">
                        <i className="fa-solid fa-square-poll-vertical me-1"></i> Final Results
                      </button>
                    )}

                    <button onClick={() => handleDeleteElection(election.id)} className="btn btn-sm btn-outline-danger">
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Tab: Candidates */}
      {activeTab === 'candidates' && !loading && (
        <div className="glass-panel p-4">
          <h5 className="mb-4">All Approved Candidate Profiles</h5>
          <div className="row g-3">
            {approvedCandidates.map(cand => (
              <div className="col-md-6 col-lg-4" key={cand.id}>
                <div className="glass-panel p-3 d-flex align-items-center gap-3">
                  <img 
                    src={`http://localhost:5000${cand.photo_path}`} 
                    alt={cand.full_name} 
                    className="rounded-circle border border-secondary"
                    style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                  />
                  <div>
                    <h6 className="fw-bold m-0">{cand.full_name}</h6>
                    <span className="text-warning small text-uppercase">{cand.position}</span>
                    <div className="text-muted small">{cand.college_org}</div>
                  </div>
                </div>
              </div>
            ))}
            {approvedCandidates.length === 0 && <div className="text-center py-5 text-muted">No approved candidate records found.</div>}
          </div>
        </div>
      )}

      {/* MODAL: Create / Edit Election */}
      {showElectionModal && (
        <div
          className="modal show d-block"
          style={{
            backgroundColor: "rgba(0,0,0,0.7)",
            overflowY: "auto"
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div
              className="modal-content border-secondary text-white"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderRadius: "16px",
                maxHeight: "90vh",
                overflow: "hidden"
              }}
            >
              <div className="modal-header border-secondary">
                <h5 className="modal-title text-capitalize">{modalMode} Election Profile</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowElectionModal(false)}></button>
              </div>
              <form onSubmit={handleElectionSubmit}>
                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  <div className="mb-3">
                    <label className="form-label small text-muted">Election Title</label>
                    <input type="text" className="form-control custom-input" placeholder="e.g. Student Council Presidential Election 2026" value={electionTitle} onChange={(e) => setElectionTitle(e.target.value)} required />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label small text-muted">Description</label>
                    <textarea className="form-control custom-input" rows="2" placeholder="Summarize guidelines and qualifications..." value={electionDesc} onChange={(e) => setElectionDesc(e.target.value)} required></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-muted">Applying Target Position</label>
                    <input type="text" className="form-control custom-input" placeholder="e.g. President (Typing triggers candidate load)" value={electionPosition} onChange={(e) => setElectionPosition(e.target.value)} required />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label small text-muted">Start Date</label>
                      <input type="date" className="form-control custom-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label small text-muted">End Date</label>
                      <input type="date" className="form-control custom-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
                    </div>
                  </div>

                  <div className="row mb-4">
                    <div className="col-md-6 mb-3">
                      <label className="form-label small text-muted">Voting Start Time (HH:MM)</label>
                      <input type="time" className="form-control custom-input" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label small text-muted">Voting End Time (HH:MM)</label>
                      <input type="time" className="form-control custom-input" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                    </div>
                  </div>

                  <hr style={{ borderColor: 'var(--border-color)' }} />

                  {/* Pick Candidates Section */}
                  <h6 className="fw-semibold text-warning mb-3">
                    Select Participating Nominees (Position match: "{electionPosition || 'None'}"):
                  </h6>
                  <div className="row g-2.5" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {approvedCandidates.map(cand => (
                      <div className="col-md-6" key={cand.id}>
                        <div 
                          onClick={() => handleCandidateSelection(cand.id)}
                          className={`p-2 border rounded d-flex align-items-center gap-2.5 cursor-pointer transition ${
                            selectedCandidates.includes(cand.id) 
                              ? 'border-success bg-success bg-opacity-10 text-success' 
                              : 'border-secondary bg-dark bg-opacity-25'
                          }`}
                          style={{ cursor: 'pointer' }}
                        >
                          <input 
                            type="checkbox" 
                            className="form-check-input"
                            checked={selectedCandidates.includes(cand.id)}
                            onChange={() => {}} // Swallowed: Handled by parent div click
                          />
                          <img src={`http://localhost:5000${cand.photo_path}`} style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '50%' }} alt="" />
                          <div className="text-truncate">
                            <span className="small d-block fw-bold">{cand.full_name}</span>
                            <span className="text-muted" style={{ fontSize: '0.7rem' }}>{cand.college_org}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {approvedCandidates.length === 0 && (
                      <div className="col-12 text-center text-muted small py-3">
                        {electionPosition ? 'No approved candidates found for this position.' : 'Enter a position to search for candidates.'}
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowElectionModal(false)}>Close</button>
                  <button type="submit" className="btn btn-sm btn-success">
                    {modalMode === 'create' ? 'Create Draft' : 'Save & Publish'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MONITORING MODAL: Real-Time Vote Tracker */}
      {showProgressModal && progressData && (
        <div
  className="modal show d-block"
  style={{
    backgroundColor: "rgba(0,0,0,0.7)",
    overflowY: "auto"
  }}
>
  <div className="modal-dialog modal-lg modal-dialog-centered">
    <div
      className="modal-content border-secondary text-white"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderRadius: "16px",
        maxHeight: "90vh",
        overflow: "hidden"
      }}
    >
              <div className="modal-header border-secondary">
                <div>
                  <h5 className="modal-title fw-bold m-0">{progressData.election.title}</h5>
                  <span className="text-muted small text-uppercase">Tracking Live Votes ({progressData.election.position})</span>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={handleProgressClose}></button>
              </div>
              <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                
                {progressData.election.status === 'published' && (
                  <div className="alert alert-info py-2 d-flex align-items-center mb-4">
                    <span className="spinner-grow spinner-grow-sm me-2 text-info" role="status"></span>
                    <span className="small">Updating automatically in real-time. Turnout: <strong>{progressData.totalVotesCast} votes cast</strong></span>
                  </div>
                )}

                {progressData.election.status === 'ended' && (
                  <div className="alert alert-success py-2 mb-4">
                    <span className="small"><strong>Election Closed.</strong> Final results displayed below. Total votes cast: <strong>{progressData.totalVotesCast}</strong></span>
                  </div>
                )}

                <div className="d-flex flex-column gap-3.5">
                  {progressData.candidates.map((cand, idx) => {
                    const percent = progressData.totalVotesCast > 0 
                      ? ((cand.vote_count / progressData.totalVotesCast) * 100).toFixed(1)
                      : 0;
                    return (
                      <div key={cand.id} className="p-3 border border-secondary rounded" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <span className="fw-bold text-muted" style={{ width: '20px' }}>#{idx+1}</span>
                            <img src={`http://localhost:5000${cand.photo_path}`} style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '50%' }} alt="" />
                            <div>
                              <span className="fw-semibold d-block">{cand.full_name}</span>
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
                  {progressData.candidates.length === 0 && <div className="text-center py-4 text-muted">No candidates registered in this election.</div>}
                </div>
              </div>
              <div className="modal-footer border-secondary">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleProgressClose}>Close Monitor</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerDashboard;

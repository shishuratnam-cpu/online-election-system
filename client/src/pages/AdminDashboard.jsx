import React, { useState, useEffect } from 'react';
import api from '../services/api';

// Chart.js imports & registrations
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = ({ selectTab = 'overview' }) => {
  const [activeTab, setActiveTab] = useState(selectTab);

  // States
  const [stats, setStats] = useState({});
  const [recentLogs, setRecentLogs] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Organizers States
  const [organizers, setOrganizers] = useState([]);
  const [orgSearch, setOrgSearch] = useState('');
  const [orgPage, setOrgPage] = useState(1);
  const [orgTotalPages, setOrgTotalPages] = useState(1);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [newOrgUser, setNewOrgUser] = useState('');
  const [newOrgUnique, setNewOrgUnique] = useState('');
  const [newOrgPass, setNewOrgPass] = useState('');
  const [showResetPassModal, setShowResetPassModal] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [selectedOrgUser, setSelectedOrgUser] = useState('');
  const [resetPassVal, setResetPassVal] = useState('');

  // Nominations States
  const [nominations, setNominations] = useState([]);
  const [nomSearch, setNomSearch] = useState('');
  const [nomStatusFilter, setNomStatusFilter] = useState('all');
  const [nomPage, setNomPage] = useState(1);
  const [nomTotalPages, setNomTotalPages] = useState(1);
  const [selectedNomination, setSelectedNomination] = useState(null);

  // Voters States
  const [voters, setVoters] = useState([]);
  const [voterSearch, setVoterSearch] = useState('');
  const [voterPage, setVoterPage] = useState(1);
  const [voterTotalPages, setVoterTotalPages] = useState(1);
  const [showCreateVoterModal, setShowCreateVoterModal] = useState(false);

  const [newVoterUsername, setNewVoterUsername] = useState("");

  const [newVoterPassword, setNewVoterPassword] = useState("");
  // Audit Logs States
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [adminProfile, setAdminProfile] = useState({
    username: "",
    email: ""
  });

  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  // Sync tab state with props
  useEffect(() => {
    setActiveTab(selectTab);
    setErrorMessage('');
    setSuccessMessage('');
  }, [selectTab]);

  // Load basic dashboard stats & charts
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverviewData();
    } else if (activeTab === 'organizers') {
      fetchOrganizers();
    } else if (activeTab === 'nominations') {
      fetchNominations();
    } else if (activeTab === 'voters') {
      fetchVoters();
    } else if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab, orgPage, orgSearch, nomPage, nomSearch, nomStatusFilter, voterPage, voterSearch, auditPage]);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get('/admin/dashboard');
      setStats(statsRes.data.stats);
      setRecentLogs(statsRes.data.recentLogs);

      const chartRes = await api.get('/admin/charts');
      setChartData(chartRes.data);
    } catch (err) {
      setErrorMessage('Failed to fetch dashboard overview metrics.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/organizers?page=${orgPage}&search=${orgSearch}&limit=10`);
      setOrganizers(res.data.organizers);
      setOrgTotalPages(res.data.totalPages);
    } catch (err) {
      setErrorMessage('Failed to load organizers.');
    } finally {
      setLoading(false);
    }
  };

  const fetchNominations = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/nominations?page=${nomPage}&search=${nomSearch}&status=${nomStatusFilter}&limit=10`);
      setNominations(res.data.nominations);
      setNomTotalPages(res.data.totalPages);
    } catch (err) {
      setErrorMessage('Failed to load nominations.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVoters = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/voters?page=${voterPage}&search=${voterSearch}&limit=15`);
      setVoters(res.data.voters);
      setVoterTotalPages(res.data.totalPages);
    } catch (err) {
      setErrorMessage('Failed to load voters.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/audit?page=${auditPage}&limit=20`);
      setAuditLogs(res.data.logs);
      setAuditTotalPages(res.data.totalPages);
    } catch (err) {
      setErrorMessage('Failed to load system audit trails.');
    } finally {
      setLoading(false);
    }
  };

  // Organizers actions
  const handleCreateOrganizer = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      await api.post('/admin/organizers', {
        username: newOrgUser,
        uniqueNumber: newOrgUnique,
        password: newOrgPass
      });
      setSuccessMessage('Organizer created successfully!');
      setShowCreateOrgModal(false);
      setNewOrgUser('');
      setNewOrgUnique('');
      setNewOrgPass('');
      fetchOrganizers();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to create organizer.');
    }
  };

  const handleToggleOrganizer = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      await api.put(`/admin/organizers/${id}/status`, { status: nextStatus });
      setSuccessMessage(`Organizer is now ${nextStatus}.`);
      fetchOrganizers();
    } catch (err) {
      setErrorMessage('Failed to update organizer status.');
    }
  };

  const handleResetPassSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      await api.put(`/admin/organizers/${selectedOrgId}/password`, { newPassword: resetPassVal });
      setSuccessMessage(`Password updated for organizer: ${selectedOrgUser}`);
      setShowResetPassModal(false);
      setResetPassVal('');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  const handleDeleteOrganizer = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this organizer account?')) return;
    try {
      await api.delete(`/admin/organizers/${id}`);
      setSuccessMessage('Organizer deleted successfully.');
      fetchOrganizers();
    } catch (err) {
      setErrorMessage('Failed to delete organizer account.');
    }
  };

  // Nomination decisions
  const handleNominationStatus = async (id, nextStatus) => {
    try {
      await api.put(`/admin/nominations/${id}/status`, { status: nextStatus });
      setSuccessMessage(`Nomination has been ${nextStatus}.`);
      setSelectedNomination(null);
      fetchNominations();
    } catch (err) {
      setErrorMessage('Failed to update nomination status.');
    }
  };
  const handleDeleteNomination = async (id) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to permanently delete this nomination?"
  );

  if (!confirmDelete) return;

  try {
    await api.delete(`/admin/nominations/${id}`);

    setSuccessMessage("Nomination deleted successfully.");

    setSelectedNomination(null);

    fetchNominations();

  } catch (err) {
    setErrorMessage(
      err.response?.data?.message || "Failed to delete nomination."
    );
  }
};

  // Voters toggling
  const handleToggleVoter = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      await api.put(`/admin/voters/${id}/status`, { status: nextStatus });
      setSuccessMessage(`Voter account is now ${nextStatus}.`);
      fetchVoters();
    } catch (err) {
      setErrorMessage('Failed to update voter account.');
    }
  };
const handleDeleteVoter = async (id) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this voter?"
  );

  if (!confirmDelete) return;

  try {
    await api.delete(`/admin/voters/${id}`);

    setSuccessMessage("Voter deleted successfully.");

    fetchVoters();
  } catch (err) {
    setErrorMessage(
      err.response?.data?.message || "Failed to delete voter."
    );
  }
};

// Create Voter
const handleCreateVoter = async (e) => {
  e.preventDefault();

  try {
    console.log({
    voter_id: newVoterUsername,
    password: newVoterPassword
});
console.log("Sending:", {
    voter_id: newVoterUsername,
    password: newVoterPassword
});
    await api.post('/admin/voters', {
      voter_id: newVoterUsername,
      password: newVoterPassword
    });

    setSuccessMessage('Voter created successfully.');

    setShowCreateVoterModal(false);

    setNewVoterUsername('');
    setNewVoterPassword('');

    fetchVoters();

  } catch (err) {
    setErrorMessage(
      err.response?.data?.message || 'Failed to create voter.'
    );
  }
};
  // CSV Export Trigger
  const handleExportCSV = async (type) => {
  try {
    const token = localStorage.getItem("token"); // <-- check this name

    if (!token) {
      alert("Login token not found.");
      return;
    }

    const response = await fetch(
      `http://localhost:5000/api/admin/export?type=${type}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      alert(error);
      return;
    }

    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}.csv`;

    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);

  } catch (err) {
    console.error(err);
    alert("Export failed.");
  }
};

  const handleAdminProfileUpdate = async () => {
    try {
      const res = await api.put("/admin/profile", {
        username: newUsername,
        email: newEmail,
        currentPassword,
        newPassword
      });

      alert(res.data.message);

      setCurrentPassword("");
      setNewPassword("");

    } catch (err) {
      alert(err.response?.data?.message || "Failed to update profile");
    }
  };
  // Format Helper
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="animate-fade-in">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Admin Workspace</h2>
        <div className="d-flex gap-2">
          <button onClick={() => handleExportCSV('results')} className="btn btn-sm btn-outline-success">
            <i className="fa-solid fa-file-excel me-1.5"></i> Export Results CSV
          </button>
          <button onClick={() => handleExportCSV('audit')} className="btn btn-sm btn-outline-secondary">
            <i className="fa-solid fa-clock-rotate-left me-1.5"></i> Export Audit Logs
          </button>
        </div>
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
          <button onClick={() => setActiveTab('overview')} className={`nav-link text-capitalize fw-semibold ${activeTab === 'overview' ? 'active bg-dark text-white border-secondary' : 'text-muted'}`}>
            Overview
          </button>
        </li>
        <li className="nav-item">
          <button onClick={() => setActiveTab('organizers')} className={`nav-link text-capitalize fw-semibold ${activeTab === 'organizers' ? 'active bg-dark text-white border-secondary' : 'text-muted'}`}>
            Organizers
          </button>
        </li>
        <li className="nav-item">
          <button onClick={() => setActiveTab('nominations')} className={`nav-link text-capitalize fw-semibold ${activeTab === 'nominations' ? 'active bg-dark text-white border-secondary' : 'text-muted'}`}>
            Nominations {stats.pendingNominations > 0 && <span className="badge bg-danger ms-1">{stats.pendingNominations}</span>}
          </button>
        </li>
        <li className="nav-item">
          <button onClick={() => setActiveTab('voters')} className={`nav-link text-capitalize fw-semibold ${activeTab === 'voters' ? 'active bg-dark text-white border-secondary' : 'text-muted'}`}>
            Voters
          </button>
        </li>
        <li className="nav-item">
          <button onClick={() => setActiveTab('audit')} className={`nav-link text-capitalize fw-semibold ${activeTab === 'audit' ? 'active bg-dark text-white border-secondary' : 'text-muted'}`}>
            Audit Logs
          </button>
        </li>
        <li className="nav-item">
          <button
            onClick={() => setActiveTab('profile')}
            className={`nav-link text-capitalize fw-semibold ${activeTab === 'profile'
              ? 'active bg-dark text-white border-secondary'
              : 'text-muted'
            }`}
          >
            Profile
          </button>
        </li>
      </ul>

      {/* Loading state */}
      {loading && activeTab !== 'overview' && (
        <div className="spinner-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {/* Tab: Overview */}
      {activeTab === 'overview' && !loading && (
        <>
          {/* Stats grid */}
          <div className="row g-3 mb-4">
            <div className="col-6 col-lg-3">
              <div className="glass-panel stat-card text-white bg-primary bg-opacity-25 border border-primary">
                <div>
                  <h6 className="text-uppercase text-muted small mb-1">Elections</h6>
                  <h3 className="fw-bold m-0">{stats.totalElections}</h3>
                </div>
                <div className="stat-icon bg-primary text-white"><i className="fa-solid fa-check-to-slot"></i></div>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className="glass-panel stat-card text-white bg-warning bg-opacity-25 border border-warning">
                <div>
                  <h6 className="text-uppercase text-muted small mb-1">Pending Nominations</h6>
                  <h3 className="fw-bold m-0">{stats.pendingNominations}</h3>
                </div>
                <div className="stat-icon bg-warning text-dark"><i className="fa-solid fa-file-pen"></i></div>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className="glass-panel stat-card text-white bg-success bg-opacity-25 border border-success">
                <div>
                  <h6 className="text-uppercase text-muted small mb-1">Approved Candidates</h6>
                  <h3 className="fw-bold m-0">{stats.approvedCandidates}</h3>
                </div>
                <div className="stat-icon bg-success text-white"><i className="fa-solid fa-user-check"></i></div>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className="glass-panel stat-card text-white bg-info bg-opacity-25 border border-info">
                <div>
                  <h6 className="text-uppercase text-muted small mb-1">Voters registered</h6>
                  <h3 className="fw-bold m-0">{stats.totalVoters}</h3>
                </div>
                <div className="stat-icon bg-info text-white"><i className="fa-solid fa-users"></i></div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          {chartData && (
            <div className="row g-4 mb-4">
              <div className="col-md-6 col-lg-4">
                <div className="glass-panel p-4 h-100">
                  <h5 className="mb-4">Votes per Election</h5>
                  <div style={{ height: '240px' }}>
                    <Bar
                      data={{
                        labels: chartData.votesPerElection.map(v => v.title),
                        datasets: [{
                          label: 'Votes Cast',
                          data: chartData.votesPerElection.map(v => v.votes_count),
                          backgroundColor: '#6366f1',
                          borderRadius: 6
                        }]
                      }}
                      options={{ responsive: true, maintainAspectRatio: false }}
                    />
                  </div>
                </div>
              </div>

              <div className="col-md-6 col-lg-4">
                <div className="glass-panel p-4 h-100">
                  <h5 className="mb-4">Candidates by Position</h5>
                  <div style={{ height: '240px' }}>
                    <Doughnut
                      data={{
                        labels: chartData.candidateDistribution.map(c => c.position),
                        datasets: [{
                          data: chartData.candidateDistribution.map(c => c.count),
                          backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'],
                          borderColor: 'transparent'
                        }]
                      }}
                      options={{ responsive: true, maintainAspectRatio: false }}
                    />
                  </div>
                </div>
              </div>

              <div className="col-12 col-lg-4">
                <div className="glass-panel p-4 h-100">
                  <h5 className="mb-4">Daily Registrations</h5>
                  <div style={{ height: '240px' }}>
                    <Line
                      data={{
                        labels: chartData.dailyRegistrations.map(r => new Date(r.reg_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})),
                        datasets: [{
                          label: 'Voters Registered',
                          data: chartData.dailyRegistrations.map(r => r.count),
                          borderColor: '#10b981',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          fill: true,
                          tension: 0.3
                        }]
                      }}
                      options={{ responsive: true, maintainAspectRatio: false }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity logs */}
          <div className="glass-panel p-4">
            <h5 className="mb-3">Recent System Activity Logs</h5>
            <div className="table-responsive">
              <table className="table custom-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Role</th>
                    <th>Action</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="small">{formatDate(log.created_at)}</td>
                      <td className="fw-semibold">{log.user_name}</td>
                      <td><span className="badge bg-secondary text-uppercase">{log.user_role}</span></td>
                      <td><code>{log.action}</code></td>
                      <td className="small">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Tab: Organizers */}
      {activeTab === 'organizers' && !loading && (
        <div className="glass-panel p-4">
          <div className="d-flex flex-wrap justify-content-between gap-3 mb-4">
            <div className="d-flex gap-2">
              <input 
                type="text" 
                className="form-control custom-input py-1.5" 
                placeholder="Search organizers..." 
                value={orgSearch}
                onChange={(e) => { setOrgSearch(e.target.value); setOrgPage(1); }}
                style={{ width: '240px' }}
              />
            </div>
            <button onClick={() => setShowCreateOrgModal(true)} className="btn btn-primary btn-sm">
              <i className="fa-solid fa-plus me-1.5"></i> Create Organizer
            </button>
          </div>

          <div className="table-responsive">
            <table className="table custom-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Unique Number</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {organizers.map(org => (
                  <tr key={org.id}>
                    <td className="fw-semibold">{org.username}</td>
                    <td><code>{org.unique_number}</code></td>
                    <td>
                      <span className={`badge ${org.status === 'active' ? 'bg-success' : 'bg-danger'}`}>
                        {org.status}
                      </span>
                    </td>
                    <td className="small">{formatDate(org.created_at)}</td>
                    <td>
                      <div className="d-flex gap-1.5">
                        <button 
                          onClick={() => { setSelectedOrgId(org.id); setSelectedOrgUser(org.username); setShowResetPassModal(true); }}
                          className="btn btn-sm btn-outline-warning"
                          title="Reset Password"
                        >
                          <i className="fa-solid fa-key"></i>
                        </button>
                        <button 
                          onClick={() => handleToggleOrganizer(org.id, org.status)}
                          className={`btn btn-sm ${org.status === 'active' ? 'btn-outline-danger' : 'btn-outline-success'}`}
                          title={org.status === 'active' ? 'Disable Organizer' : 'Enable Organizer'}
                        >
                          <i className={`fa-solid ${org.status === 'active' ? 'fa-user-slash' : 'fa-user-check'}`}></i>
                        </button>
                        <button
  onClick={() => handleDeleteOrganizer(org.id)}
  className="btn btn-danger btn-sm"
>
  DELETE
</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {orgTotalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <button disabled={orgPage === 1} onClick={() => setOrgPage(p => p - 1)} className="btn btn-sm btn-outline-secondary me-2">Prev</button>
              <span className="align-self-center">Page {orgPage} of {orgTotalPages}</span>
              <button disabled={orgPage === orgTotalPages} onClick={() => setOrgPage(p => p + 1)} className="btn btn-sm btn-outline-secondary ms-2">Next</button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Nominations */}
      {activeTab === 'nominations' && !loading && (
        <div className="glass-panel p-4">
          <div className="d-flex flex-wrap justify-content-between gap-3 mb-4">
            <div className="d-flex gap-2">
              <input 
                type="text" 
                className="form-control custom-input py-1.5" 
                placeholder="Search candidates..." 
                value={nomSearch}
                onChange={(e) => { setNomSearch(e.target.value); setNomPage(1); }}
                style={{ width: '240px' }}
              />
              <select 
                className="form-select custom-input py-1.5" 
                value={nomStatusFilter}
                onChange={(e) => { setNomStatusFilter(e.target.value); setNomPage(1); }}
                style={{ width: '160px' }}
              >
                <option value="all">All Nominations</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table custom-table">
              <thead>
                <tr>
                  <th>Nominee Name</th>
                  <th>Position</th>
                  <th>College/Org</th>
                  <th>Status</th>
                  <th>Submitted At</th>
                  <th>Actions</th>
                  {/* <th>Review</th> */}
                </tr>
              </thead>
              <tbody>
                {nominations.map(nom => (
                  <tr key={nom.id}>
                    <td className="fw-semibold">{nom.full_name}</td>
                    <td>{nom.position}</td>
                    <td>{nom.college_org}</td>
                    <td>
                      <span className={`badge ${nom.status === 'approved' ? 'bg-success' : nom.status === 'rejected' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                        {nom.status}
                      </span>
                    </td>
                    <td className="small">{formatDate(nom.created_at)}</td>
                    <td>
                      <div className="d-flex gap-2">

                        <button onClick={() => setSelectedNomination(nom)} className="btn btn-sm btn-outline-primary"> Review Details </button>
                        <button onClick={() => handleDeleteNomination(nom.id)} className="btn btn-sm btn-outline-danger" title="Delete Nomination" >
                          <i className="fa-solid fa-trash"></i>
                        </button>

                      </div>
                    
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {nomTotalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <button disabled={nomPage === 1} onClick={() => setNomPage(p => p - 1)} className="btn btn-sm btn-outline-secondary me-2">Prev</button>
              <span className="align-self-center">Page {nomPage} of {nomTotalPages}</span>
              <button disabled={nomPage === nomTotalPages} onClick={() => setNomPage(p => p + 1)} className="btn btn-sm btn-outline-secondary ms-2">Next</button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Voters */}
      {activeTab === 'voters' && !loading && (
        <div className="glass-panel p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">

            <input
              type="text"
              className="form-control custom-input py-1.5"
              placeholder="Search voters..."
              value={voterSearch}
              onChange={(e) => {
                setVoterSearch(e.target.value);
                setVoterPage(1);
              }}
              style={{ width: '320px' }}
            />

            <button
              className="btn btn-primary"
              onClick={() => setShowCreateVoterModal(true)}
            >
              <i className="fa-solid fa-user-plus me-2"></i>
              Create Voter
            </button>

          </div>

          <div className="table-responsive">
            <table className="table custom-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Status</th>
                  <th>Registered At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {voters.map(v => (
                  <tr key={v.id}>
                    <td className="fw-semibold">{v.voter_id}</td>

                    <td>
                      <span className={`badge ${v.status === 'active' ? 'bg-success' : 'bg-danger'}`}>
                        {v.status}
                      </span>
                    </td>

                    <td className="small">{formatDate(v.created_at)}</td>

                    <td>
  <div className="d-flex gap-2">

    <button
      onClick={() => handleToggleVoter(v.id, v.status)}
      className={`btn btn-sm ${
        v.status === "active"
          ? "btn-outline-warning"
          : "btn-outline-success"
      }`}
    >
      {v.status === "active"
        ? "Disable"
        : "Enable"}
    </button>

    <button
      onClick={() => handleDeleteVoter(v.id)}
      className="btn btn-sm btn-outline-danger"
      title="Delete Voter"
    >
      <i className="fa-solid fa-trash"></i>
    </button>

  </div>
</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {voterTotalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <button disabled={voterPage === 1} onClick={() => setVoterPage(p => p - 1)} className="btn btn-sm btn-outline-secondary me-2">Prev</button>
              <span className="align-self-center">Page {voterPage} of {voterTotalPages}</span>
              <button disabled={voterPage === voterTotalPages} onClick={() => setVoterPage(p => p + 1)} className="btn btn-sm btn-outline-secondary ms-2">Next</button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Audit Logs */}
      {activeTab === 'audit' && !loading && (
        <div className="glass-panel p-4">
          <div className="table-responsive">
            <table className="table custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor Name</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Description</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id}>
                    <td className="small">{formatDate(log.created_at)}</td>
                    <td className="fw-semibold">{log.user_name}</td>
                    <td><span className="badge bg-secondary text-uppercase">{log.user_role}</span></td>
                    <td><code>{log.action}</code></td>
                    <td className="small">{log.details}</td>
                    <td className="small text-muted">{log.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {auditTotalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <button disabled={auditPage === 1} onClick={() => setAuditPage(p => p - 1)} className="btn btn-sm btn-outline-secondary me-2">Prev</button>
              <span className="align-self-center">Page {auditPage} of {auditTotalPages}</span>
              <button disabled={auditPage === auditTotalPages} onClick={() => setAuditPage(p => p + 1)} className="btn btn-sm btn-outline-secondary ms-2">Next</button>
            </div>
          )}
        </div>
      )}
      {/* Tab: Profile */}
      {activeTab === 'profile' && (
        <div className="glass-panel p-4">

          <h3 className="mb-4">Admin Profile</h3>

          <div className="mb-3">
            <label>Username</label>
            <input
              type="text"
              className="form-control"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label>Email</label>
            <input
              type="email"
              className="form-control"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label>Current Password</label>
            <input
              type="password"
              className="form-control"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label>New Password</label>
            <input
              type="password"
              className="form-control"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleAdminProfileUpdate}
          >
            Update Profile
          </button>

        </div>
      )}
      {/* MODAL: Create Organizer */}
      {showCreateOrgModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-secondary text-white" style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '16px' }}>
              <div className="modal-header border-secondary">
                <h5 className="modal-title">Create Organizer Credentials</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCreateOrgModal(false)}></button>
              </div>
              <form onSubmit={handleCreateOrganizer}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small text-muted">Username</label>
                    <input type="text" className="form-control custom-input" placeholder="e.g. jdoe" value={newOrgUser} onChange={(e) => setNewOrgUser(e.target.value)} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted">Unique ID Number (Alphanumeric)</label>
                    <input type="text" className="form-control custom-input" placeholder="e.g. 1005247290AB" value={newOrgUnique} onChange={(e) => setNewOrgUnique(e.target.value)} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted">Password</label>
                    <input type="password" className="form-control custom-input" placeholder="Minimum 6 characters" value={newOrgPass} onChange={(e) => setNewOrgPass(e.target.value)} required />
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowCreateOrgModal(false)}>Close</button>
                  <button type="submit" className="btn btn-sm btn-primary">Create Account</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Reset Organizer Password */}
      {showResetPassModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-secondary text-white" style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '16px' }}>
              <div className="modal-header border-secondary">
                <h5 className="modal-title">Reset Password: {selectedOrgUser}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowResetPassModal(false)}></button>
              </div>
              <form onSubmit={handleResetPassSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small text-muted">New Organizer Password</label>
                    <input type="password" className="form-control custom-input" placeholder="••••••••" value={resetPassVal} onChange={(e) => setResetPassVal(e.target.value)} required />
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowResetPassModal(false)}>Close</button>
                  <button type="submit" className="btn btn-sm btn-warning">Reset Password</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: Create Voter */}
{showCreateVoterModal && (
  <div
    className="modal show d-block"
    style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
  >
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content border-secondary text-white"
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderRadius: "16px"
        }}
      >
        <div className="modal-header border-secondary">
          <h5 className="modal-title">Create Voter Account</h5>

          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={() => setShowCreateVoterModal(false)}
          ></button>
        </div>

        <form onSubmit={handleCreateVoter}>
          <div className="modal-body">

            <div className="mb-3">
              <label className="form-label text-white">
                Username
              </label>

              <input
                type="text"
                className="form-control custom-input"
                placeholder="Enter username"
                value={newVoterUsername}
                onChange={(e) =>
                  setNewVoterUsername(e.target.value)
                }
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label text-white">
                Password
              </label>

              <input
              
                type="password"
                className="form-control custom-input"
                placeholder="Enter password"
                value={newVoterPassword}
                onChange={(e) =>
                  setNewVoterPassword(e.target.value)
                }
                required
              />
            </div>

          </div>

          <div className="modal-footer border-secondary">

            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowCreateVoterModal(false)}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
            >
              Create Voter
            </button>

          </div>
        </form>

      </div>
    </div>
  </div>
)}
      {/* DETAIL MODAL: Review Nomination */}
      {selectedNomination && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-secondary text-white" style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '16px' }}>
              <div className="modal-header border-secondary">
                <h5 className="modal-title">Review Nomination Details</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedNomination(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-4">
                  <div className="col-md-4 text-center">
                    <img 
                      src={`http://localhost:5000${selectedNomination.photo_path}`} 
                      alt="Nominee Portrait" 
                      className="img-fluid rounded mb-3 border border-secondary"
                      style={{ maxHeight: '200px', objectFit: 'cover', width: '100%' }}
                    />
                    <span className={`badge ${selectedNomination.status === 'approved' ? 'bg-success' : selectedNomination.status === 'rejected' ? 'bg-danger' : 'bg-warning text-dark'} text-uppercase w-100 py-2`}>
                      Status: {selectedNomination.status}
                    </span>
                  </div>
                  
                  <div className="col-md-8">
                    <table className="table table-borderless custom-table m-0">
                      <tbody>
                        <tr>
                          <td className="fw-bold p-1 text-white" style={{ width: '150px' }}>Nominee Name:</td>
                          <td className="p-1">{selectedNomination.full_name}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold p-1 text-white">Email Address:</td>
                          <td className="p-1">{selectedNomination.email}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold p-1 text-white">Mobile Number:</td>
                          <td className="p-1">{selectedNomination.mobile}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold p-1 text-white">Date of Birth:</td>
                          <td className="p-1">{selectedNomination.dob}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold p-1 text-white">Applying Position:</td>
                          <td className="p-1 fw-semibold text-warning">{selectedNomination.position}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold p-1 text-white">Organization:</td>
                          <td className="p-1">{selectedNomination.college_org}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold p-1 text-white">Address:</td>
                          <td className="p-1">{selectedNomination.address}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <hr style={{ borderColor: 'var(--border-color)' }} />
                
                <h6 className="fw-bold text-white mb-2">Submitted Attachments:</h6>
                <div className="d-flex flex-wrap gap-2.5">
                  <a 
                    href={`http://localhost:5000${selectedNomination.id_path}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-sm btn-outline-info"
                  >
                    <i className="fa-solid fa-address-card me-1.5"></i> View Government ID Document
                  </a>
                  <a 
                    href={`http://localhost:5000${selectedNomination.manifesto_path}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-sm btn-outline-info"
                  >
                    <i className="fa-solid fa-file-lines me-1.5"></i> Read Candidate Manifesto
                  </a>
                </div>
              </div>
              <div className="modal-footer border-secondary">
                <button type="button" className="btn btn-sm btn-outline-secondary me-auto" onClick={() => setSelectedNomination(null)}>Close</button>
                {selectedNomination.status === 'pending' && (
                  <>
                    <button onClick={() => handleNominationStatus(selectedNomination.id, 'rejected')} className="btn btn-sm btn-danger">
                      Reject Nomination
                    </button>
                    <button onClick={() => handleNominationStatus(selectedNomination.id, 'approved')} className="btn btn-sm btn-success">
                      Approve Candidate
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

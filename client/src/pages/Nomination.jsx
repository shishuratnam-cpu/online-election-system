import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Nomination = () => {
  const navigate = useNavigate();

  // Field states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [collegeOrg, setCollegeOrg] = useState('');
  const [position, setPosition] = useState('');
  const [dob, setDob] = useState('');
  const [declarationChecked, setDeclarationChecked] = useState(false);

  // File states
  const [photo, setPhoto] = useState(null);
  const [govtId, setGovtId] = useState(null);
  const [manifesto, setManifesto] = useState(null);

  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleFileChange = (e, setter) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!declarationChecked) {
      return setErrorMessage('You must review and agree to the declaration statement.');
    }

    if (!photo || !govtId || !manifesto) {
      return setErrorMessage('Please upload all required files (Photo, ID and Manifesto document).');
    }

    setIsLoading(true);

    // Build multi-part form data payload
    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('email', email);
    formData.append('mobile', mobile);
    formData.append('address', address);
    formData.append('collegeOrg', collegeOrg);
    formData.append('position', position);
    formData.append('dob', dob);
    formData.append('declarationChecked', declarationChecked);
    
    // Attach files
    formData.append('photo', photo);
    formData.append('govtId', govtId);
    formData.append('manifesto', manifesto);

    try {
      const res = await api.post('/candidate/nominate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccessMessage(res.data.message || 'Your nomination has been submitted successfully!');
      
      // Clean form fields
      setFullName('');
      setEmail('');
      setMobile('');
      setAddress('');
      setCollegeOrg('');
      setPosition('');
      setDob('');
      setDeclarationChecked(false);
      setPhoto(null);
      setGovtId(null);
      setManifesto(null);
      
      // Reset file input elements manually
      document.querySelectorAll('input[type="file"]').forEach(input => input.value = '');

    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to submit nomination. Check file sizes and extensions.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-5 animate-fade-in">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="glass-panel p-4 p-sm-5 border-top border-4" style={{ borderTopColor: 'var(--accent-color) !important' }}>
            
            <div className="text-center mb-5">
              <span className="fs-1">📝</span>
              <h2 className="mt-2 fw-bold">Candidate Nomination Form</h2>
              <p className="text-muted">Submit your application to participate as a candidate in upcoming elections.</p>
            </div>

            {errorMessage && <div className="alert alert-danger px-3 py-2" role="alert">{errorMessage}</div>}
            {successMessage && <div className="alert alert-success px-3 py-2" role="alert">{successMessage}</div>}

            <form onSubmit={handleSubmit}>
              <h5 className="mb-3 text-uppercase fw-semibold" style={{ color: 'var(--accent-color)', fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                1. Personal Details
              </h5>
              
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label small text-muted">Full Name</label>
                  <input 
                    type="text" 
                    className="form-control custom-input" 
                    placeholder="As shown on official ID"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required 
                  />
                </div>
                
                <div className="col-md-6 mb-3">
                  <label className="form-label small text-muted">Email Address</label>
                  <input 
                    type="email" 
                    className="form-control custom-input" 
                    placeholder="For nomination updates"
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

              <div className="mb-4">
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

              <hr style={{ borderColor: 'var(--border-color)', margin: '2rem 0' }} />

              <h5 className="mb-3 text-uppercase fw-semibold" style={{ color: 'var(--accent-color)', fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                2. Academic / Professional Details
              </h5>

              <div className="row mb-4">
                <div className="col-md-6 mb-3">
                  <label className="form-label small text-muted">College / Organization Name</label>
                  <input 
                    type="text" 
                    className="form-control custom-input" 
                    placeholder="e.g. School of Computer Science"
                    value={collegeOrg}
                    onChange={(e) => setCollegeOrg(e.target.value)}
                    required 
                  />
                </div>
                
                <div className="col-md-6 mb-3">
                  <label className="form-label small text-muted">Position Applying For</label>
                  <input 
                    type="text" 
                    className="form-control custom-input" 
                    placeholder="e.g. President, Representative"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <hr style={{ borderColor: 'var(--border-color)', margin: '2rem 0' }} />

              <h5 className="mb-3 text-uppercase fw-semibold" style={{ color: 'var(--accent-color)', fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                3. Required Attachments (Max 5MB each)
              </h5>

              <div className="row mb-4">
                <div className="col-md-4 mb-3">
                  <label className="form-label small text-muted">
                      Profile Photo (JPG/PNG)
                  </label>

                  <small className="text-muted d-block mb-2">
                      Maximum file size: <strong>5 MB</strong>
                  </small>
                  <input 
                    type="file" 
                    accept=".jpg,.jpeg,.png"
                    className="form-control custom-input"
                    onChange={(e) => handleFileChange(e, setPhoto)}
                    required 
                  />
                  {photo && (
                      <small className="text-success d-block mt-1">
                          📄 {photo.name} (
                          {photo.size > 1024 * 1024
                              ? `${(photo.size / (1024 * 1024)).toFixed(2)} MB`
                              : `${(photo.size / 1024).toFixed(2)} KB`}
                          )
                      </small>
                  )}
                </div>
                
                <div className="col-md-4 mb-3">
                  <label className="form-label small text-muted">
                      Govt Issued ID Card (PDF/Image)
                  </label>

                  <small className="text-muted d-block mb-2">
                      Maximum file size: <strong>5 MB</strong>
                  </small>
                  <input 
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="form-control custom-input"
                    onChange={(e) => handleFileChange(e, setGovtId)}
                    required 
                  />
                  {govtId && (
                      <small className="text-success d-block mt-1">
                          📄 {govtId.name} (
                          {govtId.size > 1024 * 1024
                              ? `${(govtId.size / (1024 * 1024)).toFixed(2)} MB`
                              : `${(govtId.size / 1024).toFixed(2)} KB`}
                          )
                      </small>
                  )}
                </div>

                <div className="col-md-4 mb-3">
                  <label className="form-label small text-muted">
                      Manifesto Document (PDF/TXT/DOCX)
                  </label>

                  <small className="text-muted d-block mb-2">
                      Maximum file size: <strong>5 MB</strong>
                      </small>
                  <input 
                    type="file" 
                    accept=".pdf,.txt,.docx"
                    className="form-control custom-input"
                    onChange={(e) => handleFileChange(e, setManifesto)}
                    required 
                  />
                  {manifesto && (
                      <small className="text-success d-block mt-1">
                          📄 {manifesto.name} (
                          {manifesto.size > 1024 * 1024
                              ? `${(manifesto.size / (1024 * 1024)).toFixed(2)} MB`
                              : `${(manifesto.size / 1024).toFixed(2)} KB`}
                          )
                      </small>
                  )}
                </div>
              </div>

              <hr style={{ borderColor: 'var(--border-color)', margin: '2rem 0' }} />

              <div className="form-check mb-4">
                <input 
                  type="checkbox" 
                  className="form-check-input" 
                  id="declarationCheck" 
                  checked={declarationChecked}
                  onChange={(e) => setDeclarationChecked(e.target.checked)}
                  required
                />
                <label className="form-check-label small text-muted" htmlFor="declarationCheck">
                  I hereby declare that the information provided above is true and accurate. I understand that submitting false credentials will lead to immediate disqualification and possible system restrictions.
                </label>
              </div>

              <div className="d-flex gap-3">
                <Link to="/" className="btn btn-outline-secondary px-4 py-2 fw-semibold" style={{ borderRadius: '10px' }}>
                  Cancel
                </Link>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="btn glow-btn flex-grow-1 py-2 fw-semibold"
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Uploading Documents...
                    </>
                  ) : (
                    <>Submit Nomination Application <i className="fa-solid fa-paper-plane ms-2"></i></>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Nomination;

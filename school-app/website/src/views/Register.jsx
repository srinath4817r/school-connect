import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { GraduationCap, School, CheckCircle, Search, UserCheck } from 'lucide-react';
import './Auth.css';

const API_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Register = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Verification & step states
  const [codeVerified, setCodeVerified] = useState(false);
  const [codeConfirmed, setCodeConfirmed] = useState(false);
  const [detectedRole, setDetectedRole] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [formStep, setFormStep] = useState(1);

  // Lock states for temp codes
  const [isTempLocked, setIsTempLocked] = useState(false);
  const [preFilledSchoolName, setPreFilledSchoolName] = useState('');

  // Form states - Step 1 Basic Details
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    secretCode: '',
    schoolId: '',
    schoolName: '',
    schoolAddress: '',
    schoolPhone: '',
    preRegisteredStudentId: ''
  });

  // Role-specific states: Teacher
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [otherSubjectText, setOtherSubjectText] = useState('');
  const [classesTeaching, setClassesTeaching] = useState([]);
  const [primaryClass, setPrimaryClass] = useState('');
  const [primarySection, setPrimarySection] = useState('');

  // Role-specific states: Driver
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [driverPhone, setDriverPhone] = useState('');

  // Role-specific states: Parent
  const [parentDetails, setParentDetails] = useState({
    fatherName: '',
    motherName: '',
    fatherPhone: '',
    motherPhone: '',
    relationship: 'Father',
    emergencyContact: '',
    homeAddress: ''
  });
  const [parentChildOption, setParentChildOption] = useState('option_a'); // 'option_a' or 'option_b'
  const [manualChildDetails, setManualChildDetails] = useState({
    fullName: '',
    className: 'Class 8',
    section: 'A',
    rollNumber: '',
    dateOfBirth: ''
  });

  const [schools, setSchools] = useState([]);
  const [preRegisteredStudents, setPreRegisteredStudents] = useState([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // List of teaching subjects
  const subjectOptions = [
    'Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 
    'Computer Science', 'Physics', 'Chemistry', 'Biology', 'History', 
    'Geography', 'Economics', 'Physical Education', 'Art & Craft', 'Music'
  ];

  // List of classes teaching
  const classOptions = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];

  // Fetch list of active schools
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const res = await axios.get(`${API_URL}/schools`);
        if (res.data.status === 'success') {
          setSchools(res.data.schools);
        }
      } catch (err) {
        console.error('Failed to load schools', err.message);
      }
    };
    fetchSchools();
  }, []);

  // Fetch pre-registered students if role is parent and school is selected
  useEffect(() => {
    if (detectedRole === 'parent' && formData.schoolId) {
      const fetchPreStudents = async () => {
        setLoadingStudents(true);
        try {
          const res = await axios.get(`${API_URL}/schools/${formData.schoolId}/pre-students`);
          if (res.data.status === 'success') {
            setPreRegisteredStudents(res.data.students);
          }
        } catch (err) {
          console.error('Failed to load school student directory', err.message);
        } finally {
          setLoadingStudents(false);
        }
      };
      fetchPreStudents();
      setSelectedStudent(null);
      setStudentSearchQuery('');
      setFormData(prev => ({
        ...prev,
        preRegisteredStudentId: ''
      }));
    } else {
      setPreRegisteredStudents([]);
      setSelectedStudent(null);
      setStudentSearchQuery('');
    }
  }, [formData.schoolId, detectedRole]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const finalValue = name === 'schoolPhone' ? value.replace(/\D/g, '') : value;
    setFormData({
      ...formData,
      [name]: finalValue
    });
  };

  const validatePasswordRequirements = (pw) => {
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    return regex.test(pw);
  };

  // Step 1: Verify Code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!inputCode.trim()) {
      setError('Please enter a secret code');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/verify-code`, { secretCode: inputCode.trim() });
      if (res.data.status === 'success') {
        const { role, type, school } = res.data;
        setDetectedRole(role);
        setCodeVerified(true);
        
        setIsTempLocked(type === 'school_specific');
        setPreFilledSchoolName((type === 'school_specific' && school) ? school.name : '');

        setFormData({
          ...formData,
          role: role,
          secretCode: inputCode.trim(),
          schoolId: (type === 'school_specific' && school) ? school.id : ''
        });

        setSuccess(`Code verified! Role identified: ${role.replace('_', ' ').toUpperCase()}`);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid secret code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset verification to try another code
  const handleResetCode = () => {
    setCodeVerified(false);
    setCodeConfirmed(false);
    setDetectedRole('');
    setInputCode('');
    setIsTempLocked(false);
    setPreFilledSchoolName('');
    setFormStep(1);
    setError('');
    setSuccess('');
    setFormData({
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: '',
      secretCode: '',
      schoolId: '',
      schoolName: '',
      schoolAddress: '',
      schoolPhone: '',
      preRegisteredStudentId: ''
    });
    setSelectedStudent(null);
    setStudentSearchQuery('');
    setSelectedSubjects([]);
    setOtherSubjectText('');
    setClassesTeaching([]);
    setPrimaryClass('');
    setPrimarySection('');
    setVehicleNumber('');
    setLicenseNumber('');
    setDriverPhone('');
    setParentDetails({
      fatherName: '',
      motherName: '',
      fatherPhone: '',
      motherPhone: '',
      relationship: 'Father',
      emergencyContact: '',
      homeAddress: ''
    });
    setParentChildOption('option_a');
    setManualChildDetails({
      fullName: '',
      className: 'Class 8',
      section: 'A',
      rollNumber: '',
      dateOfBirth: ''
    });
  };

  // Subject checkboxes toggle
  const handleSubjectToggle = (subject) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  // Class checkboxes toggle
  const handleClassToggle = (className) => {
    setClassesTeaching(prev => 
      prev.includes(className) ? prev.filter(c => c !== className) : [...prev, className]
    );
  };

  // Parent fields change handler
  const handleParentFieldChange = (e) => {
    const { name, value } = e.target;
    setParentDetails(prev => ({ ...prev, [name]: value }));
  };

  // Parent manual entry change handler
  const handleManualChildChange = (e) => {
    const { name, value } = e.target;
    setManualChildDetails(prev => ({ ...prev, [name]: value }));
  };

  // Step wizard next handler
  const handleNextStep = (e) => {
    if (e) e.preventDefault();
    setError('');

    // Basic Account Details validation (Step 1)
    if (formStep === 1) {
      const { fullName, email, password, confirmPassword, schoolId, schoolName } = formData;
      if (!fullName || !email || !password || !confirmPassword) {
        setError('Please fill in all required fields');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (!validatePasswordRequirements(password)) {
        setError('Password must be at least 8 characters long, contain at least 1 uppercase letter, 1 number, and 1 special character.');
        return;
      }
      if (detectedRole === 'school_admin' && !schoolId && !schoolName) {
        setError('Please select or specify school details');
        return;
      }
      if (detectedRole !== 'super_admin' && detectedRole !== 'school_admin' && !schoolId) {
        setError('School association is required');
        return;
      }
      
      // Driver extra fields validation
      if (detectedRole === 'driver') {
        if (!vehicleNumber || !licenseNumber || !driverPhone) {
          setError('Please fill in all driver vehicle and license fields');
          return;
        }
      }

      // If Driver, Super Admin, School Admin: no step 2 needed, submit directly
      if (detectedRole !== 'teacher' && detectedRole !== 'parent') {
        handleSubmit();
        return;
      }

      setFormStep(2);
    } 
    // Teacher Subject validation (Step 2)
    else if (formStep === 2 && detectedRole === 'teacher') {
      if (selectedSubjects.length === 0 && !otherSubjectText.trim()) {
        setError('Please select at least one subject you teach');
        return;
      }
      if (classesTeaching.length === 0) {
        setError('Please select at least one class you are teaching');
        return;
      }
      if (!primaryClass) {
        setError('Please select your primary class');
        return;
      }
      if (!primarySection.trim()) {
        setError('Please enter your primary section (e.g. A)');
        return;
      }
      handleSubmit();
    }
    // Parent Child Search validation (Step 2)
    else if (formStep === 2 && detectedRole === 'parent') {
      if (parentChildOption === 'option_a') {
        if (!formData.preRegisteredStudentId) {
          setError('Please select your child from the directory, or select manual entry.');
          return;
        }
      } else {
        const { fullName, className, section } = manualChildDetails;
        if (!fullName || !className || !section) {
          setError('Please fill in child\'s name, class, and section');
          return;
        }
      }
      setFormStep(3);
    }
  };

  // Submit registration payload to backend
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');

    // Prepare teacher subjects list including custom other subject if provided
    let subjectsList = [...selectedSubjects];
    if (otherSubjectText.trim()) {
      subjectsList.push(otherSubjectText.trim());
    }

    const payload = {
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      secretCode: formData.secretCode,
      schoolId: formData.schoolId,
      // School Admin creation
      schoolName: formData.schoolName,
      schoolAddress: formData.schoolAddress,
      schoolPhone: formData.schoolPhone,
      // Teacher fields
      subjects: subjectsList,
      primaryClass,
      primarySection,
      classesTeaching,
      // Driver fields
      vehicleNumber,
      licenseNumber,
      phone: driverPhone,
      // Parent fields
      fatherName: parentDetails.fatherName,
      motherName: parentDetails.motherName,
      fatherPhone: parentDetails.fatherPhone,
      motherPhone: parentDetails.motherPhone,
      relationship: parentDetails.relationship,
      emergencyContact: parentDetails.emergencyContact,
      homeAddress: parentDetails.homeAddress,
      preRegisteredStudentId: parentChildOption === 'option_a' ? formData.preRegisteredStudentId : undefined,
      // Option B: Manual Entry
      childFullName: parentChildOption === 'option_b' ? manualChildDetails.fullName : undefined,
      childClass: parentChildOption === 'option_b' ? manualChildDetails.className : undefined,
      childSection: parentChildOption === 'option_b' ? manualChildDetails.section : undefined,
      childRollNumber: parentChildOption === 'option_b' ? manualChildDetails.rollNumber : undefined,
      childDateOfBirth: parentChildOption === 'option_b' ? manualChildDetails.dateOfBirth : undefined
    };

    setLoading(true);
    const result = await register(payload);
    setLoading(false);

    if (result.success) {
      if (detectedRole === 'parent') {
        setFormStep(4); // Show waiting approval screen
      } else {
        setSuccess(result.message + ' Redirecting to login page...');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } else {
      setError(result.message);
    }
  };

  const renderStepIndicator = () => {
    const steps = [];
    if (detectedRole === 'teacher') {
      steps.push('Account Info', 'Subject Details');
    } else if (detectedRole === 'parent') {
      steps.push('Account Info', 'Find Child', 'Parent Details');
    } else {
      return null;
    }
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px', gap: '8px' }}>
        {steps.map((stepName, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <div style={{ height: '2px', width: '30px', background: formStep > idx ? 'var(--accent)' : 'var(--border)' }} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: formStep === idx + 1 ? 'var(--accent)' : (formStep > idx + 1 ? 'var(--success)' : 'transparent'),
                border: `2px solid ${formStep >= idx + 1 ? 'var(--accent)' : 'var(--border)'}`,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                {formStep > idx + 1 ? '✓' : idx + 1}
              </div>
              <span style={{ fontSize: '12px', fontWeight: '500', color: formStep === idx + 1 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {stepName}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="auth-container" style={{ minHeight: '95vh', padding: '40px 20px' }}>
      <div className="auth-card" style={{ maxWidth: formStep === 2 && detectedRole === 'teacher' ? '700px' : '600px', width: '100%', transition: 'all 0.3s ease' }}>
        <h2 className="auth-title">
          {!codeVerified ? 'Register Account' : (formStep === 4 ? 'Request Sent' : 'Complete Registration')}
        </h2>
        <p className="auth-subtitle">
          {codeVerified 
            ? (formStep === 4 ? 'Pending Verification' : `Registering as a ${detectedRole.replace('_', ' ').toUpperCase()}`) 
            : 'Create a new account on the School Connect system'}
        </p>

        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">{success}</div>}

        {/* STEP 1: CODE VERIFICATION FORM */}
        {!codeVerified && (
          <form onSubmit={handleVerifyCode}>
            <div className="form-group">
              <label className="form-label" htmlFor="secretCode">
                Invitation Secret Code *
              </label>
              <input
                type="password"
                id="secretCode"
                className="form-input"
                placeholder="Enter your invitation or secret code"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        )}

        {/* STEP 1.5: VERIFICATION CONFIRMATION SCREEN */}
        {codeVerified && !codeConfirmed && (
          <div className="vertical-stack" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
            <div className="glass-card" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '15px', marginBottom: '16px', color: 'var(--accent)', fontWeight: '600' }}>Invitation Code Identified</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Assigned Role: </span>
                  <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{detectedRole.replace('_', ' ')}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Associated School: </span>
                  <strong style={{ color: 'var(--text-primary)' }}>{preFilledSchoolName || 'Global Registration (Select School in next step)'}</strong>
                </div>
              </div>
            </div>
            
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Is this role and school association correct?</p>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button" 
                onClick={handleResetCode} 
                className="auth-button" 
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-primary)', margin: 0 }}
              >
                No, Change Code
              </button>
              
              <button 
                type="button" 
                onClick={() => setCodeConfirmed(true)} 
                className="auth-button"
                style={{ margin: 0 }}
              >
                Yes, Confirm & Proceed
              </button>
            </div>
          </div>
        )}

        {/* STEP 2+: ACTUAL REGISTRATION WIZARD */}
        {codeVerified && codeConfirmed && (
          <div>
            {renderStepIndicator()}

            <form onSubmit={(e) => e.preventDefault()}>
              {/* STEP 1: Basic details (Full Name, Email, Password, Driver Info) */}
              {formStep === 1 && (
                <div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="fullName">Full Name *</label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        className="form-input"
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="email">Email Address *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="form-input"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="password">Password *</label>
                      <div className="password-input-wrapper">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          name="password"
                          className="form-input"
                          placeholder="Min 8 characters"
                          value={formData.password}
                          onChange={handleChange}
                          required
                        />
                        <button
                          type="button"
                          className={`password-toggle-btn ${showPassword ? 'active' : ''}`}
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          <GraduationCap size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="confirmPassword">Confirm Password *</label>
                      <div className="password-input-wrapper">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          id="confirmPassword"
                          name="confirmPassword"
                          className="form-input"
                          placeholder="Confirm password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                        />
                        <button
                          type="button"
                          className={`password-toggle-btn ${showConfirmPassword ? 'active' : ''}`}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          <GraduationCap size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Driver fields (Appears inline in Step 1) */}
                  {detectedRole === 'driver' && (
                    <div style={{ marginTop: '10px' }}>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label" htmlFor="vehicleNumber">Vehicle/Bus Number *</label>
                          <input
                            type="text"
                            id="vehicleNumber"
                            className="form-input"
                            placeholder="KA-01-MJ-1234"
                            value={vehicleNumber}
                            onChange={(e) => setVehicleNumber(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" htmlFor="licenseNumber">License Number *</label>
                          <input
                            type="text"
                            id="licenseNumber"
                            className="form-input"
                            placeholder="DL-XXXXXXXXXXXXX"
                            value={licenseNumber}
                            onChange={(e) => setLicenseNumber(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="driverPhone">Phone Number *</label>
                        <input
                          type="tel"
                          id="driverPhone"
                          className="form-input"
                          placeholder="Enter your phone number"
                          value={driverPhone}
                          onChange={(e) => setDriverPhone(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* School selection (Dropdown if not prefilled by code) */}
                  {detectedRole !== 'super_admin' && detectedRole !== 'school_admin' && (
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                      <label className="form-label">School *</label>
                      {formData.schoolId && isTempLocked ? (
                        <div className="locked-field-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                          <School size={16} style={{ color: 'var(--accent)' }} />
                          <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{preFilledSchoolName} (Locked by Code)</span>
                        </div>
                      ) : (
                        <select
                          id="schoolId"
                          name="schoolId"
                          className="form-select"
                          value={formData.schoolId}
                          onChange={handleChange}
                          required
                        >
                          <option value="">-- Choose School --</option>
                          {schools.map((s) => (
                            <option key={s._id} value={s._id}>{s.name} ({s.address})</option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {/* School Admin setup - Select or enter school details */}
                  {detectedRole === 'school_admin' && !formData.schoolId && (
                    <fieldset style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                      <legend style={{ padding: '0 8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        School Registration
                      </legend>
                      
                      <div className="form-group">
                        <label className="form-label" htmlFor="schoolId">Or Select Existing School</label>
                        <select
                          id="schoolId"
                          name="schoolId"
                          className="form-select"
                          value={formData.schoolId}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              schoolId: e.target.value,
                              schoolName: e.target.value ? '' : formData.schoolName,
                              schoolAddress: e.target.value ? '' : formData.schoolAddress,
                              schoolPhone: e.target.value ? '' : formData.schoolPhone
                            });
                          }}
                        >
                          <option value="">-- Create New School Instead --</option>
                          {schools.map((s) => (
                            <option key={s._id} value={s._id}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      {!formData.schoolId && (
                        <>
                          <div className="form-group">
                            <label className="form-label" htmlFor="schoolName">School Name *</label>
                            <input
                              type="text"
                              id="schoolName"
                              name="schoolName"
                              className="form-input"
                              placeholder="e.g. Greenwood High School"
                              value={formData.schoolName}
                              onChange={handleChange}
                            />
                          </div>
                          
                          <div className="form-row">
                            <div className="form-group">
                              <label className="form-label" htmlFor="schoolAddress">School Address *</label>
                              <input
                                type="text"
                                id="schoolAddress"
                                name="schoolAddress"
                                className="form-input"
                                placeholder="School location address"
                                value={formData.schoolAddress}
                                onChange={handleChange}
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label" htmlFor="schoolPhone">School Contact Phone *</label>
                              <input
                                type="text"
                                id="schoolPhone"
                                name="schoolPhone"
                                className="form-input"
                                placeholder="Phone number"
                                value={formData.schoolPhone}
                                onChange={handleChange}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </fieldset>
                  )}

                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button 
                      type="button" 
                      onClick={handleResetCode} 
                      className="auth-button" 
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-primary)', margin: 0 }}
                    >
                      Change Code
                    </button>
                    
                    <button type="button" onClick={handleNextStep} className="auth-button" disabled={loading} style={{ margin: 0 }}>
                      {detectedRole === 'teacher' || detectedRole === 'parent' ? 'Next Step' : (loading ? 'Registering...' : 'Register')}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2 (TEACHER): Subject and class assignment */}
              {formStep === 2 && detectedRole === 'teacher' && (
                <div>
                  <div className="form-group">
                    <label className="form-label">Select Subjects You Teach *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', maxHeight: '180px', overflowY: 'auto', padding: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '6px', marginBottom: '12px' }}>
                      {subjectOptions.map(sub => (
                        <label key={sub} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                          <input 
                            type="checkbox" 
                            checked={selectedSubjects.includes(sub)} 
                            onChange={() => handleSubjectToggle(sub)} 
                          />
                          <span>{sub}</span>
                        </label>
                      ))}
                    </div>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Other subjects (separate with commas if multiple)..." 
                      value={otherSubjectText}
                      onChange={(e) => setOtherSubjectText(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Which Classes are you Assigned to Teach? *</label>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }}>
                      {classOptions.map(cls => (
                        <label key={cls} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                          <input 
                            type="checkbox" 
                            checked={classesTeaching.includes(cls)} 
                            onChange={() => handleClassToggle(cls)} 
                          />
                          <span>{cls}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Primary Assigned Class *</label>
                      <select 
                        className="form-select"
                        value={primaryClass}
                        onChange={(e) => setPrimaryClass(e.target.value)}
                        required
                      >
                        <option value="">-- Select Main Class --</option>
                        {classOptions.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Section Assigned *</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. A" 
                        value={primarySection}
                        onChange={(e) => setPrimarySection(e.target.value.toUpperCase())}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button 
                      type="button" 
                      onClick={() => setFormStep(1)} 
                      className="auth-button" 
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-primary)', margin: 0 }}
                    >
                      Back
                    </button>
                    
                    <button type="button" onClick={handleNextStep} className="auth-button" disabled={loading} style={{ margin: 0 }}>
                      {loading ? 'Registering...' : 'Complete Registration'}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2 (PARENT): Find/Select Child */}
              {formStep === 2 && detectedRole === 'parent' && (
                <div>
                  <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '16px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setParentChildOption('option_a');
                        setSelectedStudent(null);
                        setFormData(prev => ({ ...prev, preRegisteredStudentId: '' }));
                      }}
                      style={{
                        padding: '10px 16px',
                        background: 'none',
                        border: 'none',
                        borderBottom: parentChildOption === 'option_a' ? '2px solid var(--accent)' : 'none',
                        color: parentChildOption === 'option_a' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: '600',
                        fontSize: '13px',
                        cursor: 'pointer',
                        flex: 1
                      }}
                    >
                      Option A: Select Child from School List
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setParentChildOption('option_b');
                        setSelectedStudent(null);
                        setFormData(prev => ({ ...prev, preRegisteredStudentId: '' }));
                      }}
                      style={{
                        padding: '10px 16px',
                        background: 'none',
                        border: 'none',
                        borderBottom: parentChildOption === 'option_b' ? '2px solid var(--accent)' : 'none',
                        color: parentChildOption === 'option_b' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: '600',
                        fontSize: '13px',
                        cursor: 'pointer',
                        flex: 1
                      }}
                    >
                      Option B: Manual Child Entry
                    </button>
                  </div>

                  {/* OPTION A: SEARCH STUDENT LIST */}
                  {parentChildOption === 'option_a' && (
                    <div className="form-group">
                      <label className="form-label">Search Child Directory</label>
                      {selectedStudent ? (
                        <div className="glass-card" style={{ padding: '16px', background: 'rgba(79, 70, 229, 0.05)', border: '1px solid var(--accent)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>{selectedStudent.name}</span>
                            <button 
                              type="button" 
                              onClick={() => {
                                setSelectedStudent(null);
                                setFormData(prev => ({ ...prev, preRegisteredStudentId: '' }));
                              }} 
                              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                            >
                              Clear Selection
                            </button>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            <div><strong>Admission No:</strong> {selectedStudent.admissionNumber}</div>
                            <div><strong>Class & Section:</strong> {selectedStudent.className} - {selectedStudent.section}</div>
                            <div><strong>Roll Number:</strong> {selectedStudent.rollNumber || 'N/A'}</div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ position: 'relative' }}>
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Search student name or enter roll number..."
                              value={studentSearchQuery}
                              onChange={(e) => setStudentSearchQuery(e.target.value)}
                              style={{ paddingLeft: '38px', marginBottom: '8px' }}
                            />
                          </div>

                          {loadingStudents ? (
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Loading directory...</p>
                          ) : (
                            <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '6px', background: 'rgba(0,0,0,0.2)' }}>
                              {(() => {
                                const filtered = preRegisteredStudents.filter(s => 
                                  s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                                  (s.rollNumber && s.rollNumber.toLowerCase().includes(studentSearchQuery.toLowerCase())) ||
                                  s.admissionNumber.toLowerCase().includes(studentSearchQuery.toLowerCase())
                                );

                                if (preRegisteredStudents.length === 0) {
                                  return <div style={{ padding: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>Student directory is empty for this school. Please use Manual Entry.</div>;
                                }

                                if (filtered.length === 0) {
                                  return <div style={{ padding: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>No matching students. Check spelling or try Manual Entry.</div>;
                                }

                                return filtered.map(s => (
                                  <div
                                    key={s._id}
                                    onClick={() => {
                                      setSelectedStudent(s);
                                      setFormData(prev => ({ ...prev, preRegisteredStudentId: s._id }));
                                    }}
                                    style={{
                                      padding: '10px 14px',
                                      cursor: 'pointer',
                                      borderBottom: '1px solid var(--border)',
                                      fontSize: '13px',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      color: 'var(--text-primary)'
                                    }}
                                    className="student-search-item"
                                  >
                                    <div>
                                      <strong>{s.name}</strong>
                                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Class: {s.className} - {s.section}</div>
                                    </div>
                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                                      Adm: {s.admissionNumber} {s.rollNumber ? `| Roll: ${s.rollNumber}` : ''}
                                    </span>
                                  </div>
                                ));
                              })()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* OPTION B: MANUAL ENTRY */}
                  {parentChildOption === 'option_b' && (
                    <div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="manualChildName">Child Full Name *</label>
                        <input
                          type="text"
                          id="manualChildName"
                          name="fullName"
                          className="form-input"
                          placeholder="Enter child's full name"
                          value={manualChildDetails.fullName}
                          onChange={handleManualChildChange}
                          required
                        />
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Class *</label>
                          <select
                            name="className"
                            className="form-select"
                            value={manualChildDetails.className}
                            onChange={handleManualChildChange}
                            required
                          >
                            {classOptions.map(cls => (
                              <option key={cls} value={cls}>{cls}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label" htmlFor="manualChildSection">Section *</label>
                          <input
                            type="text"
                            id="manualChildSection"
                            name="section"
                            className="form-input"
                            placeholder="e.g. A"
                            value={manualChildDetails.section}
                            onChange={(e) => setManualChildDetails(prev => ({ ...prev, section: e.target.value.toUpperCase() }))}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label" htmlFor="manualChildRoll">Roll Number</label>
                          <input
                            type="text"
                            id="manualChildRoll"
                            name="rollNumber"
                            className="form-input"
                            placeholder="e.g. 15"
                            value={manualChildDetails.rollNumber}
                            onChange={handleManualChildChange}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" htmlFor="manualChildDob">Date of Birth</label>
                          <input
                            type="date"
                            id="manualChildDob"
                            name="dateOfBirth"
                            className="form-input"
                            value={manualChildDetails.dateOfBirth}
                            onChange={handleManualChildChange}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button 
                      type="button" 
                      onClick={() => setFormStep(1)} 
                      className="auth-button" 
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-primary)', margin: 0 }}
                    >
                      Back
                    </button>
                    
                    <button type="button" onClick={handleNextStep} className="auth-button" style={{ margin: 0 }}>
                      Next Step
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3 (PARENT): Parent details */}
              {formStep === 3 && detectedRole === 'parent' && (
                <div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="fatherName">Father Full Name</label>
                      <input
                        type="text"
                        id="fatherName"
                        name="fatherName"
                        className="form-input"
                        placeholder="Father's name"
                        value={parentDetails.fatherName}
                        onChange={handleParentFieldChange}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="motherName">Mother Full Name</label>
                      <input
                        type="text"
                        id="motherName"
                        name="motherName"
                        className="form-input"
                        placeholder="Mother's name"
                        value={parentDetails.motherName}
                        onChange={handleParentFieldChange}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="fatherPhone">Father Phone Number</label>
                      <input
                        type="tel"
                        id="fatherPhone"
                        name="fatherPhone"
                        className="form-input"
                        placeholder="Father's phone"
                        value={parentDetails.fatherPhone}
                        onChange={handleParentFieldChange}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="motherPhone">Mother Phone Number</label>
                      <input
                        type="tel"
                        id="motherPhone"
                        name="motherPhone"
                        className="form-input"
                        placeholder="Mother's phone"
                        value={parentDetails.motherPhone}
                        onChange={handleParentFieldChange}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Relationship to Child *</label>
                      <select
                        name="relationship"
                        className="form-select"
                        value={parentDetails.relationship}
                        onChange={handleParentFieldChange}
                        required
                      >
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Guardian">Guardian</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="emergencyContact">Emergency Contact Number *</label>
                      <input
                        type="tel"
                        id="emergencyContact"
                        name="emergencyContact"
                        className="form-input"
                        placeholder="Emergency phone number"
                        value={parentDetails.emergencyContact}
                        onChange={handleParentFieldChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="homeAddress">Home Address *</label>
                    <textarea
                      id="homeAddress"
                      name="homeAddress"
                      className="form-input"
                      placeholder="Enter home residential address"
                      value={parentDetails.homeAddress}
                      onChange={handleParentFieldChange}
                      required
                      style={{ height: '70px', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button 
                      type="button" 
                      onClick={() => setFormStep(2)} 
                      className="auth-button" 
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-primary)', margin: 0 }}
                    >
                      Back
                    </button>
                    
                    <button type="button" onClick={handleSubmit} className="auth-button" disabled={loading} style={{ margin: 0 }}>
                      {loading ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4 (PARENT SUCCESS SCREEN): Waiting approval screen */}
              {formStep === 4 && detectedRole === 'parent' && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <UserCheck size={44} />
                    </div>
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '12px' }}>Registration Request Sent!</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '28px', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
                    Your parent account has been successfully created. We have forwarded your registration request to the school's <strong>Administrator</strong> and <strong>Principal</strong> for approval.
                  </p>
                  
                  <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', textAlign: 'left', marginBottom: '28px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    <strong>Wait for Approval:</strong><br/>
                    Once either one approves your details and verifies your child's information, you will receive an email notification: 
                    <span style={{ display: 'block', color: 'var(--accent)', fontWeight: '500', marginTop: '6px' }}>"Your account is approved! Login to access your child's information"</span>
                  </div>

                  <Link to="/login" className="auth-button" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center', width: 'auto', padding: '12px 30px' }}>
                    Return to Login
                  </Link>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Footer link to login (not shown in success state) */}
        {formStep !== 4 && (
          <div className="auth-footer">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Login here
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;

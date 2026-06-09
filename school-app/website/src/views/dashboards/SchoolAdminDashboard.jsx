import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, saveUserToLocalStorage } from '../../context/AuthContext';
import { Menu, MoreHorizontal, Users, UserCheck, ShieldAlert, Building, Phone, MapPin, GraduationCap, Bus, Play, Square, Compass, RefreshCw, Milestone, Navigation, BookOpen, Image, Calendar, Award, DollarSign, CheckSquare, Trash2, Camera, Clock, LogOut, AlertTriangle, CheckCircle, RefreshCcw, Edit2, Edit3, FileEdit, Search, X, Save, Plus, School, Upload, Bell, Wifi, User, Lock, Unlock, Key, Mail, MailOpen, Eye, Monitor, Download } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import '../Dashboard.css';
import SplashScreen from '../../components/SplashScreen';
import InteractiveMapSelectorModal from '../../components/InteractiveMapSelectorModal';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);
import { DashboardLayout, API_URL, BroadcastDetailsModal, ParentDetailsModal, LogoutConfirmationModal, ProfileSettingsTab } from './DashboardLayout';
import { WiFiConfigCard, StaffAttendanceMonitoringLogs, ClassTimetableModule, ClassRequestsManagement, StudentDirectoryModule, SchoolAttendanceView, AdminSchedulesModule, SchoolCalendarModule } from './DashboardModules';

export const SchoolAdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('activeTab_school_admin') || sessionStorage.getItem('activeTab_admin') || 'overview');

  // Data states
  const [secretCodes, setSecretCodes] = useState([]);
  const [schoolCodes, setSchoolCodes] = useState([]);
  const [schoolUsers, setSchoolUsers] = useState([]);
  const [schoolDetails, setSchoolDetails] = useState(null);
  const [feesList, setFeesList] = useState([]);
  const [classDiaries, setClassDiaries] = useState([]);
  const [classes, setClasses] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingParents, setPendingParents] = useState([]);
  const [selectedDetailsParent, setSelectedDetailsParent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // School profile edit states
  const [isEditingSchoolInfo, setIsEditingSchoolInfo] = useState(false);
  const [editedSchoolName, setEditedSchoolName] = useState('');
  const [editedSchoolPhone, setEditedSchoolPhone] = useState('');
  const [editedSchoolAddress, setEditedSchoolAddress] = useState('');
  const [editedSchoolWifi, setEditedSchoolWifi] = useState('');

  const startEditingSchool = () => {
    if (schoolDetails) {
      setEditedSchoolName(schoolDetails.name);
      setEditedSchoolPhone(schoolDetails.phone);
      setEditedSchoolAddress(schoolDetails.address);
      setEditedSchoolWifi(schoolDetails.wifiSSID || '');
      setIsEditingSchoolInfo(true);
    }
  };

  const handleSaveSchoolDetails = async (e) => {
    e.preventDefault();
    if (!editedSchoolName || !editedSchoolAddress || !editedSchoolPhone) {
      setError('Name, phone, and address are required');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await axios.put(`${API_URL}/admin/schools/profile`, {
        name: editedSchoolName,
        phone: editedSchoolPhone,
        address: editedSchoolAddress,
        wifiSSID: editedSchoolWifi
      });
      if (res.data.status === 'success') {
        setSchoolDetails(res.data.school);
        setSuccess('School details updated successfully');
        setIsEditingSchoolInfo(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update school details');
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcastSubmit = async (role, message) => {
    const res = await axios.post(`${API_URL}/notifications/push-update`, {
      role,
      message
    });
    if (res.data.status === 'success') {
      setSuccess(res.data.message);
      setTimeout(() => setSuccess(''), 4000);
    }
  };

  const handleSchoolPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('School photo must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      setLoading(true);
      setError('');
      setSuccess('');
      try {
        const res = await axios.put(`${API_URL}/admin/schools/photo`, {
          schoolPhoto: reader.result
        });
        if (res.data.status === 'success') {
          setSuccess('School photo updated successfully!');
          setSchoolDetails(res.data.school);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to upload school photo.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSchoolLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('School logo size must be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      setLoading(true);
      setError('');
      setSuccess('');
      try {
        const res = await axios.put(`${API_URL}/admin/schools/logo`, {
          schoolLogo: reader.result
        });
        if (res.data.status === 'success') {
          setSuccess('School logo updated!');
          setSchoolDetails(res.data.school);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to upload school logo.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Form states - Create registration code
  const [codeForm, setCodeForm] = useState({
    role: 'teacher',
    expiryOption: 'none',
    usageLimitOption: 'unlimited'
  });

  // Rejection modal states
  const [rejectionModalParent, setRejectionModalParent] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  // Assign class modal state
  const [showAssignClassModal, setShowAssignClassModal] = useState(false);
  const [selectedUserForClassAssign, setSelectedUserForClassAssign] = useState(null);
  const [assignClassForm, setAssignClassForm] = useState({
    classId: '',
    section: 'A',
    subject: '',
    customSubject: ''
  });

  // Modal / Form state for updating student fee
  const [selectedStudentFee, setSelectedStudentFee] = useState(null);
  const [feeUpdateForm, setFeeUpdateForm] = useState({
    totalAmount: '',
    paidAmount: '',
    dueDate: '',
    officePhone: ''
  });
  const [showFeeModal, setShowFeeModal] = useState(false);

  async function fetchInitialData(silent = false) {
    try {
      if (!silent) setLoading(true);
      setError('');
      
      const [codesRes, schoolCodesRes, usersRes, mySchoolRes, feesRes, diariesRes, classesRes, requestsRes, parentsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/secret-codes`),
        axios.get(`${API_URL}/schools/codes`),
        axios.get(`${API_URL}/admin/school-users`),
        axios.get(`${API_URL}/schools/my-school`),
        axios.get(`${API_URL}/fees/school`),
        axios.get(`${API_URL}/diaries/class`),
        axios.get(`${API_URL}/schools/my-classes`),
        axios.get(`${API_URL}/schools/class-requests`),
        axios.get(`${API_URL}/admin/pending-parents`)
      ]);

      if (codesRes.data.status === 'success') {
        setSecretCodes(codesRes.data.codes);
      }
      if (schoolCodesRes.data.status === 'success') {
        setSchoolCodes(schoolCodesRes.data.codes);
      }
      if (usersRes.data.status === 'success') {
        setSchoolUsers(usersRes.data.users);
      }
      if (mySchoolRes.data.status === 'success') {
        setSchoolDetails(mySchoolRes.data.school);
      }
      if (feesRes.data.status === 'success') {
        setFeesList(feesRes.data.fees);
      }
      if (diariesRes.data.status === 'success') {
        setClassDiaries(diariesRes.data.diaries);
      }
      if (classesRes.data.status === 'success') {
        setClasses(classesRes.data.classes);
      }
      if (requestsRes.data.status === 'success') {
        setPendingRequests(requestsRes.data.requests.filter(r => r.status === 'pending'));
      }
      if (parentsRes.data.status === 'success') {
        setPendingParents(parentsRes.data.parents);
      }

    } catch (err) {
      console.error(err);
      setError('Failed to fetch school admin dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.body.className = 'theme-school_admin';
    Promise.resolve().then(() => fetchInitialData());

    const interval = setInterval(() => {
      fetchInitialData(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleOpenFeeModal = (studentBill) => {
    setSelectedStudentFee(studentBill);
    setFeeUpdateForm({
      totalAmount: studentBill.totalAmount,
      paidAmount: studentBill.paidAmount,
      dueDate: studentBill.dueDate ? new Date(studentBill.dueDate).toISOString().split('T')[0] : '',
      officePhone: studentBill.officePhone
    });
    setShowFeeModal(true);
  };

  const handleUpdateFee = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/fees`, {
        studentId: selectedStudentFee.studentId,
        totalAmount: Number(feeUpdateForm.totalAmount),
        paidAmount: Number(feeUpdateForm.paidAmount),
        dueDate: feeUpdateForm.dueDate,
        officePhone: feeUpdateForm.officePhone
      });
      if (res.data.status === 'success') {
        setSuccess('Fee statement updated successfully.');
        setShowFeeModal(false);
        // Refresh fees list
        const feesRes = await axios.get(`${API_URL}/fees/school`);
        if (feesRes.data.status === 'success') {
          setFeesList(feesRes.data.fees);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update fee statement');
    } finally {
      setLoading(false);
    }
  };

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = (allDevices = false) => {
    logout(allDevices);
    navigate('/login');
  };

  const handleDeactivateCode = async (code) => {
    if (!window.confirm(`Are you sure you want to deactivate registration code "${code}"?`)) return;
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/schools/codes/deactivate`, { code });
      if (res.data.status === 'success') {
        setSuccess('Code deactivated successfully!');
        setTimeout(() => setSuccess(''), 3000);
        // Refresh codes
        const schoolCodesRes = await axios.get(`${API_URL}/schools/codes`);
        if (schoolCodesRes.data.status === 'success') setSchoolCodes(schoolCodesRes.data.codes);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate registration code');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/schools/generate-code`, {
        role: codeForm.role,
        expiryOption: codeForm.expiryOption,
        usageLimitOption: codeForm.usageLimitOption
      });
      if (res.data.status === 'success') {
        setSuccess(`Successfully generated registration code: ${res.data.code.code}`);
        setTimeout(() => setSuccess(''), 5000);
        // Refresh codes
        const schoolCodesRes = await axios.get(`${API_URL}/schools/codes`);
        if (schoolCodesRes.data.status === 'success') setSchoolCodes(schoolCodesRes.data.codes);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate registration code');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveParent = async (parentId) => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      const res = await axios.post(`${API_URL}/admin/parents/${parentId}/approve`);
      if (res.data.status === 'success') {
        setSuccess('Parent request approved successfully.');
        setTimeout(() => setSuccess(''), 4000);
        fetchInitialData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve parent request');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectParentDirect = async (parentObj, reason) => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      const res = await axios.post(`${API_URL}/admin/parents/${parentObj._id}/reject`, {
        reason
      });
      if (res.data.status === 'success') {
        setSuccess('Details saved successfully');
        setTimeout(() => setSuccess(''), 4000);
        fetchInitialData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject parent request');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRejectParentModal = (parent) => {
    setRejectionModalParent(parent);
    setRejectionReason('');
    setShowRejectionModal(true);
  };

  const handleRejectParentSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason.');
      return;
    }
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      const res = await axios.post(`${API_URL}/admin/parents/${rejectionModalParent._id}/reject`, {
        reason: rejectionReason
      });
      if (res.data.status === 'success') {
        setSuccess('Parent registration request rejected.');
        setShowRejectionModal(false);
        setTimeout(() => setSuccess(''), 4000);
        fetchInitialData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject parent request');
    } finally {
      setLoading(false);
    }
  };

  // Assign class to user
  const handleAssignClassSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      setLoading(true);
      const finalSubject = assignClassForm.subject === 'Custom Subject' ? assignClassForm.customSubject : assignClassForm.subject;
      const res = await axios.put(`${API_URL}/admin/users/assign-class`, {
        userId: selectedUserForClassAssign._id,
        classId: assignClassForm.classId || null,
        section: assignClassForm.section,
        subject: finalSubject
      });
      if (res.data.status === 'success') {
        setSuccess(`Successfully assigned class to ${selectedUserForClassAssign.fullName}`);
        setShowAssignClassModal(false);
        // Refresh users list
        const usersRes = await axios.get(`${API_URL}/admin/school-users`);
        if (usersRes.data.status === 'success') setSchoolUsers(usersRes.data.users);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign class');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (id) => {
    try {
      setError('');
      setSuccess('');
      const res = await axios.post(`${API_URL}/schools/class-requests/${id}/approve`);
      if (res.data.status === 'success') {
        setSuccess('Class request approved successfully.');
        fetchInitialData();
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleRejectRequest = async (id) => {
    try {
      setError('');
      setSuccess('');
      const res = await axios.post(`${API_URL}/schools/class-requests/${id}/reject`);
      if (res.data.status === 'success') {
        setSuccess('Class request rejected.');
        fetchInitialData();
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject request');
    }
  };

  const detailsSubmissions = schoolUsers.filter(u => 
    u.role === 'parent' && 
    (u.fatherName || u.motherName || u.homeAddress || u.fatherPhone || u.motherPhone || u.emergencyContact)
  ).sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

  const schoolAdminTabs = [
    { id: 'overview', label: 'School Info', icon: Building },
    { id: 'secret-codes', label: 'Manage Codes', icon: Milestone },
    { id: 'pending-parents', label: 'Pending Parents', icon: UserCheck },
    { id: 'school-users', label: 'Staff & Parents List', icon: Users },
    { id: 'timetable', label: 'Class Timetables', icon: Calendar },
    { id: 'class-requests', label: 'Class Requests', icon: AlertTriangle },
    { id: 'attendance', label: 'School Attendance', icon: CheckSquare },
    { id: 'manage-fees', label: 'Manage Fees', icon: DollarSign },
    { id: 'diaries', label: 'Class Diaries', icon: BookOpen },
    { id: 'schedules', label: 'Schedules', icon: Clock },
    { id: 'calendar', label: 'School Calendar', icon: Calendar },
    { id: 'pre-students', label: 'Student Directory', icon: GraduationCap },
    { id: 'staff-attendance', label: 'Staff Check-ins & WiFi', icon: CheckSquare },
    { id: 'profile', label: 'My Profile', icon: User }
  ];

  return (
    <DashboardLayout
      roleName="school_admin"
      user={user}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      tabs={schoolAdminTabs}
      handleLogout={() => setShowLogoutModal(true)}
    >

      {/* Notifications */}
      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      {/* Pending Class Requests Notification Alert */}
      {pendingRequests.length > 0 && (
        <div className="glass-card" style={{ 
          padding: '16px 20px', 
          marginBottom: '24px', 
          borderLeft: '4px solid var(--accent)',
          background: 'rgba(124, 58, 237, 0.08)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <h4 style={{ 
            fontSize: '15px', 
            fontFamily: 'var(--font-title)', 
            color: 'var(--text-primary)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            marginBottom: '12px' 
          }}>
            <AlertTriangle size={18} style={{ color: 'var(--accent)' }} />
            <span>Pending Classroom Assignment Requests ({pendingRequests.length})</span>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pendingRequests.map((req) => (
              <div key={req._id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                background: 'rgba(0, 0, 0, 0.2)', 
                padding: '12px 16px', 
                borderRadius: '6px',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Teacher <strong>{req.classTeacher?.fullName || 'Teacher'}</strong> requested to be assigned to <strong>{req.className} - {req.section}</strong>.
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => handleApproveRequest(req._id)}
                    className="dashboard-btn-primary"
                    style={{ padding: '6px 12px', fontSize: '12px', margin: 0 }}
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleRejectRequest(req._id)}
                    className="logout-btn"
                    style={{ padding: '6px 12px', fontSize: '12px', margin: 0 }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



      {/* Content Area */}
      {activeTab === 'overview' && (
        <div>
          {/* Summary Cards */}
          <div className="overview-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div className="glass-card stat-card" style={{ borderLeft: '4px solid var(--accent)' }}>
              <div className="stat-title">Total Teachers</div>
              <div className="stat-value">{schoolUsers.filter(u => u.role === 'teacher').length}</div>
              <div className="stat-desc">Registered faculty members</div>
            </div>
            <div className="glass-card stat-card" style={{ borderLeft: '4px solid #EC4899' }}>
              <div className="stat-title">Total Parents</div>
              <div className="stat-value">{schoolUsers.filter(u => u.role === 'parent').length}</div>
              <div className="stat-desc">Active parent connections</div>
            </div>
            <div className="glass-card stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
              <div className="stat-title">Total Drivers</div>
              <div className="stat-value">{schoolUsers.filter(u => u.role === 'driver').length}</div>
              <div className="stat-desc">Registered school bus drivers</div>
            </div>
            <div className="glass-card stat-card" style={{ borderLeft: '4px solid #10b981' }}>
              <div className="stat-title">School Status</div>
              <div className="stat-value" style={{ color: '#10b981', marginTop: '4px' }}>
                {schoolDetails?.isActive ? 'Active' : 'Inactive'}
              </div>
              <div className="stat-desc">Official portal status</div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-title)' }}>School Profile Details</h3>
              {!isEditingSchoolInfo && schoolDetails && (
                <button 
                  onClick={startEditingSchool}
                  className="code-action-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px', margin: 0 }}
                >
                  <Edit2 size={12} /> Edit Details
                </button>
              )}
            </div>

            {schoolDetails ? (
              isEditingSchoolInfo ? (
                <form onSubmit={handleSaveSchoolDetails} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>OFFICIAL SCHOOL NAME</label>
                    <input 
                      type="text" 
                      value={editedSchoolName}
                      onChange={(e) => setEditedSchoolName(e.target.value)}
                      className="dashboard-input"
                      style={{ width: '100%', padding: '10px' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>OFFICIAL PHONE NUMBER</label>
                    <input 
                      type="text" 
                      value={editedSchoolPhone}
                      onChange={(e) => setEditedSchoolPhone(e.target.value)}
                      className="dashboard-input"
                      style={{ width: '100%', padding: '10px' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>STREET ADDRESS</label>
                    <textarea 
                      value={editedSchoolAddress}
                      onChange={(e) => setEditedSchoolAddress(e.target.value)}
                      className="dashboard-input"
                      style={{ width: '100%', padding: '10px', minHeight: '60px', resize: 'vertical' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>AUTHORIZED WIFI SSID</label>
                    <input 
                      type="text" 
                      value={editedSchoolWifi}
                      onChange={(e) => setEditedSchoolWifi(e.target.value)}
                      className="dashboard-input"
                      style={{ width: '100%', padding: '10px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button 
                      type="submit" 
                      className="dashboard-btn-primary" 
                      style={{ padding: '10px 20px', margin: 0 }}
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsEditingSchoolInfo(false)}
                      className="code-action-btn" 
                      style={{ padding: '10px 20px', margin: 0 }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="responsive-grid-1-1" style={{ gap: '20px', fontSize: '15px' }}>
                  {schoolDetails.logoUrl && (
                    <div style={{ gridColumn: 'span 2', textAlign: 'center', marginBottom: '16px' }}>
                      <p style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>SCHOOL LOGO</p>
                      <img 
                        src={schoolDetails.logoUrl} 
                        alt="School Logo" 
                        style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)', boxShadow: '0 0 10px rgba(168, 85, 247, 0.4)', margin: '0 auto' }} 
                      />
                    </div>
                  )}
                  {schoolDetails.schoolPhoto && (
                    <div style={{ gridColumn: 'span 2', textAlign: 'center', marginBottom: '16px' }}>
                      <p style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>SCHOOL COVER PHOTO</p>
                      <img 
                        src={schoolDetails.schoolPhoto} 
                        alt="School Photo" 
                        style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--border)' }} 
                      />
                    </div>
                  )}
                  <div>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>OFFICIAL SCHOOL NAME</p>
                    <p style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '18px' }}>{schoolDetails.name}</p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>OFFICIAL PHONE NUMBER</p>
                    <p style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '18px' }}>{schoolDetails.phone}</p>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>STREET ADDRESS</p>
                    <p style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{schoolDetails.address}</p>
                  </div>
                  {schoolDetails.wifiSSID && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <p style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>AUTHORIZED WIFI SSID</p>
                      <p style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{schoolDetails.wifiSSID}</p>
                    </div>
                  )}
                  <div style={{ gridColumn: 'span 2', marginTop: '10px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <label htmlFor="school-logo-upload" className="code-action-btn" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', margin: 0, padding: '10px 16px' }}>
                      <Upload size={14} /> Upload School Logo
                    </label>
                    <input 
                      id="school-logo-upload" 
                      type="file" 
                      accept="image/*" 
                      onChange={handleSchoolLogoUpload} 
                      style={{ display: 'none' }} 
                    />
                    <label htmlFor="school-photo-upload" className="code-action-btn" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', margin: 0, padding: '10px 16px' }}>
                      <Upload size={14} /> Upload School Photo
                    </label>
                    <input 
                      id="school-photo-upload" 
                      type="file" 
                      accept="image/*" 
                      onChange={handleSchoolPhotoUpload} 
                      style={{ display: 'none' }} 
                    />
                  </div>
                </div>
              )
            ) : (
              <p>Loading school details...</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'secret-codes' && (
        <div>
          {/* School specific registration codes */}
          <div className="responsive-grid-2-1">
            <div>
              <h3 className="dashboard-form-title">Active Registration Codes</h3>
              <p style={{ fontSize: '14px', marginBottom: '16px', color: 'var(--text-secondary)' }}>
                Generate secure, school-specific codes. Registration with these codes auto-assigns the user to this school and the specified role.
              </p>

              <div className="dashboard-table-container">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Registration Code</th>
                      <th>Role</th>
                      <th>Usage Limit / Count</th>
                      <th>Expires At / Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schoolCodes.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No codes generated yet.</td>
                      </tr>
                    ) : (
                      schoolCodes.map((code, idx) => {
                        let statusText = 'Never Expires';
                        let isExpired = false;
                        if (code.expiresAt) {
                          const diffMs = new Date(code.expiresAt) - new Date();
                          if (diffMs <= 0) {
                            statusText = 'Expired';
                            isExpired = true;
                          } else {
                            const diffDays = Math.floor(diffMs / 86400000);
                            const diffHours = Math.floor((diffMs % 86400000) / 3600000);
                            statusText = `${diffDays > 0 ? `${diffDays}d ` : ''}${diffHours}h remaining`;
                          }
                        }
                        return (
                          <tr key={code._id || idx} style={{ opacity: code.isActive && !isExpired ? 1 : 0.6 }}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <strong style={{ fontFamily: 'monospace', fontSize: '15px' }}>{code.code}</strong>
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(code.code);
                                    setCopiedIndex(idx);
                                    setTimeout(() => setCopiedIndex(null), 2000);
                                  }} 
                                  className="code-action-btn"
                                  style={{ padding: '4px 8px', fontSize: '11px' }}
                                >
                                  {copiedIndex === idx ? 'Copied!' : 'Copy'}
                                </button>
                                <a 
                                  href={`https://api.whatsapp.com/send?text=Join%20our%20school%20on%20School%20Connect!%20Use%20registration%20code:%20${code.code}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="code-action-btn"
                                  style={{ padding: '4px 8px', fontSize: '11px', textDecoration: 'none', background: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)', color: '#4ade80' }}
                                >
                                  Share WhatsApp
                                </a>
                              </div>
                            </td>
                            <td>
                              <span className={`badge badge-role ${code.role}`}>{code.role.replace('_', ' ')}</span>
                            </td>
                            <td>
                              {code.usageLimit ? `${code.usageCount} / ${code.usageLimit}` : `${code.usageCount} / Unlimited`}
                            </td>
                            <td style={{ color: !code.isActive ? 'var(--danger)' : (isExpired ? 'var(--danger)' : 'var(--text-secondary)') }}>
                              {!code.isActive ? 'Deactivated' : (isExpired ? 'Expired' : statusText)}
                            </td>
                            <td>
                              {code.isActive && !isExpired ? (
                                <button
                                  onClick={() => handleDeactivateCode(code.code)}
                                  className="code-action-btn"
                                  style={{ padding: '4px 8px', fontSize: '11px', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}
                                >
                                  Deactivate
                                </button>
                              ) : (
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Inactive</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="dashboard-form-container">
              <h3 className="dashboard-form-title">Generate Code</h3>
              <form onSubmit={handleGenerateCode} className="dashboard-form">
                <div className="form-group">
                  <label className="form-label">Role Target *</label>
                  <select
                    className="form-select"
                    value={codeForm.role}
                    onChange={(e) => setCodeForm({ ...codeForm, role: e.target.value })}
                  >
                    <option value="principal">Principal</option>
                    <option value="teacher">Teacher</option>
                    <option value="parent">Parent</option>
                    <option value="driver">Driver</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Expiration Limit *</label>
                  <select
                    className="form-select"
                    value={codeForm.expiryOption}
                    onChange={(e) => setCodeForm({ ...codeForm, expiryOption: e.target.value })}
                  >
                    <option value="none">No expiry</option>
                    <option value="24_hours">24 Hours</option>
                    <option value="7_days">7 Days</option>
                    <option value="30_days">30 Days</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Usage Limit *</label>
                  <select
                    className="form-select"
                    value={codeForm.usageLimitOption}
                    onChange={(e) => setCodeForm({ ...codeForm, usageLimitOption: e.target.value })}
                  >
                    <option value="unlimited">Unlimited uses</option>
                    <option value="single_use">Single use</option>
                    <option value="10_uses">10 uses</option>
                  </select>
                </div>

                <button type="submit" disabled={loading} className="dashboard-btn-primary" style={{ width: '100%' }}>
                  {loading ? 'Generating...' : 'Generate Code'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pending-parents' && (
        <div>
          <h3 className="dashboard-form-title">Pending Parent Registration Requests</h3>
          <p style={{ fontSize: '14px', marginBottom: '16px', color: 'var(--text-secondary)' }}>
            Review pending parent registrations, verify child link details, and approve or reject access.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginTop: '16px' }}>
            {pendingParents.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)', padding: '40px 20px', background: '#12122A', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                No pending parent requests found.
              </div>
            ) : (
              pendingParents.map((parent) => {
                const student = parent.student;
                return (
                  <div key={parent._id} style={{
                    backgroundColor: '#12122A',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '20px',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      {/* circular photo/avatar */}
                      <div style={{ float: 'left', marginRight: '16px' }}>
                        {parent.profilePhotoUrl || parent.profilePhoto ? (
                          <img
                            src={parent.profilePhotoUrl || parent.profilePhoto}
                            alt={parent.fullName}
                            style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(124, 58, 237, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#a78bfa',
                            fontSize: '18px',
                            fontWeight: '600'
                          }}>
                            {parent.fullName ? parent.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'P'}
                          </div>
                        )}
                      </div>

                      {/* stacked content */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontWeight: '600', color: 'white', fontSize: '15px' }}>{parent.fullName}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{parent.email}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={12} />
                          <span>{parent.phone || 'N/A'}</span>
                        </div>
                        
                        <div style={{ marginTop: '8px', padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <div style={{ fontSize: '13px', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <User size={12} style={{ color: 'var(--accent)' }} />
                            <span>Child: {student ? student.name : 'No Child Linked'}</span>
                          </div>
                          {student && (
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '16px' }}>
                              Class {student.className}{student.section} &bull; Roll No: {student.rollNumber || 'N/A'}
                            </div>
                          )}
                        </div>

                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <Clock size={12} />
                          <span>Submitted: {new Date(parent.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        {/* Requester Badge */}
                        <div style={{ marginTop: '8px' }}>
                          <span style={{
                            display: 'inline-block',
                            fontSize: '11px',
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            backgroundColor: 'rgba(59, 130, 246, 0.15)',
                            color: '#60a5fa',
                            fontWeight: '600'
                          }}>
                            Requested via School Admin Portal
                          </span>
                        </div>
                      </div>
                      <div style={{ clear: 'both' }}></div>
                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* View details button */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDetailsParent(parent);
                          setShowDetailsModal(true);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          background: 'rgba(124, 58, 237, 0.1)',
                          border: '1px solid #7c3aed',
                          color: '#a78bfa',
                          borderRadius: '10px',
                          padding: '10px 16px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <Eye size={14} />
                        <span>View Submitted Details</span>
                      </button>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleApproveParent(parent._id)}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            border: 'none',
                            color: 'white',
                            borderRadius: '9999px',
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          <CheckCircle size={14} />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleOpenRejectParentModal(parent)}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid #ef4444',
                            color: '#ef4444',
                            borderRadius: '9999px',
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          <X size={14} />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'school-users' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
            <h3 className="dashboard-form-title" style={{ margin: 0 }}>Registered Staff & Parents</h3>
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="dashboard-btn-primary"
              style={{ margin: 0, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              Request Details Update
            </button>
          </div>
          <div className="dashboard-table-container">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th>System Role</th>
                  <th>Class Assigned</th>
                  <th>Section</th>
                  <th>Subject</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {schoolUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No members registered yet.</td>
                  </tr>
                ) : (
                  schoolUsers.map((mbr) => (
                    <tr key={mbr._id}>
                      <td><strong>{mbr.fullName}</strong></td>
                      <td>{mbr.email}</td>
                      <td>
                        <span className={`badge badge-role ${mbr.role}`}>
                          {mbr.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td>{mbr.classAssigned?.name || mbr.classAssigned || 'N/A'}</td>
                      <td>{mbr.sectionAssigned || 'N/A'}</td>
                      <td>{mbr.role === 'teacher' ? (mbr.subjects && mbr.subjects.length > 0 ? mbr.subjects.join(', ') : 'None') : 'N/A'}</td>
                      <td>
                        {(mbr.role === 'teacher' || mbr.role === 'parent') && (
                          <button
                            onClick={() => {
                              setSelectedUserForClassAssign(mbr);
                              const currentSubject = (mbr.subjects && mbr.subjects.length > 0) ? mbr.subjects[0] : '';
                              const isCustom = currentSubject && !['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Computer Science', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Economics', 'Physical Education', 'Art & Craft', 'Music'].includes(currentSubject);
                              setAssignClassForm({
                                classId: mbr.classAssigned?._id || mbr.classAssigned || '',
                                section: mbr.sectionAssigned || 'A',
                                subject: isCustom ? 'Custom Subject' : currentSubject,
                                customSubject: isCustom ? currentSubject : ''
                              });
                              setShowAssignClassModal(true);
                            }}
                            className="code-action-btn"
                            style={{ padding: '6px 12px', fontSize: '12px', margin: 0 }}
                          >
                            Assign Class
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Details Update Submissions Logs */}
          <div style={{ marginTop: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 className="dashboard-form-title" style={{ margin: 0 }}>Profile Details Update Logs</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Real-time list of parent profile update submissions sorted by latest submission time.
                </p>
              </div>
            </div>
            
            <div className="dashboard-table-container">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Parent Info</th>
                    <th>Father Details</th>
                    <th>Mother Details</th>
                    <th>Emergency Contact</th>
                    <th>Home Address / Coordinates</th>
                    <th>Last Updated (Edited At)</th>
                  </tr>
                </thead>
                <tbody>
                  {detailsSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>
                        No details update submissions logged yet.
                      </td>
                    </tr>
                  ) : (
                    detailsSubmissions.map((parent) => (
                      <tr key={parent._id}>
                        <td>
                          <strong>{parent.fullName}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{parent.email}</div>
                        </td>
                        <td>
                          {parent.fatherName ? (
                            <div>
                              <div>{parent.fatherName}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Phone: {parent.fatherPhone || 'N/A'}</div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Not Provided</span>
                          )}
                        </td>
                        <td>
                          {parent.motherName ? (
                            <div>
                              <div>{parent.motherName}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Phone: {parent.motherPhone || 'N/A'}</div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Not Provided</span>
                          )}
                        </td>
                        <td>
                          {parent.emergencyContact ? (
                            <span style={{ fontWeight: '600', color: 'var(--accent)' }}>
                              {parent.emergencyContact}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Not Provided</span>
                          )}
                        </td>
                        <td style={{ maxWidth: '200px', wordBreak: 'break-all' }}>
                          {parent.homeAddress ? (
                            <div style={{ fontSize: '12px' }}>
                              {parent.homeAddress}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Not Provided</span>
                          )}
                        </td>
                        <td style={{ fontSize: '12.5px' }}>
                          {parent.updatedAt ? (
                            <span style={{ color: '#34d399', fontWeight: '500' }}>
                              {new Date(parent.updatedAt).toLocaleString()}
                            </span>
                          ) : (
                            'N/A'
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'manage-fees' && (
        <div>
          <h3 className="dashboard-form-title">Manage Student Fee Statements</h3>
          <p style={{ fontSize: '14px', marginBottom: '16px' }}>
            List of student fee billing profiles. Click "Update Statement" to manage outstanding dues.
          </p>
          <div className="dashboard-table-container">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Class / Section</th>
                  <th>Total Due</th>
                  <th>Paid Amount</th>
                  <th>Pending Amount</th>
                  <th>Due Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {feesList.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No student fees found.</td>
                  </tr>
                ) : (
                  feesList.map((bill) => (
                    <tr key={bill.studentId}>
                      <td><strong>{bill.fullName}</strong></td>
                      <td>{bill.email}</td>
                      <td>{bill.class} {bill.section !== 'N/A' ? `(${bill.section})` : ''}</td>
                      <td>₹{bill.totalAmount.toLocaleString()}</td>
                      <td style={{ color: '#34d399' }}>₹{bill.paidAmount.toLocaleString()}</td>
                      <td style={{ color: bill.pendingAmount > 0 ? '#f87171' : 'var(--text-muted)' }}>
                        ₹{bill.pendingAmount.toLocaleString()}
                      </td>
                      <td>{bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <button 
                          onClick={() => handleOpenFeeModal(bill)} 
                          className="code-action-btn"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          Update Statement
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'diaries' && (
        <div>
          <h3 className="dashboard-form-title">Classroom Diaries Log</h3>
          <p style={{ fontSize: '14px', marginBottom: '16px' }}>
            View all homework diaries logged by teachers across classrooms.
          </p>
          <div className="dashboard-table-container">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Classroom</th>
                  <th>Section</th>
                  <th>Teacher</th>
                  <th>Homework Items</th>
                  <th>Classwork</th>
                  <th>Notice / Reminders</th>
                  <th>Date Logged</th>
                </tr>
              </thead>
              <tbody>
                {classDiaries.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No diaries posted yet.</td>
                  </tr>
                ) : (
                  classDiaries.map((d) => (
                    <tr key={d._id}>
                      <td><strong>{d.class ? d.class.name : 'Class ID ' + d.class}</strong></td>
                      <td>{d.section}</td>
                      <td>{d.teacher?.fullName}</td>
                      <td>{d.homework.length} subjects</td>
                      <td style={{ fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.classwork}
                      </td>
                      <td style={{ fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.notice || d.reminders || 'N/A'}
                      </td>
                      <td>{new Date(d.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'staff-attendance' && (
        <div className="vertical-stack">
          <WiFiConfigCard 
            schoolData={schoolDetails} 
            onUpdate={(updatedSchool) => setSchoolDetails(updatedSchool)} 
          />
          <div style={{ height: '24px' }}></div>
          <StaffAttendanceMonitoringLogs schoolId={user?.school} />
        </div>
      )}

      {activeTab === 'timetable' && (
        <ClassTimetableModule />
      )}

      {activeTab === 'class-requests' && (
        <ClassRequestsManagement />
      )}

      {activeTab === 'pre-students' && (
        <StudentDirectoryModule />
      )}

      {activeTab === 'attendance' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <SchoolAttendanceView user={user} />
        </div>
      )}

      {/* Assign Class Modal */}
      {showAssignClassModal && selectedUserForClassAssign && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <h3 className="dashboard-form-title">Assign Classroom</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Assign class and section to <strong>{selectedUserForClassAssign.fullName}</strong> ({selectedUserForClassAssign.role})
            </p>
            <form onSubmit={handleAssignClassSubmit}>
              <div className="form-group">
                <label className="form-label">Select Class *</label>
                <select
                  className="form-select"
                  value={assignClassForm.classId}
                  onChange={(e) => setAssignClassForm({ ...assignClassForm, classId: e.target.value })}
                >
                  <option value="">-- No Class (Unassign) --</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>{cls.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Section *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. A"
                  value={assignClassForm.section}
                  onChange={(e) => setAssignClassForm({ ...assignClassForm, section: e.target.value.toUpperCase() })}
                  required={!!assignClassForm.classId}
                />
              </div>

              {selectedUserForClassAssign.role === 'teacher' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Teaching Subject</label>
                    <select
                      className="form-select"
                      value={assignClassForm.subject}
                      onChange={(e) => setAssignClassForm({ ...assignClassForm, subject: e.target.value })}
                    >
                      <option value="">-- None --</option>
                      {['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Computer Science', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Economics', 'Physical Education', 'Art & Craft', 'Music'].map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                      <option value="Custom Subject">-- Custom Subject... --</option>
                    </select>
                  </div>

                  {assignClassForm.subject === 'Custom Subject' && (
                    <div className="form-group">
                      <label className="form-label">Custom Subject Name *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Sanskrit"
                        value={assignClassForm.customSubject}
                        onChange={(e) => setAssignClassForm({ ...assignClassForm, customSubject: e.target.value })}
                        required={assignClassForm.subject === 'Custom Subject'}
                      />
                    </div>
                  )}
                </>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowAssignClassModal(false)}
                  className="code-action-btn"
                  style={{ margin: 0 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="dashboard-btn-primary"
                  style={{ margin: 0 }}
                >
                  {loading ? 'Assigning...' : 'Assign Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fee Statement Update Modal */}
      {showFeeModal && selectedStudentFee && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content">
            <h3 className="dashboard-form-title">Update Billing Profile</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Student: <strong>{selectedStudentFee.fullName}</strong> ({selectedStudentFee.email})
            </p>

            <form onSubmit={handleUpdateFee}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Total Fee Amount (₹) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={feeUpdateForm.totalAmount}
                  onChange={(e) => setFeeUpdateForm({ ...feeUpdateForm, totalAmount: e.target.value })}
                  min={0}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Paid Balance (₹) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={feeUpdateForm.paidAmount}
                  onChange={(e) => setFeeUpdateForm({ ...feeUpdateForm, paidAmount: e.target.value })}
                  min={0}
                  max={feeUpdateForm.totalAmount}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Due Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={feeUpdateForm.dueDate}
                  onChange={(e) => setFeeUpdateForm({ ...feeUpdateForm, dueDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Office Phone Number *</label>
                <input
                  type="text"
                  className="form-input"
                  value={feeUpdateForm.officePhone}
                  onChange={(e) => setFeeUpdateForm({ ...feeUpdateForm, officePhone: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowFeeModal(false)} className="code-action-btn" style={{ padding: '10px 20px' }}>
                  Cancel
                </button>
                <button type="submit" className="dashboard-btn-primary" disabled={loading} style={{ margin: 0 }}>
                  {loading ? 'Saving Changes...' : 'Save Statement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Parent Reason Modal */}
      {showRejectionModal && rejectionModalParent && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <h3 className="dashboard-form-title">Reject Registration Request</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Specify the rejection reason for parent <strong>{rejectionModalParent.fullName}</strong>. They will see this reason on login.
            </p>
            <form onSubmit={handleRejectParentSubmit}>
              <div className="form-group">
                <label className="form-label">Reason *</label>
                <textarea
                  className="form-input"
                  placeholder="e.g. Incorrect child roll number or student directory mismatch."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                  style={{ height: '80px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowRejectionModal(false)}
                  className="code-action-btn"
                  style={{ margin: 0 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="logout-btn"
                  style={{ margin: 0, background: '#ef4444', borderColor: '#ef4444' }}
                >
                  {loading ? 'Rejecting...' : 'Reject Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ParentDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        parent={selectedDetailsParent}
        onApprove={handleApproveParent}
        onReject={handleRejectParentDirect}
        userRole="school_admin"
      />
      <LogoutConfirmationModal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
        onConfirm={confirmLogout} 
      />
      <BroadcastDetailsModal 
        isOpen={showBroadcastModal} 
        onClose={() => setShowBroadcastModal(false)} 
        onSubmit={handleBroadcastSubmit} 
        userRole="school_admin" 
      />
      {activeTab === 'schedules' && (
        <AdminSchedulesModule user={user} />
      )}
      {activeTab === 'calendar' && (
        <SchoolCalendarModule user={user} canEdit={true} />
      )}
      {activeTab === 'profile' && (
        <ProfileSettingsTab />
      )}
    </DashboardLayout>
  );
};

// -------------------------------------------------------------
// PRINCIPAL DASHBOARD
// -------------------------------------------------------------

export default SchoolAdminDashboard;

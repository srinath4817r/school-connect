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
import { DashboardLayout, API_URL, BroadcastDetailsModal, LogoutConfirmationModal, ProfileSettingsTab, AnimatedCounter } from './DashboardLayout';
import { ClassRequestsManagement, StudentDirectoryModule, SchoolAttendanceView, SchoolCalendarModule } from './DashboardModules';

export const SuperAdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('activeTab_super_admin') || 'overview');

  // Data states
  const [secretCodes, setSecretCodes] = useState([]);
  const [tempCodes, setTempCodes] = useState([]);
  const [schoolAdmins, setSchoolAdmins] = useState([]);
  const [schools, setSchools] = useState([]);
  const [students, setStudents] = useState([]);
  const [classRequests, setClassRequests] = useState([]);
  const [studentSchoolFilter, setStudentSchoolFilter] = useState('all');
  const [studentSortBy, setStudentSortBy] = useState('name_asc');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [superAdminSelectedSchool, setSuperAdminSelectedSchool] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState('');

  const handleBroadcastSubmit = async (role, message, schoolId) => {
    const res = await axios.post(`${API_URL}/notifications/push-update`, {
      role,
      message,
      schoolId: schoolId || undefined
    });
    if (res.data.status === 'success') {
      setSuccess(res.data.message);
      setTimeout(() => setSuccess(''), 4000);
    }
  };

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSchoolForEdit, setSelectedSchoolForEdit] = useState({ id: '', name: '', address: '', phone: '', wifiSSID: '' });
  
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateSchoolId, setDeactivateSchoolId] = useState('');
  const [deactivateSchoolName, setDeactivateSchoolName] = useState('');
  const [countdown, setCountdown] = useState(5);

  // Form states - School Admin registration
  const [adminForm, setAdminForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    schoolId: '',
    schoolName: '',
    schoolAddress: '',
    schoolPhone: '',
    createSchoolInstead: false
  });

  // Form states - School creation
  const [schoolForm, setSchoolForm] = useState({
    name: '',
    address: '',
    phone: ''
  });

  // Form states - Temp Invitation creation
  const [tempCodeForm, setTempCodeForm] = useState({
    role: 'parent',
    schoolId: '',
    isPermanent: false,
    durationHours: '24'
  });

  async function fetchInitialData(silent = false) {
    try {
      if (!silent) setLoading(true);
      setError('');
      
      const [codesRes, tempRes, adminsRes, schoolsRes, studentsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/secret-codes`),
        axios.get(`${API_URL}/admin/temp-codes`),
        axios.get(`${API_URL}/admin/school-admins`),
        axios.get(`${API_URL}/admin/schools`),
        axios.get(`${API_URL}/admin/students`)
      ]);

      if (codesRes.data.status === 'success') {
        setSecretCodes(codesRes.data.codes);
      }
      if (tempRes.data.status === 'success') {
        setTempCodes(tempRes.data.tempCodes);
      }
      if (adminsRes.data.status === 'success') {
        setSchoolAdmins(adminsRes.data.admins);
      }
      if (schoolsRes.data.status === 'success') {
        setSchools(schoolsRes.data.schools);
      }
      if (studentsRes.data.status === 'success') {
        setStudents(studentsRes.data.students);
      }

      // Safe fetch for class requests
      let classRequestsData = [];
      try {
        const classRequestsRes = await axios.get(`${API_URL}/schools/class-requests`);
        if (classRequestsRes.data.status === 'success') {
          classRequestsData = classRequestsRes.data.requests || [];
        }
      } catch (e) {
        console.warn("Failed to fetch class requests:", e);
      }
      setClassRequests(classRequestsData);

    } catch (err) {
      console.error(err);
      setError('Failed to fetch admin dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const pendingRequestsCount = classRequests.filter(r => r.status === 'pending').length;

  const getGreeting = () => {
    const hrs = new Date().getHours();
    const name = user?.fullName ? user.fullName.split(' ')[0].toUpperCase() : 'ADMIN';
    if (hrs < 12) return `Good Morning, ${name}`;
    if (hrs < 18) return `Good Afternoon, ${name}`;
    return `Good Evening, ${name}`;
  };

  const getCityState = (address) => {
    if (!address) return 'N/A';
    const parts = address.split(',');
    if (parts.length >= 2) {
      return parts.slice(-2).join(',').trim();
    }
    return address;
  };

  useEffect(() => {
    document.body.className = 'theme-super_admin';
    Promise.resolve().then(() => fetchInitialData());

    const interval = setInterval(() => {
      fetchInitialData(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Timer effect for deactivation safety countdown
  useEffect(() => {
    let timer;
    if (showDeactivateModal && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [showDeactivateModal, countdown]);

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = (allDevices = false) => {
    logout(allDevices);
    navigate('/login');
  };

  // Copy code to clipboard
  const handleCopyCode = (code, index) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDeleteTempCode = async (codeId) => {
    if (!window.confirm("Are you sure you want to delete this invitation code?")) return;
    try {
      const res = await axios.delete(`${API_URL}/admin/temp-codes/${codeId}`);
      if (res.data.status === 'success') {
        setSuccess('Invitation code deleted successfully!');
        setTempCodes(prev => prev.filter(c => c._id !== codeId));
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete invitation code');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Save updated secret code
  const handleSaveCode = async (role) => {
    if (!editValue.trim()) return;
    try {
      setError('');
      setSuccess('');
      const res = await axios.put(`${API_URL}/admin/secret-codes`, { role, code: editValue.trim() });
      if (res.data.status === 'success') {
        setSuccess(`Successfully updated ${role} secret code.`);
        setEditingIndex(null);
        setEditValue('');
        // Refresh codes
        const codesRes = await axios.get(`${API_URL}/admin/secret-codes`);
        if (codesRes.data.status === 'success') setSecretCodes(codesRes.data.codes);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update secret code');
    }
  };

  // Create school admin
  const handleRegisterSchoolAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const {
      fullName,
      email,
      password,
      confirmPassword,
      schoolId,
      schoolName,
      schoolAddress,
      schoolPhone,
      createSchoolInstead
    } = adminForm;

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all required user fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (createSchoolInstead) {
      if (!schoolName || !schoolAddress || !schoolPhone) {
        setError('Please fill in all school details to create a new school');
        return;
      }
    } else {
      if (!schoolId) {
        setError('Please select an existing school');
        return;
      }
    }

    try {
      setLoading(true);
      const payload = {
        fullName,
        email,
        password,
        confirmPassword,
        schoolId: createSchoolInstead ? undefined : schoolId,
        schoolName: createSchoolInstead ? schoolName : undefined,
        schoolAddress: createSchoolInstead ? schoolAddress : undefined,
        schoolPhone: createSchoolInstead ? schoolPhone : undefined
      };

      const res = await axios.post(`${API_URL}/admin/school-admins`, payload);
      if (res.data.status === 'success') {
        setSuccess('School Admin registered successfully.');
        setAdminForm({
          fullName: '',
          email: '',
          password: '',
          confirmPassword: '',
          schoolId: '',
          schoolName: '',
          schoolAddress: '',
          schoolPhone: '',
          createSchoolInstead: false
        });
        
        // Refresh lists
        const [adminsRes, schoolsRes] = await Promise.all([
          axios.get(`${API_URL}/admin/school-admins`),
          axios.get(`${API_URL}/admin/schools`)
        ]);
        if (adminsRes.data.status === 'success') setSchoolAdmins(adminsRes.data.admins);
        if (schoolsRes.data.status === 'success') setSchools(schoolsRes.data.schools);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register School Admin');
    } finally {
      setLoading(false);
    }
  };

  // Create school directly
  const handleCreateSchool = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { name, address, phone } = schoolForm;
    if (!name || !address || !phone) {
      setError('Please fill in all school fields');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/admin/schools`, schoolForm);
      if (res.data.status === 'success') {
        setSuccess('School profile created successfully.');
        setSchoolForm({ name: '', address: '', phone: '' });
        
        // Refresh schools
        const schoolsRes = await axios.get(`${API_URL}/admin/schools`);
        if (schoolsRes.data.status === 'success') setSchools(schoolsRes.data.schools);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create school');
    } finally {
      setLoading(false);
    }
  };

  // Trigger Edit Modal
  const handleOpenEditModal = (sch) => {
    setSelectedSchoolForEdit({
      id: sch._id,
      name: sch.name,
      address: sch.address,
      phone: sch.phone,
      wifiSSID: sch.wifiSSID || 'Greenwood_High_Staff_WiFi'
    });
    setShowEditModal(true);
  };

  // Submit School Edits
  const handleSaveEditSchool = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const { id, name, address, phone, wifiSSID } = selectedSchoolForEdit;
    if (!name || !address || !phone) {
      setError('Please fill in all fields to save edits');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.put(`${API_URL}/admin/schools/${id}`, { name, address, phone, wifiSSID });
      if (res.data.status === 'success') {
        setSuccess('School details updated successfully.');
        setShowEditModal(false);
        // Refresh schools
        const schoolsRes = await axios.get(`${API_URL}/admin/schools`);
        if (schoolsRes.data.status === 'success') setSchools(schoolsRes.data.schools);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update school details');
    } finally {
      setLoading(false);
    }
  };

  // Trigger Deactivation Countdown Modal
  const triggerDeactivateSchool = (id, name) => {
    setDeactivateSchoolId(id);
    setDeactivateSchoolName(name);
    setCountdown(5);
    setShowDeactivateModal(true);
  };

  // Finalize Deactivate Toggle Call
  const handleConfirmDeactivate = async () => {
    setShowDeactivateModal(false);
    try {
      setError('');
      setSuccess('');
      const res = await axios.put(`${API_URL}/admin/schools/${deactivateSchoolId}/toggle-active`);
      if (res.data.status === 'success') {
        setSuccess(res.data.message);
        // Refresh schools
        const schoolsRes = await axios.get(`${API_URL}/admin/schools`);
        if (schoolsRes.data.status === 'success') setSchools(schoolsRes.data.schools);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate school');
    }
  };

  // Direct Activate Toggle (no countdown needed for activating)
  const handleActivateSchool = async (id) => {
    try {
      setError('');
      setSuccess('');
      const res = await axios.put(`${API_URL}/admin/schools/${id}/toggle-active`);
      if (res.data.status === 'success') {
        setSuccess(res.data.message);
        // Refresh schools
        const schoolsRes = await axios.get(`${API_URL}/admin/schools`);
        if (schoolsRes.data.status === 'success') setSchools(schoolsRes.data.schools);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to activate school');
    }
  };

  // Toggle user (student/parent) active status
  const handleToggleStudentActive = async (studentId) => {
    try {
      setError('');
      setSuccess('');
      const res = await axios.put(`${API_URL}/admin/users/${studentId}/toggle-active`);
      if (res.data.status === 'success') {
        setSuccess(res.data.message);
        setTimeout(() => setSuccess(''), 4000);
        // Refresh students list
        const studentsRes = await axios.get(`${API_URL}/admin/students`);
        if (studentsRes.data.status === 'success') setStudents(studentsRes.data.students);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle student account status');
    }
  };

  // Generate Temporary invitation code
  const handleGenerateTempCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/admin/temp-codes`, {
        role: tempCodeForm.role,
        schoolId: tempCodeForm.schoolId || undefined,
        isPermanent: tempCodeForm.isPermanent,
        durationHours: tempCodeForm.isPermanent ? undefined : Number(tempCodeForm.durationHours)
      });
      if (res.data.status === 'success') {
        setSuccess(res.data.message || `Temporary code created: ${res.data.tempCode.code}`);
        setTempCodeForm({ role: 'parent', schoolId: '', isPermanent: false, durationHours: '24' });
        // Refresh temp codes
        const tempRes = await axios.get(`${API_URL}/admin/temp-codes`);
        if (tempRes.data.status === 'success') setTempCodes(tempRes.data.tempCodes);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate temporary code');
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedStudents = useMemo(() => {
    let result = [...students];

    // Filter by school
    if (studentSchoolFilter && studentSchoolFilter !== 'all') {
      result = result.filter(s => s.school && s.school._id === studentSchoolFilter);
    }

    // Filter by search query
    if (studentSearchQuery) {
      const q = studentSearchQuery.toLowerCase();
      result = result.filter(s => 
        s.fullName.toLowerCase().includes(q) || 
        s.email.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (studentSortBy === 'name_asc') {
        return a.fullName.localeCompare(b.fullName);
      }
      if (studentSortBy === 'name_desc') {
        return b.fullName.localeCompare(a.fullName);
      }
      if (studentSortBy === 'school_asc') {
        const nameA = a.school ? a.school.name : '';
        const nameB = b.school ? b.school.name : '';
        return nameA.localeCompare(nameB);
      }
      if (studentSortBy === 'school_desc') {
        const nameA = a.school ? a.school.name : '';
        const nameB = b.school ? b.school.name : '';
        return nameB.localeCompare(nameA);
      }
      if (studentSortBy === 'date_desc') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (studentSortBy === 'date_asc') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      return 0;
    });

    return result;
  }, [students, studentSchoolFilter, studentSearchQuery, studentSortBy]);

  const superAdminTabs = [
    { id: 'overview', label: 'Overview', icon: Compass },
    { id: 'class-requests', label: 'Class Requests', icon: Clock, badge: pendingRequestsCount > 0 ? pendingRequestsCount : null },
    { id: 'secret-codes', label: 'Secret Invite Codes', icon: Milestone },
    { id: 'temp-codes', label: 'Invitation Codes', icon: Milestone },
    { id: 'school-admins', label: 'School Administrators', icon: UserCheck },
    { id: 'schools', label: 'Schools Profiles', icon: Building },
    { id: 'students', label: 'Students Directory', icon: Users },
    { id: 'pre-students', label: 'Pre-Registration Directory', icon: GraduationCap },
    { id: 'attendance', label: 'School Attendance', icon: CheckSquare },
    { id: 'calendar', label: 'School Calendar', icon: Calendar },
    { id: 'profile', label: 'My Profile', icon: User }
  ];

  return (
    <DashboardLayout
      roleName="super_admin"
      user={user}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      tabs={superAdminTabs}
      handleLogout={() => setShowLogoutModal(true)}
    >
      {/* Notifications */}
      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      {/* Content Area */}
      {activeTab === 'overview' && (
        <div className="page-transition">
          {/* Greeting Banner */}
          <div 
            className="glass-card" 
            style={{ 
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
              padding: '32px',
              borderRadius: '20px',
              marginBottom: '32px',
              border: 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 10px 30px rgba(124, 58, 237, 0.3)'
            }}
          >
            <div>
              <h2 style={{ fontSize: '32px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>
                {getGreeting()}
              </h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '15px' }}>
                Here's what's happening today in the school connect system.
              </p>
            </div>
            <div style={{ textAlign: 'right', color: 'white', opacity: 0.9 }}>
              <div style={{ fontSize: '14px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Date</div>
              <div style={{ fontSize: '20px', fontWeight: '700', marginTop: '4px' }}>
                {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>

          {pendingRequestsCount > 0 && (
            <div className="glass-card" style={{ 
              padding: '16px 20px', 
              background: 'rgba(245, 158, 11, 0.1)', 
              border: '1px solid rgba(245, 158, 11, 0.25)', 
              borderRadius: '12px',
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              color: '#fbbf24'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={20} style={{ color: '#fbbf24' }} />
                <div>
                  <strong style={{ fontSize: '15px' }}>Pending Class Creation Requests</strong>
                  <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>
                    There are {pendingRequestsCount} class requests awaiting approval from school administration.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('class-requests')}
                className="code-action-btn"
                style={{ 
                  margin: 0, 
                  background: '#fbbf24', 
                  color: '#0F0F1A', 
                  fontWeight: '600', 
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px'
                }}
              >
                Review Requests
              </button>
            </div>
          )}

          {/* Stats Cards Row */}
          <div className="responsive-grid-4" style={{ gap: '24px', marginBottom: '32px' }}>
            {/* Card 1: Total Schools */}
            <div className="glass-card" style={{ padding: '28px', borderRadius: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Schools
                </span>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '14px', 
                  background: 'rgba(124, 58, 237, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-light)'
                }}>
                  <Building size={22} />
                </div>
              </div>
              <div style={{ fontSize: '36px', fontWeight: '800', color: 'white', fontFamily: 'var(--font-title)' }}>
                <AnimatedCounter value={schools.length} />
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Registered profiles
              </div>
            </div>

            {/* Card 2: School Admins */}
            <div className="glass-card" style={{ padding: '28px', borderRadius: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  School Admins
                </span>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '14px', 
                  background: 'rgba(59, 130, 246, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#60a5fa'
                }}>
                  <Users size={22} />
                </div>
              </div>
              <div style={{ fontSize: '36px', fontWeight: '800', color: 'white', fontFamily: 'var(--font-title)' }}>
                <AnimatedCounter value={schoolAdmins.length} />
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Managing schools
              </div>
            </div>

            {/* Card 3: Total Students */}
            <div className="glass-card" style={{ padding: '28px', borderRadius: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Students
                </span>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '14px', 
                  background: 'rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#34d399'
                }}>
                  <GraduationCap size={22} />
                </div>
              </div>
              <div style={{ fontSize: '36px', fontWeight: '800', color: 'white', fontFamily: 'var(--font-title)' }}>
                <AnimatedCounter value={students.length} />
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Enrolled students
              </div>
            </div>

            {/* Card 4: Pending Requests */}
            <div className="glass-card" style={{ padding: '28px', borderRadius: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Pending Requests
                </span>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '14px', 
                  background: 'rgba(245, 158, 11, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fbbf24',
                  position: 'relative'
                }}>
                  <Clock size={22} />
                  {pendingRequestsCount > 0 && (
                    <span className="live-pulse" style={{ 
                      position: 'absolute', 
                      top: '-2px', 
                      right: '-2px', 
                      width: '10px', 
                      height: '10px', 
                      background: 'var(--danger)',
                      boxShadow: '0 0 8px var(--danger)'
                    }} />
                  )}
                </div>
              </div>
              <div style={{ fontSize: '36px', fontWeight: '800', color: 'white', fontFamily: 'var(--font-title)' }}>
                <AnimatedCounter value={pendingRequestsCount} />
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Awaiting approval
              </div>
            </div>
          </div>

          {/* 2-Column Split Section */}
          <div className="responsive-grid-3-2" style={{ gap: '24px' }}>
            {/* Left Column: Recent Schools */}
            <div className="glass-card" style={{ padding: '28px', borderRadius: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'white' }}>Recent Schools</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>Latest additions to the portal</p>
                </div>
                <button 
                  onClick={() => setActiveTab('schools')} 
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: 'var(--primary-light)', 
                    fontSize: '13px', 
                    fontWeight: '600', 
                    cursor: 'pointer' 
                  }}
                >
                  View All
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {schools.slice(0, 5).map((school, index) => {
                  const initial = school.name ? school.name.charAt(0).toUpperCase() : 'S';
                  const isLast = index === Math.min(schools.length, 5) - 1;
                  // Dynamic colors for avatar background
                  const colors = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EC4899'];
                  const avatarColor = colors[index % colors.length];

                  return (
                    <div 
                      key={school._id || index}
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '16px 0',
                        borderBottom: isLast ? 'none' : '1px solid var(--border)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ 
                          width: '44px', 
                          height: '44px', 
                          borderRadius: '12px', 
                          background: `${avatarColor}20`, 
                          color: avatarColor,
                          border: `1px solid ${avatarColor}30`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '16px'
                        }}>
                          {initial}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', color: 'white', fontSize: '14px' }}>
                            {school.name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {getCityState(school.address)}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span className={`badge ${school.isActive ? 'badge-active' : 'badge-inactive'}`}>
                          {school.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {new Date(school.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {schools.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)' }}>
                    No registered schools profiles found.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Quick Actions & Status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Quick Actions Card */}
              <div className="glass-card" style={{ padding: '28px', borderRadius: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '20px' }}>Quick Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button 
                    onClick={() => setActiveTab('pre-students')}
                    className="auth-button" 
                    style={{ 
                      margin: 0, 
                      padding: '16px', 
                      borderRadius: '12px', 
                      background: 'rgba(124,58,237,0.1)', 
                      border: '1px solid rgba(124,58,237,0.2)',
                      color: 'var(--primary-light)',
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      fontWeight: '600',
                      textAlign: 'left'
                    }}
                  >
                    <GraduationCap size={18} />
                    <span>Approve Schools</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('secret-codes')}
                    className="auth-button" 
                    style={{ 
                      margin: 0, 
                      padding: '16px', 
                      borderRadius: '12px', 
                      background: 'rgba(59,130,246,0.1)', 
                      border: '1px solid rgba(59,130,246,0.2)',
                      color: '#60a5fa',
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      fontWeight: '600',
                      textAlign: 'left'
                    }}
                  >
                    <Milestone size={18} />
                    <span>Manage Codes</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('school-admins')}
                    className="auth-button" 
                    style={{ 
                      margin: 0, 
                      padding: '16px', 
                      borderRadius: '12px', 
                      background: 'rgba(16,185,129,0.1)', 
                      border: '1px solid rgba(16,185,129,0.2)',
                      color: '#34d399',
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      fontWeight: '600',
                      textAlign: 'left'
                    }}
                  >
                    <UserCheck size={18} />
                    <span>Add School Admin</span>
                  </button>

                  <button 
                    onClick={() => {
                      setSuccess('Announcement broadcast sent successfully!');
                      setTimeout(() => setSuccess(''), 3000);
                    }}
                    className="auth-button" 
                    style={{ 
                      margin: 0, 
                      padding: '16px', 
                      borderRadius: '12px', 
                      background: 'rgba(245,158,11,0.1)', 
                      border: '1px solid rgba(245,158,11,0.2)',
                      color: '#fbbf24',
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      fontWeight: '600',
                      textAlign: 'left'
                    }}
                  >
                    <ShieldAlert size={18} />
                    <span>Send Announcement</span>
                  </button>

                  <button 
                    onClick={() => setShowBroadcastModal(true)}
                    className="auth-button" 
                    style={{ 
                      margin: 0, 
                      padding: '16px', 
                      borderRadius: '12px', 
                      background: 'rgba(236,72,153,0.1)', 
                      border: '1px solid rgba(236,72,153,0.2)',
                      color: '#ec4899',
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      fontWeight: '600',
                      textAlign: 'left'
                    }}
                  >
                    <ShieldAlert size={18} />
                    <span>Request Details Update</span>
                  </button>
                </div>
              </div>

              {/* System Status Card */}
              <div className="glass-card" style={{ padding: '24px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span className="live-pulse" />
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'white' }}>System Status</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    All servers and school connect systems normal
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'class-requests' && (
        <div className="page-transition">
          <ClassRequestsManagement />
        </div>
      )}

      {activeTab === 'secret-codes' && (
        <div>
          <div className="secret-codes-grid">
            {secretCodes.map((item, idx) => (
              <div key={item._id || idx} className="glass-card code-card">
                <div className="code-card-header">
                  <span className="code-card-title">{item.role.replace('_', ' ')}</span>
                  <span className={`badge badge-role ${item.role}`}>Code</span>
                </div>
                
                <div className="code-display-group">
                  <div className="code-value">
                    <span>{item.code}</span>
                  </div>
                  <button onClick={() => handleCopyCode(item.code, idx)} className="code-action-btn">
                    {copiedIndex === idx ? 'Copied!' : 'Copy'}
                  </button>
                  <button onClick={() => { setEditingIndex(idx); setEditValue(item.code); }} className="code-action-btn">
                    Change
                  </button>
                </div>

                {editingIndex === idx && (
                  <div className="code-edit-form">
                    <input 
                      type="text" 
                      value={editValue} 
                      onChange={(e) => setEditValue(e.target.value)}
                      className="code-edit-input"
                      placeholder="Enter new code"
                    />
                    <button onClick={() => handleSaveCode(item.role)} className="code-save-btn">Save</button>
                    <button onClick={() => setEditingIndex(null)} className="code-action-btn">Cancel</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'temp-codes' && (
        <div className="responsive-grid-2-1">
          {/* List */}
          <div>
            <h3 className="dashboard-form-title">Active School Invitations</h3>
            <div className="dashboard-table-container">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Invite Code</th>
                    <th>Role</th>
                    <th>Associated School</th>
                    <th>Expiration / Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tempCodes.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No active invite codes.</td>
                    </tr>
                  ) : (
                    tempCodes.map((code) => {
                      let statusText = 'Permanent (Never Expires)';
                      let isExpired = false;
                      if (code.expiresAt) {
                        const diffMs = new Date(code.expiresAt) - new Date();
                        if (diffMs <= 0) {
                          statusText = 'Expired';
                          isExpired = true;
                        } else {
                          const diffHours = Math.floor(diffMs / 3600000);
                          const diffMins = Math.ceil((diffMs % 3600000) / 60000);
                          statusText = `Temporary (${diffHours > 0 ? `${diffHours}h ` : ''}${diffMins}m remaining)`;
                        }
                      }
                      return (
                        <tr key={code._id}>
                          <td><strong style={{ fontFamily: 'monospace', fontSize: '15px' }}>{code.code}</strong></td>
                          <td>
                            <span className={`badge badge-role ${code.role}`}>{code.role.replace('_', ' ')}</span>
                          </td>
                          <td>{code.school ? code.school.name : <span style={{ color: 'var(--text-muted)' }}>Global</span>}</td>
                          <td style={{ color: code.expiresAt ? (isExpired ? 'var(--danger)' : 'var(--text-secondary)') : 'var(--accent)' }}>
                            {statusText}
                          </td>
                          <td>
                            <button
                              onClick={() => handleDeleteTempCode(code._id)}
                              className="code-action-btn"
                              style={{ padding: '4px 8px', fontSize: '11px', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}
                              title="Delete Invite Code"
                            >
                              <Trash2 size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form */}
          <div className="dashboard-form-container">
            <h3 className="dashboard-form-title">Generate Invitation Code</h3>
            <form onSubmit={handleGenerateTempCode} className="dashboard-form">
              <div className="form-group">
                <label className="form-label">Role Target *</label>
                <select
                  className="form-select"
                  value={tempCodeForm.role}
                  onChange={(e) => setTempCodeForm({ ...tempCodeForm, role: e.target.value })}
                >
                  <option value="school_admin">School Admin</option>
                  <option value="principal">Principal</option>
                  <option value="teacher">Teacher</option>
                  <option value="parent">Parent (Student)</option>
                  <option value="driver">Driver</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Select School (Optional) *</label>
                <select
                  className="form-select"
                  value={tempCodeForm.schoolId}
                  onChange={(e) => setTempCodeForm({ ...tempCodeForm, schoolId: e.target.value })}
                >
                  <option value="">-- Global / No School --</option>
                  {schools.map((sch) => (
                    <option key={sch._id} value={sch._id}>{sch.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Lifespan / Duration *</label>
                <select
                  className="form-select"
                  value={tempCodeForm.isPermanent ? 'permanent' : tempCodeForm.durationHours}
                  onChange={(e) => {
                    if (e.target.value === 'permanent') {
                      setTempCodeForm({ ...tempCodeForm, isPermanent: true });
                    } else {
                      setTempCodeForm({ ...tempCodeForm, isPermanent: false, durationHours: e.target.value });
                    }
                  }}
                >
                  <option value="1">1 Hour</option>
                  <option value="24">24 Hours</option>
                  <option value="permanent">Permanent (Never Expires)</option>
                </select>
              </div>

              <button type="submit" disabled={loading} className="dashboard-btn-primary" style={{ width: '100%' }}>
                {loading ? 'Generating...' : 'Generate Invite Code'}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'school-admins' && (
        <div className={schools.length > 0 ? "responsive-grid-2-1" : "vertical-stack"}>
          {/* List */}
          <div>
            <h3 className="dashboard-form-title">Registered School Admins</h3>
            <div className="dashboard-table-container">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Email Address</th>
                    <th>Associated School</th>
                  </tr>
                </thead>
                <tbody>
                  {schoolAdmins.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No School Admins registered.</td>
                    </tr>
                  ) : (
                    schoolAdmins.map((adm) => (
                      <tr key={adm._id}>
                        <td>{adm.fullName}</td>
                        <td>{adm.email}</td>
                        <td>
                          {adm.school ? (
                            <span>{adm.school.name} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({adm.school.address})</span></span>
                          ) : (
                            <span style={{ color: 'var(--danger)' }}>None / Deleted</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form */}
          <div className="dashboard-form-container">
            <h3 className="dashboard-form-title">Register School Admin</h3>
            <form onSubmit={handleRegisterSchoolAdmin} className="dashboard-form">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Full Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="John Admin" 
                  value={adminForm.fullName}
                  onChange={(e) => setAdminForm({ ...adminForm, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email Address *</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="john@school.com" 
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Password *</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="••••••••" 
                    value={adminForm.password}
                    onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Confirm *</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="••••••••" 
                    value={adminForm.confirmPassword}
                    onChange={(e) => setAdminForm({ ...adminForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
                <input 
                  type="checkbox" 
                  id="createSchool"
                  checked={adminForm.createSchoolInstead}
                  onChange={(e) => setAdminForm({ ...adminForm, createSchoolInstead: e.target.checked })}
                />
                <label htmlFor="createSchool" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
                  Create New School Profile Instead
                </label>
              </div>

              {adminForm.createSchoolInstead ? (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', marginTop: '4px' }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '10px' }}>New School Details</p>
                  
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">School Name *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Oakridge School" 
                      value={adminForm.schoolName}
                      onChange={(e) => setAdminForm({ ...adminForm, schoolName: e.target.value })}
                    />
                  </div>
                  <div className="form-row-2">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Address *</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="123 Street Lane" 
                        value={adminForm.schoolAddress}
                        onChange={(e) => setAdminForm({ ...adminForm, schoolAddress: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Phone *</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="9876543210" 
                        value={adminForm.schoolPhone}
                        onChange={(e) => setAdminForm({ ...adminForm, schoolPhone: e.target.value.replace(/\D/g, '') })}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Select School *</label>
                  <select 
                    className="form-select"
                    value={adminForm.schoolId}
                    onChange={(e) => setAdminForm({ ...adminForm, schoolId: e.target.value })}
                  >
                    <option value="">-- Choose School --</option>
                    {schools.map((sch) => (
                      <option key={sch._id} value={sch._id}>{sch.name} ({sch.address})</option>
                    ))}
                  </select>
                </div>
              )}

              <button type="submit" disabled={loading} className="dashboard-btn-primary" style={{ width: '100%' }}>
                {loading ? 'Creating...' : 'Register School Admin'}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'schools' && (
        <div className="responsive-grid-2_5-1">
          {/* List */}
          <div>
            <h3 className="dashboard-form-title">Active & Inactive Schools</h3>
            <div className="dashboard-table-container">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>School Info & Duration</th>
                    <th>Contact Details</th>
                    <th>Students</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schools.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No schools created.</td>
                    </tr>
                  ) : (
                    schools.map((sch) => (
                      <tr key={sch._id}>
                        <td>
                          <strong>{sch.name}</strong>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {getActiveDurationText(sch.createdAt)}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '13px' }}>{sch.address}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{sch.phone}</div>
                        </td>
                        <td>
                          <span className="badge badge-role parent" style={{ fontWeight: '600' }}>
                            {sch.studentsCount || 0} Students
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${sch.isActive ? 'badge-active' : 'badge-inactive'}`}>
                            {sch.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              onClick={() => handleOpenEditModal(sch)} 
                              className="code-action-btn"
                              style={{ padding: '6px 12px', borderRadius: '20px' }}
                            >
                              Edit
                            </button>
                            
                            {sch.isActive ? (
                              <button 
                                onClick={() => triggerDeactivateSchool(sch._id, sch.name)}
                                className="toggle-btn toggle-btn-inactive"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleActivateSchool(sch._id)}
                                className="toggle-btn toggle-btn-active"
                              >
                                Activate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form */}
          <div className="dashboard-form-container">
            <h3 className="dashboard-form-title">Create School Profile</h3>
            <form onSubmit={handleCreateSchool} className="dashboard-form">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">School Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Greenwood High" 
                  value={schoolForm.name}
                  onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">School Address *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="123 Education Lane" 
                  value={schoolForm.address}
                  onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">School Phone *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="+91 XXXXXXXXXX" 
                  value={schoolForm.phone}
                  onChange={(e) => setSchoolForm({ ...schoolForm, phone: e.target.value.replace(/\D/g, '') })}
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="dashboard-btn-primary" style={{ width: '100%' }}>
                {loading ? 'Creating...' : 'Create School'}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'students' && (
        <div>
          <h3 className="dashboard-form-title">Registered Students & Parents Directory</h3>
          
          {/* Filters, Sorting, and Search */}
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            marginBottom: '20px', 
            flexWrap: 'wrap', 
            background: 'var(--card-bg)', 
            padding: '20px', 
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)' 
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '220px', flex: 1 }}>
              <label className="form-label" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Filter by School</label>
              <select 
                className="form-select"
                value={studentSchoolFilter}
                onChange={(e) => setStudentSchoolFilter(e.target.value)}
                style={{ width: '100%', height: '40px', padding: '0 12px' }}
              >
                <option value="all">All Schools</option>
                {schools.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '200px', flex: 1 }}>
              <label className="form-label" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Sort By</label>
              <select 
                className="form-select"
                value={studentSortBy}
                onChange={(e) => setStudentSortBy(e.target.value)}
                style={{ width: '100%', height: '40px', padding: '0 12px' }}
              >
                <option value="name_asc">Student Name (A-Z)</option>
                <option value="name_desc">Student Name (Z-A)</option>
                <option value="school_asc">School Name (A-Z)</option>
                <option value="school_desc">School Name (Z-A)</option>
                <option value="date_desc">Newest Registered</option>
                <option value="date_asc">Oldest Registered</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '240px', flex: 2 }}>
              <label className="form-label" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Search Student (Name or Email)</label>
              <input 
                type="text"
                placeholder="Search students..."
                className="form-input"
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                style={{ width: '100%', height: '40px', padding: '0 12px' }}
              />
            </div>
          </div>

          <div className="dashboard-table-container">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Student (Parent) Name</th>
                  <th>Email Address</th>
                  <th>Associated School</th>
                  <th>Registered On</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedStudents.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No matching students found in the directory.</td>
                  </tr>
                ) : (
                  filteredAndSortedStudents.map((student) => (
                    <tr key={student._id}>
                      <td><strong>{student.fullName}</strong></td>
                      <td>{student.email}</td>
                      <td>
                        {student.school ? (
                          <span>{student.school.name} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({student.school.address})</span></span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>None</span>
                        )}
                      </td>
                      <td>{new Date(student.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${student.isActive !== false ? 'badge-active' : 'badge-inactive'}`}>
                          {student.isActive !== false ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td>
                        <button 
                          onClick={() => handleToggleStudentActive(student._id)}
                          className="logout-btn"
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            background: student.isActive !== false ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: student.isActive !== false ? '#f87171' : '#34d399',
                            borderColor: student.isActive !== false ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                            marginTop: 0
                          }}
                        >
                          {student.isActive !== false ? 'Deactivate' : 'Activate'}
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

      {activeTab === 'pre-students' && (
        <div className="vertical-stack" style={{ gap: '20px' }}>
          <div className="glass-card" style={{ padding: '20px' }}>
            <label className="form-label">Select School to Manage Directory *</label>
            <select
              className="form-select"
              value={superAdminSelectedSchool}
              onChange={(e) => setSuperAdminSelectedSchool(e.target.value)}
              style={{ maxWidth: '400px' }}
            >
              <option value="">-- Choose School --</option>
              {schools.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
          {superAdminSelectedSchool && (
            <StudentDirectoryModule defaultSchoolId={superAdminSelectedSchool} />
          )}
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <SchoolAttendanceView user={user} schools={schools} />
        </div>
      )}

      {/* ========================================== */}
      {/* EDIT SCHOOL MODAL */}
      {/* ========================================== */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="dashboard-form-title">Edit School Profile</h3>
            <form onSubmit={handleSaveEditSchool}>
              <div className="form-group">
                <label className="form-label">School Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={selectedSchoolForEdit.name}
                  onChange={(e) => setSelectedSchoolForEdit({ ...selectedSchoolForEdit, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Address *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={selectedSchoolForEdit.address}
                  onChange={(e) => setSelectedSchoolForEdit({ ...selectedSchoolForEdit, address: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={selectedSchoolForEdit.phone}
                  onChange={(e) => setSelectedSchoolForEdit({ ...selectedSchoolForEdit, phone: e.target.value.replace(/\D/g, '') })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Authorized WiFi SSID *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={selectedSchoolForEdit.wifiSSID}
                    onChange={(e) => setSelectedSchoolForEdit({ ...selectedSchoolForEdit, wifiSSID: e.target.value })}
                    placeholder="e.g. Greenwood_High_Staff_WiFi"
                    required
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await axios.get(`${API_URL}/schools/detect-wifi`);
                        if (res.data.status === 'success') {
                          setSelectedSchoolForEdit({ ...selectedSchoolForEdit, wifiSSID: res.data.ssid });
                        }
                      } catch (err) {
                        const detected = detectCurrentWifi(selectedSchoolForEdit.name);
                        setSelectedSchoolForEdit({ ...selectedSchoolForEdit, wifiSSID: detected });
                      }
                    }}
                    className="code-action-btn"
                    style={{ margin: 0, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                    title="Auto-detect WiFi"
                  >
                    <RefreshCw size={14} /> Auto-Detect
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" disabled={loading} className="dashboard-btn-primary">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setShowEditModal(false)} className="logout-btn" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* DEACTIVATE SAFETY TIMER MODAL */}
      {/* ========================================== */}
      {showDeactivateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ border: '1px solid rgba(239, 68, 68, 0.4)' }}>
            <h3 className="dashboard-form-title" style={{ color: 'var(--danger)' }}>Confirm School Deactivation</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
              Are you absolutely sure you want to deactivate <strong>{deactivateSchoolName}</strong>? 
              All teachers, principals, and parent portal access associated with this school will be suspended immediately.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button" 
                onClick={handleConfirmDeactivate} 
                disabled={countdown > 0} 
                className="logout-btn"
                style={{ 
                  flex: 1, 
                  background: countdown > 0 ? 'rgba(239, 68, 68, 0.05)' : '#ef4444', 
                  color: countdown > 0 ? 'var(--text-muted)' : '#fff',
                  borderColor: countdown > 0 ? 'var(--border)' : '#ef4444',
                  cursor: countdown > 0 ? 'not-allowed' : 'pointer'
                }}
              >
                {countdown > 0 ? `Confirm in ${countdown}s...` : 'Confirm Deactivation'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowDeactivateModal(false)} 
                className="code-action-btn"
                style={{ flex: 1, background: 'transparent' }}
              >
                Cancel / Keep Active
              </button>
            </div>
          </div>
        </div>
      )}
      <LogoutConfirmationModal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
        onConfirm={confirmLogout} 
      />
      <BroadcastDetailsModal 
        isOpen={showBroadcastModal} 
        onClose={() => setShowBroadcastModal(false)} 
        onSubmit={handleBroadcastSubmit} 
        userRole="super_admin" 
        schools={schools} 
      />
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
// SCHOOL ADMIN DASHBOARD
// -------------------------------------------------------------

export default SuperAdminDashboard;

import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, saveUserToLocalStorage } from '../context/AuthContext';
import { Menu, MoreHorizontal, Users, UserCheck, ShieldAlert, Building, Phone, MapPin, GraduationCap, Bus, Play, Square, Compass, RefreshCw, Milestone, Navigation, BookOpen, Image, Calendar, Award, DollarSign, CheckSquare, Trash2, Camera, Clock, LogOut, AlertTriangle, CheckCircle, RefreshCcw, Edit2, X, Save, Plus, School, Upload, Bell, Wifi, User, Lock, Unlock, Key, Mail, MailOpen } from 'lucide-react';
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
import './Dashboard.css';
import SplashScreen from '../components/SplashScreen';

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

const API_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const addSatelliteHybridLayers = (map) => {
  const L = window.L;
  if (!L) return;
  
  // Satellite Base Layer
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  }).addTo(map);

  // Roads & Street Labels overlay
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri'
  }).addTo(map);

  // Place names, boundaries and labels overlay
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri'
  }).addTo(map);
};

const filterRecentThreeMonths = (logs) => {
  const threeMonthsAgo = Date.now() - (90 * 24 * 60 * 60 * 1000); // 90 days
  return logs.filter(log => {
    const timestamp = Number(log.id);
    return !isNaN(timestamp) && timestamp >= threeMonthsAgo;
  });
};

const AnimatedCounter = ({ value, duration = 1500 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value, 10);
    if (isNaN(end) || end === 0) {
      setCount(value || 0);
      return;
    }
    
    const totalTicks = 60;
    const increment = end / totalTicks;
    const intervalTime = duration / totalTicks;
    let tick = 0;

    const timer = setInterval(() => {
      tick++;
      start += increment;
      if (tick >= totalTicks) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count}</span>;
};

const DashboardPlaceholder = ({ roleName }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-welcome">
          <h1>{roleName} Dashboard</h1>
          <p>Welcome back, <strong>{user?.fullName}</strong> ({user?.email})!</p>
        </div>
        <button onClick={handleLogout} className="logout-icon-btn" title="Logout">
          <LogOut size={20} />
        </button>
      </div>

      <div className="glass-card" style={{ padding: '30px' }}>
        <div style={{ 
          background: 'rgba(0, 0, 0, 0.2)', 
          padding: '16px', 
          borderRadius: '8px', 
          fontFamily: 'monospace',
          fontSize: '14px',
          border: '1px solid var(--border)'
        }}>
          <strong>Role:</strong> {user?.role}<br/>
          <strong>School ID:</strong> {user?.school || 'None (Super Admin)'}<br/>
          {user?.classAssigned && <><strong>Class ID:</strong> {user.classAssigned}<br/></>}
          {user?.sectionAssigned && <><strong>Section:</strong> {user.sectionAssigned}<br/></>}
        </div>
      </div>
    </div>
  );
};

const LogoutConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  const [seconds, setSeconds] = useState(5);

  useEffect(() => {
    if (!isOpen) return;
    setSeconds(5);
    const timer = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 15, 26, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.2s ease'
    }}>
      <div className="glass-card" style={{
        width: '400px',
        padding: '30px',
        textAlign: 'center',
        border: '1px solid var(--border)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto'
        }}>
          <AlertTriangle size={30} />
        </div>
        <h3 style={{ marginBottom: '10px', fontSize: '20px', fontFamily: 'var(--font-title)' }}>Confirm Logout</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
          Are you sure you want to log out of your School Connect session?
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button 
            onClick={onClose} 
            className="code-action-btn"
            style={{ margin: 0, flex: 1, padding: '12px' }}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            disabled={seconds > 0}
            className="logout-btn"
            style={{ 
              margin: 0, 
              flex: 1, 
              padding: '12px',
              opacity: seconds > 0 ? 0.5 : 1,
              cursor: seconds > 0 ? 'not-allowed' : 'pointer',
              background: seconds > 0 ? '#4b5563' : '#ef4444',
              borderColor: seconds > 0 ? '#4b5563' : '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            {seconds > 0 ? `Yes (${seconds}s)` : 'Yes, Logout'}
          </button>
        </div>
      </div>
    </div>
  );
};

const BroadcastDetailsModal = ({ isOpen, onClose, onSubmit, userRole, schools = [] }) => {
  const [targetRole, setTargetRole] = useState('parent');
  const [message, setMessage] = useState('Please update your profile details immediately so we have your latest contact and role records.');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(targetRole, message, selectedSchoolId);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send broadcast request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 15, 26, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.2s ease'
    }}>
      <div className="glass-card" style={{
        width: '500px',
        padding: '30px',
        border: '1px solid var(--border)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '20px', fontFamily: 'var(--font-title)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📢</span> Broadcast Details Request
          </h3>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/8 text-[#94A3B8] hover:text-white transition-all cursor-pointer"
            style={{ background: 'none', border: 'none' }}
          >
            <X size={18} />
          </button>
        </div>

        {error && <div className="error-banner" style={{ marginBottom: '16px' }}>{error}</div>}

        <form onSubmit={handleSubmit} className="dashboard-form" style={{ background: 'transparent', border: 'none', padding: 0 }}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Target Role Group</label>
            <select 
              className="form-select" 
              value={targetRole} 
              onChange={(e) => setTargetRole(e.target.value)}
              required
            >
              <option value="parent">👨‍👩‍👧 Parents</option>
              <option value="teacher">👩‍🏫 Teachers</option>
              <option value="driver">🚌 Drivers</option>
              <option value="staff">💼 Other Staff</option>
            </select>
          </div>

          {userRole === 'super_admin' && (
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Target School (Optional)</label>
              <select 
                className="form-select" 
                value={selectedSchoolId} 
                onChange={(e) => setSelectedSchoolId(e.target.value)}
              >
                <option value="">Global Broadcast (All Schools)</option>
                {schools.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Message / Instructions</label>
            <textarea 
              className="form-input" 
              rows={3} 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              placeholder="Enter instructions for profile updates..."
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button 
              type="button"
              onClick={onClose} 
              className="code-action-btn"
              style={{ margin: 0, padding: '10px 20px' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className="dashboard-btn-primary"
              style={{ margin: 0, padding: '10px 20px' }}
            >
              {submitting ? 'Sending Request...' : 'Send Broadcast'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const GlobalNotificationPopupManager = ({ user, setActiveTab }) => {
  const { setUser } = useContext(AuthContext);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState('');
  const [profileData, setProfileData] = useState({
    fatherName: '',
    motherName: '',
    fatherPhone: '',
    motherPhone: '',
    emergencyContact: '',
    homeAddress: '',
    vehicleNumber: '',
    licenseNumber: '',
    phone: '',
    fullName: '',
    primaryClass: '',
    primarySection: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchNotifications = async (isManual = false) => {
    if (!user) return;
    try {
      const res = await axios.get(`${API_URL}/notifications`);
      if (res.data.status === 'success') {
        const active = res.data.notifications || [];
        const found = active.find(n => n.type === 'retake_attendance' || n.type === 'update_details' || n.type === 'general');
        if (found) {
          setCurrentNotification(found);
          setProfilePhoto(user.profilePhoto || '');
          setPreviewPhoto(user.profilePhoto || '');
          setProfileData({
            fatherName: user.fatherName || '',
            motherName: user.motherName || '',
            fatherPhone: user.fatherPhone || '',
            motherPhone: user.motherPhone || '',
            emergencyContact: user.emergencyContact || '',
            homeAddress: user.homeAddress || '',
            vehicleNumber: user.vehicleNumber || '',
            licenseNumber: user.licenseNumber || '',
            phone: user.phone || user.phoneNumber || '',
            fullName: user.fullName || '',
            primaryClass: user.primaryClass || '',
            primarySection: user.primarySection || ''
          });
        } else {
          setCurrentNotification(null);
          if (isManual === true) {
            alert('No new notifications.');
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);

    const handleManualCheck = () => {
      fetchNotifications(true);
    };
    window.addEventListener('checkNotificationsManual', handleManualCheck);

    return () => {
      clearInterval(interval);
      window.removeEventListener('checkNotificationsManual', handleManualCheck);
    };
  }, [user]);

  if (!currentNotification) return null;

  const markAsRead = async () => {
    try {
      await axios.post(`${API_URL}/notifications/mark-read/${currentNotification._id}`);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleRetakeRedirect = () => {
    markAsRead();
    if (setActiveTab) {
      setActiveTab('attendance');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewPhoto(reader.result);
      setProfilePhoto(reader.result); // Base64 Data URI
    };
    reader.readAsDataURL(file);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const payload = {};
      if (profilePhoto && profilePhoto.startsWith('data:image')) {
        payload.profilePhoto = profilePhoto;
      }
      if (user.role === 'parent') {
        payload.fatherName = profileData.fatherName;
        payload.motherName = profileData.motherName;
        payload.fatherPhone = profileData.fatherPhone;
        payload.motherPhone = profileData.motherPhone;
        payload.emergencyContact = profileData.emergencyContact;
        payload.homeAddress = profileData.homeAddress;
      } else if (user.role === 'driver') {
        payload.vehicleNumber = profileData.vehicleNumber;
        payload.licenseNumber = profileData.licenseNumber;
        payload.phone = profileData.phone;
      } else if (user.role === 'teacher') {
        payload.fullName = profileData.fullName;
        payload.primaryClass = profileData.primaryClass;
        payload.primarySection = profileData.primarySection;
      }
      
      const res = await axios.put(`${API_URL}/auth/update-profile`, payload);
      if (res.data.status === 'success') {
        setUser(res.data.user);
        saveUserToLocalStorage(res.data.user);
        await markAsRead();
        setSuccess('Profile updated successfully!');
        setTimeout(() => {
          setSuccess('');
          setCurrentNotification(null);
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 15, 26, 0.9)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      animation: 'fadeIn 0.2s ease'
    }}>
      <div className="glass-card" style={{
        width: '90%',
        maxWidth: '500px',
        padding: '30px 20px',
        border: '1px solid var(--border)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
        animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {currentNotification.type === 'general' ? (
          <div>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(168, 85, 247, 0.1)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}>
              <Bell size={30} className="animate-pulse" />
            </div>
            <h3 style={{ marginBottom: '10px', fontSize: '20px', fontFamily: 'var(--font-title)', textAlign: 'center', color: 'white' }}>
              Notification Alert
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', marginBottom: '24px', textAlign: 'center', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {currentNotification.message}
            </p>
            <button 
              onClick={markAsRead} 
              className="dashboard-btn-primary"
              style={{ margin: 0, width: '100%', padding: '12px', background: 'var(--accent)', borderColor: 'var(--accent)', fontWeight: 'bold' }}
            >
              Dismiss / Mark as Read
            </button>
          </div>
        ) : currentNotification.type === 'retake_attendance' ? (
          <div>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}>
              <AlertTriangle size={30} />
            </div>
            <h3 style={{ marginBottom: '10px', fontSize: '20px', fontFamily: 'var(--font-title)', textAlign: 'center' }}>
              Attendance Retake Required
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>
              {currentNotification.message || 'An administrator or principal has requested you to retake attendance.'}
            </p>
            
            {currentNotification.metadata && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '24px',
                fontSize: '13px'
              }}>
                <strong>Shift:</strong> {currentNotification.metadata.shift || 'Morning'}<br/>
                <strong>Date:</strong> {currentNotification.metadata.date ? new Date(currentNotification.metadata.date).toLocaleDateString() : 'Today'}
              </div>
            )}

            <button 
              onClick={handleRetakeRedirect} 
              className="dashboard-btn-primary"
              style={{ margin: 0, width: '100%', padding: '12px' }}
            >
              🔄 Go and Retake Attendance
            </button>
          </div>
        ) : (
          <div>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}>
              <ShieldAlert size={30} />
            </div>
            <h3 style={{ marginBottom: '10px', fontSize: '20px', fontFamily: 'var(--font-title)', textAlign: 'center' }}>
              Profile Details Update Required
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>
              {currentNotification.message || 'Please update your details to keep our system records accurate.'}
            </p>

            {error && <div className="error-banner" style={{ marginBottom: '16px' }}>{error}</div>}
            {success && <div className="success-banner" style={{ marginBottom: '16px' }}>{success}</div>}

            <form onSubmit={handleProfileUpdate} className="dashboard-form" style={{ background: 'transparent', border: 'none', padding: 0 }}>
              
              {/* Profile Photo Uploader */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px', gap: '10px' }}>
                <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                  {previewPhoto ? (
                    <img 
                      src={previewPhoto} 
                      alt="Profile Preview" 
                      style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }} 
                    />
                  ) : (
                    <div style={{ 
                      width: '80px', 
                      height: '80px', 
                      borderRadius: '50%', 
                      background: 'rgba(255, 255, 255, 0.05)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      border: '1px dashed var(--border)'
                    }}>
                      <span style={{ fontSize: '24px' }}>👤</span>
                    </div>
                  )}
                </div>
                <label style={{
                  padding: '6px 12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  transition: 'all 0.2s'
                }}>
                  📷 Change Profile Picture
                  <input 
                    type="file" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {user.role === 'parent' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Father's Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={profileData.fatherName} 
                      onChange={(e) => setProfileData({ ...profileData, fatherName: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Mother's Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={profileData.motherName} 
                      onChange={(e) => setProfileData({ ...profileData, motherName: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Father's Phone Number</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={profileData.fatherPhone} 
                      onChange={(e) => setProfileData({ ...profileData, fatherPhone: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Mother's Phone Number</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={profileData.motherPhone} 
                      onChange={(e) => setProfileData({ ...profileData, motherPhone: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Emergency Contact Number</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={profileData.emergencyContact} 
                      onChange={(e) => setProfileData({ ...profileData, emergencyContact: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Home Address</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={profileData.homeAddress} 
                      onChange={(e) => setProfileData({ ...profileData, homeAddress: e.target.value })} 
                      required 
                    />
                  </div>
                </div>
              )}

              {user.role === 'driver' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Vehicle Number</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={profileData.vehicleNumber} 
                      onChange={(e) => setProfileData({ ...profileData, vehicleNumber: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">License Number</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={profileData.licenseNumber} 
                      onChange={(e) => setProfileData({ ...profileData, licenseNumber: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Phone Number</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={profileData.phone} 
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} 
                      required 
                    />
                  </div>
                </div>
              )}

              {user.role === 'teacher' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Full Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={profileData.fullName} 
                      onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Primary Class Assigned</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={profileData.primaryClass} 
                      onChange={(e) => setProfileData({ ...profileData, primaryClass: e.target.value })} 
                      placeholder="e.g. 5"
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Primary Section Assigned</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={profileData.primarySection} 
                      onChange={(e) => setProfileData({ ...profileData, primarySection: e.target.value })} 
                      placeholder="e.g. A"
                      required 
                    />
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="dashboard-btn-primary"
                style={{ margin: 0, width: '100%', padding: '12px' }}
              >
                {loading ? 'Saving Details...' : 'Save & Update Profile'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};


// =============================================================
// MY PROFILE SETTINGS TAB MODULE
// =============================================================
const ProfileSettingsTab = () => {
  const { user, setUser } = useContext(AuthContext);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || '');
  const [previewPhoto, setPreviewPhoto] = useState(user?.profilePhoto || '');
  
  // Role-specific fields
  const [fatherName, setFatherName] = useState(user?.fatherName || '');
  const [motherName, setMotherName] = useState(user?.motherName || '');
  const [fatherPhone, setFatherPhone] = useState(user?.fatherPhone || '');
  const [motherPhone, setMotherPhone] = useState(user?.motherPhone || '');
  const [emergencyContact, setEmergencyContact] = useState(user?.emergencyContact || '');
  const [homeAddress, setHomeAddress] = useState(user?.homeAddress || '');
  const [vehicleNumber, setVehicleNumber] = useState(user?.vehicleNumber || '');
  const [licenseNumber, setLicenseNumber] = useState(user?.licenseNumber || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [primaryClass, setPrimaryClass] = useState(user?.primaryClass || '');
  const [primarySection, setPrimarySection] = useState(user?.primarySection || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Profile photo size must be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewPhoto(reader.result);
      setProfilePhoto(reader.result); // Base64 Data URI
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const payload = { fullName };
      if (profilePhoto && profilePhoto.startsWith('data:image')) {
        payload.profilePhoto = profilePhoto;
        payload.profilePhotoUrl = profilePhoto;
      }
      
      if (user.role === 'parent') {
        payload.fatherName = fatherName;
        payload.motherName = motherName;
        payload.fatherPhone = fatherPhone;
        payload.motherPhone = motherPhone;
        payload.emergencyContact = emergencyContact;
        payload.homeAddress = homeAddress;
      } else if (user.role === 'driver') {
        payload.vehicleNumber = vehicleNumber;
        payload.licenseNumber = licenseNumber;
        payload.phone = phone;
      } else if (user.role === 'teacher') {
        payload.primaryClass = primaryClass;
        payload.primarySection = primarySection;
      }

      const res = await axios.put(`${API_URL}/auth/update-profile`, payload);
      if (res.data.status === 'success') {
        setSuccess('Profile photo updated! ✅');
        setUser(res.data.user);
        saveUserToLocalStorage(res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '30px', maxWidth: '700px', margin: '0 auto' }}>
      <h3 style={{ marginBottom: '24px', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>👤</span> My Profile Settings
      </h3>
      
      {error && <div className="error-banner" style={{ marginBottom: '16px' }}>{error}</div>}
      {success && <div className="success-banner" style={{ marginBottom: '16px' }}>{success}</div>}

      <form onSubmit={handleSaveProfile} className="dashboard-form" style={{ background: 'transparent', border: 'none', padding: 0 }}>
        {/* Photo Upload Area */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', gap: '10px' }}>
          <div style={{ position: 'relative', width: '100px', height: '100px' }}>
            {previewPhoto ? (
              <img 
                src={previewPhoto} 
                alt="Profile Preview" 
                style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }} 
              />
            ) : (
              <div style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%', 
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px dashed var(--border)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--text-secondary)'
              }}>
                <Camera size={32} />
              </div>
            )}
            <input 
              id="profile-photo-settings-upload" 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />
          </div>
          <label 
            htmlFor="profile-photo-settings-upload" 
            className="code-action-btn"
            style={{
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              margin: 0,
              padding: '8px 16px'
            }}
          >
            <Upload size={14} /> Change Photo
          </label>
        </div>

        {/* Basic Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Full Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Email Address (Read-only)</label>
            <input 
              type="email" 
              className="form-input" 
              value={user?.email} 
              disabled 
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Role Group (Read-only)</label>
            <input 
              type="text" 
              className="form-input text-capitalize" 
              value={user?.role?.replace('_', ' ')} 
              disabled 
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">School ID (Read-only)</label>
            <input 
              type="text" 
              className="form-input" 
              value={user?.school || 'None (Super Admin)'} 
              disabled 
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
          </div>
        </div>

        {/* Role-Specific Fields */}
        {user?.role === 'parent' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--accent)' }}>Parent Contact Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Father's Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={fatherName} 
                  onChange={(e) => setFatherName(e.target.value)} 
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Mother's Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={motherName} 
                  onChange={(e) => setMotherName(e.target.value)} 
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Father's Phone</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={fatherPhone} 
                  onChange={(e) => setFatherPhone(e.target.value)} 
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Mother's Phone</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={motherPhone} 
                  onChange={(e) => setMotherPhone(e.target.value)} 
                />
              </div>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Emergency Contact Number</label>
              <input 
                type="text" 
                className="form-input" 
                value={emergencyContact} 
                onChange={(e) => setEmergencyContact(e.target.value)} 
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Home Address</label>
              <input 
                type="text" 
                className="form-input" 
                value={homeAddress} 
                onChange={(e) => setHomeAddress(e.target.value)} 
              />
            </div>
          </div>
        )}

        {user?.role === 'driver' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--accent)' }}>Driver & Vehicle Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Vehicle Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={vehicleNumber} 
                  onChange={(e) => setVehicleNumber(e.target.value)} 
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">License Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={licenseNumber} 
                  onChange={(e) => setLicenseNumber(e.target.value)} 
                />
              </div>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Active Contact Phone</label>
              <input 
                type="text" 
                className="form-input" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
              />
            </div>
          </div>
        )}

        {user?.role === 'teacher' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--accent)' }}>Teacher Assignment Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Primary Class Assigned</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={primaryClass} 
                  onChange={(e) => setPrimaryClass(e.target.value)} 
                  placeholder="e.g. 5"
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Primary Section Assigned</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={primarySection} 
                  onChange={(e) => setPrimarySection(e.target.value)} 
                  placeholder="e.g. A"
                />
              </div>
            </div>
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="dashboard-btn-primary"
          style={{ margin: 0, width: '100%', padding: '12px', fontWeight: '600' }}
        >
          {loading ? 'Saving Changes...' : '💾 Save Profile Settings'}
        </button>
      </form>
    </div>
  );
};

// =============================================================
// PROFILE PHOTO PROMPT MODAL (FOR PARENTS & TEACHERS WITHOUT PHOTO)
// =============================================================
const ProfilePhotoPromptModal = () => {
  const { user, setUser } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (user && (user.role === 'parent' || user.role === 'teacher') && !user.profilePhoto) {
      const skipped = sessionStorage.getItem('skipProfilePhotoPrompt');
      if (skipped !== 'true') {
        setIsOpen(true);
      }
    }
  }, [user]);

  useEffect(() => {
    const handleOpenModal = () => {
      setPreviewPhoto(user?.profilePhotoUrl || user?.profilePhoto || '');
      setProfilePhoto(user?.profilePhotoUrl || user?.profilePhoto || '');
      setIsOpen(true);
    };
    window.addEventListener('openProfilePhotoModal', handleOpenModal);
    return () => window.removeEventListener('openProfilePhotoModal', handleOpenModal);
  }, [user]);

  const handleClose = () => {
    stopCamera();
    sessionStorage.setItem('skipProfilePhotoPrompt', 'true');
    setIsOpen(false);
  };

  const startCamera = async () => {
    setCameraError('');
    setIsCameraActive(true);
    setPreviewPhoto('');
    setProfilePhoto('');
    try {
      const constraints = {
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraError('Unable to access camera. Please check camera permissions or upload a file.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setPreviewPhoto(dataUrl);
        setProfilePhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB');
      return;
    }
    stopCamera();
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewPhoto(reader.result);
      setProfilePhoto(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = async () => {
    if (!profilePhoto) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await axios.put(`${API_URL}/auth/update-profile`, {
        profilePhotoUrl: profilePhoto
      });
      if (res.data.status === 'success') {
        setSuccess('Profile photo updated! ✅');
        setUser(res.data.user);
        saveUserToLocalStorage(res.data.user);
        setTimeout(() => {
          setIsOpen(false);
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile picture.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 15, 26, 0.95)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 11000,
      animation: 'fadeIn 0.2s ease',
      padding: '20px'
    }}>
      <div className="glass-card" style={{
        width: '450px',
        padding: '30px',
        border: '1px solid var(--border)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative'
      }}>
        <button 
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'rgba(168, 85, 247, 0.1)',
          color: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          <Camera size={28} />
        </div>

        <h3 style={{ fontSize: '20px', fontWeight: 'bold', fontFamily: 'var(--font-title)', marginBottom: '8px', textAlign: 'center' }}>
          Add Profile Picture
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', marginBottom: '24px', lineHeight: '1.4' }}>
          Please upload or take a profile picture so the school admins and students can recognize you.
        </p>

        {error && <div className="error-banner" style={{ width: '100%', marginBottom: '16px' }}>{error}</div>}
        {cameraError && <div className="error-banner" style={{ width: '100%', marginBottom: '16px' }}>{cameraError}</div>}
        {success && <div className="success-banner" style={{ width: '100%', marginBottom: '16px' }}>{success}</div>}

        <div style={{
          width: '100%',
          height: '240px',
          borderRadius: '12px',
          border: '1px dashed var(--border)',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          marginBottom: '24px',
          position: 'relative'
        }}>
          {isCameraActive ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ) : previewPhoto ? (
            <img 
              src={previewPhoto} 
              alt="Profile Preview" 
              style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '4px solid var(--accent)'
              }}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '14px', marginBottom: '5px' }}>No photo selected</p>
              <p style={{ fontSize: '12px' }}>Choose upload or take one below</p>
            </div>
          )}
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {isCameraActive ? (
            <button
              onClick={capturePhoto}
              className="dashboard-btn-primary"
              style={{ margin: 0, width: '100%', padding: '12px', background: 'var(--accent)' }}
            >
              📸 Capture Image
            </button>
          ) : previewPhoto ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { setPreviewPhoto(''); setProfilePhoto(''); }}
                className="code-action-btn"
                style={{ margin: 0, flex: 1, padding: '12px' }}
              >
                Clear
              </button>
              <button
                onClick={handleSavePhoto}
                disabled={loading}
                className="dashboard-btn-primary"
                style={{ margin: 0, flex: 2, padding: '12px' }}
              >
                {loading ? 'Saving...' : 'Confirm & Save'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <label className="code-action-btn" style={{ 
                margin: 0, 
                flex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '6px',
                cursor: 'pointer',
                padding: '12px 0'
              }}>
                <Upload size={16} /> Upload
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={handleFileChange}
                />
              </label>
              <button
                onClick={startCamera}
                className="dashboard-btn-primary"
                style={{ 
                  margin: 0, 
                  flex: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '6px',
                  padding: '12px 0' 
                }}
              >
                <Camera size={16} /> Take Photo
              </button>
            </div>
          )}

          {!previewPhoto && !isCameraActive && (
            <button
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                marginTop: '10px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Skip for now
            </button>
          )}

          {isCameraActive && (
            <button
              onClick={stopCamera}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                marginTop: '10px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Cancel Camera
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const DashboardLayout = ({ 
  roleName, 
  user, 
  activeTab, 
  setActiveTab, 
  tabs, 
  handleLogout, 
  children 
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [transitionTab, setTransitionTab] = useState(null);
  const [showDownloadPrompt, setShowDownloadPrompt] = useState(false);

  useEffect(() => {
    const hasDismissed = localStorage.getItem('appDownloadPromptDismissed');
    if (!hasDismissed) {
      const timer = setTimeout(() => {
        setShowDownloadPrompt(true);
      }, 5000); // 5s delay on dashboard loading
      return () => clearTimeout(timer);
    }
  }, []);

  // Automatic mobile table row expander and cell labeler
  useEffect(() => {
    const handleTableClick = (e) => {
      const tr = e.target.closest('.dashboard-table tr');
      if (!tr) return;
      
      // Skip empty placeholder rows containing colspan/colSpan
      if (tr.querySelector('td[colspan]') || tr.querySelector('td[colSpan]')) return;
      
      // Only run in mobile viewport width
      if (window.innerWidth > 768) return;

      // Skip toggling if clicking inside a form input, button, or link
      if (e.target.closest('button, a, input, select, label, textarea')) return;

      tr.classList.toggle('row-expanded');
    };

    const updateTableLabels = () => {
      const tables = document.querySelectorAll('.dashboard-table');
      tables.forEach(table => {
        const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          cells.forEach((cell, index) => {
            if (headers[index] && !cell.getAttribute('data-label')) {
              cell.setAttribute('data-label', headers[index]);
            }
          });
        });
      });
    };

    updateTableLabels();
    document.addEventListener('click', handleTableClick);

    // Watch for dynamic page updates and tab switching to re-apply labels
    const observer = new MutationObserver(() => {
      updateTableLabels();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('click', handleTableClick);
      observer.disconnect();
    };
  }, []);

  const handleDownloadApp = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const downloadFileName = isMobile ? 'school-connect.apk' : 'school-connect-setup.exe';
    
    // Create a mock binary file setup
    const mockContent = new Uint8Array([80, 75, 3, 4, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const blob = new Blob([mockContent], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = downloadFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    localStorage.setItem('appDownloadPromptDismissed', 'true');
    setShowDownloadPrompt(false);
  };

  const handleDismissDownload = () => {
    localStorage.setItem('appDownloadPromptDismissed', 'true');
    setShowDownloadPrompt(false);
  };

  const handleTabChange = (tabId, isFromMore = false) => {
    if (activeTab === tabId) return;
    const targetTab = tabs.find(t => t.id === tabId);
    const label = targetTab?.label || 'Loading';
    const IconComponent = targetTab?.icon || Building;

    setTransitionTab({ id: tabId, label, isFromMore, icon: IconComponent });

    // Exactly 1s transition delay for all page navigation transitions
    setTimeout(() => {
      setActiveTab(tabId);
      setTransitionTab(null);
    }, 1000);
  };

  const renderThemedTransition = (tabId, IconComponent) => {
    if (tabId === 'bus' || tabId === 'fleet') {
      return (
        <div style={{
          position: 'relative',
          width: '85%',
          maxWidth: '600px',
          height: '120px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-end'
        }}>
          <div className="road-stripes" />
          <div style={{
            position: 'absolute',
            bottom: '16px',
            animation: 'busDrive 1.3s cubic-bezier(0.4, 0, 0.2, 1) forwards, busBob 0.15s infinite alternate',
            transformOrigin: 'bottom center',
            color: 'var(--accent, #a855f7)'
          }}>
            <Bus size={80} />
          </div>
        </div>
      );
    }

    if (tabId === 'fees' || tabId === 'manage-fees') {
      return (
        <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ animation: 'cardPulse 0.5s ease-in-out infinite alternate', zIndex: 2, color: '#10b981' }}>
            <DollarSign size={70} />
          </div>
          <div style={{ position: 'absolute', animation: 'floatUp 0.8s ease-in-out infinite', left: '10px', color: '#10b981' }}><DollarSign size={26} /></div>
          <div style={{ position: 'absolute', animation: 'floatUp 1s ease-in-out infinite', right: '15px', animationDelay: '0.2s', color: '#60a5fa' }}><CheckSquare size={24} /></div>
          <div style={{ position: 'absolute', animation: 'floatUp 0.9s ease-in-out infinite', left: '45px', animationDelay: '0.4s', color: '#10b981' }}><DollarSign size={26} /></div>
        </div>
      );
    }

    if (tabId === 'marks' || tabId === 'performance') {
      return (
        <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ animation: 'trophyBounce 0.6s ease-in-out infinite alternate', zIndex: 2, color: '#fbbf24' }}>
            <Award size={75} />
          </div>
          <div style={{ position: 'absolute', top: '10px', left: '10px', color: '#fbbf24', animation: 'starTwinkle 0.9s infinite' }}><Award size={20} /></div>
          <div style={{ position: 'absolute', bottom: '25px', right: '5px', color: '#a855f7', animation: 'starTwinkle 1.3s infinite', animationDelay: '0.3s' }}><GraduationCap size={20} /></div>
          <div style={{ position: 'absolute', top: '25px', right: '15px', color: '#60a5fa', animation: 'starTwinkle 0.7s infinite', animationDelay: '0.15s' }}><Award size={18} /></div>
        </div>
      );
    }

    if (tabId === 'attendance' || tabId === 'staff-attendance' || tabId === 'checkin') {
      return (
        <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#60a5fa', opacity: 0.9 }}>
            <Calendar size={70} />
          </div>
          <div style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            color: '#10b981',
            animation: 'checkPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.4))'
          }}>
            <CheckCircle size={48} />
          </div>
          {(tabId === 'checkin' || tabId === 'staff-attendance') && (
            <div style={{
              position: 'absolute',
              inset: '-10px',
              border: '2px solid rgba(168, 85, 247, 0.4)',
              borderRadius: '50%',
              animation: 'wifiWave 1s linear infinite'
            }} />
          )}
        </div>
      );
    }

    if (tabId === 'timetable') {
      return (
        <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#f59e0b', animation: 'clockShake 0.15s ease-in-out infinite' }}>
            <Clock size={75} />
          </div>
        </div>
      );
    }

    if (tabId === 'diary' || tabId === 'diaries') {
      return (
        <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#a855f7' }}><BookOpen size={75} /></div>
          <div style={{ position: 'absolute', top: '15px', color: '#fbbf24', animation: 'starRise 0.9s infinite', left: '15px' }}><Plus size={16} /></div>
          <div style={{ position: 'absolute', top: '20px', color: '#60a5fa', animation: 'starRise 1.2s infinite', right: '15px', animationDelay: '0.35s' }}><Plus size={18} /></div>
        </div>
      );
    }

    if (tabId === 'profile') {
      return (
        <div style={{
          position: 'relative',
          width: '100px',
          height: '130px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '16px',
          border: '1.5px solid rgba(255,255,255,0.08)',
          overflow: 'hidden'
        }}>
          <div style={{ color: '#60a5fa' }}><User size={70} /></div>
          <div style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, transparent, #a855f7, #60a5fa, #a855f7, transparent)',
            boxShadow: '0 0 12px #a855f7, 0 0 6px #60a5fa',
            animation: 'scanLine 1.8s linear infinite'
          }} />
        </div>
      );
    }

    if (tabId === 'secret-codes') {
      return (
        <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', color: '#ef4444', animation: 'lockLockFade 1s forwards' }}><Lock size={70} /></div>
          <div style={{ position: 'absolute', color: '#10b981', animation: 'lockOpenFade 1s forwards, lockPop 1s forwards' }}><Unlock size={70} /></div>
          <div style={{
            position: 'absolute',
            left: '12px',
            top: '40px',
            color: '#fbbf24',
            animation: 'keyTurn 1s forwards'
          }}><Key size={34} /></div>
        </div>
      );
    }

    if (tabId === 'school-users' || tabId === 'pending-parents' || tabId === 'pre-students' || tabId === 'school-admins') {
      return (
        <div style={{ position: 'relative', width: '130px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <div style={{ color: '#a855f7', animation: 'pulseConnect 1.2s infinite' }}><Users size={54} /></div>
          <div style={{ fontSize: '26px', color: '#eab308', animation: 'pulseConnect 1.2s infinite', animationDelay: '0.3s' }}>⚡</div>
          <div style={{ color: '#60a5fa', animation: 'pulseConnect 1.2s infinite', animationDelay: '0.6s' }}><School size={54} /></div>
        </div>
      );
    }

    if (tabId === 'class-requests') {
      return (
        <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'mailFly 1s forwards' }}>
          <div style={{ position: 'absolute', color: '#a855f7', animation: 'envelopeCloseFade 1s forwards' }}><Mail size={70} /></div>
          <div style={{ position: 'absolute', color: '#60a5fa', animation: 'envelopeOpenFade 1s forwards' }}><MailOpen size={70} /></div>
        </div>
      );
    }

    if (tabId === 'drive' || tabId === 'history') {
      return (
        <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#a855f7', opacity: 0.85 }}><Compass size={70} /></div>
          <div style={{
            position: 'absolute',
            top: '15px',
            color: '#ef4444',
            animation: 'pinDrop 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
          }}>
            <MapPin size={48} />
          </div>
          <div style={{
            position: 'absolute',
            bottom: '30px',
            width: '32px',
            height: '12px',
            borderRadius: '50%',
            border: '2px solid #ef4444',
            animation: 'pinPulse 1s infinite'
          }} />
        </div>
      );
    }

    const ActiveIcon = IconComponent || Building;
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '120px',
        height: '120px',
        animation: 'iconBigScaleFade 1s cubic-bezier(0.25, 1, 0.5, 1) forwards',
        color: 'var(--accent, #a855f7)'
      }}>
        <ActiveIcon size={80} />
      </div>
    );
  };

  const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];
  const activeTabLabel = currentTab?.label || 'Overview';
  const ActiveTabIcon = currentTab?.icon || Building;

  const initials = user?.fullName 
    ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() 
    : 'U';

  const [schoolData, setSchoolData] = useState(null);

  // App Open Animation states
  const isSplashRole = user && ['parent', 'teacher', 'driver'].includes(user.role);
  const [splashDone, setSplashDone] = useState(() => {
    const savedUserStr = localStorage.getItem('user');
    if (savedUserStr) {
      try {
        const u = JSON.parse(savedUserStr);
        if (!['parent', 'teacher', 'driver'].includes(u.role)) {
          return true;
        }
      } catch (e) {}
    }
    return !!sessionStorage.getItem('schoolConnectSplashDone');
  });

  // Keep state sync'd if user object updates
  useEffect(() => {
    if (user && !['parent', 'teacher', 'driver'].includes(user.role)) {
      setSplashDone(true);
    }
  }, [user]);

  // Pull to refresh states
  const [pullOffset, setPullOffset] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncStage, setSyncStage] = useState(0);

  const startYRef = useRef(0);
  const currentOffsetRef = useRef(0);

  useEffect(() => {
    const fetchSchool = async () => {
      if (user && user.school) {
        try {
          const res = await axios.get(`${API_URL}/schools/my-school`);
          if (res.data.status === 'success') {
            setSchoolData(res.data.school);
          }
        } catch (err) {
          console.error('Failed to fetch school details in layout', err);
        }
      }
    };
    fetchSchool();
  }, [user]);

  // Pull to Refresh Handlers
  const handleTouchStart = (e) => {
    if (isRefreshing) return;
    const container = e.currentTarget;
    if (container.scrollTop === 0) {
      startYRef.current = e.touches ? e.touches[0].clientY : e.clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!isPulling || isRefreshing) return;
    const currentY = e.touches ? e.touches[0].clientY : e.clientY;
    const diff = currentY - startYRef.current;
    
    if (diff > 0) {
      const offset = Math.pow(diff, 0.82);
      const cappedOffset = Math.min(offset, 100);
      setPullOffset(cappedOffset);
      currentOffsetRef.current = cappedOffset;
      
      if (diff > 10 && e.cancelable) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isPulling || isRefreshing) return;
    setIsPulling(false);
    
    if (currentOffsetRef.current > 65) {
      setIsRefreshing(true);
      setPullOffset(60);
      setSyncStage(0);

      const t1 = setTimeout(() => setSyncStage(1), 800);
      const t2 = setTimeout(() => setSyncStage(2), 1500);
      const t3 = setTimeout(() => setSyncStage(3), 2200);
      const t4 = setTimeout(() => setSyncStage(4), 2900);
      const t5 = setTimeout(() => setSyncStage(5), 3600);
      
      const t6 = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('refreshDashboardData'));
        setPullOffset(0);
        currentOffsetRef.current = 0;
        setIsRefreshing(false);
      }, 4200);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
        clearTimeout(t5);
        clearTimeout(t6);
      };
    } else {
      setPullOffset(0);
      currentOffsetRef.current = 0;
    }
  };

  const renderUserAvatar = (sizeClass = 'w-8 h-8', badgeSize = 'w-2.5 h-2.5') => {
    return (
      <div className="relative inline-block shrink-0">
        {user?.profilePhoto ? (
          <img 
            src={user.profilePhoto} 
            alt="Profile" 
            className={`${sizeClass} rounded-full object-cover border border-purple-500/30`} 
          />
        ) : (
          <div className={`${sizeClass} rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-xs font-semibold text-purple-400`}>
            {initials}
          </div>
        )}
        <span className={`absolute bottom-0 right-0 block ${badgeSize} rounded-full bg-green-500 ring-2 ring-[#0F0F1A]`} />
      </div>
    );
  };

  const schoolLogo = schoolData?.schoolPhoto;

  const getMobileLabel = (label) => {
    const l = label.toLowerCase();
    if (l.includes('diary')) return 'Diary';
    if (l.includes('timetable')) return 'Timetable';
    if (l.includes('attendance')) return 'Attendance';
    if (l.includes('performance')) return 'Grades';
    if (l.includes('report')) return 'Marks';
    if (l.includes('marks')) return 'Marks';
    if (l.includes('fee')) return 'Fees';
    if (l.includes('bus')) return 'Bus';
    if (l.includes('fleet')) return 'Fleet';
    if (l.includes('map')) return 'Map';
    if (l.includes('history')) return 'History';
    if (l.includes('secret')) return 'Codes';
    if (l.includes('invite')) return 'Invites';
    if (l.includes('invitation')) return 'Invites';
    if (l.includes('admin')) return 'Admins';
    if (l.includes('school')) return 'Schools';
    if (l.includes('student')) return 'Students';
    if (l.includes('pre-registration')) return 'Pre-Reg';
    if (l.includes('directory')) return 'Students';
    if (l.includes('request')) return 'Requests';
    if (l.includes('staff & parents')) return 'Members';
    if (l.includes('check-in') || l.includes('checkin')) return 'Check-in';
    if (l.includes('wifi')) return 'Check-in';
    if (l.includes('trip')) return 'Trip';
    return label.split(' ')[0];
  };

  let displayMobileTabs = [];
  let hiddenMobileTabs = [];
  
  if (tabs.length <= 5) {
    displayMobileTabs = tabs;
  } else {
    const activeIndex = tabs.findIndex(t => t.id === activeTab);
    if (activeIndex === -1 || activeIndex < 4) {
      displayMobileTabs = tabs.slice(0, 4);
      hiddenMobileTabs = tabs.slice(4);
    } else {
      displayMobileTabs = [...tabs.slice(0, 3), tabs[activeIndex]];
      hiddenMobileTabs = tabs.filter((t, idx) => idx >= 3 && idx !== activeIndex);
    }
  }

  const displayDesktopTabs = tabs.length <= 10 ? tabs : tabs.slice(0, 9);
  const hiddenDesktopTabs = tabs.length <= 10 ? [] : tabs.slice(9);
  const isCurrentTabHidden = tabs.findIndex(t => t.id === activeTab) >= 9;
  const [isDesktopMoreOpen, setIsDesktopMoreOpen] = useState(isCurrentTabHidden);

  return (
    <div className="h-screen bg-[#0F0F1A] text-white flex flex-col relative overflow-hidden">
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 15px rgba(168, 85, 247, 0.4); }
          50% { box-shadow: 0 0 30px rgba(168, 85, 247, 0.8); }
        }
        @keyframes spin-anim {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-anim {
          animation: spin-anim 2s linear infinite;
        }

        /* Pull-to-refresh custom animations */
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-anim-slow {
          animation: spin-slow 3s linear infinite;
        }
        .mini-connection-line {
          width: 36px;
          height: 3px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 2px;
          position: relative;
          overflow: hidden;
          transition: all 0.4s ease;
        }
        .mini-connection-line.active {
          background: linear-gradient(90deg, #a855f7, #60a5fa);
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.5), 0 0 5px rgba(96, 165, 250, 0.5);
        }
        .mini-connection-line.active::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
          animation: miniConnectionPulse 1.2s infinite linear;
        }
        @keyframes miniConnectionPulse {
          0% { left: -100%; }
          100% { left: 200%; }
        }

        /* Main content blurring and fade-in when open animation active */
        .dashboard-content-wrapper {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.5s cubic-bezier(0.25, 1, 0.5, 1), transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .dashboard-content-active {
          opacity: 1;
          transform: translateY(0);
        }

        /* School Bus Transition Keyframes & Styles */
        @keyframes busDrive {
          0% { left: -15%; }
          100% { left: 115%; }
        }
        @keyframes busBob {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(1.2deg); }
          100% { transform: translateY(0) rotate(-1.2deg); }
        }
        @keyframes roadScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-40px); }
        }
        @keyframes overlayFade {
          0% { opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { opacity: 0; }
        }
        .road-stripes {
          position: absolute;
          bottom: 10px;
          left: 0;
          width: 200%;
          height: 6px;
          background: repeating-linear-gradient(90deg, #f59e0b, #f59e0b 20px, transparent 20px, transparent 40px);
          animation: roadScroll 0.8s linear infinite;
        }

        /* More Options Drawer Zoom-Spin Progress Keyframes & Styles */
        @keyframes zoomSpin {
          0% {
            transform: scale(0.2) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.6) rotate(360deg);
            opacity: 1;
          }
          85% {
            transform: scale(1.8) rotate(720deg);
            opacity: 1;
          }
          100% {
            transform: scale(1.5) rotate(1080deg);
            opacity: 0;
          }
        }
        @keyframes zoomSpinText {
          0% {
            transform: scale(0.6);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
            opacity: 1;
          }
          85% {
            transform: scale(1.1);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }

        /* Custom Tab Transitions CSS keyframes */
        @keyframes floatUp {
          0% { transform: translateY(50px) rotate(0deg) scale(0.6); opacity: 0; }
          50% { opacity: 0.8; }
          100% { transform: translateY(-70px) rotate(360deg) scale(1.1); opacity: 0; }
        }
        @keyframes cardPulse {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
        @keyframes trophyBounce {
          0% { transform: translateY(0) scale(1); }
          100% { transform: translateY(-12px) scale(1.06); }
        }
        @keyframes starTwinkle {
          0% { transform: scale(0.3) rotate(0deg); opacity: 0.2; }
          50% { transform: scale(1.2) rotate(180deg); opacity: 1; }
          100% { transform: scale(0.3) rotate(360deg); opacity: 0.2; }
        }
        @keyframes checkPop {
          0% { transform: scale(0) rotate(-20deg); opacity: 0; }
          70% { transform: scale(1.3) rotate(10deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes wifiWave {
          0% { transform: scale(0.6); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes clockShake {
          0%, 100% { transform: rotate(-6deg); }
          50% { transform: rotate(6deg); }
        }
        @keyframes starRise {
          0% { transform: translateY(15px) scale(0.6); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(-40px) scale(1.1); opacity: 0; }
        }
        @keyframes scanLine {
          0% { top: 8%; }
          50% { top: 90%; }
          100% { top: 8%; }
        }
        @keyframes lockLockFade {
          0%, 55% { opacity: 1; }
          60%, 100% { opacity: 0; }
        }
        @keyframes lockOpenFade {
          0%, 55% { opacity: 0; }
          60%, 100% { opacity: 1; }
        }
        @keyframes lockPop {
          0%, 55% { transform: scale(1); }
          65% { transform: scale(1.2) rotate(-5deg); }
          100% { transform: scale(1); }
        }
        @keyframes keyTurn {
          0% { transform: rotate(0) translate(-15px, 5px); opacity: 0; }
          40% { transform: rotate(0) translate(0px, 0px); opacity: 1; }
          60% { transform: rotate(-90deg) translate(0px, 0px); opacity: 1; }
          100% { transform: rotate(-90deg) translate(0px, 0px); opacity: 1; }
        }
        @keyframes pulseConnect {
          0% { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.6; }
        }
        @keyframes mailFly {
          0% { transform: translate(-70px, 20px) rotate(-15deg) scale(0.5); opacity: 0; }
          50% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
        }
        @keyframes envelopeCloseFade {
          0%, 50% { opacity: 1; }
          55%, 100% { opacity: 0; }
        }
        @keyframes envelopeOpenFade {
          0%, 50% { opacity: 0; }
          55%, 100% { opacity: 1; }
        }
        @keyframes pinDrop {
          0% { transform: translateY(-50px); opacity: 0; }
          60% { transform: translateY(0) scaleY(0.85); opacity: 1; }
          75% { transform: translateY(-10px) scaleY(1.05); }
          90% { transform: translateY(0) scaleY(0.95); }
          100% { transform: translateY(0) scaleY(1); opacity: 1; }
        }
        @keyframes pinPulse {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>

      {/* DASHBOARD CONTENT WRAPPER */}
      <div className={`dashboard-content-wrapper ${splashDone ? 'dashboard-content-active' : ''} flex-1 flex flex-col min-h-0`}>
        {/* MOBILE NAVBAR */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#141425]/90 backdrop-blur-md border-b border-white/8 sticky top-0 z-40 w-full">
          <div className="flex items-center gap-2">
            {schoolLogo ? (
              <img 
                src={schoolLogo} 
                alt="School Logo" 
                style={{ 
                  width: '28px', 
                  height: '28px', 
                  borderRadius: '50%', 
                  objectFit: 'cover',
                  boxShadow: '0 0 8px rgba(168, 85, 247, 0.4)',
                  border: '1.5px solid var(--accent)'
                }} 
              />
            ) : (
              <GraduationCap className="text-purple-500 w-6 h-6" />
            )}
            <span className="font-semibold text-sm tracking-tight font-title text-white truncate max-w-[150px]">
              {schoolData?.name || 'School Connect'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user?.role === 'parent' && (
              <>
                <span className="text-xs font-semibold text-white/80" style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.fullName.split(' ')[0]}
                </span>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('checkNotificationsManual'))}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-[#94A3B8] hover:text-white transition-all cursor-pointer relative"
                  title="Notifications"
                  style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center' }}
                >
                  <Bell size={18} />
                </button>
              </>
            )}
            <button 
              onClick={handleLogout}
              className="p-1.5 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-lg transition-all cursor-pointer"
              title="Logout"
              style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center' }}
            >
              <LogOut size={18} />
            </button>
            {renderUserAvatar('w-8 h-8', 'w-2.5 h-2.5')}
          </div>
        </header>

        {/* MOBILE BOTTOM DRAWER FOR HIDDEN TABS */}
        {isMoreOpen && (
          <>
            <div 
              onClick={() => setIsMoreOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-48 transition-opacity"
            />
            <div className="lg:hidden fixed bottom-0 left-0 right-0 max-h-[70vh] bg-[#141425] border-t border-white/8 rounded-t-2xl z-50 overflow-y-auto px-4 py-6 shadow-[0_-8px_32px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between mb-5 px-2">
                <h3 className="text-base font-bold font-title text-white">More Options</h3>
                <button 
                  onClick={() => setIsMoreOpen(false)}
                  className="p-1 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/8 text-[#94A3B8] hover:text-white transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 pb-8">
                {hiddenMobileTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        handleTabChange(tab.id, true);
                        setIsMoreOpen(false);
                      }}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer ${
                        isActive 
                          ? 'mobile-active-tab' 
                          : 'text-[#94A3B8] bg-white/[0.01] hover:bg-white/[0.03] border-white/5'
                      }`}
                    >
                      <div style={{ position: 'relative', display: 'inline-flex' }}>
                        <Icon size={20} className="mb-2 shrink-0" />
                        {tab.badge && (
                          <span style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-8px',
                            background: 'var(--danger)',
                            color: 'white',
                            fontSize: '9px',
                            fontWeight: 'bold',
                            borderRadius: '50%',
                            minWidth: '14px',
                            height: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 2px'
                          }}>
                            {tab.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-semibold">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-[64px] bg-[#141425]/95 backdrop-blur-lg border-t border-white/8 flex items-center justify-around z-45 px-2">
          {displayMobileTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  handleTabChange(tab.id, false);
                  setIsMoreOpen(false);
                }}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-bold transition-all cursor-pointer ${
                  isActive 
                    ? 'text-[var(--accent)] scale-105' 
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <div style={{ position: 'relative', display: 'inline-flex' }}>
                  <Icon size={20} className="mb-1 shrink-0" />
                  {tab.badge && (
                    <span style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-8px',
                      background: 'var(--danger)',
                      color: 'white',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      borderRadius: '50%',
                      minWidth: '14px',
                      height: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 2px'
                    }}>
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="truncate max-w-[70px]">{getMobileLabel(tab.label)}</span>
              </button>
            );
          })}
          
          {tabs.length > 5 && (
            <button
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-bold transition-all cursor-pointer ${
                isMoreOpen
                  ? 'text-[var(--accent)] scale-105' 
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                <MoreHorizontal size={20} className="mb-1 shrink-0" />
                {hiddenMobileTabs.some(t => t.badge) && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-8px',
                    background: 'var(--danger)',
                    color: 'white',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    borderRadius: '50%',
                    minWidth: '14px',
                    height: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 2px'
                  }}>
                    !
                  </span>
                )}
              </div>
              <span>More</span>
            </button>
          )}
        </nav>

        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          {/* DESKTOP HEADER WITH DROPDOWN SELECTOR */}
          <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-[#141425]/40 border-b border-white/8 backdrop-blur-md sticky top-0 z-30">
            <div className="flex items-center gap-4">
              {/* School Logo & Name */}
              <div className="flex items-center gap-3">
                {schoolLogo ? (
                  <img 
                    src={schoolLogo} 
                    alt="School Logo" 
                    style={{ 
                      width: '36px', 
                      height: '36px', 
                      borderRadius: '50%', 
                      objectFit: 'cover',
                      boxShadow: '0 0 10px rgba(168, 85, 247, 0.4)',
                      border: '1.5px solid var(--accent)'
                    }} 
                  />
                ) : (
                  <GraduationCap className="text-purple-500 w-8 h-8" />
                )}
                <div className="flex flex-col">
                  <span className="font-bold text-sm font-title text-white tracking-tight leading-none">
                    {schoolData?.name || 'School Connect'}
                  </span>
                  <span className="text-[10px] text-[var(--accent)] font-semibold tracking-widest uppercase mt-1">
                    {roleName.replace('_', ' ')} PORTAL
                  </span>
                </div>
              </div>
            </div>

            {/* Active Tab Dropdown in Desktop Header */}
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2.5 px-5 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-full text-white text-sm font-semibold transition-all cursor-pointer shadow-lg"
              >
                {ActiveTabIcon && <ActiveTabIcon size={16} className="text-[var(--accent)] shrink-0" />}
                <span>{activeTabLabel}</span>
                <span className={`text-[10px] text-white/60 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} style={{ display: 'inline-block' }}>
                  ▼
                </span>
              </button>

              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                  <div 
                    className="absolute left-1/2 -translate-x-1/2 mt-2 w-[220px] bg-[#141425]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-50 py-1 overflow-hidden"
                    style={{ top: '100%' }}
                  >
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            handleTabChange(tab.id, false);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-semibold transition-all cursor-pointer border-l-2 ${
                            isActive 
                              ? 'bg-purple-500/10 text-white border-purple-500' 
                              : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.02] border-transparent'
                          }`}
                        >
                          <Icon size={14} className="shrink-0" />
                          <span style={{ flex: 1 }}>{tab.label}</span>
                          {tab.badge && (
                            <span style={{
                              background: 'var(--danger)',
                              color: 'white',
                              fontSize: '9px',
                              fontWeight: 'bold',
                              borderRadius: '10px',
                              padding: '2px 6px',
                              lineHeight: 1
                            }}>
                              {tab.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Profile & Logout Action Buttons */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xs text-[#94A3B8] block">Logged in as</span>
                <span className="text-sm font-semibold text-white">{user?.email}</span>
              </div>
              {user?.role === 'parent' ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-white/90">{user.fullName}</span>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('checkNotificationsManual'))}
                    className="p-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 border border-purple-500/20 hover:border-purple-500/30 rounded-full transition-all cursor-pointer relative"
                    title="Notifications"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Bell size={18} />
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/30 rounded-full transition-all cursor-pointer"
                    title="Logout"
                  >
                    <LogOut size={18} />
                  </button>
                  {renderUserAvatar('w-9 h-9', 'w-2.5 h-2.5')}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleLogout}
                    className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/30 rounded-full transition-all cursor-pointer"
                    title="Logout"
                  >
                    <LogOut size={18} />
                  </button>
                  {renderUserAvatar('w-9 h-9', 'w-2.5 h-2.5')}
                </div>
              )}
            </div>
          </header>

          <div 
            className="flex-1 p-4 lg:p-8 pb-[80px] lg:pb-8 overflow-y-auto w-full max-w-full min-w-0 min-h-0"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseMove={handleTouchMove}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
            style={{
              transform: pullOffset > 0 ? `translateY(${pullOffset}px)` : 'none',
              transition: isPulling ? 'none' : 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
              position: 'relative'
            }}
          >
            {pullOffset > 0 && (
              <div style={{
                position: 'absolute',
                top: `-${pullOffset}px`,
                left: 0,
                right: 0,
                height: `${pullOffset}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(20, 20, 37, 0.85)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                transition: isPulling ? 'none' : 'height 0.3s ease-out',
                color: '#fff',
                fontSize: '12px',
                zIndex: 90
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  opacity: Math.min(pullOffset / 60, 1),
                  transform: `scale(${Math.min(pullOffset / 70, 1)})`
                }}>
                  {/* Connection HUD for Pull-to-Refresh */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* School Logo */}
                    <div className={isRefreshing ? "spin-anim-slow" : ""} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: isRefreshing ? 'none' : `rotate(${pullOffset * 2.5}deg)`,
                      transition: 'transform 0.1s linear'
                    }}>
                      {schoolLogo ? (
                        <img 
                          src={schoolLogo} 
                          alt="School Logo" 
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '1.5px solid var(--accent)',
                            boxShadow: '0 0 8px rgba(168, 85, 247, 0.3)'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          background: 'rgba(168, 85, 247, 0.2)',
                          border: '1.5px solid var(--accent)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <GraduationCap size={14} className="text-purple-400" />
                        </div>
                      )}
                    </div>

                    {/* Glowing Connection Line */}
                    <div className={`mini-connection-line ${isRefreshing ? 'active' : ''}`} />

                    {/* User Profile Avatar */}
                    <div>
                      {user?.profilePhoto ? (
                        <img 
                          src={user.profilePhoto} 
                          alt="User Profile" 
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '1.5px solid #60a5fa',
                            boxShadow: '0 0 8px rgba(96, 165, 250, 0.3)'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          background: 'rgba(96, 165, 250, 0.2)',
                          border: '1.5px solid #60a5fa',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          color: '#60a5fa'
                        }}>
                          {initials}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Syncing Texts & HUD States */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: '700', fontSize: '12px', letterSpacing: '0.02em' }}>
                      {isRefreshing 
                        ? (syncStage === 0 ? "🔄 Syncing School Data..."
                          : syncStage === 1 ? "✔ Attendance Updated"
                          : syncStage === 2 ? "✔ Diary Updated"
                          : syncStage === 3 ? "✔ Bus Tracking Updated"
                          : syncStage === 4 ? "✔ Timetable Updated"
                          : "✅ Sync Complete")
                        : pullOffset > 65 ? "Release to sync school data..." : "Pull down to sync data..."
                      }
                    </span>
                    {isRefreshing && (
                      <div style={{
                        width: '120px',
                        height: '3px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '1.5px',
                        overflow: 'hidden',
                        marginTop: '4px'
                      }}>
                        <div style={{
                          height: '100%',
                          background: 'linear-gradient(90deg, var(--accent) 0%, #60a5fa 100%)',
                          width: `${(syncStage / 5) * 100}%`,
                          transition: 'width 0.4s ease-out'
                        }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>

      <GlobalNotificationPopupManager user={user} setActiveTab={setActiveTab} />
      <ProfilePhotoPromptModal />

      {/* PULL TO REFRESH SPLASH OVERLAY */}
      {isRefreshing && (
        <SplashScreen
          user={user}
          schoolData={schoolData}
          onComplete={() => {}}
        />
      )}

      {/* APP LAUNCH/SPLASH ANIMATION */}
      {!splashDone && isSplashRole && (
        <SplashScreen
          user={user}
          schoolData={schoolData}
          onComplete={() => {
            setSplashDone(true);
            sessionStorage.setItem('schoolConnectSplashDone', 'true');
          }}
        />
      )}

      {/* THEMED TAB TRANSITION OVERLAY */}
      {transitionTab && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 10, 27, 0.96)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          animation: 'overlayFade 1s forwards',
          color: '#fff',
          overflow: 'hidden',
          gap: '30px'
        }}>
          {/* Custom Themed Illustration */}
          {renderThemedTransition(transitionTab.id, transitionTab.icon)}
          
          <div style={{
            fontFamily: 'var(--font-title)',
            fontSize: '20px',
            fontWeight: 'bold',
            letterSpacing: '0.02em',
            color: '#fff',
            textShadow: '0 0 12px rgba(255, 255, 255, 0.35)',
            textAlign: 'center',
            padding: '0 20px',
            animation: 'cardPulse 0.8s ease-in-out infinite alternate'
          }}>
            {transitionTab.id === 'bus' || transitionTab.id === 'fleet' ? 'Connecting to Bus GPS Tracker...'
              : transitionTab.id === 'fees' || transitionTab.id === 'manage-fees' ? 'Retrieving Fee Statements...'
              : transitionTab.id === 'marks' || transitionTab.id === 'performance' ? 'Generating Marks Report Card...'
              : transitionTab.id === 'attendance' || transitionTab.id === 'staff-attendance' ? 'Fetching Attendance Log...'
              : transitionTab.id === 'checkin' ? 'Connecting to WiFi Check-in...'
              : transitionTab.id === 'timetable' ? 'Loading Class Timetable...'
              : transitionTab.id === 'diary' || transitionTab.id === 'diaries' ? 'Opening Class Diary...'
              : transitionTab.id === 'profile' ? 'Accessing Member Profile...'
              : transitionTab.id === 'secret-codes' ? 'Loading Secret Invite Codes...'
              : transitionTab.id === 'school-users' || transitionTab.id === 'pending-parents' || transitionTab.id === 'pre-students' || transitionTab.id === 'school-admins' ? 'Accessing Member Directory...'
              : transitionTab.id === 'class-requests' ? 'Loading Class Requests...'
              : transitionTab.id === 'drive' || transitionTab.id === 'history' ? 'Loading Trip Logs...'
              : `Loading ${transitionTab.label}...`
            }
          </div>
        </div>
      )}

      {/* APP DOWNLOAD PROMPT MODAL */}
      {showDownloadPrompt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 10, 27, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10100,
          padding: '20px',
          animation: 'overlayFade 0.3s ease-out'
        }} onClick={handleDismissDownload}>
          <div className="glass-card" style={{
            maxWidth: '460px',
            width: '100%',
            padding: '32px',
            background: '#141425',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            borderRadius: '16px',
            position: 'relative',
            textAlign: 'center'
          }} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={handleDismissDownload}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '24px',
                cursor: 'pointer',
                lineHeight: 1
              }}
            >
              &times;
            </button>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                background: 'rgba(168, 85, 247, 0.1)', 
                color: '#a855f7', 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                margin: '0 auto 12px auto',
                fontSize: '28px'
              }}>
                📱
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-title)', color: '#fff', margin: 0 }}>
                Get the School Connect App
              </h3>
            </div>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '13.5px', lineHeight: '1.6', marginBottom: '24px' }}>
                For the best experience, real-time school bus GPS tracking, and instant push notification alerts, download the School Connect application directly onto your device.
              </p>
              
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '24px' }}>
                  {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? '🤖' : '💻'}
                </span>
                <div style={{ textAlign: 'left' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#fff', margin: 0 }}>
                    {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'Mobile Edition Detected' : 'PC Desktop Edition Detected'}
                  </h4>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                    {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'Package: school-connect.apk' : 'Package: school-connect-setup.exe'}
                  </p>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              <button 
                onClick={handleDownloadApp}
                className="dashboard-btn-primary" 
                style={{ 
                  margin: 0,
                  borderRadius: '24px', 
                  padding: '12px 24px', 
                  width: '100%', 
                  fontWeight: '700', 
                  fontSize: '14px',
                  background: 'linear-gradient(135deg, #a855f7 0%, #60a5fa 100%)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(168, 85, 247, 0.3)'
                }}
              >
                🚀 Download Native App
              </button>
              <button 
                onClick={handleDismissDownload}
                style={{ 
                  borderRadius: '24px', 
                  padding: '12px 24px', 
                  width: '100%', 
                  fontWeight: '600', 
                  fontSize: '13px',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Continue in Web Version
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// STAFF WIFI CHECK-IN MODULES
// =============================================================
const StaffCheckInModule = () => {
  const { user } = useContext(AuthContext);
  const [wifiSSID, setWifiSSID] = useState('');
  const [customSSID, setCustomSSID] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [history, setHistory] = useState([]);
  const [authSSID, setAuthSSID] = useState('');

  // Countdown modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const timerRef = useRef(null);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/attendance/staff-history`);
      if (res.data.status === 'success') {
        setHistory(res.data.history);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSchoolDetails = async () => {
    try {
      const res = await axios.get(`${API_URL}/schools/my-school`);
      if (res.data.status === 'success') {
        setAuthSSID(res.data.school.wifiSSID);
      }
    } catch (err) {
      console.error('Failed to load school details for WiFi SSID check', err);
    }
  };

  const detectActiveWifi = async () => {
    setDetecting(true);
    setError('');
    setSuccess('');
    try {
      const res = await axios.get(`${API_URL}/schools/detect-wifi`);
      if (res.data.status === 'success' && res.data.ssid) {
        setWifiSSID(res.data.ssid);
        setIsCustom(false);
      } else {
        setWifiSSID('LTE_Cellular_Data');
        setIsCustom(false);
      }
    } catch (err) {
      console.error('Failed to detect active WiFi SSID', err);
      setWifiSSID('LTE_Cellular_Data');
      setIsCustom(false);
    } finally {
      setDetecting(false);
    }
  };

  useEffect(() => {
    fetchSchoolDetails();
    fetchHistory();
    detectActiveWifi();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const checkIfMobileHotspot = (ssid) => {
    if (!ssid) return false;
    const lower = ssid.toLowerCase();
    const hotspotKeywords = [
      'hotspot', 'iphone', 'samsung', 'oneplus', 'redmi', 'vivo', 'oppo', 
      'realme', 'pixel', 'moto', 'huawei', 'androidap', 'mi', 'mobile', 
      '5g', 'cellular', 'portable', 'tethering', 'galaxy', 'personal', 'hsp'
    ];
    return hotspotKeywords.some(keyword => lower.includes(keyword));
  };

  const startCheckInCountdown = (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');

    const ssidToSubmit = isCustom ? customSSID : wifiSSID;

    if (!ssidToSubmit) {
      setError('Please select or enter a WiFi SSID.');
      return;
    }

    if (checkIfMobileHotspot(ssidToSubmit)) {
      setError('Cannot mark attendance: Mobile hotspot detected. Please connect to authorized school WiFi.');
      return;
    }

    if (authSSID && ssidToSubmit.trim().toLowerCase() !== authSSID.trim().toLowerCase()) {
      setError('Cannot mark attendance: Mismatched WiFi SSID.');
      return;
    }

    setShowConfirmModal(true);
    setCountdown(5);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          performCheckIn(ssidToSubmit);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const performCheckIn = async (ssid) => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/attendance/staff-checkin`, {
        wifiSSID: ssid
      });
      if (res.data.status === 'success') {
        setSuccess(res.data.message);
        fetchHistory();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check in');
    } finally {
      setLoading(false);
    }
  };

  const cancelCheckIn = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setShowConfirmModal(false);
  };

  const ssidToSubmit = isCustom ? customSSID : wifiSSID;
  const isHotspot = checkIfMobileHotspot(ssidToSubmit);
  const isMatched = authSSID && ssidToSubmit && (ssidToSubmit.trim().toLowerCase() === authSSID.trim().toLowerCase());

  let connectionStatus = 'mismatch';
  let statusMessage = '';
  let isAllowed = false;

  if (!ssidToSubmit) {
    connectionStatus = 'none';
    statusMessage = 'Please select or enter a WiFi SSID to check connection.';
    isAllowed = false;
  } else if (isHotspot) {
    connectionStatus = 'hotspot';
    statusMessage = "⚠️ Mobile hotspot detected! This is a mobile hotspot, not a school WiFi network. Please connect to the school's authorized WiFi to mark attendance.";
    isAllowed = false;
  } else if (!isMatched) {
    connectionStatus = 'mismatch';
    statusMessage = `❌ Mismatched network. Please connect to the school's authorized WiFi (${authSSID || 'Greenwood_High_Staff_WiFi'}) to mark attendance.`;
    isAllowed = false;
  } else {
    connectionStatus = 'verified';
    statusMessage = "✅ Connection verified! You are connected to the school's authorized WiFi network. Ready to mark attendance.";
    isAllowed = true;
  }

  return (
    <div className="responsive-grid-3-2" style={{ marginBottom: '24px' }}>
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3>WiFi Attendance Check-in</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Mark your daily attendance by connecting to the school's authorized WiFi network.
        </p>

        {error && <div className="error-banner" style={{ margin: '0 0 16px 0' }}>{error}</div>}
        {success && <div className="success-banner" style={{ margin: '0 0 16px 0' }}>{success}</div>}

        {/* Two Columns showing Network Comparison */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          {/* Column 1: School Assigned WiFi */}
          <div style={{ 
            padding: '16px', 
            background: 'rgba(255,255,255,0.02)', 
            border: '1px solid var(--border)', 
            borderRadius: '8px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              School Assigned WiFi
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontWeight: '700', fontSize: '14px' }}>
              <Wifi size={18} />
              <span style={{ wordBreak: 'break-all' }}>{authSSID || 'Greenwood_High_Staff_WiFi'}</span>
            </div>
          </div>

          {/* Column 2: Connected WiFi */}
          <div style={{ 
            padding: '16px', 
            background: 'rgba(255,255,255,0.02)', 
            border: isHotspot ? '1px solid #ef4444' : isMatched ? '1px solid #10b981' : '1px solid var(--border)', 
            borderRadius: '8px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Your Connected WiFi
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              color: isHotspot ? '#ef4444' : isMatched ? '#10b981' : '#f59e0b', 
              fontWeight: '700', 
              fontSize: '14px' 
            }}>
              <Wifi size={18} />
              <span style={{ wordBreak: 'break-all' }}>{ssidToSubmit || 'None'}</span>
            </div>
          </div>
        </div>

        {/* Connection Status Box */}
        <div style={{ 
          padding: '12px 16px', 
          borderRadius: '8px', 
          fontSize: '13px', 
          fontWeight: '500',
          marginBottom: '20px',
          background: connectionStatus === 'verified' ? 'rgba(16, 185, 129, 0.1)' 
                      : connectionStatus === 'hotspot' ? 'rgba(239, 68, 68, 0.1)' 
                      : 'rgba(245, 158, 11, 0.1)',
          color: connectionStatus === 'verified' ? '#34d399' 
                 : connectionStatus === 'hotspot' ? '#f87171' 
                 : '#fbbf24',
          border: `1px solid ${
            connectionStatus === 'verified' ? 'rgba(16, 185, 129, 0.2)' 
            : connectionStatus === 'hotspot' ? 'rgba(239, 68, 68, 0.2)' 
            : 'rgba(245, 158, 11, 0.2)'
          }`
        }}>
          {statusMessage}
        </div>

        <form onSubmit={startCheckInCountdown}>
          {/* Detect Wi-Fi Button */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={detectActiveWifi}
              disabled={detecting}
              className="code-action-btn"
              style={{ 
                margin: 0, 
                flex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px',
                padding: '10px 16px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                color: '#60a5fa',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              <RefreshCw size={16} className={detecting ? 'spin-anim' : ''} />
              {detecting ? 'Detecting WiFi...' : 'Detect Wi-Fi Connection'}
            </button>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Simulate Device WiFi Connection</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <select
                className="form-select"
                value={isCustom ? 'custom' : wifiSSID}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setIsCustom(true);
                  } else {
                    setIsCustom(false);
                    setWifiSSID(e.target.value);
                  }
                }}
              >
                {!isCustom && wifiSSID && wifiSSID !== authSSID && wifiSSID !== 'Greenwood_High_Staff_WiFi' && wifiSSID !== 'School_Guest_Network' && wifiSSID !== 'LTE_Cellular_Data' && (
                  <option value={wifiSSID}>📡 [Detected] {wifiSSID}</option>
                )}
                {!wifiSSID && (
                  <option value="">📡 Waiting for detection / select WiFi...</option>
                )}
                {authSSID && (
                  <option value={authSSID}>[Active] {authSSID} (Authorized School WiFi)</option>
                )}
                {authSSID !== 'Greenwood_High_Staff_WiFi' && (
                  <option value="Greenwood_High_Staff_WiFi">[Staff] Greenwood_High_Staff_WiFi (Staff WiFi)</option>
                )}
                <option value="School_Guest_Network">[Inactive] School_Guest_Network (Public/Guest Network)</option>
                <option value="LTE_Cellular_Data">[Inactive] Cellular Network (LTE/5G Mobile Carrier)</option>
                <option value="custom">[Configure] Enter Custom SSID...</option>
              </select>

              {isCustom && (
                <input
                  type="text"
                  className="form-input"
                  placeholder="Type WiFi SSID (e.g. My_Home_WiFi)"
                  value={customSSID}
                  onChange={(e) => setCustomSSID(e.target.value)}
                  required
                />
              )}
            </div>
          </div>

          <button type="submit" className="dashboard-btn-primary" disabled={loading || !isAllowed} style={{ margin: 0, width: '100%' }}>
            {loading ? 'Verifying connection...' : '⚡ Mark Daily Attendance'}
          </button>
        </form>
      </div>

      <div className="glass-card" style={{ padding: '24px' }}>
        <h3>My Attendance History</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Your recent check-in timestamps under school WiFi.
        </p>

        {history.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No check-in logs found for today.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
            {history.map((log) => (
              <div key={log._id} style={{ 
                background: 'rgba(255,255,255,0.02)', 
                border: '1px solid var(--border)', 
                borderRadius: '8px', 
                padding: '12px', 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 'bold', 
                    padding: '2px 8px', 
                    borderRadius: '12px', 
                    background: log.status === 'Present' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    color: log.status === 'Present' ? '#10b981' : '#f59e0b',
                    marginRight: '8px'
                  }}>
                    {log.status.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                    {new Date(log.checkInTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>SSID: {log.wifiSSID}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showConfirmModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 15, 26, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease'
        }}>
          <div className="glass-card" style={{
            width: '450px',
            padding: '30px',
            textAlign: 'center',
            border: '1px solid var(--border)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(236, 72, 153, 0.1)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}>
              <RefreshCw size={30} className="spin-anim" />
            </div>
            <h3 style={{ marginBottom: '15px', fontSize: '20px', fontFamily: 'var(--font-title)' }}>Confirm WiFi Connection</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              Are you sure you are connected to the school's authorized WiFi network? Only authorized networks will log attendance. If yes, proceed.
            </p>
            <div style={{ 
              fontSize: '36px', 
              fontWeight: 'bold', 
              color: 'var(--accent)', 
              marginBottom: '24px',
              fontFamily: 'monospace'
            }}>
              {countdown}s
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={cancelCheckIn} 
                className="code-action-btn"
                style={{ margin: 0, flex: 1, padding: '12px' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => performCheckIn(isCustom ? customSSID : wifiSSID)} 
                className="dashboard-btn-primary"
                style={{ margin: 0, flex: 1, padding: '12px' }}
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const detectCurrentWifi = (schoolName) => {
  if (!schoolName) return 'School_Connect_WiFi';
  let cleanName = schoolName
    .replace(/school/gi, '')
    .trim()
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_');
  if (cleanName.endsWith('_')) {
    cleanName = cleanName.slice(0, -1);
  }
  return `${cleanName}_Staff_WiFi`;
};

const WiFiConfigCard = ({ schoolData, onUpdate }) => {
  const [wifiSSID, setWifiSSID] = useState(schoolData?.wifiSSID || 'Greenwood_High_Staff_WiFi');
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (schoolData?.wifiSSID) {
      setWifiSSID(schoolData.wifiSSID);
    }
  }, [schoolData]);

  const handleAutoDetect = async () => {
    setDetecting(true);
    setError('');
    setSuccess('');
    try {
      const res = await axios.get(`${API_URL}/schools/detect-wifi`);
      if (res.data.status === 'success') {
        const detected = res.data.ssid;
        setWifiSSID(detected);
        setSuccess(`Auto-detected current active connection: "${detected}"! Click "Save Settings" to confirm.`);
        setTimeout(() => setSuccess(''), 6000);
      }
    } catch (err) {
      const detected = detectCurrentWifi(schoolData?.name);
      setWifiSSID(detected);
      setSuccess(`Auto-detected school profile network: "${detected}"! Click "Save Settings" to confirm.`);
      setTimeout(() => setSuccess(''), 6000);
    } finally {
      setDetecting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await axios.put(`${API_URL}/admin/schools/wifi`, {
        wifiSSID,
        schoolId: schoolData?._id
      });
      if (res.data.status === 'success') {
        setSuccess('WiFi SSID settings saved successfully!');
        if (onUpdate) onUpdate(res.data.school);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save WiFi settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
      <h3>School WiFi Configuration</h3>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        Configure the official authorized school WiFi network SSID. Staff check-ins will only be accepted when matching this name.
      </p>

      {error && <div className="error-banner" style={{ margin: '0 0 16px 0' }}>{error}</div>}
      {success && <div className="success-banner" style={{ margin: '0 0 16px 0' }}>{success}</div>}

      <form onSubmit={handleSave} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '200px' }}>
          <label className="form-label">Authorized SSID *</label>
          <input
            type="text"
            className="form-input"
            value={wifiSSID}
            onChange={(e) => setWifiSSID(e.target.value)}
            required
            placeholder="e.g. Greenwood_High_Staff_WiFi"
          />
        </div>
        <button
          type="button"
          onClick={handleAutoDetect}
          disabled={detecting || loading}
          className="code-action-btn"
          style={{ margin: 0, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', height: '42px' }}
        >
          <RefreshCw size={14} className={detecting ? 'spin-anim' : ''} />
          {detecting ? 'Scanning...' : 'Auto-Detect WiFi'}
        </button>
        <button type="submit" className="dashboard-btn-primary" disabled={loading || detecting} style={{ margin: 0, height: '42px' }}>
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
};

const StaffAttendanceMonitoringLogs = ({ schoolId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const url = schoolId 
        ? `${API_URL}/attendance/staff-logs?schoolId=${schoolId}` 
        : `${API_URL}/attendance/staff-logs`;
      const res = await axios.get(url);
      if (res.data.status === 'success') {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [schoolId]);

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3>Staff Check-in Monitor</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Real-time daily log of staff checking in via School WiFi.
          </p>
        </div>
        <button onClick={fetchLogs} className="code-action-btn" style={{ margin: 0, padding: '6px 12px', fontSize: '12px' }}>
          Refresh Logs
        </button>
      </div>

      {loading ? (
        <p>Loading check-in logs...</p>
      ) : logs.length === 0 ? (
        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No staff has checked in yet today.
        </div>
      ) : (
        <div className="dashboard-table-container">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Role</th>
                <th>Check-in Time</th>
                <th>WiFi SSID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px', fontWeight: '500' }}>{log.staff?.fullName || 'Deleted Staff'}</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {log.staff?.role?.replace('_', ' ')}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {new Date(log.checkInTime).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '13px' }}>{log.wifiSSID}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: 'bold', 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      background: log.status === 'Present' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: log.status === 'Present' ? '#10b981' : '#f59e0b'
                    }}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Calculate active duration in days
const getActiveDurationText = (createdAt) => {
  const created = new Date(createdAt);
  const today = new Date();
  const diffTime = today - created;
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  return `Active since ${created.toLocaleDateString()} (${diffDays} day${diffDays > 1 ? 's' : ''})`;
};

const getMonthlyDistanceData = (historyList) => {
  const monthlyMap = {};
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  // Initialize last 6 months with 0
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    monthlyMap[key] = 0;
  }

  historyList.forEach(trip => {
    let tripDate;
    if (trip.date) {
      const parts = trip.date.split('/');
      if (parts.length === 3) {
        tripDate = new Date(parts[2], parts[0] - 1, parts[1]);
      } else {
        tripDate = new Date(trip.date);
      }
    } else {
      tripDate = new Date(trip.startTime);
    }

    if (!isNaN(tripDate.getTime())) {
      const key = `${monthNames[tripDate.getMonth()]} ${tripDate.getFullYear()}`;
      if (monthlyMap[key] !== undefined) {
        monthlyMap[key] += parseFloat(trip.distance || 0);
      }
    }
  });

  return {
    labels: Object.keys(monthlyMap),
    datasets: [
      {
        label: 'Distance (km)',
        data: Object.values(monthlyMap).map(v => parseFloat(v.toFixed(1))),
        borderColor: '#ec4899',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#ec4899',
        pointBorderColor: '#fff'
      }
    ]
  };
};

// =============================================================
// PRE-REGISTERED STUDENT DIRECTORY MODULE
// =============================================================
const StudentDirectoryModule = ({ defaultSchoolId = null }) => {
  const { user } = useContext(AuthContext);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [manualForm, setManualForm] = useState({
    name: '',
    admissionNumber: '',
    className: 'Class 8',
    section: 'A'
  });
  const [reviewStudents, setReviewStudents] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const activeSchoolId = defaultSchoolId || user?.school;

  const fetchStudents = async () => {
    if (!activeSchoolId) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/admin/pre-students?schoolId=${activeSchoolId}`);
      if (res.data.status === 'success') {
        setStudents(res.data.students);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch student directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [activeSchoolId]);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!manualForm.name.trim() || !manualForm.admissionNumber.trim() || !manualForm.className.trim() || !manualForm.section.trim()) {
      setError('Please fill in all manual student fields');
      return;
    }
    try {
      const payload = {
        schoolId: activeSchoolId,
        students: [
          {
            name: manualForm.name.trim(),
            admissionNumber: manualForm.admissionNumber.trim(),
            className: manualForm.className.trim(),
            section: manualForm.section.trim().toUpperCase()
          }
        ]
      };
      const res = await axios.post(`${API_URL}/admin/pre-students/batch`, payload);
      if (res.data.status === 'success') {
        setSuccess('Student added successfully!');
        setManualForm({ name: '', admissionNumber: '', className: 'Class 8', section: 'A' });
        fetchStudents();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add student manually');
    }
  };

  const handleDelete = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student from the directory? Linked parents will lose access.')) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      const res = await axios.delete(`${API_URL}/admin/pre-students/${studentId}`);
      if (res.data.status === 'success') {
        setSuccess('Student record deleted successfully.');
        fetchStudents();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete student record');
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are supported for directory extraction');
      return;
    }
    setIsExtracting(true);
    setError('');
    setSuccess('');
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result.split(',')[1];
        const res = await axios.post(`${API_URL}/admin/pre-students/extract-pdf`, { pdfBase64: base64Data });
        if (res.data.status === 'success') {
          if (res.data.students.length === 0) {
            setError('Could not extract any student records. Verify format or enter manually.');
          } else {
            setReviewStudents(res.data.students);
            setSuccess(`Extracted ${res.data.students.length} student rows! Review below.`);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to parse PDF directory');
      } finally {
        setIsExtracting(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read PDF file');
      setIsExtracting(false);
    };
    reader.readAsDataURL(file);
  };

  const updateReviewCell = (index, key, val) => {
    setReviewStudents(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: val };
      return copy;
    });
  };

  const deleteReviewRow = (index) => {
    setReviewStudents(prev => prev.filter((_, i) => i !== index));
  };

  const addReviewRow = () => {
    setReviewStudents(prev => [
      ...prev,
      { name: 'New Student', admissionNumber: 'ADM' + Date.now().toString().slice(-5), className: 'Class 8', section: 'A' }
    ]);
  };

  const submitBatchDirectory = async () => {
    if (reviewStudents.length === 0) return;
    setError('');
    setSuccess('');
    try {
      const payload = { schoolId: activeSchoolId, students: reviewStudents };
      const res = await axios.post(`${API_URL}/admin/pre-students/batch`, payload);
      if (res.data.status === 'success') {
        setSuccess(`Successfully saved ${res.data.count} students.`);
        setReviewStudents([]);
        fetchStudents();
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload batch');
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.className.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  return (
    <div className="vertical-stack" style={{ gap: '24px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <GraduationCap style={{ color: 'var(--accent)' }} size={24} />
        Student Directory Manager
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
        Pre-register students in the database. Parents will search this list during registration to claim their child. Matches are linked using the student's admission number.
      </p>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          
          {/* Manual Add Card */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} style={{ color: 'var(--accent)' }} /> Add Student Manually
            </h3>
            
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '12px' }}>Student Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Aarav Sharma"
                  value={manualForm.name}
                  onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12px' }}>Admission Number *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. ADM2026-101"
                  value={manualForm.admissionNumber}
                  onChange={(e) => setManualForm({ ...manualForm, admissionNumber: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '12px' }}>Class *</label>
                  <select
                    className="form-select"
                    value={manualForm.className}
                    onChange={(e) => setManualForm({ ...manualForm, className: e.target.value })}
                  >
                    <option value="Class 8">Class 8</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '12px' }}>Section *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. A"
                    value={manualForm.section}
                    onChange={(e) => setManualForm({ ...manualForm, section: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="action-btn-primary" style={{ marginTop: '8px' }}>
                Add to Directory
              </button>
            </form>
          </div>

          {/* PDF Extractor Card */}
          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={16} style={{ color: 'var(--accent)' }} /> Extract from PDF Directory
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
                Upload your school's student directory PDF. The system will automatically parse and extract names, admission numbers, classes, and sections.
              </p>
            </div>
            
            <div>
              <label 
                className="locked-field-wrapper" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: '12px', 
                  background: 'rgba(255,255,255,0.02)', 
                  padding: '24px', 
                  borderRadius: '8px', 
                  border: '2px dashed var(--border)',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <Upload size={28} style={{ color: 'var(--accent)', animation: isExtracting ? 'spin 2s linear infinite' : 'none' }} />
                <div>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
                    {isExtracting ? 'Extracting text...' : 'Click to Upload Student PDF'}
                  </span>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Accepts standard text-based PDF rosters</p>
                </div>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  disabled={isExtracting}
                />
              </label>
            </div>
          </div>
        </div>

        {/* PDF Review Panel */}
        {reviewStudents.length > 0 && (
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>Verify & Edit Directory Preview</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Review the extracted data below. You can edit cells directly before saving.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={addReviewRow} className="action-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '13px' }}>
                  <Plus size={14} /> Add Row
                </button>
                <button type="button" onClick={() => setReviewStudents([])} className="action-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '13px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <X size={14} /> Cancel
                </button>
                <button type="button" onClick={submitBatchDirectory} className="action-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 16px', fontSize: '13px' }}>
                  <Save size={14} /> Save Directory
                </button>
              </div>
            </div>

            <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Student Full Name</th>
                    <th>Admission No</th>
                    <th>Class</th>
                    <th>Section</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewStudents.map((stud, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '4px 8px' }}>
                        <input
                          type="text"
                          className="form-input"
                          style={{ height: '32px', fontSize: '13px', padding: '4px 8px', background: 'rgba(255,255,255,0.02)' }}
                          value={stud.name}
                          onChange={(e) => updateReviewCell(idx, 'name', e.target.value)}
                        />
                      </td>
                      <td style={{ padding: '4px 8px' }}>
                        <input
                          type="text"
                          className="form-input"
                          style={{ height: '32px', fontSize: '13px', padding: '4px 8px', background: 'rgba(255,255,255,0.02)' }}
                          value={stud.admissionNumber}
                          onChange={(e) => updateReviewCell(idx, 'admissionNumber', e.target.value)}
                        />
                      </td>
                      <td style={{ padding: '4px 8px' }}>
                        <select
                          className="form-select"
                          style={{ height: '32px', fontSize: '13px', padding: '0 8px', background: '#1c1b22' }}
                          value={stud.className}
                          onChange={(e) => updateReviewCell(idx, 'className', e.target.value)}
                        >
                          <option value="Class 8">Class 8</option>
                          <option value="Class 9">Class 9</option>
                          <option value="Class 10">Class 10</option>
                          <option value="Class 11">Class 11</option>
                          <option value="Class 12">Class 12</option>
                        </select>
                      </td>
                      <td style={{ padding: '4px 8px' }}>
                        <input
                          type="text"
                          className="form-input"
                          style={{ height: '32px', fontSize: '13px', padding: '4px 8px', background: 'rgba(255,255,255,0.02)' }}
                          value={stud.section}
                          onChange={(e) => updateReviewCell(idx, 'section', e.target.value.toUpperCase())}
                        />
                      </td>
                      <td style={{ textAlign: 'center', padding: '4px 8px' }}>
                        <button
                          type="button"
                          onClick={() => deleteReviewRow(idx)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}
                          title="Delete Row"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Directory List Card */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>School Student Directory ({students.length} Records)</h3>
            <input
              type="text"
              placeholder="Search by name or admission number..."
              className="form-input"
              style={{ maxWidth: '300px', height: '36px', padding: '0 12px', fontSize: '13px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>Loading student directory...</p>
          ) : filteredStudents.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px', border: '1px dashed var(--border)', borderRadius: '6px' }}>
              No student directory records found. Add students manually or upload a PDF roster above to get started.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Admission No</th>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Parent Registration Status</th>
                    <th style={{ width: '60px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((stud) => (
                    <tr key={stud._id}>
                      <td style={{ fontWeight: '500' }}>{stud.name}</td>
                      <td>{stud.admissionNumber}</td>
                      <td>{stud.className}</td>
                      <td>{stud.section}</td>
                      <td>
                        {stud.parent ? (
                          <span style={{ color: '#10b981', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '500' }}>Linked Account</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{stud.parent.fullName} ({stud.parent.email})</span>
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>Unlinked (Pending Registration)</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleDelete(stud._id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}
                          title="Delete Student"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================================
// CLASS TIMETABLE MODULE
// =============================================================
const ClassTimetableModule = ({ viewOnly = false }) => {
  const { user } = useContext(AuthContext);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [periods, setPeriods] = useState([]);
  
  // UI state
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state for adding/editing periods
  const [newPeriod, setNewPeriod] = useState({
    periodNumber: '',
    time: '',
    subject: '',
    teacherName: ''
  });

  // Class Creation Request states
  const [showRequestClassModal, setShowRequestClassModal] = useState(false);
  const [requestClassName, setRequestClassName] = useState('');
  const [requestSection, setRequestSection] = useState('A');
  const [requestTeacherId, setRequestTeacherId] = useState('');
  const [teachersList, setTeachersList] = useState([]);
  const [requestLoading, setRequestLoading] = useState(false);

  const [isCustomClass, setIsCustomClass] = useState(false);
  const [customClassName, setCustomClassName] = useState('');

  const fetchTeachersForRequest = async () => {
    try {
      const res = await axios.get(`${API_URL}/schools/my-teachers`);
      if (res.data.status === 'success') {
        setTeachersList(res.data.teachers);
        if (res.data.teachers.length > 0) {
          setRequestTeacherId(res.data.teachers[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestClass = async (e) => {
    e.preventDefault();
    if (!requestClassName || !requestSection || !requestTeacherId) {
      setError('Please fill in all details for class creation request.');
      return;
    }
    try {
      setRequestLoading(true);
      const res = await axios.post(`${API_URL}/schools/class-requests`, {
        className: requestClassName,
        section: requestSection,
        classTeacher: requestTeacherId
      });
      if (res.data.status === 'success') {
        setSuccess('Class creation request submitted successfully to Principal & Admin.');
        setShowRequestClassModal(false);
        setRequestClassName('');
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit class request.');
    } finally {
      setRequestLoading(false);
    }
  };

  const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      if (user.role === 'parent') return;
      try {
        const res = await axios.get(`${API_URL}/schools/my-classes`);
        if (res.data.status === 'success') {
          setClasses(res.data.classes);
          // Pre-select teacher's class, or first class
          if (user.role === 'teacher' && user.classAssigned) {
            setSelectedClass(user.classAssigned);
            setSelectedSection(user.sectionAssigned || 'A');
          } else if (res.data.classes.length > 0) {
            setSelectedClass(res.data.classes[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch classes', err);
      }
    };
    fetchClasses();
    if (user && user.role === 'teacher') {
      setRequestTeacherId(user.id || user._id);
    }
  }, [user]);

  // Lock selectors for parent
  useEffect(() => {
    if (user.role === 'parent' && user.classAssigned) {
      setSelectedClass(user.classAssigned);
      setSelectedSection(user.sectionAssigned || 'A');
    }
  }, [user]);

  // Fetch timetable for selected class/section
  const fetchTimetable = async () => {
    if (!selectedClass || !selectedSection) return;
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`${API_URL}/timetable`, {
        params: { classId: selectedClass, section: selectedSection }
      });
      if (res.data.status === 'success') {
        const dayRecord = res.data.timetable.find(t => t.day === selectedDay);
        if (dayRecord) {
          setPeriods(dayRecord.periods);
        } else {
          setPeriods([]);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load timetable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
    setIsEditMode(false);
  }, [selectedClass, selectedSection, selectedDay]);

  // Check editing permission
  const canEdit = !viewOnly && (
    ['super_admin', 'school_admin', 'principal'].includes(user.role) ||
    (user.role === 'teacher' && user.classAssigned && user.classAssigned.toString() === selectedClass.toString() && user.sectionAssigned === selectedSection)
  );

  const handleAddPeriod = (e) => {
    e.preventDefault();
    setError('');
    
    if (!newPeriod.periodNumber || !newPeriod.time || !newPeriod.subject || !newPeriod.teacherName) {
      setError('Please fill in all period details.');
      return;
    }

    const pNum = Number(newPeriod.periodNumber);
    if (isNaN(pNum) || pNum <= 0) {
      setError('Period number must be a positive number.');
      return;
    }

    // Check duplicate
    if (periods.some(p => p.periodNumber === pNum)) {
      setError(`Period number ${pNum} is already defined.`);
      return;
    }

    const updated = [...periods, {
      periodNumber: pNum,
      time: newPeriod.time.trim(),
      subject: newPeriod.subject.trim(),
      teacherName: newPeriod.teacherName.trim()
    }].sort((a, b) => a.periodNumber - b.periodNumber);

    setPeriods(updated);
    setNewPeriod({ periodNumber: '', time: '', subject: '', teacherName: '' });
  };

  const handleRemovePeriod = (idx) => {
    const updated = [...periods];
    updated.splice(idx, 1);
    setPeriods(updated);
  };

  const handleSaveTimetable = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const res = await axios.post(`${API_URL}/timetable`, {
        classId: selectedClass,
        section: selectedSection,
        day: selectedDay,
        periods: periods
      });
      if (res.data.status === 'success') {
        setSuccess(`Successfully saved timetable for ${selectedDay}.`);
        setIsEditMode(false);
        fetchTimetable();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save timetable.');
    } finally {
      setLoading(false);
    }
  };

  const currentClassName = classes.find(c => c._id === selectedClass)?.name || '';
  const isClassSelectorLocked = user.role === 'teacher' && user.classAssigned;

  if (user.role === 'teacher' && !user.classAssigned) {
    const handleSelfRequestClass = async (e) => {
      e.preventDefault();
      const classNameToSubmit = isCustomClass ? customClassName : requestClassName;
      if (!classNameToSubmit || !requestSection) {
        setError('Please select or enter a class name and section.');
        return;
      }
      try {
        setRequestLoading(true);
        setError('');
        setSuccess('');
        const res = await axios.post(`${API_URL}/schools/class-requests`, {
          className: classNameToSubmit,
          section: requestSection,
          classTeacher: user.id || user._id
        });
        if (res.data.status === 'success') {
          setSuccess('Class assignment request submitted successfully to Principal & Admin.');
          setCustomClassName('');
          setRequestClassName('');
          setIsCustomClass(false);
          setTimeout(() => setSuccess(''), 5000);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to submit class request.');
      } finally {
        setRequestLoading(false);
      }
    };

    return (
      <div className="glass-card" style={{ padding: '30px', marginBottom: '24px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <AlertTriangle size={48} style={{ color: 'var(--accent)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '20px', fontFamily: 'var(--font-title)', marginBottom: '10px' }}>Classroom Assignment Required</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            You are not currently assigned to any classroom. You cannot view or modify timetables until you are assigned.
            Please select your class and section below to send an assignment request to the School Administrator and Principal.
          </p>
        </div>

        {error && <div className="error-banner" style={{ margin: '0 0 16px 0' }}>{error}</div>}
        {success && <div className="success-banner" style={{ margin: '0 0 16px 0' }}>{success}</div>}

        <form onSubmit={handleSelfRequestClass}>
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label className="form-label">Select Class *</label>
            {classes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <select
                  className="form-select"
                  value={isCustomClass ? 'custom' : requestClassName}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setIsCustomClass(true);
                      setRequestClassName('');
                    } else {
                      setIsCustomClass(false);
                      setRequestClassName(e.target.value);
                    }
                  }}
                  required
                >
                  <option value="">-- Select Class --</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls.name}>{cls.name}</option>
                  ))}
                  <option value="custom">[Other] Enter Custom Class Name...</option>
                </select>
                {isCustomClass && (
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Custom Class Name (e.g. Class 10)"
                    value={customClassName}
                    onChange={(e) => setCustomClassName(e.target.value)}
                    required
                  />
                )}
              </div>
            ) : (
              <input
                type="text"
                className="form-input"
                placeholder="Enter Class Name (e.g. Class 10)"
                value={customClassName}
                onChange={(e) => {
                  setCustomClassName(e.target.value);
                  setIsCustomClass(true);
                }}
                required
              />
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Section *</label>
            <select
              className="form-select"
              value={requestSection}
              onChange={(e) => setRequestSection(e.target.value)}
              required
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
            </select>
          </div>

          <button
            type="submit"
            className="dashboard-btn-primary"
            disabled={requestLoading}
            style={{ margin: 0, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {requestLoading ? 'Submitting Request...' : '⚡ Send Assignment Request'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontFamily: 'var(--font-title)' }}>Class Timetable Schedule</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {user.role === 'parent' 
              ? `Weekly class schedule for your student in ${currentClassName} - ${selectedSection}`
              : 'Configure or view day-by-day timetable periods.'}
          </p>
        </div>
        
        {/* Class Selection for Staff */}
        {user.role !== 'parent' ? (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <select
                className="form-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                disabled={isEditMode || isClassSelectorLocked}
                style={{ padding: '8px 12px', fontSize: '14px' }}
              >
                <option value="">-- Select Class --</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>{cls.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <select
                className="form-select"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                disabled={isEditMode || isClassSelectorLocked}
                style={{ padding: '8px 12px', fontSize: '14px' }}
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
            </div>
            {user.role === 'teacher' && (
              <button
                onClick={() => {
                  setShowRequestClassModal(true);
                  fetchTeachersForRequest();
                }}
                className="code-action-btn"
                style={{ padding: '8px 12px', fontSize: '13px', margin: 0 }}
              >
                + Request Class
              </button>
            )}
          </div>
        ) : (
          !user.classAssigned && user.role === 'teacher' && (
            <button
              onClick={() => {
                setShowRequestClassModal(true);
                fetchTeachersForRequest();
              }}
              className="code-action-btn"
              style={{ padding: '8px 12px', fontSize: '13px', margin: 0 }}
            >
              Request Class Assignment
            </button>
          )
        )}
      </div>

      {error && <div className="error-banner" style={{ margin: '0 0 16px 0' }}>{error}</div>}
      {success && <div className="success-banner" style={{ margin: '0 0 16px 0' }}>{success}</div>}

      {/* Days of the Week Selector */}
      <div className="dashboard-tabs" style={{ background: 'rgba(0,0,0,0.1)', padding: '4px', borderRadius: '8px', marginBottom: '20px', gap: '4px' }}>
        {DAYS_OF_WEEK.map((d) => (
          <button
            key={d}
            onClick={() => { if (!isEditMode) setSelectedDay(d); }}
            disabled={isEditMode}
            className={`tab-btn ${selectedDay === d ? 'active' : ''}`}
            style={{ 
              padding: '8px 12px', 
              fontSize: '13px', 
              margin: 0, 
              flex: 1, 
              opacity: isEditMode && selectedDay !== d ? 0.5 : 1,
              cursor: isEditMode ? 'not-allowed' : 'pointer'
            }}
          >
            {d.substring(0, 3)}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading timetable details...</p>}

      {!loading && (
        classes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1.5px dashed var(--border)' }}>
            <Building size={40} style={{ color: 'var(--accent)', marginBottom: '12px', opacity: 0.8 }} />
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>No Classes Created Yet</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 20px' }}>
              No classes have been registered for this school. Please contact the Principal or School Administrator to set up classes, or submit a request to create a class section.
            </p>
            {user.role === 'teacher' && (
              <button
                onClick={() => {
                  setShowRequestClassModal(true);
                  fetchTeachersForRequest();
                }}
                className="dashboard-btn-primary"
                style={{ padding: '10px 20px', fontSize: '14px', margin: '0 auto', display: 'block' }}
              >
                Request Class Creation
              </button>
            )}
          </div>
        ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Action Buttons */}
          {canEdit && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              {!isEditMode ? (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="code-action-btn"
                  style={{ margin: 0, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Edit2 size={14} /> Edit Timetable
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { setIsEditMode(false); fetchTimetable(); }}
                    className="code-action-btn"
                    style={{ margin: 0, padding: '8px 16px', background: 'rgba(255,255,255,0.05)', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <X size={14} /> Cancel
                  </button>
                  <button
                    onClick={handleSaveTimetable}
                    className="dashboard-btn-primary"
                    style={{ margin: 0, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Save size={14} /> Save Changes
                  </button>
                </>
              )}
            </div>
          )}

          {/* Periods Timeline List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {periods.length === 0 ? (
              <div className="glass-card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Clock size={30} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                <p style={{ fontSize: '14px' }}>No period schedules uploaded for {selectedDay}.</p>
                {canEdit && !isEditMode && (
                  <button 
                    onClick={() => setIsEditMode(true)} 
                    className="dashboard-btn-primary" 
                    style={{ marginTop: '12px', fontSize: '13px', padding: '6px 12px' }}
                  >
                    + Create Timetable
                  </button>
                )}
              </div>
            ) : (
              periods.map((p, idx) => (
                <div 
                  key={idx} 
                  className="glass-card" 
                  style={{ 
                    padding: '16px 20px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    gap: '20px',
                    flexWrap: 'wrap',
                    background: 'rgba(255,255,255,0.01)',
                    borderLeft: '4px solid var(--accent)'
                  }}
                >
                  {isEditMode ? (
                    // Edit Mode Inputs
                    <div style={{ display: 'flex', flex: 1, gap: '10px', flexWrap: 'wrap', width: '100%' }}>
                      <div style={{ width: '80px' }}>
                        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Period #</label>
                        <input
                          type="number"
                          className="form-input"
                          value={p.periodNumber}
                          onChange={(e) => {
                            const updated = [...periods];
                            updated[idx].periodNumber = Number(e.target.value);
                            setPeriods(updated);
                          }}
                          required
                          style={{ padding: '8px' }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Time block (e.g. 09:00 - 10:00 AM)</label>
                        <input
                          type="text"
                          className="form-input"
                          value={p.time}
                          onChange={(e) => {
                            const updated = [...periods];
                            updated[idx].time = e.target.value;
                            setPeriods(updated);
                          }}
                          required
                          style={{ padding: '8px' }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Subject</label>
                        <input
                          type="text"
                          className="form-input"
                          value={p.subject}
                          onChange={(e) => {
                            const updated = [...periods];
                            updated[idx].subject = e.target.value;
                            setPeriods(updated);
                          }}
                          required
                          style={{ padding: '8px' }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Teacher Name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={p.teacherName}
                          onChange={(e) => {
                            const updated = [...periods];
                            updated[idx].teacherName = e.target.value;
                            setPeriods(updated);
                          }}
                          required
                          style={{ padding: '8px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button 
                          type="button" 
                          onClick={() => handleRemovePeriod(idx)} 
                          className="logout-btn" 
                          style={{ margin: 0, padding: '10px' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Read Mode Display
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '50%', 
                          background: 'var(--accent-glow)', 
                          color: 'var(--accent)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontWeight: 'bold',
                          fontSize: '16px' 
                        }}>
                          {p.periodNumber}
                        </div>
                        <div>
                          <strong style={{ fontSize: '16px', color: 'var(--text-primary)', display: 'block' }}>{p.subject}</strong>
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>by {p.teacherName}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                        <Clock size={15} style={{ color: 'var(--accent)' }} />
                        {p.time}
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add New Period Form */}
          {isEditMode && (
            <div className="glass-card" style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)' }}>
              <h4 style={{ fontSize: '15px', marginBottom: '12px', color: 'var(--accent)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}><Plus size={16} /> Add New Period</h4>
              <form onSubmit={handleAddPeriod} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ width: '80px' }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Period # *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 1"
                    value={newPeriod.periodNumber}
                    onChange={(e) => setNewPeriod({ ...newPeriod, periodNumber: e.target.value })}
                    required
                  />
                </div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Time *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 09:00 AM - 10:00 AM"
                    value={newPeriod.time}
                    onChange={(e) => setNewPeriod({ ...newPeriod, time: e.target.value })}
                    required
                  />
                </div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Subject *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Mathematics"
                    value={newPeriod.subject}
                    onChange={(e) => setNewPeriod({ ...newPeriod, subject: e.target.value })}
                    required
                  />
                </div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Teacher Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Mrs. Jane Doe"
                    value={newPeriod.teacherName}
                    onChange={(e) => setNewPeriod({ ...newPeriod, teacherName: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="code-action-btn" style={{ margin: 0, padding: '10px 18px', background: 'var(--accent)', border: '1px solid var(--accent)', color: '#fff' }}>
                  Add Period
                </button>
              </form>
            </div>
          )}
        </div>
        )
      )}

      {/* Request Class Creation Modal */}
      {showRequestClassModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <h3 className="dashboard-form-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} /> Request Class Creation
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Submit a request to school principal and administration to create a class section and assign its teacher.
            </p>
            <form onSubmit={handleRequestClass}>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label className="form-label">Class Name/ID *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Class 11"
                  value={requestClassName}
                  onChange={(e) => setRequestClassName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label className="form-label">Section *</label>
                <select
                  className="form-select"
                  value={requestSection}
                  onChange={(e) => setRequestSection(e.target.value)}
                  required
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="D">Section D</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Class Teacher *</label>
                <select
                  className="form-select"
                  value={requestTeacherId}
                  onChange={(e) => setRequestTeacherId(e.target.value)}
                  required
                >
                  <option value="">-- Select Class Teacher --</option>
                  {teachersList.map((t) => (
                    <option key={t._id} value={t._id}>{t.fullName} ({t.email})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowRequestClassModal(false)}
                  className="code-action-btn"
                  style={{ padding: '10px 20px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="dashboard-btn-primary"
                  disabled={requestLoading}
                  style={{ margin: 0 }}
                >
                  {requestLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// CLASS CREATION REQUESTS MANAGEMENT
const ClassRequestsManagement = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`${API_URL}/schools/class-requests`);
      if (res.data.status === 'success') {
        setRequests(res.data.requests);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch class requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id) => {
    try {
      setError('');
      setSuccess('');
      const res = await axios.post(`${API_URL}/schools/class-requests/${id}/approve`);
      if (res.data.status === 'success') {
        setSuccess('Class creation request approved successfully! Class created and teacher assigned.');
        fetchRequests();
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleReject = async (id) => {
    try {
      setError('');
      setSuccess('');
      const res = await axios.post(`${API_URL}/schools/class-requests/${id}/reject`);
      if (res.data.status === 'success') {
        setSuccess('Class creation request rejected.');
        fetchRequests();
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject request');
    }
  };

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <h3>Class Creation Requests</h3>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
        Review and approve requests from teachers to create classes, set sections, and assign class teachers.
      </p>

      {error && <div className="error-banner" style={{ margin: '0 0 16px 0' }}>{error}</div>}
      {success && <div className="success-banner" style={{ margin: '0 0 16px 0' }}>{success}</div>}

      {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading requests...</p>}

      <div className="dashboard-table-container">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Class & Section</th>
              <th>Requested By</th>
              <th>Assigned Teacher</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No class requests submitted yet.</td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req._id}>
                  <td><strong>{req.className} - {req.section}</strong></td>
                  <td>
                    <span>{req.requester?.fullName}</span>
                    <span className="badge" style={{ marginLeft: '6px', fontSize: '10px' }}>{req.requester?.role?.replace('_', ' ')}</span>
                  </td>
                  <td>
                    <strong>{req.classTeacher?.fullName}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{req.classTeacher?.email}</div>
                  </td>
                  <td>
                    <span className={`badge ${req.status === 'approved' ? 'badge-active' : req.status === 'rejected' ? 'badge-inactive' : 'badge-role teacher'}`}>
                      {req.status}
                    </span>
                  </td>
                  <td>
                    {req.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleApprove(req._id)}
                          className="code-action-btn"
                          style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#34d399', margin: 0 }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(req._id)}
                          className="code-action-btn"
                          style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171', margin: 0 }}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Completed</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// SHARED SCHEDULES MANAGEMENT MODULE (Admin & Principal)
// -------------------------------------------------------------
export const AdminSchedulesModule = ({ user }) => {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  
  // Schedule Doc info
  const [scheduleDocId, setScheduleDocId] = useState('');
  const [scheduleData, setScheduleData] = useState({
    monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
  });
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [isPermanent, setIsPermanent] = useState(false);

  // Editor states
  const [selectedDay, setSelectedDay] = useState('monday');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // New period form states
  const [periodNum, setPeriodNum] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [periodDuration, setPeriodDuration] = useState('45');

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (selectedTeacherId) {
      fetchTeacherSchedule(selectedTeacherId);
    } else {
      resetScheduleState();
    }
  }, [selectedTeacherId]);

  const fetchMetadata = async () => {
    try {
      const [teachersRes, classesRes] = await Promise.all([
        axios.get(`${API_URL}/schools/my-teachers`),
        axios.get(`${API_URL}/schools/my-classes`)
      ]);
      if (teachersRes.data.status === 'success') {
        setTeachers(teachersRes.data.teachers || []);
      }
      if (classesRes.data.status === 'success') {
        setClasses(classesRes.data.classes || []);
      }
    } catch (err) {
      console.error('Failed to load metadata', err);
      setError('Failed to fetch school details (classes/teachers).');
    }
  };

  const fetchTeacherSchedule = async (teacherId) => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`${API_URL}/schedules/teacher/${teacherId}`);
      if (res.data.status === 'success' && res.data.schedule) {
        const doc = res.data.schedule;
        setScheduleDocId(doc._id);
        setValidFrom(doc.validFrom ? new Date(doc.validFrom).toISOString().split('T')[0] : '');
        setValidTo(doc.validTo ? new Date(doc.validTo).toISOString().split('T')[0] : '');
        setIsPermanent(!!doc.isPermanent);
        setScheduleData({
          monday: doc.schedule?.monday || [],
          tuesday: doc.schedule?.tuesday || [],
          wednesday: doc.schedule?.wednesday || [],
          thursday: doc.schedule?.thursday || [],
          friday: doc.schedule?.friday || [],
          saturday: doc.schedule?.saturday || [],
          sunday: doc.schedule?.sunday || []
        });
      } else {
        resetScheduleState(false); // don't clear selected teacher
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load schedule for selected teacher.');
    } finally {
      setLoading(false);
    }
  };

  const resetScheduleState = (clearTeacher = true) => {
    if (clearTeacher) setSelectedTeacherId('');
    setScheduleDocId('');
    setValidFrom('');
    setValidTo('');
    setIsPermanent(false);
    setScheduleData({
      monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
    });
    setError('');
    setSuccess('');
  };

  const handleAddPeriod = (e) => {
    e.preventDefault();
    if (!periodNum || !subjectName || !selectedClass || !selectedSection || !periodDuration) {
      setError('Please fill in all period details (Period, Subject, Class, Section, Duration).');
      return;
    }

    const pNum = parseInt(periodNum, 10);
    const dur = parseInt(periodDuration, 10);

    // Check if period already exists for this day
    const dayPeriods = scheduleData[selectedDay] || [];
    if (dayPeriods.some(p => p.periodNumber === pNum)) {
      setError(`Period ${pNum} is already assigned on ${selectedDay.toUpperCase()}`);
      return;
    }

    const newPeriod = {
      periodNumber: pNum,
      subject: subjectName.trim(),
      class: selectedClass,
      section: selectedSection,
      room: roomNumber.trim() || undefined,
      duration: dur
    };

    setScheduleData(prev => ({
      ...prev,
      [selectedDay]: [...(prev[selectedDay] || []), newPeriod].sort((a, b) => a.periodNumber - b.periodNumber)
    }));

    // Reset inputs
    setPeriodNum('');
    setSubjectName('');
    setRoomNumber('');
    setError('');
  };

  const handleDeletePeriod = (day, index) => {
    setScheduleData(prev => ({
      ...prev,
      [day]: prev[day].filter((_, idx) => idx !== index)
    }));
  };

  const handleSaveSchedule = async () => {
    if (!selectedTeacherId) {
      setError('Please select a teacher.');
      return;
    }

    if (!isPermanent && (!validFrom || !validTo)) {
      setError('Please specify validity dates or check "Permanent Schedule".');
      return;
    }

    // Verify schedule is not completely empty
    const totalPeriods = Object.values(scheduleData).reduce((acc, curr) => acc + curr.length, 0);
    if (totalPeriods === 0) {
      setError('Please configure at least one period before saving.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const payload = {
        teacherId: selectedTeacherId,
        validFrom: isPermanent ? undefined : validFrom,
        validTo: isPermanent ? undefined : validTo,
        isPermanent,
        schedule: scheduleData
      };

      let res;
      if (scheduleDocId) {
        res = await axios.put(`${API_URL}/schedules/${scheduleDocId}`, payload);
      } else {
        res = await axios.post(`${API_URL}/schedules`, payload);
      }

      if (res.data.status === 'success') {
        setSuccess('Schedule saved successfully and teacher notified! 📅');
        if (res.data.schedule) {
          setScheduleDocId(res.data.schedule._id);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save schedule.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vertical-stack">
      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <div className="responsive-grid-2-1">
        {/* Left Column: Form & Day editor */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 className="dashboard-form-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <span>📅</span> Schedule Grid Editor
          </h3>

          {!selectedTeacherId ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              Select a teacher from the dropdown panel on the right to start editing their schedule.
            </div>
          ) : (
            <div>
              {/* Day selection tabs */}
              <div style={{
                display: 'flex',
                gap: '6px',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '10px',
                marginBottom: '20px',
                overflowX: 'auto'
              }}>
                {daysOfWeek.map(day => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: selectedDay === day ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(255,255,255,0.03)',
                      border: '1px solid',
                      borderColor: selectedDay === day ? '#7c3aed' : 'var(--border)',
                      color: selectedDay === day ? 'white' : 'var(--text-secondary)',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      cursor: 'pointer',
                      fontSize: '13px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>

              {/* Added Periods List */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ color: 'white', fontSize: '14px', marginBottom: '12px', textTransform: 'capitalize' }}>
                  {selectedDay}'s Periods
                </h4>
                
                {(!scheduleData[selectedDay] || scheduleData[selectedDay].length === 0) ? (
                  <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.01)',
                    border: '1px dashed var(--border)',
                    borderRadius: '12px',
                    color: 'var(--text-muted)',
                    fontSize: '13px'
                  }}>
                    No periods configured for {selectedDay} yet. Use the form below to add periods.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {scheduleData[selectedDay].map((p, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(124, 58, 237, 0.08)',
                        border: '1px solid rgba(124, 58, 237, 0.2)',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        animation: 'fadeIn 0.2s ease'
                      }}>
                        <div>
                          <strong style={{ color: 'white', fontSize: '14px' }}>
                            Period {p.periodNumber}: {p.subject}
                          </strong>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Class {p.class}-{p.section} {p.room ? `• Room ${p.room}` : ''} • {p.duration} mins
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeletePeriod(selectedDay, idx)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '8px',
                            color: '#f87171',
                            padding: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#ef4444'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                        >
                          <Trash2 size={14} style={{ color: 'white' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Period Form */}
              <form onSubmit={handleAddPeriod} style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '20px',
                marginTop: '10px'
              }}>
                <h5 style={{ color: 'white', fontSize: '13px', margin: '0 0 16px 0' }}>Add Period to {selectedDay.toUpperCase()}</h5>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>PERIOD NUMBER</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={periodNum}
                      onChange={(e) => setPeriodNum(e.target.value)}
                      className="dashboard-input"
                      placeholder="e.g. 1"
                      style={{ width: '100%', padding: '8px 12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>SUBJECT NAME</label>
                    <input
                      type="text"
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                      className="dashboard-input"
                      placeholder="e.g. Mathematics"
                      style={{ width: '100%', padding: '8px 12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>CLASS</label>
                    <select
                      value={selectedClass}
                      onChange={(e) => {
                        setSelectedClass(e.target.value);
                        const cls = classes.find(c => c.name === e.target.value);
                        if (cls && cls.sections && cls.sections.length > 0) {
                          setSelectedSection(cls.sections[0]);
                        } else {
                          setSelectedSection('');
                        }
                      }}
                      className="dashboard-input"
                      style={{ width: '100%', padding: '8px 12px' }}
                    >
                      <option value="">Select Class</option>
                      {classes.map(c => (
                        <option key={c._id || c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>SECTION</label>
                    <select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      className="dashboard-input"
                      style={{ width: '100%', padding: '8px 12px' }}
                      disabled={!selectedClass}
                    >
                      <option value="">Select Section</option>
                      {(() => {
                        const cls = classes.find(c => c.name === selectedClass);
                        return cls?.sections?.map(s => (
                          <option key={s} value={s}>{s}</option>
                        )) || null;
                      })()}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>ROOM (OPTIONAL)</label>
                    <input
                      type="text"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      className="dashboard-input"
                      placeholder="e.g. 104"
                      style={{ width: '100%', padding: '8px 12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>DURATION (MINUTES)</label>
                    <input
                      type="number"
                      min="5"
                      max="120"
                      value={periodDuration}
                      onChange={(e) => setPeriodDuration(e.target.value)}
                      className="dashboard-input"
                      placeholder="45"
                      style={{ width: '100%', padding: '8px 12px' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="dashboard-btn-primary"
                  style={{ margin: 0, padding: '8px 16px', fontSize: '12px', float: 'right' }}
                >
                  ➕ Add Period
                </button>
                <div style={{ clear: 'both' }} />
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Teacher, Validity, Save */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginBottom: '20px' }}>Teacher Assignment</h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px', marginBottom: '6px' }}>SELECT TEACHER</label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="dashboard-input"
                style={{ width: '100%', padding: '10px' }}
              >
                <option value="">Choose Teacher...</option>
                {teachers.map(t => (
                  <option key={t._id} value={t._id}>{t.fullName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginBottom: '20px' }}>Schedule Validity</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="permanent-schedule"
                  checked={isPermanent}
                  onChange={(e) => setIsPermanent(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: '#7c3aed',
                    cursor: 'pointer'
                  }}
                />
                <label htmlFor="permanent-schedule" style={{ color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  Permanent Schedule
                </label>
              </div>

              {!isPermanent && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', animation: 'fadeIn 0.2s ease' }}>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>VALID FROM</label>
                    <input
                      type="date"
                      value={validFrom}
                      onChange={(e) => setValidFrom(e.target.value)}
                      className="dashboard-input"
                      style={{ width: '100%', padding: '8px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>VALID TO</label>
                    <input
                      type="date"
                      value={validTo}
                      onChange={(e) => setValidTo(e.target.value)}
                      className="dashboard-input"
                      style={{ width: '100%', padding: '8px' }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <button
                onClick={handleSaveSchedule}
                disabled={loading || !selectedTeacherId}
                className="dashboard-btn-primary"
                style={{ flex: 1, margin: 0, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {loading ? 'Saving...' : (
                  <>
                    <Save size={16} /> Save Schedule & Notify
                  </>
                )}
              </button>
              
              <button
                onClick={() => resetScheduleState(true)}
                className="btn-incident"
                style={{ margin: 0, padding: '12px' }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// SHARED SCHOOL CALENDAR MODULE (All Roles)
// -------------------------------------------------------------
export const SchoolCalendarModule = ({ user, canEdit }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarEntries, setCalendarEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mobile responsiveness
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isWeekStripView, setIsWeekStripView] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  // Filter dropdown
  const [filterType, setFilterType] = useState('all');

  // Add/Edit modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalEntryId, setModalEntryId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formDayType, setFormDayType] = useState('holiday');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formNotifyTarget, setFormNotifyTarget] = useState('everyone');
  const [formOverridesSunday, setFormOverridesSunday] = useState(false);

  // Swipe gesture support
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const schoolId = user?.school?._id || user?.school || '';

  const dayTypes = [
    { value: 'working', label: 'Working Day', color: '#FFFFFF' },
    { value: 'sunday', label: 'Sunday Holiday', color: '#EF4444' },
    { value: 'holiday', label: 'Holiday', color: '#EF4444' },
    { value: 'celebration', label: 'Celebration Day', color: '#F59E0B' },
    { value: 'exam', label: 'Exam Day', color: '#F97316' },
    { value: 'half_day', label: 'Half Day', color: '#EAB308' },
    { value: 'event', label: 'Event Day', color: '#3B82F6' }
  ];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchMonthEntries();
  }, [currentDate, schoolId]);

  const fetchMonthEntries = async () => {
    if (!schoolId) return;
    try {
      setLoading(true);
      setError('');
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const res = await axios.get(`${API_URL}/calendar/${schoolId}/${year}-${month}`);
      if (res.data.status === 'success') {
        setCalendarEntries(res.data.entries || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch calendar entries.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) {
      handleNextMonth();
    }
    if (touchStart - touchEnd < -50) {
      handlePrevMonth();
    }
  };

  const getEntryForDate = (date) => {
    return calendarEntries.find(e => {
      const entryDate = new Date(e.date);
      return entryDate.getFullYear() === date.getFullYear() &&
             entryDate.getMonth() === date.getMonth() &&
             entryDate.getDate() === date.getDate();
    });
  };

  const getDayTypeColor = (dayType) => {
    const found = dayTypes.find(d => d.value === dayType);
    return found ? found.color : '#FFFFFF';
  };

  const generateMonthCells = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const cells = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({
        date: new Date(year, month - 1, prevMonthTotalDays - i),
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      cells.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // Next month padding to fill multiple of 7
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      cells.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return cells;
  };

  const generateWeekCells = () => {
    const startOfWeek = new Date(selectedDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day); // go back to Sunday

    const cells = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      cells.push({
        date: d,
        isCurrentMonth: d.getMonth() === currentDate.getMonth()
      });
    }
    return cells;
  };

  const handleCellClick = (cellDate) => {
    setSelectedDate(cellDate);
    const entry = getEntryForDate(cellDate);
    
    if (isMobile) {
      setShowBottomSheet(true);
    } else if (canEdit) {
      openFormModal(cellDate, entry);
    } else if (entry) {
      // Show detail view modal for read-only desktop users
      openDetailModal(entry);
    }
  };

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailEntry, setDetailEntry] = useState(null);

  const openDetailModal = (entry) => {
    setDetailEntry(entry);
    setShowDetailModal(true);
  };

  const openFormModal = (date, entry) => {
    setError('');
    setSuccess('');
    setFormDate(date.toISOString().split('T')[0]);
    if (entry) {
      setModalEntryId(entry._id);
      setFormDayType(entry.dayType);
      setFormTitle(entry.title);
      setFormDescription(entry.description || '');
      setFormNotifyTarget(entry.notifyTarget || 'everyone');
      setFormOverridesSunday(!!entry.overridesSunday);
    } else {
      setModalEntryId('');
      setFormDayType(date.getDay() === 0 ? 'holiday' : 'holiday');
      setFormTitle(date.getDay() === 0 ? 'Sunday Holiday' : '');
      setFormDescription('');
      setFormNotifyTarget(date.getDay() === 0 ? 'none' : 'everyone');
      setFormOverridesSunday(false);
    }
    setShowAddModal(true);
  };

  const handleSaveEntry = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setError('Please provide a title.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const payload = {
        date: formDate,
        dayType: formDayType,
        title: formTitle.trim(),
        description: formDescription.trim(),
        notifyTarget: formNotifyTarget
      };

      let res;
      // We always send to POST /api/calendar, which finds and updates/overrides
      res = await axios.post(`${API_URL}/calendar`, payload);

      if (res.data.status === 'success') {
        setSuccess('Calendar entry saved successfully!');
        fetchMonthEntries();
        setTimeout(() => {
          setShowAddModal(false);
          setShowBottomSheet(false);
        }, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save calendar entry.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!entryId) return;
    if (!window.confirm('Are you sure you want to delete/revert this entry?')) return;
    try {
      setLoading(true);
      const res = await axios.delete(`${API_URL}/calendar/${entryId}`);
      if (res.data.status === 'success') {
        setSuccess(res.data.message || 'Entry deleted.');
        fetchMonthEntries();
        setTimeout(() => {
          setShowAddModal(false);
          setShowBottomSheet(false);
        }, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete entry.');
    } finally {
      setLoading(false);
    }
  };

  const cells = isWeekStripView && isMobile ? generateWeekCells() : generateMonthCells();
  
  // Format viewed title
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const yearName = currentDate.getFullYear();

  return (
    <div className="glass-card" style={{ padding: isMobile ? '16px' : '24px', animation: 'fadeIn 0.3s ease' }}>
      
      {/* Calendar Header Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div>
          <h2 style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: '800', color: 'white', margin: 0 }}>
            {monthName} {yearName}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0 0' }}>
            {isMobile ? 'Tap cell to see details' : 'Click a cell to manage events'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Filter dropdown */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="dashboard-input"
            style={{ padding: '8px 12px', fontSize: '13px', width: 'auto', margin: 0 }}
          >
            <option value="all">All Days</option>
            {dayTypes.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>

          <button onClick={handlePrevMonth} className="btn-incident" style={{ margin: 0, padding: '8px 12px' }}>◀</button>
          <button onClick={() => setCurrentDate(new Date())} className="btn-incident" style={{ margin: 0, padding: '8px 12px', color: 'white', fontWeight: 'bold' }}>Today</button>
          <button onClick={handleNextMonth} className="btn-incident" style={{ margin: 0, padding: '8px 12px' }}>▶</button>
          
          {isMobile && (
            <button
              onClick={() => setIsWeekStripView(!isWeekStripView)}
              className="dashboard-btn-primary"
              style={{ margin: 0, padding: '8px 12px', fontSize: '12px' }}
            >
              {isWeekStripView ? 'Month View' : 'Week View'}
            </button>
          )}

          {canEdit && !isMobile && (
            <button
              onClick={() => openFormModal(new Date(), null)}
              className="dashboard-btn-primary"
              style={{ margin: 0, padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> Add Entry
            </button>
          )}
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div 
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
        style={{
          background: 'rgba(0,0,0,0.15)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          overflow: 'hidden'
        }}
      >
        {/* Days of Week Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          background: 'rgba(255,255,255,0.02)',
          borderBottom: '1px solid var(--border)',
          textAlign: 'center',
          fontWeight: '700',
          fontSize: '13px',
          color: 'var(--text-secondary)',
          padding: '12px 0'
        }}>
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Cells Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridAutoRows: isMobile ? '60px' : '100px'
        }}>
          {cells.map((cell, idx) => {
            const entry = getEntryForDate(cell.date);
            const isSunday = cell.date.getDay() === 0;
            const dayType = entry ? entry.dayType : (isSunday ? 'sunday' : 'working');
            
            const cellColor = getDayTypeColor(dayType);
            const isToday = new Date().toDateString() === cell.date.toDateString();
            const isSelected = selectedDate.toDateString() === cell.date.toDateString();

            // Handle filter match opacity
            const isFilteredOut = filterType !== 'all' && dayType !== filterType;

            return (
              <div
                key={idx}
                onClick={() => handleCellClick(cell.date)}
                style={{
                  borderRight: (idx + 1) % 7 === 0 ? 'none' : '1px solid var(--border)',
                  borderBottom: idx >= 35 ? 'none' : '1px solid var(--border)',
                  padding: isMobile ? '6px' : '10px',
                  background: isSelected 
                    ? 'rgba(124, 58, 237, 0.15)' 
                    : isToday 
                      ? 'rgba(255,255,255,0.05)' 
                      : 'transparent',
                  opacity: isFilteredOut ? 0.25 : 1,
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected && !isToday) e.currentTarget.style.background = 'transparent';
                  if (isToday && !isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }}
              >
                {/* Date Label */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%'
                }}>
                  <span style={{
                    fontWeight: isToday || isSelected ? '700' : '500',
                    color: !cell.isCurrentMonth 
                      ? 'var(--text-muted)' 
                      : isSunday 
                        ? '#ef4444' 
                        : 'white',
                    fontSize: isMobile ? '12px' : '14px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isToday ? '#7c3aed' : 'transparent',
                    color: isToday ? 'white' : undefined
                  }}>
                    {cell.date.getDate()}
                  </span>

                  {/* Day Type Small Indicator */}
                  {entry && !isMobile && (
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: cellColor
                    }} />
                  )}
                </div>

                {/* Desktop event details summary */}
                {!isMobile && entry && (
                  <div style={{
                    fontSize: '11px',
                    color: cellColor,
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    border: `1px solid ${cellColor}33`,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontWeight: '600',
                    marginTop: '4px'
                  }}>
                    {entry.title}
                  </div>
                )}

                {/* Mobile color dots */}
                {isMobile && entry && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '3px',
                    width: '100%'
                  }}>
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: cellColor
                    }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MOBILE BOTTOM SHEET FOR EVENT DETAILS */}
      {isMobile && showBottomSheet && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 1100,
          animation: 'fadeIn 0.2s ease'
        }} onClick={() => setShowBottomSheet(false)}>
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: '#0F0F23',
              borderTop: '1px solid var(--border)',
              borderRadius: '24px 24px 0 0',
              padding: '24px 20px',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 -10px 30px rgba(0,0,0,0.5)',
              transform: 'translateY(0)',
              transition: 'transform 0.3s ease-out'
            }}
          >
            {/* Sheet Handle */}
            <div style={{
              width: '40px',
              height: '4px',
              background: 'var(--border)',
              borderRadius: '2px',
              margin: '0 auto 16px auto'
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
                {selectedDate.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>
              <button 
                onClick={() => setShowBottomSheet(false)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Event Description */}
            <div style={{ marginTop: '20px' }}>
              {(() => {
                const entry = getEntryForDate(selectedDate);
                const isSunday = selectedDate.getDay() === 0;
                
                if (entry) {
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className={`badge`} style={{
                          backgroundColor: `${getDayTypeColor(entry.dayType)}15`,
                          border: `1px solid ${getDayTypeColor(entry.dayType)}44`,
                          color: getDayTypeColor(entry.dayType),
                          fontSize: '12px',
                          padding: '4px 10px',
                          textTransform: 'capitalize'
                        }}>
                          {entry.dayType.replace('_', ' ')}
                        </span>
                        {entry.overridesSunday && (
                          <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '11px' }}>
                            Sunday Override
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 style={{ color: 'white', fontSize: '16px', fontWeight: '700', margin: '0 0 6px 0' }}>
                          {entry.title}
                        </h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                          {entry.description || 'No description provided.'}
                        </p>
                      </div>

                      {canEdit && (
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                          <button
                            onClick={() => openFormModal(selectedDate, entry)}
                            className="dashboard-btn-primary"
                            style={{ flex: 1, margin: 0, padding: '10px' }}
                          >
                            Edit Entry
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry._id)}
                            style={{
                              flex: 1,
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              borderRadius: '8px',
                              color: '#f87171',
                              padding: '10px',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                } else {
                  return (
                    <div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {isSunday ? 'Sunday Holiday' : 'Normal Working Day.'}
                      </p>
                      {canEdit && (
                        <button
                          onClick={() => openFormModal(selectedDate, null)}
                          className="dashboard-btn-primary"
                          style={{ margin: '16px 0 0 0', width: '100%' }}
                        >
                          Add Event / Holiday
                        </button>
                      )}
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      )}

      {/* READ-ONLY DETAIL POPUP MODAL (DESKTOP) */}
      {!isMobile && showDetailModal && detailEntry && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: 'white' }}>Calendar Event Details</h3>
              <button onClick={() => setShowDetailModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {new Date(detailEntry.date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="badge" style={{
                  backgroundColor: `${getDayTypeColor(detailEntry.dayType)}15`,
                  border: `1px solid ${getDayTypeColor(detailEntry.dayType)}44`,
                  color: getDayTypeColor(detailEntry.dayType)
                }}>
                  {detailEntry.dayType.replace('_', ' ')}
                </span>
                {detailEntry.overridesSunday && (
                  <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>
                    Sunday Override
                  </span>
                )}
              </div>

              <div>
                <h4 style={{ color: 'white', fontSize: '16px', margin: '0 0 8px 0' }}>{detailEntry.title}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                  {detailEntry.description || 'No description provided.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT ENTRY MODAL (DESKTOP / POPUP) */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: 'white' }}>
                {modalEntryId ? 'Edit Calendar Entry' : 'Add Calendar Entry'}
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            {error && <div className="error-banner" style={{ marginBottom: '16px' }}>{error}</div>}
            {success && <div className="success-banner" style={{ marginBottom: '16px' }}>{success}</div>}

            <form onSubmit={handleSaveEntry} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>DATE</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="dashboard-input"
                  style={{ width: '100%', padding: '10px' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>DAY TYPE</label>
                  <select
                    value={formDayType}
                    onChange={(e) => setFormDayType(e.target.value)}
                    className="dashboard-input"
                    style={{ width: '100%', padding: '10px' }}
                  >
                    {dayTypes.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>WHO TO NOTIFY</label>
                  <select
                    value={formNotifyTarget}
                    onChange={(e) => setFormNotifyTarget(e.target.value)}
                    className="dashboard-input"
                    style={{ width: '100%', padding: '10px' }}
                  >
                    <option value="none">Nobody</option>
                    <option value="everyone">Everyone</option>
                    <option value="staff">Staff Only</option>
                    <option value="parents">Parents Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>TITLE</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="dashboard-input"
                  placeholder="e.g. Annual Sports Day"
                  style={{ width: '100%', padding: '10px' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>DESCRIPTION</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="dashboard-input"
                  placeholder="Additional details about the event..."
                  style={{ width: '100%', padding: '10px', minHeight: '80px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="dashboard-btn-primary"
                  style={{ flex: 1, margin: 0, padding: '12px' }}
                >
                  {loading ? 'Saving...' : 'Save Entry'}
                </button>
                
                {modalEntryId && (
                  <button
                    type="button"
                    onClick={() => handleDeleteEntry(modalEntryId)}
                    className="logout-btn"
                    style={{ flex: 1, margin: 0, padding: '12px', background: '#ef4444', borderColor: '#ef4444' }}
                  >
                    Delete Entry
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-incident"
                  style={{ margin: 0, padding: '12px' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export const SuperAdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

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
    if (hrs < 12) return `Good Morning, ${name} 👋`;
    if (hrs < 18) return `Good Afternoon, ${name} 👋`;
    return `Good Evening, ${name} 👋`;
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

  const confirmLogout = () => {
    logout();
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
export const SchoolAdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

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
          setSuccess('School logo updated! ✅');
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

  const confirmLogout = () => {
    logout();
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

          <div className="dashboard-table-container">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Parent Name</th>
                  <th>Parent Email</th>
                  <th>Child Associated</th>
                  <th>Details</th>
                  <th>Relationship</th>
                  <th>Date Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingParents.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No pending parent requests found.</td>
                  </tr>
                ) : (
                  pendingParents.map((parent) => {
                    const student = parent.student;
                    return (
                      <tr key={parent._id}>
                        <td><strong>{parent.fullName}</strong></td>
                        <td>{parent.email}</td>
                        <td>
                          {student ? (
                            <div>
                              <strong>{student.name}</strong>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Class {student.className} - {student.section} {student.rollNumber ? `| Roll: ${student.rollNumber}` : ''}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--danger)' }}>No Child Linked</span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => {
                              alert(`Parent Contact:\nFather: ${parent.fatherName || 'N/A'} (${parent.fatherPhone || 'N/A'})\nMother: ${parent.motherName || 'N/A'} (${parent.motherPhone || 'N/A'})\nEmergency: ${parent.emergencyContact || 'N/A'}\n\nAddress: ${parent.homeAddress || 'N/A'}`);
                            }}
                            className="code-action-btn"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                          >
                            View Full Details
                          </button>
                        </td>
                        <td style={{ textTransform: 'capitalize' }}>{parent.relationship || 'Guardian'}</td>
                        <td>{new Date(parent.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleApproveParent(parent._id)}
                              className="dashboard-btn-primary"
                              style={{ padding: '6px 12px', fontSize: '12px', margin: 0, background: '#10b981', borderColor: '#10b981' }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleOpenRejectParentModal(parent)}
                              className="logout-btn"
                              style={{ padding: '6px 12px', fontSize: '12px', margin: 0, background: '#ef4444', borderColor: '#ef4444' }}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
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
              📢 Request Details Update
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
export const PrincipalDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Data states
  const [schoolCodes, setSchoolCodes] = useState([]);
  const [schoolUsers, setSchoolUsers] = useState([]);
  const [schoolDetails, setSchoolDetails] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [performanceStats, setPerformanceStats] = useState(null);
  const [classDiaries, setClassDiaries] = useState([]);
  const [classes, setClasses] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingParents, setPendingParents] = useState([]);

  // Fleet monitoring states
  const [activeBuses, setActiveBuses] = useState([]);
  const principalMapRef = useRef(null);
  const principalMarkersRef = useRef({});

  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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
          setSuccess('School logo updated! ✅');
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

  async function fetchInitialData(silent = false) {
    try {
      if (!silent) setLoading(true);
      setError('');
      
      const [schoolCodesRes, usersRes, mySchoolRes, attRes, perfRes, diariesRes, classesRes, requestsRes, parentsRes] = await Promise.all([
        axios.get(`${API_URL}/schools/codes`),
        axios.get(`${API_URL}/admin/school-users`),
        axios.get(`${API_URL}/schools/my-school`),
        axios.get(`${API_URL}/attendance/stats`),
        axios.get(`${API_URL}/marks/stats`),
        axios.get(`${API_URL}/diaries/class`),
        axios.get(`${API_URL}/schools/my-classes`),
        axios.get(`${API_URL}/schools/class-requests`),
        axios.get(`${API_URL}/admin/pending-parents`)
      ]);

      if (schoolCodesRes.data.status === 'success') {
        setSchoolCodes(schoolCodesRes.data.codes);
      }
      if (usersRes.data.status === 'success') {
        setSchoolUsers(usersRes.data.users);
      }
      if (mySchoolRes.data.status === 'success') {
        setSchoolDetails(mySchoolRes.data.school);
      }
      if (attRes.data.status === 'success') {
        setAttendanceStats(attRes.data.stats);
      }
      if (perfRes.data.status === 'success') {
        setPerformanceStats(perfRes.data.stats);
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
      setError('Failed to fetch Principal Dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Poll active buses from localStorage
  useEffect(() => {
    let intervalId = null;
    
    const scanBuses = () => {
      const active = [];
      const keys = Object.keys(localStorage);
      keys.forEach(k => {
        if (k.startsWith('bus_') && k.endsWith('_trip')) {
          try {
            const parsed = JSON.parse(localStorage.getItem(k));
            // Check if active and updated within 15 seconds
            if (parsed.active && (Date.now() - (parsed.lastUpdated || 0) < 15000)) {
              active.push(parsed);
            }
          } catch (e) {
            console.error("Failed to parse bus trip in localStorage:", e);
          }
        }
      });
      setActiveBuses(active);
    };

    if (activeTab === 'fleet') {
      scanBuses();
      intervalId = setInterval(scanBuses, 1500);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeTab]);

  // Synchronize Leaflet map for fleet monitoring
  useEffect(() => {
    const L = window.L;
    if (activeTab === 'fleet' && L && activeBuses.length > 0) {
      const container = document.getElementById('principal-fleet-map');
      if (container) {
        if (!principalMapRef.current) {
          const firstBus = activeBuses[0];
          const centerLatLng = [firstBus.currentCoords.lat, firstBus.currentCoords.lng];
          const map = L.map('principal-fleet-map').setView(centerLatLng, 13);
          addSatelliteHybridLayers(map);
          principalMapRef.current = map;
        }

        const map = principalMapRef.current;

        // Clear outdated markers
        Object.keys(principalMarkersRef.current).forEach(key => {
          const isIncidentKey = key.startsWith('incident_');
          const busNum = isIncidentKey ? key.replace('incident_', '') : key;
          if (!activeBuses.find(b => b.busNumber === busNum)) {
            principalMarkersRef.current[key].remove();
            delete principalMarkersRef.current[key];
          }
        });

        // Add or update markers for active buses
        activeBuses.forEach(bus => {
          const latLng = [bus.currentCoords.lat, bus.currentCoords.lng];
          const hasAlert = bus.alertStatus && bus.alertStatus !== 'normal';
          const markerColor = hasAlert ? (bus.alertStatus === 'puncture' ? '#fbbf24' : '#ef4444') : '#10b981';

          const busIcon = L.divIcon({
            html: `<div style="background-color: ${markerColor}; color: white; padding: 6px; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(0,0,0,0.5); border: 2px solid white;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v10c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></div>`,
            className: 'custom-bus-leaflet-icon',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });

          if (!principalMarkersRef.current[bus.busNumber]) {
            principalMarkersRef.current[bus.busNumber] = L.marker(latLng, { icon: busIcon })
              .addTo(map)
              .bindPopup(`<strong>Bus ${bus.busNumber}</strong><br/>Speed: ${bus.speed} km/h<br/>Status: ${hasAlert ? bus.alertStatus.toUpperCase() : 'NORMAL'}`);
          } else {
            principalMarkersRef.current[bus.busNumber].setLatLng(latLng);
            principalMarkersRef.current[bus.busNumber].setIcon(busIcon);
            principalMarkersRef.current[bus.busNumber].setPopupContent(`<strong>Bus ${bus.busNumber}</strong><br/>Speed: ${bus.speed} km/h<br/>Status: ${hasAlert ? bus.alertStatus.toUpperCase() : 'NORMAL'}`);
          }

          // Render/update incident warning marker on Principal map
          const incidentKey = `incident_${bus.busNumber}`;
          if (hasAlert && bus.incidentCoords) {
            const incidentLatLng = [bus.incidentCoords.lat, bus.incidentCoords.lng];
            const alertColor = bus.alertStatus === 'puncture' ? '#fbbf24' : '#ef4444';
            const alertSymbol = bus.alertStatus === 'puncture' 
              ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>' 
              : '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
            const alertTitle = bus.alertStatus === 'puncture' ? 'Puncture' : 'Breakdown';

            const incidentIcon = L.divIcon({
              html: `<div style="background-color: ${alertColor}; color: white; padding: 6px; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(0,0,0,0.5); border: 2px solid white; font-size: 14px;">${alertSymbol}</div>`,
              className: 'custom-incident-leaflet-icon',
              iconSize: [28, 28],
              iconAnchor: [14, 14]
            });

            if (!principalMarkersRef.current[incidentKey]) {
              principalMarkersRef.current[incidentKey] = L.marker(incidentLatLng, { icon: incidentIcon })
                .addTo(map)
                .bindPopup(`<strong>Bus ${bus.busNumber} Incident: ${alertTitle}</strong><br/>Location of incident report`);
            } else {
              principalMarkersRef.current[incidentKey].setLatLng(incidentLatLng);
              principalMarkersRef.current[incidentKey].setIcon(incidentIcon);
            }
          } else {
            if (principalMarkersRef.current[incidentKey]) {
              principalMarkersRef.current[incidentKey].remove();
              delete principalMarkersRef.current[incidentKey];
            }
          }
        });

        // Fit bounds to show all active buses
        if (activeBuses.length > 1) {
          const bounds = L.latLngBounds(activeBuses.map(b => [b.currentCoords.lat, b.currentCoords.lng]));
          map.fitBounds(bounds, { maxZoom: 15, padding: [50, 50] });
        }
      }
    }
  }, [activeBuses, activeTab]);

  // Clean map if tab changes or fleet goes empty
  useEffect(() => {
    if ((activeTab !== 'fleet' || activeBuses.length === 0) && principalMapRef.current) {
      principalMapRef.current.remove();
      principalMapRef.current = null;
      principalMarkersRef.current = {};
    }
  }, [activeTab, activeBuses.length === 0]);

  useEffect(() => {
    document.body.className = 'theme-principal';
    Promise.resolve().then(() => fetchInitialData());

    const interval = setInterval(() => {
      fetchInitialData(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
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

  // Stats aggregation
  const teacherCount = schoolUsers.filter(u => u.role === 'teacher').length;
  const parentCount = schoolUsers.filter(u => u.role === 'parent').length;
  const driverCount = schoolUsers.filter(u => u.role === 'driver').length;

  const principalTabs = [
    { id: 'overview', label: 'Overview & Stats', icon: Building },
    { id: 'secret-codes', label: 'Manage Codes', icon: Milestone },
    { id: 'pending-parents', label: 'Pending Parents', icon: UserCheck },
    { id: 'school-users', label: 'Staff & Parents List', icon: Users },
    { id: 'timetable', label: 'Class Timetables', icon: Calendar },
    { id: 'class-requests', label: 'Class Requests', icon: AlertTriangle },
    { id: 'attendance', label: 'School Attendance', icon: CheckSquare },
    { id: 'performance', label: 'School Performance', icon: Award },
    { id: 'diaries', label: 'Class Diaries', icon: BookOpen },
    { id: 'schedules', label: 'Schedules', icon: Clock },
    { id: 'calendar', label: 'School Calendar', icon: Calendar },
    { id: 'fleet', label: 'School Bus Fleet', icon: Bus },
    { id: 'staff-attendance', label: 'Staff WiFi Attendance', icon: UserCheck },
    { id: 'pre-students', label: 'Student Directory', icon: GraduationCap },
    { id: 'profile', label: 'My Profile', icon: User }
  ];

  return (
    <DashboardLayout
      roleName="principal"
      user={user}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      tabs={principalTabs}
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
          {/* Summary Cards with Icons */}
          <div className="overview-grid">
            <div className="glass-card stat-card" style={{ borderLeft: '4px solid var(--accent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="stat-title">Total Staff (Teachers)</div>
                  <div className="stat-value">{teacherCount}</div>
                </div>
                <Users size={40} style={{ color: 'var(--accent)', opacity: 0.8 }} />
              </div>
              <div className="stat-desc">Registered faculty members</div>
            </div>
            <div className="glass-card stat-card" style={{ borderLeft: '4px solid #EC4899' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="stat-title">Total Students (Parents)</div>
                  <div className="stat-value">{parentCount}</div>
                </div>
                <GraduationCap size={40} style={{ color: '#EC4899', opacity: 0.8 }} />
              </div>
              <div className="stat-desc">Active parent-student connections</div>
            </div>
            <div className="glass-card stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="stat-title">Total Drivers</div>
                  <div className="stat-value">{driverCount}</div>
                </div>
                <Bus size={40} style={{ color: '#3b82f6', opacity: 0.8 }} />
              </div>
              <div className="stat-desc">Active vehicle operators</div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building size={20} style={{ color: 'var(--accent)' }} /> School Profile Info
              </h3>
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
                    <p style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} /> {schoolDetails.phone}
                    </p>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>STREET ADDRESS</p>
                    <p style={{ color: 'var(--text-primary)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} /> {schoolDetails.address}
                    </p>
                  </div>
                  {schoolDetails.wifiSSID && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <p style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>AUTHORIZED WIFI SSID</p>
                      <p style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{schoolDetails.wifiSSID}</p>
                    </div>
                  )}
                  <div style={{ gridColumn: 'span 2', marginTop: '10px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <label htmlFor="principal-school-logo-upload" className="code-action-btn" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', margin: 0, padding: '10px 16px' }}>
                      <Upload size={14} /> Upload School Logo
                    </label>
                    <input 
                      id="principal-school-logo-upload" 
                      type="file" 
                      accept="image/*" 
                      onChange={handleSchoolLogoUpload} 
                      style={{ display: 'none' }} 
                    />
                    <label htmlFor="principal-school-photo-upload" className="code-action-btn" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', margin: 0, padding: '10px 16px' }}>
                      <Upload size={14} /> Upload School Photo
                    </label>
                    <input 
                      id="principal-school-photo-upload" 
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

          <div className="dashboard-table-container">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Parent Name</th>
                  <th>Parent Email</th>
                  <th>Child Associated</th>
                  <th>Details</th>
                  <th>Relationship</th>
                  <th>Date Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingParents.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No pending parent requests found.</td>
                  </tr>
                ) : (
                  pendingParents.map((parent) => {
                    const student = parent.student;
                    return (
                      <tr key={parent._id}>
                        <td><strong>{parent.fullName}</strong></td>
                        <td>{parent.email}</td>
                        <td>
                          {student ? (
                            <div>
                              <strong>{student.name}</strong>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Class {student.className} - {student.section} {student.rollNumber ? `| Roll: ${student.rollNumber}` : ''}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--danger)' }}>No Child Linked</span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => {
                              alert(`Parent Contact:\nFather: ${parent.fatherName || 'N/A'} (${parent.fatherPhone || 'N/A'})\nMother: ${parent.motherName || 'N/A'} (${parent.motherPhone || 'N/A'})\nEmergency: ${parent.emergencyContact || 'N/A'}\n\nAddress: ${parent.homeAddress || 'N/A'}`);
                            }}
                            className="code-action-btn"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                          >
                            View Full Details
                          </button>
                        </td>
                        <td style={{ textTransform: 'capitalize' }}>{parent.relationship || 'Guardian'}</td>
                        <td>{new Date(parent.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleApproveParent(parent._id)}
                              className="dashboard-btn-primary"
                              style={{ padding: '6px 12px', fontSize: '12px', margin: 0, background: '#10b981', borderColor: '#10b981' }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleOpenRejectParentModal(parent)}
                              className="logout-btn"
                              style={{ padding: '6px 12px', fontSize: '12px', margin: 0, background: '#ef4444', borderColor: '#ef4444' }}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
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
              📢 Request Details Update
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
        </div>
      )}

      {activeTab === 'attendance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3>School-wide Daily Attendance Analytics</h3>
            {attendanceStats ? (
              <div className="dashboard-grid" style={{ marginTop: '20px' }}>
                <div style={{ textAlign: 'center', padding: '30px 0', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>TODAY'S ATTENDANCE RATE</span>
                  <div style={{ fontSize: '64px', fontWeight: 'bold', color: attendanceStats.attendanceRate >= 85 ? '#34d399' : '#f87171', margin: '15px 0' }}>
                    {attendanceStats.attendanceRate}%
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Total Marked: <strong>{attendanceStats.totalMarked}</strong> students
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '15px' }}>
                  <h4>Key Metrics</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    • Today, <strong>{attendanceStats.totalPresent}</strong> students have logged into their classrooms as Present or Late.
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    • Target threshold rate of <strong>85% attendance</strong> is {attendanceStats.attendanceRate >= 85 ? 'currently met' : 'not met today'}.
                  </p>
                </div>
              </div>
            ) : (
              <p>Loading attendance rate...</p>
            )}
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <SchoolAttendanceView user={user} />
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3>School-wide Academic Grade Averages</h3>
          {performanceStats ? (
            <div className="dashboard-grid" style={{ marginTop: '20px' }}>
              <div style={{ textAlign: 'center', padding: '30px 0', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>AVERAGE ACADEMIC GRADE</span>
                <div style={{ fontSize: '64px', fontWeight: 'bold', color: 'var(--accent)', margin: '15px 0' }}>
                  {performanceStats.averagePercentage}%
                </div>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Overall Pass Rate: <strong>{performanceStats.passRate}%</strong>
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '15px' }}>
                <h4>Performance Index</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  • Aggregated over <strong>{performanceStats.totalGradesCount}</strong> examination/assessment scores recorded in school database.
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  • Average score indicates school is operating in the {performanceStats.averagePercentage >= 80 ? 'Excellent' : performanceStats.averagePercentage >= 70 ? 'Very Good' : 'Satisfactory'} band.
                </p>
              </div>
            </div>
          ) : (
            <p>Loading grade averages...</p>
          )}
        </div>
      )}

      {activeTab === 'diaries' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3>Classroom Diary Submission Log</h3>
          <div className="dashboard-table-container" style={{ marginTop: '16px', marginBottom: 0 }}>
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Classroom</th>
                  <th>Section</th>
                  <th>Teacher</th>
                  <th>Homework Items</th>
                  <th>Classwork Covered</th>
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
                  classDiaries.map(d => (
                    <tr key={d._id}>
                      <td><strong>{d.class ? d.class.name : 'Class ID ' + d.class}</strong></td>
                      <td>{d.section}</td>
                      <td>{d.teacher?.fullName}</td>
                      <td>{d.homework.length} subjects</td>
                      <td style={{ fontSize: '12px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.classwork}
                      </td>
                      <td style={{ fontSize: '12px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.notice}
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

      {activeTab === 'fleet' && (
        <div className="vertical-stack">
          {/* Active Fleet Map */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', minHeight: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Live School Bus Fleet Tracking</h3>
              <span className="badge badge-active" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="live-pulse"></span> {activeBuses.length} Active Vehicles
              </span>
            </div>
            
            <div style={{ position: 'relative', width: '100%', flex: 1, minHeight: '380px', background: '#0e0e1b', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden' }}>
              {activeBuses.length > 0 ? (
                <div id="principal-fleet-map" style={{ width: '100%', height: '100%', minHeight: '380px', zIndex: 1 }}></div>
              ) : (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,15,26,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '15px', zIndex: 2 }}>
                  <Bus size={48} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: '500', textAlign: 'center', padding: '0 20px' }}>
                    All vehicles are currently offline. No driver shifts active.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Active Fleet List Table */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Vehicles Status Board</h3>
            <div className="dashboard-table-container" style={{ marginBottom: 0 }}>
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Vehicle Number</th>
                    <th>Current Speed</th>
                    <th>Distance Traveled</th>
                    <th>Status / Alerts</th>
                    <th>Last GPS Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {activeBuses.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No vehicles broadcasting live data.</td>
                    </tr>
                  ) : (
                    activeBuses.map((bus) => {
                      const hasAlert = bus.alertStatus && bus.alertStatus !== 'normal';
                      return (
                        <tr key={bus.busNumber}>
                          <td><strong>{bus.busNumber}</strong></td>
                          <td>{bus.speed} km/h</td>
                          <td>{bus.distance} km</td>
                          <td>
                            {hasAlert ? (
                              <span className={`badge alert-${bus.alertStatus}`} style={{ 
                                animation: bus.alertStatus === 'puncture' ? 'flashOrange 2s infinite ease-in-out' : 'flashRed 2s infinite ease-in-out',
                                background: bus.alertStatus === 'puncture' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: bus.alertStatus === 'puncture' ? '#fbbf24' : '#f87171',
                                border: bus.alertStatus === 'puncture' ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(239,68,68,0.3)',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '500'
                              }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <AlertTriangle size={12} /> {bus.alertStatus.toUpperCase()} DELAY
                                </span>
                              </span>
                            ) : (
                              <span className="badge badge-active">NORMAL TRANSMISSION</span>
                            )}
                          </td>
                          <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {new Date(bus.lastUpdated).toLocaleTimeString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'staff-attendance' && (
        <div className="vertical-stack">
          <StaffCheckInModule />
          <div style={{ height: '24px' }}></div>
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

      <LogoutConfirmationModal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
        onConfirm={confirmLogout} 
      />
      <BroadcastDetailsModal 
        isOpen={showBroadcastModal} 
        onClose={() => setShowBroadcastModal(false)} 
        onSubmit={handleBroadcastSubmit} 
        userRole="principal" 
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

export const TeacherDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('diary'); // 'diary', 'attendance', 'marks'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 1. Diary States
  const [diaryData, setDiaryData] = useState({
    homework: [{ subject: '', description: '' }],
    classwork: '',
    reminders: '',
    notice: '',
    teacherNote: ''
  });
  const [todayDiary, setTodayDiary] = useState(null);
  const [showReadStatus, setShowReadStatus] = useState(false);
  const [readStatusData, setReadStatusData] = useState({ totalCount: 0, readCount: 0, parents: [] });
  const [fetchingReadStatus, setFetchingReadStatus] = useState(false);

  // Schedule States
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [fullScheduleDoc, setFullScheduleDoc] = useState(null);
  const [selectedScheduleDay, setSelectedScheduleDay] = useState(
    new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  );
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const fetchReadStatus = async (diaryId) => {
    const id = diaryId || todayDiary?._id;
    if (!id) return;
    try {
      setFetchingReadStatus(true);
      const res = await axios.get(`${API_URL}/diaries/${id}/read-status`);
      if (res.data.status === 'success') {
        setReadStatusData({
          totalCount: res.data.totalCount,
          readCount: res.data.readCount,
          parents: res.data.parents
        });
      }
    } catch (err) {
      console.error('Failed to fetch diary read status', err);
    } finally {
      setFetchingReadStatus(false);
    }
  };

  const toggleReadStatus = () => {
    if (!showReadStatus) {
      fetchReadStatus();
    }
    setShowReadStatus(!showReadStatus);
  };

  // 3. Attendance States
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceShift, setAttendanceShift] = useState('Morning');
  const [attendanceList, setAttendanceList] = useState([]);
  const [attendanceSubmitted, setAttendanceSubmitted] = useState(false);

  // 4. Marks States
  const [marksForm, setMarksForm] = useState({
    subject: 'Mathematics',
    examName: 'Midterm Exam',
    totalMarks: 100
  });
  const [studentMarksList, setStudentMarksList] = useState([]);

  // Transport alerting states
  const [activeAlertBuses, setActiveAlertBuses] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Poll for transport issues to show delay banner in teacher overview
  useEffect(() => {
    const scanBuses = () => {
      const list = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('bus_') && key.endsWith('_trip')) {
          try {
            const trip = JSON.parse(localStorage.getItem(key));
            if (trip && trip.active && (Date.now() - (trip.lastUpdated || 0) < 15000) && trip.alertStatus && trip.alertStatus !== 'normal') {
              list.push(trip);
            }
          } catch (e) {
            console.warn(e);
          }
        }
      }
      setActiveAlertBuses(list);
    };

    scanBuses();
    const interval = setInterval(scanBuses, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper to fetch class list and match attendance/marks
  const fetchClassData = async (silent = false) => {
    if (!user?.classAssigned || !user?.sectionAssigned) {
      return;
    }
    try {
      if (!silent) setLoading(true);
      setError('');
      
      // Fetch attendance which returns all student records for the date and shift
      const attRes = await axios.get(`${API_URL}/attendance/class?date=${attendanceDate}&shift=${attendanceShift}`);
      if (attRes.data.status === 'success') {
        setAttendanceList(attRes.data.attendance);
        setAttendanceSubmitted(!!attRes.data.isSubmitted);
        // Sync student list for marks too
        setStudentMarksList(attRes.data.attendance.map(s => ({
          studentId: s.studentId,
          fullName: s.fullName,
          email: s.email,
          marksObtained: ''
        })));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch class student list.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayDiary = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await axios.get(`${API_URL}/diaries/today`);
      if (res.data.status === 'success' && res.data.diary) {
        setTodayDiary(res.data.diary);
        fetchReadStatus(res.data.diary._id);
        setDiaryData({
          homework: res.data.diary.homework.length > 0 
             ? res.data.diary.homework.map(h => ({ subject: h.subject, description: h.description })) 
             : [{ subject: '', description: '' }],
          classwork: res.data.diary.classwork || '',
          reminders: res.data.diary.reminders || '',
          notice: res.data.diary.notice || '',
          teacherNote: res.data.diary.teacherNote || ''
        });
      } else {
        setTodayDiary(null);
        setDiaryData({
          homework: [{ subject: '', description: '' }],
          classwork: '',
          reminders: '',
          notice: '',
          teacherNote: ''
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodaySchedule = async () => {
    try {
      const res = await axios.get(`${API_URL}/schedules/today/${user._id || user.id}`);
      if (res.data.status === 'success') {
        setTodaySchedule(res.data.periods || []);
      }
    } catch (err) {
      console.error('Failed to fetch today schedule', err);
    }
  };

  const fetchFullSchedule = async () => {
    try {
      setLoadingSchedule(true);
      const res = await axios.get(`${API_URL}/schedules/teacher/${user._id || user.id}`);
      if (res.data.status === 'success') {
        setFullScheduleDoc(res.data.schedule || null);
      }
    } catch (err) {
      console.error('Failed to fetch full schedule', err);
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    document.body.className = 'theme-teacher';
    fetchTodayDiary();
    fetchClassData();
    fetchTodaySchedule();

    const interval = setInterval(() => {
      fetchTodayDiary(true);
      fetchClassData(true);
      fetchTodaySchedule();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'my-schedule') {
      fetchFullSchedule();
    }
    if (activeTab === 'attendance') {
      fetchTodaySchedule();
    }
  }, [activeTab]);

  // Update attendance list when date or shift changes
  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchClassData();
    }
  }, [attendanceDate, attendanceShift, activeTab]);

  // Sync marks list when marks form options change or when tab changes
  useEffect(() => {
    if (activeTab === 'marks') {
      const fetchExistingMarks = async () => {
        try {
          setLoading(true);
          const res = await axios.get(`${API_URL}/marks/class?subject=${marksForm.subject}&examName=${marksForm.examName}`);
          if (res.data.status === 'success' && res.data.marks.length > 0) {
            // Map existing marks
            const mapped = studentMarksList.map(s => {
              const record = res.data.marks.find(m => m.student._id === s.studentId);
              return {
                ...s,
                marksObtained: record ? record.marksObtained : ''
              };
            });
            setStudentMarksList(mapped);
          } else {
            // Clear existing marks input
            setStudentMarksList(prev => prev.map(s => ({ ...s, marksObtained: '' })));
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchExistingMarks();
    }
  }, [marksForm.subject, marksForm.examName, activeTab]);

  // 1. Diary Handlers
  const handleAddHomework = () => {
    setDiaryData({
      ...diaryData,
      homework: [...diaryData.homework, { subject: '', description: '' }]
    });
  };

  const handleRemoveHomework = (idx) => {
    const homeworkCopy = [...diaryData.homework];
    homeworkCopy.splice(idx, 1);
    setDiaryData({ ...diaryData, homework: homeworkCopy });
  };

  const handleDiarySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/diaries`, diaryData);
      if (res.data.status === 'success') {
        setSuccess('Diary submitted successfully for today!');
        if (res.data.timeWarning) {
          setError(res.data.timeWarning);
        }
        fetchTodayDiary();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit classroom diary');
    } finally {
      setLoading(false);
    }
  };


  // 3. Attendance Handlers
  const handleAttendanceChange = (studentId, status) => {
    setAttendanceList(prev => prev.map(s => 
      s.studentId === studentId ? { ...s, status } : s
    ));
  };

  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const unmarkedStudents = attendanceList.filter(s => !s.status);
    if (unmarkedStudents.length > 0) {
      setError(`Please explicitly mark all students. ${unmarkedStudents.length} student(s) are unmarked.`);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/attendance`, {
        date: attendanceDate,
        shift: attendanceShift,
        attendanceData: attendanceList.map(s => ({
          studentId: s.studentId,
          status: s.status
        }))
      });
      if (res.data.status === 'success') {
        setSuccess('Attendance logs saved successfully for ' + attendanceDate);
        setAttendanceSubmitted(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit attendance');
    } finally {
      setLoading(false);
    }
  };

  // 4. Marks Handlers
  const handleMarkChange = (studentId, value) => {
    setStudentMarksList(prev => prev.map(s => 
      s.studentId === studentId ? { ...s, marksObtained: value } : s
    ));
  };

  const handleMarksSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    const invalid = studentMarksList.some(s => s.marksObtained !== '' && (isNaN(s.marksObtained) || Number(s.marksObtained) > marksForm.totalMarks || Number(s.marksObtained) < 0));
    if (invalid) {
      setError('Please input valid scores. Marks cannot exceed Total Marks or be negative.');
      return;
    }

    const marksToSubmit = studentMarksList
      .filter(s => s.marksObtained !== '')
      .map(s => ({
        studentId: s.studentId,
        subject: marksForm.subject,
        examName: marksForm.examName,
        marksObtained: Number(s.marksObtained),
        totalMarks: Number(marksForm.totalMarks)
      }));

    if (marksToSubmit.length === 0) {
      setError('Please enter marks for at least one student.');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/marks`, {
        marksData: marksToSubmit
      });
      if (res.data.status === 'success') {
        setSuccess('Exam marks posted successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit marks');
    } finally {
      setLoading(false);
    }
  };

  const teacherTabs = [
    { id: 'diary', label: 'Class Diary', icon: BookOpen },
    { id: 'timetable', label: 'Class Timetable', icon: Calendar },
    { id: 'my-schedule', label: 'My Schedule', icon: Clock },
    { id: 'attendance', label: 'Class Attendance', icon: CheckSquare },
    { id: 'marks', label: 'Exam Marks', icon: Award },
    { id: 'checkin', label: 'WiFi Attendance', icon: UserCheck },
    { id: 'calendar', label: 'School Calendar', icon: Calendar },
    { id: 'profile', label: 'My Profile', icon: User }
  ];

  const teacherRoleName = user?.classAssigned 
    ? `Teacher (Class ${user.classAssigned}-${user.sectionAssigned || 'A'})` 
    : 'Teacher';

  return (
    <DashboardLayout
      roleName={teacherRoleName}
      user={user}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      tabs={teacherTabs}
      handleLogout={() => setShowLogoutModal(true)}
    >

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      {/* Active Transport Delay Bulletin */}
      {activeAlertBuses.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {activeAlertBuses.map(bus => (
            <div key={bus.busNumber} className={`incident-alert-banner alert-${bus.alertStatus}`} style={{ margin: 0 }}>
              <AlertTriangle size={18} />
              <div>
                <strong>Active Transport Delay: Bus {bus.busNumber} reported a {bus.alertStatus.toUpperCase()} alert!</strong>
                <span style={{ fontSize: '13px', marginLeft: '10px', color: 'inherit', opacity: 0.9 }}>
                  Students commuting on this vehicle may arrive late.
                </span>
              </div>
            </div>
          ))}
        </div>
      )}



      {/* Classroom Diary Tab */}
      {activeTab === 'diary' && (
        !user?.classAssigned || !user?.sectionAssigned ? (
          <div className="glass-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '12px' }}>Classroom Not Assigned</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
              You are currently not assigned as a class teacher. To submit daily classroom diaries, you must be assigned to a classroom and section.
            </p>
            <button 
              onClick={() => setActiveTab('timetable')} 
              className="dashboard-btn-primary"
              style={{ display: 'inline-block', width: 'auto', margin: '0 auto' }}
            >
              Go to Timetable to Request Assignment
            </button>
          </div>
        ) : (
          <div className="responsive-grid-3-2">
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '16px' }}>Submit Today's Diary</h3>
              <form onSubmit={handleDiarySubmit} className="dashboard-form" style={{ background: 'transparent', border: 'none', padding: 0 }}>
                
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Class Homework Checklist</span>
                    <button type="button" onClick={handleAddHomework} className="code-action-btn" style={{ padding: '4px 10px', fontSize: '12px' }}>
                      + Add Subject
                    </button>
                  </label>
                   {diaryData.homework.map((hw, idx) => (
                    <div key={idx} className="homework-row" style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                      <input
                        type="text"
                        placeholder="Subject (e.g. Science)"
                        className="form-input"
                        value={hw.subject}
                        onChange={(e) => {
                          const copy = [...diaryData.homework];
                          copy[idx].subject = e.target.value;
                          setDiaryData({ ...diaryData, homework: copy });
                        }}
                        required
                        style={{ maxWidth: '150px' }}
                      />
                      <textarea
                        placeholder="Homework description"
                        className="form-input"
                        rows={1}
                        value={hw.description}
                        onChange={(e) => {
                          const copy = [...diaryData.homework];
                          copy[idx].description = e.target.value;
                          setDiaryData({ ...diaryData, homework: copy });
                        }}
                        required
                        style={{ flex: 1, resize: 'vertical' }}
                      />
                      {diaryData.homework.length > 1 && (
                        <button type="button" onClick={() => handleRemoveHomework(idx)} className="logout-btn" style={{ padding: '10px', margin: 0, display: 'flex', alignItems: 'center' }}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="form-group">
                  <label className="form-label">Classwork Done Today *</label>
                  <textarea
                    className="form-input"
                    placeholder="Details of subjects covered in class..."
                    rows={2}
                    value={diaryData.classwork}
                    onChange={(e) => setDiaryData({ ...diaryData, classwork: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reminders *</label>
                  <textarea
                    className="form-input"
                    placeholder="e.g. Bring lab coats tomorrow..."
                    rows={2}
                    value={diaryData.reminders}
                    onChange={(e) => setDiaryData({ ...diaryData, reminders: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Critical Notice Board *</label>
                  <textarea
                    className="form-input"
                    placeholder="Official announcements..."
                    rows={2}
                    value={diaryData.notice}
                    onChange={(e) => setDiaryData({ ...diaryData, notice: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Teacher's Note (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="A friendly message for parents..."
                    value={diaryData.teacherNote}
                    onChange={(e) => setDiaryData({ ...diaryData, teacherNote: e.target.value })}
                  />
                </div>

                <button type="submit" className="dashboard-btn-primary" disabled={loading} style={{ width: '100%' }}>
                  {loading ? 'Submitting Diary...' : 'Publish Diary Entry'}
                </button>
              </form>
            </div>

            <div>
              <div className="glass-card" style={{ padding: '24px', marginBottom: '20px' }}>
                <h3>Today's Submissions</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '8px 0 16px 0' }}>
                  Today's class diary submission log.
                </p>

                {todayDiary ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '12px', borderRadius: '8px', fontSize: '13px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckSquare size={16} /> Diary published for today!
                    </div>
                    {todayDiary.lastEditedAt && (
                      <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', color: '#60a5fa' }}>
                        ✏️ Last edited at {new Date(todayDiary.lastEditedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PUBLISHED AT</span>
                      <p style={{ fontSize: '14px', fontWeight: 'bold' }}>
                        {new Date(todayDiary.postedAt || todayDiary.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    
                     <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'white', marginBottom: '12px' }}>Parent Read Status</h4>
                      
                      <button
                        type="button"
                        onClick={toggleReadStatus}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          color: 'white',
                          fontWeight: '600',
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          transition: 'background 0.2s ease, transform 0.1s ease',
                          marginBottom: '10px'
                        }}
                      >
                        {showReadStatus 
                          ? '👁️ Hide who read diary' 
                          : `👁️ View who read diary (${readStatusData.readCount}/${readStatusData.totalCount})`
                        }
                      </button>

                      {showReadStatus && (
                        <div style={{ 
                          marginTop: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          animation: 'slideDown 0.3s ease-out forwards',
                          overflow: 'hidden'
                        }}>
                          <style>{`
                            @keyframes slideDown {
                              from { max-height: 0; opacity: 0; }
                              to { max-height: 400px; opacity: 1; }
                            }
                          `}</style>
                          
                          <div>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '500' }}>
                              {readStatusData.readCount} of {readStatusData.totalCount} parents read
                            </p>
                            {readStatusData.totalCount > 0 && (
                              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ 
                                  width: `${(readStatusData.readCount / readStatusData.totalCount) * 100}%`, 
                                  height: '100%', 
                                  background: '#10B981', 
                                  borderRadius: '4px',
                                  transition: 'width 0.5s ease-out'
                                }}></div>
                              </div>
                            )}
                          </div>

                          <div style={{
                            maxHeight: '220px', 
                            overflowY: 'auto',
                            background: 'rgba(0,0,0,0.15)',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            padding: '12px'
                          }}>
                            {fetchingReadStatus ? (
                              <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: 0, fontSize: '13px' }}>Loading read status...</p>
                            ) : readStatusData.parents.length === 0 ? (
                              <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: 0, fontSize: '13px' }}>No parents assigned to this class yet.</p>
                            ) : (
                              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {readStatusData.parents.map((p) => {
                                  const timeStr = p.markedAsRead && p.readAt
                                    ? new Date(p.readAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : 'Not read yet';
                                  return (
                                    <li key={p.parentId} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: p.markedAsRead ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                      <span>{p.markedAsRead ? '✅' : '❌'}</span>
                                      <span style={{ fontWeight: p.markedAsRead ? '600' : 'normal' }}>
                                        {p.fullName} — {timeStr}
                                      </span>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '14px', borderRadius: '8px', fontSize: '13px', color: '#fbbf24' }}>
                    No diary submitted yet today. Classroom diaries must be logged daily.
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
            <h3>Log Student Attendance</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
              {/* Shift Segmented Selector */}
              <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setAttendanceShift('Morning')}
                  className="code-action-btn"
                  style={{
                    margin: 0,
                    padding: '6px 12px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    background: attendanceShift === 'Morning' ? 'var(--accent)' : 'transparent',
                    borderColor: 'transparent',
                    color: attendanceShift === 'Morning' ? 'white' : 'var(--text-secondary)',
                    fontWeight: attendanceShift === 'Morning' ? '600' : 'normal'
                  }}
                >
                  🌅 Morning Shift
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceShift('Afternoon')}
                  className="code-action-btn"
                  style={{
                    margin: 0,
                    padding: '6px 12px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    background: attendanceShift === 'Afternoon' ? 'var(--accent)' : 'transparent',
                    borderColor: 'transparent',
                    color: attendanceShift === 'Afternoon' ? 'white' : 'var(--text-secondary)',
                    fontWeight: attendanceShift === 'Afternoon' ? '600' : 'normal'
                  }}
                >
                  ☀️ Afternoon Shift
                </button>
              </div>

              {/* Date Input - Locked/Disabled */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label className="form-label" style={{ margin: 0, fontSize: '13px' }}>Date:</label>
                <input
                  type="date"
                  className="form-input"
                  value={attendanceDate}
                  disabled={true}
                  style={{ width: '140px', padding: '6px 10px', opacity: 0.8, cursor: 'not-allowed' }}
                />
              </div>
            </div>
          </div>

          {(() => {
            const getFullDayPeriods = (periodsList) => {
              const maxPeriod = periodsList && periodsList.length > 0
                ? Math.max(6, ...periodsList.map(p => p.periodNumber))
                : 6;
              const fullList = [];
              for (let i = 1; i <= maxPeriod; i++) {
                const existing = periodsList ? periodsList.find(p => p.periodNumber === i) : null;
                if (existing) {
                  fullList.push(existing);
                } else {
                  fullList.push({
                    periodNumber: i,
                    subject: 'Free Period',
                    class: '',
                    section: '',
                    room: '',
                    duration: 45
                  });
                }
              }
              return fullList;
            };

            return attendanceSubmitted ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px', margin: '0 auto 20px auto', width: '100%' }}>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid #10B981',
                  padding: '16px',
                  borderRadius: '12px',
                  color: '#10B981',
                  fontSize: '15px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  textAlign: 'center'
                }}>
                  ✅ Attendance Submitted!
                </div>

                <div className="glass-card" style={{ padding: '24px', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
                    <span>📅</span> Your Schedule Today
                  </h4>
                  {todaySchedule && todaySchedule.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {getFullDayPeriods(todaySchedule).map((p, idx) => {
                        const isFree = p.subject.toLowerCase() === 'free period' || p.subject.toLowerCase() === 'free';
                        return (
                          <React.Fragment key={idx}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: isFree ? 'rgba(255, 255, 255, 0.02)' : 'rgba(124, 58, 237, 0.08)',
                              border: '1px solid var(--border)',
                              padding: '12px 16px',
                              borderRadius: '8px'
                            }}>
                              <span style={{ fontWeight: '600', color: isFree ? 'var(--text-secondary)' : 'white', fontSize: '14px' }}>
                                P{p.periodNumber}: {p.subject}
                              </span>
                              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                {isFree ? 'Free Period' : `Class ${p.class}${p.section}`}
                              </span>
                            </div>
                            {p.periodNumber === 4 && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '10px',
                                background: 'rgba(245, 158, 11, 0.1)',
                                border: '1px dashed rgba(245, 158, 11, 0.3)',
                                borderRadius: '8px',
                                color: '#fbbf24',
                                fontWeight: '600',
                                margin: '4px 0'
                              }}>
                                <span>🍽️</span> Lunch Break
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <p style={{ fontWeight: 'bold', fontSize: '15px', color: 'white', marginBottom: '4px' }}>📅 No schedule assigned</p>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Contact your principal</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleAttendanceSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  {!user?.classAssigned || !user?.sectionAssigned ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 24px', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
                      <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>You are currently not assigned as a class teacher.</p>
                      <button 
                        type="button"
                        onClick={() => setActiveTab('timetable')} 
                        className="code-action-btn"
                        style={{ margin: '0 auto', display: 'block' }}
                      >
                        Go to Timetable to Request Assignment
                      </button>
                    </div>
                  ) : attendanceList.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 24px', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
                      No parents/students registered to your class.
                    </div>
                  ) : (
                    attendanceList.map((student) => (
                      <div
                        key={student.studentId}
                        className="glass-card"
                        style={{
                          padding: '14px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '15px',
                          flexWrap: 'wrap',
                          borderLeft: student.status === 'Present' ? '4px solid #10b981' : student.status === 'Absent' ? '4px solid #ef4444' : '4px solid var(--border)',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <div style={{ flex: '1 1 200px', minWidth: '0' }}>
                          <strong style={{ display: 'block', fontSize: '15px', color: 'white', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                            {student.fullName}
                          </strong>
                          <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                            {student.email}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          {/* Present Button */}
                          <button
                            type="button"
                            disabled={attendanceSubmitted || loading}
                            onClick={() => handleAttendanceChange(student.studentId, 'Present')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 14px',
                              borderRadius: '20px',
                              border: '1px solid',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: attendanceSubmitted ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s ease',
                              background: student.status === 'Present' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                              borderColor: student.status === 'Present' ? '#10b981' : 'rgba(255,255,255,0.08)',
                              color: student.status === 'Present' ? '#34d399' : 'var(--text-secondary)'
                            }}
                          >
                            <CheckCircle size={14} style={{ opacity: student.status === 'Present' ? 1 : 0.4 }} />
                            <span>Present</span>
                          </button>

                          {/* Absent Button */}
                          <button
                            type="button"
                            disabled={attendanceSubmitted || loading}
                            onClick={() => handleAttendanceChange(student.studentId, 'Absent')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 14px',
                              borderRadius: '20px',
                              border: '1px solid',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: attendanceSubmitted ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s ease',
                              background: student.status === 'Absent' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                              borderColor: student.status === 'Absent' ? '#ef4444' : 'rgba(255,255,255,0.08)',
                              color: student.status === 'Absent' ? '#f87171' : 'var(--text-secondary)'
                            }}
                          >
                            <X size={14} style={{ opacity: student.status === 'Absent' ? 1 : 0.4 }} />
                            <span>Absent</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {attendanceList.length > 0 && !attendanceSubmitted && (
                  <button type="submit" className="dashboard-btn-primary" disabled={loading} style={{ float: 'right' }}>
                    {loading ? 'Saving Attendance...' : 'Submit Attendance Log'}
                  </button>
                )}
                <div style={{ clear: 'both' }}></div>
              </form>
            );
          })()}
        </div>
      )}

      {/* Marks & Reports Tab */}
      {activeTab === 'marks' && (
        !user?.classAssigned || !user?.sectionAssigned ? (
          <div className="glass-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '12px' }}>Classroom Not Assigned</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
              You are currently not assigned as a class teacher. To enter student grades and exam marks, you must be assigned to a classroom and section.
            </p>
            <button 
              onClick={() => setActiveTab('timetable')} 
              className="dashboard-btn-primary"
              style={{ display: 'inline-block', width: 'auto', margin: '0 auto' }}
            >
              Go to Timetable to Request Assignment
            </button>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '24px' }}>
            <div className="responsive-grid-4" style={{ marginBottom: '20px', alignItems: 'end' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Subject</label>
                <select
                  className="form-select"
                  value={marksForm.subject}
                  onChange={(e) => setMarksForm({ ...marksForm, subject: e.target.value })}
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="English">English</option>
                  <option value="Social Studies">Social Studies</option>
                  <option value="Computer Science">Computer Science</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Exam Title</label>
                <select
                  className="form-select"
                  value={marksForm.examName}
                  onChange={(e) => setMarksForm({ ...marksForm, examName: e.target.value })}
                >
                  <option value="Midterm Exam">Midterm Exam</option>
                  <option value="Finals Exam">Finals Exam</option>
                  <option value="Class Assessment 1">Class Assessment 1</option>
                  <option value="Class Assessment 2">Class Assessment 2</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Maximum Total Marks</label>
                <input
                  type="number"
                  className="form-input"
                  value={marksForm.totalMarks}
                  onChange={(e) => setMarksForm({ ...marksForm, totalMarks: Number(e.target.value) })}
                  min={1}
                  required
                />
              </div>

              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', paddingBottom: '10px' }}>
                Enter scores below. Grades (A+, A, B, C, D, F) calculate automatically.
              </div>
            </div>

            <form onSubmit={handleMarksSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {studentMarksList.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 24px', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
                    No parents/students registered to your class.
                  </div>
                ) : (
                  studentMarksList.map((student) => {
                    const pct = student.marksObtained !== '' && !isNaN(student.marksObtained)
                      ? Math.round((Number(student.marksObtained) / marksForm.totalMarks) * 100)
                      : null;
                    return (
                      <div
                        key={student.studentId}
                        className="glass-card"
                        style={{
                          padding: '16px 20px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '16px',
                          flexWrap: 'wrap',
                          borderLeft: pct !== null ? (pct >= 50 ? '4px solid #10b981' : '4px solid #ef4444') : '4px solid var(--border)',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <div style={{ flex: '1 1 200px', minWidth: '0' }}>
                          <strong style={{ display: 'block', fontSize: '15px', color: 'white' }}>
                            {student.fullName}
                          </strong>
                          <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {student.email}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                          {/* Marks Input */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Score"
                              value={student.marksObtained}
                              onChange={(e) => handleMarkChange(student.studentId, e.target.value)}
                              style={{ width: '85px', padding: '6px 12px', textAlign: 'center', margin: 0 }}
                            />
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>/ {marksForm.totalMarks}</span>
                          </div>

                          {/* Calculated Grade & Percentage Badge */}
                          <div style={{ minWidth: '100px', textAlign: 'right' }}>
                            {pct !== null ? (
                              <span style={{ 
                                display: 'inline-block',
                                fontSize: '12px', 
                                fontWeight: 'bold', 
                                padding: '4px 10px', 
                                borderRadius: '12px', 
                                background: pct >= 50 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: pct >= 50 ? '#34d399' : '#f87171',
                                border: pct >= 50 ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
                              }}>
                                {pct}% ({pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F'})
                              </span>
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Not Entered</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {studentMarksList.length > 0 && (
                <button type="submit" className="dashboard-btn-primary" disabled={loading} style={{ float: 'right' }}>
                  {loading ? 'Posting Marks...' : 'Publish Exam Marks'}
                </button>
              )}
            </form>
          </div>
        )
      )}

      {/* WiFi Attendance Check-in Tab */}
      {activeTab === 'checkin' && (
        <StaffCheckInModule />
      )}

      {activeTab === 'timetable' && (
        <ClassTimetableModule />
      )}

      {activeTab === 'my-schedule' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📅</span> My Weekly Schedule
            </h3>
            
            {/* Horizontal Day selection strip */}
            <div style={{
              display: 'flex',
              gap: '8px',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '12px',
              marginBottom: '20px',
              overflowX: 'auto',
              whiteSpace: 'nowrap'
            }}>
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                const isToday = day === new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                const isSelected = selectedScheduleDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedScheduleDay(day)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '10px',
                      background: isSelected 
                        ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' 
                        : 'rgba(255,255,255,0.02)',
                      border: '1px solid',
                      borderColor: isSelected ? '#7c3aed' : 'var(--border)',
                      color: isSelected ? 'white' : 'var(--text-secondary)',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      cursor: 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {day} {isToday && <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '2px 6px', borderRadius: '4px' }}>Today</span>}
                  </button>
                );
              })}
            </div>

            {loadingSchedule ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>Loading schedule...</div>
            ) : !fullScheduleDoc ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ fontWeight: 'bold', fontSize: '16px', color: 'white', marginBottom: '6px' }}>📅 No schedule assigned</p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Contact your principal</p>
              </div>
            ) : (
              <div>
                {/* Validity Indicator */}
                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  marginBottom: '16px',
                  background: 'rgba(255,255,255,0.02)',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  display: 'inline-block'
                }}>
                  {fullScheduleDoc.isPermanent ? 'Permanent Active Schedule' : `Valid from: ${new Date(fullScheduleDoc.validFrom).toLocaleDateString()} to ${new Date(fullScheduleDoc.validTo).toLocaleDateString()}`}
                </div>

                {/* Periods List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(() => {
                    const dayPeriods = fullScheduleDoc.schedule?.[selectedScheduleDay] || [];
                    const sortedDayPeriods = [...dayPeriods].sort((a,b) => a.periodNumber - b.periodNumber);
                    const getFullDayPeriods = (periodsList) => {
                      const maxPeriod = periodsList && periodsList.length > 0
                        ? Math.max(6, ...periodsList.map(p => p.periodNumber))
                        : 6;
                      const fullList = [];
                      for (let i = 1; i <= maxPeriod; i++) {
                        const existing = periodsList ? periodsList.find(p => p.periodNumber === i) : null;
                        if (existing) {
                          fullList.push(existing);
                        } else {
                          fullList.push({
                            periodNumber: i,
                            subject: 'Free Period',
                            class: '',
                            section: '',
                            room: '',
                            duration: 45
                          });
                        }
                      }
                      return fullList;
                    };
                    
                    const fullList = getFullDayPeriods(sortedDayPeriods);
                    
                    return fullList.map((p, idx) => {
                      const isFree = p.subject.toLowerCase() === 'free period' || p.subject.toLowerCase() === 'free';
                      return (
                        <React.Fragment key={idx}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: isFree ? 'rgba(255, 255, 255, 0.01)' : 'rgba(124, 58, 237, 0.08)',
                            border: '1px solid var(--border)',
                            padding: '14px 18px',
                            borderRadius: '10px'
                          }}>
                            <div>
                              <span style={{ fontWeight: '600', color: isFree ? 'var(--text-secondary)' : 'white', fontSize: '15px' }}>
                                Period {p.periodNumber}: {p.subject}
                              </span>
                              {!isFree && (
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                  Room: {p.room || 'N/A'} • Duration: {p.duration} mins
                                </div>
                              )}
                            </div>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                              {isFree ? 'Free Period' : `Class ${p.class}${p.section}`}
                            </span>
                          </div>
                          {p.periodNumber === 4 && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              padding: '10px',
                              background: 'rgba(245, 158, 11, 0.1)',
                              border: '1px dashed rgba(245, 158, 11, 0.3)',
                              borderRadius: '8px',
                              color: '#fbbf24',
                              fontWeight: '600',
                              margin: '4px 0'
                            }}>
                              <span>🍽️</span> Lunch Break
                            </div>
                          )}
                        </React.Fragment>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <SchoolCalendarModule user={user} canEdit={false} />
      )}

      <LogoutConfirmationModal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
        onConfirm={confirmLogout} 
      />
      {activeTab === 'profile' && (
        <ProfileSettingsTab />
      )}
    </DashboardLayout>
  );
};

// -------------------------------------------------------------
// TRIP ROUTE PLAYBACK ANIMATION MODAL (Swiggy-like replaying)
// -------------------------------------------------------------
export const TripPlaybackPanel = ({ trip, onClose }) => {
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true); // default to autoplay
  const [speed, setSpeed] = useState(67); // default to 3.0x speed (67ms)

  const mapInstanceRef = useRef(null);
  const busMarkerRef = useRef(null);
  const pathPolylineRef = useRef(null);
  const playbackTimerRef = useRef(null);

  const path = trip?.path || [];

  // Reset index and playback when trip changes
  useEffect(() => {
    setPlaybackIndex(0);
    setIsPlaying(true);
    setSpeed(67);
  }, [trip]);

  // Initialize Map
  useEffect(() => {
    const L = window.L;
    if (!L || path.length === 0) return;

    const timer = setTimeout(() => {
      const container = document.getElementById('playback-map-container');
      if (container) {
        // Cleanup old map instance
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

        const startPt = path[0];
        const endPt = path[path.length - 1];

        // Init map
        const map = L.map('playback-map-container').setView([startPt.lat, startPt.lng], 14);
        addSatelliteHybridLayers(map);

        // Start Pin
        L.marker([startPt.lat, startPt.lng], {
          icon: L.divIcon({
            html: `<div style="background-color: #3b82f6; color: white; padding: 4px; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; border: 2px solid white;">S</div>`,
            className: 'custom-start-icon',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        }).addTo(map).bindPopup('Trip Start');

        // End Pin
        L.marker([endPt.lat, endPt.lng], {
          icon: L.divIcon({
            html: `<div style="background-color: #ef4444; color: white; padding: 4px; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; border: 2px solid white;">E</div>`,
            className: 'custom-end-icon',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        }).addTo(map).bindPopup('Trip End');

        // Dotted baseline showing full route
        L.polyline(path, { color: '#94a3b8', weight: 4, dashArray: '5, 10', opacity: 0.6 }).addTo(map);

        // Dynamic colored line showing traveled path
        pathPolylineRef.current = L.polyline([], { color: '#10b981', weight: 5 }).addTo(map);

        // Animated Bus Marker
        const busIcon = L.divIcon({
          html: `<div style="background-color: var(--accent); color: white; padding: 6px; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(0,0,0,0.5); border: 2px solid white;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v10c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></div>`,
          className: 'custom-playback-bus-icon',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
        busMarkerRef.current = L.marker([startPt.lat, startPt.lng], { icon: busIcon }).addTo(map);

        // Fit map bounds
        const bounds = L.latLngBounds(path.map(p => [p.lat, p.lng]));
        map.fitBounds(bounds, { maxZoom: 15 });

        mapInstanceRef.current = map;
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [trip]);

  // Handle playback timer
  useEffect(() => {
    if (isPlaying) {
      playbackTimerRef.current = setInterval(() => {
        setPlaybackIndex((prevIndex) => {
          if (prevIndex >= path.length - 1) {
            setIsPlaying(false);
            return prevIndex;
          }
          return prevIndex + 1;
        });
      }, speed);
    } else {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    }

    return () => {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    };
  }, [isPlaying, speed, path.length]);

  // Synchronize dynamic elements with playback index
  useEffect(() => {
    if (mapInstanceRef.current && path.length > 0) {
      const currentPt = path[playbackIndex];
      if (currentPt) {
        // Move Bus Marker
        if (busMarkerRef.current) {
          busMarkerRef.current.setLatLng([currentPt.lat, currentPt.lng]);
        }
        // Update traveled path polyline
        const traveledSlice = path.slice(0, playbackIndex + 1);
        if (pathPolylineRef.current) {
          pathPolylineRef.current.setLatLngs(traveledSlice);
        }
        // Pan map to keep bus centered during playback
        mapInstanceRef.current.panTo([currentPt.lat, currentPt.lng]);
      }
    }
  }, [playbackIndex, path]);

  const handleTogglePlay = () => {
    if (playbackIndex >= path.length - 1) {
      // Restart from beginning
      setPlaybackIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSliderChange = (e) => {
    setPlaybackIndex(Number(e.target.value));
  };

  return (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 className="dashboard-form-title" style={{ margin: 0 }}>Trip Route Playback</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Vehicle: <strong>{trip.busNumber}</strong> | Date: {trip.date || 'N/A'} | Distance: {trip.distance} km
          </p>
        </div>
        <button onClick={onClose} className="logout-btn" style={{ margin: 0, padding: '8px 16px' }}>
          Close Playback
        </button>
      </div>

      {/* Map Area */}
      <div style={{ width: '100%', height: '350px', background: '#0e0e1b', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden', position: 'relative' }}>
        <div id="playback-map-container" style={{ width: '100%', height: '100%', zIndex: 1 }}></div>
      </div>

      {/* Playback Controls Panel */}
      <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button 
            onClick={handleTogglePlay} 
            className="dashboard-btn-primary" 
            style={{ margin: 0, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            {isPlaying ? 'Pause' : (playbackIndex >= path.length - 1 ? 'Replay' : 'Play')}
          </button>

          {/* Slider */}
          <input 
            type="range" 
            min="0" 
            max={path.length - 1} 
            value={playbackIndex} 
            onChange={handleSliderChange} 
            style={{ flex: 1, accentColor: 'var(--accent)', minWidth: '150px' }} 
          />

          {/* Speed Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Speed:</span>
            <select 
              value={speed} 
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="form-select"
              style={{ margin: 0, padding: '4px 8px', fontSize: '12px', background: 'rgba(0,0,0,0.4)', color: 'white', border: '1px solid var(--border)', borderRadius: '4px' }}
            >
              <option value={400}>0.5x</option>
              <option value={200}>1.0x</option>
              <option value={100}>2.0x</option>
              <option value={67}>3.0x</option>
              <option value={50}>4.0x</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', flexWrap: 'wrap', gap: '8px' }}>
          <span>Start Point: <strong>{trip.startTime}</strong></span>
          <span>Progress: <strong>{Math.round(((playbackIndex + 1) / path.length) * 100)}%</strong> ({playbackIndex + 1} / {path.length} packets)</span>
          <span>End Point: <strong>{trip.endTime}</strong></span>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// LIVE TRACKING METRIC HELPERS (Haversine Formula)
// -------------------------------------------------------------
const getDistanceBetweenCoords = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(3)); // precision distance
};

const calculateTotalDistance = (path) => {
  if (path.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    total += getDistanceBetweenCoords(path[i].lat, path[i].lng, path[i + 1].lat, path[i + 1].lng);
  }
  return parseFloat(total.toFixed(2));
};

const getDurationText = (ms) => {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(' ');
};

// -------------------------------------------------------------
// DRIVER DASHBOARD (REAL MAPS & GEOLOCATION)
// -------------------------------------------------------------
export const DriverDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeSubTab, setActiveSubTab] = useState('drive'); // 'drive' or 'history'
  const [busNumber, setBusNumber] = useState(localStorage.getItem(`driver_bus_num_${user?.id}`) || '');
  const [inputBusNum, setInputBusNum] = useState('');
  
  // Trip Live States
  const [isTripActive, setIsTripActive] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [startLocation, setStartLocation] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [travelPath, setTravelPath] = useState([]);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [alertStatus, setAlertStatus] = useState('normal'); // 'normal', 'puncture', 'breakdown'
  const alertStatusRef = useRef('normal');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [incidentCoords, setIncidentCoords] = useState(null);
  const incidentCoordsRef = useRef(null);
  const incidentMarkerRef = useRef(null);

  // History & Metrics
  const [history, setHistory] = useState(() => {
    const raw = localStorage.getItem(`driver_trip_history_${user?.id}`) || '[]';
    try {
      const parsed = JSON.parse(raw);
      const filtered = filterRecentThreeMonths(parsed);
      if (filtered.length !== parsed.length) {
        localStorage.setItem(`driver_trip_history_${user?.id}`, JSON.stringify(filtered));
      }
      return filtered;
    } catch (e) {
      return [];
    }
  });

  const [dateFilter, setDateFilter] = useState('');

  // Filter history by selected search date
  const filteredHistory = useMemo(() => {
    return history.filter(log => {
      if (!dateFilter) return true;
      const logDateString = new Date(Number(log.id)).toISOString().split('T')[0];
      return logDateString === dateFilter;
    });
  }, [history, dateFilter]);
  
  const [selectedHistoryTrip, setSelectedHistoryTrip] = useState(null);
  const [justCompletedTrip, setJustCompletedTrip] = useState(null);

  // Leaflet refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const polylineRef = useRef(null);

  // Geolocation watch id ref
  const watchIdRef = useRef(null);

  // Clean map instance
  const cleanupMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    markerRef.current = null;
    polylineRef.current = null;
    if (incidentMarkerRef.current) {
      incidentMarkerRef.current.remove();
      incidentMarkerRef.current = null;
    }
  };

  // Synchronize Leaflet view
  useEffect(() => {
    const L = window.L;
    if (isTripActive && currentLocation && L && activeSubTab === 'drive') {
      const container = document.getElementById('driver-map');
      if (container) {
        if (!mapInstanceRef.current) {
          // Init Leaflet map
          const map = L.map('driver-map').setView([currentLocation.lat, currentLocation.lng], 16);
          addSatelliteHybridLayers(map);
          
          const busIcon = L.divIcon({
            html: `<div style="background-color: var(--accent); color: white; padding: 6px; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(0,0,0,0.5); border: 2px solid white;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v10c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></div>`,
            className: 'custom-bus-leaflet-icon',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });

          markerRef.current = L.marker([currentLocation.lat, currentLocation.lng], { icon: busIcon }).addTo(map);
          polylineRef.current = L.polyline(travelPath, { color: '#10b981', weight: 5 }).addTo(map);
          mapInstanceRef.current = map;
        } else {
          // Update leaflet components dynamically
          markerRef.current.setLatLng([currentLocation.lat, currentLocation.lng]);
          polylineRef.current.setLatLngs(travelPath);
          mapInstanceRef.current.panTo([currentLocation.lat, currentLocation.lng]);
        }

        // Draw/update incident warning marker on driver map
        const map = mapInstanceRef.current;
        if (incidentCoords) {
          const incidentLatLng = [incidentCoords.lat, incidentCoords.lng];
          const alertColor = alertStatus === 'puncture' ? '#fbbf24' : '#ef4444';
          const alertSymbol = alertStatus === 'puncture' 
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>' 
            : '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
          const alertTitle = alertStatus === 'puncture' ? 'Puncture' : 'Breakdown';

          const incidentIcon = L.divIcon({
            html: `<div style="background-color: ${alertColor}; color: white; padding: 6px; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(0,0,0,0.5); border: 2px solid white; font-size: 14px;">${alertSymbol}</div>`,
            className: 'custom-incident-leaflet-icon',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });

          if (!incidentMarkerRef.current) {
            incidentMarkerRef.current = L.marker(incidentLatLng, { icon: incidentIcon })
              .addTo(map)
              .bindPopup(`<strong>Incident Reported Here: ${alertTitle}</strong><br/>Coords: ${incidentCoords.lat.toFixed(5)}, ${incidentCoords.lng.toFixed(5)}`)
              .openPopup();
          } else {
            incidentMarkerRef.current.setLatLng(incidentLatLng);
            incidentMarkerRef.current.setIcon(incidentIcon);
            incidentMarkerRef.current.setPopupContent(`<strong>Incident Reported Here: ${alertTitle}</strong><br/>Coords: ${incidentCoords.lat.toFixed(5)}, ${incidentCoords.lng.toFixed(5)}`);
          }
        } else {
          if (incidentMarkerRef.current) {
            incidentMarkerRef.current.remove();
            incidentMarkerRef.current = null;
          }
        }
      }
    }
  }, [currentLocation, isTripActive, travelPath, activeSubTab, incidentCoords, alertStatus]);

  // Clean map if tab changes or trip ends
  useEffect(() => {
    if ((!isTripActive || activeSubTab !== 'drive') && mapInstanceRef.current) {
      cleanupMap();
    }
  }, [isTripActive, activeSubTab]);

  // Heartbeat to keep trip active and update lastUpdated in localStorage
  useEffect(() => {
    let heartbeatInterval = null;
    if (isTripActive && busNumber) {
      heartbeatInterval = setInterval(() => {
        const stored = localStorage.getItem(`bus_${busNumber}_trip`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            parsed.lastUpdated = Date.now();
            localStorage.setItem(`bus_${busNumber}_trip`, JSON.stringify(parsed));
          } catch (e) {
            console.error(e);
          }
        }
      }, 5000); // every 5 seconds
    }
    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, [isTripActive, busNumber]);

  // Incident status update handler
  const handleUpdateAlertStatus = (newStatus) => {
    setAlertStatus(newStatus);
    alertStatusRef.current = newStatus;
    
    let coords = null;
    if (newStatus === 'puncture' || newStatus === 'breakdown') {
      coords = currentLocation || { lat: 12.9716, lng: 77.5946 };
    }
    setIncidentCoords(coords);
    incidentCoordsRef.current = coords;

    const stored = localStorage.getItem(`bus_${busNumber}_trip`);
    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.alertStatus = newStatus;
      parsed.incidentCoords = coords;
      parsed.lastUpdated = Date.now();
      localStorage.setItem(`bus_${busNumber}_trip`, JSON.stringify(parsed));
    }
  };

  // Start shift tracking
  const handleStartTrip = () => {
    if (!busNumber) return;
    setJustCompletedTrip(null);
    setIsTripActive(true);
    setStartTime(Date.now());
    setDistance(0);
    setSpeed(0);
    setAlertStatus('normal');
    alertStatusRef.current = 'normal';

    const L = window.L;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const initialCoord = { lat, lng };
          
          setStartLocation(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          setCurrentLocation(initialCoord);
          setTravelPath([initialCoord]);
          setIncidentCoords(null);
          incidentCoordsRef.current = null;

          localStorage.setItem(
            `bus_${busNumber}_trip`,
            JSON.stringify({
              active: true,
              busNumber,
              speed: 0,
              distance: 0,
              currentCoords: initialCoord,
              path: [initialCoord],
              lastUpdated: Date.now(),
              alertStatus: 'normal',
              incidentCoords: null
            })
          );

          // Watch actual device movements
          watchIdRef.current = navigator.geolocation.watchPosition(
            (movement) => {
              const mLat = movement.coords.latitude;
              const mLng = movement.coords.longitude;
              const mSpeed = movement.coords.speed ? Math.round(movement.coords.speed * 3.6) : Math.floor(Math.random() * 8) + 15; // default moving speed
              const newCoord = { lat: mLat, lng: mLng };

              setCurrentLocation(newCoord);
              setSpeed(mSpeed);
              setTravelPath((prevPath) => {
                const updated = [...prevPath, newCoord];
                const calculatedDist = calculateTotalDistance(updated);
                setDistance(calculatedDist);

                localStorage.setItem(
                  `bus_${busNumber}_trip`,
                  JSON.stringify({
                    active: true,
                    busNumber,
                    speed: mSpeed,
                    distance: calculatedDist,
                    currentCoords: newCoord,
                    path: updated,
                    lastUpdated: Date.now(),
                    alertStatus: alertStatusRef.current,
                    incidentCoords: incidentCoordsRef.current
                  })
                );

                return updated;
              });
            },
            (err) => console.warn("[GeoLocation Error]", err.message),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
          );
        },
        (err) => {
          alert("Error: Location access is required. Fallback to standard mock location.");
          const defaultLoc = { lat: 12.9716, lng: 77.5946 }; // Default Bangalore
          setStartLocation("12.9716, 77.5946");
          setCurrentLocation(defaultLoc);
          setTravelPath([defaultLoc]);

          // Save default coordinates so parent tracker can see it
          localStorage.setItem(
            `bus_${busNumber}_trip`,
            JSON.stringify({
              active: true,
              busNumber,
              speed: 0,
              distance: 0,
              currentCoords: defaultLoc,
              path: [defaultLoc],
              lastUpdated: Date.now(),
              alertStatus: 'normal',
              incidentCoords: null
            })
          );
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  // End active trip and log details
  const handleEndTrip = () => {
    // Clear geolocation trackers
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTripActive(false);
    setSpeed(0);

    const endLocText = currentLocation 
      ? `${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}` 
      : 'N/A';

    const durationMs = Date.now() - startTime;
    const durationText = getDurationText(durationMs);

    // Save trip history log
    const tripLog = {
      id: Date.now().toString(),
      busNumber,
      date: new Date(startTime).toLocaleDateString(),
      startTime: new Date(startTime).toLocaleTimeString(),
      endTime: new Date().toLocaleTimeString(),
      duration: durationText,
      distance: distance,
      startLocation: startLocation || 'N/A',
      endLocation: endLocText,
      path: travelPath
    };

    const updatedHistory = filterRecentThreeMonths([tripLog, ...history]);
    setHistory(updatedHistory);
    localStorage.setItem(`driver_trip_history_${user?.id}`, JSON.stringify(updatedHistory));

    // Save globally to shared bus history in localStorage so parent can read it!
    const sharedHistory = JSON.parse(localStorage.getItem(`bus_${busNumber}_history`) || '[]');
    const updatedShared = filterRecentThreeMonths([tripLog, ...sharedHistory]);
    localStorage.setItem(`bus_${busNumber}_history`, JSON.stringify(updatedShared));

    // Clear active status in shared localStorage
    localStorage.setItem(
      `bus_${busNumber}_trip`,
      JSON.stringify({
        active: false,
        busNumber,
        speed: 0,
        distance,
        currentCoords: currentLocation,
        path: travelPath,
        lastUpdated: Date.now(),
        alertStatus: 'normal',
        incidentCoords: null
      })
    );

    setAlertStatus('normal');
    alertStatusRef.current = 'normal';
    setIncidentCoords(null);
    incidentCoordsRef.current = null;

    alert(`Trip ended. Total distance roamed: ${distance} km in ${durationText}`);
    setJustCompletedTrip(tripLog);
  };

  const handleSetBusNum = (e) => {
    e.preventDefault();
    if (inputBusNum.trim()) {
      const formatted = inputBusNum.trim().toUpperCase();
      setBusNumber(formatted);
      localStorage.setItem(`driver_bus_num_${user?.id}`, formatted);
    }
  };

  const handleChangeBusNum = () => {
    if (isTripActive) {
      alert("Please end the active trip before changing your bus number.");
      return;
    }
    setBusNumber('');
    setInputBusNum('');
    localStorage.removeItem(`driver_bus_num_${user?.id}`);
  };

  // Clear button removed. Logs automatically purge older than 3 months.

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    if (isTripActive) {
      handleEndTrip();
    }
    logout();
    navigate('/login');
  };

  const driverTabs = [
    { id: 'drive', label: 'Trip Management', icon: Navigation },
    { id: 'history', label: 'Trip Logs & History', icon: Calendar },
    { id: 'profile', label: 'My Profile', icon: User }
  ];

  const driverRoleName = busNumber 
    ? `Driver (Bus: ${busNumber})` 
    : 'Driver';

  return (
    <DashboardLayout
      roleName={driverRoleName}
      user={user}
      activeTab={activeSubTab}
      setActiveTab={setActiveSubTab}
      tabs={driverTabs}
      handleLogout={() => setShowLogoutModal(true)}
    >



      {/* Content */}
      {!busNumber ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '500px', margin: '40px auto' }}>
          <Bus size={48} style={{ color: 'var(--accent)', marginBottom: '20px' }} />
          <h2 style={{ marginBottom: '10px' }}>Enter Operating Vehicle</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
            Please enter your Bus Number to begin your shift and broadcast real-time GPS tracking status.
          </p>
          <form onSubmit={handleSetBusNum} style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <input
              type="text"
              placeholder="e.g. BUS-40"
              className="form-input"
              value={inputBusNum}
              onChange={(e) => setInputBusNum(e.target.value)}
              required
              style={{ maxWidth: '200px' }}
            />
            <button type="submit" className="dashboard-btn-primary" style={{ margin: 0 }}>
              Confirm Bus
            </button>
          </form>
        </div>
      ) : activeSubTab === 'drive' ? (
        <div className="vertical-stack">
          {justCompletedTrip && !isTripActive ? (
            <div className="vertical-stack">
              <div className="glass-card" style={{ padding: '24px', background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ color: '#34d399', marginBottom: '4px' }}>🎉 Shift Completed Successfully!</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>You logged a total distance of <strong>{justCompletedTrip.distance} km</strong>. Review your route playback below.</p>
                </div>
                <button 
                  onClick={() => setJustCompletedTrip(null)} 
                  className="code-action-btn"
                  style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'var(--border)', margin: 0 }}
                >
                  Clear Playback & Start New Shift
                </button>
              </div>
              <TripPlaybackPanel 
                trip={justCompletedTrip} 
                onClose={() => setJustCompletedTrip(null)} 
              />
            </div>
          ) : (
            <>
              {/* Driver Stats */}
              <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <span className="badge badge-active" style={{ marginBottom: '8px' }}>
                    Active Vehicle: {busNumber}
                  </span>
                  <h3>Trip Broadcast Console</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Broadcasts your physical coordinate position.</p>
                </div>
                
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Status:</span>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: isTripActive ? '#34d399' : '#f87171' }}>
                      {isTripActive ? 'TRANSMITTING' : 'OFFLINE'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Live Speed:</span>
                    <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{speed} km/h</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Haversine Distance:</span>
                    <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{distance} km</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>GPS Points Recorded:</span>
                    <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{travelPath.length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Last GPS Packet:</span>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                      {isTripActive ? `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}` : 'N/A'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {!isTripActive ? (
                    <button onClick={handleStartTrip} className="dashboard-btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: 0 }}>
                      <Play size={16} /> Start Broadcast Shift
                    </button>
                  ) : (
                    <>


                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', marginTop: '10px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', fontWeight: '600', letterSpacing: '0.05em' }}>
                          REPORT INCIDENT / BROADCAST STATUS
                        </span>
                        <div className="incident-buttons-group">
                          <button 
                            onClick={() => handleUpdateAlertStatus('puncture')}
                            className={`btn-incident ${alertStatus === 'puncture' ? 'active-puncture' : ''}`}
                            type="button"
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          >
                            <AlertTriangle size={14} /> Puncture
                          </button>
                          <button 
                            onClick={() => handleUpdateAlertStatus('breakdown')}
                            className={`btn-incident ${alertStatus === 'breakdown' ? 'active-breakdown' : ''}`}
                            type="button"
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          >
                            <ShieldAlert size={14} /> Breakdown
                          </button>
                          <button 
                            onClick={() => handleUpdateAlertStatus('normal')}
                            className={`btn-incident ${alertStatus === 'normal' || !alertStatus ? 'active-all-clear' : ''}`}
                            type="button"
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          >
                            <CheckCircle size={14} /> All Clear
                          </button>
                        </div>
                      </div>

                      <button onClick={handleEndTrip} className="logout-btn" style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '14px' }}>
                        <Square size={16} /> End Broadcast Shift
                      </button>
                    </>
                  )}
                </div>

                <button onClick={handleChangeBusNum} className="code-action-btn" style={{ width: '100%' }}>
                  Change Bus Number
                </button>
              </div>

              {/* Real Leaflet Map */}
              <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Interactive Street Map</h3>
                    {isTripActive && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Live GPS: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Navigation size={14} className={isTripActive ? 'spin-anim' : ''} /> HTML5 GPS Active
                  </span>
                </div>

                <div style={{ position: 'relative', width: '100%', flex: 1, minHeight: '350px', background: '#0e0e1b', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                  {isTripActive ? (
                    <div id="driver-map" style={{ width: '100%', height: '100%', minHeight: '350px', zIndex: 1 }}></div>
                  ) : (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,15,26,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '15px', zIndex: 2 }}>
                      <Bus size={48} style={{ color: 'var(--text-muted)', animation: 'bounce 2s infinite' }} />
                      <span style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: '500', textAlign: 'center', padding: '0 20px' }}>
                        Broadcaster Offline. Click "Start Broadcast Shift" to open the interactive map and start sharing coordinates.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        /* History Log Tab */
        <div className="vertical-stack">
          {history.length > 0 && (
            <>
              {/* Analytics Summary */}
              <div className="analytics-summary">
                <div className="analytics-card">
                  <div className="analytics-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                    <Milestone size={22} />
                  </div>
                  <div className="analytics-details">
                    <span className="analytics-label">Total Mileage</span>
                    <span className="analytics-val">
                      {history.reduce((sum, item) => sum + parseFloat(item.distance || 0), 0).toFixed(1)} km
                    </span>
                    <span className="analytics-desc">Roamed distance logged</span>
                  </div>
                </div>

                <div className="analytics-card">
                  <div className="analytics-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                    <Clock size={22} />
                  </div>
                  <div className="analytics-details">
                    <span className="analytics-label">Active Duration</span>
                    <span className="analytics-val">
                      {(() => {
                        const totalMins = history.reduce((sum, item) => {
                          let mins = 0;
                          const hourMatch = item.duration.match(/(\d+)\s*h/);
                          const minMatch = item.duration.match(/(\d+)\s*m/);
                          if (hourMatch) mins += parseInt(hourMatch[1]) * 60;
                          if (minMatch) mins += parseInt(minMatch[1]);
                          return sum + mins;
                        }, 0);
                        const hrs = Math.floor(totalMins / 60);
                        const mins = totalMins % 60;
                        return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
                      })()}
                    </span>
                    <span className="analytics-desc">Broadcast hours recorded</span>
                  </div>
                </div>
              </div>

              {/* Monthly Interactive Chart */}
              <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '16px' }}>Monthly Roamed Distance Trend</h3>
                <div style={{ height: '220px', position: 'relative', width: '100%' }}>
                  <Line 
                    data={getMonthlyDistanceData(history)} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false }
                      },
                      scales: {
                        x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: 'var(--text-secondary)', font: { size: 11 } } },
                        y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: 'var(--text-secondary)', font: { size: 11 } } }
                      }
                    }} 
                  />
                </div>
              </div>
            </>
          )}

          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h3>My Shift Route Logs</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Search Date:</span>
                <input 
                  type="date" 
                  value={dateFilter} 
                  onChange={(e) => setDateFilter(e.target.value)} 
                  className="form-input"
                  style={{ padding: '6px 12px', fontSize: '13px', margin: 0, width: '150px' }}
                />
                {dateFilter && (
                  <button 
                    onClick={() => setDateFilter('')} 
                    className="code-action-btn"
                    style={{ padding: '6px 12px', fontSize: '12px', margin: 0 }}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div className="dashboard-table-container desktop-only-table">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Vehicle Number</th>
                    <th>Trip Started</th>
                    <th>Trip Ended</th>
                    <th>Duration</th>
                    <th>Roamed Route Distance</th>
                    <th>Start Point</th>
                    <th>End Point</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        {dateFilter ? 'No trips found for the selected date.' : 'No completed shift routes in history log yet.'}
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((log) => (
                      <tr key={log.id}>
                        <td><strong>{log.busNumber}</strong></td>
                        <td>{log.startTime}</td>
                        <td>{log.endTime}</td>
                        <td>{log.duration}</td>
                        <td><span className="badge badge-role parent">{log.distance} km</span></td>
                        <td style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{log.startLocation}</td>
                        <td style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{log.endLocation}</td>
                        <td>
                          {log.path && log.path.length > 0 && (
                            <button 
                              onClick={() => setSelectedHistoryTrip(log)} 
                              className="code-action-btn"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              View Route
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile-Responsive History Cards */}
            <div className="history-cards-container">
              {filteredHistory.length === 0 ? (
                <div className="glass-card" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {dateFilter ? 'No trips found for the selected date.' : 'No completed shift routes in history log yet.'}
                </div>
              ) : (
                filteredHistory.map((log) => (
                  <div key={log.id} className="history-card-item">
                    <div className="history-card-header">
                      <div className="history-card-header-title">Bus: {log.busNumber}</div>
                      <span className="badge badge-role parent">{log.distance} km</span>
                    </div>
                    <div className="history-card-row">
                      <span className="history-card-label">Date</span>
                      <span className="history-card-value">{log.date || 'N/A'}</span>
                    </div>
                    <div className="history-card-row">
                      <span className="history-card-label">Started</span>
                      <span className="history-card-value">{log.startTime}</span>
                    </div>
                    <div className="history-card-row">
                      <span className="history-card-label">Ended</span>
                      <span className="history-card-value">{log.endTime}</span>
                    </div>
                    <div className="history-card-row">
                      <span className="history-card-label">Duration</span>
                      <span className="history-card-value">{log.duration}</span>
                    </div>
                    <div className="history-card-row">
                      <span className="history-card-label">Start Location</span>
                      <span className="history-card-value" style={{ fontFamily: 'monospace', fontSize: '11px' }}>{log.startLocation}</span>
                    </div>
                    <div className="history-card-row">
                      <span className="history-card-label">End Location</span>
                      <span className="history-card-value" style={{ fontFamily: 'monospace', fontSize: '11px' }}>{log.endLocation}</span>
                    </div>
                    <div className="history-card-actions">
                      {log.path && log.path.length > 0 && (
                        <button 
                          onClick={() => setSelectedHistoryTrip(log)} 
                          className="code-action-btn"
                          style={{ padding: '8px 16px', fontSize: '12px' }}
                        >
                          View Route
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Embedded Playback Panel */}
          {selectedHistoryTrip ? (
            <TripPlaybackPanel 
              trip={selectedHistoryTrip} 
              onClose={() => setSelectedHistoryTrip(null)} 
            />
          ) : (
            <div className="glass-card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Compass size={36} style={{ color: 'var(--text-muted)', marginBottom: '10px' }} />
        </div>
      )}
    </div>
  )}
  <LogoutConfirmationModal 
    isOpen={showLogoutModal} 
    onClose={() => setShowLogoutModal(false)} 
    onConfirm={confirmLogout} 
  />
  {activeSubTab === 'profile' && (
    <ProfileSettingsTab />
  )}
</DashboardLayout>
  );
};

// -------------------------------------------------------------
// PARENT DASHBOARD (REAL MAPS & GEOLOCATION BROADCASTS)
// -------------------------------------------------------------
export const ParentDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('diary'); // 'diary', 'bus', 'attendance', 'timetable', 'marks', 'fees'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSuccessTick, setShowSuccessTick] = useState(false);
  const [isPressingMarkRead, setIsPressingMarkRead] = useState(false);

  // Banner States
  const [parentCalendarEntries, setParentCalendarEntries] = useState([]);
  const [fullTimetable, setFullTimetable] = useState([]);
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const dismissed = localStorage.getItem(`parent_banner_dismissed_${user?.id || user?._id}`);
      return dismissed === todayStr;
    } catch (e) {
      return false;
    }
  });

  const fetchParentCalendarForBanner = async () => {
    if (!user?.school) return;
    try {
      const today = new Date();
      const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      const res = await axios.get(`${API_URL}/calendar/${user.school}/${monthStr}`);
      if (res.data.status === 'success') {
        setParentCalendarEntries(res.data.entries || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 1. Bus Tracking States
  const [busNumber, setBusNumber] = useState('');
  const [inputBusNum, setInputBusNum] = useState(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        const storedBus = localStorage.getItem(`parent_last_tracked_bus_${u.id || u._id}`);
        if (storedBus) return storedBus;
      }
    } catch (e) {
      console.warn(e);
    }
    return '';
  });
  const [tripData, setTripData] = useState(null);
  const [isSearching, setIsSearching] = useState(true);

  const [selectedHistoryTrip, setSelectedHistoryTrip] = useState(null);
  const [parentLocation, setParentLocation] = useState(() => {
    try {
      const stored = localStorage.getItem(`parent_home_location_${user?.id || user?._id}`);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn(e);
    }
    return null;
  });
  const [roadRoutePath, setRoadRoutePath] = useState([]);
  const parentMarkerRef = useRef(null);
  const connectionLineRef = useRef(null);
  const geofenceCircleRef = useRef(null);
  const incidentMarkerRef = useRef(null);
  const hasCenteredMapRef = useRef(false);

  // Home coordinates prompt states
  const [showHomePromptModal, setShowHomePromptModal] = useState(false);
  const [showTrackLocationChoiceModal, setShowTrackLocationChoiceModal] = useState(false);
  const [homeLat, setHomeLat] = useState('');
  const [homeLng, setHomeLng] = useState('');
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptError, setPromptError] = useState('');
  const [promptSuccess, setPromptSuccess] = useState('');

  // Geofencing and watchlist states
  const [trackedBuses, setTrackedBuses] = useState(() => {
    const stored = localStorage.getItem(`parent_tracked_buses_${user?.id}`);
    if (stored) return JSON.parse(stored);
    return ['BUS-40']; // default bus to start with
  });
  const [geofenceRadius, setGeofenceRadius] = useState(() => {
    return parseFloat(localStorage.getItem(`parent_geofence_radius_${user?.id}`) || '1.0');
  });
  const [enableGeofence, setEnableGeofence] = useState(true);
  const [hasNotifiedGeofence, setHasNotifiedGeofence] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [schoolDetails, setSchoolDetails] = useState(null);

  const handleMarkAsRead = async (diaryId) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const res = await axios.post(`${API_URL}/diaries/${diaryId}/mark-read`);
      if (res.data.status === 'success') {
        setShowSuccessTick(true);
        setTimeout(() => setShowSuccessTick(false), 2000);
        // Refresh diary data
        fetchDiaryData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark diary as read');
    } finally {
      setLoading(false);
    }
  };

  // Helper for notification trigger
  const triggerGeofenceNotification = (eta) => {
    // Show in-app banner alert
    setSuccess(`🔔 Geofence Alert: Bus ${busNumber} is within your geofence (${geofenceRadius} km)! Estimated arrival: ${eta} minutes.`);
    setTimeout(() => setSuccess(''), 7000);

    // Browser Push Notification
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`School Bus ${busNumber} Alert`, {
          body: `School Bus is ${eta} minutes away (inside your geofence radius of ${geofenceRadius} km)!`,
          icon: '/favicon.ico'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(`School Bus ${busNumber} Alert`, {
              body: `School Bus is ${eta} minutes away (inside your geofence radius of ${geofenceRadius} km)!`,
              icon: '/favicon.ico'
            });
          }
        });
      }
    }
  };

  const fetchCurrentLocationForPrompt = () => {
    setPromptError('');
    setPromptSuccess('');
    setPromptLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setHomeLat(pos.coords.latitude.toFixed(6));
          setHomeLng(pos.coords.longitude.toFixed(6));
          setPromptSuccess("Successfully fetched coordinates from GPS!");
          setPromptLoading(false);
        },
        (err) => {
          console.warn("[Parent GeoLocation Error]", err.message);
          setPromptError('Failed to access device location: ' + err.message);
          setPromptLoading(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setPromptError('Geolocation is not supported by your browser.');
      setPromptLoading(false);
    }
  };

  const saveHomeCoordinates = async () => {
    setPromptError('');
    setPromptSuccess('');
    const lat = parseFloat(homeLat);
    const lng = parseFloat(homeLng);
    if (isNaN(lat) || isNaN(lng)) {
      setPromptError('Please enter valid latitude and longitude.');
      return;
    }

    try {
      setPromptLoading(true);
      const coords = { lat, lng };
      localStorage.setItem(`parent_home_location_${user?.id || user?._id}`, JSON.stringify(coords));
      localStorage.setItem(`parent_home_prompt_shown_${user?.id || user?._id}`, 'true');

      setParentLocation(coords);

      // Call backend to update profile homeAddress descriptive string
      const coordString = `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      await axios.put(`${API_URL}/auth/update-profile`, { homeAddress: coordString });

      setPromptSuccess('Home coordinates saved successfully! 🏠');
      setTimeout(() => {
        setShowHomePromptModal(false);
        setPromptSuccess('');
      }, 1500);
    } catch (err) {
      setPromptError(err.response?.data?.message || 'Failed to sync with backend profile, but coordinates are saved locally.');
      setTimeout(() => {
        setShowHomePromptModal(false);
      }, 2000);
    } finally {
      setPromptLoading(false);
    }
  };

  const useSavedHomeLocation = () => {
    const storedHome = localStorage.getItem(`parent_home_location_${user?.id || user?._id}`);
    if (storedHome) {
      setParentLocation(JSON.parse(storedHome));
    }
    setShowTrackLocationChoiceModal(false);
  };

  const updateLocationAsHomeLocation = () => {
    setPromptLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          try {
            localStorage.setItem(`parent_home_location_${user?.id || user?._id}`, JSON.stringify(coords));
            localStorage.setItem(`parent_home_prompt_shown_${user?.id || user?._id}`, 'true');
            setParentLocation(coords);

            // Call backend to update profile homeAddress descriptive string
            const coordString = `Coordinates: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
            await axios.put(`${API_URL}/auth/update-profile`, { homeAddress: coordString });

            alert("Successfully updated and saved current location as your home point! 🏠");
            setShowTrackLocationChoiceModal(false);
          } catch (err) {
            console.error(err);
            setParentLocation(coords);
            setShowTrackLocationChoiceModal(false);
          } finally {
            setPromptLoading(false);
          }
        },
        (err) => {
          console.warn("[Parent GeoLocation Error]", err.message);
          alert('Failed to access device location: ' + err.message);
          setPromptLoading(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
      setPromptLoading(false);
    }
  };

  // Reset geofence fired status when trip becomes inactive
  useEffect(() => {
    if (!tripData?.active) {
      setHasNotifiedGeofence(false);
    }
  }, [tripData?.active]);

  // Fetch road routing path from OSRM (like Swiggy)
  useEffect(() => {
    if (!parentLocation || !tripData?.currentCoords) {
      setRoadRoutePath([]);
      setEtaMinutes(null);
      return;
    }

    let isMounted = true;
    const fetchRoute = async () => {
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${parentLocation.lng},${parentLocation.lat};${tripData.currentCoords.lng},${tripData.currentCoords.lat}?overview=full&geometries=geojson`
        );
        const data = await response.json();
        if (isMounted && data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const routeCoords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
          setRoadRoutePath(routeCoords);

          const roadDistanceMeters = data.routes[0].distance;
          const roadDistanceKm = roadDistanceMeters / 1000;
          
          // Calculate ETA
          const busSpeed = Math.max(tripData.speed || 0, 30);
          const eta = Math.round((roadDistanceKm / busSpeed) * 60);
          setEtaMinutes(tripData.active ? eta : null);

          // Geofence check
          if (tripData.active && roadDistanceKm <= geofenceRadius) {
            if (enableGeofence && !hasNotifiedGeofence) {
              triggerGeofenceNotification(eta);
              setHasNotifiedGeofence(true);
            }
          }
        }
      } catch (err) {
        console.warn("OSRM routing failed, fallback to direct line", err);
        // Fallback: calculate haversine distance
        if (parentLocation && tripData.currentCoords) {
          const distKm = getDistanceBetweenCoords(
            parentLocation.lat,
            parentLocation.lng,
            tripData.currentCoords.lat,
            tripData.currentCoords.lng
          );
          const busSpeed = Math.max(tripData.speed || 0, 30);
          const eta = Math.round((distKm / busSpeed) * 60);
          setEtaMinutes(tripData.active ? eta : null);
          
          if (tripData.active && distKm <= geofenceRadius) {
            if (enableGeofence && !hasNotifiedGeofence) {
              triggerGeofenceNotification(eta);
              setHasNotifiedGeofence(true);
            }
          }
        }
      }
    };

    // Small timeout to throttle updates when active coordinates change
    const timer = setTimeout(fetchRoute, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [parentLocation, tripData?.currentCoords, tripData?.active, geofenceRadius, enableGeofence, hasNotifiedGeofence]);

  // 2. Classroom Diary States
  const [todayDiary, setTodayDiary] = useState(null);
  const [diaryHistory, setDiaryHistory] = useState([]);

  // 4. Attendance States
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  // 5. Marks States
  const [reportCard, setReportCard] = useState([]);

  // 6. Fee States
  const [feeDetails, setFeeDetails] = useState(null);
  const [feeLoaded, setFeeLoaded] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');

  // 7. Timetable and Current Period States
  const [timetableData, setTimetableData] = useState([]);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [timetableLoaded, setTimetableLoaded] = useState(false);

  // 8. Pending Parent / Child Linkage States
  const [linkedChild, setLinkedChild] = useState(null);
  const [isEditingChild, setIsEditingChild] = useState(false);
  const [preStudentsList, setPreStudentsList] = useState([]);
  const [childSearchVal, setChildSearchVal] = useState('');
  const [loadingPreStudents, setLoadingPreStudents] = useState(false);
  const [linkMode, setLinkMode] = useState('search'); // 'search' or 'manual'
  const [manualChild, setManualChild] = useState({
    childFullName: '',
    childClass: '',
    childSection: 'A',
    childRollNumber: '',
    childDateOfBirth: ''
  });

  // Leaflet refs
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const polylineRef = useRef(null);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper: Calculate active timetable period
  const calculateActivePeriod = (periodsList) => {
    if (!periodsList || periodsList.length === 0) return null;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const parseTimeToMinutes = (timeStr) => {
      const cleanStr = timeStr.trim().toUpperCase();
      let hours = 0;
      let minutes = 0;
      
      const hasMeridian = cleanStr.includes('AM') || cleanStr.includes('PM');
      if (hasMeridian) {
        const parts = cleanStr.replace(/[AM|PM]/g, '').trim().split(':');
        hours = parseInt(parts[0], 10);
        minutes = parts.length > 1 ? parseInt(parts[1], 10) : 0;
        
        if (cleanStr.includes('PM') && hours !== 12) {
          hours += 12;
        } else if (cleanStr.includes('AM') && hours === 12) {
          hours = 0;
        }
      } else {
        const parts = cleanStr.split(':');
        hours = parseInt(parts[0], 10);
        minutes = parts.length > 1 ? parseInt(parts[1], 10) : 0;
      }
      return hours * 60 + minutes;
    };

    for (const period of periodsList) {
      const timeParts = period.time.split('-');
      if (timeParts.length === 2) {
        try {
          const startMin = parseTimeToMinutes(timeParts[0]);
          const endMin = parseTimeToMinutes(timeParts[1]);
          if (currentMinutes >= startMin && currentMinutes <= endMin) {
            return period;
          }
        } catch (e) {
          console.warn("Failed parsing time range", period.time);
        }
      }
    }
    return null;
  };

  // Fetch initial data based on role
  const fetchDiaryData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await axios.get(`${API_URL}/diaries/today`);
      if (res.data.status === 'success') {
        setTodayDiary(res.data.diary);
      }
      
      const historyRes = await axios.get(`${API_URL}/diaries/history`);
      if (historyRes.data.status === 'success') {
        setDiaryHistory(historyRes.data.diaries);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await axios.get(`${API_URL}/attendance/student`);
      if (res.data.status === 'success') {
        setAttendanceStats(res.data.stats);
        setAttendanceRecords(res.data.records);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMarks = async () => {
    try {
      const res = await axios.get(`${API_URL}/marks/student`);
      if (res.data.status === 'success') {
        setReportCard(res.data.reportCard);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFee = async () => {
    try {
      setFeeLoaded(false);
      const res = await axios.get(`${API_URL}/fees/student`);
      if (res.data.status === 'success') {
        setFeeDetails(res.data.fee);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFeeLoaded(true);
    }
  };

  const fetchSchoolDetails = async () => {
    try {
      const res = await axios.get(`${API_URL}/schools`);
      if (res.data.status === 'success' && user?.school) {
        const mySchool = res.data.schools.find(s => s._id === user.school);
        setSchoolDetails(mySchool);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLinkedChild = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/my-child`);
      if (res.data.status === 'success') {
        setLinkedChild(res.data.student);
      }
    } catch (err) {
      console.error('Failed to fetch linked child:', err);
    }
  };

  const fetchTodayTimetable = async () => {
    if (!user?.classAssigned || !user?.sectionAssigned) {
      setTimetableLoaded(true);
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/timetable`, {
        params: { classId: user.classAssigned, section: user.sectionAssigned }
      });
      if (res.data.status === 'success' && res.data.timetable) {
        setFullTimetable(res.data.timetable);
        const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const dayRecord = res.data.timetable.find(t => t.day === todayName);
        if (dayRecord && dayRecord.periods) {
          setTimetableData(dayRecord.periods);
          const activePeriod = calculateActivePeriod(dayRecord.periods);
          setCurrentPeriod(activePeriod);
        }
      }
      setTimetableLoaded(true);
    } catch (err) {
      console.error("Failed to fetch timetable for dashboard banner:", err);
      setTimetableLoaded(true);
    }
  };

  const fetchPreStudentsDirectory = async () => {
    if (!user?.school) return;
    try {
      setLoadingPreStudents(true);
      const res = await axios.get(`${API_URL}/schools/${user.school}/pre-students`);
      if (res.data.status === 'success') {
        setPreStudentsList(res.data.students);
      }
    } catch (err) {
      console.error("Failed to fetch student directory", err);
    } finally {
      setLoadingPreStudents(false);
    }
  };

  useEffect(() => {
    document.body.className = 'theme-parent';
    fetchSchoolDetails();
    fetchLinkedChild();
    if (user?.approvalStatus === 'pending') {
      fetchPreStudentsDirectory();
    } else {
      fetchDiaryData();
      fetchAttendance();
      fetchMarks();
      fetchFee();
      fetchTodayTimetable();
      fetchParentCalendarForBanner();

      // Check home location prompt
      const savedHome = localStorage.getItem(`parent_home_location_${user?.id || user?._id}`);
      const prompted = localStorage.getItem(`parent_home_prompt_shown_${user?.id || user?._id}`);
      if (!savedHome && !prompted) {
        setShowHomePromptModal(true);
      }
    }

    const interval = setInterval(() => {
      if (user?.approvalStatus === 'pending') {
        fetchPreStudentsDirectory();
      } else {
        fetchDiaryData(true);
        fetchAttendance();
        fetchMarks();
        fetchFee();
        fetchTodayTimetable();
        fetchParentCalendarForBanner();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [user]);

  // Periodically update active period
  useEffect(() => {
    if (!timetableData || timetableData.length === 0) return;
    const interval = setInterval(() => {
      const activePeriod = calculateActivePeriod(timetableData);
      setCurrentPeriod(activePeriod);
    }, 60000);
    return () => clearInterval(interval);
  }, [timetableData]);

  // Poll active bus tracking trip data
  useEffect(() => {
    let intervalId = null;

    if (busNumber && !isSearching && activeTab === 'bus') {
      const checkBusStatus = () => {
        const stored = localStorage.getItem(`bus_${busNumber}_trip`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            // Dynamic activity check based on lastUpdated timestamp (15 seconds offline threshold)
            parsed.active = parsed.active && (Date.now() - (parsed.lastUpdated || 0) < 15000);
            
            // Avoid unnecessary state updates if values are identical
            setTripData(prev => {
              if (prev && 
                  prev.active === parsed.active && 
                  prev.speed === parsed.speed && 
                  prev.distance === parsed.distance && 
                  prev.currentCoords?.lat === parsed.currentCoords?.lat && 
                  prev.currentCoords?.lng === parsed.currentCoords?.lng && 
                  prev.alertStatus === parsed.alertStatus && 
                  prev.lastUpdated === parsed.lastUpdated && 
                  prev.path?.length === parsed.path?.length) {
                return prev;
              }
              return parsed;
            });
          } catch (e) {
            setTripData(null);
          }
        } else {
          // No active or stored trip key. Try loading from history
          const historyStored = localStorage.getItem(`bus_${busNumber}_history`);
          if (historyStored) {
            try {
              const historyList = JSON.parse(historyStored);
              if (historyList && historyList.length > 0) {
                const lastTrip = historyList[0];
                const lastCoords = lastTrip.path && lastTrip.path.length > 0 
                  ? lastTrip.path[lastTrip.path.length - 1] 
                  : null;
                if (lastCoords) {
                  setTripData(prev => {
                    if (prev && prev.isHistoryFallback && prev.distance === lastTrip.distance && prev.currentCoords?.lat === lastCoords.lat && prev.currentCoords?.lng === lastCoords.lng) {
                      return prev;
                    }
                    return {
                      active: false,
                      busNumber,
                      speed: 0,
                      distance: lastTrip.distance,
                      currentCoords: lastCoords,
                      path: lastTrip.path || [],
                      lastUpdated: lastTrip.id ? parseInt(lastTrip.id) : Date.now(),
                      alertStatus: 'normal',
                      incidentCoords: null,
                      isHistoryFallback: true
                    };
                  });
                  return;
                }
              }
            } catch (err) {
              console.warn("Failed to parse bus history:", err);
            }
          }
          
          // If no history exists, use a default placeholder centered around parentLocation or Bangalore
          const defaultLoc = parentLocation || { lat: 12.9716, lng: 77.5946 };
          setTripData(prev => {
            if (prev && prev.isPlaceholder && prev.currentCoords?.lat === defaultLoc.lat && prev.currentCoords?.lng === defaultLoc.lng) {
              return prev;
            }
            return {
              active: false,
              busNumber,
              speed: 0,
              distance: 0,
              currentCoords: defaultLoc,
              path: [defaultLoc],
              lastUpdated: Date.now(),
              alertStatus: 'normal',
              incidentCoords: null,
              isPlaceholder: true
            };
          });
        }
      };

      checkBusStatus();
      intervalId = setInterval(checkBusStatus, 1500);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [busNumber, isSearching, activeTab, parentLocation]);

  // Reset map centering state when tab, bus, or status changes
  useEffect(() => {
    hasCenteredMapRef.current = false;
  }, [busNumber, activeTab, tripData?.active]);

  // Synchronize Leaflet map for Parent View
  useEffect(() => {
    const L = window.L;
    if (activeTab === 'bus' && tripData && tripData.currentCoords && L && !isSearching) {
      const container = document.getElementById('parent-map');
      if (container) {
        const busLatLng = [tripData.currentCoords.lat, tripData.currentCoords.lng];
        const isBusActive = tripData.active;
        const busColor = isBusActive ? 'var(--accent)' : '#6b7280';
        const busIconHtml = `<div style="background-color: ${busColor}; color: white; padding: 6px; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(0,0,0,0.5); border: 2px solid white;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v10c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></div>`;
        
        if (!mapInstanceRef.current) {
          const map = L.map('parent-map').setView(busLatLng, 15);
          addSatelliteHybridLayers(map);

          const busIcon = L.divIcon({
            html: busIconHtml,
            className: 'custom-bus-leaflet-icon',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });

          markerRef.current = L.marker(busLatLng, { icon: busIcon }).addTo(map).bindPopup(`School Bus Location (${isBusActive ? 'Active' : 'Offline'})`);
          polylineRef.current = L.polyline(tripData.path || [], { color: isBusActive ? '#10b981' : '#94a3b8', weight: 5 }).addTo(map);
          mapInstanceRef.current = map;
        } else {
          markerRef.current.setLatLng(busLatLng);
          polylineRef.current.setLatLngs(tripData.path || []);
          
          const busIcon = L.divIcon({
            html: busIconHtml,
            className: 'custom-bus-leaflet-icon',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });
          markerRef.current.setIcon(busIcon);
          markerRef.current.setPopupContent(`School Bus Location (${isBusActive ? 'Active' : 'Offline'})`);
          polylineRef.current.setStyle({ color: isBusActive ? '#10b981' : '#94a3b8' });
        }

        const map = mapInstanceRef.current;

        // Manage Parent Marker and Connection Line dynamically (Swiggy style!)
        if (parentLocation) {
          const parentLatLng = [parentLocation.lat, parentLocation.lng];
          
          if (!parentMarkerRef.current) {
            const parentIcon = L.divIcon({
              html: `<div style="background-color: #3b82f6; color: white; padding: 6px; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(0,0,0,0.5); border: 2px solid white;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>`,
              className: 'custom-parent-leaflet-icon',
              iconSize: [28, 28],
              iconAnchor: [14, 14]
            });
            parentMarkerRef.current = L.marker(parentLatLng, { icon: parentIcon }).addTo(map).bindPopup('My House / Location');
          } else {
            parentMarkerRef.current.setLatLng(parentLatLng);
          }

          // Draw/update geofence circle
          if (geofenceRadius) {
            if (!geofenceCircleRef.current) {
              geofenceCircleRef.current = L.circle(parentLatLng, {
                radius: geofenceRadius * 1000,
                color: '#ec4899',
                fillColor: '#ec4899',
                fillOpacity: 0.08,
                weight: 1.5,
                dashArray: '5, 8'
              }).addTo(map);
            } else {
              geofenceCircleRef.current.setLatLng(parentLatLng);
              geofenceCircleRef.current.setRadius(geofenceRadius * 1000);
            }
          }

          // Use OSRM road path if available, else fallback to direct line
          const connectionPath = roadRoutePath.length > 0 ? roadRoutePath : [parentLatLng, busLatLng];
          
          if (!connectionLineRef.current) {
            connectionLineRef.current = L.polyline(connectionPath, {
              color: '#3b82f6',
              weight: 5,
              opacity: 0.8
            }).addTo(map);
          } else {
            connectionLineRef.current.setLatLngs(connectionPath);
            connectionLineRef.current.setStyle({
              color: '#3b82f6',
              weight: 5,
              dashArray: roadRoutePath.length > 0 ? null : '5, 10'
            });
          }

          // Fit bounds to show both simultaneously (prevent maxZoom over-zooming when points are close/identical)
          if (!hasCenteredMapRef.current) {
            const bounds = L.latLngBounds(roadRoutePath.length > 0 ? roadRoutePath : [parentLatLng, busLatLng]);
            map.fitBounds(bounds, { maxZoom: 15, padding: [50, 50] });
            hasCenteredMapRef.current = true;
          }
        } else {
          if (!hasCenteredMapRef.current) {
            map.panTo(busLatLng);
            hasCenteredMapRef.current = true;
          }
        }

        // Render/update incident warning marker on parent map
        if (tripData.incidentCoords) {
          const incidentLatLng = [tripData.incidentCoords.lat, tripData.incidentCoords.lng];
          const alertColor = tripData.alertStatus === 'puncture' ? '#fbbf24' : '#ef4444';
          const alertSymbol = tripData.alertStatus === 'puncture' 
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>' 
            : '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
          const alertTitle = tripData.alertStatus === 'puncture' ? 'Puncture' : 'Breakdown';

          const incidentIcon = L.divIcon({
            html: `<div style="background-color: ${alertColor}; color: white; padding: 6px; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(0,0,0,0.5); border: 2px solid white; font-size: 14px;">${alertSymbol}</div>`,
            className: 'custom-incident-leaflet-icon',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });

          if (!incidentMarkerRef.current) {
            incidentMarkerRef.current = L.marker(incidentLatLng, { icon: incidentIcon })
              .addTo(map)
              .bindPopup(`<strong>Driver Alert: ${alertTitle}</strong><br/>Location of incident report`)
              .openPopup();
          } else {
            incidentMarkerRef.current.setLatLng(incidentLatLng);
            incidentMarkerRef.current.setIcon(incidentIcon);
            incidentMarkerRef.current.setPopupContent(`<strong>Driver Alert: ${alertTitle}</strong><br/>Location of incident report`);
          }
        } else {
          if (incidentMarkerRef.current) {
            incidentMarkerRef.current.remove();
            incidentMarkerRef.current = null;
          }
        }
      }
    }
  }, [tripData, parentLocation, roadRoutePath, isSearching, activeTab, geofenceRadius]);

  // Clean Leaflet maps if status goes offline or tab changes
  useEffect(() => {
    if ((activeTab !== 'bus' || !tripData || isSearching) && mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
      polylineRef.current = null;
      parentMarkerRef.current = null;
      connectionLineRef.current = null;
      geofenceCircleRef.current = null;
      if (incidentMarkerRef.current) {
        incidentMarkerRef.current.remove();
        incidentMarkerRef.current = null;
      }
      setRoadRoutePath([]);
    }
  }, [tripData, isSearching, activeTab]);

  // 1. Bus Tracking Handlers
  const handleTrackBus = (e) => {
    e.preventDefault();
    if (inputBusNum.trim()) {
      const formatted = inputBusNum.trim().toUpperCase();
      setBusNumber(formatted);
      setIsSearching(false);
      localStorage.setItem(`parent_last_tracked_bus_${user?.id || user?._id}`, formatted);
      if (!trackedBuses.includes(formatted)) {
        const updated = [...trackedBuses, formatted];
        setTrackedBuses(updated);
        localStorage.setItem(`parent_tracked_buses_${user?.id || user?._id}`, JSON.stringify(updated));
      }
      
      // Check saved location options
      const storedHome = localStorage.getItem(`parent_home_location_${user?.id || user?._id}`);
      if (storedHome) {
        setShowTrackLocationChoiceModal(true);
      } else {
        setShowHomePromptModal(true);
      }
    }
  };

  const handleTrackAnother = () => {
    setIsSearching(true);
    setBusNumber('');
    setInputBusNum('');
    setTripData(null);
    setParentLocation(null);
  };

  // 2. Diary Homework Handlers
  const handleToggleHomework = async (diaryId, subjectIndex) => {
    try {
      const res = await axios.post(`${API_URL}/diaries/${diaryId}/homework/${subjectIndex}/complete`);
      if (res.data.status === 'success') {
        // Update diary state locally
        setTodayDiary(res.data.diary);
        // Sync history
        setDiaryHistory(prev => prev.map(d => d._id === diaryId ? res.data.diary : d));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 6. Fee Payment Handler
  const handleSimulatePayment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const amount = Number(payAmount);
    if (isNaN(amount) || amount <= 0 || amount > feeDetails?.pendingAmount) {
      setError('Please input a valid payment amount not exceeding pending dues.');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/fees/${feeDetails._id}/pay`, { payAmount: amount });
      if (res.data.status === 'success') {
        setSuccess(res.data.message);
        setFeeDetails(res.data.fee);
        setShowPayModal(false);
        setPayAmount('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Mock payment gateway connection failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Parent linking their child
  const handleLinkChild = async (studentIdOrManual) => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      let payload = {};
      if (typeof studentIdOrManual === 'string') {
        payload = { preRegisteredStudentId: studentIdOrManual };
      } else {
        payload = { ...manualChild };
      }
      const res = await axios.post(`${API_URL}/auth/link-child`, payload);
      if (res.data.status === 'success') {
        setSuccess('Child details updated and linked successfully! Reloading portal...');
        if (res.data.user) {
          saveUserToLocalStorage(res.data.user);
        }
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update child details');
    } finally {
      setLoading(false);
    }
  };


  const parentTabs = [
    { id: 'diary', label: 'Class Diary', icon: BookOpen },
    { id: 'bus', label: 'Bus Tracker', icon: Bus },
    { id: 'attendance', label: 'Attendance Tracker', icon: CheckSquare },
    { id: 'timetable', label: 'Class Timetable', icon: Calendar },
    { id: 'marks', label: 'Marks Report Card', icon: Award },
    { id: 'fees', label: 'Fee Statements', icon: DollarSign },
    { id: 'calendar', label: 'School Calendar', icon: Calendar },
    { id: 'profile', label: 'My Profile', icon: User }
  ];

  const parentRoleName = schoolDetails 
    ? `Parent (Connect: ${schoolDetails.name})` 
    : 'Parent';

  return (
    <DashboardLayout
      roleName={parentRoleName}
      user={user}
      activeTab={user?.approvalStatus === 'pending' ? 'pending' : activeTab}
      setActiveTab={user?.approvalStatus === 'pending' ? () => {} : setActiveTab}
      tabs={user?.approvalStatus === 'pending' ? [{ id: 'pending', label: 'Awaiting Approval', icon: ShieldAlert }] : parentTabs}
      handleLogout={() => setShowLogoutModal(true)}
    >

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      {/* Smart Dashboard Banner */}
      {user?.approvalStatus !== 'pending' && !bannerDismissed && (() => {
        const currentHour = new Date().getHours();
        let bannerConfig = null;
        
        if (currentHour >= 5 && currentHour < 9) {
          if (busNumber) {
            bannerConfig = {
              type: 'morning-bus',
              emoji: '🚌',
              title: `School Bus Approaching`,
              desc: `Bus ${busNumber} is on the way. Tap to track live location.`,
              actionText: 'Track Now →',
              tab: 'bus',
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              borderColor: 'rgba(124, 58, 237, 0.4)',
              textColor: 'white'
            };
          } else {
            bannerConfig = {
              type: 'morning-generic',
              emoji: '🌅',
              title: `Good Morning!`,
              desc: `Have a great day ahead. Tap to view today's timetable.`,
              actionText: 'View Schedule →',
              tab: 'timetable',
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              borderColor: 'rgba(255, 255, 255, 0.08)',
              textColor: '#a78bfa'
            };
          }
        }
        else if (currentHour >= 9 && currentHour < 12) {
          const todayDateStr = new Date().toISOString().split('T')[0];
          const todayRecord = attendanceRecords.find(r => new Date(r.date).toISOString().split('T')[0] === todayDateStr);
          const isPresent = todayRecord ? (todayRecord.status === 'Present' || todayRecord.status === 'Late') : true;
          const markedTime = todayRecord?.createdAt 
            ? new Date(todayRecord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            : '8:45 AM';
          const childName = linkedChild?.name || 'Your child';

          if (isPresent) {
            bannerConfig = {
              type: 'midmorning-present',
              emoji: '✅',
              title: `${childName} is Present`,
              desc: `Marked at ${markedTime}`,
              actionText: 'View Attendance →',
              tab: 'attendance',
              background: 'rgba(16, 185, 129, 0.08)',
              borderColor: 'rgba(16, 185, 129, 0.3)',
              textColor: '#34d399'
            };
          } else {
            bannerConfig = {
              type: 'midmorning-absent',
              emoji: '❌',
              title: `${childName} is Absent`,
              desc: `Contact school if wrong.`,
              actionText: 'View Details →',
              tab: 'attendance',
              background: 'rgba(239, 68, 68, 0.08)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              textColor: '#f87171'
            };
          }
        }
        else if (currentHour >= 12 && currentHour < 17) {
          const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const tomorrowExam = parentCalendarEntries.find(e => {
            const entryDateStr = new Date(e.date).toISOString().split('T')[0];
            return entryDateStr === tomorrowStr && e.dayType === 'exam';
          });

          const hasFeeDue = feeDetails && feeDetails.pendingAmount > 0;
          let feeDueDays = -1;
          if (hasFeeDue && feeDetails.dueDate) {
            const dueDate = new Date(feeDetails.dueDate);
            const diffTime = dueDate - Date.now();
            feeDueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }
          const feeDueSoon = hasFeeDue && feeDueDays >= 0 && feeDueDays <= 3;

          const tomorrowDayName = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'long' });
          const tomorrowRecord = fullTimetable.find(t => t.day === tomorrowDayName);
          const tomorrowFirst = tomorrowRecord?.periods && tomorrowRecord.periods.length > 0 
            ? [...tomorrowRecord.periods].sort((a,b) => (a.periodNumber || 1) - (b.periodNumber || 1))[0] 
            : null;

          if (tomorrowExam) {
            bannerConfig = {
              type: 'afternoon-exam',
              emoji: '📝',
              title: `Exam Tomorrow!`,
              desc: `${tomorrowExam.title} - ${tomorrowExam.description || 'All Chapters'}`,
              actionText: 'View Timetable →',
              tab: 'timetable',
              background: 'rgba(249, 115, 22, 0.08)',
              borderColor: 'rgba(249, 115, 22, 0.3)',
              textColor: '#fb923c'
            };
          } else if (feeDueSoon) {
            bannerConfig = {
              type: 'afternoon-fee',
              emoji: '💰',
              title: `Fee Due in ${feeDueDays} Days`,
              desc: `Pending Amount: ₹${feeDetails.pendingAmount.toLocaleString()}`,
              actionText: 'View Fee Details →',
              tab: 'fees',
              background: 'rgba(234, 179, 8, 0.08)',
              borderColor: 'rgba(234, 179, 8, 0.3)',
              textColor: '#facc15'
            };
          } else {
            const subject = tomorrowFirst?.subject || 'Mathematics';
            const startTime = tomorrowFirst?.time?.split('-')[0] || '8:00 AM';
            bannerConfig = {
              type: 'afternoon-default',
              emoji: '📅',
              title: `Tomorrow's First Period`,
              desc: `${subject} - ${startTime}`,
              actionText: 'Full Schedule →',
              tab: 'timetable',
              background: 'rgba(124, 58, 237, 0.08)',
              borderColor: 'rgba(124, 58, 237, 0.2)',
              textColor: '#a78bfa'
            };
          }
        }
        else if (currentHour >= 17 && currentHour < 21) {
          if (todayDiary) {
            const count = todayDiary.homework?.length || 0;
            bannerConfig = {
              type: 'evening-diary-ready',
              emoji: '📔',
              title: `Today's Diary is Ready`,
              desc: `Homework: ${count} subjects assigned.`,
              actionText: 'View Diary →',
              tab: 'diary',
              background: 'rgba(59, 130, 246, 0.08)',
              borderColor: 'rgba(59, 130, 246, 0.3)',
              textColor: '#60a5fa'
            };
          } else {
            bannerConfig = {
              type: 'evening-diary-none',
              emoji: '📔',
              title: `No Diary Yet Today`,
              desc: `Check back later for updates.`,
              actionText: '',
              tab: 'diary',
              background: 'rgba(156, 163, 175, 0.08)',
              borderColor: 'rgba(156, 163, 175, 0.2)',
              textColor: '#9ca3af'
            };
          }
        }
        else {
          const tomorrowDayName = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'long' });
          const tomorrowRecord = fullTimetable.find(t => t.day === tomorrowDayName);
          const tomorrowFirst = tomorrowRecord?.periods && tomorrowRecord.periods.length > 0 
            ? [...tomorrowRecord.periods].sort((a,b) => (a.periodNumber || 1) - (b.periodNumber || 1))[0] 
            : null;
          const subject = tomorrowFirst?.subject || 'Mathematics';
          const startTime = tomorrowFirst?.time?.split('-')[0] || '8:00 AM';
          
          bannerConfig = {
            type: 'night-schedule',
            emoji: '📅',
            title: `Tomorrow's Schedule`,
            desc: `First Period: ${subject} at ${startTime}`,
            actionText: 'View Full Day →',
            tab: 'timetable',
            background: 'rgba(124, 58, 237, 0.15)',
            borderColor: 'rgba(124, 58, 237, 0.3)',
            textColor: '#a78bfa'
          };
        }

        if (!bannerConfig) return null;

        const handleBannerDismiss = (e) => {
          e.stopPropagation();
          const todayDateStr = new Date().toISOString().split('T')[0];
          try {
            localStorage.setItem(`parent_banner_dismissed_${user?.id || user?._id}`, todayDateStr);
            setBannerDismissed(true);
          } catch (err) {
            console.error(err);
          }
        };

        return (
          <div 
            onClick={() => setActiveTab(bannerConfig.tab)}
            className="smart-banner-slide"
            style={{
              background: bannerConfig.background,
              border: '1px solid',
              borderColor: bannerConfig.borderColor,
              borderRadius: '16px',
              padding: '16px 20px',
              marginBottom: '20px',
              cursor: 'pointer',
              position: 'relative',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>{bannerConfig.emoji}</span>
              <div>
                <h4 style={{ 
                  color: 'white', 
                  fontSize: '15px', 
                  fontWeight: '700', 
                  margin: '0 0 4px 0' 
                }}>
                  {bannerConfig.title}
                </h4>
                <p style={{ 
                  color: 'var(--text-secondary)', 
                  fontSize: '13px', 
                  margin: 0,
                  fontWeight: '500'
                }}>
                  {bannerConfig.desc}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {bannerConfig.actionText && (
                <span style={{ 
                  color: bannerConfig.textColor, 
                  fontSize: '13px', 
                  fontWeight: '700',
                  textDecoration: 'underline'
                }}>
                  {bannerConfig.actionText}
                </span>
              )}
              
              <button 
                onClick={handleBannerDismiss}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
              >
                ✕
              </button>
            </div>
          </div>
        );
      })()}

      {/* Current Period Timetable Banner */}
      {user?.approvalStatus !== 'pending' && (
        <div className="glass-card" style={{ 
          padding: '16px 20px', 
          marginBottom: '20px', 
          background: 'linear-gradient(90deg, rgba(124, 58, 237, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
          borderColor: 'var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>⏰</span>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', letterSpacing: '0.05em', display: 'block' }}>
                CURRENT PERIOD STATUS
              </span>
              {timetableData.length === 0 ? (
                <span style={{ fontSize: '14px', color: '#f87171', fontWeight: '600' }}>
                  Timetable not updated. Ask administrator to update it.
                </span>
              ) : currentPeriod ? (
                <span style={{ fontSize: '15px', color: 'white', fontWeight: 'bold' }}>
                  Active Period {currentPeriod.periodNumber}: <strong style={{ color: 'var(--accent)' }}>{currentPeriod.subject}</strong> ({currentPeriod.time}) with {currentPeriod.teacherName}
                </span>
              ) : (
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  No active period right now. (Today's schedule is updated)
                </span>
              )}
            </div>
          </div>
          {timetableData.length > 0 && (
            <button 
              onClick={() => setActiveTab('timetable')}
              className="code-action-btn"
              style={{ margin: 0, padding: '4px 10px', fontSize: '12px' }}
            >
              View Full Timetable
            </button>
          )}
        </div>
      )}

      {user?.approvalStatus === 'pending' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Welcome and Pending Status Banner */}
          <div className="glass-card" style={{ 
            padding: '30px', 
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
            borderColor: 'rgba(124, 58, 237, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ShieldAlert size={30} className="bounce-anim" />
            </div>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'var(--font-title)', marginBottom: '6px' }}>
                Hello, {user.fullName} 👋
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                Your parent registration request is currently <strong style={{ color: '#fbbf24' }}>Pending Approval</strong>.
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>
                Please review your child linkage details below. School administrators need a linked child profile to review and approve your registration request.
              </p>
            </div>
          </div>

          <div className="responsive-grid-3-2">
            {/* Left: Linked Child Details & Edit/Link Forms */}
            <div className="glass-card" style={{ padding: '24px' }}>
              {!isEditingChild && linkedChild ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0 }}>Linked Child Profile</h3>
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsEditingChild(true);
                        setManualChild({
                          childFullName: linkedChild.name,
                          childClass: linkedChild.className,
                          childSection: linkedChild.section,
                          childRollNumber: linkedChild.rollNumber || '',
                          childDateOfBirth: linkedChild.dateOfBirth ? new Date(linkedChild.dateOfBirth).toISOString().split('T')[0] : ''
                        });
                      }} 
                      className="code-action-btn"
                      style={{ margin: 0, padding: '6px 14px' }}
                    >
                      ✏️ Edit Child Details
                    </button>
                  </div>

                  <div style={{ 
                    background: 'rgba(16, 185, 129, 0.05)', 
                    border: '1px solid rgba(16, 185, 129, 0.2)', 
                    borderRadius: '12px', 
                    padding: '20px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '12px' 
                  }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%', 
                        background: 'rgba(16, 185, 129, 0.1)', 
                        color: '#10b981', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '18px',
                        fontWeight: 'bold'
                      }}>
                        {linkedChild.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{linkedChild.name}</h4>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Status: Linked & Verification Pending</span>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Class Assigned:</span>
                        <strong style={{ color: 'white' }}>{linkedChild.className}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Section:</span>
                        <strong style={{ color: 'white' }}>{linkedChild.section}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Admission Number:</span>
                        <strong style={{ color: 'var(--accent)' }}>{linkedChild.admissionNumber}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Roll Number:</span>
                        <strong style={{ color: 'white' }}>{linkedChild.rollNumber || 'Not Assigned'}</strong>
                      </div>
                      {linkedChild.dateOfBirth && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Date of Birth:</span>
                          <strong style={{ color: 'white' }}>{new Date(linkedChild.dateOfBirth).toLocaleDateString()}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0 }}>{linkedChild ? 'Update Linked Child Details' : 'Link Your Child Profile'}</h3>
                    {linkedChild && (
                      <button 
                        type="button" 
                        onClick={() => setIsEditingChild(false)} 
                        className="code-action-btn"
                        style={{ margin: 0, padding: '4px 10px', background: 'transparent' }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {/* Mode Selector */}
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <button
                      type="button"
                      onClick={() => setLinkMode('search')}
                      className={`tab-btn ${linkMode === 'search' ? 'active' : ''}`}
                      style={{ 
                        flex: 1, 
                        margin: 0, 
                        padding: '10px',
                        background: linkMode === 'search' ? 'var(--accent-glow)' : 'rgba(0,0,0,0.15)',
                        borderColor: linkMode === 'search' ? 'var(--accent)' : 'var(--border)'
                      }}
                    >
                      🔍 Search School Directory
                    </button>
                    <button
                      type="button"
                      onClick={() => setLinkMode('manual')}
                      className={`tab-btn ${linkMode === 'manual' ? 'active' : ''}`}
                      style={{ 
                        flex: 1, 
                        margin: 0, 
                        padding: '10px',
                        background: linkMode === 'manual' ? 'var(--accent-glow)' : 'rgba(0,0,0,0.15)',
                        borderColor: linkMode === 'manual' ? 'var(--accent)' : 'var(--border)'
                      }}
                    >
                      📝 Enter Details Manually
                    </button>
                  </div>

                  {linkMode === 'search' ? (
                    <div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                        Search for your child in the school student directory by name or admission number:
                      </p>
                      <input
                        type="text"
                        placeholder="Search student..."
                        className="form-input"
                        value={childSearchVal}
                        onChange={(e) => setChildSearchVal(e.target.value)}
                        style={{ marginBottom: '12px' }}
                      />

                      {loadingPreStudents ? (
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading directory...</p>
                      ) : (
                        <div style={{ 
                          maxHeight: '200px', 
                          overflowY: 'auto', 
                          border: '1px solid var(--border)', 
                          borderRadius: '8px', 
                          background: 'rgba(0,0,0,0.2)',
                          display: 'flex',
                          flexDirection: 'column'
                        }}>
                          {preStudentsList.length === 0 ? (
                            <div style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                              No pre-registered students found for this school. Please use manual entry.
                            </div>
                          ) : (() => {
                            const filtered = preStudentsList.filter(s => 
                              s.name.toLowerCase().includes(childSearchVal.toLowerCase()) ||
                              s.admissionNumber?.toLowerCase().includes(childSearchVal.toLowerCase())
                            );
                            if (filtered.length === 0) {
                              return (
                                <div style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                                  No matching students found.
                                </div>
                              );
                            }
                            return filtered.map(s => (
                              <div 
                                key={s._id}
                                onClick={() => handleLinkChild(s._id)}
                                style={{ 
                                  padding: '12px 16px', 
                                  borderBottom: '1px solid var(--border)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  transition: 'var(--transition)'
                                }}
                                className="hover:bg-white/5"
                              >
                                <div>
                                  <strong style={{ color: 'white', fontSize: '14px' }}>{s.name}</strong>
                                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                    Class {s.className} - {s.section}
                                  </div>
                                </div>
                                <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 'bold', background: 'rgba(124, 58, 237, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                                  Link Profile
                                </span>
                              </div>
                            ));
                          })()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={(e) => { e.preventDefault(); handleLinkChild(manualChild); }}>
                      <div className="form-group" style={{ marginBottom: '14px' }}>
                        <label className="form-label">Child's Full Name *</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Enter child's full name"
                          value={manualChild.childFullName}
                          onChange={(e) => setManualChild({ ...manualChild, childFullName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="responsive-grid-1-1" style={{ gap: '14px', marginBottom: '14px' }}>
                        <div className="form-group">
                          <label className="form-label">Class *</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. 5, 10, LKG"
                            value={manualChild.childClass}
                            onChange={(e) => setManualChild({ ...manualChild, childClass: e.target.value })}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Section *</label>
                          <select
                            className="form-select"
                            value={manualChild.childSection}
                            onChange={(e) => setManualChild({ ...manualChild, childSection: e.target.value })}
                            required
                          >
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                          </select>
                        </div>
                      </div>
                      <div className="responsive-grid-1-1" style={{ gap: '14px', marginBottom: '20px' }}>
                        <div className="form-group">
                          <label className="form-label">Roll Number (Optional)</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. 12"
                            value={manualChild.childRollNumber}
                            onChange={(e) => setManualChild({ ...manualChild, childRollNumber: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Date of Birth (Optional)</label>
                          <input
                            type="date"
                            className="form-input"
                            value={manualChild.childDateOfBirth}
                            onChange={(e) => setManualChild({ ...manualChild, childDateOfBirth: e.target.value })}
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="dashboard-btn-primary"
                        disabled={loading}
                        style={{ width: '100%', margin: 0, padding: '12px' }}
                      >
                        {loading ? 'Saving Details...' : '💾 Save & Link Child Details'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Right: Parent Profile details summary */}
            <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ margin: 0 }}>My Profile Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Registered Email:</span>
                  <span style={{ fontWeight: 'bold' }}>{user.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Father's Name:</span>
                  <span>{user.fatherName || 'Not Entered'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Mother's Name:</span>
                  <span>{user.motherName || 'Not Entered'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Phone Number:</span>
                  <span>{user.fatherPhone || user.motherPhone || 'Not Entered'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Address:</span>
                  <span style={{ textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all' }}>{user.homeAddress || 'Not Entered'}</span>
                </div>
              </div>

              <div style={{ 
                background: 'rgba(59, 130, 246, 0.05)', 
                border: '1px solid rgba(59, 130, 246, 0.2)', 
                borderRadius: '8px', 
                padding: '14px', 
                fontSize: '13px', 
                color: '#60a5fa', 
                marginTop: '10px' 
              }}>
                ℹ️ Once you select or enter your child's profile, a school administrator or class teacher can view it instantly on their dashboard and approve your access request.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Classroom Diary Tab */}
          {activeTab === 'diary' && (
            <div className="responsive-grid-3-2">
              {/* Today's Diary */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '16px' }}>Today's Classroom Diary</h3>
                {todayDiary ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', borderBottom: '1px solid var(--border)', paddingBottom: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <div>
                        📅 <strong>Posted:</strong> {new Date(todayDiary.postedAt || todayDiary.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {todayDiary.lastEditedAt && (
                        <div>
                          ✏️ <strong>Edited:</strong> {new Date(todayDiary.lastEditedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>

                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>HOMEWORK CHECKLIST (TAP TO COMPLETE)</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                        {todayDiary.homework.length === 0 ? (
                          <p style={{ fontStyle: 'italic', fontSize: '14px', color: 'var(--text-secondary)' }}>No homework assigned today.</p>
                        ) : (
                          todayDiary.homework.map((hw, idx) => {
                            const isDone = hw.completedByParents.includes(user.id);
                            return (
                              <div 
                                key={idx} 
                                onClick={() => handleToggleHomework(todayDiary._id, idx)}
                                className="glass-card" 
                                style={{ 
                                  padding: '12px 16px', 
                                  cursor: 'pointer', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'space-between',
                                  background: isDone ? 'rgba(16,185,129,0.08)' : 'rgba(0,0,0,0.15)',
                                  borderColor: isDone ? 'rgba(16,185,129,0.3)' : 'var(--border)'
                                }}
                              >
                                <div style={{ flex: 1 }}>
                                  <strong style={{ fontSize: '15px', color: isDone ? '#34d399' : 'var(--text-primary)' }}>{hw.subject}</strong>
                                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', textDecoration: isDone ? 'line-through' : 'none' }}>
                                    {hw.description}
                                  </p>
                                </div>
                                <div style={{ 
                                  width: '20px', 
                                  height: '20px', 
                                  borderRadius: '4px', 
                                  border: '2px solid',
                                  borderColor: isDone ? '#10b981' : 'var(--text-muted)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: isDone ? '#10b981' : 'transparent'
                                }}>
                                  {isDone && <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>CLASSWORK TODAY</span>
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '6px', fontSize: '14px' }}>
                        {todayDiary.classwork}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>NOTICE BOARD</span>
                      <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', marginTop: '6px', fontSize: '14px', color: '#f87171' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <ShieldAlert size={14} /> {todayDiary.notice}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>REMAINING REMINDERS</span>
                      <div style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)', marginTop: '6px', fontSize: '14px', color: '#fbbf24' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <AlertTriangle size={14} /> {todayDiary.reminders}
                        </span>
                      </div>
                    </div>

                    {todayDiary.teacherNote && (
                      <div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>TEACHER'S NOTE</span>
                        <p style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          "{todayDiary.teacherNote}" &mdash; {todayDiary.teacher?.fullName}
                        </p>
                      </div>
                    )}

                    {/* Mark as Read Button */}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '10px', position: 'relative' }}>
                      <style>{`
                        @keyframes popSuccess {
                          0% { transform: scale(0.8); opacity: 0; }
                          90% { transform: scale(1.05); opacity: 1; }
                          100% { transform: scale(1); opacity: 1; }
                        }
                        @keyframes drawTick {
                          0% { transform: scale(0.5) rotate(-5deg); opacity: 0; }
                          70% { transform: scale(1.2) rotate(5deg); }
                          100% { transform: scale(1) rotate(0deg); opacity: 1; }
                        }
                      `}</style>
                      {showSuccessTick && (
                        <div style={{
                          position: 'absolute',
                          top: 0, left: 0, right: 0, bottom: 0,
                          background: 'rgba(16, 185, 129, 0.95)',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          animation: 'popSuccess 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                          zIndex: 10,
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '18px',
                          border: '1px solid #10B981'
                        }}>
                          <span style={{ fontSize: '24px', marginRight: '8px', animation: 'drawTick 0.5s ease-out forwards' }}>✅</span> Success!
                        </div>
                      )}
                      {(() => {
                        const viewEntry = todayDiary.parentViews?.find(v => 
                          (v.parentId?._id || v.parentId || '').toString() === (user.id || user._id || '').toString()
                        );
                        const hasMarkedRead = viewEntry?.markedAsRead;
                        const readTime = viewEntry?.readAt;

                        return hasMarkedRead ? (
                          <div style={{ 
                            background: 'rgba(16, 185, 129, 0.1)', 
                            border: '1px solid #10B981', 
                            padding: '16px', 
                            borderRadius: '12px', 
                            color: '#10B981', 
                            textAlign: 'center', 
                            fontWeight: '600',
                            fontSize: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            width: '100%'
                          }}>
                            ✅ Read at {new Date(readTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onMouseDown={() => setIsPressingMarkRead(true)}
                            onMouseUp={() => setIsPressingMarkRead(false)}
                            onMouseLeave={() => setIsPressingMarkRead(false)}
                            onTouchStart={() => setIsPressingMarkRead(true)}
                            onTouchEnd={() => setIsPressingMarkRead(false)}
                            onClick={() => handleMarkAsRead(todayDiary._id)}
                            disabled={loading}
                            style={{ 
                              width: '100%', 
                              margin: 0, 
                              padding: '16px', 
                              fontSize: '16px', 
                              fontWeight: '600',
                              background: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)', 
                              color: 'white',
                              border: 'none',
                              borderRadius: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              transform: isPressingMarkRead ? 'scale(0.96)' : 'scale(1)',
                              transition: 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.15s ease',
                              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
                            }}
                          >
                            Mark as Read ✅
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    <BookOpen size={36} style={{ color: 'var(--text-muted)', marginBottom: '10px' }} />
                    <p>No diary submitted yet today by your class teacher.</p>
                  </div>
                )}
              </div>

              {/* Right Column: Remaining Space for Attendance and Class Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Attendance Summary */}
                <div className="glass-card" style={{ padding: '24px' }}>
                  <h3 style={{ marginBottom: '16px' }}>Child Attendance</h3>
                  {attendanceStats ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ textAlign: 'center', padding: '10px 0' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>CUMULATIVE RATE</span>
                        <div style={{ fontSize: '36px', fontWeight: 'bold', color: attendanceStats.presentRate >= 85 ? '#34d399' : '#f87171', margin: '6px 0' }}>
                          {attendanceStats.presentRate}%
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                        <div style={{ background: 'rgba(52, 211, 153, 0.08)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(52, 211, 153, 0.15)' }}>
                          <span style={{ fontSize: '10px', color: '#34d399', fontWeight: 'bold' }}>PRESENT</span>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginTop: '2px' }}>{attendanceStats.present}</div>
                        </div>
                        <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                          <span style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 'bold' }}>LATE</span>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginTop: '2px' }}>{attendanceStats.late}</div>
                        </div>
                        <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                          <span style={{ fontSize: '10px', color: '#f87171', fontWeight: 'bold' }}>ABSENT</span>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginTop: '2px' }}>{attendanceStats.absent}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '14px' }}>
                      Loading attendance records...
                    </div>
                  )}
                </div>

                {/* Class Details Card */}
                <div className="glass-card" style={{ padding: '24px' }}>
                  <h3 style={{ marginBottom: '16px' }}>Class & School Details</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                    {linkedChild ? (
                      <>
                        <div style={{ display: 'flex', justifyBlock: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>Student Name:</span>
                          <strong style={{ color: 'white', marginLeft: 'auto' }}>{linkedChild.name}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyBlock: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>Assigned Class:</span>
                          <strong style={{ color: 'white', marginLeft: 'auto' }}>Class {linkedChild.className} - {linkedChild.section}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyBlock: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>Admission Number:</span>
                          <span style={{ color: 'var(--accent)', fontWeight: 'bold', marginLeft: 'auto' }}>{linkedChild.admissionNumber}</span>
                        </div>
                      </>
                    ) : (
                      <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '8px' }}>
                        No child linked profile found.
                      </div>
                    )}
                    {schoolDetails && (
                      <>
                        <div style={{ display: 'flex', justifyBlock: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>School Name:</span>
                          <span style={{ marginLeft: 'auto' }}>{schoolDetails.name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyBlock: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>School Phone:</span>
                          <span style={{ marginLeft: 'auto' }}>📞 {schoolDetails.phone}</span>
                        </div>
                        <div style={{ display: 'flex', justifyBlock: 'space-between', paddingBottom: '6px' }}>
                          <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>School Address:</span>
                          <span style={{ textAlign: 'right', maxWidth: '60%', fontSize: '12px', marginLeft: 'auto' }}>{schoolDetails.address}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

      {/* School Bus Tracking Tab */}
      {activeTab === 'bus' && (
        <div>
          {isSearching ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '500px', margin: '40px auto' }}>
              <Bus size={48} style={{ color: 'var(--accent)', marginBottom: '20px' }} />
              <h2 style={{ marginBottom: '10px' }}>School Bus Real-Time Tracking</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                Enter your child's assigned Bus Number to see its live route status, speed, and current GPS location.
              </p>
              <form onSubmit={handleTrackBus} style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <input
                  type="text"
                  placeholder="e.g. BUS-40"
                  className="form-input"
                  value={inputBusNum}
                  onChange={(e) => setInputBusNum(e.target.value)}
                  required
                  style={{ maxWidth: '200px' }}
                />
                <button type="submit" className="dashboard-btn-primary" style={{ margin: 0 }}>
                  Track
                </button>
              </form>
            </div>
          ) : (
            <>
              <div className="vertical-stack">
                {/* Watchlist Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', marginRight: '8px', letterSpacing: '0.05em' }}>
                    WATCHLIST:
                  </span>
                  {trackedBuses.map((busNum) => (
                    <button
                      key={busNum}
                      onClick={() => {
                        setBusNumber(busNum);
                        setInputBusNum(busNum);
                        setIsSearching(false);
                      }}
                      className={`tab-btn ${busNumber === busNum ? 'active' : ''}`}
                      style={{ 
                        padding: '6px 14px', 
                        fontSize: '13px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        margin: 0,
                        height: 'auto',
                        background: busNumber === busNum ? 'var(--accent-glow)' : 'rgba(255,255,255,0.02)',
                        borderColor: busNumber === busNum ? 'var(--accent)' : 'var(--border)'
                      }}
                    >
                      <Bus size={13} />
                      {busNum}
                      {trackedBuses.length > 1 && (
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            setTrackedBuses(prev => {
                              const updated = prev.filter(b => b !== busNum);
                              localStorage.setItem(`parent_tracked_buses_${user?.id}`, JSON.stringify(updated));
                              if (busNumber === busNum && updated.length > 0) {
                                setBusNumber(updated[0]);
                                setInputBusNum(updated[0]);
                              } else if (updated.length === 0) {
                                setIsSearching(true);
                              }
                              return updated;
                            });
                          }}
                          style={{ marginLeft: '6px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
                        >
                          ×
                        </span>
                      )}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setIsSearching(true);
                      setInputBusNum('');
                    }}
                    className="code-action-btn"
                    style={{ padding: '4px 10px', fontSize: '12px', margin: 0 }}
                  >
                    + Add Bus
                  </button>
                </div>

                {/* Bus Status Preview Banner */}
                <div 
                  className="glass-card" 
                  style={{ 
                    padding: '20px 24px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    background: tripData?.active ? 'rgba(236, 72, 153, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    borderColor: tripData?.active ? 'rgba(236, 72, 153, 0.3)' : 'var(--border)',
                    marginBottom: '16px',
                    transition: 'var(--transition)',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '250px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: tripData?.active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: tripData?.active ? '#34d399' : '#f87171',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Bus size={22} className={tripData?.active ? 'bounce-anim' : ''} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'var(--font-title)' }}>
                          Bus {busNumber}
                        </span>
                        <span className={`badge ${tripData?.active ? 'badge-active' : 'badge-inactive'}`}>
                          {tripData?.active 
                            ? 'Live Tracking' 
                            : tripData?.isPlaceholder 
                              ? 'Offline (Not Started)' 
                              : tripData?.isHistoryFallback
                                ? 'Offline (Trip Ended)'
                                : 'Offline (Connection Lost)'}
                        </span>
                        {tripData?.active && etaMinutes !== null && (
                          <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                            ETA: {etaMinutes} mins
                          </span>
                        )}
                        {tripData?.active && tripData.alertStatus && tripData.alertStatus !== 'normal' && (
                          <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={12} /> Alert Active
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {tripData?.active 
                          ? `Broadcasting speed: ${tripData.speed} km/h` 
                          : tripData?.isPlaceholder 
                            ? 'The driver has not started this bus trip yet. Showing default coordinates.'
                            : tripData?.isHistoryFallback
                              ? 'Trip completed. Showing last completed trip location.'
                              : 'No active shift broadcast. Connection lost.'}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button 
                      onClick={handleTrackAnother} 
                      className="code-action-btn track-another-btn"
                      style={{ margin: 0, padding: '8px 16px', background: 'transparent', borderColor: 'var(--border)' }}
                    >
                      Track Another
                    </button>
                  </div>
                </div>

                {/* Expanded Details and Map */}
                {tripData && tripData.currentCoords ? (
                  <div className="vertical-stack">
                    {/* Tracking Stats */}
                    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div>
                        <span className={`badge ${tripData.active ? 'badge-active' : 'badge-inactive'}`} style={{ marginBottom: '8px' }}>
                          Tracking Bus: {busNumber} {tripData.active ? '' : (tripData.isPlaceholder ? '(Not Started)' : '(Offline)')}
                        </span>
                        <h3>GPS Broadcast Status</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {tripData.active 
                            ? 'Refreshes live as coordinates change.' 
                            : tripData.isPlaceholder 
                              ? 'Driver has not started the trip. Showing default school coordinates.'
                              : 'Trip ended. Showing last known coordinates.'}
                        </p>
                      </div>
                      
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Status:</span>
                          <span className={`badge ${tripData.active ? 'badge-active' : 'badge-inactive'}`}>
                            {tripData.active 
                              ? 'Broadcast Active' 
                              : tripData.isPlaceholder 
                                ? 'Not Started' 
                                : 'Broadcast Offline'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{tripData.active ? 'Live Broadcast Speed:' : 'Last Recorded Speed:'}</span>
                          <span style={{ fontSize: '13px', fontWeight: 'bold' }}>
                            {tripData.active ? `${tripData.speed} km/h` : '0 km/h (Stopped)'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Distance Covered:</span>
                          <span style={{ fontSize: '13px', fontWeight: 'bold' }}>
                            {tripData.distance ? `${tripData.distance} km` : '0 km'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Last GPS Packet:</span>
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                            {tripData.isPlaceholder 
                              ? 'N/A' 
                              : `${new Date(tripData.lastUpdated).toLocaleDateString()} ${new Date(tripData.lastUpdated).toLocaleTimeString()}`}
                          </span>
                        </div>

                        {/* Geofence Alert Radius Slider Settings */}
                        <div style={{ borderTop: '1px solid var(--border)', marginTop: '16px', paddingTop: '16px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '10px', fontWeight: '600', letterSpacing: '0.05em' }}>
                            GEOFENCE & PROXIMITY ALERTS
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                Enable Geofence Alerts
                              </label>
                              <input 
                                type="checkbox" 
                                checked={enableGeofence} 
                                onChange={(e) => {
                                  setEnableGeofence(e.target.checked);
                                  if (e.target.checked && 'Notification' in window && Notification.permission !== 'granted') {
                                    Notification.requestPermission();
                                  }
                                }} 
                                style={{ width: '16px', height: '16px', cursor: 'pointer', margin: 0 }}
                              />
                            </div>
                            {enableGeofence && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>Alert Radius</span>
                                  <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{geofenceRadius} km</span>
                                </div>
                                <input 
                                  type="range" 
                                  min="0.5" 
                                  max="5.0" 
                                  step="0.5" 
                                  value={geofenceRadius} 
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setGeofenceRadius(val);
                                    localStorage.setItem(`parent_geofence_radius_${user?.id}`, val.toString());
                                  }} 
                                  style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ 
                        background: tripData.active ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)', 
                        padding: '14px', 
                        borderRadius: '8px', 
                        border: tripData.active ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)', 
                        fontSize: '13px', 
                        color: tripData.active ? '#34d399' : '#f87171', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px' 
                      }}>
                        <Navigation size={16} className={tripData.active ? 'spin-anim' : ''} />
                        {tripData.active 
                          ? 'Live polyline track route mapping is active.' 
                          : tripData.isPlaceholder
                            ? 'Trip has not started. Polyline will draw as bus moves.'
                            : 'Showing ended/last known route path (Offline).'}
                      </div>
                    </div>

                    {/* Flashing Road Incident Alert Banner */}
                    {tripData.alertStatus && tripData.alertStatus !== 'normal' && (
                      <div className={`incident-alert-banner alert-${tripData.alertStatus}`} style={{ margin: 0 }}>
                        <AlertTriangle size={20} />
                        <div>
                          <strong>{tripData.alertStatus === 'puncture' ? 'Tire Puncture Delay Alert' : 'Vehicle Breakdown Critical Alert'}</strong>
                          <p style={{ fontSize: '13px', marginTop: '3px', color: 'inherit', opacity: 0.9 }}>
                            {tripData.alertStatus === 'puncture' 
                              ? 'The driver has flagged a tire puncture. The bus is currently stopped. Expect 15-20 min delay.' 
                              : 'The bus has suffered a mechanical breakdown. School is dispatching a replacement. Expect 30-40 min delay.'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Tracking Map Representation */}
                    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <h3 style={{ margin: 0 }}>
                            {tripData.active 
                              ? 'Live GPS Tracking Route' 
                              : tripData.isPlaceholder
                                ? 'Bus Tracking Map (Offline)'
                                : 'Last Known GPS Route (Offline)'}
                          </h3>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {tripData.isPlaceholder 
                              ? 'Waiting for driver to start shift...' 
                              : `Last Known Position: ${new Date(tripData.lastUpdated).toLocaleDateString()} ${new Date(tripData.lastUpdated).toLocaleTimeString()}`}
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', color: tripData.active ? '#34d399' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {tripData.active ? (
                            <>
                              <span className="live-pulse"></span> Active Syncing
                            </>
                          ) : tripData.isPlaceholder ? (
                            'Not Started'
                          ) : (
                            'Disconnected'
                          )}
                        </span>
                      </div>

                      {/* Real Leaflet Map */}
                      <div style={{ position: 'relative', width: '100%', flex: 1, minHeight: '350px', background: '#0e0e1b', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                          <div id="parent-map" style={{ width: '100%', height: '100%', minHeight: '350px', zIndex: 1 }}></div>
                          <button
                            type="button"
                            onClick={() => {
                              const saved = localStorage.getItem(`parent_home_location_${user?.id || user?._id}`);
                              if (saved) {
                                try {
                                  const parsed = JSON.parse(saved);
                                  setHomeLat(parsed.lat.toString());
                                  setHomeLng(parsed.lng.toString());
                                } catch(e){}
                              }
                              setShowHomePromptModal(true);
                            }}
                            className="code-action-btn"
                            style={{
                              position: 'absolute',
                              top: '10px',
                              left: '55px',
                              zIndex: 1000,
                              background: 'rgba(18, 18, 42, 0.9)',
                              border: '1px solid var(--border)',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: 'white',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                            }}
                          >
                            🏠 Set Home Point
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              hasCenteredMapRef.current = false;
                            }}
                            className="code-action-btn"
                            style={{
                              position: 'absolute',
                              top: '10px',
                              right: '10px',
                              zIndex: 1000,
                              background: 'rgba(18, 18, 42, 0.9)',
                              border: '1px solid var(--border)',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: 'white',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                            }}
                          >
                            <Navigation size={14} style={{ transform: 'rotate(45deg)' }} /> Recenter Map
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', marginTop: '20px' }}>
                    <Bus size={48} style={{ color: 'var(--text-muted)', marginBottom: '15px' }} />
                    <h3 style={{ marginBottom: '8px', color: 'white' }}>Bus was not started</h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
                      The driver has not started this bus trip yet. Live GPS coordinates and tracking details will appear here as soon as the bus starts moving.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}


      {/* Attendance Tracker Tab */}
      {activeTab === 'attendance' && (
        <div className="dashboard-grid">
          {/* Summary Stats */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', height: 'fit-content' }}>
            <h3>Attendance summary</h3>
            {attendanceStats ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>CUMULATIVE ATTENDANCE</span>
                  <div style={{ fontSize: '48px', fontWeight: 'bold', color: attendanceStats.presentRate >= 85 ? '#34d399' : '#f87171', margin: '10px 0' }}>
                    {attendanceStats.presentRate}%
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Target rate: 85% minimum
                  </span>
                </div>
                <div className="responsive-grid-1-1-1" style={{ gap: '10px', textAlign: 'center' }}>
                  <div style={{ background: 'rgba(52, 211, 153, 0.1)', padding: '10px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#34d399' }}>PRESENT</span>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginTop: '4px' }}>{attendanceStats.present}</div>
                  </div>
                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#fbbf24' }}>LATE</span>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginTop: '4px' }}>{attendanceStats.late}</div>
                  </div>
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#f87171' }}>ABSENT</span>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginTop: '4px' }}>{attendanceStats.absent}</div>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>Loading stats...</p>
            )}
          </div>

          {/* Historical Logs */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3>Recent Attendance Logs</h3>
            <div className="dashboard-table-container" style={{ marginTop: '16px', marginBottom: 0 }}>
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Date logged</th>
                    <th>Classroom ID</th>
                    <th>Section</th>
                    <th>Attendance status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No historical logs available yet.</td>
                    </tr>
                  ) : (
                    attendanceRecords.map(r => (
                      <tr key={r._id}>
                        <td><strong>{new Date(r.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></td>
                        <td>Class ID {r.class}</td>
                        <td>{r.section}</td>
                        <td>
                          <span className={`badge ${r.status === 'Present' ? 'badge-active' : r.status === 'Late' ? 'badge-role teacher' : 'badge-inactive'}`}>
                            {r.status}
                          </span>
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

      {/* Marks Report Card Tab */}
      {activeTab === 'marks' && (
        <div className="responsive-grid-1-1">
          {/* Report Card Table */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3>Student Performance Report Card</h3>
            <div className="dashboard-table-container" style={{ marginTop: '16px', marginBottom: 0 }}>
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Assessment type</th>
                    <th>Marks scored</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {reportCard.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No exam marks recorded yet.</td>
                    </tr>
                  ) : (
                    reportCard.map(m => (
                      <tr key={m._id}>
                        <td><strong>{m.subject}</strong></td>
                        <td>{m.examName}</td>
                        <td>{m.marksObtained} / {m.totalMarks} ({m.myPercentage}%)</td>
                        <td>
                          <span className={`badge ${m.grade === 'F' ? 'badge-inactive' : 'badge-active'}`} style={{ fontWeight: 'bold' }}>
                            {m.grade}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side-by-Side Comparison Chart */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <h3>Grades Analytics vs Class Average</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '8px 0 20px 0' }}>
              Compares child's score (Blue) against class average (Green) side-by-side.
            </p>
            {reportCard.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
                No performance data available to map.
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center' }}>
                {reportCard.map(m => (
                  <div key={m._id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span><strong>{m.subject}</strong> ({m.examName})</span>
                      <span>Mine: <strong>{m.myPercentage}%</strong> | Class Avg: <strong>{m.classAveragePercentage}%</strong></span>
                    </div>
                    {/* Visual side-by-side bars */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      {/* My Bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', width: '32px', color: 'var(--text-muted)' }}>Student</span>
                        <div style={{ flex: 1, height: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '5px', overflow: 'hidden' }}>
                          <div style={{ 
                            width: `${m.myPercentage}%`, 
                            height: '100%', 
                            background: 'linear-gradient(to right, #3b82f6, #60a5fa)', 
                            borderRadius: '5px',
                            transition: 'width 1s ease-in-out'
                          }}></div>
                        </div>
                      </div>
                      {/* Class Average Bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', width: '32px', color: 'var(--text-muted)' }}>Class</span>
                        <div style={{ flex: 1, height: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '5px', overflow: 'hidden' }}>
                          <div style={{ 
                            width: `${m.classAveragePercentage}%`, 
                            height: '100%', 
                            background: 'linear-gradient(to right, #10b981, #34d399)', 
                            borderRadius: '5px',
                            transition: 'width 1s ease-in-out'
                          }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fee Statements Tab */}
      {activeTab === 'fees' && (
        <div className="responsive-grid-3-2">
          {/* Fee details */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyBlock: 'space-between' }}>
            <div>
              <h3>Billing & Fees Statement</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '8px 0 24px 0' }}>
                Official account invoices logged by school administration.
              </p>

              {!feeLoaded ? (
                <p>Loading fee statement details...</p>
              ) : feeDetails ? (
                <div className="responsive-grid-1-1" style={{ gap: '20px', marginBottom: '24px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>TOTAL FEE DUE</span>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginTop: '6px' }}>
                      ₹{feeDetails.totalAmount.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <span style={{ fontSize: '12px', color: '#34d399' }}>PAID BALANCES</span>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#34d399', marginTop: '6px' }}>
                      ₹{feeDetails.paidAmount.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', gridColumn: 'span 2' }}>
                    <span style={{ fontSize: '12px', color: '#f87171' }}>PENDING OUTSTANDING FEES</span>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f87171', marginTop: '6px' }}>
                      ₹{feeDetails.pendingAmount.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Payment Due Date:</span>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fbbf24', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} /> {new Date(feeDetails.dueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ 
                  background: 'rgba(59, 130, 246, 0.05)', 
                  padding: '20px', 
                  borderRadius: '12px', 
                  border: '1px solid rgba(59, 130, 246, 0.2)', 
                  textAlign: 'left', 
                  color: '#60a5fa',
                  lineHeight: '1.6',
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '24px' }}>ℹ️</span>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>
                    Your fee details are not uploaded yet. Once uploaded, we will notify you.
                  </p>
                </div>
              )}
            </div>

            {feeLoaded && feeDetails && (
              feeDetails.pendingAmount > 0 ? (
                <button 
                  onClick={() => setShowPayModal(true)} 
                  className="dashboard-btn-primary" 
                  style={{ width: '100%', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <DollarSign size={16} /> Pay Dues Online (Simulate)
                </button>
              ) : (
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '14px', borderRadius: '8px', color: '#34d399', textAlign: 'center', fontWeight: '500' }}>
                  ✓ Account fully cleared. No outstanding pending fee dues.
                </div>
              )
            )}
          </div>

          {/* Contact Board */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3>Office Billing Queries</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              For queries related to scholarships, custom fee concessions, or transaction history, contact head office.
            </p>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>OFFICIAL HELPLINE</span>
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: 'white', marginTop: '2px' }}>
                  📞 {feeDetails?.officePhone || '+91 80 2345 6789'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>BILLING HOURS</span>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Monday - Friday (10:00 AM - 3:00 PM)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Class Timetable Tab */}
      {activeTab === 'timetable' && (
        <ClassTimetableModule viewOnly={true} />
      )}

      {/* Pay Mock Modal */}
      {showPayModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="dashboard-form-title">Simulate Fee Payment</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Enter payment amount. Dues will update immediately on successful submission.
            </p>

            <form onSubmit={handleSimulatePayment}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Payment Amount (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder={`Max ₹${feeDetails?.pendingAmount}`}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  max={feeDetails?.pendingAmount}
                  min={1}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowPayModal(false)} className="code-action-btn" style={{ padding: '10px 20px' }}>
                  Cancel
                </button>
                <button type="submit" className="dashboard-btn-primary" disabled={loading} style={{ margin: 0 }}>
                  {loading ? 'Processing payment...' : 'Pay Amount'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
      )}
      <LogoutConfirmationModal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
        onConfirm={confirmLogout} 
      />
      {/* HOME LOCATION PROMPT MODAL */}
      {showHomePromptModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 15, 26, 0.9)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001,
          animation: 'fadeIn 0.2s ease'
        }}>
          <div className="glass-card" style={{
            width: '90%',
            maxWidth: '500px',
            padding: '30px',
            border: '1px solid var(--border)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '20px', fontFamily: 'var(--font-title)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🏠</span> Set Home Location
              </h3>
              <button 
                onClick={() => {
                  setShowHomePromptModal(false);
                  localStorage.setItem(`parent_home_prompt_shown_${user?.id || user?._id}`, 'true');
                }} 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: 0, lineHeight: '1.5' }}>
              To avoid always querying your live device location, save your Home coordinates (Pickup & Drop point).
            </p>

            {promptError && <div className="error-banner" style={{ margin: 0 }}>{promptError}</div>}
            {promptSuccess && <div className="success-banner" style={{ margin: 0 }}>{promptSuccess}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button
                type="button"
                onClick={fetchCurrentLocationForPrompt}
                disabled={promptLoading}
                className="dashboard-btn-primary"
                style={{ 
                  margin: 0, 
                  padding: '12px', 
                  background: 'rgba(168, 85, 247, 0.15)', 
                  borderColor: 'var(--accent)', 
                  color: 'white', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px',
                  fontWeight: '600'
                }}
              >
                <MapPin size={16} /> 📍 I'm in Current Location
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>Latitude</label>
                  <input 
                    type="number" 
                    step="0.000001"
                    className="form-input" 
                    value={homeLat} 
                    onChange={(e) => setHomeLat(e.target.value)} 
                    placeholder="12.971598"
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>Longitude</label>
                  <input 
                    type="number" 
                    step="0.000001"
                    className="form-input" 
                    value={homeLng} 
                    onChange={(e) => setHomeLng(e.target.value)} 
                    placeholder="77.594562"
                    required
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button 
                type="button" 
                onClick={() => {
                  setShowHomePromptModal(false);
                  localStorage.setItem(`parent_home_prompt_shown_${user?.id || user?._id}`, 'true');
                }} 
                className="code-action-btn"
                style={{ margin: 0, padding: '10px 20px' }}
              >
                Skip
              </button>
              <button 
                type="button" 
                onClick={saveHomeCoordinates}
                className="dashboard-btn-primary"
                style={{ margin: 0, padding: '10px 20px', background: 'var(--accent)' }}
              >
                Save Point
              </button>
            </div>
          </div>
        </div>
      )}
      {/* TRACK LOCATION CHOICE MODAL */}
      {showTrackLocationChoiceModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 15, 26, 0.9)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10002,
          animation: 'fadeIn 0.2s ease'
        }}>
          <div className="glass-card" style={{
            width: '90%',
            maxWidth: '500px',
            padding: '30px',
            border: '1px solid var(--border)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '20px', fontFamily: 'var(--font-title)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📍</span> Location Options
              </h3>
              <button 
                onClick={() => setShowTrackLocationChoiceModal(false)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '10px 0', lineHeight: '1.5' }}>
              Choose which location to use as reference on the tracking map:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                type="button" 
                onClick={useSavedHomeLocation}
                className="dashboard-btn-primary"
                style={{ margin: 0, padding: '12px', background: 'var(--accent)', borderColor: 'var(--accent)', fontWeight: 'bold' }}
              >
                🏠 Use Saved Home Location
              </button>
              
              <button 
                type="button" 
                onClick={updateLocationAsHomeLocation}
                disabled={promptLoading}
                className="code-action-btn"
                style={{ margin: 0, padding: '12px', color: 'white', borderColor: 'var(--border)' }}
              >
                🔄 {promptLoading ? 'Fetching...' : 'Update My Location as Home Location'}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button 
                type="button" 
                onClick={() => setShowTrackLocationChoiceModal(false)} 
                className="code-action-btn"
                style={{ margin: 0, padding: '8px 16px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'calendar' && (
        <SchoolCalendarModule user={user} canEdit={false} />
      )}
      {activeTab === 'profile' && (
        <ProfileSettingsTab />
      )}
    </DashboardLayout>
  );
};

// -------------------------------------------------------------
// REUSABLE CLASS ATTENDANCE VIEWER MODULE FOR ADMINS/PRINCIPAL
// -------------------------------------------------------------
export const SchoolAttendanceView = ({ user, schools = [] }) => {
  const [selectedSchoolId, setSelectedSchoolId] = useState(user.role === 'super_admin' ? '' : (user.school?._id || user.school || ''));
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedShift, setSelectedShift] = useState('Morning');
  
  const [classesList, setClassesList] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Fetch classes for selected school
  useEffect(() => {
    const fetchClasses = async () => {
      if (!selectedSchoolId) {
        setClassesList([]);
        return;
      }
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/schools/my-classes?schoolId=${selectedSchoolId}`);
        if (res.data.status === 'success') {
          setClassesList(res.data.classes || []);
          if (res.data.classes?.length > 0) {
            setSelectedClassId(res.data.classes[0]._id);
          } else {
            setSelectedClassId('');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [selectedSchoolId]);

  // Fetch attendance records
  const handleQueryAttendance = async () => {
    if (!selectedClassId || !selectedSection) {
      setError('Please select a class and section.');
      return;
    }
    setError('');
    try {
      setLoading(true);
      const url = `${API_URL}/attendance/class?classId=${selectedClassId}&section=${selectedSection}&date=${selectedDate}&shift=${selectedShift}${selectedSchoolId ? `&schoolId=${selectedSchoolId}` : ''}`;
      const res = await axios.get(url);
      if (res.data.status === 'success') {
        setAttendanceData(res.data.attendance || []);
        setIsSubmitted(!!res.data.isSubmitted);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load attendance logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetakeAttendance = async () => {
    const reason = window.prompt("Enter reason or message for attendance retake request:", "Please retake the attendance due to errors.");
    if (reason === null) return;

    try {
      setLoading(true);
      setError('');
      const res = await axios.post(`${API_URL}/attendance/retake`, {
        classId: selectedClassId,
        section: selectedSection,
        date: selectedDate,
        shift: selectedShift,
        message: reason,
        schoolId: selectedSchoolId
      });
      if (res.data.status === 'success') {
        alert(res.data.message || 'Attendance retake requested successfully!');
        handleQueryAttendance();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to request attendance retake.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger load when selections change
  useEffect(() => {
    if (selectedClassId && selectedSection && selectedDate && selectedShift) {
      handleQueryAttendance();
    }
  }, [selectedClassId, selectedSection, selectedDate, selectedShift]);

  // Separate Present and Absent students
  const presentStudents = attendanceData.filter(s => s.status === 'Present' || s.status === 'Late');
  const absentStudents = attendanceData.filter(s => s.status === 'Absent');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
      {/* Search / Filter Controls */}
      <div className="responsive-grid-4" style={{ gap: '15px', alignItems: 'flex-end' }}>
        {user.role === 'super_admin' && (
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Select School</label>
            <select
              className="form-select"
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
            >
              <option value="">-- Choose School --</option>
              {schools.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}
        
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Class</label>
          <select
            className="form-select"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            disabled={!selectedSchoolId}
          >
            {classesList.length === 0 && <option value="">No Classes Found</option>}
            {classesList.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Section</label>
          <input
            type="text"
            className="form-input"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value.toUpperCase())}
            placeholder="A"
            style={{ textTransform: 'uppercase' }}
          />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Shift</label>
          <select
            className="form-select"
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
          >
            <option value="Morning">🌅 Morning Shift</option>
            <option value="Afternoon">☀️ Afternoon Shift</option>
          </select>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Date</label>
          <input
            type="date"
            className="form-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="error-banner" style={{ margin: 0 }}>{error}</div>}
      
      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading attendance details...</p>
      ) : attendanceData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            No records found. Please query a valid class and section.
          </span>
        </div>
      ) : (
        <div>
          {/* Status Alert */}
          <div style={{ 
            background: isSubmitted ? 'rgba(52, 211, 153, 0.08)' : 'rgba(245, 158, 11, 0.08)', 
            border: isSubmitted ? '1px solid rgba(52, 211, 153, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)',
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '20px', 
            color: isSubmitted ? '#34d399' : '#fbbf24',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isSubmitted ? '🔒' : '⚠️'} {isSubmitted ? `Attendance Log Submitted for ${selectedShift} Shift` : `Attendance Log NOT Submitted yet`}
            </span>
            {isSubmitted && ['super_admin', 'school_admin', 'principal'].includes(user.role) && (
              <button
                onClick={handleRetakeAttendance}
                disabled={loading}
                className="code-action-btn"
                style={{
                  margin: 0,
                  padding: '6px 12px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  borderColor: '#ef4444',
                  color: '#f87171',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCcw size={14} />
                Request Retake Attendance
              </button>
            )}
          </div>

          {/* Side-by-Side Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {/* Present Column */}
            <div style={{ 
              background: 'rgba(16, 185, 129, 0.03)', 
              border: '1px solid rgba(16, 185, 129, 0.15)', 
              borderRadius: '12px', 
              padding: '16px' 
            }}>
              <h4 style={{ color: '#34d399', borderBottom: '1px solid rgba(16, 185, 129, 0.15)', paddingBottom: '10px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '15px' }}>
                <span>✅ Present Students</span>
                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>{presentStudents.length}</span>
              </h4>
              {presentStudents.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No students present</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {presentStudents.map(student => (
                    <li key={student.studentId} style={{ display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.15)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      <strong style={{ color: 'white', fontSize: '14px', whiteSpace: 'normal', wordBreak: 'break-word' }}>{student.fullName}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', whiteSpace: 'normal', wordBreak: 'break-word' }}>{student.email}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Absent Column */}
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.03)', 
              border: '1px solid rgba(239, 68, 68, 0.15)', 
              borderRadius: '12px', 
              padding: '16px' 
            }}>
              <h4 style={{ color: '#f87171', borderBottom: '1px solid rgba(239, 68, 68, 0.15)', paddingBottom: '10px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '15px' }}>
                <span>❌ Absent Students</span>
                <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>{absentStudents.length}</span>
              </h4>
              {absentStudents.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No students absent</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {absentStudents.map(student => (
                    <li key={student.studentId} style={{ display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.15)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      <strong style={{ color: 'white', fontSize: '14px', whiteSpace: 'normal', wordBreak: 'break-word' }}>{student.fullName}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', whiteSpace: 'normal', wordBreak: 'break-word' }}>{student.email}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


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


const getApiUrl = () => {
  if (import.meta.env.REACT_APP_API_URL) {
    return import.meta.env.REACT_APP_API_URL;
  }
  const hostname = window.location.hostname;
  if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:5000/api`;
  }
  return 'http://localhost:5000/api';
};
const API_URL = getApiUrl();

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
          Choose how you want to log out of your session:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <button 
            onClick={() => { onConfirm(false); onClose(); }} 
            disabled={seconds > 0}
            className="logout-btn"
            style={{ 
              margin: 0, 
              padding: '12px',
              opacity: seconds > 0 ? 0.5 : 1,
              cursor: seconds > 0 ? 'not-allowed' : 'pointer',
              background: seconds > 0 ? '#4b5563' : 'var(--accent)',
              borderColor: seconds > 0 ? '#4b5563' : 'var(--accent)',
              color: '#fff',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              borderRadius: '8px'
            }}
          >
            {seconds > 0 ? `Logout Current Device (${seconds}s)` : 'Logout Current Device'}
          </button>
          
          <button 
            onClick={() => { 
              if (window.confirm("WARNING: This will completely invalidate your sessions on ALL devices, log you out everywhere, and clear local cache. Do you want to proceed?")) {
                onConfirm(true); 
                onClose(); 
              }
            }} 
            disabled={seconds > 0}
            className="logout-btn"
            style={{ 
              margin: 0, 
              padding: '12px',
              opacity: seconds > 0 ? 0.5 : 1,
              cursor: seconds > 0 ? 'not-allowed' : 'pointer',
              background: seconds > 0 ? '#4b5563' : '#ef4444',
              borderColor: seconds > 0 ? '#4b5563' : '#ef4444',
              color: '#fff',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              borderRadius: '8px'
            }}
          >
            {seconds > 0 ? `Logout All Devices (${seconds}s)` : 'Logout All Devices'}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={onClose} 
            className="code-action-btn"
            style={{ margin: 0, width: '100%', padding: '12px', borderRadius: '8px' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const AppIconSelectionModal = ({ isOpen, onClose, schoolLogo, onSelect }) => {
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
        width: '500px',
        padding: '30px',
        textAlign: 'center',
        border: '1px solid var(--border)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}>
        <h3 style={{ marginBottom: '10px', fontSize: '20px', fontFamily: 'var(--font-title)', color: 'white' }}>Choose App Icon Theme</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
          Select the brand logo you would like to display as the application icon for this device:
        </p>

        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '24px' }}>
          {/* Default Logo Option */}
          <div 
            onClick={() => { onSelect('default'); onClose(); }}
            className="logo-selection-card"
            style={{
              flex: 1,
              padding: '20px',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.02)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.background = 'rgba(168, 85, 247, 0.05)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <img 
              src="/default_app_logo.jpg" 
              alt="Default Logo" 
              style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }}
            />
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>Parent Connect</span>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Default Brand Logo</span>
          </div>

          {/* School Logo Option */}
          {schoolLogo ? (
            <div 
              onClick={() => { onSelect('school'); onClose(); }}
              className="logo-selection-card"
              style={{
                flex: 1,
                padding: '20px',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.background = 'rgba(168, 85, 247, 0.05)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <img 
                src={schoolLogo} 
                alt="School Logo" 
                style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }}
              />
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>School Logo</span>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Custom Campus Theme</span>
            </div>
          ) : (
            <div 
              style={{
                flex: 1,
                padding: '20px',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.01)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: 0.5
              }}
            >
              <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}><School size={32} /></div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>No School Logo</span>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textAlign: 'center' }}>Upload logo in Settings to activate</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={onClose} 
            className="code-action-btn"
            style={{ margin: 0, width: '100%', padding: '12px', borderRadius: '8px' }}
          >
            Decide Later
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
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      padding: '40px 10px',
      zIndex: 9999,
      animation: 'fadeIn 0.2s ease'
    }}>
      <div className="glass-card" style={{
        width: '500px',
        padding: '30px',
        border: '1px solid var(--border)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        margin: '0 auto 40px auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '20px', fontFamily: 'var(--font-title)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} />
            <span>Broadcast Details Request</span>
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
              <option value="parent">Parents</option>
              <option value="teacher">Teachers</option>
              <option value="driver">Drivers</option>
              <option value="staff">Other Staff</option>
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


const ParentDetailsModal = ({ isOpen, onClose, parent, onApprove, onReject, userRole }) => {
  const [showInlineReject, setShowInlineReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  const coords = useMemo(() => {
    if (!parent || !parent.homeAddress) return null;
    let addressStr = parent.homeAddress;
    let coordPart = null;
    if (addressStr.includes('Coordinates:')) {
      coordPart = addressStr.split('Coordinates:')[1];
    } else {
      coordPart = addressStr;
    }
    if (coordPart) {
      try {
        const parts = coordPart.split(',');
        if (parts.length >= 2) {
          const lat = parseFloat(parts[0].trim());
          const lng = parseFloat(parts[1].trim());
          if (!isNaN(lat) && !isNaN(lng)) {
            return { lat, lng };
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  }, [parent]);

  useEffect(() => {
    if (!isOpen || !coords) return;
    const L = window.L;
    if (!L) return;

    const timer = setTimeout(() => {
      try {
        if (!mapContainerRef.current) return;
        const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([coords.lat, coords.lng], 15);
        mapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        L.marker([coords.lat, coords.lng]).addTo(map);
      } catch (err) {
        console.error('Failed to init preview map', err);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.off();
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isOpen, coords]);

  if (!isOpen || !parent) return null;

  const student = parent.student;

  const handleApprove = () => {
    onApprove(parent._id);
    onClose();
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;
    onReject(parent, rejectReason);
    onClose();
  };

  const getInitials = (name) => {
    if (!name) return 'P';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#12122A',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <h3 style={{ margin: 0, color: 'white', fontSize: '18px', fontWeight: '600' }}>Registration Request Details</h3>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* SECTION 1: PROFILE PHOTO */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {parent.profilePhotoUrl || parent.profilePhoto ? (
              <img
                src={parent.profilePhotoUrl || parent.profilePhoto}
                alt={parent.fullName}
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }}
              />
            ) : (
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'rgba(124, 58, 237, 0.1)',
                border: '2px solid #7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a78bfa',
                fontSize: '24px',
                fontWeight: '700'
              }}>
                {getInitials(parent.fullName)}
              </div>
            )}
            <h4 style={{ margin: '8px 0 2px 0', color: 'white', fontSize: '18px', fontWeight: '600' }}>{parent.fullName}</h4>
            <span style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor: userRole === 'principal' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
              color: userRole === 'principal' ? '#34d399' : '#60a5fa',
              fontWeight: '600'
            }}>
              {userRole === 'principal' ? 'Requested via Principal Portal' : 'Requested via School Admin Portal'}
            </span>
          </div>

          {/* SECTION 2: PARENT INFO */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '16px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600', color: '#a78bfa' }}>Parent Information</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div><strong>Email Address:</strong> <span style={{ color: 'white' }}>{parent.email}</span></div>
              <div><strong>Phone Number:</strong> <span style={{ color: 'white' }}>{parent.phone || 'N/A'}</span></div>
              <div><strong>Relationship to child:</strong> <span style={{ color: 'white' }}>{parent.relationship || 'N/A'}</span></div>
            </div>
          </div>

          {/* SECTION 3: FAMILY DETAILS */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '16px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600', color: '#a78bfa' }}>Family Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div><strong>Father's Name:</strong> <span style={{ color: 'white' }}>{parent.fatherName || 'N/A'}</span></div>
              <div><strong>Father's Phone:</strong> <span style={{ color: 'white' }}>{parent.fatherPhone || 'N/A'}</span></div>
              <div><strong>Mother's Name:</strong> <span style={{ color: 'white' }}>{parent.motherName || 'N/A'}</span></div>
              <div><strong>Mother's Phone:</strong> <span style={{ color: 'white' }}>{parent.motherPhone || 'N/A'}</span></div>
              <div style={{ gridColumn: 'span 2' }}><strong>Emergency Contact:</strong> <span style={{ color: 'white' }}>{parent.emergencyContact || 'N/A'}</span></div>
            </div>
          </div>

          {/* SECTION 4: HOME ADDRESS */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '16px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600', color: '#a78bfa' }}>Home Address</h4>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <strong>Address:</strong> <span style={{ color: 'white' }}>{parent.homeAddress || 'N/A'}</span>
            </div>
            {coords && (
              <div style={{ marginTop: '8px' }}>
                <div ref={mapContainerRef} style={{ width: '100%', height: '150px', borderRadius: '8px', marginBottom: '8px', zIndex: 1 }} />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  <strong>Coordinates:</strong> {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 5: CHILD DETAILS */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '16px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600', color: '#a78bfa' }}>Child Information</h4>
            {student ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <div><strong>Child Name:</strong> <span style={{ color: 'white' }}>{student.name}</span></div>
                <div><strong>Class & Section:</strong> <span style={{ color: 'white' }}>{student.className} {student.section}</span></div>
                <div><strong>Roll Number:</strong> <span style={{ color: 'white' }}>{student.rollNumber || 'N/A'}</span></div>
                <div><strong>Date of Birth:</strong> <span style={{ color: 'white' }}>{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}</span></div>
              </div>
            ) : (
              <div style={{ color: '#ef4444', fontSize: '13px' }}>No student linked.</div>
            )}
          </div>

          {/* SECTION 6: SUBMISSION INFO */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '16px', marginBottom: '8px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600', color: '#a78bfa' }}>Submission Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div><strong>Submitted on:</strong> <span style={{ color: 'white' }}>{new Date(parent.createdAt).toLocaleString()}</span></div>
              <div>
                <strong>Status:</strong>{' '}
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#fbbf24',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  Pending
                </span>
              </div>
              <div style={{ gridColumn: 'span 2' }}><strong>Request ID:</strong> <span style={{ color: 'white' }}>{parent._id}</span></div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {!showInlineReject ? (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={handleApprove}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '9999px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                }}
              >
                <CheckCircle size={16} />
                <span>Approve</span>
              </button>
              <button
                type="button"
                onClick={() => setShowInlineReject(true)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  borderRadius: '9999px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
                <span>Reject</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleRejectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>Rejection Reason *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Specify reason for rejecting this request..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
                autoFocus
                style={{ width: '100%', marginBottom: '4px', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowInlineReject(false)}
                  className="code-action-btn"
                  style={{ margin: 0, padding: '8px 16px' }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="logout-btn"
                  style={{ margin: 0, padding: '8px 16px', background: '#ef4444', borderColor: '#ef4444' }}
                >
                  Confirm Reject
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const GlobalNotificationPopupManager = ({ user, setActiveTab }) => {
  const { setUser } = useContext(AuthContext);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState('');
  const [showPopupMapSelector, setShowPopupMapSelector] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState(() => {
    try {
      if (!user) return [];
      const key = `dismissed_notifications_${user.id || user._id}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  // Sync dismissed notifications from localStorage whenever user changes
  useEffect(() => {
    if (user) {
      try {
        const key = `dismissed_notifications_${user.id || user._id}`;
        const stored = localStorage.getItem(key);
        setDismissedNotificationIds(stored ? JSON.parse(stored) : []);
      } catch (e) {
        console.warn(e);
      }
    }
  }, [user]);

  const handleDismissNotification = (notificationId) => {
    if (!user) {
      setCurrentNotification(null);
      return;
    }
    try {
      const key = `dismissed_notifications_${user.id || user._id}`;
      const stored = localStorage.getItem(key);
      const currentList = stored ? JSON.parse(stored) : [];
      if (!currentList.includes(notificationId)) {
        const updated = [...currentList, notificationId];
        localStorage.setItem(key, JSON.stringify(updated));
        setDismissedNotificationIds(updated);
      }
    } catch (e) {
      console.warn(e);
    }
    setCurrentNotification(null);
  };

  const handlePopupDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setProfileData(prev => ({
          ...prev,
          homeAddress: `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        }));
      },
      (error) => {
        alert(`Failed to detect location: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const isProfileComplete = (u) => {
    if (!u) return true;
    if (u.role === 'parent') {
      const hasFather = !!(u.fatherName?.trim() && u.fatherPhone?.trim());
      const hasMother = !!(u.motherName?.trim() && u.motherPhone?.trim());
      return !!((hasFather || hasMother) && u.emergencyContact?.trim() && u.homeAddress?.trim());
    }
    if (u.role === 'driver') {
      return !!(u.vehicleNumber && u.licenseNumber && (u.phone || u.phoneNumber));
    }
    if (u.role === 'teacher') {
      return !!(u.fullName && u.primaryClass && u.primarySection);
    }
    return true;
  };

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
        const detailsComplete = isProfileComplete(user);
        
        // Read directly from localStorage to prevent stale checks
        let currentDismissed = [];
        try {
          const key = `dismissed_notifications_${user.id || user._id}`;
          const stored = localStorage.getItem(key);
          currentDismissed = stored ? JSON.parse(stored) : [];
        } catch (e) {
          console.warn(e);
        }

        const found = active.find(n => {
          if (n.type === 'update_details' && detailsComplete) {
            axios.post(`${API_URL}/notifications/mark-read/${n._id}`).catch(err => {});
            return false;
          }
          return (n.type === 'retake_attendance' || n.type === 'update_details' || n.type === 'general') &&
            !currentDismissed.includes(n._id);
        });

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
        const fatherNameVal = profileData.fatherName?.trim() || '';
        const fatherPhoneVal = profileData.fatherPhone?.trim() || '';
        const motherNameVal = profileData.motherName?.trim() || '';
        const motherPhoneVal = profileData.motherPhone?.trim() || '';
        const emergencyContactVal = profileData.emergencyContact?.trim() || '';
        const homeAddressVal = profileData.homeAddress?.trim() || '';

        const hasFather = !!(fatherNameVal && fatherPhoneVal);
        const hasMother = !!(motherNameVal && motherPhoneVal);

        if (!hasFather && !hasMother) {
          throw new Error("Please fill in either Father's details (Name & Phone) or Mother's details (Name & Phone).");
        }
        if (fatherNameVal && !fatherPhoneVal) {
          throw new Error("Please fill in Father's Phone Number.");
        }
        if (!fatherNameVal && fatherPhoneVal) {
          throw new Error("Please fill in Father's Name.");
        }
        if (motherNameVal && !motherPhoneVal) {
          throw new Error("Please fill in Mother's Phone Number.");
        }
        if (!motherNameVal && motherPhoneVal) {
          throw new Error("Please fill in Mother's Name.");
        }
        if (!emergencyContactVal) {
          throw new Error("Please fill in the Emergency Contact.");
        }
        if (!homeAddressVal) {
          throw new Error("Please fill in the Home Address / Pickup Point.");
        }

        payload.fatherName = fatherNameVal;
        payload.motherName = motherNameVal;
        payload.fatherPhone = fatherPhoneVal;
        payload.motherPhone = motherPhoneVal;
        payload.emergencyContact = emergencyContactVal;
        payload.homeAddress = homeAddressVal;
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
        if (currentNotification) {
          handleDismissNotification(currentNotification._id);
        }
        setSuccess('Profile updated successfully!');
        setTimeout(() => {
          setSuccess('');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update profile details.');
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
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      zIndex: 10000,
      animation: 'fadeIn 0.2s ease',
      padding: '20px 10px'
    }}>
      <div className="glass-card" style={{
        width: '90%',
        maxWidth: '500px',
        padding: '30px 20px',
        border: '1px solid var(--border)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
        animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        margin: '40px auto',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 10
        }}>
          {currentNotification && currentNotification.type === 'update_details' && (
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              userSelect: 'none'
            }}>
              <input 
                type="checkbox" 
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                style={{
                  accentColor: 'var(--accent)',
                  cursor: 'pointer',
                  width: '12px',
                  height: '12px'
                }}
              />
              <span>Don't show again</span>
            </label>
          )}
          <button 
            type="button"
            onClick={() => {
              if (currentNotification) {
                if (dontShowAgain || currentNotification.type !== 'update_details') {
                  handleDismissNotification(currentNotification._id);
                } else {
                  setCurrentNotification(null);
                }
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '50%',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={18} />
          </button>
        </div>
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
              style={{ margin: 0, width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} />
              <span>Go and Retake Attendance</span>
            </button>
          </div>
        ) : (
          <div>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto'
            }}>
              <ShieldAlert size={24} />
            </div>
            <h3 style={{ marginBottom: '8px', fontSize: '18px', fontFamily: 'var(--font-title)', textAlign: 'center', color: 'white' }}>
              Update Profile Details
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px', textAlign: 'center', lineHeight: '1.4' }}>
              {currentNotification.message || 'Please fill in the required fields below to keep our records up to date.'}
            </p>

            {error && <div className="error-banner" style={{ marginBottom: '12px', padding: '8px', fontSize: '12px' }}>{error}</div>}
            {success && <div className="success-banner" style={{ marginBottom: '12px', padding: '8px', fontSize: '12px' }}>{success}</div>}

            <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {user.role === 'parent' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>Father's Name</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        style={{ padding: '8px', fontSize: '13px' }}
                        value={profileData.fatherName} 
                        onChange={(e) => setProfileData({ ...profileData, fatherName: e.target.value })} 
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>Mother's Name</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        style={{ padding: '8px', fontSize: '13px' }}
                        value={profileData.motherName} 
                        onChange={(e) => setProfileData({ ...profileData, motherName: e.target.value })} 
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>Father's Phone</label>
                      <input 
                        type="tel" 
                        className="form-input" 
                        style={{ padding: '8px', fontSize: '13px' }}
                        value={profileData.fatherPhone} 
                        onChange={(e) => setProfileData({ ...profileData, fatherPhone: e.target.value })} 
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>Mother's Phone</label>
                      <input 
                        type="tel" 
                        className="form-input" 
                        style={{ padding: '8px', fontSize: '13px' }}
                        value={profileData.motherPhone} 
                        onChange={(e) => setProfileData({ ...profileData, motherPhone: e.target.value })} 
                      />
                    </div>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>Emergency Contact</label>
                    <input 
                      type="tel" 
                      className="form-input" 
                      style={{ padding: '8px', fontSize: '13px' }}
                      value={profileData.emergencyContact} 
                      onChange={(e) => setProfileData({ ...profileData, emergencyContact: e.target.value })} 
                      required
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label className="form-label" style={{ fontSize: '11px', margin: 0 }}>Home Address / Pickup Point</label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={handlePopupDetectLocation}
                          style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', color: 'var(--accent)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}
                        >
                          Detect GPS
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPopupMapSelector(true)}
                          style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}
                        >
                          Map
                        </button>
                      </div>
                    </div>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ padding: '8px', fontSize: '13px' }}
                      value={profileData.homeAddress} 
                      onChange={(e) => setProfileData({ ...profileData, homeAddress: e.target.value })} 
                      required
                    />
                  </div>
                </>
              )}

              {user.role === 'driver' && (
                <>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>Phone Number</label>
                    <input 
                      type="tel" 
                      className="form-input" 
                      style={{ padding: '8px', fontSize: '13px' }}
                      value={profileData.phone} 
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} 
                      required
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>Vehicle Number</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ padding: '8px', fontSize: '13px' }}
                      value={profileData.vehicleNumber} 
                      onChange={(e) => setProfileData({ ...profileData, vehicleNumber: e.target.value })} 
                      required
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>License Number</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ padding: '8px', fontSize: '13px' }}
                      value={profileData.licenseNumber} 
                      onChange={(e) => setProfileData({ ...profileData, licenseNumber: e.target.value })} 
                      required
                    />
                  </div>
                </>
              )}

              {user.role === 'teacher' && (
                <>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>Full Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ padding: '8px', fontSize: '13px' }}
                      value={profileData.fullName} 
                      onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })} 
                      required
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>Assigned Class ID</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        style={{ padding: '8px', fontSize: '13px' }}
                        value={profileData.primaryClass} 
                        onChange={(e) => setProfileData({ ...profileData, primaryClass: e.target.value })} 
                        placeholder="e.g. 660f8d9b..."
                        required
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>Section</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        style={{ padding: '8px', fontSize: '13px' }}
                        value={profileData.primarySection} 
                        onChange={(e) => setProfileData({ ...profileData, primarySection: e.target.value.toUpperCase() })} 
                        placeholder="e.g. A"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button 
                  type="button"
                  onClick={() => {
                    if (dontShowAgain) {
                      handleDismissNotification(currentNotification._id);
                    } else {
                      setCurrentNotification(null);
                    }
                  }} 
                  className="code-action-btn"
                  style={{ flex: 1, margin: 0, padding: '10px' }}
                >
                  Skip
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="dashboard-btn-primary"
                  style={{ flex: 1, margin: 0, padding: '10px', background: 'var(--accent)', borderColor: 'var(--accent)' }}
                >
                  {loading ? 'Saving...' : 'Save Details'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      <InteractiveMapSelectorModal 
        isOpen={showPopupMapSelector}
        onClose={() => setShowPopupMapSelector(false)}
        onSelect={(lat, lng) => {
          setProfileData(prev => ({
            ...prev,
            homeAddress: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
          }));
        }}
        initialLat={(() => {
          if (!profileData.homeAddress || !profileData.homeAddress.includes('Coordinates:')) return '';
          const parts = profileData.homeAddress.split('Coordinates:')[1]?.split(',');
          return parts && parts[0] ? parts[0].trim() : '';
        })()}
        initialLng={(() => {
          if (!profileData.homeAddress || !profileData.homeAddress.includes('Coordinates:')) return '';
          const parts = profileData.homeAddress.split('Coordinates:')[1]?.split(',');
          return parts && parts[1] ? parts[1].trim() : '';
        })()}
      />
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
  const [showSettingsMapSelector, setShowSettingsMapSelector] = useState(false);

  const handleSettingsDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setHomeAddress(`Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      },
      (error) => {
        alert(`Failed to detect location: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

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
        const fatherNameVal = fatherName?.trim() || '';
        const fatherPhoneVal = fatherPhone?.trim() || '';
        const motherNameVal = motherName?.trim() || '';
        const motherPhoneVal = motherPhone?.trim() || '';
        const emergencyContactVal = emergencyContact?.trim() || '';
        const homeAddressVal = homeAddress?.trim() || '';

        const hasFather = !!(fatherNameVal && fatherPhoneVal);
        const hasMother = !!(motherNameVal && motherPhoneVal);

        if (!hasFather && !hasMother) {
          throw new Error("Please fill in either Father's details (Name & Phone) or Mother's details (Name & Phone).");
        }
        if (fatherNameVal && !fatherPhoneVal) {
          throw new Error("Please fill in Father's Phone Number.");
        }
        if (!fatherNameVal && fatherPhoneVal) {
          throw new Error("Please fill in Father's Name.");
        }
        if (motherNameVal && !motherPhoneVal) {
          throw new Error("Please fill in Mother's Phone Number.");
        }
        if (!motherNameVal && motherPhoneVal) {
          throw new Error("Please fill in Mother's Name.");
        }
        if (!emergencyContactVal) {
          throw new Error("Please fill in the Emergency Contact Number.");
        }
        if (!homeAddressVal) {
          throw new Error("Please fill in the Home Address / Pickup Point.");
        }

        payload.fatherName = fatherNameVal;
        payload.motherName = motherNameVal;
        payload.fatherPhone = fatherPhoneVal;
        payload.motherPhone = motherPhoneVal;
        payload.emergencyContact = emergencyContactVal;
        payload.homeAddress = homeAddressVal;
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
        setSuccess('Details saved successfully');
        setUser(res.data.user);
        saveUserToLocalStorage(res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update profile details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '30px', maxWidth: '700px', margin: '0 auto' }}>
      <h3 style={{ marginBottom: '24px', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <User size={18} />
        <span>My Profile Settings</span>
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
          <div style={{ display: 'flex', gap: '10px' }}>
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
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('openAppIconSelectionModal'))}
              className="code-action-btn"
              style={{
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                margin: 0,
                padding: '8px 16px',
                background: 'rgba(168, 85, 247, 0.1)',
                borderColor: 'rgba(168, 85, 247, 0.3)',
                color: '#a855f7'
              }}
            >
              <Milestone size={14} />
              <span>Change App Icon Theme</span>
            </button>
          </div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                <label className="form-label" style={{ margin: 0 }}>Home Address</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleSettingsDetectLocation}
                    style={{
                      background: 'rgba(168, 85, 247, 0.1)',
                      border: '1.5px solid rgba(168, 85, 247, 0.4)',
                      color: 'var(--accent)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <MapPin size={10} /> I'm at Location
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSettingsMapSelector(true)}
                    style={{
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1.5px solid rgba(59, 130, 246, 0.4)',
                      color: '#60a5fa',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    Select on Map
                  </button>
                </div>
              </div>
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
          style={{ margin: 0, width: '100%', padding: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <Save size={14} />
          <span>{loading ? 'Saving Changes...' : 'Save Profile Settings'}</span>
        </button>
        {user?.updatedAt && (
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textAlign: 'right', marginTop: '6px' }}>
            Edited on: {new Date(user.updatedAt).toLocaleString()}
          </div>
        )}
      <InteractiveMapSelectorModal 
        isOpen={showSettingsMapSelector}
        onClose={() => setShowSettingsMapSelector(false)}
        onSelect={(lat, lng) => {
          setHomeAddress(`Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }}
        initialLat={homeAddress.includes('Coordinates:') ? homeAddress.split('Coordinates:')[1].split(',')[0].trim() : ''}
        initialLng={homeAddress.includes('Coordinates:') ? homeAddress.split(',')[1].trim() : ''}
      />
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
    const isApprovedParent = user && user.role === 'parent' && user.approvalStatus === 'approved';
    const isTeacher = user && user.role === 'teacher';
    if (user && (isApprovedParent || isTeacher) && !user.profilePhoto) {
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
        setSuccess('Details saved successfully');
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
              style={{ margin: 0, width: '100%', padding: '12px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Camera size={14} />
              <span>Capture Image</span>
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

  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('info');

  const getAppVersionStatus = () => {
    const ua = navigator.userAgent;
    const match = ua.match(/SchoolConnectApp\/([0-9.]+)/i);
    if (match && match[1]) {
      const currentVer = 1.1;
      const userVer = parseFloat(match[1]);
      if (userVer < currentVer) {
        return { isOutdated: true, userVer: match[1], currentVer: '1.1' };
      }
    }
    return { isOutdated: false };
  };
  const appVersionStatus = getAppVersionStatus();

  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (msg) => {
      let type = 'info';
      const lowercaseMsg = String(msg).toLowerCase();
      if (lowercaseMsg.includes('error') || lowercaseMsg.includes('failed') || lowercaseMsg.includes('invalid') || lowercaseMsg.includes('mismatch') || lowercaseMsg.includes('unable') || lowercaseMsg.includes('mismatch')) {
        type = 'error';
      } else if (lowercaseMsg.includes('success') || lowercaseMsg.includes('saved') || lowercaseMsg.includes('updated') || lowercaseMsg.includes('created') || lowercaseMsg.includes('verified') || lowercaseMsg.includes('sent') || lowercaseMsg.includes('approved') || lowercaseMsg.includes('accepted')) {
        type = 'success';
      } else if (lowercaseMsg.includes('warning') || lowercaseMsg.includes('caution') || lowercaseMsg.includes('attention') || lowercaseMsg.includes('notice') || lowercaseMsg.includes('required')) {
        type = 'warning';
      }
      setToastType(type);
      setToastMessage(msg);
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    const isNativeApp = /SchoolConnectApp/i.test(navigator.userAgent);
    const hasDismissed = localStorage.getItem('appDownloadPromptDismissed');
    if (!hasDismissed && !isNativeApp) {
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
          <div style={{ color: '#eab308', animation: 'pulseConnect 1.2s infinite', animationDelay: '0.3s' }}><Zap size={28} /></div>
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
  const [showAppIconModal, setShowAppIconModal] = useState(false);
  const [appIconPreference, setAppIconPreference] = useState(() => localStorage.getItem('appIconPreference') || 'default');

  const handleSelectAppIcon = (preference) => {
    localStorage.setItem('appIconPreference', preference);
    setAppIconPreference(preference);
  };

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

  // Request notifications permission, location for drivers, and show icon choice prompt
  useEffect(() => {
    // 1. Request Notification Permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(err => console.warn('Notification permission request failed', err));
    }

    // 2. Request Location Permission for Driver
    if (user && user.role === 'driver' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {},
        (err) => console.warn('Initial driver location permission request failed', err.message),
        { enableHighAccuracy: true }
      );
    }

    // 3. Prompt for App Icon branding preference if not yet chosen
    if (user && !localStorage.getItem('appIconPreference')) {
      setShowAppIconModal(true);
    }
  }, [user]);

  // Persist active tab to sessionStorage to handle refreshes gracefully
  useEffect(() => {
    if (user && user.role && activeTab) {
      if (user.role === 'driver') {
        sessionStorage.setItem('activeSubTab_driver', activeTab);
      } else {
        sessionStorage.setItem(`activeTab_${user.role}`, activeTab);
      }
    }
  }, [activeTab, user]);

  // Listen to external request to open selection modal
  useEffect(() => {
    const handleOpenIconModal = () => setShowAppIconModal(true);
    window.addEventListener('openAppIconSelectionModal', handleOpenIconModal);
    return () => window.removeEventListener('openAppIconSelectionModal', handleOpenIconModal);
  }, []);

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
  const currentAppIcon = (appIconPreference === 'school' && schoolLogo) 
    ? schoolLogo 
    : '/default_app_logo.jpg';

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
        /* Custom Leaflet Incident Tooltip */
        .leaflet-tooltip.custom-incident-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-tooltip-top.custom-incident-tooltip::before {
          border-top-color: transparent !important;
          display: none !important;
        }

        @keyframes slideInFromRight {
          0% { transform: translateX(120%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes toastProgress {
          0% { width: 100%; }
          100% { width: 0%; }
        }
        @media (max-width: 1024px) {
          .dashboard-scroll-container {
            padding-bottom: 110px !important;
          }
        }
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
            <img 
              onClick={() => setShowAppIconModal(true)}
              src={currentAppIcon} 
              alt="App Logo" 
              title="Click to change app icon theme"
              style={{ 
                width: '28px', 
                height: '28px', 
                borderRadius: '50%', 
                objectFit: 'cover',
                boxShadow: '0 0 8px rgba(168, 85, 247, 0.4)',
                border: '1.5px solid var(--accent)',
                cursor: 'pointer'
              }} 
            />
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
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-bold transition-all duration-300 cursor-pointer ${
                  isActive 
                    ? 'text-[var(--accent)] scale-105' 
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <div style={{ 
                  position: 'relative', 
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px 14px',
                  borderRadius: '16px',
                  background: isActive ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  marginBottom: '2px'
                }}>
                  <Icon size={18} style={{ 
                    transform: isActive ? 'scale(1.15)' : 'scale(1)',
                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    color: isActive ? '#a855f7' : 'inherit'
                  }} />
                  {tab.badge && (
                    <span style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-4px',
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
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-bold transition-all duration-300 cursor-pointer ${
                isMoreOpen
                  ? 'text-[var(--accent)] scale-105' 
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <div style={{ 
                position: 'relative', 
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 14px',
                borderRadius: '16px',
                background: isMoreOpen ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
                transition: 'all 0.3s ease',
                marginBottom: '2px'
              }}>
                <MoreHorizontal size={18} style={{
                  transform: isMoreOpen ? 'scale(1.15)' : 'scale(1)',
                  transition: 'transform 0.3s ease',
                  color: isMoreOpen ? '#a855f7' : 'inherit'
                }} />
                {hiddenMobileTabs.some(t => t.badge) && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-4px',
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
                <img 
                  onClick={() => setShowAppIconModal(true)}
                  src={currentAppIcon} 
                  alt="App Logo" 
                  title="Click to change app icon theme"
                  style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%', 
                    objectFit: 'cover',
                    boxShadow: '0 0 10px rgba(168, 85, 247, 0.4)',
                    border: '1.5px solid var(--accent)',
                    cursor: 'pointer'
                  }} 
                />
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
            {/* Desktop Horizontal Navigation Tab Bar */}
            <div className="desktop-tab-bar" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', margin: '0 20px', flex: 1, maxWidth: 'calc(100% - 400px)' }}>
              {displayDesktopTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id, false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      border: isActive ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
                      background: isActive ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(255,255,255,0.02)',
                      color: isActive ? 'white' : '#94A3B8',
                      boxShadow: isActive ? '0 4px 15px rgba(124, 58, 237, 0.3)' : 'none',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = '#94A3B8';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                      }
                    }}
                  >
                    <Icon size={14} style={{ color: isActive ? 'white' : '#a855f7' }} />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span style={{
                        background: 'var(--danger)',
                        color: 'white',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        borderRadius: '10px',
                        padding: '1px 5px',
                        lineHeight: 1
                      }}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
              
              {/* More Desktop Options Dropdown */}
              {hiddenDesktopTabs.length > 0 && (
                <div className="relative">
                  <button 
                    onClick={() => setIsDesktopMoreOpen(!isDesktopMoreOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      border: isCurrentTabHidden ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
                      background: isCurrentTabHidden ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(255,255,255,0.02)',
                      color: isCurrentTabHidden ? 'white' : '#94A3B8',
                      boxShadow: isCurrentTabHidden ? '0 4px 15px rgba(124, 58, 237, 0.3)' : 'none',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrentTabHidden) {
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrentTabHidden) {
                        e.currentTarget.style.color = '#94A3B8';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      }
                    }}
                  >
                    <span>More</span>
                    <span style={{ fontSize: '9px', transform: isDesktopMoreOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                  </button>
                  
                  {isDesktopMoreOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsDesktopMoreOpen(false)} />
                      <div 
                        className="absolute right-0 mt-2 w-[200px] bg-[#141425]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 py-1 overflow-hidden"
                        style={{ top: '100%' }}
                      >
                        {hiddenDesktopTabs.map((tab) => {
                          const Icon = tab.icon;
                          const isActive = activeTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => {
                                handleTabChange(tab.id, false);
                                setIsDesktopMoreOpen(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs font-semibold transition-all cursor-pointer border-l-2 ${
                                isActive 
                                  ? 'bg-purple-500/10 text-white border-purple-500' 
                                  : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.02] border-transparent'
                              }`}
                            >
                              <Icon size={12} style={{ color: '#a855f7' }} />
                              <span style={{ flex: 1 }}>{tab.label}</span>
                              {tab.badge && (
                                <span style={{
                                  background: 'var(--danger)',
                                  color: 'white',
                                  fontSize: '9px',
                                  fontWeight: 'bold',
                                  borderRadius: '10px',
                                  padding: '1px 5px',
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
            className="flex-1 p-4 lg:p-8 pb-[80px] lg:pb-8 overflow-y-auto w-full max-w-full min-w-0 min-h-0 dashboard-scroll-container"
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
                        ? (syncStage === 0 ? "Syncing School Data..."
                          : syncStage === 1 ? "Attendance Updated"
                          : syncStage === 2 ? "Diary Updated"
                          : syncStage === 3 ? "Bus Tracking Updated"
                          : syncStage === 4 ? "Timetable Updated"
                          : "Sync Complete")
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
            {appVersionStatus.isOutdated && (
              <div className="glass-card animate-pulse" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                marginBottom: '16px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.08)',
                color: '#f87171',
                borderRadius: 'var(--radius-md)',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '250px' }}>
                  <ShieldAlert size={18} style={{ color: '#f87171', flexShrink: 0 }} />
                  <span style={{ fontSize: '12.5px', fontWeight: '500', lineHeight: '1.4' }}>
                    You are using an outdated app version (v{appVersionStatus.userVer}). Please download and install the new version (v{appVersionStatus.currentVer}) containing critical details popup & scroll fixes.
                  </span>
                </div>
                <a 
                  href="/downloads/schoolconnect.apk"
                  download="schoolconnect.apk"
                  className="code-save-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    background: '#ef4444',
                    textDecoration: 'none',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    margin: 0,
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <Download size={12} />
                  <span>Download Update (v{appVersionStatus.currentVer})</span>
                </a>
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Smartphone size={32} />
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
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? <Smartphone size={24} /> : <Monitor size={24} />}
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
                  boxShadow: '0 4px 15px rgba(168, 85, 247, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Download size={14} />
                <span>Download Native App</span>
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
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 99999,
          background: 'rgba(20, 20, 37, 0.95)',
          backdropFilter: 'blur(16px)',
          border: toastType === 'error' ? '1px solid rgba(239, 68, 68, 0.3)' :
                  toastType === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' :
                  toastType === 'warning' ? '1px solid rgba(245, 158, 11, 0.3)' :
                  '1px solid rgba(168, 85, 247, 0.3)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          padding: '16px 20px',
          borderRadius: '16px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
          maxWidth: '380px',
          width: 'calc(100vw - 40px)',
          animation: 'slideInFromRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}>
          <div style={{
            lineHeight: '1',
            marginTop: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <style>{`
              @keyframes drawDash {
                to {
                  stroke-dashoffset: 0;
                }
              }
              @keyframes scaleIn {
                0% { transform: scale(0); opacity: 0; }
                100% { transform: scale(1); opacity: 1; }
              }
            `}</style>
            {toastType === 'success' && (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                <polyline points="20 6 9 17 4 12" style={{ strokeDasharray: 30, strokeDashoffset: 30, animation: 'drawDash 0.4s ease-out forwards 0.1s' }} />
              </svg>
            )}
            {toastType === 'error' && (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                <line x1="18" y1="6" x2="6" y2="18" style={{ strokeDasharray: 20, strokeDashoffset: 20, animation: 'drawDash 0.3s ease-out forwards 0.05s' }} />
                <line x1="6" y1="6" x2="18" y2="18" style={{ strokeDasharray: 20, strokeDashoffset: 20, animation: 'drawDash 0.3s ease-out forwards 0.15s' }} />
              </svg>
            )}
            {toastType === 'warning' && (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" style={{ strokeDasharray: 60, strokeDashoffset: 60, animation: 'drawDash 0.6s ease-out forwards' }} />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            )}
            {toastType !== 'success' && toastType !== 'error' && toastType !== 'warning' && (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{
              margin: '0 0 4px 0',
              fontSize: '14px',
              fontWeight: '700',
              color: 'white',
              textTransform: 'capitalize',
              fontFamily: 'system-ui'
            }}>
              {toastType}
            </h4>
            <p style={{
              margin: 0,
              fontSize: '12px',
              color: '#94A3B8',
              lineHeight: '1.5',
              whiteSpace: 'pre-line',
              wordBreak: 'break-word',
              fontFamily: 'system-ui'
            }}>
              {toastMessage}
            </p>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              padding: '2px',
              fontSize: '18px',
              lineHeight: '1',
              transition: 'color 0.2s',
              outline: 'none'
            }}
          >
            &times;
          </button>
          
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: '3px',
            background: toastType === 'error' ? '#ef4444' :
                        toastType === 'success' ? '#10b981' :
                        toastType === 'warning' ? '#f59e0b' :
                        '#a855f7',
            borderRadius: '0 0 0 16px',
            animation: 'toastProgress 5s linear forwards'
          }} />
        </div>
      )}
      <AppIconSelectionModal 
        isOpen={showAppIconModal} 
        onClose={() => setShowAppIconModal(false)} 
        schoolLogo={schoolLogo} 
        onSelect={handleSelectAppIcon} 
      />
    </div>
  );
};


export { DashboardLayout, API_URL, addSatelliteHybridLayers, filterRecentThreeMonths, BroadcastDetailsModal, ParentDetailsModal, LogoutConfirmationModal, ProfileSettingsTab, AnimatedCounter };

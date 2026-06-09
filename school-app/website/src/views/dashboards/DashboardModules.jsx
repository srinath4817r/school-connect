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
import { API_URL, addSatelliteHybridLayers, filterRecentThreeMonths } from './DashboardLayout';

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
    statusMessage = "Mobile hotspot detected! This is a mobile hotspot, not a school WiFi network. Please connect to the school's authorized WiFi to mark attendance.";
    isAllowed = false;
  } else if (!isMatched) {
    connectionStatus = 'mismatch';
    statusMessage = `Mismatched network. Please connect to the school's authorized WiFi (${authSSID || 'Greenwood_High_Staff_WiFi'}) to mark attendance.`;
    isAllowed = false;
  } else {
    connectionStatus = 'verified';
    statusMessage = "Connection verified! You are connected to the school's authorized WiFi network. Ready to mark attendance.";
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
                  <option value={wifiSSID}>[Detected] {wifiSSID}</option>
                )}
                {!wifiSSID && (
                  <option value="">Waiting for detection / select WiFi...</option>
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
            {loading ? 'Verifying connection...' : 'Mark Daily Attendance'}
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
  const [expandedStudentId, setExpandedStudentId] = useState(null);
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
                    <tr 
                      key={stud._id}
                      className={expandedStudentId === stud._id ? 'row-expanded' : ''}
                      onClick={() => {
                        if (window.innerWidth <= 768) {
                          setExpandedStudentId(expandedStudentId === stud._id ? null : stud._id);
                        }
                      }}
                    >
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(stud._id);
                          }}
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
            {requestLoading ? 'Submitting Request...' : 'Send Assignment Request'}
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
        setSuccess('Schedule saved successfully and teacher notified!');
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
            <Calendar size={18} /> Schedule Grid Editor
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
                  style={{ margin: 0, padding: '8px 16px', fontSize: '12px', float: 'right', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={14} /> Add Period
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
                      : (entry && entry.dayType === 'working')
                        ? 'white'
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
            <option value="Morning">Morning Shift</option>
            <option value="Afternoon">Afternoon Shift</option>
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
              {isSubmitted ? '[Submitted]' : '[Not Submitted]'} {isSubmitted ? `Attendance Log Submitted for ${selectedShift} Shift` : `Attendance Log NOT Submitted yet`}
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
                <span>Present Students</span>
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
                <span>Absent Students</span>
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



export {
  StaffCheckInModule,
  WiFiConfigCard,
  StaffAttendanceMonitoringLogs,
  StudentDirectoryModule,
  ClassTimetableModule,
  ClassRequestsManagement
};

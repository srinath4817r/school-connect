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
import { DashboardLayout, API_URL, addSatelliteHybridLayers, LogoutConfirmationModal, ProfileSettingsTab } from './DashboardLayout';
import { ClassTimetableModule, SchoolCalendarModule } from './DashboardModules';
import { TripPlaybackPanel } from './DriverDashboard';

const calculateGrade = (percentage) => {
  const pct = parseFloat(percentage);
  if (isNaN(pct)) return 'N/A';
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  if (pct >= 40) return 'E';
  return 'F';
};

export const ParentDashboard = () => {
  const { user, setUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const formatDays = (daysVal) => {
    if (daysVal === undefined || daysVal === null) return '0';
    const integerPart = Math.floor(daysVal);
    const hasHalf = (daysVal % 1) !== 0;
    if (hasHalf) {
      return integerPart > 0 ? `${integerPart} 1/2` : '1/2';
    }
    return String(integerPart);
  };

  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('activeTab_parent') || 'overview'); // 'overview', 'diary', 'bus', 'attendance', 'timetable', 'marks', 'fees'
  const [selectedOverviewDate, setSelectedOverviewDate] = useState(() => new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSuccessTick, setShowSuccessTick] = useState(false);
  const [isPressingMarkRead, setIsPressingMarkRead] = useState(false);

  // Signed Diaries State
  const [signedDiaries, setSignedDiaries] = useState(() => {
    try {
      const stored = localStorage.getItem(`parent_signed_diaries_${user?.id || user?._id}`);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  });

  // Leave Requests State
  const [leaveRequests, setLeaveRequests] = useState([]);

  const [leaveForm, setLeaveForm] = useState({
    startDate: '',
    endDate: '',
    leaveType: 'Sick Leave',
    reason: ''
  });

  // Direct Chat State
  const pruneOldMessages = (messages) => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return messages.filter(msg => {
      const timestampStr = msg.timestamp || msg.time;
      if (!timestampStr) return true;
      const msgTime = new Date(timestampStr).getTime();
      return msgTime >= sevenDaysAgo;
    });
  };
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isTeacherTyping, setIsTeacherTyping] = useState(false);
  const [classTeacher, setClassTeacher] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);

  const fetchClassTeacher = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/class-teacher`);
      if (res.data.status === 'success') {
        setClassTeacher(res.data.teacher);
      }
    } catch (err) {
      console.error('Failed to fetch class teacher:', err);
    }
  };

  // Sync parent messages or unread counts from DB in real-time
  useEffect(() => {
    const syncChat = async () => {
      try {
        if (activeTab === 'chat') {
          const res = await axios.get(`${API_URL}/messages`);
          if (res.data.status === 'success') {
            const dbMsgs = res.data.messages || [];
            const formatted = dbMsgs.map(msg => ({
              id: msg._id,
              sender: msg.sender,
              text: msg.text,
              timestamp: msg.createdAt || msg.timestamp,
              linkToTab: msg.linkToTab
            }));
            
            let finalMsgs = formatted;
            if (formatted.length === 0) {
              finalMsgs = [
                {
                  id: '1',
                  sender: 'teacher',
                  text: "Hello! Let know if you have any questions about today's diary, attendance, or academic progress.",
                  timestamp: new Date(Date.now() - 3600000).toISOString()
                }
              ];
            }
            
            const hasChanged = finalMsgs.length !== chatMessages.length || 
              (finalMsgs.length > 0 && chatMessages.length > 0 && finalMsgs[finalMsgs.length - 1].id !== chatMessages[chatMessages.length - 1].id);
            
            if (hasChanged) {
              setChatMessages(finalMsgs);
            }
            if (unreadCount !== 0) {
              setUnreadCount(0);
            }
          }
        } else {
          // Poll for unread count
          const res = await axios.get(`${API_URL}/messages/unread`);
          if (res.data.status === 'success') {
            const count = res.data.count || 0;
            if (count !== unreadCount) {
              setUnreadCount(count);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to sync chat status from server:', err);
      }
    };

    syncChat();
    const interval = setInterval(syncChat, 2000);
    return () => clearInterval(interval);
  }, [activeTab, chatMessages.length, unreadCount]);

  // Load teacher info on tab change
  useEffect(() => {
    if (activeTab === 'chat' && !classTeacher) {
      fetchClassTeacher();
    }
  }, [activeTab, classTeacher]);  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  // Activity Clubs State
  const [clubRegistrations, setClubRegistrations] = useState(() => {
    try {
      const stored = localStorage.getItem(`parent_club_registrations_${user?.id || user?._id}`);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  });

  const clubsList = [
    { id: 'science', name: 'Science & Robotics Club', desc: 'Hands-on projects with microcontrollers, physics models, and coding challenge sessions.', schedule: 'Tuesday & Thursday, 4:00 PM - 5:30 PM', teacher: 'Dr. Alan Turing' },
    { id: 'football', name: 'Football Academy Junior Team', desc: 'Physical conditioning, tactical training, and weekly local inter-school friendlies.', schedule: 'Wednesday & Friday, 3:30 PM - 5:00 PM', teacher: 'Coach Leo Messi' },
    { id: 'drama', name: 'Drama & Literary Society', desc: 'Speech therapy, theatrical performances, school assembly preparations, and debate rehearsals.', schedule: 'Monday, 3:30 PM - 5:00 PM', teacher: 'Mrs. Sarah Jenkins' },
    { id: 'art', name: 'Fine Arts & Painting Club', desc: 'Watercolors, oil paint guides, clay molding lessons, and school exhibition projects.', schedule: 'Thursday, 4:00 PM - 5:30 PM', teacher: 'Ms. Emily Bronte' }
  ];



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
  const [dailyBus, setDailyBus] = useState(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        return localStorage.getItem(`parent_daily_bus_${u.id || u._id}`) || '';
      }
    } catch (e) {}
    return '';
  });
  const [busNumber, setBusNumber] = useState(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        const daily = localStorage.getItem(`parent_daily_bus_${u.id || u._id}`);
        if (daily) return daily;
        const storedBus = localStorage.getItem(`parent_last_tracked_bus_${u.id || u._id}`);
        if (storedBus) return storedBus;
      }
    } catch (e) {
      console.warn(e);
    }
    return '';
  });
  const [inputBusNum, setInputBusNum] = useState(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        const daily = localStorage.getItem(`parent_daily_bus_${u.id || u._id}`);
        if (daily) return daily;
        const storedBus = localStorage.getItem(`parent_last_tracked_bus_${u.id || u._id}`);
        if (storedBus) return storedBus;
      }
    } catch (e) {
      console.warn(e);
    }
    return '';
  });
  const [tripData, setTripData] = useState(null);
  const [isSearching, setIsSearching] = useState(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        const daily = localStorage.getItem(`parent_daily_bus_${u.id || u._id}`);
        if (daily) return false;
        const storedBus = localStorage.getItem(`parent_last_tracked_bus_${u.id || u._id}`);
        if (storedBus) return false;
      }
    } catch (e) {
      console.warn(e);
    }
    return true;
  });

  const [isDailyPreferred, setIsDailyPreferred] = useState(false);
  const [notify3km, setNotify3km] = useState(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        return localStorage.getItem(`parent_notify_3km_${u.id || u._id}`) === 'true';
      }
    } catch (e) {}
    return false;
  });

  const [showPermissionExplanation, setShowPermissionExplanation] = useState(false);
  const [permissionErrorType, setPermissionErrorType] = useState(''); // 'location', 'notifications', or 'both'

  // Account Switcher States
  const [parentAccounts, setParentAccounts] = useState(() => {
    try {
      const activeUser = JSON.parse(localStorage.getItem('user'));
      const activeToken = localStorage.getItem('token');
      const stored = localStorage.getItem('parent_accounts');
      let accounts = stored ? JSON.parse(stored) : [];
      if (activeUser && activeToken && activeUser.role === 'parent') {
        const exists = accounts.find(acc => acc.email === activeUser.email);
        if (!exists) {
          accounts.push({
            email: activeUser.email,
            token: activeToken,
            user: activeUser
          });
          localStorage.setItem('parent_accounts', JSON.stringify(accounts));
        }
      }
      return accounts;
    } catch (e) {
      return [];
    }
  });
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [newAccountEmail, setNewAccountEmail] = useState('');
  const [newAccountPassword, setNewAccountPassword] = useState('');
  const [switchError, setSwitchError] = useState('');
  const [switchLoading, setSwitchLoading] = useState(false);

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
  const dateInputRef = useRef(null);

  // Home coordinates prompt states
  const [showHomePromptModal, setShowHomePromptModal] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [showTrackLocationChoiceModal, setShowTrackLocationChoiceModal] = useState(false);
  const [showDashboardMapSelector, setShowDashboardMapSelector] = useState(false);
  const [showParentEditorMapSelector, setShowParentEditorMapSelector] = useState(false);
  const [homeLat, setHomeLat] = useState('');
  const [homeLng, setHomeLng] = useState('');
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptError, setPromptError] = useState('');
  const [promptSuccess, setPromptSuccess] = useState('');

  const [isSelectingOnMap, setIsSelectingOnMap] = useState(false);

  // Parent profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [parentProfileForm, setParentProfileForm] = useState({
    fatherName: user?.fatherName || '',
    motherName: user?.motherName || '',
    fatherPhone: user?.fatherPhone || '',
    motherPhone: user?.motherPhone || '',
    emergencyContact: user?.emergencyContact || '',
    homeAddress: user?.homeAddress || ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const handleDashboardDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setParentProfileForm(prev => ({
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

  useEffect(() => {
    if (user) {
      setParentProfileForm({
        fatherName: user.fatherName || '',
        motherName: user.motherName || '',
        fatherPhone: user.fatherPhone || '',
        motherPhone: user.motherPhone || '',
        emergencyContact: user.emergencyContact || '',
        homeAddress: user.homeAddress || ''
      });
    }
  }, [user]);

  const handleSaveParentProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      const res = await axios.put(`${API_URL}/auth/update-profile`, {
        fatherName: parentProfileForm.fatherName,
        motherName: parentProfileForm.motherName,
        fatherPhone: parentProfileForm.fatherPhone,
        motherPhone: parentProfileForm.motherPhone,
        emergencyContact: parentProfileForm.emergencyContact,
        homeAddress: parentProfileForm.homeAddress
      });
      if (res.data.status === 'success') {
        setUser(res.data.user);
        saveUserToLocalStorage(res.data.user);
        setProfileSuccess('Details saved successfully');
        setIsEditingProfile(false);
        setIsResubmitting(false);
        setTimeout(() => setProfileSuccess(''), 3000);
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile details.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSelectOnMapClick = () => {
    setShowHomePromptModal(false);
    setShowDashboardMapSelector(true);
  };

  const handleCancelSelect = () => {
    try {
      const stored = localStorage.getItem(`parent_home_location_${user?.id || user?._id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHomeLat(parsed.lat.toString());
        setHomeLng(parsed.lng.toString());
        setParentLocation(parsed);
      } else {
        setHomeLat('');
        setHomeLng('');
        setParentLocation(null);
      }
    } catch (e) {
      console.warn(e);
    }
    setIsSelectingOnMap(false);
    setShowHomePromptModal(true);
  };

  // Geofencing and watchlist states
  const [trackedBuses, setTrackedBuses] = useState(() => {
    const userId = user?.id || user?._id;
    const stored = userId ? localStorage.getItem(`parent_tracked_buses_${userId}`) : null;
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
    return ['BUS-40']; // default bus to start with
  });
  const [geofenceRadius, setGeofenceRadius] = useState(() => {
    const userId = user?.id || user?._id;
    const stored = userId ? localStorage.getItem(`parent_geofence_radius_${userId}`) : null;
    return parseFloat(stored || '1.0');
  });
  const [enableGeofence, setEnableGeofence] = useState(true);
  const [hasNotifiedGeofence, setHasNotifiedGeofence] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [schoolDetails, setSchoolDetails] = useState(null);
  const [promoSlideIndex, setPromoSlideIndex] = useState(0);

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
    setSuccess(`Geofence Alert: Bus ${busNumber} is within your geofence (${geofenceRadius} km)! Estimated arrival: ${eta} minutes.`);
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
      const res = await axios.put(`${API_URL}/auth/update-profile`, { homeAddress: coordString });
      if (res.data.status === 'success') {
        setUser(res.data.user);
        saveUserToLocalStorage(res.data.user);
      }

      setPromptSuccess('Details saved successfully');
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

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e) => {
      if (isSelectingOnMap) {
        const { lat, lng } = e.latlng;
        setHomeLat(lat.toFixed(6));
        setHomeLng(lng.toFixed(6));
        setParentLocation({ lat, lng });
        setIsSelectingOnMap(false);
        setShowHomePromptModal(true);
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [isSelectingOnMap]);

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
            const res = await axios.put(`${API_URL}/auth/update-profile`, { homeAddress: coordString });
            if (res.data.status === 'success') {
              setUser(res.data.user);
              saveUserToLocalStorage(res.data.user);
            }

            alert("Successfully updated and saved current location as your home point!");
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

  useEffect(() => {
    if (notify3km) {
      setGeofenceRadius(3.0);
      localStorage.setItem(`parent_geofence_radius_${user?.id || user?._id}`, '3.0');
    }
  }, [notify3km, user]);

  useEffect(() => {
    const checkAndRequestPermissions = async () => {
      const isMobileDevice = window.innerWidth < 768 || /Mobi|Android|iPhone/i.test(navigator.userAgent);
      if (!isMobileDevice) return; // Only request on mobile as requested
      
      let geoDenied = false;
      let notifyDenied = false;

      // 1. Request Geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => {},
          (err) => {
            if (err.code === err.PERMISSION_DENIED) {
              geoDenied = true;
            }
          }
        );
      }

      // 2. Request Notifications
      if ('Notification' in window) {
        if (Notification.permission === 'default') {
          const result = await Notification.requestPermission();
          if (result === 'denied') {
            notifyDenied = true;
          }
        } else if (Notification.permission === 'denied') {
          notifyDenied = true;
        }
      }

      // Small timeout to let permissions resolve
      setTimeout(() => {
        if (geoDenied || notifyDenied) {
          setShowPermissionExplanation(true);
          if (geoDenied && notifyDenied) {
            setPermissionErrorType('both');
          } else if (geoDenied) {
            setPermissionErrorType('location');
          } else {
            setPermissionErrorType('notifications');
          }
        }
      }, 3000);
    };

    checkAndRequestPermissions();
  }, []);

  const handleSwitchAccount = (account) => {
    try {
      localStorage.setItem('token', account.token);
      localStorage.setItem('user', JSON.stringify(account.user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${account.token}`;
      setUser(account.user);
      setShowAccountSwitcher(false);
      window.location.reload();
    } catch (err) {
      alert("Failed to switch account: " + err.message);
    }
  };

  const handleAddAndSwitchAccount = async (e) => {
    e.preventDefault();
    setSwitchError('');
    setSwitchLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email: newAccountEmail,
        password: newAccountPassword
      });

      if (res.data.status === 'success') {
        const { token: newToken, user: newUser } = res.data;
        if (newUser.role !== 'parent') {
          setSwitchError('Only parent accounts can be added to the switcher.');
          setSwitchLoading(false);
          return;
        }

        const updatedAccounts = [...parentAccounts.filter(acc => acc.user.email !== newUser.email), {
          email: newUser.email,
          token: newToken,
          user: newUser
        }];

        localStorage.setItem('parent_accounts', JSON.stringify(updatedAccounts));
        setParentAccounts(updatedAccounts);

        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        setUser(newUser);

        setNewAccountEmail('');
        setNewAccountPassword('');
        setShowAccountSwitcher(false);
        window.location.reload();
      } else {
        setSwitchError(res.data.message || 'Login failed.');
      }
    } catch (err) {
      setSwitchError(err.response?.data?.message || 'Invalid credentials or connection error.');
    } finally {
      setSwitchLoading(false);
    }
  };

  const handleRemoveAccount = (email, e) => {
    e.stopPropagation();
    const activeUser = JSON.parse(localStorage.getItem('user'));
    if (activeUser && activeUser.email === email) {
      alert("Cannot remove the active logged in account. Switch to another account first.");
      return;
    }
    const updated = parentAccounts.filter(acc => acc.email !== email);
    localStorage.setItem('parent_accounts', JSON.stringify(updated));
    setParentAccounts(updated);
  };

  // 2. Classroom Diary States
  const [todayDiary, setTodayDiary] = useState(null);
  const [diaryHistory, setDiaryHistory] = useState([]);

  // 4. Attendance States
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  // 5. Marks States
  const [reportCard, setReportCard] = useState([]);
  const [selectedExamFilter, setSelectedExamFilter] = useState('All');
  const [expandedExams, setExpandedExams] = useState({});

  // 6. Fee States
  const [feeDetails, setFeeDetails] = useState(null);
  const [feeLoaded, setFeeLoaded] = useState(false);

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

  // Student Health Profile States
  const [healthProfile, setHealthProfile] = useState(() => {
    try {
      const stored = localStorage.getItem(`parent_health_records_${user?.id || user?._id}`);
      return stored ? JSON.parse(stored) : {
        bloodGroup: 'O Positive (O+)',
        allergies: 'Peanuts, Penicillin',
        disability: 'None Reported'
      };
    } catch (e) {
      return {
        bloodGroup: 'O Positive (O+)',
        allergies: 'Peanuts, Penicillin',
        disability: 'None Reported'
      };
    }
  });
  const [isEditingHealth, setIsEditingHealth] = useState(false);
  const [tempHealth, setTempHealth] = useState({ ...healthProfile });

  const handleSaveHealthProfile = (e) => {
    e.preventDefault();
    setHealthProfile(tempHealth);
    localStorage.setItem(`parent_health_records_${user?.id || user?._id}`, JSON.stringify(tempHealth));
    setIsEditingHealth(false);
  };

  // Leaflet refs
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const polylineRef = useRef(null);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = (allDevices = false) => {
    logout(allDevices);
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

  const fetchLeaveRequests = async () => {
    try {
      const res = await axios.get(`${API_URL}/attendance/leaves`);
      if (res.data.status === 'success') {
        setLeaveRequests(res.data.leaves || []);
      }
    } catch (err) {
      console.error('Failed to fetch leave requests:', err);
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

  useEffect(() => {
    if (schoolDetails?.promoType === 'slideshow' && schoolDetails?.promoImages?.length > 0) {
      const interval = setInterval(() => {
        setPromoSlideIndex(prev => (prev + 1) % schoolDetails.promoImages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [schoolDetails]);

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
    fetchClassTeacher();
    if (user?.approvalStatus === 'pending' || user?.approvalStatus === 'rejected') {
      fetchPreStudentsDirectory();
    } else {
      fetchDiaryData();
      fetchAttendance();
      fetchMarks();
      fetchFee();
      fetchTodayTimetable();
      fetchParentCalendarForBanner();
      fetchLeaveRequests();

      // Check home location prompt
      let savedHome = localStorage.getItem(`parent_home_location_${user?.id || user?._id}`);
      let prompted = localStorage.getItem(`parent_home_prompt_shown_${user?.id || user?._id}`);
      
      if (!savedHome && user?.homeAddress) {
        let coords = null;
        if (user.homeAddress.includes('Coordinates:')) {
          const coordPart = user.homeAddress.split('Coordinates:')[1];
          try {
            const parts = coordPart.split(',');
            if (parts.length >= 2) {
              const lat = parseFloat(parts[0].trim());
              const lng = parseFloat(parts[1].trim());
              if (!isNaN(lat) && !isNaN(lng)) {
                coords = { lat, lng };
              }
            }
          } catch (e) {}
        }
        if (coords) {
          localStorage.setItem(`parent_home_location_${user.id || user._id}`, JSON.stringify(coords));
          savedHome = JSON.stringify(coords);
        }
        localStorage.setItem(`parent_home_prompt_shown_${user.id || user._id}`, 'true');
        prompted = 'true';
      }

      if (!savedHome && !prompted) {
        setShowHomePromptModal(true);
      }
    }

    const interval = setInterval(() => {
      if (user?.approvalStatus === 'pending' || user?.approvalStatus === 'rejected') {
        fetchPreStudentsDirectory();
      } else {
        fetchDiaryData(true);
        fetchAttendance();
        fetchMarks();
        fetchFee();
        fetchTodayTimetable();
        fetchParentCalendarForBanner();
        fetchLeaveRequests();
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
      const checkBusStatus = async () => {
        // Try fetching from backend first
        try {
          const res = await axios.get(`${API_URL}/auth/bus/${busNumber}/trip`);
          if (res.data.status === 'success' && res.data.trip) {
            const trip = res.data.trip;
            // Dynamic activity check based on server-side timestamp to prevent client clock skew issues (60s offline threshold)
            const serverTime = res.data.serverTime || Date.now();
            trip.active = trip.active && (serverTime - new Date(trip.lastUpdated).getTime() < 60000);
            
            setTripData(prev => {
              if (prev && 
                  prev.active === trip.active && 
                  prev.speed === trip.speed && 
                  prev.distance === trip.distance && 
                  prev.currentCoords?.lat === trip.currentCoords?.lat && 
                  prev.currentCoords?.lng === trip.currentCoords?.lng && 
                  prev.alertStatus === trip.alertStatus && 
                  prev.lastUpdated === trip.lastUpdated && 
                  prev.path?.length === trip.path?.length) {
                return prev;
              }
              return trip;
            });
            return;
          }
        } catch (err) {
          console.warn("Backend bus tracking fetch failed, using local storage fallback:", err);
        }

        // Local storage fallback
        const stored = localStorage.getItem(`bus_${busNumber}_trip`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            // Dynamic activity check based on lastUpdated timestamp (60 seconds offline threshold)
            parsed.active = parsed.active && (Date.now() - (parsed.lastUpdated || 0) < 60000);
            
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
          
          // If no history exists, use a default placeholder centered around parentLocation or Hyderabad
          const defaultLoc = parentLocation || { lat: 17.3850, lng: 78.4867 };
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
          const map = L.map('parent-map', { attributionControl: false }).setView(busLatLng, 15);
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
            if (!isBusActive && !tripData.isPlaceholder) {
              map.setView(busLatLng, 15);
            } else {
              const bounds = L.latLngBounds(roadRoutePath.length > 0 ? roadRoutePath : [parentLatLng, busLatLng]);
              map.fitBounds(bounds, { maxZoom: 15, padding: [50, 50] });
            }
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

          const tooltipContent = `<div style="font-family: system-ui, -apple-system, sans-serif; font-weight: 700; color: white; background: ${alertColor}; padding: 6px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.25); box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-size: 11px; text-align: center; text-transform: uppercase; white-space: nowrap;"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>Bus ${tripData.busNumber || ''} ${alertTitle} Reported<br/><span style="font-weight: 500; font-size: 9px; opacity: 0.9; text-transform: none;">Coords: ${tripData.incidentCoords.lat.toFixed(5)}, ${tripData.incidentCoords.lng.toFixed(5)}</span></div>`;

          if (!incidentMarkerRef.current) {
            incidentMarkerRef.current = L.marker(incidentLatLng, { icon: incidentIcon })
              .addTo(map)
              .bindPopup(`<strong>Driver Alert: ${alertTitle}</strong><br/>Location of incident report`)
              .bindTooltip(tooltipContent, { permanent: true, direction: 'top', className: 'custom-incident-tooltip', offset: [0, -10] })
              .openPopup();
          } else {
            incidentMarkerRef.current.setLatLng(incidentLatLng);
            incidentMarkerRef.current.setIcon(incidentIcon);
            incidentMarkerRef.current.setPopupContent(`<strong>Driver Alert: ${alertTitle}</strong><br/>Location of incident report`);
            incidentMarkerRef.current.setTooltipContent(tooltipContent);
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
        setSuccess('Details saved successfully');
        if (res.data.user) {
          setUser(res.data.user);
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

  // Weekdays logic (M, T, W, T, F, S)
  // Weekdays logic (M, T, W, T, F, S)
  const weekDays = useMemo(() => {
    const baseDate = new Date(selectedOverviewDate);
    const day = baseDate.getDay();
    const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1); // get Monday of selected week
    const monday = new Date(baseDate.setDate(diff));
    
    const days = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  }, [selectedOverviewDate]);

  const overviewPeriods = useMemo(() => {
    if (!fullTimetable || fullTimetable.length === 0) {
      return [
        { time: '7:00pm. Daily', subject: 'Chapter 6, Bangla', code: 'Bangla' },
        { time: '8:00pm. Daily', subject: 'Chapter 6, English', code: 'English' },
        { time: '9:00pm. Daily', subject: 'Chapter 6, Math', code: 'Math' },
        { time: '10:00pm. Daily', subject: 'Chapter 6, physics', code: 'physics' }
      ];
    }
    const dayName = selectedOverviewDate.toLocaleDateString('en-US', { weekday: 'long' });
    const dayRecord = fullTimetable.find(t => t.day.toLowerCase() === dayName.toLowerCase());
    if (dayRecord && dayRecord.periods && dayRecord.periods.length > 0) {
      return dayRecord.periods.map(period => {
        let timeStr = period.time;
        const startPart = period.time.split('-')[0].trim();
        if (startPart) {
          const match = startPart.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (match) {
            const h = parseInt(match[1]);
            const m = match[2];
            const ampm = match[3].toLowerCase();
            timeStr = `${h}:${m}${ampm}. Daily`;
          } else {
            timeStr = `${startPart}. Daily`;
          }
        }
        return {
          time: timeStr,
          subject: period.subject || 'Class Period',
          code: `Chapter 6, ${period.subject || 'Class'}`
        };
      });
    }
    return [
      { time: 'No classes scheduled', subject: 'Free Day', code: 'Enjoy your day!' }
    ];
  }, [fullTimetable, selectedOverviewDate]);

  const featuredClass = useMemo(() => {
    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const dayRecord = fullTimetable.find(t => t.day.toLowerCase() === todayName.toLowerCase());
    if (dayRecord && dayRecord.periods && dayRecord.periods.length > 0) {
      const active = calculateActivePeriod(dayRecord.periods);
      if (active) {
        return {
          statusText: 'ONGOING',
          timeDesc: active.time,
          subject: active.subject,
          details: `Room: ${active.room || 'Classroom 4A'} • Period: ${active.periodName || 'Active'}`
        };
      }
      const first = dayRecord.periods[0];
      return {
          statusText: 'UPCOMING',
          timeDesc: `Starts at ${first.time.split('-')[0].trim()}`,
          subject: first.subject,
          details: `Room: ${first.room || 'Classroom 4A'} • Period: ${first.periodName || 'Upcoming'}`
      };
    }
    return {
      statusText: 'NEXT CLASS',
      timeDesc: 'after 30 mins',
      subject: 'Micro Finance',
      details: 'Section: Morning • Room: Classroom 4A'
    };
  }, [fullTimetable]);

  const uniqueExamNames = useMemo(() => {
    if (!reportCard) return [];
    const names = reportCard.map(m => m.examName).filter(Boolean);
    return Array.from(new Set(names));
  }, [reportCard]);

  const displayedReportCard = useMemo(() => {
    if (!reportCard) return [];
    if (selectedExamFilter === 'All') return reportCard;
    return reportCard.filter(m => m.examName === selectedExamFilter);
  }, [reportCard, selectedExamFilter]);

  const examSummary = useMemo(() => {
    if (selectedExamFilter === 'All' || !displayedReportCard || displayedReportCard.length === 0) return null;
    let totalObtained = 0;
    let totalMax = 0;
    displayedReportCard.forEach(m => {
      totalObtained += m.marksObtained || 0;
      totalMax += m.totalMarks || 100;
    });
    const pct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
    return {
      totalObtained,
      totalMax,
      percentage: pct,
      grade: calculateGrade(pct)
    };
  }, [displayedReportCard, selectedExamFilter]);

  const groupedReportCard = useMemo(() => {
    const groups = {};
    displayedReportCard.forEach(m => {
      if (!groups[m.examName]) {
        groups[m.examName] = {
          examName: m.examName,
          subjects: [],
          totalObtained: 0,
          totalMax: 0
        };
      }
      groups[m.examName].subjects.push(m);
      groups[m.examName].totalObtained += m.marksObtained || 0;
      groups[m.examName].totalMax += m.totalMarks || 100;
    });
    return Object.values(groups);
  }, [displayedReportCard]);

  const toggleExamExpanded = (examName) => {
    setExpandedExams(prev => ({
      ...prev,
      [examName]: !prev[examName]
    }));
  };

  const marksChartData = useMemo(() => {
    if (!displayedReportCard || displayedReportCard.length === 0) return null;
    return {
      labels: displayedReportCard.map(m => m.subject),
      datasets: [
        {
          label: 'Student Grade (%)',
          data: displayedReportCard.map(m => m.myPercentage),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          pointBackgroundColor: '#3b82f6',
          fill: true,
          tension: 0.3
        },
        {
          label: 'Class Average (%)',
          data: displayedReportCard.map(m => m.classAveragePercentage),
          borderColor: '#10b981',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [5, 5],
          pointBackgroundColor: '#10b981',
          fill: false,
          tension: 0.3
        }
      ]
    };
  }, [displayedReportCard]);

  const handleSignDiary = (diaryId) => {
    const updated = {
      ...signedDiaries,
      [diaryId]: {
        signed: true,
        timestamp: new Date().toISOString()
      }
    };
    setSignedDiaries(updated);
    localStorage.setItem(`parent_signed_diaries_${user?.id || user?._id}`, JSON.stringify(updated));
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason.trim()) {
      alert("Please fill in all leave request fields.");
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/attendance/leave`, {
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        leaveType: leaveForm.leaveType,
        reason: leaveForm.reason
      });
      if (res.data.status === 'success') {
        alert("Leave application submitted successfully!");
        setLeaveForm({
          startDate: '',
          endDate: '',
          leaveType: 'Sick Leave',
          reason: ''
        });
        fetchLeaveRequests();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to submit leave request.");
    } finally {
      setLoading(false);
    }
  };

  const getTodayAttendanceStatus = () => {
    const today = new Date();
    const todayRecords = attendanceRecords.filter(r => {
      const d = new Date(r.date);
      return d.getFullYear() === today.getFullYear() &&
             d.getMonth() === today.getMonth() &&
             d.getDate() === today.getDate();
    });
    const morning = todayRecords.find(r => r.shift === 'Morning');
    const afternoon = todayRecords.find(r => r.shift === 'Afternoon');

    return {
      morning: morning ? morning.status : 'Not Taken Yet',
      afternoon: afternoon ? afternoon.status : 'Not Taken Yet'
    };
  };

  const renderTodayAttendanceStatusCard = () => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const { morning, afternoon } = getTodayAttendanceStatus();

    const getStatusStyle = (status) => {
      if (status === 'Present') {
        return {
          bg: 'rgba(16, 185, 129, 0.1)',
          text: '#10b981',
          border: 'rgba(16, 185, 129, 0.25)'
        };
      } else if (status === 'Absent') {
        return {
          bg: 'rgba(239, 68, 68, 0.1)',
          text: '#ef4444',
          border: 'rgba(239, 68, 68, 0.25)'
        };
      } else if (status === 'Late') {
        return {
          bg: 'rgba(245, 158, 11, 0.1)',
          text: '#f59e0b',
          border: 'rgba(245, 158, 11, 0.25)'
        };
      }
      return { // Not Taken Yet
        bg: 'var(--bg-main)',
        text: 'var(--text-muted)',
        border: 'var(--border)'
      };
    };

    const mStyle = getStatusStyle(morning);
    const aStyle = getStatusStyle(afternoon);

    return (
      <div 
        className="glass-card" 
        style={{ 
          padding: '20px', 
          borderRadius: 'var(--radius-lg)', 
          background: 'var(--bg-card)', 
          border: '1.5px solid var(--border)',
          boxShadow: 'var(--shadow)',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text-secondary)', fontWeight: '600' }}>Today's Attendance Status</h4>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>{dateStr}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div 
            style={{ 
              flex: 1, 
              padding: '14px', 
              borderRadius: '16px', 
              background: mStyle.bg, 
              border: `1px solid ${mStyle.border}`, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '4px' 
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.05em' }}>MORNING</span>
            <span style={{ fontSize: '16px', fontWeight: '800', color: mStyle.text }}>{morning}</span>
          </div>
          <div 
            style={{ 
              flex: 1, 
              padding: '14px', 
              borderRadius: '16px', 
              background: aStyle.bg, 
              border: `1px solid ${aStyle.border}`, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '4px' 
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.05em' }}>AFTERNOON</span>
            <span style={{ fontSize: '16px', fontWeight: '800', color: aStyle.text }}>{afternoon}</span>
          </div>
        </div>
      </div>
    );
  };
  const handleSendQuickAction = async (actionTitle, actionText) => {
    try {
      const res = await axios.post(`${API_URL}/messages`, { text: actionText });
      if (res.data.status === 'success') {
        const savedMsg = res.data.message;
        const newMsg = {
          id: savedMsg._id,
          sender: savedMsg.sender,
          text: savedMsg.text,
          timestamp: savedMsg.createdAt,
          linkToTab: savedMsg.linkToTab
        };
        const filteredMessages = chatMessages.length === 1 && chatMessages[0].id === '1' ? [] : chatMessages;
        setChatMessages([...filteredMessages, newMsg]);
      }
    } catch (err) {
      console.error('Failed to send quick action message:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const textToSend = chatInput.trim();
    setChatInput('');
    try {
      const res = await axios.post(`${API_URL}/messages`, { text: textToSend });
      if (res.data.status === 'success') {
        const savedMsg = res.data.message;
        const newMsg = {
          id: savedMsg._id,
          sender: savedMsg.sender,
          text: savedMsg.text,
          timestamp: savedMsg.createdAt,
          linkToTab: savedMsg.linkToTab
        };
        const filteredMessages = chatMessages.length === 1 && chatMessages[0].id === '1' ? [] : chatMessages;
        setChatMessages([...filteredMessages, newMsg]);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };
  const handleToggleClub = (clubId) => {
    const updated = {
      ...clubRegistrations,
      [clubId]: !clubRegistrations[clubId]
    };
    setClubRegistrations(updated);
    localStorage.setItem(`parent_club_registrations_${user?.id || user?._id}`, JSON.stringify(updated));
  };

  const loadHtml2Pdf = () => {
    return new Promise((resolve, reject) => {
      if (window.html2pdf) {
        resolve(window.html2pdf);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => resolve(window.html2pdf);
      script.onerror = (e) => reject(e);
      document.body.appendChild(script);
    });
  };

  const parseProgressReportText = (text) => {
    if (!text) return [];
    const lines = text.split('\n');
    const marks = [];
    lines.forEach(line => {
      const match = line.match(/•\s+(.+?)\s*\((.+?)\):\s*(\d+)\s*\/\s*(\d+)\s*\(\s*(\d+)\s*%\)/);
      if (match) {
        const subject = match[1].trim();
        const examName = match[2].trim();
        const marksObtained = parseInt(match[3], 10);
        const totalMarks = parseInt(match[4], 10);
        const percentage = parseInt(match[5], 10);
        marks.push({
          _id: Math.random().toString(),
          subject,
          examName,
          marksObtained,
          totalMarks,
          myPercentage: percentage,
          grade: calculateGrade(percentage)
        });
      }
    });
    return marks;
  };

  const handleDownloadReportCard = async (specificMarks = null) => {
    const isSpecific = specificMarks && Array.isArray(specificMarks);
    const activeMarks = isSpecific ? specificMarks : reportCard;
    if (!activeMarks || activeMarks.length === 0) {
      alert("No marks data available to export.");
      return;
    }

    const studentName = linkedChild?.fullName || linkedChild?.name || 'Kristian Williams';
    const classGrade = linkedChild?.className ? (linkedChild?.section ? `Grade ${linkedChild.className} - ${linkedChild.section}` : `Grade ${linkedChild.className}`) : 'Grade 5 - A';
    const rollNumber = linkedChild?.rollNumber || '15';
    const section = linkedChild?.section || 'A';
    const studentPhoto = user?.profilePhoto || user?.profilePhotoUrl || linkedChild?.profilePhoto || linkedChild?.profilePhotoUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80";
    
    let dob = '12 March 2014';
    if (linkedChild?.dateOfBirth) {
      try {
        dob = new Date(linkedChild.dateOfBirth).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      } catch (e) {
        console.error(e);
      }
    }
    
    const termName = activeMarks[0]?.examName || 'Term 1';
    
    const totalObtainedSum = activeMarks.reduce((sum, m) => sum + (m.marksObtained || 0), 0);
    const totalMaxSum = activeMarks.reduce((sum, m) => sum + (m.totalMarks || 100), 0);
    const averagePercentage = totalMaxSum > 0 ? Math.round((totalObtainedSum / totalMaxSum) * 100) : 0;
    
    let remarks = '';
    if (averagePercentage >= 85) {
      remarks = `"${studentName} is an outstanding, curious, and enthusiastic learner. Shows exemplary participation and consistent academic performance. Keep up the excellent work!"`;
    } else if (averagePercentage >= 70) {
      remarks = `"${studentName} shows good progress and is a dedicated learner who consistently participates well. With continued focus, even higher achievements are within reach. Good job!"`;
    } else if (averagePercentage >= 50) {
      remarks = `"${studentName} is maintaining satisfactory standing. Continued effort and focus on challenging topics will help improve scores in the future. Keep trying!"`;
    } else {
      remarks = `"${studentName} requires significant academic support and focused guidance to improve performance. Regular revision and extra practice in key subjects are highly recommended."`;
    }
    
    const attendanceVal = attendanceStats?.presentRate || 96;

    let logoHtml = '';
    if (schoolDetails?.logoUrl) {
      logoHtml = `<img src="${schoolDetails.logoUrl}" style="width: 55px; height: 55px; border-radius: 50%; object-fit: cover; border: 2px solid #1e3a8a;" />`;
    }

    const totalRowHtml = `
      <tr style="background-color: #f8fafc; border-top: 2px solid #1e3a8a; font-weight: bold;">
        <td style="padding: 12px; font-weight: bold; color: #1e293b; text-align: left;">Total / Cumulative</td>
        <td style="padding: 12px; color: #1e293b; text-align: center;">${totalMaxSum}</td>
        <td style="padding: 12px; color: #1e293b; font-weight: 600; text-align: center;">${totalObtainedSum}</td>
        <td style="padding: 12px; color: #1e293b; text-align: center;">${averagePercentage}%</td>
        <td style="padding: 12px; text-align: center;">
          <span style="display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 700; border-radius: 4px; ${averagePercentage >= 50 ? 'background-color: #dcfce7; color: #15803d;' : 'background-color: #fee2e2; color: #ef4444;'}">
            ${calculateGrade(averagePercentage)}
          </span>
        </td>
      </tr>
    `;

    const tableRows = activeMarks.map(m => {
      const actualGrade = m.grade || calculateGrade(m.myPercentage);
      const isFail = actualGrade === 'F';
      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px; font-weight: bold; color: #1e293b; text-align: left;">${m.subject}</td>
          <td style="padding: 12px; color: #475569; text-align: center;">${m.totalMarks || 100}</td>
          <td style="padding: 12px; color: #1e293b; font-weight: 600; text-align: center;">${m.marksObtained}</td>
          <td style="padding: 12px; color: #475569; text-align: center;">${m.myPercentage}%</td>
          <td style="padding: 12px; text-align: center;">
            <span style="display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 700; border-radius: 4px; ${isFail ? 'background-color: #fee2e2; color: #ef4444;' : 'background-color: #dcfce7; color: #15803d;'}">
              ${actualGrade}
            </span>
          </td>
        </tr>
      `;
    }).join('') + totalRowHtml;

    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.top = '100%';
    wrapper.style.left = '0';
    wrapper.style.width = '680px';
    wrapper.style.height = '1px';
    wrapper.style.overflow = 'hidden';
    wrapper.style.zIndex = '-9999';

    const container = document.createElement('div');
    container.style.width = '680px';
    container.style.backgroundColor = '#ffffff';
    
    const htmlContent = `
      <div style="width: 680px; padding: 30px; box-sizing: border-box; font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif; background-color: #ffffff; border: 4px double #1e3a8a; border-radius: 12px; color: #1f2937; line-height: 1.5;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 20px; gap: 15px;">
          <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
            ${logoHtml ? `<div style="display: flex; align-items: center; justify-content: center;">${logoHtml}</div>` : ''}
            <div>
              <div style="font-size: 20px; font-weight: 800; color: #1e3a8a; letter-spacing: -0.5px; line-height: 1.2;">${schoolDetails?.name || 'Greenwood High School'}</div>
              <div style="font-size: 12px; color: #64748b; font-weight: 500; margin-top: 2px;">Academic Excellence</div>
            </div>
          </div>
          <div style="text-align: center; flex: 1;">
            <div style="font-size: 13px; font-weight: 900; color: #1e3a8a; letter-spacing: 0.5px; text-transform: uppercase;">
              ${isSpecific ? `PROGRESS CARD - ${termName}` : 'CUMULATIVE PROGRESS CARD'}
            </div>
            <div style="font-size: 11px; color: #64748b; font-weight: 600; margin-top: 4px;">Academic Year: ${new Date().getFullYear() - 1}-${new Date().getFullYear()}</div>
          </div>
          <div style="display: flex; align-items: center; justify-content: flex-end; flex: 0 0 60px;">
            <img src="${studentPhoto}" style="width: 55px; height: 55px; border-radius: 50%; object-fit: cover; border: 2px solid #1e3a8a;" />
          </div>
        </div>

        <!-- Student Details -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; border: 1px solid #e2e8f0; padding: 18px; border-radius: 8px; background-color: #f8fafc; margin-bottom: 25px;">
          <div>
            <div style="margin-bottom: 8px;"><span style="color: #64748b; font-weight: 600; width: 110px; display: inline-block; font-size: 13px;">Student Name:</span> <strong style="color: #0f172a; font-size: 14px;">${studentName}</strong></div>
            <div style="margin-bottom: 8px;"><span style="color: #64748b; font-weight: 600; width: 110px; display: inline-block; font-size: 13px;">Class / Grade:</span> <strong style="color: #0f172a; font-size: 14px;">${classGrade}</strong></div>
            <div><span style="color: #64748b; font-weight: 600; width: 110px; display: inline-block; font-size: 13px;">Roll Number:</span> <strong style="color: #0f172a; font-size: 14px;">${rollNumber}</strong></div>
          </div>
          <div>
            <div style="margin-bottom: 8px;"><span style="color: #64748b; font-weight: 600; width: 110px; display: inline-block; font-size: 13px;">Date of Birth:</span> <strong style="color: #0f172a; font-size: 14px;">${dob}</strong></div>
            <div style="margin-bottom: 8px;"><span style="color: #64748b; font-weight: 600; width: 110px; display: inline-block; font-size: 13px;">Term:</span> <strong style="color: #0f172a; font-size: 14px;">${termName}</strong></div>
            <div><span style="color: #64748b; font-weight: 600; width: 110px; display: inline-block; font-size: 13px;">Section:</span> <strong style="color: #0f172a; font-size: 14px;">${section}</strong></div>
          </div>
        </div>

        <!-- Subject Wise Performance Table -->
        <div style="margin-bottom: 25px;">
          <div style="background-color: #1e3a8a; color: #ffffff; text-align: center; padding: 8px; font-weight: 800; font-size: 13px; border-radius: 6px 6px 0 0; letter-spacing: 0.5px;">SUBJECT-WISE PERFORMANCE</div>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid #e2e8f0; border-top: none;">
            <thead>
              <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                <th style="padding: 10px 12px; text-align: left; color: #475569; font-weight: 700;">SUBJECT</th>
                <th style="padding: 10px 12px; text-align: center; color: #475569; font-weight: 700; width: 100px;">MAX MARKS</th>
                <th style="padding: 10px 12px; text-align: center; color: #475569; font-weight: 700; width: 130px;">OBTAINED MARKS</th>
                <th style="padding: 10px 12px; text-align: center; color: #475569; font-weight: 700; width: 110px;">PERCENTAGE</th>
                <th style="padding: 10px 12px; text-align: center; color: #475569; font-weight: 700; width: 90px;">GRADE</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>

        <!-- Bottom Grid: Remarks & Stats -->
        <div style="display: flex; gap: 20px; align-items: stretch; margin-bottom: 10px;">
          <!-- Remarks Box -->
          <div style="flex: 2; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column;">
            <div style="background-color: #1e3a8a; color: #ffffff; padding: 6px 12px; font-weight: 800; font-size: 12px; letter-spacing: 0.5px;">REMARKS</div>
            <div style="padding: 15px; font-style: italic; font-size: 12.5px; color: #334155; line-height: 1.6; flex: 1; display: flex; align-items: center; background-color: #fafafa;">
              ${remarks}
            </div>
          </div>
          
          <!-- Attendance Box -->
          <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; min-width: 180px; justify-content: center; background-color: #f8fafc; text-align: center; padding: 15px;">
            <div style="font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Attendance Rate</div>
            <div style="font-size: 32px; font-weight: 900; color: #16a34a;">${attendanceVal}%</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 500;">Academic Standings</div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = htmlContent;
    wrapper.appendChild(container);
    document.body.appendChild(wrapper);

    try {
      const html2pdf = await loadHtml2Pdf();
      const opt = {
        margin:       [10, 15, 10, 15],
        filename:     isSpecific 
          ? `${studentName.replace(/\s+/g, '_')}_${termName.replace(/\s+/g, '_')}_Progress_Card.pdf`
          : `${studentName.replace(/\s+/g, '_')}_Cumulative_Progress_Card.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2.5, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(container).save();
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("An error occurred during PDF generation.");
    } finally {
      document.body.removeChild(wrapper);
    }
  };

  const handleDownloadSpecificReportCard = (msgText) => {
    const marks = parseProgressReportText(msgText);
    if (marks.length === 0) {
      alert("No marks found in this progress report message.");
      return;
    }
    handleDownloadReportCard(marks);
  };


  const handleExportProgressCard = () => {
    if (selectedExamFilter === 'All') {
      handleDownloadReportCard(null);
    } else {
      const filtered = reportCard.filter(m => m.examName === selectedExamFilter);
      handleDownloadReportCard(filtered);
    }
  };

  const parentTabs = useMemo(() => [
    { id: 'overview', label: 'Overview', icon: Compass },
    { id: 'diary', label: 'Class Diary', icon: BookOpen },
    { id: 'attendance', label: 'Attendance Tracker', icon: CheckSquare },
    { id: 'calendar', label: 'School Calendar', icon: Calendar },
    { id: 'bus', label: 'Bus Tracker', icon: Bus },
    { id: 'marks', label: 'Marks Report Card', icon: Award },
    { id: 'chat', label: 'Direct Chat', icon: Mail, badge: unreadCount > 0 ? unreadCount : undefined },
    { id: 'clubs', label: 'Activity Clubs', icon: GraduationCap },
    { id: 'fees', label: 'Fee Statements', icon: DollarSign },
    { id: 'profile', label: 'My Profile', icon: User }
  ], [unreadCount]);
  const parentRoleName = schoolDetails 
    ? `Parent (Connect: ${schoolDetails.name})` 
    : 'Parent';

  return (
    <DashboardLayout
      roleName={parentRoleName}
      user={user}
      activeTab={user?.approvalStatus === 'pending' ? 'pending' : user?.approvalStatus === 'rejected' ? 'rejected' : activeTab}
      setActiveTab={user?.approvalStatus === 'pending' || user?.approvalStatus === 'rejected' ? () => {} : setActiveTab}
      tabs={user?.approvalStatus === 'pending' ? [{ id: 'pending', label: 'Awaiting Approval', icon: ShieldAlert }] : user?.approvalStatus === 'rejected' ? [{ id: 'rejected', label: 'Registration Rejected', icon: ShieldAlert }] : parentTabs}
      handleLogout={() => setShowLogoutModal(true)}
    >

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}



      {/* Current Period Timetable Banner */}
      {user?.approvalStatus !== 'pending' && user?.approvalStatus !== 'rejected' && timetableData.length > 0 && (
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
            <Clock size={20} style={{ color: 'var(--accent)' }} />
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

      {user?.approvalStatus === 'rejected' && !isResubmitting ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto', padding: '20px 0' }}>
          {/* Rejection Alert Card */}
          <div className="glass-card" style={{ 
            padding: '30px', 
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ShieldAlert size={30} />
            </div>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'var(--font-title)', marginBottom: '6px', color: '#f87171' }}>
                Registration Request Rejected
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                Your request was not approved by the school administration.
              </p>
            </div>
          </div>

          {/* Rejection Details */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: 'white' }}>Rejection Details</h3>
            
            <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: '#f87171', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Reason for Rejection:</div>
              <div style={{ fontSize: '14px', color: 'white', lineHeight: '1.5' }}>
                {user.rejectionReason || 'No reason specified by administrator.'}
              </div>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
              Please contact the school administration or your child's class teacher if you believe this is a mistake or to clarify registration requirements.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setIsResubmitting(true)}
                style={{
                  background: 'var(--accent)',
                  borderColor: 'var(--accent)',
                  color: 'white',
                  borderRadius: '9999px',
                  padding: '12px 30px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(168, 85, 247, 0.3)'
                }}
              >
                <Edit3 size={16} />
                <span>Submit Again</span>
              </button>
            </div>
          </div>
        </div>
      ) : user?.approvalStatus === 'pending' || isResubmitting ? (
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
                Hello, {user.fullName}
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
                      style={{ margin: 0, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Edit3 size={12} />
                      <span>Edit Child Details</span>
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
                        borderColor: linkMode === 'search' ? 'var(--accent)' : 'var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Search size={14} />
                      <span>Search School Directory</span>
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
                        borderColor: linkMode === 'manual' ? 'var(--accent)' : 'var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <FileEdit size={14} />
                      <span>Enter Details Manually</span>
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
                        style={{ width: '100%', margin: 0, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <Save size={14} />
                        <span>{loading ? 'Saving Details...' : 'Save & Link Child Details'}</span>
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Right: Parent Profile details summary */}
            <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ margin: 0 }}>My Profile Information</h3>

              {profileError && <div className="error-banner" style={{ fontSize: '13px', padding: '8px', margin: 0 }}>{profileError}</div>}
              {profileSuccess && <div className="success-banner" style={{ fontSize: '13px', padding: '8px', margin: 0 }}>{profileSuccess}</div>}

              <form onSubmit={handleSaveParentProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Registered Email:</span>
                  <span style={{ fontWeight: 'bold' }}>{user.email}</span>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Father's Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ padding: '8px', fontSize: '13px' }}
                    value={parentProfileForm.fatherName} 
                    onChange={(e) => setParentProfileForm({ ...parentProfileForm, fatherName: e.target.value })} 
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Father's Phone</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ padding: '8px', fontSize: '13px' }}
                    value={parentProfileForm.fatherPhone} 
                    onChange={(e) => setParentProfileForm({ ...parentProfileForm, fatherPhone: e.target.value })} 
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Mother's Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ padding: '8px', fontSize: '13px' }}
                    value={parentProfileForm.motherName} 
                    onChange={(e) => setParentProfileForm({ ...parentProfileForm, motherName: e.target.value })} 
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Mother's Phone</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ padding: '8px', fontSize: '13px' }}
                    value={parentProfileForm.motherPhone} 
                    onChange={(e) => setParentProfileForm({ ...parentProfileForm, motherPhone: e.target.value })} 
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Emergency Contact Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ padding: '8px', fontSize: '13px' }}
                    value={parentProfileForm.emergencyContact} 
                    onChange={(e) => setParentProfileForm({ ...parentProfileForm, emergencyContact: e.target.value })} 
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                    <label className="form-label" style={{ fontSize: '12px', margin: 0 }}>Home Address</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={handleDashboardDetectLocation}
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
                        onClick={() => setShowParentEditorMapSelector(true)}
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
                    style={{ padding: '8px', fontSize: '13px' }}
                    value={parentProfileForm.homeAddress} 
                    onChange={(e) => setParentProfileForm({ ...parentProfileForm, homeAddress: e.target.value })} 
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={profileLoading}
                  className="dashboard-btn-primary"
                  style={{ 
                    margin: '16px 0 0 0', 
                    padding: '14px', 
                    fontSize: '15px', 
                    fontWeight: 'bold', 
                    width: '100%',
                    background: 'var(--accent)',
                    borderColor: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)'
                  }}
                >
                  {profileLoading ? 'Submitting...' : 'Submit Profile Details'}
                </button>
                {user?.updatedAt && (
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textAlign: 'right', marginTop: '6px' }}>
                    Edited on: {new Date(user.updatedAt).toLocaleString()}
                  </div>
                )}
              </form>

              <div style={{ 
                background: 'rgba(59, 130, 246, 0.05)', 
                border: '1px solid rgba(59, 130, 246, 0.2)', 
                borderRadius: '8px', 
                padding: '14px', 
                fontSize: '13px', 
                color: '#60a5fa', 
                marginTop: '10px' 
              }}>
                Once you select or enter your child's profile, a school administrator or class teacher can view it instantly on their dashboard and approve your access request.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Overview Tab (Mockup UI) */}
          {activeTab === 'overview' && (
            <div className="overview-tab-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Greeting Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img 
                    src={linkedChild?.profilePhoto || user?.profilePhoto || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"} 
                    alt="Student Avatar"
                    style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid rgba(255, 255, 255, 0.2)', objectFit: 'cover', cursor: 'pointer' }}
                    onClick={() => setActiveTab('profile')}
                    title="View Profile Settings"
                  />
                  <div>
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'block' }}>Hello👋</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {linkedChild?.fullName || linkedChild?.name || "Not Assigned"}
                      </span>
                      <button
                        onClick={() => setShowAccountSwitcher(true)}
                        style={{
                          background: 'rgba(168, 85, 247, 0.1)',
                          border: '1px solid rgba(168, 85, 247, 0.3)',
                          borderRadius: '12px',
                          color: '#a855f7',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s',
                          marginTop: '2px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)'}
                      >
                        <RefreshCw size={10} />
                        <span>Switch Account</span>
                      </button>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)', display: 'block', marginTop: '2px' }}>
                      Class {linkedChild?.className || "Not Assigned"} - {linkedChild?.section || "Not Assigned"}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => alert("Notification Center: No new notifications.")}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <Bell size={20} />
                </button>
              </div>

              {/* School Promo Media Player */}
              <div>
                {schoolDetails?.promoType === 'video' && schoolDetails?.promoVideoUrl ? (
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '16px' }}>School Broadcast Video</h3>
                    <div 
                      style={{
                        position: 'relative',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        aspectRatio: '16/9',
                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                      }}
                    >
                      <video 
                        src={schoolDetails.promoVideoUrl}
                        autoPlay
                        muted
                        loop
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  </div>
                ) : schoolDetails?.promoType === 'slideshow' && schoolDetails?.promoImages?.length > 0 ? (
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '16px' }}>School Highlights</h3>
                    <div 
                      style={{
                        position: 'relative',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        aspectRatio: '16/9',
                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        background: '#000'
                      }}
                    >
                      {schoolDetails.promoImages.map((imgUrl, idx) => (
                        <img 
                          key={imgUrl}
                          src={imgUrl}
                          alt={`Slide ${idx + 1}`}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'opacity 0.8s ease-in-out',
                            opacity: idx === promoSlideIndex ? 1 : 0
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>Welcome</h3>
                    <div 
                      style={{
                        position: 'relative',
                        background: 'var(--bg-card)',
                        border: '1.5px solid var(--border)',
                        borderRadius: '30px',
                        padding: '30px 24px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        minHeight: '180px',
                        boxShadow: 'var(--shadow)'
                      }}
                    >
                      <h2 style={{ color: 'var(--text-primary)', fontSize: '24px', fontWeight: '800', margin: '0 0 8px 0' }}>Welcome to {schoolDetails?.name || 'Greenwood High School'}</h2>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0, maxWidth: '80%', lineHeight: '1.5' }}>
                        {schoolDetails?.address || 'We connect parents and school smoothly.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Today's Daily Attendance Status Card */}
              {renderTodayAttendanceStatusCard()}

              {/* Quick Portals Strip */}
              <div className="scrollbar-none" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '4px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                <button onClick={() => setActiveTab('marks')} style={{ flexShrink: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '8px 16px', color: '#2563EB', fontSize: '12.5px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: 'var(--shadow)' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-card)'}>
                  <Award size={14} /> Marks Report
                </button>
                <button onClick={() => setActiveTab('chat')} style={{ flexShrink: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '8px 16px', color: '#DB2777', fontSize: '12.5px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: 'var(--shadow)' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-card)'}>
                  <Mail size={14} /> Direct Chat
                </button>
                <button onClick={() => setActiveTab('clubs')} style={{ flexShrink: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '8px 16px', color: '#059669', fontSize: '12.5px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: 'var(--shadow)' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-card)'}>
                  <GraduationCap size={14} /> Activity Clubs
                </button>
                <button onClick={() => setActiveTab('fees')} style={{ flexShrink: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '8px 16px', color: '#D97706', fontSize: '12.5px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: 'var(--shadow)' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-card)'}>
                  <DollarSign size={14} /> Fee Dues
                </button>
              </div>

              {/* Calendar Strip */}
              <div className="calendar-strip-container" style={{ marginTop: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '2px' }}>Selected Date</span>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
                      {selectedOverviewDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  
                  {/* Small popup calendar trigger icon */}
                  <div>
                    <input 
                      type="date" 
                      ref={dateInputRef} 
                      value={selectedOverviewDate.toISOString().split('T')[0]} 
                      onChange={(e) => {
                        if (e.target.value) {
                          setSelectedOverviewDate(new Date(e.target.value));
                        }
                      }} 
                      style={{ 
                        position: 'absolute',
                        opacity: 0,
                        width: 0,
                        height: 0,
                        pointerEvents: 'none'
                      }} 
                    />
                    <button 
                      onClick={() => {
                        if (dateInputRef.current) {
                          try {
                            dateInputRef.current.showPicker();
                          } catch (err) {
                            dateInputRef.current.click();
                          }
                        }
                      }}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
                      title="Select date"
                    >
                      <Calendar size={16} />
                    </button>
                  </div>
                </div>

                <div className="calendar-strip">
                  {weekDays.map((date, idx) => {
                    const isSelected = selectedOverviewDate.toDateString() === date.toDateString();
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'narrow' });
                    const dateNum = date.getDate();
                    
                    const dayRecords = attendanceRecords.filter(r => {
                      const d = new Date(r.date);
                      return d.getFullYear() === date.getFullYear() &&
                             d.getMonth() === date.getMonth() &&
                             d.getDate() === date.getDate();
                    });

                    let attBadge = null;
                    if (dayRecords.length > 0) {
                      const presentCount = dayRecords.filter(r => r.status === 'Present' || r.status === 'Late').length;
                      if (dayRecords.length === 2) {
                        if (presentCount === 2) {
                          attBadge = { text: 'P', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
                        } else if (presentCount === 0) {
                          attBadge = { text: 'A', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
                        } else {
                          attBadge = { text: '1/2', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)' };
                        }
                      } else {
                        // Only 1 shift taken
                        if (presentCount === 1) {
                          attBadge = { text: '1/2', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)' };
                        } else {
                          attBadge = { text: 'A', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
                        }
                      }
                    }
                    
                    return (
                      <div 
                        key={idx}
                        className={`calendar-strip-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedOverviewDate(date)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          padding: '8px 4px',
                          position: 'relative',
                          minWidth: '45px',
                          cursor: 'pointer'
                        }}
                      >
                        <span className="calendar-strip-day">{dayName}</span>
                        <span className="calendar-strip-date" style={{ fontWeight: 'bold' }}>{dateNum}</span>
                        {attBadge && (
                          <span style={{ 
                            fontSize: '9px', 
                            fontWeight: 'bold', 
                            color: attBadge.color,
                            background: attBadge.bg,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            marginTop: '4px',
                            lineHeight: '1',
                            display: 'inline-block'
                          }}>
                            {attBadge.text}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Schedule Period list */}
              <div>
                <div className="mockup-schedule-container">
                  {overviewPeriods.map((period, idx) => (
                    <div key={idx} className="mockup-schedule-item">
                      <div className="schedule-item-left">
                        <div className="schedule-icon-container">
                          <Clock size={18} />
                        </div>
                        <div className="schedule-item-info">
                          <h4 className="schedule-item-time">{period.time}</h4>
                          <p className="schedule-item-detail">{period.subject} • {period.code}</p>
                        </div>
                      </div>
                      <button 
                        className="schedule-item-more"
                        onClick={() => alert(`Details for: ${period.subject}`)}
                      >
                        <MoreHorizontal size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

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
                        <strong>Posted:</strong> {new Date(todayDiary.postedAt || todayDiary.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {todayDiary.lastEditedAt && (
                        <div>
                          <strong>Edited:</strong> {new Date(todayDiary.lastEditedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                            const isDone = hw.completedByParents.includes(user.id || user._id);
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
                                  {isDone && (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
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
                          Success!
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
                            Read at {new Date(readTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                            Mark as Read
                          </button>
                        );
                      })()}
                    </div>

                    {/* Virtual Signature Panel */}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>DIARY ACKNOWLEDGMENT SIGNATURE</span>
                      {signedDiaries[todayDiary._id] ? (
                        <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontSize: '13px' }}>
                          <CheckCircle size={16} />
                          <div>
                            <strong>Signed Acknowledgment</strong>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Date: {new Date(signedDiaries[todayDiary._id].timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSignDiary(todayDiary._id)}
                          style={{
                            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                            border: 'none',
                            color: 'white',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            width: '100%',
                            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
                          }}
                        >
                          <Edit3 size={16} /> Sign Acknowledgment
                        </button>
                      )}
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
                {renderTodayAttendanceStatusCard()}
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
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginTop: '2px' }}>{formatDays(attendanceStats.present)}</div>
                        </div>
                        <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                          <span style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 'bold' }}>LATE</span>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginTop: '2px' }}>{formatDays(attendanceStats.late)}</div>
                        </div>
                        <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                          <span style={{ fontSize: '10px', color: '#f87171', fontWeight: 'bold' }}>ABSENT</span>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginTop: '2px' }}>{formatDays(attendanceStats.absent)}</div>
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
                    <div style={{ display: 'flex', justifyBlock: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>Student Name:</span>
                      <strong style={{ color: 'white', marginLeft: 'auto' }}>{linkedChild?.fullName || linkedChild?.name || "Not Assigned"}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyBlock: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>Assigned Class:</span>
                      <strong style={{ color: 'white', marginLeft: 'auto' }}>{linkedChild ? `Class ${linkedChild.className || "Not Assigned"} - ${linkedChild.section || "Not Assigned"}` : "Not Assigned"}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyBlock: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>Admission Number:</span>
                      <span style={{ color: 'var(--accent)', fontWeight: 'bold', marginLeft: 'auto' }}>{linkedChild?.admissionNumber || "Not Assigned"}</span>
                    </div>
                    {schoolDetails && (
                      <>
                        <div style={{ display: 'flex', justifyBlock: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>School Name:</span>
                          <span style={{ marginLeft: 'auto' }}>{schoolDetails.name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyBlock: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>School Phone:</span>
                          <span style={{ marginLeft: 'auto' }}>{schoolDetails.phone}</span>
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
                Enter your child's assigned Bus Number to see its live route status and current GPS location.
              </p>
              <form onSubmit={handleTrackBus} style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', width: '100%' }}>
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
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <input 
                    type="checkbox" 
                    id="dailyBusCheckbox" 
                    checked={isDailyPreferred}
                    onChange={(e) => setIsDailyPreferred(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="dailyBusCheckbox" style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    Is this your daily bus?
                  </label>
                </div>
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
                              localStorage.setItem(`parent_tracked_buses_${user?.id || user?._id}`, JSON.stringify(updated));
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
                          ? 'Broadcasting live location' 
                          : tripData?.isPlaceholder 
                            ? 'The driver has not started this bus trip yet. Showing default coordinates.'
                            : tripData?.isHistoryFallback
                              ? 'Trip completed. Showing last completed trip location.'
                              : 'No active shift broadcast. Connection lost.'}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {dailyBus === busNumber ? (
                      <button 
                        onClick={() => {
                          localStorage.removeItem(`parent_daily_bus_${user?.id || user?._id}`);
                          setDailyBus('');
                        }}
                        className="code-action-btn"
                        style={{ margin: 0, padding: '8px 16px', background: 'rgba(245, 158, 11, 0.1)', borderColor: '#fbbf24', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        ★ Daily Bus
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          localStorage.setItem(`parent_daily_bus_${user?.id || user?._id}`, busNumber);
                          setDailyBus(busNumber);
                          const updated = [busNumber];
                          setTrackedBuses(updated);
                          localStorage.setItem(`parent_tracked_buses_${user?.id || user?._id}`, JSON.stringify(updated));
                        }}
                        className="code-action-btn"
                        style={{ margin: 0, padding: '8px 16px', background: 'transparent', borderColor: 'var(--border)', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        ☆ Set as Daily
                      </button>
                    )}
                    <button 
                      onClick={handleTrackAnother} 
                      className="code-action-btn track-another-btn"
                      style={{ margin: 0, padding: '8px 16px', background: 'transparent', borderColor: 'var(--border)' }}
                    >
                      Track Another
                    </button>
                  </div>
                </div>

                {/* Traffic & ETA Alert Panel */}
                {tripData?.active && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                      <span style={{ fontSize: '11px', color: '#60a5fa', fontWeight: 'bold' }}>TRAFFIC CONDITION</span>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>Moderate Traffic</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Typical road flow today</span>
                    </div>
                    <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                      <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 'bold' }}>TRAFFIC DELAY</span>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#fbbf24' }}>+5 mins delay</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Due to moderate peak flow</span>
                    </div>
                    <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                      <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 'bold' }}>ESTIMATED ARRIVAL</span>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#34d399' }}>
                        {etaMinutes !== null ? `${etaMinutes} minutes` : '15 mins'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Live GPS calculation</span>
                    </div>
                  </div>
                )}

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
                              <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    Notify before 3km Radius
                                  </label>
                                  <input 
                                    type="checkbox" 
                                    checked={notify3km} 
                                    onChange={(e) => {
                                      setNotify3km(e.target.checked);
                                      localStorage.setItem(`parent_notify_3km_${user?.id || user?._id}`, e.target.checked.toString());
                                    }} 
                                    style={{ width: '16px', height: '16px', cursor: 'pointer', margin: 0 }}
                                  />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
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
                                      localStorage.setItem(`parent_geofence_radius_${user?.id || user?._id}`, val.toString());
                                    }} 
                                    style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
                                  />
                                </div>
                              </>
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
                          {isSelectingOnMap && (
                            <div style={{
                              position: 'absolute',
                              top: '20px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              zIndex: 1000,
                              background: 'rgba(20, 20, 37, 0.95)',
                              backdropFilter: 'blur(12px)',
                              border: '1.5px solid var(--accent)',
                              borderRadius: '12px',
                              padding: '12px 20px',
                              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '15px'
                            }}>
                              <span style={{ fontSize: '13px', color: 'white', fontWeight: '600', whiteSpace: 'nowrap' }}>
                                Click anywhere on the map to set your Home location.
                              </span>
                              <button 
                                type="button"
                                onClick={handleCancelSelect}
                                className="code-action-btn"
                                style={{ margin: 0, padding: '6px 12px', fontSize: '12px' }}
                              >
                                Cancel
                              </button>
                            </div>
                          )}
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
                            Set Home Point
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          {renderTodayAttendanceStatusCard()}
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
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginTop: '4px' }}>{formatDays(attendanceStats.present)}</div>
                  </div>
                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#fbbf24' }}>LATE</span>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginTop: '4px' }}>{formatDays(attendanceStats.late)}</div>
                  </div>
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#f87171' }}>ABSENT</span>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginTop: '4px' }}>{formatDays(attendanceStats.absent)}</div>
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
              <table className="dashboard-table table-expandable">
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
                        <td data-label="Date logged"><strong>{new Date(r.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></td>
                        <td data-label="Classroom">{r.class?.name || (r.class && typeof r.class === 'object' ? r.class.name : '') || (linkedChild ? 'Class ' + linkedChild.className : 'Class ID ' + (r.class?._id || r.class))}</td>
                        <td data-label="Section">{r.section}</td>
                        <td data-label="Status">
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

          {/* Month-wise Attendance Report Card */}
          <div className="glass-card" style={{ padding: '24px', gridColumn: 'span 2' }}>
            <h3>Month-wise Attendance Report</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Track attendance counts calculated month-by-month.
            </p>
            <div className="dashboard-table-container" style={{ margin: 0 }}>
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Total Days</th>
                    <th>Days Present</th>
                    <th>Days Absent</th>
                    <th>Attendance Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {!attendanceStats?.monthly || attendanceStats.monthly.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No monthly records found.</td>
                    </tr>
                  ) : (
                    attendanceStats.monthly.map((m, idx) => (
                      <tr key={idx}>
                        <td data-label="Month"><strong>{m.month}</strong></td>
                        <td data-label="Total Days">{formatDays(m.totalDays)} days</td>
                        <td data-label="Days Present" style={{ color: '#34d399', fontWeight: '600' }}>{formatDays(m.presentDays)} days</td>
                        <td data-label="Days Absent" style={{ color: '#f87171', fontWeight: '600' }}>{formatDays(m.absentDays)} days</td>
                        <td data-label="Attendance Rate">
                          <span className={`badge ${m.presentRate >= 85 ? 'badge-active' : 'badge-inactive'}`} style={{ fontWeight: 'bold' }}>
                            {m.presentRate}%
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

          {/* Leave Request Panel */}
          <div className="responsive-grid-1-1" style={{ marginTop: '24px' }}>
            {/* Form */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3>Apply for Student Leave</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Submit a digital leave application for your child. Class teachers will receive a notification instantly.
              </p>
              <form onSubmit={handleApplyLeave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>Start Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={leaveForm.startDate} 
                      onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>End Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={leaveForm.endDate} 
                      onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} 
                      required 
                    />
                  </div>
                </div>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Leave Type</label>
                  <select 
                    className="form-input" 
                    value={leaveForm.leaveType} 
                    onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                    style={{ background: 'var(--bg-primary)', color: 'white' }}
                  >
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Personal Leave">Personal Leave</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Reason for Absence</label>
                  <textarea 
                    className="form-input" 
                    rows="3" 
                    placeholder="Provide a detailed reason..." 
                    value={leaveForm.reason} 
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} 
                    required 
                    style={{ resize: 'none' }}
                  />
                </div>

                <button type="submit" className="dashboard-btn-primary" style={{ margin: 0, padding: '12px' }}>
                  Submit Leave Request
                </button>
              </form>
            </div>

            {/* History */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3>Leave Application History</h3>
              <div className="dashboard-table-container" style={{ marginTop: '16px', marginBottom: 0 }}>
                <table className="dashboard-table table-expandable">
                  <thead>
                    <tr>
                      <th>Dates</th>
                      <th>Type</th>
                      <th>Reason</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveRequests.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No leave history recorded.</td>
                      </tr>
                    ) : (
                      leaveRequests.map(req => (
                        <tr key={req._id || req.id}>
                          <td><strong>{req.startDate} to {req.endDate}</strong></td>
                          <td>{req.leaveType}</td>
                          <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={req.reason}>
                            {req.reason}
                          </td>
                          <td>
                            <span className={`badge ${req.status === 'Approved' ? 'badge-active' : 'badge-role teacher'}`} style={{ fontWeight: 'bold' }}>
                              {req.status}
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
        </div>
      )}

      {/* Marks Report Card Tab */}
      {activeTab === 'marks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Action Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ margin: 0 }}>Academic Marks Report</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Track exam records and progress charts.
              </p>
            </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {uniqueExamNames.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: '600' }}>Select Exam:</span>
                    <select
                      className="form-select"
                      value={selectedExamFilter}
                      onChange={(e) => setSelectedExamFilter(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '12.5px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)', cursor: 'pointer' }}
                    >
                      <option value="All">All Assessments (Cumulative)</option>
                      {uniqueExamNames.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleExportProgressCard}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)'
                  }}
                >
                  <Download size={16} /> Export Progress Card (PDF)
                </button>
              </div>
          </div>
          {examSummary && (
            <div className="glass-card" style={{ 
              padding: '16px 20px', 
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)',
              borderColor: 'var(--border)', 
              borderRadius: '12px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                  Cumulative Exam Result
                </span>
                <h4 style={{ margin: '4px 0 0 0', fontSize: '18px', color: '#1e3a8a', fontWeight: 'bold' }}>
                  {selectedExamFilter} Overview
                </h4>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: '#475569', display: 'block' }}>AGGREGATE SCORE</span>
                  <strong style={{ fontSize: '20px', color: '#0f172a' }}>
                    {examSummary.totalObtained} <span style={{ fontSize: '14px', color: '#475569' }}>/ {examSummary.totalMax}</span>
                  </strong>
                </div>
                <div style={{ height: '30px', width: '1px', background: 'var(--border)' }}></div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: '#475569', display: 'block' }}>PERCENTAGE & GRADE</span>
                  <strong style={{ fontSize: '20px', color: examSummary.percentage >= 50 ? '#10b981' : '#ef4444' }}>
                    {examSummary.percentage}% ({examSummary.grade})
                  </strong>
                </div>
              </div>
            </div>
          )}

          <div className="responsive-grid-1-1">
            {/* Grouped Student Performance Report Card */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3>Student Performance Report Card</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Expand each exam card to see subject-wise marks details.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                {groupedReportCard.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No exam marks recorded yet.</div>
                ) : (
                  groupedReportCard.map((group, idx) => {
                    const isExpanded = !!expandedExams[group.examName];
                    const pct = group.totalMax > 0 ? Math.round((group.totalObtained / group.totalMax) * 100) : 0;
                    const overallGrade = calculateGrade(pct);
                    return (
                      <div 
                        key={idx} 
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.02)', 
                          border: '1px solid var(--border)', 
                          borderRadius: '12px',
                          overflow: 'hidden',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {/* Summary Header */}
                        <div 
                          style={{ 
                            padding: '16px 20px', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            flexWrap: 'wrap', 
                            gap: '12px',
                            cursor: 'pointer',
                            background: isExpanded ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                            borderBottom: isExpanded ? '1px solid var(--border)' : 'none'
                          }}
                          onClick={() => toggleExamExpanded(group.examName)}
                        >
                          <div>
                            <h4 style={{ margin: 0, fontSize: '16px', color: '#1e3a8a', fontWeight: 'bold' }}>{group.examName}</h4>
                            <span style={{ fontSize: '12px', color: '#475569' }}>
                              {group.subjects.length} {group.subjects.length === 1 ? 'Subject' : 'Subjects'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>TOTAL SCORE</span>
                              <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                                {group.totalObtained} / {group.totalMax}
                              </strong>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>GRADE</span>
                              <strong style={{ fontSize: '14px', color: pct >= 50 ? '#10b981' : '#ef4444' }}>
                                {pct}% ({overallGrade})
                              </strong>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleDownloadReportCard(group.subjects)}
                                style={{
                                  background: 'rgba(59, 130, 246, 0.15)',
                                  color: '#1d4ed8',
                                  border: '1px solid rgba(29, 78, 216, 0.35)',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  margin: 0
                                }}
                              >
                                <Download size={13} /> PDF
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleExamExpanded(group.examName)}
                                style={{
                                  background: '#f1f5f9',
                                  color: '#1e293b',
                                  border: '1px solid #cbd5e1',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  margin: 0
                                }}
                              >
                                {isExpanded ? 'Hide Details' : 'Show Details'}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Subject Details Table */}
                        {isExpanded && (
                          <div style={{ padding: '16px 20px', overflowX: 'auto' }}>
                            <table className="dashboard-table" style={{ background: 'transparent', margin: 0, width: '100%' }}>
                              <thead>
                                <tr>
                                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>Subject</th>
                                  <th style={{ textAlign: 'center', padding: '10px 12px' }}>Max Marks</th>
                                  <th style={{ textAlign: 'center', padding: '10px 12px' }}>Marks Scored</th>
                                  <th style={{ textAlign: 'center', padding: '10px 12px' }}>Percentage</th>
                                  <th style={{ textAlign: 'center', padding: '10px 12px' }}>Grade</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.subjects.map(sub => {
                                  const subGrade = sub.grade || calculateGrade(sub.myPercentage);
                                  return (
                                    <tr key={sub._id}>
                                      <td style={{ textAlign: 'left', padding: '10px 12px' }}><strong>{sub.subject}</strong></td>
                                      <td style={{ textAlign: 'center', padding: '10px 12px' }}>{sub.totalMarks || 100}</td>
                                      <td style={{ textAlign: 'center', padding: '10px 12px' }}>{sub.marksObtained}</td>
                                      <td style={{ textAlign: 'center', padding: '10px 12px' }}>{sub.myPercentage}%</td>
                                      <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                                        <span className={`badge ${subGrade === 'F' ? 'badge-inactive' : 'badge-active'}`} style={{ fontWeight: 'bold' }}>
                                          {subGrade}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Side-by-Side Comparison Chart */}
            <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <h3>Grades Analytics vs Class Average</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '8px 0 20px 0' }}>
                Compares child's score (Blue) against class average (Green) side-by-side.
              </p>
              {displayedReportCard.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
                  No performance data available to map.
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center' }}>
                  {displayedReportCard.map(m => (
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

          {/* ChartJS Academic Progress Graph */}
          {marksChartData && (
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3>Academic Performance Trend</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Performance comparison across all logged assessments.
              </p>
              <div style={{ height: '300px', position: 'relative' }}>
                <Line 
                  data={marksChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        min: 0,
                        max: 100,
                        ticks: { color: '#6B7280' },
                        grid: { color: 'rgba(31, 41, 55, 0.08)' }
                      },
                      x: {
                        ticks: { color: '#6B7280' },
                        grid: { color: 'transparent' }
                      }
                    },
                    plugins: {
                      legend: {
                        labels: { color: '#1F2937' }
                      }
                    }
                  }} 
                />
              </div>
            </div>
          )}
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
                  
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>
                    Your fee details are not uploaded yet. Once uploaded, we will notify you.
                  </p>
                </div>
              )}
            </div>

            {feeLoaded && feeDetails && (
              feeDetails.pendingAmount > 0 ? (
                <div style={{ 
                  background: 'rgba(245, 158, 11, 0.08)', 
                  border: '1px solid rgba(245, 158, 11, 0.2)', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  color: '#fbbf24', 
                  textAlign: 'center', 
                  fontWeight: '600', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px',
                  width: '100%',
                  margin: 0
                }}>
                  <Building size={16} />
                  <span>Visit and pay at the school office.</span>
                </div>
              ) : (
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '14px', borderRadius: '8px', color: '#34d399', textAlign: 'center', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  <span>Account fully cleared. No outstanding pending fee dues.</span>
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
                  Phone: {feeDetails?.officePhone || '+91 80 2345 6789'}
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
      </>
      )}
      <LogoutConfirmationModal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
        onConfirm={confirmLogout} 
      />

      {/* MOBILE PERMISSION EXPLANATION MODAL */}
      {showPermissionExplanation && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 15, 26, 0.9)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 10003,
          animation: 'fadeIn 0.2s ease'
        }}>
          <div className="glass-card" style={{
            width: '90%',
            maxWidth: '500px',
            padding: '30px',
            border: '1.5px solid rgba(245, 158, 11, 0.3)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fbbf24' }}>
              <ShieldAlert size={28} />
              <h3 style={{ fontSize: '20px', fontFamily: 'var(--font-title)', margin: 0 }}>
                Permissions Required
              </h3>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
              To provide a seamless experience, School Connect needs additional permissions. Some features are currently disabled because:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(permissionErrorType === 'location' || permissionErrorType === 'both') && (
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '16px', borderRadius: '12px', display: 'flex', gap: '12px' }}>
                  <MapPin size={20} style={{ color: '#f87171', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: '#f87171', display: 'block', fontSize: '14px', marginBottom: '4px' }}>Location Permission Blocked</strong>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      We use your location to show your house on the live map relative to the school bus and calculate accurate arrival ETAs.
                    </span>
                  </div>
                </div>
              )}

              {(permissionErrorType === 'notifications' || permissionErrorType === 'both') && (
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '16px', borderRadius: '12px', display: 'flex', gap: '12px' }}>
                  <Bell size={20} style={{ color: '#f87171', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: '#f87171', display: 'block', fontSize: '14px', marginBottom: '4px' }}>Notification Permission Blocked</strong>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      We need notifications to alert you when the school bus is within a 3km radius of your stop.
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)', padding: '14px', borderRadius: '8px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
              <strong>How to resolve:</strong> Click the lock/settings icon next to the URL in your browser's address bar and set Location and Notifications to "Allow".
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button 
                type="button" 
                onClick={() => setShowPermissionExplanation(false)} 
                className="dashboard-btn-primary"
                style={{ margin: 0, padding: '10px 24px', background: 'var(--accent)', borderColor: 'var(--accent)', fontWeight: 'bold' }}
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PARENT MULTI-ACCOUNT SWITCHER MODAL */}
      {showAccountSwitcher && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 15, 26, 0.9)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
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
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '20px', fontFamily: 'var(--font-title)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users style={{ color: 'var(--accent)' }} size={22} />
                <span>Switch Parent Account</span>
              </h3>
              <button 
                onClick={() => {
                  setShowAccountSwitcher(false);
                  setSwitchError('');
                }} 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Saved Profiles
              </span>
              
              {parentAccounts.map((acc) => {
                const isActive = acc.email === user?.email;
                return (
                  <div 
                    key={acc.email}
                    onClick={() => !isActive && handleSwitchAccount(acc)}
                    style={{
                      background: isActive ? 'var(--accent-glow)' : 'rgba(255,255,255,0.02)',
                      border: isActive ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: isActive ? 'default' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: isActive ? 1 : 0.85
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                        e.currentTarget.style.borderColor = 'var(--border)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '50%', 
                        background: 'rgba(168, 85, 247, 0.1)', 
                        color: 'var(--accent)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '13px'
                      }}>
                        {acc.user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'P'}
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: 'white', display: 'block' }}>
                          {acc.user?.fullName}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {acc.email}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isActive ? (
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: 'bold', 
                          color: 'var(--accent)', 
                          background: 'rgba(168, 85, 247, 0.15)',
                          padding: '2px 8px',
                          borderRadius: '8px'
                        }}>
                          Active
                        </span>
                      ) : (
                        <button
                          onClick={(e) => handleRemoveAccount(acc.email, e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            opacity: 0.8
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = 0.8}
                          title="Remove Profile"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleAddAndSwitchAccount} style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Add Another Parent Profile
              </span>

              {switchError && <div className="error-banner" style={{ margin: 0 }}>{switchError}</div>}

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '11px' }}>Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={newAccountEmail} 
                  onChange={(e) => setNewAccountEmail(e.target.value)} 
                  placeholder="parent2@school.com"
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '11px' }}>Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={newAccountPassword} 
                  onChange={(e) => setNewAccountPassword(e.target.value)} 
                  placeholder="••••••••"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={switchLoading}
                className="dashboard-btn-primary"
                style={{ 
                  margin: 0, 
                  padding: '12px', 
                  background: 'var(--accent)', 
                  borderColor: 'var(--accent)', 
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {switchLoading ? 'Verifying & Switching...' : 'Verify & Switch Profile'}
              </button>
            </form>
          </div>
        </div>
      )}

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
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '40px 10px',
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
            gap: '20px',
            margin: '0 auto 40px auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '20px', fontFamily: 'var(--font-title)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                Set Home Location
              </h3>
              <button 
                onClick={() => {
                  setShowHomePromptModal(false);
                  localStorage.setItem(`parent_home_prompt_shown_${user?.id || user?._id}`, 'true');
                  handleCancelSelect();
                  setShowHomePromptModal(false);
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
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={fetchCurrentLocationForPrompt}
                  disabled={promptLoading}
                  className="dashboard-btn-primary"
                  style={{ 
                    flex: 1,
                    margin: 0, 
                    padding: '12px 8px', 
                    background: 'rgba(168, 85, 247, 0.15)', 
                    borderColor: 'var(--accent)', 
                    color: 'white', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                  title="Detect coordinates using device GPS"
                >
                  <MapPin size={14} /> Detect My Location
                </button>

                <button
                  type="button"
                  onClick={handleSelectOnMapClick}
                  disabled={promptLoading}
                  className="dashboard-btn-primary"
                  style={{ 
                    flex: 1,
                    margin: 0, 
                    padding: '12px 8px', 
                    background: 'rgba(59, 130, 246, 0.15)', 
                    borderColor: '#3b82f6', 
                    color: 'white', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                  title="Click anywhere on the map to set your home marker"
                >
                  Select on Map
                </button>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '15px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Or enter coordinates manually:
                </span>
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
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                onClick={() => {
                  setShowHomePromptModal(false);
                  localStorage.setItem(`parent_home_prompt_shown_${user?.id || user?._id}`, 'true');
                  handleCancelSelect();
                }} 
                className="code-action-btn"
                style={{ margin: 0, padding: '10px 20px' }}
              >
                Skip
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setShowHomePromptModal(false);
                  localStorage.setItem(`parent_home_prompt_shown_${user?.id || user?._id}`, 'true');
                  handleCancelSelect();
                  setActiveTab('profile');
                }} 
                className="code-action-btn"
                style={{ 
                  margin: 0, 
                  padding: '10px 20px',
                  background: 'rgba(168, 85, 247, 0.1)',
                  borderColor: 'rgba(168, 85, 247, 0.3)',
                  color: '#a855f7',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <User size={14} />
                <span>Go to Profile</span>
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
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '40px 10px',
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
            textAlign: 'center',
            margin: '0 auto 40px auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '20px', fontFamily: 'var(--font-title)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                Location Options
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
                Use Saved Home Location
              </button>
              
              <button 
                type="button" 
                onClick={updateLocationAsHomeLocation}
                disabled={promptLoading}
                className="code-action-btn"
                style={{ margin: 0, padding: '12px', color: 'white', borderColor: 'var(--border)' }}
              >
                {promptLoading ? 'Fetching...' : 'Update My Location as Home Location'}
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
        <SchoolCalendarModule user={user} canEdit={false} attendanceRecords={attendanceRecords} />
      )}
      {/* Direct Chat Tab */}
      {activeTab === 'chat' && (
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '550px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 'bold' }}>
              {classTeacher?.fullName ? classTeacher.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'CT'}
            </div>
            <div>
              <h4 style={{ margin: 0 }}>{classTeacher?.fullName || 'Class Teacher'}</h4>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {classTeacher?.email ? `Class Teacher (${classTeacher.email})` : 'Class Teacher'}
              </span>
            </div>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '6px', marginBottom: '16px' }}>
            {chatMessages.map(msg => (
              <div 
                key={msg.id}
                className={msg.sender === 'parent' ? 'chat-bubble-parent' : 'chat-bubble-teacher'}
                style={{ 
                  alignSelf: msg.sender === 'parent' ? 'flex-end' : 'flex-start',
                  background: msg.sender === 'parent' ? 'var(--accent)' : 'color-mix(in srgb, var(--accent) 8%, var(--bg-card))',
                  color: msg.sender === 'parent' ? 'white' : 'var(--text-primary)',
                  padding: '12px 16px',
                  borderRadius: msg.sender === 'parent' ? '18px 18px 0 18px' : '18px 18px 18px 0',
                  maxWidth: '75%',
                  border: msg.sender === 'parent' ? 'none' : '1px solid var(--border)',
                  boxShadow: 'var(--shadow)'
                }}
              >
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4', whiteSpace: 'pre-line' }}>{msg.text}</p>
                {msg.linkToTab === 'marks' && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setActiveTab('marks')}
                      style={{
                        background: 'var(--accent)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      View Detailed Marks
                    </button>
                    <button
                      onClick={() => handleDownloadSpecificReportCard(msg.text)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                    >
                      📥 Download PDF
                    </button>
                  </div>
                )}
                <span style={{ fontSize: '10px', color: msg.sender === 'parent' ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', display: 'block', marginTop: '4px', textAlign: 'right' }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {isTeacherTyping && (
              <div style={{ alignSelf: 'flex-start', background: 'color-mix(in srgb, var(--accent) 8%, var(--bg-card))', padding: '12px 16px', borderRadius: '18px 18px 18px 0', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: 'var(--shadow)' }}>
                <style>{`
                  @keyframes bounce-typing {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-4px); }
                  }
                `}</style>
                <span style={{ width: '6px', height: '6px', background: 'var(--text-primary)', borderRadius: '50%', animation: 'bounce-typing 0.6s infinite alternate' }}></span>
                <span style={{ width: '6px', height: '6px', background: 'var(--text-primary)', borderRadius: '50%', animation: 'bounce-typing 0.6s infinite alternate 0.2s' }}></span>
                <span style={{ width: '6px', height: '6px', background: 'var(--text-primary)', borderRadius: '50%', animation: 'bounce-typing 0.6s infinite alternate 0.4s' }}></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          {/* Quick Actions / Request Actions */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleSendQuickAction("Request Callback", "I would like to request a callback from the teacher.")}
              className="code-action-btn"
              style={{
                fontSize: '12.5px',
                padding: '8px 14px',
                borderRadius: '12px',
                margin: 0,
                cursor: 'pointer',
                background: 'var(--accent-glow)',
                border: '1.5px solid var(--accent)',
                color: 'var(--accent)',
                fontWeight: '600',
                transition: 'all 0.25s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--accent-glow)';
                e.currentTarget.style.color = 'var(--accent)';
              }}
            >
              📞 Request Callback
            </button>
            <button
              type="button"
              onClick={() => handleSendQuickAction("Inquire Child Progress", "I would like to inquire about my child's progress.")}
              className="code-action-btn"
              style={{
                fontSize: '12.5px',
                padding: '8px 14px',
                borderRadius: '12px',
                margin: 0,
                cursor: 'pointer',
                background: 'var(--accent-glow)',
                border: '1.5px solid var(--accent)',
                color: 'var(--accent)',
                fontWeight: '600',
                transition: 'all 0.25s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--accent-glow)';
                e.currentTarget.style.color = 'var(--accent)';
              }}
            >
              📊 Inquire Child Progress
            </button>
            <button
              type="button"
              onClick={() => handleSendQuickAction("Homework Query", "I have a question about the recent homework assignments.")}
              className="code-action-btn"
              style={{
                fontSize: '12.5px',
                padding: '8px 14px',
                borderRadius: '12px',
                margin: 0,
                cursor: 'pointer',
                background: 'var(--accent-glow)',
                border: '1.5px solid var(--accent)',
                color: 'var(--accent)',
                fontWeight: '600',
                transition: 'all 0.25s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--accent-glow)';
                e.currentTarget.style.color = 'var(--accent)';
              }}
            >
              📝 Homework Query
            </button>
          </div>

          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <input 
              type="text" 
              value={chatInput} 
              onChange={(e) => setChatInput(e.target.value)} 
              placeholder="Type a message to the teacher..." 
              className="form-input" 
              style={{ flex: 1, margin: 0 }}
            />
            <button type="submit" className="dashboard-btn-primary" style={{ margin: 0 }}>Send</button>
          </form>
        </div>
      )}

      {/* Activity Clubs Tab */}
      {activeTab === 'clubs' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3>Extracurricular School Clubs</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Register your child for school activity clubs. Club coordinators review registrations weekly.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {clubsList.map(club => {
              const isJoined = clubRegistrations[club.id];
              return (
                <div key={club.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px', background: 'rgba(0,0,0,0.15)', borderColor: 'var(--border)' }}>
                  <div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '16px' }}>{club.name}</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>{club.desc}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span><strong>Schedule:</strong> {club.schedule}</span>
                      <span><strong>Instructor:</strong> {club.teacher}</span>
                    </div>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={() => handleToggleClub(club.id)}
                    className="btn w-full"
                    style={{ 
                      background: isJoined ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid',
                      borderColor: isJoined ? '#f87171' : '#34d399',
                      color: isJoined ? '#f87171' : '#34d399',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {isJoined ? 'Leave Club' : 'Request to Join'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* My Profile Tab */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <ProfileSettingsTab />
          {/* Student Health Log & Allergy Card */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <GraduationCap style={{ color: 'var(--accent)' }} /> Student Health & Medical Profile
            </h3>
            
            {isEditingHealth ? (
              <form onSubmit={handleSaveHealthProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>BLOOD GROUP</label>
                    <input
                      type="text"
                      className="form-input"
                      value={tempHealth.bloodGroup}
                      onChange={(e) => setTempHealth({ ...tempHealth, bloodGroup: e.target.value })}
                      placeholder="e.g. O+, A-, B+"
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>KNOWN ALLERGIES</label>
                    <input
                      type="text"
                      className="form-input"
                      value={tempHealth.allergies}
                      onChange={(e) => setTempHealth({ ...tempHealth, allergies: e.target.value })}
                      placeholder="e.g. Peanuts, Penicillin"
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>MEDICAL DISABILITY</label>
                    <input
                      type="text"
                      className="form-input"
                      value={tempHealth.disability}
                      onChange={(e) => setTempHealth({ ...tempHealth, disability: e.target.value })}
                      placeholder="e.g. None, Asthma"
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="dashboard-btn-primary" style={{ margin: 0, padding: '8px 16px', fontSize: '13px' }}>Save Health Details</button>
                  <button type="button" className="logout-btn" onClick={() => setIsEditingHealth(false)} style={{ margin: 0, padding: '8px 16px', fontSize: '13px' }}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <div className="responsive-grid-1-1-1" style={{ gap: '16px', marginBottom: '20px' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', padding: '16px', borderRadius: '12px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>BLOOD GROUP</span>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>{healthProfile.bloodGroup || 'Not Specified'}</span>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', padding: '16px', borderRadius: '12px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>KNOWN ALLERGIES</span>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#fbbf24' }}>{healthProfile.allergies || 'None'}</span>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', padding: '16px', borderRadius: '12px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>MEDICAL DISABILITY</span>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#34d399' }}>{healthProfile.disability || 'None Reported'}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTempHealth({ ...healthProfile });
                    setIsEditingHealth(true);
                  }}
                  className="code-action-btn"
                  style={{
                    fontSize: '12.5px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    cursor: 'pointer',
                    background: 'var(--accent-glow)',
                    border: '1.5px solid var(--accent)',
                    color: 'var(--accent)',
                    fontWeight: '600'
                  }}
                >
                  ✏️ Edit Health Details
                </button>
              </>
            )}

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>EMERGENCY MEDICAL CONTACT</span>
              <p style={{ fontSize: '14px', margin: 0 }}>
                <strong>School Clinic:</strong> Ext 104 (Dr. Robert Carter)
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                For medical emergencies, please update school clinic forms or contact the administration directly.
              </p>
            </div>
          </div>
        </div>
      )}
      <InteractiveMapSelectorModal 
        isOpen={showDashboardMapSelector}
        onClose={() => {
          setShowDashboardMapSelector(false);
          setShowHomePromptModal(true);
        }}
        onSelect={(lat, lng) => {
          setHomeLat(lat.toFixed(6));
          setHomeLng(lng.toFixed(6));
          setShowDashboardMapSelector(false);
          setShowHomePromptModal(true);
        }}
        initialLat={homeLat}
        initialLng={homeLng}
      />
      <InteractiveMapSelectorModal 
        isOpen={showParentEditorMapSelector}
        onClose={() => setShowParentEditorMapSelector(false)}
        onSelect={(lat, lng) => {
          setParentProfileForm(prev => ({
            ...prev,
            homeAddress: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
          }));
        }}
        initialLat={parentProfileForm.homeAddress.includes('Coordinates:') ? parentProfileForm.homeAddress.split('Coordinates:')[1].split(',')[0].trim() : ''}
        initialLng={parentProfileForm.homeAddress.includes('Coordinates:') ? parentProfileForm.homeAddress.split(',')[1].trim() : ''}
      />
    </DashboardLayout>
  );
};

// -------------------------------------------------------------
// REUSABLE CLASS ATTENDANCE VIEWER MODULE FOR ADMINS/PRINCIPAL
// -------------------------------------------------------------

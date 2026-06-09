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

  const [activeSubTab, setActiveSubTab] = useState(() => sessionStorage.getItem('activeSubTab_driver') || 'drive'); // 'drive' or 'history'
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

          const tooltipContent = `<div style="font-family: system-ui, -apple-system, sans-serif; font-weight: 700; color: white; background: ${alertColor}; padding: 6px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.25); box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-size: 11px; text-align: center; text-transform: uppercase; white-space: nowrap;"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>My Incident Reported Here: ${alertTitle}<br/><span style="font-weight: 500; font-size: 9px; opacity: 0.9; text-transform: none;">Coords: ${incidentCoords.lat.toFixed(5)}, ${incidentCoords.lng.toFixed(5)}</span></div>`;

          if (!incidentMarkerRef.current) {
            incidentMarkerRef.current = L.marker(incidentLatLng, { icon: incidentIcon })
              .addTo(map)
              .bindPopup(`<strong>Incident Reported Here: ${alertTitle}</strong><br/>Coords: ${incidentCoords.lat.toFixed(5)}, ${incidentCoords.lng.toFixed(5)}`)
              .bindTooltip(tooltipContent, { permanent: true, direction: 'top', className: 'custom-incident-tooltip', offset: [0, -10] })
              .openPopup();
          } else {
            incidentMarkerRef.current.setLatLng(incidentLatLng);
            incidentMarkerRef.current.setIcon(incidentIcon);
            incidentMarkerRef.current.setPopupContent(`<strong>Incident Reported Here: ${alertTitle}</strong><br/>Coords: ${incidentCoords.lat.toFixed(5)}, ${incidentCoords.lng.toFixed(5)}`);
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
          const defaultLoc = { lat: 17.3850, lng: 78.4867 }; // Default Hyderabad
          setStartLocation("17.3850, 78.4867");
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

  const confirmLogout = (allDevices = false) => {
    if (isTripActive) {
      handleEndTrip();
    }
    logout(allDevices);
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
                  <h3 style={{ color: '#34d399', marginBottom: '4px' }}>Shift Completed Successfully!</h3>
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

export default DriverDashboard;

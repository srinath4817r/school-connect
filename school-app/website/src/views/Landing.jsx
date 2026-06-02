import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, GraduationCap, Bus, School, Menu, X, Users,
  ShieldCheck, LayoutDashboard, BookOpen, ClipboardList, CheckSquare, Wifi,
  MapPin, Navigation, Play, Clock, Bell, MessageSquare, CreditCard, Award, Building
} from 'lucide-react';
import schoolHeroImg from '../assets/school_hero.png';
import './Landing.css';

const Landing = () => {
  const [showContactModal, setShowContactModal] = useState(false);
  const [activePortalTab, setActivePortalTab] = useState('parent');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  useEffect(() => {
    const hasDismissed = localStorage.getItem('appDownloadPromptDismissed');
    if (!hasDismissed) {
      const timer = setTimeout(() => {
        setShowDownloadModal(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
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
    setShowDownloadModal(false);
  };

  const handleDismissDownload = () => {
    localStorage.setItem('appDownloadPromptDismissed', 'true');
    setShowDownloadModal(false);
  };

  // Icon arrays for dynamic floating badges around the hero illustration
  const circle1Icons = [
    { icon: <School size={20} />, label: "School Admin" },
    { icon: <ShieldCheck size={20} />, label: "Security & Control" },
    { icon: <Building size={20} />, label: "Administration" },
    { icon: <LayoutDashboard size={20} />, label: "Realtime Portal" }
  ];

  const circle2Icons = [
    { icon: <GraduationCap size={20} />, label: "Teacher App" },
    { icon: <BookOpen size={20} />, label: "Diaries & Homework" },
    { icon: <ClipboardList size={20} />, label: "Rosters" },
    { icon: <Wifi size={20} />, label: "SSID Check-in" }
  ];

  const circle3Icons = [
    { icon: <Bus size={20} />, label: "Bus Fleet" },
    { icon: <MapPin size={20} />, label: "GPS Tracking" },
    { icon: <Navigation size={20} />, label: "Live Routes" },
    { icon: <Clock size={20} />, label: "ETA Alerts" }
  ];

  const circle4Icons = [
    { icon: <Users size={20} />, label: "Parents & Students" },
    { icon: <Home size={20} />, label: "Family Dashboard" },
    { icon: <Bell size={20} />, label: "Push Notifications" },
    { icon: <CreditCard size={20} />, label: "Fee Payments" }
  ];

  const [iconIndices, setIconIndices] = useState([0, 0, 0, 0]);

  useEffect(() => {
    const intervals = [3500, 4200, 3000, 4700]; // Organic unsynchronized periods
    const timers = intervals.map((interval, i) => {
      return setInterval(() => {
        setIconIndices(prev => {
          const next = [...prev];
          next[i] = next[i] + 1;
          return next;
        });
      }, interval);
    });

    return () => timers.forEach(clearInterval);
  }, []);

  const parentFeatures = [
    {
      icon: (
        <svg viewBox="0 0 24 24" width="44" height="44" stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1" fill="rgba(79, 70, 229, 0.05)" className="animate-dash-1" />
          <rect x="14" y="3" width="7" height="5" rx="1" fill="var(--secondary)" className="animate-dash-2" />
          <rect x="3" y="16" width="7" height="5" rx="1" fill="var(--accent)" className="animate-dash-3" />
          <rect x="14" y="12" width="7" height="9" rx="1" fill="rgba(14, 165, 233, 0.05)" className="animate-dash-4" />
        </svg>
      ),
      name: 'Home Dashboard',
      desc: 'Simplify daily school oversight with a single overview screen consolidating key student information.'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" width="44" height="44" stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" fill="rgba(79, 70, 229, 0.05)" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <path d="M9 16l2 2 4-4" stroke="var(--success)" strokeWidth="2.5" className="animate-check" />
        </svg>
      ),
      name: 'Attendance',
      desc: 'View real-time calendar statistics showing student present, absent, or late marks directly on your portal.'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" width="44" height="44" stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" fill="rgba(79, 70, 229, 0.05)" />
          <circle cx="12" cy="12" r="4" stroke="var(--secondary)" className="animate-clock-rim" />
          <line x1="12" y1="12" x2="12" y2="10" stroke="var(--secondary)" strokeWidth="2" className="animate-clock-hour" style={{ transformOrigin: '12px 12px' }} />
          <line x1="12" y1="12" x2="14" y2="12" stroke="var(--secondary)" strokeWidth="2" className="animate-clock-min" style={{ transformOrigin: '12px 12px' }} />
        </svg>
      ),
      name: 'Diary (after 4:30 PM)',
      desc: 'Access daily homework, notes, and messages immediately after the lock releases at 4:30 PM.'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" width="44" height="44" stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <rect x="6" y="9" width="3" height="12" rx="1" fill="rgba(79, 70, 229, 0.2)" className="animate-bar-1" />
          <rect x="11" y="5" width="3" height="16" rx="1" fill="var(--secondary)" className="animate-bar-2" />
          <rect x="16" y="12" width="3" height="9" rx="1" fill="var(--accent)" className="animate-bar-3" />
        </svg>
      ),
      name: 'Marks & Performance',
      desc: 'Track academic growth trends, grade badges, assessment results, and school-wide comparisons.'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" width="44" height="44" stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" fill="rgba(79, 70, 229, 0.05)" />
          <line x1="2" y1="10" x2="22" y2="10" />
          <circle cx="12" cy="4" r="2.5" fill="var(--secondary)" stroke="var(--secondary)" className="animate-coin" />
        </svg>
      ),
      name: 'Fee Balance',
      desc: 'Check fee ledger balances, complete with pending dues warnings, paid statements, and office contacts.'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" width="44" height="44" stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="12" rx="2" fill="rgba(79, 70, 229, 0.05)" className="animate-bus-shake" />
          <circle cx="7" cy="18" r="2" fill="var(--text-primary)" />
          <circle cx="17" cy="18" r="2" fill="var(--text-primary)" />
          <path d="M10 18h4" />
          <path d="M3 15h18" stroke="var(--secondary)" />
          <line x1="5" y1="22" x2="9" y2="22" stroke="var(--secondary)" strokeWidth="1.5" className="animate-road-1" />
          <line x1="13" y1="22" x2="17" y2="22" stroke="var(--secondary)" strokeWidth="1.5" className="animate-road-2" />
        </svg>
      ),
      name: 'Bus Tracker',
      desc: 'Track live school bus locations on high-precision maps, view ETAs, and set geofence alarms.'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" width="44" height="44" stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" fill="rgba(79, 70, 229, 0.05)" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <polyline points="12 12 12 14 14 16" className="animate-calendar-clock" style={{ transformOrigin: '12px 12px' }} />
        </svg>
      ),
      name: 'Timetable & Calendar',
      desc: 'Stay informed about class timings, subject hours, exam timetables, and school holidays.'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" width="44" height="44" stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19l-7-5H3a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h2l7-5v16z" fill="rgba(79, 70, 229, 0.05)" />
          <path d="M17 5.6a8.6 8.6 0 0 1 0 12.8" stroke="var(--secondary)" className="animate-wave-short" />
          <path d="M20.5 2a13.5 13.5 0 0 1 0 20" stroke="var(--accent)" className="animate-wave-long" />
        </svg>
      ),
      name: 'Announcements',
      desc: 'Receive digital notice boards and broad academic announcements instantly on your dashboard.'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" width="44" height="44" stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9z" fill="rgba(79, 70, 229, 0.05)" className="animate-bell-body" style={{ transformOrigin: '12px 2px' }} />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" fill="var(--secondary)" className="animate-bell-clapper" style={{ transformOrigin: '12px 18px' }} />
        </svg>
      ),
      name: 'Notifications',
      desc: 'Receive immediate push alerts on critical updates, emergencies, or diary announcements.'
    }
  ];

  const teacherFeatures = [
    {
      icon: (
        <svg viewBox="0 0 24 24" width="44" height="44" stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1" fill="rgba(79, 70, 229, 0.05)" className="animate-dash-1" />
          <rect x="14" y="3" width="7" height="5" rx="1" fill="var(--secondary)" className="animate-dash-2" />
          <rect x="3" y="16" width="7" height="5" rx="1" fill="var(--accent)" className="animate-dash-3" />
          <rect x="14" y="12" width="7" height="9" rx="1" fill="rgba(14, 165, 233, 0.05)" className="animate-dash-4" />
        </svg>
      ),
      name: 'Home Workspace',
      desc: 'Access classes assigned, section rosters, and recent updates from a structured dashboard.'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" width="44" height="44" stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" fill="rgba(79, 70, 229, 0.05)" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <path d="M9 16l2 2 4-4" stroke="var(--success)" strokeWidth="2.5" className="animate-check" />
        </svg>
      ),
      name: 'Mark Attendance',
      desc: 'Log student attendance digitally with status options (Present, Late, Absent) synched immediately.'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" width="44" height="44" stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" fill="rgba(79, 70, 229, 0.05)" />
          <circle cx="12" cy="12" r="4" stroke="var(--secondary)" className="animate-clock-rim" />
          <line x1="12" y1="12" x2="12" y2="10" stroke="var(--secondary)" strokeWidth="2" className="animate-clock-hour" style={{ transformOrigin: '12px 12px' }} />
          <line x1="12" y1="12" x2="14" y2="12" stroke="var(--secondary)" strokeWidth="2" className="animate-clock-min" style={{ transformOrigin: '12px 12px' }} />
        </svg>
      ),
      name: 'Write Diary (3:30-4:30)',
      desc: 'Enter homework items, notices, and reminders. Enabled daily between 3:30 PM and 4:30 PM.'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" width="44" height="44" stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="rgba(79, 70, 229, 0.05)" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M10 20v-6M7 17h6" stroke="var(--secondary)" />
          <circle cx="12" cy="12" r="3" fill="var(--accent)" className="animate-pencil-dot" />
        </svg>
      ),
      name: 'Enter Marks',
      desc: 'Input test scores, post examination grades, and compute classroom statistics.'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" width="44" height="44" stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" fill="rgba(79, 70, 229, 0.05)" />
          <polyline points="12 6 12 12 16 14" stroke="var(--secondary)" strokeWidth="2.5" className="animate-clock-hand" style={{ transformOrigin: '12px 12px' }} />
        </svg>
      ),
      name: 'Timetable',
      desc: 'Access class lists, schedules, and timing configurations directly in your calendar.'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" width="44" height="44" stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="rgba(79, 70, 229, 0.05)" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M22 2l-3 9-2-4-4 2 9-7z" stroke="var(--accent)" strokeWidth="1.5" className="animate-plane-takeoff" />
        </svg>
      ),
      name: 'Apply Leave',
      desc: 'Submit time-off requests to the Principal and check approval states electronically.'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" width="44" height="44" stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.55a11 11 0 0 1 14.08 0" stroke="var(--accent)" strokeWidth="2.5" className="animate-wifi-1" />
          <path d="M1.42 9a16 16 0 0 1 21.16 0" stroke="var(--secondary)" strokeWidth="2.5" className="animate-wifi-2" />
          <rect x="6" y="13" width="12" height="9" rx="2" fill="rgba(79, 70, 229, 0.05)" />
          <path d="M9 17h6M9 19h6" stroke="var(--text-muted)" strokeWidth="1.5" />
          <circle cx="12" cy="15" r="1.5" fill="var(--accent)" />
        </svg>
      ),
      name: 'WiFi Attendance',
      desc: 'Submit daily check-ins on mobile, validated securely by matching official School WiFi SSID.'
    }
  ];

  const driverFeatures = [
    {
      icon: (
        <svg viewBox="0 0 24 24" width="44" height="44" stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1" fill="rgba(79, 70, 229, 0.05)" className="animate-dash-1" />
          <rect x="14" y="3" width="7" height="5" rx="1" fill="var(--secondary)" className="animate-dash-2" />
          <rect x="3" y="16" width="7" height="5" rx="1" fill="var(--accent)" className="animate-dash-3" />
          <rect x="14" y="12" width="7" height="9" rx="1" fill="rgba(14, 165, 233, 0.05)" className="animate-dash-4" />
        </svg>
      ),
      name: 'Home Shift Dashboard',
      desc: 'Coordinate routes, assign your active vehicle number, and overview historical shifts.'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" width="44" height="44" stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3" fill="rgba(79, 70, 229, 0.05)" className="animate-play-glow" />
        </svg>
      ),
      name: 'Start Trip',
      desc: 'Launch real-time location mapping broadcasts when starting morning or afternoon runs.'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" width="44" height="44" stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="rgba(79, 70, 229, 0.05)" />
          <circle cx="12" cy="10" r="3" fill="var(--secondary)" className="animate-pin-radar" />
        </svg>
      ),
      name: 'Live Location',
      desc: 'Broadcast GPS coordinates securely to parents and principal tracking maps.'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" width="44" height="44" stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="7" r="4" fill="rgba(79, 70, 229, 0.05)" className="animate-people-head" />
          <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" className="animate-people-body" />
          <path d="M17 12l2 2 4-4" stroke="var(--success)" strokeWidth="2" className="animate-check-short" />
        </svg>
      ),
      name: 'Student Pickup/Drop',
      desc: 'Log boarding times, drop-off events, and safety tallies at each bus stop.'
    }
  ];

  const steps = [
    {
      number: '1',
      name: 'Register Your School',
      desc: 'Get in touch with the admin team to obtain a code, register school profiles, and invite teachers and principal.'
    },
    {
      number: '2',
      name: 'Configure Classes & Staff',
      desc: 'Define your classrooms and sections. Add teachers and link students with parents under dynamic portfolios.'
    },
    {
      number: '3',
      name: 'Connect & Notify',
      desc: 'Teachers post diaries during strict schedules, and parents receive instant Firebase FCM alerts.'
    }
  ];

  const testimonials = [
    {
      text: '"Managing classroom diaries and tracking digital attendance has never been so seamless. Our teachers and parents are more connected than ever!"',
      author: 'Mrs. Anita Sharma',
      role: 'Principal, Greenwood High School'
    },
    {
      text: '"The time-locked classroom diary helps me organize homework easily. The automated alerts keep me on track every afternoon."',
      author: 'Mr. David Dsouza',
      role: 'Math Teacher, Section A'
    },
    {
      text: '"Checking my child\'s homework and fee balance is so simple now. The checklist progress bar makes tracking completed tasks a breeze."',
      author: 'Rajesh Patel',
      role: 'Parent of Aarav Patel (Class 8)'
    }
  ];

  return (
    <div className="landing-page-theme">
      {/* Premium Floating Background Blobs */}
      <div className="landing-bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <div className="landing-container">
        {/* Navbar Header */}
        <header className="landing-header">
          <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="logo-icon" style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, width: 'auto', height: 'auto', boxShadow: 'none' }}>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#7c3aed' }}>
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="url(#logo-bolt-grad)" stroke="none" />
                <defs>
                  <linearGradient id="logo-bolt-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#0ea5e9" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="logo-text" style={{ color: '#0f172a', fontWeight: '800', fontSize: '20px', letterSpacing: '-0.5px' }}>School Connect</span>
          </div>
          
          <div className="nav-buttons desktop-only">
            <Link to="/login" className="btn btn-secondary" style={{ borderRadius: '20px', padding: '8px 20px' }}>Login</Link>
            <button onClick={() => setShowContactModal(true)} className="btn btn-primary" style={{ borderRadius: '20px', padding: '8px 20px' }}>Register School</button>
          </div>

          <button 
            className="mobile-nav-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Mobile Navigation Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="mobile-nav-menu">
            <Link 
              to="/login" 
              className="btn btn-secondary mobile-menu-btn"
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </Link>
            <button 
              onClick={() => { setShowContactModal(true); setMobileMenuOpen(false); }} 
              className="btn btn-primary mobile-menu-btn"
            >
              Register School
            </button>
          </div>
        )}

        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content-left">
            <h1 className="hero-title">
              Connect Your School. <br />
              <span className="hero-gradient">Empower Your Community.</span>
            </h1>
            <p className="hero-tagline">
              The premium, secure communication hub connecting administrators, principal, teachers, parents, and drivers in real time.
            </p>
            <div className="hero-buttons">
              <Link to="/login" className="btn btn-primary hero-btn" style={{ borderRadius: '20px', padding: '12px 28px' }}>Login to Portal</Link>
              <button onClick={() => setShowContactModal(true)} className="btn btn-secondary hero-btn" style={{ borderRadius: '20px', padding: '12px 28px' }}>Register School</button>
            </div>
          </div>

          <div className="hero-graphic-right">
            <div className="hero-graphic-wrapper">
              <div className="bg-glow"></div>
              <div className="blur-shape shape-1"></div>
              <div className="blur-shape shape-2"></div>
              
              <img 
                src={schoolHeroImg} 
                alt="School Connect Illustration" 
                className="hero-illustration"
              />

              <div className="floating-circle circle-1" title={circle1Icons[iconIndices[0] % circle1Icons.length].label}>
                <div className="circle-icon-wrapper" key={iconIndices[0]}>
                  {circle1Icons[iconIndices[0] % circle1Icons.length].icon}
                </div>
              </div>
              <div className="floating-circle circle-2" title={circle2Icons[iconIndices[1] % circle2Icons.length].label}>
                <div className="circle-icon-wrapper" key={iconIndices[1]}>
                  {circle2Icons[iconIndices[1] % circle2Icons.length].icon}
                </div>
              </div>
              <div className="floating-circle circle-3" title={circle3Icons[iconIndices[2] % circle3Icons.length].label}>
                <div className="circle-icon-wrapper" key={iconIndices[2]}>
                  {circle3Icons[iconIndices[2] % circle3Icons.length].icon}
                </div>
              </div>
              <div className="floating-circle circle-4" title={circle4Icons[iconIndices[3] % circle4Icons.length].label}>
                <div className="circle-icon-wrapper" key={iconIndices[3]}>
                  {circle4Icons[iconIndices[3] % circle4Icons.length].icon}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <h2 className="section-title">Dedicated App Portals</h2>
          <p className="section-subtitle">Explore tailormade dashboards and workflows configured for each role.</p>
          {/* Portal Tab Selectors */}
          <div className="portal-tabs" id="features-selector">
            <button 
              className={`portal-tab-btn ${activePortalTab === 'parent' ? 'active' : ''}`}
              onClick={() => setActivePortalTab('parent')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Home size={16} /> Parent App
            </button>
            <button 
              className={`portal-tab-btn ${activePortalTab === 'teacher' ? 'active' : ''}`}
              onClick={() => setActivePortalTab('teacher')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <GraduationCap size={16} /> Teacher App
            </button>
            <button 
              className={`portal-tab-btn ${activePortalTab === 'driver' ? 'active' : ''}`}
              onClick={() => setActivePortalTab('driver')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Bus size={16} /> Driver App
            </button>
          </div>

          {/* Portal Feature Grids */}
          {activePortalTab === 'parent' && (
            <div className="features-grid animate-fade-in">
              {parentFeatures.map((f, i) => (
                <div className="feature-card glass-card" key={i}>
                  <div className="feature-icon">{f.icon}</div>
                  <h3 className="feature-name">{f.name}</h3>
                  <p className="feature-desc">{f.desc}</p>
                </div>
              ))}
            </div>
          )}

          {activePortalTab === 'teacher' && (
            <div className="features-grid animate-fade-in">
              {teacherFeatures.map((f, i) => (
                <div className="feature-card glass-card" key={i}>
                  <div className="feature-icon">{f.icon}</div>
                  <h3 className="feature-name">{f.name}</h3>
                  <p className="feature-desc">{f.desc}</p>
                </div>
              ))}
            </div>
          )}

          {activePortalTab === 'driver' && (
            <div className="features-grid animate-fade-in">
              {driverFeatures.map((f, i) => (
                <div className="feature-card glass-card" key={i}>
                  <div className="feature-icon">{f.icon}</div>
                  <h3 className="feature-name">{f.name}</h3>
                  <p className="feature-desc">{f.desc}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Evolution Section */}
        <section className="evolution-section">
          <div className="evolution-grid">
            <div className="evolution-text">
              <span className="evo-tag">Evolution of Schooling</span>
              <h2 className="section-title text-left">Say Goodbye to the Old Way</h2>
              <p className="section-subtitle text-left">No more carrying heavy paper registers. No more outdated, slow systems. Stay connected in real-time, all the time.</p>
              <p className="evo-description">
                School Connect brings your school ecosystem out of the dark ages of paper logs and siloed databases. Teachers, administrators, and parents communicate in a unified, modern web environment.
              </p>
              <div className="evo-bullet-list">
                <div className="evo-bullet">
                  <div className="bullet-icon">✨</div>
                  <div>
                    <h4>100% Paperless & Mobile</h4>
                    <p>Attendance checklists, homework, and fee collection recorded dynamically on the go.</p>
                  </div>
                </div>
                <div className="evo-bullet">
                  <div className="bullet-icon">⚡</div>
                  <div>
                    <h4>Real-Time Communication</h4>
                    <p>Parents get instant updates and fee notifications, ensuring complete transparency.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="evolution-visual">
              <div className="visual-comparison">
                <div className="comparison-box old-way">
                  <span className="box-badge">Outdated System</span>
                  <div className="box-icon">📁</div>
                  <h4>Paper Registers</h4>
                  <p>Heavy, manual, easy to lose, and disconnected from parents.</p>
                </div>
                <div className="comparison-connector">
                  <div className="connector-arrow">➔</div>
                </div>
                <div className="comparison-box new-way">
                  <span className="box-badge primary">School Connect</span>
                  <div className="box-icon pulse">⚡</div>
                  <h4>Digital Sync</h4>
                  <p>Cloud-synchronized dashboards keep everyone connected in real-time.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="steps-section">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Set up your school connect environment in 3 simple steps.</p>
          <div className="steps-grid">
            {steps.map((s, i) => (
              <div className="step-card glass-card" key={i}>
                <div className="step-number">{s.number}</div>
                <h3 className="step-name">{s.name}</h3>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="testimonials-section">
          <h2 className="section-title">Loved by Educators & Parents</h2>
          <p className="section-subtitle">See what our users have to say about their experience.</p>
          <div className="testimonials-grid">
            {testimonials.map((t, i) => (
              <div className="testimonial-card glass-card" key={i}>
                <p className="testimonial-text">{t.text}</p>
                <div className="testimonial-author">
                  <div className="author-avatar">{t.author[0]}</div>
                  <div>
                    <h4 className="author-name">{t.author}</h4>
                    <span className="author-role">{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <div className="footer-content">
            <div className="footer-col">
              <div className="logo-container">
                <div className="logo-icon">S</div>
                <span className="logo-text">School Connect</span>
              </div>
              <p className="footer-desc">
                Bridging the gap between classrooms and homes through structured diaries, digital attendance, staff check-ins, and academic portals.
              </p>
            </div>
            <div className="footer-col">
              <h4 className="footer-title">Contact Office</h4>
              <ul className="footer-links">
                <li>📞 Phone: <a href="tel:9346022857" style={{ color: 'inherit', textDecoration: 'none' }}>+91 93460 22857</a></li>
                <li>📧 Email: <a href="mailto:thinkerslab001@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>thinkerslab001@gmail.com</a></li>
                <li>🏢 Head Office: Bangalore, India</li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} School Connect. All rights reserved. Built with Vite and React.</p>
          </div>
        </footer>
      </div>

      {/* ONBOARDING MODAL */}
      {showContactModal && (
        <div className="landing-modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="landing-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="landing-modal-close" onClick={() => setShowContactModal(false)}>&times;</button>
            <div className="landing-modal-header">
              <div className="modal-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <School size={28} style={{ color: 'var(--accent)' }} />
              </div>
              <h3 className="modal-title">School Onboarding</h3>
            </div>
            <div className="landing-modal-body">
              <p className="modal-instruction">
                To register and set up your school profile on the <strong>School Connect</strong> platform, please contact our administrator or onboarding team to get your unique <strong>School Registration Secret Code</strong>.
              </p>
              <div className="contact-card-grid">
                <a href="tel:9346022857" className="contact-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <span className="contact-icon">📞</span>
                  <div>
                    <h4>Call Support</h4>
                    <p className="contact-detail">+91 93460 22857</p>
                  </div>
                </a>
                <a href="mailto:thinkerslab001@gmail.com?subject=School%20Connect%20Registration%20Request" className="contact-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <span className="contact-icon">📧</span>
                  <div>
                    <h4>Email Onboarding</h4>
                    <p className="contact-detail">thinkerslab001@gmail.com</p>
                  </div>
                </a>
                <div className="contact-card">
                  <span className="contact-icon">🏢</span>
                  <div>
                    <h4>Head Office</h4>
                    <p className="contact-detail">Bangalore, Karnataka, India</p>
                  </div>
                </div>
              </div>
              <p className="modal-footer-note">
                Our support team is available Monday to Friday from 9:00 AM to 6:00 PM to assist with code issuance and configuration.
              </p>
            </div>
            <div className="landing-modal-actions">
              <a href="mailto:thinkerslab001@gmail.com?subject=School%20Connect%20Registration%20Request" className="btn btn-primary modal-action-btn">
                Request Onboarding Code
              </a>
              <button className="btn btn-secondary modal-action-btn" onClick={() => setShowContactModal(false)}>
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APP DOWNLOAD PROMPT MODAL */}
      {showDownloadModal && (
        <div className="landing-modal-overlay" style={{ zIndex: 10000 }} onClick={handleDismissDownload}>
          <div className="landing-modal-content" style={{ maxWidth: '460px', padding: '32px' }} onClick={(e) => e.stopPropagation()}>
            <button className="landing-modal-close" onClick={handleDismissDownload}>&times;</button>
            <div className="landing-modal-header" style={{ marginBottom: '16px' }}>
              <div className="modal-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 12px auto' }}>
                📱
              </div>
              <h3 className="modal-title" style={{ fontSize: '22px', fontWeight: '800', textAlign: 'center', width: '100%' }}>
                Get the School Connect App
              </h3>
            </div>
            <div className="landing-modal-body" style={{ textAlign: 'center' }}>
              <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
                For the best experience, real-time school bus GPS tracking, and instant push notification alerts, download the School Connect application directly onto your device.
              </p>
              
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
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
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                    {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'Mobile Edition Detected' : 'PC Desktop Edition Detected'}
                  </h4>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                    {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'Package: school-connect.apk' : 'Package: school-connect-setup.exe'}
                  </p>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              <button 
                onClick={handleDownloadApp}
                className="btn btn-primary" 
                style={{ 
                  borderRadius: '20px', 
                  padding: '12px', 
                  width: '100%', 
                  fontWeight: '700', 
                  fontSize: '14px',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #0ea5e9 100%)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                🚀 Download Native App
              </button>
              <button 
                onClick={handleDismissDownload}
                className="btn btn-secondary" 
                style={{ 
                  borderRadius: '20px', 
                  padding: '12px', 
                  width: '100%', 
                  fontWeight: '600', 
                  fontSize: '13px',
                  background: 'transparent',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  cursor: 'pointer'
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

export default Landing;

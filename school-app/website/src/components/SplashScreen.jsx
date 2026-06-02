import React, { useEffect, useState } from 'react';

const SplashScreen = ({ user, schoolData, onComplete }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // 3.5s: Transition out starts
    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 3500);

    // 3.9s: Animation finishes completely, dashboard should show
    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 3900);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  // Helpers for Default Avatars
  const schoolInitial = schoolData?.name 
    ? schoolData.name.trim().toUpperCase()[0] || 'S'
    : 'S';

  const getSchoolLogoGradient = (schoolName) => {
    if (!schoolName) return 'linear-gradient(135deg, #a855f7, #6b21a8)';
    const firstChar = schoolName.trim().toUpperCase()[0] || 'S';
    if (/[A-F]/.test(firstChar)) return 'linear-gradient(135deg, #a855f7, #6b21a8)'; // A-F: Purple gradient
    if (/[G-L]/.test(firstChar)) return 'linear-gradient(135deg, #3b82f6, #1d4ed8)'; // G-L: Blue gradient
    if (/[M-R]/.test(firstChar)) return 'linear-gradient(135deg, #10b981, #047857)'; // M-R: Green gradient
    return 'linear-gradient(135deg, #f97316, #c2410c)'; // S-Z: Orange gradient
  };

  const getUserInitials = (fullName) => {
    if (!fullName) return 'U';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getRoleColor = (role) => {
    if (role === 'parent') return '#EC4899';
    if (role === 'teacher') return '#F59E0B';
    if (role === 'driver') return '#06B6D4';
    return '#A855F7';
  };

  const schoolLogoSrc = schoolData?.logoUrl || schoolData?.schoolPhoto;
  const userPhotoSrc = user?.profilePhotoUrl || user?.profilePhoto;

  const roleColor = getRoleColor(user?.role);
  const userInitials = getUserInitials(user?.fullName);
  const schoolGradient = getSchoolLogoGradient(schoolData?.name);

  return (
    <div className={`splash-screen-wrapper ${isFadingOut ? 'splash-fade-out' : ''}`}>
      <style>{`
        /* Reset and main layout */
        .splash-screen-wrapper {
          position: fixed;
          inset: 0;
          background: #0A0A1B;
          z-index: 99999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          color: white;
          font-family: 'Outfit', 'Inter', -apple-system, sans-serif;
          user-select: none;
        }

        /* Fade out transition at 3.5s */
        .splash-fade-out {
          opacity: 0;
          transform: scale(1.1);
          transition: opacity 0.4s cubic-bezier(0.25, 1, 0.5, 1), transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
          pointer-events: none;
        }

        /* Combined Unit for Logos & Connecting Line */
        .splash-logos-unit {
          position: absolute;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-sizing: border-box;

          /* Initial layout state: spanning top left to top right */
          top: 20px;
          left: 20px;
          width: calc(100vw - 40px);

          /* Move to center animation: starts at 1.1s, duration 0.7s */
          animation: slideToCenter 0.7s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          animation-delay: 1.1s;
        }

        @keyframes slideToCenter {
          0% {
            top: 20px;
            left: 20px;
            width: calc(100vw - 40px);
          }
          100% {
            top: calc(50% - 100px);
            left: calc(50% - 160px);
            width: 320px;
          }
        }

        /* School Logo Container */
        .school-logo-container {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-sizing: border-box;
          z-index: 10;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);

          /* Spring bounce enter */
          opacity: 0;
          transform: scale(0.5);
          animation: springEnter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                     pulseScale 0.3s ease-in-out forwards;
          animation-delay: 0s, 1.8s;
        }

        .school-logo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .school-logo-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
          color: white;
          border-radius: 50%;
        }

        /* User Photo Container */
        .user-photo-container {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-sizing: border-box;
          z-index: 10;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);

          /* Spring bounce enter: delay 0.2s */
          opacity: 0;
          transform: scale(0.5);
          animation: springEnter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                     pulseScale 0.3s ease-in-out forwards;
          animation-delay: 0.2s, 1.8s;
        }

        .user-photo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .user-photo-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: bold;
          color: white;
          border-radius: 50%;
        }

        @keyframes springEnter {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes pulseScale {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.15);
          }
          100% {
            transform: scale(1);
          }
        }

        /* Connecting Line Container */
        .connecting-line-wrapper {
          flex: 1;
          position: relative;
          height: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
        }

        .connecting-line {
          width: 100%;
          height: 2px;
          border-top: 2px dashed transparent;
          /* CSS dashed border gradient trick using linear-gradient and background-clip */
          background-image: linear-gradient(#0A0A1B, #0A0A1B), linear-gradient(90deg, #a855f7 0%, #ec4899 100%);
          background-origin: border-box;
          background-clip: content-box, border-box;
          
          /* Line draw scaling animation: delay 0.5s, duration 0.8s */
          transform: scaleX(0);
          transform-origin: left;
          animation: drawLine 0.8s ease forwards;
          animation-delay: 0.5s;
        }

        @keyframes drawLine {
          to {
            transform: scaleX(1);
          }
        }

        /* Data Packet Flow */
        .data-packet {
          position: absolute;
          top: -12px;
          font-size: 11px;
          opacity: 0;
          animation: flowData 1.5s linear infinite;
          pointer-events: none;
        }
        
        .data-packet:nth-of-type(1) {
          animation-delay: 0.6s;
        }
        .data-packet:nth-of-type(2) {
          animation-delay: 1.0s;
        }
        .data-packet:nth-of-type(3) {
          animation-delay: 1.4s;
        }
        .data-packet:nth-of-type(4) {
          animation-delay: 1.8s;
        }

        @keyframes flowData {
          0% {
            left: 0%;
            opacity: 0;
            transform: scale(0.6) translateY(0);
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            left: 100%;
            opacity: 0;
            transform: scale(0.6) translateY(0);
          }
        }

        /* Student Carrier */
        .student-carrier {
          position: absolute;
          top: -26px;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 32px;
          height: 32px;
          z-index: 12;
          opacity: 0;
          transform: scale(0);
          pointer-events: none;
          
          /* Appear and run animation */
          animation: runAcross 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          animation-delay: 0.9s;
        }

        .student-emoji {
          font-size: 16px;
          animation: bobbing 0.2s ease-in-out infinite alternate;
        }

        .student-carrying-data {
          font-size: 10px;
          margin-top: -4px;
          filter: drop-shadow(0 0 4px #fff);
          animation: spinData 1.5s linear infinite;
        }

        @keyframes runAcross {
          0% {
            left: 0%;
            opacity: 0;
            transform: scale(0) translateX(-10px);
          }
          20% {
            opacity: 1;
            transform: scale(1) translateX(0);
          }
          80% {
            opacity: 1;
            transform: scale(1) translateX(0);
          }
          100% {
            left: calc(100% - 16px);
            opacity: 0;
            transform: scale(0.2) translateX(10px);
          }
        }

        @keyframes bobbing {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(-4px);
          }
        }

        @keyframes spinData {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Link Icon Container */
        .link-icon-container {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 15;
          
          /* Pop-in animation: delay 0.9s, duration 0.4s */
          transform: scale(0);
          animation: popIcon 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          animation-delay: 0.9s;
        }

        .custom-link-anim-wrapper {
          position: relative;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .custom-link-svg {
          width: 36px;
          height: 36px;
          filter: drop-shadow(0 0 4px rgba(168, 85, 247, 0.5));
          animation: floatLink 3s ease-in-out infinite;
        }

        /* Slide left capsule from top-left */
        .link-path-left {
          transform-origin: 12px 12px;
          animation: snapLeft 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          animation-delay: 0.9s;
        }

        /* Slide right capsule from bottom-right */
        .link-path-right {
          transform-origin: 12px 12px;
          animation: snapRight 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          animation-delay: 0.9s;
        }

        @keyframes snapLeft {
          0% {
            transform: translate(-15px, -15px);
            opacity: 0;
          }
          100% {
            transform: translate(0, 0);
            opacity: 1;
          }
        }

        @keyframes snapRight {
          0% {
            transform: translate(15px, 15px);
            opacity: 0;
          }
          100% {
            transform: translate(0, 0);
            opacity: 1;
          }
        }

        /* Float effect for the link icon */
        @keyframes floatLink {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-3px) rotate(3deg);
          }
        }

        /* Sparkle flare inside the center when locked */
        .link-sparkle-pulse {
          position: absolute;
          width: 6px;
          height: 6px;
          background: #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 12px 6px #ffffff, 0 0 20px 10px #a855f7, 0 0 30px 15px #ec4899;
          opacity: 0;
          transform: scale(0);
          animation: sparkleTrigger 0.5s ease-out forwards;
          animation-delay: 1.7s;
          pointer-events: none;
          z-index: 20;
        }

        @keyframes sparkleTrigger {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          30% {
            opacity: 1;
            transform: scale(1.5);
          }
          100% {
            opacity: 0;
            transform: scale(0);
          }
        }

        /* Glowing ring expanding outwards when locked */
        .link-glowing-ring {
          position: absolute;
          width: 20px;
          height: 20px;
          border: 2px solid #ffffff;
          border-radius: 50%;
          opacity: 0;
          transform: scale(0.5);
          animation: ringTrigger 0.8s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
          animation-delay: 1.7s;
          pointer-events: none;
          z-index: 19;
        }

        @keyframes ringTrigger {
          0% {
            opacity: 0;
            transform: scale(0.5);
            border-color: #ffffff;
            box-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
          }
          20% {
            opacity: 0.8;
            border-color: #a855f7;
            box-shadow: 0 0 15px rgba(168, 85, 247, 0.8);
          }
          100% {
            opacity: 0;
            transform: scale(3.5);
            border-color: #ec4899;
            box-shadow: 0 0 25px rgba(236, 72, 153, 0);
          }
        }

        @keyframes popIcon {
          0% {
            transform: scale(0);
          }
          70% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }

        /* App Details and Loader Section (placed relative to center) */
        .splash-app-details {
          position: absolute;
          top: calc(50% + 20px);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          box-sizing: border-box;

          /* Fade up from below: delay 2.0s, duration 0.5s */
          opacity: 0;
          transform: translateY(20px);
          animation: fadeUp 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          animation-delay: 2.0s;
        }

        @keyframes fadeUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .splash-app-title {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: 2px;
          color: #ffffff;
          margin: 0 0 6px 0;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
        }

        .splash-app-tagline {
          font-size: 14px;
          color: #94A3B8;
          margin: 0 0 28px 0;
          font-weight: 500;
        }

        /* Thin Progress Loading Bar */
        .splash-progress-container {
          width: 200px;
          height: 3px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.1);
          overflow: hidden;
          margin-bottom: 16px;
        }

        .splash-progress-bar {
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, #a855f7 0%, #ec4899 100%);
          border-radius: 9999px;
          
          /* Animate progress: delay 2.3s, duration 1.5s */
          animation: fillProgress 1.5s linear forwards;
          animation-delay: 2.3s;
        }

        @keyframes fillProgress {
          to {
            width: 100%;
          }
        }

        /* Loading Dots Animation */
        .splash-loading-dots {
          display: flex;
          gap: 8px;
          justify-content: center;
        }

        .splash-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #a855f7;
          box-shadow: 0 0 6px rgba(168, 85, 247, 0.6);
          animation: bounceDot 0.6s infinite alternate;
        }

        .splash-dot:nth-child(1) {
          animation-delay: 0s;
        }
        .splash-dot:nth-child(2) {
          animation-delay: 0.15s;
        }
        .splash-dot:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes bounceDot {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(-8px);
          }
        }
      `}</style>

      {/* STEP 2 to 6: Connected Logos Container */}
      <div className="splash-logos-unit">
        {/* School Logo */}
        <div 
          className="school-logo-container"
          style={{
            border: schoolLogoSrc ? '2px solid #a855f7' : 'none',
            boxShadow: schoolLogoSrc ? '0 0 15px rgba(168, 85, 247, 0.5)' : 'none'
          }}
        >
          {schoolLogoSrc ? (
            <img src={schoolLogoSrc} alt="School Logo" className="school-logo-img" />
          ) : (
            <div className="school-logo-fallback" style={{ background: schoolGradient }}>
              {schoolInitial}
            </div>
          )}
        </div>

        <div className="connecting-line-wrapper">
          <div className="connecting-line" />
          
          {/* Continuous Theme Data Packets flowing */}
          <div className="data-packet">📝</div>
          <div className="data-packet">💯</div>
          <div className="data-packet">🚌</div>
          <div className="data-packet">📅</div>
          
          {/* Running Student Carrier representing active data retrieval */}
          <div className="student-carrier">
            <span className="student-carrying-data">📂</span>
            <span className="student-emoji">🧑‍🎓</span>
          </div>
          <div className="link-icon-container">
            <div className="custom-link-anim-wrapper">
              <svg 
                width="40" 
                height="40" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="custom-link-svg"
              >
                {/* Left Link Capsule */}
                <path 
                  d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" 
                  className="link-path-left"
                  stroke="url(#linkGradLeft)"
                />
                {/* Right Link Capsule */}
                <path 
                  d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" 
                  className="link-path-right"
                  stroke="url(#linkGradRight)"
                />
                
                {/* Gradients */}
                <defs>
                  <linearGradient id="linkGradLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#c084fc" />
                  </linearGradient>
                  <linearGradient id="linkGradRight" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f472b6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Interlocking Connection Sparkle/Pulse */}
              <div className="link-sparkle-pulse" />
              <div className="link-glowing-ring" />
            </div>
          </div>
        </div>

        {/* User Photo */}
        <div 
          className="user-photo-container"
          style={{
            border: `2px solid ${roleColor}`,
            boxShadow: `0 0 15px ${roleColor}80`
          }}
        >
          {userPhotoSrc ? (
            <img src={userPhotoSrc} alt="User Avatar" className="user-photo-img" />
          ) : (
            <div className="user-photo-fallback" style={{ background: roleColor }}>
              {userInitials}
            </div>
          )}
        </div>
      </div>

      {/* STEP 7 & 8: App Details & Loading Indicators */}
      <div className="splash-app-details">
        <h1 className="splash-app-title">School Connect</h1>
        <p className="splash-app-tagline">Connecting School & Family</p>
        
        <div className="splash-progress-container">
          <div className="splash-progress-bar" />
        </div>

        <div className="splash-loading-dots">
          <div className="splash-dot" />
          <div className="splash-dot" />
          <div className="splash-dot" />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;

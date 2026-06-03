import React, { useState, useEffect } from 'react';
import { ArrowDown, Check, Settings, ShieldAlert, Smartphone, ArrowRight, Home, Monitor, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';

const DownloadPage = () => {
  const [deviceType, setDeviceType] = useState('desktop'); // 'desktop', 'android', 'ios'

  useEffect(() => {
    const ua = navigator.userAgent;
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const isSmallScreen = window.innerWidth <= 1024;
    const isAndroidUA = /Android/i.test(ua);
    const isIOSUA = /iPhone|iPad|iPod/i.test(ua);
    const isMobileUA = /mobile/i.test(ua);

    if (isAndroidUA) {
      setDeviceType('android');
    } else if (isIOSUA) {
      setDeviceType('ios');
    } else if (isMobileUA) {
      setDeviceType('android');
    } else if (isTouch && isSmallScreen) {
      // Handles mobile browser 'Desktop Site' spoofing
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0A0A1B',
      backgroundImage: 'radial-gradient(circle at top right, rgba(124, 58, 237, 0.12), transparent), radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.08), transparent)',
      color: '#E0E0E6',
      fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background glows */}
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        background: 'rgba(139, 92, 246, 0.1)',
        filter: 'blur(120px)',
        top: '15%',
        left: '50%',
        transform: 'translateX(-50%)',
        borderRadius: '50%',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Home link */}
      <Link to="/" style={{
        position: 'absolute',
        top: '30px',
        left: '30px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        color: '#a78bfa',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: '600',
        padding: '8px 18px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '30px',
        zIndex: 10,
        transition: 'all 0.3s ease'
      }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(124, 58, 237, 0.15)';
          e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        }}
      >
        <Home size={16} /> Home
      </Link>

      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '560px',
        padding: '40px 30px',
        borderRadius: '24px',
        background: 'rgba(15, 15, 35, 0.65)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
        textAlign: 'center',
        zIndex: 1,
        animation: 'scaleUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* App Logo */}
        <div style={{
          width: '80px',
          height: '80px',
          margin: '0 auto 20px auto',
          background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
          borderRadius: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(124, 58, 237, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Smartphone size={40} style={{ color: 'white' }} />
        </div>

        {/* App Info */}
        <h1 style={{
          fontSize: '32px',
          fontWeight: '800',
          margin: '0 0 4px 0',
          color: 'white',
          letterSpacing: '-0.5px'
        }}>
          School Connect
        </h1>
        <p style={{
          fontSize: '13px',
          color: '#a78bfa',
          fontWeight: '600',
          margin: '0 0 24px 0',
          background: 'rgba(124, 58, 237, 0.1)',
          padding: '4px 12px',
          borderRadius: '20px',
          display: 'inline-block'
        }}>
          Version 1.0.0
        </p>

        {/* DEVICE DETECTION HEADER STATUS */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '13px',
          color: 'var(--text-secondary)',
          background: 'rgba(255, 255, 255, 0.02)',
          padding: '10px',
          borderRadius: '12px',
          marginBottom: '24px',
          border: '1px solid var(--border)'
        }}>
          {deviceType === 'desktop' && (
            <>
              <Monitor size={16} style={{ color: '#60a5fa' }} />
              <span>Desktop PC Detected — Scan or Download Below</span>
            </>
          )}
          {deviceType === 'android' && (
            <>
              <Smartphone size={16} style={{ color: '#34d399' }} />
              <span>Android Device Detected — Tap to Install Directly</span>
            </>
          )}
          {deviceType === 'ios' && (
            <>
              <Smartphone size={16} style={{ color: '#fb923c' }} />
              <span>iOS / iPhone Detected — Compatibility Note</span>
            </>
          )}
        </div>

        {/* CONDITIONAL DOWNLOAD VIEWS */}
        {deviceType === 'android' && (
          <div style={{ marginBottom: '24px' }}>
            <a
              href="/downloads/schoolconnect.apk"
              download="schoolconnect.apk"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                color: 'white',
                borderRadius: '16px',
                padding: '22px 30px',
                boxShadow: '0 12px 30px rgba(124, 58, 237, 0.4)',
                transition: 'all 0.3s ease',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 18px 36px rgba(124, 58, 237, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(124, 58, 237, 0.4)';
              }}
            >
              <span style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ⬇️ Install APK Directly
              </span>
              <span style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                schoolconnect.apk • File Size: ~45MB
              </span>
            </a>
          </div>
        )}

        {deviceType === 'ios' && (
          <div style={{ marginBottom: '24px', textAlign: 'left' }}>
            <div style={{
              background: 'rgba(249, 115, 22, 0.08)',
              border: '1px solid rgba(249, 115, 22, 0.2)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h4 style={{ color: '#fb923c', margin: '0 0 8px 0', fontSize: '15px', fontWeight: '700' }}>
                ⚠️ iOS Compatibility
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                The mobile package is currently packaged for Android devices (.APK). The Apple iOS version is currently in development. You can still download the APK to your PC or check back later!
              </p>
            </div>
            
            <a
              href="/downloads/schoolconnect.apk"
              download="schoolconnect.apk"
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                textDecoration: 'none',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border)',
                color: 'white',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
            >
              <span>Download APK anyway (45MB)</span>
            </a>
          </div>
        )}

        {deviceType === 'desktop' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            marginBottom: '32px',
            textAlign: 'left'
          }}>
            {/* Direct Download Column */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <h4 style={{ color: 'white', fontSize: '15px', fontWeight: '700', margin: '0 0 8px 0' }}>Download to PC</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5', marginBottom: '16px' }}>
                Download the installer package directly to your computer to run in an Android Emulator or transfer manually.
              </p>
              
              <a
                href="/downloads/schoolconnect.apk"
                download="schoolconnect.apk"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  textDecoration: 'none',
                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                  color: 'white',
                  borderRadius: '12px',
                  padding: '14px 20px',
                  fontSize: '14px',
                  fontWeight: '700',
                  boxShadow: '0 4px 15px rgba(124, 58, 237, 0.2)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span>⬇️ Download APK</span>
              </a>
            </div>

            {/* QR Code Scan Column */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border)',
              padding: '20px',
              borderRadius: '16px',
              textAlign: 'center'
            }}>
              {/* Dynamic QR Code Path representation */}
              <div style={{
                background: 'white',
                padding: '12px',
                borderRadius: '12px',
                marginBottom: '10px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
              }}>
                <svg width="120" height="120" viewBox="0 0 29 29">
                  <path d="M0 0h7v7H0zm2 2v3h3V2zm0 6h1v1H2zm6-8h1v1H8zm1 1v1h1V1zm-1 2h2v1H8zm1 1v1h1V4zm-1 2h1v1H8zm3-6h7v7h-7zm2 2v3h3V2zm-2 6h2v1h-2zm3 0v1h1V8zm2 0h2v1h-2zm-3 1v1h1V9zm2 0h1v1h-1zm2 0v1h1V9zm-5 1h2v1h-2zm3 0h1v1h-1zm1 1v1h1v-1zm1-1h1v1h-1zm1 1v1h1v-1zm1-1h1v1h-1zm1 1v1h1v-1zm1-1h1v1h-1zm1 1v1h1v-1zm-6 2h1v1h-1zm1 0h1v1h-1zm1 0h2v1h-2zm2 0h1v1h-1zm1 0h1v1h-1zm-6 1h2v1h-2zm3 0h1v1h-1zm2 0h1v1h-1zm1 0h2v1h-2zm-9 2h7v7H0zm2 2v3h3V2zm0 6v1h1v-1zm1 0h1v1h-1zm1 0h2v1h-2zm2 0h1v1h-1zm1 0h1v1h-1zm4-6h1v1h-1zm1 0h2v1h-2zm2 0h1v1h-1zm1 0h1v1h-1zm-5 1h1v1h-1zm2 0h1v1h-1zm1 0h2v1h-2zm2 0h1v1h-1zm-6 2h1v1h-1zm1 0h1v1h-1zm1 0h1v1h-1zm2 0h2v1h-2zm1 0h1v1h-1zm-6 1h1v1h-1zm2 0h2v1h-2zm2 0h1v1h-1zm2 0h1v1h-1zm-7 2h2v1h-2zm3 0h1v1h-1zm1 0h1v1h-1zm2 0h1v1h-1zm1 0h1v1h-1zm1 0h1v1h-1zm1 0h1v1h-1zm-9 1h1v1H0zm2 0h1v1H2zm1 0h2v1H3zm2 0h1v1H5zm1 0h1v1H6zm1 0h1v1H7zm1 0h1v1H8zm1 0h2v1H9zm2 0h1v1h-1zm1 0h1v1h-1zm1 0h2v1h-2zm2 0h1v1h-1zm1 0h1v1h-1zm-8 1h1v1h-1zm1 0h1v1h-1zm1 0h1v1h-1zm2 0h2v1h-2zm1 0h1v1h-1zm-6 1h2v1h-2zm3 0h1v1h-1zm2 0h1v1h-1zm1 0h2v1h-2zm1 0h1v1h-1z" fill="#0A0A1B"/>
                </svg>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                Scan to Install on Mobile
              </span>
            </div>
          </div>
        )}

        {/* Warning card */}
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
          textAlign: 'left',
          marginBottom: '32px'
        }}>
          <ShieldAlert size={20} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '13px', color: '#fbbf24', lineHeight: '1.5', fontWeight: '500' }}>
            <strong>Unknown Sources Notice:</strong> To install the app, you may need to open the downloaded APK and toggle <strong>"Allow installation from this source"</strong> or <strong>"Install unknown apps"</strong> under your Android settings.
          </div>
        </div>

        {/* Guide header */}
        <h3 style={{
          fontSize: '18px',
          fontWeight: '700',
          color: 'white',
          textAlign: 'left',
          marginBottom: '20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '8px'
        }}>
          ⚙️ Installation Guide
        </h3>

        {/* Guide Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
          {[
            { step: 1, desc: 'Download the APK file to your device', icon: ArrowDown },
            { step: 2, desc: 'Open the download manager and tap schoolconnect.apk', icon: Smartphone },
            { step: 3, desc: 'Enable "Install from Unknown Sources" if prompted', icon: Settings },
            { step: 4, desc: 'Select Install to proceed with setup', icon: ArrowRight },
            { step: 5, desc: 'Launch School Connect and connect to your dashboard!', icon: Check }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.04)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#7c3aed',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '13px',
                    boxShadow: '0 0 10px rgba(124, 58, 237, 0.3)'
                  }}>
                    {item.step}
                  </div>
                  <span style={{ fontSize: '13px', color: '#d1d5db', fontWeight: '500' }}>
                    {item.desc}
                  </span>
                </div>
                <Icon size={16} style={{ color: '#7c3aed', opacity: 0.8 }} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DownloadPage;

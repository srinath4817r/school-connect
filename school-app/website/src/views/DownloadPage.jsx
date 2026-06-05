import React, { useState, useEffect } from 'react';
import { ArrowDown, Check, Settings, ShieldAlert, Smartphone, ArrowRight, Home, Monitor, QrCode, School, X, Key, Phone, Mail, Building } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const DownloadPage = () => {
  const [deviceType, setDeviceType] = useState('desktop'); // 'desktop', 'android', 'ios'
  const [showContactModal, setShowContactModal] = useState(false);
  const navigate = useNavigate();

  const isNativeApp = /SchoolConnectApp/i.test(navigator.userAgent);

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

        {/* App Title */}
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
          Version 1.0.2
        </p>

        {/* Portal Entry Actions */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '32px',
          borderBottom: isNativeApp ? 'none' : '1px solid rgba(255, 255, 255, 0.06)',
          paddingBottom: isNativeApp ? '0px' : '24px'
        }}>
          <Link to="/login" style={{
            textDecoration: 'none',
            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
            color: 'white',
            borderRadius: '24px',
            padding: '12px 28px',
            fontWeight: '700',
            fontSize: '14px',
            boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)',
            transition: 'all 0.2s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Key size={16} /> Login to Portal
          </Link>
          
          <button onClick={() => setShowContactModal(true)} style={{
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            padding: '12px 28px',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <School size={16} /> Register School
          </button>
        </div>

        {/* Hide App Download content when inside the Native App */}
        {!isNativeApp && (
          <>
            {/* DEVICE DETECTION HEADER STATUS */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '13px',
              color: '#a0aec0',
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '10px',
              borderRadius: '12px',
              marginBottom: '24px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
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
                  <span style={{ fontSize: '18px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <ArrowDown size={18} /> Install APK Directly
                  </span>
                  <span style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                    schoolconnect.apk • File Size: ~96MB
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
                  <h4 style={{ color: '#fb923c', margin: '0 0 8px 0', fontSize: '15px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldAlert size={16} /> iOS Compatibility
                  </h4>
                  <p style={{ color: '#a0aec0', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
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
                    border: '1px solid rgba(255, 255, 255, 0.08)',
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
                  <span>Download APK anyway (96MB)</span>
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
                  <p style={{ color: '#a0aec0', fontSize: '12px', lineHeight: '1.5', marginBottom: '16px' }}>
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
                    <ArrowDown size={14} /> Download APK
                  </a>
                </div>

                {/* QR Code Scan Column */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
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
                  <span style={{ fontSize: '11px', color: '#a0aec0', fontWeight: '600' }}>
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
              paddingBottom: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Settings size={18} /> Installation Guide
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
          </>
        )}
      </div>

      {/* School Onboarding Modal */}
      {showContactModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(3, 3, 10, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
        }} onClick={() => setShowContactModal(false)}>
          <div style={{
            background: 'rgba(15, 15, 35, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '540px',
            padding: '32px',
            position: 'relative',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
            color: '#E0E0E6',
            textAlign: 'left'
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Close Button */}
            <button onClick={() => setShowContactModal(false)} style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'none',
              border: 'none',
              color: '#a0aec0',
              fontSize: '24px',
              cursor: 'pointer',
              transition: 'color 0.2s ease'
            }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#a0aec0'}
            >
              &times;
            </button>

            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'rgba(124, 58, 237, 0.15)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <School size={24} style={{ color: '#a78bfa' }} />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: 'white' }}>
                School Onboarding
              </h3>
            </div>

            {/* Modal Body */}
            <p style={{ fontSize: '14px', color: '#a0aec0', lineHeight: '1.6', marginBottom: '24px' }}>
              To register and set up your school profile on the <strong>School Connect</strong> platform, please contact our onboarding team to obtain your unique <strong>School Registration Secret Code</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <a href="tel:9346022857" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '14px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'background 0.2s ease'
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
              >
                <Phone size={20} style={{ color: '#a78bfa' }} />
                <div>
                  <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: '#718096', margin: '0 0 2px 0', letterSpacing: '0.05em' }}>Call Support</h4>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: 'white', margin: 0 }}>+91 93460 22857</p>
                </div>
              </a>

              <a href="mailto:thinkerslab001@gmail.com?subject=School%20Connect%20Registration%20Request" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '14px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'background 0.2s ease'
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
              >
                <Mail size={20} style={{ color: '#a78bfa' }} />
                <div>
                  <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: '#718096', margin: '0 0 2px 0', letterSpacing: '0.05em' }}>Email Onboarding</h4>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: 'white', margin: 0 }}>thinkerslab001@gmail.com</p>
                </div>
              </a>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '14px',
              }}>
                <Building size={20} style={{ color: '#a78bfa' }} />
                <div>
                  <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: '#718096', margin: '0 0 2px 0', letterSpacing: '0.05em' }}>Head Office</h4>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: 'white', margin: 0 }}>Hyderabad, Telangana, India</p>
                </div>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: '#718096', textAlign: 'center', margin: '0 0 24px 0' }}>
              Our onboarding team is available Monday to Friday from 9:00 AM to 6:00 PM IST.
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <a href="mailto:thinkerslab001@gmail.com?subject=School%20Connect%20Registration%20Request" style={{
                flex: 1,
                textDecoration: 'none',
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                color: 'white',
                borderRadius: '12px',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '700',
                textAlign: 'center',
                boxShadow: '0 4px 15px rgba(124, 58, 237, 0.2)',
                transition: 'transform 0.2s ease'
              }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Request Code
              </a>
              <button onClick={() => setShowContactModal(false)} style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background 0.2s ease'
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default DownloadPage;

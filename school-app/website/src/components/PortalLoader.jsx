import React, { useEffect, useState } from 'react';
import { School, Link2, Users } from 'lucide-react';
import './PortalLoader.css';

const PortalLoader = () => {
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    // Start spinning the link icon slightly after it starts appearing
    // connection line starts at 30%, link flies in at 35% and finishes at 50%
    const timer = setTimeout(() => {
      setIsSpinning(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="portal-loader-overlay">
      <div className="portal-loader-container">
        {/* Logo Stage */}
        <div className="logo-stage">
          {/* Left Node: School */}
          <div className="loader-node loader-node-left">
            <School size={28} />
          </div>

          {/* Connection Line */}
          <div className="loader-connection-line"></div>

          {/* Center Node: Link Icon */}
          <div className={`loader-link-wrapper ${isSpinning ? 'spinning' : ''}`}>
            <Link2 size={18} />
          </div>

          {/* Pulsing Connect Radiator */}
          <div className="loader-pulse-circle"></div>

          {/* Right Node: Community/Users */}
          <div className="loader-node loader-node-right">
            <Users size={28} />
          </div>
        </div>

        {/* Brand Text Reveal */}
        <div className="loader-brand">
          <h1>School Connect</h1>
          <p>Connecting Schools & Communities</p>
        </div>

        {/* Mock Dashboard Preview Skeleton */}
        <div className="loader-dashboard-preview">
          <div className="loader-skeleton-header">
            <div className="loader-skeleton-title"></div>
            <div className="loader-skeleton-avatar"></div>
          </div>
          <div className="loader-skeleton-grid">
            <div className="loader-skeleton-card">
              <div className="loader-skeleton-line loader-skeleton-line-md"></div>
              <div className="loader-skeleton-line loader-skeleton-line-sm"></div>
              <div style={{ marginTop: 'auto' }} className="loader-skeleton-line loader-skeleton-line-sm"></div>
            </div>
            <div className="loader-skeleton-card">
              <div className="loader-skeleton-line loader-skeleton-line-md"></div>
              <div className="loader-skeleton-line loader-skeleton-line-sm"></div>
              <div style={{ marginTop: 'auto' }} className="loader-skeleton-line loader-skeleton-line-sm"></div>
            </div>
            <div className="loader-skeleton-card">
              <div className="loader-skeleton-line loader-skeleton-line-md"></div>
              <div className="loader-skeleton-line loader-skeleton-line-sm"></div>
              <div style={{ marginTop: 'auto' }} className="loader-skeleton-line loader-skeleton-line-sm"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalLoader;

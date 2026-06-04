import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const InteractiveMapSelectorModal = ({ isOpen, onClose, onSelect, initialLat, initialLng }) => {
  const [selectedCoords, setSelectedCoords] = useState(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapContainerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const L = window.L;
    if (!L) return;

    const defaultLat = parseFloat(initialLat) || 17.427595;
    const defaultLng = parseFloat(initialLng) || 78.324766;

    const timer = setTimeout(() => {
      try {
        if (!mapContainerRef.current) return;
        const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 13);
        mapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        if (parseFloat(initialLat) && parseFloat(initialLng)) {
          const initialMarker = L.marker([defaultLat, defaultLng]).addTo(map);
          markerRef.current = initialMarker;
          setSelectedCoords({ lat: defaultLat, lng: defaultLng });
        }

        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          setSelectedCoords({ lat, lng });

          if (markerRef.current) {
            markerRef.current.setLatLng(e.latlng);
          } else {
            markerRef.current = L.marker(e.latlng).addTo(map);
          }
        });
      } catch (err) {
        console.error('Failed to init selector map', err);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.off();
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isOpen, initialLat, initialLng]);

  if (!isOpen) return null;

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
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      padding: '40px 10px',
      zIndex: 11000,
      animation: 'fadeIn 0.2s ease'
    }}>
      <div className="glass-card" style={{
        width: '90%',
        maxWidth: '600px',
        padding: '24px',
        border: '1px solid var(--border)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
        animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        margin: '0 auto 40px auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '18px', fontFamily: 'var(--font-title)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
            <span>📍</span> Select Home Location
          </h3>
          <button 
            type="button"
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
          Click anywhere on the map to set your location coordinates.
        </p>

        <div ref={mapContainerRef} style={{ width: '100%', height: '320px', borderRadius: '8px', background: '#0e0e1b', border: '1px solid var(--border)', zIndex: 1 }}></div>

        {selectedCoords && (
          <div style={{ fontSize: '12px', color: 'var(--accent)', background: 'var(--accent-glow)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(168,85,247,0.2)' }}>
            <strong>Selected Coordinates:</strong> {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button 
            type="button" 
            onClick={onClose} 
            className="code-action-btn"
            style={{ margin: 0, padding: '10px 20px' }}
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={() => {
              if (selectedCoords) {
                onSelect(selectedCoords.lat, selectedCoords.lng);
                onClose();
              }
            }}
            disabled={!selectedCoords}
            className="dashboard-btn-primary"
            style={{ margin: 0, padding: '10px 20px', background: 'var(--accent)', opacity: selectedCoords ? 1 : 0.5, cursor: selectedCoords ? 'pointer' : 'not-allowed' }}
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default InteractiveMapSelectorModal;

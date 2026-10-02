'use client';

import React from 'react';
import { Hammer } from 'lucide-react';

export const TacticalMapView: React.FC = () => {
  return (
    <div
      className="hud-bg-grid"
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#050508',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div className="float-bob">
        <Hammer size={48} color="var(--color-amber-primary)" style={{ marginBottom: '24px', opacity: 0.8 }} />
      </div>
      <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', border: '1px solid rgba(245, 158, 11, 0.1)', opacity: 0.3 }} className="radar-sweep">
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: '50%', height: '2px', background: 'linear-gradient(to right, rgba(245, 158, 11, 0.6), transparent)', transformOrigin: 'left center' }} />
      </div>
      <span
        className="holo-flicker"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '18px',
          fontWeight: 800,
          letterSpacing: '0.2em',
          color: 'var(--color-amber-primary)',
          textTransform: 'uppercase',
          marginBottom: '8px'
        }}
      >
        Em Desenvolvimento
      </span>
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '14px',
          color: 'var(--text-muted)',
          maxWidth: '400px',
          textAlign: 'center',
          lineHeight: '1.6'
        }}
      >
        O Mapa Tático está sendo redesenhado. Voltaremos a construí-lo em sua totalidade no futuro.
      </span>
    </div>
  );
};

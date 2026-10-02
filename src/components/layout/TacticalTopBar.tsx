'use client';

import React, { useState } from 'react';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { tacticalAudio } from '@/lib/audio';
import { Volume2, VolumeX, Globe, Radio } from 'lucide-react';

export const TacticalTopBar: React.FC = () => {
  const { locale, toggleLocale, dict } = useLocaleStore();
  const [isMuted, setIsMuted] = useState(false);
  const toggleMute = () => {
    const next = !isMuted;
    tacticalAudio.setMuted(next);
    setIsMuted(next);
  };

  const handleAudioToggle = () => {
    toggleMute();
    if (isMuted) {
      tacticalAudio.playSelect();
    }
  };

  const handleLocaleToggle = () => {
    toggleLocale();
    tacticalAudio.playSelect();
  };

  return (
    <header
      className="topbar-enter"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '48px',
        background: 'rgba(7, 7, 9, 0.92)',
        borderBottom: 'var(--border-subtle)',
        backdropFilter: 'blur(12px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}
    >
      {/* Left: System Status & Coordinates */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="hud-beacon-live" />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: 'var(--color-red-primary)',
            }}
          >
            {dict.system.title}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
            }}
          >
            [{dict.system.version}]
          </span>
        </div>

        <div
          style={{
            height: '14px',
            width: '1px',
            background: 'rgba(255, 255, 255, 0.1)',
          }}
        />

        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.08em',
            color: 'var(--text-secondary)',
          }}
        >
          {dict.system.campaign} <span style={{ color: 'var(--text-muted)' }}>//</span>{' '}
          {dict.system.sector}
        </div>
      </div>

      {/* Right: Audio, Locale, Latency Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Audio Mute/Unmute */}
        <button
          type="button"
          onClick={handleAudioToggle}
          title={isMuted ? dict.system.audio_off : dict.system.audio_on}
          className="hud-btn hud-btn-ghost"
          style={{ padding: '4px 10px', fontSize: '10px' }}
        >
          {isMuted ? <VolumeX size={14} color="#ef4444" /> : <Volume2 size={14} color="#22c55e" />}
          <span>{isMuted ? 'MUTE' : 'SFX'}</span>
        </button>

        {/* Locale Toggle */}
        <button
          type="button"
          onClick={handleLocaleToggle}
          className="hud-btn hud-btn-ghost"
          style={{ padding: '4px 10px', fontSize: '10px' }}
        >
          <Globe size={14} />
          <span>{locale.toUpperCase()}</span>
        </button>

        {/* Latency / Link Beacon */}
        <div className="hud-badge hud-badge-neutral" style={{ gap: '6px' }}>
          <Radio size={12} color="#22c55e" />
          <span>24ms</span>
        </div>
      </div>
    </header>
  );
};

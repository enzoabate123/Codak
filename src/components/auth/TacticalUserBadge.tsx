'use client';

import React from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { tacticalAudio } from '@/lib/audio';
import { Shield, User, LogOut } from 'lucide-react';

export const TacticalUserBadge: React.FC = () => {
  const { user, logout } = useAuthStore();
  if (!user) return null;

  const handleLogout = () => {
    tacticalAudio.playAlert();
    logout();
  };

  const isAdmin = user.role === 'admin';

  return (
    <div
      className="badge-enter"
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(12, 10, 16, 0.88)',
        border: `1px solid ${isAdmin ? 'rgba(239, 68, 68, 0.4)' : 'rgba(6, 182, 212, 0.4)'}`,
        backdropFilter: 'blur(10px)',
        padding: '4px 8px 4px 10px',
        borderRadius: '2px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {isAdmin ? (
          <Shield size={12} color="var(--color-red-primary)" />
        ) : (
          <User size={12} color="var(--color-cyan-primary)" />
        )}
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            color: '#fff',
            maxWidth: '140px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {user.displayName || user.username}
        </span>
        <span
          className={`hud-badge ${isAdmin ? 'hud-badge-red' : 'hud-badge-cyan'}`}
          style={{ fontSize: '9px', padding: '1px 5px' }}
        >
          {isAdmin ? 'MESTRE' : 'OPERADOR'}
        </span>
      </div>

      <div style={{ width: '1px', height: '14px', background: 'rgba(255, 255, 255, 0.15)' }} />

      <button
        type="button"
        onClick={handleLogout}
        className="hud-btn hud-btn-ghost"
        style={{
          padding: '2px 6px',
          fontSize: '10px',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
        title="Desconectar Operador (Logout)"
      >
        <LogOut size={11} />
        <span>SAIR</span>
      </button>
    </div>
  );
};

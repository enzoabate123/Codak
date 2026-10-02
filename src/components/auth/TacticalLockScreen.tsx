'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { tacticalAudio } from '@/lib/audio';
import { UserPlus, LogIn, AlertTriangle, KeyRound, Terminal } from 'lucide-react';

export const TacticalLockScreen: React.FC = () => {
  const { login, register, isLoading, error, clearError } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (mode === 'login') {
      const ok = await login(username, password);
      if (ok) {
        tacticalAudio.playSelect();
      } else {
        tacticalAudio.playAlert();
      }
    } else {
      const ok = await register(username, displayName, password);
      if (ok) {
        tacticalAudio.playSelect();
      } else {
        tacticalAudio.playAlert();
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, rgba(16, 12, 20, 0.98) 0%, rgba(5, 5, 8, 1) 100%)',
        padding: '24px',
        gap: '40px',
        animation: 'tactical-fade-in 1s cubic-bezier(0.2, 0, 0, 1)',
      }}
    >
      <style>
        {`
          @keyframes tactical-fade-in {
            0% { opacity: 0; transform: scale(1.05); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}
      </style>
      
      {/* Scanline overlay */}
      <div className="hud-scanline-overlay" />

      {/* Massive Logo taking up ~half the screen height */}
      <div
        style={{
          width: '45vh',
          height: '45vh',
          maxWidth: '80vw',
          maxHeight: '80vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
          filter: 'drop-shadow(0 0 40px rgba(239, 68, 68, 0.25))',
        }}
      >
        <img 
          src="/images/logo.png" 
          alt="CODAK Logo" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
        />
      </div>

      {/* Lockscreen Terminal Window - Clean layout */}
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Mode Switcher Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            padding: '4px',
            gap: '4px',
            borderRadius: '4px',
          }}
        >
          <button
            type="button"
            className="hud-btn"
            style={{
              padding: '8px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: mode === 'login' ? 'var(--color-red-primary)' : 'transparent',
              color: mode === 'login' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              fontWeight: mode === 'login' ? 800 : 600,
              borderRadius: '2px',
            }}
            onClick={() => {
              setMode('login');
              clearError();
              tacticalAudio.playSelect();
            }}
          >
            <LogIn size={13} />
            <span>ENTRAR</span>
          </button>

          <button
            type="button"
            className="hud-btn"
            style={{
              padding: '8px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: mode === 'register' ? 'var(--color-amber-primary)' : 'transparent',
              color: mode === 'register' ? '#000' : 'var(--text-muted)',
              border: 'none',
              fontWeight: mode === 'register' ? 800 : 600,
              borderRadius: '2px',
            }}
            onClick={() => {
              setMode('register');
              clearError();
              tacticalAudio.playSelect();
            }}
          >
            <UserPlus size={13} />
            <span>NOVO OPERADOR</span>
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                background: 'rgba(239, 68, 68, 0.15)',
                borderLeft: '3px solid var(--color-red-primary)',
                color: '#fca5a5',
                fontSize: '11.5px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <AlertTriangle size={15} color="#ef4444" style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: 'var(--color-amber-primary)',
                  marginBottom: '6px',
                  letterSpacing: '0.05em',
                }}
              >
                CALLSIGN / NOME DE EXIBIÇÃO:
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex: Ghost, Capitão Shepard..."
                className="hud-input"
                style={{ width: '100%', padding: '10px 14px', fontSize: '13px', fontFamily: 'var(--font-mono)', background: 'rgba(10, 10, 14, 0.6)' }}
                required
              />
            </div>
          )}

          <div>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--text-muted)',
                marginBottom: '6px',
                letterSpacing: '0.05em',
              }}
            >
              IDENTIFICADOR / USUÁRIO:
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nome de usuário..."
              className="hud-input"
              style={{ width: '100%', padding: '10px 14px', fontSize: '13px', fontFamily: 'var(--font-mono)', background: 'rgba(10, 10, 14, 0.6)' }}
              autoFocus
              required
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--text-muted)',
                marginBottom: '6px',
                letterSpacing: '0.05em',
              }}
            >
              SENHA DE ACESSO:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="hud-input"
              style={{ width: '100%', padding: '10px 14px', fontSize: '13px', fontFamily: 'var(--font-mono)', background: 'rgba(10, 10, 14, 0.6)' }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`hud-btn ${mode === 'login' ? 'hud-btn-primary' : 'hud-btn-amber'}`}
            style={{
              padding: '12px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '6px',
            }}
          >
            {isLoading ? (
              <span>AUTENTICANDO...</span>
            ) : mode === 'login' ? (
              <>
                <KeyRound size={15} />
                <span>CONFIRMAR ACESSO OPERACIONAL</span>
              </>
            ) : (
              <>
                <UserPlus size={15} />
                <span>CADASTRAR E AUTORIZAR ACESSO</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Quick Info */}
        <div
          style={{
            marginTop: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '9.5px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Terminal size={10} color="#ef4444" />
            <span>SISTEMA DE AUTENTICAÇÃO CODAK</span>
          </div>
          <span style={{ color: 'var(--color-green-primary)' }}>ONLINE</span>
        </div>
      </div>
    </div>
  );
};

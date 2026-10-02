'use client';

import React from 'react';
import { useMapStore, GridType, GridScaleMeters } from '@/stores/useMapStore';
import { tacticalAudio } from '@/lib/audio';
import { Grid, Eye, EyeOff, ZoomIn, ZoomOut, Maximize2, UserPlus, Skull } from 'lucide-react';

export const TacticalMapControls: React.FC = () => {
  const {
    gridType,
    cellMeters,
    gridVisible,
    fogEnabled,
    stageScale,
    setGridType,
    setCellMeters,
    toggleGridVisible,
    toggleFog,
    setStageScale,
    setStagePos,
    addToken,
  } = useMapStore();
  const handleZoom = (delta: number) => {
    setStageScale(stageScale + delta);
    tacticalAudio.playSelect();
  };

  const handleResetView = () => {
    setStageScale(1.0);
    setStagePos({ x: 0, y: 0 });
    tacticalAudio.playSelect();
  };

  const handleAddHostile = () => {
    addToken({
      name: `Hostile Incursor #${Math.floor(Math.random() * 90 + 10)}`,
      code: 'HI',
      type: 'hostile',
      x: 700 + Math.random() * 200,
      y: 250 + Math.random() * 200,
      sizeInCells: 1,
      color: '#ef4444',
      hpCurrent: 35,
      hpMax: 35,
      armorClass: 14,
      speedMeters: 9,
      equippedWeaponId: 'mp5',
      elevation: 0,
    });
    tacticalAudio.playSelect();
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '64px',
        left: '100px',
        right: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 30,
        pointerEvents: 'none',
      }}
    >
      {/* Left: Sector Info & Scale */}
      <div
        className="hud-panel-chamfer"
        style={{
          padding: '8px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          pointerEvents: 'auto',
          background: 'rgba(10, 10, 14, 0.95)',
        }}
      >
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)' }}>
            TACTICAL GRID
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 800, color: '#fff' }}>
            SECTOR ZERO // CITADEL RUINS
          </div>
        </div>

        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />

        {/* Grid Scale Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
            SCALE:
          </span>
          {([1.5, 2.0, 3.0] as GridScaleMeters[]).map((scale) => (
            <button
              key={scale}
              type="button"
              className={`hud-btn ${cellMeters === scale ? 'hud-btn-amber' : 'hud-btn-ghost'}`}
              style={{ padding: '3px 8px', fontSize: '10px' }}
              onClick={() => {
                setCellMeters(scale);
                tacticalAudio.playSelect();
              }}
              onMouseEnter={() => tacticalAudio.playHover()}
            >
              {scale}m
            </button>
          ))}
        </div>
      </div>

      {/* Right: Grid Type, Fog, Zoom & Token Spawner */}
      <div
        className="hud-panel"
        style={{
          padding: '6px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          pointerEvents: 'auto',
          background: 'rgba(10, 10, 14, 0.95)',
        }}
      >
        {/* Grid Type (Square / Hex) */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            className={`hud-btn ${gridType === 'square' ? 'hud-btn-primary' : 'hud-btn-ghost'}`}
            style={{ padding: '4px 8px', fontSize: '10px' }}
            onClick={() => {
              setGridType('square');
              tacticalAudio.playSelect();
            }}
          >
            QUADRADO
          </button>
          <button
            type="button"
            className={`hud-btn ${gridType === 'hex' ? 'hud-btn-primary' : 'hud-btn-ghost'}`}
            style={{ padding: '4px 8px', fontSize: '10px' }}
            onClick={() => {
              setGridType('hex');
              tacticalAudio.playSelect();
            }}
          >
            HEXAGONAL
          </button>
        </div>

        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }} />

        {/* Fog of War Toggle */}
        <button
          type="button"
          className={`hud-btn ${fogEnabled ? 'hud-btn-amber' : 'hud-btn-ghost'}`}
          style={{ padding: '4px 10px', fontSize: '10px' }}
          onClick={() => {
            toggleFog();
            tacticalAudio.playSelect();
          }}
          title="Alternar Névoa de Guerra (Fog of War)"
        >
          {fogEnabled ? <EyeOff size={13} /> : <Eye size={13} />}
          <span>FOG: {fogEnabled ? 'ON' : 'OFF'}</span>
        </button>

        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }} />

        {/* Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            className="hud-btn hud-btn-ghost"
            style={{ padding: '4px' }}
            onClick={() => handleZoom(-0.15)}
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', minWidth: '36px', textAlign: 'center' }}>
            {Math.round(stageScale * 100)}%
          </span>
          <button
            type="button"
            className="hud-btn hud-btn-ghost"
            style={{ padding: '4px' }}
            onClick={() => handleZoom(0.15)}
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            type="button"
            className="hud-btn hud-btn-ghost"
            style={{ padding: '4px' }}
            onClick={handleResetView}
            title="Resetar Zoom 1:1"
          >
            <Maximize2 size={13} />
          </button>
        </div>

        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }} />

        {/* Add Hostile Spawn Button */}
        <button
          type="button"
          className="hud-btn hud-btn-primary"
          style={{ padding: '4px 10px', fontSize: '10px' }}
          onClick={handleAddHostile}
          title="Spawnar Inimigo Hostil"
        >
          <Skull size={13} />
          <span>+ INIMIGO</span>
        </button>
      </div>
    </div>
  );
};

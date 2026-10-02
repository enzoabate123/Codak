'use client';

import React from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { BreadcrumbStep } from '@/types/grimoire';
import { tacticalAudio } from '@/lib/audio';

interface GrimoireBreadcrumbProps {
  steps: BreadcrumbStep[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNavigateToStep: (step: BreadcrumbStep, index: number) => void;
  onCloseAll: () => void;
}

export function GrimoireBreadcrumb({
  steps,
  searchQuery,
  onSearchChange,
  onNavigateToStep,
  onCloseAll,
}: GrimoireBreadcrumbProps) {
  return (
    <div
      className="grimoire-breadcrumb-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.5rem 1rem',
        borderBottom: 'var(--border-subtle)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.85rem',
      }}
    >
      {/* LEFT: Breadcrumb segments */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            const isFirst = index === 0;
            // The first item (GRIMÓRIO) is not clickable if it's the only one
            const isClickable = !isLast && !(isFirst && steps.length === 1);

            return (
              <React.Fragment key={`${step.label}-${index}`}>
                {index > 0 && (
                  <span
                    className="grimoire-breadcrumb-separator"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    &gt;
                  </span>
                )}
                <span
                  className={
                    isLast
                      ? 'grimoire-breadcrumb-segment--active'
                      : 'grimoire-breadcrumb-segment'
                  }
                  onClick={() => {
                    if (isClickable) {
                      tacticalAudio.playSelect();
                      onNavigateToStep(step, index);
                    }
                  }}
                  onMouseEnter={() => {
                    if (isClickable) tacticalAudio.playHover();
                  }}
                  style={{
                    color: isLast
                      ? 'var(--color-red-primary)'
                      : isClickable
                      ? 'var(--color-amber-primary)'
                      : 'var(--text-secondary)',
                    cursor: isClickable ? 'pointer' : 'default',
                    textTransform: 'uppercase',
                    transition: 'color var(--transition-fast)',
                    fontWeight: isLast ? 'bold' : 'normal',
                  }}
                  onMouseOver={(e) => {
                    if (isClickable) {
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isClickable) {
                      e.currentTarget.style.color = 'var(--color-amber-primary)';
                    }
                  }}
                >
                  {step.label}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Search input */}
      <div style={{ position: 'relative', width: '200px' }}>
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: '0.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Pesquisar..."
          style={{
            width: '100%',
            backgroundColor: 'var(--surface-3)',
            border: 'var(--border-subtle)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            padding: '0.25rem 0.5rem 0.25rem 2rem',
            outline: 'none',
            transition: 'border-color var(--transition-fast)',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--color-amber-primary)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border-subtle)';
          }}
        />
      </div>
    </div>
  );
}

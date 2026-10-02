import React from 'react';

export const InternalLoader: React.FC<{ type?: 'circle' | 'triangle' | 'rect', color?: string }> = ({ type = 'triangle', color = 'var(--color-cyan-primary)' }) => {
  return (
    <div className={`codak-loader ${type === 'triangle' ? 'triangle' : ''}`} style={{ '--dot': color } as React.CSSProperties}>
      <svg viewBox={type === 'triangle' ? '0 0 86 80' : '0 0 80 80'}>
        {type === 'circle' && <circle id="test" cx="40" cy="40" r="32"></circle>}
        {type === 'triangle' && <polygon points="43 8 79 72 7 72"></polygon>}
        {type === 'rect' && <rect x="8" y="8" width="64" height="64"></rect>}
      </svg>
    </div>
  );
};

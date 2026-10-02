const fs = require('fs');
let code = fs.readFileSync('src/components/layout/TacticalAppShell.tsx', 'utf-8');

const targetGrid = \`      {/* Grid Overlay */}
      {mounted && (
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
            backgroundColor: 'rgba(8, 8, 12, 0.45)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 0,
          }}
        />
      )}\`;

const replaceGlass = \`      {/* Glassmorphism Overlay to darken and blur the background */}
      {mounted && backgroundImage && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(8, 8, 12, 0.45)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 0,
          }}
        />
      )}\`;

code = code.replace(targetGrid, replaceGlass);

const targetMainDiv = \`<div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', background: '#050505' }}>\`;
const replaceMainDiv = \`<div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: 'var(--surface-bg)',
      }}
    >\`;

code = code.replace(targetMainDiv, replaceMainDiv);

const targetDynamicBg = \`      {/* Dynamic Background */}
      {backgroundImage && mounted && (
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: \\\`url(\\\${backgroundImage})\\\`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.15, // Keep it subtle so it doesn't distract from UI
            zIndex: 0,
            mixBlendMode: 'luminosity', // Tactical feel
          }}
        />
      )}\`;

const replaceDynamicBg = \`      {/* Background Image Layer */}
      {mounted && backgroundImage && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: \\\`url(\\\${backgroundImage})\\\`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            zIndex: 0,
          }}
        />
      )}\`;

code = code.replace(targetDynamicBg, replaceDynamicBg);

fs.writeFileSync('src/components/layout/TacticalAppShell.tsx', code);

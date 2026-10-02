const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminView.tsx', 'utf-8');

// Root div to edge-to-edge
code = code.replace(
  `      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 24px 24px 24px',
        overflow: 'hidden',
        gap: '14px',
      }}`,
  `      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}`
);

// Header Bar from chamfer to unified top bar
code = code.replace(
  `      {/* Header Bar */}
      <div
        className="hud-panel-chamfer"
        style={{
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >`,
  `      {/* Header Bar */}
      <div
        style={{
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'rgba(8, 8, 12, 0.65)',
          borderBottom: 'var(--border-subtle)',
          flexShrink: 0
        }}
      >`
);

// Tabs - wrap in a sidebar-like or just full width? 
// In Admin, tabs are horizontal. Let's make them part of the header or just below it with a unified background.
code = code.replace(
  `      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', flexShrink: 0, paddingBottom: '4px' }}>`,
  `      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', flexShrink: 0, padding: '12px 24px', background: 'rgba(8, 8, 12, 0.45)', borderBottom: 'var(--border-subtle)' }}>`
);

// Main content area - from hud-panel to grimoire-content-panel
code = code.replace(
  `      {/* Main Content Area by Tab */}
      <div
        className="hud-panel"
        style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 20px',
          background: 'rgba(8, 8, 12, 0.95)',
        }}
      >`,
  `      {/* Main Content Area by Tab */}
      <div
        className="grimoire-content-panel"
        style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
        }}
      >`
);

fs.writeFileSync('src/components/admin/AdminView.tsx', code);

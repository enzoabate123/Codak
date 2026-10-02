const fs = require('fs');
let code = fs.readFileSync('src/components/views/ShopView.tsx', 'utf-8');

// Replace the root div to edge-to-edge
code = code.replace(
  `  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px', boxSizing: 'border-box' }}>`,
  `  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>`
);

// Replace the header to look like a full-width top bar (similar to breadcrumb bar)
code = code.replace(
  `      {/* Header */}
      <div className="hud-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>`,
  `      {/* Header */}
      <div style={{ 
        padding: '12px 24px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        background: 'rgba(8, 8, 12, 0.65)',
        borderBottom: 'var(--border-subtle)',
        flexShrink: 0
      }}>`
);

// Remove the gap and add grimoire layout to the main flex
code = code.replace(
  `      <div style={{ display: 'flex', flex: 1, gap: '24px', overflow: 'hidden' }}>`,
  `      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>`
);

// Remove the hud-panel from sidebar wrapper (GrimoireSidebar already has its own styling)
code = code.replace(
  `        {/* Sidebar */}
        <div className="hud-panel" style={{ width: '280px', display: 'flex', flexDirection: 'column' }}>
          <GrimoireSidebar`,
  `        {/* Sidebar */}
        <div style={{ width: '280px', display: 'flex', flexDirection: 'column', borderRight: 'var(--border-subtle)', background: 'rgba(8, 8, 12, 0.45)' }}>
          <GrimoireSidebar`
);

// Replace the content panel to use grimoire-content-panel class
code = code.replace(
  `        {/* Content Panel */}
        <div className="hud-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px' }}>`,
  `        {/* Content Panel */}
        <div className="grimoire-content-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 24px', position: 'relative' }}>`
);

// Cart Footer - make it a fixed bar at the bottom of the content panel
code = code.replace(
  `      {/* Cart Footer */}
      <div className="hud-panel" style={{ marginTop: '24px', padding: '16px', display: 'flex', gap: '24px', alignItems: 'center' }}>`,
  `      {/* Cart Footer */}
      <div style={{ 
        marginTop: 'auto', 
        padding: '16px', 
        display: 'flex', 
        gap: '24px', 
        alignItems: 'center',
        background: 'rgba(16, 16, 22, 0.95)',
        borderTop: '1px solid var(--color-amber-primary)',
        boxShadow: '0 -10px 30px rgba(0,0,0,0.5)',
        borderRadius: '4px',
        margin: '16px 0 0 0'
      }}>`
);

fs.writeFileSync('src/components/views/ShopView.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/components/views/ShopView.tsx', 'utf-8');

// Replace the main card div
code = code.replace(
  `      <div \n        className="hud-panel-chamfer"\n        style={{ \n          padding: '12px', \n          display: 'flex', \n          flexDirection: 'column', \n          gap: '8px', \n          cursor: 'pointer', \n          transition: 'all 0.2s',\n          minHeight: '110px',\n          border: isHovered ? '1px solid var(--color-amber-primary)' : '1px solid transparent',\n          boxShadow: isHovered ? '0 0 15px rgba(245, 158, 11, 0.15)' : 'none',\n        }}`,
  `      <div \n        style={{ \n          background: 'rgba(16, 16, 22, 1)',\n          padding: '12px', \n          display: 'flex', \n          flexDirection: 'column', \n          gap: '8px', \n          cursor: 'pointer', \n          transition: 'all 0.2s',\n          minHeight: '110px',\n          border: isHovered ? '1px solid var(--color-amber-primary)' : '1px solid rgba(255,255,255,0.05)',\n          borderBottom: isHovered ? 'none' : '1px solid rgba(255,255,255,0.05)',\n          boxShadow: isHovered ? '0 -4px 15px rgba(245, 158, 11, 0.15)' : 'none',\n        }}`
);

// Replace the hover card div
code = code.replace(
  `      {/* Expanded Hover Details */}\n      {isHovered && (\n        <div className="hover-card-enter" style={{\n          position: 'absolute',\n          top: '95%',\n          left: '2px',\n          right: '2px',\n          background: 'var(--surface-card)',\n          border: '1px solid var(--color-amber-primary)',\n          borderTop: 'none',\n          padding: '12px',\n          paddingTop: '16px',\n          zIndex: 20,\n          borderBottomLeftRadius: '4px',\n          borderBottomRightRadius: '4px',\n          boxShadow: '0 10px 20px rgba(0,0,0,0.8)',\n          display: 'flex',\n          flexDirection: 'column',\n          gap: '8px',\n          pointerEvents: 'none'\n        }}>`,
  `      {/* Expanded Hover Details */}\n      {isHovered && (\n        <div className="hover-card-enter" style={{\n          position: 'absolute',\n          top: '100%',\n          left: 0,\n          right: 0,\n          background: 'rgba(16, 16, 22, 1)',\n          border: '1px solid var(--color-amber-primary)',\n          borderTop: 'none',\n          padding: '12px',\n          paddingTop: '8px',\n          zIndex: 20,\n          boxShadow: '0 15px 20px rgba(0,0,0,0.9), 0 10px 15px rgba(245, 158, 11, 0.15)',\n          display: 'flex',\n          flexDirection: 'column',\n          gap: '8px',\n          pointerEvents: 'none'\n        }}>`
);

code = code.replace(
  `Tipo: {item.data.type?.toUpperCase()} | Tamanho: {item.data.size?.toUpperCase()}`,
  `Tipo: <span style={{color: '#fff'}}>{item.data.type?.toUpperCase()}</span> | Tamanho: <span style={{color: '#fff'}}>{item.data.size?.toUpperCase()}</span>`
);

code = code.replace(
  `<div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Tipo: `,
  `<div style={{ fontSize: '10px', color: '#a1a1aa' }}>Tipo: `
);

fs.writeFileSync('src/components/views/ShopView.tsx', code);

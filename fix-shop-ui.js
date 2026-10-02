const fs = require('fs');
let code = fs.readFileSync('src/components/views/ShopView.tsx', 'utf-8');

// 1. Remove limit from cart UI and allow infinite horizontal scroll
const oldCartUI = /<div style=\{\{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat\(10, 1fr\)', gap: '8px' \}\}>[\s\S]*?<\/div>\s*<div style=\{\{ width: '200px', display: 'flex', flexDirection: 'column', gap: '8px' \}\}>/;

const newCartUI = `<div style={{ flex: 1, display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '4px' }}>
          {cart.map((cItem, idx) => (
            <div 
              key={idx}
              style={{ 
                minWidth: '60px',
                aspectRatio: '1', 
                border: '1px solid var(--color-cyan-primary)',
                background: 'rgba(0,0,0,0.5)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative'
              }}
              onClick={() => removeFromCart(idx)}
            >
              <div style={{ fontSize: '10px', color: '#fff', textAlign: 'center', wordBreak: 'break-word', padding: '2px' }}>{cItem.name.substring(0, 12)}</div>
              <div style={{ fontSize: '10px', color: 'var(--color-amber-primary)' }}>₵ {cItem.price}</div>
              <div className="cart-remove-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(239, 68, 68, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.2s' }}>
                <Trash2 size={16} color="#000" />
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              Nenhum item no carrinho
            </div>
          )}
        </div>

        <div style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>`;

code = code.replace(oldCartUI, newCartUI);

// Remove the "cart.length / 10" text
code = code.replace(
  /<div style=\{\{ fontSize: '18px', color: '#fff' \}\}>\{cart\.length\}\/10<\/div>/g,
  `<div style={{ fontSize: '18px', color: '#fff' }}>{cart.length} ITENS</div>`
);

// 2. Change backgrounds
code = code.replace(/background: 'rgba\(16, 16, 22, 1\)'/g, "background: 'transparent'"); // Card and Popup
code = code.replace(/background: 'rgba\(16, 16, 22, 0\.95\)'/g, "background: 'transparent'"); // Footer
code = code.replace(/background: 'rgba\(8, 8, 12, 0\.65\)'/g, "background: 'transparent'"); // Header

// Give the popup a dark background so it doesn't overlap unreadably
code = code.replace(
  /className="hover-card-enter" style=\{\{\n\s*position: 'absolute',\n\s*top: '100%',\n\s*left: 0,\n\s*right: 0,\n\s*background: 'transparent',/g,
  `className="hover-card-enter" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'rgba(0,0,0,0.95)',`
);

fs.writeFileSync('src/components/views/ShopView.tsx', code);
console.log("Updated Shop UI");

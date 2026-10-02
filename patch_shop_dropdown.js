const fs = require('fs');
let c = fs.readFileSync('src/components/views/ShopView.tsx', 'utf8');

const itemCardComponent = `
const ShopItemCard = ({ item, compat, addToCart }: { item: any, compat: boolean, addToCart: (item: any) => void }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Extrair info rapida
  let quickInfo = '';
  if (item.type === 'weapon') quickInfo = \`Dano: \${item.data.baseDamage} | Mun: \${item.data.ammoCapacity}\`;
  else if (item.type === 'attachment') quickInfo = item.data.effect?.substring(0, 40) + (item.data.effect?.length > 40 ? '...' : '');
  else if (item.data.summary) quickInfo = item.data.summary.replace(/Preço: \\d+ \\| /, '').substring(0, 45) + '...';
  else quickInfo = item.category.toUpperCase();

  return (
    <div 
      style={{ position: 'relative', zIndex: isHovered ? 10 : 1 }}
      onMouseEnter={() => { tacticalAudio.playHover(); setIsHovered(true); }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className="hud-panel-chamfer"
        style={{ 
          padding: '12px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px', 
          cursor: 'pointer', 
          transition: 'all 0.2s',
          minHeight: '110px',
          border: isHovered ? '1px solid var(--color-amber-primary)' : '1px solid transparent',
          boxShadow: isHovered ? '0 0 15px rgba(245, 158, 11, 0.15)' : 'none',
        }}
        onClick={() => addToCart({ catalogId: item.data.id || item.data.type, name: item.name, price: item.price, type: item.type, data: item.data })}
      >
        <div style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>{item.name}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--color-amber-primary)' }}>₵ {item.price.toLocaleString()}</div>
        
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          {quickInfo}
        </div>

        {!compat && (
          <div style={{ background: 'var(--color-red-primary)', color: '#000', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold', borderRadius: '2px', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content', marginTop: 'auto' }}>
            <AlertTriangle size={10} /> INCOMPATÍVEL
          </div>
        )}
      </div>

      {/* Expanded Hover Details */}
      {isHovered && (
        <div style={{
          position: 'absolute',
          top: '95%',
          left: '2px',
          right: '2px',
          background: 'var(--surface-card)',
          border: '1px solid var(--color-amber-primary)',
          borderTop: 'none',
          padding: '12px',
          paddingTop: '16px',
          zIndex: 20,
          borderBottomLeftRadius: '4px',
          borderBottomRightRadius: '4px',
          boxShadow: '0 10px 20px rgba(0,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          pointerEvents: 'none'
        }}>
          {item.type === 'weapon' && (
            <>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Tipo: {item.data.type?.toUpperCase()} | Tamanho: {item.data.size?.toUpperCase()}</div>
              {item.data.sweetSpotBonusDamage && <div style={{ fontSize: '10px', color: 'var(--color-red-primary)' }}>Sweet Spot: {item.data.sweetSpotBonusDamage} ({item.data.sweetSpot}m)</div>}
              {item.data.modes && <div style={{ fontSize: '10px', color: 'var(--color-cyan-primary)' }}>Modos: {item.data.modes.join(', ')}</div>}
            </>
          )}
          {item.type === 'attachment' && (
            <>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Compatível: {item.data.compatibility?.weaponTypes?.join(', ')}</div>
              <div style={{ fontSize: '10px', color: '#fff' }}>Efeito: {item.data.effect}</div>
            </>
          )}
          {item.type === 'armor' && (
            <>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.data.subtitle}</div>
              <div style={{ fontSize: '10px', color: '#fff' }}>{item.data.summary?.replace(/Preço: \\d+ \\| /, '')}</div>
              {item.data.attributes?.map((attr: any, i: number) => (
                <div key={i} style={{ fontSize: '10px', color: 'var(--color-cyan-primary)' }}>{attr.label}: {attr.value}</div>
              ))}
            </>
          )}
          {item.type === 'ammo' && (
            <div style={{ fontSize: '10px', color: '#fff' }}>Munição do tipo {item.data.type}. Pacote com 30 unidades.</div>
          )}
        </div>
      )}
    </div>
  );
};
`;

c = c.replace(
  /const ShopItemCard = \(\{ item, compat, addToCart \}: \{ item: any, compat: boolean, addToCart: \(item: any\) => void \}\) => \{[\s\S]*?^  \);\n\};\n/m,
  itemCardComponent + '\n'
);

fs.writeFileSync('src/components/views/ShopView.tsx', c);

const fs = require('fs');
let code = fs.readFileSync('src/components/views/ShopView.tsx', 'utf-8');

const oldHeaderRegex = /\{\/\* Header \*\/\}\s*<div style=\{\{\s*padding: '12px 24px',[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<div style=\{\{ display: 'flex', flex: 1, overflow: 'hidden' \}\}>/;

const newHeader = `{/* Header (Grimoire Style) */}
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
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="grimoire-breadcrumb-segment" style={{ color: 'var(--color-amber-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingCart size={14} />
            {shopName}
          </span>
          <span className="grimoire-breadcrumb-separator" style={{ color: 'var(--text-muted)' }}>
            &gt;
          </span>
          <span className="grimoire-breadcrumb-segment--active" style={{ color: 'var(--color-red-primary)', textTransform: 'uppercase', fontWeight: 'bold' }}>
            {categoryTabs.find(c => c.id === activeCategory)?.label || 'ESTOQUE'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Search Input from Grimoire */}
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
              onChange={(e) => setSearchQuery(e.target.value)}
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
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-amber-primary)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border-subtle)'; }}
            />
          </div>

          <select 
            className="hud-input"
            value={selectedCharId}
            onChange={(e) => { setSelectedCharId(e.target.value); tacticalAudio.playSelect(); }}
            style={{ width: '200px', fontSize: '0.85rem', padding: '0.25rem 0.5rem', height: 'auto' }}
          >
            {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.5)', padding: '0.25rem 0.75rem', border: '1px solid var(--color-cyan-primary)', borderRadius: '4px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SALDO:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--color-cyan-primary)', fontWeight: 'bold', marginLeft: '6px' }}>
              ₵ {selectedChar?.credits?.toLocaleString() || 0}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>`;

code = code.replace(oldHeaderRegex, newHeader);

// Remove ESTOQUE div
const estoqueRegex = /<div style=\{\{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' \}\}>[\s\S]*?<\/div>\s*<\/div>\s*<div style=\{\{ flex: 1, overflowY: 'auto', paddingRight: '8px' \}\}>/;

const newEstoque = `<div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>`;

code = code.replace(estoqueRegex, newEstoque);

fs.writeFileSync('src/components/views/ShopView.tsx', code);
console.log("Updated Shop Header");

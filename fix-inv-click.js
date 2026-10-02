const fs = require('fs');
let code = fs.readFileSync('src/components/character/InventoryAndNotes.tsx', 'utf-8');

const targetState = \`  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);\`;

const replaceState = \`  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);\`;

code = code.replace(targetState, replaceState);

const targetDivProps = \`            onDrop={(e) => handleDrop(e, idx)}
            style={{\`;

const replaceDivProps = \`            onDrop={(e) => handleDrop(e, idx)}
            onClick={() => {
              if (item) {
                setSelectedIndex(selectedIndex === idx ? null : idx);
                tacticalAudio.playSelect();
              }
            }}
            style={{\`;

code = code.replace(targetDivProps, replaceDivProps);

const targetOverlay = \`<div className="inv-equip-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', gap: '2px', zIndex: 10 }}>\`;

const replaceOverlay = \`<div className="inv-equip-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: selectedIndex === idx ? 1 : 0, pointerEvents: selectedIndex === idx ? 'auto' : 'none', transition: 'opacity 0.2s', gap: '2px', zIndex: 10 }}>\`;

code = code.replace(targetOverlay, replaceOverlay);

const targetStyle = \`      <style>{\\\`
        .hud-panel div:hover > .inv-equip-overlay { opacity: 1 !important; }
      \\\`}</style>\`;

const replaceStyle = \`\`;

code = code.replace(targetStyle, replaceStyle);

fs.writeFileSync('src/components/character/InventoryAndNotes.tsx', code);

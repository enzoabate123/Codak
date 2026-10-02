const fs = require('fs');
let c = fs.readFileSync('src/components/navigation/TacticalWheel.tsx', 'utf8');

c = c.replace(
  /\} else if \(e\.key === 'Enter'\) \{\n\s*tacticalAudio\.playSelect\(\);\n\s*collapseWheel\(\);\n\s*\}/,
  `} else if (e.key === 'Enter') {
        tacticalAudio.playSelect();
        if (hoveredIndex !== -1 && hoveredIndex !== activeIndex) {
          selectIndex(hoveredIndex);
        }
        collapseWheel();
      }`
);

// We need to add hoveredIndex to the dependency array of handleKeyDown useEffect
c = c.replace(
  /\}, \[activeIndex, isCollapsed, selectIndex, expandWheel, collapseWheel\]\);/,
  `}, [activeIndex, isCollapsed, selectIndex, expandWheel, collapseWheel, hoveredIndex]);`
);

fs.writeFileSync('src/components/navigation/TacticalWheel.tsx', c);

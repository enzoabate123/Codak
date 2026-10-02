const fs = require('fs');
let c = fs.readFileSync('src/components/navigation/TacticalWheel.tsx', 'utf8');

c = c.replace(
  /\} else if \(e\.key === 'ArrowUp' \|\| e\.key === 'ArrowLeft'\) \{([\s\S]*?)tacticalAudio\.playHover\(\);\n      \}/,
  `} else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {$1tacticalAudio.playHover();
      } else if (e.key === 'Enter') {
        tacticalAudio.playSelect();
        collapseWheel();
      }`
);

c = c.replace(
  /\}, \[activeIndex, isCollapsed, selectIndex, expandWheel\]\);/,
  "}, [activeIndex, isCollapsed, selectIndex, expandWheel, collapseWheel]);"
);

fs.writeFileSync('src/components/navigation/TacticalWheel.tsx', c);

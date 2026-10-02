const fs = require('fs');
let c = fs.readFileSync('src/components/navigation/TacticalWheel.tsx', 'utf8');

c = c.replace(
  /const handleKeyDown = \(e: KeyboardEvent\) => \{/,
  `const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }`
);

fs.writeFileSync('src/components/navigation/TacticalWheel.tsx', c);

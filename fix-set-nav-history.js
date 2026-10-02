const fs = require('fs');
let code = fs.readFileSync('src/components/views/GrimoireView.tsx', 'utf-8');

const oldCode = `    setNavHistory((prev) => {
      const existingIdx = prev.indexOf(cleanTargetId);
      if (existingIdx !== -1) {
        return prev.slice(0, existingIdx + 1);
      }
      return [...prev, cleanTargetId];
    });`;

const newCode = `    const existingIdx = navHistory.indexOf(cleanTargetId);
    if (existingIdx !== -1) {
      setNavHistory(navHistory.slice(0, existingIdx + 1));
    } else {
      setNavHistory([...navHistory, cleanTargetId]);
    }`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/components/views/GrimoireView.tsx', code);
console.log("Fixed setNavHistory callback usage");

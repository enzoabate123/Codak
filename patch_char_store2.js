const fs = require('fs');
let c = fs.readFileSync('src/stores/useCharacterStore.ts', 'utf8');

c = c.replace(
  /updateHp: \(delta: number\) => void;/,
  "updateHp: (delta: number) => void;\n  updateResource: (delta: number) => void;"
);

c = c.replace(
  /updateHp: \(delta\) => \{([\s\S]*?)\},/,
  `updateHp: (delta) => {$1},
  updateResource: (delta) => {
    set((state) => {
      const char = state.characters.find((c) => c.id === state.activeCharacterId);
      if (!char || !char.resourceMax) return state;
      const newRes = Math.max(0, Math.min(char.resourceMax, (char.resourceCurrent || 0) + delta));
      const updatedChars = state.characters.map((c) =>
        c.id === state.activeCharacterId ? { ...c, resourceCurrent: newRes } : c
      );
      return { characters: updatedChars };
    });
  },`
);

fs.writeFileSync('src/stores/useCharacterStore.ts', c);

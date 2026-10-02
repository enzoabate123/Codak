const fs = require('fs');
let code = fs.readFileSync('src/components/character/InventoryAndNotes.tsx', 'utf-8');

code = code.replace(
  /\{\(char\.inventory \|\| Array\(64\)\.fill\(null\)\)\.map\(\(item, idx\) => \(/,
  `{(char.inventory || Array(64).fill(null)).map((item, idx) => {
          let visuallyEmpty = false;
          if (item && item.type === 'ammo') {
            visuallyEmpty = true;
          }
          return (`
);

// Close the map block properly
code = code.replace(
  /          <\/div>\n        \)\)\}/,
  `          </div>\n          );\n        })}`
);

// Inside the map loop, replace uses of `item` with `(item && !visuallyEmpty)` where it matters for rendering and interactions.
// We must be careful. I will just replace `draggable` and `onClick` and `background`.
code = code.replace(/draggable/g, "draggable={!visuallyEmpty}");
// actually, I'll just write a script to surgically replace the div!


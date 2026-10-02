const fs = require('fs');
let c = fs.readFileSync('src/components/views/GrimoireView.tsx', 'utf8');
c = c.replace(
  /hasSpecialContent: cls\.subclasses\.length > 0,/g,
  "hasSpecialContent: cls.subclasses.length > 0,\n        imageUrl: IMAGE_ENRICHMENT_MAP[`cls-${cls.id}`],"
);
c = c.replace(
  /rawItem: \{ type: 'ability', data: ab \},/g,
  "rawItem: { type: 'ability', data: ab },\n        imageUrl: IMAGE_ENRICHMENT_MAP[ab.id],"
);
c = c.replace(
  /rawItem: \{ type: 'weapon', data: w \},/g,
  "rawItem: { type: 'weapon', data: w },\n        imageUrl: IMAGE_ENRICHMENT_MAP[`w-${w.id}`],"
);
c = c.replace(
  /hasSpecialContent: !!item\.tableData,/g,
  "hasSpecialContent: !!item.tableData,\n        imageUrl: IMAGE_ENRICHMENT_MAP[`lore-${item.id}`],"
);
fs.writeFileSync('src/components/views/GrimoireView.tsx', c);

const fs = require('fs');
let c = fs.readFileSync('src/stores/useNavigationStore.ts', 'utf8');

const shopBlock = `  {
    id: 'shop',
    index: 2,
    labelKey: 'navigation.shop',
    code: '03',
    sectionCode: 'navigation.shop_sec',
    icon: 'shop',
  },`;

const mapBlock = `  {
    id: 'map',
    index: 3,
    labelKey: 'navigation.map',
    code: '04',
    sectionCode: 'navigation.map_sec',
    icon: 'map',
  },`;

// Replace map with placeholder, then shop with map, then placeholder with shop
// Actually, it's easier to just rebuild the array text

const newArray = `export const NAVIGATION_ITEMS: VTTNavigationItem[] = [
  {
    id: 'characters',
    index: 0,
    labelKey: 'navigation.characters',
    code: '01',
    sectionCode: 'navigation.characters_sec',
    icon: 'user',
  },
  {
    id: 'grimoire',
    index: 1,
    labelKey: 'navigation.grimoire',
    code: '02',
    sectionCode: 'navigation.grimoire_sec',
    icon: 'book',
  },
${shopBlock}
${mapBlock}
  {
    id: 'admin',
    index: 4,
    labelKey: 'navigation.admin',
    code: '05',
    sectionCode: 'navigation.admin_sec',
    icon: 'admin',
  },
];`;

c = c.replace(/export const NAVIGATION_ITEMS: VTTNavigationItem\[\] = \[[\s\S]*?\];/, newArray);
fs.writeFileSync('src/stores/useNavigationStore.ts', c);

const fs = require('fs');
let c = fs.readFileSync('src/stores/useNavigationStore.ts', 'utf8');

c = c.replace(
  /\{\n\s*id: 'admin',[\s\S]*?\},/,
  `{
    id: 'shop',
    index: 3,
    labelKey: 'navigation.shop',
    code: '04',
    sectionCode: 'navigation.shop_sec',
    icon: 'shop',
  },
  {
    id: 'admin',
    index: 4,
    labelKey: 'navigation.admin',
    code: '05',
    sectionCode: 'navigation.admin_sec',
    icon: 'admin',
  },`
);

// I should also update the VTTNavigationItem icon type in src/types/vtt.ts again?
// Yes, I did that. Wait, I also need to update VTTView? I did.

fs.writeFileSync('src/stores/useNavigationStore.ts', c);

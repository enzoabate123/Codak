const fs = require('fs');
let c = fs.readFileSync('src/components/views/ShopView.tsx', 'utf8');

c = c.replace(
  /import \{ useAudioStore \} from '@\/stores\/useAudioStore';/,
  "import { tacticalAudio } from '@/lib/audio';"
);

c = c.replace(
  /const \{ playSelect, playHover, playAlert \} = useAudioStore\(\);/g,
  ""
);

c = c.replace(/playSelect\(/g, "tacticalAudio.playSelect(");
c = c.replace(/playHover/g, "tacticalAudio.playHover");
c = c.replace(/playAlert\(\)/g, "tacticalAudio.playAlert()");

c = c.replace(
  /category: 'ammo'/g,
  "category: 'armas'"
);

c = c.replace(
  /if \(activeCategory === 'armas' && i\.category === 'ammo'\) return true;/g,
  ""
);

fs.writeFileSync('src/components/views/ShopView.tsx', c);

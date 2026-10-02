const fs = require('fs');
let c = fs.readFileSync('src/components/navigation/TacticalWheel.tsx', 'utf8');

c = c.replace(
  /import \{ User, BookOpen, Map, ChevronRight, Shield \} from 'lucide-react';/,
  "import { User, BookOpen, Map, ChevronRight, Shield, ShoppingCart } from 'lucide-react';"
);

c = c.replace(
  /\{item\.icon === 'admin' && <Shield size=\{18\} \/>\}/,
  "{item.icon === 'admin' && <Shield size={18} />}\n                    {item.icon === 'shop' && <ShoppingCart size={18} />}"
);

fs.writeFileSync('src/components/navigation/TacticalWheel.tsx', c);

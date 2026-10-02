const fs = require('fs');
let code = fs.readFileSync('src/components/character/Character3DViewer.tsx', 'utf-8');

code = code.replace(
  "import { Loader2 } from 'lucide-react';",
  "import { Loader2 } from 'lucide-react';\nimport { InternalLoader } from '../ui/InternalLoader';"
);

fs.writeFileSync('src/components/character/Character3DViewer.tsx', code);

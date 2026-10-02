const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminView.tsx', 'utf-8');

code = code.replace(
  "import { Shield, Wrench, Package, FileText, Beaker, Crosshair, Users, Download, Upload, Activity, Trash2, Key } from 'lucide-react';",
  "import { Shield, Wrench, Package, FileText, Beaker, Crosshair, Users, Download, Upload, Activity, Trash2, Key } from 'lucide-react';\nimport { InternalLoader } from '../ui/InternalLoader';"
);

fs.writeFileSync('src/components/admin/AdminView.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/components/layout/TacticalAppShell.tsx', 'utf-8');
code = code.replace('  const [mounted, setMounted] = React.useState(false);\n  const [mounted, setMounted] = React.useState(false);', '  const [mounted, setMounted] = React.useState(false);');
fs.writeFileSync('src/components/layout/TacticalAppShell.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/components/views/ShopView.tsx', 'utf-8');

code = code.replace(
  'const compat = checkClassCompat(selectedChar?.classId, item.type, item.data);',
  'const compat = checkClassCompat(selectedChar, item.type, item.data);'
);

fs.writeFileSync('src/components/views/ShopView.tsx', code);

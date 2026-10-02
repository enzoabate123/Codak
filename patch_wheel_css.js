const fs = require('fs');
let c = fs.readFileSync('src/styles/wheel.css', 'utf8');

c = c.replace(
  /\.wheel-trigger-btn-visible \{\n\s*opacity: 1;\n\s*pointer-events: auto;\n\s*transform: translate\(-30%, -50%\) scale\(1\);\n\s*box-shadow: 0 0 24px rgba\(239, 68, 68, 0\.35\), 0 0 50px rgba\(185, 28, 28, 0\.2\), inset 0 0 12px rgba\(239, 68, 68, 0\.2\);\n\}/,
  `.wheel-trigger-btn-visible {
  opacity: 0;
  pointer-events: auto;
  /* PONYTAIL: Push it almost completely off-screen so it doesn't block Grimoire clicks. Only a 10px sliver is hoverable. */
  transform: translate(-80%, -50%) scale(0.8);
  box-shadow: none;
}`
);

fs.writeFileSync('src/styles/wheel.css', c);

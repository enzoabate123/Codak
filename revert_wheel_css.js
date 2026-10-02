const fs = require('fs');
let c = fs.readFileSync('src/styles/wheel.css', 'utf8');

c = c.replace(
  /\.wheel-trigger-btn-visible \{[\s\S]*?\}/,
  `.wheel-trigger-btn-visible {
  /* JS proximiy overrides this, but this is the default */
  opacity: 0.15;
  pointer-events: none;
  transform: translate(-30%, -50%) scale(1);
}`
);

// We need to keep the hover styles
fs.writeFileSync('src/styles/wheel.css', c);

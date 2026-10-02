const fs = require('fs');
let c = fs.readFileSync('src/styles/wheel.css', 'utf8');

c = c.replace(
  /\.wheel-trigger-btn:hover \{\n\s*background: #180c10;/,
  `.wheel-trigger-btn:hover {
  opacity: 1 !important;
  background: #180c10;`
);

fs.writeFileSync('src/styles/wheel.css', c);

const fs = require('fs');
let code = fs.readFileSync('src/styles/hud-components.css', 'utf-8');

const target = \`.grimoire-sidebar {
  width: 260px;
  min-width: 260px;
  display: flex;
  flex-direction: column;
  background: transparent;
  border-right: var(--border-subtle);
  overflow: hidden;
  flex-shrink: 0;
}\`;

const replace = \`.grimoire-sidebar {
  width: 260px;
  min-width: 260px;
  display: flex;
  flex-direction: column;
  background: transparent;
  border-right: var(--border-subtle);
  overflow: hidden;
  flex-shrink: 0;
  transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.grimoire-sidebar-content-wrapper {
  width: 260px;
  min-width: 260px;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: opacity 0.2s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.grimoire-sidebar--closed {
  width: 0px;
  min-width: 0px;
  border-right-color: transparent;
}

.grimoire-sidebar--closed .grimoire-sidebar-content-wrapper {
  opacity: 0;
  transform: translateX(-20px);
  pointer-events: none;
}\`;

code = code.replace(target, replace);
fs.writeFileSync('src/styles/hud-components.css', code);

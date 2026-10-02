const fs = require('fs');
let c = fs.readFileSync('src/components/navigation/TacticalWheel.tsx', 'utf8');

const hookStr = `
  // PONYTAIL PROXIMITY FADE
  // We use JS because CSS can't know cursor distance without blocking clicks underneath.
  const triggerRef = useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    if (!isCollapsed) {
      // Reset inline styles when expanded
      if (triggerRef.current) {
        triggerRef.current.style.opacity = '';
        triggerRef.current.style.pointerEvents = '';
        triggerRef.current.style.transform = '';
      }
      return;
    }
    
    let rafId: number;
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!triggerRef.current) return;
        
        // Target coordinates (mid-left screen)
        const triggerX = 0;
        const triggerY = window.innerHeight / 2;
        
        const dx = e.clientX - triggerX;
        const dy = e.clientY - triggerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const maxDist = 250;
        const minDist = 50;
        
        if (dist > maxDist) {
          triggerRef.current.style.opacity = '0.05';
          triggerRef.current.style.pointerEvents = 'none';
          triggerRef.current.style.transform = 'translate(-40%, -50%) scale(0.8)';
        } else {
          const progress = 1 - (dist - minDist) / (maxDist - minDist);
          const clamped = Math.max(0.05, Math.min(1, progress));
          triggerRef.current.style.opacity = clamped.toString();
          
          if (dist < 90) {
             triggerRef.current.style.pointerEvents = 'auto';
             triggerRef.current.style.transform = \`translate(-20%, -50%) scale(\${0.8 + 0.2 * clamped})\`;
          } else {
             triggerRef.current.style.pointerEvents = 'none';
             triggerRef.current.style.transform = 'translate(-40%, -50%) scale(0.8)';
          }
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [isCollapsed]);
`;

// Insert the hook inside TacticalWheel
c = c.replace(
  /const stageRef = useRef<HTMLDivElement>\(null\);/,
  "const stageRef = useRef<HTMLDivElement>(null);\n" + hookStr
);

// Add the ref to the button
c = c.replace(
  /className=\{\`wheel-trigger-btn \$\{isCollapsed \? 'wheel-trigger-btn-visible' : ''\}\`\}/,
  "ref={triggerRef}\n        className={`wheel-trigger-btn ${isCollapsed ? 'wheel-trigger-btn-visible' : ''}`}"
);

fs.writeFileSync('src/components/navigation/TacticalWheel.tsx', c);

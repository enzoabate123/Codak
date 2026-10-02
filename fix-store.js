const fs = require('fs');
let code = fs.readFileSync('src/stores/useConfigStore.ts', 'utf-8');

code = code.replace(
  'setBackgroundImage: (url) => set({ backgroundImage: url }),',
  `setBackgroundImage: async (url) => {
        set({ backgroundImage: url });
        try {
          await fetch('/api/backgrounds/active', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: url }),
          });
        } catch {}
      },`
).replace(
  `          const data = await res.json();
          set({ backgroundLibrary: data.backgrounds || [] });
        } catch {}`,
  `          const data = await res.json();
          set({ backgroundLibrary: data.backgrounds || [] });
          
          const activeRes = await fetch('/api/backgrounds/active');
          if (activeRes.ok) {
            const activeData = await activeRes.json();
            if (activeData.path !== undefined) {
              set({ backgroundImage: activeData.path });
            }
          }
        } catch {}`
);

fs.writeFileSync('src/stores/useConfigStore.ts', code);

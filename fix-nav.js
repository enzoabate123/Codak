const fs = require('fs');
let code = fs.readFileSync('src/stores/useNavigationStore.ts', 'utf-8');

code = code.replace("isTransitioning: boolean;", "");
code = code.replace("isTransitioning: false,", "");

const replaceSelect = \`  selectView: (view: VTTView) => {
    const item = NAVIGATION_ITEMS.find((i) => i.id === view);
    if (item && get().activeView !== view) {
      set({ isTransitioning: true });
      setTimeout(() => {
        set({ activeView: view, activeIndex: item.index, isTransitioning: false });
      }, 500);
    }
  },\`;
const targetSelect = \`  selectView: (view: VTTView) => {
    const item = NAVIGATION_ITEMS.find((i) => i.id === view);
    if (item) {
      set({ activeView: view, activeIndex: item.index });
    }
  },\`;

code = code.replace(replaceSelect, targetSelect);

const replaceSelectIndex = \`  selectIndex: (index: number) => {
    const clampedIndex = Math.max(0, Math.min(NAVIGATION_ITEMS.length - 1, index));
    const item = NAVIGATION_ITEMS[clampedIndex];
    if (item && get().activeIndex !== clampedIndex) {
      set({ isTransitioning: true });
      setTimeout(() => {
        set({ activeView: item.id, activeIndex: clampedIndex, isTransitioning: false });
      }, 500);
    }
  },\`;
const targetSelectIndex = \`  selectIndex: (index: number) => {
    const clampedIndex = Math.max(0, Math.min(NAVIGATION_ITEMS.length - 1, index));
    const item = NAVIGATION_ITEMS[clampedIndex];
    if (item) {
      set({ activeView: item.id, activeIndex: clampedIndex });
    }
  },\`;

code = code.replace(replaceSelectIndex, targetSelectIndex);

fs.writeFileSync('src/stores/useNavigationStore.ts', code);

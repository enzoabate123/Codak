const fs = require('fs');
let code = fs.readFileSync('src/components/views/GrimoireView.tsx', 'utf-8');

// 1. Add import for useGrimoireStore
if (!code.includes("useGrimoireStore")) {
  code = code.replace(
    "import { tacticalAudio } from '@/lib/audio';",
    "import { tacticalAudio } from '@/lib/audio';\nimport { useGrimoireStore } from '@/stores/useGrimoireStore';"
  );
}

// 2. Replace useState hooks with zustand
const stateRegex = /const \[activeCategory, setActiveCategory\] = useState<GrimoireCategory>\('classes'\);\s*const \[searchQuery, setSearchQuery\] = useState\(''\);\s*const \[selectedEntryId, setSelectedEntryId\] = useState<string \| null>\(null\);\s*const \[navHistory, setNavHistory\] = useState<string\[\]>\(\[\]\);/;

const replacement = `const { 
    activeCategory, setActiveCategory,
    searchQuery, setSearchQuery,
    selectedEntryId, setSelectedEntryId,
    navHistory, setNavHistory
  } = useGrimoireStore();`;

code = code.replace(stateRegex, replacement);

fs.writeFileSync('src/components/views/GrimoireView.tsx', code);
console.log("Updated GrimoireView");

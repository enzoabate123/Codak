const fs = require('fs');
let code = fs.readFileSync('src/components/gunsmith/GunsmithModal.tsx', 'utf-8');

const helper = `
const isAttachmentCompatible = (att: Attachment, w: any) => {
  const c = att.compatibility;
  if (!c) return false;
  if (c.all) return true;
  if (c.weaponSizes && !c.weaponSizes.includes(w.size)) return false;
  if (c.weaponTypes && !c.weaponTypes.includes(w.type)) return false;
  if (c.ammoCategories && !c.ammoCategories.includes(w.ammoCategory)) return false;
  if (c.firingModes && !c.firingModes.includes(w.firingMode)) return false;
  if (c.specificWeaponIds && !c.specificWeaponIds.includes(w.id)) return false;
  return true;
};
`;

code = code.replace(
  "export const GunsmithModal: React.FC<GunsmithModalProps> = ({ slot, onClose }) => {",
  helper + "\nexport const GunsmithModal: React.FC<GunsmithModalProps> = ({ slot, onClose }) => {"
);

code = code.replace(
  "    .filter((entry) => entry.item && entry.item.type === 'attachment' && entry.item.data?.category === selectedCategory);",
  "    .filter((entry) => entry.item && entry.item.type === 'attachment' && entry.item.data?.category === selectedCategory && isAttachmentCompatible(entry.item.data, weapon));"
);

// We need to import Attachment from codak-rules if it's not imported.
if (!code.includes("Attachment,")) {
  code = code.replace(
    "import { AttachmentCategory, AmmunitionType } from '@/types/codak-rules';",
    "import { AttachmentCategory, AmmunitionType, Attachment } from '@/types/codak-rules';"
  );
}

fs.writeFileSync('src/components/gunsmith/GunsmithModal.tsx', code);

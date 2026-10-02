const fs = require('fs');
let code = fs.readFileSync('src/components/gunsmith/GunsmithModal.tsx', 'utf-8');

code = code.replace(
  "import { AttachmentCategory, AmmunitionType, Attachment } from '@/types/codak-rules';",
  "import { AttachmentCategory, AmmunitionType, Attachment, Weapon } from '@/types/codak-rules';"
);

code = code.replace(
  "const isAttachmentCompatible = (att: Attachment, w: any) => {",
  "const isAttachmentCompatible = (att: Attachment, w: Weapon) => {"
);

fs.writeFileSync('src/components/gunsmith/GunsmithModal.tsx', code);

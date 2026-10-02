const fs = require('fs');
let code = fs.readFileSync('src/types/codak-rules.ts', 'utf-8');

const regex = /export interface Ammunition {[\s\S]*?}/;
const newInterface = `export type AmmoSize = 'Pequena' | 'Média' | 'Grande' | 'Bateria';

export interface Ammunition {
  type: AmmunitionType;
  size: AmmoSize;
  capacity?: number;
  pricePerBullet: number;
  bonusDamage?: string;
  specialEffect?: string;
}`;

code = code.replace(regex, newInterface);

fs.writeFileSync('src/types/codak-rules.ts', code);

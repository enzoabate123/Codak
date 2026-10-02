const fs = require('fs');
let code = fs.readFileSync('src/data/attachments-catalog.ts', 'utf-8');

const regex = /export const AMMUNITIONS_CATALOG: Ammunition\[\] = \[\s*[\s\S]*?\];/;

const newAmmoCatalogCode = `export const AMMUNITIONS_CATALOG: Ammunition[] = (() => {
  const baseTypes = [
    { type: 'Normal', price: 1 },
    { type: 'Fire', price: 5, specialEffect: 'Incendiary burning effect' },
    { type: 'Cryo', price: 5, specialEffect: 'Slows movement speed' },
    { type: 'Plasma', price: 10, bonusDamage: '+1d4', specialEffect: 'Plasma thermal burn' },
    { type: 'Corrosion', price: 10, specialEffect: 'Starts corrosion on metal armors' },
    { type: 'Electric', price: 10, specialEffect: 'Causes short circuits in electronics' },
    { type: 'Nuke', price: 15, specialEffect: 'Wounds cannot be healed with nanobots' },
    { type: 'MD', price: 20, bonusDamage: '+2d4', specialEffect: 'Each shot can cause wither necrosis' },
    { type: 'Etched', price: 8, bonusDamage: '+1d4' },
    { type: 'FMJ', price: 15, bonusDamage: '+2d4', specialEffect: 'Can penetrate through thick walls' },
  ];

  const result = [];

  // Generate Small, Medium, Large for each non-energy type
  baseTypes.forEach(bt => {
    result.push({ ...bt, size: 'Pequena', pricePerBullet: bt.price * 10 });
    result.push({ ...bt, size: 'Média', pricePerBullet: bt.price * 25 });
    result.push({ ...bt, size: 'Grande', pricePerBullet: bt.price * 50 });
  });

  // Batteries
  result.push({ type: 'Energy', size: 'Bateria', pricePerBullet: 500, capacity: 50 });
  result.push({ type: 'Energy', size: 'Bateria', pricePerBullet: 1200, capacity: 150 });
  result.push({ type: 'Energy', size: 'Bateria', pricePerBullet: 2500, capacity: 400 });

  return result as any;
})();`;

code = code.replace(regex, newAmmoCatalogCode);

fs.writeFileSync('src/data/attachments-catalog.ts', code);

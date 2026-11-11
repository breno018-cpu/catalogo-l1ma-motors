const fs = require('fs');

const cat = JSON.parse(fs.readFileSync('data/catalog.json', 'utf8'));
const evts = JSON.parse(fs.readFileSync('data/events.json', 'utf8'));

// 1. REPLAY USER REMOVALS FROM EVENTS
// Find all remove events
const removeEvents = evts.filter(e => e.type === 'remove');
const permanentlyRemoved = new Set();
const hiddenModels = new Set();

for (const rev of removeEvents) {
  if (rev.text && rev.text.includes('saiu do catálogo')) {
    permanentlyRemoved.add(rev.id);
  } else if (rev.text && rev.text.includes('ocultado do catálogo')) {
    hiddenModels.add(rev.id);
  }
}

console.log('Permanently removed by user:', [...permanentlyRemoved]);
console.log('Hidden by user (active: false):', [...hiddenModels]);

// Filter out permanently removed products
cat.products = cat.products.filter(p => !permanentlyRemoved.has(p.id));

// Mark hidden products as active: false
for (const p of cat.products) {
  if (hiddenModels.has(p.id)) {
    p.active = false;
  }
}

// 2. REAL VERIFIED 360 FRAMES
const verified360 = {
  'shineray-storm-200': Array.from({ length: 24 }, (_, i) => `https://www.shineray.com.br/wp-content/uploads/2026/05/360-Storm-${String(i + 1).padStart(2, '0')}.webp`),
  'shineray-jet-125ss-efi': Array.from({ length: 24 }, (_, i) => `https://www.shineray.com.br/wp-content/uploads/2026/08/360-JET-125-EFI-${i + 1}.webp`),
  'shineray-jet-125': Array.from({ length: 24 }, (_, i) => `https://www.shineray.com.br/wp-content/uploads/2026/02/NEW-JET-${i + 1}.webp`),
  'shineray-jet-50': Array.from({ length: 19 }, (_, i) => `https://www.shineray.com.br/wp-content/uploads/2026/03/JET-50-01-${i + 1}.png`),
  'shineray-phoenix-50-efi': Array.from({ length: 20 }, (_, i) => `https://www.shineray.com.br/wp-content/uploads/2026/05/Phoenix-S-360-${String(i + 1).padStart(2, '0')}-scaled.webp`),
  'shineray-shi-175': Array.from({ length: 24 }, (_, i) => `https://www.shineray.com.br/wp-content/uploads/2026/04/SHI-175-01-${i + 1}.webp`),
  'shineray-shi-170-cs': Array.from({ length: 24 }, (_, i) => `https://www.shineray.com.br/wp-content/uploads/2026/04/360-SHI-170-${i + 1}.webp`),
  'shineray-urban-150': Array.from({ length: 24 }, (_, i) => `https://www.shineray.com.br/wp-content/uploads/2026/04/URBAN-150_${String(i + 1).padStart(2, '0')}.webp`),
  'shineray-urban-lite': Array.from({ length: 24 }, (_, i) => `https://www.shineray.com.br/wp-content/uploads/2026/04/360-URBAN-LITE-${i + 1}.webp`),
  'shineray-iron': Array.from({ length: 24 }, (_, i) => `https://www.shineray.com.br/wp-content/uploads/2026/07/360-Iron-${i + 1}.webp`),
  'shineray-titanium': Array.from({ length: 24 }, (_, i) => `https://www.shineray.com.br/wp-content/uploads/2026/08/360-SBM-Titanium-${i + 1}.webp`),
  'shineray-sbm-600': Array.from({ length: 24 }, (_, i) => `https://www.shineray.com.br/wp-content/uploads/2025/11/360-SBM-600C-${String(i + 1).padStart(2, '0')}.webp`),
  'shineray-sbm-600rc': Array.from({ length: 24 }, (_, i) => `https://www.shineray.com.br/wp-content/uploads/2026/01/360-SBM-600R-${i + 1}.webp`),
  'shineray-sbm-600v': Array.from({ length: 24 }, (_, i) => `https://www.shineray.com.br/wp-content/uploads/2025/12/360-SBM-600v-${i + 1}.webp`),
  'shineray-sbm-250s': Array.from({ length: 24 }, (_, i) => `https://www.shineray.com.br/wp-content/uploads/2026/03/SBM-250s-Novo-360-${i + 1}.webp`),
  'shineray-sbm-250t': Array.from({ length: 24 }, (_, i) => `https://www.shineray.com.br/wp-content/uploads/2026/05/360-SBM-250T-${i + 1}.webp`),
  'shineray-sbm-400rr': Array.from({ length: 24 }, (_, i) => `https://www.shineray.com.br/wp-content/uploads/2026/07/360-SBM-400rr-${i + 1}.webp`)
};

for (const p of cat.products) {
  if (verified360[p.id]) {
    p.rotation360 = verified360[p.id];
  } else {
    // If it has broken -x. or doesn't have real 360, remove rotation360
    p.rotation360 = null;
  }
}

// 3. CLEAN LEFTOVER DESCRIPTIONS
for (const p of cat.products) {
  if (p.desc && p.desc.includes('Motos\t')) {
    p.desc = `Modelo oficial Shineray do Brasil com alta qualidade, garantia de fábrica e pronta entrega na L1MA Motors.`;
  }
  if (p.desc && p.desc.includes('Automóveis\t')) {
    p.desc = `Modelo oficial Shineray do Brasil com alta qualidade, garantia de fábrica e pronta entrega na L1MA Motors.`;
  }
}

// 4. WRITE UPDATED CATALOG
fs.writeFileSync('data/catalog.json', JSON.stringify(cat, null, 2));

const config = JSON.parse(fs.readFileSync('data/config.json', 'utf8'));
const jsContent = `/* Catálogo L1MA Motors — dados estáticos offline */\nwindow.CATALOG = ${JSON.stringify({ ...cat, config }, null, 2)};\n`;
fs.writeFileSync('public/catalog.js', jsContent);

console.log('Successfully updated catalog!');
console.log('Total products:', cat.products.length);
console.log('Active products:', cat.products.filter(p => p.active !== false).length);
console.log('Products with 360:', cat.products.filter(p => p.rotation360 && p.rotation360.length).length);

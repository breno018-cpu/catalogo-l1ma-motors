const fs = require('fs');

const cat = JSON.parse(fs.readFileSync('data/catalog.json', 'utf8'));

// Priority slugs for Shineray
const shinerayPriority = [
  'shineray-worker-125',
  'shineray-worker-cross-150',
  'shineray-jet-125ss-efi',
  'shineray-jet-125',
  'shineray-phoenix-50-efi',
  'shineray-phoenix-plus-50',
  'shineray-phoenix-50-s',
  'shineray-jet-50-2x',
  'shineray-jet-50',
  'shineray-phoenix-50',
  'shineray-shi-175s-efi',
  'shineray-shi-175ss',
  'shineray-shi-175',
  'shineray-shi-170-cs',
  'shineray-shi-250',
  'shineray-jef-150s-efi',
  'shineray-jef-150',
  'shineray-jef-170',
  'shineray-rio-125-efi',
  'shineray-free-150',
  'shineray-urban-150',
  'shineray-urban-lite',
  'shineray-storm-200-efi',
  'shineray-denver-400',
  'shineray-denver',
  'shineray-iron',
  'shineray-titanium',
  'shineray-shi-400sc',
  'shineray-sbm-600',
  'shineray-sbm-600rc',
  'shineray-sbm-600rc-v2',
  'shineray-sbm-600t',
  'shineray-sbm-600v',
  'shineray-sbm-400',
  'shineray-sbm-400rr',
  'shineray-sbm-400ss',
  'shineray-sbm-250s',
  'shineray-sbm-250t',
  'shineray-sbm-150s',
  'shineray-250f',
  'shineray-she-s',
  'shineray-se1',
  'shineray-se2',
  'shineray-atv-125',
  'shineray-atv-125-efi',
  'shineray-atv-200',
  'shineray-atv-200-efi',
  'shineray-atv-250',
  'shineray-atv-300',
  'shineray-atv-1000',
  'shineray-kart-125',
  'shineray-kart-200',
  'shineray-kart-200s',
  'shineray-pt-stand',
  'shineray-pt1',
  'shineray-pt1s',
  'shineray-pt2',
  'shineray-pt2n',
  'shineray-pt2xs',
  'shineray-pt3',
  'shineray-pt3-m1',
  'shineray-pt3-triciclo',
  'shineray-pt3s',
  'shineray-pt4-pro',
  'shineray-pt4-pro-s',
  'shineray-ptxr',
  'shineray-ptxs',
  'shineray-sh3',
  'shineray-sh4',
  'shineray-tlux'
];

// Clean descriptions of Shineray products that had leftover WordPress crawler text
cat.products.forEach(p => {
  if (p.brand === 'Shineray' && p.desc && p.desc.includes('Automóveis\t')) {
    p.desc = `Modelo oficial Shineray do Brasil. Alto desempenho, garantia de fábrica e pronta entrega na L1MA Motors.`;
  }
});

// Sort Shineray products according to priority list
const nonShineray = cat.products.filter(p => p.cat !== 'shineray');
const shinerayProds = cat.products.filter(p => p.cat === 'shineray');

shinerayProds.sort((a, b) => {
  const ia = shinerayPriority.indexOf(a.id);
  const ib = shinerayPriority.indexOf(b.id);
  const pa = ia === -1 ? 999 : ia;
  const pb = ib === -1 ? 999 : ib;
  return pa - pb;
});

// Assign sortOrder
shinerayProds.forEach((p, idx) => {
  p.sortOrder = idx + 1;
});
nonShineray.forEach((p, idx) => {
  p.sortOrder = idx + 1;
});

cat.products = [...nonShineray, ...shinerayProds];

fs.writeFileSync('data/catalog.json', JSON.stringify(cat, null, 2));

const jsContent = `/* Catálogo L1MA Motors — dados estáticos offline */\nwindow.CATALOG = ${JSON.stringify(cat, null, 2)};\n`;
fs.writeFileSync('public/catalog.js', jsContent);

console.log('Successfully reordered Shineray products and cleaned descriptions!');
console.log('First 10 Shineray products now:');
shinerayProds.slice(0, 10).forEach(p => console.log(p.sortOrder, p.name, p.sub, p.price));

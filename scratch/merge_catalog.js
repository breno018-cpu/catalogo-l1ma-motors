const fs = require('fs');

const catalog = JSON.parse(fs.readFileSync('data/catalog.json', 'utf8'));
const refinedShineray = JSON.parse(fs.readFileSync('scratch/refined_shineray_models.json', 'utf8'));

// Keep all non-shineray products (electric, semi, off-road)
const nonShineray = catalog.products.filter(p => p.cat !== 'shineray');

console.log('Non-shineray products count:', nonShineray.length);
console.log('New Shineray products count:', refinedShineray.length);

catalog.products = [...nonShineray, ...refinedShineray];

console.log('Total catalog products:', catalog.products.length);

// Save to data/catalog.json
fs.writeFileSync('data/catalog.json', JSON.stringify(catalog, null, 2));

// Save to public/catalog.js
const jsContent = `/* Catálogo L1MA Motors — dados estáticos offline */\nwindow.CATALOG = ${JSON.stringify(catalog, null, 2)};\n`;
fs.writeFileSync('public/catalog.js', jsContent);

console.log('Updated data/catalog.json and public/catalog.js successfully!');

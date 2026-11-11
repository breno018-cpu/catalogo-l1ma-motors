const fs = require('fs');

const catalog = JSON.parse(fs.readFileSync('data/catalog.json', 'utf8'));
const cleanShineray = JSON.parse(fs.readFileSync('scratch/refined_shineray_models_clean.json', 'utf8'));

// Filter out old shineray items
const nonShineray = catalog.products.filter(p => p.cat !== 'shineray');

console.log('Non-shineray products:', nonShineray.length);
console.log('Clean Shineray models:', cleanShineray.length);

catalog.products = [...nonShineray, ...cleanShineray];

fs.writeFileSync('data/catalog.json', JSON.stringify(catalog, null, 2));

const jsContent = `/* Catálogo L1MA Motors — dados estáticos offline */\nwindow.CATALOG = ${JSON.stringify(catalog, null, 2)};\n`;
fs.writeFileSync('public/catalog.js', jsContent);

console.log('Updated data/catalog.json and public/catalog.js successfully!');

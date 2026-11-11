const fs = require('fs');
const cat = JSON.parse(fs.readFileSync('data/catalog.json', 'utf8'));

// Remove shineray-tlux-2
cat.products = cat.products.filter(p => p.id !== 'shineray-tlux-2');

fs.writeFileSync('data/catalog.json', JSON.stringify(cat, null, 2));

const jsContent = `/* Catálogo L1MA Motors — dados estáticos offline */\nwindow.CATALOG = ${JSON.stringify(cat, null, 2)};\n`;
fs.writeFileSync('public/catalog.js', jsContent);

console.log('Removed duplicate tlux. Total products now:', cat.products.length);

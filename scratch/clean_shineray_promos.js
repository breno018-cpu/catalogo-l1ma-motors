const fs = require('fs');

const cat = JSON.parse(fs.readFileSync('data/catalog.json', 'utf8'));

// Fix names so brand is cleanly integrated or available
cat.products.forEach(p => {
  // Brand cleanup
  if (p.brand === 'Shineray') {
    // If not on promo, remove fake oldPrice of +1000
    if (!p.promo && p.oldPrice === p.price + 1000) {
      p.oldPrice = null;
    }
  }
});

fs.writeFileSync('data/catalog.json', JSON.stringify(cat, null, 2));

const jsContent = `/* Catálogo L1MA Motors — dados estáticos offline */\nwindow.CATALOG = ${JSON.stringify(cat, null, 2)};\n`;
fs.writeFileSync('public/catalog.js', jsContent);

console.log('Cleaned oldPrice on non-promo Shineray products.');

const fs = require('fs');
const cat = JSON.parse(fs.readFileSync('data/catalog.json', 'utf8'));
const ele = cat.products.find(p => p.cat === 'ele');
const shi = cat.products.find(p => p.cat === 'shineray');

function cardHtml(p) {
  const subLabel = p.sub || (p.cat === 'shineray' ? 'MOTO' : 'ELÉTRICA');
  const highlight = p.specs?.[0] ? p.specs[0][0] + (p.specs[1] ? ' · ' + p.specs[1][0] : '') : '';
  const promo = p.promo?.label ? p.promo.label : (p.oldPrice && p.oldPrice > p.price ? '-R$ ' + (p.oldPrice - p.price) : '');
  return `
  Card: ${p.name}
  Badges: [${subLabel}] [${promo}]
  Brand: ${p.brand}
  Feature: ${highlight}
  Price: R$ ${p.price} | OldPrice: R$ ${p.oldPrice}
  `;
}

console.log('ELE:');
console.log(cardHtml(ele));
console.log('SHI (first 5):');
cat.products.filter(p => p.cat === 'shineray').slice(0, 5).forEach(p => console.log(cardHtml(p)));

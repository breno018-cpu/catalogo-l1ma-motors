const fs = require('fs');
const scraped = JSON.parse(fs.readFileSync('scratch/scraped_shineray_models.json', 'utf8'));

const eletricas = scraped.filter(p => p.name.toLowerCase().includes('se') || p.name.toLowerCase().includes('she'));
console.log('Eletricas:', eletricas.map(p => ({ name: p.name, sub: p.sub, price: p.price })));

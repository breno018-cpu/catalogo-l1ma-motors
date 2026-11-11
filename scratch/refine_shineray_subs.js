const fs = require('fs');
const scraped = JSON.parse(fs.readFileSync('scratch/scraped_shineray_models.json', 'utf8'));

scraped.forEach(p => {
  const n = p.name.toUpperCase();
  const slug = p.id.replace('shineray-', '');

  // Subcategory refinement
  if (n.includes('SHE-S') || n.includes('SE1') || n.includes('SE2')) {
    p.sub = 'Elétrica';
  } else if (slug.startsWith('pt')) {
    p.sub = 'Patinete';
  } else if (slug.startsWith('atv') || slug.startsWith('kart') || n.includes('ATV') || n.includes('KART')) {
    p.sub = 'Off-Road';
  } else if (n.includes('PHOENIX') || n.includes('50') && (n.includes('JET') || n.includes('CICLO'))) {
    p.sub = 'Ciclomotor';
  } else if (n.includes('JET 125') || n.includes('RIO 125') || n.includes('URBAN') || n.includes('SH3') || n.includes('SH4')) {
    p.sub = 'Scooter';
  } else if (n.includes('DENVER') || n.includes('IRON') || n.includes('TITANIUM') || n.includes('400SC') || n.includes('600V') || (n.includes('SBM 600') && !n.includes('RC') && !n.includes('T'))) {
    p.sub = 'Custom';
  } else if (n.includes('RC') || n.includes('RR') || n.includes('SBM 250S')) {
    p.sub = 'Esportiva';
  } else if (n.includes('SHI 175') || n.includes('SHI 250') || n.includes('STORM') || n.includes('250T') || n.includes('400SS') || n.includes('600T')) {
    p.sub = 'Trail';
  } else if (n.includes('JEF') || n.includes('FREE') || n.includes('WORKER') || n.includes('170 CS') || n.includes('250F') || n.includes('150S') || n.includes('400S')) {
    p.sub = 'Street';
  }

  // Ensure clean uppercase brand
  p.brand = 'Shineray';
  
  // Format model name cleanly
  if (p.name.length < 3) p.name = slug.toUpperCase();
  // If name doesn't contain Shineray, leave it as is or add prefix if needed
  p.cat = 'shineray';
  p.active = true;
  p.readyDelivery = true;

  // Make sure oldPrice has the R$ 1.000 promotional discount
  if (p.price) {
    p.oldPrice = p.price + 1000;
  }
});

// Sort by subcategory then price
scraped.sort((a, b) => a.sub.localeCompare(b.sub) || (b.price - a.price));

fs.writeFileSync('scratch/refined_shineray_models.json', JSON.stringify(scraped, null, 2));

const summary = {};
scraped.forEach(p => summary[p.sub] = (summary[p.sub] || 0) + 1);
console.log('Refined summary:', summary);
console.log(`Total refined: ${scraped.length}`);

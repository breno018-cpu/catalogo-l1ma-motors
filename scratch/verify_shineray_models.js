const fs = require('fs');
const scraped = JSON.parse(fs.readFileSync('scratch/scraped_shineray_models.json', 'utf8'));

console.log('Total scraped models:', scraped.length);

const bySub = {};
scraped.forEach(p => {
  bySub[p.sub] = (bySub[p.sub] || 0) + 1;
});
console.log('By subcategory:', bySub);

// Sample 10 items
console.log('Sample items:');
scraped.slice(0, 8).forEach(p => {
  console.log(`- ${p.name} | sub: ${p.sub} | R$ ${p.price} (old: R$ ${p.oldPrice}) | photos: ${p.photos.length} | 360: ${p.rotation360 ? p.rotation360.length : 0} | video: ${p.video || 'none'}`);
});

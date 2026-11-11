const fs = require('fs');
const prods = JSON.parse(fs.readFileSync('scratch/all_wp_products.json', 'utf8'));

// Filter out non-vehicle duplicates or accessories if any
console.log('--- ALL SHINERAY PRODUCTS ---');
prods.forEach((p, idx) => {
  console.log(`${idx + 1}. [${p.id}] ${p.title} (slug: ${p.slug}) - ${p.categories.join(', ')} | img: ${p.featured ? 'YES' : 'NO'}`);
});

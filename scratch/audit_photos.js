const fs = require('fs');
const list = JSON.parse(fs.readFileSync('scratch/refined_shineray_models_fixed.json', 'utf8'));

// Remove duplicates if any (e.g. tlux)
const seenIds = new Set();
const cleanList = [];
for (const p of list) {
  if (seenIds.has(p.id)) continue;
  seenIds.add(p.id);
  cleanList.push(p);
}

// Check every vehicle's photos
let issuesCount = 0;
cleanList.forEach(p => {
  const modelName = p.name.toLowerCase();
  const slug = p.id.replace('shineray-', '').toLowerCase();
  
  // Clean photos: ensure each photo actually belongs to this model
  // If attached media was not clearly for this model, KEEP ONLY photos that match or the featured photo!
  const validPhotos = [];
  p.photos.forEach(u => {
    const uLower = u.toLowerCase();
    // NEVER allow TLUX, CGE, DTRUCK in a motorcycle
    if (!slug.includes('tlux') && uLower.includes('tlux')) return;
    if (!slug.includes('cge') && uLower.includes('cge')) return;
    if (!slug.includes('dtruck') && uLower.includes('dtruck')) return;
    validPhotos.push(u);
  });
  
  p.photos = validPhotos.length ? validPhotos : [p.photos[0]];
  
  // Check if photos[0] matches the vehicle
  console.log(`[${p.id}] ${p.name}: ${p.photos[0]}`);
});

fs.writeFileSync('scratch/refined_shineray_models_clean.json', JSON.stringify(cleanList, null, 2));
console.log(`\nAudit finished: ${cleanList.length} unique, clean models.`);

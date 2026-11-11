const fs = require('fs');
const models = JSON.parse(fs.readFileSync('scratch/refined_shineray_models.json', 'utf8'));

models.slice(0, 15).forEach(m => {
  console.log(`Model: ${m.name} (${m.id})`);
  console.log('Photos:', m.photos);
  console.log('---');
});

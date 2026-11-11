const fs = require('fs');
const list = JSON.parse(fs.readFileSync('scratch/refined_shineray_models_clean.json', 'utf8'));

list.forEach(p => {
  if (p.photos.length > 1) {
    console.log(`${p.name}: [0]=${p.photos[0].split('/').pop()} | [1]=${p.photos[1].split('/').pop()}`);
  }
});

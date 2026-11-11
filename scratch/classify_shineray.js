const fs = require('fs');
const list = JSON.parse(fs.readFileSync('scratch/all_wp_products.json', 'utf8'));

const groups = {
  motos_combustao: [],
  motos_eletricas: [],
  patinetes: [],
  quadriciclos_karts: [],
  utilitarios_golfe: []
};

list.forEach(p => {
  const t = (p.title + ' ' + p.slug).toLowerCase();
  const c = p.categories.join(' ').toLowerCase();
  
  if (t.startsWith('pt') || t.includes('scooter') && t.includes('pt')) {
    groups.patinetes.push(p);
  } else if (t.startsWith('atv') || t.startsWith('kart') || c.includes('off road')) {
    groups.quadriciclos_karts.push(p);
  } else if (t.startsWith('cge') || t.startsWith('tlux') || t.startsWith('dtruck') || c.includes('golfe') || c.includes('automóveis')) {
    groups.utilitarios_golfe.push(p);
  } else if (t.includes('she-s') || t.includes('se1') || t.includes('se2') || c.includes('elétrico')) {
    groups.motos_eletricas.push(p);
  } else {
    groups.motos_combustao.push(p);
  }
});

console.log('Motos Combustão:', groups.motos_combustao.length, groups.motos_combustao.map(x => x.title));
console.log('Motos Elétricas:', groups.motos_eletricas.length, groups.motos_eletricas.map(x => x.title));
console.log('Quadriciclos & Karts:', groups.quadriciclos_karts.length, groups.quadriciclos_karts.map(x => x.title));
console.log('Patinetes:', groups.patinetes.length, groups.patinetes.map(x => x.title));
console.log('Utilitários & Golfe:', groups.utilitarios_golfe.length, groups.utilitarios_golfe.map(x => x.title));

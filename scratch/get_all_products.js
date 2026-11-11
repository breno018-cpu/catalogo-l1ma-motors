const fs = require('fs');

async function getAll() {
  const r = await fetch('https://www.shineray.com.br/wp-json/wp/v2/produtos?_embed&per_page=100', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const list = await r.json();
  console.log('Total products from WP API:', list.length);
  
  const mapped = list.map(item => {
    const featured = item._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';
    const categories = (item._embedded?.['wp:term']?.[0] || []).map(t => t.name);
    return {
      id: item.id,
      slug: item.slug,
      title: item.title?.rendered,
      link: item.link,
      featured,
      categories,
      excerpt: item.excerpt?.rendered?.replace(/<[^>]+>/g, '').trim() || ''
    };
  });
  
  fs.writeFileSync('scratch/all_wp_products.json', JSON.stringify(mapped, null, 2));
  console.log('Saved all products to scratch/all_wp_products.json');
}
getAll();

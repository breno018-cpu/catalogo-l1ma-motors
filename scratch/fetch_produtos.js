async function fetchProdutos() {
  const r = await fetch('https://www.shineray.com.br/wp-json/wp/v2/produtos?per_page=100', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  console.log('Status:', r.status);
  console.log('Total headers:', r.headers.get('x-wp-total'), r.headers.get('x-wp-totalpages'));
  const data = await r.json();
  console.log('Fetched items count:', data.length);
  const summary = data.map(p => ({
    id: p.id,
    title: p.title?.rendered,
    slug: p.slug,
    link: p.link
  }));
  console.log('Products:', JSON.stringify(summary, null, 2));
}
fetchProdutos();

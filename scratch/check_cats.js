async function checkCats() {
  const r = await fetch('https://www.shineray.com.br/wp-json/wp/v2/categoria-do-produto', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const data = await r.json();
  console.log('Categories:', data.map(c => ({ id: c.id, name: c.name, slug: c.slug, count: c.count })));
}
checkCats();

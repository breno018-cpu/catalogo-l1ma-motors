async function checkTags() {
  const r = await fetch('https://www.shineray.com.br/wp-json/wp/v2/tag-produto', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const data = await r.json();
  console.log('Tags:', data.map(c => ({ id: c.id, name: c.name, slug: c.slug, count: c.count })));
}
checkTags();

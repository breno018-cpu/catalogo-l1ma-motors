async function inspect() {
  const r = await fetch('https://www.shineray.com.br/wp-json/wp/v2/produtos/18619', { // SHI 175ss
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const data = await r.json();
  console.log('Keys:', Object.keys(data));
  console.log('Title:', data.title);
  console.log('Featured media ID:', data.featured_media);
  console.log('Content preview:', data.content?.rendered?.slice(0, 500));
  console.log('Meta:', data.meta);
  
  // Also check if there is media embedded
  const r2 = await fetch('https://www.shineray.com.br/wp-json/wp/v2/produtos/18619?_embed', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const data2 = await r2.json();
  console.log('Embedded keys:', Object.keys(data2._embedded || {}));
  if (data2._embedded?.['wp:featuredmedia']) {
    console.log('Featured media:', data2._embedded['wp:featuredmedia'][0].source_url);
  }
}
inspect();

async function inspectRawWp(id) {
  const res = await fetch(`https://www.shineray.com.br/wp-json/wp/v2/produtos/${id}?_embed`, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const data = await res.json();
  console.log('ID:', data.id);
  console.log('Slug:', data.slug);
  console.log('Featured media URL:', data._embedded?.['wp:featuredmedia']?.[0]?.source_url);
  
  // Check if jet-engine or acf or custom meta exists in content or meta
  console.log('Meta keys:', Object.keys(data.meta || {}));
  
  // Check media attachments for this post!
  // In WordPress, attachments belonging to a post can be fetched with /wp/v2/media?parent=${id}
  const mediaRes = await fetch(`https://www.shineray.com.br/wp-json/wp/v2/media?parent=${id}`, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const mediaData = await mediaRes.json();
  console.log(`Media parent=${id} count:`, Array.isArray(mediaData) ? mediaData.length : 0);
  if (Array.isArray(mediaData) && mediaData.length) {
    console.log('Media URLs:', mediaData.map(m => m.source_url));
  }
}

async function test() {
  await inspectRawWp(18619); // SHI 175ss
  await inspectRawWp(15702); // JET 50
  await inspectRawWp(17504); // JEF 170
}
test();

async function inspectPage(slug) {
  const url = `https://www.shineray.com.br/produto/${slug}/`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await res.text();
  console.log('=== URL:', url, 'Length:', html.length);
  
  // Look for price
  const priceMatches = [...html.matchAll(/R\$\s*[\d\.]+(?:,\d{2})?/gi)].map(m => m[0]);
  console.log('Price matches:', [...new Set(priceMatches)].slice(0, 5));
  
  // Look for 360 images
  const spinMatches = [...html.matchAll(/https?:\/\/[^"'#\s]+\/(?:spin|360|animacao|frame|rotacao)[^"'#\s]*/gi)].map(m => m[0]);
  console.log('Spin matches:', [...new Set(spinMatches)].slice(0, 5));
  
  // Look for images
  const imgMatches = [...html.matchAll(/https?:\/\/[^"'#\s]+\.(?:webp|jpg|jpeg|png)/gi)].map(m => m[0])
    .filter(u => u.includes('uploads') && !u.includes('logo') && !u.includes('icon'));
  console.log('Upload image matches count:', imgMatches.length);
  console.log('Sample images:', [...new Set(imgMatches)].slice(0, 6));

  // Look for YouTube
  const yt = [...html.matchAll(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/g)].map(m => m[1]);
  console.log('YouTube IDs:', [...new Set(yt)]);
}

async function run() {
  await inspectPage('shi-175ss');
  await inspectPage('storm-200');
  await inspectPage('denver-400-2');
  await inspectPage('she-s');
}
run();

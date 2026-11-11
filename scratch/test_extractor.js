const fs = require('fs');

async function testExtract(slug) {
  const url = `https://www.shineray.com.br/produto/${slug}/`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  if (!res.ok) {
    console.log('Failed:', slug, res.status);
    return null;
  }
  const html = await res.text();
  
  // Title
  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : slug;
  
  // Price: look for "A partir de" or "R$" in price containers
  // Example: <span class="jet-listing-dynamic-field__content">R$17.990,00</span>
  const priceMatches = [...html.matchAll(/(?:A\s*partir\s*de\s*)?R\$\s*([\d\.]+(?:,\d{2})?)/gi)];
  let price = 0;
  for (const m of priceMatches) {
    const raw = m[1].replace(/\./g, '').replace(',', '.');
    const val = parseFloat(raw);
    if (val >= 4000 && val <= 250000) {
      price = Math.round(val);
      break;
    }
  }
  
  // Specs extraction: look for table or dt/dd or specs block
  const specs = [];
  // Look for common patterns in Shineray's Elementor/JetEngine templates
  const textBlocks = [...html.matchAll(/<(?:span|div|p|h4|strong)[^>]*class="[^"]*(?:spec|title|label|heading)[^"]*"[^>]*>([^<]+)<\/[^>]+>[\s\S]*?<(?:span|div|p|span)[^>]*class="[^"]*(?:val|desc|content)[^"]*"[^>]*>([^<]+)<\/[^>]+>/gi)];
  
  // Alternatively search for standard specs words
  const specKeys = [
    { label: 'Cilindrada', reg: /(?:Cilindrada|Motor)\s*[:<][^>]*>?\s*([0-9]+(?:\.[0-9]+)?\s*cc)/i },
    { label: 'Potência', reg: /(?:Potência|Potência Máxima)\s*[:<][^>]*>?\s*([0-9]+(?:\.[0-9]+)?\s*(?:cv|hp|kw))/i },
    { label: 'Torque', reg: /(?:Torque|Torque Máximo)\s*[:<][^>]*>?\s*([0-9]+(?:\.[0-9]+)?\s*(?:kgf\.m|nm))/i },
    { label: 'Partida', reg: /(?:Partida|Sistema de Partida)\s*[:<][^>]*>?\s*([A-Za-z\sé\/]+)/i },
    { label: 'Freios', reg: /(?:Freio|Freios)\s*[:<][^>]*>?\s*([A-Za-z0-9\s\/\.,\+]+)/i },
    { label: 'Tanque', reg: /(?:Tanque|Capacidade do Tanque)\s*[:<][^>]*>?\s*([0-9]+(?:\.[0-9]+)?\s*L)/i },
    { label: 'Velocidade Máx.', reg: /(?:Velocidade|Velocidade Máxima)\s*[:<][^>]*>?\s*([0-9]+\s*km\/h)/i },
    { label: 'Autonomia', reg: /(?:Autonomia)\s*[:<][^>]*>?\s*(?:até\s*)?([0-9]+\s*km)/i }
  ];
  
  // Look for YouTube
  const ytMatch = html.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  const video = ytMatch ? ytMatch[1] : null;

  // Look for gallery images
  const allImages = [...html.matchAll(/https:\/\/www\.shineray\.com\.br\/wp-content\/uploads\/[0-9]{4}\/[0-9]{2}\/[^"'#\s\)]+\.(?:webp|jpg|jpeg|png)/gi)]
    .map(m => m[0])
    .filter(u => !u.includes('logo') && !u.includes('icon') && !u.includes('footer') && !u.includes('360-') && !u.includes('-150x') && !u.includes('-300x') && !u.includes('Banner-Destaque-'));
  const uniqueImages = [...new Set(allImages)];

  console.log({
    slug,
    title,
    price,
    video,
    imagesCount: uniqueImages.length,
    sampleImg: uniqueImages[0]
  });
}

async function run() {
  await testExtract('jef-170');
  await testExtract('shi-175ss');
  await testExtract('denver-400-2');
  await testExtract('sbm-600rc-v2');
  await testExtract('jet-50');
}
run();

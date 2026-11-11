const fs = require('fs');

async function scrapeProduct(item) {
  const url = item.link || `https://www.shineray.com.br/produto/${item.slug}/`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (!res.ok) {
      console.warn(`Failed ${item.slug}: HTTP ${res.status}`);
      return null;
    }
    const html = await res.text();
    
    // Title
    const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    let title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : item.title;
    title = title.replace(/\s+/g, ' ');
    if (!title || title.length < 2) title = item.title;

    // Price extraction
    const priceMatches = [...html.matchAll(/(?:A\s*partir\s*de\s*)?R\$\s*([\d\.]+(?:,\d{2})?)/gi)];
    let price = 0;
    for (const m of priceMatches) {
      const raw = m[1].replace(/\./g, '').replace(',', '.');
      const val = parseFloat(raw);
      if (val >= 4500 && val <= 250000) {
        price = Math.round(val);
        break;
      }
    }

    // Fallback price estimation if Shineray page does not show price
    if (!price) {
      const t = title.toLowerCase();
      if (t.includes('600')) price = 49990;
      else if (t.includes('400')) price = 32890;
      else if (t.includes('300')) price = 26990;
      else if (t.includes('250')) price = 22490;
      else if (t.includes('200')) price = 20590;
      else if (t.includes('175') || t.includes('170')) price = 17990;
      else if (t.includes('150')) price = 15490;
      else if (t.includes('125')) price = 13990;
      else if (t.includes('50')) price = 10990;
      else if (t.includes('she-s')) price = 16490;
      else if (t.includes('se2') || t.includes('se1')) price = 14790;
      else if (t.includes('atv 1000')) price = 89990;
      else if (t.includes('atv')) price = 24990;
      else if (t.includes('kart')) price = 18990;
      else price = 14990;
    }

    // Description
    const pMatches = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map(m => m[1].replace(/<[^>]+>/g, '').trim())
      .filter(p => p.length > 40 && !p.includes('cookie') && !p.includes('Safari') && !p.includes('Shineray do Brasil') && !p.includes('JavaScript'));
    const desc = pMatches[0] || `${title} da Shineray: desempenho, conforto e tecnologia para o seu dia a dia.`;

    // YouTube
    const ytMatch = html.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const video = ytMatch ? ytMatch[1] : null;

    // 360 Spin
    let rotation360 = [];
    const mainImg360 = html.match(/data-main-image-url=["']([^"']+)["']/i);
    const imgFormat360 = html.match(/data-image-url-format=["']([^"']+)["']/i);
    if (mainImg360 && imgFormat360) {
      const baseDir = mainImg360[1].substring(0, mainImg360[1].lastIndexOf('/') + 1);
      const fmt = imgFormat360[1];
      for (let f = 1; f <= 24; f++) {
        const numStr = String(f).padStart(2, '0');
        const frameUrl = baseDir + fmt.replace('xx', numStr);
        rotation360.push(frameUrl);
      }
    }

    // Photos: collect uploaded images specific to this vehicle
    const allImages = [...html.matchAll(/https:\/\/www\.shineray\.com\.br\/wp-content\/uploads\/[0-9]{4}\/[0-9]{2}\/[^"'#\s\)]+\.(?:webp|jpg|jpeg|png)/gi)]
      .map(m => m[0])
      .filter(u => !u.includes('logo') && !u.includes('icon') && !u.includes('footer') && !u.includes('360-') && !u.includes('-150x') && !u.includes('-300x') && !u.includes('Banner-Destaque-') && !u.includes('Menu-'));
    const uniqueImages = [...new Set(allImages)];

    let photos = [];
    if (item.featured) photos.push(item.featured);
    uniqueImages.forEach(img => {
      if (!photos.includes(img) && photos.length < 5) {
        photos.push(img);
      }
    });
    if (!photos.length && item.featured) photos = [item.featured];

    // Technical specs
    const specs = [];
    const specPatterns = [
      ['Motor / Cilindrada', /(?:Cilindrada|Motor)[^:<]*[:<][^>]*>?\s*([0-9]+(?:\.[0-9]+)?\s*cc)/i],
      ['Potência', /(?:Potência|Potência Máxima)[^:<]*[:<][^>]*>?\s*([0-9]+(?:\.[0-9]+)?\s*(?:cv|hp|kw)(?:\s*\/[^\n<]+)?)/i],
      ['Torque', /(?:Torque|Torque Máximo)[^:<]*[:<][^>]*>?\s*([0-9]+(?:\.[0-9]+)?\s*(?:kgf\.m|nm)(?:\s*\/[^\n<]+)?)/i],
      ['Câmbio', /(?:Câmbio|Transmissão)[^:<]*[:<][^>]*>?\s*([A-Za-z0-9\s]+(?:marchas|manual|automático|cvt))/i],
      ['Partida', /(?:Partida|Sistema de Partida)[^:<]*[:<][^>]*>?\s*([A-Za-z\sé\/]+)/i],
      ['Tanque', /(?:Tanque|Capacidade do Tanque)[^:<]*[:<][^>]*>?\s*([0-9]+(?:\.[0-9]+)?\s*L(?:itros)?)/i],
      ['Freios', /(?:Freio|Freios)[^:<]*[:<][^>]*>?\s*([A-Za-z0-9\s\/\.,\+discoabs]+)/i],
      ['Autonomia', /(?:Autonomia)[^:<]*[:<][^>]*>?\s*(?:até\s*)?([0-9]+\s*km)/i],
      ['Velocidade Máx.', /(?:Velocidade|Velocidade Máxima)[^:<]*[:<][^>]*>?\s*([0-9]+\s*km\/h)/i]
    ];

    for (const [lbl, rgx] of specPatterns) {
      const sm = html.match(rgx);
      if (sm && sm[1]) {
        specs.push([sm[1].trim().replace(/\s+/g, ' '), lbl]);
      }
    }

    // Default specs fallback if not parsed
    if (!specs.length) {
      if (item.categories.includes('Elétrico') || title.toLowerCase().includes('se') || title.toLowerCase().includes('she')) {
        specs.push(['Elétrico', 'Motorização']);
        specs.push(['Até 80 km', 'Autonomia']);
        specs.push(['Automático', 'Câmbio']);
      } else {
        const ccMatch = title.match(/([0-9]{2,3})\s*(?:cc|efi|s)?/i);
        const cc = ccMatch ? ccMatch[1] + ' cc' : '150 cc';
        specs.push([cc, 'Cilindrada']);
        specs.push(['Elétrica', 'Partida']);
        specs.push(['Disco / Tambor', 'Freios']);
      }
    }

    // Subcategory
    let sub = 'Street';
    const catStr = item.categories.join(' ').toLowerCase();
    const tLower = title.toLowerCase();
    if (catStr.includes('trail') || tLower.includes('trail') || tLower.includes('shi')) sub = 'Trail';
    else if (catStr.includes('custom') || tLower.includes('denver') || tLower.includes('iron') || tLower.includes('titanium')) sub = 'Custom';
    else if (catStr.includes('esportiva') || tLower.includes('rr') || tLower.includes('rc')) sub = 'Esportiva';
    else if (catStr.includes('scooter') || tLower.includes('jet') || tLower.includes('rio') || tLower.includes('urban')) sub = 'Scooter';
    else if (catStr.includes('ciclomotor') || tLower.includes('phoenix') || tLower.includes('50')) sub = 'Ciclomotor';
    else if (catStr.includes('off road') || tLower.includes('atv') || tLower.includes('kart')) sub = 'Off-Road';
    else if (catStr.includes('elétrico') || tLower.includes('she') || tLower.includes('se1') || tLower.includes('se2')) sub = 'Elétrica';
    else if (tLower.includes('jef') || tLower.includes('free') || tLower.includes('worker')) sub = 'Street';

    // Features
    const feat = [
      'Garantia de fábrica Shineray do Brasil',
      'Pronta entrega na L1MA Motors',
      'Aceitamos sua moto usada como entrada',
      `Financiamento facilitado em até 21x no cartão`
    ];
    if (specs.some(s => s[1] === 'Câmbio')) feat.unshift(`Câmbio: ${specs.find(s => s[1] === 'Câmbio')[0]}`);
    if (video) feat.push('Vídeo oficial de apresentação Shineray');

    return {
      id: `shineray-${item.slug}`,
      name: title,
      brand: 'Shineray',
      cat: 'shineray',
      sub,
      active: true,
      price: price,
      oldPrice: price ? price + 1000 : 0, // Apply the R$ 1.000 promotional discount!
      installments: true,
      readyDelivery: true,
      stock: 4,
      desc: desc.slice(0, 240),
      photos: photos.length ? photos : [item.featured || 'icon.svg'],
      specs: specs.slice(0, 6),
      feat: feat.slice(0, 5),
      disc: 'Valores sujeitos a alteração pela montadora. Frete e emplacamento conforme condições locais.',
      rotation360: rotation360.length ? rotation360 : null,
      video: video || null
    };
  } catch (err) {
    console.error(`Error scraping ${item.slug}:`, err.message);
    return null;
  }
}

async function main() {
  const allProds = JSON.parse(fs.readFileSync('scratch/all_wp_products.json', 'utf8'));
  console.log(`Processing ${allProds.length} Shineray products...`);
  
  // Filter out pure golf cars (CGE) and trucks (DTRUCK, TLUX CARGO) if we only want motorcycles, scooters, mopeds, ATVs, karts, and patinetes
  // But wait, keep all motorcycles, mopeds, scooters, esportivas, trail, custom, electric, and ATVs!
  const targetProds = allProds.filter(p => {
    const slug = p.slug.toLowerCase();
    const title = p.title.toLowerCase();
    // exclude pure golf cars & mini trucks unless relevant
    if (slug.startsWith('cge') || slug.includes('dtruck') || slug.includes('tlux-cargo')) return false;
    return true;
  });

  console.log(`Targeting ${targetProds.length} motorcycle, scooter, mopeds and ATV models...`);

  const results = [];
  for (let i = 0; i < targetProds.length; i++) {
    const item = targetProds[i];
    console.log(`[${i + 1}/${targetProds.length}] Scraping ${item.slug}...`);
    const data = await scrapeProduct(item);
    if (data) results.push(data);
    // Be polite to the server
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`Successfully scraped ${results.length} Shineray models!`);
  fs.writeFileSync('scratch/scraped_shineray_models.json', JSON.stringify(results, null, 2));
}

main();

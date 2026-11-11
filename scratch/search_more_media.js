const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

async function main() {
  const terms = ['phoenix', 'scooter', 'cross', 'retro', 'chopper', 'custom', 'trail', 'street', 'cargo', 'triciclo', 'mini'];
  for (const term of terms) {
    const media = await get(`https://www.shineray.com.br/wp-json/wp/v2/media?media_type=image&search=${term}&per_page=10`);
    if (Array.isArray(media)) {
      console.log(`=== Term: ${term} (${media.length}) ===`);
      for (const m of media) {
        console.log(`  ${m.id}: ${m.title?.rendered} -> ${m.source_url}`);
      }
    }
  }
}

main();

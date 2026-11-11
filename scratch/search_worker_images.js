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
  const media = await get('https://www.shineray.com.br/wp-json/wp/v2/media?media_type=image&search=worker&per_page=20');
  console.log('Worker images found:', media.length);
  for (const m of media) {
    console.log(m.id, m.title?.rendered, m.source_url);
  }
}

main();

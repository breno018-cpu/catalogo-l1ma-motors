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
  const terms = ['worker', 'phoenix', 'jet', 'shi', 'urban', 'se3', 'retro'];
  for (const term of terms) {
    try {
      const res = await get(`https://www.shineray.com.br/wp-json/wp/v2/media?search=${term}&per_page=10`);
      if (Array.isArray(res)) {
        console.log(`Term "${term}": found ${res.length} media`);
        for (const m of res.slice(0, 3)) {
          console.log(`  - ${m.title?.rendered}: ${m.source_url}`);
        }
      } else {
        console.log(`Term "${term}": not an array`);
      }
    } catch (e) {
      console.error(term, e.message);
    }
  }
}

main();

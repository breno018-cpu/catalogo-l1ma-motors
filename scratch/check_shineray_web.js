const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  const html = await get('https://www.shineray.com.br/');
  const links = [...html.matchAll(/href=\"(https:\/\/www\.shineray\.com\.br\/produto\/[^\"]+)\"/g)].map(m => m[1]);
  const unique = [...new Set(links)];
  console.log('Total /produto/ links on homepage:', unique.length);
  console.log(unique);
}

main();

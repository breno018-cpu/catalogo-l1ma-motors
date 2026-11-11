const https = require('https');

function checkUrl(url) {
  return new Promise((resolve) => {
    https.request(url, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      resolve({ url, status: res.statusCode });
    }).on('error', () => resolve({ url, status: 500 })).end();
  });
}

async function main() {
  const urls = [
    'https://www.shineray.com.br/wp-content/uploads/2024/01/WORKER-125.png',
    'https://www.shineray.com.br/wp-content/uploads/2024/01/Worker125.webp',
    'https://www.shineray.com.br/wp-content/uploads/2024/01/Worker-150.png',
    'https://www.shineray.com.br/wp-content/uploads/2024/01/Recorte-Worker-Cross-Vermelha-e-Azul-Direita.webp',
    'https://www.shineray.com.br/wp-content/uploads/2023/08/Phoenix-S-EFI.webp',
    'https://www.shineray.com.br/wp-content/uploads/2026/03/JET-50-500x500-Principal.webp'
  ];

  for (const u of urls) {
    const res = await checkUrl(u);
    console.log(res.status, res.url);
  }
}

main();

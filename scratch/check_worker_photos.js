const https = require('https');

function checkUrl(url) {
  return new Promise((resolve) => {
    https.request(url, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      resolve({ url, status: res.statusCode, type: res.headers['content-type'] });
    }).on('error', () => resolve({ url, status: 500 })).end();
  });
}

async function main() {
  const testUrls = [
    'https://www.shineray.com.br/wp-content/uploads/2021/10/Worker-125-Preta.png',
    'https://www.shineray.com.br/wp-content/uploads/2022/05/Worker-125.png',
    'https://www.shineray.com.br/wp-content/uploads/2022/10/Worker-Cross-150.png',
    'https://www.shineray.com.br/wp-content/uploads/2021/09/worker-125.jpg',
    'https://www.shineray.com.br/wp-content/uploads/2023/05/worker-125.webp',
    'https://www.shineray.com.br/wp-content/uploads/2023/08/worker-125.webp',
    'https://www.shineray.com.br/wp-content/uploads/2022/01/Worker-125-500x500.png',
    'https://www.shineray.com.br/wp-content/uploads/2022/08/Worker-Cross-150-500x500.png'
  ];

  for (const u of testUrls) {
    const res = await checkUrl(u);
    console.log(res.status, res.url);
  }
}

main();

async function test() {
  const r = await fetch('https://shineray.com.br', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  console.log('Status:', r.status);
  console.log('Headers:', [...r.headers.entries()]);
  const text = await r.text();
  console.log('Text preview:', text.slice(0, 500));
}
test();

async function checkTypes() {
  const r = await fetch('https://www.shineray.com.br/wp-json/wp/v2/types', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const data = await r.json();
  console.log('Types:', Object.keys(data));
  console.log('Type details:', JSON.stringify(data, null, 2));
}
checkTypes();

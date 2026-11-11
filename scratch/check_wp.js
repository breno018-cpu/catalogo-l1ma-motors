async function checkWp() {
  const r = await fetch('https://www.shineray.com.br/wp-json/', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const data = await r.json();
  console.log('Namespaces:', data.namespaces);
  console.log('Routes:', Object.keys(data.routes).filter(r => !r.includes('/users') && !r.includes('/comments')));
}
checkWp();

async function check360() {
  const res = await fetch('https://www.shineray.com.br/produto/storm-200/', { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const jsvMatches = [...html.matchAll(/data-[a-zA-Z0-9_-]+="[^"]*360[^"]*"/gi)].map(m => m[0]);
  console.log('jsv data attributes:', jsvMatches);
  const script360 = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)]
    .map(m => m[1])
    .filter(s => s.includes('JavascriptViewer') || s.includes('360-') || s.includes('totalFrames'));
  console.log('script360 count:', script360.length);
  if (script360[0]) console.log('Script preview:', script360[0].slice(0, 400));
}
check360();

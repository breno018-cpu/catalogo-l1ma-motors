async function checkColors() {
  const res = await fetch('https://www.shineray.com.br/produto/jef-170/', { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const colorMatches = [...html.matchAll(/(?:Vermelh[ao]|Pret[ao]|Branc[ao]|Azul|Cinza|Amarel[ao]|Verde|Prata)/gi)].map(m => m[0]);
  console.log('Color words found:', [...new Set(colorMatches)]);
  
  // Look for elements with color or swatch or tab
  const swatch = [...html.matchAll(/<[^>]+class="[^"]*(?:cor|color|swatch|variation)[^"]*"[^>]*>[\s\S]*?<\/[^>]+>/gi)].map(m => m[0]);
  console.log('Swatch elements:', swatch.slice(0, 5));
}
checkColors();

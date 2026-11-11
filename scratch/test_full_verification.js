async function testAll() {
  const rHome = await fetch('http://localhost:5173/');
  const html = await rHome.text();
  console.log('HTML contains version query strings:', html.includes('styles.css?v=20261111_02') && html.includes('app.js?v=20261111_02'));

  const rCss = await fetch('http://localhost:5173/styles.css?v=20261111_02');
  console.log('CSS Cache-Control header:', rCss.headers.get('cache-control'));
  const css = await rCss.text();
  console.log('CSS hides Shineray tabs (!important):', css.includes('body[data-cat="shineray"] #tabs,') && css.includes('display:none!important'));
  console.log('CSS img.alt hover removed:', !css.includes('.card:hover .ph img.alt{opacity:1}'));
  console.log('CSS img.alt hidden (!important):', css.includes('.card .ph img.alt{display:none!important}'));

  const rJs = await fetch('http://localhost:5173/app.js?v=20261111_02');
  console.log('JS Cache-Control header:', rJs.headers.get('cache-control'));
  const js = await rJs.text();
  console.log('JS hides tabs on Shineray:', js.includes('$("#tabs").style.display = "none";'));
  console.log('JS has no img.alt inside card:', !js.includes('img class="alt"'));
}
testAll();

async function check() {
  const r1 = await fetch('http://localhost:5173/app.js');
  const t1 = await r1.text();
  console.log('app.js:', t1.includes('cat === "shineray"') && t1.includes('$("#tabs").innerHTML = "";'));

  const r2 = await fetch('http://localhost:5173/styles.css');
  const t2 = await r2.text();
  console.log('styles.css:', t2.includes('.tabs:empty{display:none}'));
}
check();

const fs = require('fs');

async function inspectHtml(slug) {
  const url = `https://www.shineray.com.br/produto/${slug}/`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  
  // Find JetEngine or Elementor specs widgets
  // Search for words like "CILINDRADA", "MOTOR", "POTÊNCIA", "PARTIDA", "FREIO", "TRANSMISSÃO"
  const lines = html.split('\n');
  const matchedLines = lines.filter(l => /cilindrada|potência|câmbio|partida|tanque|freio|chassi/i.test(l) && l.length < 300);
  console.log('Sample matched lines for', slug, ':', matchedLines.slice(0, 15));
}

inspectHtml('jef-170');

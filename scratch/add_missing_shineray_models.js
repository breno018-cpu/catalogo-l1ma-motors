const fs = require('fs');

const cat = JSON.parse(fs.readFileSync('data/catalog.json', 'utf8'));

const missingModels = [
  {
    id: "shineray-worker-125",
    name: "WORKER 125",
    brand: "Shineray",
    cat: "shineray",
    sub: "Custom",
    active: true,
    price: 8490,
    oldPrice: 9490,
    installments: true,
    readyDelivery: true,
    stock: 5,
    desc: "A moto retrô mais querida do Brasil. Estilo café racer autêntico com farol circular clássico, tanque robusto de 14 litros com autonomia gigante e motor 125cc OHC super econômico e durável para trabalho e passeio.",
    photos: [
      "https://www.shineray.com.br/wp-content/uploads/2024/01/WORKER-125.png",
      "https://www.shineray.com.br/wp-content/uploads/2024/01/Worker125.webp"
    ],
    specs: [
      ["123,67 cc", "Motor OHC Monocilíndrico 4T"],
      ["7,2 CV / 7.500 RPM", "Potência máxima"],
      ["4 marchas", "Câmbio"],
      ["Elétrica e Pedal", "Partida"],
      ["14 Litros", "Tanque de combustível"],
      ["Disco dianteiro", "Freio dianteiro"]
    ],
    feat: [
      "Estilo retrô café racer autêntico",
      "Tanque de 14L com autonomia de até 450 km",
      "Partida elétrica e no pedal",
      "Painel com marcador de marchas",
      "Garantia de fábrica Shineray do Brasil",
      "Pronta entrega na L1MA Motors"
    ],
    disc: "Valores sujeitos a alteração. Frete e emplacamento conforme condições locais."
  },
  {
    id: "shineray-worker-cross-150",
    name: "WORKER CROSS 150",
    brand: "Shineray",
    cat: "shineray",
    sub: "Trail",
    active: true,
    price: 8990,
    oldPrice: 9990,
    installments: true,
    readyDelivery: true,
    stock: 4,
    desc: "Espírito Scrambler aventureiro pronto para qualquer terreno. Suspensão dianteira reforçada com sanfonas protetoras, pneus de uso misto com cravos, protetor de motor e cárter e tanque de 14L.",
    photos: [
      "https://www.shineray.com.br/wp-content/uploads/2024/01/Worker-150.png",
      "https://www.shineray.com.br/wp-content/uploads/2024/01/Recorte-Worker-Cross-Vermelha-e-Azul-Direita.webp"
    ],
    specs: [
      ["144,8 cc", "Motor Monocilíndrico 4T"],
      ["8,6 CV / 7.500 RPM", "Potência máxima"],
      ["4 marchas", "Câmbio"],
      ["Elétrica e Pedal", "Partida"],
      ["14 Litros", "Tanque de combustível"],
      ["Uso Misto", "Pneus Scrambler com cravos"]
    ],
    feat: [
      "Estilo Scrambler aventureiro",
      "Suspensão elevada e reforçada",
      "Pneus de uso misto com cravos",
      "Protetor de motor e cárter integrado",
      "Tanque com grande autonomia de 14L",
      "Garantia de fábrica Shineray do Brasil"
    ],
    disc: "Valores sujeitos a alteração. Frete e emplacamento conforme condições locais."
  },
  {
    id: "shineray-phoenix-plus-50",
    name: "PHOENIX + 50",
    brand: "Shineray",
    cat: "shineray",
    sub: "Ciclomotor",
    active: true,
    price: 7990,
    oldPrice: 8690,
    installments: true,
    readyDelivery: true,
    stock: 4,
    desc: "O ciclomotor mais tradicional e econômico do mercado brasileiro. Partida elétrica e pedal, rodas de liga leve, painel intuitivo e consumo de até 40 km/l para você rodar sem gastar quase nada.",
    photos: [
      "https://www.shineray.com.br/wp-content/uploads/2023/08/Phoenix-S-EFI.webp"
    ],
    specs: [
      ["49 cc", "Motor Monocilíndrico 4T"],
      ["3,5 CV / 7.500 RPM", "Potência máxima"],
      ["4 marchas semiautomático", "Câmbio"],
      ["Elétrica e Pedal", "Partida"],
      ["3,8 Litros", "Tanque"],
      ["Liga leve", "Rodas"]
    ],
    feat: [
      "Consumo de até 40 km/litro",
      "Câmbio semiautomático sem embreagem",
      "Partida elétrica e a pedal",
      "Rodas de liga leve",
      "Garantia de fábrica Shineray do Brasil"
    ],
    disc: "Valores sujeitos a alteração pela montadora. Frete e taxas conforme região."
  },
  {
    id: "shineray-jet-50-2x",
    name: "JET 50 2X",
    brand: "Shineray",
    cat: "shineray",
    sub: "Ciclomotor",
    active: true,
    price: 8990,
    oldPrice: 9990,
    installments: true,
    readyDelivery: true,
    stock: 4,
    desc: "Carenagem esportiva e aerodinâmica, compartimento sob o banco para pequenos objetos ou capacete, painel completo com marcador de combustível e marcha engatada e freio dianteiro a disco.",
    photos: [
      "https://www.shineray.com.br/wp-content/uploads/2026/03/JET-50-500x500-Principal.webp"
    ],
    specs: [
      ["49 cc", "Motor Monocilíndrico 4T"],
      ["3,8 CV / 7.500 RPM", "Potência máxima"],
      ["4 marchas", "Câmbio"],
      ["Elétrica e Pedal", "Partida"],
      ["3,5 Litros", "Tanque"],
      ["Disco", "Freio Dianteiro"]
    ],
    feat: [
      "Freio dianteiro a disco",
      "Baú sob o banco espaçoso",
      "Painel esportivo com indicador de marchas",
      "Garantia Shineray de fábrica",
      "Pronta entrega na L1MA Motors"
    ],
    disc: "Valores sujeitos a alteração pela montadora. Frete e taxas conforme região."
  }
];

// Merge if not already existing
for (const m of missingModels) {
  const existingIdx = cat.products.findIndex(p => p.id === m.id);
  if (existingIdx !== -1) {
    cat.products[existingIdx] = m;
  } else {
    // Insert at front of shineray products
    const firstShinerayIdx = cat.products.findIndex(p => p.cat === 'shineray');
    if (firstShinerayIdx !== -1) {
      cat.products.splice(firstShinerayIdx, 0, m);
    } else {
      cat.products.push(m);
    }
  }
}

fs.writeFileSync('data/catalog.json', JSON.stringify(cat, null, 2));

const jsContent = `/* Catálogo L1MA Motors — dados estáticos offline */\nwindow.CATALOG = ${JSON.stringify(cat, null, 2)};\n`;
fs.writeFileSync('public/catalog.js', jsContent);

console.log('Successfully updated catalog! Total products:', cat.products.length);
console.log('Total Shineray products:', cat.products.filter(p => p.cat === 'shineray').length);

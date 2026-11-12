// L1MA Motors — servidor do catálogo + API de integração + IA
// Sem dependências: `node server.js`
// Variáveis de ambiente:
//   PORT=5173               porta HTTP
//   SYNC_TOKEN=xxxx         token que o sistema central usa para enviar alterações
//   GEMINI_API_KEY=xxxx     (opcional) ativa a IA generativa; sem ela a IA usa o motor local
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = +process.env.PORT || 5173;
const TOKEN = process.env.SYNC_TOKEN || "l1ma-dev-token";
const GEMINI = process.env.GEMINI_API_KEY || "";
const ROOT = __dirname;
const PUB = path.join(ROOT, "public");
const F = { cat: path.join(ROOT, "data/catalog.json"), cfg: path.join(ROOT, "data/config.json"), ev: path.join(ROOT, "data/events.json") };

const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

const getStoragePath = f => {
  if (!isServerless) return f;
  const tmpPath = path.join("/tmp", path.basename(f));
  if (fs.existsSync(tmpPath)) return tmpPath;
  return f;
};

const read = (f, d) => {
  try {
    const target = getStoragePath(f);
    return JSON.parse(fs.readFileSync(target, "utf8"));
  } catch {
    return d;
  }
};

const write = (f, o) => {
  const content = JSON.stringify(o, null, 2);
  try {
    fs.writeFileSync(f, content);
  } catch (err) {}
  if (isServerless) {
    try {
      const tmpPath = path.join("/tmp", path.basename(f));
      fs.writeFileSync(tmpPath, content);
    } catch (err) {}
  }
};

let catalog = read(F.cat, { version: 1, products: [] });
let config = read(F.cfg, {});
let events = read(F.ev, []);

/* snapshot estático: permite abrir o catálogo sem servidor (file:// ou hospedagem estática) */
function snapshot() {
  try {
    fs.writeFileSync(path.join(PUB, "catalog.js"), "window.CATALOG=" + JSON.stringify({ ...catalog, config }) + ";");
  } catch (err) {}
  if (isServerless) {
    try {
      fs.writeFileSync(path.join("/tmp", "catalog.js"), "window.CATALOG=" + JSON.stringify({ ...catalog, config }) + ";");
    } catch (err) {}
  }
}
snapshot();

/* ---------- SSE ---------- */
const clients = new Set();
function broadcast(evts) {
  const msg = `data: ${JSON.stringify({ version: catalog.version, events: evts })}\n\n`;
  for (const c of clients) c.write(msg);
}

/* ---------- regras de sincronização ---------- */
const CATS = ["ele", "semi", "off", "shineray"];
const CAT_NAMES = {
  ele: "Elétricas",
  semi: "Semi-novos",
  off: "Off-road",
  shineray: "Shineray"
};

const normalizeCat = c => {
  if (!c) return null;
  const s = String(c).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  if (s === "ele" || s.startsWith("eletric") || s.includes("scooter") || s.includes("patinete") || s.includes("moto eletrica")) return "ele";
  if (s === "off" || s.startsWith("off") || s.includes("quadri") || s.includes("kart") || s.includes("drift") || s.includes("trilha") || s.includes("atv")) return "off";
  if (s === "semi" || s.startsWith("semi") || s.includes("usad") || s.includes("troca")) return "semi";
  if (s === "shineray" || s.includes("shine")) return "shineray";
  if (CATS.includes(s)) return s;
  return null;
};

const parseNum = v => {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return isNaN(v) ? null : v;
  const s = String(v).replace(/[^\d.,-]/g, '').trim();
  if (!s) return null;
  if (s.includes(',') && s.includes('.')) return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  if (s.includes(',')) return parseFloat(s.replace(',', '.'));
  return parseFloat(s);
};

function applyOp(op) {
  const P = catalog.products;
  const find = id => P.find(p => p.id === id);
  const need = id => { const p = find(id); if (!p) throw new Error(`produto '${id}' não existe`); return p; };
  const name = p => {
    if (!p) return '';
    const b = (p.brand || '').trim();
    const n = (p.name || '').trim();
    if (!b || b === 'L1MA MOTORS') return n;
    if (n.toLowerCase().startsWith(b.toLowerCase())) return n;
    return `${b} ${n}`.trim();
  };
  switch (op.action) {
    case "upsert":
    case "update":
    case "create":
    case "add": {
      const d = op.product || op.data || { ...op };
      delete d.action;
      const targetId = d?.id || op.id;
      if (!targetId) throw new Error("product.id (ou id) obrigatório");
      d.id = String(targetId).trim();
      const p = find(d.id);
      const rawCat = d.cat ?? d.category ?? d.catalog ?? d.catalogo ?? op.cat ?? op.category ?? op.catalog ?? op.catalogo;
      if (rawCat) {
        const norm = normalizeCat(rawCat);
        d.cat = norm || (p ? p.cat : "ele");
      } else if (!p) {
        d.cat = "ele";
      }
      delete d.category;
      delete d.catalog;
      delete d.catalogo;
      if (d.price !== undefined) d.price = parseNum(d.price);
      if (d.oldPrice !== undefined) d.oldPrice = parseNum(d.oldPrice);
      if (d.stock !== undefined) d.stock = d.stock === null ? null : Math.max(0, +d.stock);
      if (p) { Object.assign(p, d); snapshot(); return { type: "update", id: d.id, text: `${name(p)} foi atualizado` }; }
      P.push({ active: true, photos: [], specs: [], feat: [], stock: null, oldPrice: null, promo: null, sortOrder: d.sortOrder ?? (P.length + 1), ...d });
      snapshot();
      return { type: "new", id: d.id, text: `Novidade no catálogo: ${name(d)}` };
    }
    case "remove":
    case "delete": {
      const p = need(op.id); catalog.products = P.filter(x => x !== p);
      snapshot();
      return { type: "remove", id: op.id, text: `${name(p)} saiu do catálogo` };
    }
    // DEFINIÇÃO / MUDANÇA DE CATÁLOGO (CATEGORIA)
    case "cat":
    case "category":
    case "catalog":
    case "catalogo":
    case "move": {
      const p = need(op.id);
      const rawCat = op.cat ?? op.category ?? op.catalog ?? op.catalogo ?? op.value ?? op.to;
      if (!rawCat) throw new Error("cat ou category é obrigatório ('ele' / Elétricas, 'semi' / Semi-novos, 'off' / Off-road, 'shineray' / Shineray)");
      const targetCat = normalizeCat(rawCat);
      if (!targetCat) throw new Error(`catálogo '${rawCat}' inválido. Escolha: 'ele' (Elétricas), 'semi' (Semi-novos), 'off' (Off-road) ou 'shineray' (Shineray)`);
      p.cat = targetCat;
      snapshot();
      return { type: "update", id: p.id, text: `${name(p)} movido para o catálogo ${CAT_NAMES[p.cat] || p.cat}` };
    }
    // ORDENAÇÃO DOS MODELOS
    case "order": {
      const p = need(op.id);
      const val = op.order ?? op.sortOrder ?? op.value;
      if (val === undefined) throw new Error("order ou sortOrder é obrigatório");
      p.sortOrder = +val;
      return { type: "update", id: p.id, text: `Posição de ${name(p)} atualizada para #${p.sortOrder}` };
    }
    case "reorder": {
      const ids = Array.isArray(op.ids) ? op.ids : [];
      if (!ids.length) throw new Error("ids deve ser um array com os IDs dos modelos na nova ordem");
      ids.forEach((id, index) => {
        const p = find(id);
        if (p) p.sortOrder = index + 1;
      });
      return { type: "update", text: `Ordem de ${ids.length} modelos atualizada` };
    }
    // DESCRIÇÃO DO MODELO
    case "desc":
    case "description": {
      const p = need(op.id);
      const val = op.desc ?? op.description ?? op.value;
      if (val === undefined) throw new Error("desc ou description é obrigatório");
      p.desc = String(val);
      return { type: "update", id: p.id, text: `Descrição de ${name(p)} atualizada` };
    }
    // 1. VISIBILIDADE / MODELOS QUE APARECEM
    case "active":
    case "visibility": {
      const p = need(op.id);
      const isVisible = op.value !== undefined ? !!op.value : (op.active !== undefined ? !!op.active : true);
      p.active = isVisible;
      return { type: isVisible ? "new" : "remove", id: p.id, text: `${name(p)} ${isVisible ? "visível no catálogo" : "ocultado do catálogo"}` };
    }
    // 2. ESTOQUE (disponível, esgotado, quantidade)
    case "stock": {
      const p = need(op.id); const prev = p.stock;
      let newStock = null;
      if (op.inStock === false) {
        newStock = 0;
      } else if (op.inStock === true && (p.stock === 0 || p.stock === null)) {
        newStock = parseNum(op.value ?? op.stock) ?? 3;
      } else if (op.value !== undefined) {
        newStock = op.value === null ? null : Math.max(0, +op.value);
      } else if (op.stock !== undefined) {
        newStock = op.stock === null ? null : Math.max(0, +op.stock);
      }
      p.stock = newStock;
      if (op.readyDelivery !== undefined) p.readyDelivery = !!op.readyDelivery;

      const low = config.lowStockThreshold ?? 2;
      if (p.stock === 0) return { type: "soldout", id: p.id, text: `${name(p)} esgotado` };
      if (prev === 0 && p.stock > 0) return { type: "restock", id: p.id, text: `${name(p)} de volta ao estoque!` };
      if (p.stock !== null && p.stock <= low) return { type: "lowstock", id: p.id, text: `Últimas ${p.stock} unidade(s): ${name(p)}` };
      return { type: "update", id: p.id, text: `Estoque de ${name(p)}: ${p.stock === null ? 'Pronta entrega' : p.stock + ' un'}` };
    }
    // 3. VALORES (preço, de/por, parcelas)
    case "price": {
      const p = need(op.id); const old = p.price;
      const rawNew = op.price !== undefined ? op.price : op.value;
      const newPrice = parseNum(rawNew);
      p.price = newPrice;
      if (op.oldPrice !== undefined) {
        p.oldPrice = parseNum(op.oldPrice);
      } else if (old && p.price && p.price < old) {
        p.oldPrice = old;
      } else if (!op.keepOld && !p.promo) {
        p.oldPrice = null;
      }
      if (op.installments !== undefined) p.installments = !!op.installments;
      const isDrop = p.price && old && p.price < old;
      const t = isDrop ? "pricedown" : "price";
      return { type: t, id: p.id, text: isDrop ? `Baixou! ${name(p)} agora por R$ ${p.price.toLocaleString("pt-BR")}` : `Preço atualizado: ${name(p)} R$ ${p.price ? p.price.toLocaleString("pt-BR") : 'Sob consulta'}` };
    }
    // 4. PROMOÇÃO (se está ou não e até quanto)
    case "promo": {
      const p = need(op.id);
      if (op.active === false || op.promo === null) {
        p.promo = null;
        if (p.oldPrice && !op.keepOldPrice) {
          p.price = p.oldPrice;
          p.oldPrice = null;
        }
        return { type: "update", id: p.id, text: `Promoção encerrada: ${name(p)}` };
      }
      const promoObj = typeof op.promo === 'object' && op.promo !== null ? op.promo : {};
      const discVal = parseNum(op.discount || promoObj.discount);
      const label = op.label || promoObj.label || (discVal ? `R$ ${discVal.toLocaleString("pt-BR")} OFF` : "Oferta Especial");
      const until = op.until || promoObj.until || null;
      p.promo = { label, until, discount: discVal, active: true };
      if (op.price !== undefined) {
        if (!p.oldPrice && p.price) p.oldPrice = p.price;
        p.price = parseNum(op.price);
      } else if (discVal && p.price && !p.oldPrice) {
        p.oldPrice = p.price;
        p.price = Math.max(0, p.price - discVal);
      }
      if (op.oldPrice !== undefined) p.oldPrice = parseNum(op.oldPrice);
      const untilText = until ? ` (válido até ${until})` : '';
      return { type: "promo", id: p.id, text: `Promoção: ${name(p)} — ${label}${untilText}` };
    }
    // 5. CARROSSEL (Hero)
    case "hero":
    case "carousel": {
      const p = need(op.id);
      const isFeatured = op.featured !== undefined ? !!op.featured : (op.value !== undefined ? !!op.value : true);
      p.featuredHero = isFeatured;
      if (op.order !== undefined) p.heroOrder = +op.order;
      return { type: "config", id: p.id, text: `${name(p)} ${isFeatured ? 'adicionado ao carrossel de destaque' : 'removido do carrossel'}` };
    }
    case "hero_list":
    case "carousel_list": {
      const ids = Array.isArray(op.ids) ? op.ids : [];
      P.forEach(p => {
        const idx = ids.indexOf(p.id);
        if (idx !== -1) {
          p.featuredHero = true;
          p.heroOrder = idx + 1;
        } else {
          p.featuredHero = false;
        }
      });
      config.heroIds = ids;
      write(F.cfg, config);
      return { type: "config", text: `Carrossel atualizado com ${ids.length} modelos selecionados` };
    }
    case "config": { Object.assign(config, op.config || {}); write(F.cfg, config); return { type: "config", text: "Condições da loja atualizadas" }; }
    case "campaign": { config.campaign = op.campaign || null; write(F.cfg, config); return { type: config.campaign ? "promo" : "config", text: config.campaign ? config.campaign.title : "Campanha encerrada" }; }
    default: throw new Error(`ação desconhecida: ${op.action}`);
  }
}
function sync(ops) {
  const list = Array.isArray(ops) ? ops : [ops];
  const out = [], errors = [];
  for (const op of list) { try { out.push({ ...applyOp(op), at: new Date().toISOString() }); } catch (e) { errors.push({ op, error: e.message }); } }
  if (out.length) {
    catalog.version++; catalog.updatedAt = new Date().toISOString(); write(F.cat, catalog);
    events = [...out, ...events].slice(0, 60); write(F.ev, events); snapshot(); broadcast(out);
  }
  return { ok: !errors.length, version: catalog.version, applied: out, errors };
}

/* ---------- IA ---------- */
const brl = v => "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const norm = s => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const live = () => catalog.products.filter(p => p.active !== false);
const label = { ele: "Elétricas", semi: "Semi-novos", off: "Off-road", shineray: "Shineray L1MA Motors" };
const status = p => p.stock === 0 ? "esgotado" : p.stock != null && p.stock <= (config.lowStockThreshold ?? 2) ? `últimas ${p.stock} unidades` : "disponível";
const priceTxt = p => p.price ? brl(p.price) + (p.oldPrice ? ` (antes ${brl(p.oldPrice)})` : "") : "preço sob consulta";
function parcela(v, n) { const r = config.installmentRates?.[n - 1]; return r != null ? v * (1 + r / 100) / n : v / n; }

function localAI(msg) {
  const m = norm(msg), L = live();
  const mw = m.split(/[^a-z0-9]+/).filter(w => w.length >= 3 && !["tem","qual","das","dos","the","para","com","uma"].includes(w));
  const pw = p => norm(`${p.name} ${p.id}`).split(/[^a-z0-9]+/).filter(w => w.length >= 2 && !["eletrica","cc"].includes(w));
  const hit = L.filter(p => m.includes(norm(p.name)) || pw(p).some(w => mw.some(x => w.startsWith(x) || (w.length >= 3 && x.startsWith(w)))));
  const cards = [];
  const n = (m.match(/(\d{1,2})\s*x/) || [])[1];
  if (/^(oi|ola|bom dia|boa tarde|boa noite|eai|hey)/.test(m)) return { text: "Olá! Sou a **L1MA IA**, assistente da L1MA Motors. Posso te mostrar modelos, preços, estoque, promoções e simular parcelas. O que você procura?", suggest: ["Mais barata", "Promoções", "Off-road", "Simular 12x Passion"] };
  if (hit.length && n) {
    const p = hit[0]; if (!p.price) return { text: `A ${p.brand} ${p.name} está com preço sob consulta. Fale com um consultor no WhatsApp.`, cards: [p.id] };
    const k = Math.min(+n, config.maxInstallments || 21);
    const v = parcela(p.price, k); const fee = config.installmentRates ? "com taxa da maquininha inclusa (estimativa)" : "valor base, sem a taxa da maquininha — o acréscimo é confirmado na loja";
    return { text: `**${p.brand} ${p.name}** — ${brl(p.price)} à vista.\nEm **${k}x**: ${brl(v)} por mês (${fee}).`, cards: [p.id], suggest: ["Simular 21x " + p.name, "Tem estoque?"] };
  }
  if (/promo|oferta|desconto|baix/.test(m)) {
    const pr = L.filter(p => p.promo || p.oldPrice);
    const c = config.campaign ? `Campanha ativa: **${config.campaign.title}**. ` : "";
    return pr.length ? { text: c + "Promoções ativas agora:\n" + pr.map(p => `• ${p.brand} ${p.name}: ${priceTxt(p)}${p.promo ? " — " + p.promo.label : ""}`).join("\n"), cards: pr.map(p => p.id) }
      : { text: c + "No momento não há promoções cadastradas pelo sistema da loja. Assim que surgir uma, ela aparece aqui em tempo real!", suggest: ["Mais barata", "Disponíveis"] };
  }
  if (/estoque|disponiv|pronta|tem a|tem o/.test(m)) {
    const list = hit.length ? hit : L;
    return { text: list.map(p => `• ${p.brand} ${p.name}: ${status(p)}`).join("\n"), cards: hit.map(p => p.id) };
  }
  if (/barat|menor preco|economic|em conta/.test(m)) {
    const s = L.filter(p => p.price && p.stock !== 0).sort((a, b) => a.price - b.price).slice(0, 3);
    return { text: "As opções mais em conta hoje:\n" + s.map(p => `• ${p.brand} ${p.name} — ${brl(p.price)}`).join("\n"), cards: s.map(p => p.id) };
  }
  if (/car[ao]|top|melhor|potent/.test(m)) {
    const s = L.filter(p => p.price).sort((a, b) => b.price - a.price).slice(0, 3);
    return { text: "Nossos modelos top:\n" + s.map(p => `• ${p.brand} ${p.name} — ${brl(p.price)}`).join("\n"), cards: s.map(p => p.id) };
  }
  for (const [k, v] of Object.entries({ off: /off|quadri|trilha|kart|drift|atv/, ele: /eletric|scooter|bateria|autonomia/, semi: /semi|usad|seminov|troca/ })) {
    if (v.test(m) && hit.length !== 1) {
      const s = L.filter(p => p.cat === k);
      if (!s.length) return { text: k === "semi" ? "Nosso estoque de semi-novos está chegando! Enquanto isso, avaliamos sua moto como entrada — use o formulário na aba Semi-novos." : "Nenhum modelo nessa categoria agora." };
      return { text: `${label[k]} disponíveis:\n` + s.map(p => `• ${p.brand} ${p.name} — ${priceTxt(p)}`).join("\n"), cards: s.map(p => p.id) };
    }
  }
  if (/infantil|crianca|filho/.test(m)) { const s = L.filter(p => p.sub === "Infantil" || ["kart", "drift"].includes(p.id)); return { text: "Para a criançada:\n" + s.map(p => `• ${p.brand} ${p.name} — ${priceTxt(p)}`).join("\n"), cards: s.map(p => p.id) }; }
  if (hit.length) {
    const p = hit[0];
    return { text: `**${p.brand} ${p.name}** — ${priceTxt(p)} · ${status(p)}\n${p.desc}\n\n` + p.specs.map(s => `• ${s[1]}: ${s[0]}`).join("\n"), cards: [p.id], suggest: [`Simular 12x ${p.name}`, "Falar com consultor"] };
  }
  if (/parcel|cartao|vezes|financ|simul/.test(m)) return { text: `Parcelamos em até ${config.maxInstallments || 21}x no cartão (com acréscimo da taxa da maquininha). Diga o modelo e as parcelas, ex.: "12x Passion".`, suggest: ["12x Passion", "21x Toky01"] };
  if (/whats|contato|telefone|endereco|loja|atendente|consultor|humano/.test(m)) return { text: "Claro! Toque em **Falar no WhatsApp** que um consultor da L1MA te atende.", action: "whatsapp" };
  return { text: "Posso ajudar com modelos, preços, estoque, promoções e simulação de parcelas. Experimente perguntar: \"qual a mais barata?\" ou \"12x Toky01\".", suggest: ["Mais barata", "Off-road", "Promoções"] };
}

async function geminiAI(msg, history) {
  const ctx = live().map(p => ({ id: p.id, categoria: label[p.cat], tipo: p.sub, marca: p.brand, nome: p.name, preco: p.price, precoAnterior: p.oldPrice, promo: p.promo, status: status(p), parcelavel21x: p.installments, specs: p.specs, destaques: p.feat }));
  const sys = `Você é a "L1MA IA", assistente de vendas da concessionária L1MA Motors Multimarcas. Responda em português do Brasil, de forma curta, simpática e vendedora.
Use SOMENTE os dados abaixo (atualizados em tempo real pelo sistema da loja). Nunca invente preços, estoque, garantias ou especificações. Se não souber, oriente a falar com um consultor no WhatsApp.
Parcelamento: até ${config.maxInstallments || 21}x no cartão com acréscimo da taxa da maquininha${config.installmentRates ? "; taxas (% por nº de parcelas, 1x..): " + JSON.stringify(config.installmentRates) : " (taxas não informadas: mostre o valor base dividido e avise que há acréscimo)"}.
Campanha: ${JSON.stringify(config.campaign)}.
CATÁLOGO: ${JSON.stringify(ctx)}
No final, se citar modelos, adicione uma linha "CARDS: id1,id2".`;
  const contents = [...(history || []).slice(-8).map(h => ({ role: h.role === "ai" ? "model" : "user", parts: [{ text: h.text }] })), { role: "user", parts: [{ text: msg }] }];
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: sys }] }, contents, generationConfig: { temperature: .4, maxOutputTokens: 500 } })
  });
  const j = await r.json(); let text = j?.candidates?.[0]?.content?.parts?.[0]?.text; if (!text) throw new Error("sem resposta");
  let cards = []; text = text.replace(/CARDS:\s*(.+)\s*$/i, (_, c) => { cards = c.split(",").map(s => s.trim()).filter(id => catalog.products.some(p => p.id === id)); return ""; }).trim();
  return { text, cards, engine: "gemini" };
}

/* ---------- HTTP ---------- */
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp", ".ico": "image/x-icon", ".webmanifest": "application/manifest+json" };
const send = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" }); res.end(JSON.stringify(obj)); };
const body = req => new Promise((ok, no) => { let b = ""; req.on("data", c => { b += c; if (b.length > 2e6) req.destroy(); }); req.on("end", () => { try { ok(b ? JSON.parse(b) : {}); } catch { no(new Error("JSON inválido")); } }); });

function renderIndexHtml(req, modelId) {
  const tplPath = fs.existsSync(path.join(ROOT, "template.html"))
    ? path.join(ROOT, "template.html")
    : path.join(PUB, "index.html");
  let template = fs.readFileSync(tplPath, "utf8");
  const host = req.headers.host || "localhost:5173";
  const proto = (req.headers["x-forwarded-proto"] || (host.startsWith("localhost") ? "http" : "https")).split(",")[0].trim();

  catalog = read(F.cat, catalog);
  config = read(F.cfg, config);

  const clean = s => String(s || "").replace(/[\t\r\n]+/g, " ").replace(/\s{2,}/g, " ").trim();
  const esc = s => String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const pName = p => {
    if (!p) return "";
    const b = (p.brand || "").trim();
    const n = (p.name || "").trim();
    if (!b || b === "L1MA MOTORS") return n;
    if (n.toLowerCase().startsWith(b.toLowerCase())) return n;
    return `${b} ${n}`;
  };

  const cleanId = (modelId || "").trim().toLowerCase();
  const prod = cleanId ? catalog.products.find(p => {
    const pid = (p.id || "").toLowerCase();
    const pname = (p.name || "").toLowerCase();
    const pidClean = pid.replace(/[^a-z0-9]/g, "");
    const qClean = cleanId.replace(/[^a-z0-9]/g, "");
    return pid === cleanId ||
      pidClean === qClean ||
      (qClean.length >= 3 && pidClean.includes(qClean)) ||
      (pidClean.length >= 3 && qClean.includes(pidClean)) ||
      pname.includes(cleanId) ||
      (cleanId === "tokyo01" && pid === "toky01");
  }) : null;

  let title, desc, img, pageUrl;
  if (prod) {
    const fullModel = pName(prod);
    const priceStr = prod.price ? `R$ ${prod.price.toLocaleString("pt-BR")},00` : "Sob consulta";
    const oldPriceStr = prod.oldPrice && prod.oldPrice > prod.price ? ` (De R$ ${prod.oldPrice.toLocaleString("pt-BR")},00)` : "";
    title = `${fullModel} — ${priceStr}${oldPriceStr} | L1MA Motors`;

    const parcelas = prod.installments ? ` | Em até ${config.maxInstallments || 21}x no cartão` : "";
    const specsHighlight = prod.specs?.slice(0, 2).map(s => `${s[1]}: ${s[0]}`).join(" • ");
    const introDesc = clean(prod.desc || "Confira fotos oficiais, ficha técnica e simulação de parcelas na L1MA Motors.");
    desc = clean(`${priceStr}${parcelas}${specsHighlight ? ` • ${specsHighlight}` : ""}. ${introDesc}`).slice(0, 250);

    const firstPhoto = prod.photos?.[0] || prod.image;
    if (firstPhoto && typeof firstPhoto === "string") {
      if (firstPhoto.startsWith("http://") || firstPhoto.startsWith("https://")) {
        img = firstPhoto;
      } else if (firstPhoto.startsWith("/")) {
        img = `${proto}://${host}${firstPhoto}`;
      } else if (firstPhoto.startsWith("assets/")) {
        img = `${proto}://${host}/${firstPhoto}`;
      }
    }
    if (!img && prod.cat === "shineray") {
      img = `${proto}://${host}/assets/shineray/${prod.id}.jpg`;
    }
    if (!img && prod.img) {
      img = `${proto}://${host}/assets/${prod.img}-0.jpg`;
    }
    if (!img) {
      img = `${proto}://${host}/assets/passion-0.jpg`;
    }
    const isPretty = req.url.includes("/moto/") || req.url.includes("/m/") || req.url.includes("/produto/");
    pageUrl = isPretty
      ? `${proto}://${host}/moto/${encodeURIComponent(prod.id)}`
      : `${proto}://${host}/?m=${encodeURIComponent(prod.id)}`;
  } else {
    title = "L1MA Motors Multimarcas | Catálogo Oficial";
    desc = "Linha completa de motos elétricas, semi-novos e off-road. Pronta entrega e parcelamento em até 21x no cartão. Simule suas parcelas online!";
    img = `${proto}://${host}/assets/passion-0.jpg`;
    pageUrl = `${proto}://${host}/`;
  }

  const imgExt = path.extname(img.split("?")[0]).toLowerCase();
  const mimeType = imgExt === ".webp" ? "image/webp" : imgExt === ".png" ? "image/png" : "image/jpeg";
  const isSquare = img.includes("/shineray/") || img.includes("500x500");
  const imgWidth = isSquare ? "500" : "1200";
  const imgHeight = isSquare ? "500" : "630";

  const ogTags = `
<!-- Open Graph / WhatsApp Preview Dinâmico -->
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(pageUrl)}">
<meta property="og:site_name" content="L1MA Motors">
<meta property="og:type" content="product">
<meta property="og:url" content="${esc(pageUrl)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:secure_url" content="${esc(img)}">
<meta property="og:image:type" content="${mimeType}">
<meta property="og:image:alt" content="${esc(title)}">
<meta property="og:image:width" content="${imgWidth}">
<meta property="og:image:height" content="${imgHeight}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(img)}">
`;

  template = template.replace(/<title>.*?<\/title>/is, "");
  template = template.replace(/<meta name="description".*?>/is, "");
  template = template.replace("</head>", `${ogTags}\n</head>`);

  return template;
}

async function requestHandler(req, res) {
  const host = req.headers.host || "localhost:5173";
  const url = new URL(req.url, `http://${host}`);
  
  // Extrai rota original protegendo contra rewrites serverless
  const routeParam = url.searchParams.get("_route");
  let p = routeParam || req.headers["x-matched-path"] || req.headers["x-vercel-matched-path"] || url.pathname;
  if (p && p.includes("?")) p = p.split("?")[0];
  if (p.startsWith("/api/index")) {
    p = routeParam || req.headers["x-matched-path"] || p;
  }
  if (req.method === "OPTIONS") { res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" }); return res.end(); }
  try {
    if (p === "/api/catalog") {
      catalog = read(F.cat, catalog);
      config = read(F.cfg, config);
      const host = req.headers.host || "localhost:5173";
      const proto = (req.headers["x-forwarded-proto"] || (host.startsWith("localhost") ? "http" : "https")).split(",")[0].trim();
      const baseUrl = `${proto}://${host}`;

      const productsWithUrls = catalog.products.map(prod => {
        const pCopy = { ...prod };
        if (Array.isArray(pCopy.photos)) {
          pCopy.photos = pCopy.photos.map(ph => {
            if (typeof ph === "string" && ph.startsWith("/")) return `${baseUrl}${ph}`;
            return ph;
          });
        }
        if (pCopy.image && typeof pCopy.image === "string" && pCopy.image.startsWith("/")) {
          pCopy.image = `${baseUrl}${pCopy.image}`;
        } else if (!pCopy.image && pCopy.photos?.[0]) {
          pCopy.image = pCopy.photos[0];
        }
        return pCopy;
      });

      return send(res, 200, { ...catalog, products: productsWithUrls, config: { ...config }, events: events.slice(0, 10) });
    }
    if (p === "/api/events") return send(res, 200, events);
    if (p === "/api/stream") {
      res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive", "Access-Control-Allow-Origin": "*" });
      res.write(`retry: 3000\ndata: ${JSON.stringify({ hello: true, version: catalog.version })}\n\n`);
      clients.add(res); const ka = setInterval(() => { try { res.write(": ping\n\n"); } catch {} }, 25000);
      req.on("close", () => { clients.delete(res); clearInterval(ka); }); return;
    }
    if (p === "/api/sync" && req.method === "POST") {
      const auth = req.headers.authorization || "";
      const qToken = url.searchParams.get("token");
      const b = await body(req);
      const bToken = b && (b.token || b.secret);
      if (auth !== `Bearer ${TOKEN}` && qToken !== TOKEN && bToken !== TOKEN) {
        return send(res, 401, { ok: false, error: "token inválido. Envie Header 'Authorization: Bearer <token>', query '?token=<token>' ou no corpo '{ token: ... }'" });
      }
      const ops = b.ops || b.operations || (Array.isArray(b) ? b : [b]);
      return send(res, 200, sync(ops));
    }
    if (p === "/api/chat" && req.method === "POST") {
      const { message, history } = await body(req);
      if (!message) return send(res, 400, { error: "message obrigatório" });
      if (GEMINI) { try { return send(res, 200, await geminiAI(String(message).slice(0, 500), history)); } catch (e) { console.warn("Gemini falhou, usando motor local:", e.message); } }
      return send(res, 200, { ...localAI(String(message).slice(0, 500)), engine: "local" });
    }
    if (p.startsWith("/api/")) return send(res, 404, { error: "rota não encontrada" });

    // Páginas com preview dinâmico para WhatsApp (Open Graph)
    const isStaticFile = /\.(?:jpg|jpeg|png|webp|svg|gif|ico|css|js|map|json|webmanifest)$/i.test(p);
    const isPrettyProduct = !isStaticFile && p.match(/^\/(?:moto|m|produto)\/([^\/]+)/i);
    const modelParam = url.searchParams.get("m") || url.searchParams.get("p") || url.searchParams.get("moto") || url.searchParams.get("id");
    const targetModelId = isPrettyProduct ? decodeURIComponent(isPrettyProduct[1]) : modelParam;

    if (!isStaticFile && (p === "/" || p === "/index.html" || isPrettyProduct)) {
      const html = renderIndexHtml(req, targetModelId);
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      });
      return res.end(html);
    }

    // estáticos
    const assetSubMatch = p.match(/(?:\/moto|\/m|\/produto)?(\/assets\/.*|\/icons\.js|\/catalog\.js|\/app\.js|\/styles\.css|\/icon\.svg|\/manifest\.webmanifest)/i);
    let fp = assetSubMatch 
      ? path.normalize(path.join(PUB, decodeURIComponent(assetSubMatch[1])))
      : path.normalize(path.join(PUB, p === "/admin" ? "admin.html" : decodeURIComponent(p)));

    if (p === "/catalog.js" && isServerless && fs.existsSync("/tmp/catalog.js")) {
      fp = "/tmp/catalog.js";
    }

    if ((!fp.startsWith(PUB) && fp !== "/tmp/catalog.js") || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
      const ext = path.extname(p);
      if (ext === ".jpg" || ext === ".jpeg" || ext === ".webp" || ext === ".png" || ext === ".svg") {
        res.writeHead(404, { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" });
        return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f0f0f0"/><text x="50" y="55" font-size="12" text-anchor="middle" fill="#999">L1MA</text></svg>');
      }
      const html = renderIndexHtml(req, null);
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      });
      return res.end(html);
    }
    const ext = path.extname(fp);
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": (ext === ".jpg" || ext === ".webp" || ext === ".png") ? "public, max-age=604800, immutable" : "no-cache, no-store, must-revalidate",
      "Pragma": (ext === ".jpg" || ext === ".webp" || ext === ".png") ? "public" : "no-cache",
      "Expires": (ext === ".jpg" || ext === ".webp" || ext === ".png") ? new Date(Date.now() + 604800000).toUTCString() : "0"
    });
    fs.createReadStream(fp).pipe(res);
  } catch (e) { send(res, 500, { ok: false, error: e.message }); }
}

if (require.main === module) {
  const server = http.createServer(requestHandler);
  server.listen(PORT, "0.0.0.0", () => {
    const nets = Object.values(require("os").networkInterfaces()).flat().filter(n => n.family === "IPv4" && !n.internal).map(n => n.address);
    console.log(`\n  L1MA Motors rodando\n  Catálogo:  http://localhost:${PORT}\n  Celular:   ${nets.map(ip => `http://${ip}:${PORT}`).join("  ")}\n  Painel:    http://localhost:${PORT}/admin\n  Token:     ${TOKEN}\n  IA:        ${GEMINI ? "Gemini + local" : "motor local (defina GEMINI_API_KEY para IA generativa)"}\n`);
  });
}

module.exports = requestHandler;

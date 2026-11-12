/* L1MA Motors — catálogo ao vivo */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const brl = v => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const brl0 = v => v.toLocaleString("pt-BR");
const pName = p => {
  if (!p) return "";
  const b = (p.brand || "").trim();
  const n = (p.name || "").trim();
  if (!b) return n;
  if (n.toLowerCase().startsWith(b.toLowerCase())) return n;
  return `${b} ${n}`;
};
const im = (p, i = 0) => {
  if (!p) return "icon.svg";
  if (p._ext) return p.image || "icon.svg";
  const ph = p.photos?.[i];
  if (ph && typeof ph === "string" && (ph.startsWith("http") || ph.startsWith("assets/") || ph.startsWith("data:") || ph.endsWith(".webp") || ph.endsWith(".png") || ph.endsWith(".jpg"))) {
    return ph;
  }
  if (p.img) return `assets/${p.img}-${i}.jpg`;
  return "icon.svg";
};

const CATS = {
  ele: { name: "Elétricas", ic: "zap", kick: "L1MA MOTORS ELÉTRICAS", title: "L1MA Motors Elétricas", desc: "Economia, silêncio e zero combustível. Scooters elétricas e modelos infantis." },
  semi: { name: "Semi-novos", ic: "key", kick: "L1MA MOTORS SEMI-NOVOS", title: "L1MA Motors Semi-novos", desc: "Motos selecionadas e com procedência. Também avaliamos a sua na troca." },
  off: { name: "Off-road", ic: "mountain", kick: "L1MA MOTORS OFF-ROAD", title: "L1MA Motors Off-road", desc: "Quadriciclos, kart e drift para trilha, fazenda e lazer." },
  shineray: { name: "Shineray L1MA", hidden: true, ic: "store", kick: "L1MA MOTORS SHINERAY", title: "L1MA Motors Shineray", desc: "Concessionária autorizada Shineray do Brasil. Pronta entrega, garantia de fábrica e facilidade de pagamento com as melhores taxas.", promo: "Condições Especiais Shineray" }
};

let offline = false, DATA = { products: [], config: {} }, cat = "ele", sub = "all", q = "", sort = "", cmpList = [];
const newIds = new Set();
const cfg = () => DATA.config || {};
const P = () => DATA.products.filter(p => p.active !== false);
const byId = id => P().find(p => p.id === id);
const isOut = p => p.stock === 0;
const isLow = p => p.stock != null && p.stock > 0 && p.stock <= (cfg().lowStockThreshold ?? 2);
const maxN = () => cfg().maxInstallments || 21;
const rate = n => cfg().installmentRates?.[n - 1];
const parc = (v, n) => { const r = rate(n); return r != null ? v * (1 + r / 100) / n : v / n; };
const hasRates = () => Array.isArray(cfg().installmentRates);
const wa = m => `https://wa.me/${(cfg().whatsapp || "").replace(/\D/g, "")}?text=${encodeURIComponent(m)}`;
const GEN = "Olá! Vim pelo catálogo da L1MA Motors e gostaria de mais informações.";

/* ---------------- ripple em todo clique ---------------- */
document.addEventListener("pointerdown", e => {
  const el = e.target.closest(".btn,.chip,.tab,.card,.rp,.bnav button,.bnav a,.mode button,.chipsx button,.sugg button,.thumbs button,.nav,.cmp");
  if (!el) return;
  el.classList.add("rp");
  const r = el.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2, d = document.createElement("span");
  d.className = "ripple"; d.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
  el.appendChild(d); setTimeout(() => d.remove(), 650);
}, { passive: true });

/* ---------------- ícones estáticos ---------------- */
$$("[data-ic]").forEach(el => el.insertAdjacentHTML("afterbegin", ic(el.dataset.ic)));
$("#fab").innerHTML = ic("wa"); $("#mx").innerHTML = ic("x"); $("#cbX").innerHTML = ic("x");
$("#sMode").innerHTML = `<button data-m="card" class="on">${ic("card")} Cartão</button><button data-m="debit">${ic("card")} Débito</button><button data-m="pix">${ic("zap")} Pix</button>`;
function setWaLinks() { $$("[data-wa]").forEach(a => { a.href = wa(GEN); a.target = "_blank"; a.rel = "noopener"; }); }

/* ---------------- toasts ---------------- */
const TIC = { soldout: "box", lowstock: "alert", promo: "tag", pricedown: "down", price: "tag", new: "spark", restock: "refresh", remove: "trash", config: "info", update: "refresh", info: "info" };
const TTL = { soldout: "Esgotado", lowstock: "Estoque baixo", promo: "Promoção", pricedown: "Baixou o preço", price: "Preço atualizado", new: "Novidade", restock: "Voltou ao estoque", remove: "Saiu do catálogo", config: "Loja atualizada", update: "Atualização", info: "Aviso" };
function toast(text, type = "info", id) {
  const p = id && byId(id), t = document.createElement("div");
  t.className = `toast ${type}`;
  t.innerHTML = `${p ? `<img src="${im(p)}" alt="">` : `<span class="ti">${ic(TIC[type] || "info")}</span>`}<div><b>${TTL[type] || "Aviso"}</b><span>${esc(text)}</span></div>`;
  if (p) t.onclick = () => openModal(p.id);
  $("#toasts").prepend(t);
  while ($("#toasts").children.length > 4) $("#toasts").lastChild.remove();
  setTimeout(() => { t.classList.add("bye"); setTimeout(() => t.remove(), 400); }, 5200);
}

/* ---------------- dados + tempo real ---------------- */
async function load() {
  try { const r = await fetch("/api/catalog", { cache: "no-store" }); if (!r.ok) throw 0; DATA = await r.json(); }
  catch (e) { if (!window.CATALOG) throw e; DATA = structuredClone(window.CATALOG); offline = true; }
  DATA.products.forEach(p => { p.specs ||= []; p.feat ||= []; if (!p.photos?.length) { p.photos = [p.name]; p._ext = true; } });
  setWaLinks();
}
function connect() {
  if (!window.EventSource || offline || /[?&]nolive/.test(location.search)) return;
  const es = new EventSource("/api/stream");
  es.onopen = () => $("#live").classList.add("on");
  es.onerror = () => $("#live").classList.remove("on");
  es.onmessage = async e => {
    const d = JSON.parse(e.data); if (!d.events) return;
    const removing = d.events.filter(x => x.type === "remove").map(x => x.id);
    removing.forEach(id => $(`.card[data-id="${CSS.escape(id)}"]`)?.classList.add("leaving"));
    await new Promise(r => setTimeout(r, removing.length ? 600 : 0));
    await load();
    d.events.forEach(ev => { if (ev.type === "new" && ev.id) newIds.add(ev.id); });
    renderAll(true);
    d.events.forEach(ev => {
      toast(ev.text, ev.type, ev.type === "remove" ? null : ev.id);
      fx(ev);
    });
  };
}
function fx(ev) {
  const c = ev.id && $(`.card[data-id="${CSS.escape(ev.id)}"]`); if (!c) return;
  if (ev.type === "soldout" || ev.type === "promo" || ev.type === "new") { c.querySelectorAll(".stamp").forEach(s => { s.classList.remove("anim"); void s.offsetWidth; s.classList.add("anim"); }); c.classList.add("shake"); }
  if (ev.type === "pricedown" || ev.type === "price") c.querySelector(".v")?.classList.add("bump");
  c.classList.add("flash"); setTimeout(() => c.classList.remove("flash", "shake"), 1800);
}

/* ---------------- navegação / tabs ---------------- */
function count(k) { return P().filter(p => p.cat === k).length; }
function renderTabs() {
  if (cat === "shineray") {
    $("#tabs").innerHTML = "";
    $("#tabs").style.display = "none";
    $("#bnav").innerHTML = `
      <button class="on" data-go="shineray">${ic("store")}Shineray</button>
      <a href="#simulador" class="bnav-sim">${ic("calc")}Simular</a>
      <a class="rp" data-wa href="${wa(GEN)}" target="_blank" rel="noopener">${ic("wa")}WhatsApp</a>
    `;
    return;
  }
  $("#tabs").style.display = "";
  $("#tabs").innerHTML = Object.entries(CATS).filter(([_, v]) => !v.hidden).map(([k, v]) => `<button class="tab ${k === cat ? "on" : ""}" data-go="${k}">${ic(v.ic)}${v.name}<em>${count(k) || "em breve"}</em></button>`).join("");
  $("#bnav").innerHTML = Object.entries(CATS).filter(([_, v]) => !v.hidden).map(([k, v]) => `<button class="${k === cat ? "on" : ""}" data-go="${k}">${ic(v.ic)}${v.name}</button>`).join("") + `<a href="#simulador" class="bnav-sim">${ic("calc")}Simular</a>`;
}
document.addEventListener("click", e => {
  const sim = e.target.closest('.bnav-sim');
  if (sim) {
    e.preventDefault();
    openSim();
    return;
  }
  const ash = e.target.closest('a[href*="shineray"]');
  if (ash && !ash.target) {
    e.preventDefault();
    setCat("shineray", true);
    return;
  }
  const g = e.target.closest("[data-go]"); if (!g) return;
  e.preventDefault(); setCat(g.dataset.go, true);
});
function setCat(c, scroll) {
  cat = CATS[c] ? c : "ele"; sub = "all"; q = ""; sort = "";
  document.body.dataset.cat = cat;
  document.querySelector('meta[name="theme-color"]').content = { ele: "#111418", semi: "#e10600", off: "#ff6a00", shineray: "#d80000" }[cat] || "#0a0a0a";
  history.replaceState(null, "", "#" + cat);
  renderAll();
  if (scroll) scrollTo({ top: innerWidth < 900 ? $("#catalogo").offsetTop - 70 : 0, behavior: "smooth" });
}
function renderAll(keepFilters) {
  const C = CATS[cat];
  $("#kick").textContent = C.kick; $("#ctitle").textContent = C.title; $("#cdesc").textContent = C.desc;
  $("#shinerayBanner")?.remove();
  $$(".logo small").forEach(s => s.textContent = (cat === "shineray") ? "SHINERAY" : "MULTIMARCAS");
  $$(".logo").forEach(a => a.dataset.go = (cat === "shineray") ? "shineray" : "ele");
  renderTop(); renderTabs(); renderHero(); renderCampaign(); renderTrust(); renderFilters(); renderList(); fillSimModels(keepFilters ? $("#sModel").value : null);
  if (cur && $("#modal").classList.contains("open") && !cmpView) { const p = byId(cur.id); p ? openModal(p.id, idx) : closeModal(); }
}

/* ---------------- topo ---------------- */
function renderTop() {
  const L = P(), pr = L.filter(p => p.price && !isOut(p));
  const min = pr.length ? Math.min(...pr.filter(p => p.cat === cat || (!CATS[cat]?.hidden && p.cat === "ele")).map(p => p.price)) : null;
  const storeLbl = cat === "shineray" ? "<b>SHINERAY L1MA MOTORS</b> · CONCESSIONÁRIA AUTORIZADA" : "<b>L1MA</b> MOTORS MULTIMARCAS";
  const inauBanner = cat === "shineray"
    ? "<b>🔥 PROMOÇÃO EXCLUSIVA SHINERAY:</b> R$ 1.800 DE DESCONTO EM TODAS AS MOTOS!"
    : (cat === "ele" 
      ? "<b>🔥 MEGA INAUGURAÇÃO:</b> R$ 1.000 DE DESCONTO EM TODAS AS ELÉTRICAS!" 
      : "<b>🎉 PROMOÇÃO DE INAUGURAÇÃO:</b> R$ 1.000 DE DESCONTO EM TODOS OS MODELOS!");
  const items = [["store", storeLbl], ["tag", inauBanner], min ? ["zap", `${cat === "shineray" ? "Motos Shineray" : "Elétricas"} a partir de R$ ${brl0(min)}`] : null, ["card", `Até ${maxN()}x no cartão`], ["key", "Avaliamos sua moto na troca"],
    ...L.filter(p => p.promo && (p.cat === cat || (!CATS[cat]?.hidden && p.cat !== "shineray"))).map(p => ["tag", `${esc(p.brand)} ${esc(p.name)}: ${esc(p.promo.label)}`])].filter(Boolean);
  const h = items.map(([i, t]) => `<span>${ic(i)}${t}</span>`).join("");
  $("#topm").innerHTML = h + h;
}

/* ---------------- hero ---------------- */
let hi = 0, ht;
function heroItems() {
  const L = P().filter(p => p.cat === cat && !isOut(p));
  if (Array.isArray(cfg().heroIds) && cfg().heroIds.length) {
    const list = cfg().heroIds.map(id => L.find(p => p.id === id)).filter(Boolean);
    if (list.length) return list.slice(0, 5);
  }
  const explicit = L.filter(p => p.featuredHero).sort((a, b) => (a.heroOrder ?? 99) - (b.heroOrder ?? 99));
  if (explicit.length) {
    const rest = L.filter(p => !p.featuredHero).sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
    return [...explicit, ...rest].slice(0, Math.max(explicit.length, 3));
  }
  return L.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999)).slice(0, 4);
}
function renderHero() {
  const S = heroItems();
  hi = 0; clearInterval(ht);
  const catLabels = {
    ele: "L<em>1</em>MA MOTORS ELÉTRICAS",
    off: "L<em>1</em>MA MOTORS OFF-ROAD",
    semi: "L<em>1</em>MA MOTORS SEMI-NOVOS",
    shineray: "L<em>1</em>MA MOTORS SHINERAY"
  };
  const currentCatLabel = catLabels[cat] || "L<em>1</em>MA MOTORS MULTIMARCAS";
  if (!S.length) {
    $("#hero").innerHTML = `<div class="slide on"><div class="bgc"></div><div class="txt"><span class="pill">${cat === "semi" ? "AVALIAÇÃO SEM COMPROMISSO" : "EM BREVE"}</span>
      <h1 class="disp">${cat === "semi" ? "Troque<br>sua moto<br>aqui." : "Novidades<br>chegando."}</h1><p>${cat === "semi" ? "Avaliamos seu usado e usamos como entrada na sua próxima moto." : "Fale com a gente para saber das próximas chegadas."}</p>
      <div class="hbtns" style="margin-top:24px"><a href="#catalogo" class="btn w">Avaliar minha moto ${ic("arrow")}</a></div></div>
      <div class="vis">
        <div class="photo-frame">
          <div class="photo-sq"><img src="assets/vegas-1.jpg" alt="L1MA Motors"></div>
          <div class="photo-caption"><span class="photo-class">${currentCatLabel}</span><span class="photo-sub">SHOWROOM OFICIAL</span></div>
        </div>
      </div></div>`; return;
  }
  $("#hero").innerHTML = S.map((p, i) => {
    const fullModelTitle = esc(pName(p));
    const diff = p.oldPrice && p.oldPrice > p.price ? p.oldPrice - p.price : 0;
    const tag = diff > 0 ? `🎉 PROMOÇÃO DE INAUGURAÇÃO · R$ ${brl0(diff)} OFF` : p.promo ? p.promo.label.toUpperCase() : isLow(p) ? "ÚLTIMAS UNIDADES" : "DESTAQUE L1MA";
    const offer = p.price ? `<div class="offer"><div><div class="old">${diff > 0 ? `Preço comum: <s>R$ ${brl0(p.oldPrice)},00</s>` : "à vista"}</div><div class="now">R$ ${brl0(p.price)}<small>,00</small></div></div>
      ${p.installments ? `<div class="par">ou em até<b>${maxN()}x</b>no cartão*</div>` : ""}</div>` : `<div class="offer"><div class="now" style="font-size:30px">Preço sob consulta</div></div>`;
    const seal = [p.specs?.[0]?.[0] || "", (p.specs?.[0]?.[1] || "").toUpperCase()];
    const classTitle = catLabels[p.cat] || `L<em>1</em>MA MOTORS ${(CATS[p.cat]?.name || "MULTIMARCAS").toUpperCase()}`;
    const classSub = fullModelTitle;
    return `<div class="slide ${i ? "" : "on"}"><div class="bgc"></div>
      <div class="txt"><span class="pill">${esc(tag)}</span><div class="brand" style="color:#fff;opacity:.8;margin-top:16px">${esc(p.brand)} · ${esc(p.sub)}</div>
      <h1 class="disp" style="margin-top:6px">${fullModelTitle}</h1><p>${esc(p.desc)}</p>${offer}
      <div class="hbtns"><button class="btn w" data-open="${p.id}">Ver detalhes ${ic("arrow")}</button>${p.price ? `<button type="button" class="btn g rp" data-sim="${p.id}">${ic("calc")} Simular</button>` : ""}</div></div>
      <div class="vis">
        <div class="photo-frame">
          <div class="photo-sq">
            <img src="${im(p)}" alt="${fullModelTitle}" ${i ? 'loading="lazy"' : ""}>
          </div>
          <div class="photo-caption">
            <span class="photo-class">${classTitle}</span>
            <span class="photo-sub">${classSub}</span>
          </div>
          <div class="seal"><div><b>${esc(seal[0])}</b>${esc(seal[1])}</div></div>
        </div>
      </div></div>`;
  }).join("") + (S.length > 1 ? `<div class="hnav">${S.map((_, i) => `<button class="${i ? "" : "on"}" data-slide="${i}" aria-label="Slide ${i + 1}"></button>`).join("")}</div>
    <div class="harr"><button data-step="-1" aria-label="Anterior">${ic("left")}</button><button data-step="1" aria-label="Próximo">${ic("right")}</button></div>` : "");
  if (S.length > 1) ht = setInterval(() => goSlide(hi + 1), 6000);
}
function goSlide(i) {
  const s = $$(".slide"), d = $$(".hnav button"); if (s.length < 2) return;
  s[hi].classList.remove("on"); d[hi]?.classList.remove("on");
  hi = (i + s.length) % s.length; s[hi].classList.add("on"); d[hi]?.classList.add("on");
  clearInterval(ht); ht = setInterval(() => goSlide(hi + 1), 6000);
}
$("#hero").addEventListener("click", e => {
  const o = e.target.closest("[data-open]"), sl = e.target.closest("[data-slide]"), st = e.target.closest("[data-step]");
  if (o) openModal(o.dataset.open); if (sl) goSlide(+sl.dataset.slide); if (st) goSlide(hi + +st.dataset.step);
});
let hx = null;
$("#hero").addEventListener("touchstart", e => hx = e.touches[0].clientX, { passive: true });
$("#hero").addEventListener("touchend", e => { if (hx == null) return; const d = e.changedTouches[0].clientX - hx; if (Math.abs(d) > 50) goSlide(hi + (d < 0 ? 1 : -1)); hx = null; });
document.addEventListener("click", e => {
  const s = e.target.closest("[data-sim]");
  if (s) {
    e.preventDefault();
    closeModal();
    openSim(s.dataset.sim);
  }
});

/* ---------------- campanha (vinda do sistema central) ---------------- */
let cdT;
function renderCampaign() {
  const c = cfg().campaign; clearInterval(cdT);
  if (!c || (c.until && new Date(c.until) < new Date())) { $("#campaign").innerHTML = ""; return; }
  const isEle = cat === "ele";
  const title = isEle ? "MEGA INAUGURAÇÃO L1MA MOTORS · R$ 1.000 OFF" : c.title;
  const desc = isEle 
    ? "Todas as motos elétricas com R$ 1.000 de desconto garantido de inauguração! Economize no preço à vista ou parcele em até 21x." 
    : (c.text || "");
  $("#campaign").innerHTML = `
    <div class="promo inau-promo">
      <div class="pt">
        <span class="ico flame-glow">${ic("flame")}</span>
        <div>
          <div class="promo-tag-top">CONDIÇÃO ESPECIAL DE INAUGURAÇÃO</div>
          <b class="disp">${esc(title)}</b>
          <span>${esc(desc)}</span>
        </div>
      </div>
      <div class="promo-actions">
        ${c.until ? `<div class="cd" id="cd"></div>` : `<span class="promo-pill-highlight">${ic("flame")} R$ 1.000 OFF GARANTIDO</span>`}
        <a href="#catalogo" class="btn-promo-hero">Aproveitar Desconto ${ic("arrow")}</a>
      </div>
    </div>`;
  if (!c.until) return;
  const end = new Date(c.until);
  const tick = () => { let d = Math.max(0, end - new Date()); if (!d) return renderCampaign();
    $("#cd").innerHTML = [["DIAS", 864e5], ["HORAS", 36e5], ["MIN", 6e4], ["SEG", 1e3]].map(([l, ms]) => { const v = Math.floor(d / ms); d -= v * ms; return `<div><b>${String(v).padStart(2, "0")}</b><small>${l}</small></div>`; }).join(""); };
  tick(); cdT = setInterval(tick, 1000);
}
function renderTrust() {
  const isShineray = cat === "shineray";
  const items = isShineray ? [
    ["store", "Concessionária Autorizada", "Shineray do Brasil"],
    ["shield", "Garantia de Fábrica", "Peças e serviços originais"],
    ["card", `Até ${maxN()}x no cartão`, "Simule suas parcelas"],
    ["zap", "Financiamento Facilitado", "Em até 48x com aprovação rápida"]
  ] : [
    ["card", `Até ${maxN()}x no cartão`, "Simule suas parcelas"],
    ["zap", "Financiamento Facilitado", "Em até 48x ou no boleto"],
    ["shield", "Garantia de 1 ano", "Em modelos selecionados"],
    ["store", "Multimarcas", [...new Set(P().map(p => p.brand).filter(b => !/el[ée]tric|quadri|kart|triciclo/i.test(b)))].slice(0, 3).join(", ")]
  ];
  $("#trust").innerHTML = items
    .map(([i, b, s]) => `<div><span class="ico">${ic(i)}</span><p><b>${b}</b><span>${esc(s)}</span></p></div>`).join("");
}

/* ---------------- lista ---------------- */
function renderFilters() {
  const items = P().filter(p => p.cat === cat);
  if (!items.length) { $("#filters").innerHTML = ""; return; }
  const subs = ["all", ...new Set(items.map(p => p.sub))];
  if (!subs.includes(sub)) sub = "all";
  $("#filters").innerHTML = `<div class="chips">${subs.map(s => `<button class="chip ${s === sub ? "on" : ""}" data-s="${esc(s)}">${s === "all" ? "Todos" : esc(s)}</button>`).join("")}</div>
   <label class="search">${ic("search")}<input id="q" type="search" placeholder="Buscar modelo..." value="${esc(q)}" aria-label="Buscar"></label>
   <select id="sort" aria-label="Ordenar"><option value="">Destaques</option><option value="asc">Menor preço</option><option value="desc">Maior preço</option><option value="az">A–Z</option></select>`;
  $$("[data-s]").forEach(b => b.onclick = () => { sub = b.dataset.s; $$("[data-s]").forEach(x => x.classList.toggle("on", x === b)); renderList(); });
  $("#q").oninput = e => { q = e.target.value.toLowerCase().trim(); renderList(); };
  $("#sort").value = sort; $("#sort").onchange = e => { sort = e.target.value; renderList(); };
}
function priceBlock(p) {
  if (!p.price) return `<div class="lbl">Valor</div><div class="q">Sob consulta</div><div class="inst">fale com um consultor</div>`;
  const diff = p.oldPrice && p.oldPrice > p.price ? p.oldPrice - p.price : 0;
  if (diff > 0) {
    return `<div class="old-price-wrap"><span class="old-price">De <s>R$ ${brl0(p.oldPrice)}</s></span></div>
     <div class="v">R$ ${brl0(p.price)}<small>,00</small></div>
     <div class="inst">${p.installments ? `em até <b>${maxN()}x</b> no cartão` : "consulte condições"}</div>`;
  }
  return `<div class="lbl">À vista</div><div class="v">R$ ${brl0(p.price)}<small>,00</small></div>
   <div class="inst">${p.installments ? `em até <b>${maxN()}x</b> no cartão` : "consulte condições"}</div>`;
}
function renderList() {
  if (cat === "semi" && !P().some(p => p.cat === "semi")) return renderSemi();
  const nq = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  let l = P().filter(p => p.cat === cat && (sub === "all" || p.sub === sub) && nq(`${pName(p)} ${p.sub}`).includes(nq(q)));
  const base = (a, b) => isOut(a) - isOut(b);
  l.sort((a, b) => base(a, b) || (
    sort === "asc" ? (a.price ?? 1e9) - (b.price ?? 1e9) :
    sort === "desc" ? (b.price ?? -1) - (a.price ?? -1) :
    sort === "az" ? a.name.localeCompare(b.name) :
    ((a.sortOrder ?? 999) - (b.sortOrder ?? 999)) || (!!b.promo - !!a.promo) || (!!b.readyDelivery - !!a.readyDelivery)
  ));
  $("#list").innerHTML = `<div class="grid">${l.length ? l.map((p, i) => {
    const out = isOut(p);
    const subLabel = esc(p.sub || (p.cat === 'shineray' ? 'MOTO' : 'ELÉTRICA'));
    const highlight = p.specs?.[0]?.[0] ? `${esc(p.specs[0][0])}${p.specs[1]?.[0] ? ` · ${esc(p.specs[1][0])}` : ''}` : '';
    const nameWithBrand = esc(pName(p));
    return `<article class="card ${out ? "out" : ""}" style="animation-delay:${Math.min(i, 8) * 40}ms" data-id="${p.id}" tabindex="0">
     <div class="ph">
      <img src="${im(p)}" alt="${esc(p.photos?.[0] || nameWithBrand)}" loading="lazy">
      <div class="badges">
        <span class="bdg">${subLabel}</span>
        ${isLow(p) ? `<span class="bdg alert">Últimas ${p.stock} un!</span>` : ""}
      </div>
      ${out ? `<span class="stamp sold">Esgotado</span>` : ""}
      <div class="quick">${out ? `${ic("bell")} Avise-me quando chegar` : `Ver detalhes e simular ${ic("arrow")}`}</div>
     </div>
     <div class="bd">
      <div class="brand">${esc(p.brand)}</div>
      <h3 class="disp">${nameWithBrand}</h3>
      ${highlight ? `<div class="card-feature">${highlight}</div>` : ''}
      <div class="pr">
        <div>${priceBlock(p)}</div>
      </div>
     </div>
    </article>`;
  }).join("") : `<p style="color:var(--mut);padding:60px 0">Nenhum modelo encontrado.</p>`}</div>`;
}
$("#list").addEventListener("click", e => {
  const c = e.target.closest("[data-cmp]"); if (c) { e.stopPropagation(); return toggleCmp(c.dataset.cmp); }
  const card = e.target.closest(".card"); if (card) openModal(card.dataset.id);
});
$("#list").addEventListener("keydown", e => { if (e.key === "Enter" && e.target.classList.contains("card")) openModal(e.target.dataset.id); });

function renderSemi() {
  $("#list").innerHTML = `<div class="soon">
   <div><span class="pill">ESTOQUE EM PREPARAÇÃO</span><h3 class="disp" style="margin-top:18px">Semi-novos com procedência.</h3>
    <p>Estamos preparando nosso estoque de semi-novos. Enquanto isso, avaliamos a sua moto para usar como entrada na sua próxima L1MA.</p>
    <ul>${["Avaliação sem compromisso", "Seu usado como entrada", `Saldo em até ${maxN()}x no cartão`, "Aviso quando os semi-novos chegarem"].map(t => `<li>${ic("check")}${t}</li>`).join("")}</ul></div>
   <form class="sell" id="sell"><h4>${ic("key")} Avaliar minha moto</h4>
    <div class="row2"><div class="in"><label for="fm">Marca / Modelo</label><input id="fm" name="m" required placeholder="Ex.: Honda CG 160"></div><div class="in"><label for="fa">Ano</label><input id="fa" name="a" required inputmode="numeric" maxlength="4" placeholder="2020"></div></div>
    <div class="row2"><div class="in"><label for="fk">Km rodados</label><input id="fk" name="k" inputmode="numeric" placeholder="25.000"></div><div class="in"><label for="fi">Interesse</label><select id="fi" name="i"><option>Trocar por elétrica</option><option>Trocar por off-road</option><option>Apenas vender</option><option>Quero comprar semi-novo</option></select></div></div>
    <div class="in"><label for="fn">Seu nome</label><input id="fn" name="n" required placeholder="Nome" autocomplete="name"></div>
    <button class="btn c" style="width:100%;margin-top:6px">${ic("wa")} Enviar pelo WhatsApp</button></form></div>`;
  $("#sell").onsubmit = e => { e.preventDefault(); const f = new FormData(e.target);
    open(wa(`Olá! Sou ${f.get("n")} e quero avaliar minha moto:\n• Modelo: ${f.get("m")}\n• Ano: ${f.get("a")}\n• Km: ${f.get("k") || "-"}\n• Interesse: ${f.get("i")}`), "_blank"); };
}

/* ---------------- comparar ---------------- */
function toggleCmp(id) {
  const i = cmpList.indexOf(id);
  if (i > -1) cmpList.splice(i, 1); else { if (cmpList.length >= 3) return toast("Compare até 3 modelos por vez", "info"); cmpList.push(id); }
  syncCmp();
}
function syncCmp() {
  cmpList = cmpList.filter(byId);
  $("#cbar").classList.toggle("on", cmpList.length > 0);
  $("#cbn").textContent = `${cmpList.length} para comparar`;
  $("#cbt").innerHTML = cmpList.map(id => `<img src="${im(byId(id))}" alt="">`).join("");
  $$("[data-cmp]").forEach(b => b.classList.toggle("on", cmpList.includes(b.dataset.cmp)));
}
$("#cbX").onclick = () => { cmpList = []; syncCmp(); };
let cmpView = false;
$("#cbGo").onclick = () => {
  if (cmpList.length < 2) return toast("Selecione pelo menos 2 modelos", "info");
  const L = cmpList.map(byId), keys = [...new Set(L.flatMap(p => p.specs.map(s => s[1])))];
  cmpView = true; cur = null;
  $("#mbox").innerHTML = `<div class="ctable"><div class="kick">COMPARATIVO</div><h2 class="disp" style="font-size:38px;margin:8px 0 20px">Lado a lado</h2><table>
   <tr><td></td>${L.map(p => `<th><img src="${im(p)}" alt=""><div class="brand">${esc(p.brand)}</div><b style="font-size:18px">${esc(p.name)}</b></th>`).join("")}</tr>
   <tr><td>Preço</td>${L.map(p => `<td><b>${p.price ? "R$ " + brl0(p.price) + ",00" : "Sob consulta"}</b></td>`).join("")}</tr>
   <tr><td>Situação</td>${L.map(p => `<td>${isOut(p) ? "Esgotado" : isLow(p) ? `Últimas ${p.stock}` : "Disponível"}</td>`).join("")}</tr>
   ${keys.map(k => `<tr><td>${esc(k)}</td>${L.map(p => `<td>${esc((p.specs.find(s => s[1] === k) || ["—"])[0])}</td>`).join("")}</tr>`).join("")}
   <tr><td>Destaques</td>${L.map(p => `<td style="font-size:13px">${p.feat.map(esc).join("<br>")}</td>`).join("")}</tr>
   <tr><td></td>${L.map(p => `<td><button class="btn c" data-open2="${p.id}">Ver modelo</button></td>`).join("")}</tr></table></div>`;
  openBox();
};

/* ---------------- modal ---------------- */
let cur = null, idx = 0, curMedia = "photo", spinIdx = 0;
function openBox() { $("#modal").classList.add("open"); document.body.style.overflow = "hidden"; $("#mbox").scrollTop = 0; }
$("#mbox").addEventListener("click", e => { const o = e.target.closest("[data-open2]"); if (o) openModal(o.dataset.open2); });

function setMediaMode(m) {
  curMedia = m;
  $$(".mode-btn").forEach(b => b.classList.toggle("on", b.dataset.mm === m));
  const gp = $("#galPhoto"), gs = $("#gal360"), gv = $("#galVideo");
  if (gp) gp.style.display = m === "photo" ? "" : "none";
  if (gs) gs.style.display = m === "360" ? "" : "none";
  if (gv) {
    gv.style.display = m === "video" ? "" : "none";
    if (m === "video" && cur?.video && !gv.querySelector("iframe")) {
      gv.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${cur.video}?autoplay=1&rel=0&modestbranding=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    } else if (m !== "video" && gv.querySelector("iframe")) {
      gv.innerHTML = "";
    }
  }
  if (m === "360") initSpin();
  else if (spinTimer) toggleAutoSpin();
}

let spinTimer = null;
function toggleAutoSpin() {
  const btn = $("#btnAutoSpin");
  if (spinTimer) {
    clearInterval(spinTimer);
    spinTimer = null;
    if (btn) btn.classList.remove("on");
  } else {
    if (btn) btn.classList.add("on");
    spinTimer = setInterval(() => {
      setSpinFrame(spinIdx + 1);
    }, 110);
  }
}

function setSpinFrame(i) {
  if (!cur?.rotation360?.length) return;
  const tot = cur.rotation360.length;
  spinIdx = ((i % tot) + tot) % tot;
  const img = $("#spinImg");
  if (img) img.src = cur.rotation360[spinIdx];
  const sld = $("#spinRange");
  if (sld) { sld.value = spinIdx; fillRange(sld); }
  const lbl = $("#spinCount");
  if (lbl) lbl.textContent = `${spinIdx + 1} / ${tot}`;
}

function initSpin() {
  const el = $("#spinViewer");
  if (!el || !cur?.rotation360?.length) return;
  if (spinTimer) { clearInterval(spinTimer); spinTimer = null; }
  setSpinFrame(spinIdx);
  cur.rotation360.forEach(u => { const im = new Image(); im.src = u; });
  let startX = 0, startIdx = 0, dragging = false;
  el.onpointerdown = e => {
    if (spinTimer) toggleAutoSpin();
    dragging = true;
    startX = e.clientX;
    startIdx = spinIdx;
    try { el.setPointerCapture(e.pointerId); } catch {}
  };
  el.onpointermove = e => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const diff = Math.round(dx / 12);
    setSpinFrame(startIdx - diff);
  };
  el.onpointerup = el.onpointercancel = e => {
    dragging = false;
    try { el.releasePointerCapture(e.pointerId); } catch {}
  };
  const sld = $("#spinRange");
  if (sld) sld.oninput = () => { if (spinTimer) toggleAutoSpin(); setSpinFrame(+sld.value); };
}

function openModal(id, keepIdx) {
  const p = byId(id); if (!p) return;
  const diff = p.oldPrice && p.oldPrice > p.price ? p.oldPrice - p.price : 0;
  const wasOpen = $("#modal").classList.contains("open") && cur?.id === id;
  cur = p; cmpView = false; idx = keepIdx || 0; curMedia = "photo"; spinIdx = 0;
  const out = isOut(p);
  const hasModes = (p.rotation360?.length || p.video);
  const modeBar = hasModes ? `
    <div class="media-modes">
      <button class="mode-btn on" data-mm="photo">${ic("store")} Fotos (${p.photos.length})</button>
      ${p.rotation360?.length ? `<button class="mode-btn" data-mm="360">${ic("spin360")} Giro 360°</button>` : ""}
      ${p.video ? `<button class="mode-btn" data-mm="video">${ic("play")} Vídeo</button>` : ""}
    </div>` : "";

  $("#mbox").innerHTML = `
   <div class="mbox-top-bar">
    <div class="sheet-handle"></div>
    <button type="button" class="mbox-close-btn" id="mboxCloseBtn" aria-label="Fechar">${ic("x")}</button>
   </div>
   <div class="gal">
    ${modeBar}
    <div id="galPhoto">
      <div class="mph ${out ? "out" : ""}"><img id="mimg" src="${im(p, idx)}" alt="">
        ${out ? `<span class="stamp sold ${wasOpen ? "" : "anim"}" style="font-size:36px">Esgotado</span>` : p.promo ? `<span class="stamp promo anim" style="font-size:22px">Oferta</span>` : ""}
        ${p.photos.length > 1 ? `<button class="nav p" data-step="-1" aria-label="Anterior">${ic("left")}</button><button class="nav n" data-step="1" aria-label="Próxima">${ic("right")}</button>` : ""}<span class="cnt" id="mcnt"></span></div>
      <div class="thumbs" id="mth">${p.photos.map((l, i) => `<button data-i="${i}" aria-label="Foto ${i + 1}"><img src="${im(p, i)}" alt="" loading="lazy"></button>`).join("")}</div>
    </div>
    ${p.rotation360?.length ? `
      <div id="gal360" style="display:none">
        <div class="viewer-360" id="spinViewer">
          <span class="spin-pill">${ic("spin360")} 360° Interativo</span>
          <img id="spinImg" src="${p.rotation360[0]}" alt="${esc(p.name)} em 360 graus">
          <span class="spin-tip">Arraste para girar a moto</span>
          <button type="button" class="spin-nav p" data-spinstep="-1" aria-label="Girar anterior">${ic("left")}</button>
          <button type="button" class="spin-nav n" data-spinstep="1" aria-label="Girar próximo">${ic("right")}</button>
        </div>
        <div class="viewer-360-ctrl">
          <div class="slider-row">
            <button type="button" class="btn-auto-spin" id="btnAutoSpin">${ic("spin360")} Auto-Giro</button>
            <input type="range" id="spinRange" min="0" max="${p.rotation360.length - 1}" value="0" aria-label="Giro 360 graus">
            <span id="spinCount">1 / ${p.rotation360.length}</span>
          </div>
        </div>
      </div>` : ""}
    ${p.video ? `<div id="galVideo" class="video-wrap" style="display:none"></div>` : ""}
   </div>
   <div class="det"><div class="brand">${esc(p.brand)} · ${esc(p.sub)}</div><h2 class="disp">${esc(pName(p))}</h2>
    <div class="tagrow">
      ${out ? `<span class="bdg" style="background:#d10000;color:#fff">${ic("box")}Esgotado</span>` : ""}
      ${p.rotation360?.length ? `<span class="bdg spin360">${ic("spin360")}Giro 360°</span>` : ""}
      ${p.video ? `<span class="bdg vid">${ic("play")}Vídeo Oficial</span>` : ""}
      ${isLow(p) ? `<span class="bdg low">${ic("alert")}Últimas ${p.stock} unidades</span>` : ""}
    </div>
    <p class="desc">${esc(p.desc)}</p>
    <div class="pbox">${p.price ? `
      ${p.oldPrice && p.oldPrice > p.price ? `<div class="old-price-wrap" style="margin-bottom:6px"><span class="old-price" style="font-size:13px">De <s>R$ ${brl0(p.oldPrice)},00</s></span></div>` : `<span class="brand">À vista</span>`}
      <div class="v">R$ ${brl0(p.price)}<small>,00</small></div>
      ${p.installments ? `<span class="pbox-inst">ou em até <b>${maxN()}x no cartão</b></span>` : `<span class="pbox-inst" style="color:var(--mut)">Consulte as condições de pagamento.</span>`}
      <div class="ms"><div class="ms-left">${ic("card")} Simular em <select id="mPar" aria-label="Parcelas">${Array.from({ length: maxN() }, (_, i) => `<option value="${i + 1}" ${i === 11 ? "selected" : ""}>${i + 1}x</option>`).join("")}</select></div><b id="mParV"></b></div>
      <span class="pbox-note">${hasRates() ? "Valor estimado com a taxa da maquininha." : esc(cfg().installmentNote || "")}</span>`
      : `<div class="v" style="font-size:26px;color:var(--c)">Preço sob consulta</div><span class="pbox-inst" style="color:var(--mut)">Fale com um consultor para valores e condições.</span>`}</div>
    ${p.colors ? `<div class="sec">${p.colors.length > 1 ? "Cores disponíveis (toque para ver na foto)" : "Cor disponível"}</div><div class="sw">${p.colors.map(c => `<button data-i="${c[2]}"><i style="background:${esc(c[1])}"></i>${esc(c[0])}</button>`).join("")}</div>` : ""}
    <div class="sec">Ficha técnica</div><div class="spec">${p.specs.map(s => `<div><b>${esc(s[0])}</b><small>${esc(s[1])}</small></div>`).join("")}</div>
    <div class="sec">Destaques</div><ul class="feat">${p.feat.map(f => `<li><span class="ck">${ic("check")}</span>${esc(f)}</li>`).join("")}</ul>
    <p class="disc">${esc(p.disc || "")}</p>
    <div class="acts">
      <a class="btn ${out ? "k" : "c"}" id="mWa" target="_blank" rel="noopener">${ic(out ? "bell" : "wa")} ${out ? "Avise-me quando chegar" : "Tenho interesse"}</a>
      <div class="acts-sub">
        <button class="btn o rp" id="mShare" aria-label="Compartilhar no WhatsApp" title="Compartilhar link com foto no WhatsApp">${ic("share")} Compartilhar</button>
        ${p.price && !out ? `<button type="button" class="btn o rp" data-sim="${p.id}">${ic("calc")} Simular entrada</button>` : ""}
      </div>
    </div>
   </div>`;
  const upd = () => { const n = +($("#mPar")?.value || 0); const fullN = pName(p); if (n) $("#mParV").textContent = `${n}x de R$ ${brl(parc(p.price, n))}`;
    $("#mWa").href = wa(out ? `Olá! Quero ser avisado quando a ${fullN} voltar ao estoque.` : `Olá! Tenho interesse na ${fullN}${p.price ? ` (R$ ${brl0(p.price)},00${n ? ` — simulei ${n}x de R$ ${brl(parc(p.price, n))}` : ""})` : ""}. Pode me ajudar?`); };
  $("#mPar")?.addEventListener("change", upd); upd();
  $("#mShare").onclick = shareIt;
  show(idx); if (!wasOpen) openBox();
  history.replaceState(null, "", "?m=" + encodeURIComponent(id));
}
$("#mbox").addEventListener("click", e => {
  if (e.target.closest("#mboxCloseBtn")) return closeModal();
  if (!cur) return;
  const auto = e.target.closest("#btnAutoSpin"); if (auto) return toggleAutoSpin();
  const spinstep = e.target.closest("[data-spinstep]"); if (spinstep) { if (spinTimer) toggleAutoSpin(); return setSpinFrame(spinIdx + +spinstep.dataset.spinstep); }
  const mm = e.target.closest("[data-mm]"); if (mm) return setMediaMode(mm.dataset.mm);
  const t = e.target.closest("[data-i]"), s = e.target.closest(".mph [data-step]");
  if (t) { setMediaMode("photo"); show(+t.dataset.i); }
  if (s) { setMediaMode("photo"); show(idx + +s.dataset.step); }
  if (e.target.id === "mimg") { $("#zimg").src = im(cur, idx); $("#zoom").classList.add("open"); }
});
function closeModal() {
  if (spinTimer) { clearInterval(spinTimer); spinTimer = null; }
  $("#modal").classList.remove("open");
  document.body.style.overflow = "";
  cur = null;
  cmpView = false;
  history.replaceState(null, "", location.pathname.startsWith("/m") || location.pathname.startsWith("/moto") ? "/" : "#" + cat);
}
function show(i) {
  if (!cur) return; idx = (i + cur.photos.length) % cur.photos.length;
  const m = $("#mimg"), want = im(cur, idx), pre = new Image(); m.style.opacity = .35;
  pre.onload = pre.onerror = () => { if (cur && im(cur, idx) === want) { m.src = want; m.alt = cur.photos[idx]; m.style.opacity = 1; } }; pre.src = want;
  $("#mcnt").textContent = `${idx + 1} / ${cur.photos.length}`;
  [...$("#mth").children].forEach((b, j) => b.classList.toggle("on", j === idx));
  const th = $("#mth").children[idx]; if (th) $("#mth").scrollTo({ left: th.offsetLeft - $("#mth").clientWidth / 2 + th.clientWidth / 2, behavior: "smooth" });
  $$(".sw button").forEach(b => b.classList.toggle("on", +b.dataset.i === idx));
}
$("#mx").onclick = closeModal;
$("#zoom").onclick = () => $("#zoom").classList.remove("open");
$("#modal").addEventListener("click", e => { if (e.target.id === "modal") closeModal(); });
addEventListener("keydown", e => {
  if ($("#zoom").classList.contains("open")) { if (e.key === "Escape") $("#zoom").classList.remove("open"); return; }
  if ($("#simModal").classList.contains("open") && e.key === "Escape") return closeSim();
  if (!$("#modal").classList.contains("open")) return;
  if (e.key === "Escape") closeModal(); if (cur && e.key === "ArrowLeft") show(idx - 1); if (cur && e.key === "ArrowRight") show(idx + 1);
});
let tx = null, ty = null;
$("#modal").addEventListener("touchstart", e => { const t = e.touches[0]; tx = e.target.closest(".mph") ? t.clientX : null; ty = t.clientY; }, { passive: true });
$("#modal").addEventListener("touchend", e => { if (tx === null) return; const t = e.changedTouches[0], dx = t.clientX - tx; if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(t.clientY - ty)) show(idx + (dx < 0 ? 1 : -1)); tx = null; });
function shareIt() {
  if (!cur) return;
  const u = `${location.origin}/?m=${encodeURIComponent(cur.id)}`;
  const text = `${cur.brand} ${cur.name}${cur.price ? ` — R$ ${brl0(cur.price)},00` : ""}\nConfira fotos e simulação na L1MA Motors:\n${u}`;
  if (navigator.share) {
    navigator.share({ title: `${cur.brand} ${cur.name} | L1MA Motors`, text, url: u }).catch(() => {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(u).then(() => {
      toast("Link copiado! Ao colar no WhatsApp a foto e o preço aparecem automaticamente.", "new", cur.id);
    });
  } else {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }
}

/* ---------------- simulador popup modal ---------------- */
let sMode = "card";
function openSim(pick) {
  fillSimModels(pick);
  $("#simModal").classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeSim() {
  $("#simModal").classList.remove("open");
  if (!$("#modal").classList.contains("open")) {
    document.body.style.overflow = "";
  }
}
$("#simX").innerHTML = ic("x");
$("#simX").onclick = closeSim;
$("#simModal").onclick = e => { if (e.target.id === "simModal") closeSim(); };
$("#btnOpenSim")?.addEventListener("click", () => openSim());
$("#btnOpenSim2")?.addEventListener("click", () => openSim());

function fillSimModels(pick) {
  const s = $("#sModel"), L = P().filter(p => p.price && !isOut(p));
  if (!L.length) return;
  s.innerHTML = Object.entries(CATS)
    .filter(([k, v]) => !v.hidden || k === cat || (pick && byId(pick)?.cat === k))
    .map(([k, v]) => {
      const l = L.filter(p => p.cat === k);
      return l.length ? `<optgroup label="${v.name}">${l.map(p => `<option value="${p.id}">${esc(p.brand)} ${esc(p.name)} — R$ ${brl0(p.price)}</option>`).join("")}</optgroup>` : "";
    }).join("");
  s.value = pick && L.some(p => p.id === pick) ? pick : (L.find(p => p.cat === cat) || L[0]).id;
  $("#sPar").max = maxN(); if (+$("#sPar").value > maxN()) $("#sPar").value = maxN();
  sim();
}
function fillRange(r) { r.style.setProperty("--p", ((r.value - r.min) / (r.max - r.min) * 100) + "%"); }
function sim() {
  const p = byId($("#sModel").value); if (!p) return;
  const e = +$("#sEnt").value, n = +$("#sPar").value, ent = p.price * e / 100, rest = p.price - ent;
  $$("#simModal input[type=range]").forEach(fillRange);
  $("#sImg").src = im(p); $("#sName").textContent = p.name; $("#sBrand").textContent = `${p.brand} · ${CATS[p.cat].name}`;
  $("#sEntV").textContent = `${e}% · R$ ${brl(ent)}`; $("#sParV").textContent = `${n}x`;
  $$("#entChips .fchip").forEach(b => b.classList.toggle("on", +b.dataset.ent === e));
  $$("#parChips .fchip").forEach(b => b.classList.toggle("on", +b.dataset.par === n));
  $("#fEnt").style.display = $("#fPar").style.display = sMode === "card" ? "" : "none";
  $("#sFine").textContent = hasRates() ? "* Simulação com as taxas oficiais da L1MA Motors no cartão de crédito/débito."
    : `* Valor base sem a taxa da maquininha. ${cfg().installmentNote || ""}`;
  let msg;
  if (sMode === "debit") {
    const dr = cfg().debitRate ?? 1.1, tot = p.price * (1 + dr / 100);
    $("#sLbl").textContent = "Valor no débito"; $("#sBig").innerHTML = `R$ ${brl(tot).replace(/,(\d\d)$/, "<small>,$1</small>")}`; $("#sSub").textContent = `à vista no cartão de débito (taxa ${String(dr).replace(".", ",")}%)`;
    $("#sRows").innerHTML = `<div><span>Valor à vista</span><b>R$ ${brl(p.price)}</b></div><div><span>Taxa débito</span><b>${String(dr).replace(".", ",")}%</b></div><div><span>Total</span><b>R$ ${brl(tot)}</b></div>`;
    $("#sQuick").innerHTML = ""; msg = `Olá! Quero a ${p.brand} ${p.name} no débito: R$ ${brl(tot)}.`;
  } else if (sMode === "pix") {
    $("#sLbl").textContent = "Valor no Pix"; $("#sBig").innerHTML = `R$ ${brl0(p.price)}<small>,00</small>`; $("#sSub").textContent = "Pagamento único no Pix ou dinheiro";
    $("#sRows").innerHTML = `<div><span>Modelo</span><b>${esc(p.name)}</b></div><div><span>Forma</span><b>Pix / dinheiro</b></div><div><span>Taxa</span><b>sem acréscimo</b></div><div><span>Total</span><b>R$ ${brl(p.price)}</b></div>`;
    $("#sQuick").innerHTML = ""; msg = `Olá! Quero a ${p.brand} ${p.name} à vista por R$ ${brl0(p.price)},00.`;
  } else {
    const pv = parc(rest, n), tot = ent + pv * n;
    $("#sLbl").textContent = ent ? "Entrada + parcelas" : (hasRates() ? "Parcela estimada" : "Parcela base");
    $("#sBig").innerHTML = `${n}x R$ ${brl(pv).replace(/,(\d\d)$/, "<small>,$1</small>")}`;
    $("#sSub").textContent = ent ? `com entrada de R$ ${brl(ent)}` : "sem entrada, no cartão de crédito";
    $("#sRows").innerHTML = `<div><span>Valor à vista</span><b>R$ ${brl(p.price)}</b></div><div><span>Entrada</span><b>R$ ${brl(ent)}</b></div><div><span>Saldo no cartão</span><b>R$ ${brl(rest)}</b></div>
      ${hasRates() ? `<div><span>Taxa (${n}x)</span><b>${String(rate(n)).replace(".", ",")}%</b></div>` : `<div><span>Taxa da maquininha</span><b>a confirmar</b></div>`}<div><span>Total ${hasRates() ? "estimado" : "base"}</span><b>R$ ${brl(tot)}</b></div>`;
    $("#sQuick").innerHTML = [3, 6, 10, 12, 18, 21].filter(k => k <= maxN()).map(k => `<button class="${k === n ? "on" : ""}" data-k="${k}">${k}x R$ ${brl(parc(rest, k))}</button>`).join("");
    msg = `Olá! Simulei no catálogo a ${p.brand} ${p.name} (R$ ${brl0(p.price)},00): entrada de R$ ${brl(ent)} + ${n}x no cartão. Pode me passar o valor final com a taxa?`;
  }
  $("#sWa").href = wa(msg);
}
$("#sQuick").addEventListener("click", e => { const b = e.target.closest("[data-k]"); if (b) { $("#sPar").value = b.dataset.k; sim(); } });
$("#sModel").onchange = sim; $("#sEnt").oninput = sim; $("#sPar").oninput = sim;
$("#btnEntMinus")?.addEventListener("click", () => { const inp = $("#sEnt"); inp.value = Math.max(0, +inp.value - 5); sim(); });
$("#btnEntPlus")?.addEventListener("click", () => { const inp = $("#sEnt"); inp.value = Math.min(80, +inp.value + 5); sim(); });
$("#btnParMinus")?.addEventListener("click", () => { const inp = $("#sPar"); inp.value = Math.max(1, +inp.value - 1); sim(); });
$("#btnParPlus")?.addEventListener("click", () => { const inp = $("#sPar"); inp.value = Math.min(maxN(), +inp.value + 1); sim(); });
$("#entChips")?.addEventListener("click", e => { const b = e.target.closest("[data-ent]"); if (b) { $("#sEnt").value = b.dataset.ent; sim(); } });
$("#parChips")?.addEventListener("click", e => { const b = e.target.closest("[data-par]"); if (b) { $("#sPar").value = Math.min(maxN(), +b.dataset.par); sim(); } });
$("#sMode").addEventListener("click", e => { const b = e.target.closest("[data-m]"); if (!b) return; sMode = b.dataset.m; $$("#sMode button").forEach(x => x.classList.toggle("on", x === b)); sim(); });

/* ---------------- revelar ao rolar ---------------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .1 });
$$(".rv").forEach(el => io.observe(el));

/* ---------------- rotas e início ---------------- */
function route() {
  const h = decodeURIComponent(location.hash.slice(1)).toLowerCase();
  const path = decodeURIComponent(location.pathname).toLowerCase();
  const urlP = new URLSearchParams(location.search);
  const mParam = (urlP.get("m") || urlP.get("p") || urlP.get("moto") || urlP.get("id") || "").toLowerCase();
  const pathMatch = path.match(/\/(?:moto|m|produto)\/([^\/]+)/i);
  const targetId = mParam || (pathMatch ? decodeURIComponent(pathMatch[1]).toLowerCase() : null) || h;

  const catParam = (urlP.get("cat") || urlP.get("c") || "").toLowerCase();
  if (targetId === "shineray" || path.includes("shineray") || h === "shineray" || catParam === "shineray") {
    setCat("shineray");
    return;
  }
  const p = byId(targetId);
  if (p) {
    setCat(p.cat);
    setTimeout(() => {
      openModal(p.id);
      const card = $(`.card[data-id="${CSS.escape(p.id)}"]`);
      if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return;
  }
  setCat(CATS[h] && !CATS[h].hidden ? h : "ele");
}
window.addEventListener("hashchange", () => {
  const h = decodeURIComponent(location.hash.slice(1)).toLowerCase();
  if (h === "shineray") {
    setCat("shineray");
    return;
  }
  if (CATS[h] && !CATS[h].hidden && h !== cat) {
    setCat(h);
  } else {
    const p = byId(h);
    if (p && (!cur || cur.id !== p.id)) openModal(p.id);
  }
});

(async () => {
  try { await load(); } catch (e) {
    document.body.insertAdjacentHTML("afterbegin", `<div style="background:#d10000;color:#fff;padding:14px;text-align:center;font-weight:700">Não foi possível carregar o catálogo. Inicie o servidor com <code>node server.js</code> e abra http://localhost:5173</div>`); return;
  }
  route();
  connect();
})();

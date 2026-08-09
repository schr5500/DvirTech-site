/* =====================================================================
   DvirTech — דף המוצרים (products.html)
   =====================================================================
   מציג את *אותו* קטלוג שהבונה משתמש בו, מאותו getCatalog ומאותו גיליון
   ספקים פרטי. ההבדל היחיד: הבונה עובר קטגוריה-קטגוריה, בודק תאימות
   ומחשב הרכבה, ואילו כאן פשוט מציגים רשימה ומסננים אותה.

   אין כאן שום מחיר קשיח ושום רשימת מוצרים קשיחה — הכל מגיע מהשרת.
   ⚠️ PAYMENT_API_URL חייב להיות זהה לזה שב-checkout.js ו-catalog-loader.js.
===================================================================== */

const PAYMENT_API_URL = "https://script.google.com/macros/s/AKfycbwuW5tgiRDhoIEFNkHHWgkVot6FyHFEUBa1mx41ck1lp74ChzT8pciMV9qaI0NcDw-sKA/exec";

/* סדר הקטגוריות בחנות. המוצרים השלמים למעלה — זה מה שרוב הלקוחות
   מחפשים — ואחריהם הרכיבים הבודדים. services לא מופיע כאן: שירות
   נלווה נמכר יחד עם הרכבה, לא כפריט מדף. */
const SHOP_CATEGORY_ORDER = [
  "readyPc", "peripherals",
  "cpu", "gpu", "mobo", "ram", "storage", "cooling", "psu", "case"
];

/* ==================== הגדרת הסינונים ====================
   לכל קטגוריה, אילו שדות הופכים לקבוצת סינון ובאיזה סדר.
   type: "list"  — תיבות סימון עם מונה כמות (ברירת המחדל)
         "range" — טווח מספרי (מוצג כתיבות סימון על ערכים קיימים)
         "bool"  — כן/לא
   הסינון תמיד נבנה מהערכים שקיימים *בפועל* בנתונים, אז שדה ריק
   בגיליון פשוט לא מייצר קבוצת סינון — אין קבוצות ריקות באתר. */
const FACETS = {
  readyPc:     ["brand", "useCase", "ramGb", "storageGb", "warrantyMonths"],
  peripherals: ["subType", "brand", "connection", "switchType", "sizeInch", "refreshHz", "resolution", "panel", "rgb"],
  cpu:         ["brand", "socket", "tier", "ramType", "overclockable"],
  gpu:         ["chipset", "brand", "vramGb", "tier"],
  mobo:        ["brand", "socket", "ramType", "formFactor", "tier"],
  ram:         ["brand", "capacityGb", "ramType", "speedMhz"],
  storage:     ["brand"],
  cooling:     ["brand", "type", "radiatorMm", "heightMm"],
  psu:         ["brand", "wattage"],
  "case":      ["brand", "supportedFormFactors", "maxGpuLengthMm"]
};

const FACET_LABELS = {
  brand:                { he: "יצרן",              en: "Brand" },
  useCase:              { he: "ייעוד",             en: "Use case" },
  ramGb:                { he: "זיכרון",            en: "Memory" },
  storageGb:            { he: "אחסון",             en: "Storage" },
  warrantyMonths:       { he: "אחריות",            en: "Warranty" },
  subType:              { he: "סוג מוצר",          en: "Product type" },
  connection:           { he: "חיבור",             en: "Connection" },
  switchType:           { he: "סוג מתגים",         en: "Switch type" },
  sizeInch:             { he: "גודל מסך",          en: "Screen size" },
  refreshHz:            { he: "קצב רענון",         en: "Refresh rate" },
  resolution:           { he: "רזולוציה",          en: "Resolution" },
  panel:                { he: "סוג פאנל",          en: "Panel type" },
  rgb:                  { he: "תאורת RGB",         en: "RGB lighting" },
  socket:               { he: "תושבת",             en: "Socket" },
  tier:                 { he: "רמת ביצועים",       en: "Performance tier" },
  ramType:              { he: "סוג זיכרון",        en: "Memory type" },
  overclockable:        { he: "תמיכה באוברקלוק",   en: "Overclockable" },
  chipset:              { he: "שבב גרפי",          en: "GPU chipset" },
  vramGb:               { he: "זיכרון גרפי",       en: "VRAM" },
  formFactor:           { he: "גודל לוח",          en: "Form factor" },
  supportedFormFactors: { he: "לוחות נתמכים",      en: "Supported boards" },
  capacityGb:           { he: "נפח",               en: "Capacity" },
  speedMhz:             { he: "מהירות",            en: "Speed" },
  type:                 { he: "סוג קירור",         en: "Cooler type" },
  radiatorMm:           { he: "גודל רדיאטור",      en: "Radiator size" },
  heightMm:             { he: "גובה",              en: "Height" },
  wattage:              { he: "הספק",              en: "Wattage" },
  maxGpuLengthMm:       { he: "אורך כרטיס מירבי",  en: "Max GPU length" }
};

/* תרגום ערכים טכניים לעברית קריאה. מה שלא מופיע כאן מוצג כמו שהוא
   (שמות יצרנים, LGA1700, DDR5 וכו' — לא מתרגמים). */
const VALUE_LABELS = {
  useCase:    { office:{he:"משרדי",en:"Office"}, gaming:{he:"גיימינג",en:"Gaming"}, creative:{he:"עריכה ויצירה",en:"Creative"}, server:{he:"שרת",en:"Server"} },
  subType:    { mouse:{he:"עכבר",en:"Mouse"}, keyboard:{he:"מקלדת",en:"Keyboard"}, monitor:{he:"מסך",en:"Monitor"}, headset:{he:"אוזניות",en:"Headset"}, speakers:{he:"רמקולים",en:"Speakers"}, webcam:{he:"מצלמת רשת",en:"Webcam"}, chair:{he:"כיסא",en:"Chair"}, other:{he:"אחר",en:"Other"} },
  connection: { wired:{he:"חוטי",en:"Wired"}, wireless:{he:"אלחוטי",en:"Wireless"}, bluetooth:{he:"Bluetooth",en:"Bluetooth"} },
  switchType: { mechanical:{he:"מכני",en:"Mechanical"}, membrane:{he:"ממברנה",en:"Membrane"}, optical:{he:"אופטי",en:"Optical"} },
  type:       { air:{he:"אוויר",en:"Air"}, aio:{he:"נוזלי (AIO)",en:"Liquid (AIO)"} },
  tier:       { 1:{he:"בסיסי",en:"Entry"}, 2:{he:"בינוני",en:"Mid"}, 3:{he:"גבוה",en:"High"}, 4:{he:"פרימיום",en:"Premium"} }
};

// יחידת מידה שנוספת לערך מספרי בתצוגת הסינון בלבד
const FACET_UNITS = {
  ramGb:"GB", storageGb:"GB", capacityGb:"GB", vramGb:"GB", speedMhz:"MHz",
  sizeInch:'"', refreshHz:"Hz", radiatorMm:"mm", heightMm:"mm",
  maxGpuLengthMm:"mm", wattage:"W", warrantyMonths:null
};

/* ==================== state ==================== */
let SHOP_CATALOG = null;
let currentCat = null;
let activeFilters = {};      // { facetKey: Set(values) }
let searchTerm = "";
let sortMode = "priceAsc";

/* ==================== helpers ==================== */
function L(obj){ return LANG === "en" ? obj.en : obj.he; }
function facetLabel(key){ return FACET_LABELS[key] ? L(FACET_LABELS[key]) : key; }

function valueLabel(facetKey, raw){
  const map = VALUE_LABELS[facetKey];
  if(map && map[raw] !== undefined) return L(map[raw]);
  if(typeof raw === "boolean") return raw ? tr("כן","Yes") : tr("לא","No");
  const unit = FACET_UNITS[facetKey];
  if(unit && typeof raw === "number") return raw.toLocaleString() + unit;
  if(facetKey === "warrantyMonths") return raw + " " + tr("חודשים","months");
  if(facetKey === "storageGb" && raw >= 1000) return (raw/1000) + "TB";
  return String(raw);
}

function itemName(it){ return (LANG==="en" && it.nameEn) ? it.nameEn : it.name; }
function itemSpec(it){ return (LANG==="en" && it.specEn) ? it.specEn : (it.spec || ""); }

// פריטי-דמה ("ללא כרטיס מסך", "ללא שירות") הם בחירה בבונה, לא מוצר
// שנמכר — הם לא אמורים להופיע בחנות בכלל.
function sellableItems(cat){
  const group = SHOP_CATALOG[cat];
  if(!group) return [];
  return (group.items || []).filter(it => it.id !== "none" && Number(it.price) > 0);
}

/* ==================== ניתוח הערכים לסינון ==================== */
/* שדה יכול להחזיק מערך (למשל supportedFormFactors) — ואז כל ערך בו
   נספר בנפרד, כמו שמצופה מסינון. */
function valuesOf(item, key){
  const v = item[key];
  if(v === undefined || v === null || v === "") return [];
  return Array.isArray(v) ? v : [v];
}

function itemMatchesFilters(item, exceptKey){
  for(const key in activeFilters){
    if(key === exceptKey) continue;
    const chosen = activeFilters[key];
    if(!chosen || !chosen.size) continue;
    const vals = valuesOf(item, key).map(String);
    if(!vals.some(v => chosen.has(v))) return false;
  }
  if(searchTerm){
    const hay = (item.name + " " + (item.nameEn||"") + " " + (item.spec||"") + " " + (item.brand||"")).toLowerCase();
    if(hay.indexOf(searchTerm.toLowerCase()) === -1) return false;
  }
  return true;
}

/* המונה ליד כל ערך מחושב מול שאר הסינונים הפעילים אבל *לא* מול
   הקבוצה של עצמו — כך שאפשר לסמן כמה יצרנים יחד והמספרים נשארים
   הגיוניים, בדיוק כמו בחנויות הגדולות. */
function buildFacetData(){
  const items = sellableItems(currentCat);
  const keys = FACETS[currentCat] || ["brand"];
  const out = [];

  keys.forEach(key => {
    const counts = new Map();
    items.forEach(item => {
      if(!itemMatchesFilters(item, key)) return;
      valuesOf(item, key).forEach(v => {
        const k = String(v);
        counts.set(k, (counts.get(k) || 0) + 1);
      });
    });
    // ערכים שנבחרו נשארים גלויים גם אם המונה שלהם 0, אחרת אי אפשר
    // לבטל בחירה שהתאפסה בעקבות סינון אחר.
    const chosen = activeFilters[key];
    if(chosen) chosen.forEach(v => { if(!counts.has(v)) counts.set(v, 0); });
    if(counts.size < 2 && !(chosen && chosen.size)) return;  // קבוצה עם ערך אחד לא מסננת כלום

    const raws = new Map();
    items.forEach(item => valuesOf(item, key).forEach(v => raws.set(String(v), v)));

    const rows = Array.from(counts.entries()).map(([k, n]) => ({ key: k, raw: raws.get(k), count: n }));
    rows.sort((a,b) => {
      const na = Number(a.raw), nb = Number(b.raw);
      if(!isNaN(na) && !isNaN(nb)) return na - nb;
      return String(a.raw).localeCompare(String(b.raw));
    });
    out.push({ key: key, rows: rows });
  });
  return out;
}

function filteredItems(){
  const items = sellableItems(currentCat).filter(it => itemMatchesFilters(it, null));
  const sorters = {
    priceAsc:  (a,b) => a.price - b.price,
    priceDesc: (a,b) => b.price - a.price,
    nameAsc:   (a,b) => itemName(a).localeCompare(itemName(b))
  };
  return items.sort(sorters[sortMode] || sorters.priceAsc);
}

/* ==================== render ==================== */
function renderCatStrip(){
  const strip = document.getElementById("catStrip");
  strip.innerHTML = shopCategories().map(cat => {
    const g = SHOP_CATALOG[cat];
    const n = sellableItems(cat).length;
    return `<button class="cat-pill ${cat===currentCat?"active":""}" onclick="selectCategory('${cat}')">
      ${LANG==="en" ? g.labelEn : g.label} <span class="cat-pill-n">${n}</span>
    </button>`;
  }).join("");
}

function renderNavMenu(){
  const menu = document.getElementById("navProductsMenu");
  menu.innerHTML = shopCategories().map(cat => {
    const g = SHOP_CATALOG[cat];
    return `<button onclick="selectCategory('${cat}');closeNavMenu()">${LANG==="en" ? g.labelEn : g.label}</button>`;
  }).join("");
}

function renderFilters(){
  const wrap = document.getElementById("filterGroups");
  const groups = buildFacetData();

  if(!groups.length){
    wrap.innerHTML = `<p class="no-filters">${tr("אין סינונים לקטגוריה הזו.","No filters for this category.")}</p>`;
    return;
  }

  wrap.innerHTML = groups.map((g, gi) => {
    const chosen = activeFilters[g.key];
    // ברירת מחדל: 3 הקבוצות הראשונות פתוחות, השאר מקופלות — אחרת
    // הסרגל ארוך מדי וקשה לסרוק אותו בעין.
    const open = gi < 3 || (chosen && chosen.size);
    return `
      <div class="filter-group ${open?"open":""}">
        <button class="filter-group-head" onclick="toggleGroup(this)">
          <span>${facetLabel(g.key)}</span>
          <span class="chev">▾</span>
        </button>
        <div class="filter-group-body">
          ${g.rows.map(r => `
            <label class="filter-row ${r.count===0?"dim":""}">
              <input type="checkbox" ${chosen && chosen.has(r.key) ? "checked":""}
                     onchange="toggleFilter('${g.key}', ${JSON.stringify(r.key)}, this.checked)">
              <span class="filter-row-label">${valueLabel(g.key, r.raw)}</span>
              <span class="filter-row-count">${r.count}</span>
            </label>`).join("")}
        </div>
      </div>`;
  }).join("");
}

function renderChips(){
  const wrap = document.getElementById("activeChips");
  const chips = [];
  Object.keys(activeFilters).forEach(key => {
    activeFilters[key].forEach(v => {
      const raw = isNaN(Number(v)) ? v : Number(v);
      chips.push(`<button class="chip" onclick="toggleFilter('${key}', ${JSON.stringify(v)}, false)">
        ${facetLabel(key)}: ${valueLabel(key, raw)} <span class="chip-x">✕</span></button>`);
    });
  });
  if(searchTerm){
    chips.push(`<button class="chip" onclick="clearSearch()">"${searchTerm}" <span class="chip-x">✕</span></button>`);
  }
  wrap.innerHTML = chips.length
    ? chips.join("") + `<button class="chip chip-clear" onclick="clearAllFilters()">${tr("נקה הכל","Clear all")}</button>`
    : "";
}

function renderGrid(){
  const items = filteredItems();
  const grid = document.getElementById("productGrid");
  const empty = document.getElementById("emptyState");

  document.getElementById("resultCount").textContent =
    items.length + " " + (items.length === 1 ? tr("מוצר","product") : tr("מוצרים","products"));

  if(!items.length){
    grid.innerHTML = "";
    empty.style.display = "block";
    empty.innerHTML = `${tr("לא נמצאו מוצרים שמתאימים לסינון.","No products match these filters.")}
      <button class="btn btn-secondary" onclick="clearAllFilters()">${tr("נקה סינונים","Clear filters")}</button>`;
    return;
  }
  empty.style.display = "none";

  grid.innerHTML = items.map(it => `
    <div class="p-card">
      ${it.brand ? `<div class="p-brand">${it.brand}</div>` : ""}
      <h4 class="p-name">${itemName(it)}</h4>
      <p class="p-spec">${itemSpec(it)}</p>
      <div class="p-price">${Number(it.price).toLocaleString()} ₪</div>
      <button class="btn btn-primary" onclick="addCatalogItemToCart('${currentCat}','${it.id}')">${t("addToCartBtn")}</button>
    </div>`).join("");
}

function renderAll(){
  renderCatStrip();
  renderFilters();
  renderChips();
  renderGrid();
}

/* ==================== actions ==================== */
function shopCategories(){
  return SHOP_CATEGORY_ORDER.filter(c => SHOP_CATALOG[c] && sellableItems(c).length);
}

function selectCategory(cat){
  if(cat === currentCat) return;
  currentCat = cat;
  activeFilters = {};
  searchTerm = "";
  document.getElementById("filterSearch").value = "";
  try{ history.replaceState(null, "", "?cat=" + encodeURIComponent(cat)); }catch(e){}
  renderAll();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleFilter(key, value, on){
  if(!activeFilters[key]) activeFilters[key] = new Set();
  if(on) activeFilters[key].add(value);
  else{
    activeFilters[key].delete(value);
    if(!activeFilters[key].size) delete activeFilters[key];
  }
  renderAll();
}

function clearAllFilters(){
  activeFilters = {};
  searchTerm = "";
  document.getElementById("filterSearch").value = "";
  renderAll();
}
function clearSearch(){
  searchTerm = "";
  document.getElementById("filterSearch").value = "";
  renderAll();
}
function onSearchInput(v){ searchTerm = v.trim(); renderAll(); }
function onSortChange(v){ sortMode = v; renderGrid(); }
function toggleGroup(btn){ btn.parentElement.classList.toggle("open"); }

function openFilters(){ document.getElementById("filtersPanel").classList.add("show"); document.body.style.overflow="hidden"; }
function closeFilters(){ document.getElementById("filtersPanel").classList.remove("show"); document.body.style.overflow=""; }

function closeNavMenu(){
  document.getElementById("navProductsDrop").classList.remove("open");
  document.getElementById("navProducts").setAttribute("aria-expanded","false");
}

/* SKU בפורמט "<קטגוריה>:<id>" — בדיוק כמו הבונה, כך שהתמחור בצד שרת
   (priceCart_ ב-4-payment-api.gs) מזהה את שניהם באותה מפה אחת. */
function addCatalogItemToCart(cat, id){
  const it = sellableItems(cat).find(x => x.id === id);
  if(!it) return;
  addToCart({ type:"product", sku: cat + ":" + it.id, name: itemName(it), price: Number(it.price), qty: 1 });
}

/* ==================== static text ==================== */
function renderShopStaticText(){
  document.getElementById("navProducts").textContent = tr("מוצרים ▾","Products ▾");
  document.getElementById("navBuilder").textContent = t("navBuilder");
  document.getElementById("navLab").textContent = t("navLab");
  document.getElementById("navContact").textContent = t("navContact");
  document.getElementById("shopTitle").textContent = tr("מוצרים","Products");
  document.getElementById("shopSubtitle").textContent =
    tr("כל המוצרים במלאי — מחשבים מוכנים, ציוד היקפי ורכיבים בודדים. אותם מחירים בדיוק כמו בבונה המחשבים.",
       "Everything in stock — ready-made PCs, peripherals and individual components. Same prices as the PC builder.");
  document.getElementById("filtersTitle").textContent = tr("סינון","Filters");
  document.getElementById("filterSearch").placeholder = tr("חיפוש בקטגוריה…","Search in category…");
  document.getElementById("filtersToggleBtn").textContent = tr("סינון","Filters");
  document.getElementById("filtersApplyBtn").textContent = tr("הצג תוצאות","Show results");
  document.getElementById("sortLabel").textContent = tr("מיון:","Sort:");
  document.getElementById("footerText").textContent = t("footerText");

  const sel = document.getElementById("sortSelect");
  sel.innerHTML = [
    ["priceAsc",  tr("מחיר: מהנמוך לגבוה","Price: low to high")],
    ["priceDesc", tr("מחיר: מהגבוה לנמוך","Price: high to low")],
    ["nameAsc",   tr("שם A-ת","Name A-Z")]
  ].map(([v,l]) => `<option value="${v}" ${v===sortMode?"selected":""}>${l}</option>`).join("");

  renderFooterLegal();
  document.querySelectorAll(".lang-btn").forEach(b => b.classList.toggle("active", b.dataset.lang === LANG));
}

function setLang(lang){
  if(lang === LANG) return;
  setLangCore(lang);
  renderShopStaticText();
  if(SHOP_CATALOG){ renderNavMenu(); renderAll(); }
}

/* ==================== init ==================== */
async function loadShop(){
  renderShopStaticText();
  try{
    const res = await fetch(PAYMENT_API_URL + "?action=getCatalog");
    const data = await res.json();
    if(!data.ok || !data.catalog) throw new Error(data.error || "getCatalog failed");
    SHOP_CATALOG = data.catalog;
  }catch(e){
    document.getElementById("productGrid").innerHTML =
      `<div class="empty-state">${tr(
        "לא הצלחנו לטעון את הקטלוג כרגע. רענן/י את הדף או נסה/י שוב בעוד רגע.",
        "Couldn't load the catalog right now. Please refresh or try again in a moment.")}</div>`;
    console.error("loadShop failed:", e);
    return;
  }

  const cats = shopCategories();
  if(!cats.length) return;

  const wanted = new URLSearchParams(location.search).get("cat");
  currentCat = cats.indexOf(wanted) > -1 ? wanted : cats[0];

  renderNavMenu();
  renderAll();

  const drop = document.getElementById("navProductsDrop");
  document.getElementById("navProducts").onclick = function(){
    const open = drop.classList.toggle("open");
    this.setAttribute("aria-expanded", open ? "true" : "false");
  };
  document.addEventListener("click", e => { if(!drop.contains(e.target)) closeNavMenu(); });
}

loadShop();

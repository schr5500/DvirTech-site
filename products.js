/* =====================================================================
   DvirTech — דף המוצרים (products.html)
   =====================================================================
   מציג את *אותו* קטלוג שהבונה משתמש בו, מאותו getCatalog ומאותו גיליון
   ספקים פרטי. ההבדל היחיד: הבונה עובר קטגוריה-קטגוריה, בודק תאימות
   ומחשב הרכבה, ואילו כאן פשוט מציגים רשימה ומסננים אותה.

   אין כאן שום מחיר קשיח ושום רשימת מוצרים קשיחה — הכל מגיע מהשרת.

   ⚠️ הקטלוג נטען דרך dvtGetCatalog() שב-search-core.js (שנטען לפני
   הקובץ הזה), ולא דרך fetch מקומי. כך הדף והחיפוש חולקים בקשה אחת.
   כתובת ה-API עצמה יושבת שם כ-DVT_API_URL וחייבת להישאר זהה לזו
   שב-checkout.js.
===================================================================== */

/* סדר הקטגוריות בחנות. "all" היא קטגוריה וירטואלית (לא קיימת בגיליון,
   לא ב-SHOP_CATALOG) שמאחדת את כל השאר — ראו sellableItems(). היא
   ראשונה בכוונה: מי שמגיע ל-products.html בלי ?cat= (למשל מקישור
   "הצג הכל" או מתוצאות חיפוש) אמור לראות הכל, לא קטגוריה שרירותית.
   אחריה המוצרים השלמים — זה מה שרוב הלקוחות מחפשים — ואז הרכיבים
   הבודדים. services לא מופיע כאן: שירות נלווה נמכר יחד עם הרכבה,
   לא כפריט מדף. */
const SHOP_CATEGORY_ORDER = [
  "all", "readyPc", "monitor", "peripherals",
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
  // "brand" הוא השדה היחיד שקיים בעקביות בכל קטגוריה — בדיוק בשביל זה
  // הוא הסינון היחיד שהגיוני להציג כשהתצוגה מערבבת קטגוריות שונות.
  all:         ["brand"],
  readyPc:     ["brand", "useCase", "ramGb", "storageGb", "warrantyMonths"],
  // מסכים הם תת-קבוצה של ציוד היקפי, ולכן אותם שדות בלי subType —
  // כאן כולם מסכים ממילא, וקבוצת סינון עם ערך יחיד לא מסננת כלום.
  monitor:     ["brand", "sizeInch", "refreshHz", "resolution", "panel", "connection"],
  peripherals: ["subType", "brand", "connection", "switchType", "sizeInch", "refreshHz", "resolution", "panel", "rgb"],
  cpu:         ["brand", "socket", "tier", "ramType", "overclockable"],
  gpu:         ["chipset", "brand", "vramGb", "tier"],
  mobo:        ["brand", "socket", "ramType", "formFactor", "tier"],
  ram:         ["brand", "capacityGb", "ramType", "speedMhz"],
  storage:     ["brand", "driveType", "capacityGb", "pcieGen"],
  cooling:     ["brand", "type", "radiatorMm", "heightMm"],
  psu:         ["brand", "wattage"],
  "case":      ["brand", "supportedFormFactors", "maxGpuLengthMm"]
};

/* FACET_LABELS / VALUE_LABELS / FACET_UNITS עברו ל-search-core.js
   כדי שגם דף המוצר ישתמש באותן תוויות. */

/* ==================== state ==================== */
let SHOP_CATALOG = null;
let currentCat = null;
let activeFilters = {};      // { facetKey: Set(values) }
let searchTerm = "";
let sortMode = "priceAsc";
/* טווח המחירים שנבחר. null = הקצה לא הוזז, כלומר אין הגבלה מהצד הזה —
   כך אפשר להבדיל בין "המשתמש בחר בדיוק את המחיר הגבוה ביותר" לבין
   "המשתמש לא נגע בכלל", וה-chip לא קופץ סתם. */
let priceRange = { min: null, max: null };

/* ==================== helpers ==================== */
/* L / facetLabel / valueLabel / itemName / itemSpec — ב-search-core.js */

// פריטי-דמה ("ללא כרטיס מסך", "ללא שירות") הם בחירה בבונה, לא מוצר
// שנמכר — הם לא אמורים להופיע בחנות בכלל.
//
// כל פריט מחזיר עם _realCat — הקטגוריה האמיתית שלו בגיליון. בקטגוריה
// רגילה זה תמיד שווה ל-cat עצמו; ב-"all" זה מה שמבדיל בין הפריטים
// המעורבבים, וזה מה ש-renderGrid/addCatalogItemToCart משתמשים בו כדי
// לדעת לאיזה SKU אמיתי (category:id) להוסיף לעגלה ואיזה איור להציג —
// "all" עצמה איננה קטגוריה אמיתית ואין לה משמעות בשרת או בבונה.
function sellableItems(cat){
  if(cat === "all"){
    const out = [];
    SHOP_CATEGORY_ORDER.forEach(c => {
      // קטגוריה וירטואלית מדלגת ב-"הכל": הפריטים שלה כבר נספרים דרך
      // קטגוריית המקור שלהם (מסך נכלל ב"ציוד היקפי"), ובלי הדילוג
      // הזה כל מסך היה מופיע פעמיים ברשימה.
      if(c === "all" || dvtIsVirtualCat(c)) return;
      out.push(...sellableItems(c));
    });
    return out;
  }
  if(dvtIsVirtualCat(cat)) return dvtVirtualItems(SHOP_CATALOG, cat);

  const group = SHOP_CATALOG[cat];
  if(!group) return [];
  return (group.items || [])
    .filter(dvtIsSellable)
    .map(it => Object.assign({ _realCat: cat }, it));
}

/* ==================== ניתוח הערכים לסינון ==================== */
/* שדה יכול להחזיק מערך (למשל supportedFormFactors) — ואז כל ערך בו
   נספר בנפרד, כמו שמצופה מסינון. */
function valuesOf(item, key){
  const v = item[key];
  if(v === undefined || v === null || v === "") return [];
  return Array.isArray(v) ? v : [v];
}

/* ==================== טווח המחירים ====================
   גבולות הסקאלה נגזרים מכל המוצרים בקטגוריה ולא מהתוצאות המסוננות —
   אחרת הסרגל היה מתכווץ תוך כדי גרירה והידית הייתה בורחת מתחת לאצבע.
   הצעדים מעוגלים כלפי חוץ כדי שהקצוות יהיו מספרים נעימים (₪250 ולא ₪247). */
function priceStepFor(span){
  if(span <= 200) return 10;
  if(span <= 1000) return 25;
  if(span <= 5000) return 50;
  return 100;
}

function priceBounds(){
  const prices = sellableItems(currentCat).map(it => Number(it.price)).filter(p => p > 0);
  if(prices.length < 2) return null;                    // מוצר יחיד — אין מה לסנן
  const lowest = Math.min.apply(null, prices), highest = Math.max.apply(null, prices);
  if(lowest === highest) return null;
  const step = priceStepFor(highest - lowest);
  const lo = Math.floor(lowest / step) * step;
  const hi = Math.ceil(highest / step) * step;
  return { lo: lo, hi: hi, step: step };
}

// הערך שמוצג בידית: מה שנבחר, ואם לא נגעו בה — הקצה של הסקאלה
function priceHandles(b){
  return {
    min: priceRange.min === null ? b.lo : Math.max(b.lo, Math.min(priceRange.min, b.hi)),
    max: priceRange.max === null ? b.hi : Math.min(b.hi, Math.max(priceRange.max, b.lo))
  };
}

function priceFilterActive(){
  return priceRange.min !== null || priceRange.max !== null;
}

function itemMatchesPrice(item){
  const p = Number(item.price);
  if(priceRange.min !== null && p < priceRange.min) return false;
  if(priceRange.max !== null && p > priceRange.max) return false;
  return true;
}

function itemMatchesFilters(item, exceptKey){
  if(!itemMatchesPrice(item)) return false;
  for(const key in activeFilters){
    if(key === exceptKey) continue;
    const chosen = activeFilters[key];
    if(!chosen || !chosen.size) continue;
    const vals = valuesOf(item, key).map(String);
    if(!vals.some(v => chosen.has(v))) return false;
  }
  if(searchTerm && itemSearchScore(item) <= 0) return false;
  return true;
}

/* ניקוד ההתאמה של פריט למונח החיפוש הנוכחי. הלוגיקה עצמה יושבת
   ב-search-core.js ומשותפת עם תיבת החיפוש בהדר, כדי ששתיהן ידרגו
   בדיוק אותו דבר. */
function itemSearchScore(item){
  if(!searchTerm) return 0;
  const cat = item._realCat || currentCat;
  return dvtItemScore(item, catLabel(cat), searchTerm);
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
  const bySort = sorters[sortMode] || sorters.priceAsc;

  // כשיש מונח חיפוש, הרלוונטיות גוברת על המיון שנבחר: חיפוש "RAM"
  // חייב להראות קודם מקלות זיכרון ורק אחר כך לוחות אם שבמפרט שלהם
  // מוזכרים חריצי RAM. בתוך אותה רמת רלוונטיות המיון שנבחר קובע.
  if(searchTerm){
    return items.sort((a,b) => (itemSearchScore(b) - itemSearchScore(a)) || bySort(a,b));
  }
  return items.sort(bySort);
}

/* ==================== render ==================== */
// עובר דרך dvtCatLabel (search-core.js) כדי שהשמות יהיו זהים לדף הבית
// ולתוצאות החיפוש — ובעיקר כדי שהתווית שמשתתפת בניקוד החיפוש תהיה
// "זיכרון RAM" ולא "זיכרון" של הבונה.
function catLabel(cat){
  return dvtCatLabel(cat, SHOP_CATALOG ? SHOP_CATALOG[cat] : null);
}

function renderCatStrip(){
  const strip = document.getElementById("catStrip");
  strip.innerHTML = shopCategories().map(cat => {
    const n = sellableItems(cat).length;
    return `<button class="cat-pill ${cat===currentCat?"active":""}" onclick="selectCategory('${cat}')">
      ${catLabel(cat)} <span class="cat-pill-n">${n}</span>
    </button>`;
  }).join("");
}

function renderNavMenu(){
  const menu = document.getElementById("navProductsMenu");
  menu.innerHTML = shopCategories().map(cat =>
    `<button onclick="selectCategory('${cat}');closeNavMenu()">${catLabel(cat)}</button>`
  ).join("");
}

function priceText(v){ return Number(v).toLocaleString() + " ₪"; }

/* שתי סקאלות שקופות אחת על השנייה. הפעולה על ה-input עצמו מנוטרלת
   (pointer-events) והידיות בלבד לחיצות — אחרת הסקאלה העליונה הייתה
   חוסמת לגמרי את הידית שמתחתיה.
   ה-container מוגדר LTR בכוונה, גם באתר שכולו RTL: זול משמאל ויקר
   מימין זה מה שכולם מצפים לו בסרגל מחירים, וזה גם מה שדביר ביקש. */
function renderPriceGroup(){
  const b = priceBounds();
  if(!b) return "";
  const h = priceHandles(b);
  const pct = v => ((v - b.lo) / (b.hi - b.lo)) * 100;

  // תמיד פתוח: מחיר הוא הסינון הראשון שאנשים מחפשים, וסקאלה מקופלת
  // נראית כמו כותרת ולא כמו משהו שאפשר לשחק איתו.
  return `
    <div class="filter-group price-group open">
      <button class="filter-group-head" onclick="toggleGroup(this)">
        <span>${tr("מחיר","Price")}</span>
        <span class="chev">▾</span>
      </button>
      <div class="filter-group-body">
        <div class="price-slider">
          <div class="price-track"></div>
          <div class="price-fill" id="priceFill"
               style="left:${pct(h.min)}%;right:${100 - pct(h.max)}%"></div>
          <input type="range" class="price-input" id="priceMin"
                 min="${b.lo}" max="${b.hi}" step="${b.step}" value="${h.min}"
                 aria-label="${tr("מחיר מינימלי","Minimum price")}"
                 oninput="onPriceInput('min')" onchange="onPriceCommit()">
          <input type="range" class="price-input" id="priceMax"
                 min="${b.lo}" max="${b.hi}" step="${b.step}" value="${h.max}"
                 aria-label="${tr("מחיר מקסימלי","Maximum price")}"
                 oninput="onPriceInput('max')" onchange="onPriceCommit()">
        </div>
        <div class="price-fields">
          ${priceFieldHtml_("min", tr("מחיר מינימלי","Min price"), h.min, b)}
          <span class="price-fields-sep">–</span>
          ${priceFieldHtml_("max", tr("מחיר מקסימלי","Max price"), h.max, b)}
        </div>
      </div>
    </div>`;
}

/* התיבה מתחת לכל ידית — למי שיודע בדיוק איזה מספר הוא רוצה ולא בא לו
   לכוון אותו בגרירה. onchange ולא oninput: סינון על כל הקשה היה מסנן
   לפי "1" באמצע הקלדת "1500". Enter מוציא פוקוס וזה מפעיל את onchange. */
function priceFieldHtml_(which, label, value, b){
  return `
    <label class="price-field">
      <span class="price-field-label">${label}</span>
      <span class="price-field-box">
        <span class="price-field-cur">₪</span>
        <input type="number" class="price-field-input" id="price${which === "min" ? "Min" : "Max"}Box"
               inputmode="numeric" min="${b.lo}" max="${b.hi}" value="${value}"
               onchange="onPriceBox('${which}', this.value)"
               onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur();}">
      </span>
    </label>`;
}

/* כשהידיות יושבות בדיוק אחת על השנייה רק העליונה ניתנת לתפיסה, ולכן
   העליונה חייבת להיות זו שיש לה לאן לזוז: בקצה העליון של הסקאלה זו
   המינימום (שיכולה רק לרדת), ובקצה התחתון זו המקסימום. בלי זה אפשר
   להיתקע עם שתי ידיות צמודות שאף אחת מהן לא זזה. */
function priceStack_(b, lo){
  const elMin = document.getElementById("priceMin");
  if(elMin) elMin.style.zIndex = lo > (b.lo + b.hi) / 2 ? 5 : 3;
}

/* מקור אמת אחד: priceRange. הסקאלה, הפס והתיבות כולם נגזרים ממנו כאן,
   כך שגרירה והקלדה לא יכולות להיפרד זו מזו.
   הערה על ה"פיקסל": הסקאלה קופצת בצעדים (₪25/₪50/₪100) והתיבה מקבלת
   מספר מדויק. במקרה כזה הידית עומדת על הצעד הקרוב אבל המספר שנשמר
   ומסנן הוא מה שהוקלד — עדיף עיגול של כמה פיקסלים על פני "תיקנתי לך
   את המספר שהקלדת". */
function syncPriceUI_(b){
  const h = priceHandles(b);
  const elMin = document.getElementById("priceMin"), elMax = document.getElementById("priceMax");
  if(!elMin || !elMax) return;

  elMin.value = h.min;
  elMax.value = h.max;
  // הפס מצויר לפי מה שהסקאלה באמת מציגה (אחרי הצמדה לצעד), אחרת קצה
  // הפס והידית לא יושבים באותו מקום
  const pct = v => ((v - b.lo) / (b.hi - b.lo)) * 100;
  const fill = document.getElementById("priceFill");
  fill.style.left = pct(Number(elMin.value)) + "%";
  fill.style.right = (100 - pct(Number(elMax.value))) + "%";

  const boxMin = document.getElementById("priceMinBox"), boxMax = document.getElementById("priceMaxBox");
  if(boxMin && document.activeElement !== boxMin) boxMin.value = h.min;
  if(boxMax && document.activeElement !== boxMax) boxMax.value = h.max;

  priceStack_(b, Number(elMin.value));
}

/* תוך כדי גרירה מרעננים רק את הסקאלה, התיבות והתוצאות — בכוונה לא את
   סרגל הסינון כולו. renderFilters בונה מחדש את ה-innerHTML, וזה היה
   מוחק את ה-input שהאצבע אוחזת בו והגרירה הייתה נקטעת אחרי צעד אחד. */
function onPriceInput(which){
  const b = priceBounds();
  if(!b) return;
  const elMin = document.getElementById("priceMin"), elMax = document.getElementById("priceMax");
  let lo = Number(elMin.value), hi = Number(elMax.value);

  // הידיות לא עוברות אחת את השנייה — זו שנדחפה נעצרת בשנייה
  if(lo > hi){ if(which === "min") lo = hi; else hi = lo; }

  setPriceSide_("min", lo, b);
  setPriceSide_("max", hi, b);
  syncPriceUI_(b);
  renderChips();
  renderGrid();
}

// קצה שיושב על גבול הסקאלה = "לא הוגבל", ולכן null ולא מספר. כך הצ'יפ
// לא מופיע סתם ו"נקה הכל" יודע שאין מה לנקות.
function setPriceSide_(which, value, b){
  const v = Math.min(b.hi, Math.max(b.lo, value));
  if(which === "min") priceRange.min = v <= b.lo ? null : v;
  else                priceRange.max = v >= b.hi ? null : v;
}

/* התיבות: מספר ריק או לא חוקי = ביטול ההגבלה מהצד הזה. מספר שחורג
   מהגבולות נצבט פנימה, ומספר שעובר את הצד השני נעצר בו — בדיוק כמו
   הידיות, כדי ששתי דרכי הקלט יתנהגו אותו דבר. */
function onPriceBox(which, raw){
  const b = priceBounds();
  if(!b) return;
  const txt = String(raw).replace(/[^\d.-]/g, "").trim();
  const num = txt === "" ? NaN : Number(txt);

  if(isNaN(num)){
    if(which === "min") priceRange.min = null; else priceRange.max = null;
  }else{
    const h = priceHandles(b);
    const capped = which === "min" ? Math.min(num, h.max) : Math.max(num, h.min);
    setPriceSide_(which, capped, b);
  }

  renderAll();          // הקלדה היא סוף פעולה, אז מרעננים גם את המונים
}

// בסוף הגרירה מרעננים הכל, כדי שהמונים של שאר הקבוצות יתעדכנו
function onPriceCommit(){ renderAll(); }

function clearPriceFilter(){
  priceRange = { min: null, max: null };
  renderAll();
}

function renderFilters(){
  const wrap = document.getElementById("filterGroups");
  const groups = buildFacetData();
  const priceHtml = renderPriceGroup();

  if(!groups.length && !priceHtml){
    wrap.innerHTML = `<p class="no-filters">${tr("אין סינונים לקטגוריה הזו.","No filters for this category.")}</p>`;
    return;
  }

  wrap.innerHTML = priceHtml + groups.map((g, gi) => {
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

  const pb = priceBounds();
  if(pb) priceStack_(pb, priceHandles(pb).min);
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
  if(priceFilterActive()){
    const b = priceBounds();
    if(b){
      const h = priceHandles(b);
      // רק הקצה שהוזז מוצג — "עד ₪2,000" קריא יותר מ-"₪0 – ₪2,000"
      const label = priceRange.min === null ? tr("עד ","Up to ") + priceText(h.max)
                  : priceRange.max === null ? tr("מ-","From ") + priceText(h.min)
                  : priceText(h.min) + " – " + priceText(h.max);
      chips.push(`<button class="chip" onclick="clearPriceFilter()">
        ${tr("מחיר","Price")}: ${label} <span class="chip-x">✕</span></button>`);
    }
  }
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

  // תמונת מוצר אמיתית (עמודת image בגיליון) גוברת תמיד. בלעדיה מוצג
  // איור הקטגוריה מ-sprite.js, כדי שלכרטיס תמיד יהיה חלק חזותי.
  // ⚠️ האיור לפי it._realCat ולא currentCat: בתצוגת "הכל" currentCat
  // הוא "all" (לא קטגוריה אמיתית, אין לה איור משלה), וכל פריט צריך
  // את האיור של הקטגוריה האמיתית שלו, לא את אותו איור לכולם.
  const art = it => it.image
    ? `<img src="${it.image}" alt="" loading="lazy">`
    : `<svg aria-hidden="true"><use href="#${typeof dvtIcon === "function" ? dvtIcon(it._realCat) : "ic-case"}"/></svg>`;

  // תג הקטגוריה מוצג רק בתצוגת "הכל" — כשמסתכלים על קטגוריה אחת ממילא
  // ברור מה רואים, והתג היה רק רעש חוזר על עצמו.
  const catTag = it => currentCat === "all"
    ? `<div class="p-cat-tag">${catLabel(it._realCat)}</div>` : "";

  // כל הכרטיס מוביל לדף המוצר, חוץ מכפתור "הוסף לעגלה" שעוצר את
  // ההתפשטות כדי שקנייה מהירה מהרשימה תמשיך לעבוד כמו קודם.
  const href = it => `product.html?cat=${encodeURIComponent(it._realCat)}&id=${encodeURIComponent(it.id)}`;

  grid.innerHTML = items.map(it => `
    <a class="p-card" href="${href(it)}">
      <div class="p-art">${art(it)}</div>
      ${catTag(it)}
      ${it.brand ? `<div class="p-brand">${it.brand}</div>` : ""}
      <h4 class="p-name">${itemName(it)}</h4>
      <p class="p-spec">${itemSpec(it)}</p>
      <div class="p-price">${Number(it.price).toLocaleString()} ₪</div>
      <button class="btn btn-primary"
              onclick="event.preventDefault();event.stopPropagation();addCatalogItemToCart('${it._realCat}','${it.id}')">${t("addToCartBtn")}</button>
    </a>`).join("");
}

function renderAll(){
  renderCatStrip();
  renderFilters();
  renderChips();
  renderGrid();
}

/* ==================== actions ==================== */
function shopCategories(){
  return SHOP_CATEGORY_ORDER.filter(c =>
    (c === "all" || dvtIsVirtualCat(c) || SHOP_CATALOG[c]) && sellableItems(c).length);
}

function selectCategory(cat){
  if(cat === currentCat) return;
  currentCat = cat;
  activeFilters = {};
  priceRange = { min: null, max: null };   // טווח של קטגוריה אחת לא רלוונטי לאחרת
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
  priceRange = { min: null, max: null };
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
  document.getElementById("navHome").textContent = t("navHome");
  document.getElementById("navProducts").textContent = tr("מוצרים ▾","Products ▾");
  document.getElementById("navBuilder").textContent = t("navBuilder");
  document.getElementById("navLab").textContent = t("navLab");
  document.getElementById("navWhy").textContent = t("navWhy");
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
    SHOP_CATALOG = await dvtGetCatalog();
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

  const params = new URLSearchParams(location.search);
  const wanted = params.get("cat");
  currentCat = cats.indexOf(wanted) > -1 ? wanted : cats[0];

  // ?q= מגיע מהחיפוש הכלל-אתרי בהדר (site-search.js) — מציב את מילת
  // החיפוש כאילו המשתמש הקליד אותה כאן, כולל בתיבה עצמה, כך שאפשר גם
  // לערוך אותה בלי להתחיל מחדש.
  const wantedQ = params.get("q");
  if(wantedQ){
    searchTerm = wantedQ;
    const searchBox = document.getElementById("filterSearch");
    if(searchBox) searchBox.value = wantedQ;
  }

  renderNavMenu();
  renderAll();

  // הדף נפתח מהמטמון מיידית; אם הרענון ברקע גילה שינוי אמיתי, מרעננים
  // את התצוגה בלי להפריע לסינון או לגלילה הנוכחיים.
  dvtOnCatalogRefresh(fresh => {
    SHOP_CATALOG = fresh;
    renderNavMenu();
    renderAll();
  });

  const drop = document.getElementById("navProductsDrop");
  document.getElementById("navProducts").onclick = function(){
    const open = drop.classList.toggle("open");
    this.setAttribute("aria-expanded", open ? "true" : "false");
  };
  document.addEventListener("click", e => { if(!drop.contains(e.target)) closeNavMenu(); });
}

loadShop();

/* =====================================================================
   DvirTech — חיפוש כלל-אתרי (site-search.js)
   =====================================================================
   רץ בכל דף שיש בו תיבת חיפוש עם id="siteSearch".
   דורש: search-core.js (dvtGetCatalog / dvtItemScore / dvtCatLabel).

   מה קורה כאן:
   • הקלדה פותחת תפריט נפתח עם התוצאות הכי מתאימות מכל הקטגוריות יחד,
     ממוינות לפי ניקוד (ראה ההסבר ב-search-core.js), ועם שורת קטגוריה
     למעלה כשהמונח מתאים לקטגוריה שלמה — "RAM" מציע קודם כל את
     "זיכרון RAM · 5 מוצרים" ורק אחריו פריטים בודדים.
   • Enter או קליק על הזכוכית שולחים ל-products.html?cat=all&q=…
     שמציג את כל התוצאות (products.js קורא את ?q= ומסנן עם "הכל").
   • הקטלוג כבר נטען מראש ע"י search-core.js, ולכן התוצאות מופיעות
     מיד ולא אחרי כמה שניות של המתנה לרשת.
===================================================================== */

const SITE_SEARCH_MAX_ROWS = 6;

function _ssLang(){ return (typeof LANG !== "undefined" ? LANG : "he"); }
function _ssTr(he, en){ return _ssLang() === "en" ? en : he; }

/* אוסף התאמות מכל הקטגוריות, כבר ממוין לפי ניקוד. */
function siteSearchMatches(catalog, term){
  const out = [];
  Object.keys(catalog).forEach(cat => {
    if(cat === "services") return;               // שירות נלווה, לא פריט מדף
    const group = catalog[cat];
    const label = dvtCatLabel(cat, group);
    (group.items || []).forEach(it => {
      if(!dvtIsSellable(it)) return;
      const score = dvtItemScore(it, label, term);
      if(score > 0) out.push({ cat, it, score, label });
    });
  });
  out.sort((a, b) => b.score - a.score || Number(a.it.price) - Number(b.it.price));
  return out;
}

/* קטגוריות שהשם שלהן עצמו תואם למונח — מוצגות כשורה נפרדת למעלה. */
function siteSearchCategoryHits(catalog, term){
  const q = String(term || "").toLowerCase().trim();
  if(!q) return [];
  const hits = [];
  Object.keys(catalog).forEach(cat => {
    if(cat === "services") return;
    const group = catalog[cat];
    const label = dvtCatLabel(cat, group);
    const n = (group.items || []).filter(dvtIsSellable).length;
    if(n && label.toLowerCase().indexOf(q) > -1) hits.push({ cat, label, n });
  });
  return hits;
}

function initSiteSearch(){
  const input = document.getElementById("siteSearch");
  if(!input || input.dataset.siteSearchInit) return;  // מונע אתחול כפול
  input.dataset.siteSearchInit = "1";

  const wrap = input.closest(".head-search") || input.parentElement;
  if(getComputedStyle(wrap).position === "static") wrap.style.position = "relative";
  const panel = document.createElement("div");
  panel.className = "site-search-panel";
  wrap.appendChild(panel);

  let debounceT = null;
  let lastRun = 0;

  const closePanel = () => { panel.classList.remove("show"); panel.innerHTML = ""; };

  const goToResults = () => {
    const q = input.value.trim();
    if(!q) return;
    window.location.href = "products.html?cat=all&q=" + encodeURIComponent(q);
  };

  async function runSearch(){
    const term = input.value.trim();
    if(!term){ closePanel(); return; }

    // מצב ביניים: אם הקטלוג עדיין בדרך, שהמשתמש יראה שמשהו קורה
    if(!_dvtCatalog){
      panel.innerHTML = `<div class="site-search-empty">${_ssTr("מחפש…","Searching…")}</div>`;
      panel.classList.add("show");
    }

    const runId = ++lastRun;
    let catalog;
    try{ catalog = await dvtGetCatalog(); }
    catch(e){
      if(runId !== lastRun) return;
      panel.innerHTML = `<div class="site-search-empty">${_ssTr("לא הצלחנו לטעון את הקטלוג.","Couldn't load the catalog.")}</div>`;
      panel.classList.add("show");
      return;
    }
    // תשובה של הקלדה ישנה שהגיעה באיחור — מתעלמים ממנה
    if(runId !== lastRun) return;

    const all  = siteSearchMatches(catalog, term);
    const cats = siteSearchCategoryHits(catalog, term);

    if(!all.length && !cats.length){
      const safeTerm = escHtml(term);
      panel.innerHTML = `<div class="site-search-empty">${
        _ssTr(`אין תוצאות עבור "${safeTerm}"`, `No results for "${safeTerm}"`)}</div>`;
      panel.classList.add("show");
      return;
    }

    const catRows = cats.map(c => `
      <a class="site-search-row site-search-cat-row" href="products.html?cat=${encodeURIComponent(c.cat)}">
        <span class="ssr-name">${escHtml(c.label)}</span>
        <span class="ssr-meta"><span class="ssr-cat">${
          _ssTr(`${c.n} מוצרים`, `${c.n} products`)}</span></span>
      </a>`).join("");

    const itemRows = all.slice(0, SITE_SEARCH_MAX_ROWS).map(({cat, it, label}) => {
      const name  = (_ssLang() === "en" && it.nameEn) ? it.nameEn : it.name;
      const price = Number(it.price).toLocaleString("he-IL") + " ₪";
      const href  = "products.html?cat=" + encodeURIComponent(cat) + "&q=" + encodeURIComponent(term);
      return `<a class="site-search-row" href="${href}">
        <span class="ssr-name">${escHtml(name)}</span>
        <span class="ssr-meta"><span class="ssr-cat">${escHtml(label)}</span><span class="ssr-price">${price}</span></span>
      </a>`;
    }).join("");

    const seeAll = all.length
      ? `<a class="site-search-all" href="products.html?cat=all&q=${encodeURIComponent(term)}">${
          _ssTr(`כל ${all.length} התוצאות עבור "${escHtml(term)}"`, `See all ${all.length} results for "${escHtml(term)}"`)} ←</a>`
      : "";

    panel.innerHTML = catRows + itemRows + seeAll;
    panel.classList.add("show");
  }

  input.addEventListener("input", () => {
    clearTimeout(debounceT);
    debounceT = setTimeout(runSearch, 160);
  });
  input.addEventListener("keydown", e => {
    if(e.key === "Enter"){ e.preventDefault(); closePanel(); goToResults(); }
    else if(e.key === "Escape"){ closePanel(); input.blur(); }
  });
  input.addEventListener("focus", () => { if(input.value.trim()) runSearch(); });
  document.addEventListener("click", e => { if(!wrap.contains(e.target)) closePanel(); });

  // אייקון הזכוכית: קליק = חיפוש מלא, כמו Enter
  const icon = wrap.querySelector("svg");
  if(icon){
    icon.style.cursor = "pointer";
    icon.style.pointerEvents = "auto";
    icon.addEventListener("click", goToResults);
  }
}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", initSiteSearch);
}else{
  initSiteSearch();
}

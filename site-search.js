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
/* ==================== אינדקס עמודי האתר ====================
   דביר: "אפשר להוסיף אפשרות שכשמקלידים מילה זה שואל באיזה קטגוריה —
   מלל האתר (למציאת שירותים/דברים בתקנון), קטגוריית מוצרים..."

   ⚠️ אינדקס מתוחזק ידנית ולא סריקה אוטומטית של הדפים, משתי סיבות:
   הדפים נבנים ב-JS ואין מה לסרוק לפני שהם רצים, וחשוב מזה — כאן
   אפשר לכתוב את **המילים שהלקוח יחפש**, שאינן בהכרח המילים שכתובות
   בדף. לקוח מחפש "אחריות" ולא "סעיף 7".

   ⚠️ ברירת המחדל נשארת מוצרים. הבורר קיים למי שרוצה, ולא מכריח
   אף אחד לבחור לפני שהוא מחפש. */
var DVT_SITE_PAGES = [
  { href:"terms.html",        he:"תקנון האתר",              kw:"תקנון תנאים ביטול החזרה החזר זכות צרכן אחריות משלוח פרטיות עוסק פטור קבלה DOA תקינות בהגעה" },
  { href:"terms.html",        he:"תקנון · אחריות (סעיף 7)", kw:"אחריות יצרן יבואן מעבדה שנה שנתיים 3 שנים DOA תקינות בהגעה on-site הרכבה 90 יום" },
  { href:"terms.html",        he:"תקנון · ביטול עסקה",      kw:"ביטול עסקה החזרה החזר כספי דמי ביטול 14 יום צרכן" },
  { href:"support.html",      he:"שירות ותמיכה",            kw:"תמיכה שירות תיקון שדרוג אבחון תקלה ביקור בית מרחוק ניקוי משחה תרמית מעבדה" },
  { href:"support.html",      he:"חבילות שירות שנתיות",     kw:"חבילה חבילות מנוי שנתי DvirTech Care קדימות תמיכה" },
  { href:"builder.html",      he:"בונה המחשבים",            kw:"בונה הרכבה מחשב מותאם אישית תאימות להרכיב" },
  { href:"why-dvirtech.html", he:"למה DvirTech",            kw:"למה עלינו אמינות מחיר שקוף הרכבה מוזלת יתרונות" },
  { href:"tracking.html",     he:"מעקב הזמנה",              kw:"מעקב הזמנה סטטוס איפה החבילה משלוח מתי יגיע" },
  { href:"contact.html",      he:"צור קשר",                 kw:"טלפון וואטסאפ מייל כתובת שעות פתיחה יצירת קשר" },
  { href:"privacy.html",      he:"מדיניות פרטיות",          kw:"פרטיות מידע אישי עוגיות cookies אבטחה" },
  { href:"products.html",     he:"כל המוצרים",              kw:"קטלוג מוצרים חנות מלאי מבצעים" }
];

/* התאמת מונח לעמוד. ⚠️ אין כאן ניקוד מתוחכם: העמודים מעטים, וכל
   התאמה היא רלוונטית באותה מידה. סדר הרשימה הוא סדר החשיבות. */
function siteSearchPages(term){
  var toks = String(term || "").toLowerCase().trim().split(/\s+/).filter(Boolean);
  if(!toks.length) return [];
  return DVT_SITE_PAGES.filter(function(p){
    var hay = (p.he + " " + p.kw).toLowerCase();
    for(var i = 0; i < toks.length; i++) if(hay.indexOf(toks[i]) === -1) return false;
    return true;
  });
}

function siteSearchMatches(catalog, term){
  const out = [];
  Object.keys(catalog).forEach(cat => {
    if(cat === "services") return;               // שירות נלווה, לא פריט מדף
    const group = catalog[cat];
    const label = dvtCatLabel(cat, group);
    (group.items || []).forEach(it => {
      if(!dvtIsSellable(it, cat)) return;
      const score = dvtItemScore(it, label, term, cat);
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
    const n = (group.items || []).filter(it => dvtIsSellable(it, cat)).length;
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
  /* "products" | "site" — ברירת המחדל היא מוצרים, כדי שמי שלא רוצה
     להסתבך פשוט יקליד ויקבל מה שהוא ציפה לו. */
  let searchScope = "products";

  /* ⚠️ שורת הבורר נבנית במקום אחד. קודם היא הועתקה לשלושה ענפים,
     ובאחד מהם `is-on` היה מקובע ל"מוצרים" — ולכן אחרי מעבר ל"באתר"
     הכפתור הפעיל חזר להיראות "מוצרים". */
  function scopeBarHtml(){
    return `<div class="ss-scope">
        <button type="button" class="ss-scope-btn${searchScope === "products" ? " is-on" : ""}"
                data-scope="products">${_ssTr("מוצרים","Products")}</button>
        <button type="button" class="ss-scope-btn${searchScope === "site" ? " is-on" : ""}"
                data-scope="site">${_ssTr("באתר","On the site")}</button>
      </div>`;
  }

  function renderSiteScope(term){
    const pages = siteSearchPages(term);
    panel.innerHTML = scopeBarHtml() + (pages.length
      ? pages.map(p => `
        <a class="site-search-row" href="${p.href}">
          <span class="ssr-name">${escHtml(p.he)}</span>
          <span class="ssr-meta"><span class="ssr-cat">${_ssTr("עמוד","Page")}</span></span>
        </a>`).join("")
      : `<div class="site-search-empty">${
           _ssTr(`לא נמצא עמוד עבור "${escHtml(term)}"`, `No page for "${escHtml(term)}"`)}</div>`);
    panel.classList.add("show");
    bindScope();
  }

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

    /* ⚠️ הבדיקה הזו חייבת לרוץ **לפני** חישוב תוצאות המוצרים ולפני
       מסך "אין תוצאות": כשהלקוח בחר "באתר", היעדר מוצרים תואמים אינו
       רלוונטי בכלל. בגרסה הראשונה היא ישבה אחריהם, וחיפוש "אחריות"
       (שאין לו מוצר תואם) נעצר במסך הריק ולא הגיע לענף האתר. */
    if(searchScope === "site"){ renderSiteScope(term); return; }

    const all  = siteSearchMatches(catalog, term);
    const cats = siteSearchCategoryHits(catalog, term);

    if(!all.length && !cats.length){
      const safeTerm = escHtml(term);
      panel.innerHTML =
        scopeBarHtml() +
        `<div class="site-search-empty">${
          _ssTr(`אין תוצאות עבור "${safeTerm}" — אפשר לחפש גם באתר`,
                `No results for "${safeTerm}" — try searching the site`)}</div>`;
      panel.classList.add("show");
      bindScope();
      return;
    }

    const catRows = cats.map(c => `
      <a class="site-search-row site-search-cat-row" href="products.html?cat=${encodeURIComponent(c.cat)}">
        ${dvtThumbHtml(null, c.cat)}
        <span class="ssr-name">${escHtml(c.label)}</span>
        <span class="ssr-meta"><span class="ssr-cat">${
          _ssTr(`${c.n} מוצרים`, `${c.n} products`)}</span></span>
      </a>`).join("");

    const itemRows = all.slice(0, SITE_SEARCH_MAX_ROWS).map(({cat, it, label}) => {
      const name  = (_ssLang() === "en" && it.nameEn) ? it.nameEn : it.name;
      const price = Number(it.price).toLocaleString("he-IL") + " ₪";
      const href  = "products.html?cat=" + encodeURIComponent(cat) + "&q=" + encodeURIComponent(term);
      /* ⚠️ התמונה היא הדבר שהופך רשימת שמות לרשימת מוצרים. שמות
         המוצרים כאן ארוכים ודומים זה לזה ("לוח אם Gigabyte B650M...")
         ונחתכים באמצע — הלקוח מזהה את הפריט לפי איך שהוא נראה הרבה
         לפני שהוא מסיים לקרוא את השם. */
      return `<a class="site-search-row" href="${href}">
        ${dvtThumbHtml(it, cat)}
        <span class="ssr-name">${escHtml(name)}</span>
        <span class="ssr-meta"><span class="ssr-cat">${escHtml(label)}</span><span class="ssr-price">${price}</span></span>
      </a>`;
    }).join("");

    const seeAll = all.length
      ? `<a class="site-search-all" href="products.html?cat=all&q=${encodeURIComponent(term)}">${
          _ssTr(`כל ${all.length} התוצאות עבור "${escHtml(term)}"`, `See all ${all.length} results for "${escHtml(term)}"`)} ←</a>`
      : "";

    /* שורת הבורר יושבת תמיד בראש החלונית — גם כשאין תוצאות, כי אז
       דווקא היא הדבר השימושי: "לא מצאתי מוצר, אולי חפש באתר". */
    const scopeBar = scopeBarHtml();

    panel.innerHTML = scopeBar + catRows + itemRows + seeAll;
    bindScope();
    panel.classList.add("show");
  }

  /* ⚠️ החיווט מחדש אחרי כל רינדור: החלונית נכתבת ב-innerHTML ולכן
     המאזינים הישנים נעלמים איתה. */
  function bindScope(){
    panel.querySelectorAll(".ss-scope-btn").forEach(function(b){
      b.addEventListener("mousedown", function(e){
        /* mousedown ולא click: click מגיע אחרי blur של השדה, והחלונית
           כבר נסגרת. preventDefault שומר את הפוקוס בשדה. */
        e.preventDefault();
        searchScope = b.getAttribute("data-scope");
        runSearch();
      });
    });
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

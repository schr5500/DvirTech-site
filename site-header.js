/* =====================================================================
   DvirTech — הדר אחיד לכל האתר (site-header.js)
   =====================================================================
   עד עכשיו כל דף בנה לעצמו את ההדר: לדף הבית היה חיפוש ועגלה, לבונה
   לא היה כלום, ולדף המוצרים היה תפריט "מוצרים" משלו שעבד רק שם. זה
   בדיוק מה שגרם ל"אין סימון עגלה בבונה" ול"התפריט משתנה בין דף לדף".

   הקובץ הזה בונה את *כל* תוכן ה-<header> בכל דף מאותו מקור אחד:
   לוגו → ניווט (עם תפריט "מוצרים") → חיפוש → עגלה → מתג שפה.
   הדף הפעיל מסומן אוטומטית לפי שם הקובץ, בלי לשנות את הסדר.

   נטען אחרי search-core.js (משם dvtGetCatalog / dvtCatLabel) ולפני
   סקריפט הדף עצמו.
===================================================================== */

/* מבנה תפריט "מוצרים". כל קבוצה: כותרת + הקטגוריות שמתחתיה.
   קטגוריה בלי מוצרים נשמטת, וקבוצה שנשארה ריקה לא מוצגת בכלל.

   ארבעה סוגי ערכים נתמכים (ראה shEntry):
     "readyPc"                 — קטגוריה בגיליון, או קטגוריה וירטואלית
     "use:gaming"              — ייעוד של מחשב מוכן   → ?cat=readyPc&useCase=…
     "use:laptop:gaming"       — ייעוד בקטגוריה אחרת  → ?cat=laptop&useCase=…
     "sub:extras:cable"        — תת-סוג לפי subType   → ?cat=extras&subType=…
     "q:readyPc:מיני"          — תת-קבוצה לפי חיפוש   → ?cat=readyPc&q=…
   ⚠️ בכל הצורות: **ערך בלי מוצרים לא מוצג בכלל.** זה לא נוי — תת-קטגוריה
   בתפריט שמובילה לרשימה ריקה נראית כמו אתר שבור. המנגנון יושב ב-shEntry
   (מחזיר null), ואסור לעקוף אותו. */
/* ⚠️ `key` אינו קישוט — הוא הכתובת. כותרת הקבוצה היא **קישור** ל-
   `products.html?cat=g:<key>`, פסאודו-קטגוריה שמאחדת את הקטגוריות
   האמיתיות שמתחת לכותרת (ראו shGroupBaseCats_ כאן ו-buildSellableItems_
   ב-products.js). קודם הכותרת הייתה <div> מת: לקוח שלחץ על "מחשבים"
   ציפה לראות מחשבים וקיבל כלום. שינוי `key` שובר קישורים קיימים. */
const NAV_CATALOG_GROUPS = [
  { key: "computers",  title: ["מחשבים",      "Computers"],
    // ⚠️ תת-קטגוריות ולא מוצרים ספציפיים: הקישור מוביל לרשימה מסוננת
    // (?useCase=gaming), כך שכשיתווספו עוד מחשבי גיימינג הם יופיעו שם
    // מעצמם. קודם זה הצביע ישירות על מוצר בודד.
    // מחשבים ניידים אחרי תת-הקטגוריות ולא באמצען: השורות שמעליו הן
    // פילוח של "מחשבים מוכנים", והנייד הוא קטגוריה עומדת בפני עצמה.
    /* ⚠️ "מחשבים מיני" הוא חיפוש ולא ייעוד: `useCase` בגיליון הוא
       office/gaming/creative/server, ומיני הוא **צורת מוצר** ולא ייעוד.
       ניסיון לדחוף אותו ל-"משרדי" הקפיץ את הכלל ל-63% מהקטגוריה — מעל
       מפסק הביטחון של 17-subtype-fill.gs. חיפוש על "מיני" מחזיר בדיוק
       את אותם מוצרים בלי להמציא ערך בגיליון. */
    cats: ["readyPc", "use:gaming", "use:creative", "use:office", "use:server",
           "q:readyPc:מיני", "laptop", "use:laptop:gaming"] },
  { key: "peripherals", title: ["ציוד היקפי",  "Peripherals"],
    // ⚠️ "רמקולים" הוא subType ולא קטגוריה וירטואלית: אין לו רשומה
    // ב-DVT_VIRTUAL_CATS ולכן אין לו עמוד חנות משלו, אבל 24 מוצרים
    // אמיתיים יושבים מאחוריו. הקישור המסונן נותן להם מדף בלי להוסיף
    // קטגוריה וירטואלית חדשה (זה שינוי ב-search-core.js).
    // "ציוד היקפי" עצמו בסוף — משטחים, מיקרופונים וכיסאות לא נכנסים
    // לאף אחת מהשורות שמעל, ובלי השורה הזו אין אליהם דרך מהתפריט.
    cats: ["monitor", "keyboard", "mouse", "headset", "webcam",
           "sub:peripherals:speakers", "sub:peripherals:mousepad",
           "sub:peripherals:microphone", "sub:peripherals:chair",
           "peripherals"] },
  { key: "components", title: ["רכיבי חומרה", "Components"],
    // מאווררי מארז, רשת אלחוטית ומשחה תרמית באים אחרי המארז — הם
    // נלווים להרכבה ולא רכיב שבוחרים ראשון.
    cats: ["cpu", "gpu", "mobo", "ram", "storage", "cooling", "psu", "case",
           "caseFans", "wifi", "paste"] },
  // אביזרים נלווים (כבלים, מפצלים, דיסקים חיצוניים) אינם רכיב הרכבה
  // ואינם ציוד היקפי, ולכן קבוצה משלהם ולא דחיפה לאחת הקיימות.
  /* ⚠️ שתי השורות הראשונות (דיסקים חיצוניים / זיכרונות ניידים) הן
     הקבוצה הגדולה ביותר באביזרים — 41 מוצרים — אבל הערכים
     `external-drive` / `flash-drive` עדיין **אינם ברשימת הערכים** של
     עמודת subType ב-CAT_DEFS (11-catalog.gs), ולכן 17-subtype-fill.gs
     חוסם את כתיבתם ומדווח עליהם. עד שיתווספו שם, שתי השורות האלה
     פשוט לא מוצגות — בדיוק כמו כל תת-קטגוריה ריקה. ברגע שיתווספו
     והמילוי ירוץ, הן נדלקות מעצמן. */
  { key: "accessories", title: ["אביזרים",     "Accessories"],
    cats: ["extras",
           "sub:extras:external-drive", "sub:extras:flash-drive",
           "sub:extras:case-glass", "sub:extras:adapter",
           "sub:extras:gpu-bracket", "sub:extras:cable", "sub:extras:hub"] }
];

/* הקטגוריות ה**אמיתיות** שמאחורי קבוצה, לפי הערכים שמתחתיה.
   כל ארבע הצורות מצביעות בסופו של דבר על קטגוריה אחת בגיליון:
     "readyPc"           → readyPc
     "use:gaming"        → readyPc   (ברירת המחדל של `use:`)
     "use:laptop:gaming" → laptop
     "sub:extras:cable"  → extras
     "q:readyPc:מיני"    → readyPc
   ⚠️ קטגוריות וירטואליות (monitor/mouse/…) נשארות ברשימה בכוונה ואינן
   מסוננות כאן: dvtVirtualItems מחזיר אותן עם `_realCat` של מקור הנתונים
   (peripherals), ו-buildSellableItems_ מסיר כפילויות לפי `_realCat:id`.
   סינון כאן היה מפיל קבוצה שכולה וירטואלית. */
function shGroupBaseCats_(g){
  const out = [];
  (g.cats || []).forEach(v => {
    const p = String(v).split(":");
    let base;
    if(p[0] === "use")                       base = p.length >= 3 ? p[1] : "readyPc";
    else if(p[0] === "sub" || p[0] === "q")  base = p[1];
    else                                     base = p[0];
    if(base && out.indexOf(base) === -1) out.push(base);
  });
  return out;
}

/* נחשף גלובלית כי products.js נטען *אחרי* הקובץ הזה וצריך לפענח
   `?cat=g:computers`. זו התלות היחידה בין השניים, והיא חד-כיוונית. */
const SH_NAV_GROUPS_BY_KEY = {};
NAV_CATALOG_GROUPS.forEach(g => {
  if(g.key) SH_NAV_GROUPS_BY_KEY[g.key] = { title: g.title, cats: shGroupBaseCats_(g) };
});

/* קישורי הניווט הראשי — זהים בכל דף, באותו סדר תמיד. */
const SITE_NAV_LINKS = [
  /* ⚠️ home.html ולא index.html. בגיטהאב index.html הוא דף ה"בקרוב",
     ולכן קישור "ראשי" שמצביע אליו מעיף את הלקוח מהחנות. */
  { href: "home.html",                         he: "ראשי",         en: "Home" },
  { catalog: true },                            // כאן נכנס תפריט "מוצרים"
  { href: "builder.html",                      he: "בניית מחשב",   en: "PC Builder" },
  { href: "support.html",  he: "שירות ותמיכה", en: "Service & Support" },
  { href: "why-dvirtech.html",                 he: "למה DvirTech?", en: "Why DvirTech?" },
  { href: "contact.html",                      he: "צור קשר",      en: "Contact" }
];

/* תוויות תת-הקטגוריות לפי השדה useCase בגיליון.
   מפתח יכול להיות "<ערך>" (ברירת מחדל: מחשבים מוכנים) או
   "<קטגוריה>:<ערך>" כשהניסוח צריך להיות אחר בקטגוריה אחרת. */
const SH_USE_LABELS = {
  gaming:          ["מחשבי גיימינג",      "Gaming PCs"],
  creative:        ["מחשבי עריכה ויצירה", "Creative PCs"],
  office:          ["מחשבי משרד",         "Office PCs"],
  server:          ["תחנות עבודה ושרתים", "Workstations & Servers"],
  "laptop:gaming": ["ניידי גיימינג",      "Gaming Laptops"]
};

/* תוויות לתת-קבוצה שנבנית מחיפוש (`q:`). המפתח הוא הערך המלא
   כמו שהוא רשום ב-NAV_CATALOG_GROUPS, כדי שלא יהיה ספק למי הוא שייך. */
const SH_QUERY_LABELS = {
  "q:readyPc:מיני": ["מחשבים מיני", "Mini PCs"]
};

/* ---------------------------------------------------------------------
   תוויות של subType — מקור אחד לתפריט ולחנות
   ---------------------------------------------------------------------
   ⚠️ למה כאן ולא ב-products.js: התפריט הזה נבנה **בכל דף באתר**, גם
   בדף הבית וגם בבונה, ו-products.js נטען רק ב-products.html. מפה
   שיושבת שם לא הייתה זמינה לתפריט, והתוצאה הייתה "case-glass" באנגלית
   באמצע תפריט עברי.
   ⚠️ ולמה לא ב-search-core.js, שהוא הבית הטבעי של VALUE_LABELS: הוא
   מחוץ להיקף השינוי הזה. products.js **מזג** את המפה הזו לתוך
   VALUE_LABELS (ראה שם) במקום להחזיק עותק שני שיתפצל עם הזמן.

   ⚠️ הערכים חייבים להיות בדיוק אלה שנכתבים לגיליון — הרשימה המוצהרת
   של העמודה ב-CAT_DEFS (11-catalog.gs) ומה ש-17-subtype-fill.gs כותב. */
const SH_SUBTYPE_LABELS = {
  cable:            { he: "כבלים",                 en: "Cables" },
  /* ⚠️ הניסוח "דופן זכוכית" היה מדויק כשהערך נוצר, אבל בפועל 34 המוצרים
     שמאחוריו הם דפנות זכוכית *וגם* דלתות צד ופאנלים קדמיים אטומים —
     כולם חלקי חילוף לאותו מארז. הערך עצמו (`case-glass`) לא משתנה כי
     הוא מוצהר ב-CAT_DEFS; רק מה שהלקוח קורא. */
  "case-glass":     { he: "דפנות ופאנלים למארז",   en: "Case panels" },
  "gpu-bracket":    { he: "תומכים לכרטיס מסך",     en: "GPU brackets" },
  adapter:          { he: "מתאמים",                en: "Adapters" },
  hub:              { he: "מפצלים",                en: "Hubs" },
  /* ✅ הערכים נוספו ל-CAT_DEFS ב-11-catalog.gs, ולכן שתי השורות האלה
     נדלקות ברגע ש-subtypeFillApply() רץ. עד אז הן פשוט לא מוצגות. */
  "external-drive": { he: "דיסקים חיצוניים",       en: "External drives" },
  "flash-drive":    { he: "זיכרונות ניידים",       en: "Flash drives" },
  speakers:         { he: "רמקולים",               en: "Speakers" },
  mousepad:         { he: "משטחים לעכבר",          en: "Mouse pads" },
  microphone:       { he: "מיקרופונים",            en: "Microphones" },
  chair:            { he: "כיסאות גיימינג",        en: "Gaming chairs" }
};

function shLang(){ return (typeof LANG !== "undefined" ? LANG : "he"); }
function shTr(he, en){ return shLang() === "en" ? en : he; }
function shEsc(s){
  return (typeof escHtml === "function") ? escHtml(s)
    : String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

/* שם הקובץ הנוכחי, לצורך סימון הדף הפעיל. */
function shCurrentPage(){
  const p = location.pathname.split("/").pop();
  return p || "home.html";
}

function buildSiteHeader(){
  const header = document.querySelector("header");
  if(!header || header.dataset.shBuilt) return;

  const bar = header.querySelector(".headbar") || header.firstElementChild;
  if(!bar) return;

  const here = shCurrentPage();
  const navHtml = SITE_NAV_LINKS.map(l => {
    if(l.catalog){
      /* ⚠️ ‎<a> ולא ‎<button>: "מוצרים" עצמו הוא יעד — לחיצה עליו מובילה
         לכל המוצרים באתר, בדיוק כמו "לכל המוצרים" שבתחתית התפריט. קודם
         זה היה כפתור שכל תפקידו לפתוח ולסגור, כך שהפריט הראשי בניווט
         לא הוביל לשום מקום.

         ⚠️ הנגישות לא נפגעת דווקא בגלל שזה קישור: התפריט נפתח ב-CSS גם
         על ‎:hover וגם על ‎:focus-within, ולכן מקלדת שמגיעה לקישור ב-Tab
         פותחת אותו ופשוט ממשיכה לגלול פנימה בקישורים. Enter מנווט לכל
         המוצרים, ‎ArrowDown פותח וקופץ לפריט הראשון, ו-Escape סוגר
         ומחזיר את הפוקוס לקישור (ראו wireCatalogMenu).

         ⚠️ בלי ‎role="menu": התוכן הוא רשימת קישורי ניווט רגילים, ו-
         ‎role="menu" מחייב צאצאי ‎menuitem וניווט בחיצים בלבד — הצהרה
         שלא התקיימה כאן וגרמה לקורא מסך להכריז על מבנה שאינו נכון. */
      return `<div class="navcat" id="navCatalogDrop">
        <a class="navcat-btn" id="navCatalogBtn" href="products.html?cat=all"
           aria-haspopup="true" aria-expanded="false" aria-controls="navCatalogMenu">
          <span>${shEsc(shTr("מוצרים","Products"))}</span>
          <svg class="navcat-chev" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5 6 6.5 11 1.5"/></svg>
        </a>
        <div class="navcat-menu" id="navCatalogMenu"
             aria-label="${shEsc(shTr("קטגוריות מוצרים","Product categories"))}"></div>
      </div>`;
    }
    // products.html מסומן כפעיל דרך תפריט "מוצרים", לא כקישור נפרד
    const active = l.href.split("?")[0] === here ? ' class="active"' : "";
    return `<a href="${l.href}"${active}>${shEsc(shTr(l.he, l.en))}</a>`;
  }).join("");

  bar.innerHTML = `
    <a class="brand" href="home.html" aria-label="DvirTech — ${shEsc(shTr("לדף הבית","Home"))}">
      <img class="brand-logo" src="images/logo-dvirtech-transparent.png" alt="DvirTech">
    </a>

    <nav id="mainNav">${navHtml}</nav>

    <label class="head-search">
      <input id="siteSearch" type="search"
             placeholder="${shEsc(shTr("חיפוש מוצרים…","Search products…"))}"
             data-ph-he="חיפוש מוצרים…" data-ph-en="Search products…">
      <svg class="ui-ic" aria-hidden="true"><use href="#ui-search"/></svg>
    </label>

    <div class="head-acts">
      <button class="head-ic" id="headCartBtn" onclick="openCart&&openCart()"
              aria-label="${shEsc(shTr("עגלה","Cart"))}">
        <svg class="ui-ic" aria-hidden="true"><use href="#ui-cart"/></svg>
        <span class="head-ic-badge" id="headCartCount" style="display:none">0</span>
      </button>
      <!-- אייקון החשבון מוסתר עד שתהיה התחברות אמיתית. להחזרה: להסיר
           את המחלקה head-ic--hidden. -->
      <a class="head-ic head-ic--hidden" href="contact.html" aria-label="${shEsc(shTr("חשבון","Account"))}">
        <svg class="ui-ic" aria-hidden="true"><use href="#ui-user"/></svg>
      </a>
    </div>

    <div class="lang-switch">
      <button class="lang-btn" data-lang="he" onclick="setLang('he')">עברית</button>
      <button class="lang-btn" data-lang="en" onclick="setLang('en')">English</button>
    </div>`;

  // products.html: מסמנים את תפריט המוצרים עצמו כפעיל
  if(here === "products.html" || here === "product.html"){
    const btn = bar.querySelector("#navCatalogBtn");
    if(btn) btn.classList.add("active");
  }

  header.dataset.shBuilt = "1";
  wireCatalogMenu(bar);
  if(typeof initSiteSearch === "function") initSiteSearch();
  // ⚠️ cart.js נטען אחרי הקובץ הזה ומזריק את ה-widget שלו רק ב-initCart.
  // קריאה ל-renderCart לפני כן נופלת על אלמנטים שעוד לא קיימים, ולכן
  // דוחים אותה לסוף התור — אז ה-widget כבר במקום.
  setTimeout(() => { try{ if(typeof renderCart === "function") renderCart(); }catch(e){} }, 0);
}

function wireCatalogMenu(bar){
  const wrap = bar.querySelector("#navCatalogDrop");
  if(!wrap) return;
  const btn = wrap.querySelector(".navcat-btn");
  const menu = wrap.querySelector(".navcat-menu");

  /* ⚠️ אין כאן יותר click שמונע ניווט. הפתיחה עצמה היא CSS בלבד
     (‎.navcat:hover / ‎:focus-within), והמחלקה ‎.open נשארה רק בשביל
     הפתיחה היזומה במקלדת. הסימון ‎aria-expanded מסונכרן מכאן, כי CSS
     לא יכול לעדכן מאפיין ARIA. */
  const setOpen = on => {
    wrap.classList.toggle("open", on);
    if(on) wrap.classList.remove("dismissed");
    btn.setAttribute("aria-expanded", on ? "true" : "false");
  };
  // הצבעה/פוקוס פותחים ב-CSS; כאן רק מיישרים את ה-ARIA למה שנראה בפועל.
  wrap.addEventListener("mouseenter", () => {
    wrap.classList.remove("dismissed");            // הצבעה חדשה מבטלת Escape קודם
    btn.setAttribute("aria-expanded","true");
  });
  wrap.addEventListener("mouseleave", () => { if(!wrap.classList.contains("open")) btn.setAttribute("aria-expanded","false"); });
  wrap.addEventListener("focusin",    () => { if(!wrap.classList.contains("dismissed")) btn.setAttribute("aria-expanded","true"); });
  wrap.addEventListener("focusout", e => {
    if(!wrap.contains(e.relatedTarget)){ setOpen(false); wrap.classList.remove("dismissed"); }
  });

  /* חץ למטה על "מוצרים" = פתיחה בלי לנווט, ואז ישר לפריט הראשון —
     כך שמי שגולש במקלדת מגיע לקטגוריות בלי לעבור דרך כל התפריט. */
  btn.addEventListener("keydown", e => {
    if(e.key === "ArrowDown"){
      e.preventDefault();
      setOpen(true);
      const first = menu && menu.querySelector(".navcat-link");
      if(first) first.focus();
    }
  });
  document.addEventListener("keydown", e => {
    if(e.key !== "Escape") return;
    // Escape מתוך התפריט מחזיר את הפוקוס לקישור, אחרת הוא נופל לתחילת הדף.
    const inside = wrap.contains(document.activeElement);
    setOpen(false);
    if(inside){ wrap.classList.add("dismissed"); btn.focus(); }
  });
  document.addEventListener("click", e => {
    if(!wrap.contains(e.target)){ setOpen(false); wrap.classList.remove("dismissed"); }
  });

  if(typeof dvtGetCatalog === "function"){
    dvtGetCatalog().then(buildCatalogMenu).catch(() => {});
    if(typeof dvtOnCatalogRefresh === "function") dvtOnCatalogRefresh(buildCatalogMenu);
  }
}

/* פריטי המכירה של קטגוריה אמיתית בגיליון. */
function shItems(catalog, cat){
  const g = catalog && catalog[cat];
  return (g && g.items ? g.items : []).filter(dvtIsSellable);
}

/* תווית לערך subType — קודם מ-VALUE_LABELS (ההגדרה המשותפת של האתר,
   כולל mouse/keyboard/monitor שכבר קיימים שם), ואחר כך מהמפה שכאן. */
function shSubLabel(value){
  if(typeof VALUE_LABELS === "object" && VALUE_LABELS.subType && VALUE_LABELS.subType[value]){
    const o = VALUE_LABELS.subType[value];
    return shTr(o.he, o.en);
  }
  const o = SH_SUBTYPE_LABELS[value];
  return o ? shTr(o.he, o.en) : value;
}

/* ספירה + תווית לכל ערך בתפריט. ערך יכול להיות קטגוריה אמיתית,
   קטגוריה וירטואלית (מסכים/מקלדות/…), ייעוד, תת-סוג או חיפוש.

   ⚠️ **החוזה של הפונקציה: אין מוצרים → null → השורה לא מוצגת.** כל ענף
   כאן חייב לשמור עליו. תת-קטגוריה ריקה בתפריט היא הבטחה שהאתר לא
   מקיים, וזה הרבה יותר גרוע מלא להציג אותה בכלל. */
function shEntry(catalog, key){
  if(!catalog) return null;

  /* --- ייעוד: "use:gaming" (מחשבים מוכנים) או "use:laptop:gaming" ---
     מוביל לרשימה מסוננת, לא למוצר בודד. */
  if(key.indexOf("use:") === 0){
    const rest = key.slice(4).split(":");
    const cat  = rest.length > 1 ? rest[0] : "readyPc";
    const use  = (rest.length > 1 ? rest[1] : rest[0]).toLowerCase();
    const items = shItems(catalog, cat)
      .filter(it => String(it.useCase || "").toLowerCase() === use);
    if(!items.length) return null;
    // תווית ספציפית לקטגוריה ("ניידי גיימינג") גוברת על הכללית
    const lab = SH_USE_LABELS[cat + ":" + use] || SH_USE_LABELS[use];
    return { href: `products.html?cat=${encodeURIComponent(cat)}&useCase=${encodeURIComponent(use)}`,
             label: lab ? shTr(lab[0], lab[1]) : use,
             n: items.length };
  }

  /* --- תת-סוג לפי subType: "sub:extras:cable" --- */
  if(key.indexOf("sub:") === 0){
    const parts = key.slice(4).split(":");
    if(parts.length < 2) return null;
    const cat = parts[0], sub = parts.slice(1).join(":");
    const items = shItems(catalog, cat).filter(it => String(it.subType || "") === sub);
    if(!items.length) return null;
    return { href: `products.html?cat=${encodeURIComponent(cat)}&subType=${encodeURIComponent(sub)}`,
             label: shSubLabel(sub), n: items.length };
  }

  /* --- תת-קבוצה לפי חיפוש: "q:readyPc:מיני" ---
     ⚠️ הספירה כאן חייבת להשתמש ב-dvtItemScore בדיוק כמו החנות
     (products.js → itemSearchScore), אחרת המספר בתפריט לא יתאים
     לרשימה שנפתחת — וזה בדיוק סוג הפער שגורם לאתר להיראות שבור. */
  if(key.indexOf("q:") === 0){
    const parts = key.slice(2).split(":");
    if(parts.length < 2) return null;
    const cat = parts[0], term = parts.slice(1).join(":");
    if(typeof dvtItemScore !== "function") return null;
    const label = dvtCatLabel(cat, catalog[cat]);
    const items = shItems(catalog, cat).filter(it => dvtItemScore(it, label, term) > 0);
    if(!items.length) return null;
    const lab = SH_QUERY_LABELS[key];
    return { href: `products.html?cat=${encodeURIComponent(cat)}&q=${encodeURIComponent(term)}`,
             label: lab ? shTr(lab[0], lab[1]) : term,
             n: items.length };
  }

  const n = (typeof dvtIsVirtualCat === "function" && dvtIsVirtualCat(key))
    ? dvtVirtualItems(catalog, key).length
    : shItems(catalog, key).length;
  if(!n) return null;
  return { href: `products.html?cat=${encodeURIComponent(key)}`,
           label: dvtCatLabel(key, catalog[key]), n };
}

function buildCatalogMenu(catalog){
  const drop = document.getElementById("navCatalogMenu");
  if(!drop || !catalog) return;

  const groups = NAV_CATALOG_GROUPS.map(g => ({
    title: g.title,
    key: g.key,
    entries: g.cats.map(c => shEntry(catalog, c)).filter(Boolean)
  })).filter(g => g.entries.length);

  if(!groups.length){ drop.innerHTML = ""; return; }

  const saleCount = (typeof dvtSaleItems === "function") ? dvtSaleItems(catalog).length : 0;

  drop.innerHTML = `
    <div class="navcat-cols">
      ${groups.map(g => `
        <div class="navcat-col">
          ${g.key
            ? `<a class="navcat-h navcat-h--link" href="products.html?cat=g:${encodeURIComponent(g.key)}">${
                 shEsc(shTr(g.title[0], g.title[1]))}<span aria-hidden="true"> ←</span></a>`
            : `<div class="navcat-h">${shEsc(shTr(g.title[0], g.title[1]))}</div>`}
          ${g.entries.map(e => `
            <a class="navcat-link" href="${e.href}">
              <span>${shEsc(e.label)}</span>
              ${e.n !== null ? `<em>${e.n}</em>` : ""}
            </a>`).join("")}
        </div>`).join("")}
    </div>
    <div class="navcat-foot">
      <a class="navcat-all" href="products.html?cat=all">
        ${shEsc(shTr("לכל המוצרים","All products"))} <span aria-hidden="true">←</span>
      </a>
      ${saleCount ? `<a class="navcat-sale" href="products.html?cat=sale">
        ${shEsc(shTr("מבצעים","Deals"))} <em>${saleCount}</em></a>` : ""}
    </div>`;
}

/* =====================================================================
   כפתור וואטסאפ צף — בכל דף באתר
   =====================================================================
   קודם הוא היה כפתור צ׳אט מקומי בעיצוב של דף "צור קשר" בלבד, והוא ישב
   בדיוק מתחת לעגלה הצפה כך שאי אפשר היה ללחוץ עליו. עכשיו: כפתור אחד,
   בכל דף, מעל העגלה — כדי שאפשר יהיה לפנות מכל שלב בגלישה ולא רק מדף
   צור קשר. הסגנון ב-style.css (.wa-fab).

   ⚠️ לא מוצג ב-checkout/pay: שם כל הסחת דעת עולה בהזמנה שלא נסגרת.
   ⚠️ ולא ב-contact.html: הדף *כולו* הוא דרכי יצירת קשר, וכפתור צף
      נוסף שם רק מוסיף עוד וואטסאפ לדף שכבר יש בו שלושה. */
const SITE_WA_NUMBER = "972502000373";
const SITE_WA_HIDDEN_PAGES = ["checkout.html", "pay.html", "thanks.html", "coming-soon.html",
  // ⚠️ support.html — הדף כולו טופס פנייה עם כפתור שליחה משלו,
  // וכפתור וואטסאפ צף לידו הוא שתי קריאות לפעולה שמתחרות זו בזו.
  "contact.html", "support.html"];

function buildWhatsAppFab(){
  if(SITE_WA_HIDDEN_PAGES.indexOf(shCurrentPage()) !== -1) return;
  if(document.querySelector(".wa-fab")) return;

  const msg = shTr("היי דביר, יש לי שאלה", "Hi Dvir, I have a question");
  const a = document.createElement("a");
  a.className = "wa-fab";
  a.href = `https://wa.me/${SITE_WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  a.target = "_blank";
  a.rel = "noopener";
  a.setAttribute("aria-label", shTr("שליחת הודעה בוואטסאפ", "Message us on WhatsApp"));
  a.title = shTr("שליחת הודעה בוואטסאפ", "Message us on WhatsApp");
  a.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.6c.1-.2.2-.3.3-.5 0-.2 0-.4 0-.5 0-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.4 1.3 4.9L2 22l5.3-1.4c1.4.8 3 1.2 4.7 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>`;
  document.body.appendChild(a);
}

/* בונים מוקדם ככל האפשר כדי שסקריפט הדף ימצא הדר מוכן. */
function shBoot(){ buildSiteHeader(); buildWhatsAppFab(); }
if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", shBoot);
} else {
  shBoot();
}

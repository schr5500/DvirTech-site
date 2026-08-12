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
   קטגוריה בלי מוצרים נשמטת, וקבוצה שנשארה ריקה לא מוצגת בכלל. */
const NAV_CATALOG_GROUPS = [
  { title: ["מחשבים",      "Computers"],
    // ⚠️ תת-קטגוריות ולא מוצרים ספציפיים: הקישור מוביל לרשימה מסוננת
    // (?useCase=gaming), כך שכשיתווספו עוד מחשבי גיימינג הם יופיעו שם
    // מעצמם. קודם זה הצביע ישירות על מוצר בודד.
    cats: ["readyPc", "use:gaming", "use:creative", "use:office", "use:server"] },
  { title: ["ציוד היקפי",  "Peripherals"],
    cats: ["monitor", "keyboard", "mouse", "headset", "webcam"] },
  { title: ["רכיבי חומרה", "Components"],
    cats: ["cpu", "gpu", "mobo", "ram", "storage", "cooling", "psu", "case"] }
];

/* קישורי הניווט הראשי — זהים בכל דף, באותו סדר תמיד. */
const SITE_NAV_LINKS = [
  { href: "index.html",                        he: "ראשי",         en: "Home" },
  { catalog: true },                            // כאן נכנס תפריט "מוצרים"
  { href: "builder.html",                      he: "בניית מחשב",   en: "PC Builder" },
  { href: "coming-soon.html?service=support",  he: "שירות ותמיכה", en: "Service & Support" },
  { href: "why-dvirtech.html",                 he: "למה DvirTech?", en: "Why DvirTech?" },
  { href: "contact.html",                      he: "צור קשר",      en: "Contact" }
];

/* תוויות תת-הקטגוריות של מחשבים מוכנים (השדה useCase בגיליון). */
const SH_USE_LABELS = {
  gaming:   ["מחשבי גיימינג",   "Gaming PCs"],
  creative: ["מחשבי עריכה",     "Creative PCs"],
  office:   ["מחשבי משרד",      "Office PCs"],
  server:   ["תחנות עבודה ושרתים", "Workstations & Servers"]
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
  return p || "index.html";
}

function buildSiteHeader(){
  const header = document.querySelector("header");
  if(!header || header.dataset.shBuilt) return;

  const bar = header.querySelector(".headbar") || header.firstElementChild;
  if(!bar) return;

  const here = shCurrentPage();
  const navHtml = SITE_NAV_LINKS.map(l => {
    if(l.catalog){
      return `<div class="navcat" id="navCatalogDrop">
        <button class="navcat-btn" id="navCatalogBtn" aria-haspopup="true" aria-expanded="false">
          <span>${shEsc(shTr("מוצרים","Products"))}</span>
          <svg class="navcat-chev" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5 6 6.5 11 1.5"/></svg>
        </button>
        <div class="navcat-menu" id="navCatalogMenu" role="menu"></div>
      </div>`;
    }
    // products.html מסומן כפעיל דרך תפריט "מוצרים", לא כקישור נפרד
    const active = l.href.split("?")[0] === here ? ' class="active"' : "";
    return `<a href="${l.href}"${active}>${shEsc(shTr(l.he, l.en))}</a>`;
  }).join("");

  bar.innerHTML = `
    <a class="brand" href="index.html" aria-label="DvirTech — ${shEsc(shTr("לדף הבית","Home"))}">
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

  btn.addEventListener("click", e => {
    e.preventDefault();
    const open = wrap.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  document.addEventListener("keydown", e => {
    if(e.key === "Escape"){ wrap.classList.remove("open"); btn.setAttribute("aria-expanded","false"); }
  });
  document.addEventListener("click", e => {
    if(!wrap.contains(e.target)){ wrap.classList.remove("open"); btn.setAttribute("aria-expanded","false"); }
  });

  if(typeof dvtGetCatalog === "function"){
    dvtGetCatalog().then(buildCatalogMenu).catch(() => {});
    if(typeof dvtOnCatalogRefresh === "function") dvtOnCatalogRefresh(buildCatalogMenu);
  }
}

/* ספירה + תווית לכל ערך בתפריט. ערך יכול להיות קטגוריה אמיתית,
   קטגוריה וירטואלית (מסכים/מקלדות/…) או תת-סוג של מחשב מוכן. */
function shEntry(catalog, key){
  // תת-קטגוריה של מחשבים מוכנים לפי ייעוד: "use:gaming" וכו'.
  // מוביל לרשימה מסוננת, לא למוצר בודד.
  if(key.indexOf("use:") === 0){
    const use = key.slice(4);
    const g = catalog.readyPc;
    if(!g) return null;
    const items = (g.items || []).filter(dvtIsSellable)
      .filter(it => String(it.useCase || "").toLowerCase() === use);
    if(!items.length) return null;
    return { href: `products.html?cat=readyPc&useCase=${encodeURIComponent(use)}`,
             label: SH_USE_LABELS[use] ? shTr(SH_USE_LABELS[use][0], SH_USE_LABELS[use][1]) : use,
             n: items.length };
  }
  const n = (typeof dvtIsVirtualCat === "function" && dvtIsVirtualCat(key))
    ? dvtVirtualItems(catalog, key).length
    : ((catalog[key] && catalog[key].items) || []).filter(dvtIsSellable).length;
  if(!n) return null;
  return { href: `products.html?cat=${encodeURIComponent(key)}`,
           label: dvtCatLabel(key, catalog[key]), n };
}

function buildCatalogMenu(catalog){
  const drop = document.getElementById("navCatalogMenu");
  if(!drop || !catalog) return;

  const groups = NAV_CATALOG_GROUPS.map(g => ({
    title: g.title,
    entries: g.cats.map(c => shEntry(catalog, c)).filter(Boolean)
  })).filter(g => g.entries.length);

  if(!groups.length){ drop.innerHTML = ""; return; }

  const saleCount = (typeof dvtSaleItems === "function") ? dvtSaleItems(catalog).length : 0;

  drop.innerHTML = `
    <div class="navcat-cols">
      ${groups.map(g => `
        <div class="navcat-col">
          <div class="navcat-h">${shEsc(shTr(g.title[0], g.title[1]))}</div>
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
const SITE_WA_HIDDEN_PAGES = ["checkout.html", "pay.html", "thanks.html", "coming-soon.html", "contact.html"];

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

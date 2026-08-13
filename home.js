/* =====================================================================
   DvirTech — דף הבית (index.html)
   =====================================================================
   הקובץ נקרא בעבר landing.js. השם הוחלף כי "landing" התבלבל עם דף
   הנחיתה השיווקי שב-LandingPage/ — זה כאן הוא הקוד של דף הבית של החנות.
   -----------------------------------------------------------------
   מה הקובץ הזה עושה:
   1. תרגום — כל טקסט קבוע בדף יושב ב-HTML כ-data-he / data-en, והפונקציה
      applyI18n עוברת עליו. בכוונה לא הוספתי ~40 מפתחות ל-i18n.js: ככה
      הטקסט של דף הבית נשאר גלוי וניתן לעריכה בתוך ה-HTML עצמו, ו-i18n.js
      נשאר שמור למחרוזות שמשותפות לכמה דפים.
   2. קטגוריות ומבצעים — נטענים מאותו getCatalog שמזין את החנות ואת
      הבונה. אין כאן שום מחיר או שם מוצר קשיח: מה שבגיליון הוא מה שמוצג.

   ⚠️ הקטלוג נטען דרך dvtGetCatalog() שב-search-core.js (נטען לפני
   הקובץ הזה), כדי שהדף ותיבת החיפוש בהדר יחלקו בקשה אחת במקום שתיים.
===================================================================== */

const WHATSAPP_NUMBER = "972502000373";

/* אותו סדר קטגוריות כמו בחנות: מוצרים שלמים קודם, אחר כך רכיבים.
   קטגוריה חדשה בגיליון תופיע כאן אוטומטית בסוף הרשימה. */
const HOME_CATEGORY_ORDER = [
  "readyPc", "monitor", "peripherals",
  "gpu", "cpu", "mobo", "ram", "storage", "cooling", "psu", "case"
];

let HOME_CATALOG = {};

/* ==================== תרגום ==================== */
function applyI18n(){
  document.querySelectorAll("[data-he]").forEach(el => {
    const v = LANG === "en" ? el.dataset.en : el.dataset.he;
    if(v != null) el.textContent = v;
  });
  document.querySelectorAll("[data-ph-he]").forEach(el => {
    el.placeholder = LANG === "en" ? el.dataset.phEn : el.dataset.phHe;
  });
  const ft = document.getElementById("footerText");
  if(ft) ft.textContent = t("footerText");
  renderFooterLegal();
  document.querySelectorAll(".lang-btn").forEach(b => b.classList.toggle("active", b.dataset.lang === LANG));
}

function setLang(lang){
  if(lang === LANG) return;
  setLangCore(lang);
  applyI18n();
  renderCategories();
  renderDeals();
}

/* ==================== עזרים ==================== */

/* התוויות לתצוגה יושבות ב-search-core.js (DVT_CAT_LABEL) ומשותפות
   לדף הבית, לדף המוצרים ולחיפוש — כך אותה קטגוריה נקראת אותו דבר
   בכל מקום באתר. */
function catLabel(key, group){ return dvtCatLabel(key, group); }
function itemLabel(it){ return (LANG === "en" && it.nameEn) ? it.nameEn : it.name; }

/* תמונת קטגוריה אמיתית, כשיש. גוברת על איור ה-SVG של sprite.js — אותו
   כלל "תמונה אמיתית מנצחת" שחל על כרטיסי מוצר. כרגע יש תמונות רק לחלק
   מהקטגוריות (דביר צילם/ייצר אותן ידנית); "readyPc" מיוצג ע"י תמונת
   מחשב נייח כי אין עדיין תמונה נפרדת למחשבים ניידים בגיליון עצמו —
   "מחשבים ניידים" הם פריטים בתוך אותה קטגוריה, לא קטגוריה נפרדת.
   קטגוריה שלא ברשימה פשוט נופלת חזרה לאיור, בלי צורך בטיפול מיוחד. */
const HOME_CAT_IMAGE = {
  cpu:         "images/categories/cpu.jpg",
  gpu:         "images/categories/gpu.jpg",
  ram:         "images/categories/ram.jpg",
  mobo:        "images/categories/mobo.jpg",
  storage:     "images/categories/storage.jpg",
  psu:         "images/categories/psu.jpg",
  cooling:     "images/categories/cooling.jpg",
  "case":      "images/categories/case.jpg",
  monitor:     "images/categories/monitor.jpg",
  readyPc:     "images/categories/readyPc.jpg",
  peripherals: "images/categories/peripherals.jpg"
};

/* ==================== ממלא מקום לתמונה ====================
   ⚠️ index.html טוען רק את style.css, בלי products.css שבו יושב עיצוב
   ‎.dvt-ph — ולכן הכללים ההכרחיים מוזרקים כאן. זה עותק מצומצם *מכוון*
   של אותו עיצוב, כדי שכרטיס בדף הבית וכרטיס בחנות ייראו זהים; שינוי
   כאן מחייב שינוי מקביל ב-products.css ולהפך. */
/* ⚠️ המידה של האיור נכתבת בסלקטור עמוק במיוחד: הכללים הקיימים
   ‎.cat-card .cat-art svg ו-.deal-art svg ב-style.css ספציפיים יותר
   ממחלקה בודדת, והיו דורסים כל width שנקבע על ‎.dvt-ph-ic לבדו. */
const HOME_PH_CSS = `
.cat-card .cat-art{position:relative}
.deal-art{position:relative;background:linear-gradient(155deg,#F3F8FF,#EFFBF8)}
.cat-card .cat-art > img,.deal-art > img{position:relative;z-index:1}
.dvt-ph{--ph-fs:10px;position:absolute;inset:0;z-index:0;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:7px;padding:12px;text-align:center;overflow:hidden;
  background:linear-gradient(155deg,#F3F8FF,#EFFBF8)}
.dvt-ph::before{content:"";position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(120% 90% at 22% 0%,rgba(255,255,255,.85),transparent 62%)}
.dvt-ph > *{position:relative}
.dvt-ph-ic{flex:none}
.dvt-ph-brand{font-family:'Rubik',sans-serif;font-weight:700;font-size:var(--ph-fs);
  letter-spacing:.14em;text-transform:uppercase;color:var(--blue,#1B6FE0);
  opacity:.72;line-height:1.3;max-width:100%;overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap}
.deal-art .dvt-ph-ic{width:54px;height:54px}
.cat-card .cat-art .dvt-ph-ic{width:58px;height:58px}
.dvt-art-on .dvt-ph{display:none}`;

function injectPlaceholderCss(){
  if(document.getElementById("homePhCss")) return;
  const st = document.createElement("style");
  st.id = "homePhCss";
  st.textContent = HOME_PH_CSS;
  document.head.appendChild(st);
}

/* ⚠️ התמונה מונחת *מעל* ממלא המקום ולא במקומו. כך הוא נראה כבר בזמן
   הטעינה, onerror על כתובת שבורה מסיר רק את ה-img וחושף אותו בחזרה
   (במקום אייקון תמונה שבורה של הדפדפן), ו-onload מסתיר אותו כשהתמונה
   באמת עלתה כדי שלא יציץ מבעד ל-PNG שקוף. */
const HOME_IMG_HOOKS =
  `loading="lazy" decoding="async"
   onload="this.parentNode.classList.add('dvt-art-on')" onerror="this.remove()"`;

function catArt(cat){
  const src = HOME_CAT_IMAGE[cat];
  // כרטיס *קטגוריה* — ממלא המקום הוא האיור בלבד. אין כאן יצרן ואין דגם,
  // וכל טקסט היה רק חוזר על שם הקטגוריה שמודפס מיד מתחת.
  const ph = `<span class="dvt-ph" aria-hidden="true">
      <svg class="dvt-ph-ic"><use href="#${escHtml(dvtIcon(cat))}"/></svg>
    </span>`;
  return src ? ph + `<img src="${escHtml(src)}" alt="" ${HOME_IMG_HOOKS}>` : ph;
}

/* תמונה לכרטיס *מוצר* (רצועת המבצעים), להבדיל מכרטיס קטגוריה.
   ⚠️ בעבר מוצר בלי תמונה נפל לתמונת הקטגוריה, וזו הייתה טעות: תמונה
   של "כרטיס מסך כלשהו" על כרטיס של דגם מסוים גורמת ללקוח לחשוב שהוא
   ראה את המוצר שהוא קונה. זה בדיוק מה ש-pdArt בדף המוצר סירב לעשות,
   וכאן זה גם עקף את "תמונות להמחשה בלבד" — התווית מוצגת רק כשיש תמונת
   מוצר אמיתית, ולכן תמונות הקטגוריה הוצגו בלי שום הסתייגות.
   עכשיו: תמונת המוצר עצמו, ואם אין — ממלא המקום המעוצב, אותו אחד
   שמוצג בחנות ובדף המוצר. */
function productArt(cat, item){
  const icon = dvtIcon((item && item._realCat) || cat);
  // היצרן בלבד: שם הדגם ממילא מודפס בשורה נפרדת מתחת לתיבה.
  const brand = (item && item.brand)
    ? `<span class="dvt-ph-brand">${escHtml(item.brand)}</span>` : "";
  const ph = `<span class="dvt-ph" aria-hidden="true">
      <svg class="dvt-ph-ic"><use href="#${escHtml(icon)}"/></svg>${brand}
    </span>`;
  return (item && item.image)
    ? ph + `<img src="${escHtml(item.image)}" alt="" ${HOME_IMG_HOOKS}>`
    : ph;
}

// פריטי-דמה ("ללא כרטיס מסך") הם בחירה בבונה ולא מוצר שנמכר.
function homeSellable(cat){
  // "מסכים" היא קטגוריה וירטואלית — אין לה לשונית בגיליון, היא נגזרת
  // מציוד היקפי לפי subType. ראה DVT_VIRTUAL_CATS ב-search-core.js.
  if(dvtIsVirtualCat(cat)) return dvtVirtualItems(HOME_CATALOG, cat);
  const g = HOME_CATALOG[cat];
  if(!g) return [];
  return (g.items || []).filter(dvtIsSellable);
}

function homeCategories(){
  const known = HOME_CATEGORY_ORDER.filter(c => homeSellable(c).length);
  const extra = Object.keys(HOME_CATALOG)
    .filter(c => c !== "services" && HOME_CATEGORY_ORDER.indexOf(c) === -1 && homeSellable(c).length);
  return known.concat(extra);
}

const nis = v => Number(v).toLocaleString("he-IL") + " ₪";

/* ==================== רינדור ==================== */
function renderCategories(){
  const row = document.getElementById("catRow");
  if(!row) return;
  const cats = homeCategories();
  if(!cats.length){ row.innerHTML = ""; return; }

  row.innerHTML = cats.map(cat => `
    <a class="cat-card" href="products.html?cat=${encodeURIComponent(cat)}">
      <div class="cat-art">${catArt(cat)}</div>
      <b>${catLabel(cat, HOME_CATALOG[cat])}</b>
    </a>`).join("");
}

/* "מבצעים חמים": פריט אחד מכל קטגוריה, הזול ביותר בה. זו בחירה מכוונת —
   ככה הרצועה מציגה רוחב של קטלוג ולא שמונה כרטיסי מסך. כשתהיה עמודת
   מבצע אמיתית בגיליון, מחליפים כאן את הסינון בה. */
/* רק מוצרים שבאמת במבצע — כלומר יש להם oldPrice גבוה מהמחיר הנוכחי
   בגיליון. קודם זה הציג פשוט את הזול ביותר מכל קטגוריה, מה שנתן
   "מבצעים" שאינם מבצעים. */
function pickDeals(){
  return dvtSaleItems(HOME_CATALOG).slice(0, 12);
}

function renderDeals(){
  const row = document.getElementById("dealRow");
  if(!row) return;
  const deals = pickDeals();

  // אין מבצעים פעילים בגיליון — המקטע נשאר, עם הודעה קצרה במקום
  // רצועה ריקה. עדיף להסביר מה קורה מאשר שהאזור פשוט ייעלם.
  if(!deals.length){
    row.classList.remove("deal-marquee");
    row.innerHTML = `<div class="deals-none">
      <b>${tr("אין כרגע מוצרים במבצע","No active deals right now")}</b>
      <span>${tr("מבצעים חדשים יופיעו כאן ברגע שיעלו לאתר.",
                 "New deals will appear here as soon as they go live.")}</span>
    </div>`;
    return;
  }

  /* ⚠️ "תמונות להמחשה בלבד" — תנאי של הספק לשימוש בתמונות שלו, ולכן
     לא הערה קוסמטית. מוצג רק אם יש ברצועה תמונת מוצר אמיתית: כשמוצגת
     תמונת קטגוריה בלבד אין תמונת מוצר להסתייג לגביה. */
  const dnote = document.getElementById("dealsImgNote");
  if(dnote){
    const anyImg = deals.some(({it}) => it && it.image);
    dnote.textContent = anyImg
      ? tr("התמונות להמחשה בלבד. המפרט הכתוב הוא המחייב.",
           "Images are for illustration only. The written specification prevails.")
      : "";
  }

  row.innerHTML = deals.map(({cat, it}) => `
    <a class="deal" href="product.html?cat=${encodeURIComponent(it._realCat || cat)}&id=${encodeURIComponent(it.id)}">
      <span class="deal-badge">-${dvtDiscountPct(it)}%</span>
      <div class="deal-art">${productArt(cat, it)}</div>
      <div class="deal-cat">${catLabel(cat, HOME_CATALOG[cat])}</div>
      <div class="deal-name">${itemLabel(it)}</div>
      <div class="deal-foot">
        <span class="deal-price">${nis(it.price)}</span>
        <span class="deal-was">${nis(dvtOldPrice(it))}</span>
      </div>
    </a>`).join("");

  setupDealMarquee(row);
}

/* גלילה מעגלית איטית — רק אם המבצעים באמת לא נכנסים לרוחב המסך.
   כשהם נכנסים אין שום סיבה להזיז אותם, וזה רק היה מפריע ללחוץ.
   העותק השני של הרשימה הוא מה שמאפשר לולאה בלי "קפיצה": האנימציה
   מזיזה בדיוק את רוחב העותק הראשון וחוזרת ל-0. */
function setupDealMarquee(row){
  row.classList.remove("deal-marquee");
  row.style.removeProperty("--marquee-dur");

  // prefers-reduced-motion: משאירים רצועה נגללת ידנית, בלי תנועה מעצמה
  if(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // ⚠️ לא נשענים רק על requestAnimationFrame: בלשונית שברקע (וגם בבדיקות
  // אוטומטיות) הוא לא נורה כלל, והרצועה פשוט לא הייתה מתחילה לזוז.
  // מה שקורה קודם מנצח, והדגל מוודא שהאתחול ירוץ פעם אחת בלבד.
  let started = false;
  const start = () => {
    if(started) return;
    started = true;

    if(row.scrollWidth - row.clientWidth <= 8) return;   // הכל נכנס — לא מזיזים

    const cards = [...row.children];
    const spanWidth = row.scrollWidth;                   // רוחב סט אחד של כרטיסים

    const track = document.createElement("div");
    track.className = "deal-track";
    cards.forEach(c => track.appendChild(c));
    // עותק שני זהה — הוא מה שממלא את החלל בזמן שהראשון יוצא, וכך
    // הלולאה נראית רציפה. aria-hidden כדי שקורא מסך לא יקריא פעמיים.
    cards.forEach(c => {
      const clone = c.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.querySelectorAll("a, button").forEach(el => el.tabIndex = -1);
      if(clone.tagName === "A") clone.tabIndex = -1;
      track.appendChild(clone);
    });

    row.innerHTML = "";
    row.appendChild(track);
    // מהירות קבועה (~26px לשנייה) ולא משך קבוע, כך ש-3 מבצעים ו-30
    // מבצעים זזים באותו קצב נעים במקום שאחד ידהר והשני יזחל.
    row.style.setProperty("--marquee-dur", Math.max(18, Math.round(spanWidth / 26)) + "s");
    row.classList.add("deal-marquee");
  };

  requestAnimationFrame(start);
  setTimeout(start, 250);
}

/* מצב ביניים בזמן טעינה — כדי שהרצועות לא יקפצו מריק למלא */
function renderSkeleton(){
  const sk = n => Array.from({length:n}, () => `
    <div class="cat-card" style="pointer-events:none;opacity:.55">
      <div class="cat-art"></div><b style="display:block;height:12px;background:#EDF2F8;border-radius:6px"></b>
    </div>`).join("");
  const c = document.getElementById("catRow");
  const d = document.getElementById("dealRow");
  if(c) c.innerHTML = sk(7);
  if(d) d.innerHTML = sk(7);
}

function renderLoadError(){
  const msg = tr("לא הצלחנו לטעון את הקטלוג כרגע. אפשר לרענן, או לעבור ישירות לחנות.",
                 "Couldn't load the catalog right now. Refresh, or go straight to the shop.");
  ["catRow","dealRow"].forEach((id, i) => {
    const el = document.getElementById(id);
    if(!el) return;
    el.style.display = "block";
    el.innerHTML = i === 0
      ? `<div class="lock-msg" style="margin:6px 0">${msg} <a href="products.html" style="color:var(--blue);font-weight:700">${tr("לחנות","To the shop")}</a></div>`
      : "";
  });
}

/* ==================== קרוסלה ==================== */
function initCarousels(){
  document.querySelectorAll(".car-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const row = document.getElementById(btn.dataset.car);
      if(!row) return;
      // ב-RTL scrollLeft שלילי, ולכן הכיוון נגזר מ-dir של המסמך ולא מקבוע
      const rtl = document.documentElement.dir === "rtl";
      const dir = btn.classList.contains("car-next") ? 1 : -1;
      row.scrollBy({ left: dir * (rtl ? -1 : 1) * Math.round(row.clientWidth * 0.8), behavior: "smooth" });
    });
  });
}

/* החיפוש עצמו (תפריט נפתח + חיפוש מלא בכל הקטגוריות) עבר ל-site-search.js,
   קובץ משותף שרץ בכל דף עם תיבת #siteSearch — לא רק כאן. */

/* ==================== טעינה ==================== */
async function loadHome(){
  renderSkeleton();
  try{
    HOME_CATALOG = await dvtGetCatalog();
  }catch(e){
    console.error("[home] getCatalog failed:", e);
    renderLoadError();
    return;
  }
  renderCategories();
  renderDeals();

  // אם הקטלוג הוצג מהמטמון והרענון ברקע גילה שינוי (מחיר, מוצר חדש) —
  // מציירים מחדש בשקט, בלי שהמשתמש יחכה.
  dvtOnCatalogRefresh(fresh => {
    HOME_CATALOG = fresh;
    renderCategories();
    renderDeals();
  });
}

injectPlaceholderCss();
applyI18n();
initCarousels();
loadHome();

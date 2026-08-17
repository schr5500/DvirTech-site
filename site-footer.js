/* =====================================================================
   DvirTech — פוטר אחיד לכל האתר (site-footer.js)
   =====================================================================
   ⚠️ **למה הקובץ הזה קיים.** עד 16.08.2026 כל דף בנה לעצמו פוטר ביד,
   והתוצאה נמדדה על 16 הדפים:
     • `catalog.html` — בלי פוטר בכלל
     • `contact.html`, `why-dvirtech.html` — בלי לוגו
     • `why-dvirtech.html` — בלי קישור "אודות"
     • כפתור וואטסאפ — ב-3 דפים מתוך 16
   זו בדיוק הבעיה שההדר סבל ממנה עד ש-`site-header.js` איחד אותו,
   והפתרון זהה: **מקור אחד, כל דף מקבל את אותו דבר.**

   השימוש: הדף מכיל `<footer></footer>` ריק (או שום דבר — אז הוא
   נוצר), והקובץ הזה ממלא אותו. אין מה לתחזק בדפים עצמם.

   ⚠️ **דפי "בקרוב" מוחרגים בכוונה** (`index.html` כשהוא במצב בקרוב,
   `site-coming-soon.html`, `coming-soon.html`): שם אין חנות, ופוטר
   עם קישורים למוצרים היה מוביל לדפים שהמבקר לא אמור לראות עדיין.
   ⚠️ `checkout.html` ו-`pay.html` מקבלים פוטר **מצומצם** — בשלב
   התשלום כל קישור שמוציא מהדף הוא נטישה. שם נשארים רק תקנון ויצירת
   קשר, שהם בדיוק מה שלקוח מהסס צריך.

   נטען אחרי `site-header.js`, ומשתמש באותם עזרים (shTr/shEsc) כשהם
   קיימים — עם נפילה עצמאית אם לא, כדי שדף בודד לא יישבר.
===================================================================== */

const SF_WA_NUMBER = "972502000373";

/* עזרים עצמאיים — הפוטר לא אמור להישבר אם site-header.js לא נטען. */
function sfTr(he, en){
  if (typeof shTr === "function") return shTr(he, en);
  return (typeof LANG !== "undefined" && LANG === "en") ? en : he;
}
function sfEsc(s){
  if (typeof shEsc === "function") return shEsc(s);
  return String(s == null ? "" : s)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

/* ---------------------------------------------------------------------
   מבנה הפוטר — מקור אחד
   ---------------------------------------------------------------------
   ⚠️ כל קישור כאן חייב להצביע על דף שקיים. `check_links.py` סורק את
   הקובץ הזה, וקישור שבור כאן שובר אותו ב-**כל** דף באתר בבת אחת —
   זה היתרון של מקור אחד וגם הסיכון שלו. */
const SF_COLUMNS = [
  { title: ["החנות", "Shop"], links: [
      ["products.html?cat=readyPc",     "מחשבים מוכנים", "Ready-Made PCs"],
      ["products.html?cat=laptop",      "מחשבים ניידים", "Laptops"],
      ["products.html?cat=g:components","רכיבי חומרה",   "Components"],
      ["products.html?cat=g:peripherals","ציוד היקפי",   "Peripherals"],
      ["builder.html",                  "בונה המחשבים",  "PC Builder"]
  ]},
  { title: ["שירות", "Service"], links: [
      /* ⚠️ הניסוחים כאן תואמים למה שבאמת נמכר. "התקנה עד הבית" הוסר
         מדף הבית כי אי אפשר להתחייב עליה מראש — אסור שהיא תחזור כאן
         דרך הדלת האחורית. */
      ["support.html",       "תיקון ושדרוג",      "Repair & upgrade"],
      ["support.html#care",  "DvirTech Care",     "DvirTech Care"],
      ["support.html",       "אבחון תקלה",        "Fault diagnosis"],
      ["contact.html",       "ייעוץ לפני קנייה",  "Pre-purchase advice"]
  ]},
  { title: ["מידע", "Info"], links: [
      ["why-dvirtech.html", "למה DvirTech?", "Why DvirTech?"],
      ["about.html",        "אודות",         "About"],
      ["contact.html",      "צור קשר",       "Contact"],
      ["terms.html",        "תקנון",         "Terms"]
  ]}
];

/* דפים שלא מקבלים פוטר בכלל, ודפים שמקבלים גרסה מצומצמת. */
const SF_SKIP_PAGES    = ["site-coming-soon.html", "coming-soon.html"];
const SF_MINIMAL_PAGES = ["checkout.html", "pay.html"];

function sfPageName(){
  const p = location.pathname.split("/").pop();
  return p || "index.html";
}

/* ⚠️ index.html הוא **עותק** של דף הבקרוב או של דף הבית (ראה LAUNCH.md).
   אי אפשר להסתמך על שמו — בודקים מה באמת יש בדף. */
function sfIsComingSoon(){
  const t = (document.title || "") + " " + (document.body ? document.body.className : "");
  return /בקרוב|coming\s*soon/i.test(t) || !!document.querySelector(".coming-soon, #comingSoon");
}

function sfYear(){ return new Date().getFullYear(); }

function sfLinksHtml(col){
  return col.links.map(function(l){
    return '<li><a href="' + l[0] + '">' + sfEsc(sfTr(l[1], l[2])) + "</a></li>";
  }).join("");
}

function sfBuildHtml(minimal){
  const legal =
    '<div class="footer-legal">' +
      '<a href="about.html">'   + sfEsc(sfTr("אודות","About"))   + "</a>" +
      '<a href="contact.html">' + sfEsc(sfTr("צור קשר","Contact")) + "</a>" +
      '<a href="terms.html">'   + sfEsc(sfTr("תקנון","Terms"))   + "</a>" +
      '<a href="privacy.html">' + sfEsc(sfTr("פרטיות","Privacy")) + "</a>" +
    "</div>";

  /* ⚠️ עוסק פטור — מספר העוסק מוצג בפוטר בכוונה. זו דרישת שקיפות
     בסיסית מול הלקוח, והיא גם מה שמבדיל אתר אמיתי מאתר חשוד. */
  const legalLine =
    '<p class="footer-legal-line">' +
      sfEsc(sfTr("דביר פרץ · עוסק פטור 322999582 · אבן שמואל",
                 "Dvir Peretz · Exempt dealer 322999582 · Even Shmuel")) +
    "</p>";

  const copy =
    '<span class="footer-copy">© ' + sfYear() + " DvirTech · " +
      sfEsc(sfTr("כל הזכויות שמורות","All rights reserved")) + "</span>";

  if (minimal){
    /* בשלב התשלום: בלי ניווט לחנות, רק מה שמרגיע מהסס. */
    return '<div class="wrap footer-min">' + legalLine + legal + copy + "</div>";
  }

  const brand =
    "<div>" +
      '<span class="footer-logo-crop">' +
        '<img class="footer-logo" src="images/logo-dvirtech-transparent.png" alt="DvirTech">' +
      "</span>" +
      "<p>" + sfEsc(sfTr(
        "שירותי מחשוב ותמיכה טכנית. מחשבים בהתאמה אישית, תיקון, שדרוג והרכבה — עם מחיר כתוב מראש.",
        "Computing services and technical support. Custom PCs, repair, upgrades and assembly — with the price stated up front.")) +
      "</p>" +
      '<a class="footer-wa" href="https://wa.me/' + SF_WA_NUMBER + '" target="_blank" rel="noopener">' +
        sfEsc(sfTr("וואטסאפ 050-200-0373","WhatsApp 050-200-0373")) +
      "</a>" +
    "</div>";

  const cols = SF_COLUMNS.map(function(c){
    return "<div><h4>" + sfEsc(sfTr(c.title[0], c.title[1])) + "</h4><ul>" +
           sfLinksHtml(c) + "</ul></div>";
  }).join("");

  return '<div class="wrap">' +
           '<div class="footer-grid">' + brand + cols + "</div>" +
           legalLine + legal + copy +
         "</div>";
}

function sfRender(){
  if (SF_SKIP_PAGES.indexOf(sfPageName()) > -1) return;
  if (sfIsComingSoon()) return;

  let el = document.querySelector("footer");
  if (!el){
    el = document.createElement("footer");
    document.body.appendChild(el);
  }
  /* ⚠️ `footer-top-gap` נשמר: הריווח מגיע ממנו ולא מ-style inline, כי
     margin-top inline גובר על margin-top:auto של הפוטר הדביק והשאיר
     רווח מתחתיו במסך גבוה. */
  el.className = "footer-top-gap";
  el.innerHTML = sfBuildHtml(SF_MINIMAL_PAGES.indexOf(sfPageName()) > -1);

  /* טקסטים שנשענים על site-content.js (אם נטען) מוחלים גם כאן. */
  if (typeof dvtApplyContent === "function") dvtApplyContent(el);
}

/* ⚠️ **הפוטר חייב להיבנות מחדש בהחלפת שפה — הוא לא משתמש ב-data-he/en.**
   הטקסטים נכנסים כאן כמחרוזות מוכנות (`sfTr`), ולכן `applyI18n` של
   הדף לא נוגע בהם: מי שהחליף לאנגלית קיבל אתר אנגלי עם פוטר עברי.

   ⚠️ **מאזינים לשינוי ב-`lang` של האלמנט השורשי ולא ל-`setLang`.**
   `setLang` מוגדר בנפרד בכל דף (ובכמה דפים הוא בכלל לא היה מוגדר),
   ולכן קריאה לו הייתה שוברת את הפוטר בדיוק בדפים שכבר שבורים.
   המאזין כאן עובד **בלי שאף דף יצטרך לדעת עליו** — כל דרך שמשנה
   שפה משנה גם את `lang`, וזה כל מה שצריך. */
function sfWatchLang(){
  try{
    const root = document.documentElement;
    let last = root.lang;
    new MutationObserver(function(){
      if (root.lang !== last){ last = root.lang; sfRender(); }
    }).observe(root, { attributes: true, attributeFilter: ["lang"] });
  }catch(e){ /* דפדפן ישן — הפוטר פשוט לא יתחלף, לא נשבר */ }
}

if (document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", function(){ sfRender(); sfWatchLang(); });
} else {
  sfRender();
  sfWatchLang();
}

const COPY = {
  he: {
    badge:"בפיתוח פעיל", main:"האתר החדש שלנו", highlight:"בדרך אליכם",
    body:"אנחנו בונים גרסה חדשה ומקצועית לאתר DvirTech — הרכבת מחשבים בהתאמה אישית, תמיכה טכנית ושירות לקוחות, הכול במקום אחד. השקה בקרוב.",
    wa:"דברו איתנו בוואטסאפ", mail:"שלחו לנו מייל",
    footer:"DvirTech © 2026 — שירותי מחשוב ותמיכה טכנית."
  },
  en: {
    badge:"In active development", main:"Our new website", highlight:"is on its way",
    body:"We're building a new, professional version of the DvirTech site — custom PC builds, technical support, and customer service, all in one place. Launching soon.",
    wa:"Chat with us on WhatsApp", mail:"Send us an email",
    footer:"DvirTech © 2026 — Computer services and technical support."
  }
};
let LANG = "he";
try { LANG = localStorage.getItem("dvirtech_lang") || "he"; } catch(e) {}

/* 🔴 דף הבית זרק TypeError בכל טעינה. `footerText` הוסר מה-HTML
   כשהפוטר עבר לרכיב המשותף (site-footer.js), אבל השורה שכתבה אליו
   נשארה כאן — ו-render() נפל עליה.

   ⚠️ החומרה לא בשגיאה עצמה אלא במה שהיא **מנעה**: היא ישבה לפני שלוש
   השורות האחרונות, ולכן `dir="rtl"`, `lang`, וסימון כפתור השפה הפעיל
   פשוט לא רצו אף פעם. גם מעבר לאנגלית החליף טקסט בלי להחליף כיוון.

   ⚠️ עכשיו כל כתיבה עוברת דרך csSet, כך שאלמנט שיוסר מה-HTML בעתיד
   ידלג בשקט במקום להפיל את שאר הפונקציה. */
function csSet(id, prop, val){
  const el = document.getElementById(id);
  if(el) el[prop] = val;
}

function render(){
  const c = COPY[LANG];
  csSet("badgeText",      "textContent", c.badge);
  csSet("titleMain",      "textContent", c.main);
  csSet("titleHighlight", "textContent", c.highlight);
  csSet("bodyText",       "textContent", c.body);
  csSet("waBtn",          "textContent", c.wa);
  csSet("waBtn", "href", "https://wa.me/972502000373?text=" + encodeURIComponent(LANG === "he" ? "היי דביר, ראיתי שהאתר בדרך :)" : "Hi Dvir, saw the new site is coming soon :)"));
  csSet("mailBtn",        "textContent", c.mail);
  // הפוטר מגיע מ-site-footer.js ומתרגם את עצמו — אין כאן מה לכתוב
  document.querySelectorAll(".lang-btn").forEach(b => b.classList.toggle("active", b.dataset.lang === LANG));
  document.documentElement.lang = LANG;
  document.documentElement.dir = LANG === "he" ? "rtl" : "ltr";
}
function setLang(l){ LANG = l; try { localStorage.setItem("dvirtech_lang", l); } catch(e) {} render(); }
render();

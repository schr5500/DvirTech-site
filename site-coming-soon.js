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

function render(){
  const c = COPY[LANG];
  document.getElementById("badgeText").textContent = c.badge;
  document.getElementById("titleMain").textContent = c.main;
  document.getElementById("titleHighlight").textContent = c.highlight;
  document.getElementById("bodyText").textContent = c.body;
  document.getElementById("waBtn").textContent = c.wa;
  document.getElementById("waBtn").href = "https://wa.me/972502000373?text=" + encodeURIComponent(LANG === "he" ? "היי דביר, ראיתי שהאתר בדרך :)" : "Hi Dvir, saw the new site is coming soon :)");
  document.getElementById("mailBtn").textContent = c.mail;
  document.getElementById("footerText").textContent = c.footer;
  document.querySelectorAll(".lang-btn").forEach(b => b.classList.toggle("active", b.dataset.lang === LANG));
  document.documentElement.lang = LANG;
  document.documentElement.dir = LANG === "he" ? "rtl" : "ltr";
}
function setLang(l){ LANG = l; try { localStorage.setItem("dvirtech_lang", l); } catch(e) {} render(); }
render();

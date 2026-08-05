/* =====================================================================
   DvirTech — עמוד צור קשר (contact.html)
   =====================================================================
   שתי דרכי התקשרות אמיתיות: טלפון/וואטסאפ + אימייל (עומד בדרישת "לפחות
   שתי דרכי תקשורת" של חברת הסליקה). כולל גם כפתור "ביטול עסקה" נפרד וברור
   (נדרש מ-1 בינואר 2026 בתקנות הגנת הצרכן) שפותח הודעת וואטסאפ מוכנה מראש.
===================================================================== */

const CONTACT_WHATSAPP_NUMBER = "972502000373";
const CONTACT_EMAIL = "schr5500@gmail.com";

function renderContactPage(){
  document.getElementById("navReady").textContent = t("navReady");
  document.getElementById("navBuilder").textContent = t("navBuilder");
  document.getElementById("navPeripherals").textContent = t("navPeripherals");
  document.getElementById("navLab").textContent = t("navLab");
  document.getElementById("navContact").textContent = t("navContact");

  document.getElementById("pageTitle").textContent = t("contactTitle");
  document.getElementById("pageSubtitle").textContent = t("contactSubtitle");

  document.getElementById("phoneLabel").textContent = t("contactPhoneLabel");
  document.getElementById("emailLabel").textContent = t("contactEmailLabel");

  const generalMsg = tr("היי דביר, יש לי שאלה כללית", "Hi Dvir, I have a general question");
  document.getElementById("whatsappBtn").href = `https://wa.me/${CONTACT_WHATSAPP_NUMBER}?text=${encodeURIComponent(generalMsg)}`;
  document.getElementById("whatsappBtn").textContent = t("contactWhatsappBtn");
  document.getElementById("callBtn").textContent = t("contactCallBtn");

  document.getElementById("emailBtn").href = `mailto:${CONTACT_EMAIL}`;
  document.getElementById("emailBtn").textContent = t("contactEmailBtn");

  document.getElementById("hoursLabel").textContent = t("contactHoursLabel");
  document.getElementById("hoursText").textContent = t("contactHoursText");
  document.getElementById("areaLabel").textContent = t("contactAreaLabel");
  document.getElementById("areaText").textContent = t("contactAreaText");

  document.getElementById("cancelTitle").textContent = t("contactCancelTitle");
  document.getElementById("cancelText").textContent = t("contactCancelText");
  const cancelMsg = tr(
    "היי דביר, אני מעוניין/ת בביטול עסקה. פרטי ההזמנה: [תאריך ההזמנה / מה הוזמן]",
    "Hi Dvir, I'd like to cancel an order. Order details: [order date / what was ordered]"
  );
  document.getElementById("cancelBtn").href = `https://wa.me/${CONTACT_WHATSAPP_NUMBER}?text=${encodeURIComponent(cancelMsg)}`;
  document.getElementById("cancelBtn").textContent = t("contactCancelBtn");

  document.getElementById("footerText").textContent = t("footerText");
  renderFooterLegal();
  document.querySelectorAll(".lang-btn").forEach(b => b.classList.toggle("active", b.dataset.lang === LANG));
}

function setLang(lang){
  if(lang === LANG) return;
  setLangCore(lang);
  renderContactPage();
}

renderContactPage();

/* =====================================================================
   DvirTech — עמוד אודות (about.html)
   =====================================================================
   טקסטים כבר מוגדרים ב-i18n.js (UI_TEXT.he/en) כי אין כאן שום דבר דינמי —
   הקובץ הזה רק מרנדר אותם לתוך ה-HTML ומטפל בהחלפת שפה.
===================================================================== */

function renderAboutPage(){
  document.getElementById("navReady").textContent = t("navReady");
  document.getElementById("navBuilder").textContent = t("navBuilder");
  document.getElementById("navPeripherals").textContent = t("navPeripherals");
  document.getElementById("navLab").textContent = t("navLab");
  document.getElementById("navContact").textContent = t("navContact");

  document.getElementById("pageTitle").textContent = t("aboutTitle");
  document.getElementById("introText").textContent = t("aboutIntro");
  document.getElementById("quoteText").textContent = t("aboutQuote");
  document.getElementById("quoteAttr").textContent = t("aboutQuoteAttr");

  document.getElementById("howTitle").textContent = t("aboutHowTitle");
  document.getElementById("howText").textContent = t("aboutHowText");

  document.getElementById("servicesTitle").textContent = t("aboutServicesTitle");
  document.getElementById("servicesList").innerHTML = t("aboutServicesList").map(li => `<li>${li}</li>`).join("");

  document.getElementById("areaTitle").textContent = t("aboutAreaTitle");
  document.getElementById("areaText").textContent = t("aboutAreaText");

  document.getElementById("legalTitle").textContent = t("aboutLegalTitle");
  document.getElementById("legalText").textContent = t("aboutLegalText");

  document.getElementById("footerText").textContent = t("footerText");
  renderFooterLegal();
  document.querySelectorAll(".lang-btn").forEach(b => b.classList.toggle("active", b.dataset.lang === LANG));
}

function setLang(lang){
  if(lang === LANG) return;
  setLangCore(lang);
  renderAboutPage();
}

renderAboutPage();

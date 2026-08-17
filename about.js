/* =====================================================================
   DvirTech — עמוד אודות (about.html)
   =====================================================================
   טקסטים כבר מוגדרים ב-i18n.js (UI_TEXT.he/en) כי אין כאן שום דבר דינמי —
   הקובץ הזה רק מרנדר אותם לתוך ה-HTML ומטפל בהחלפת שפה.
===================================================================== */

function renderAboutPage(){
  { const _e=document.getElementById("navHome"); if(_e) _e.textContent = t("navHome"); }
  { const _e=document.getElementById("navReady"); if(_e) _e.textContent = t("navReady"); }
  { const _e=document.getElementById("navPeripherals"); if(_e) _e.textContent = t("navPeripherals"); }
  { const _e=document.getElementById("navComponents"); if(_e) _e.textContent = t("navComponents"); }
  { const _e=document.getElementById("navBuilder"); if(_e) _e.textContent = t("navBuilder"); }
  { const _e=document.getElementById("navLab"); if(_e) _e.textContent = t("navLab"); }
  { const _e=document.getElementById("navWhy"); if(_e) _e.textContent = t("navWhy"); }
  { const _e=document.getElementById("navContact"); if(_e) _e.textContent = t("navContact"); }

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

/* ⚠️ מוגן ב-if: הפוטר הידני הוחלף ב-site-footer.js (16.08.2026)
     ו-#footerText כבר לא קיים — הגישה הישירה קרסה כאן על כל טעינה
     והפילה את המשך הפונקציה (כולל סימון כפתור השפה). */
  const ft = document.getElementById("footerText");
  if(ft) ft.textContent = t("footerText");
  renderFooterLegal();
  document.querySelectorAll(".lang-btn").forEach(b => b.classList.toggle("active", b.dataset.lang === LANG));
}

function setLang(lang){
  if(lang === LANG) return;
  setLangCore(lang);
  renderAboutPage();
}

renderAboutPage();

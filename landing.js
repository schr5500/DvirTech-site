/* =====================================================================
   DvirTech — עמוד הבית (index.html): בחירת שירות, עם החלפת שפה קבועה בהדר
===================================================================== */

const WHATSAPP_NUMBER = "972502000373";

function renderServiceScreen(){
  document.getElementById("serviceHeading").textContent = t("landingServiceHeading");
  document.getElementById("serviceSub").textContent = t("landingServiceSub");
  document.getElementById("titleBuilder").textContent = t("serviceBuilderTitle");
  document.getElementById("descBuilder").textContent = t("serviceBuilderDesc");
  document.getElementById("titleCatalog").textContent = t("serviceCatalogTitle");
  document.getElementById("descCatalog").textContent = t("serviceCatalogDesc");
  document.getElementById("titleSupport").textContent = t("serviceSupportTitle");
  document.getElementById("descSupport").textContent = t("serviceSupportDesc");
  document.getElementById("titleContact").textContent = t("serviceContactTitle");
  document.getElementById("descContact").textContent = t("serviceContactDesc");
  document.getElementById("footerText").textContent = t("footerText");
  renderFooterLegal();
  document.querySelectorAll(".lang-btn").forEach(b => b.classList.toggle("active", b.dataset.lang === LANG));
}

function setLang(lang){
  if(lang === LANG) return;
  setLangCore(lang);
  renderServiceScreen();
}

function goToService(service){
  if(service === "builder"){ window.location.href = "builder.html"; return; }
  if(service === "catalog"){ window.location.href = "catalog.html"; return; }
  if(service === "contact"){ window.location.href = "contact.html"; return; }
  window.location.href = `coming-soon.html?service=${service}`;
}

renderServiceScreen();

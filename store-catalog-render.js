/* =====================================================================
   DvirTech — רינדור עמוד הקטלוג (catalog.html)
   =====================================================================
   קובץ נפרד מ-catalog.js של הבונה (אין קונפליקט שמות בגלל שזה דף אחר
   עם תגי <script> משלו). תלוי ב-STORE_PRODUCTS מתוך store-products.js
   וב-cart.js לפעולת ההוספה לעגלה.
===================================================================== */

const WHATSAPP_NUMBER_CATALOG = "972502000373";

function renderCatalogStaticText(){
  document.getElementById("navReady").textContent = t("navReady");
  document.getElementById("navBuilder").textContent = t("navBuilder");
  document.getElementById("navPeripherals").textContent = t("navPeripherals");
  document.getElementById("navLab").textContent = t("navLab");
  document.getElementById("navContact").textContent = t("navContact");
  document.getElementById("catalogTitle").textContent = t("catalogTitle");
  document.getElementById("catalogSubtitle").textContent = t("catalogSubtitle");
  document.getElementById("footerText").textContent = t("footerText");
  renderFooterLegal();
  document.querySelectorAll(".lang-btn").forEach(b => b.classList.toggle("active", b.dataset.lang === LANG));
}

function renderProductGrid(){
  const grid = document.getElementById("catalogGrid");
  grid.innerHTML = STORE_PRODUCTS.map(p => `
    <div class="product-card">
      <div class="product-icon" style="font-size:56px">${p.icon}</div>
      <h4>${LANG==="en" ? p.nameEn : p.name}</h4>
      <p>${LANG==="en" ? p.descEn : p.desc}</p>
      <div class="price">${p.price.toLocaleString()} ₪</div>
      <button class="btn btn-primary" onclick="addProductToCart('${p.id}')">${t("addToCartBtn")}</button>
    </div>`).join("");
}

function addProductToCart(productId){
  const p = STORE_PRODUCTS.find(x => x.id === productId);
  if(!p) return;
  addToCart({ type:"product", sku: p.id, name: LANG==="en" ? p.nameEn : p.name, price: p.price, qty: 1 });
}

function setLang(lang){
  if(lang === LANG) return;
  setLangCore(lang);
  renderCatalogStaticText();
  renderProductGrid();
}

renderCatalogStaticText();
renderProductGrid();

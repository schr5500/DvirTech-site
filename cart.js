/* =====================================================================
   DvirTech — עגלת קניות משותפת (לכל דפי האתר)
   =====================================================================
   קובץ עצמאי לגמרי: לא נוגע ב-app.js / catalog.js / landing.js הקיימים.
   בונה את כל ה-UI של העגלה בקוד (בלי לגעת ב-HTML של כל דף), ומצרף אותו
   לגוף העמוד עם injectCartWidget() בסוף הקובץ.

   שלב זה בכוונה **לא** שולח שום דבר לשום מקום (לא לגיליון, לא ל-WhatsApp) —
   "מעבר לתשלום" מנווט לדף checkout.html (עמוד אמיתי, לא חלון קופץ) שמציג
   סיכום + פרטי לקוח, בלי שליחה אמיתית. נחבר את זה בהמשך, בשלב נפרד.

   דורש: i18n.js (בשביל t()/tr()/LANG) שכבר נטען בכל דף באתר.
===================================================================== */

const CART_STORAGE_KEY = "dvirtech_cart_items_v1";

/* ================= state + persistence ================= */
let cartItems = [];

function loadCartItems(){
  try{
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    cartItems = raw ? JSON.parse(raw) : [];
  }catch(e){ cartItems = []; }
}
function saveCartItems(){
  try{ localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems)); }catch(e){ /* storage unavailable */ }
}

/* ================= public API ================= */
// item: { type:'product'|'build'|'service', name, price, qty, note? }
function addToCart(item){
  // מוצרים מהקטלוג עם אותו שם מצטברים בכמות; הרכבות בהתאמה אישית תמיד שורה נפרדת
  // (כל הרכבה שונה מהקודמת, גם אם המחיר יוצא זהה במקרה).
  if(item.type === "product"){
    const existing = cartItems.find(i => i.type === "product" && i.name === item.name);
    if(existing){ existing.qty += item.qty || 1; saveCartItems(); renderCart(); openCart(); return; }
  }
  cartItems.push(Object.assign({ id: "c" + Date.now() + Math.random().toString(36).slice(2,7), qty: 1 }, item));
  saveCartItems();
  renderCart();
  openCart();
}
function removeFromCart(id){ cartItems = cartItems.filter(i => i.id !== id); saveCartItems(); renderCart(); }
function changeCartQty(id, delta){
  const it = cartItems.find(i => i.id === id);
  if(!it) return;
  it.qty = Math.max(1, it.qty + delta);
  saveCartItems(); renderCart();
}
function cartTotal(){ return cartItems.reduce((s,i)=> s + i.price*i.qty, 0); }
function cartCount(){ return cartItems.reduce((s,i)=> s + i.qty, 0); }

// עוזר להוספת "הרכבה בהתאמה אישית" מתוך builder.html: מקבל את רשימת הרכיבים
// שנבחרו + הסה"כ (לתצוגה בלבד) + parts (רשימת {sku,qty} לכל רכיב, בדיוק
// לפי selections ב-app.js) — parts הוא מה שבאמת נשלח לתמחור בצד שרת
// בזמן checkout, ה-name/price כאן הם רק לתצוגה מיידית בעגלה עצמה.
// מוסיף שורת הרכבה אחת + שורת "הרכבה (כשקונים חלקים ממני)" ב-0 ₪
// (בדיוק לפי המחירון: קונים חלקים ממני = הרכבה חינם).
function addBuildToCart(buildLines, buildTotal, parts){
  const desc = buildLines.map(l => `${l.label}: ${l.name}${l.qty>1?` ×${l.qty}`:""}`).join(", ");
  addToCartSilently({ type:"build", name: tr("הרכבה בהתאמה אישית","Custom PC Build"), price: buildTotal, qty:1, note: desc, parts: parts || [] });
  addToCartSilently({ type:"service", sku:"assembly-included", name: tr("הרכבה (כשקונים חלקים ממני)","Assembly (when buying parts from me)"), price:0, qty:1 });
  saveCartItems(); renderCart(); openCart();
}
function addToCartSilently(item){
  cartItems.push(Object.assign({ id: "c" + Date.now() + Math.random().toString(36).slice(2,7), qty: 1 }, item));
}

/* ================= widget markup (injected once per page) ================= */
function injectCartWidget(){
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <button class="cart-fab" id="cartFab" onclick="openCart()" aria-label="cart">
      🛒 <span class="cart-fab-badge" id="cartFabBadge" style="display:none">0</span>
    </button>

    <div class="cart-overlay" id="cartOverlay" onclick="if(event.target===this) closeCart()">
      <div class="cart-panel">
        <div class="cart-panel-head">
          <h3 id="cartTitle"></h3>
          <button class="checkout-close" onclick="closeCart()" aria-label="close">✕</button>
        </div>

        <div id="cartEmptyMsg" class="cart-empty"></div>
        <ul class="cart-items" id="cartItemsList"></ul>

        <div class="checkout-total-row" id="cartTotalRow" style="display:none">
          <span id="cartTotalLabel"></span>
          <span id="cartTotalPrice">0 ₪</span>
        </div>

        <button class="btn btn-accent" id="cartCheckoutBtn" style="display:none" onclick="location.href='checkout.html'"></button>
        <button class="btn btn-secondary" id="cartContinueBtn" onclick="closeCart()"></button>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);
}

/* ================= render ================= */
function renderCart(){
  const badge = document.getElementById("cartFabBadge");
  const count = cartCount();
  badge.style.display = count ? "flex" : "none";
  badge.textContent = count;

  const list = document.getElementById("cartItemsList");
  const emptyMsg = document.getElementById("cartEmptyMsg");
  const totalRow = document.getElementById("cartTotalRow");
  const checkoutBtn = document.getElementById("cartCheckoutBtn");

  if(!cartItems.length){
    list.innerHTML = "";
    emptyMsg.style.display = "block";
    totalRow.style.display = "none";
    checkoutBtn.style.display = "none";
    return;
  }
  emptyMsg.style.display = "none";
  totalRow.style.display = "flex";
  checkoutBtn.style.display = "block";

  list.innerHTML = cartItems.map(i => `
    <li class="cart-item">
      <div class="cart-item-main">
        <div class="cart-item-name">${i.name}</div>
        ${i.note ? `<div class="cart-item-note">${i.note}</div>` : ""}
        <div class="cart-item-price">${i.price === 0 ? t("included") : i.price.toLocaleString()+" ₪"}</div>
      </div>
      <div class="cart-item-ctrl">
        ${i.type === "product" ? `
          <span class="qty-ctrl">
            <button onclick="changeCartQty('${i.id}',-1)" ${i.qty<=1?"disabled":""}>−</button>
            <span>${i.qty}</span>
            <button onclick="changeCartQty('${i.id}',1)">+</button>
          </span>` : ""}
        <button class="cart-item-remove" onclick="removeFromCart('${i.id}')" aria-label="remove">🗑️</button>
      </div>
    </li>`).join("");

  document.getElementById("cartTotalPrice").textContent = cartTotal().toLocaleString() + " ₪";
}

function openCart(){ document.getElementById("cartOverlay").classList.add("show"); document.body.style.overflow="hidden"; }
function closeCart(){ document.getElementById("cartOverlay").classList.remove("show"); document.body.style.overflow=""; }

/* ================= static text (language switch) ================= */
function renderCartStaticText(){
  document.getElementById("cartTitle").textContent = t("cartTitle");
  document.getElementById("cartEmptyMsg").textContent = t("cartEmpty");
  document.getElementById("cartTotalLabel").textContent = t("checkoutTotalLabel");
  document.getElementById("cartCheckoutBtn").textContent = t("checkoutBtn");
  document.getElementById("cartContinueBtn").textContent = t("continueBrowsing");
}

/* עוטפים setLang הקיים (מוגדר ב-landing.js/app.js של כל דף) כדי לרענן גם את
   טקסטי העגלה, בלי לגעת בקבצים ההם. */
function hookCartIntoLangSwitch(){
  const original = window.setLang;
  if(typeof original !== "function") return;
  window.setLang = function(lang){ original(lang); renderCartStaticText(); };
}

/* ================= init ================= */
function initCart(){
  loadCartItems();
  injectCartWidget();
  renderCartStaticText();
  renderCart();
  hookCartIntoLangSwitch();
}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", initCart);
}else{
  initCart();
}

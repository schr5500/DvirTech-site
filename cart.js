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

/* שורה שרדה מגרסה ישנה של העגלה, או ש-localStorage נערך ידנית, עלולה
   להגיע בלי name/price ולהציג "undefined" ו-NaN ₪ בסיכום. עדיף להשמיט
   שורה פגומה מלהציג ללקוח מחיר שגוי. */
function sanitizeCartItems(list){
  if(!Array.isArray(list)) return [];
  return list.filter(i =>
    i && typeof i === "object" &&
    typeof i.name === "string" && i.name &&
    Number.isFinite(Number(i.price)) && Number(i.price) >= 0 &&
    Number.isFinite(Number(i.qty)) && Number(i.qty) >= 1
  ).map(i => Object.assign({}, i, {
    price: Number(i.price),
    qty: Math.min(Math.floor(Number(i.qty)), 20),  // 20 = התקרה שהשרת אוכף ב-priceCart_
    // ⚠️ בלי id הפריט תקוע בעגלה לנצח: removeFromCart מסנן לפי i.id,
    // ושורה ישנה/פגומה בלי id פשוט לא נמחקת בשום לחיצה.
    id: i.id || ("c" + Date.now() + Math.random().toString(36).slice(2,7))
  }));
}

function loadCartItems(){
  try{
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    cartItems = sanitizeCartItems(raw ? JSON.parse(raw) : []);
  }catch(e){ cartItems = []; }
}
function saveCartItems(){
  try{ localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems)); }catch(e){ /* storage unavailable */ }
}

/* escHtml מגיע מ-search-core.js, אבל cart.js רץ גם ב-about/builder/
   contact/terms שלא טוענים אותו. בלי הגיבוי הזה העגלה קורסת שם. */
if(typeof escHtml !== "function"){
  window.escHtml = function(s){
    return String(s == null ? "" : s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  };
}

/* נקודת המוצא של אנימציית "טס לעגלה": האלמנט שנלחץ בפועל. נרשם ברמת
   המסמך כדי שכל כפתור "הוסף לעגלה" בכל דף יעבוד בלי לשנות קוד קריאה. */
document.addEventListener("click", e => {
  // ⚠️ 'ToCart' ולא 'addToCart': בקטלוג הפונקציה נקראת
  // addCatalogItemToCart, ועם הסלקטור הצר האנימציה פשוט לא רצה שם.
  const btn = e.target.closest && e.target.closest("[onclick*='ToCart'], .pd-add, .p-add, #finishBuildBtn");
  if(btn){
    window.__lastAddSourceEl = btn.closest(".p-card, .pd-main, .deal") || btn;
    // נקודת הלחיצה עצמה — גיבוי אמין יותר מאלמנט, שעובד גם אם
    // הכרטיס נמחק/נבנה מחדש בין הלחיצה לאנימציה.
    if(e.clientX || e.clientY) window.__lastAddPoint = { x: e.clientX, y: e.clientY };
  }
}, true);

/* ================= public API ================= */
// item: { type:'product'|'build'|'service', name, price, qty, note? }
function addToCart(item){
  /* ⚠️ שכבת הגנה אחרונה על המלאי. כפתורי הקנייה כבר חסומים בממשק,
     אבל הפונקציה הזו ציבורית ונקראת גם מדפים אחרים — ומוצר שאזל
     שנכנס לעגלה הופך לחיוב על משהו שאין. בודקים מול הקטלוג שכבר
     נטען; אם הוא עוד לא זמין, לא חוסמים (עדיף מכירה מאשר אתר תקוע). */
  if(item && item.type === "product" && typeof dvtFindBySku === "function"){
    const known = dvtFindBySku(item.sku);
    if(known && typeof dvtInStock === "function" && !dvtInStock(known)){
      const msg = (typeof tr === "function")
        ? tr("המוצר אזל מהמלאי", "This product is out of stock")
        : "המוצר אזל מהמלאי";
      if(typeof showToast === "function") showToast(msg); else alert(msg);
      return;
    }
  }
  // מוצרים מהקטלוג עם אותו שם מצטברים בכמות; הרכבות בהתאמה אישית תמיד שורה נפרדת
  // (כל הרכבה שונה מהקודמת, גם אם המחיר יוצא זהה במקרה).
  if(item.type === "product"){
    const existing = cartItems.find(i => i.type === "product" && i.name === item.name);
    if(existing){
      existing.qty += item.qty || 1;
      saveCartItems(); renderCart(); flyToCart(item.qty || 1);
      return;
    }
  }
  cartItems.push(Object.assign({ id: "c" + Date.now() + Math.random().toString(36).slice(2,7), qty: 1 }, item));
  saveCartItems();
  renderCart();
  // ⚠️ בכוונה *לא* פותחים את העגלה: פתיחה אוטומטית קוטעת את הגלישה
  // ומכריחה את הלקוח לסגור חלון בכל הוספה. במקום זה — משוב ויזואלי.
  flyToCart(item.qty || 1);
}

/* משוב "נוסף לעגלה": כדור כחול נוסע בקשת מהמוצר אל אייקון העגלה,
   ואז האייקון קופץ ומופיע +N. אם הדפדפן מבקש פחות אנימציות
   (prefers-reduced-motion) — רק הקפיצה והתג, בלי התנועה. */
function flyToCart(n){
  // בדף הבית יש כפתור עגלה בהדר; בשאר הדפים רק הכפתור הצף. בוחרים את
  // זה שבאמת נראה על המסך, אחרת הכדור טס לאלמנט מוסתר.
  const visible = el => el && el.offsetParent !== null;
  const target = [document.getElementById("headCartBtn"), document.getElementById("cartFab")]
                   .find(visible) || document.getElementById("cartFab");
  if(!target) return;

  const bump = () => {
    target.classList.remove("cart-bump");
    void target.offsetWidth;                 // מאלץ restart לאנימציה
    target.classList.add("cart-bump");
    // ⚠️ חובה להסיר בסיום: לכפתור הצף יש animation:cartFloat משלו,
    // ו-cart-bump דורס אותו כל עוד המחלקה קיימת.
    setTimeout(() => target.classList.remove("cart-bump"), 500);
    showPlusBadge(target, n);
  };

  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduced){ bump(); return; }     // המשתמש ביקש פחות אנימציות — מכבדים

  // נקודת מוצא: מרכז הכרטיס שנלחץ, ואם אין — נקודת הלחיצה עצמה.
  const src = window.__lastAddSourceEl;
  const a = (src && src.getBoundingClientRect) ? src.getBoundingClientRect() : null;
  const from = (a && a.width)
    ? { x: a.left + a.width/2, y: a.top + a.height/2 }
    : window.__lastAddPoint;
  const b = target.getBoundingClientRect();
  if(!from || !b.width){ bump(); return; }

  const dot = document.createElement("span");
  dot.className = "cart-fly";
  dot.style.left = from.x + "px";
  dot.style.top  = from.y + "px";
  document.body.appendChild(dot);

  const dx = (b.left + b.width/2) - from.x;
  const dy = (b.top  + b.height/2) - from.y;
  const lift = Math.min(160, Math.abs(dx) * 0.45 + 60);   // גובה הקשת

  // ⚠️ finish לא מובטח: אם הלשונית ברקע או שהאנימציות מושהות, האירוע
  // לא נורה — הכדור היה נשאר על המסך לנצח והתג לעולם לא היה מופיע.
  // לכן סוגרים פעם אחת, לפי מה שקורה קודם.
  let done = false;
  const settle = () => { if(done) return; done = true; dot.remove(); bump(); };

  dot.animate([
    { transform:"translate(0,0) scale(1)",                         opacity:1 },
    { transform:`translate(${dx*0.5}px, ${dy*0.5 - lift}px) scale(1.25)`, opacity:1, offset:0.55 },
    { transform:`translate(${dx}px, ${dy}px) scale(.25)`,          opacity:.25 }
  ], { duration: 720, easing: "cubic-bezier(.4,.05,.35,1)" })
   .addEventListener("finish", settle);
  setTimeout(settle, 900);
}

function showPlusBadge(target, n){
  const tag = document.createElement("span");
  tag.className = "cart-plus";
  tag.textContent = "+" + (n || 1);
  target.appendChild(tag);
  setTimeout(() => tag.remove(), 1100);
}
// מסירים גם כל פריט "צמוד" להרכבה שהוסרה (כרגע: שורת ההרכבה החינמית) —
// אחרת נשארת שורת "הרכבה חינם" יתומה בעגלה בלי שום הרכבה בפועל שקשורה אליה.
function removeFromCart(id){
  cartItems = cartItems.filter(i => i.id !== id && i.buildId !== id);
  saveCartItems(); renderCart();
}
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
// noteLines: כל רכיב בשורה נפרדת (לא משפט אחד ארוך) לקריאות בעגלה.
// מוסיף שורת הרכבה אחת + שורת "הרכבה (כשקונים חלקים ממני)" ב-0 ₪, ומקשר
// ביניהן דרך buildId — כך ש-removeFromCart מסיר את שתיהן יחד, ולא משאיר
// שורת "הרכבה חינם" יתומה כשמסירים רק את ההרכבה.
function addBuildToCart(buildLines, buildTotal, parts){
  /* ⚠️ הרכבה עוקפת את בדיקת המלאי של addToCart: היא לא type:"product"
     ואין לה sku משלה. מספיק שרכיב אחד מתוך 8-12 אזל כדי שההרכבה כולה
     לא ניתנת לאספקה, ולכן בודקים כאן את הרכיבים עצמם. */
  if(typeof dvtOutOfStockSkus === "function" && Array.isArray(parts)){
    const gone = dvtOutOfStockSkus(parts.map(p => p && p.sku).filter(Boolean));
    if(gone.length){
      const msg = tr("אי אפשר להוסיף את ההרכבה — אזל מהמלאי: ",
                     "Cannot add this build — out of stock: ") +
                  gone.map(g => g.name).join(", ");
      if(typeof showToast === "function") showToast(msg); else alert(msg);
      return;
    }
  }

  const noteLines = buildLines.map(l => `${l.label}: ${l.name}${l.qty>1?` ×${l.qty}`:""}`);
  const buildId = "c" + Date.now() + Math.random().toString(36).slice(2,7);
  cartItems.push({ id: buildId, type:"build", name: tr("הרכבה בהתאמה אישית","Custom PC Build"), price: buildTotal, qty:1, noteLines: noteLines, parts: parts || [] });
  addToCartSilently({ type:"service", sku:"assembly-included", name: tr("הרכבה (כשקונים חלקים ממני)","Assembly (when buying parts from me)"), price:0, qty:1, buildId: buildId });
  saveCartItems(); renderCart();
  // אותו משוב כמו בכל האתר — בלי פתיחה אוטומטית של העגלה.
  window.__lastAddSourceEl = document.getElementById("finishBuildBtn") ||
                             document.querySelector(".summary, .total-row") || null;
  flyToCart(1);
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

  list.innerHTML = cartItems.map(i => {
    // ה-SKU בעגלה הוא "קטגוריה:מזהה" — בדיוק מה שדף המוצר מצפה לו,
    // אז אפשר לבנות ממנו קישור בלי לשלוף שוב את הקטלוג.
    const parts = typeof i.sku === "string" ? i.sku.split(":") : [];
    const href  = (i.type === "product" && parts.length === 2)
      ? `product.html?cat=${encodeURIComponent(parts[0])}&id=${encodeURIComponent(parts[1])}`
      : null;
    const nameHtml = href
      ? `<a class="cart-item-name cart-item-link" href="${href}">${escHtml(i.name)}</a>`
      : `<div class="cart-item-name">${escHtml(i.name)}</div>`;
    const lineTotal = i.price * i.qty;

    return `
    <li class="cart-item">
      <div class="cart-item-main">
        ${nameHtml}
        ${i.noteLines && i.noteLines.length ? `<div class="cart-item-note">${i.noteLines.map(escHtml).join("<br>")}</div>` : ""}
        <div class="cart-item-price">
          ${i.price === 0 ? t("included") : i.price.toLocaleString()+" ₪"}
          ${i.qty > 1 ? `<span class="cart-item-line">${lineTotal.toLocaleString()} ₪</span>` : ""}
        </div>
      </div>
      <div class="cart-item-ctrl">
        ${i.type === "product" ? `
          <span class="qty-ctrl">
            <button onclick="changeCartQty('${i.id}',-1)" ${i.qty<=1?"disabled":""} aria-label="−">−</button>
            <span>${i.qty}</span>
            <button onclick="changeCartQty('${i.id}',1)" ${i.qty>=20?"disabled":""} aria-label="+">+</button>
          </span>` : ""}
        <button class="cart-item-remove" onclick="removeFromCart('${i.id}')" aria-label="${tr("הסר","Remove")}" title="${tr("הסר","Remove")}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
        </button>
      </div>
    </li>`;
  }).join("");

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

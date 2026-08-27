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
  /* ⚠️ שורת "הרכבה 0 ₪" שנוספה כאן הוסרה 26.08 (ההרכבה היא שירות
     בתשלום), ו-addToCartSilently — שנותרה בלי אף קורא — הוסרה 27.08
     בסריקת הפונקציות המתות. */
  saveCartItems();
  renderCart();
}

/* ================= widget markup (injected once per page) ================= */
function injectCartWidget(){
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <button class="cart-fab" id="cartFab" onclick="openCart()" aria-label="cart">
      🛒 <span class="cart-fab-badge" id="cartFabBadge" style="display:none">0</span>
    </button>

    <div class="gift-meter" id="giftMeter" hidden>
      <button class="gift-meter-x" id="giftMeterX" aria-label="close">✕</button>
      <div class="gift-meter-head">
        <span class="gift-meter-emoji" aria-hidden="true">🎁</span>
        <span class="gift-meter-text" id="giftMeterText"></span>
      </div>
      <div class="gift-meter-bar"><i id="giftMeterFill"></i></div>
      <div class="gift-meter-sub" id="giftMeterSub"></div>
      <div class="gift-meter-toggle" id="giftMeterToggle"></div>
      <div class="gift-meter-all" id="giftMeterAll" hidden></div>
    </div>

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
        <button class="btn btn-secondary" id="cartShareBtn" style="display:none" onclick="cartShareOpen()"></button>
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

  /* 🔴 **הסמן בעגלה שבהדר היה מת בכל האתר.** `site-header.js` יוצר
     `#headCartCount` עם `display:none`, אבל **שום קוד באתר לא כתב
     אליו אף פעם** — כלומר בכל דף, בכל מצב, הוא נשאר מוסתר. לקוח
     שהוסיף מוצר ואז ניווט לדף אחר לא ראה שום סימן שיש לו עגלה.
     ⚠️ מוגן ב-null: לא כל דף טוען את ההדר המשותף (למשל דף התשלום,
     שמסתיר את העגלה בכוונה). */
  const headBadge = document.getElementById("headCartCount");
  if (headBadge){
    headBadge.style.display = count ? "" : "none";
    headBadge.textContent = count;
  }

  const list = document.getElementById("cartItemsList");
  const emptyMsg = document.getElementById("cartEmptyMsg");
  const totalRow = document.getElementById("cartTotalRow");
  const checkoutBtn = document.getElementById("cartCheckoutBtn");

  if(!cartItems.length){
    list.innerHTML = "";
    emptyMsg.style.display = "block";
    totalRow.style.display = "none";
    checkoutBtn.style.display = "none";
    const sb = document.getElementById("cartShareBtn");
    if (sb) sb.style.display = "none";
    dvtGiftMeterRender();
    return;
  }
  emptyMsg.style.display = "none";
  totalRow.style.display = "flex";
  /* ⚠️ `""` ולא `"block"` — הערך המוטבע גובר על ה-CSS, ו-`block`
     ביטל את ה-`display:flex` של `.btn` (וממנו את `justify-content:
     center`). התוצאה: שני כפתורים מיושרים למרכז ואחד לא, באותה
     מגירה. ריק = "תחזור למה שה-CSS אומר". */
  checkoutBtn.style.display = "";
  const shareBtn = document.getElementById("cartShareBtn");
  if (shareBtn) shareBtn.style.display = "";

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
  dvtGiftMeterRender();
}

/* ================= פתיחה / סגירה =================
   ⚠️ הסגירה חייבת JS ולא רק CSS: ‎.cart-overlay הוא ‎display:none כשהוא
   סגור, והורדת ‎.show לבדה מקפיצה אותו החוצה בפריים אחד — בלי דהייה
   ובלי החלקה. לכן עוברים דרך מצב ביניים ‎.closing (מוגדר ב-style.css),
   שמחזיק את השכבה מוצגת בזמן שהאנימציה רצה, ורק אז מסירים אותו.

   ⚠️ ‎animationend לבדו לא מספיק: בלשונית ברקע, כשהאנימציות מושהות או
   כשהמשתמש ביקש ‎prefers-reduced-motion, האירוע פשוט לא נורה והשכבה
   הייתה נשארת תקועה על המסך וחוסמת את הדף. לכן טיימר גיבוי, ושחרור
   יחיד דרך ‎done (מי שמגיע ראשון). */
let cartCloseTimer = null;

function openCart(){
  const ov = document.getElementById("cartOverlay");
  if(!ov) return;
  // פתיחה מחדש באמצע סגירה: מבטלים את הסגירה כדי שהמגירה לא "תיעלם"
  // רגע אחרי שנפתחה. ההסרה מחזירה display:none, וה-reflow מיד אחריה
  // מאלץ את הדפדפן להריץ שוב את cartSlide כשמוסיפים show.
  clearTimeout(cartCloseTimer); cartCloseTimer = null;
  ov.classList.remove("closing");
  void ov.offsetWidth;
  ov.classList.add("show");
  document.body.style.overflow = "hidden";
}

function closeCart(){
  const ov = document.getElementById("cartOverlay");
  if(!ov || !ov.classList.contains("show")) return;   // כבר סגורה/נסגרת
  document.body.style.overflow = "";

  /* ⚠️ כאן הייתה עקיפה: בהפחתת אנימציות המגירה נסגרה מיידית, כי
     ה-CSS ביטל את האנימציה לגמרי ולא היה על מה לחכות. מאז ה-CSS
     מחליף את ההחלקה ב**העלמה** (cartFadeOut) במקום לבטל אותה,
     ולכן העקיפה מיותרת — והיא גם יצרה חוסר סימטריה מוזר: פתיחה
     מתרככת, סגירה קופצת. שני הכיוונים עוברים עכשיו באותו מסלול.
     🔴 שים לב: ההגדרה הזו דלוקה במחשב של דביר. שלוש תקלות שדווחו
     ("הבאנר נעלם מהר", "העגלה נפתחת בבום", "אין אנימציית הוספה")
     נבעו כולן ממנה. */

  /* ⚠️ ‎.closing נוסף *לפני* הסרת ‎.show ולא אחריה. שתי המחלקות יחד הן
     מצב חוקי — ‎.closing מוגדר אחריה בקובץ ולכן ‎opacity:0 שלו מנצח —
     והדפדפן אף פעם לא רואה רגע שבו אף אחת מהן לא קיימת. בסדר ההפוך
     די בחישוב סגנון אחד שנופל בין השתיים כדי שהשכבה תיעלם ל-display:none
     ותחתוך את האנימציה בדיוק כמו קודם. */
  ov.classList.add("closing");
  ov.classList.remove("show");
  const done = () => {
    clearTimeout(cartCloseTimer); cartCloseTimer = null;
    ov.classList.remove("closing");
  };
  const panel = ov.querySelector(".cart-panel");
  if(panel) panel.addEventListener("animationend", done, { once: true });
  cartCloseTimer = setTimeout(done, 320);              // מעט מעל .26s של cartSlideOut
}

/* ================= static text (language switch) ================= */
function renderCartStaticText(){
  document.getElementById("cartTitle").textContent = t("cartTitle");
  document.getElementById("cartEmptyMsg").textContent = t("cartEmpty");
  document.getElementById("cartTotalLabel").textContent = t("checkoutTotalLabel");
  document.getElementById("cartCheckoutBtn").textContent = t("checkoutBtn");
  document.getElementById("cartContinueBtn").textContent = t("continueBrowsing");
  const sb = document.getElementById("cartShareBtn");
  if (sb) sb.textContent = tr("שתף את העגלה", "Share this cart");
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
  /* ⚠️ אחרי injectCartWidget — הוא צריך את המגירה כדי לפתוח אותה. */
  try { cartShareMaybeOpen(); } catch (e) { /* קישור פגום לא ישבור את העגלה */ }
  renderCartStaticText();
  renderCart();
  hookCartIntoLangSwitch();
}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", initCart);
}else{
  initCart();
}


/* =====================================================================
   🎁 מד ההתקדמות למתנה — יושב בכל דף שיש בו עגלה
   =====================================================================
   דביר: *"אוטומציה/מדד שיהיה בצד ויראה התקדמות על כל מוצר שנבחר —
   עם מטרה למדרגה השנייה."*

   🔴 **הרפים מגיעים מהשרת, לא מקובעים כאן.** דביר משנה שורה בלשונית
   "🎁 הטבות" — האתר מתעדכן תוך רבע שעה בלי פריסה מחדש. רף שמקובע
   ב-JS הוא רף שיפגר אחרי הגיליון, והלקוח יראה "עוד 200 ₪" למדרגה
   שכבר לא קיימת.

   🔴 **המד הוא תצוגה, לא הכרעה.** הזכאות האמיתית נקבעת ב-
   `giftsEarned_` בשרת, על העגלה **הסופית** ברגע התשלום. לכן:
     • לקוח שממלא סל, מקבל "מגיעה לך מתנה", ואז מרוקן — לא יקבל.
     • החישוב כאן חייב להיות **זהה** ל-`giftBase_` בשרת. מד שמבטיח
       מתנה שהשרת לא ייתן הוא באג שהלקוח רואה לפני שדביר יודע.

   ⚠️ **הבקשה נשלחת רק כשיש עגלה.** מבקר שרק גולש לא משלם על קריאה
   ל-Apps Script, וזה חשוב: זו קריאה נוספת בכל דף אחרת.
   ⚠️ נכשלה הבקשה? אין מד. אין הודעת שגיאה ואין דף שבור — מד התקדמות
   הוא נחמד-שיהיה, לא תנאי לקנייה. */

const DVT_GIFT_TIERS_KEY_ = "dvtGiftTiers_v1";
const DVT_GIFT_TIERS_TTL_ = 15 * 60 * 1000;   /* כמו מטמון הכללים בשרת */
const DVT_GIFT_PICK_KEY_  = "dvirtech_gift_pick_v1";
const DVT_GIFT_SEEN_KEY_  = "dvtGiftMeterSeen_v1";

let dvtGiftTiers_ = null;      /* null = טרם נטען · [] = אין כללים פעילים */
let dvtGiftLoading_ = false;

/* המק"ט שהלקוח בחר. יושב ב-localStorage כדי לשרוד ניווט בין דפים —
   הלקוח בוחר בקופה, אבל עשוי לחזור לקטלוג להוסיף עוד משהו.
   ⚠️ **מק"ט בלבד.** לא מחיר, לא תקרה, לא זהות מדרגה — בדיוק כמו
   שהעגלה נושאת מק"ט וכמות. השרת בודק הכל מחדש. */
function dvtGiftPicked(){
  try { return localStorage.getItem(DVT_GIFT_PICK_KEY_) || ""; } catch(e){ return ""; }
}
function dvtGiftSetPicked(sku){
  try {
    if(sku) localStorage.setItem(DVT_GIFT_PICK_KEY_, String(sku));
    else    localStorage.removeItem(DVT_GIFT_PICK_KEY_);
  } catch(e){ /* storage unavailable */ }
}

/* 🔴 **חייב להישאר זהה ל-`giftBase_` ב-4-payment-api.gs.**
   שירות אינו מוצר: הוא זמן של דביר, ואסור שיממן מתנה. משלוח ועמלת
   תשלומים ממילא אינם בעגלה בשלב הזה. */
function dvtGiftBase(){
  let sum = 0;
  cartItems.forEach(function(i){
    if(String(i.sku || "").indexOf("services:") === 0) return;
    if(i.type === "service") return;
    sum += (Number(i.price) || 0) * (Number(i.qty) || 0);
  });
  return Math.round(sum * 100) / 100;
}

/* פורט של `cartHasCompletePc_` — עבור כללים עם "דורש מחשב שלם".
   ⚠️ מכוון להיות **זהה** לשרת: מחשב מוכן/נייד, או כל שבעת רכיבי
   הליבה. הרכבה מהבונה מתפרקת ל-parts ולכן נמדדת באותה דרך בדיוק. */
const DVT_GIFT_PC_CORE_  = ["cpu","mobo","ram","storage","psu","case","cooling"];
const DVT_GIFT_WHOLE_PC_ = ["readyPc","laptop"];
function dvtGiftHasPc(){
  const cats = Object.create(null);
  const mark = function(sku){
    const c = String(sku || "").split(":")[0];
    if(c) cats[c] = true;
  };
  cartItems.forEach(function(i){
    if(i.type === "build" && Array.isArray(i.parts)) i.parts.forEach(function(p){ mark(p.sku); });
    else if(i.sku) mark(i.sku);
  });
  if(DVT_GIFT_WHOLE_PC_.some(function(c){ return cats[c]; })) return true;
  return DVT_GIFT_PC_CORE_.every(function(c){ return cats[c]; });
}

function dvtGiftApi_(){
  return (typeof DVT_API_URL === "string" && DVT_API_URL) ||
         (typeof PAYMENT_API_URL === "string" && PAYMENT_API_URL) || "";
}

/* טעינת המדרגות. מוחזרת Promise תמיד, ולעולם לא נדחית. */
function dvtGiftLoadTiers(){
  if(dvtGiftTiers_) return Promise.resolve(dvtGiftTiers_);
  try{
    const raw = sessionStorage.getItem(DVT_GIFT_TIERS_KEY_);
    if(raw){
      const o = JSON.parse(raw);
      if(o && (Date.now() - o.at) < DVT_GIFT_TIERS_TTL_ && Array.isArray(o.tiers)){
        dvtGiftTiers_ = o.tiers;
        return Promise.resolve(dvtGiftTiers_);
      }
    }
  }catch(e){ /* sessionStorage חסום — פשוט מביאים מהרשת */ }

  const api = dvtGiftApi_();
  if(!api){ dvtGiftTiers_ = []; return Promise.resolve(dvtGiftTiers_); }

  return fetch(api + "?action=giftTiers")
    .then(function(r){ return r.json(); })
    .then(function(d){
      dvtGiftTiers_ = (d && d.ok && Array.isArray(d.tiers)) ? d.tiers : [];
      try{
        sessionStorage.setItem(DVT_GIFT_TIERS_KEY_,
          JSON.stringify({ at: Date.now(), tiers: dvtGiftTiers_ }));
      }catch(e){}
      return dvtGiftTiers_;
    })
    .catch(function(){ dvtGiftTiers_ = []; return dvtGiftTiers_; });
}

/* מצב ההתקדמות: מה כבר הורווח, מה הבא בתור, וכמה חסר.
   ⚠️ **קבוצה = סולם.** רק המדרגה הגבוהה שהורווחה בכל קבוצה נספרת,
   בדיוק כמו בשרת. כלל בלי קבוצה (משלוח חינם) מצטבר לצידה. */
function dvtGiftProgress(){
  const tiers = dvtGiftTiers_;
  if(!tiers || !tiers.length) return null;

  const base = dvtGiftBase();
  const hasPc = dvtGiftHasPc();
  const usable = tiers.filter(function(x){ return !x.requiresPc || hasPc; });
  if(!usable.length) return null;

  const earned = [];
  const byGroup = {};
  usable.forEach(function(x){
    if(base < x.min) return;
    if(!x.group){ earned.push(x); return; }
    if(!byGroup[x.group] || x.min > byGroup[x.group].min) byGroup[x.group] = x;
  });
  Object.keys(byGroup).forEach(function(g){ earned.push(byGroup[g]); });

  const ahead = usable.filter(function(x){ return x.min > base; })
                      .sort(function(a,b){ return a.min - b.min; });
  const next = ahead.length ? ahead[0] : null;

  /* הפס נמדד **מהמדרגה הקודמת** ולא מאפס — אחרת המעבר מ-1,500
     ל-2,500 מתחיל ב-60% ומרגיש כאילו כבר כמעט הגעת. */
  let prevMin = 0;
  usable.forEach(function(x){ if(x.min <= base && x.min > prevMin) prevMin = x.min; });
  const span = next ? (next.min - prevMin) : 0;
  const pct  = next ? Math.max(2, Math.min(100, ((base - prevMin) / (span || 1)) * 100)) : 100;

  /* מזהה מצב — משמש לזיהוי "עכשיו עברנו מדרגה" (קונפטי) ולאיפוס
     הסגירה הידנית. */
  const level = earned.map(function(x){ return x.group + "@" + x.min; }).sort().join("|");

  return {
    base: base, earned: earned, next: next, pct: pct, level: level,
    remaining: next ? Math.max(0, Math.ceil(next.min - base)) : 0,
    /* התקרה של המדרגה הגבוהה מסוג "מוצר לבחירה" שהורווחה. 0 = אין. */
    pickCap: earned.reduce(function(m, x){
      return (x.kind === "pick" && x.cap > m) ? x.cap : m;
    }, 0)
  };
}

/* טקסט המדרגה — כותרת מהגיליון בעברית, ניסוח נגזר באנגלית.
   ⚠️ הכותרות בגיליון נכתבות בעברית ע"י דביר ואין להן תרגום; באנגלית
   בונים משפט מהסוג ומהתקרה במקום להציג עברית באמצע אנגלית. */
/* 🔴 **"במתנה" בצבע בולט — בקשת דביר: "שיבלוט וילך עם העיצוב ויהיה
   מרגש".** נבחר ורוד-אדום חי (#E11D48) ולא ה-`--red` של האתר:
   ‏`--red` הוא צבע **שגיאה** (שדה לא תקין, מוצר שאזל), ושימוש בו
   לבשורה טובה מלמד את העין הפוך.
   ⚠️ ההחלפה רצה **אחרי** escHtml. המילים כאן הן עברית/אנגלית נקייה
   בלי תווים שה-escape נוגע בהם, ולכן הן שורדות אותו כמו שהן —
   אבל אם מישהו יוסיף כאן מילה עם גרש או &, זה יישבר בשקט.
   ⚠️ מוחל רק על טקסט שכבר עבר escape, אחרת זו הזרקת HTML מהגיליון. */
const DVT_GIFT_HOT_WORDS_ = /(במתנה|חינם|מתנה!|free|gift)/g;
function dvtGiftHot(escaped){
  return String(escaped || "").replace(DVT_GIFT_HOT_WORDS_,
    '<b class="gift-hot">$1</b>');
}

function dvtGiftTierLabel(x){
  const en = (typeof LANG !== "undefined" && LANG === "en");
  if(!en) return x.title || (x.kind === "pick" ? ("מוצר עד " + x.cap + " ₪ במתנה")
                          : x.kind === "shipping" ? "משלוח חינם" : "הטבה");
  if(x.kind === "pick")     return "a free product up to " + x.cap + " ₪";
  if(x.kind === "shipping") return "free delivery";
  if(x.kind === "service")  return "a free service";
  return "a gift";
}

function dvtGiftMeterDismiss(){
  const el = document.getElementById("giftMeter");
  if(el) el.hidden = true;
  const p = dvtGiftProgress();
  try{ sessionStorage.setItem(DVT_GIFT_SEEN_KEY_, p ? p.level + "#closed" : "closed"); }catch(e){}
}

let dvtGiftLastLevel_ = null;

function dvtGiftMeterRender(){
  const el = document.getElementById("giftMeter");
  if(!el) return;

  /* אין עגלה — אין מד, ובעיקר: **אין בקשה לשרת.** */
  if(!cartItems.length){ el.hidden = true; return; }

  if(dvtGiftTiers_ === null){
    if(dvtGiftLoading_) return;
    dvtGiftLoading_ = true;
    dvtGiftLoadTiers().then(function(){
      dvtGiftLoading_ = false;
      dvtGiftMeterRender();
      /* 🔴 **תוקן לפני שהגיע לדביר.** אזור "בחר מתנה" בקופה נבנה
         ב-renderCheckoutPage(), שרץ **לפני** שהמדרגות חוזרות מהשרת —
         ולכן giftActiveCap() החזיר 0 והאזור נשאר מוסתר לנצח. המד
         הצף כן הופיע, כי הוא זה שמחכה לתשובה. התוצאה בבדיקה:
         `cap=65, cands=108` ובכל זאת `display:none`.
         ⚠️ הקריאה כאן ולא בקופה, כי כאן יושב הרגע היחיד שבו ידוע
         שהמדרגות הגיעו. */
      if(typeof renderGiftBlock === "function") renderGiftBlock();
    });
    return;
  }

  const p = dvtGiftProgress();
  if(!p){ el.hidden = true; return; }

  /* נסגר ידנית — מכבדים, אבל **פותחים שוב כשמדרגה חדשה מורווחת**.
     זה בדיוק הרגע שבשבילו המד קיים. */
  let seen = "";
  try{ seen = sessionStorage.getItem(DVT_GIFT_SEEN_KEY_) || ""; }catch(e){}
  if(seen === p.level + "#closed"){ el.hidden = true; return; }

  const txt = document.getElementById("giftMeterText");
  const sub = document.getElementById("giftMeterSub");
  const fill = document.getElementById("giftMeterFill");

  if(p.next){
    txt.innerHTML = tr("עוד ", "Add ") +
      '<b>' + p.remaining.toLocaleString() + ' ₪</b>' +
      tr(" ומגיע לך ", " more and you get ") +
      '<b>' + dvtGiftHot(escHtml(dvtGiftTierLabel(p.next))) + '</b>';
  }else{
    txt.innerHTML = '<b>' + tr("קיבלת את כל ההטבות 🎉", "You have unlocked every reward 🎉") + '</b>';
  }

  fill.style.width = p.pct.toFixed(1) + "%";

  if(p.earned.length){
    sub.hidden = false;
    sub.innerHTML = "✓ " + tr("כבר הרווחת: ", "Already earned: ") +
      p.earned.map(function(x){ return dvtGiftHot(escHtml(dvtGiftTierLabel(x))); }).join(" · ");
  }else{
    sub.hidden = true;
    sub.textContent = "";
  }

  dvtGiftRenderTiers(p);

  el.classList.toggle("is-won", !!p.earned.length);
  el.hidden = false;

  /* עברנו מדרגה בדיוק עכשיו — חגיגה קצרה. ⚠️ לא בטעינת הדף הראשונה
     (dvtGiftLastLevel_ עדיין null), אחרת כל ניווט מפוצץ קונפטי. */
  if(dvtGiftLastLevel_ !== null && p.level !== dvtGiftLastLevel_ && p.earned.length){
    try{ sessionStorage.removeItem(DVT_GIFT_SEEN_KEY_); }catch(e){}
    dvtGiftCelebrate(el);
  }
  dvtGiftLastLevel_ = p.level;
}

/* 🔴 **"הצג הכל" — בקשת דביר: "שיפתח לי סוג של הצג הכל שמראה את כל
   ה-TIERS והם אפורים, כדי שהוא יבין מה הוא מקבל ולאן לשאוף."**

   ⚠️ מדרגה שלא הושגה מוצגת **מעומעמת אבל קריאה** — לא נעלמת ולא
   מטושטשת. כל העניין הוא שהלקוח יראה מה מחכה לו; מדרגה שאי אפשר
   לקרוא לא מושכת לשום מקום.
   ⚠️ הסכומים מגיעים מהשרת (`giftTiers`) ולא מקובעים כאן — שינוי
   שורה בלשונית משתקף באתר תוך רבע שעה. */
let dvtGiftAllOpen_ = false;

function dvtGiftRenderTiers(p){
  const host = document.getElementById("giftMeterAll");
  const tog  = document.getElementById("giftMeterToggle");
  if(!host || !tog) return;

  const tiers = (dvtGiftTiers_ || []).slice().sort(function(a,b){ return a.min - b.min; });
  if(tiers.length < 2){          /* מדרגה אחת — אין מה "להציג הכל" */
    tog.hidden = true; host.hidden = true; return;
  }
  tog.hidden = false;
  tog.textContent = dvtGiftAllOpen_
    ? tr("הסתר מדרגות ▴", "Hide tiers ▴")
    : tr("הצג את כל המדרגות ▾", "Show all tiers ▾");

  const earnedIds = {};
  p.earned.forEach(function(x){ earnedIds[x.group + "@" + x.min] = true; });

  host.innerHTML = tiers.map(function(x){
    const key = x.group + "@" + x.min;
    const won = !!earnedIds[key];
    /* מדרגה בקבוצה שהושגה אבל אינה הגבוהה — עברת אותה, אבל היא
       "נבלעה" בסולם. מסומנת כהושגה-ולא-פעילה כדי לא לשקר. */
    const passed = !won && p.base >= x.min;
    const gap = Math.max(0, Math.ceil(x.min - p.base));
    return '<div class="gift-tier' + (won ? " is-won" : passed ? " is-passed" : "") + '">' +
      '<span class="gift-tier-min">' + x.min.toLocaleString() + ' ₪</span>' +
      '<span class="gift-tier-title">' + dvtGiftHot(escHtml(dvtGiftTierLabel(x))) + '</span>' +
      '<span class="gift-tier-state">' +
        (won ? "✓" : passed ? tr("נכלל", "included")
             : tr("עוד ", "+") + gap.toLocaleString() + " ₪") +
      '</span></div>';
  }).join("");

  host.hidden = !dvtGiftAllOpen_;
}

/* =====================================================================
   🎁 מודעת "קנית? קיבלת!" — דף הבית, דף המתנות ובאנר הקטלוג
   =====================================================================
   DVT-NEXT-BUILD §10.8-10.9. יושב כאן ולא ב-home.js משתי סיבות:
   ‏1) cart.js נטען אחרי home.js, אז home.js לא יכול לקרוא למנגנון
   המדרגות בזמן טעינה; 2) כל לוגיקת המתנות בקובץ אחד — מקור אחד.

   כללי העיצוב שנקבעו שם, וכולם מיושמים כאן:
     • **סדר RTL: המדרגה הנמוכה הכי ימנית** — בעברית העין מתחילה
       מימין, ו-2,500 ראשון הוא סכום שהלקוח מוותר עליו מראש.
     • **הכרטיסים גדלים** — goal-gradient עובד רק כשהמדרגה נראית
       עולה. rank 0-3 קובע גודל/רוויה, העליון מקבל מסגרת.
     • **תמונת מוצר אמיתית, לא 🎁 גנרי** — "קופסה מצוירת שווה אפס
       במוח; פד עכבר מצולם שווה את מחירו." נשלף חי מהקטלוג.
     • **"המשתלם ביותר"** ולא "הכי פופולרי" — אין עדיין לקוחות,
       ו"פופולרי" הוא הטעיה לפי חוק הגנת הצרכן §2.
     • **"בקנייה מעל…"** ולא "סכום למימוש" (שפת מחסן).
     • **"משלוח חינם עד הבית"** — לא "מהיר". אין אקספרס.
   ⚠️ אין תאריך תוקף במודעה — דביר לא קבע דדליין, ולא ממציאים.
   התנאים המלאים ב-gifts.html (נדרש משפטית — §10.9#5). */

function dvtGiftSampleFor_(cap){
  const cat = (typeof dvtCatalogNow === "function") ? dvtCatalogNow() : null;
  if(!cat || !(cap > 0)) return null;
  let best = null;
  Object.keys(cat).forEach(function(key){
    if(key === "services" || key === "content") return;
    const g = cat[key];
    if(!g || !Array.isArray(g.items)) return;
    g.items.forEach(function(it){
      const price = Number(it.price) || 0;
      if(!(price > 0) || price > cap || !it.image) return;
      if(typeof dvtCanBuy === "function" && !dvtCanBuy(it, key)) return;
      /* היקר ביותר בתקרה — זה מה שמוכר את המדרגה. */
      if(!best || price > best.price) best = { name: it.name, image: it.image, price: price };
    });
  });
  return best;
}

function dvtGiftPromoRender(){
  const host = document.getElementById("giftPromo");
  const wrap = document.getElementById("giftPromoWrap");
  const strip = document.getElementById("giftCatalogBanner");
  if(!host && !strip) return;

  dvtGiftLoadTiers().then(function(tiers){
    const picks = (tiers || []).filter(function(x){ return x.kind === "pick" && x.min > 0; })
                               .sort(function(a,b){ return a.min - b.min; });
    const ship  = (tiers || []).filter(function(x){ return x.kind === "shipping"; })[0] || null;

    /* --- באנר הקטלוג: שורה אחת, קיים גם בלי מודאה מלאה --- */
    if(strip){
      if(picks.length){
        strip.innerHTML = "🎁 " +
          tr("<b>קנית? קיבלת!</b> מוצר במתנה לבחירתך בקנייה מעל " +
               picks[0].min.toLocaleString() + " ₪ — לכל המדרגות ←",
             "<b>Buy & get!</b> A free product of your choice on orders over " +
               picks[0].min.toLocaleString() + " ₪ — see all tiers →");
        strip.hidden = false;
      }else{
        strip.hidden = true;
      }
    }

    if(!host) return;
    if(!picks.length){ if(wrap) wrap.hidden = true; return; }

    const top = picks[picks.length - 1];
    const cards = picks.map(function(x, i){
      const sample = dvtGiftSampleFor_(x.cap);
      const img = sample
        ? '<span class="gp-img"><img src="' + escHtml(sample.image) + '" alt="' +
          escHtml(tr("לדוגמה: ", "e.g. ") + sample.name) + '" loading="lazy"></span>'
        : '<span class="gp-img gp-img-empty" aria-hidden="true">🎁</span>';
      return '<div class="gp-card gp-r' + i + (x === top ? ' gp-top' : '') + '">' +
        (x === top ? '<span class="gp-best">' + escHtml(tr("המשתלם ביותר","Best value")) + '</span>' : '') +
        img +
        '<span class="gp-min">' + escHtml(tr("בקנייה מעל ","Orders over ")) +
          '<b>' + x.min.toLocaleString() + ' ₪</b></span>' +
        '<span class="gp-what">' + dvtGiftHot(escHtml(
          tr("מוצר עד " + x.cap + " ₪ במתנה", "A product up to " + x.cap + " ₪ free"))) + '</span>' +
        (sample ? '<span class="gp-sample">' + escHtml(tr("לדוגמה: ","e.g. ") +
          ((typeof dvtDisplayName === "function") ? dvtDisplayName(sample.name) : sample.name)) + '</span>' : '') +
        '</div>';
    }).join("");

    /* 🎨 v2 (27.08) — הכיוון של המודעה שדביר עיצב (רקע נייבי כהה,
       שלושת השלבים בצד, כרטיסים בוהקים), אבל **HTML חי ולא תמונה**:
       המספרים מהשרת, קורא מסך קורא, ושינוי רף לא דורש רג'נרוט.
       מה שלא נכנס מהתמונה — בכוונה:
         • "הכי פופולרי" → "המשתלם ביותר" (אין עדיין לקוחות — הטעיה)
         • "משלוח מהיר עד הבית" → "משלוח חינם" מהמדרגה החיה (אין מהיר)
         • מדרגת 300 ₪ שלא קיימת — רק מה שבאמת פעיל בלשונית */
    const flow =
      '<div class="gp-flow">' +
        '<div class="gp-step"><span class="gp-step-ic">🛒</span><div><b>' +
          escHtml(tr("קונים באתר","Shop the site")) + '</b><span>' +
          escHtml(tr("ממלאים עגלה כרגיל","Fill your cart as usual")) + '</span></div></div>' +
        '<div class="gp-step-arr" aria-hidden="true">⌄</div>' +
        '<div class="gp-step"><span class="gp-step-ic">🎯</span><div><b>' +
          escHtml(tr("מגיעים לרף","Hit a tier")) + '</b><span>' +
          escHtml(tr("מד ההתקדמות מראה כמה נשאר","The meter shows how close you are")) + '</span></div></div>' +
        '<div class="gp-step-arr" aria-hidden="true">⌄</div>' +
        '<div class="gp-step"><span class="gp-step-ic">🎁</span><div><b>' +
          escHtml(tr("בוחרים מתנה","Pick your gift")) + '</b><span>' +
          escHtml(tr("מוצר אמיתי מהקטלוג, בקבלה ב-0 ₪","A real product, on the receipt at 0 ₪")) + '</span></div></div>' +
      '</div>';

    host.innerHTML =
      '<div class="gp-head">' +
        '<h2>' + escHtml(tr("קנית? ","Buy? ")) + '<em>' + escHtml(tr("קיבלת!","Get!")) + '</em></h2>' +
        '<p>' + escHtml(tr("קונים יותר — מקבלים מתנה שווה יותר. אתם בוחרים אותה, מהקטלוג האמיתי.",
                           "The more you buy, the bigger the gift — and you pick it, from the real catalogue.")) + '</p>' +
      '</div>' +
      '<div class="gp-body">' + flow + '<div class="gp-row">' + cards + '</div></div>' +
      (ship ? '<p class="gp-ship">🚚 ' + dvtGiftHot(escHtml(
        tr("ומעל " + ship.min.toLocaleString() + " ₪ — גם משלוח חינם עד הבית",
           "And over " + ship.min.toLocaleString() + " ₪ — free home delivery too"))) + '</p>' : '') +
      '<div class="gp-foot">' +
        '<a class="btn btn-accent gp-cta" href="products.html">' +
          escHtml(tr("לקטלוג — מתחילים לצבור 🎁","To the catalogue — start earning 🎁")) + '</a>' +
        '<a class="gp-terms" href="gifts.html">' +
          escHtml(tr("איך זה עובד + תנאי המבצע","How it works + terms")) + '</a>' +
      '</div>' +
      '<p class="gp-tag">' + escHtml(tr("כל מה שהמחשב שלך צריך — DvirTech","Everything your PC needs — DvirTech")) + '</p>';
    if(wrap) wrap.hidden = false;

    /* תמונות הדוגמה תלויות בקטלוג, שנטען במקביל — רינדור שני כשהוא
       מוכן. ריצה כפולה בונה מחדש מאפס, אז אין כפילות. */
    if(typeof dvtGetCatalog === "function" && !dvtCatalogNow()){
      dvtGetCatalog().then(function(){ dvtGiftPromoRender(); }).catch(function(){});
    }
  });
}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", dvtGiftPromoRender);
}else{
  dvtGiftPromoRender();
}

/* קונפטי — דרישה מפורשת של דביר. ~14 חלקיקים, CSS בלבד, בלי ספרייה.
   ⚠️ מכבד prefers-reduced-motion: מי שביקש פחות תנועה מקבל את המד
   בלי החגיגה, ולא חגיגה מושבתת שמשאירה אלמנטים תקועים. */
function dvtGiftCelebrate(host){
  try{
    if(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  }catch(e){}
  const wrap = document.createElement("div");
  wrap.className = "gift-confetti";
  const colors = ["#1B6FE0","#2FC4B0","#D9822B","#E0453F","#7C3AED"];
  for(let i = 0; i < 14; i++){
    const s = document.createElement("i");
    s.style.background = colors[i % colors.length];
    s.style.insetInlineStart = (6 + Math.random() * 88) + "%";
    s.style.animationDelay = (Math.random() * 0.25).toFixed(2) + "s";
    s.style.transform = "rotate(" + Math.floor(Math.random() * 360) + "deg)";
    wrap.appendChild(s);
  }
  host.appendChild(wrap);
  setTimeout(function(){ if(wrap.parentNode) wrap.parentNode.removeChild(wrap); }, 1600);
}

/* לחיצה על המד **פותחת את רשימת כל המדרגות** — זו הבקשה של דביר.
   ⚠️ לחיצה על שורת מדרגה שכבר הורווחה, כשאנחנו בקופה, קופצת לאזור
   בחירת המתנה — כי זו הפעולה שהלקוח באמת רוצה באותו רגע. */
document.addEventListener("click", function(e){
  if(!e.target.closest) return;

  if(e.target.closest("#giftMeterX")){
    e.stopPropagation(); dvtGiftMeterDismiss(); return;
  }

  /* שורת מדרגה שהורווחה → לבחירת המתנה */
  const won = e.target.closest("#giftMeterAll .gift-tier.is-won");
  if(won){
    e.stopPropagation();
    if(dvtGiftJumpToPicker_()) return;
  }

  if(!e.target.closest("#giftMeter")) return;

  dvtGiftAllOpen_ = !dvtGiftAllOpen_;
  const host = document.getElementById("giftMeterAll");
  const tog  = document.getElementById("giftMeterToggle");
  if(host) host.hidden = !dvtGiftAllOpen_;
  if(tog)  tog.textContent = dvtGiftAllOpen_
    ? tr("הסתר מדרגות ▴", "Hide tiers ▴")
    : tr("הצג את כל המדרגות ▾", "Show all tiers ▾");
});

/* קופץ לאזור בחירת המתנה בקופה. מחזיר false אם אין כזה בדף הזה. */
function dvtGiftJumpToPicker_(){
  const block = document.getElementById("giftBlock");
  if(!block || block.style.display === "none") return false;
  block.scrollIntoView({ behavior: "smooth", block: "center" });
  block.classList.add("gift-block-flash");
  setTimeout(function(){ block.classList.remove("gift-block-flash"); }, 1200);
  return true;
}


/* =====================================================================
   🔗 שיתוף עגלה — דביר מרכיב סל בשיחה ושולח ללקוח לאישור
   =====================================================================
   דביר: "אם אני מרכיב יחד עם הלקוח בשיחה סל של מחשב — אני רוצה לשלוח
   לו שיעבור ויבדוק שלא חסר כלום. השאלה היא מה יקרה כשהלקוח ילחץ —
   האם זה יגרוס לו את העגלה שלו?"

   🔴 **התשובה: לא, ואי אפשר שכן.** הקישור **לעולם אינו מחיל את עצמו.**
   הוא פותח חלון שמראה מה יש בו, ורק לחיצה מפורשת של הלקוח משנה משהו:
     • "הוסף לסל שלי"   — מיזוג. פריט קיים מקבל את הכמות הגבוהה מביניהן
     • "החלף את הסל שלי" — מוצג **רק** אם יש לו כבר סל, ודורש אישור שני
     • "לא עכשיו"        — סוגר, אפס שינוי
   עגלה של לקוח היא רכוש שלו; לינק אף פעם לא מוחק אותה בשקט.

   🔴 **הקישור נושא מק"ט וכמות בלבד — אף פעם לא מחיר.** זה אותו כלל
   שהשרת אוכף בקופה: מחיר שמגיע מהדפדפן אינו מחיר. שני רווחים מזה:
     1. אי אפשר לזייף מחיר ע"י עריכת הכתובת
     2. קישור מלפני שבוע מציג את **המחיר של היום**, לא מחיר מת
   ⚠️ המשמעות: הדף שמקבל את הקישור **חייב** את הקטלוג (search-core.js).
   דף שאין בו — מפנה ל-products.html עם אותה מטענה.

   ⚠️ מוצר שהוסר או נחסם מאז שהקישור נשלח פשוט לא נמצא בקטלוג, ומוצג
   ללקוח כ"לא זמין יותר" במקום להיעלם בשקט. */

const CART_SHARE_PARAM_ = "cart";
const CART_SHARE_LANDING_ = "products.html";

/* "cat:id" + כמות → "cat:id*3". פסיק בין פריטים. */
function cartSharePayload(){
  return cartItems
    .filter(i => typeof i.sku === "string" && i.sku)
    .map(i => i.sku + (Number(i.qty) > 1 ? "*" + Math.floor(Number(i.qty)) : ""))
    .join(",");
}

function cartShareUrl(){
  const base = location.origin + location.pathname.replace(/[^/]*$/, "") + CART_SHARE_LANDING_;
  return base + "?" + CART_SHARE_PARAM_ + "=" + encodeURIComponent(cartSharePayload());
}

function cartShareOpen(){
  const url = cartShareUrl();
  const n = cartCount();
  const nHe = n === 1 ? "פריט אחד" : n + " פריטים";
  const msg = tr("הרכבתי עבורך סל ב-DvirTech (" + nHe + "). מוזמן לעבור ולוודא שלא חסר כלום:",
                 "I've put together a DvirTech cart for you (" + n + (n === 1 ? " item" : " items") + "). Take a look and check nothing's missing:")
              + "\n" + url;

  const box = document.createElement("div");
  box.className = "cart-overlay";
  box.style.display = "flex";
  box.innerHTML =
    '<div class="cart-panel" style="max-width:460px;inset-block:auto;inset-inline:auto;position:relative;margin:auto;border-radius:16px">' +
      '<div class="cart-panel-head"><h3>' + escHtml(tr("שיתוף העגלה", "Share this cart")) + "</h3>" +
        '<button class="checkout-close" aria-label="close">✕</button></div>' +
      "<p style=\"font-size:13.5px;line-height:1.6;margin:0 0 12px\">" +
        escHtml(tr("הלקוח יראה את הפריטים ואת המחירים המעודכנים, ויבחר בעצמו אם להוסיף לסל שלו. הקישור לא מוחק לו כלום.",
                   "Your customer sees the items at today's prices and chooses whether to add them. The link never clears their cart.")) +
      "</p>" +
      '<input type="text" readonly value="' + escHtml(url) + '" ' +
        'style="width:100%;padding:10px;border:1px solid var(--line,#d8e2ef);border-radius:8px;font-size:12px;direction:ltr;text-align:left;margin-bottom:10px">' +
      '<button class="btn btn-accent" data-act="wa" style="margin-bottom:8px">' +
        escHtml(tr("שלח בוואטסאפ", "Send on WhatsApp")) + "</button>" +
      '<button class="btn btn-secondary" data-act="copy">' +
        escHtml(tr("העתק קישור", "Copy link")) + "</button>" +
    "</div>";

  const close = () => box.remove();
  box.addEventListener("click", (ev) => {
    if (ev.target === box) return close();
    const act = ev.target.getAttribute && ev.target.getAttribute("data-act");
    if (ev.target.classList && ev.target.classList.contains("checkout-close")) return close();
    if (act === "wa"){
      window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank", "noopener");
    } else if (act === "copy"){
      const inp = box.querySelector("input");
      inp.select();
      const ok = () => { ev.target.textContent = tr("הועתק ✓", "Copied ✓"); };
      if (navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(url).then(ok, () => { try{ document.execCommand("copy"); ok(); }catch(e){} });
      } else {
        try{ document.execCommand("copy"); ok(); }catch(e){}
      }
    }
  });
  document.body.appendChild(box);
}

/* ---------- צד הלקוח: פתיחת קישור משותף ---------- */
function cartShareParse_(payload){
  return String(payload || "").split(",").map(function (tok){
    const m = String(tok).trim().match(/^(.+?)(?:\*(\d{1,2}))?$/);
    if (!m || !m[1]) return null;
    return { sku: m[1], qty: Math.min(Math.max(parseInt(m[2] || "1", 10) || 1, 1), 20) };
  }).filter(Boolean);
}

/* מק"ט "cat:id" → הפריט החי מהקטלוג. המחיר מגיע **רק** מכאן. */
function cartShareResolve_(catalog, sku){
  const parts = String(sku).split(":");
  if (parts.length !== 2) return null;
  const node = catalog && catalog[parts[0]];
  const list = node && node.items;
  if (!Array.isArray(list)) return null;
  for (let i = 0; i < list.length; i++){
    if (String(list[i].id) === parts[1]) return list[i];
  }
  return null;
}

function cartShareMaybeOpen(){
  let payload = null;
  try { payload = new URLSearchParams(location.search).get(CART_SHARE_PARAM_); }
  catch (e) { return; }
  if (!payload) return;

  /* דף בלי קטלוג לא יכול לתמחר — מפנים לדף שכן יכול, עם אותה מטענה. */
  if (typeof dvtGetCatalog !== "function"){
    location.replace(CART_SHARE_LANDING_ + "?" + CART_SHARE_PARAM_ + "=" + encodeURIComponent(payload));
    return;
  }

  const wanted = cartShareParse_(payload);
  if (!wanted.length) return;

  dvtGetCatalog().then(function (catalog){
    const found = [], missing = [];
    wanted.forEach(function (w){
      const it = cartShareResolve_(catalog, w.sku);
      if (it && Number.isFinite(Number(it.price))) {
        found.push({ item: it, qty: w.qty, sku: w.sku });
      } else {
        missing.push(w.sku);
      }
    });
    if (!found.length && !missing.length) return;
    cartShareShowIncoming_(found, missing);
  }).catch(function(){ /* אין קטלוג — לא מציגים חלון שגוי */ });
}

function cartShareShowIncoming_(found, missing){
  const total = found.reduce((s, f) => s + Number(f.item.price) * f.qty, 0);
  const hasOwn = cartItems.length > 0;

  const rows = found.map(f =>
    '<li class="cart-item"><div class="cart-item-name">' + escHtml(f.item.name) +
    (f.qty > 1 ? ' <span style="opacity:.7">×' + f.qty + "</span>" : "") +
    '</div><div class="cart-item-price">' +
    (Number(f.item.price) * f.qty).toLocaleString() + " ₪</div></li>").join("");

  /* ⚠️ "1 פריטים" זו עברית שבורה, והלקוח רואה את זה. */
  const missHe = missing.length === 1
    ? "פריט אחד כבר אינו זמין והושמט."
    : missing.length + " פריטים כבר אינם זמינים והושמטו.";
  const missEn = missing.length === 1
    ? "One item is no longer available and was left out."
    : missing.length + " items are no longer available and were left out.";
  const miss = missing.length
    ? '<p style="font-size:12.5px;color:var(--red,#c0392b);margin:8px 0 0">' +
      escHtml(tr(missHe, missEn)) + "</p>"
    : "";

  const box = document.createElement("div");
  box.className = "cart-overlay";
  box.style.display = "flex";
  box.innerHTML =
    '<div class="cart-panel" style="max-width:480px;inset-block:auto;inset-inline:auto;position:relative;margin:auto;border-radius:16px">' +
      '<div class="cart-panel-head"><h3>' +
        escHtml(tr("הכנו עבורך סל", "A cart was prepared for you")) + "</h3>" +
        '<button class="checkout-close" aria-label="close">✕</button></div>' +
      '<ul class="cart-items">' + rows + "</ul>" +
      '<div class="checkout-total-row"><span>' + escHtml(tr("סה״כ", "Total")) +
        "</span><span>" + total.toLocaleString() + " ₪</span></div>" + miss +
      '<button class="btn btn-accent" data-act="merge" style="margin:12px 0 8px">' +
        escHtml(hasOwn ? tr("הוסף לסל שלי", "Add to my cart")
                       : tr("קבל את הסל", "Use this cart")) + "</button>" +
      (hasOwn ? '<button class="btn btn-secondary" data-act="replace" style="margin-bottom:8px">' +
        escHtml(tr("החלף את הסל שלי", "Replace my cart")) + "</button>" : "") +
      '<button class="btn btn-secondary" data-act="skip">' +
        escHtml(tr("לא עכשיו", "Not now")) + "</button>" +
    "</div>";

  /* מנקים את הפרמטר מהכתובת כדי שרענון לא יפתח את החלון שוב. */
  const clean = () => {
    try {
      const u = new URL(location.href);
      u.searchParams.delete(CART_SHARE_PARAM_);
      history.replaceState({}, "", u.pathname + (u.search || "") + u.hash);
    } catch (e) { /* דפדפן ישן */ }
  };
  const close = () => { clean(); box.remove(); };

  const apply = (replace) => {
    if (replace) cartItems = [];
    found.forEach(function (f){
      const exist = cartItems.find(c => c.sku === f.sku);
      if (exist) {
        /* מיזוג = הכמות הגבוהה, לא סכום. לקוח שכבר שם 2 ומקבל לינק
           עם 2 לא אמור לגלות 4 בעגלה. */
        exist.qty = Math.min(Math.max(exist.qty, f.qty), 20);
      } else {
        cartItems.push({
          id: "s" + Date.now() + Math.random().toString(36).slice(2, 7),
          sku: f.sku, type: "product",
          name: f.item.name, price: Number(f.item.price), qty: f.qty
        });
      }
    });
    saveCartItems();
    renderCart();
    close();
    if (typeof openCart === "function") openCart();
  };

  box.addEventListener("click", function (ev){
    if (ev.target === box) return close();
    if (ev.target.classList && ev.target.classList.contains("checkout-close")) return close();
    const act = ev.target.getAttribute && ev.target.getAttribute("data-act");
    if (act === "merge")   return apply(false);
    if (act === "skip")    return close();
    if (act === "replace"){
      /* אישור שני — זו הפעולה היחידה כאן שמוחקת משהו של הלקוח. */
      if (confirm(tr("להחליף את הסל הקיים שלך? הפריטים שבו יוסרו.",
                     "Replace your current cart? Its items will be removed."))) apply(true);
    }
  });
  document.body.appendChild(box);
}

/* =====================================================================
   DvirTech — עמוד checkout.html (עמוד אמיתי, לא חלון קופץ)
   =====================================================================
   עצמאי לגמרי: לא טוען את cart.js (ולכן אין כאן את הבועה הצפה של העגלה —
   זה בכוונה, כדי שהעמוד הזה יהיה נקי ומרוכז בתשלום בלבד, ולא ייראה כמו
   חלק מהגלישה הרגילה). קורא ישירות מאותו מפתח localStorage שהעגלה כותבת
   אליו (CART_STORAGE_KEY חייב להישאר זהה למה שמוגדר ב-cart.js).

   ⚠️ WEBAPP_URL חייב להיות מוחלף בכתובת ה-exec האמיתית של ה-Web App
   שנפרס מתוך 4-payment-api.gs (Deploy → New deployment → Web app).
   בלי זה אי אפשר לפתוח תשלום בפועל.

   הבקשה נשלחת כ-POST עם Content-Type: text/plain (לא application/json) —
   זה לא באג, זו הדרך היחידה למנוע preflight CORS שדפדפנים שולחים לפני
   POST לדומיין אחר, ש-Apps Script Web Apps לא יודעים לענות עליו.
   4-payment-api.gs מפרסר את הגוף כ-JSON ידנית מהצד שלו (readBody_).

   ⚠️ עמלת תשלומים — ההבחנה המשפטית שהובילה לעיצוב הזה:
   - כרטיס רגיל מול תשלום מזומן/Bit: אי אפשר להראות "עמלת אשראי" בנפרד
     (אסור על פי חוק הגנת הצרכן — פסיקה נגד מש-כר/משקט). זו לא בחירה
     אמיתית של הלקוח, אז זה חייב להיות גלום במחיר המוצג. **לכן תשלום
     של 1 עד 3 תשלומים לא מציג/מוסיף שום עמלה — המחיר תמיד זהה.**
   - 4 תשלומים ומעלה זו בחירה אמיתית ואופציונלית של הלקוח (יש לו את
     האפשרות לשלם בפחות תשלומים תמיד) — לכן מותר להציג עמלה נפרדת
     ומפורטת, כל עוד היא לא עולה על העלות בפועל ומוצגת ללקוח לפני
     שהוא מתחייב. זה בדיוק מה שקורה כאן.
   ⚠️ העמלה מחושבת *לכל חודש תשלום* (לא אחוז שטוח קבוע) — 6 תשלומים
   עולים יותר מ-4, בדיוק כמו מימון אמיתי. המקדם (0.75%, מאתר UPAY) הוא
   *לפני* מע"מ — ה-VAT_RATE למטה *כן* מוכפל, ובכוונה: זו לא "גביית
   מע"מ מהלקוח" (שאסורה לעוסק פטור, ולא קורית כאן — הקבלה נשארת ללא
   שורת מע"מ) אלא שחזור עלות אמיתית: UPAY גובה מהעסק מע"מ על העמלה
   שלה, ועוסק פטור לא מקזז אותו. בלי ההכפלה, כל עסקת 4+ תשלומים
   מפסידה כ-18% מהעמלה בפועל. ⚠️ עדיין כדאי לוודא עם רו"ח לפני מכירות
   אמיתיות — זה כסף אמיתי.
===================================================================== */

const CART_STORAGE_KEY = "dvirtech_cart_items_v1";
const PAYMENT_API_URL = "https://script.google.com/macros/s/AKfycbwuW5tgiRDhoIEFNkHHWgkVot6FyHFEUBa1mx41ck1lp74ChzT8pciMV9qaI0NcDw-sKA/exec";

/* לתצוגה בלבד — השרת (4-payment-api.gs) מחשב את זה מחדש ובאופן עצמאי,
   לא סומך על מה שנשלח מכאן. ⚠️ אם משנים כאן, לשנות גם שם
   (INSTALLMENT_FEE_PCT_PER_MONTH_PRE_VAT). */
const INSTALLMENT_FEE_PCT_PER_MONTH_PRE_VAT = 0.75;   // מקור: UPAY (0.75%+מע"מ עד 12 תשלומים) — לאמת מול הדשבורד לפני מכירות אמיתיות
const INSTALLMENT_FEE_FREE_UPTO = 3;                 // 1–3 תשלומים: ללא עמלה בכלל
const VAT_RATE = 0.18;

let cartSubtotal = 0;

/* checkout.js לא טוען את search-core.js, אז עותק מקומי. */
function escHtml(s){
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* אותה הגנה כמו ב-cart.js: שורה פגומה (בלי name/price, או מגרסת עגלה
   ישנה) הופכת ל-"undefined" ו-NaN ₪ בדף התשלום. משמיטים אותה במקום
   להציג ללקוח סכום שגוי. השרת ממילא מתמחר מחדש לפי sku בלבד. */
function sanitizeCartItems(list){
  if(!Array.isArray(list)) return [];
  return list.filter(i =>
    i && typeof i === "object" &&
    typeof i.name === "string" && i.name &&
    Number.isFinite(Number(i.price)) && Number(i.price) >= 0 &&
    Number.isFinite(Number(i.qty)) && Number(i.qty) >= 1
  ).map(i => Object.assign({}, i, {
    price: Number(i.price),
    qty: Math.min(Math.floor(Number(i.qty)), 20)   // 20 = התקרה שהשרת אוכף ב-priceCart_
  }));
}

/* הרכיבים שבלעדיהם אין מחשב עובד. אם כולם בעגלה כפריטים נפרדים —
   הלקוח בעצם מרכיב מחשב "ידנית", ואז כדאי להסביר לו שההרכבה חינם
   מותנית במעבר דרך הבונה: רק שם נבדקת ההתאמה בין הרכיבים. */
const ASSEMBLY_CORE_CATS = ["cpu","mobo","ram","storage","psu","case"];

function renderAssemblyNotice(items){
  const box = document.getElementById("assemblyNotice");
  if(!box) return;

  const hasBuild = items.some(i => i.type === "build");
  const cats = new Set(items
    .filter(i => typeof i.sku === "string")
    .map(i => i.sku.split(":")[0]));
  const looksLikeFullPc = ASSEMBLY_CORE_CATS.every(c => cats.has(c));

  // הרכבה דרך הבונה כבר מזכה — אין מה להציע
  if(hasBuild || !looksLikeFullPc){ box.hidden = true; box.innerHTML = ""; return; }

  box.hidden = false;
  box.innerHTML = `
    <b>${tr("רוצה הרכבה חינם?","Want free assembly?")}</b>
    <p>${tr(
      "יש בעגלה את כל הרכיבים למחשב שלם. הטבת ההרכבה ללא עלות ניתנת על הרכבות שנבנו דרך בונה המחשבים — רק שם נבדקת ההתאמה בין הרכיבים (שקע המעבד, גודל המארז, הספק הספק וכו'), וכך אני יודע שההרכבה תעבוד.",
      "Your cart has every part of a complete PC. Free assembly applies to builds configured in the PC Builder — that's where part compatibility is checked (CPU socket, case clearance, PSU headroom), so I know the build will actually work.")}</p>
    <a class="btn btn-secondary" href="builder.html">${tr("מעבר לבונה המחשבים","Open the PC Builder")}</a>`;
}

function readCartFromStorage(){
  try{
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return sanitizeCartItems(raw ? JSON.parse(raw) : []);
  }catch(e){ return []; }
}

function cartTotalOf(items){ return items.reduce((s,i)=> s + i.price*i.qty, 0); }

// עמלה לכל חודש תשלום, לא אחוז שטוח — ככל שיש יותר תשלומים, העמלה גדלה
// בהתאם (בדיוק כמו מימון אמיתי). מחושב על כל התשלומים (לא רק על אלה
// שמעבר ל-3), כי מ-4 תשלומים ומעלה כל העסקה כפופה לתנאי המימון.
function installmentFeePct(count){
  if(count <= INSTALLMENT_FEE_FREE_UPTO) return 0;
  const raw = INSTALLMENT_FEE_PCT_PER_MONTH_PRE_VAT * count;
  return Math.round(raw * (1 + VAT_RATE) * 1000) / 1000;
}

function renderCheckoutPage(){
  const items = readCartFromStorage();
  const emptyState = document.getElementById("emptyState");
  const content = document.getElementById("checkoutContent");

  if(!items.length){
    emptyState.style.display = "block";
    content.style.display = "none";
    return;
  }
  emptyState.style.display = "none";
  content.style.display = "block";

  document.getElementById("checkoutSummary").innerHTML = items.map(i => `
    <li>
      <span class="k">
        <div>${escHtml(i.name)}${i.qty>1?` × ${i.qty}`:""}</div>
        ${i.noteLines && i.noteLines.length ? `<div class="cart-item-note">${i.noteLines.map(escHtml).join("<br>")}</div>` : ""}
      </span>
      <span class="v">${i.price===0 ? t("included") : (i.price*i.qty).toLocaleString()+" ₪"}</span>
    </li>`).join("");
  renderAssemblyNotice(items);
  renderShippingOptions();
  // ⚠️ אותו זיהוי בדיוק כמו ב-renderAssemblyNotice: פריט type:"build"
  // הוא הרכבה שנבנתה בבונה, וההרכבה שלה כבר ניתנה ללא עלות.
  cartHasBuild = items.some(i => i.type === "build");
  // עגלה שהשתנתה מאז הביקור הקודם יכולה להשאיר בחירה שכבר לא מוצגת
  // (למשל חבילה שנבחרה לפני שנוספה הרכבה מהבונה) — מסננים כדי שלא
  // יישלח לשרת מפתח שהלקוח כבר לא רואה על המסך.
  const allowed = servicesForCart().map(s => s.key);
  selectedServices = selectedServices.filter(k => allowed.indexOf(k) !== -1);
  renderServiceOptions();
  cartSubtotal = cartTotalOf(items);
  document.getElementById("checkoutTotalPrice").textContent = cartSubtotal.toLocaleString() + " ₪";
  renderCheckoutTotals();
}

/* ⚠️ **חייב להישאר תואם ל-SHIPPING_OPTIONS_ ב-4-payment-api.gs.**
   המחיר שנגבה בפועל נלקח **מהשרת**; מה שכאן הוא תצוגה בלבד. אם שני
   הצדדים ייפרדו, הלקוח יראה סכום אחד וייגבה ממנו אחר — ולכן כל שינוי
   מחיר חייב להיעשות בשני הקבצים.

   באיסוף עצמי השדה etaHe/etaEn מחזיק **הערת מקום ותיאום** במקום זמן
   אספקה: אין מה להבטיח תאריך משלוח למי שבא לקחת, ומה שהוא צריך לדעת
   זה איפה ואיך. אין כתובת חנות קבועה (הרכבות מתבצעות אצל דביר) —
   לכן אותה נוסחה שמופיעה בעמוד "צור קשר": איסוף בתיאום מראש. */
const DVT_SHIPPING = [
  { key:"pickup",   he:"איסוף עצמי",  en:"Self pickup",       price:0,  etaHe:"באר שבע — בתיאום מראש", etaEn:"Be'er Sheva — by prior arrangement" },
  { key:"standard", he:"משלוח רגיל", en:"Standard delivery", price:0,  etaHe:"3-5 ימי עסקים", etaEn:"3-5 business days" },
  { key:"express",  he:"משלוח מהיר", en:"Express delivery",  price:49, etaHe:"עד 2 ימי עסקים", etaEn:"Up to 2 business days" }
];
let shippingKey = "standard";

function shippingOption(){
  return DVT_SHIPPING.find(s => s.key === shippingKey) || null;
}

function shippingPrice(){
  const o = shippingOption();
  return o ? o.price : 0;
}

function renderShippingOptions(){
  const host = document.getElementById("shippingOptions");
  if(!host) return;
  document.getElementById("shippingLabel").textContent = tr("אופן המשלוח","Delivery method");
  host.innerHTML = DVT_SHIPPING.map(s => `
    <label class="ship-opt${s.key === shippingKey ? " is-on" : ""}">
      <input type="radio" name="shipOpt" value="${s.key}"
             ${s.key === shippingKey ? "checked" : ""}
             onchange="onShippingChange(this.value)">
      <span class="ship-name">${tr(s.he, s.en)}</span>
      <span class="ship-eta">${tr(s.etaHe, s.etaEn)}</span>
      <span class="ship-price">${s.price === 0 ? tr("ללא עלות","Free") : "+" + s.price.toLocaleString() + " ₪"}</span>
    </label>`).join("");
}

function onShippingChange(key){
  shippingKey = key;
  renderShippingOptions();
  renderCheckoutTotals();
}

/* ==================== שירותים נוספים ====================
   ⚠️ **מקור המחירים הוא PRICE_LIST ב-CRM+SUPPLIERS/2-pricelist-picker.gs**
   — המחירון שדביר עובד איתו ביומן העבודות. זה פרויקט Apps Script אחר
   ואי אפשר לקרוא ממנו בזמן ריצה, ולכן זה עותק. ⚠️ **שינוי מחיר חייב
   לקרות בשלושה מקומות:** שם (מקור האמת), ב-SERVICE_OPTIONS_ ב-
   4-payment-api.gs (מה שנגבה בפועל) וכאן (מה שמוצג).

   כמו במשלוח — הדפדפן שולח **רק מפתחות** והשרת מתמחר. המחירים כאן הם
   לתצוגה בלבד; אי אפשר לקנות שירות ב-0 ₪ על ידי עריכת הדף.

   לא כל המחירון מוצג: "נסיעה בלבד" ו"אבחון תקלה" הם שלב בקריאת שירות
   טלפונית ולא משהו שקונים בעגלה, ו"ביקור בית — עד 30 דק'" הושמט כי
   הוא חופף ל"התקנת מחשב בעמדת הלקוח" (שכולל את אותה הגעה, רק עם
   תוצר מוגדר) — שתי שורות שנראות כמעט זהות רק מבלבלות בבחירה.

   group = שירותים שחופפים זה לזה; בחירה באחד מבטלת את השני, אחרת
   הלקוח משלם פעמיים על אותה עבודה (השרת דוחה צירוף כזה ממילא).
   includesAssembly = החבילה כוללת הרכבה — ראה servicesForCart(). */
const DVT_SERVICES = [
  { key:"win11-license",     he:"התקנת Windows 11 + רישיון",         en:"Windows 11 install + license",      price:300, group:"os" },
  { key:"win11-own-license", he:"התקנת Windows (יש לי רישיון)",      en:"Windows install (I have a license)", price:200, group:"os" },
  { key:"data-transfer",     he:"העברת נתונים / גיבוי",              en:"Data transfer / backup",            price:200 },
  { key:"clean-thermal",     he:"ניקוי פנימי + משחה תרמית",          en:"Internal cleaning + thermal paste",  price:150 },
  { key:"remote-support",    he:"תמיכה מרחוק (שעה)",                 en:"Remote support (1 hour)",           price:120 },
  { key:"onsite-setup",      he:"התקנת מחשב בעמדת הלקוח",            en:"On-site PC setup",                  price:400,
    noteHe:"כולל הגעה עד 30 דק' נסיעה", noteEn:"Includes travel of up to 30 minutes" },
  { key:"bundle-new-pc",     he:"חבילה: מחשב חדש — הכל כלול",        en:"Bundle: new PC — all included",     price:700, group:"os", includesAssembly:true,
    noteHe:"הרכבה + Windows + רישיון + התקנה", noteEn:"Assembly + Windows + license + setup" }
];

let selectedServices = [];   // מפתחות בלבד — זה גם מה שנשלח לשרת
let cartHasBuild = false;    // נקבע ב-renderCheckoutPage לפי תוכן העגלה

/* ⚠️ **השקלול מול הבונה.** מי שסיים הרכבה בבונה קיבל שורת
   `assembly-included` בעגלה — הרכבה ללא עלות. להציע לו אחר כך חבילה
   שכוללת הרכבה זה לגבות אותו פעמיים על אותה עבודה, והוא גם ישלם יותר:
   "חבילה: מחשב חדש" ב-700 מול "התקנת Windows 11 + רישיון" ב-300 שזה
   כל מה שבאמת חסר לו. לכן במצב הזה מוצגות רק ההתקנות הבודדות. */
function servicesForCart(){
  return DVT_SERVICES.filter(s => !(cartHasBuild && s.includesAssembly));
}

function servicesTotal(){
  return selectedServices.reduce((sum, key) => {
    const o = DVT_SERVICES.find(s => s.key === key);
    return sum + (o ? o.price : 0);
  }, 0);
}

function renderServiceOptions(){
  const host = document.getElementById("servicesOptions");
  if(!host) return;

  document.getElementById("servicesTitle").textContent = tr("שירותים נוספים","Add-on services");
  document.getElementById("servicesHint").textContent = cartHasBuild
    ? tr("ההרכבה כבר כלולה בהזמנה שלך ללא עלות, אז מופיעות כאן ההתקנות הבודדות בלבד. כל שירות מתואם איתך בטלפון אחרי ההזמנה.",
         "Assembly is already included in your order at no cost, so only the standalone installs are listed. Every service is scheduled with you by phone after checkout.")
    : tr("אופציונלי — אפשר גם לדלג. כל שירות מתואם איתך בטלפון אחרי ההזמנה.",
         "Optional — feel free to skip. Every service is scheduled with you by phone after checkout.");

  host.innerHTML = servicesForCart().map(s => {
    const on = selectedServices.indexOf(s.key) !== -1;
    return `
    <label class="svc-opt${on ? " is-on" : ""}">
      <input type="checkbox" ${on ? "checked" : ""}
             onchange="onServiceToggle('${s.key}', this.checked)">
      <span class="svc-name">${tr(s.he, s.en)}</span>
      <span class="svc-price">+${s.price.toLocaleString()} ₪</span>
      ${s.noteHe ? `<span class="svc-note">${tr(s.noteHe, s.noteEn)}</span>` : ""}
    </label>`;
  }).join("");

  renderServicesCounter();
}

/* המונה בכותרת הוא כל מה שרואים כשהאזור סגור — בלעדיו אי אפשר לדעת
   שנבחר שם משהו בלי לפתוח אותו שוב. */
function renderServicesCounter(){
  const el = document.getElementById("servicesCount");
  if(!el) return;
  const n = selectedServices.length;
  el.classList.toggle("is-on", n > 0);
  if(!n){ el.textContent = tr("אופציונלי","Optional"); return; }
  const label = n === 1
    ? tr("שירות אחד","1 service")
    : (n + " " + tr("שירותים","services"));
  el.textContent = label + " · " + servicesTotal().toLocaleString() + " ₪";
}

function onServiceToggle(key, on){
  const opt = DVT_SERVICES.find(s => s.key === key);
  if(!opt) return;

  if(on){
    // שירות מאותה קבוצה כבר נבחר? מחליפים אותו במקום להוסיף — שתי דרכים
    // להתקין Windows (או חבילה שכוללת Windows) הן אותה עבודה.
    if(opt.group){
      selectedServices = selectedServices.filter(k => {
        const o = DVT_SERVICES.find(s => s.key === k);
        return !o || o.group !== opt.group;
      });
    }
    selectedServices.push(key);
  }else{
    selectedServices = selectedServices.filter(k => k !== key);
  }
  renderServiceOptions();
  renderCheckoutTotals();
}

function renderCheckoutTotals(){
  const count = parseInt(document.getElementById("installmentsCount").value, 10) || 1;
  const shipCost = shippingPrice();
  const svcCost = servicesTotal();
  /* ⚠️ העמלה מחושבת על הסכום **כולל משלוח וכולל שירותים** — זה מה
     שנגבה בפועל בכרטיס, וכך בדיוק מחשב createPayment_ בצד השרת. */
  const base = Math.round((cartSubtotal + shipCost + svcCost) * 100) / 100;
  const pct = installmentFeePct(count);
  const fee = Math.round(base * (pct / 100) * 100) / 100;
  const grandTotal = Math.round((base + fee) * 100) / 100;

  const shipRow = document.getElementById("shipRow");
  if(shipRow){
    shipRow.style.display = shipCost > 0 ? "block" : "none";
    if(shipCost > 0){
      // שם האפשרות שנבחרה בפועל ולא טקסט קבוע — יש יותר מאפשרות אחת
      // בתשלום, ושורה שכתוב בה "משלוח מהיר" כשנבחר משהו אחר היא שקר.
      const o = shippingOption();
      document.getElementById("shipLabel").textContent = o ? tr(o.he, o.en) : tr("משלוח","Delivery");
      document.getElementById("shipValue").textContent = shipCost.toLocaleString() + " ₪";
    }
  }

  const svcRow = document.getElementById("servicesRow");
  if(svcRow){
    svcRow.style.display = svcCost > 0 ? "block" : "none";
    if(svcCost > 0){
      document.getElementById("servicesRowLabel").textContent =
        tr("שירותים נוספים","Add-on services") + " (" + selectedServices.length + ")";
      document.getElementById("servicesRowValue").textContent = svcCost.toLocaleString() + " ₪";
    }
  }

  const feeRow = document.getElementById("feeRow");
  const breakdownRow = document.getElementById("monthlyBreakdownRow");
  if(pct > 0){
    feeRow.style.display = "block";
    document.getElementById("feeLabel").textContent = t("feeLabelPrefix") + " (" + pct + "%)";
    document.getElementById("feeValue").textContent = fee.toLocaleString() + " ₪";

    const monthly = Math.round((grandTotal / count) * 100) / 100;
    breakdownRow.style.display = "block";
    breakdownRow.textContent = t("monthlyBreakdownPrefix") + " " + count + " " +
      t("monthlyBreakdownMiddle") + " " + monthly.toLocaleString() + " ₪ " + t("monthlyBreakdownSuffix");
  }else{
    feeRow.style.display = "none";
    breakdownRow.style.display = "none";
  }
  document.getElementById("grandTotalPrice").textContent = grandTotal.toLocaleString() + " ₪";
}

function toggleBusinessField(){
  const checked = document.getElementById("isBusinessCheckbox").checked;
  document.getElementById("companyNameField").style.display = checked ? "block" : "none";
}

// הופך את פריטי העגלה לרשימת { sku, qty } — הדבר היחיד שנשלח לשרת.
// לעולם לא שולחים מחיר: מוצר מוכן (type:"product"/"service") שולח את ה-sku
// שלו כמו שהוא; הרכבה בהתאמה אישית (type:"build") מתפרקת לרכיבים (parts)
// שנשמרו עליה ב-cart.js/builder.html, כי היא לא שורה אחת אלא צירוף רכיבים.
function cartItemsToLines(items){
  const lines = [];
  items.forEach(i => {
    if(i.type === "build" && Array.isArray(i.parts)){
      i.parts.forEach(p => lines.push({ sku: p.sku, qty: p.qty }));
    }else if(i.sku){
      lines.push({ sku: i.sku, qty: i.qty });
    }
  });
  return lines;
}

async function submitCheckout(){
  const name = document.getElementById("custName").value.trim();
  const phone = document.getElementById("custPhone").value.trim();
  const email = document.getElementById("custEmail").value.trim();
  const phoneOk = /^0\d{8,9}$/.test(phone.replace(/[\s-]/g,""));
  const termsOk = document.getElementById("termsAgreeCheckbox").checked;
  const box = document.getElementById("checkoutValidation");
  const isBusiness = document.getElementById("isBusinessCheckbox").checked;
  const companyName = document.getElementById("custCompanyName").value.trim();

  if(!name || !phoneOk){
    box.style.display = "block";
    box.textContent = t("checkoutValidationBasic");
    return;
  }
  if(!termsOk){
    box.style.display = "block";
    box.textContent = t("termsAgreeRequired");
    return;
  }
  if(isBusiness && !companyName){
    box.style.display = "block";
    box.textContent = t("labelCompanyName");
    return;
  }
  box.style.display = "none";

  const items = readCartFromStorage();
  const lines = cartItemsToLines(items);
  if(!lines.length){
    box.style.display = "block";
    box.textContent = t("cartEmpty");
    return;
  }

  /* ⚠️ העגלה יושבת ב-localStorage לימים. מוצר שהיה במלאי כשנוסף יכול
     לאזול עד שהלקוח חוזר לשלם, ואת זה בדיקת ההוספה לא תופסת.
     הבדיקה בצד שרת (`checkStockLive_`) היא הקו האחרון, אבל היא רצה
     אחרי שהלקוח כבר מילא טפסים — עדיף לומר לו כאן. */
  if(typeof dvtCartOutOfStock === "function"){
    const gone = dvtCartOutOfStock(items);
    if(gone.length){
      box.style.display = "block";
      box.textContent = tr("אזל מהמלאי ואי אפשר להזמין: ",
                           "Out of stock, cannot be ordered: ") +
                        gone.map(g => g.name).join(", ") +
                        tr(". הסר מהעגלה ונסה שוב.", ". Please remove and try again.");
      return;
    }
  }

  const btn = document.getElementById("checkoutSubmitBtn");
  const originalLabel = btn.textContent;
  btn.disabled = true;
  btn.textContent = t("checkoutSubmitting");

  const installments = parseInt(document.getElementById("installmentsCount").value, 10) || 1;

  try{
    const res = await fetch(PAYMENT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "createPayment",
        customer: { name, phone, email, isBusiness, companyName },
        lines: lines,
        installments: installments,
        // רק המפתח נשלח. המחיר נקבע בשרת — ראה SHIPPING_OPTIONS_.
        shipping: shippingKey,
        // אותו דבר לשירותים: מפתחות בלבד, השרת מתמחר (SERVICE_OPTIONS_).
        services: selectedServices
      })
    });
    const data = await res.json();

    if(!data.ok || !data.redirectUrl){
      box.style.display = "block";
      box.textContent = data.error || t("checkoutErrorGeneric");
      btn.disabled = false;
      btn.textContent = originalLabel;
      return;
    }

    // מעבר לדף התשלום המאובטח של SUMIT — לא מנקים את העגלה כאן; thanks.html
    // מנקה אותה רק אחרי אימות תשלום מוצלח בפועל מול SUMIT.
    window.location.href = data.redirectUrl;
  }catch(e){
    box.style.display = "block";
    box.textContent = t("checkoutErrorNetwork");
    btn.disabled = false;
    btn.textContent = originalLabel;
  }
}

/* ================= static text (language switch) ================= */
function renderCheckoutStaticText(){
  document.getElementById("backLink").textContent = t("continueBrowsing");
  document.getElementById("pageTitle").textContent = t("checkoutTitle");
  document.getElementById("pageSubtitle").textContent = t("checkoutScreenSubtitle");
  document.getElementById("emptyStateText").textContent = t("cartEmpty");
  document.getElementById("emptyStateBtn").textContent = t("catalogTitle");
  document.getElementById("checkoutTotalLabel").textContent = t("checkoutSubtotalLabel");
  document.getElementById("installmentsLabel").textContent = t("installmentsCountLabel");
  document.getElementById("installmentsHint").textContent = t("installmentsHint");
  document.getElementById("grandTotalLabel").textContent = t("grandTotalLabel");
  document.getElementById("labelName").textContent = t("labelName");
  document.getElementById("labelPhone").textContent = t("labelPhone");
  document.getElementById("labelEmail").textContent = t("labelEmail");
  document.getElementById("checkoutSubmitBtn").textContent = t("submitOrderBtn");
  document.getElementById("termsAgreeLabel").innerHTML = t("termsAgreeLabelHtml");
  document.getElementById("isBusinessLabel").textContent = t("isBusinessLabel");
  document.getElementById("labelCompanyName").textContent = t("labelCompanyName");
  document.getElementById("invoiceTypeHint").textContent = t("invoiceTypeHint");
  document.getElementById("footerText").textContent = t("footerText");
  renderFooterLegal();
  document.querySelectorAll(".lang-btn").forEach(b => b.classList.toggle("active", b.dataset.lang === LANG));
}

function renderCancelledNotice(){
  if(new URLSearchParams(window.location.search).get("cancelled") !== "1") return;
  const box = document.getElementById("checkoutValidation");
  box.style.display = "block";
  box.textContent = t("checkoutCancelledNotice");
}

function setLang(lang){
  if(lang === LANG) return;
  setLangCore(lang);
  renderCheckoutStaticText();
  renderCheckoutPage();
  renderCancelledNotice();
}

renderCheckoutStaticText();
renderCheckoutPage();
renderCancelledNotice();

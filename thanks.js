/* =====================================================================
   DvirTech — דף אחרי תשלום (thanks.html)
   =====================================================================
   זהו יעד ה-RedirectURL ש-4-payment-api.gs שולח ל-SUMIT (CFG.RETURN_SUCCESS).
   לפי תיעוד ה-API הרשמי של SUMIT, בהצלחה מתווספים לכתובת שלושה פרמטרים:
   OG-CustomerID, OG-PaymentID, OG-ExternalIdentifier. **אלה רק אומרים
   "המשתמש עבר בדפדפן" — לא מספיק כדי לסמן "שולם"**: מבצעים כאן קריאת
   שרת-לשרת אמיתית (verifyPayment מול billing/payments/get/) לפני שמציגים
   הצלחה או מנקים את העגלה. זה אותו עיקרון בדיוק כמו ב-4-payment-api.gs —
   לעולם לא סומכים על מה שהדפדפן "אומר" בלי אימות מול SUMIT עצמו.

   ⚠️⚠️ **חוזה האימות — אין לשנות אותו כדי "לשפר חוויה".**
   ‎runVerification מקבל שלוש תשובות אפשריות מהשרת, ומתייחס אליהן כך:
     • ‎ok === true  && status === "paid"    → אושר. **רק כאן** מוצגת
       הצלחה ורק כאן מנקים את העגלה.
     • ‎ok === false && status === "failed"  → נדחה סופית.
     • כל דבר אחר (שגיאת רשת, תשובה לא חד-משמעית, timeout) → **לא ידוע**.
       מנסים שוב עד MAX_ATTEMPTS, ואם עדיין לא ידוע — מצב "pending".
   מצב "לא ידוע" **אסור** שיוצג כהצלחה: לקוח שראה "שולם" על תשלום שלא
   נקלט הוא נזק חמור בהרבה מלקוח שראה "עוד בבדיקה" על תשלום שכן נקלט.
   ראה גם את ההגנה המבנית ב-thanks.html: תוכן ההצלחה מוסתר ב-CSS עד
   ש-‎data-thx-state הופך ל-"confirmed".

   ⚠️ הדף חייב לעבוד גם בלי אף פרמטר בכתובת. אין מזהה תשלום = אין מה
   לאמת, וזה **לא שגיאה** אלא מצב "noorder" עם הודעה ניטרלית.

   ⚠️ WEBAPP_URL חייב להיות זהה למה שהוגדר ב-checkout.js (PAYMENT_API_URL).
===================================================================== */

const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwuW5tgiRDhoIEFNkHHWgkVot6FyHFEUBa1mx41ck1lp74ChzT8pciMV9qaI0NcDw-sKA/exec";

/* ⚠️ **בכוונה לא בשם CART_STORAGE_KEY.** cart.js נטען בדף הזה ומגדיר
   ‎const CART_STORAGE_KEY באותו scope גלובלי — הצהרה כפולה של const
   היא SyntaxError שמפילה את כל הקובץ. הערך זהה במכוון. */
const TH_CART_KEY = "dvirtech_cart_items_v1";

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2500;
/* בלי תקרה, fetch תקוע משאיר את הדף ב"מאמתים" לנצח. פסק זמן מוביל
   לניסיון חוזר ובסוף ל-"pending" — כלומר לכיוון הזהיר, לעולם לא
   להצלחה שגויה. */
const TH_TIMEOUT_MS = 12000;
const TH_WA_NUMBER = "972502000373";

/* מצב הדף. ‎detail מחזיק את הסיבה כפי שהשרת ניסח אותה. */
const TH = { state: "verifying", orderId: "", paymentId: "", amount: null, detail: "" };


/* ==================== עזרים ==================== */

function getParam(names){
  const qs = new URLSearchParams(window.location.search);
  for(const n of names){
    const v = qs.get(n);
    if(v) return v;
  }
  return "";
}

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

function thEl(id){ return document.getElementById(id); }

function thText(id, s){
  const el = thEl(id);
  if(el) el.textContent = s;
}

function thShow(id, on){
  const el = thEl(id);
  if(el) el.hidden = !on;
}

/* ⚠️ לתצוגה בלבד. המזהים מגיעים מה-URL, כלומר מקלט שאינו בשליטתנו:
   מסננים לתווים שמזהה אמיתי בנוי מהם (ORDER_PREFIX + base36) וחותכים
   באורך, כדי שערך זדוני או ארוך לא ישבור את הפריסה. הכתיבה ל-DOM היא
   ממילא textContent, ולכן אין כאן נתיב הזרקה גם בלי הסינון.
   ⚠️ **הבקשה לשרת נשלחת עם הערך הגולמי** — הסינון הזה הוא קוסמטי,
   ואסור שיזלוג לאימות עצמו. */
function thSafeId(v){
  return String(v == null ? "" : v).replace(/[^A-Za-z0-9._-]/g, "").slice(0, 40);
}


/* ==================== ניקוי העגלה ====================
   רץ **רק** אחרי אישור מהשרת. מנקה גם את האחסון וגם את המצב שבזיכרון
   של cart.js — בלי השני, מונה העגלה בהדר היה ממשיך להציג את הפריטים
   שזה עתה נקנו עד לרענון הדף. */
function clearCart(){
  try{ localStorage.removeItem(TH_CART_KEY); }catch(e){ /* storage unavailable */ }
  try{
    if(typeof cartItems !== "undefined" && Array.isArray(cartItems)) cartItems.length = 0;
    if(typeof renderCart === "function") renderCart();
  }catch(e){ /* cart.js לא נטען — האחסון כבר נוקה וזה מה שחשוב */ }
}


/* ==================== טקסטים לפי מצב ==================== */

function thHeadCopy(){
  switch(TH.state){
    /* ⚠️ הנוסח נכתב לפי בקשת דביר (20.08): לומר במפורש שהקבלה נשלחה
       למייל, כי SUMIT שולחים אותה אוטומטית והלקוח לא יודע לחפש אותה.
       ⚠️ "הקבלה" ולא "חשבונית" — עוסק פטור אינו מוציא חשבונית מס. */
    case "confirmed": return {
      title: tr("ההזמנה התקבלה בהצלחה! 🎉", "Your order is confirmed! 🎉"),
      sub:   tr("התשלום אומת מול חברת הסליקה. הקבלה ופרטי ההזמנה נשלחו לכתובת המייל שהזנת — מכאן זה עליי.",
                "The payment was verified with the provider. The receipt and order details were sent to the email you entered — I will take it from here.")
    };
    case "pending": return {
      title: tr("עוד לא הצלחנו לאמת את התשלום", "We could not confirm the payment yet"),
      sub:   tr("זה לא אומר שהתשלום נכשל — רק שהאישור עדיין לא חזר אלינו.",
                "This does not mean the payment failed — only that the confirmation has not reached us yet.")
    };
    case "failed": return {
      title: tr("התשלום לא אושר", "The payment was not approved"),
      sub:   tr("חברת הסליקה דחתה את העסקה, ולכן ההזמנה לא נקלטה.",
                "The payment provider declined the transaction, so the order was not placed.")
    };
    case "noorder": return {
      title: tr("אין כאן הזמנה להצגה", "No order to show here"),
      sub:   tr("הדף הזה מציג אישור להזמנה שהרגע שולמה, ולא הועבר אליו מזהה תשלום.",
                "This page shows the confirmation for an order that was just paid, and no payment reference was passed to it.")
    };
    default: return {
      title: tr("מאמתים את התשלום…", "Verifying your payment…"),
      sub:   tr("לא מסתמכים על מה שהדפדפן מדווח — בודקים ישירות מול חברת הסליקה שהתשלום באמת נקלט.",
                "We do not rely on what the browser reports — we are checking directly with the payment provider that the payment really went through.")
    };
  }
}

/* קישור הוואטסאפ. ההודעה מותאמת למצב, כי מה שהלקוח צריך לשאול שונה
   לגמרי בין "שילמתי, הכול טוב" לבין "שילמתי ולא קיבלתי אישור" —
   ובמצב השני המזהים הם בדיוק מה שמאפשר לאתר את התשלום. */
function thWaHref(){
  const id  = thSafeId(TH.orderId);
  const pid = thSafeId(TH.paymentId);
  let msg;

  if(TH.state === "confirmed"){
    msg = id
      ? tr("היי, שילמתי עכשיו באתר. מספר הזמנה: " + id, "Hi, I have just paid on the site. Order number: " + id)
      : tr("היי, שילמתי עכשיו באתר ואשמח לוודא שההזמנה נקלטה.",
           "Hi, I have just paid on the site and I would like to confirm the order came through.");
  } else if(TH.state === "noorder"){
    msg = tr("היי, אשמח לבדוק סטטוס של הזמנה שביצעתי באתר.",
             "Hi, I would like to check the status of an order I placed on the site.");
  } else {
    const ref = [
      id  ? tr("מספר הזמנה: ", "Order number: ") + id  : "",
      pid ? tr("מזהה תשלום: ", "Payment ref: ")   + pid : ""
    ].filter(Boolean).join(" · ");
    msg = tr("היי, ביצעתי תשלום באתר ולא קיבלתי אישור.", "Hi, I made a payment on the site and did not get a confirmation.");
    if(ref) msg += " " + ref;
  }

  return "https://wa.me/" + TH_WA_NUMBER + "?text=" + encodeURIComponent(msg);
}


/* ==================== רינדור ==================== */

function thRender(){
  /* ⚠️ שינוי המאפיין הזה הוא **כל** מנגנון החלפת המצב. ה-CSS מחליט מה
     מוצג; אין כאן הסתרה/הצגה ידנית של בלוקים. */
  const card = thEl("thxCard");
  if(card) card.dataset.thxState = TH.state;

  const copy = thHeadCopy();
  thText("thxTitle", copy.title);
  thText("thxSub", copy.sub);

  const id = thSafeId(TH.orderId);
  thShow("thxOrderChip", !!id);
  thText("thxOrderLabel", tr("מספר הזמנה", "Order number"));
  thText("thxOrderValue", id);

  /* ⚠️ הסכום מוצג **רק** כשהוא הגיע מתשובת השרת המאומתת, ולא מה-URL.
     ⚠️ עוסק פטור — DvirTech אינו גובה מע״מ, ולכן התווית היא "סכום
     ששולם" בלבד: אין כאן שורת מע״מ ואין ייחוס של רכיב מס לסכום. */
  const hasAmount = TH.state === "confirmed" && typeof TH.amount === "number" && isFinite(TH.amount) && TH.amount > 0;
  thShow("thxAmountChip", hasAmount);
  thText("thxAmountLabel", tr("סכום ששולם", "Amount paid"));
  thText("thxAmountValue", hasAmount ? TH.amount.toLocaleString() + " ₪" : "");

  /* הסיבה כפי שהשרת ניסח אותה. מוצגת כמות שהיא (dir="auto") ולא
     מתורגמת — עדיף ניסוח מקורי מדויק מאשר תרגום מומצא. */
  const hasDetail = TH.state === "failed" && !!TH.detail;
  thShow("thxDetail", hasDetail);
  thText("thxDetail", hasDetail ? TH.detail : "");

  const wa = thEl("thxWaBtn");
  if(wa) wa.href = thWaHref();

  const title = TH.state === "confirmed"
    ? tr("DvirTech — ההזמנה אושרה", "DvirTech — Order confirmed")
    : tr("DvirTech — תודה על ההזמנה", "DvirTech — Thank you for your order");
  if(document.title !== title) document.title = title;
}


/* ==================== שפה ==================== */

/* טקסט סטטי מתורגם הצהרתית ב-HTML (data-he / data-en), כמו ב-contact.js:
   להוסיף טקסט מתורגם = להוסיף שני מאפיינים ב-HTML, בלי לגעת כאן. */
function thApplyI18n(){
  document.querySelectorAll("[data-he]").forEach(el => {
    const v = el.getAttribute(LANG === "en" ? "data-en" : "data-he");
    if(v != null && el.textContent !== v) el.textContent = v;
  });
  // תיבת החיפוש בהדר נבנית ב-site-header.js עם data-ph-he/en
  document.querySelectorAll("[data-ph-he]").forEach(el => {
    const v = el.getAttribute(LANG === "en" ? "data-ph-en" : "data-ph-he");
    if(v != null && el.placeholder !== v) el.placeholder = v;
  });
  document.querySelectorAll(".lang-btn").forEach(b => b.classList.toggle("active", b.dataset.lang === LANG));
}

/* ‎buildSiteHeader נועל את עצמו עם ‎header.dataset.shBuilt כדי לא לבנות
   פעמיים באותה טעינה. בהחלפת שפה אנחנו *כן* רוצים בנייה שנייה — כל
   הטקסטים שם נוצרים דרך shTr לפי LANG ברגע הבנייה. */
function thRebuildHeader(){
  const header = document.querySelector("header");
  if(!header || typeof buildSiteHeader !== "function") return;
  delete header.dataset.shBuilt;
  const bar = header.querySelector(".headbar");
  if(bar) bar.innerHTML = "";
  buildSiteHeader();
}

/* כל דף באתר מגדיר setLang משלו שקורא ל-setLangCore ואז מרנדר את עצמו
   מחדש (ראו i18n.js). ⚠️ בלי ההגדרה הזו כפתורי "עברית / English"
   שה-header מייצר זורקים ReferenceError בכל לחיצה. */
function setLang(lang){
  if(lang === LANG) return;
  setLangCore(lang);
  thRebuildHeader();
  /* ⚠️ גם הפוטר. הוא נבנה ב-site-footer.js עם sfTr לפי LANG ברגע
     הבנייה ואין לו מאפייני data לעדכן, ולכן בלי בנייה מחדש הוא נשאר
     בשפה הקודמת. sfRender בונה מאפס ולכן בטוח לקריאה חוזרת. */
  if(typeof sfRender === "function"){ try{ sfRender(); }catch(e){} }
  thApplyI18n();
  thRender();
}


/* ==================== אימות מול השרת ==================== */

async function verifyOnce(paymentId, orderId){
  const url = `${WEBAPP_URL}?action=verifyPayment&paymentId=${encodeURIComponent(paymentId)}&orderId=${encodeURIComponent(orderId)}`;

  /* ⚠️ AbortController ולא AbortSignal.timeout — נתמך גם בדפדפנים
     ישנים יותר. הטיימר מנוקה בכל מקרה כדי לא להשאיר abort תלוי. */
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TH_TIMEOUT_MS);
  try{
    /* ⚠️ no-store: תשובת אימות שנשלפת מהמטמון היא תשובה על תשלום אחר
       או על רגע אחר. חייבים לשאול את השרת בכל ניסיון. */
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/* 🔴 **מסלול ביט — נוסף 23.08.**
   SUMIT מתעדת במפורש: *"פרמטרים לא יוחזרו כאשר התשלום מתבצע דרך
   Bit"*. כלומר הלקוח **כן** חוזר לדף הזה אחרי תשלום בביט, אבל בלי
   `og-paymentid` ובלי `og-externalidentifier`. הדף ראה "אין מזהה"
   והציג "לא נמצאה הזמנה" — בזמן שהכסף כבר ירד. בדיוק מה שקרה לדביר.

   ⚠️ **זו לא תקלה שאפשר לתקן בצד SUMIT** — זו התנהגות מתועדת.
   מה שכן אפשר: `checkout.js` שומר את מספר ההזמנה ב-localStorage
   **לפני** היציאה לדף התשלום, ומכאן מאמתים לפיו מול SUMIT.

   ⚠️ תוקף שעתיים. הזמנה ישנה שנשארה באחסון לא אמורה "לאמת את
   עצמה" בביקור אקראי בדף התודה חודש אחר כך. */
const TH_PENDING_MAX_MS = 2 * 60 * 60 * 1000;

function thPendingOrder(){
  try{
    const raw = localStorage.getItem("dvtPendingOrder");
    if(!raw) return "";
    const o = JSON.parse(raw);
    if(!o || !o.order) return "";
    if(Date.now() - Number(o.at || 0) > TH_PENDING_MAX_MS) return "";
    return String(o.order);
  }catch(e){ return ""; }
}

function thClearPending(){
  try{ localStorage.removeItem("dvtPendingOrder"); }catch(e){}
}

async function verifyByOrderOnce(orderId){
  const url = `${WEBAPP_URL}?action=verifyByOrder&orderId=${encodeURIComponent(orderId)}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try{
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    return await res.json();
  } finally { clearTimeout(timer); }
}

async function runVerification(){
  const paymentId = getParam(["OG-PaymentID", "og-paymentid", "PaymentID"]);
  const orderId   = getParam(["OG-ExternalIdentifier", "og-externalidentifier", "ExternalIdentifier"]);

  TH.paymentId = paymentId;
  TH.orderId   = orderId;
  thRender();

  /* אין מזהה תשלום — לפני שמוותרים, מנסים את מסלול ביט. */
  if(!paymentId){
    const pending = thPendingOrder();
    if(pending){
      TH.orderId = pending;
      thRender();
      /* ⚠️ הקבלה נוצרת ב-SUMIT כמה שניות אחרי התשלום, ולכן מנסים
         שוב ולא פעם אחת. אותו מספר ניסיונות כמו המסלול הרגיל. */
      for(let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++){
        try{
          const data = await verifyByOrderOnce(pending);
          if(data.ok && data.status === "paid"){
            clearCart();
            thClearPending();
            if(data.orderId) TH.orderId = data.orderId;
            TH.amount = (typeof data.amount === "number") ? data.amount : null;
            TH.state = "confirmed";
            thRender();
            return;
          }
        }catch(e){ /* ננסה שוב */ }
        if(attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS);
      }
      /* ⚠️ לא מציגים כישלון: ייתכן שהתשלום עבר והקבלה מתעכבת.
         סריקת ההשלמה היומית תתפוס אותו בכל מקרה. */
      TH.state = "pending";
      thRender();
      return;
    }
    /* באמת אין כלום — מי שהגיע לדף ישירות. זה **לא** שגיאה. */
    TH.state = "noorder";
    thRender();
    return;
  }

  for(let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++){
    try{
      const data = await verifyOnce(paymentId, orderId);

      if(data.ok && data.status === "paid"){
        clearCart();
        /* ⚠️ orderId מהתשובה גובר: הוא מה שהשרת באמת אימת. */
        if(data.orderId) TH.orderId = data.orderId;
        TH.amount = (typeof data.amount === "number") ? data.amount : null;
        TH.state = "confirmed";
        thRender();
        return;
      }
      if(data.ok === false && data.status === "failed"){
        TH.detail = data.error || "";
        TH.state = "failed";
        thRender();
        return;
      }
      // תוצאה לא חד-משמעית (למשל אימות עסוק/נכשל זמנית) — ננסה שוב אחרי השהיה קצרה
    }catch(e){ /* ננסה שוב */ }

    if(attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS);
  }

  /* אחרי כמה ניסיונות בלי תשובה חד-משמעית: לא מציגים כישלון סופי ולא
     מציגים הצלחה. התשלום, אם נקלט, קיים ומתועד אצל SUMIT וניתן לבדוק
     אותו שם — ולכן ההנחיה ללקוח היא "אל תשלם שוב, כתוב לי". */
  TH.state = "pending";
  thRender();
}


/* ==================== הפעלה ==================== */

function thStart(){
  thApplyI18n();
  thRender();
  runVerification();
}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", thStart);
}else{
  thStart();
}

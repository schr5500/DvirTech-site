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

   ⚠️ WEBAPP_URL חייב להיות זהה למה שהוגדר ב-checkout.js (PAYMENT_API_URL).
===================================================================== */

const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwuW5tgiRDhoIEFNkHHWgkVot6FyHFEUBa1mx41ck1lp74ChzT8pciMV9qaI0NcDw-sKA/exec";
const CART_STORAGE_KEY = "dvirtech_cart_items_v1";
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2500;

function getParam(names){
  const qs = new URLSearchParams(window.location.search);
  for(const n of names){
    const v = qs.get(n);
    if(v) return v;
  }
  return "";
}

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

function showState(id){
  ["loadingState","paidState","pendingState","errorState"].forEach(s =>
    document.getElementById(s).style.display = (s === id) ? "block" : "none");
}

function clearCart(){
  try{ localStorage.removeItem(CART_STORAGE_KEY); }catch(e){ /* storage unavailable */ }
}

async function verifyOnce(paymentId, orderId){
  const url = `${WEBAPP_URL}?action=verifyPayment&paymentId=${encodeURIComponent(paymentId)}&orderId=${encodeURIComponent(orderId)}`;
  const res = await fetch(url);
  return res.json();
}

async function runVerification(){
  const paymentId = getParam(["OG-PaymentID", "og-paymentid", "PaymentID"]);
  const orderId   = getParam(["OG-ExternalIdentifier", "og-externalidentifier", "ExternalIdentifier"]);

  if(!paymentId){
    showState("errorState");
    document.getElementById("errorText").textContent = "לא התקבל מזהה תשלום בקישור.";
    return;
  }

  for(let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++){
    try{
      const data = await verifyOnce(paymentId, orderId);

      if(data.ok && data.status === "paid"){
        clearCart();
        showState("paidState");
        return;
      }
      if(data.ok === false && data.status === "failed"){
        showState("errorState");
        document.getElementById("errorText").textContent = data.error || "התשלום לא אושר.";
        return;
      }
      // תוצאה לא חד-משמעית (למשל אימות עסוק/נכשל זמנית) — ננסה שוב אחרי השהיה קצרה
    }catch(e){ /* ננסה שוב */ }

    if(attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS);
  }

  // אחרי כמה ניסיונות בלי תשובה חד-משמעית: לא מציגים כישלון סופי — יש עדיין
  // את הטריגר המתוזמן (reconcile, כל 15 דק') כרשת ביטחון שתסגור את זה בסוף.
  showState("pendingState");
  document.getElementById("pendingText").textContent =
    "התשלום בתהליך אימות מול SUMIT. אם שולם בפועל, ההזמנה תסומן בקרוב אוטומטית — " +
    "אין צורך לשלם שוב. אם אחרי כמה דקות עדיין לא קיבלת אישור, צרו קשר.";
}

runVerification();

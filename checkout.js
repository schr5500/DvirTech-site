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

function readCartFromStorage(){
  try{
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
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
        <div>${i.name}${i.qty>1?` × ${i.qty}`:""}</div>
        ${i.noteLines && i.noteLines.length ? `<div class="cart-item-note">${i.noteLines.join("<br>")}</div>` : ""}
      </span>
      <span class="v">${i.price===0 ? t("included") : (i.price*i.qty).toLocaleString()+" ₪"}</span>
    </li>`).join("");
  cartSubtotal = cartTotalOf(items);
  document.getElementById("checkoutTotalPrice").textContent = cartSubtotal.toLocaleString() + " ₪";
  renderCheckoutTotals();
}

function renderCheckoutTotals(){
  const count = parseInt(document.getElementById("installmentsCount").value, 10) || 1;
  const pct = installmentFeePct(count);
  const fee = Math.round(cartSubtotal * (pct / 100) * 100) / 100;
  const grandTotal = Math.round((cartSubtotal + fee) * 100) / 100;

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
        installments: installments
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

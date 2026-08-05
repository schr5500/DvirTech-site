/* =====================================================================
   DvirTech — דף התשלום (pay.html)
   =====================================================================
   ⚠️ WEBAPP_URL חייב להיות מוחלף בכתובת ה-exec האמיתית של ה-Web App
   שנפרס מתוך 3-payment-webapp.gs (Deploy → New deployment → Web app).
   בלי זה הדף לא יכול לטעון הזמנות או לחייב בפועל.
===================================================================== */

const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbz67BSA9hTQKCStNWi3R1XxV1Nuj0S6bKZWlEz7aPRyi6Th-dRS8omz5QSVcK4Nm6X6/exec";

let ORDER = null;
let selectedPaymentType = "regular";

function getOrderIdFromUrl(){
  return new URLSearchParams(window.location.search).get("order") || "";
}

async function loadOrder(){
  const orderId = getOrderIdFromUrl();
  if(!orderId){ showError("לא צוין מזהה הזמנה בקישור."); return; }

  try{
    const res = await fetch(`${WEBAPP_URL}?action=getOrder&id=${encodeURIComponent(orderId)}`);
    const data = await res.json();
    if(!data.success){ showError(data.error || "לא ניתן לטעון את ההזמנה."); return; }
    ORDER = data;
    renderOrder();
  }catch(e){
    showError("שגיאת תקשורת בטעינת ההזמנה. נסה שוב או פנה ל-DvirTech.");
  }
}

function showError(msg){
  document.getElementById("loadingState").style.display = "none";
  document.getElementById("errorState").style.display = "block";
  document.getElementById("errorText").textContent = msg;
}

function renderOrder(){
  document.getElementById("loadingState").style.display = "none";
  document.getElementById("payContent").style.display = "block";

  document.getElementById("payClientLine").textContent = `שלום ${ORDER.clientName}, הנה סיכום התשלום שלך:`;
  document.getElementById("descValue").textContent = ORDER.description;
  document.getElementById("baseAmountValue").textContent = fmt(ORDER.baseAmount) + " ₪";

  document.getElementById("regularFeeLabel").textContent = `+${ORDER.feePctRegular}% עמלה`;
  document.getElementById("installmentsFeeLabel").textContent = `+${ORDER.feePctInstallments}% עמלה`;

  renderTotals();
}

function selectPaymentType(type){
  selectedPaymentType = type;
  document.getElementById("optRegular").classList.toggle("selected", type === "regular");
  document.getElementById("optInstallments").classList.toggle("selected", type === "installments");
  document.getElementById("installmentsCountWrap").style.display = type === "installments" ? "block" : "none";
  renderTotals();
}

function renderTotals(){
  if(!ORDER) return;
  const pct = selectedPaymentType === "installments" ? ORDER.feePctInstallments : ORDER.feePctRegular;
  const fee = Math.round(ORDER.baseAmount * (pct / 100) * 100) / 100;
  const total = Math.round((ORDER.baseAmount + fee) * 100) / 100;

  document.getElementById("feeLabel").textContent = `עמלת חברת אשראי (${pct}%)`;
  document.getElementById("feeValue").textContent = fmt(fee) + " ₪";
  document.getElementById("totalValue").textContent = fmt(total) + " ₪";
}

function fmt(n){ return Number(n).toLocaleString("he-IL", {maximumFractionDigits:2}); }

async function startCharge(){
  const btn = document.getElementById("continueBtn");
  const errBox = document.getElementById("chargeError");
  errBox.style.display = "none";
  btn.disabled = true;
  btn.textContent = "מעבד...";

  const installments = selectedPaymentType === "installments" ? document.getElementById("installmentsCount").value : "";
  const orderId = getOrderIdFromUrl();

  try{
    const url = `${WEBAPP_URL}?action=charge&id=${encodeURIComponent(orderId)}&paymentType=${selectedPaymentType}&installments=${encodeURIComponent(installments)}`;
    const res = await fetch(url);
    const data = await res.json();
    if(!data.success){
      errBox.textContent = data.error || "משהו השתבש. נסה שוב או פנה ל-DvirTech.";
      errBox.style.display = "block";
      btn.disabled = false;
      btn.textContent = "המשך לתשלום מאובטח";
      return;
    }
    if(data.docUrl){
      window.location.href = data.docUrl; // מעבר לדף התשלום המאובטח של Sumit
    }else{
      errBox.textContent = "הדרישה הופקה אבל לא חזר קישור תשלום. פנה ל-DvirTech בוואטסאפ.";
      errBox.style.display = "block";
      btn.disabled = false;
      btn.textContent = "המשך לתשלום מאובטח";
    }
  }catch(e){
    errBox.textContent = "שגיאת תקשורת. נסה שוב או פנה ל-DvirTech.";
    errBox.style.display = "block";
    btn.disabled = false;
    btn.textContent = "המשך לתשלום מאובטח";
  }
}

loadOrder();

/* =====================================================================
   DvirTech — ביטול עסקה (cancel.html)
   =====================================================================
   🔴 הדף הזה הוא חובה לפי תקנות הגנת הצרכן (ביטול עסקה). ראה ההערה
   המלאה בראש cancel.html — שם גם שלושת הכללים שאסור לשבור.

   ⚠️ **הטופס לא מבטל כלום.** הוא מתעד בקשה, שולח התראה לדביר,
   ומחזיר ללקוח חותמת זמן. הביטול הכספי נעשה ידנית מול SUMIT.
   ===================================================================== */

/* אותה כתובת ואותה שיטה כמו checkout.js — `text/plain` נמנע מ-preflight
   של CORS, ש-Apps Script לא יודע לענות עליו. */
const CXL_API = "https://script.google.com/macros/s/AKfycbwuW5tgiRDhoIEFNkHHWgkVot6FyHFEUBa1mx41ck1lp74ChzT8pciMV9qaI0NcDw-sKA/exec";

function cxlTr(he, en){
  const lang = (document.documentElement.lang || "he");
  return lang === "en" ? en : he;
}

/* i18n פשוט לדף הזה: data-he/data-en על טקסט, data-ph-he/en על placeholder. */
function cxlApplyLang(){
  const en = (document.documentElement.lang === "en");
  document.querySelectorAll("[data-he]").forEach(function(el){
    const v = el.getAttribute(en ? "data-en" : "data-he");
    if(v) el.textContent = v;
  });
  document.querySelectorAll("[data-ph-he]").forEach(function(el){
    const v = el.getAttribute(en ? "data-ph-en" : "data-ph-he");
    if(v) el.setAttribute("placeholder", v);
  });
}

function cxlShowError(msg){
  const box = document.getElementById("cxlErr");
  box.textContent = msg;
  box.style.display = "block";
}

function cxlSubmit(){
  const btn  = document.getElementById("cxlSend");
  const name = document.getElementById("cxlName").value.trim();
  const phone= document.getElementById("cxlPhone").value.trim();
  const email= document.getElementById("cxlEmail").value.trim();
  const order= document.getElementById("cxlOrder").value.trim();
  const reason = document.getElementById("cxlReason").value.trim();

  document.getElementById("cxlErr").style.display = "none";

  /* ⚠️ **רק שתי בדיקות, ובכוונה.** כל ולידציה נוספת כאן היא מכשול
     בדרך לביטול — בדיוק מה שהתקנות באות למנוע. אין בדיקת פורמט על
     מספר ההזמנה ואין חובה למלא סיבה. */
  if(!name){
    cxlShowError(cxlTr("צריך למלא שם.", "Please enter your name."));
    document.getElementById("cxlName").focus();
    return;
  }
  if(!phone && !email){
    cxlShowError(cxlTr("צריך טלפון או דוא״ל, כדי שנוכל לחזור אליך.",
                       "Please provide a phone or an email so we can get back to you."));
    document.getElementById("cxlPhone").focus();
    return;
  }
  /* ⚠️ מספר ההזמנה נדרש כדי לאתר את השורה ב-CRM, אבל ההודעה
     **מציעה מוצא** במקום לחסום. ביטול לא ייעצר בגלל מספר שאבד. */
  if(!order){
    cxlShowError(cxlTr(
      "צריך מספר הזמנה כדי שנאתר אותה. לא מצאת? כתוב \u201cלא ידוע\u201d ונחפש לפי הפרטים.",
      "We need an order number to locate it. Can't find it? Write \u201cunknown\u201d and we'll search by your details."));
    document.getElementById("cxlOrder").focus();
    return;
  }

  btn.disabled = true;
  btn.textContent = cxlTr("שולח…", "Sending…");

  fetch(CXL_API + "?action=cancelRequest", {
    method: "POST",
    /* ⚠️ text/plain במתכוון — ראה ההערה למעלה. */
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ name, phone, email, order, reason })
  })
  .then(r => r.json())
  .then(res => {
    if(!res || !res.ok) throw new Error((res && res.error) || "failed");
    document.getElementById("cxlRef").textContent = res.ref || "—";
    document.getElementById("cxlAt").textContent =
      cxlTr("התקבל בתאריך ", "Received on ") + (res.at || "");

    /* 🔴 **ההזמנה לא אותרה — ליידע, לא להסתיר.**
       הבקשה נרשמה ותקפה, אבל בלי מספר הזמנה תואם היא דורשת איתור
       ידני. לקוח שלא יודע את זה מניח שהכל טופל וממתין לשווא.
       ⚠️ הניסוח נמנע מהאשמה ("לא הצלחנו לאתר" ולא "הזנת מספר שגוי")
       — ייתכן מאוד שההזמנה קיימת ורק המספר הוקלד אחרת. */
    const warn = document.getElementById("cxlNotFound");
    if (warn && res.found === false) {
      warn.innerHTML = cxlTr(
        res.noOrder
          ? "לא צוין מספר הזמנה, ולכן נאתר אותה לפי הפרטים שמסרת. כדי לזרז — "
          : "הבקשה נרשמה, אבל <b>לא הצלחנו לאתר הזמנה עם המספר הזה</b>. הביטול תקף ממועד הפנייה; כדי שנטפל מהר — ",
        res.noOrder
          ? "No order number was given, so we'll locate it from your details. To speed things up — "
          : "Your request is recorded, but <b>we couldn't find an order with that number</b>. The cancellation is valid from the moment you contacted us; to handle it faster — ") +
        '<a href="https://wa.me/972502000373?text=' +
        encodeURIComponent(cxlTr(
          "שלום, הגשתי בקשת ביטול " + (res.ref || "") + " ולא אותרה ההזמנה שלי.",
          "Hi, I submitted cancellation request " + (res.ref || "") + " and my order wasn't found.")) +
        '" target="_blank" rel="noopener">' +
        cxlTr("שלח לנו הודעה בוואטסאפ", "message us on WhatsApp") + "</a>";
      warn.style.display = "block";
    }

    document.getElementById("cxlForm").style.display = "none";
    document.getElementById("cxlDone").style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  })
  .catch(() => {
    /* 🔴 **כישלון רשת לא משאיר את הלקוח בלי דרך לבטל.** זכות הביטול
       לא תלויה בזמינות השרת שלנו, ולכן ההודעה נותנת מיד שני ערוצים
       חלופיים — ולא רק "נסה שוב מאוחר יותר". */
    cxlShowError(cxlTr(
      "השליחה נכשלה. אפשר לשלוח את הבקשה גם בוואטסאפ 050-200-0373 או במייל schr5500@gmail.com — הביטול תקף מרגע הפנייה.",
      "Sending failed. You can also send the request via WhatsApp 050-200-0373 or email schr5500@gmail.com — the cancellation is valid from the moment you contact us."));
    btn.disabled = false;
    btn.textContent = cxlTr("שליחת בקשת ביטול", "Submit cancellation request");
  });
}

document.addEventListener("DOMContentLoaded", function(){
  cxlApplyLang();
  const btn = document.getElementById("cxlSend");
  if(btn) btn.addEventListener("click", cxlSubmit);

  /* מילוי מוקדם ממספר הזמנה בכתובת: cancel.html?order=DVT-4532
     ⚠️ נוח, אבל לא נדרש — הדף עובד גם בלי שום פרמטר. */
  try{
    const p = new URLSearchParams(location.search);
    const o = p.get("order");
    if(o) document.getElementById("cxlOrder").value = o;
  }catch(e){}
});

/* =====================================================================
   DvirTech — טעינת CATALOG חי (builder.html בלבד)
   =====================================================================
   מחליף את catalog.js הסטטי הישן: שולף את כל קטגוריות הבונה (מעבד/לוח
   אם/זיכרון/וכו') מ-4-payment-api.gs (action=getCatalog), שקורא אותן
   ישירות מהגיליון הפרטי של הספקים. שום מחיר/עלות לא מוזן/מועתק ידנית
   יותר — הגיליון הוא מקור האמת היחיד, גם לתצוגה כאן וגם לתמחור בפועל
   ב-createPayment (4-payment-api.gs).

   ⚠️ PAYMENT_API_URL חייב להיות זהה בדיוק למה שמוגדר ב-checkout.js.
   ⚠️ CATALOG כאן הוא let, לא const — מאותחל רק אחרי שהתשובה מגיעה.
   כל שאר app.js/cart.js לא רצים לפני שזה קורה (ראה קריאת האתחול בתחתית).
===================================================================== */

const PAYMENT_API_URL = "https://script.google.com/macros/s/AKfycbwuW5tgiRDhoIEFNkHHWgkVot6FyHFEUBa1mx41ck1lp74ChzT8pciMV9qaI0NcDw-sKA/exec";

// סדר קבוע של שלבי הבונה — לא נתוני מוצר, אז לא תלוי בגיליון בכלל
// (בניגוד ל-CATALOG עצמו). היה מוגדר קודם בתוך catalog.js הסטטי שהוסר.
const STEP_ORDER = ["cpu","mobo","ram","gpu","cooling","storage","psu","case","services"];

let CATALOG = null;

async function loadCatalogAndInit(){
  try{
    const res = await fetch(PAYMENT_API_URL + "?action=getCatalog");
    const data = await res.json();
    if(!data.ok || !data.catalog) throw new Error(data.error || "getCatalog failed");
    CATALOG = data.catalog;
  }catch(e){
    document.getElementById("stepsContainer").innerHTML =
      `<div class="panel"><div class="lock-msg">${tr(
        "לא הצלחנו לטעון את הקטלוג כרגע. רענן/י את הדף או נסה/י שוב בעוד רגע.",
        "Couldn't load the catalog right now. Please refresh or try again in a moment.")}</div></div>`;
    console.error("loadCatalogAndInit failed:", e);
    return;
  }

  renderStaticText();
  renderSteps();
  renderContextPicker();
}

loadCatalogAndInit();

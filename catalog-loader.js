/* =====================================================================
   DvirTech — טעינת CATALOG לבונה המחשבים (builder.html בלבד)
   =====================================================================
   ⚠️ שינוי חשוב: הקובץ הזה *כבר לא* עושה fetch משלו.

   קודם הוא קרא ל-getCatalog בעצמו, לגמרי במקביל ל-search-core.js —
   ולכן הבונה שילם 6-8 שניות המתנה בכל כניסה, בזמן ששאר הדפים כבר
   נטענו מיידית מהמטמון. גרוע מזה: שתי הבקשות יכלו לחזור עם תמונת
   מצב שונה של הגיליון, כך שהבונה והקטלוג הציגו נתונים שאינם זהים.

   עכשיו שניהם שולפים מ-dvtGetCatalog() ב-search-core.js: בקשה אחת,
   מטמון אחד ב-localStorage, ורענון רקע משותף. הבונה נפתח מיידית
   כמו כל דף אחר, ומציג בדיוק את אותם מוצרים כמו דף המוצרים.

   ⚠️ CATALOG הוא let ולא const — מאותחל רק אחרי שהנתונים מגיעים.
===================================================================== */

// סדר קבוע של שלבי הבונה — לא נתוני מוצר, ולכן לא תלוי בגיליון.
const STEP_ORDER = ["cpu","mobo","ram","gpu","cooling","storage","psu","case","services"];

let CATALOG = null;

async function loadCatalogAndInit(){
  try{
    CATALOG = await dvtGetCatalog();
    if(!CATALOG) throw new Error("empty catalog");
  }catch(e){
    const box = document.getElementById("stepsContainer");
    if(box){
      box.innerHTML = `<div class="panel"><div class="lock-msg">${tr(
        "לא הצלחנו לטעון את הקטלוג כרגע. רענן/י את הדף או נסה/י שוב בעוד רגע.",
        "Couldn't load the catalog right now. Please refresh or try again in a moment.")}</div></div>`;
    }
    console.error("loadCatalogAndInit failed:", e);
    return;
  }

  renderStaticText();
  renderSteps();
  renderContextPicker();

  // אם הרענון ברקע גילה שינוי אמיתי בגיליון, מרעננים את הבונה —
  // בלי לאבד את מה שהלקוח כבר בחר (renderSteps קורא מ-selections).
  if(typeof dvtOnCatalogRefresh === "function"){
    dvtOnCatalogRefresh(fresh => {
      CATALOG = fresh;
      renderSteps();
      renderContextPicker();
      if(typeof renderSummary === "function") renderSummary();
    });
  }
}

loadCatalogAndInit();

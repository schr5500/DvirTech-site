/* =====================================================================
   DvirTech — חיבור דף צור קשר לאתר (contact-bridge.js)
   =====================================================================
   העיצוב לא משתנה. הקובץ הזה מתקן רק תפעול:

   1. ‎mailto: → חלון כתיבה ב-Gmail.
      ⚠️ זה לא שינוי סגנוני אלא באג אמיתי: בלי תוכנת דואר מוגדרת
      בווינדוס (המצב אצל רוב משתמשי Gmail) לחיצה על הקישור פשוט לא
      עושה כלום — וזו בדיוק הייתה התלונה על הכפתור הקודם.
   2. לחיצה על הטלפון/המייל מעתיקה אותם ללוח, עם משוב קצר.

   רץ אחרי שהרכיב מצייר את עצמו, ושוב בכל שינוי (הרכיב מרנדר מחדש
   בכל אינטראקציה, ולכן משגיחים על ה-DOM במקום לרוץ פעם אחת).
===================================================================== */

(() => {
  const EMAIL = "schr5500@gmail.com";
  const GMAIL = "https://mail.google.com/mail/?view=cm&fs=1&to=" + encodeURIComponent(EMAIL);

  function flash(el, text){
    const prev = el.getAttribute("data-flash-prev");
    if(prev !== null) return;                       // כבר באמצע הודעה
    el.setAttribute("data-flash-prev", el.textContent);
    el.textContent = text;
    setTimeout(() => {
      const back = el.getAttribute("data-flash-prev");
      if(back !== null){ el.textContent = back; el.removeAttribute("data-flash-prev"); }
    }, 1500);
  }

  async function copy(value, el){
    try{
      await navigator.clipboard.writeText(value);
      if(el) flash(el, "הועתק ✓");
      return true;
    }catch(e){ return false; }
  }

  function patch(){
    // 1) כל קישור mailto → Gmail
    document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
      a.href = GMAIL;
      a.target = "_blank";
      a.rel = "noopener";
      a.dataset.dvtMailFixed = "1";
    });

    // 2) העתקה בלחיצה על טקסט הטלפון/המייל (בלי לשנות עיצוב)
    document.querySelectorAll("*").forEach(el => {
      if(el.children.length || el.dataset.dvtCopy) return;
      const t = (el.textContent || "").trim();
      if(t === EMAIL || t === "050-200-0373"){
        el.dataset.dvtCopy = "1";
        el.style.cursor = "pointer";
        el.title = "לחצו להעתקה";
        el.addEventListener("click", ev => { ev.preventDefault(); copy(t, el); });
      }
    });
  }

  const run = () => { try{ patch(); }catch(e){} };
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(run, 0));
  else setTimeout(run, 0);
  // הרכיב מרנדר מחדש בכל אינטראקציה — משגיחים ומתקנים שוב.
  new MutationObserver(run).observe(document.documentElement, { childList:true, subtree:true });
})();

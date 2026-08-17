/* =====================================================================
   DvirTech — עמוד צור קשר (contact.html)
   =====================================================================
   ⚠️⚠️ הקובץ הזה נכתב מחדש. הגרסה הקודמת דיברה עם דף "צור קשר" *הישן*
   (contact-OLD-backup.html) לפי מזהים כמו pageTitle / phoneLabel /
   emailBtn, ואף אחד מהם לא קיים בעיצוב הנוכחי — ולכן היא גם לא נטענה
   מ-contact.html בכלל. התוצאה הייתה שמתג "עברית / English" בהדר קרא
   ל-‎setLang()‎ שפשוט לא היה מוגדר בדף הזה: כל לחיצה זרקה ReferenceError
   לקונסול ולא עשתה כלום. זו הייתה התלונה "הכתוב של עברית/אנגלית לא עובד".

   הדף עצמו הוא ייצוא DesignCode (‎<x-dc>) עם טקסט עברי כתוב בתוך ה-HTML,
   ולא רשימת מזהים שאפשר למלא. לכן התרגום כאן הוא **הצהרתי**: כל אלמנט
   נושא ‎data-he / data-en (או ‎data-he-html / data-en-html כשיש בפנים
   ‎<br>), והפונקציה כאן רק מחליפה ביניהם. להוסיף טקסט מתורגם = להוסיף
   שני מאפיינים ב-HTML, בלי לגעת בקובץ הזה.

   ⚠️ הרכיב מרנדר את עצמו מחדש בכל אינטראקציה (למשל לחיצה על "העתק"),
   ומחזיר את הטקסט לעברית שבתבנית. לכן יש MutationObserver שמחיל שוב —
   בדיוק מאותה סיבה שיש אחד ב-contact-bridge.js.

   ⚠️ חייב להיטען *לפני* cart.js: ‎hookCartIntoLangSwitch שם עוטף את
   ‎window.setLang כדי לרענן גם את טקסטי העגלה, ואם setLang עוד לא
   מוגדר הוא פשוט מוותר בשקט.
===================================================================== */

/* ==================== החלת השפה על הדף ==================== */
function contactApplyI18n(){
  // טקסט פשוט. ההשוואה לפני ההשמה מונעת לולאה מול ה-MutationObserver
  // (כתיבה → מוטציה → כתיבה) וגם חוסכת ריצוף מיותר של הדף.
  document.querySelectorAll("[data-he]").forEach(el => {
    const v = el.getAttribute(LANG === "en" ? "data-en" : "data-he");
    if(v != null && el.textContent !== v) el.textContent = v;
  });

  /* ⚠️ innerHTML ולא textContent — ורק כאן. שורות "שעות פעילות" ו"אזור
     שירות" מופרדות ב-‎<br>, ו-textContent היה מדביק אותן לשורה אחת.
     הערכים מגיעים מהמאפיינים שאנחנו עצמנו כתבנו ב-contact.html ולא
     מקלט משתמש או מהגיליון, ולכן אין כאן נתיב הזרקה.

     ⚠️⚠️ הסימון ‎data-dvt-lang ולא השוואת מחרוזות כמו במסלול הטקסט.
     ‎innerHTML לא עושה הלוך-חזור נאמן: המאפיין ‎data-en-html מכיל
     ‎"Sat &amp; holidays" — כלומר הערך *אחרי הפענוח* הוא ‎"Sat & holidays",
     אבל קריאת ‎innerHTML חזרה מקודדת את הסימן שוב ל-‎&amp;. שתי
     המחרוזות לעולם לא זהות, ‎if היה תמיד אמת, כל ריצה הייתה כותבת שוב,
     כל כתיבה מעירה את המשגיח — והלשונית נתקעה בלולאה אינסופית בדיוק
     ברגע המעבר לאנגלית. הסימון הוא מאפיין (לא ‎childList) ולכן הוא
     בעצמו לא מעיר את המשגיח, וההשוואה עליו יציבה. אלמנט שהרכיב מצייר
     מחדש מגיע בלי הסימון ולכן מתורגם שוב, כמצופה. */
  document.querySelectorAll("[data-he-html]").forEach(el => {
    if(el.getAttribute("data-dvt-lang") === LANG) return;
    const v = el.getAttribute(LANG === "en" ? "data-en-html" : "data-he-html");
    if(v == null) return;
    el.innerHTML = v;
    el.setAttribute("data-dvt-lang", LANG);
  });

  // תיבת החיפוש בהדר נבנית ב-site-header.js עם data-ph-he/en
  document.querySelectorAll("[data-ph-he]").forEach(el => {
    const v = el.getAttribute(LANG === "en" ? "data-ph-en" : "data-ph-he");
    if(v != null && el.placeholder !== v) el.placeholder = v;
  });

  /* ⚠️ עטיפת התוכן של הייצוא נושאת ‎dir="rtl" קשיח. ‎setLangCore מחליף
     את ה-dir על ‎<html>‎ בלבד, וה-rtl הפנימי היה מנצח אותו — כלומר
     באנגלית כל הדף היה נשאר מיושר לימין. */
  document.querySelectorAll("[data-dvt-dir]").forEach(el => {
    el.setAttribute("dir", LANG === "he" ? "rtl" : "ltr");
  });

  /* ⚠️⚠️ ההשוואה לפני ההשמה כאן היא **חובה ולא ייעול**. ‎document.title = x
     מוגדר כ"קבע את תוכן הטקסט של ‎<title>", וקביעת תוכן טקסט מחליפה את
     צומת הטקסט בחדש — גם כשהמחרוזת זהה לחלוטין. כלומר כל השמה היא
     מוטציית childList, המשגיח שלמטה מתעורר, קורא שוב לפונקציה הזו,
     והיא משמה שוב: לולאה אינסופית סינכרונית שמקפיאה את הלשונית.
     ⚠️ מאותה סיבה המשגיח מאזין ל-document.body ולא ל-documentElement,
     כך ש-‎<head>‎ בכלל לא בטווח ההאזנה. שתי ההגנות במכוון. */
  const title = tr("DvirTech — צור קשר", "DvirTech — Contact");
  if(document.title !== title) document.title = title;

  document.querySelectorAll(".lang-btn").forEach(b => b.classList.toggle("active", b.dataset.lang === LANG));
}

/* ==================== בנייה מחדש של ההדר ====================
   ‎buildSiteHeader נועל את עצמו עם ‎header.dataset.shBuilt כדי לא לבנות
   פעמיים באותה טעינה. בהחלפת שפה אנחנו *כן* רוצים בנייה שנייה — כל
   הטקסטים שם (ניווט, "מוצרים", תוויות העגלה) נוצרים דרך shTr לפי LANG
   ברגע הבנייה, ואין להם מאפייני data לעדכן. */
function contactRebuildHeader(){
  const header = document.querySelector("header");
  if(!header || typeof buildSiteHeader !== "function") return;
  delete header.dataset.shBuilt;
  const bar = header.querySelector(".headbar");
  if(bar) bar.innerHTML = "";
  buildSiteHeader();
}

/* ==================== מתג השפה ====================
   כל דף באתר מגדיר ‎setLang משלו שקורא ל-setLangCore ואז מרנדר את עצמו
   מחדש (ראו i18n.js). זו הגרסה של דף צור קשר. */
function setLang(lang){
  if(lang === LANG) return;
  setLangCore(lang);
  contactRebuildHeader();
  contactApplyI18n();
}

/* ==================== הפעלה ====================
   רץ פעם אחת אחרי הציור הראשון, ושוב בכל רינדור של הרכיב. כל מסלול
   בתוך contactApplyI18n אידמפוטנטי — ריצה שנייה בלי שינוי אמיתי לא
   כותבת כלום — ולכן מותר לחבר אותו למשגיח. */
(() => {
  /* ⚠️ נעילת כניסה חוזרת: contactApplyI18n כותבת ל-DOM, והכתיבות האלה
     הן עצמן מוטציות שמעירות את המשגיח. הדגל מוודא שקריאה שנולדה מתוך
     ריצה קיימת לא פותחת ריצה חדשה מקוננת. */
  let running = false;

  /* ⚠️ שסתום ביטחון. הלולאה שקרתה כאן פעם אחת (ראו ההערה על
     ‎data-dvt-lang) הקפיאה את הלשונית לגמרי — בלי מסך, בלי גלילה, בלי
     דרך לצאת. כל תרגום חדש שיתווסף בעתיד ולא יהיה אידמפוטנטי יחזיר
     בדיוק את אותו מצב. במקום להסתמך על כך שלא נטעה שוב: אם המשגיח
     עורר ריצה יותר מ-200 פעם בשנייה, מדובר בלולאה ולא בשימוש אמיתי —
     מנתקים אותו ומשאירים הודעה בקונסול. הדף נשאר מתפקד; מה שנפגע הוא
     רק החלת התרגום מחדש אחרי רינדור של הרכיב. */
  let hits = 0, windowStart = 0, observer = null;
  const runaway = () => {
    const now = Date.now();
    if(now - windowStart > 1000){ windowStart = now; hits = 0; }
    return ++hits > 200;
  };

  const run = () => {
    if(running) return;
    if(observer && runaway()){
      observer.disconnect();
      console.warn("contact.js: זוהתה לולאת תרגום — המשגיח נותק. בדוק ערך data-*-html שלא עובר הלוך-חזור זהה.");
      return;
    }
    running = true;
    try{ contactApplyI18n(); }catch(e){}
    finally{ running = false; }
  };
  const start = () => {
    run();
    // ⚠️ body ולא documentElement — ראו ההערה על document.title למעלה.
    observer = new MutationObserver(run);
    observer.observe(document.body, { childList: true, subtree: true });
  };
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(start, 0));
  else setTimeout(start, 0);
})();

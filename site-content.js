/* =====================================================================
   DvirTech — מקור אמת אחד לכל פיסות המידע שחוזרות באתר
   =====================================================================
   ⚠️ **למה הקובץ הזה קיים.** אותה עובדה הופיעה בארבעה קבצים שונים
   וקיבלה ארבע תשובות: דף הבית אמר "משלוח 2-5 ימי עסקים", דף צור קשר
   אמר "1-3", ודף המוצר אמר משהו שלישי. לקוח שרואה שני מספרים שונים
   באותו אתר מפסיק להאמין לשניהם.

   מעכשיו כל טקסט כזה נמצא **כאן בלבד**, וכל דף קורא ממנו. שינוי אחד
   משנה את כל האתר.

   ---------------------------------------------------------------------
   ⚠️ מה **אסור** לכתוב כאן
   ---------------------------------------------------------------------
   הבטחה גורפת שאי אפשר לעמוד בה. "עד 3 שנות אחריות" הופיע בבונה ובדף
   צור קשר — והוא **לא נכון**: האחריות משתנה ממוצר למוצר, והיא נשלפת
   מהספק לעמודה `warranty` ומוצגת בדף המוצר. משפט גורף כזה הוא הצהרה
   שיווקית שסותרת את הנתון האמיתי שמוצג במקום אחר באותו אתר.

   ---------------------------------------------------------------------
   המשך אפשרי: להעביר את זה לגיליון
   ---------------------------------------------------------------------
   דביר ביקש שהמידע יגיע מהגיליון כדי שיוכל לשנות בלי לגעת בקוד. זה
   אפשרי ופשוט **דווקא בגלל שהכול מרוכז כאן**: לשונית "תוכן האתר" עם
   שתי עמודות (מפתח · טקסט), ו-getCatalog מחזיר אותה כאובייקט שדורס
   את ברירות המחדל למטה. עד שזה ייבנה — משנים כאן.
   ⚠️ ברירות המחדל כאן חייבות להישאר גם אחרי המעבר לגיליון: הן מה
   שמוצג אם הגיליון לא נגיש.
===================================================================== */

const DVT_CONTENT = {
  /* ---------- משלוח ----------
     ⚠️ ימי האספקה כאן חייבים להתאים ל-DVT_SHIPPING ב-checkout.js
     ול-SHIPPING_OPTIONS_ ב-4-payment-api.gs. אלה שלושה מקומות, וזה
     הרע במיעוטו: הראשון הוא תצוגה, השני חישוב, והשלישי גבייה. */
  shipping: {
    /* ⚠️ expressDays נשאר כמפתח כדי לא לשבור דפים שנשמרו פתוחים,
       אבל "משלוח מהיר" הוסר מהאתר (25.08) — הערך מפנה לרגיל. */
    expressDays: { he: "3-7 ימי עסקים",  en: "3-7 business days" },
    standardDays:{ he: "3-7 ימי עסקים",  en: "3-7 business days" },
    pickupPlace: { he: "אבן שמואל",      en: "Even Shmuel" },
    // מוצג בפס היתרונות ובכרטיסי המוצר
    shortLabel:  { he: "משלוח עד הבית",  en: "Door-to-door delivery" }
  },

  /* ---------- אחריות ----------
     ⚠️ ניסוח שנכון תמיד. האחריות בפועל מוצגת פר-מוצר מעמודת
     `warranty` שנשלפת מהספק — כולל היכן ניתן השירות. */
  warranty: {
    title: { he: "אחריות יצרן",  en: "Manufacturer warranty" },
    short: { he: "לכל מוצר לפי תנאי היצרן/היבואן",
             en: "Per manufacturer/importer terms, per product" },
    note:  { he: "תקופת האחריות ומקום מתן השירות מופיעים בדף כל מוצר.",
             en: "Warranty period and service location appear on each product page." }
  },

  /* ---------- תשלומים ---------- */
  payments: {
    short: { he: "עד 12 תשלומים", en: "Up to 12 installments" },
    note:  { he: "1-2 תשלומים ללא עמלה. מ-3 ומעלה מוצגת עמלה מפורשת לפני האישור.",
             en: "1-2 installments with no fee. From 3 up, the fee is shown before you confirm." }
  },

  /* ---------- שירות ----------
     ⚠️ שירותים **אינם נמכרים דרך האתר**. הלקוח משאיר פנייה ודביר חוזר
     אליו — ראה support.html. היוצא מן הכלל היחיד הוא שירות שמתלווה
     למחשב שנקנה באתר (הרכבה, התקנת Windows), שנבחר בדף התשלום. */
  service: {
    short: { he: "פנייה ונחזור אליך", en: "Send a request, we'll get back to you" },
    note:  { he: "שירותי תמיכה, ביקור בית ותיקונים מתואמים אישית ואינם נרכשים באתר.",
             en: "Support, on-site visits and repairs are arranged personally and are not purchased online." }
  }
};

/* קריאה נוחה: dvtText("shipping.expressDays") */
function dvtText(path){
  const lang = (typeof LANG !== "undefined" && LANG === "en") ? "en" : "he";
  let node = DVT_CONTENT;
  const parts = String(path || "").split(".");
  for (let i = 0; i < parts.length; i++){
    if (!node || typeof node !== "object") return "";
    node = node[parts[i]];
  }
  if (!node) return "";
  return (typeof node === "object" && node[lang] !== undefined) ? node[lang] : String(node);
}

/* מחליף טקסט בכל אלמנט שנושא data-dvt="נתיב.אל.הטקסט".
   ⚠️ נקרא גם אחרי החלפת שפה — ראה applyI18n בכל דף. */
function dvtApplyContent(root){
  (root || document).querySelectorAll("[data-dvt]").forEach(function(el){
    const v = dvtText(el.getAttribute("data-dvt"));
    if (v) el.textContent = v;
  });
}

/* =====================================================================
   שכבת הגיליון — זה מה שהופך את הקובץ הזה ל"ניתן לעריכה בלי קוד"
   =====================================================================
   לשונית "תוכן האתר" בגיליון הקטלוג מחזיקה שלוש עמודות:
       מפתח                 | עברית            | English
       shipping.expressDays | 2-5 ימי עסקים    | 2-5 business days
   הערכים משם **דורסים** את ברירות המחדל שלמעלה.

   ⚠️ הברירות שלמעלה נשארות ולא נמחקות. אם הגיליון לא נגיש, אם השורה
   נמחקה בטעות או אם התא ריק — האתר מציג את הברירה ולא טקסט ריק. זה
   ההבדל בין "דביר שינה טקסט" לבין "האתר נשבר כי מישהו מחק שורה".

   ⚠️ **אין כאן בקשת רשת נוספת.** התוכן רוכב על אותה תשובה של
   getCatalog שכבר נטענת בכל דף (dvtGetCatalog ב-search-core.js), ולכן
   העלות היא אפס בקשות ואפס זמן טעינה. הוספת fetch נפרד הייתה מוסיפה
   קפיצת טקסט בכל דף.

   ⚠️ הטקסט מוחל **פעמיים**: פעם עם הברירות (DOMContentLoaded, מיידי)
   ופעם אחרי שהקטלוג הגיע. בלי המעבר השני שינוי בגיליון לא היה נראה;
   בלי הראשון הדף היה ריק עד שהרשת עונה.
===================================================================== */
function dvtSetPath_(obj, path, value){
  const parts = String(path || "").split(".").filter(Boolean);
  if (!parts.length) return;
  let node = obj;
  for (let i = 0; i < parts.length - 1; i++){
    if (typeof node[parts[i]] !== "object" || node[parts[i]] === null) node[parts[i]] = {};
    node = node[parts[i]];
  }
  node[parts[parts.length - 1]] = value;
}

/* מקבל מפה שטוחה { "shipping.expressDays": {he,en} } ומחיל אותה.
   תא ריק בגיליון = "אל תדרוס", ולא "מחק את הטקסט". */
function dvtMergeContent(map){
  if (!map || typeof map !== "object") return 0;
  let n = 0;
  Object.keys(map).forEach(function(key){
    const row = map[key];
    if (!row) return;
    const he = typeof row === "string" ? row : row.he;
    const en = typeof row === "string" ? "" : row.en;
    if (!he && !en) return;
    const cur = (function(){
      let node = DVT_CONTENT;
      const parts = key.split(".");
      for (let i = 0; i < parts.length; i++){
        if (!node || typeof node !== "object") return null;
        node = node[parts[i]];
      }
      return node;
    })();
    const base = (cur && typeof cur === "object") ? cur : {};
    dvtSetPath_(DVT_CONTENT, key, {
      he: he || base.he || "",
      en: en || base.en || he || ""
    });
    n++;
  });
  return n;
}

if (typeof document !== "undefined"){
  document.addEventListener("DOMContentLoaded", function(){ dvtApplyContent(); });

  /* ⚠️ מוגן בכל צד: הדף חייב לעבוד גם כשאין רשת, גם כשהלשונית לא נוצרה
     עדיין (contentSheetInstall לא רץ), וגם כששדה `content` לא קיים
     בתשובה — במקרים האלה פשוט נשארות הברירות. */
  if (typeof dvtGetCatalog === "function"){
    try{
      dvtGetCatalog().then(function(cat){
        if (cat && cat.content && dvtMergeContent(cat.content)) dvtApplyContent();
      }).catch(function(){});
    }catch(e){}
  }
}

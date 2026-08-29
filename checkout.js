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
     אחד לא מציג/מוסיף שום עמלה — המחיר תמיד זהה.**
     (עודכן 25.08: מסלולי 2-3 עברו לעמלה מפורשת, 0.9% לתשלום.)
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

/* 🔴 כאן ישב `const CART_STORAGE_KEY` — **ההצהרה הזהה שנייה בדף**.
   cart.js מצהיר עליו גם הוא, ושני `const` באותו שם בהיקף הגלובלי
   זורקים SyntaxError שמפיל את הקובץ כולו. התוצאה בפועל: cart.js
   הוסר מ-checkout.html כדי לעקוף את ההתנגשות — וכפתור העגלה
   שמוזרק לכותרת של **כל** דף נשאר מת דווקא בדף התשלום, כי
   `openCart` לא היה מוגדר שם. דביר: "העגלה לא נפתחת לי בדף
   התשלום שלנו".

   ⚠️ עכשיו cart.js נטען לפני checkout.js ומספק את הקבוע ואת
   `sanitizeCartItems`. המימוש שלו גם טוב יותר: הוא משלים `id` חסר,
   ובלעדיו פריט ישן נתקע בעגלה לנצח כי removeFromCart מסנן לפי id. */
const PAYMENT_API_URL = "https://script.google.com/macros/s/AKfycbwuW5tgiRDhoIEFNkHHWgkVot6FyHFEUBa1mx41ck1lp74ChzT8pciMV9qaI0NcDw-sKA/exec";

/* לתצוגה בלבד — השרת (4-payment-api.gs) מחשב את זה מחדש ובאופן עצמאי,
   לא סומך על מה שנשלח מכאן. ⚠️ אם משנים כאן, לשנות גם שם
   (INSTALLMENT_FEE_PCT_PER_MONTH_PRE_VAT). */
const INSTALLMENT_FEE_PCT_PER_MONTH_PRE_VAT = 0.75;   // 4+ תשלומים (UPAY: 0.75% לתשלום + מע"מ)
/* 🔴 **עודכן 25.08 בהוראת דביר — "אנחנו לא משלמים על זה יותר":** גם
   מסלולי 2-3 תשלומים נושאים עמלה מפורשת, לפי תעריף הניכיון של UPAY
   לעסקה עד 3 תשלומים (0.9% לתשלום). חינם: תשלום אחד בלבד.
   ⚠️ אותם שלושה קבועים בדיוק ב-4-payment-api.gs — השרת קובע. */
const INSTALLMENT_FEE_PCT_1TO3_PRE_VAT = 0.9;
/* 🔴 דביר וידא (25.08 ערב): גם 2 תשלומים עם עמלה. חינם: תשלום אחד. */
const INSTALLMENT_FEE_FREE_UPTO = 1;                 // תשלום אחד: ללא עמלה
const VAT_RATE = 0.18;

let cartSubtotal = 0;

/* checkout.js לא טוען את search-core.js, אז עותק מקומי. */
function escHtml(s){
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* אותה הגנה כמו ב-cart.js: שורה פגומה (בלי name/price, או מגרסת עגלה
   ישנה) הופכת ל-"undefined" ו-NaN ₪ בדף התשלום. משמיטים אותה במקום
   להציג ללקוח סכום שגוי. השרת ממילא מתמחר מחדש לפי sku בלבד. */
/* ⚠️ `sanitizeCartItems` הוסר מכאן — הוא היה עותק כמעט זהה של זה
   שב-cart.js, אבל **בלי** השלמת ה-id. כפילות פונקציה אינה שגיאת
   תחביר, ולכן היא שרדה בשקט; מי שנטען אחרון היה גובר. */

/* הרכיבים שבלעדיהם אין מחשב עובד. אם כולם בעגלה כפריטים נפרדים —
   הלקוח בעצם מרכיב מחשב "ידנית", ואז כדאי להסביר לו שההרכבה חינם
   מותנית במעבר דרך הבונה: רק שם נבדקת ההתאמה בין הרכיבים. */
/* ⚠️ **קירור הוא חובה — נוסף 16.08.2026 בהוראת דביר.** מחשב בלי פתרון
   קירור למעבד לא עולה, ולכן הוא רכיב ליבה בדיוק כמו ספק כוח.

   ⚠️ **לא נבדק מול `coolerIncluded` בכוונה.** השדה הזה שגוי בגיליון על
   חלק מהמעבדים — 22 מעבדים מסומנים "כולל קירור" בעוד שבשמם כתוב
   "Tray no fan" / "no cooler". סינון לפיו היה מדלג על דרישת הקירור
   בדיוק במקרים שבהם היא הכי נחוצה. עד שהנתון יתוקן, קירור נדרש תמיד:
   לקוח עם מעבד BOX שמוסיף קירור מיותר זו שיחת טלפון; לקוח שקיבל
   מחשב שלא נדלק זה משהו אחר לגמרי. */
const ASSEMBLY_CORE_CATS = ["cpu","mobo","ram","storage","psu","case","cooling"];

/* השמות להצגה ללקוח כשחסר רכיב. ⚠️ "חסר משהו" בלי לומר מה זה מבוי
   סתום — הלקוח לא יודע אם חסר לו מארז או ספק ולא יכול לתקן. */
const CORE_CAT_LABELS = {
  cpu:     ["מעבד","CPU"],
  mobo:    ["לוח אם","motherboard"],
  ram:     ["זיכרון RAM","RAM"],
  storage: ["אחסון","storage"],
  psu:     ["ספק כוח","power supply"],
  case:    ["מארז","case"],
  cooling: ["קירור למעבד","CPU cooler"]
};

/* קטגוריות שכל פריט בהן הוא **מחשב שלם בפני עצמו** — אין מה לחפש בהן
   רכיבים חסרים. מחשב מוכן או נייד מזכים בשירותי ההתקנה בדיוק כמו
   הרכבה מהבונה; זו הייתה החמצה אמיתית לו הבדיקה הייתה מסתפקת ברכיבים.
   ⚠️ המפתחות תואמים ל-STORE_SHEETS_ ב-4-payment-api.gs. */
const WHOLE_PC_CATS = ["readyPc","laptop"];

/* ⚠️ **פונקציה אחת שמחליטה "יש כאן מחשב שלם?" — ולא שתיים.**
   קודם הלוגיקה הזו הייתה קבורה בתוך renderAssemblyNotice ושימשה רק
   להצגת באנר "רוצה הרכבה חינם?". עכשיו אותה תשובה בדיוק מחליטה גם
   אילו שירותים בכלל מוצגים (ראה servicesForCart), ולכן היא הוצאה
   החוצה. אסור לכתוב כאן בדיקה מקבילה שנייה — שתי בדיקות שיכולות
   להיפרד זו מזו הן באג שממתין לקרות.

   שלוש דרכים שבהן "יש מחשב":
     1. hasBuild   — הרכבה שנבנתה בבונה (type:"build"), כבר נבדקה שם.
     2. hasWholePc — מחשב מוכן / נייד מהקטלוג, מוצר שלם כמו שהוא.
     3. partsPc    — כל ששת רכיבי הליבה נקנו בנפרד מהקטלוג. */
function analyzeCartPc(items){
  const cats = new Set();
  items.forEach(i => {
    if(typeof i.sku === "string") cats.add(i.sku.split(":")[0]);
    // רכיבי הרכבה מהבונה יושבים ב-parts ולא כשורות עצמאיות בעגלה
    if(i.type === "build" && Array.isArray(i.parts)){
      i.parts.forEach(p => {
        if(p && typeof p.sku === "string") cats.add(p.sku.split(":")[0]);
      });
    }
  });

  const hasBuild   = items.some(i => i.type === "build");
  const hasWholePc = WHOLE_PC_CATS.some(c => cats.has(c));
  const missing    = ASSEMBLY_CORE_CATS.filter(c => !cats.has(c));
  const partsPc    = missing.length === 0;

  return {
    hasBuild:   hasBuild,
    hasWholePc: hasWholePc,
    partsPc:    partsPc,
    missing:    missing,
    // כמה רכיבי ליבה כן יש — מבדיל בין "עגלה עם עכבר בלבד" (0) לבין
    // "מחשב כמעט שלם שחסר לו מארז" (5), ואלה שתי הודעות שונות לגמרי
    coreCount:  ASSEMBLY_CORE_CATS.length - missing.length,
    hasPc:      hasBuild || hasWholePc || partsPc
  };
}

function renderAssemblyNotice(pc){
  const box = document.getElementById("assemblyNotice");
  if(!box) return;

  /* הרכבה מהבונה כבר יושבת בעגלה כשורה משלה — אין מה להציע שוב. */
  if(pc.hasBuild || !pc.partsPc){ box.hidden = true; box.innerHTML = ""; return; }

  /* ⚠️ **שינוי מדיניות — 16.08.2026, החלטת דביר.** קודם ההטבה ניתנה
     רק דרך הבונה, והבאנר הזה שלח את הלקוח להתחיל מחדש שם. זה היה
     מעליב: הלקוח כבר בחר בעצמו את כל ששת רכיבי הליבה, והתשובה שקיבל
     הייתה "תעשה את זה שוב במקום אחר". מעכשיו ההטבה חלה גם על רכיבים
     שנבחרו מהקטלוג, בדיוק כמו בבונה.

     ⚠️ מה שכן נשאר שונה: בבונה **נבדקת ההתאמה** בין הרכיבים (שקע
     המעבד, גודל המארז, הספק ספק הכוח). בעגלה מהקטלוג אף אחד לא בדק
     את זה, ולכן הטקסט אומר במפורש שנוודא התאמה לפני ההרכבה — במקום
     להבטיח בשקט שזה יעבוד. זו לא אזהרה משפטית אלא מה שבאמת קורה. */
  /* 🔴 **"ללא עלות" הוסר 26.08 — החלטת דביר.** ההטבה נשארה, אבל
     היא מחיר מוזל ולא אפס: 300 ₪ הופכים ל-199 ₪ כשהחלקים נקנו כאן.
     ⚠️ הבאנר **לא מבטיח שההרכבה בהזמנה** — היא שירות שהלקוח מסמן
     בעצמו למטה. באנר שאומר "ההרכבה שלך" על משהו שלא נבחר הוא שקר
     שמתגלה רק בקבלה. */
  /* ⚠️ המחירים נשלפים מ-DVT_SERVICES ולא מוקלדים כאן — מספר קשיח
     בבאנר היה שקר ביום ששורת המחירון משתנה. */
  const asm = serviceByKey("asm-basic") || { price: 250, wasPrice: 450 };
  box.hidden = false;
  box.innerHTML = `
    <b>${tr("מגיע לך מחיר הרכבה של לקוחות DvirTech 🔧","You qualify for the DvirTech customer assembly price 🔧")}</b>
    <p>${tr(
      "יש בעגלה את כל הרכיבים למחשב שלם. הרכבה עם חלקים שנקנו כאן היא " + asm.price + " ₪ במקום " + asm.wasPrice + " ₪ (מחיר טכנאי) — אפשר להוסיף אותה למטה, תחת \"שירותים נוספים\". לפני שמרכיבים אני עובר על ההתאמה בין הרכיבים (שקע המעבד, גודל המארז, הספק ספק הכוח), ואם משהו לא מסתדר אעדכן אותך לפני שמתחילים.",
      "Your cart has every part of a complete PC. Assembly with parts bought here is " + asm.price + " ₪ instead of " + asm.wasPrice + " ₪ (technician price) — add it below under \"Add-on services\". Before building I check that the parts fit together (CPU socket, case clearance, PSU headroom), and if something doesn't line up I'll tell you before starting.")}</p>
    <div id="cartCompatReport"></div>
    <a class="btn btn-secondary" href="builder.html">${tr("רוצה שאבדוק לך התאמה מראש? לבונה","Want compatibility checked up front? Open the Builder")}</a>`;
}

/* ==================== בדיקת התאמה לעגלת רכיבים ====================
   ⚠️ **אותו מנוע כמו בבונה, לא בדיקה מקבילה.** לקוח שאסף רכיבים ידנית
   מהקטלוג מקבל הרכבה חינם — אבל אף אחד לא בדק שהרכיבים מתאימים זה
   לזה. dvtCheckBuildCompat (ב-builder-compat.js) מריץ עליהם בדיוק את
   טבלת החוקים של הבונה: כל חוק שנוסף שם עובד כאן אוטומטית.

   ⚠️ builder-compat.js לא נטען ב-checkout.html כדי לא להכביד על עמוד
   התשלום עבור עגלות בלי מחשב — הוא נטען דינמית רק כשיש מה לבדוק.
   (הקבצים באתר יושבים שטוחים, אותה תיקייה כמו checkout.js עצמו.)

   ⚠️ **מציג אזהרה, לא חוסם תשלום.** שדות מפרט חסרים בגיליון יכולים
   לייצר גם שתיקה על בעיה אמיתית וגם (נדיר) התרעה מיותרת — ההחלטה
   הסופית היא של דביר בבדיקה שלפני ההרכבה, כמו שהבאנר למעלה מבטיח. */
let _compatEnginePromise = null;
function loadCompatEngine(){
  if(typeof dvtCheckBuildCompat === "function") return Promise.resolve();
  if(_compatEnginePromise) return _compatEnginePromise;
  _compatEnginePromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "builder-compat.js";
    s.onload = () => resolve();
    s.onerror = () => { _compatEnginePromise = null; reject(new Error("builder-compat.js load failed")); };
    document.head.appendChild(s);
  });
  return _compatEnginePromise;
}

async function runCartCompatCheck(items){
  const host = document.getElementById("cartCompatReport");
  if(!host) return;
  try{
    await loadCompatEngine();
    /* dvtGetCatalog נטען בעמוד (search-core.js) — אותו מטמון משותף של
       כל הדפים. אם השרת לא זמין, dvtCheckBuildCompat ינסה לבד את
       מטמון ה-localStorage; בלי שניהם פשוט לא מציגים כלום. */
    let catalog = null;
    if(typeof dvtGetCatalog === "function"){
      try{ catalog = await dvtGetCatalog(); }catch(e){ /* מטמון יציל */ }
    }
    const r = dvtCheckBuildCompat(cartItemsToLines(items), catalog);
    if(!r || !Array.isArray(r.issues)) { host.innerHTML = ""; return; }

    const errors = r.issues.filter(i => i.level === "error");
    const warns  = r.issues.filter(i => i.level === "warn");
    const parts = [];

    if(r.duplicates && r.duplicates.length){
      parts.push(`<p style="margin:8px 0 0">${tr("בעגלה יש יותר ממוצר אחד מאותה קטגוריה — נבדק הראשון מכל קטגוריה.",
                                                 "Your cart holds more than one product of the same category — the first of each was checked.")}</p>`);
    }
    if(errors.length){
      parts.push(`<div style="margin-top:10px;padding:10px 14px;border:1.5px solid #F3BDB8;background:#FEF8F7;border-radius:12px;color:#A3322B">
        <b>${tr("שים לב — נמצאו אי-התאמות בין הרכיבים:","Heads up — the parts don't all fit together:")}</b>
        <ul style="margin:6px 18px 0;padding:0">${errors.map(i => `<li>${escHtml(i.text)}</li>`).join("")}</ul>
        <p style="margin:8px 0 0">${tr("אפשר להשלים את ההזמנה — אצור איתך קשר לפני ההרכבה ונחליף את מה שצריך, בלי חיוב נוסף. ואפשר גם לתקן עכשיו דרך הבונה.",
                                       "You can still place the order — I'll contact you before assembly and we'll swap what's needed at no extra charge. Or fix it now in the Builder.")}</p>
      </div>`);
    }
    if(warns.length){
      parts.push(`<div style="margin-top:10px;padding:10px 14px;border:1.5px solid #F6DDAF;background:#FFF6EA;border-radius:12px;color:#92650F">
        <b>${tr("הערות התאמה:","Compatibility notes:")}</b>
        <ul style="margin:6px 18px 0;padding:0">${warns.map(i => `<li>${escHtml(i.text)}</li>`).join("")}</ul>
      </div>`);
    }
    if(!errors.length && !warns.length){
      parts.push(`<p style="margin:8px 0 0;color:#0E9C8A">${tr("בדיקת התאמה ראשונית עברה בהצלחה — לא נמצאו התנגשויות בין הרכיבים שבעגלה ✓",
                                                               "Initial compatibility check passed — no conflicts found between the parts in your cart ✓")}</p>`);
    }
    host.innerHTML = parts.join("");
  }catch(e){
    /* בדיקה שנכשלה (רשת, קובץ) לא מפריעה לתשלום — הבדיקה הידנית של
       דביר לפני ההרכבה היא ממילא הרשת האחרונה. */
    host.innerHTML = "";
  }
}

function readCartFromStorage(){
  try{
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return sanitizeCartItems(raw ? JSON.parse(raw) : []);
  }catch(e){ return []; }
}

function cartTotalOf(items){ return items.reduce((s,i)=> s + i.price*i.qty, 0); }

// עמלה לכל חודש תשלום, לא אחוז שטוח — ככל שיש יותר תשלומים, העמלה גדלה
// בהתאם (בדיוק כמו מימון אמיתי). מחושב על כל התשלומים (לא רק על אלה
// שמעבר ל-3), כי מ-4 תשלומים ומעלה כל העסקה כפופה לתנאי המימון.
/* ✅ מיושר לנספח UPAY (17.08.2026): 0.75% × מספר התשלומים (×n, לא
   n−1 — הנספח קובע "במכפלת מספר התשלומים") + עמלת הקצאת אשראי 1%
   בתקרה 100/500 ₪, הכל ×1.18. ⚠️ תצוגה בלבד — השרת
   (computeInstallmentFee_ ב-4-payment-api.gs) מחשב מחדש ולא סומך
   על הדפדפן; שני הצדדים חייבים להישאר זהים ספרה-בספרה, אחרת הלקוח
   מאשר סכום אחד ומחויב באחר. */
/*
   🔴 **תוקן 21.08 בהוראת דביר — הוסר רכיב "ההקצאה".**
   הנוסחה הייתה `(0.75% × תשלומים + 1% הקצאה) × מע"מ`, ולכן 12
   תשלומים יצאו 11.8%. דביר: "10.62 זה תקרת העמלות על תשלומים,
   זה 12 תשלומים לכל היותר" — וזה בדיוק `12 × 0.75% × 1.18`.

   ⚠️ **למה זה לא רק דיוק אלא חובה.** מותר להציג ללקוח בנפרד רק את
   העמלה שנובעת **מהתשלומים שהוא בחר**. עלויות אחרות של דביר מול
   UPAY — ובכללן ניכיון (קבלת כל הסכום מראש) — הן עלות עסקית
   ונכנסות למחיר המוצר, **אסור להציג או לגבות אותן כשורה נפרדת**.
   רכיב ההקצאה היה בדיוק כזה, והוא נגבה בנוסף.

   🔴 **החלטת דביר, 21.08 — העמלה נגבית על מספר התשלומים המלא.**
   🔴 **עודכן 25.08 (וסופית באותו ערב):** מסלולי 2-3 נושאים עמלה של
   0.9% × מספר התשלומים + מע"מ (תעריף UPAY עד 3). חינם: תשלום אחד.
   4 ומעלה: 0.75% × **כל** התשלומים + מע"מ. 12 תשלומים = 10.62%.

   🔴 **וגם אחרי החזרה זו עדיין גבייה מתחת לעלות.** UPAY מסלקת את
   **כל הסכום שעבר בכרטיס**, כולל שורת העמלה עצמה — ולכן על 5,000 ₪
   ב-12 תשלומים היא לוקחת 587.39 ₪ בעוד שנגבו מהלקוח 531.00 ₪.
   פער של 56.39 ₪ שנשאר על דביר. המשמעות המשפטית חשובה: התקרה בחוק
   היא **העלות בפועל**, ואנחנו מתחתיה — כלומר בטוח, עם מרווח.

   ⚠️ הריכוך הוא בממשק: כל שורה ברשימת התשלומים נושאת את המחיר
   שלה בש"ח **לפני** הבחירה, כך שהמדרגה היא שלט ולא הפתעה.

   ⚠️ הצד הזה והצד השני חייבים להישאר זהים ספרה-בספרה — השרת מתמחר
   מחדש ולא סומך על הדפדפן; פער = הלקוח מאשר סכום ומחויב באחר.
*/
function installmentFeeAmount(base, count){
  if(count <= INSTALLMENT_FEE_FREE_UPTO) return 0;
  /* 25.08: מסלול 3 לפי 0.9% לתשלום, 4+ לפי 0.75% — כמו בשרת בדיוק. */
  const ratePct = count <= 3 ? INSTALLMENT_FEE_PCT_1TO3_PRE_VAT
                             : INSTALLMENT_FEE_PCT_PER_MONTH_PRE_VAT;
  const advance = base * (ratePct / 100) * count;
  return Math.round(advance * (1 + VAT_RATE) * 100) / 100;
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
        <div>${escHtml(i.name)}${i.qty>1?` × ${i.qty}`:""}</div>
        ${i.noteLines && i.noteLines.length ? `<div class="cart-item-note">${i.noteLines.map(escHtml).join("<br>")}</div>` : ""}
      </span>
      <span class="v">${i.price===0 ? t("included") : (i.price*i.qty).toLocaleString()+" ₪"}</span>
    </li>`).join("");
  /* ⚠️ **חישוב אחד, שני צרכנים.** analyzeCartPc היא מקור האמת גם
     לבאנר ההרכבה וגם לשאלה אילו שירותים מוצגים — שתי בדיקות נפרדות
     היו מתפצלות ביום שמישהו יוסיף קטגוריה. */
  cartPc = analyzeCartPc(items);
  renderAssemblyNotice(cartPc);
  /* הבדיקה רצה רק לעגלת "מחשב מרכיבים" — הרכבה מהבונה כבר נבדקה שם,
     ועגלה בלי מחשב שלם אין מה לבדוק. אסינכרונית: לא מעכבת את העמוד. */
  if(cartPc.partsPc && !cartPc.hasBuild) runCartCompatCheck(items);
  renderShippingOptions();
  // עגלה שהשתנתה מאז הביקור הקודם יכולה להשאיר בחירה שכבר לא מוצגת
  // (חבילה שנבחרה לפני שנוספה הרכבה מהבונה, או התקנת Windows שנבחרה
  // כשהיה מחשב בעגלה ואז הוא הוסר) — מסננים כדי שלא יישלח לשרת מפתח
  // שהלקוח כבר לא רואה על המסך.
  const allowed = servicesForCart().map(s => s.key);
  selectedServices = selectedServices.filter(k => allowed.indexOf(k) !== -1);
  renderServiceOptions();
  cartSubtotal = cartTotalOf(items);
  document.getElementById("checkoutTotalPrice").textContent = cartSubtotal.toLocaleString() + " ₪";
  renderCheckoutTotals();
  renderGiftBlock();
}

/* ⚠️ **חייב להישאר תואם ל-SHIPPING_OPTIONS_ ב-4-payment-api.gs.**
   המחיר שנגבה בפועל נלקח **מהשרת**; מה שכאן הוא תצוגה בלבד. אם שני
   הצדדים ייפרדו, הלקוח יראה סכום אחד וייגבה ממנו אחר — ולכן כל שינוי
   מחיר חייב להיעשות בשני הקבצים.

   באיסוף עצמי השדה etaHe/etaEn מחזיק **הערת מקום ותיאום** במקום זמן
   אספקה: אין מה להבטיח תאריך משלוח למי שבא לקחת, ומה שהוא צריך לדעת
   זה איפה ואיך. אין כתובת חנות קבועה (הרכבות מתבצעות אצל דביר) —
   לכן אותה נוסחה שמופיעה בעמוד "צור קשר": איסוף בתיאום מראש.
   ⚠️ מקום האיסוף הוא **אבן שמואל** (המקום שממנו דביר עובד בפועל), ולא
   באר שבע שהיא *אזור השירות* לביקורי בית. contact.html ו-i18n.js
   ממשיכים לומר "באר שבע והסביבה" כאזור שירות — וזה נכון ונשאר;
   רק נקודת האיסוף היא אבן שמואל. */
const DVT_SHIPPING = [
  { key:"pickup",   he:"איסוף עצמי",  en:"Self pickup",       price:0,  etaHe:"אבן שמואל — בתיאום מראש", etaEn:"Even Shmuel — by prior arrangement" },
  /* ✅ רגיל 29 ₪ · מהיר 59 ₪ — אושר על ידי דביר (20.08.2026).
     המהיר עודכן מ-49 ל-59 כדי להתיישר עם הפריט ב-SUMIT (CLI-4029).

     🔴 **מחיר המשלוח חי בארבעה מקומות ושינוי חייב לגעת בכולם:**
       1. כאן — מה שהלקוח רואה בקופה
       2. `SHIPPING_OPTIONS_` ב-4-payment-api.gs — מה שנגבה בפועל
          (השרת הוא הקובע; הוא מתמחר מחדש ומתעלם מהדפדפן)
       3. סעיף 5.1 בתקנון, עברית — `Web/terms.js`
       4. אותו סעיף באנגלית
     ⚠️ 3 ו-4 אינם קוסמטיים: התקנון **מצהיר את המחיר**, ופער בינו
     לבין מה שנגבה הוא בעיה חוזית ולא באג תצוגה. */
  { key:"standard", he:"משלוח רגיל", en:"Standard delivery", price:29, etaHe:"3-7 ימי עסקים", etaEn:"3-7 business days" }
  /* 🔴 **"משלוח מהיר" הוסר 25.08 — הוראת דביר.** אף ספק לא עומד כרגע
     ב-2-5 ימים (צג עליתה עד 3 ימים; BENDA 5-6 ימי עסקים). הוסר במקביל
     מ-SHIPPING_OPTIONS_ בשרת, מהתקנון (5.1 עברית+אנגלית), מ-home.html,
     thanks.html, product.js ו-site-content.js. */
];
/* 🔴 **ברירת המחדל היא איסוף עצמי — שונה 23.08.**
   דביר: "אני לא רוצה שהלקוח ירגיש שאני דוחף לו מוצרים."

   ⚠️ וזה גם פשוט הגון יותר: ברירת מחדל שעולה כסף היא בחירה שנעשתה
   **עבור** הלקוח, ולקוח שלא שם לב משלם 29 ₪ שלא ביקש. איסוף עצמי
   הוא **0 ₪** — מי שרוצה משלוח בוחר אותו במודע.
   ⚠️ שים לב שזה גם מסתיר את שדות הכתובת (`shippingKey === "pickup"`
   בשורות למטה) — כלומר הקופה נפתחת קצרה יותר, וזו הטבה נוספת. */
let shippingKey = "pickup";

function shippingOption(){
  return DVT_SHIPPING.find(s => s.key === shippingKey) || null;
}

/* 🎁 האם הזמנה זו הרוויחה משלוח חינם? נשען על מנגנון המדרגות של
   cart.js (אותם כללים חיים מהשרת). ⚠️ **תצוגה בלבד** — השרת מכריע
   מחדש ב-createPayment_ (gifts.freeShipping) וגובה לפי עצמו; כאן רק
   דואגים שהלקוח יראה את אותו מספר. הבאג שדווח (27.08): "קיבלתי
   משלוח חינם — והקופה עדיין מציגה 29 ₪". */
function checkoutFreeShip(){
  try{
    if(typeof dvtGiftProgress !== "function") return false;
    const p = dvtGiftProgress();
    return !!(p && p.earned && p.earned.some(function(x){ return x.kind === "shipping"; }));
  }catch(e){ return false; }
}

function shippingPrice(){
  const o = shippingOption();
  if(!o) return 0;
  if(o.price > 0 && checkoutFreeShip()) return 0;
  return o.price;
}

function renderShippingOptions(){
  const host = document.getElementById("shippingOptions");
  if(!host) return;
  document.getElementById("shippingLabel").textContent = tr("אופן המשלוח","Delivery method");
  host.innerHTML = DVT_SHIPPING.map(s => `
    <label class="ship-opt${s.key === shippingKey ? " is-on" : ""}">
      <input type="radio" name="shipOpt" value="${s.key}"
             ${s.key === shippingKey ? "checked" : ""}
             onchange="onShippingChange(this.value)">
      <span class="ship-name">${tr(s.he, s.en)}</span>
      <span class="ship-eta">${tr(s.etaHe, s.etaEn)}</span>
      <span class="ship-price">${s.price === 0
        ? tr("ללא עלות","Free")
        : (checkoutFreeShip()
            ? `<s>+${s.price.toLocaleString()} ₪</s> <b class="gift-hot">${tr("חינם 🎁","Free 🎁")}</b>`
            : "+" + s.price.toLocaleString() + " ₪")}</span>
    </label>`).join("");
}

function onShippingChange(key){
  shippingKey = key;
  renderShippingOptions();
  renderCheckoutTotals();
  toggleAddressFields();
}

/* ⚠️ **כתובת נדרשת רק כשיש מה לשלוח.** באיסוף עצמי הבלוק מוסתר —
   שלושה שדות חובה שאין בהם צורך הם חיכוך מיותר בדיוק בשלב שבו
   הלקוח הכי קרוב לנטוש. */
function toggleAddressFields(){
  const box = document.getElementById("shipAddressBlock");
  if(box) box.style.display = (shippingKey === "pickup") ? "none" : "";
}

/* מחזיר את הכתובת כמחרוזת אחת לקבלה, או "" באיסוף עצמי. */
function shippingAddressText(){
  if(shippingKey === "pickup") return "";
  const v = id => (document.getElementById(id) || {}).value || "";
  const city = v("custCity").trim(), street = v("custStreet").trim(), notes = v("custAptNotes").trim();
  return [street, city, notes].filter(Boolean).join(", ");
}

/* ==================== שירותים נוספים ====================
   ⚠️ **מקור המחירים הוא PRICE_LIST ב-CRM+SUPPLIERS/2-pricelist-picker.gs**
   — המחירון שדביר עובד איתו ביומן העבודות. זה פרויקט Apps Script אחר
   ואי אפשר לקרוא ממנו בזמן ריצה, ולכן זה עותק. ⚠️ **שינוי מחיר חייב
   לקרות בשלושה מקומות:** שם (מקור האמת), ב-SERVICE_OPTIONS_ ב-
   4-payment-api.gs (מה שנגבה בפועל) וכאן (מה שמוצג).

   כמו במשלוח — הדפדפן שולח **רק מפתחות** והשרת מתמחר. המחירים כאן הם
   לתצוגה בלבד; אי אפשר לקנות שירות ב-0 ₪ על ידי עריכת הדף.

   לא כל המחירון מוצג: "נסיעה בלבד" ו"אבחון תקלה" הם שלב בקריאת שירות
   טלפונית ולא משהו שקונים בעגלה, ו"ביקור בית — עד 30 דק'" הושמט כי
   הוא חופף ל"התקנת מחשב בעמדת הלקוח" (שכולל את אותה הגעה, רק עם
   תוצר מוגדר) — שתי שורות שנראות כמעט זהות רק מבלבלות בבחירה.

   group = שירותים שחופפים זה לזה; בחירה באחד מבטלת את השני, אחרת
   הלקוח משלם פעמיים על אותה עבודה (השרת דוחה צירוף כזה ממילא).
   includesAssembly = החבילה כוללת הרכבה — ראה servicesForCart().

   ⚠️ `includes` = **החבילה כוללת בתוכה שירותים אחרים מהרשימה הזו.**
   זו הייתה גבייה עודפת אמיתית: `group:"os"` מנע לבחור חבילה + התקנת
   Windows, אבל **לא** מנע חבילה + "התקנה בעמדת הלקוח" — כלומר לקוח
   יכול היה לשלם 700 על חבילה שכוללת התקנה ועוד 400 על אותה התקנה
   בדיוק. עכשיו בחירת החבילה מסמנת את מה שכלול בה, ב-0 ₪ ונעול.

   ⚠️ `requiresPc` = שירות שאין לו משמעות בלי מחשב בהזמנה. אי אפשר
   להתקין Windows על עכבר. ראה servicesForCart() + analyzeCartPc(). */

/* 🔴 **מה החלטתי שכלול ב"מחשב חדש — הכל כלול" (700 ₪), ולמה:**
   ההערה על החבילה אומרת "הרכבה + Windows + רישיון + התקנה", ומול
   PRICE_LIST ב-CRM+SUPPLIERS/2-pricelist-picker.gs זה מתפרק בדיוק:
     • "הרכבה"          → "הרכבה (כשקונים ממני חלקים)" = 0 ₪
                          (זה `includesAssembly`, שכבר טופל)
     • "Windows + רישיון" → win11-license               = 300 ₪
     • "התקנה"          → onsite-setup                 = 400 ₪
   300 + 400 = **בדיוק 700**, מה שמאשר את הפירוק. "התקנה" בשורה הזו
   היא ההתקנה **אצל הלקוח** ולא התקנת מערכת ההפעלה — זו כבר מופיעה
   בנפרד באותה שורה ("Windows + רישיון"), ולא הגיוני שאותה מילה תחזור
   פעמיים.
   🔴 **דביר — שים לב לתמחור עצמו:** בגלל ש-300+400=700, החבילה לא
   חוסכת ללקוח כלום מול בחירת שני השירותים בנפרד. היא כן שווה יותר
   למי שקונה חלקים ממקום אחר (שם ההרכבה עולה 300), אבל בדף התשלום
   הזה החלקים תמיד נקנים ממך וההרכבה ממילא 0. אם החבילה אמורה להיות
   מבצע — המחיר צריך לרדת (למשל 600), וזו החלטה שלך ולא שלי. */
/* ⚠️ **onsite-setup ו-bundle-new-pc הוסרו מדף התשלום — 2026-08-14.**
   החלטת דביר: שירות אינו נרכש דרך האתר. שירות שמתלווה למחשב שנקנה
   (התקנת Windows) נשאר, אבל כל מה שכרוך ב**נסיעה ותיאום אישי**
   (התקנה בעמדת הלקוח, ביקור בית) עובר ל-support.html כפנייה בלבד —
   שם המחיר נקבע לפי מרחק ואי אפשר לגבות אותו מראש.
   ⚠️ החבילה "הכל כלול" ירדה איתם כי היא **כוללת** התקנה בעמדה.
   המפתחות נשארים ב-SERVICE_OPTIONS_ בשרת וב-REAL_SUMIT_SKUS, כדי
   שהזמנה ישנה שנשמרה בדפדפן לא תיפול — הם פשוט לא מוצעים יותר. */
/* ⚠️ **תמיכה מרחוק הוסרה מדף התשלום — 14.08.2026.** החלטת דביר: אי
   אפשר להתחייב מראש על שעת תמיכה בלי לדעת מה הבעיה ומתי. היא נשארת
   בעמוד שירות ותמיכה כפנייה, ונשארת ב-SERVICE_OPTIONS_ בשרת עם
   `notOffered` כדי שהזמנה ישנה שנשמרה בדפדפן לא תיפול.

   ⚠️ **"ללא רישיון" ולא "יש לי רישיון".** אותו שירות בדיוק, אבל
   מנוסח מצד מה שדביר מספק: הוא מתקין, הרישיון לא כלול. הניסוח הקודם
   דיבר בשם הלקוח והשאיר ספק אם הרישיון מגיע ממנו או לא.

   ⚠️ **"העברת נתונים מהמחשב הישן" ולא "העברת נתונים / גיבוי".** על
   מחשב חדש עם מערכת נקייה אין מה לגבות — השאלה הנכונה היא מה מעבירים
   *אליו*, מהמחשב הקודם של הלקוח. זה גם השירות שבאמת מבוקש בקנייה של
   מחשב חדש. */
/* 🔴 **חייב להישאר זהה ל-SERVICE_OPTIONS_ ב-4-payment-api.gs.**
   כאן מציגים, שם גובים. פער בין השניים = הלקוח רואה מחיר אחד ומחויב
   באחר. `tools/check-service-parity.py` משווה את שניהם.

   **המחירון הדו-שכבתי (DVT-NEXT-BUILD §1.2, 27.08):** `price` הוא
   מחיר DvirTech — מי שקונה כאן חומרה זכאי לו מעצם ההזמנה. `wasPrice`
   הוא מחיר הטכנאי, שנגבה בפועל מלקוחות שירות שלא רכשו חומרה — ולכן
   מותר להציגו מחוק (חוק הגנת הצרכן: מחיר קודם חייב להיגבות באמת). */
const DVT_SERVICES = [
  /* --- הרכבה: מחיר אחד לכל מחשב + פרימיום (החלטת דביר 27.08:
     "בכל חנות אחרת זה פשוט הרכבת מחשב — 250 לכולם, פרימיום 450").
     group:"assembly" — נבחרת אחת. הרמה האמצעית (asm-full, 390)
     מוזגה פנימה: נוזלי/RGB/זכוכית כלולים במחיר האחיד. --- */
  { key:"asm-basic", he:"הרכבת המחשב", en:"PC assembly", price:250, wasPrice:450, group:"assembly", requiresPc:true, hot:true,
    details:[
      ["הרכבה מלאה של כל הרכיבים — כולל קירור נוזלי, RGB ומארזי זכוכית, באותו מחיר","Full assembly of every component — liquid cooling, RGB and glass cases included, same price"],
      ["בדיקת התאמה לפני ההרכבה — שקע, מארז, הספק","Compatibility check first — socket, clearance, PSU headroom"],
      ["סידור כבלים, הפעלת XMP/EXPO ובדיקת תקינות מלאה עד BIOS","Cable management, XMP/EXPO enabled and a full health check to BIOS"],
      ["עדכון BIOS אם נדרש","BIOS update if needed"]
    ] },
  { key:"asm-premium", he:"הרכבה פרימיום", en:"Premium build", price:450, wasPrice:650, group:"assembly", requiresPc:true,
    details:[
      ["כל מה שבהרכבת המחשב","Everything in the standard build"],
      ["בדיקת עומס של 3 שעות — טמפרטורות, תדרים, יציבות","A 3-hour stress test — temperatures, clocks, stability"],
      ["דוח מסירה חתום עם תוצאות הבדיקות","A signed hand-over report with the results"],
      ["כיול עקומות מאווררים לשקט/ביצועים","Fan curves tuned for silence or performance"]
    ] },

  { key:"win-install", he:"התקנת Windows (ללא רישיון/אקטיבציה)", en:"Windows install (no license/activation)", price:100, wasPrice:200, requiresPc:true,
    details:[
      ["התקנה נקייה, בלי תוכנות מיותרות","Clean install, no bloatware"],
      ["כל הדרייברים מותקנים ומעודכנים + עדכוני Windows","All drivers installed and updated + Windows updates"],
      ["⚠️ בלי רישיון — המערכת עובדת, וניתן להזין מפתח משלך בכל שלב. רוצה רישיון מקורי? נסגור בשיחה","⚠️ No license — Windows runs, and you can enter your own key any time. Want a genuine license? We'll sort it by phone"]
    ] },
  { key:"software-install", he:"התקנת תוכנות", en:"Software installation", price:50, wasPrice:80, requiresPc:true,
    details:[
      ["התקנת התוכנות שתבקש — דפדפן, אופיס, סטים, דיסקורד וכו'","Installing the software you ask for — browser, Office, Steam, Discord etc."],
      ["הגדרות בסיסיות והתחברות לחשבונות שלך","Basic configuration and signing into your accounts"],
      ["⚠️ רישיונות לתוכנות בתשלום אינם כלולים","⚠️ Licenses for paid software are not included"]
    ] },
  { key:"data-transfer", he:"העברת נתונים מדיסק שתביא איתך", en:"Data transfer from a drive you send with the order", price:180, wasPrice:250, requiresPc:true,
    details:[
      ["העתקת קבצים, תמונות ומסמכים מהדיסק הישן למחשב החדש","Copying files, photos and documents from the old drive to the new PC"],
      ["שחזור פרופיל הדפדפן — סימניות וסיסמאות שמורות","Browser profile — bookmarks and saved passwords"],
      ["⚠️ הדיסק הישן חייב להגיע פיזית יחד עם ההזמנה","⚠️ The old drive must physically arrive with the order"]
    ] },
  { key:"onsite-setup", he:"התקנת המחשב אצלך בבית", en:"Setup at your home", price:300, wasPrice:450, requiresPc:true,
    details:[
      ["הגעה אליך עם המחשב, חיבור מלא והתקנה בעמדה","I come to you with the PC, connect and set it up at your desk"],
      ["חיבור מסך, עכבר, מקלדת ורשת","Monitor, mouse, keyboard and network hooked up"],
      ["הסבר קצר על המחשב ועל מה שהותקן","A short walkthrough of the PC and what was installed"],
      ["⚠️ עד 30 דק' נסיעה. רחוק יותר — נתאם בטלפון","⚠️ Up to 30 min drive. Further out — we'll arrange by phone"]
    ] },

  /* --- חבילות. `includes` — מה שמכוסה מוצג מסומן-נעול ב-0 ₪. --- */
  { key:"bundle-new-pc", he:"חבילה: מחשב חדש — מוכן לעבודה", en:"Bundle: new PC — ready to work", price:330, group:"assembly", requiresPc:true,
    includes:["asm-basic","win-install","software-install"],
    noteHe:"הרכבה + Windows + תוכנות בסיס. בנפרד: 400 ₪ — חוסך 70 ₪.",
    noteEn:"Assembly + Windows + base software. Separately: 400 ₪ — you save 70 ₪.",
    details:[
      ["הרכבת המחשב המלאה על כל בדיקותיה","The full assembly and all its checks"],
      ["התקנת Windows (ללא רישיון) + כל הדרייברים","Windows installed (no license) + every driver"],
      ["תוכנות הבסיס שתבקש, מותקנות ומוגדרות","The base software you ask for, installed and configured"]
    ] },
  { key:"bundle-home", he:"חבילה: מחשב חדש עד הבית", en:"Bundle: new PC to your door", price:650, group:"assembly", requiresPc:true,
    includes:["asm-basic","win-install","software-install","onsite-setup","data-transfer"],
    /* ⚠️ הסכום "בנפרד" מחושב מהמחירים החיים של הרכיבים —
       ‏250+100+50+300+180 = 880. אם מחיר רכיב משתנה, לעדכן כאן. */
    noteHe:"הכל — כולל הגעה, התקנה בעמדה שלך, העברת נתונים והדרכה. בנפרד: 880 ₪ — חוסך 230 ₪.",
    noteEn:"Everything — arrival, setup at your desk, data transfer and a walkthrough. Separately: 880 ₪ — you save 230 ₪.",
    details:[
      ["כל מה שבחבילת \"מוכן לעבודה\"","Everything in the ready-to-work bundle"],
      ["הגעה אליך והתקנה מלאה בעמדה (עד 30 דק' נסיעה)","Arrival and full setup at your desk (up to 30 min drive)"],
      ["העברת נתונים מהמחשב הישן","Data transfer from your old computer"],
      ["הדרכה קצרה על המחשב החדש","A short walkthrough of the new PC"]
    ] },
];

/* 🔴 "ניקוי פנימי + משחה תרמית" הוסר מהתשלום המקוון (20.08). דביר:
   "כשלקוח מרכיב מחשב חדש אין צורך אף פעם לניקוי + משחה — זה חדש
   מהניילונים."

   ⚠️ והעניין רחב יותר מהמקרה הזה: **כל מה שנמכר בקופה המקוונת הוא
   מוצר חדש**, ולכן שירות שכל כולו מכוון למחשב קיים ומלוכלך אינו יכול
   להיות רלוונטי כאן לעולם. הוא גם דורש שהמחשב יגיע פיזית — כלומר
   תיאום — ולכן מקומו באותה רשימה עם ביקור הבית והתמיכה מרחוק.
   ⚠️ השירות עצמו לא בוטל: הוא ממשיך להיות מוצע דרך support.html. */

/* 🔴 **הבלוק "בתיאום מראש — פנייה דרך העמוד שירות ותמיכה" הוסר
   ב-26.08, לבקשת דביר. אל תחזיר אותו.**

   דביר: *"זה לא נכון... צריך להשאיר שם רק את הדברים שרלוונטים
   למחשב חדש. אבל לא קשור לכתוב שם משחה תרמית כי זה כבר חלק
   מהשירות. אפשר גם לקבל את זה למחשב חדש גם בלי — פשוט צריך אופציה
   להוספה של השירותים האלה לסל."*

   מה קרה לארבעת הפריטים:
     • **ניקוי פנימי + משחה תרמית** — הוסר. מחשב חדש מגיע נקי, וזה
       ממילא חלק מההרכבה. נמכר ב-support.html למחשב קיים.
     • **תמיכה מרחוק** — הוסר מכאן. הוא לא שירות של קנייה חדשה.
     • **התקנת מחשב בעמדת הלקוח** — הפך לשירות **נבחר לגמרי**
       (`onsite-setup`, 400 ₪). זה בדיוק שירות של מחשב חדש.
     • **ביקור בית ואבחון תקלה** — הוסר. שייך למחשב קיים.

   ⚠️ הקישור ל-support.html נשאר בתחתית האזור — מי שמחפש שירות
   למחשב קיים עדיין מוצא את הדרך, בלי רשימה שמתחזה לתפריט. */

let selectedServices = [];   // מפתחות בלבד — זה גם מה שנשלח לשרת

/* =====================================================================
   👤 השלמת פרטים ללקוח מחובר
   =====================================================================
   דביר: "אם מחובר משתמש ויש לנו את הפרטים שלו — שבמעמד הקנייה זה
   ישלים לו אותם. שירגיש שהוא מחובר למשתמש."
   ⚠️ ממלא רק שדות **ריקים** — מה שהלקוח כבר הקליד קדוש. הנתונים
   מגיעים מהמטמון שהאזור האישי שומר אחרי כניסה מאומתת; אין כאן
   קריאת רשת ואין אמון בערכים — השרת ממילא מקבל את מה שבטופס. */
function checkoutPrefill(){
  let prof = null;
  try{
    const raw = localStorage.getItem("dvt_acct_profile");
    if(raw) prof = JSON.parse(raw);
    if(prof && !(prof.exp > Date.now())) prof = null;
  }catch(e){ prof = null; }
  if(!prof) return;
  [["custName", prof.name], ["custPhone", prof.phone], ["custEmail", prof.email]]
    .forEach(function(pair){
      const el = document.getElementById(pair[0]);
      if(el && !el.value.trim() && pair[1]) el.value = pair[1];
    });
  const hint = document.getElementById("checkoutPrefillHint");
  if(hint){
    hint.textContent = tr("👤 שלום " + (String(prof.name || "").split(" ")[0] || "") +
                          " — השלמנו את הפרטים מהחשבון שלך. אפשר לערוך הכל.",
                          "👤 Hi " + (String(prof.name || "").split(" ")[0] || "") +
                          " — we filled in your account details. Everything is editable.");
    hint.hidden = false;
  }
}
if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", checkoutPrefill);
}else{
  checkoutPrefill();
}

/* נצרך פעם אחת בלבד לכל טעינת דף — ראה ההודעה ב-submitCheckout. */
let lowStockAcked = false;
function btnRestore(){
  const b = document.getElementById("checkoutSubmitBtn");
  if(b){ b.disabled = false; b.textContent = t("submitOrderBtn"); }
}

/* 🔴 **`withFreeAssemblyLine` הוסרה ב-26.08. אל תחזיר אותה.**
   היא הוסיפה שורת `assembly-included` ב-0 ₪ לכל עגלה עם מחשב שלם,
   כדי שהבאנר "ההרכבה שלך ללא עלות" לא יהיה שקר ושדביר יראה
   שההזמנה כוללת עבודת הרכבה. היום אין באנר כזה: ההרכבה היא שירות
   בתשלום (`assembly-site`, 199 ₪ במקום 300 ₪) שהלקוח מסמן בעצמו,
   והיא מגיעה לקבלה כשורת שירות אמיתית עם מק"ט CLI-4005.
   ⚠️ `cartHasCompletePc_` בשרת לא נשען עליה — הוא בודק גם את שבעת
   רכיבי הליבה, וזה מה שמזהה עגלה כזו ממילא.
   ⚠️ המפתח `assembly-included` עדיין **מוכר** בשרת, בשביל עגלות
   ישנות ששמורות בדפדפן של לקוח. ראה REAL_SUMIT_SKUS. */
let cartPc = { hasPc:false, hasBuild:false, missing:[], coreCount:0 };   // נקבע ב-renderCheckoutPage

function serviceByKey(key){
  return DVT_SERVICES.find(s => s.key === key) || null;
}

/* ⚠️ **השקלול מול הבונה.** מי שסיים הרכבה בבונה קיבל שורת
   `assembly-included` בעגלה — הרכבה ללא עלות. להציע לו אחר כך חבילה
   שכוללת הרכבה זה לגבות אותו פעמיים על אותה עבודה, והוא גם ישלם יותר:
   "חבילה: מחשב חדש" ב-700 מול "התקנת Windows 11 + רישיון" ב-300 שזה
   כל מה שבאמת חסר לו. לכן במצב הזה מוצגות רק ההתקנות הבודדות.

   ⚠️ **והשקלול השני: שירותים שדורשים מחשב.** בלי זה אפשר היה להוסיף
   "התקנת Windows" לעגלה שיש בה רק עכבר — לקוח משלם 300 ₪ על עבודה
   שאין לה על מה לרוץ. שירותים שאינם תלויי-מחשב (תמיכה מרחוק, העברת
   נתונים, ניקוי + משחה תרמית) **נשארים זמינים תמיד** בכוונה: הם
   מתבצעים על המחשב **הקיים** של הלקוח, ואין שום סיבה להתנות אותם
   בקניית מחשב חדש — להפך, זו בדיוק הסיבה שלקוח כזה פונה. */
function servicesForCart(){
  return DVT_SERVICES.filter(s => {
    if(cartPc.hasBuild && s.includesAssembly) return false;
    if(s.requiresPc && !cartPc.hasPc) return false;
    return true;
  });
}

/* המפתחות שמכוסים ע"י חבילה שנבחרה — מוצגים מסומנים ונעולים, ולא
   מחויבים. ⚠️ **הם לא נמצאים ב-selectedServices בכוונה**: הרשימה הזו
   היא מה שהלקוח בחר *ומשלם עליו*, וערבוב של השניים היה מחזיר בדיוק
   את הגבייה הכפולה שהמנגנון הזה בא למנוע. */
function coveredServiceKeys(){
  const covered = [];
  selectedServices.forEach(key => {
    const o = serviceByKey(key);
    if(o && Array.isArray(o.includes)){
      o.includes.forEach(k => { if(covered.indexOf(k) === -1) covered.push(k); });
    }
  });
  return covered;
}

/* ⚠️ הנחת "הרכבה+Windows −50" הוחלפה (27.08) במודל החבילות של
   DVT-NEXT-BUILD §1.2 — חבילה במחיר אחד, `includes` מכסה את השורות.
   מה שנבחר וכלול בחבילה אינו נספר פעמיים: coveredServiceKeys. */
function servicesTotal(){
  const covered = coveredServiceKeys();
  return selectedServices.reduce((sum, key) => {
    if(covered.indexOf(key) !== -1) return sum;   /* כלול בחבילה — 0 */
    const o = serviceByKey(key);
    return sum + (o ? o.price : 0);
  }, 0);
}

/* ההסבר שמעל רשימת השירותים. שלושה מצבים שונים לחלוטין, ולכן שלוש
   הודעות ולא נוסח אחד מעורפל: אין מחשב בעגלה / יש הרכבה מהבונה /
   הרגיל. ⚠️ כשאין מחשב — חייבים לומר **מה בדיוק חסר**, אחרת הלקוח
   רואה רשימה מקוצצת בלי שום רמז למה ולא יכול לתקן. */
function renderServicesHint(){
  const el = document.getElementById("servicesHint");
  if(!el) return;

  if(!cartPc.hasPc){
    el.classList.add("is-locked");
    // עגלה שיש בה חלק מהרכיבים = "כמעט מחשב", וכדאי לומר מה חסר.
    // עגלה בלי אף רכיב ליבה (עכבר בלבד) = הודעה כללית; רשימה של שישה
    // רכיבים חסרים היא רעש, לא מידע.
    if(cartPc.coreCount > 0){
      const missingNames = cartPc.missing
        .map(c => tr(CORE_CAT_LABELS[c][0], CORE_CAT_LABELS[c][1]))
        .join(tr(", ", ", "));
      el.textContent = tr(
        "שירותי ההתקנה נפתחים כשיש בהזמנה מחשב שלם. חסר בעגלה: " + missingNames +
        ". אפשר להשלים מהקטלוג, או לבנות מחשב בבונה — שם גם נבדקת ההתאמה בין הרכיבים.",
        "Installation services unlock once the order contains a complete PC. Missing from your cart: " + missingNames +
        ". Add them from the catalogue, or configure a build in the PC Builder — which also checks part compatibility.");
    }else{
      el.textContent = tr(
        /* 🔴 **"או הרכבה מהבונה" תוקן ל"מהבונה או מהקטלוג" — דביר:
           "לא חייב שהמחשב יהיה מהבונה ספציפית, אפשר גם לבחור ידנית
           מהקטלוג... במידה ויש באג בבונה, עדיף שהוא יבחר לבד."**
           ⚠️ הניסוח הקודם שלח לקוח שכבר אסף את כל הרכיבים ידנית
           להתחיל מחדש בבונה — בלי סיבה, כי הבדיקה בשרת מזהה את
           שתי הדרכים בדיוק אותו דבר (cartHasCompletePc_). */
        "שירותי ההתקנה וההרכבה נפתחים כשיש בהזמנה מחשב שלם — מחשב מוכן, נייד, או כל רכיבי הליבה: מהבונה או שנבחרו ידנית מהקטלוג.",
        "Installation and assembly services unlock once the order contains a complete PC — a ready-made PC, a laptop, or all core components: from the PC Builder or picked manually from the catalogue.");
    }
    return;
  }

  el.classList.remove("is-locked");
  el.textContent = tr(
    "אופציונלי — אפשר גם לדלג. כל שירות מתואם איתך בטלפון אחרי ההזמנה.",
    "Optional — feel free to skip. Every service is scheduled with you by phone after checkout.");
}

function renderServiceOptions(){
  const host = document.getElementById("servicesOptions");
  if(!host) return;

  document.getElementById("servicesTitle").textContent = tr("שירותים נוספים","Add-on services");
  document.getElementById("servicesToggleOpen").textContent  = tr("הצג","Show");
  document.getElementById("servicesToggleClose").textContent = tr("הסתר","Hide");
  renderServicesHint();

  const covered = coveredServiceKeys();

  host.innerHTML = servicesForCart().map(s => {
    const isCovered = covered.indexOf(s.key) !== -1;
    const on = isCovered || selectedServices.indexOf(s.key) !== -1;
    /* שירות שכלול בחבילה: מסומן, **מושבת** (disabled), ומחירו "כלול".
       disabled ולא רק "מתעלמים מהקליק" — כך גם מקלדת וקורא מסך יודעים
       שאי אפשר לשנות את זה, ולא רק מי שרואה את הצבע. */

    /* המחיר שמוצג. שלושה מצבים:
         כלול בחבילה  → 0 ₪
         הנחת 1+1     → המחיר החדש, והישן מחוק לידו
         רגיל         → המחיר, ואם יש `wasPrice` — גם המחיר המלא מחוק */
    /* המחיר בשתי שכבות: מחיר הטכנאי מחוק, מחיר DvirTech פעיל.
       ⚠️ הקו החתוך חוקי רק כי מחיר הטכנאי נגבה בפועל (ב-CRM) ממי
       שלא רכש חומרה — ראה ההערה מעל DVT_SERVICES. */
    let priceHtml;
    if(isCovered){
      priceHtml = t("included") + " · 0 ₪";
    }else if(s.wasPrice && s.wasPrice > s.price){
      priceHtml = `<s>${s.wasPrice.toLocaleString()} ₪</s> +${s.price.toLocaleString()} ₪`;
    }else{
      priceHtml = "+" + s.price.toLocaleString() + " ₪";
    }

    let note = "";
    if(isCovered){
      note = tr("כלול במחיר החבילה שבחרת — לא נגבה בנפרד.",
                "Included in the bundle you selected — not charged separately.");
    }else if(s.wasPrice && s.wasPrice > s.price){
      note = tr("מחיר לקוחות DvirTech — כי החומרה נקנית כאן. חסכת " + (s.wasPrice - s.price) + " ₪.",
                "DvirTech customer price — because the hardware is bought here. You save " + (s.wasPrice - s.price) + " ₪.");
      if(s.noteHe) note = tr(s.noteHe, s.noteEn);
    }else if(s.noteHe){
      note = tr(s.noteHe, s.noteEn);
    }

    /* 🔴 **הפירוט יושב מחוץ ל-`<label>`, ואל תכניס אותו פנימה.**
       כל קליק בתוך label מחליף את התיבה שלו — כלומר לחיצה על "מה
       כלול?" הייתה מסמנת את השירות. זו בדיוק סוג התקלה שנראית
       למשתמש כמו "האתר מסמן לי דברים לבד". */
    const detId = "svcd-" + s.key;
    const details = Array.isArray(s.details) && s.details.length
      ? `<button type="button" class="svc-more" aria-expanded="false" aria-controls="${detId}"
                 onclick="svcToggleDetails('${detId}', this)">${tr("מה כלול בשירות?","What's included?")}</button>
         <ul class="svc-details" id="${detId}" hidden>${
           s.details.map(d => `<li>${escHtml(tr(d[0], d[1]))}</li>`).join("")}</ul>`
      : "";

    return `
    <div class="svc-row${s.hot ? " is-hot" : ""}">
      <label class="svc-opt${on ? " is-on" : ""}${isCovered ? " is-covered" : ""}">
        <input type="checkbox" ${on ? "checked" : ""} ${isCovered ? "disabled" : ""}
               onchange="onServiceToggle('${s.key}', this.checked)">
        <span class="svc-name">${tr(s.he, s.en)}${
          s.hot ? `<span class="svc-badge">${tr("מומלץ","Recommended")}</span>` : ""}</span>
        <span class="svc-price">${priceHtml}</span>
        ${note ? `<span class="svc-note">${note}</span>` : ""}
      </label>
      ${details}
    </div>`;
  }).join("");

  renderBundleNudge();

  /* קישור בלבד — הרשימה עצמה הוסרה (ראה ההערה ליד DVT_SERVICES).
     ⚠️ הניסוח מדבר על **מחשב קיים**, כי זה מה שבאמת נמצא שם. */
  const req = document.getElementById("servicesOnRequest");
  if(req){
    req.innerHTML =
      `<div class="svc-onreq-h">${tr("יש לך מחשב קיים שצריך טיפול?",
                                     "Got an existing computer that needs work?")}</div>` +
      `<a class="svc-onreq-link" href="support.html">${tr("ניקוי, אבחון תקלה, תמיכה מרחוק וביקור בית — לעמוד שירות ותמיכה ←",
                                                          "Cleaning, diagnostics, remote support and home visits — go to Support →")}</a>`;
  }

  renderServicesCounter();
}

function svcToggleDetails(id, btn){
  const el = document.getElementById(id);
  if(!el) return;
  const open = el.hidden;
  el.hidden = !open;
  btn.setAttribute("aria-expanded", open ? "true" : "false");
  btn.textContent = open ? tr("סגור פירוט","Hide details")
                         : tr("מה כלול בשירות?","What's included?");
}

/* 🔴 **דחיפת החבילה — "טריגר שאם הוא פספס, זה קופץ לו" (דביר).**
   ⚠️ הודעה, לא סימון אוטומטי — שירות בתשלום שמסומן בשם הלקוח הוא
   בדיוק מה שחוק הגנת הצרפן אוסר, וגם קורא כתרגיל.
   ⚠️ מוצגת רק כשהחבילה באמת זולה מהבחירה הנוכחית של הלקוח —
   הצעה ש"חוסכת" וגם מייקרת היא שקר שנחשף בשורת הסכום. */
function renderBundleNudge(){
  const el = document.getElementById("servicesBundleNudge");
  if(!el) return;

  const offered = servicesForCart().map(s => s.key);
  if(offered.indexOf("bundle-new-pc") === -1){ el.hidden = true; return; }
  if(selectedServices.indexOf("bundle-new-pc") !== -1 ||
     selectedServices.indexOf("bundle-home") !== -1){ el.hidden = true; return; }

  const pkg = serviceByKey("bundle-new-pc");
  /* כמה עולה ללקוח היום מה שהחבילה מכסה — רק ממה שכבר בחר. */
  const coveredNow = pkg.includes.filter(k => selectedServices.indexOf(k) !== -1);
  const nowCost = coveredNow.reduce((s2, k) => {
    const o = serviceByKey(k); return s2 + (o ? o.price : 0);
  }, 0);
  const fullCost = pkg.includes.reduce((s2, k) => {
    const o = serviceByKey(k); return s2 + (o ? o.price : 0);
  }, 0);

  if(coveredNow.length && nowCost >= pkg.price){
    /* כבר בחר שירותים ששווים לפחות כמו החבילה — שדרוג משתלם נטו */
    el.innerHTML = tr(
      "💡 בחרת שירותים ב-" + nowCost.toLocaleString() + " ₪. <b>חבילת \"מחשב חדש — מוכן לעבודה\"</b> נותנת את כולם + השאר ב-" + pkg.price.toLocaleString() + " ₪.",
      "💡 Your picks total " + nowCost.toLocaleString() + " ₪. The <b>ready-to-work bundle</b> covers them all + the rest for " + pkg.price.toLocaleString() + " ₪.");
    el.hidden = false;
  }else if(!coveredNow.length){
    el.innerHTML = tr(
      "💡 <b>הרכבה + Windows + תוכנות יחד</b> — " + pkg.price.toLocaleString() + " ₪ במקום " + fullCost.toLocaleString() + " ₪ בנפרד.",
      "💡 <b>Assembly + Windows + software together</b> — " + pkg.price.toLocaleString() + " ₪ instead of " + fullCost.toLocaleString() + " ₪ separately.");
    el.hidden = false;
  }else{
    el.hidden = true;
  }
}

/* המונה בכותרת הוא כל מה שרואים כשהאזור סגור — בלעדיו אי אפשר לדעת
   שנבחר שם משהו בלי לפתוח אותו שוב. */
function renderServicesCounter(){
  const el = document.getElementById("servicesCount");
  if(!el) return;
  // הכלולים נספרים כי הלקוח **מקבל** אותם — מונה שאומר "שירות אחד"
  // כשבפועל מקבלים שלושה מקטין את מה שנרכש. הסכום נשאר מה שנגבה.
  const n = selectedServices.length + coveredServiceKeys().length;
  el.classList.toggle("is-on", n > 0);
  if(!n){ el.textContent = tr("אופציונלי","Optional"); return; }
  const label = n === 1
    ? tr("שירות אחד","1 service")
    : (n + " " + tr("שירותים","services"));
  el.textContent = label + " · " + servicesTotal().toLocaleString() + " ₪";
}

function onServiceToggle(key, on){
  const opt = serviceByKey(key);
  if(!opt) return;
  // שירות שכלול בחבילה נעול (disabled) ולא אמור להגיע לכאן בכלל —
  // הגנה מפני קליק שהתרחש בכל זאת (למשל אירוע שנשלח מה-DevTools).
  if(coveredServiceKeys().indexOf(key) !== -1){ renderServiceOptions(); return; }

  if(on){
    // שירות מאותה קבוצה כבר נבחר? מחליפים אותו במקום להוסיף — שתי דרכים
    // להתקין Windows (או חבילה שכוללת Windows) הן אותה עבודה.
    if(opt.group){
      selectedServices = selectedServices.filter(k => {
        const o = serviceByKey(k);
        return !o || o.group !== opt.group;
      });
    }
    /* ⚠️ **הליבה של תיקון הגבייה הכפולה.** חבילה שנבחרה מסירה מהבחירה
       את כל מה שכלול בה — אחרת "התקנה בעמדת הלקוח" שנבחרה לפני החבילה
       הייתה נשארת ונגבית ב-400 ₪ בנוסף ל-700 של החבילה, על אותה עבודה
       בדיוק. הן חוזרות מיד למטה כשורות "כלול · 0 ₪" נעולות. */
    if(Array.isArray(opt.includes)){
      selectedServices = selectedServices.filter(k => opt.includes.indexOf(k) === -1);
    }
    selectedServices.push(key);
  }else{
    selectedServices = selectedServices.filter(k => k !== key);
    /* הסרת חבילה מחזירה את מה שהיה כלול בה למחיר מלא — אבל **לא
       מסומן**. אילו היו חוזרים מסומנים, הסכום היה קופץ ב-700 ₪ בלי
       שהלקוח בחר בכך אף פעם, וזו הפתעה בשלב התשלום. עכשיו הם פשוט
       זמינים לבחירה שוב, כל אחד במחירו. */
  }
  renderServiceOptions();
  renderCheckoutTotals();
}

/* ==================== תוויות אפשרויות התשלומים ====================
   🔴 **זה הריכוך של המדרגה בתשלום הרביעי — בממשק ולא בנוסחה.**
   הרשימה הציגה מספרים חשופים (1, 2, 3, 4, 6…) והעמלה התגלתה רק
   **אחרי** הבחירה. לקוח שכבר החליט "ארבעה תשלומים" וגילה 177 ₪
   מרגיש שעבדו עליו — וזו בדיוק התחושה שמפילה עגלות.

   עכשיו כל שורה נושאת את המחיר שלה — "תשלום אחד · ללא עמלה" מול
   "2 — ‎+X ₪" באותה רשימה. הלקוח בוחר בעיניים פקוחות.

   ⚠️ נבנה מחדש בכל שינוי בעגלה/משלוח/שירותים, כי הסכום משתנה.
   ⚠️ הבחירה הקיימת נשמרת — בנייה מחדש שמאפסת ל-1 הייתה מוחקת
   בחירה של הלקוח בכל פעם שהוא מוסיף שירות. */
/* 🔴 **"הכי משתלם" — נגזר מהנוסחה, ולעולם לא מספר קבוע.**

   דביר: *"3 תשלומים זה עדיין במסלול היקר יותר עם עמלה של 0.9+מע"מ,
   לעומת 4 תשלומים שכל אחד מהם 0.75+מע"מ. זה לא הכי זול אבל כן הכי
   משתלם — שים לב לקפיצה באחוז בין 3 ל-4."*

   ⚠️ **הוא צודק, ואני טעיתי כשהצעתי לשים את התווית על 3.** המספרים:
     3 תשלומים → 0.9 × 3 × 1.18 = **3.19%**  (‏1.06% לכל תשלום)
     4 תשלומים → 0.75 × 4 × 1.18 = **3.54%** (‏0.89% לכל תשלום)
   כלומר התשלום הרביעי עולה 0.35% בלבד — פחות משליש ממה שעלה כל
   אחד משלושת הראשונים. זו נקודת המעבר לפס ה-0.75%.

   ⚠️ מ-4 והלאה **האחוז לתשלום זהה** (0.89%), ולכן "הכי משתלם" הוא
   ה-n **הנמוך ביותר** בפס הזול — מעבר לו משלמים יותר סה"כ בלי
   לשפר את התעריף. זה בדיוק מה שהחישוב למטה מוצא.
   ⚠️ **לא לקבע "4".** אם ישתנו התעריפים ב-UPAY, התווית תזוז לבד
   למקום הנכון. מספר קשיח כאן יהפוך לשקר ביום שהעמלות ישתנו. */
function bestValueInstallments(base){
  const sel = document.getElementById("installmentsCount");
  if(!sel || !(base > 0)) return 0;
  let best = 0, bestRate = Infinity;
  Array.prototype.forEach.call(sel.options, function(opt){
    const n = parseInt(opt.value, 10) || 1;
    const fee = installmentFeeAmount(base, n);
    if(!(fee > 0)) return;                 /* בלי עמלה — לא בהשוואה */
    const rate = fee / n;                  /* עלות לכל תשלום */
    /* `- 0.001` : רק שיפור אמיתי מנצח. שוויון נשאר אצל ה-n הנמוך. */
    if(rate < bestRate - 0.001){ bestRate = rate; best = n; }
  });
  return best;
}

function renderInstallmentOptions(base){
  const sel = document.getElementById("installmentsCount");
  if(!sel) return;
  const keep = sel.value;
  const best = bestValueInstallments(base);
  Array.prototype.forEach.call(sel.options, function(opt){
    const n = parseInt(opt.value, 10) || 1;
    const fee = installmentFeeAmount(base, n);
    const word = n === 1 ? tr("תשלום אחד", "1 payment")
                         : n + tr(" תשלומים", " payments");
    /* ⚠️ הסכום מוצג מדויק, לא מעוגל — דביר: "חשוב ע\"פ חוק להראות
       את התשלום המדויק." אגורות מוצגות רק כשהן קיימות. */
    let txt = fee > 0
      ? word + "  ·  +" + dvtMoney(fee) + " ₪"
      : word + "  ·  " + tr("ללא עמלה", "no fee");
    if(n === best) txt += "  ·  " + tr("⭐ הכי משתלם", "⭐ best value");
    opt.textContent = txt;
  });
  sel.value = keep;

  /* הסבר קצר מתחת לבורר — אחרת "הכי משתלם" על אפשרות שיש בה עמלה
     נראה כמו טעות. ⚠️ הטקסט נבנה מהמספרים בפועל ולא נכתב ידנית. */
  const hint = document.getElementById("installmentsBest");
  if(hint){
    if(best > 1 && base > 0){
      const prev = best - 1;
      const delta = Math.round((installmentFeeAmount(base, best) -
                                installmentFeeAmount(base, prev)) * 10) / 10;
      hint.textContent = tr(
        "⭐ מ-" + best + " תשלומים העמלה לכל תשלום יורדת. המעבר מ-" + prev +
        " ל-" + best + " עולה " + delta.toLocaleString() + " ₪ בלבד.",
        "⭐ From " + best + " payments the per-payment fee drops. Going from " +
        prev + " to " + best + " costs only " + delta.toLocaleString() + " ₪.");
      hint.hidden = false;
    }else{
      hint.hidden = true;
    }
  }
}

/* מטבע לתצוגה: שלם בלי אגורות, שבר עם שתי ספרות בדיוק. */
function dvtMoney(n){
  const v = Math.round(Number(n) * 100) / 100;
  return v % 1 === 0 ? v.toLocaleString()
       : v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderCheckoutTotals(){
  const count = parseInt(document.getElementById("installmentsCount").value, 10) || 1;
  const shipCost = shippingPrice();
  const svcCost = servicesTotal();
  /* ⚠️ העמלה מחושבת על הסכום **כולל משלוח וכולל שירותים** — זה מה
     שנגבה בפועל בכרטיס, וכך בדיוק מחשב createPayment_ בצד השרת. */
  const base = Math.round((cartSubtotal + shipCost + svcCost) * 100) / 100;
  const fee = installmentFeeAmount(base, count);
  renderInstallmentOptions(base);
  const grandTotal = Math.round((base + fee) * 100) / 100;
  /* עמלה מוצגת מדויקת גם בשורת הפירוט למטה. */
  /* 🔴 **הבאג שהשאיר "סה\"כ לתשלום: 0 ₪" בקופה החיה.**
     `pct` הוזכר פעמיים בהמשך הפונקציה ומעולם לא הוגדר — שריד
     מריפקטור שבו העמלה עברה מאחוז שטוח ל-installmentFeeAmount().
     ReferenceError הפיל את renderCheckoutTotals לפני השורה
     האחרונה, ולכן grandTotalPrice נשאר על ערכו ההתחלתי לנצח.
     ⚠️ הלקוח ראה "סכום הרכישה 379 ₪" ומתחתיו "סה\"כ לתשלום 0 ₪".
     האחוז האפקטיבי נגזר עכשיו מהעמלה בפועל ולא ממשתנה נפרד,
     כך שהתווית והסכום לא יכולים להיפרד שוב. */
  const pct = base > 0 ? Math.round((fee / base) * 1000) / 10 : 0;

  const shipRow = document.getElementById("shipRow");
  if(shipRow){
    /* משלוח שהורווח חינם — מציגים שורה עם 0 ₪ (במתנה) במקום להעלים,
       כדי שהלקוח יראה שההטבה באמת חלה. */
    const freeWon = shippingKey !== "pickup" && shippingOption() &&
                    shippingOption().price > 0 && shipCost === 0;
    shipRow.style.display = (shipCost > 0 || freeWon) ? "block" : "none";
    if(freeWon){
      const o = shippingOption();
      document.getElementById("shipLabel").textContent =
        (o ? tr(o.he, o.en) : tr("משלוח","Delivery")) + " " + tr("(במתנה 🎁)","(free gift 🎁)");
      document.getElementById("shipValue").textContent = "0 ₪";
    }
    if(shipCost > 0){
      // שם האפשרות שנבחרה בפועל ולא טקסט קבוע — יש יותר מאפשרות אחת
      // בתשלום, ושורה שכתוב בה "משלוח מהיר" כשנבחר משהו אחר היא שקר.
      const o = shippingOption();
      document.getElementById("shipLabel").textContent = o ? tr(o.he, o.en) : tr("משלוח","Delivery");
      document.getElementById("shipValue").textContent = shipCost.toLocaleString() + " ₪";
    }
  }

  const svcRow = document.getElementById("servicesRow");
  if(svcRow){
    svcRow.style.display = svcCost > 0 ? "block" : "none";
    if(svcCost > 0){
      // אותו מונה כמו בכותרת האזור (כולל הכלולים בחבילה) — שתי שורות
      // באותו מסך שסופרות אחרת נראות כמו באג.
      document.getElementById("servicesRowLabel").textContent =
        tr("שירותים נוספים","Add-on services") +
        " (" + (selectedServices.length + coveredServiceKeys().length) + ")";
      document.getElementById("servicesRowValue").textContent = svcCost.toLocaleString() + " ₪";
    }
  }

  const feeRow = document.getElementById("feeRow");
  const breakdownRow = document.getElementById("monthlyBreakdownRow");
  if(pct > 0){
    feeRow.style.display = "block";
    document.getElementById("feeLabel").textContent = t("feeLabelPrefix") + " (" + pct + "%)";
    document.getElementById("feeValue").textContent = dvtMoney(fee) + " ₪";

    /* 🔴 **פירוק מדויק לפי חוק — לא "בערך" (27.08).**
       ‏463 ₪ ב-3 תשלומים אינו "3 × 154.33" (זה 462.99): התשלום
       הראשון סופג את השארית — 154.34 + 2 × 154.33. מציגים בדיוק
       את מה שיירד בכרטיס, אגורה באגורה, כמו שחוק הגנת הצרכן
       (פרטי עסקה) דורש. */
    const perLow = Math.floor((grandTotal / count) * 100) / 100;
    const first = Math.round((grandTotal - perLow * (count - 1)) * 100) / 100;
    breakdownRow.style.display = "block";
    breakdownRow.textContent = Math.abs(first - perLow) < 0.005
      ? t("monthlyBreakdownPrefix") + " " + count + " " +
        t("monthlyBreakdownMiddle") + " " + dvtMoney(perLow) + " ₪ " + t("monthlyBreakdownSuffix")
      : tr("תשלום ראשון " + dvtMoney(first) + " ₪ + " + (count - 1) + " תשלומים של " + dvtMoney(perLow) + " ₪",
           "First payment " + dvtMoney(first) + " ₪ + " + (count - 1) + " payments of " + dvtMoney(perLow) + " ₪");
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
  /* ⚠️ כתובת חובה כשנבחר משלוח. בלי הבדיקה הזו ההזמנה מגיעה בלי כתובת
     והחבילה לא יוצאת — זה לא שדה "נחמד שיהיה". */
  const needAddr = shippingKey !== "pickup";
  const addrOk = !needAddr ||
    (((document.getElementById("custCity")||{}).value||"").trim().length >= 2 &&
     ((document.getElementById("custStreet")||{}).value||"").trim().length >= 2);
  const termsOk = document.getElementById("termsAgreeCheckbox").checked;
  const box = document.getElementById("checkoutValidation");
  const isBusiness = document.getElementById("isBusinessCheckbox").checked;
  const companyName = document.getElementById("custCompanyName").value.trim();

  if(!name || !phoneOk){
    box.style.display = "block";
    box.textContent = t("checkoutValidationBasic");
    return;
  }
  if(!addrOk){
    box.style.display = "block";
    box.textContent = tr("צריך עיר ורחוב כדי שנדע לאן לשלוח. בוחרים איסוף עצמי? החלף את אופן האספקה למעלה.",
                         "We need a city and street to ship to. Picking it up yourself? Switch the delivery method above.");
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
  /* ⚠️ **לא נוספת יותר שורת `assembly-included` ב-0 ₪.** ההרכבה היא
     שירות בתשלום שהלקוח מסמן בעצמו — ראה ההערה ליד המקום שבו
     `withFreeAssemblyLine` ישבה. */
  const lines = cartItemsToLines(items);
  if(!lines.length){
    box.style.display = "block";
    box.textContent = t("cartEmpty");
    return;
  }

  /* ⚠️ העגלה יושבת ב-localStorage לימים. מוצר שהיה במלאי כשנוסף יכול
     לאזול עד שהלקוח חוזר לשלם, ואת זה בדיקת ההוספה לא תופסת.
     הבדיקה בצד שרת (`checkStockLive_`) היא הקו האחרון, אבל היא רצה
     אחרי שהלקוח כבר מילא טפסים — עדיף לומר לו כאן. */
  if(typeof dvtCartOutOfStock === "function"){
    const gone = dvtCartOutOfStock(items);
    if(gone.length){
      box.style.display = "block";
      box.textContent = tr("אזל מהמלאי ואי אפשר להזמין: ",
                           "Out of stock, cannot be ordered: ") +
                        gone.map(g => g.name).join(", ") +
                        tr(". הסר מהעגלה ונסה שוב.", ". Please remove and try again.");
      return;
    }
  }

  /* ⚠️ **הודעה, לא חסימה.** דביר: "אני לא רוצה מצב שהלקוח מנסה
     להזמין, יוצר איתי קשר, ועד שאני מברר מול הספק הוא כבר קנה
     במקום אחר — עדיף שיזמין ונסתדר אחרי זה."
     ולכן: מיידעים ומאפשרים להמשיך. אין תיבת אישור — עיכוב אפשרי
     באספקה אינו מחייב הסכמה מפורשת, וצ'קבוקס היה מלחיץ בלי צורך.
     ⚠️ מוצגת פעם אחת: `lowStockAcked` מונע חזרה על אותה הודעה בכל
     לחיצה, אחרת הלקוח לא יכול להשלים את ההזמנה בכלל. */
  if(!lowStockAcked && typeof dvtCartLowStock === "function"){
    const low = dvtCartLowStock(items);
    if(low.length){
      lowStockAcked = true;
      box.style.display = "block";
      box.className = "checkout-note-warn";
      box.textContent =
        tr("שים לב: ", "Please note: ") +
        low.map(l => l.name).join(", ") +
        tr(low.length === 1 ? " מסומן בזמינות מלאי נמוכה. " : " מסומנים בזמינות מלאי נמוכה. ",
           low.length === 1 ? " is marked as low stock. " : " are marked as low stock. ") +
        tr("אפשר להזמין כרגיל — רק ייתכן שזמן האספקה יהיה ארוך מהמצוין. אעדכן אותך אם כן. לחיצה נוספת על הכפתור תמשיך בהזמנה.",
           "You can order as usual — delivery may simply take longer than stated. I will update you if it does. Press the button again to continue.");
      btnRestore();
      return;
    }
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
        /* ⚠️ הכתובת נשלחת כשדה נפרד ולא נדחסת לתוך `name` — היא צריכה
           להגיע לקבלה ולהודעה שדביר מקבל, ושם היא נקראת בפני עצמה. */
        customer: { name, phone, email, isBusiness, companyName,
                    address: shippingAddressText() },
        lines: lines,
        installments: installments,
        // רק המפתח נשלח. המחיר נקבע בשרת — ראה SHIPPING_OPTIONS_.
        shipping: shippingKey,
        // אותו דבר לשירותים: מפתחות בלבד, השרת מתמחר (SERVICE_OPTIONS_).
        services: selectedServices,
        /* 🎁 **מק"ט המתנה בלבד — לא מחיר, לא תקרה, לא זהות מדרגה.**
           השרת בודק מחדש שהלקוח באמת זכאי, שהמוצר קיים ובמלאי,
           שמחירו בתוך התקרה, ושאינו כבר בעגלה (giftResolvePick_).
           ⚠️ **אסור** להוסיף כאן שדה שאומר כמה ההטבה שווה. השדה הזה
           הוא בקשה, לא הענקה — ראה ההערה בראש מנוע ההטבות. */
        giftSku: (typeof dvtGiftPicked === "function" ? dvtGiftPicked() : "")
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

    /* 🔴 **שומרים את מספר ההזמנה לפני היציאה — זה מה שמציל תשלום בביט.**
       SUMIT מתעדת במפורש: "פרמטרים לא יוחזרו כאשר התשלום מתבצע דרך
       Bit". כלומר לקוח שמשלם בביט **כן** חוזר ל-thanks.html, אבל
       בלי `og-paymentid` ובלי `og-externalidentifier` — ולכן הדף
       ראה "אין מזהה תשלום" והציג "לא נמצאה הזמנה", בזמן שהכסף כבר
       ירד. זה בדיוק מה שקרה לדביר.

       ⚠️ אבל מספר ההזמנה ידוע לנו **לפני** שיצאנו: השרת החזיר אותו
       ב-`data.orderId`. שמירתו כאן נותנת ל-thanks.html במה לאמת גם
       כששום פרמטר לא חזר.

       ⚠️ חותמת זמן נשמרת יחד איתו: הזמנה ישנה שנשארה ב-localStorage
       לא אמורה "לאמת את עצמה" בביקור הבא בדף התודה. */
    try {
      localStorage.setItem("dvtPendingOrder", JSON.stringify({
        order: data.orderId || "", at: Date.now()
      }));
    } catch (e) { /* מצב פרטי / אחסון חסום — נופלים למסלול הרגיל */ }

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

/* ==================== שחזור אחרי חזרה מדף התשלום ====================
   🔴 הבאג: submitCheckout מסמן את הכפתור `disabled` ומחליף את הטקסט
   ל-"⏳ שולח...", ואז הדף עובר ל-SUMIT. כשהלקוח לוחץ "הקודם" הדפדפן
   משחזר את העמוד **מה-bfcache** — בדיוק כפי שהיה, כלומר עם כפתור
   מושבת שכתוב עליו "שולח...". הלקוח תקוע ואין לו דרך לנסות שוב.

   ⚠️ זה לא נראה כמו באג אלא כמו תקלת רשת, ולכן לקוח סביר פשוט נוטש.

   `pageshow` עם `persisted` הוא האירוע היחיד שנורה בשחזור מ-bfcache —
   `load` ו-`DOMContentLoaded` לא נורים שוב. נבדק גם `navigation.type`
   כי חלק מהדפדפנים משחזרים בלי לסמן persisted. */
window.addEventListener("pageshow", function (e) {
  var nav = (performance.getEntriesByType &&
             performance.getEntriesByType("navigation")[0]) || {};
  if (!e.persisted && nav.type !== "back_forward") return;
  var b = document.getElementById("checkoutSubmitBtn");
  if (b) { b.disabled = false; b.textContent = t("submitOrderBtn"); }
  /* מרעננים גם את הסכומים — ייתכן שהעגלה השתנתה בלשונית אחרת בזמן
     שהלקוח היה בדף התשלום. */
  if (typeof renderCheckoutPage === "function") { try { renderCheckoutPage(); } catch (x) {} }
});

/* ================= static text (language switch) ================= */
/* =====================================================================
   🎁 בחירת המתנה — אזור בקופה + מודאל קטלוג מסונן
   =====================================================================
   דביר: *"ברגע שלקוח זכאי למתנה — הוא לוחץ על 'בחר מתנה' וזה פותח לו
   את הקטלוג עם סינון."*

   🔴 **המסך הזה הוא נוחות, לא אבטחה.** הוא מציג רק מה שמותר, אבל
   הדפדפן ניתן לעריכה — ולכן `giftResolvePick_` בשרת בודק כל אחד
   מהתנאים האלה מחדש, על העגלה **הסופית**:
     קיים בקטלוג · במלאי · לא חסום/מוסתר · מחיר ≤ התקרה של המדרגה
     שהלקוח באמת עבר · אינו כבר בעגלה.
   מי שיעקוף את המודאל וישלח מק"ט ידנית פשוט לא יקבל מתנה.

   ⚠️ **הבחירה נשמרת ב-localStorage ולא ב-state של הדף** — הלקוח
   עשוי לחזור לקטלוג להוסיף עוד משהו ולחזור. היא נבדקת מחדש בכל
   רינדור, ומתאפסת אם כבר לא תקפה (הסל קטן, המוצר אזל, המחיר עלה).

   ⚠️ הרשימה ממוינת **מהיקר לזול**: מי שמקבל מתנה עד 87 ₪ רוצה לראות
   את מה ששווה 85 ₪, לא כבל ב-12 ₪. */

let giftPickerState = { cap: 0, term: "", cat: "all", limit: 48 };

/* התקרה שהלקוח באמת זכאי לה **לפי החישוב המקומי**. השרת מכריע שוב.
   מחזיר 0 כשאין זכאות. */
function giftActiveCap(){
  if(typeof dvtGiftProgress !== "function") return 0;
  const p = dvtGiftProgress();
  return p ? (p.pickCap || 0) : 0;
}

/* כל המוצרים שאפשר לקחת כמתנה בתקרה הזו.
   ⚠️ `dvtCanBuy` מכסה גם "מוצר אמיתי" (לא `id:none`, לא תת-סוג מוסתר,
   לא "הופסק") וגם "במלאי" — אותם שני תנאים שהשרת בודק. */
function giftCandidates(cap){
  const cat = (typeof dvtCatalogNow === "function") ? dvtCatalogNow() : null;
  if(!cat || !cap) return [];

  const inCart = {};
  readCartFromStorage().forEach(function(i){
    if(i.sku) inCart[i.sku] = true;
    if(i.type === "build" && Array.isArray(i.parts)){
      i.parts.forEach(function(p){ if(p.sku) inCart[p.sku] = true; });
    }
  });

  const out = [];
  Object.keys(cat).forEach(function(key){
    /* `services` — שירות אינו מתנה (השרת דוחה `services:`).
       `content` — תוכן האתר, לא קטגוריית מוצרים. */
    if(key === "services" || key === "content") return;
    const g = cat[key];
    if(!g || !Array.isArray(g.items)) return;
    g.items.forEach(function(it){
      const price = Number(it.price) || 0;
      if(!(price > 0) || price > cap) return;
      if(typeof dvtCanBuy === "function" && !dvtCanBuy(it, key)) return;
      const sku = key + ":" + it.id;
      if(inCart[sku]) return;
      out.push({ sku: sku, cat: key, item: it, price: price });
    });
  });
  out.sort(function(a, b){ return b.price - a.price; });
  return out;
}

/* אזור המתנה בקופה. */
function renderGiftBlock(){
  const box = document.getElementById("giftBlock");
  if(!box) return;

  const cap = giftActiveCap();
  if(!cap){
    box.style.display = "none";
    box.innerHTML = "";
    /* ⚠️ הסל ירד מתחת לרף — מנקים בחירה ישנה, אחרת היא תישלח לשרת
       ותיפסל שם בשקט (וגם תיצור התראת WARN מיותרת אצל דביר). */
    if(typeof dvtGiftSetPicked === "function") dvtGiftSetPicked("");
    return;
  }

  const picked = (typeof dvtGiftPicked === "function") ? dvtGiftPicked() : "";
  let pickedItem = null;
  if(picked){
    const hit = giftCandidates(cap).filter(function(c){ return c.sku === picked; })[0];
    if(hit) pickedItem = hit;
    /* בחירה שכבר לא עומדת בתנאים — נמחקת מיד ולא נשלחת. */
    else if(typeof dvtGiftSetPicked === "function") dvtGiftSetPicked("");
  }

  const head = '<div class="gift-block-head">' +
      '<span class="gift-block-emoji" aria-hidden="true">🎁</span>' +
      '<div><div class="gift-block-title">' +
        escHtml(tr("מגיעה לך מתנה!", "You have earned a gift!")) + '</div>' +
      '<div class="gift-block-sub">' +
        escHtml(tr("מוצר לבחירתך עד " + cap + " ₪ — על חשבוננו",
                   "Any product up to " + cap + " ₪ — on us")) + '</div></div></div>';

  if(pickedItem){
    const nm = (typeof dvtDisplayName === "function")
      ? dvtDisplayName(pickedItem.item.name) : pickedItem.item.name;
    /* אותה סיבה כמו בכרטיס — `.ssr-thumb` חסר CSS מחוץ לחיפוש. */
    const chosenImg = pickedItem.item.image
      ? '<img src="' + escHtml(pickedItem.item.image) + '" alt="" loading="lazy" ' +
        'onerror="this.style.display=\'none\'">'
      : '';
    box.innerHTML = head +
      '<div class="gift-chosen">' +
        '<span class="gift-chosen-img">' + chosenImg + '</span>' +
        '<div class="gift-chosen-main">' +
          '<div class="gift-chosen-name">' + escHtml(nm) + '</div>' +
          '<div class="gift-chosen-price">' +
            escHtml(tr("שווי ", "Worth ")) + pickedItem.price.toLocaleString() + ' ₪ · ' +
            '<b>' + escHtml(tr("במתנה", "free")) + '</b></div>' +
        '</div>' +
        '<button type="button" class="gift-chosen-swap" onclick="giftPickerOpen()">' +
          escHtml(tr("החלף", "Change")) + '</button>' +
      '</div>';
  }else{
    box.innerHTML = head +
      '<button type="button" class="btn btn-accent gift-pick-btn" onclick="giftPickerOpen()">' +
        escHtml(tr("בחר את המתנה שלך", "Choose your gift")) + '</button>' +
      '<p class="gift-block-note">' +
        escHtml(tr("אפשר להחליף עד הרגע האחרון.", "You can change it up to the last moment.")) +
      '</p>';
  }
  box.style.display = "block";
}

/* ---------- המודאל ---------- */
function giftPickerOpen(){
  const cap = giftActiveCap();
  if(!cap) return;
  giftPickerState = { cap: cap, term: "", cat: "all", limit: 48 };

  let ov = document.getElementById("giftPicker");
  if(!ov){
    ov = document.createElement("div");
    ov.id = "giftPicker";
    ov.className = "gift-modal";
    ov.innerHTML =
      '<div class="gift-modal-panel" role="dialog" aria-modal="true">' +
        '<div class="gift-modal-head">' +
          '<h3 id="giftModalTitle"></h3>' +
          '<button class="checkout-close" type="button" onclick="giftPickerClose()" aria-label="close">✕</button>' +
        '</div>' +
        '<input class="gift-modal-search" id="giftModalSearch" type="search" autocomplete="off">' +
        '<div class="gift-modal-cats" id="giftModalCats"></div>' +
        '<div class="gift-modal-grid" id="giftModalGrid"></div>' +
        '<div class="gift-modal-foot">' +
          '<button class="btn btn-secondary" type="button" id="giftModalMore" style="display:none"></button>' +
          '<button class="btn btn-secondary" type="button" onclick="giftPickerChoose(\'\')" id="giftModalNone"></button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    ov.addEventListener("click", function(e){ if(e.target === ov) giftPickerClose(); });
    document.getElementById("giftModalSearch").addEventListener("input", function(e){
      giftPickerState.term = e.target.value || "";
      giftPickerState.limit = 48;
      giftPickerRender();
    });
    document.getElementById("giftModalMore").addEventListener("click", function(){
      giftPickerState.limit += 48;
      giftPickerRender();
    });
    document.addEventListener("keydown", function(e){
      if(e.key === "Escape" && document.getElementById("giftPicker").classList.contains("show")) giftPickerClose();
    });
  }

  document.getElementById("giftModalTitle").textContent =
    tr("בחר מוצר עד " + cap + " ₪", "Pick a product up to " + cap + " ₪");
  document.getElementById("giftModalSearch").placeholder = tr("חיפוש...", "Search...");
  document.getElementById("giftModalSearch").value = "";
  document.getElementById("giftModalNone").textContent = tr("בלי מתנה, תודה", "No gift, thanks");
  document.getElementById("giftModalMore").textContent = tr("הצג עוד", "Show more");
  ov.classList.add("show");
  document.body.style.overflow = "hidden";
  giftPickerRender();
}

function giftPickerClose(){
  const ov = document.getElementById("giftPicker");
  if(ov) ov.classList.remove("show");
  document.body.style.overflow = "";
}

function giftPickerChoose(sku){
  if(typeof dvtGiftSetPicked === "function") dvtGiftSetPicked(sku || "");
  giftPickerClose();
  renderGiftBlock();
}

function giftPickerRender(){
  const grid = document.getElementById("giftModalGrid");
  const cats = document.getElementById("giftModalCats");
  if(!grid) return;

  const all = giftCandidates(giftPickerState.cap);

  /* שבבי קטגוריה — נגזרים ממה שיש בפועל בתקרה הזו ולא מרשימה קבועה.
     בתקרה של 65 ₪ אין כרטיסי מסך, ושבב ריק הוא מבוי סתום. */
  const counts = {};
  all.forEach(function(c){ counts[c.cat] = (counts[c.cat] || 0) + 1; });
  const keys = Object.keys(counts).sort(function(a, b){ return counts[b] - counts[a]; });
  cats.innerHTML = [{ k: "all", n: all.length }]
    .concat(keys.map(function(k){ return { k: k, n: counts[k] }; }))
    .map(function(o){
      /* ⚠️ הקבוצה מהקטלוג נשלחת כארגומנט שני: dvtCatLabel מכיר רק
         את קטגוריות החנות (DVT_CAT_LABEL), ולקטגוריות כמו extras/
         caseFans הוא נופל למפתח האנגלי הגולמי אם אין לו לאן ליפול.
         נתפס בבדיקה — השבבים הציגו "extras" ו-"caseFans". */
      const grp = (typeof dvtCatalogNow === "function" && dvtCatalogNow()) ? dvtCatalogNow()[o.k] : null;
      const label = o.k === "all" ? tr("הכל", "All")
        : ((typeof dvtCatLabel === "function") ? dvtCatLabel(o.k, grp) : o.k);
      return '<button type="button" class="gift-cat' +
        (giftPickerState.cat === o.k ? " on" : "") + '" data-cat="' + escHtml(o.k) + '">' +
        escHtml(label) + ' <span>' + o.n + '</span></button>';
    }).join("");
  Array.prototype.forEach.call(cats.querySelectorAll(".gift-cat"), function(b){
    b.addEventListener("click", function(){
      giftPickerState.cat = b.getAttribute("data-cat");
      giftPickerState.limit = 48;
      giftPickerRender();
    });
  });

  const term = giftPickerState.term.trim().toLowerCase();
  const list = all.filter(function(c){
    if(giftPickerState.cat !== "all" && c.cat !== giftPickerState.cat) return false;
    if(!term) return true;
    return String(c.item.name || "").toLowerCase().indexOf(term) !== -1;
  });

  if(!list.length){
    grid.innerHTML = '<p class="gift-modal-empty">' +
      escHtml(tr("לא נמצא מוצר מתאים. נסה חיפוש אחר או קטגוריה אחרת.",
                 "No matching product. Try another search or category.")) + '</p>';
    document.getElementById("giftModalMore").style.display = "none";
    return;
  }

  const shown = list.slice(0, giftPickerState.limit);
  const picked = (typeof dvtGiftPicked === "function") ? dvtGiftPicked() : "";
  grid.innerHTML = shown.map(function(c){
    const nm = (typeof dvtDisplayName === "function") ? dvtDisplayName(c.item.name) : c.item.name;
    /* 🔴 **תמונה משלנו ולא `dvtThumbHtml` — אל תחזיר אותו לכאן.**
       כל ה-CSS של `.ssr-thumb` מוגדר תחת `.site-search-row` בלבד
       (‏style.css ~145). מחוץ לחלונית החיפוש אין לו שום מידה, ולכן
       ה-`<img>` נפרס בגודלו הטבעי — מאות פיקסלים — גלש מהכרטיס
       וכיסה את השכנים. בדיוק מה שדביר ראה: "המוצרים נחתכים אחד
       בשני, רק אם אני מצביע על אחד מהם הוא קופץ קדימה".
       ⚠️ וגם ממלא המקום של הקטגוריה (אוזניות/מאוורר) הוצג יחד עם
       תמונת המוצר, כי `.ssr-thumb.on .ssr-ph{opacity:0}` גם הוא
       מקומט לחלונית החיפוש. דביר ביקש **רק את תמונת המוצר**. */
    const img = c.item.image
      ? '<img src="' + escHtml(c.item.image) + '" alt="" loading="lazy" ' +
        'onerror="this.style.display=\'none\'">'
      : '';
    return '<button type="button" class="gift-card' + (c.sku === picked ? " on" : "") + '" ' +
      'onclick="giftPickerChoose(\'' + escHtml(c.sku) + '\')">' +
      '<span class="gift-card-img">' + img + '</span>' +
      '<span class="gift-card-name">' + escHtml(nm) + '</span>' +
      '<span class="gift-card-price">' + c.price.toLocaleString() + ' ₪</span>' +
      '</button>';
  }).join("");

  const more = document.getElementById("giftModalMore");
  more.style.display = list.length > shown.length ? "block" : "none";
  more.textContent = tr("הצג עוד " + Math.min(48, list.length - shown.length),
                        "Show " + Math.min(48, list.length - shown.length) + " more");
}


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
  document.getElementById("labelCity").textContent     = tr("עיר / יישוב","City / town");
  document.getElementById("labelStreet").textContent   = tr("רחוב ומספר בית","Street and house number");
  document.getElementById("labelAptNotes").textContent = tr("דירה, קומה, קוד כניסה (לא חובה)","Apartment, floor, entry code (optional)");
  toggleAddressFields();
  document.getElementById("checkoutSubmitBtn").textContent = t("submitOrderBtn");
  document.getElementById("termsAgreeLabel").innerHTML = t("termsAgreeLabelHtml");
  document.getElementById("isBusinessLabel").textContent = t("isBusinessLabel");
  document.getElementById("labelCompanyName").textContent = t("labelCompanyName");
  document.getElementById("invoiceTypeHint").textContent = t("invoiceTypeHint");
/* ⚠️ מוגן ב-if: הפוטר הידני הוחלף ב-site-footer.js (16.08.2026)
     ו-#footerText כבר לא קיים — הגישה הישירה קרסה כאן על כל טעינה
     והפילה את המשך הפונקציה (כולל סימון כפתור השפה). */
  const ft = document.getElementById("footerText");
  if(ft) ft.textContent = t("footerText");
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

/* ⚠️ **אזור המתנה תלוי בשני מקורות אסינכרוניים**, ושניהם עלולים
   להגיע אחרי הרינדור הראשון:
     1. מדרגות ההטבות מהשרת — cart.js קורא ל-renderGiftBlock כשהן חוזרות
     2. הקטלוג — בלעדיו giftCandidates() ריק, כלומר "בחר מתנה" נפתח
        על רשימה ריקה, והמתנה שכבר נבחרה נראית כאילו נמחקה
   לכן רינדור נוסף כשהקטלוג מוכן. ריצה כפולה אינה מזיקה: הפונקציה
   בונה את האזור מאפס בכל קריאה. */
if(typeof dvtGetCatalog === "function"){
  dvtGetCatalog().then(function(){ renderGiftBlock(); })
                 .catch(function(){ /* אין קטלוג — האזור פשוט לא יוצג */ });
}

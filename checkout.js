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
const INSTALLMENT_FEE_PCT_PER_MONTH_PRE_VAT = 0.75;   // מקור: UPAY (0.75%+מע"מ עד 12 תשלומים) — לאמת מול הדשבורד לפני מכירות אמיתיות
const INSTALLMENT_FEE_FREE_UPTO = 3;                 // 1–3 תשלומים: ללא עמלה בכלל
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

  // הרכבה דרך הבונה כבר מזכה — אין מה להציע
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
  box.hidden = false;
  box.innerHTML = `
    <b>${tr("ההרכבה שלך ללא עלות ✓","Your assembly is free ✓")}</b>
    <p>${tr(
      "יש בעגלה את כל הרכיבים למחשב שלם, ולכן ההרכבה מתווספת להזמנה ללא עלות. לפני שמרכיבים אני עובר על ההתאמה בין הרכיבים (שקע המעבד, גודל המארז, הספק ספק הכוח) — ואם משהו לא מסתדר, אעדכן אותך לפני שמתחילים ולפני שנגבה כסף נוסף.",
      "Your cart has every part of a complete PC, so assembly is added to the order at no cost. Before building I check that the parts fit together (CPU socket, case clearance, PSU headroom) — if something doesn't line up I'll tell you before starting, and before anything extra is charged.")}</p>
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

   ⚠️ 1-3 תשלומים: אפס עמלה. מ-4 ומעלה: 0.75% לכל תשלום + מע"מ.
   ⚠️ הצד הזה והצד השני חייבים להישאר זהים ספרה-בספרה — השרת מתמחר
   מחדש ולא סומך על הדפדפן; פער = הלקוח מאשר סכום ומחויב באחר.
*/
function installmentFeeAmount(base, count){
  if(count <= INSTALLMENT_FEE_FREE_UPTO) return 0;
  const advance = base * (INSTALLMENT_FEE_PCT_PER_MONTH_PRE_VAT / 100) * count;
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
  { key:"standard", he:"משלוח רגיל", en:"Standard delivery", price:29, etaHe:"3-7 ימי עסקים", etaEn:"3-7 business days" },
  { key:"express",  he:"משלוח מהיר", en:"Express delivery",  price:59, etaHe:"2-5 ימי עסקים", etaEn:"2-5 business days" }
];
let shippingKey = "standard";

function shippingOption(){
  return DVT_SHIPPING.find(s => s.key === shippingKey) || null;
}

function shippingPrice(){
  const o = shippingOption();
  return o ? o.price : 0;
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
      <span class="ship-price">${s.price === 0 ? tr("ללא עלות","Free") : "+" + s.price.toLocaleString() + " ₪"}</span>
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
const DVT_SERVICES = [
  { key:"win11-license",     he:"התקנת Windows 11 + רישיון",         en:"Windows 11 install + license",       price:300, group:"os", requiresPc:true },
  { key:"win11-own-license", he:"התקנת Windows (ללא רישיון)",        en:"Windows install (license not included)", price:200, group:"os", requiresPc:true },
  /* 🔴 היה בלי `requiresPc`, ולכן הוצע גם כשבעגלה יש רק מארז — דביר
     ראה את זה בפועל וסימן אותו. אי אפשר להתקין תוכנות על מארז ריק.
     ⚠️ הסינון עצמו כבר היה קיים ועבד (servicesForCart), פשוט לא סומן
     על השירות הזה; שני שירותי ה-Windows שלידו כן סומנו. */
  { key:"software-install",  he:"התקנת תוכנות",                      en:"Software installation",              price:80,  requiresPc:true },
  /* ⚠️ הניסוח חייב לומר **מאיפה** מגיעים הנתונים. "העברת נתונים"
     לבד יצר ציפייה שדביר נוסע ללקוח או מחלץ נתונים ממחשב שאין לו —
     ואין לו. בפועל השירות אפשרי רק כשהדיסק הישן מגיע פיזית אליו,
     ולכן זה כתוב בשם השירות עצמו ולא באותיות קטנות. */
  /* ⚠️ requiresPc — צריך מחשב שאליו מעבירים. */
  { key:"data-transfer",     he:"העברת נתונים מדיסק שתביא איתך",     en:"Data transfer from a drive you send with the order", price:200, requiresPc:true },
];

/* 🔴 "ניקוי פנימי + משחה תרמית" הוסר מהתשלום המקוון (20.08). דביר:
   "כשלקוח מרכיב מחשב חדש אין צורך אף פעם לניקוי + משחה — זה חדש
   מהניילונים."

   ⚠️ והעניין רחב יותר מהמקרה הזה: **כל מה שנמכר בקופה המקוונת הוא
   מוצר חדש**, ולכן שירות שכל כולו מכוון למחשב קיים ומלוכלך אינו יכול
   להיות רלוונטי כאן לעולם. הוא גם דורש שהמחשב יגיע פיזית — כלומר
   תיאום — ולכן מקומו באותה רשימה עם ביקור הבית והתמיכה מרחוק.
   ⚠️ השירות עצמו לא בוטל: הוא ממשיך להיות מוצע דרך support.html. */

/* שירותים שמוצגים בדף התשלום **לידיעה בלבד** — בלי תיבת סימון ובלי
   מחיר שנכנס לסכום.
   ⚠️ זו לא הסתרה ולא קישוט: כולם כרוכים בנסיעה, בתיאום או בהערכת
   בעיה, ודביר לא יכול להתחייב עליהם מראש מבלי לדעת לאן ומתי. הצגתם
   כשורה שאי אפשר לבחור מונעת גם את השאלה "אז אתם לא עושים את זה?"
   וגם את ההתחייבות. הפנייה עצמה עוברת ל-support.html. */
const DVT_SERVICES_ON_REQUEST = [
  { he:"ניקוי פנימי + משחה תרמית",     en:"Internal cleaning + thermal paste" },
  { he:"תמיכה מרחוק",                  en:"Remote support" },
  { he:"התקנת מחשב בעמדת הלקוח",       en:"On-site setup at your desk" },
  { he:"ביקור בית ואבחון תקלה",        en:"Home visit & fault diagnosis" }
];

let selectedServices = [];   // מפתחות בלבד — זה גם מה שנשלח לשרת

/* נצרך פעם אחת בלבד לכל טעינת דף — ראה ההודעה ב-submitCheckout. */
let lowStockAcked = false;
function btnRestore(){
  const b = document.getElementById("checkoutSubmitBtn");
  if(b){ b.disabled = false; b.textContent = t("submitOrderBtn"); }
}

/* ⚠️ **בלי זה הבאנר "ההרכבה שלך ללא עלות" הוא שקר.** לקוח שבחר את ששת
   הרכיבים מהקטלוג רואה שההרכבה חינם — אבל בלי שורת הרכבה בהזמנה, דביר
   מקבל הזמנה של שישה חלקים בלי שום סימן שצריך להרכיב אותם. זה לא באג
   של כסף אלא באג של **עבודה שלא תתבצע**.

   ⚠️ **שורה ולא שירות.** `assembly-included` מוגדר בשרת ב-EXTRA_SKUS
   (מחיר 0) ולא ב-SERVICE_OPTIONS_. שליחתו בתוך `services` הייתה מוחזרת
   כ-"שירות לא מוכר" ומפילה את כל התשלום. הוא נשלח כשורה, בדיוק כמו
   שהבונה שולח אותו.

   ⚠️ המחיר לא נשלח מכאן — השרת מתמחר לפי ה-SKU (0 ₪) כמו כל שורה
   אחרת. מה שזה משיג: שורת "הרכבה" נפרדת בקבלה גם ב-0 ₪, כפי שהתקנון
   מבטיח (סעיף 7.2), ודביר רואה שההזמנה כוללת עבודת הרכבה.

   ⚠️ בדיקת כפילות: הרכבה מהבונה כבר מכניסה את השורה הזו לעגלה, ושתי
   שורות הרכבה על אותה הזמנה נראות כמו טעות חיוב. */
function withFreeAssemblyLine(lines){
  if(!cartPc || !cartPc.partsPc || cartPc.hasBuild) return lines;
  if(lines.some(l => l.sku === "assembly-included")) return lines;
  return lines.concat([{ sku: "assembly-included", qty: 1 }]);
}
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

function servicesTotal(){
  return selectedServices.reduce((sum, key) => {
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
        ". אפשר להשלים מהקטלוג, או לבנות מחשב בבונה — שם גם ההרכבה ללא עלות.",
        "Installation services unlock once the order contains a complete PC. Missing from your cart: " + missingNames +
        ". Add them from the catalogue, or configure a build in the PC Builder — assembly is free there.");
    }else{
      el.textContent = tr(
        "שירותי ההתקנה (Windows, התקנה בעמדת הלקוח, חבילות) נפתחים כשיש בהזמנה מחשב שלם — מחשב מוכן, נייד, או הרכבה מהבונה. השירותים שלמטה מתבצעים על המחשב הקיים שלך ולא דורשים קנייה.",
        "Installation services (Windows, on-site setup, bundles) unlock once the order contains a complete PC — a ready-made PC, a laptop, or a build from the PC Builder. The services below are performed on your existing computer and require no purchase.");
    }
    return;
  }

  el.classList.remove("is-locked");
  el.textContent = cartPc.hasBuild
    ? tr("ההרכבה כבר כלולה בהזמנה שלך ללא עלות, אז מופיעות כאן ההתקנות הבודדות בלבד. כל שירות מתואם איתך בטלפון אחרי ההזמנה.",
         "Assembly is already included in your order at no cost, so only the standalone installs are listed. Every service is scheduled with you by phone after checkout.")
    : tr("אופציונלי — אפשר גם לדלג. כל שירות מתואם איתך בטלפון אחרי ההזמנה.",
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
    return `
    <label class="svc-opt${on ? " is-on" : ""}${isCovered ? " is-covered" : ""}">
      <input type="checkbox" ${on ? "checked" : ""} ${isCovered ? "disabled" : ""}
             onchange="onServiceToggle('${s.key}', this.checked)">
      <span class="svc-name">${tr(s.he, s.en)}</span>
      <span class="svc-price">${isCovered
        ? t("included") + " · 0 ₪"
        : "+" + s.price.toLocaleString() + " ₪"}</span>
      ${isCovered
        ? `<span class="svc-note">${tr("כלול במחיר החבילה שבחרת — לא נגבה בנפרד.",
                                       "Included in the bundle you selected — not charged separately.")}</span>`
        : (s.noteHe ? `<span class="svc-note">${tr(s.noteHe, s.noteEn)}</span>` : "")}
    </label>`;
  }).join("");

  /* 🔴 `DVT_SERVICES_ON_REQUEST` הוגדר בקובץ הזה עם הערה מפורטת
     שמסבירה שהוא "מוצג בדף התשלום לידיעה בלבד" — ו**מעולם לא רונדר
     בשום מקום**. חיפוש בקובץ מחזיר מופע אחד: ההגדרה עצמה.

     ⚠️ זה כבר הדפוס הרביעי מאותו סוג בפרויקט (כפתור רשימת המשאלות,
     החיפוש בבונה, site-search.js בתשעה דפים, וזה) — תוכן או פקד
     שהוגדר, תועד, ואף אחד לא חיבר אותו. שווה סריקה יזומה.

     ⚠️ הם מוצגים כשורות טקסט בלי תיבת סימון ובלי מחיר, בכוונה: כולם
     כרוכים בנסיעה או בתיאום, ואי אפשר להתחייב עליהם מראש בקופה. */
  const req = document.getElementById("servicesOnRequest");
  if(req){
    req.innerHTML =
      `<div class="svc-onreq-h">${tr("בתיאום מראש — פנייה דרך העמוד שירות ותמיכה",
                                     "By arrangement — request via the Support page")}</div>` +
      DVT_SERVICES_ON_REQUEST.map(function(o){
        return `<div class="svc-onreq-row"><span>${tr(o.he, o.en)}</span></div>`;
      }).join("") +
      `<a class="svc-onreq-link" href="support.html">${tr("לעמוד שירות ותמיכה ←",
                                                          "Go to Support →")}</a>`;
  }

  renderServicesCounter();
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

function renderCheckoutTotals(){
  const count = parseInt(document.getElementById("installmentsCount").value, 10) || 1;
  const shipCost = shippingPrice();
  const svcCost = servicesTotal();
  /* ⚠️ העמלה מחושבת על הסכום **כולל משלוח וכולל שירותים** — זה מה
     שנגבה בפועל בכרטיס, וכך בדיוק מחשב createPayment_ בצד השרת. */
  const base = Math.round((cartSubtotal + shipCost + svcCost) * 100) / 100;
  const fee = installmentFeeAmount(base, count);
  const grandTotal = Math.round((base + fee) * 100) / 100;
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
    shipRow.style.display = shipCost > 0 ? "block" : "none";
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
  const lines = withFreeAssemblyLine(cartItemsToLines(items));
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
        services: selectedServices
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

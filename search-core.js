/* =====================================================================
   DvirTech — ליבת קטלוג וחיפוש משותפת (search-core.js)
   =====================================================================
   נטען *לפני* home.js / products.js / site-search.js ומספק להם שלושה
   דברים שעד עכשיו היו משוכפלים או שבורים בכל אחד בנפרד:

   1. dvtGetCatalog() — בקשת getCatalog אחת לכל טעינת דף, עם מטמון.
      קודם כל קובץ הביא את הקטלוג לעצמו, ולכן דף הבית עשה שתי בקשות
      זהות (אחת ל-home.js ואחת לחיפוש בהדר). זו הייתה הסיבה שהחיפוש
      הרגיש "תקוע" כמה שניות בהקלדה הראשונה.

   2. dvtCatLabel() — שם קטגוריה לתצוגה. התוויות בגיליון נכתבו בשביל
      הבונה ("מעבד", "כרטיס מסך (אופציונלי)") ולא מתאימות לחנות.

   3. dvtItemScore() — ניקוד התאמה של פריט למילת חיפוש.

   ⚠️ על הניקוד — זה הלב של תיקון החיפוש:
   חיפוש "RAM" החזיר קודם לוחות אם, כי במפרט שלהם כתוב "4 חריצי RAM",
   בעוד שמקלות הזיכרון עצמם נקראים "32GB DDR5 6000MHz CL30" ולא מכילים
   את המילה RAM בכלל. התאמה במפרט קיבלה בדיוק אותו משקל כמו התאמה בשם.
   לכן עכשיו לכל שדה יש משקל אחר, והקטגוריה עצמה משתתפת בהתאמה —
   "RAM" מזוהה מול התווית "זיכרון RAM" וכל מקלות הזיכרון עולים למעלה,
   ולוחות האם נשארים אחריהם במקום לחסום אותם.
===================================================================== */

const DVT_API_URL = "https://script.google.com/macros/s/AKfycbwuW5tgiRDhoIEFNkHHWgkVot6FyHFEUBa1mx41ck1lp74ChzT8pciMV9qaI0NcDw-sKA/exec";

/* ==================== קטלוג ==================== */
let _dvtCatalog = null;
let _dvtCatalogPromise = null;
let _dvtCatalogVer = null;   // חתימת התוכן הנוכחי — ראה _dvtVerOf

/* ---------------------------------------------------------------------
   מטמון בדפדפן — stale-while-revalidate
   ---------------------------------------------------------------------
   נמדד בפועל: קריאה ל-getCatalog לוקחת 6–8.6 שניות (TTFB), למרות
   שהתשובה היא 18KB בלבד. זה לא רוחב פס אלא זמן ההתעוררות של Apps
   Script + הפניית ה-302 שלו. כלומר: כל מעבר בין דפים באתר עלה בהמתנה
   של 6+ שניות, כי כל דף ביקש את הקטלוג מחדש.

   הפתרון כאן: שומרים את הקטלוג ב-localStorage. בכניסה הבאה מציגים
   *מיד* את העותק השמור (בלי שום המתנה) ובמקביל מרעננים ברקע; אם
   התשובה החדשה שונה, הדף מתעדכן. המשתמש מחכה פעם אחת בלבד, בביקור
   הראשון — ומשם והלאה האתר נפתח מיידית.

   ⚠️ זה משפר את הזמן *הנתפס* בלבד. את 7 השניות עצמן צריך לתקן בצד
   השרת — ראה DVT-PERF-NOTES.md.
--------------------------------------------------------------------- */
const DVT_CACHE_KEY = "dvirtech_catalog_v1";
const DVT_CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000;   // 6 שעות

function _dvtReadCache(){
  try{
    const raw = localStorage.getItem(DVT_CACHE_KEY);
    if(!raw) return null;
    const o = JSON.parse(raw);
    if(!o || !o.catalog || !o.savedAt) return null;
    return o;
  }catch(e){ return null; }
}

function _dvtWriteCache(catalog, version){
  try{
    localStorage.setItem(DVT_CACHE_KEY, JSON.stringify({
      savedAt: Date.now(), version: version || null, catalog: catalog
    }));
  }catch(e){ /* מכסת אחסון מלאה / גלישה פרטית — פשוט בלי מטמון */ }
}

/* ---------------------------------------------------------------------
   זיהוי שינוי — בזול
   ---------------------------------------------------------------------
   הגרסה הקודמת עשתה כאן, בכל טעינת דף:
       JSON.stringify(fresh) !== JSON.stringify(_dvtCatalog)
   כלומר שתי הסדרות של ~460,000 תווים כל אחת, רק כדי לענות על שאלת
   כן/לא.

   ⚠️ **נמדד, ולא כפי שנראה בקריאה:** זה עלה 1.1ms בלבד (Chrome,
   1,271 מוצרים) — JSON.stringify של V8 מהיר בהרבה ממה שהגודל מרמז.
   כלומר זו **לא** הייתה הסיבה לאיטיות של הדף, וזו הסיבה היחידה
   שהמספר כתוב כאן: כדי שאף אחד לא "יתקן" את זה שוב בתור אופטימיזציה
   גדולה. הצוואר האמיתי הוא תשובת getCatalog (10–13 שניות), ראה
   4-payment-api.gs.

   מה שכן: השרת מחזיר עכשיו `version` (חתימת FNV-1a שמחושבת אצלו פעם
   ב-6 שעות), וההשוואה היא בין שתי מחרוזות קצרות — 1.1ms → ~0.
   השיפור אמיתי אך צנוע, והערך העיקרי שלו הוא שהוא לא גדל עם הקטלוג.

   ⚠️ `_dvtCheapSig` הוא **גיבוי לפריסה ישנה של 4-payment-api.gs**
   שעדיין לא מחזירה `version`. בלעדיו, לקוח חדש מול שרת ישן היה
   מסיק "שום דבר לא השתנה" לנצח ולא מרענן את המסך לעולם. הוא עובר רק
   על השדות שמשפיעים על מה שמצויר (מזהה/מחיר/מלאי/אורך שם/מחיר קודם)
   ונמדד ב-0.3ms.
--------------------------------------------------------------------- */
function _dvtCheapSig(catalog){
  const parts = [];
  Object.keys(catalog || {}).sort().forEach(cat => {
    const g = catalog[cat];
    if(!g || !Array.isArray(g.items)) return;
    parts.push(cat, g.items.length);
    g.items.forEach(it => {
      parts.push(it.id, it.price, it.inStock === undefined ? "" : it.inStock,
                 (it.name || "").length, it.oldPrice === undefined ? "" : it.oldPrice);
    });
  });
  return parts.join("|");
}

/* המזהה שמייצג את התוכן הנוכחי: גרסת השרת אם יש, אחרת חתימה מקומית. */
function _dvtVerOf(catalog, version){
  return version || _dvtCheapSig(catalog);
}

/* בריחת HTML לכל טקסט שנכנס ל-innerHTML. חובה על מילת חיפוש — היא
   מגיעה מ-?q= בכתובת, כך שבלי זה קישור זדוני מריץ קוד בדף. מוחל גם על
   שמות מוצרים ותוויות: הם מהגיליון, אבל שם שמכיל < או & היה שובר את
   הפריסה גם בלי כוונה רעה. */
function escHtml(s){
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ---------- מלאי ----------
   ⚠️ עד עכשיו לא הייתה בקוד שום התייחסות למלאי: סימון "אזל המלאי"
   בגיליון פשוט לא הגיע לאתר, והמוצר נמכר כרגיל. זה הבאג היחיד כאן
   שעולה כסף אמיתי — לקוח משלם על משהו שאין.

   ההפעלה: עמודה בשם inStock (או "מלאי") בכל לשונית.
   ריק / חסר = יש מלאי. רק ערך שלילי מפורש מוציא ממכירה, כדי שאלפי
   שורות קיימות לא ייעלמו מהאתר ברגע שהעמודה תיווצר.

   ⚠️ "אזל" ≠ "נעלם". המוצר ממשיך להופיע בקטלוג עם תג — מוצר שנעלם
   נראה כמו אתר שבור, ולקוח שרואה "אזל" יודע לחזור. */
const DVT_OUT_OF_STOCK_WORDS =
  ["אזל","אזל המלאי","לא במלאי","אין במלאי","חסר","out","outofstock","no","false","0","לא",
   /* "ליצור קשר" = זמין רק דרך דביר (הזמנה-מיוחדת אצל הספק) — לא נמכר
      בקליק; דף המוצר מציג כפתור וואטסאפ במקום קנייה. */
   "ליצור קשר","לבדיקת זמינות"];

/* מצב זמינות מדורג — הלקסיקון שסוכם עם דביר (18.08.2026), מיושר למצבי
   הספק: yesh / זמינות מוגבלת / ליצור קשר / אזל. "זמינות מוגבלת" נקנה
   רגיל (עם תג שמזרז); "ליצור קשר" לא נקנה בקליק אלא בפנייה. */
function dvtStockState(it){
  const raw = it && (it.inStock !== undefined ? it.inStock : it["מלאי"]);
  const s = String(raw == null ? "" : raw).trim();
  /* ⚠️ לפני "low": "אזל · צפי חידוש 02/09/2026" הוא קודם כל **אזל**,
     ורק אחר כך נושא מידע נוסף. סדר הפוך היה מציג מוצר חסר כזמין. */
  if(/^אזל.*צפי/.test(s))                return "restock";
  if(/זמינות מוגבלת|מלאי אחרון/.test(s)) return "low";
  if(/ליצור קשר|לבדיקת זמינות/.test(s))  return "ask";
  return dvtInStock(it) ? "in" : "oos";
}

function dvtInStock(it){
  if(!it) return false;
  const raw = it.inStock !== undefined ? it.inStock
            : (it["מלאי"] !== undefined ? it["מלאי"] : it.stock);
  if(raw === undefined || raw === null || raw === "") return true;   // ברירת מחדל: יש
  if(raw === true) return true;
  if(raw === false) return false;
  if(typeof raw === "number") return raw > 0;
  const s = String(raw).trim().toLowerCase();
  if(!s) return true;
  if(/^\d+$/.test(s)) return Number(s) > 0;                          // כמות במלאי
  /* 🔴 **קריטי.** ההשוואה למטה היא `includes` — התאמה **מדויקת**.
     הערך החדש "אזל · צפי חידוש 02/09/2026" אינו שווה ל-"אזל", ולכן
     בלי השורה הזו הוא היה נחשב **זמין למכירה** ומוצר חסר היה נמכר.
     העיגון ל-`^אזל` מדויק ואינו יכול לתפוס "זמינות מוגבלת". */
  /* 🔴 היה כאן /^אזל\b/ — ו**מעולם לא התאים**. \b ב-JavaScript
     מוגדר לפי [A-Za-z0-9_] בלבד; אחרי אות עברית אין גבול מילה, ולכן
     "אזל · צפי חידוש 02/09/2026" עבר את הבדיקה ונחשב **זמין למכירה**.
     נתפס בבדיקת מטריצת המצבים לפני שהגיע לאתר.
     ⚠️ סיומת מפורשת (סוף מחרוזת או מפריד) ולא ^אזל חשוף, כדי שמילה
     עתידית שמתחילה באותן אותיות לא תיתפס בטעות. */
  if(/^אזל(?:$|[\s·,.-])/.test(s)) return false;
  return !DVT_OUT_OF_STOCK_WORDS.includes(s);
}

/* מוצר אמיתי *וגם* זמין. זה הגייט שכל כפתור קנייה חייב לעבור. */
function dvtCanBuy(it, cat){ return dvtIsSellable(it, cat) && dvtInStock(it); }

/* גישה סינכרונית לקטלוג שכבר נטען — לשימוש בנקודות שבהן אי אפשר
   להמתין ל-Promise, כמו הגנת ההוספה לעגלה. מחזיר null אם עוד לא נטען. */
function dvtCatalogNow(){ return _dvtCatalog || null; }

/* חיפוש פריט לפי ה-SKU שנשמר בעגלה ("gpu:rtx4070"). */
function dvtFindBySku(sku){
  const cat = dvtCatalogNow();
  if(!cat || !sku) return null;
  const i = String(sku).indexOf(":");
  if(i < 0) return null;
  const group = cat[String(sku).slice(0, i)];
  const id = String(sku).slice(i + 1);
  if(!group || !Array.isArray(group.items)) return null;
  return group.items.find(x => String(x.id) === id) || null;
}

/* ---------- חסימת מוצרים שאזלו ----------
   ⚠️ `dvtCanBuy` בודק **פריט אחד** שכבר בידך. הפונקציות כאן בודקות
   **עגלה שלמה**, וזה מקרה אחר: הרכבה מהבונה היא שורה אחת בעגלה אבל
   בפועל 8-12 רכיבים (`parts`), ומספיק שרכיב אחד אזל כדי שההרכבה כולה
   לא ניתנת לאספקה. בלי זה, "הרכבה בהתאמה אישית" הייתה עוקפת את הבדיקה
   לגמרי — היא לא `type:"product"` ואין לה `sku` משלה.

   ⚠️ גם המקרה ההפוך נסגר כאן: מוצר שנוסף לעגלה כשהיה במלאי, והעגלה
   נשמרת ב-localStorage לימים. הוא צריך להיחסם בכניסה הבאה, לא רק
   ברגע ההוספה. */
function dvtOutOfStockSkus(skus){
  const out = [];
  (skus || []).forEach(function(sku){
    const it = dvtFindBySku(sku);
    // לא מוכר בקטלוג = לא חוסמים. עדיף מכירה מאשר חסימה על סמך ניחוש;
    // התמחור בצד שרת ידחה SKU שבאמת לא קיים.
    if(it && !dvtInStock(it)) out.push({ sku: sku, name: it.name || sku });
  });
  return out;
}

/* =====================================================================
   🔴 פריט שכבר לא קיים בקטלוג — 31.08
   =====================================================================
   ההערה ב-`dvtOutOfStockSkus` קובעת: *"לא מוכר בקטלוג = לא חוסמים…
   התמחור בצד שרת ידחה SKU שבאמת לא קיים."* חצי מזה נכון, והחצי השני
   הוא בדיוק הבעיה — **מדדתי מה השרת עושה בפועל**:

       priceCart_ →  return { error: "פריט לא זמין: psu:PSU-6072 …" }

   הוא לא מדלג על השורה, הוא **מפיל את כל התשלום**. והעגלה יושבת
   ב-localStorage עם עותק מלא של הפריט (שם ומחיר), ולכן היא ממשיכה
   להיראות תקינה לגמרי — הלקוח רואה עגלה מלאה, לוחץ "שלם", ומקבל
   "רענן את הדף ונסה שוב". רענון לא מנקה כלום, והוא תקוע.

   זה קרה בפועל: ניקוי הכפילויות של 31.08 מחק ארבעה מתאמי DC
   (`PSU-607x`) שקיימים היום רק כ-`ACC-1460x`.

   ⚠️⚠️ **הבדיקה חוקית רק כשהקטלוג באמת נטען.** קטלוג ריק, חלקי, או
   בקשה שנכשלה — ו"אין את המוצר" הופך ל"אין שום מוצר", והעגלה של
   הלקוח נמחקת. לכן הסף למטה, ולכן זו הפונקציה היחידה שמסתכלת עליו. */
function dvtCatalogUsable_(){
  const cat = dvtCatalogNow();
  if(!cat) return false;
  let n = 0;
  for(const k in cat){
    if(cat[k] && Array.isArray(cat[k].items)) n += cat[k].items.length;
  }
  /* הקטלוג האמיתי הוא ~1,600 פריטים. 50 הוא סף שפוי שמבדיל בין
     "נטען" ל"חזר משהו מוזר", בלי להיות תלוי במספר המדויק. */
  return n >= 50;
}

/* מחזיר {products:[…], builds:[…]} — פריטים שה-SKU שלהם כבר לא
   בקטלוג. ⚠️ מוצר והרכבה מטופלים שונה בכוונה: מוצר בודד אפשר להסיר,
   הרכבה היא **עבודה של הלקוח** ואסור למחוק אותה בשקט. */
function dvtCartMissing(items){
  const out = { products: [], builds: [] };
  if(!dvtCatalogUsable_()) return out;

  (items || []).forEach(function(i){
    if(!i) return;
    if(i.type === "product" && i.sku){
      if(!dvtFindBySku(i.sku)) out.products.push({ id: i.id, sku: i.sku, name: i.name });
    }else if(i.type === "build" && Array.isArray(i.parts)){
      const gone = i.parts.filter(function(p){ return p && p.sku && !dvtFindBySku(p.sku); });
      if(gone.length) out.builds.push({ id: i.id, name: i.name, parts: gone });
    }
  });
  return out;
}

/* מקבל את פריטי העגלה ומחזיר את מה שאזל — כולל רכיבים בתוך הרכבה. */
function dvtCartOutOfStock(items){
  const skus = [];
  (items || []).forEach(function(i){
    if(i && i.type === "build" && Array.isArray(i.parts)){
      i.parts.forEach(function(p){ if(p && p.sku) skus.push(p.sku); });
    }else if(i && i.sku && i.type === "product"){
      skus.push(i.sku);
    }
  });
  // ייתכן שאותו רכיב מופיע גם בהרכבה וגם בנפרד — לדווח עליו פעם אחת
  const seen = {};
  return dvtOutOfStockSkus(skus).filter(function(x){
    if(seen[x.sku]) return false;
    seen[x.sku] = 1; return true;
  });
}

/* ---------- זמינות נמוכה בעגלה ----------
   מחזיר את הפריטים בעגלה שמצב המלאי שלהם "low" — כלומר `dvtStockState`
   זיהה "זמינות מוגבלת" או "מלאי אחרון".

   🔴 **נמדד על הקטלוג החי (20.08): אין כרגע אף מוצר במצב הזה.**
   ערכי המלאי בפועל הם "במלאי" (797), "אזל" (423), "ליצור קשר" (7)
   ושניים ריקים. כלומר הפונקציה הזו והודעת הקופה שנשענת עליה **ישנות
   עד שהערך יופיע בגיליון** — בסנכרון מהספק או בהקלדה ידנית.
   זה בכוונה: עדיף שהמנגנון יהיה מוכן ומדויק מאשר שיאולתר ברגע שדביר
   יתחיל לסמן פריטים גבוליים.

   ⚠️ אותה לוגיקת פירוק כמו `dvtCartOutOfStock` — הרכבה מהבונה היא
   פריט אחד בעגלה שמכיל `parts[]`, ובלי לפרק אותה רכיב גבולי בתוך
   הרכבה לא היה נספר כלל. */
function dvtCartLowStock(items){
  const cat = dvtCatalogNow();
  if(!cat) return [];
  const skus = [];
  (items || []).forEach(function(i){
    if(i && i.type === "build" && Array.isArray(i.parts)){
      i.parts.forEach(function(p){ if(p && p.sku) skus.push(p.sku); });
    }else if(i && i.sku && i.type === "product"){
      skus.push(i.sku);
    }
  });
  const seen = {}, out = [];
  skus.forEach(function(sku){
    if(seen[sku]) return;
    seen[sku] = 1;
    const it = dvtFindBySku(sku);
    if(it && dvtStockState(it) === "low") out.push({ sku: sku, name: it.name });
  });
  return out;
}

/* ---------- מבצעים ----------
   מוצר "במבצע" = יש לו מחיר קודם גבוה מהמחיר הנוכחי.
   הדרך להפעיל את זה: להוסיף לגיליון עמודה בשם oldPrice (או "מחיר קודם")
   ולמלא אותה רק בשורות שבמבצע. הבקאנד מעביר כל עמודה שאינה פנימית
   כמו שהיא, כך שאין צורך לגעת ב-4-payment-api.gs בכלל.
   ⚠️ oldPrice הוא לתצוגה בלבד — הגבייה תמיד לפי price מהגיליון. */
function dvtOldPrice(it){
  const raw = it && (it.oldPrice !== undefined ? it.oldPrice : it["מחיר קודם"]);
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
function dvtIsOnSale(it){
  const old = dvtOldPrice(it), now = Number(it && it.price);
  if(!(old > 0 && Number.isFinite(now) && now > 0 && old > now)) return false;
  /* ⏲️ פקיעה מדויקת: אם יש saleEndsAt והוא עבר — המבצע נגמר **ברגע
     הזה**, בלי לחכות לסנכרון הבא (שרץ כל 12ש'). דרישת דביר: הטיימר
     של הספק קובע מתי המבצע שלנו נגמר; ללקוח לא מציגים טיימר בכלל.
     בלי saleEndsAt (מבצע ידני בלי תאריך) — נשאר עד שמנקים ידנית. */
  const ends = it && (it.saleEndsAt || it["סוף מבצע"]);
  if(ends){
    const t = Date.parse(ends);
    if(Number.isFinite(t) && t < Date.now()) return false;
  }
  return true;
}
function dvtDiscountPct(it){
  if(!dvtIsOnSale(it)) return 0;
  return Math.round((1 - Number(it.price) / dvtOldPrice(it)) * 100);
}
/* כל המוצרים שבמבצע, מכל הקטגוריות, מהנחה גדולה לקטנה. */
function dvtSaleItems(catalog){
  const out = [];
  Object.keys(catalog || {}).forEach(cat => {
    (catalog[cat].items || []).forEach(it => {
      // מבצע על מוצר שאזל הוא פרסום למשהו שאי אפשר לקנות
      if(dvtCanBuy(it) && dvtIsOnSale(it)) out.push({ cat, it });
    });
  });
  return out.sort((a,b) => dvtDiscountPct(b.it) - dvtDiscountPct(a.it));
}

/* מי שרוצה לדעת שהנתונים התרעננו ברקע (למשל כדי לרנדר מחדש) נרשם כאן. */
const _dvtRefreshSubs = [];
function dvtOnCatalogRefresh(fn){ if(typeof fn === "function") _dvtRefreshSubs.push(fn); }

function _dvtFetchFresh(){
  return fetch(DVT_API_URL + "?action=getCatalog")
    .then(r => r.json())
    .then(d => {
      if(!d.ok || !d.catalog) throw new Error(d.error || "getCatalog failed");
      // ⚠️ `version` קיים רק בפריסות חדשות של 4-payment-api.gs. חסר =
      // נופלים לחתימה מקומית, ולא שוברים כלום.
      return { catalog: d.catalog, version: d.version || null };
    });
}

function dvtGetCatalog(){
  if(_dvtCatalog) return Promise.resolve(_dvtCatalog);
  if(_dvtCatalogPromise) return _dvtCatalogPromise;

  const cached = _dvtReadCache();
  if(cached){
    _dvtCatalog = cached.catalog;
    _dvtCatalogVer = cached.version || null;
    const stale = (Date.now() - cached.savedAt) > DVT_CACHE_MAX_AGE_MS;
    // מרעננים ברקע תמיד. אם התוכן באמת השתנה — מודיעים למי שנרשם.
    _dvtFetchFresh().then(res => {
      const before = _dvtVerOf(_dvtCatalog, _dvtCatalogVer);
      const after  = _dvtVerOf(res.catalog, res.version);
      _dvtCatalog = res.catalog;
      _dvtCatalogVer = res.version;
      _dvtWriteCache(res.catalog, res.version);
      if(before !== after) _dvtRefreshSubs.forEach(fn => { try{ fn(res.catalog); }catch(e){} });
    }).catch(() => { /* אין רשת — ממשיכים עם המטמון */ });

    // מטמון ישן מדי ולא הצלחנו לרענן: עדיף להציג נתונים ישנים מכלום,
    // ולכן גם כאן מחזירים אותו מיד. הרענון ברקע כבר רץ.
    void stale;
    return Promise.resolve(_dvtCatalog);
  }

  // ביקור ראשון — אין ברירה אלא לחכות לרשת
  _dvtCatalogPromise = _dvtFetchFresh()
    .then(res => {
      _dvtCatalog = res.catalog;
      _dvtCatalogVer = res.version;
      _dvtWriteCache(res.catalog, res.version);
      return res.catalog;
    })
    .catch(e => {
      // מאפסים כדי שניסיון הבא יוכל לנסות שוב, ולא ייתקע על promise דחוי
      _dvtCatalogPromise = null;
      throw e;
    });
  return _dvtCatalogPromise;
}

/* מתחילים להביא את הקטלוג כבר עכשיו, בלי לחכות שמישהו יבקש. */
dvtGetCatalog().catch(() => { /* הדף עצמו כבר מציג הודעת שגיאה משלו */ });

/* ==================== שמות קטגוריות ==================== */
const DVT_CAT_LABEL = {
  all:         ["הכל",            "All"],
  readyPc:     ["מחשבים מוכנים",  "Ready-Made PCs"],
  sale:        ["מבצעים",         "Deals"],
  monitor:     ["מסכים",          "Monitors"],
  peripherals: ["ציוד היקפי",     "Peripherals"],
  mouse:       ["עכברים",         "Mice"],
  keyboard:    ["מקלדות",         "Keyboards"],
  /* נוספו 01.09 לקראת בנדא — 93 כיסאות ו-129 בקרים אצלם. */
  chair:       ["כיסאות גיימינג", "Gaming Chairs"],
  controller:  ["בקרי משחק",      "Controllers"],
  headset:     ["אוזניות",        "Headsets"],
  webcam:      ["מצלמות רשת",     "Webcams"],
  cpu:         ["מעבדים",         "Processors"],
  gpu:         ["כרטיסי מסך",     "Graphics Cards"],
  mobo:        ["לוחות אם",       "Motherboards"],
  ram:         ["זיכרון RAM",     "Memory"],
  storage:     ["אחסון",          "Storage"],
  cooling:     ["פתרונות קירור",  "Cooling"],
  psu:         ["ספקי כוח",       "Power Supplies"],
  "case":      ["מארזים",         "Cases"]
};

function dvtCatLabel(cat, group){
  const lang = (typeof LANG !== "undefined" ? LANG : "he");
  const o = DVT_CAT_LABEL[cat];
  if(o) return lang === "en" ? o[1] : o[0];
  if(!group) return cat;
  return (lang === "en" && group.labelEn) ? group.labelEn : (group.label || cat);
}

/* ==================== ניקוד חיפוש ==================== */
/* המשקלים: שם מוצר >> קטגוריה > יצרן >> מפרט.
   ההפרש בין name ל-spec הוא מה שמונע מ"חריצי RAM" במפרט של לוח אם
   להתחרות בשם של מוצר זיכרון אמיתי. */
const DVT_FIELD_SCORE = { name: 100, cat: 60, brand: 40, spec: 10 };

/* ==================== לאיזו קטגוריה המונח *שייך* ====================
   🔴 דביר: "כשאני מקליד DDR5 זה מקפיץ לי לוחות אם. זה לא הדבר הראשון
   שצריך לקפוץ — ראם צריך לקפוץ ישר, זה הכי מתאים."

   ⚠️ הניקוד לבדו לא יכול להכריע כאן, וזו הנקודה: "DDR5" מופיע בשם
   של ערכת זיכרון **וגם** בשם של רוב לוחות האם המודרניים, שניהם
   בשדה `name` שהוא הכבד ביותר. הציון יוצא זהה, והשובר-שוויון הוא
   מחיר — ולכן לוח זול קפץ לפני זיכרון.

   ההבדל האמיתי אינו בטקסט אלא במשמעות: עבור ערכת זיכרון DDR5 הוא
   **מה שהמוצר הוא**; עבור לוח אם הוא תכונה אחת מיני עשרות. לכן
   נדרשת מפה מפורשת, ולא ניסיון לגזור את זה מהתדירות — DDR5 מופיע
   בשיעור גבוה בשתי הקטגוריות, וסטטיסטיקה לא תבחין ביניהן.

   ⚠️ **הטיה ולא סינון.** קטגוריות המשך מקבלות בונוס קטן יותר לפי
   סדר, וכל השאר עדיין מופיע — רק נמוך יותר. חיפוש "AM5" יביא
   מעבדים ולוחות ואז גופי קירור, בדיוק כפי שדביר תיאר. */
const DVT_TERM_HOME = [
  // זיכרון — סוג הזיכרון הוא זהות המוצר; בלוח הוא תכונה
  [/^ddr[345]$/i,                        ["ram", "mobo", "laptop"]],
  [/^(?:cl\d{1,2}|\d{4,5}mhz)$/i,         ["ram"]],
  // תושבות ופלטפורמות — המעבד והלוח, ואחריהם הקירור שמתברג לאותה תושבת
  [/^(?:am[45]|lga\d{3,4}|str5|sp\d)$/i,  ["cpu", "mobo", "cooling"]],
  [/^(?:socket|תושבת)$/i,                 ["cpu", "mobo", "cooling"]],
  // אחסון
  [/^(?:nvme|m\.?2|sata|ssd|hdd)$/i,      ["storage", "mobo"]],
  [/^(?:tb|gb)$/i,                        ["storage", "ram"]],
  // כרטיס מסך
  [/^(?:rtx|gtx|radeon|geforce|vram)$/i,  ["gpu", "readyPc", "laptop"]],
  // מארז ותקן לוח
  [/^(?:atx|matx|m-atx|itx|mini-itx|e-atx)$/i, ["case", "mobo", "psu"]],
  // ספק כוח
  [/^(?:80\+|gold|bronze|platinum|modular|מודולרי)$/i, ["psu"]],
  [/^\d{3,4}w$/i,                         ["psu"]],
  // קירור
  [/^(?:aio|רדיאטור|watercooling|נוזלי)$/i, ["cooling"]],
  [/^\d{2,3}mm$/i,                        ["caseFans", "cooling", "case"]],
  // רשת
  [/^(?:wifi\d?|bluetooth|בלוטות)$/i,     ["wifi", "mobo"]]
];

/* בונוס לפי מיקום הקטגוריה ברשימת ההעדפה. ראשונה מקבלת את המלוא. */
function dvtTermHomeBonus(cat, tokens){
  let best = 0;
  for(const tok of tokens){
    for(const [re, cats] of DVT_TERM_HOME){
      if(!re.test(tok)) continue;
      const i = cats.indexOf(cat);
      if(i > -1) best = Math.max(best, 120 - i * 45);
    }
  }
  return best;
}

/* ==================== שם מוצר לתצוגה ברשימה ====================
   🔴 שמות הקטלוג הם שמות הספק, והם דוחסים לתוך השם גם את הקטגוריה
   בעברית וגם את כל המפרט. דוגמה אמיתית מהקטלוג:

     "דיסק פנימי Samsung 9100 PRO 1TB Gen5 M.2 NVME 2.0 14700 read 13300 write"

   בעמודת הסיכום (רוחב 295px) זה נפרס על 23 שורות. דביר: "את הלקוח
   כרגע לא מעניין הפירוט הטכני, רק הדברים הקריטיים".

   ⚠️ **תצוגה בלבד.** השם המלא נשאר בגיליון, נשאר ב-title לריחוף,
   ונשאר במלואו בדף המוצר — שם הפירוט הטכני דווקא שייך.

   ⚠️ **שמרני בכוונה.** נחתכות רק סיומות שהן חד-משמעית מפרט מדיד:
   מהירויות קריאה/כתיבה, TDP בוואטים, Tray / No Fan / No GPU / Bulk,
   ו-"up to X GHz". **לא** נחתך דבר שעשוי להיות חלק מזהות הדגם
   (מספר דגם, קיבולת, "OC", "WIFI7") — שני דגמים עלולים להיבדל בדיוק
   שם. ראה GPU-2035, שכל ההבדל בינו לבין דגם אחר הוא המילה "OC".

   ⚠️ רצפת ביטחון: אם החיתוך מוריד את השם מתחת ל-18 תווים מוחזר
   המקור. עדיף שם ארוך מדי מ-"Samsung" בלי שום זיהוי. */
var DVT_NAME_TRIM = [
  /\s*\d+\s*read\s*\d+\s*write\s*$/i,
  /\s*up\s+to\s+[\d.]+\s*(?:ghz|mb\/s|gb\/s)\s*$/i,
  /\s*\d+\s*w\s*tdp\s*$/i,
  /\s*no\s+fans?\s*$/i,
  /\s*no\s+gpu\s*$/i,
  /\s*tray\s*$/i,
  /\s*bulk\s*$/i,
  /\s*(?:\d+\s*x\s*)?(?:dp|hdmi)\s*$/i,
  /\s*\d+\s*\/\s*\d+\s*rw\s*$/i,          // "14700/13300 RW"
  /\s*[\d.]+\s*ghz\s*$/i                    // תדר בסוף שם, בלי "up to"
];

function dvtDisplayName(name){
  var base = (typeof dvtShortName === "function") ? dvtShortName(name) : String(name || "");
  var out = base;
  /* כמה סבבים: שם יכול לשאת שתי סיומות מפרט ברצף
     ("... No GPU 4.7 Ghz No Fan 65W TDP"). */
  for(var pass = 0; pass < 5; pass++){
    var before = out;
    for(var i = 0; i < DVT_NAME_TRIM.length; i++) out = out.replace(DVT_NAME_TRIM[i], "");
    out = out.replace(/[\s,\u00b7|-]+$/, "");
    if(out === before) break;
  }
  return out.length >= 18 ? out : base;
}

/* ==================== תמונה קטנה למוצר ====================
   מחזיר HTML של תמונת מוצר לשורת רשימה (חלונית החיפוש, ובעתיד כל
   מקום שצריך תצוגה מוקטנת).

   ⚠️ יושב כאן ולא ב-products.js בכוונה: products.js נטען רק בדף
   החנות, בעוד `shopArt` שם עושה בדיוק את אותו הדבר. search-core.js
   נטען בכל 12 הדפים, וזה התנאי לכך שהחיפוש בכותרת יעבוד בכולם.

   ⚠️ אותה תבנית של shopArt, ומאותה סיבה: ממלא המקום נכתב **לפני**
   ה-img ויושב מתחתיו ולא במקומו. כך רואים אייקון קטגוריה כבר בזמן
   הטעינה, ו-onerror על כתובת שבורה מסיר רק את ה-img וחושף אותו
   בחזרה — במקום סמל "תמונה שבורה" של הדפדפן. */
function dvtThumbHtml(it, cat){
  const icon = (typeof dvtIcon === "function") ? dvtIcon(cat) : "ic-case";
  const ph = `<span class="ssr-ph" aria-hidden="true"><svg><use href="#${escHtml(icon)}"/></svg></span>`;
  const img = (it && it.image)
    ? `<img src="${escHtml(it.image)}" alt="" loading="lazy"
           onload="this.parentNode.classList.add('on')" onerror="this.remove()">`
    : "";
  return `<span class="ssr-thumb">${ph}${img}</span>`;
}

function dvtItemScore(item, catLabelText, term, catKey){
  const tokens = String(term || "").toLowerCase().trim().split(/\s+/).filter(Boolean);
  if(!tokens.length) return 0;

  const name  = ((item.name || "") + " " + (item.nameEn || "")).toLowerCase();
  const cat   = String(catLabelText || "").toLowerCase();
  const brand = String(item.brand || "").toLowerCase();
  const spec  = ((item.spec || "") + " " + (item.specEn || "")).toLowerCase();

  let total = 0;
  for(const tok of tokens){
    let best = 0;
    // שם שמתחיל במילה מקבל בונוס — "Kingston" יביא קודם את קינגסטון
    if(name.indexOf(tok)  > -1) best = Math.max(best, DVT_FIELD_SCORE.name + (name.indexOf(tok) === 0 ? 25 : 0));
    if(cat.indexOf(tok)   > -1) best = Math.max(best, DVT_FIELD_SCORE.cat);
    if(brand.indexOf(tok) > -1) best = Math.max(best, DVT_FIELD_SCORE.brand);
    if(spec.indexOf(tok)  > -1) best = Math.max(best, DVT_FIELD_SCORE.spec);
    // חיפוש של כמה מילים = כולן חייבות להימצא. מילה שלא נמצאה בשום
    // שדה פוסלת את הפריט, אחרת "מקלדת אלחוטית" היה מחזיר כל מקלדת.
    if(!best) return 0;
    total += best;
  }
  /* ⚠️ הבונוס נוסף פעם אחת לפריט ולא לכל מילה, אחרת חיפוש של שתי
     מילים מאותה קטגוריה היה מכפיל אותו ומעוות את הדירוג. */
  if(catKey) total += dvtTermHomeBonus(catKey, tokens);
  return total;
}

/* פריטי-דמה ("ללא כרטיס מסך") הם בחירה בבונה ולא מוצר שנמכר.

   ⚠️ **מוצר שהופסק מוסתר כאן ולא בדף המוצרים**, כי זו הנקודה היחידה
   שכל האתר עובר דרכה — החנות, דף הבית, החיפוש והבונה. סינון בדף אחד
   בלבד היה משאיר את המוצר בבונה ובחיפוש. הדוגמה שהתגלתה: `8500G BOX`
   שכבר לא מיוצר והמשיך להופיע.

   ⚠️ מוסתר **רק** `"הופסק"` — סימן ודאי (404 בדף הספק או נוסח מפורש).
   `"חשוד"` (נעדר מהמחירון האחרון) **נשאר מוצג**: מחירון אחד חלקי או
   מוצר שחזר למלאי היו מוחקים מוצרים חיים מהחנות בשקט. ראה
   `15-catalog-hygiene.gs`. */
/* ==================== תת-סוגים שלא מוצגים באתר ====================
   🔴 **דביר — כאן מסתירים קבוצת מוצרים מהאתר בלי למחוק אותה מהגיליון.**
   המפתח הוא `"<קטגוריה>:<subType>"`.

   ⚠️ הסתרה כאן מסירה את המוצרים **בכל מקום בבת אחת** — החנות, החיפוש,
   דף הבית, קבוצות הסינון והתפריט העליון. זה בכוונה נקודה אחת: הסתרה
   בדף אחד בלבד הייתה משאירה את המוצר נגיש דרך חיפוש או קישור ישיר,
   וזה גרוע יותר מלא להסתיר בכלל — כי אז יש מדף שמוביל למוצר שכאילו
   לא קיים.

   ⚠️ המוצרים **נשארים בגיליון** ומסונכרנים כרגיל (מלאי, מחיר, תמונה).
   מחיקת השורה כאן מחזירה אותם לאתר מיד, בלי לייבא כלום מחדש — וזה
   בדיוק התרחיש של "לקוח ביקש דופן למארז".

   `extras:case-glass` — 34 דפנות ופאנלים למארז. החלטת דביר 14.08.2026:
   המבחר קטן מדי מכדי להציג אותו כמדף באתר, והוא נמכר לפי בקשה. */
const DVT_HIDDEN_SUBTYPES = {
  "extras:case-glass": true
};

function dvtIsHiddenSubType(it, cat){
  const c = (it && (it._realCat || it.category)) || cat;
  const s = it && it.subType;
  return !!(c && s && DVT_HIDDEN_SUBTYPES[c + ":" + s]);
}

function dvtIsSellable(it, cat){
  if(!it || it.id === "none" || !(Number(it.price) > 0)) return false;
  if(dvtIsHiddenSubType(it, cat)) return false;
  const st = it.supply_status || it.supplyStatus;
  return String(st || "").trim() !== "הופסק";
}

/* ==================== קטגוריות וירטואליות ====================
   קטגוריה שקיימת בחנות אבל *לא* כלשונית בגיליון. "מסכים" הם פריטים
   מתוך ציוד היקפי עם subType=monitor — כך הם מקבלים מדף משלהם בלי
   להוסיף לשונית לגיליון, בלי לגעת בבקאנד ובלי פריסה מחדש.

   ⚠️ ה-SKU נשאר של קטגוריית המקור (peripherals:peri-mon ולא
   monitor:peri-mon), אחרת התמחור בצד שרת לא יזהה את הפריט. לכן
   dvtVirtualItems מתייג _realCat לפי from ולא לפי הקטגוריה הווירטואלית. */
const DVT_VIRTUAL_CATS = {
  monitor:  { from: "peripherals", match: it => it.subType === "monitor"  },
  mouse:    { from: "peripherals", match: it => it.subType === "mouse"    },
  keyboard: { from: "peripherals", match: it => it.subType === "keyboard" },
  headset:  { from: "peripherals", match: it => it.subType === "headset"  },
  webcam:   { from: "peripherals", match: it => it.subType === "webcam"   },
  /* נוספו 01.09 — המדפים של סחורת בנדא. מוצר בלי subType מתאים פשוט
     לא מופיע במדף, ולכן הוספה כאן בטוחה גם כשהקטגוריה עדיין ריקה. */
  chair:      { from: "peripherals", match: it => it.subType === "chair"      },
  controller: { from: "peripherals", match: it => it.subType === "controller" }
};

function dvtIsVirtualCat(cat){ return !!DVT_VIRTUAL_CATS[cat]; }

function dvtVirtualItems(catalog, cat){
  const v = DVT_VIRTUAL_CATS[cat];
  if(!v || !catalog) return [];
  const g = catalog[v.from];
  if(!g) return [];
  /* ⚠️ `v.from` ולא `cat`: הקטגוריה האמיתית של הפריטים היא מקור
     הנתונים (peripherals), לא הקטגוריה הווירטואלית (monitor). מפתחות
     DVT_HIDDEN_SUBTYPES נכתבים לפי הקטגוריה האמיתית. */
  return (g.items || [])
    .filter(it => dvtIsSellable(it, v.from))
    .filter(v.match)
    .map(it => Object.assign({ _realCat: v.from }, it));
}


/* ==================== תוויות שדות ותרגום ערכים ====================
   הועבר לכאן מ-products.js כדי ש-product.html (דף המוצר) יוכל להציג
   טבלת מפרט עם אותם שמות שדות ואותו תרגום ערכים בדיוק כמו הסינון
   בחנות — מקור אמת אחד במקום שני עותקים שיתפצלו עם הזמן. */
const FACET_LABELS = {
  brand:                { he: "יצרן",              en: "Brand" },
  useCase:              { he: "ייעוד",             en: "Use case" },
  ramGb:                { he: "זיכרון",            en: "Memory" },
  storageGb:            { he: "אחסון",             en: "Storage" },
  warrantyMonths:       { he: "אחריות",            en: "Warranty" },
  subType:              { he: "סוג מוצר",          en: "Product type" },
  connection:           { he: "חיבור",             en: "Connection" },
  switchType:           { he: "סוג מתגים",         en: "Switch type" },
  sizeInch:             { he: "גודל מסך",          en: "Screen size" },
  refreshHz:            { he: "קצב רענון",         en: "Refresh rate" },
  resolution:           { he: "רזולוציה",          en: "Resolution" },
  panel:                { he: "סוג פאנל",          en: "Panel type" },
  rgb:                  { he: "תאורת RGB",         en: "RGB lighting" },
  socket:               { he: "תושבת",             en: "Socket" },
  tier:                 { he: "רמת ביצועים",       en: "Performance tier" },
  ramType:              { he: "סוג זיכרון",        en: "Memory type" },
  overclockable:        { he: "תמיכה באוברקלוק",   en: "Overclockable" },
  chipset:              { he: "שבב גרפי",          en: "GPU chipset" },
  vramGb:               { he: "זיכרון גרפי",       en: "VRAM" },
  formFactor:           { he: "גודל לוח",          en: "Form factor" },
  supportedFormFactors: { he: "לוחות נתמכים",      en: "Supported boards" },
  capacityGb:           { he: "נפח",               en: "Capacity" },
  driveType:            { he: "סוג כונן",          en: "Drive type" },
  pcieGen:              { he: "דור PCIe",          en: "PCIe generation" },
  speedMhz:             { he: "מהירות",            en: "Speed" },
  type:                 { he: "סוג קירור",         en: "Cooler type" },
  radiatorMm:           { he: "גודל רדיאטור",      en: "Radiator size" },
  heightMm:             { he: "גובה",              en: "Height" },
  wattage:              { he: "הספק",              en: "Wattage" },
  maxGpuLengthMm:       { he: "אורך כרטיס מירבי",  en: "Max GPU length" },

  /* --- שדות שהיו עד עכשיו רק לשימוש פנימי של הבונה (בדיקות תאימות)
     ולא היו סינון בחנות, ולכן לא היו להם תוויות. דף המוצר מציג את כל
     השדות שקיימים על הפריט, ובלי התוויות האלה הם הופיעו בטבלת המפרט
     בשמם הגולמי ("tdpWatts", "recommendedPsuWatts"). --- */
  lengthMm:             { he: "אורך",              en: "Length" },
  tdp:                  { he: "צריכת חשמל (TDP)",  en: "TDP" },
  tdpWatts:             { he: "צריכת חשמל",        en: "Power draw" },
  tdpRating:            { he: "יכולת פיזור חום",   en: "Cooling capacity" },
  recommendedPsuWatts:  { he: "ספק כוח מומלץ",     en: "Recommended PSU" },
  ramSlots:             { he: "חריצי זיכרון",      en: "Memory slots" },
  maxRamGb:             { he: "זיכרון מירבי",      en: "Max memory" },
  m2Slots:              { he: "חריצי M.2",         en: "M.2 slots" },
  cpuSockets:           { he: "תושבות מעבד",       en: "CPU sockets" },
  maxAirCoolerHeightMm: { he: "גובה קירור מירבי",  en: "Max cooler height" },
  radiatorSupport:      { he: "תמיכה ברדיאטור",    en: "Radiator support" },
  supportsOverclocking: { he: "תמיכה באוברקלוק",   en: "Overclocking support" },
  sockets:              { he: "תושבות נתמכות",     en: "Supported sockets" },
  sticks:               { he: "מספר מקלות",        en: "Sticks in kit" },
  cl:                   { he: "השהיה (CL)",        en: "CAS latency" },
  connectors:           { he: "מחברים",            en: "Connectors" },
  dpi:                  { he: "רגישות (DPI)",      en: "DPI" },
  os:                   { he: "מערכת הפעלה",       en: "Operating system" },
  cpuName:              { he: "מעבד",              en: "Processor" },
  gpuName:              { he: "כרטיס מסך",         en: "Graphics card" }
};

/* תרגום ערכים טכניים לעברית קריאה. מה שלא מופיע כאן מוצג כמו שהוא
   (שמות יצרנים, LGA1700, DDR5 וכו' — לא מתרגמים). */
const VALUE_LABELS = {
  useCase:    { office:{he:"משרדי",en:"Office"}, gaming:{he:"גיימינג",en:"Gaming"}, creative:{he:"עריכה ויצירה",en:"Creative"}, server:{he:"שרת",en:"Server"} },
  subType:    { mouse:{he:"עכבר",en:"Mouse"}, keyboard:{he:"מקלדת",en:"Keyboard"}, monitor:{he:"מסך",en:"Monitor"}, headset:{he:"אוזניות",en:"Headset"}, speakers:{he:"רמקולים",en:"Speakers"}, webcam:{he:"מצלמת רשת",en:"Webcam"}, chair:{he:"כיסא גיימינג",en:"Gaming chair"}, controller:{he:"בקר משחק",en:"Controller"}, mousepad:{he:"משטח לעכבר",en:"Mouse pad"}, microphone:{he:"מיקרופון",en:"Microphone"}, "capture-card":{he:"כרטיס לכידה",en:"Capture card"}, mount:{he:"זרוע ותושבת",en:"Mount"}, other:{he:"אחר",en:"Other"} },
  connection: { wired:{he:"חוטי",en:"Wired"}, wireless:{he:"אלחוטי",en:"Wireless"}, bluetooth:{he:"Bluetooth",en:"Bluetooth"} },
  switchType: { mechanical:{he:"מכני",en:"Mechanical"}, membrane:{he:"ממברנה",en:"Membrane"}, optical:{he:"אופטי",en:"Optical"} },
  type:       { air:{he:"אוויר",en:"Air"}, aio:{he:"נוזלי (AIO)",en:"Liquid (AIO)"} },
  driveType:  { nvme:{he:"SSD NVMe (M.2)",en:"NVMe SSD (M.2)"}, "sata-ssd":{he:"SSD SATA",en:"SATA SSD"}, hdd:{he:"דיסק מכני (HDD)",en:"Hard drive (HDD)"} },
  pcieGen:    { 3:{he:"PCIe 3.0",en:"PCIe 3.0"}, 4:{he:"PCIe 4.0",en:"PCIe 4.0"}, 5:{he:"PCIe 5.0",en:"PCIe 5.0"} },
  /* ⚠️ **חייב לכסות את כל הסולם.** `deriveTier` מייצר 1-5, וכל ערך
     בלי תווית מוצג ללקוח כמספר חשוף בתוך רשימת סינון עברית —
     "בינוני · גבוה · פרימיום · 5". נראה כמו אתר שבור. */
  tier:       { 1:{he:"בסיסי",en:"Entry"}, 2:{he:"בינוני",en:"Mid"}, 3:{he:"גבוה",en:"High"},
                4:{he:"פרימיום",en:"Premium"}, 5:{he:"עילית",en:"Enthusiast"} }
};

// יחידת מידה שנוספת לערך מספרי בתצוגת הסינון בלבד
const FACET_UNITS = {
  ramGb:"GB", storageGb:"GB", capacityGb:"GB", vramGb:"GB", speedMhz:"MHz",
  sizeInch:'"', refreshHz:"Hz", radiatorMm:"mm", heightMm:"mm",
  maxGpuLengthMm:"mm", wattage:"W", warrantyMonths:null
};

function L(obj){ return LANG === "en" ? obj.en : obj.he; }
function facetLabel(key){ return FACET_LABELS[key] ? L(FACET_LABELS[key]) : key; }

function valueLabel(facetKey, raw){
  const map = VALUE_LABELS[facetKey];
  if(map && map[raw] !== undefined) return L(map[raw]);
  if(typeof raw === "boolean") return raw ? tr("כן","Yes") : tr("לא","No");
  // נפח אחסון מוצג ביחידה שאנשים באמת אומרים: 2TB, לא 2,000GB. חייב
  // לבוא לפני שורת היחידות — אחרת "GB" של FACET_UNITS תופס קודם והכלל
  // הזה לא רץ לעולם. capacityGb משמש גם לזיכרון RAM, ושם הערכים לעולם
  // לא מגיעים ל-1000 ולכן הם ממשיכים להיות מוצגים ב-GB.
  if((facetKey === "storageGb" || facetKey === "capacityGb") && typeof raw === "number" && raw >= 1000){
    return (raw/1000) + "TB";
  }
  const unit = FACET_UNITS[facetKey];
  if(unit && typeof raw === "number") return raw.toLocaleString() + unit;
  if(facetKey === "warrantyMonths") return raw + " " + tr("חודשים","months");
  return String(raw);
}

function itemName(it){ return (LANG==="en" && it.nameEn) ? it.nameEn : it.name; }
function itemSpec(it){ return (LANG==="en" && it.specEn) ? it.specEn : (it.spec || ""); }

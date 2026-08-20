/* =====================================================================
   DvirTech — דף המוצרים (products.html)
   =====================================================================
   מציג את *אותו* קטלוג שהבונה משתמש בו, מאותו getCatalog ומאותו גיליון
   ספקים פרטי. ההבדל היחיד: הבונה עובר קטגוריה-קטגוריה, בודק תאימות
   ומחשב הרכבה, ואילו כאן פשוט מציגים רשימה ומסננים אותה.

   אין כאן שום מחיר קשיח ושום רשימת מוצרים קשיחה — הכל מגיע מהשרת.

   ⚠️ הקטלוג נטען דרך dvtGetCatalog() שב-search-core.js (שנטען לפני
   הקובץ הזה), ולא דרך fetch מקומי. כך הדף והחיפוש חולקים בקשה אחת.
   כתובת ה-API עצמה יושבת שם כ-DVT_API_URL וחייבת להישאר זהה לזו
   שב-checkout.js.
===================================================================== */

/* סדר הקטגוריות בחנות. "all" היא קטגוריה וירטואלית (לא קיימת בגיליון,
   לא ב-SHOP_CATALOG) שמאחדת את כל השאר — ראו sellableItems(). היא
   ראשונה בכוונה: מי שמגיע ל-products.html בלי ?cat= (למשל מקישור
   "הצג הכל" או מתוצאות חיפוש) אמור לראות הכל, לא קטגוריה שרירותית.
   אחריה המוצרים השלמים — זה מה שרוב הלקוחות מחפשים — ואז הרכיבים
   הבודדים. services לא מופיע כאן: שירות נלווה נמכר יחד עם הרכבה,
   לא כפריט מדף.

   מחשבים ניידים יושבים ליד המחשבים המוכנים כי זו אותה החלטת קנייה,
   ומאווררי מארז / רשת אלחוטית / משחה תרמית באים אחרי המארז — הם
   נלווים להרכבה עצמה. אביזרים נלווים אחרונים: זו קטגוריית "ועוד". */
/* ⚠️ קטגוריה שלא רשומה כאן לא קיימת מבחינת הדף: initPage נופל ל-"הכל"
   וגם התפריט העליון לא יוכל להוביל אליה. כל קטגוריה וירטואלית חדשה
   ב-DVT_VIRTUAL_CATS חייבת להופיע גם ברשימה הזו. */
const SHOP_CATEGORY_ORDER = [
  "all", "sale", "readyPc", "laptop",
  "monitor", "keyboard", "mouse", "headset", "webcam", "peripherals",
  "cpu", "gpu", "mobo", "ram", "storage", "cooling", "psu", "case",
  "caseFans", "wifi", "paste", "extras"
];

/* ==================== הגדרת הסינונים ====================
   לכל קטגוריה, אילו שדות הופכים לקבוצת סינון ובאיזה סדר.
   type: "list"  — תיבות סימון עם מונה כמות (ברירת המחדל)
         "range" — טווח מספרי (מוצג כתיבות סימון על ערכים קיימים)
         "bool"  — כן/לא
   הסינון תמיד נבנה מהערכים שקיימים *בפועל* בנתונים, אז שדה ריק
   בגיליון פשוט לא מייצר קבוצת סינון — אין קבוצות ריקות באתר. */
/* ⚠️ "all" ו-"sale" לא מופיעות כאן בכוונה: הן מערבבות קטגוריות, ורשימת
   הסינונים שלהן נבנית מהפריטים שבדף — ראו facetKeysFor(). */
const FACETS = {
  readyPc:     ["brand", "useCase", "ramGb", "storageGb", "warrantyMonths"],
  // נייד נמכר לפי המסך לא פחות מאשר לפי המעבד, ולכן גודל/רזולוציה/רענון
  // נכנסים לסינון — בניגוד למחשב מוכן, שהמסך שלו נקנה בנפרד.
  laptop:      ["brand", "useCase", "sizeInch", "ramGb", "storageGb", "resolution", "refreshHz", "os", "warrantyMonths"],
  // מסכים הם תת-קבוצה של ציוד היקפי, ולכן אותם שדות בלי subType —
  // כאן כולם מסכים ממילא, וקבוצת סינון עם ערך יחיד לא מסננת כלום.
  monitor:     ["brand", "sizeInch", "refreshHz", "resolution", "panel", "connection"],
  peripherals: ["subType", "brand", "connection", "switchType", "sizeInch", "refreshHz", "resolution", "panel", "rgb"],
  cpu:         ["brand", "socket", "tier", "ramType", "overclockable"],
  gpu:         ["chipset", "brand", "vramGb", "tier"],
  mobo:        ["brand", "socket", "ramType", "formFactor", "tier"],
  ram:         ["brand", "capacityGb", "ramType", "speedMhz"],
  storage:     ["brand", "driveType", "capacityGb", "pcieGen"],
  cooling:     ["brand", "type", "radiatorMm", "heightMm"],
  psu:         ["brand", "wattage"],
  "case":      ["brand", "supportedFormFactors", "maxGpuLengthMm"],
  caseFans:    ["brand", "sizeMm", "fans", "argb", "pwm", "hubIncluded"],
  wifi:        ["brand", "netType", "busType", "wifiStandard", "speedMbps", "bluetooth"],
  paste:       ["brand", "grams", "conductivity", "electricallyConductive"],
  // subType ראשון: "כבל" ו"דיסק חיצוני" הם מוצרים שונים לגמרי, וזה
  // מה שמפריד ביניהם. compatibleWith לא נכנס — טקסט חופשי מייצר קבוצת
  // סינון עם ערך אחד לכל מוצר.
  extras:      ["subType", "brand", "argb", "lengthCm"]
};

/* FACET_LABELS / VALUE_LABELS / FACET_UNITS עברו ל-search-core.js
   כדי שגם דף המוצר ישתמש באותן תוויות. */

/* ---------------------------------------------------------------------
   השלמת תוויות לשדות של הקטגוריות שנוספו לחנות
   ---------------------------------------------------------------------
   מפתח בלי תווית מוצג בסינון בשמו הגולמי ("busType") באמצע דף עברי.
   מרחיבים כאן את אותן מפות שב-search-core.js במקום להעתיק אותן — שני
   עותקים של אותה מפה מתפצלים עם הזמן. נכתב רק מפתח שחסר, כך שתווית
   שכבר קיימת שם ממשיכה לנצח; כשהתוויות יעברו לשם, הבלוק הזה נמחק. */
const SHOP_FACET_LABELS = {
  fans:                  { he: "מאווררים בערכה",  en: "Fans in kit" },
  sizeMm:                { he: "גודל מאוורר",     en: "Fan size" },
  argb:                  { he: "תאורת ARGB",      en: "ARGB lighting" },
  pwm:                   { he: "בקרת PWM",        en: "PWM control" },
  hubIncluded:           { he: "כולל האב",        en: "Hub included" },
  busType:               { he: "סוג חיבור",       en: "Interface" },
  netType:               { he: "סוג רשת",         en: "Network type" },
  wifiStandard:          { he: "תקן WiFi",        en: "WiFi standard" },
  speedMbps:             { he: "מהירות רשת",      en: "Network speed" },
  bluetooth:             { he: "Bluetooth",       en: "Bluetooth" },
  grams:                 { he: "כמות",            en: "Amount" },
  conductivity:          { he: "מוליכות תרמית",   en: "Thermal conductivity" },
  electricallyConductive:{ he: "מוליך חשמל",      en: "Electrically conductive" },
  lengthCm:              { he: "אורך",            en: "Length" }
};
const SHOP_FACET_UNITS = { sizeMm: "mm", speedMbps: "Mbps", grams: "g", conductivity: "W/m·K", lengthCm: "cm" };
const SHOP_VALUE_LABELS = {
  // "סטודנטים" קיים רק בניידים ולכן לא היה ברשימת הייעודים של מחשב מוכן
  useCase: { student: { he: "לסטודנטים", en: "Student" } },
  /* ⚠️ תוויות ה-subType של האביזרים **עברו ל-site-header.js**
     (SH_SUBTYPE_LABELS) והן נמזגות לכאן למטה. הן היו כאן, אבל התפריט
     הראשי נבנה בכל דף באתר בזמן ש-products.js נטען רק ב-products.html —
     ולכן התפריט הציג "case-glass" באנגלית באמצע תפריט עברי. עותק שני
     של אותה מפה היה מתפצל ביום שמישהו יתקן רק אחד מהם. */
  netType: {
    wifi:       { he: "אלחוטי",          en: "WiFi" },
    ethernet:   { he: "רשת קווית",       en: "Ethernet" },
    "wifi+bt":  { he: "אלחוטי + Bluetooth", en: "WiFi + Bluetooth" }
  }
};

Object.keys(SHOP_FACET_LABELS).forEach(k => {
  if(!FACET_LABELS[k]) FACET_LABELS[k] = SHOP_FACET_LABELS[k];
});
Object.keys(SHOP_FACET_UNITS).forEach(k => {
  if(FACET_UNITS[k] === undefined) FACET_UNITS[k] = SHOP_FACET_UNITS[k];
});
Object.keys(SHOP_VALUE_LABELS).forEach(facet => {
  if(!VALUE_LABELS[facet]) VALUE_LABELS[facet] = {};
  const src = SHOP_VALUE_LABELS[facet], dst = VALUE_LABELS[facet];
  Object.keys(src).forEach(v => { if(dst[v] === undefined) dst[v] = src[v]; });
});

/* תוויות ה-subType של האביזרים מגיעות מ-site-header.js, שנטען לפני
   הקובץ הזה בכל דף. אותה מפה בדיוק מזינה את תפריט "מוצרים" ואת סרגל
   הסינון בחנות — כך שתת-קטגוריה בתפריט ותיבת סימון בסרגל תמיד נקראות
   אותו דבר. ⚠️ מוגן ב-typeof: אם הקובץ לא נטען, החנות ממשיכה לעבוד
   ומציגה את הערך הגולמי במקום ליפול. */
if(typeof SH_SUBTYPE_LABELS === "object" && SH_SUBTYPE_LABELS){
  if(!VALUE_LABELS.subType) VALUE_LABELS.subType = {};
  Object.keys(SH_SUBTYPE_LABELS).forEach(v => {
    if(VALUE_LABELS.subType[v] === undefined) VALUE_LABELS.subType[v] = SH_SUBTYPE_LABELS[v];
  });
}

/* ==================== state ==================== */
let SHOP_CATALOG = null;
let currentCat = null;
let activeFilters = {};      // { facetKey: Set(values) }
let searchTerm = "";
let sortMode = "priceAsc";

/* ---------------------------------------------------------------------
   "רק במלאי" — דלוק כברירת מחדל
   ---------------------------------------------------------------------
   36% מהקטלוג אזל (454 מתוך 1,271). קטגוריה שרובה כרטיסים אפורים עם
   "אזל המלאי" נראית כמו חנות סגורה, והשאלה הראשונה של הלקוח היא
   "אז מה כן במלאי?".

   ⚠️ **הם לא נמחקים מהאתר.** לקוח שמחפש דגם מסוים ולא מוצא אותו מסיק
   שאנחנו לא מוכרים אותו בכלל — זה בדיוק הנימוק שמתועד ב-builder-compat.js
   לגבי רכיבים חסומים בבונה, ודף המוצר של מוצר שאזל נשאר חי וזמין
   (ראה pdSeo ב-product.js: availability=OutOfStock ולא הסתרה).
   לכן: הסתרה עם **מונה גלוי** ולחיצה אחת להצגה, ולא סינון שקט.

   ⚠️ הבדיקה עצמה היא dvtInStock מ-search-core.js — אותה פונקציה שבודקת
   את כפתור הקנייה, את העגלה ואת הבונה. בדיקה שנייה משלנו כאן הייתה
   נפרדת ממנה ביום הראשון שמישהו יוסיף מילה לרשימת "אזל". */
let onlyInStock = true;

/* מפתח דמה לקבוצת הסינון הזו. הוא לא שדה על הפריט ולא נכנס
   ל-activeFilters — הוא רק מאפשר ל-itemMatchesFilters לדעת שהיא
   מבקשת ספירה *של* מסנן המלאי ולכן אסור לה להחיל אותו על עצמו. */
const STOCK_FACET_KEY = "inStock";

/* ==================== עימוד ====================
   1,269 כרטיסי מוצר בבת אחת מקפיאים את הדפדפן בגלילה. 48 לעמוד מתחלק
   בלי שארית ל-2/3/4 עמודות, כך שהשורה האחרונה אף פעם לא חצי ריקה.
   ⚠️ העימוד חותך *רק* את מה שמוצג. המסננים, המונים וסקאלת המחירים
   ממשיכים להיגזר מכל הקטגוריה (ראו buildFacetData/priceBounds) — אחרת
   סינון בעמוד 1 היה מסתיר תוצאות שיושבות בעמוד 3. קודם מסננים, ורק
   בסוף חותכים לעמוד. */
const PAGE_SIZE = 48;
let currentPage = 1;

/* טווח המחירים שנבחר. null = הקצה לא הוזז, כלומר אין הגבלה מהצד הזה —
   כך אפשר להבדיל בין "המשתמש בחר בדיוק את המחיר הגבוה ביותר" לבין
   "המשתמש לא נגע בכלל", וה-chip לא קופץ סתם. */
let priceRange = { min: null, max: null };

/* ==================== helpers ==================== */
/* L / facetLabel / valueLabel / itemName / itemSpec — ב-search-core.js */

/* רינדור אחד קורא ל-sellableItems עשרות פעמים (רצועת הקטגוריות, המונים,
   סקאלת המחירים, הרשימה), וכל קריאה על "הכל" בונה 1,269 עותקים מחדש.
   המטמון נמחק רק כשהקטלוג עצמו מתחלף — קטלוג חדש עם מטמון ישן פירושו
   מחירים ומלאי מיושנים על המסך, ולכן שתי ההשמות עוברות דרך setShopCatalog. */
let _sellableCache = {};
function setShopCatalog(catalog){
  SHOP_CATALOG = catalog;
  _sellableCache = {};
}

// פריטי-דמה ("ללא כרטיס מסך", "ללא שירות") הם בחירה בבונה, לא מוצר
// שנמכר — הם לא אמורים להופיע בחנות בכלל.
//
// כל פריט מחזיר עם _realCat — הקטגוריה האמיתית שלו בגיליון. בקטגוריה
// רגילה זה תמיד שווה ל-cat עצמו; ב-"all" זה מה שמבדיל בין הפריטים
// המעורבבים, וזה מה ש-renderGrid/addCatalogItemToCart משתמשים בו כדי
// לדעת לאיזה SKU אמיתי (category:id) להוסיף לעגלה ואיזה איור להציג —
// "all" עצמה איננה קטגוריה אמיתית ואין לה משמעות בשרת או בבונה.
function sellableItems(cat){
  if(_sellableCache[cat]) return _sellableCache[cat];
  const items = buildSellableItems_(cat);
  // ⚠️ המטמון מחזיר את *אותו* מערך לכל הקוראים. כל מי שממיין או מסנן
  // חייב לעבוד על עותק (filter/map מחזירים חדש, sort לא) — אחרת מיון
  // בדף אחד היה משנה את הסדר לכולם.
  _sellableCache[cat] = items;
  return items;
}

/* קבוצת תפריט ("g:computers") — פסאודו-קטגוריה בדיוק כמו "all", אבל
   מצומצמת לקטגוריות שמתחת לכותרת אחת בתפריט "מוצרים". ההגדרה מגיעה
   מ-site-header.js (SH_NAV_GROUPS_BY_KEY) ולא משוכפלת כאן — כותרת
   התפריט והדף שהיא מובילה אליו חייבים להסכים תמיד.
   ⚠️ מוגן: אם site-header.js לא נטען, מחזיר null ו-initPage נופל
   ל-"הכל" במקום להציג דף ריק. */
function shopGroup_(cat){
  if(typeof cat !== "string" || cat.slice(0, 2) !== "g:") return null;
  if(typeof SH_NAV_GROUPS_BY_KEY === "undefined") return null;
  return SH_NAV_GROUPS_BY_KEY[cat.slice(2)] || null;
}

function buildSellableItems_(cat){
  const grp = shopGroup_(cat);
  if(grp){
    /* ⚠️ חובה לנכות כפילויות: קבוצת "ציוד היקפי" מכילה גם את הקטגוריות
       הווירטואליות (מסך/עכבר/מקלדת) וגם את peripherals עצמה, ושתיהן
       מחזירות את אותם פריטים עם אותו `_realCat`. בלי הניכוי כל מסך היה
       מופיע פעמיים — בדיוק הבאג ש-"all" נמנע ממנו בדילוג על וירטואליות. */
    const seen = new Set();
    const out = [];
    grp.cats.forEach(c => {
      sellableItems(c).forEach(it => {
        const k = (it._realCat || c) + ":" + it.id;
        if(seen.has(k)) return;
        seen.add(k);
        out.push(it);
      });
    });
    return out;
  }
  // "מבצעים" — פסאודו־קטגוריה: כל המוצרים שיש להם oldPrice גבוה מהמחיר
  // הנוכחי בגיליון, מכל הקטגוריות. אין לה קיום בשרת ולא בבונה, בדיוק
  // כמו "הכל", ולכן _realCat נשמר מהפריט המקורי.
  if(cat === "sale"){
    return sellableItems("all").filter(dvtIsOnSale);
  }
  if(cat === "all"){
    const out = [];
    SHOP_CATEGORY_ORDER.forEach(c => {
      // קטגוריה וירטואלית מדלגת ב-"הכל": הפריטים שלה כבר נספרים דרך
      // קטגוריית המקור שלהם (מסך נכלל ב"ציוד היקפי"), ובלי הדילוג
      // הזה כל מסך היה מופיע פעמיים ברשימה.
      // ⚠️ חייבים לדלג גם על "sale": היא נגזרת מ-"all", ובלי הדילוג
      // הזה sellableItems נכנסת לרקורסיה אינסופית.
      if(c === "all" || c === "sale" || dvtIsVirtualCat(c)) return;
      out.push(...sellableItems(c));
    });
    return out;
  }
  if(dvtIsVirtualCat(cat)) return dvtVirtualItems(SHOP_CATALOG, cat);

  const group = SHOP_CATALOG[cat];
  if(!group) return [];
  /* ⚠️ `cat` מועבר במפורש ולא דרך `.filter(dvtIsSellable)`. שתי סיבות:
     `_realCat` נקבע רק ב-map שאחרי, כלומר בזמן הסינון הוא עוד לא קיים;
     ו-`.filter(fn)` מעביר את **האינדקס** כארגומנט השני, כך ש-
     dvtIsSellable היה מקבל מספר במקום שם קטגוריה ו-DVT_HIDDEN_SUBTYPES
     לא היה תופס כלום — בלי לזרוק שגיאה. */
  return (group.items || [])
    .filter(it => dvtIsSellable(it, cat))
    .map(it => Object.assign({ _realCat: cat }, it));
}

/* ==================== ניתוח הערכים לסינון ==================== */
/* שדה יכול להחזיק מערך (למשל supportedFormFactors) — ואז כל ערך בו
   נספר בנפרד, כמו שמצופה מסינון. */
function valuesOf(item, key){
  const v = item[key];
  if(v === undefined || v === null || v === "") return [];
  return Array.isArray(v) ? v : [v];
}

/* ==================== טווח המחירים ====================
   גבולות הסקאלה נגזרים מכל המוצרים בקטגוריה ולא מהתוצאות המסוננות —
   אחרת הסרגל היה מתכווץ תוך כדי גרירה והידית הייתה בורחת מתחת לאצבע.
   הצעדים מעוגלים כלפי חוץ כדי שהקצוות יהיו מספרים נעימים (₪250 ולא ₪247). */
function priceStepFor(span){
  if(span <= 200) return 10;
  if(span <= 1000) return 25;
  if(span <= 5000) return 50;
  return 100;
}

function priceBounds(){
  const prices = sellableItems(currentCat).map(it => Number(it.price)).filter(p => p > 0);
  if(prices.length < 2) return null;                    // מוצר יחיד — אין מה לסנן
  const lowest = Math.min.apply(null, prices), highest = Math.max.apply(null, prices);
  if(lowest === highest) return null;
  const step = priceStepFor(highest - lowest);
  const lo = Math.floor(lowest / step) * step;
  const hi = Math.ceil(highest / step) * step;
  return { lo: lo, hi: hi, step: step };
}

// הערך שמוצג בידית: מה שנבחר, ואם לא נגעו בה — הקצה של הסקאלה
function priceHandles(b){
  return {
    min: priceRange.min === null ? b.lo : Math.max(b.lo, Math.min(priceRange.min, b.hi)),
    max: priceRange.max === null ? b.hi : Math.min(b.hi, Math.max(priceRange.max, b.lo))
  };
}

function priceFilterActive(){
  return priceRange.min !== null || priceRange.max !== null;
}

function itemMatchesPrice(item){
  const p = Number(item.price);
  if(priceRange.min !== null && p < priceRange.min) return false;
  if(priceRange.max !== null && p > priceRange.max) return false;
  return true;
}

/* עטיפה ל-dvtInStock: בדף שנטען בלי search-core.js אין מלאי לבדוק,
   ואז עדיף להראות הכל מאשר להסתיר את כל החנות. */
function shopInStock(item){
  return (typeof dvtInStock === "function") ? dvtInStock(item) : true;
}

function itemMatchesFilters(item, exceptKey){
  if(!itemMatchesPrice(item)) return false;
  // ⚠️ לפני שאר הסינונים: זה המסנן שקובע כמה תוצאות יש בכלל
  if(onlyInStock && exceptKey !== STOCK_FACET_KEY && !shopInStock(item)) return false;
  for(const key in activeFilters){
    if(key === exceptKey) continue;
    const chosen = activeFilters[key];
    if(!chosen || !chosen.size) continue;
    const vals = valuesOf(item, key).map(String);
    if(!vals.some(v => chosen.has(v))) return false;
  }
  if(searchTerm && itemSearchScore(item) <= 0) return false;
  return true;
}

/* ניקוד ההתאמה של פריט למונח החיפוש הנוכחי. הלוגיקה עצמה יושבת
   ב-search-core.js ומשותפת עם תיבת החיפוש בהדר, כדי ששתיהן ידרגו
   בדיוק אותו דבר.

   הניקוד נשמר על הפריט: buildFacetData שואל אותו פעם לכל קבוצת סינון
   (בתצוגת "הכל" זה עשרות פעמים לאותו פריט), והמיון שואל אותו שוב בכל
   השוואה. המפתח כולל את השפה כי תווית הקטגוריה משתתפת בניקוד — בלעדיה
   מעבר לאנגלית באמצע חיפוש היה משאיר את הדירוג העברי. */
function itemSearchScore(item){
  if(!searchTerm) return 0;
  const key = LANG + "|" + searchTerm;
  if(item._scoreKey !== key){
    item._scoreKey = key;
    item._score = dvtItemScore(item, catLabel(item._realCat || currentCat), searchTerm);
  }
  return item._score;
}

/* תצוגה מעורבת = פסאודו־קטגוריה שמאחדת כמה קטגוריות אמיתיות ("הכל",
   "מבצעים"). אין לה שורה ב-FACETS כי הסינונים שלה תלויים במה שנחת בדף. */
function isMixedView(){
  return currentCat === "all" || currentCat === "sale" || !!shopGroup_(currentCat);
}

/* אילו שדות הופכים לקבוצות סינון בתצוגה הנוכחית.
   בתצוגה מעורבת מאחדים את הסינונים של הקטגוריות שהפריטים באמת מגיעים
   מהן, לפי _realCat: אם בדף יש מעבדים וגם מארזים — יופיעו גם "תושבת"
   וגם "לוחות אם נתמכים", ולא רק יצרן. מקודם הוצג יצרן בלבד, וכל שאר
   המידע שכבר יושב על הפריטים פשוט לא היה נגיש.
   brand ראשון כי הוא השדה היחיד שקיים בעקביות בכל קטגוריה, ואחריו
   הסינונים לפי סדר הקטגוריות בחנות — כך הסרגל לא מקפץ בין רינדורים.
   שדה שאין לו ערכים בנתונים נופל ממילא ב-buildFacetData, כך שדף שיש
   בו רק מעבדים לא מקבל קבוצות ריקות של מארזים.
   ⚠️ שדה בעל אותו שם בשתי קטגוריות מתאחד לקבוצה אחת (formFactor של לוח
   אם ושל ספק כוח) — בתצוגה מעורבת זו התנהגות נכונה: הסימון מצמצם את
   שתיהן יחד, בדיוק כמו שהמונה מראה. */
function facetKeysFor(items){
  if(!isMixedView()) return FACETS[currentCat] || ["brand"];

  const cats = new Set();
  items.forEach(it => cats.add(it._realCat || currentCat));
  const keys = ["brand"];
  SHOP_CATEGORY_ORDER.forEach(c => {
    if(!cats.has(c)) return;
    (FACETS[c] || []).forEach(k => { if(keys.indexOf(k) === -1) keys.push(k); });
  });
  return keys;
}

/* המונה ליד כל ערך מחושב מול שאר הסינונים הפעילים אבל *לא* מול
   הקבוצה של עצמו — כך שאפשר לסמן כמה יצרנים יחד והמספרים נשארים
   הגיוניים, בדיוק כמו בחנויות הגדולות. */
function buildFacetData(){
  // ⚠️ כל הקטגוריה ולא רק העמוד המוצג: מונה שנגזר מעמוד 1 היה מסתיר
  // מוצרים שיושבים בעמוד 3.
  const items = sellableItems(currentCat);
  const keys = facetKeysFor(items);
  const out = [];

  keys.forEach(key => {
    const counts = new Map();
    items.forEach(item => {
      if(!itemMatchesFilters(item, key)) return;
      valuesOf(item, key).forEach(v => {
        const k = String(v);
        counts.set(k, (counts.get(k) || 0) + 1);
      });
    });
    // ערכים שנבחרו נשארים גלויים גם אם המונה שלהם 0, אחרת אי אפשר
    // לבטל בחירה שהתאפסה בעקבות סינון אחר.
    const chosen = activeFilters[key];
    if(chosen) chosen.forEach(v => { if(!counts.has(v)) counts.set(v, 0); });
    if(counts.size < 2 && !(chosen && chosen.size)) return;  // קבוצה עם ערך אחד לא מסננת כלום

    const raws = new Map();
    items.forEach(item => valuesOf(item, key).forEach(v => raws.set(String(v), v)));

    const rows = Array.from(counts.entries()).map(([k, n]) => ({ key: k, raw: raws.get(k), count: n }));
    rows.sort((a,b) => {
      const na = Number(a.raw), nb = Number(b.raw);
      if(!isNaN(na) && !isNaN(nb)) return na - nb;
      return String(a.raw).localeCompare(String(b.raw));
    });
    out.push({ key: key, rows: rows });
  });
  return out;
}

/* כמה מוצרים המסנן הזה מסתיר *כרגע* — כלומר מוצרים שעברו את כל שאר
   הסינונים ונפלו רק על המלאי. ⚠️ לא "כמה אזלו בקטגוריה": מספר שלא
   מתייחס לסינון הפעיל היה מבטיח 40 מוצרים ומציג 3 בלחיצה. */
function oosHiddenCount(){
  if(!onlyInStock) return 0;
  return sellableItems(currentCat)
    .filter(it => !shopInStock(it) && itemMatchesFilters(it, STOCK_FACET_KEY)).length;
}

function filteredItems(){
  const items = sellableItems(currentCat).filter(it => itemMatchesFilters(it, null));
  const sorters = {
    priceAsc:  (a,b) => a.price - b.price,
    priceDesc: (a,b) => b.price - a.price,
    nameAsc:   (a,b) => itemName(a).localeCompare(itemName(b))
  };
  const bySort = sorters[sortMode] || sorters.priceAsc;

  // כשיש מונח חיפוש, הרלוונטיות גוברת על המיון שנבחר: חיפוש "RAM"
  // חייב להראות קודם מקלות זיכרון ורק אחר כך לוחות אם שבמפרט שלהם
  // מוזכרים חריצי RAM. בתוך אותה רמת רלוונטיות המיון שנבחר קובע.
  if(searchTerm){
    return items.sort((a,b) => (itemSearchScore(b) - itemSearchScore(a)) || bySort(a,b));
  }
  return items.sort(bySort);
}

/* ==================== render ==================== */
// עובר דרך dvtCatLabel (search-core.js) כדי שהשמות יהיו זהים לדף הבית
// ולתוצאות החיפוש — ובעיקר כדי שהתווית שמשתתפת בניקוד החיפוש תהיה
// "זיכרון RAM" ולא "זיכרון" של הבונה.
function catLabel(cat){
  if(cat === "sale") return tr("מבצעים", "Deals");
  const grp = shopGroup_(cat);
  if(grp) return tr(grp.title[0], grp.title[1]);
  return dvtCatLabel(cat, SHOP_CATALOG ? SHOP_CATALOG[cat] : null);
}

function renderCatStrip(){
  const strip = document.getElementById("catStrip");
  /* קבוצה אינה חלק מסרגל הקטגוריות הקבוע — היא לא תת-קטגוריה אלא חתך
     רחב יותר, ולכן היא נוספת כלשונית זמנית רק כשנמצאים בה. בלי זה
     לקוח שנחת מהתפריט על "מחשבים" ראה סרגל שבו שום לשונית לא מסומנת
     ולא היה לו רמז איפה הוא נמצא. */
  const grpPill = shopGroup_(currentCat)
    ? `<button class="cat-pill active">${catLabel(currentCat)} <span class="cat-pill-n">${
         sellableItems(currentCat).length}</span></button>`
    : "";
  strip.innerHTML = grpPill + shopCategories().map(cat => {
    const n = sellableItems(cat).length;
    return `<button class="cat-pill ${cat===currentCat?"active":""}" onclick="selectCategory('${cat}')">
      ${catLabel(cat)} <span class="cat-pill-n">${n}</span>
    </button>`;
  }).join("");
}

// התפריט הזה חי רק עד שההדר האחיד (site-header.js) מחליף את ה-headbar,
// ומשם והלאה האלמנט לא קיים — ראו ההערה ב-loadShop.
function renderNavMenu(){
  const menu = document.getElementById("navProductsMenu");
  if(!menu) return;
  menu.innerHTML = shopCategories().map(cat =>
    `<button onclick="selectCategory('${cat}');closeNavMenu()">${catLabel(cat)}</button>`
  ).join("");
}

function priceText(v){ return Number(v).toLocaleString() + " ₪"; }

/* שתי סקאלות שקופות אחת על השנייה. הפעולה על ה-input עצמו מנוטרלת
   (pointer-events) והידיות בלבד לחיצות — אחרת הסקאלה העליונה הייתה
   חוסמת לגמרי את הידית שמתחתיה.
   ה-container מוגדר LTR בכוונה, גם באתר שכולו RTL: זול משמאל ויקר
   מימין זה מה שכולם מצפים לו בסרגל מחירים, וזה גם מה שדביר ביקש. */
function renderPriceGroup(){
  const b = priceBounds();
  if(!b) return "";
  const h = priceHandles(b);
  const pct = v => ((v - b.lo) / (b.hi - b.lo)) * 100;

  // תמיד פתוח: מחיר הוא הסינון הראשון שאנשים מחפשים, וסקאלה מקופלת
  // נראית כמו כותרת ולא כמו משהו שאפשר לשחק איתו.
  return `
    <div class="filter-group price-group open">
      <button class="filter-group-head" onclick="toggleGroup(this)">
        <span>${tr("מחיר","Price")}</span>
        <span class="chev">▾</span>
      </button>
      <div class="filter-group-body">
        <div class="price-slider">
          <div class="price-track"></div>
          <div class="price-fill" id="priceFill"
               style="left:${pct(h.min)}%;right:${100 - pct(h.max)}%"></div>
          <input type="range" class="price-input" id="priceMin"
                 min="${b.lo}" max="${b.hi}" step="${b.step}" value="${h.min}"
                 aria-label="${tr("מחיר מינימלי","Minimum price")}"
                 oninput="onPriceInput('min')" onchange="onPriceCommit()">
          <input type="range" class="price-input" id="priceMax"
                 min="${b.lo}" max="${b.hi}" step="${b.step}" value="${h.max}"
                 aria-label="${tr("מחיר מקסימלי","Maximum price")}"
                 oninput="onPriceInput('max')" onchange="onPriceCommit()">
        </div>
        <div class="price-fields">
          ${priceFieldHtml_("min", tr("מחיר מינימלי","Min price"), h.min, b)}
          <span class="price-fields-sep">–</span>
          ${priceFieldHtml_("max", tr("מחיר מקסימלי","Max price"), h.max, b)}
        </div>
      </div>
    </div>`;
}

/* התיבה מתחת לכל ידית — למי שיודע בדיוק איזה מספר הוא רוצה ולא בא לו
   לכוון אותו בגרירה. onchange ולא oninput: סינון על כל הקשה היה מסנן
   לפי "1" באמצע הקלדת "1500". Enter מוציא פוקוס וזה מפעיל את onchange. */
function priceFieldHtml_(which, label, value, b){
  return `
    <label class="price-field">
      <span class="price-field-label">${label}</span>
      <span class="price-field-box">
        <span class="price-field-cur">₪</span>
        <input type="number" class="price-field-input" id="price${which === "min" ? "Min" : "Max"}Box"
               inputmode="numeric" min="${b.lo}" max="${b.hi}" value="${value}"
               onchange="onPriceBox('${which}', this.value)"
               onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur();}">
      </span>
    </label>`;
}

/* כשהידיות יושבות בדיוק אחת על השנייה רק העליונה ניתנת לתפיסה, ולכן
   העליונה חייבת להיות זו שיש לה לאן לזוז: בקצה העליון של הסקאלה זו
   המינימום (שיכולה רק לרדת), ובקצה התחתון זו המקסימום. בלי זה אפשר
   להיתקע עם שתי ידיות צמודות שאף אחת מהן לא זזה. */
function priceStack_(b, lo){
  const elMin = document.getElementById("priceMin");
  if(elMin) elMin.style.zIndex = lo > (b.lo + b.hi) / 2 ? 5 : 3;
}

/* מקור אמת אחד: priceRange. הסקאלה, הפס והתיבות כולם נגזרים ממנו כאן,
   כך שגרירה והקלדה לא יכולות להיפרד זו מזו.
   הערה על ה"פיקסל": הסקאלה קופצת בצעדים (₪25/₪50/₪100) והתיבה מקבלת
   מספר מדויק. במקרה כזה הידית עומדת על הצעד הקרוב אבל המספר שנשמר
   ומסנן הוא מה שהוקלד — עדיף עיגול של כמה פיקסלים על פני "תיקנתי לך
   את המספר שהקלדת". */
function syncPriceUI_(b){
  const h = priceHandles(b);
  const elMin = document.getElementById("priceMin"), elMax = document.getElementById("priceMax");
  if(!elMin || !elMax) return;

  elMin.value = h.min;
  elMax.value = h.max;
  // הפס מצויר לפי מה שהסקאלה באמת מציגה (אחרי הצמדה לצעד), אחרת קצה
  // הפס והידית לא יושבים באותו מקום
  const pct = v => ((v - b.lo) / (b.hi - b.lo)) * 100;
  const fill = document.getElementById("priceFill");
  fill.style.left = pct(Number(elMin.value)) + "%";
  fill.style.right = (100 - pct(Number(elMax.value))) + "%";

  const boxMin = document.getElementById("priceMinBox"), boxMax = document.getElementById("priceMaxBox");
  if(boxMin && document.activeElement !== boxMin) boxMin.value = h.min;
  if(boxMax && document.activeElement !== boxMax) boxMax.value = h.max;

  priceStack_(b, Number(elMin.value));
}

/* תוך כדי גרירה מרעננים רק את הסקאלה, התיבות והתוצאות — בכוונה לא את
   סרגל הסינון כולו. renderFilters בונה מחדש את ה-innerHTML, וזה היה
   מוחק את ה-input שהאצבע אוחזת בו והגרירה הייתה נקטעת אחרי צעד אחד. */
function onPriceInput(which){
  const b = priceBounds();
  if(!b) return;
  const elMin = document.getElementById("priceMin"), elMax = document.getElementById("priceMax");
  let lo = Number(elMin.value), hi = Number(elMax.value);

  // הידיות לא עוברות אחת את השנייה — זו שנדחפה נעצרת בשנייה
  if(lo > hi){ if(which === "min") lo = hi; else hi = lo; }

  setPriceSide_("min", lo, b);
  setPriceSide_("max", hi, b);
  resetPage();          // בלי updateUrl: כתיבה לכתובת בכל צעד של גרירה
  syncPriceUI_(b);      // נחסמת בדפדפנים. הכתובת מתעדכנת ב-onPriceCommit.
  renderChips();
  renderGrid();
}

// קצה שיושב על גבול הסקאלה = "לא הוגבל", ולכן null ולא מספר. כך הצ'יפ
// לא מופיע סתם ו"נקה הכל" יודע שאין מה לנקות.
function setPriceSide_(which, value, b){
  const v = Math.min(b.hi, Math.max(b.lo, value));
  if(which === "min") priceRange.min = v <= b.lo ? null : v;
  else                priceRange.max = v >= b.hi ? null : v;
}

/* התיבות: מספר ריק או לא חוקי = ביטול ההגבלה מהצד הזה. מספר שחורג
   מהגבולות נצבט פנימה, ומספר שעובר את הצד השני נעצר בו — בדיוק כמו
   הידיות, כדי ששתי דרכי הקלט יתנהגו אותו דבר. */
function onPriceBox(which, raw){
  const b = priceBounds();
  if(!b) return;
  const txt = String(raw).replace(/[^\d.-]/g, "").trim();
  const num = txt === "" ? NaN : Number(txt);

  if(isNaN(num)){
    if(which === "min") priceRange.min = null; else priceRange.max = null;
  }else{
    const h = priceHandles(b);
    const capped = which === "min" ? Math.min(num, h.max) : Math.max(num, h.min);
    setPriceSide_(which, capped, b);
  }

  resetPage();
  renderAll();          // הקלדה היא סוף פעולה, אז מרעננים גם את המונים
}

// בסוף הגרירה מרעננים הכל, כדי שהמונים של שאר הקבוצות יתעדכנו
function onPriceCommit(){ renderAll(); }

function clearPriceFilter(){
  priceRange = { min: null, max: null };
  resetPage();
  renderAll();
}

/* קבוצת המלאי — ראשונה בסרגל ותמיד פתוחה. משתמשת באותן מחלקות של כל
   קבוצת סינון אחרת, כך שהיא לא דורשת שורת CSS חדשה ונראית כמו חלק
   מהסרגל ולא כמו תוספת. המונה מציג כמה מוצרים יש בכל צד, בדיוק כמו
   בשאר הקבוצות. */
function renderStockGroup(){
  const items = sellableItems(currentCat);
  const inN  = items.filter(it => shopInStock(it) && itemMatchesFilters(it, STOCK_FACET_KEY)).length;
  const outN = items.filter(it => !shopInStock(it) && itemMatchesFilters(it, STOCK_FACET_KEY)).length;
  // אין מה להציע כשאין אף מוצר שאזל — תיבת סימון שלא משנה כלום היא רעש
  if(!outN) return "";

  return `
    <div class="filter-group open">
      <button class="filter-group-head" onclick="toggleGroup(this)">
        <span>${tr("מלאי","Availability")}</span>
        <span class="chev">▾</span>
      </button>
      <div class="filter-group-body">
        <label class="filter-row">
          <input type="checkbox" ${onlyInStock ? "checked" : ""}
                 onchange="setOnlyInStock(this.checked)">
          <span class="filter-row-label">${tr("רק במלאי","In stock only")}</span>
          <span class="filter-row-count">${inN}</span>
        </label>
        <label class="filter-row ${onlyInStock ? "dim" : ""}">
          <input type="checkbox" ${onlyInStock ? "" : "checked"}
                 onchange="setOnlyInStock(!this.checked)">
          <span class="filter-row-label">${tr("כולל מוצרים שאזלו","Include out of stock")}</span>
          <span class="filter-row-count">${outN}</span>
        </label>
      </div>
    </div>`;
}

function renderFilters(){
  const wrap = document.getElementById("filterGroups");
  const groups = buildFacetData();
  const priceHtml = renderPriceGroup();
  const stockHtml = renderStockGroup();

  if(!groups.length && !priceHtml && !stockHtml){
    wrap.innerHTML = `<p class="no-filters">${tr("אין סינונים לקטגוריה הזו.","No filters for this category.")}</p>`;
    return;
  }

  wrap.innerHTML = stockHtml + priceHtml + groups.map((g, gi) => {
    const chosen = activeFilters[g.key];
    // ברירת מחדל: 3 הקבוצות הראשונות פתוחות, השאר מקופלות — אחרת
    // הסרגל ארוך מדי וקשה לסרוק אותו בעין.
    const open = gi < 3 || (chosen && chosen.size);
    return `
      <div class="filter-group ${open?"open":""}">
        <button class="filter-group-head" onclick="toggleGroup(this)">
          <span>${facetLabel(g.key)}</span>
          <span class="chev">▾</span>
        </button>
        <div class="filter-group-body">
          ${g.rows.map(r => `
            <label class="filter-row ${r.count===0?"dim":""}">
              <input type="checkbox" ${chosen && chosen.has(r.key) ? "checked":""}
                     onchange="toggleFilter('${g.key}', ${escHtml(JSON.stringify(r.key))}, this.checked)">
              <span class="filter-row-label">${valueLabel(g.key, r.raw)}</span>
              <span class="filter-row-count">${r.count}</span>
            </label>`).join("")}
        </div>
      </div>`;
  }).join("");

  const pb = priceBounds();
  if(pb) priceStack_(pb, priceHandles(pb).min);
}

function renderChips(){
  const wrap = document.getElementById("activeChips");
  const chips = [];
  Object.keys(activeFilters).forEach(key => {
    activeFilters[key].forEach(v => {
      const raw = isNaN(Number(v)) ? v : Number(v);
      // ⚠️ escHtml חובה: JSON.stringify מחזיר מרכאות כפולות, והמאפיין
      // onclick עצמו תחום במרכאות כפולות — בלי בריחה המאפיין נקטע באמצע
      // וכל הסינון מפסיק לעבוד (זה בדיוק הבאג שהיה כאן).
      chips.push(`<button class="chip" onclick="toggleFilter('${key}', ${escHtml(JSON.stringify(v))}, false)">
        ${facetLabel(key)}: ${valueLabel(key, raw)} <span class="chip-x">✕</span></button>`);
    });
  });
  if(priceFilterActive()){
    const b = priceBounds();
    if(b){
      const h = priceHandles(b);
      // רק הקצה שהוזז מוצג — "עד ₪2,000" קריא יותר מ-"₪0 – ₪2,000"
      const label = priceRange.min === null ? tr("עד ","Up to ") + priceText(h.max)
                  : priceRange.max === null ? tr("מ-","From ") + priceText(h.min)
                  : priceText(h.min) + " – " + priceText(h.max);
      chips.push(`<button class="chip" onclick="clearPriceFilter()">
        ${tr("מחיר","Price")}: ${label} <span class="chip-x">✕</span></button>`);
    }
  }
  if(searchTerm){
    // searchTerm מגיע מ-?q= בכתובת, כלומר מבחוץ — חייב בריחה לפני
    // הזרקה ל-innerHTML, אחרת קישור זדוני מריץ קוד בדף.
    chips.push(`<button class="chip" onclick="clearSearch()">"${escHtml(searchTerm)}" <span class="chip-x">✕</span></button>`);
  }
  /* ⚠️ הודעת המלאי **מחוץ** לרשימת ה-chips: היא אינה סינון שהמשתמש
     הפעיל אלא ברירת מחדל של החנות, ואם היא הייתה נספרת כ-chip הכפתור
     "נקה הכל" היה מופיע בכל דף גם כשאין שום סינון פעיל. */
  /* 🔴 הוסר 21.08 בהוראת דביר. כאן הופיע "411 מוצרים שאזלו מוסתרים · הצג".
     דביר: "א' זה לא נראה טוב ש-411 מוצרים אזלו מאיתנו, ב' אני לא חושב
     שצריך להראות את זה ללקוח — מה שהוא רואה באתר זה מה שאכפת לו."

     ⚠️ **המספר היה נכון** (נמדד: 404 שאזלו + 7 "ליצור קשר" מתוך 1,175
     מוצרים למכירה) — הבעיה אינה דיוק אלא שזה משפט הפתיחה של החנות.
     אין שום חנות שמקדמת את פני הלקוח בכמה מוצרים חסרים לה.

     ⚠️ **הסינון עצמו לא השתנה** ולא הוסתר: מוצרים שאזלו מוסננים
     כברירת מחדל כמו קודם, והמתג "כולל מוצרים שאזלו" נשאר בפאנל
     הסינון למי שמחפש אותו. מי שמגיע לדף מוצר שאזל עדיין רואה אותו
     ואת מצבו. רק שורת הכותרת ירדה. */
  const stockNote = "";

  wrap.innerHTML = (chips.length
    ? chips.join("") + `<button class="chip chip-clear" onclick="clearAllFilters()">${tr("נקה הכל","Clear all")}</button>`
    : "") + stockNote;
}

/* ==================== תמונת הכרטיס ====================
   תמונת מוצר אמיתית (עמודת image בגיליון) גוברת תמיד. בלעדיה מוצג ממלא
   מקום מעוצב — איור הקטגוריה מ-sprite.js ושם היצרן — ולא ריבוע ריק
   ולא "אין תמונה". עמודת image מתמלאת בהדרגה מהסנכרון מול הספק, כלומר
   תמיד יהיו כרטיסים בלי תמונה, וממלא המקום הוא מצב קבוע שצריך להיראות
   מכוון. העיצוב עצמו (.dvt-ph) יושב ב-products.css.

   ⚠️ ממלא המקום ממלא בדיוק את אותה תיבה (132px) שהתמונה ממלאת, ולכן
   שורה מעורבת של כרטיסים עם ועם בלי תמונה לא "קופצת" בגובה.

   ⚠️ האיור לפי it._realCat ולא currentCat: בתצוגת "הכל" currentCat הוא
   "all" (לא קטגוריה אמיתית, אין לה איור משלה), וכל פריט צריך את האיור
   של הקטגוריה האמיתית שלו ולא את אותו איור לכולם.

   ⚠️ היצרן בלבד ולא שם הדגם: השם כבר מודפס כשורה נפרדת מתחת לתיבה,
   וחזרה עליו בתוך התמונה הופכת כרטיס נקי לצפוף. */
function shopArt(it){
  const icon = (typeof dvtIcon === "function") ? dvtIcon(it._realCat) : "ic-case";
  const brand = it.brand ? `<span class="dvt-ph-brand">${escHtml(it.brand)}</span>` : "";
  const ph = `<span class="dvt-ph" aria-hidden="true">
      <svg class="dvt-ph-ic"><use href="#${escHtml(icon)}"/></svg>${brand}
    </span>`;

  /* ⚠️ ממלא המקום נכתב לפני ה-img ויושב מתחתיו, לא במקומו: כך הוא מוצג
     כבר בזמן הטעינה העצלה, ו-onerror על כתובת שבורה מסיר רק את ה-img
     וחושף אותו בחזרה — במקום אייקון תמונה שבורה של הדפדפן. onload
     מסתיר אותו כשהתמונה עלתה, כדי שלא יציץ מבעד ל-PNG שקוף. */
  return it.image
    ? ph + `<img src="${escHtml(it.image)}" alt="" loading="lazy"
            onload="this.parentNode.classList.add('dvt-art-on')" onerror="this.remove()">`
    : ph;
}

/* ==================== שלד טעינה ====================
   🔴 **הבעיה שזה פותר: הביקור הראשון נראה כמו אתר שבור.**

   נמדד מול ה-exec החי: תשובת getCatalog לוקחת ‎10–13 שניות‎ (רובן קריאת
   הגיליון בצד Apps Script). עד עכשיו ‎#productGrid‎ פשוט נשאר ריק כל
   הזמן הזה — בלי שלד, בלי טקסט, בלי שום סימן חיים — ולכן מבקר ראשון
   ראה כותרת ריקה ושטח לבן והסיק שהאתר לא עובד. **הנתונים היו בדרך;
   רק אף אחד לא אמר לו את זה.**

   ⚠️ מספר הכרטיסים הוא מסך אחד (12) ולא PAGE_SIZE (48): המטרה היא
   למלא את מה שרואים, ו-48 צמתי DOM לזרוק מיד אחר כך זו עבודה מיותרת
   בדיוק ברגע שבו ה-thread צריך לפרסר את התשובה.

   ⚠️ ההודעה ל-‎#resultCount‎ היא aria-live: משתמש קורא-מסך צריך לשמוע
   "טוען מוצרים", אחרת הדף שותק לגמרי לאורך כל ההמתנה. הכרטיסים עצמם
   מוסתרים ממנו (aria-hidden) — 12 שלדים ריקים אינם מידע. */
const SHOP_SKELETON_CARDS = 12;

function renderShopSkeleton(){
  const grid = document.getElementById("productGrid");
  if(!grid) return;

  const count = document.getElementById("resultCount");
  if(count){
    // aria-live נקבע כאן ולא ב-HTML כדי שהאזור יוכרז גם כשהטקסט מתחלף
    // אחר כך למספר התוצאות האמיתי.
    count.setAttribute("aria-live", "polite");
    count.textContent = tr("טוען מוצרים…", "Loading products…");
  }

  grid.innerHTML = Array.from({ length: SHOP_SKELETON_CARDS }, () => `
    <div class="p-card p-card--skel" aria-hidden="true">
      <div class="sk-art"></div>
      <div class="sk-line sk-sm"></div>
      <div class="sk-line sk-lg"></div>
      <div class="sk-line sk-md"></div>
      <div class="sk-foot"><div class="sk-line sk-price"></div><div class="sk-cart"></div></div>
    </div>`).join("");
}

function renderGrid(){
  const items = filteredItems();
  const grid = document.getElementById("productGrid");
  const empty = document.getElementById("emptyState");

  // ⚠️ החיתוך לעמוד קורה כאן, *אחרי* הסינון והמיון. currentPage נצבט
  // לגבולות גם כאן ולא רק בפעולות המשתמש, כי ?page= מגיע מהכתובת ויכול
  // להצביע על עמוד שכבר לא קיים (קישור ישן, קטלוג שהתעדכן).
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  currentPage = Math.min(pages, Math.max(1, currentPage));
  const from = (currentPage - 1) * PAGE_SIZE;
  const pageItems = items.slice(from, from + PAGE_SIZE);

  // המונה הוא תמיד סך *כל* התוצאות; טווח העמוד נוסף לידו רק כשיש יותר
  // מעמוד אחד, כדי שלא ייראה כאילו נשארו 48 מוצרים בלבד.
  const countText = items.length + " " + (items.length === 1 ? tr("מוצר","product") : tr("מוצרים","products"));
  document.getElementById("resultCount").textContent = pages > 1
    ? countText + " · " + tr("מוצגים ","Showing ") + (from + 1) + "–" + (from + pageItems.length)
    : countText;

  if(!items.length){
    grid.innerHTML = "";
    renderPager(1);
    empty.style.display = "block";
    /* ⚠️ כשכל התוצאות נפלו דווקא על המלאי, "נקה סינונים" לא יעזור —
       הוא לא נוגע במסנן המלאי. במקרה הזה מציעים בדיוק את הפעולה שכן
       תפתור, אחרת הלקוח נשאר מול מסך ריק עם כפתור שלא עושה כלום. */
    const hidden = oosHiddenCount();
    empty.innerHTML = hidden
      ? `${tr(`כל המוצרים שמתאימים לסינון אזלו מהמלאי (${hidden}).`,
              `All ${hidden} matching products are out of stock.`)}
         <button class="btn btn-secondary" onclick="setOnlyInStock(false)">${
           tr("הצג מוצרים שאזלו","Show out-of-stock products")}</button>`
      : `${tr("לא נמצאו מוצרים שמתאימים לסינון.","No products match these filters.")}
         <button class="btn btn-secondary" onclick="clearAllFilters()">${tr("נקה סינונים","Clear filters")}</button>`;
    return;
  }
  empty.style.display = "none";

  /* ⚠️ "תמונות להמחשה בלבד" — תנאי מפורש של הספק לשימוש בתמונות שלו,
     ולכן זו לא הערה קוסמטית. מוצג רק כשיש בדף לפחות תמונה אמיתית אחת:
     כשכל הכרטיסים מציגים איור קטגוריה אין תמונת מוצר להסתייג לגביה,
     והמשפט רק היה מבלבל. */
  const note = document.getElementById("imgNote");
  if(note){
    const anyImg = pageItems.some(it => it.image);
    note.textContent = anyImg
      ? tr("התמונות להמחשה בלבד. המפרט הכתוב הוא המחייב.",
           "Images are for illustration only. The written specification prevails.")
      : "";
    note.style.display = anyImg ? "" : "none";
  }

  // תג הקטגוריה מוצג רק בתצוגה שמערבבת קטגוריות ("הכל", "מבצעים",
  // קבוצת תפריט) — כשמסתכלים על קטגוריה אחת ממילא ברור מה רואים,
  // והתג היה רק רעש חוזר על עצמו.
  const catTag = it => isMixedView()
    ? `<div class="p-cat-tag">${catLabel(it._realCat)}</div>` : "";

  // כל הכרטיס מוביל לדף המוצר, חוץ מכפתור "הוסף לעגלה" שעוצר את
  // ההתפשטות כדי שקנייה מהירה מהרשימה תמשיך לעבוד כמו קודם.
  const href = it => `product.html?cat=${encodeURIComponent(it._realCat)}&id=${encodeURIComponent(it.id)}`;

  /* ⚠️ מוצר שאזל *נשאר* ברשימה, מעומעם ועם תג — אבל בלי כפתור קנייה.
     להעלים אותו לגמרי נראה כמו קטלוג שמתרוקן, ולקוח שרואה "אזל"
     יודע לחזור. תג המבצע מוחלף בתג האזילה כדי לא להבטיח הנחה על
     משהו שאי אפשר לקנות. */
  const stock = it => (typeof dvtInStock === "function") ? dvtInStock(it) : true;
  /* מצב מדורג: low = "זמינות מוגבלת" (נקנה, תג כתום שמזרז); ask =
     "ליצור קשר" (לא נקנה בקליק — הכפתור הופך לפנייה בוואטסאפ). */
  const st = it => (typeof dvtStockState === "function") ? dvtStockState(it) : (stock(it) ? "in" : "oos");
  // קישור "בדקו זמינות" — encodeURIComponent מנטרל גרשיים בשם המוצר
  const askWa = it => "https://wa.me/972502000373?text=" +
    encodeURIComponent(tr("היי דביר, רציתי לבדוק זמינות של: ", "Hi Dvir, checking availability of: ") + itemName(it).slice(0, 60));

  grid.innerHTML = pageItems.map(it => `
    <a class="p-card${st(it) === "oos" ? " p-card--oos" : ""}" href="${href(it)}">
      ${st(it) === "oos" ? `<span class="p-oos-badge">${tr("אזל המלאי","Out of stock")}</span>`
        : st(it) === "low" ? `<span class="p-low-badge">${tr("זמינות מוגבלת","Limited stock")}</span>`
        : st(it) === "ask" ? `<span class="p-ask-badge">${tr("לבדיקת זמינות","Check availability")}</span>`
        : dvtIsOnSale(it) ? `<span class="p-sale-badge">-${dvtDiscountPct(it)}%</span>` : ""}
      <div class="p-art">${shopArt(it)}</div>
      ${catTag(it)}
      ${it.brand ? `<div class="p-brand">${it.brand}</div>` : ""}
      <h4 class="p-name">${itemName(it)}</h4>
      <p class="p-spec">${itemSpec(it)}</p>
      <div class="p-foot">
        <div class="p-price${dvtIsOnSale(it) && stock(it) ? " p-price--sale" : ""}">${
          dvtIsOnSale(it) && stock(it) ? `<span class="p-price-was">${dvtOldPrice(it).toLocaleString()} ₪</span>` : ""
          }<span class="p-price-now">${Number(it.price).toLocaleString()}&nbsp;<span class="p-price-cur">₪</span></span></div>
        ${st(it) === "in" || st(it) === "low"
          ? `<button class="p-cart-btn" aria-label="${t("addToCartBtn")}: ${itemName(it).replace(/"/g,"&quot;")}"
                onclick="event.preventDefault();event.stopPropagation();addCatalogItemToCart('${it._realCat}','${it.id}')"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#ui-cart"/><path d="M12.3 8.9v4.2M10.2 11h4.2"/></svg></button>`
          : st(it) === "ask"
          ? `<button class="p-cart-btn p-cart-btn--wa" aria-label="${tr("בדקו זמינות בוואטסאפ","Check availability on WhatsApp")}: ${itemName(it).replace(/"/g,"&quot;")}"
                onclick="event.preventDefault();event.stopPropagation();window.open('${askWa(it)}','_blank')"><svg class="p-wa-ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#ui-wa"/></svg></button>`
          : `<button class="p-cart-btn" disabled aria-label="${tr("אזל המלאי","Out of stock")}"
                onclick="event.preventDefault();event.stopPropagation()"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#ui-cart"/></svg></button>`}
      </div>
    </a>`).join("");

  renderPager(pages);
}

/* ==================== עימוד ====================
   אילו מספרים מוצגים: תמיד הראשון והאחרון, ותמיד שכן אחד מכל צד של
   הנוכחי. בקטגוריה עם 27 עמודים רשימה מלאה לא נכנסת לשורה במובייל,
   ולכן פער של יותר מעמוד אחד מקוצר ל-"…" (null ברשימה).
   שכן אחד ולא שניים: זה מה שנכנס בשורה אחת גם במסך צר. */
function pagerNumbers(cur, pages){
  const nums = [];
  const add = n => { if(n >= 1 && n <= pages && nums.indexOf(n) === -1) nums.push(n); };
  add(1); add(cur - 1); add(cur); add(cur + 1); add(pages);
  nums.sort((a,b) => a - b);

  const out = [];
  nums.forEach((n, i) => {
    // "…" רק כשבאמת דילגנו. פער של עמוד אחד — עדיף להראות את העמוד עצמו
    // מאשר שלוש נקודות שתופסות את אותו מקום ולא ניתן ללחוץ עליהן.
    if(i && n - nums[i-1] === 2) out.push(n - 1);
    else if(i && n - nums[i-1] > 2) out.push(null);
    out.push(n);
  });
  return out;
}

/* ⚠️ הכיוון: הדף כולו RTL, כך שהאיבר הראשון שנכתב יושב מימין. "הקודם"
   נכתב ראשון ולכן נוחת מימין עם חץ שמצביע ימינה — ובאנגלית, כשהדף
   מתהפך ל-LTR, אותו איבר נוחת משמאל ולכן גם החץ מתהפך. */
function renderPager(pages){
  const wrap = document.getElementById("pager");
  if(!wrap) return;
  if(pages < 2){ wrap.innerHTML = ""; return; }

  wrap.setAttribute("aria-label", tr("עימוד","Pagination"));
  const step = (n, glyph, label) => `<button class="pager-btn" ${n < 1 || n > pages ? "disabled" : ""}
      onclick="goToPage(${n})" aria-label="${label}">${glyph}</button>`;

  const nums = pagerNumbers(currentPage, pages).map(n => n === null
    ? `<span class="pager-gap" aria-hidden="true">…</span>`
    : `<button class="pager-btn ${n === currentPage ? "active" : ""}"
         ${n === currentPage ? 'aria-current="page"' : ""}
         onclick="goToPage(${n})">${n}</button>`).join("");

  wrap.innerHTML =
    step(currentPage - 1, tr("›","‹"), tr("העמוד הקודם","Previous page")) +
    nums +
    step(currentPage + 1, tr("‹","›"), tr("העמוד הבא","Next page"));
}

/* מעבר עמוד לא נוגע בסינון — רק חותך מחדש את אותה רשימה מסוננת. */
function goToPage(n){
  const target = Math.max(1, n);
  if(target === currentPage) return;
  currentPage = target;            // renderGrid צובט לגבול העליון
  renderGrid();
  updateUrl();
  scrollToResults_();
}

/* גלילה לראש הרשימה ולא לראש הדף: אחרי מעבר עמוד רוצים לראות את המוצר
   הראשון, אבל גם להשאיר את סרגל הכלים (מיון, מונה) בשדה הראייה.
   ה-header דביק, ולכן משאירים לו מקום. */
function scrollToResults_(){
  const main = document.querySelector(".shop-main");
  if(!main) return;
  const top = main.getBoundingClientRect().top + window.scrollY - 80;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

/* מספר העמוד יושב בכתובת כדי שרענון, "חזור" ושיתוף קישור ינחתו על אותו
   עמוד. שאר הפרמטרים נשמרים כמו שהם: ?q= והסינון המוכן מראש
   (?cat=readyPc&useCase=gaming) נקראים רק בטעינה, ומחיקה שלהם כאן
   הייתה משנה את התוצאות בדיוק אחרי הרענון. עמוד 1 לא נרשם — כתובת
   נקייה היא זו שמשותפת בפועל. */
function updateUrl(){
  try{
    const p = new URLSearchParams(location.search);
    p.set("cat", currentCat);
    if(currentPage > 1) p.set("page", String(currentPage));
    else p.delete("page");
    const next = location.pathname + "?" + p.toString();
    // ⚠️ כתיבה רק כשמשהו באמת השתנה: renderAll רץ על כל הקשה בתיבת
    // החיפוש, ודפדפנים חוסמים replaceState שנקרא עשרות פעמים ברצף.
    if(next === location.pathname + location.search) return;
    history.replaceState(null, "", next);
  }catch(e){}
}

/* כל שינוי בסינון, בחיפוש או במיון מחזיר לעמוד 1 — עמוד 4 של תוצאה
   שהצטמצמה ל-12 פריטים הוא מסך ריק שנראה כמו תקלה. */
function resetPage(){ currentPage = 1; }

function renderAll(){
  renderCatStrip();
  renderFilters();
  renderChips();
  renderGrid();
  updateUrl();          // אחרי renderGrid: שם currentPage נצבט לגבולות
}

/* ==================== actions ==================== */
function shopCategories(){
  // "מבצעים" נעלמת לגמרי כשאין אף מוצר במבצע — עדיף בלי הלשונית מאשר
  // לשונית שמובילה לרשימה ריקה.
  return SHOP_CATEGORY_ORDER.filter(c =>
    (c === "all" || c === "sale" || dvtIsVirtualCat(c) || SHOP_CATALOG[c]) && sellableItems(c).length);
}

function selectCategory(cat){
  if(cat === currentCat) return;
  currentCat = cat;
  activeFilters = {};
  priceRange = { min: null, max: null };   // טווח של קטגוריה אחת לא רלוונטי לאחרת
  searchTerm = "";
  resetPage();                             // עמוד 3 של קטגוריה אחרת הוא רשימה ריקה
  document.getElementById("filterSearch").value = "";
  // כתובת נקייה: סינון מוכן מראש (?useCase=gaming) שייך לקטגוריה שממנה
  // באנו, ולא לזו שנבחרה עכשיו. updateUrl שב-renderAll ימלא את השאר.
  try{ history.replaceState(null, "", "?cat=" + encodeURIComponent(cat)); }catch(e){}
  renderAll();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleFilter(key, value, on){
  resetPage();
  if(!activeFilters[key]) activeFilters[key] = new Set();
  if(on) activeFilters[key].add(value);
  else{
    activeFilters[key].delete(value);
    if(!activeFilters[key].size) delete activeFilters[key];
  }
  renderAll();
}

/* ⚠️ לא נוגע ב-onlyInStock. "נקה הכל" מנקה את מה שהמשתמש בחר, ומסנן
   המלאי הוא ברירת המחדל של החנות ולא בחירה שלו — לחיצה על "נקה" שהייתה
   מציפה פתאום 454 כרטיסים אפורים היא בדיוק ההפך ממה שהכפתור מבטיח. */
function clearAllFilters(){
  activeFilters = {};
  priceRange = { min: null, max: null };
  searchTerm = "";
  resetPage();
  document.getElementById("filterSearch").value = "";
  renderAll();
}

function setOnlyInStock(on){
  const next = !!on;
  if(next === onlyInStock) return;
  onlyInStock = next;
  resetPage();          // עמוד 3 של רשימה שהתרחבה/הצטמצמה הוא מסך אחר לגמרי
  renderAll();
}
function clearSearch(){
  searchTerm = "";
  resetPage();
  document.getElementById("filterSearch").value = "";
  renderAll();
}
function onSearchInput(v){ searchTerm = v.trim(); resetPage(); renderAll(); }
// מיון מסדר מחדש את כל התוצאות, ולכן "הזול ביותר" חייב להיות בעמוד 1
function onSortChange(v){ sortMode = v; resetPage(); renderGrid(); updateUrl(); }
function toggleGroup(btn){ btn.parentElement.classList.toggle("open"); }

function openFilters(){ document.getElementById("filtersPanel").classList.add("show"); document.body.style.overflow="hidden"; }
function closeFilters(){ document.getElementById("filtersPanel").classList.remove("show"); document.body.style.overflow=""; }

function closeNavMenu(){
  const drop = document.getElementById("navProductsDrop");
  const btn = document.getElementById("navProducts");
  if(drop) drop.classList.remove("open");
  if(btn) btn.setAttribute("aria-expanded","false");
}

/* SKU בפורמט "<קטגוריה>:<id>" — בדיוק כמו הבונה, כך שהתמחור בצד שרת
   (priceCart_ ב-4-payment-api.gs) מזהה את שניהם באותה מפה אחת. */
function addCatalogItemToCart(cat, id){
  const it = sellableItems(cat).find(x => x.id === id);
  if(!it) return;
  if(typeof dvtInStock === "function" && !dvtInStock(it)) return;   // אזל — הכפתור ממילא חסום
  addToCart({ type:"product", sku: cat + ":" + it.id, name: itemName(it), price: Number(it.price), qty: 1 });
}

/* ==================== static text ==================== */
function renderShopStaticText(){
  { const _e=document.getElementById("navHome"); if(_e) _e.textContent = t("navHome"); }
  { const _e=document.getElementById("navProducts"); if(_e) _e.textContent = tr("מוצרים ▾","Products ▾"); }
  { const _e=document.getElementById("navBuilder"); if(_e) _e.textContent = t("navBuilder"); }
  { const _e=document.getElementById("navLab"); if(_e) _e.textContent = t("navLab"); }
  { const _e=document.getElementById("navWhy"); if(_e) _e.textContent = t("navWhy"); }
  { const _e=document.getElementById("navContact"); if(_e) _e.textContent = t("navContact"); }
  document.getElementById("shopTitle").textContent = tr("מוצרים","Products");
  document.getElementById("shopSubtitle").textContent =
    tr("כל המוצרים במלאי — מחשבים מוכנים, ציוד היקפי ורכיבים בודדים. אותם מחירים בדיוק כמו בבונה המחשבים.",
       "Everything in stock — ready-made PCs, peripherals and individual components. Same prices as the PC builder.");
  document.getElementById("filtersTitle").textContent = tr("סינון","Filters");
  document.getElementById("filterSearch").placeholder = tr("חיפוש בקטגוריה…","Search in category…");
  document.getElementById("filtersToggleBtn").textContent = tr("סינון","Filters");
  document.getElementById("filtersApplyBtn").textContent = tr("הצג תוצאות","Show results");
  document.getElementById("sortLabel").textContent = tr("מיון:","Sort:");
/* ⚠️ מוגן ב-if: הפוטר הידני הוחלף ב-site-footer.js (16.08.2026)
     ו-#footerText כבר לא קיים — הגישה הישירה קרסה כאן על כל טעינה
     והפילה את המשך הפונקציה (כולל סימון כפתור השפה). */
  const ft = document.getElementById("footerText");
  if(ft) ft.textContent = t("footerText");

  const sel = document.getElementById("sortSelect");
  sel.innerHTML = [
    ["priceAsc",  tr("מחיר: מהנמוך לגבוה","Price: low to high")],
    ["priceDesc", tr("מחיר: מהגבוה לנמוך","Price: high to low")],
    ["nameAsc",   tr("שם A-ת","Name A-Z")]
  ].map(([v,l]) => `<option value="${v}" ${v===sortMode?"selected":""}>${l}</option>`).join("");

  renderFooterLegal();
  document.querySelectorAll(".lang-btn").forEach(b => b.classList.toggle("active", b.dataset.lang === LANG));
}

function setLang(lang){
  if(lang === LANG) return;
  setLangCore(lang);
  renderShopStaticText();
  if(SHOP_CATALOG){ renderNavMenu(); renderAll(); }
}

/* ==================== init ==================== */
async function loadShop(){
  renderShopStaticText();
  /* ⚠️ לפני ה-await ולא אחריו — זו כל הנקודה. אחרי ה-await זה היה רץ
     רק כשהנתונים כבר כאן, כלומר בדיוק כשכבר אין בו צורך. */
  renderShopSkeleton();
  try{
    setShopCatalog(await dvtGetCatalog());
  }catch(e){
    const count = document.getElementById("resultCount");
    if(count) count.textContent = "";
    document.getElementById("productGrid").innerHTML =
      `<div class="empty-state">${tr(
        "לא הצלחנו לטעון את הקטלוג כרגע. רענן/י את הדף או נסה/י שוב בעוד רגע.",
        "Couldn't load the catalog right now. Please refresh or try again in a moment.")}</div>`;
    console.error("loadShop failed:", e);
    return;
  }

  const cats = shopCategories();
  if(!cats.length) return;

  const params = new URLSearchParams(location.search);
  /* ⚠️ קבוצה נבדקת בנפרד: היא לגיטימית ככתובת אבל לא נמצאת ב-
     shopCategories() (שם יושבות רק הלשוניות הקבועות). קבוצה שאין בה
     אף מוצר נדחית ונופלת ל-"הכל" — קישור לרשימה ריקה נראה כמו אתר שבור. */
  const wanted = params.get("cat");
  const wantedGrp = shopGroup_(wanted);
  currentCat = (wantedGrp && sellableItems(wanted).length) ? wanted
             : (cats.indexOf(wanted) > -1 ? wanted : cats[0]);

  // ?q= מגיע מהחיפוש הכלל-אתרי בהדר (site-search.js) — מציב את מילת
  // החיפוש כאילו המשתמש הקליד אותה כאן, כולל בתיבה עצמה, כך שאפשר גם
  // לערוך אותה בלי להתחיל מחדש.
  const wantedQ = params.get("q");
  if(wantedQ){
    searchTerm = wantedQ;
    const searchBox = document.getElementById("filterSearch");
    if(searchBox) searchBox.value = wantedQ;
  }

  /* סינון מוכן מראש מהכתובת, למשל ?cat=readyPc&useCase=gaming — כך
     שבאנר "מחשבי גיימינג" בדף הבית נוחת על מחשבי הגיימינג בלבד ולא
     על כל המחשבים המוכנים. כל שדה שמוגדר כסינון לקטגוריה נתמך, וגם
     בתצוגה מעורבת — שם הרשימה נבנית מהפריטים שבדף (facetKeysFor). */
  facetKeysFor(sellableItems(currentCat)).forEach(key => {
    const v = params.get(key);
    if(v === null || v === "") return;
    activeFilters[key] = new Set(v.split(",").map(s => s.trim()).filter(Boolean));
  });

  /* ?page= — כדי שרענון ושיתוף קישור ינחתו על אותו עמוד. הצביטה לגבול
     העליון נעשית ב-renderGrid, אחרי שידוע כמה תוצאות באמת יש. */
  const wantedPage = parseInt(params.get("page"), 10);
  currentPage = wantedPage > 1 ? wantedPage : 1;

  renderNavMenu();
  renderAll();

  // הדף נפתח מהמטמון מיידית; אם הרענון ברקע גילה שינוי אמיתי, מרעננים
  // את התצוגה בלי להפריע לסינון או לגלילה הנוכחיים.
  dvtOnCatalogRefresh(fresh => {
    setShopCatalog(fresh);
    renderNavMenu();
    renderAll();
  });

  /* ⚠️ תפריט "מוצרים" של הדף הזה קיים רק עד ש-site-header.js בונה את
     ההדר האחיד ומחליף את כל תוכן ה-headbar. משם והלאה האלמנטים האלה
     כבר לא בעמוד, ולכן כל גישה אליהם מוגנת — בלי ההגנה הזו טעינה ראשונה
     (בלי מטמון, כשההדר כבר נבנה) נפלה כאן והרשימה כולה לא הוצגה. */
  const drop = document.getElementById("navProductsDrop");
  const btn = document.getElementById("navProducts");
  if(drop && btn){
    btn.onclick = function(){
      const open = drop.classList.toggle("open");
      this.setAttribute("aria-expanded", open ? "true" : "false");
    };
    document.addEventListener("click", e => { if(!drop.contains(e.target)) closeNavMenu(); });
  }
}

loadShop();

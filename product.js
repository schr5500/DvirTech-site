/* =====================================================================
   DvirTech — דף מוצר (product.html)
   =====================================================================
   שלד אחד לכל המוצרים באתר. הכתובת היא product.html?cat=<קטגוריה>&id=<מזהה>,
   והדף נבנה מאותו getCatalog שמזין את החנות ואת הבונה — אין כאן שום
   נתון קשיח, ואין קובץ HTML נפרד לכל מוצר.

   דורש: search-core.js (dvtGetCatalog / dvtCatLabel / facetLabel /
   valueLabel / itemName / itemSpec) ו-cart.js (addToCart).

   ⚠️ ה-SKU שנשלח לעגלה הוא תמיד "<קטגוריית מקור>:<id>" — אותו פורמט
   שהבונה והחנות משתמשים בו, כי התמחור בצד שרת מזהה לפיו את הפריט.
===================================================================== */

let PD_CATALOG = null;
let PD_ITEM = null;
let PD_CAT = null;      // הקטגוריה האמיתית בגיליון (לא וירטואלית)
let PD_VIEW_CAT = null; // הקטגוריה שהלקוח הגיע דרכה — "מסכים" ולא "ציוד היקפי"
let PD_QTY = 1;

const PD_MAX_QTY = 20;  // התקרה שהשרת אוכף על שורה בעגלה

/* שדות שלא מציגים בטבלת המפרט: או פנימיים, או שכבר מוצגים במקום אחר
   בדף (שם, מחיר, מלאי, תיאור, תמונה).

   ⚠️ tier מוסתר בכוונה. הוא נגזר אצלנו מהמחיר (ENRICH_TIER_BANDS) ולא
   מגיע משום יצרן — הוא ציון פנימי שהבונה מאזן לפיו הרכבה. להציג אותו
   כשורה במפרט היה מציג הערכה שלנו כנתון של היצרן. */
const PD_HIDDEN_FIELDS = new Set([
  "id","name","nameEn","spec","specEn","price","oldPrice","saleEndsAt",
  "inStock","stock","brand","image","images","_realCat","icon",
  "desc","descEn","label","labelEn","shopOnly","tier","radiatorSupport"
]);

const pdNis = v => Number(v).toLocaleString("he-IL") + " ₪";
const pdEsc = s => String(s == null ? "" : s)
  .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

/* ==================== שליפת המוצר ==================== */
function pdFindItem(catalog, cat, id){
  // הקטגוריה שבכתובת עשויה להיות וירטואלית ("monitor"); הפריט עצמו
  // תמיד יושב בקטגוריית המקור שלו בגיליון.
  const realCat = dvtIsVirtualCat(cat)
    ? (DVT_VIRTUAL_CATS[cat] && DVT_VIRTUAL_CATS[cat].from)
    : cat;
  const g = catalog[realCat];
  if(!g) return null;
  const it = (g.items || []).filter(dvtIsSellable).find(x => String(x.id) === String(id));
  return it ? Object.assign({ _realCat: realCat }, it) : null;
}

/* קישור שהגיע בלי cat, או עם cat שגוי אחרי שמוצר עבר לשונית — עדיין
   צריך להגיע למוצר ולא למסך "לא נמצא". המזהים ייחודיים בין הלשוניות
   (CPU-1000 / CSE-7000), אז חיפוש לפי id בלבד בטוח. */
function pdFindAnywhere(catalog, id){
  const cats = Object.keys(catalog || {});
  for(const c of cats){
    const it = ((catalog[c] || {}).items || []).filter(dvtIsSellable)
      .find(x => String(x.id) === String(id));
    if(it) return Object.assign({ _realCat: c }, it);
  }
  return null;
}

/* ==================== תמונה ====================
   ⚠️ עמודת image עדיין לא קיימת ב-API. הדף לא ממציא כתובות ולא מציג
   תמונת קטגוריה גנרית במקום המוצר — תמונה של "כרטיס מסך כלשהו" בדף של
   דגם מסוים היא בדיוק מה שגורם ללקוח לחשוב שהוא ראה את המוצר שקנה.
   עד שהעמודה תגיע מוצג placeholder עם שם המוצר, וברגע שתגיע היא תופיע
   כאן לבד בלי שינוי קוד. */
function pdArt(it, cat){
  const ph = `<span class="pd-ph">
      <svg aria-hidden="true"><use href="#${dvtIcon(cat)}"/></svg>
      <span class="pd-ph-name">${pdEsc(itemName(it))}</span>
    </span>`;
  // ה-placeholder יושב *מתחת* לתמונה ולא במקומה: כך הוא מוצג גם בזמן
  // הטעינה, וכתובת שבורה בגיליון רק מסירה את ה-img וחושפת אותו שוב.
  return it.image
    ? ph + `<img src="${pdEsc(it.image)}" alt="${pdEsc(itemName(it))}" onerror="this.remove()">`
    : ph;
}

/* תמונונת ברצועת "מוצרים דומים" — שם השם כבר מופיע מתחת לכרטיס, ולכן
   ה-placeholder הוא האיור בלבד. */
function pdThumbArt(it, cat){
  return it.image
    ? `<img src="${pdEsc(it.image)}" alt="${pdEsc(itemName(it))}" loading="lazy"
            onerror="pdThumbFail(this,'${pdEsc(dvtIcon(cat))}')">`
    : `<svg aria-hidden="true"><use href="#${dvtIcon(cat)}"/></svg>`;
}
function pdThumbFail(img, iconId){
  img.outerHTML = `<svg aria-hidden="true"><use href="#${iconId}"/></svg>`;
}

/* ==================== מפרט טכני ====================
   ⚠️ מקור התוויות: CAT_DEFS ב-CRM+SUPPLIERS/11-catalog.gs, שדה tech של
   כל קטגוריה — הועתקו משם מילה במילה. אלה בדיוק הכותרות שרשומות בשורה
   2 של הגיליון, כך שמה שהלקוח קורא בדף זהה למה שמוקלד בגיליון.

   למה מפה פר-קטגוריה ולא FACET_LABELS הגלובלי מ-search-core.js: אותו
   מפתח נושא משמעות אחרת בכל לשונית. chipset הוא "ערכת שבבים" בלוח אם
   ו"שבב גרפי" בכרטיס מסך; formFactor הוא "גודל פיזי" בלוח ו"תקן ספק"
   בספק כוח; heightMm הוא "גובה" בזיכרון ו"עובי/רוחב" בכרטיס מסך. תווית
   אחת גלובלית הייתה שקר באחת משתי הקטגוריות.

   הסדר כאן הוא הסדר שבו השדות מוצגים — לא סדר העמודות בגיליון. שדה
   שאין לו ערך פשוט לא מודפס. */
const PD_TECH_FIELDS = {
  cpu: [
    { key:"socket",          label:"תושבת" },
    { key:"cpuGen",          label:"דור" },
    { key:"tier",            label:"רמת ביצועים" },
    { key:"cores",           label:"ליבות" },
    { key:"ramType",         label:"סוג זיכרון" },
    { key:"maxRamGb",        label:"זיכרון מירבי (GB)" },
    { key:"maxRamSpeedMhz",  label:"מהירות זיכרון רשמית" },
    { key:"tdp",             label:"פליטת חום (W)" },
    { key:"maxTurboWatts",   label:"צריכת שיא (W)" },
    { key:"hasIgpu",         label:"גרפיקה מובנית" },
    { key:"coolerIncluded",  label:"כולל קירור" },
    { key:"overclockable",   label:"תמיכה ב-OC" }
  ],

  mobo: [
    { key:"socket",               label:"תושבת מעבד" },
    { key:"chipset",              label:"ערכת שבבים" },
    { key:"supportedCpuGens",     label:"דורות מעבד נתמכים" },
    { key:"formFactor",           label:"גודל פיזי" },
    { key:"tier",                 label:"דרג לוח" },
    { key:"ramType",              label:"סוג זיכרון" },
    { key:"ramSlots",             label:"חריצי זיכרון" },
    { key:"maxRamGb",             label:"זיכרון מירבי (GB)" },
    { key:"maxRamSpeedMhz",       label:"מהירות זיכרון מירבית" },
    { key:"m2Slots",              label:"חריצי M.2" },
    { key:"sataPorts",            label:"יציאות SATA" },
    { key:"m2SharesSata",         label:"M.2 חולק SATA" },
    { key:"pcieX16Slots",         label:"חריצי PCIe x16" },
    { key:"pcieX1Slots",          label:"חריצי PCIe x1" },
    { key:"cpuSockets",           label:"תושבות מעבד" },
    { key:"epsConnectors",        label:"מחברי EPS" },
    { key:"maxCpuTdpWatts",       label:"הספק מעבד מירבי (W)" },
    { key:"wifiBuiltIn",          label:"WiFi מובנה" },
    { key:"argbHeaders",          label:"חיבורי ARGB" },
    { key:"supportsOverclocking", label:"תמיכה ב-OC" }
  ],

  ram: [
    { key:"ramType",    label:"תקן זיכרון" },
    { key:"capacityGb", label:"נפח כולל (GB)" },
    { key:"sticks",     label:"מספר סטיקים" },
    { key:"speedMhz",   label:"מהירות (MHz)" },
    { key:"cl",         label:"תזמון (CL)" },
    { key:"heightMm",   label:'גובה (מ"מ)' },
    { key:"tier",       label:"דרג" }
  ],

  gpu: [
    { key:"chipset",             label:"שבב גרפי" },
    { key:"vramGb",              label:"זיכרון גרפי (GB)" },
    { key:"tier",                label:"דירוג ביצועים" },
    { key:"lengthMm",            label:'אורך (מ"מ)' },
    { key:"heightMm",            label:'עובי/רוחב (מ"מ)' },
    { key:"slotWidth",           label:"עובי (חריצים)" },
    { key:"tdpWatts",            label:"צריכת חשמל (W)" },
    { key:"recommendedPsuWatts", label:"ספק מומלץ (W)" },
    { key:"powerConnectors",     label:"מחברי הזנה" }
  ],

  cooling: [
    { key:"type",                label:"סוג קירור" },
    { key:"sockets",             label:"תושבות נתמכות" },
    { key:"tdpRating",           label:"פינוי חום (W)" },
    { key:"heightMm",            label:'גובה (מ"מ)' },
    { key:"ramClearanceMm",      label:'מרווח מעל הזיכרון (מ"מ)' },
    { key:"radiatorMm",          label:'רדיאטור (מ"מ)' },
    { key:"radiatorThicknessMm", label:'עובי רדיאטור (מ"מ)' },
    { key:"pasteIncluded",       label:"כולל משחה" },
    { key:"tier",                label:"דרג" }
  ],

  storage: [
    { key:"driveType",  label:"סוג כונן" },
    { key:"capacityGb", label:"נפח (GB)" },
    { key:"formFactor", label:"גודל פיזי" },
    { key:"pcieGen",    label:"דור PCIe" },
    { key:"tier",       label:"דרג" }
  ],

  psu: [
    { key:"wattage",    label:"הספק (W)" },
    { key:"formFactor", label:"תקן ספק" },
    { key:"lengthMm",   label:'אורך (מ"מ)' },
    { key:"efficiency", label:"תקן יעילות" },
    { key:"modular",    label:"מודולרי" },
    { key:"connectors", label:"פירוט חיבורים" },
    { key:"tier",       label:"דרג" }
  ],

  /* ⚠️ שלושה מפתחות כאן שונים מהגיליון, כי postProcessSheetItem_ ב-
     4-payment-api.gs משנה אותם לפני השליחה: formFactors הופך למערך
     supportedFormFactors, ו-radiatorFrontMm/radiatorTopMm נדחסים לאובייקט
     radiatorSupport אחד. pdFlatten מפרק אותו בחזרה לשתי שורות כדי
     שהתוויות מהגיליון יישארו נכונות. */
  "case": [
    { key:"supportedFormFactors",    label:"לוחות אם נתמכים" },
    { key:"maxGpuLengthMm",          label:'אורך כרטיס מירבי (מ"מ)' },
    { key:"maxGpuHeightMm",          label:'עובי כרטיס מירבי (מ"מ)' },
    { key:"expansionSlots",          label:"חריצי הרחבה" },
    { key:"maxAirCoolerHeightMm",    label:'גובה קירור מירבי (מ"מ)' },
    { key:"radiatorFrontMm",         label:'רדיאטור חזית (מ"מ)' },
    { key:"radiatorTopMm",           label:'רדיאטור עליון (מ"מ)' },
    { key:"maxRadiatorThicknessMm",  label:'עובי רדיאטור מירבי (מ"מ)' },
    { key:"fanMounts",               label:"עמדות מאוורר" },
    { key:"fanSizesMm",              label:"גדלי מאוורר" },
    { key:"supportedPsuFormFactors", label:"תקני ספק נתמכים" },
    { key:"maxPsuLengthMm",          label:'אורך ספק מירבי (מ"מ)' },
    { key:"bays25",                  label:'מקומות 2.5"' },
    { key:"bays35",                  label:'מקומות 3.5"' },
    { key:"frontPanel",              label:"פאנל קדמי" },
    { key:"tier",                    label:"דרג" }
  ],

  caseFans: [
    { key:"fans",        label:"כמות מאווררים" },
    { key:"sizeMm",      label:'גודל (מ"מ)' },
    { key:"argb",        label:"תאורת ARGB" },
    { key:"pwm",         label:"בקרת PWM" },
    { key:"hubIncluded", label:"כולל האב" }
  ],

  paste: [
    { key:"grams",                  label:"כמות (גרם)" },
    { key:"conductivity",           label:"מוליכות (W/m·K)" },
    { key:"electricallyConductive", label:"מוליך חשמל" }
  ],

  wifi: [
    { key:"busType",      label:"סוג חיבור" },
    { key:"netType",      label:"סוג רשת" },
    { key:"wifiStandard", label:"תקן WiFi" },
    { key:"speedMbps",    label:"מהירות (Mbps)" },
    { key:"bluetooth",    label:"Bluetooth" }
  ],

  extras: [
    { key:"subType",        label:"סוג אביזר" },
    { key:"argb",           label:"תאורת ARGB" },
    { key:"lengthCm",       label:'אורך (ס"מ)' },
    { key:"compatibleWith", label:"מתאים ל-" }
  ],

  readyPc: [
    { key:"useCase",        label:"ייעוד" },
    { key:"cpuName",        label:"מעבד" },
    { key:"gpuName",        label:"כרטיס מסך" },
    { key:"ramGb",          label:"זיכרון (GB)" },
    { key:"storageGb",      label:"אחסון (GB)" },
    { key:"os",             label:"מערכת הפעלה" },
    { key:"warrantyMonths", label:"אחריות (חודשים)" }
  ],

  laptop: [
    { key:"useCase",        label:"ייעוד" },
    { key:"cpuName",        label:"מעבד" },
    { key:"gpuName",        label:"כרטיס מסך" },
    { key:"ramGb",          label:"זיכרון (GB)" },
    { key:"storageGb",      label:"אחסון (GB)" },
    { key:"sizeInch",       label:'גודל מסך ("")' },
    { key:"resolution",     label:"רזולוציה" },
    { key:"refreshHz",      label:"רענון (Hz)" },
    { key:"weightKg",       label:'משקל (ק"ג)' },
    { key:"os",             label:"מערכת הפעלה" },
    { key:"warrantyMonths", label:"אחריות (חודשים)" }
  ],

  peripherals: [
    { key:"subType",    label:"סוג מוצר" },
    { key:"connection", label:"חיבור" },
    { key:"rgb",        label:"תאורת RGB" },
    { key:"dpi",        label:"DPI (עכבר)" },
    { key:"switchType", label:"מתגים (מקלדת)" },
    { key:"sizeInch",   label:'גודל מסך ("")' },
    { key:"refreshHz",  label:"רענון (Hz)" },
    { key:"resolution", label:"רזולוציה" },
    { key:"panel",      label:"סוג פאנל" }
  ],

  services: []
};

/* שדות שהגיליון שומר כרשימה מופרדת בפסיקים, כי Sheets לא יודע להחזיק
   מערך בתא. מוצגים כרשימה מופרדת בנקודה, כמו מערך אמיתי.
   fanSizesMm כלול כאן בשביל היום שבו העמודה בגיליון תעוצב כטקסט
   ותגיע כמחרוזת עם פסיקים, כמו שהסכימה מתכוונת. */
const PD_MULTI_VALUE = new Set([
  "sockets","supportedCpuGens","supportedFormFactors","supportedPsuFormFactors",
  "fanSizesMm","connectors","powerConnectors"
]);

/* התווית באנגלית מגיעה מ-FACET_LABELS ב-search-core.js, אבל *רק* כשהיא
   מדברת על אותו מושג: המפה שם גלובלית לפי מפתח, ו-chipset שלה הוא
   "שבב גרפי". השוואת העברית היא הבדיקה שמונעת מלוח אם לקבל את התרגום
   של כרטיס מסך. אין התאמה — נשארים בתווית מהגיליון, כי תרגום מומצא
   גרוע יותר מעברית באתר אנגלי. */
function pdFieldLabel(f){
  if(typeof LANG === "undefined" || LANG !== "en") return f.label;
  const g = FACET_LABELS[f.key];
  return (g && g.he === f.label) ? g.en : f.label;
}

/* ⚠️ תקלת נתונים אמיתית, לא באג בקוד: העמודה fanSizesMm נכתבה בגיליון
   כרשימה מופרדת בפסיקים ("120,140,200") כמו שהסכימה מבקשת, אבל Sheets
   קרא את זה כמספר אחד עם מפרידי אלפים ושמר 120140200. כך זה גם מגיע
   מה-API (30 מתוך 57 המארזים). מפרקים כאן בחזרה לפי גדלי מאוורר מוכרים,
   ומה שלא מתפרק במדויק פשוט לא מוצג — "מאוורר 120140200 מ\"מ" גרוע
   מכלום. ⚠️ התיקון האמיתי הוא לעצב את העמודה כטקסט בגיליון: אותו ערך
   מגיע ככה גם ל-builder-compat.js, ושם הוא לא רק מכוער. */
const PD_FAN_SIZES = [200,180,140,120,92,80,60,40];
function pdSplitFanSizes(n){
  let s = String(n);
  const out = [];
  while(s.length){
    const hit = PD_FAN_SIZES.find(k => s.indexOf(String(k)) === 0);
    if(!hit) return null;
    out.push(hit);
    s = s.slice(String(hit).length);
  }
  return out.length ? out : null;
}

/* ⚠️ postProcessSheetItem_ ב-4-payment-api.gs דוחס את שני שדות הרדיאטור
   של המארז לאובייקט אחד. בלי הפירוק הזה הטבלה הייתה מדפיסה
   "[object Object]" בשורה אחת במקום שתי שורות אמיתיות. */
function pdFlatten(it){
  const f = Object.assign({}, it);
  const r = f.radiatorSupport;
  if(r && typeof r === "object"){
    if(r.front) f.radiatorFrontMm = r.front;
    if(r.top)   f.radiatorTopMm   = r.top;
  }
  if(typeof f.fanSizesMm === "number" && f.fanSizesMm > 999){
    const sizes = pdSplitFanSizes(f.fanSizesMm);
    if(sizes) f.fanSizesMm = sizes; else delete f.fanSizesMm;
  }
  return f;
}

/* ערך "יש" לצורך הטבלה.
   ⚠️ false לא נחשב ערך. תיבת סימון שלא סומנה בגיליון חוזרת מה-API כ-
   false בדיוק כמו תיבה שנבדקה ונמצאה שלילית, ואי אפשר להבדיל ביניהן.
   להדפיס "WiFi מובנה: לא" על לוח שפשוט לא מולא זו טעות עובדתית מול
   לקוח — ולכן מוצג רק מה שסומן. */
function pdHasValue(v){
  if(v === undefined || v === null || v === "") return false;
  if(Array.isArray(v)) return v.length > 0;
  if(v === false) return false;
  if(typeof v === "object") return false;
  return true;
}

/* ערך בודד שנכתב בגיליון בקיצור טכני ונקרא רע בדף. VALUE_LABELS
   ב-search-core.js הוא המקום הנכון לזה, אבל הוא משותף לחנות ולבונה
   ולא נוגעים בו מדף המוצר. */
const PD_VALUE_OVERRIDE = {
  powerConnectors: { none: { he:"ללא (הזנה מחריץ ה-PCIe)", en:"None (powered by the PCIe slot)" } }
};

function pdSpecValue(key, raw, label){
  const one = v => {
    const o = PD_VALUE_OVERRIDE[key] && PD_VALUE_OVERRIDE[key][v];
    return o ? (LANG === "en" ? o.en : o.he) : valueLabel(key, v);
  };

  const list = Array.isArray(raw) ? raw
    : (PD_MULTI_VALUE.has(key) && typeof raw === "string" && raw.indexOf(",") > -1)
      ? raw.split(",").map(s => s.trim()).filter(Boolean)
      : null;

  let s = list ? list.map(one).join(" · ") : one(raw);

  /* התווית מהגיליון כבר נושאת את היחידה — "הספק (W)". valueLabel מוסיף
     אותה שוב מ-FACET_UNITS, וביחד זה היה יוצא "הספק (W) · 750W". מסירים
     רק כשהיחידה זהה: כונן 2TB תחת "נפח (GB)" דווקא צריך להשאיר את ה-TB,
     אחרת הלקוח יקרא 2 ויחשוב שמדובר ב-2GB. */
  const unit = (typeof FACET_UNITS !== "undefined" && FACET_UNITS[key])
    || (key === "warrantyMonths" ? " " + tr("חודשים","months") : "");
  if(unit && label.indexOf("(") > -1 && s.length > unit.length && s.endsWith(unit)){
    s = s.slice(0, -unit.length);
  }
  return s;
}

/* בונה את שורות הטבלה: קודם השדות של הקטגוריה לפי הסדר שבסכימה, ואחר כך
   כל שדה נוסף שקיים על הפריט ולא מוכר לה. השארית היא הביטוח: עמודה
   חדשה בגיליון תופיע בדף לבד, עם התווית מ-FACET_LABELS אם יש כזו,
   בלי שנצטרך לזכור לעדכן כאן. */
function pdSpecRows(item, realCat){
  const src  = pdFlatten(item);
  const rows = [];
  const seen = new Set();

  const push = (key, label) => {
    if(PD_HIDDEN_FIELDS.has(key) || seen.has(key)) return;
    if(!pdHasValue(src[key])) return;
    seen.add(key);
    rows.push({ label: label, value: pdSpecValue(key, src[key], label) });
  };

  (PD_TECH_FIELDS[realCat] || []).forEach(f => push(f.key, pdFieldLabel(f)));
  Object.keys(src).forEach(k => push(k, facetLabel(k)));
  return rows;
}

/* ==================== מלאי ====================
   dvtInStock מכריע רק "אפשר לקנות או לא". כאן מעניין גם *כמה*: כשמוקלד
   מספר בגיליון הוא מגביל את בורר הכמות, כדי שלא נקבל הזמנה על 5 יחידות
   כשיש 2 במלאי. */
function pdStockLeft(it){
  const raw = it && (it.inStock !== undefined ? it.inStock
            : (it["מלאי"] !== undefined ? it["מלאי"] : it.stock));
  if(typeof raw === "number") return raw > 0 ? raw : 0;
  const s = String(raw == null ? "" : raw).trim();
  return /^\d+$/.test(s) ? Number(s) : null;
}

function pdInStock(it){
  return (typeof dvtInStock === "function") ? dvtInStock(it) : true;
}

function pdMaxQty(){
  const left = PD_ITEM ? pdStockLeft(PD_ITEM) : null;
  return (left && left > 0) ? Math.min(PD_MAX_QTY, left) : PD_MAX_QTY;
}

function pdStockHtml(it){
  if(!pdInStock(it)){
    return `<div class="pd-stock pd-stock--out">${tr("אזל מהמלאי","Out of stock")}</div>`;
  }
  const left = pdStockLeft(it);
  // מספר מוצג רק כשהוא באמת נמוך. "נותרו 47 יחידות" לא אומר כלום ורק
  // מסגיר את גודל המלאי.
  const low = (left !== null && left > 0 && left <= 5)
    ? `<span class="pd-stock-left">${tr(`נותרו ${left} יח'`, `${left} left`)}</span>` : "";
  return `<div class="pd-stock pd-stock--in">${tr("במלאי","In stock")}${low}</div>`;
}

/* ==================== רינדור ==================== */
function pdRenderNotFound(){
  document.getElementById("pdCrumbs").innerHTML = "";
  document.getElementById("pdRelated").innerHTML = "";
  document.getElementById("pdBody").innerHTML = `
    <div class="pd-missing">
      <h1>${tr("המוצר לא נמצא","Product not found")}</h1>
      <p>${tr("ייתכן שהמוצר הוסר מהמלאי או שהקישור שגוי.",
              "The product may have been removed, or the link is incorrect.")}</p>
      <a class="btn btn-primary" style="width:auto;display:inline-flex" href="products.html?cat=all">
        ${tr("לכל המוצרים","Browse all products")}</a>
    </div>`;
}

function pdRenderCrumbs(){
  const catName = dvtCatLabel(PD_VIEW_CAT, PD_CATALOG[PD_VIEW_CAT]);
  document.getElementById("pdCrumbs").innerHTML = `
    <a href="index.html">${tr("ראשי","Home")}</a>
    <span class="pd-crumb-sep">›</span>
    <a href="products.html?cat=all">${tr("מוצרים","Products")}</a>
    <span class="pd-crumb-sep">›</span>
    <a href="products.html?cat=${encodeURIComponent(PD_VIEW_CAT)}">${pdEsc(catName)}</a>
    <span class="pd-crumb-sep">›</span>
    <span class="pd-crumb-cur">${pdEsc(itemName(PD_ITEM))}</span>`;
}

function pdRenderBody(){
  const it       = PD_ITEM;
  const specRows = pdSpecRows(it, PD_CAT);
  const catName  = dvtCatLabel(PD_VIEW_CAT, PD_CATALOG[PD_VIEW_CAT]);
  const canBuy   = pdInStock(it);
  const onSale   = (typeof dvtIsOnSale === "function") && dvtIsOnSale(it) && canBuy;

  document.getElementById("pdBody").innerHTML = `
    <div class="pd-main">
      <div class="pd-media">
        <div class="pd-art pd-art-frame">${pdArt(it, PD_CAT)}</div>
        <!-- גילוי נאות ליד התמונה עצמה. הנוסח המחייב המלא נמצא בסעיף 2
             בתקנון; כאן רק שורה קצרה שהלקוח באמת רואה. -->
        <p class="pd-img-note">${tr("תמונות להמחשה בלבד. המפרט הכתוב הוא המחייב.",
                                    "Images are for illustration only. The written specification prevails.")}
          <a href="terms.html">${tr("לתקנון","Terms")}</a></p>
      </div>

      <div class="pd-info">
        <a class="pd-cat-link" href="products.html?cat=${encodeURIComponent(PD_VIEW_CAT)}">${pdEsc(catName)}</a>
        ${it.brand ? `<div class="pd-brand">${pdEsc(it.brand)}</div>` : ""}
        <h1 class="pd-title">${pdEsc(itemName(it))}</h1>
        ${itemSpec(it) ? `<p class="pd-sub">${pdEsc(itemSpec(it))}</p>` : ""}

        <div class="pd-price-box">
          <div class="pd-price-row">
            <span class="pd-price">${pdNis(it.price)}</span>
            ${onSale ? `<span class="pd-price-was">${pdNis(dvtOldPrice(it))}</span>
                        <span class="pd-save">-${dvtDiscountPct(it)}%</span>` : ""}
          </div>
          <div class="pd-price-note">${tr("כולל אחריות יבואן רשמי · עד 12 תשלומים",
                                          "Official importer warranty · up to 12 installments")}</div>
          ${pdStockHtml(it)}
          <!-- סה"כ מתעדכן חי לפי הכמות. מוסתר בכמות 1, כי אז הוא רק
               חוזר על המחיר שמעליו. -->
          <div class="pd-total" id="pdTotalBox" hidden>
            <span class="pd-total-k">${tr("סה\"כ","Total")} <b id="pdTotalQty">1</b> ${tr("יח'","pcs")}</span>
            <span class="pd-total-v" id="pdTotalVal"></span>
          </div>
        </div>

        <div class="pd-buy">
          <div class="pd-qty">
            <button type="button" onclick="pdChangeQty(-1)" aria-label="${tr("הפחת","Decrease")}">−</button>
            <span id="pdQty">${PD_QTY}</span>
            <button type="button" onclick="pdChangeQty(1)" aria-label="${tr("הוסף","Increase")}">+</button>
          </div>
          ${canBuy
            ? `<button class="btn btn-primary pd-add" onclick="pdAddToCart()">${t("addToCartBtn")}</button>`
            : `<button class="btn btn-primary pd-add" disabled>${tr("אזל המלאי","Out of stock")}</button>`}
        </div>

        <ul class="pd-perks">
          <li><svg class="ui-ic"><use href="#ui-truck"/></svg>${tr("משלוח 2-5 ימי עסקים","Delivery in 2-5 business days")}</li>
          <li><svg class="ui-ic"><use href="#ui-shield"/></svg>${tr("אחריות מלאה על כל רכיב","Full warranty on every part")}</li>
          <li><svg class="ui-ic"><use href="#ui-tools"/></svg>${tr("הרכבה והתקנה בתוספת תשלום","Assembly and setup available")}</li>
          <li><svg class="ui-ic"><use href="#ui-chat"/></svg>${tr("שאלה על המוצר?","Questions about this product?")}
            <a class="pd-wa" href="${pdWhatsappHref(it)}" target="_blank" rel="noopener"
               >${tr("דברו איתנו","Talk to us")}</a></li>
        </ul>
      </div>
    </div>

    <div class="pd-sections">
      <section class="pd-section">
        <h2>${tr("תיאור","Description")}</h2>
        <p class="pd-desc">${pdEsc(pdDescription(it, catName))}</p>
      </section>

      <section class="pd-section">
        <h2>${tr("מפרט טכני","Technical specifications")}</h2>
        ${specRows.length ? `
        <table class="pd-spec">
          <tbody>
            ${specRows.map(r => `<tr><th>${pdEsc(r.label)}</th><td>${pdEsc(r.value)}</td></tr>`).join("")}
          </tbody>
        </table>
        <p class="pd-spec-note">${tr("המפרט נמסר על ידי היצרן ועשוי להשתנות בין מהדורות. בכל שאלה — דברו איתנו לפני ההזמנה.",
                                     "Specifications are supplied by the manufacturer and may vary between revisions. In doubt — talk to us before ordering.")}</p>`
        : `<p class="pd-spec-note">${tr("המפרט המלא של המוצר הזה עדיין לא הוזן. דברו איתנו ונשלים לכם את הפרטים.",
                                        "The full specification for this product hasn't been entered yet. Talk to us and we'll fill in the details.")}</p>`}
      </section>
    </div>`;

  // ⚠️ הטמפלייט נבנה מחדש בכל רינדור (החלפת שפה / רענון קטלוג ברקע),
  // ולכן הכמות והסה"כ חייבים להיכתב אחריו ולא להישאר על 1 של ה-HTML.
  pdRenderTotal();
}

/* תיאור: אם יש עמודת desc בגיליון — מציגים אותה. אין עדיין כזו, ולכן
   בינתיים מרכיבים משפט מהנתונים הקיימים (spec מהגיליון) במקום להשאיר
   שדה ריק. ברגע שתתווסף עמודה desc/descEn היא תגבר אוטומטית. */
/* שמות הקטגוריות בחנות הם ברבים ("כרטיסי מסך"), ומשפט תיאור צריך יחיד.
   חיתוך אוטומטי של סיומת רבים לא עובד בעברית ("כרטיסי מסך" לא נגמר
   ב-ים), ולכן יש כאן מיפוי מפורש — לקוח משדה noun של CAT_DEFS
   ב-11-catalog.gs, בלי ה"א הידיעה. */
const PD_CAT_SINGULAR = {
  readyPc:"מחשב מוכן", monitor:"מסך", peripherals:"פריט ציוד היקפי",
  cpu:"מעבד", gpu:"כרטיס מסך", mobo:"לוח אם", ram:"ערכת זיכרון",
  storage:"כונן", cooling:"פתרון קירור", psu:"ספק כוח", "case":"מארז",
  caseFans:"ערכת מאווררים", paste:"משחה תרמית", wifi:"כרטיס רשת",
  extras:"אביזר", laptop:"מחשב נייד", services:"שירות"
};

function pdDescription(it, catName){
  const own = (LANG === "en" && it.descEn) ? it.descEn : it.desc;
  if(own) return own;

  const singular = PD_CAT_SINGULAR[PD_CAT] || catName;
  const brand = it.brand || "DvirTech";
  const parts = [];
  parts.push(tr(`${itemName(it)} הוא ${singular} מבית ${brand}.`,
                `${itemName(it)} is a ${catName.replace(/s$/,"").toLowerCase()} from ${brand}.`));
  if(itemSpec(it)) parts.push(itemSpec(it) + ".");
  parts.push(tr("המוצר נמכר עם אחריות יבואן רשמי, ואפשר לקבל אותו מורכב ומוגדר כחלק מהרכבה מלאה.",
                "Sold with official importer warranty, and can be delivered assembled and configured as part of a full build."));
  return parts.join(" ");
}

/* ==================== מוצרים קשורים ==================== */
function pdRenderRelated(){
  const same = sellableInCat(PD_VIEW_CAT)
    .filter(x => String(x.id) !== String(PD_ITEM.id))
    .sort((a,b) => Math.abs(a.price - PD_ITEM.price) - Math.abs(b.price - PD_ITEM.price))
    .slice(0, 5);
  if(!same.length){ document.getElementById("pdRelated").innerHTML = ""; return; }

  document.getElementById("pdRelated").innerHTML = `
    <div class="sec-head"><h2>${tr("מוצרים דומים","Similar products")}</h2>
      <a class="more" href="products.html?cat=${encodeURIComponent(PD_VIEW_CAT)}">${tr("הכל","View all")}</a></div>
    <div class="rowscroll">
      ${same.map(x => `
        <a class="deal" href="product.html?cat=${encodeURIComponent(x._realCat || PD_CAT)}&id=${encodeURIComponent(x.id)}">
          <div class="deal-art">${pdThumbArt(x, x._realCat || PD_CAT)}</div>
          <div class="deal-name">${pdEsc(itemName(x))}</div>
          <div class="deal-foot"><span class="deal-price">${pdNis(x.price)}</span></div>
        </a>`).join("")}
    </div>
    <p class="pd-img-note">${tr("תמונות להמחשה בלבד.","Images are for illustration only.")}</p>`;
}

/* קטגוריה וירטואלית ("מסכים") לא קיימת כלשונית בגיליון, ולכן אי אפשר
   לקרוא ממנה ישירות — dvtVirtualItems מסנן אותה מתוך לשונית המקור. */
function sellableInCat(cat){
  if(dvtIsVirtualCat(cat)) return dvtVirtualItems(PD_CATALOG, cat);
  const g = PD_CATALOG[cat];
  if(!g) return [];
  return (g.items || []).filter(dvtIsSellable).map(x => Object.assign({ _realCat: cat }, x));
}

/* קישור וואטסאפ עם שם המוצר שהלקוח צופה בו, כדי שלא יצטרך להסביר
   על מה הוא מדבר ואני אדע מיד לאיזה פריט הוא מתכוון. */
const PD_WHATSAPP_NUMBER = "972502000373";
function pdWhatsappHref(it){
  const msg = tr(
    `שלום, ראיתי את "${itemName(it)}" באתר ורציתי לשאול כמה שאלות לגביו.`,
    `Hi, I saw "${itemName(it)}" on your site and had a few questions about it.`);
  return `https://wa.me/${PD_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

/* ==================== פעולות ==================== */
function pdChangeQty(d){
  PD_QTY = Math.max(1, Math.min(pdMaxQty(), PD_QTY + d));
  const el = document.getElementById("pdQty");
  if(el) el.textContent = PD_QTY;
  pdRenderTotal();
}

/* סה"כ חי לפי הכמות. מופיע רק מכמות 2 ומעלה. */
function pdRenderTotal(){
  const box = document.getElementById("pdTotalBox");
  if(!box || !PD_ITEM) return;
  const qty = document.getElementById("pdQty");
  if(qty) qty.textContent = PD_QTY;
  if(PD_QTY < 2){ box.hidden = true; return; }
  box.hidden = false;
  document.getElementById("pdTotalQty").textContent = PD_QTY;
  document.getElementById("pdTotalVal").textContent = pdNis(Number(PD_ITEM.price) * PD_QTY);
}

function pdAddToCart(){
  if(!PD_ITEM) return;
  if(!pdInStock(PD_ITEM)) return;
  addToCart({
    type: "product",
    sku: PD_ITEM._realCat + ":" + PD_ITEM.id,
    name: itemName(PD_ITEM),
    price: Number(PD_ITEM.price),
    qty: PD_QTY
  });
}

/* ==================== טקסט קבוע ושפה ==================== */
function pdRenderStaticText(){
  const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  set("navHome", t("navHome"));       set("navReady", t("navReady"));
  set("navPeripherals", t("navPeripherals")); set("navComponents", t("navComponents"));
  set("navBuilder", t("navBuilder")); set("navLab", t("navLab"));
  set("navWhy", t("navWhy"));         set("navContact", t("navContact"));
  set("footerText", t("footerText"));
  renderFooterLegal();
  document.querySelectorAll(".lang-btn").forEach(b => b.classList.toggle("active", b.dataset.lang === LANG));
}

function setLang(lang){
  if(lang === LANG) return;
  setLangCore(lang);
  pdRenderStaticText();
  if(PD_ITEM) pdRenderProduct();
}

/* ==================== טעינה ====================
   ⚠️ כל שרשרת הרינדור עטופה: באג בשורה אחת בטבלת המפרט (שדה בצורה
   לא צפויה מהגיליון) לא אמור להשאיר את הלקוח מול ספינר נצחי או דף לבן.
   מקבלים דף מוצר חלקי עם הודעה, ולא כלום. */
function pdRenderProduct(){
  try{
    pdRenderCrumbs();
    pdRenderBody();
    pdRenderRelated();
  }catch(e){
    console.error("[product] render failed:", e);
    document.getElementById("pdBody").innerHTML = `
      <div class="pd-missing">
        <h1>${pdEsc(itemName(PD_ITEM) || "")}</h1>
        <p>${tr("לא הצלחנו להציג את פרטי המוצר. דברו איתנו ונשלח לכם את המידע.",
                "We couldn't display this product's details. Talk to us and we'll send you the information.")}</p>
        <a class="btn btn-primary" style="width:auto;display:inline-flex"
           href="${pdWhatsappHref(PD_ITEM)}" target="_blank" rel="noopener">
          ${tr("דברו איתנו","Talk to us")}</a>
      </div>`;
  }
}

async function loadProduct(){
  pdRenderStaticText();

  const params = new URLSearchParams(location.search);
  const cat = params.get("cat");
  const id  = params.get("id");

  document.getElementById("pdBody").innerHTML =
    `<div class="pd-loading"><span class="spinner"></span>${tr("טוען מוצר…","Loading product…")}</div>`;

  try{
    PD_CATALOG = await dvtGetCatalog();
  }catch(e){
    console.error("[product] getCatalog failed:", e);
    document.getElementById("pdBody").innerHTML =
      `<div class="pd-missing"><p>${tr("לא הצלחנו לטעון את המוצר כרגע. נסו לרענן.",
                                       "Couldn't load the product right now. Please refresh.")}</p></div>`;
    return;
  }

  // בלי id אין מה לחפש. עם id בלי cat (או עם cat שהמוצר כבר לא יושב בה)
  // עדיין מוצאים אותו — קישור ישן לא צריך להוביל למסך "לא נמצא".
  const found = id ? (pdFindItem(PD_CATALOG, cat, id) || pdFindAnywhere(PD_CATALOG, id)) : null;
  if(!found){ pdRenderNotFound(); return; }

  PD_ITEM = found;
  PD_CAT  = found._realCat;
  // הקטגוריה שהלקוח הגיע דרכה נשמרת לתצוגה בלבד: מי שהגיע מ"מסכים"
  // צריך לראות "מסכים" בפירורי הלחם ולחזור לשם, לא ל"ציוד היקפי".
  PD_VIEW_CAT = (cat && dvtIsVirtualCat(cat) && DVT_VIRTUAL_CATS[cat].from === PD_CAT
                 && DVT_VIRTUAL_CATS[cat].match(found)) ? cat : PD_CAT;
  document.title = itemName(found) + " — DvirTech";

  pdRenderProduct();

  dvtOnCatalogRefresh(fresh => {
    PD_CATALOG = fresh;
    const again = pdFindItem(fresh, PD_CAT, PD_ITEM.id);
    if(!again) return;              // נמחק מהגיליון בזמן הצפייה — משאירים את מה שמוצג
    PD_ITEM = again;
    PD_QTY  = Math.min(PD_QTY, pdMaxQty());   // המלאי אולי ירד בינתיים
    pdRenderProduct();
  });
}

loadProduct();

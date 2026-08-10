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

function _dvtWriteCache(catalog){
  try{
    localStorage.setItem(DVT_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), catalog: catalog }));
  }catch(e){ /* מכסת אחסון מלאה / גלישה פרטית — פשוט בלי מטמון */ }
}

/* מי שרוצה לדעת שהנתונים התרעננו ברקע (למשל כדי לרנדר מחדש) נרשם כאן. */
const _dvtRefreshSubs = [];
function dvtOnCatalogRefresh(fn){ if(typeof fn === "function") _dvtRefreshSubs.push(fn); }

function _dvtFetchFresh(){
  return fetch(DVT_API_URL + "?action=getCatalog")
    .then(r => r.json())
    .then(d => {
      if(!d.ok || !d.catalog) throw new Error(d.error || "getCatalog failed");
      return d.catalog;
    });
}

function dvtGetCatalog(){
  if(_dvtCatalog) return Promise.resolve(_dvtCatalog);
  if(_dvtCatalogPromise) return _dvtCatalogPromise;

  const cached = _dvtReadCache();
  if(cached){
    _dvtCatalog = cached.catalog;
    const stale = (Date.now() - cached.savedAt) > DVT_CACHE_MAX_AGE_MS;
    // מרעננים ברקע תמיד. אם התוכן באמת השתנה — מודיעים למי שנרשם.
    _dvtFetchFresh().then(fresh => {
      const changed = JSON.stringify(fresh) !== JSON.stringify(_dvtCatalog);
      _dvtCatalog = fresh;
      _dvtWriteCache(fresh);
      if(changed) _dvtRefreshSubs.forEach(fn => { try{ fn(fresh); }catch(e){} });
    }).catch(() => { /* אין רשת — ממשיכים עם המטמון */ });

    // מטמון ישן מדי ולא הצלחנו לרענן: עדיף להציג נתונים ישנים מכלום,
    // ולכן גם כאן מחזירים אותו מיד. הרענון ברקע כבר רץ.
    void stale;
    return Promise.resolve(_dvtCatalog);
  }

  // ביקור ראשון — אין ברירה אלא לחכות לרשת
  _dvtCatalogPromise = _dvtFetchFresh()
    .then(c => { _dvtCatalog = c; _dvtWriteCache(c); return c; })
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
  monitor:     ["מסכים",          "Monitors"],
  peripherals: ["ציוד היקפי",     "Peripherals"],
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

function dvtItemScore(item, catLabelText, term){
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
  return total;
}

/* פריטי-דמה ("ללא כרטיס מסך") הם בחירה בבונה ולא מוצר שנמכר. */
function dvtIsSellable(it){
  return it && it.id !== "none" && Number(it.price) > 0;
}

/* ==================== קטגוריות וירטואליות ====================
   קטגוריה שקיימת בחנות אבל *לא* כלשונית בגיליון. "מסכים" הם פריטים
   מתוך ציוד היקפי עם subType=monitor — כך הם מקבלים מדף משלהם בלי
   להוסיף לשונית לגיליון, בלי לגעת בבקאנד ובלי פריסה מחדש.

   ⚠️ ה-SKU נשאר של קטגוריית המקור (peripherals:peri-mon ולא
   monitor:peri-mon), אחרת התמחור בצד שרת לא יזהה את הפריט. לכן
   dvtVirtualItems מתייג _realCat לפי from ולא לפי הקטגוריה הווירטואלית. */
const DVT_VIRTUAL_CATS = {
  monitor: { from: "peripherals", match: it => it.subType === "monitor" }
};

function dvtIsVirtualCat(cat){ return !!DVT_VIRTUAL_CATS[cat]; }

function dvtVirtualItems(catalog, cat){
  const v = DVT_VIRTUAL_CATS[cat];
  if(!v || !catalog) return [];
  const g = catalog[v.from];
  if(!g) return [];
  return (g.items || [])
    .filter(dvtIsSellable)
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
  subType:    { mouse:{he:"עכבר",en:"Mouse"}, keyboard:{he:"מקלדת",en:"Keyboard"}, monitor:{he:"מסך",en:"Monitor"}, headset:{he:"אוזניות",en:"Headset"}, speakers:{he:"רמקולים",en:"Speakers"}, webcam:{he:"מצלמת רשת",en:"Webcam"}, chair:{he:"כיסא",en:"Chair"}, other:{he:"אחר",en:"Other"} },
  connection: { wired:{he:"חוטי",en:"Wired"}, wireless:{he:"אלחוטי",en:"Wireless"}, bluetooth:{he:"Bluetooth",en:"Bluetooth"} },
  switchType: { mechanical:{he:"מכני",en:"Mechanical"}, membrane:{he:"ממברנה",en:"Membrane"}, optical:{he:"אופטי",en:"Optical"} },
  type:       { air:{he:"אוויר",en:"Air"}, aio:{he:"נוזלי (AIO)",en:"Liquid (AIO)"} },
  driveType:  { nvme:{he:"SSD NVMe (M.2)",en:"NVMe SSD (M.2)"}, "sata-ssd":{he:"SSD SATA",en:"SATA SSD"}, hdd:{he:"דיסק מכני (HDD)",en:"Hard drive (HDD)"} },
  pcieGen:    { 3:{he:"PCIe 3.0",en:"PCIe 3.0"}, 4:{he:"PCIe 4.0",en:"PCIe 4.0"}, 5:{he:"PCIe 5.0",en:"PCIe 5.0"} },
  tier:       { 1:{he:"בסיסי",en:"Entry"}, 2:{he:"בינוני",en:"Mid"}, 3:{he:"גבוה",en:"High"}, 4:{he:"פרימיום",en:"Premium"} }
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

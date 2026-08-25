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
/* ⚠️ warranty מוסתר כאן כי הוא מוצג בתיבת המחיר (pdWarrantyHtml) ולא
   בטבלה. בלי זה הוא היה נופל לשארית שבסוף pdSpecRows ומודפס עם התווית
   "warranty" — facetLabel מחזיר את המפתח עצמו כשאין לו תרגום. */
/* ⚠️ עמודות ה-supply_* אינן ברשימת העמודות הפנימיות של ה-API בכוונה
   (ראה SHEET_INTERNAL_COLUMNS_ ב-4-payment-api.gs) — הן מגיעות ללקוח כדי
   שהחנות תוכל להסתיר מוצר שהופסק. הן לא מפרט, ובלי החסימה כאן הן היו
   נדפסות בקבוצת "מפרט נוסף" בשמן הגולמי. */
const PD_HIDDEN_FIELDS = new Set([
  "id","name","nameEn","spec","specEn","price","oldPrice","saleEndsAt",
  "inStock","stock","brand","image","images","_realCat","icon",
  "desc","descEn","label","labelEn","shopOnly","tier","radiatorSupport",
  "warranty","supply_status","supplyStatus","supply_reason","supply_checked"
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
  const it = (g.items || []).filter(x => dvtIsSellable(x, realCat)).find(x => String(x.id) === String(id));
  return it ? Object.assign({ _realCat: realCat }, it) : null;
}

/* קישור שהגיע בלי cat, או עם cat שגוי אחרי שמוצר עבר לשונית — עדיין
   צריך להגיע למוצר ולא למסך "לא נמצא". המזהים ייחודיים בין הלשוניות
   (CPU-1000 / CSE-7000), אז חיפוש לפי id בלבד בטוח. */
function pdFindAnywhere(catalog, id){
  const cats = Object.keys(catalog || {});
  for(const c of cats){
    const it = ((catalog[c] || {}).items || []).filter(x => dvtIsSellable(x, c))
      .find(x => String(x.id) === String(id));
    if(it) return Object.assign({ _realCat: c }, it);
  }
  return null;
}

/* ==================== תמונה ====================
   ⚠️ הדף לא ממציא כתובות ולא מציג תמונת קטגוריה גנרית במקום המוצר —
   תמונה של "כרטיס מסך כלשהו" בדף של דגם מסוים היא בדיוק מה שגורם
   ללקוח לחשוב שהוא ראה את המוצר שקנה. מוצר בלי עמודת image מקבל ממלא
   מקום מעוצב (איור הקטגוריה + היצרן והדגם), שנראה כמו בחירה ולא כמו
   תמונה שלא נטענה. עיצוב ה-.dvt-ph יושב ב-products.css.

   ⚠️ סדר השכבות: ממלא המקום נכתב *לפני* ה-img ויושב מתחתיו, ולא
   מוחלף בו. שלוש תוצאות שכולן רצויות:
   • בזמן הטעינה רואים את ממלא המקום ולא ריבוע ריק.
   • onerror מסיר רק את ה-img — כתובת שבורה בגיליון חוזרת לממלא המקום
     ולא משאירה אייקון שבור של הדפדפן.
   • onload מסמן את המסגרת ומסתיר את ממלא המקום, כדי שלא יציץ מבעד
     לתמונת PNG שקופה. */
function pdPlaceholder(it, cat, withName){
  const brand = it.brand ? `<span class="dvt-ph-brand">${pdEsc(it.brand)}</span>` : "";
  const name  = withName ? `<span class="dvt-ph-name">${pdEsc(itemName(it))}</span>` : "";
  // aria-hidden: השם והיצרן כבר מוקראים מהכותרת ומשורת היצרן שליד
  // התמונה. בלי זה קורא מסך היה שומע את שם המוצר פעמיים ברצף.
  return `<span class="dvt-ph" aria-hidden="true">
      <svg class="dvt-ph-ic"><use href="#${dvtIcon(cat)}"/></svg>
      ${brand}${name}
    </span>`;
}

/* ה-onload/onerror נכתבים כמחרוזת אחת: הטמפלייט מוזרק דרך innerHTML,
   ואין כאן צומת אמיתי לתלות בו addEventListener בזמן הבנייה. */
const PD_IMG_HOOKS =
  `onload="this.parentNode.classList.add('dvt-art-on')" onerror="this.remove()"`;

/* ==================== זכוכית מגדלת ====================
   🔴 **מופעלת רק כשיש תמונה אמיתית ורק במכשיר עם עכבר.**
   `matchMedia("(hover: hover) and (pointer: fine)")` הוא הבדיקה
   הנכונה — לא רוחב מסך. טאבלט רחב עדיין מגע, ולפטופ צר עדיין עכבר.

   ⚠️ העדשה היא אלמנט אחד עם `background-image` של אותה תמונה
   מוגדלת. אין טעינה שנייה מהרשת, ואין ספרייה. */
const PD_ZOOM = 2.5;

function pdZoomInit(){
  const frame = document.getElementById("pdArtFrame");
  const lens  = document.getElementById("pdZoomLens");
  if(!frame || !lens) return;

  const src = frame.getAttribute("data-zoom");
  /* אין תמונה אמיתית → אין מה להגדיל. איור קטגוריה מוגדל נראה
     כמו באג, לא כמו פיצ'ר. */
  if(!src){ lens.remove(); return; }

  const fine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if(!fine){ lens.remove(); return; }

  lens.style.backgroundImage = "url('" + src + "')";
  frame.classList.add("pd-art-zoomable");

  /* 🔴 **עדשה עגולה שנעה עם הסמן, לא פאנל בצד.**
     הגרסה הקודמת הציגה ריבוע קבוע ליד התמונה — דביר: "אני מצביע
     על משהו ונפתח לי בצד ריבוע". זכוכית מגדלת אמורה להגדיל
     **במקום שמצביעים עליו**, ולכן העדשה ממורכזת על הסמן.

     ⚠️ `pointer-events:none` על העדשה הוא קריטי: בלעדיו העדשה
     נמצאת מתחת לסמן, תופסת את ה-mousemove, ו-mouseleave יורה
     מיד — העדשה מהבהבת ונעלמת. */
  function move(e){
    const r = frame.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if(x < 0 || y < 0 || x > r.width || y > r.height){ hide(); return; }

    const size = lens.offsetWidth || 180;
    /* מיקום העדשה: ממורכזת על הסמן. */
    lens.style.left = (x - size/2) + "px";
    lens.style.top  = (y - size/2) + "px";

    /* התמונה בתוך העדשה מוגדלת פי PD_ZOOM, וממוקמת כך שהנקודה
       שמתחת לסמן תופיע במרכז העדשה. */
    lens.style.backgroundSize = (r.width * PD_ZOOM) + "px " + (r.height * PD_ZOOM) + "px";
    lens.style.backgroundPosition =
      (-(x * PD_ZOOM - size/2)) + "px " + (-(y * PD_ZOOM - size/2)) + "px";
    lens.classList.add("on");
  }
  function hide(){ lens.classList.remove("on"); }

  frame.addEventListener("mousemove", move);
  frame.addEventListener("mouseleave", hide);
}

/* ==================== שירותי DvirTech בדף המוצר ====================
   🔴 זה מה שמצדיק לקנות כאן ולא ב-KSP, ועד עכשיו הוא לא הופיע בדף
   שבו הלקוח מחליט.

   🔴 **הכותרת "הרכבה והתקנה" הייתה מטעה — תוקנה 23.08.**
   דביר קרא אותה והבין **התקנה בבית הלקוח**, שזה שירות אחר לגמרי
   שמחייב תיאום איתו טלפונית. הכותרת עכשיו אומרת במפורש
   **"הרכבה והתקנת Windows 11"**, ולכן אי אפשר לטעות בה.

   ⚠️ **שים לב שהשורה מכסה שני דברים שונים בכוונה**, וזה נכון:
     · **הרכבה** — ללא עלות, ורק כשקונים כאן את **כל** הרכיבים
       למחשב שלם. היא לא נבחרת בקופה: `withFreeAssemblyLine`
       מוסיפה את `assembly-included` ב-0 ₪ אוטומטית.
       דביר: "זה טוב שזה מופיע שם לפרסום המוצרים שלנו."
     · **התקנות** — Windows 11 + רישיון 300 / בלי רישיון 200 /
       תוכנות 80 / העברת נתונים 200. אלה **כן** נבחרות בקופה,
       דרך `DVT_SERVICES`, וכולן דורשות מחשב בעגלה (`requiresPc`).

   ⚠️ **התקנה בבית הלקוח אינה כאן** — היא בשורת "ביקור טכנאי",
   שמובילה ל-support.html ודורשת תיאום. זו בדיוק אי-ההבנה שתוקנה.

   ארבע ההצעות, כולן קיימות בפועל:
     · הרכבה והתקנת Windows 11 ... checkout.js
     · ביקור טכנאי ............... מתואם אישית, תקנון §6
     · DvirTech Care ............. מנוי שנתי, support.html#care

   ⚠️ **אין כאן מחירים ואין "הוסף לסל".** שירות דורש תיאום ותמחור
   לפי מקרה, והצגת מחיר קבוע בדף מוצר תיצור הבטחה שלא תמיד אפשר
   לעמוד בה. הקישור מוביל לדף התמיכה, שם המחירים מעודכנים במקום אחד.

   ⚠️ לא מוצג על קטגוריית "שירותים" — שם זו כפילות. */
function pdServicesHtml(cat){
  if(cat === "services") return "";
  const row = (icon, title, text, href, cta) => `
    <a class="pd-svc" href="${href}">
      <svg class="ui-ic" aria-hidden="true"><use href="#${icon}"/></svg>
      <span class="pd-svc-txt"><b>${title}</b><span>${text}</span></span>
      <span class="pd-svc-cta">${cta}</span>
    </a>`;
  return `
    <section class="pd-section pd-services">
      <h2>${tr("גם זה אצלנו","We also do this")}</h2>
      <p class="pd-svc-lead">${tr(
        "אנחנו לא רק מוכרים את הרכיב — אפשר גם שנרכיב, נתקין ונהיה שם אחר כך.",
        "We don't just sell the part — we can build it, install it, and be there afterwards.")}</p>
      ${row("ui-tools", tr("הרכבה והתקנת Windows 11","Assembly & Windows 11 setup"),
            tr("ההרכבה ללא עלות כשקונים כאן את כל הרכיבים למחשב שלם. התקנת Windows 11 עם רישיון, תוכנות והעברת נתונים — נבחרות בקופה.",
               "Assembly is free when you buy all the parts for a complete PC here. Windows 11 with a licence, software and data transfer are chosen at checkout."),
            "checkout.html", tr("נבחר בקופה","Choose at checkout"))}
      ${row("ui-pin", tr("ביקור טכנאי","On-site visit"),
            tr("קריית גת והסביבה, ולפי זמינות גם השפלה והמרכז — בתיאום מראש.",
               "Kiryat Gat area, and by availability the Shfela and centre — by arrangement."),
            "support.html", tr("לפרטים","Details"))}
      ${row("ui-headset", "DvirTech Care",
            tr("מנוי שנתי לתמיכה וייעוץ — מישהו לדבר איתו כשמשהו לא עובד.",
               "A yearly support subscription — someone to call when something breaks."),
            "support.html#care", tr("לחבילות","See plans"))}
    </section>`;
}

function pdArt(it, cat){
  const ph = pdPlaceholder(it, cat, true);
  return it.image
    ? ph + `<img src="${pdEsc(it.image)}" alt="${pdEsc(itemName(it))}" ${PD_IMG_HOOKS}>`
    : ph;
}

/* תמונונת ברצועת "מוצרים דומים" — שם המוצר כבר מופיע מתחת לכרטיס,
   ולכן ממלא המקום כאן מציג את היצרן בלבד ולא חוזר על השם. */
function pdThumbArt(it, cat){
  const ph = pdPlaceholder(it, cat, false);
  return it.image
    ? ph + `<img src="${pdEsc(it.image)}" alt="${pdEsc(itemName(it))}" loading="lazy" ${PD_IMG_HOOKS}>`
    : ph;
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
    { key:"overclockable",   label:"תמיכה ב-OC" },
    { key:"threads",               label:"תהליכונים" },
    { key:"cacheMb",               label:"מטמון (MB)" },
    { key:"color",               label:"צבע" },
    { key:"igpuModel",               label:"דגם גרפיקה מובנית" },
    { key:"baseClockGhz",               label:"תדר בסיס (GHz)" },
    { key:"boostClockGhz",               label:"תדר טורבו (GHz)" }
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
    { key:"supportsOverclocking", label:"תמיכה ב-OC" },
    { key:"wifi",               label:"תקן WiFi" },
    { key:"color",               label:"צבע" },
    { key:"lanSpeed",               label:"מהירות רשת קווית" }
  ],

  ram: [
    { key:"ramType",    label:"תקן זיכרון" },
    { key:"capacityGb", label:"נפח כולל (GB)" },
    { key:"sticks",     label:"מספר סטיקים" },
    { key:"speedMhz",   label:"מהירות (MHz)" },
    { key:"cl",         label:"תזמון (CL)" },
    { key:"heightMm",   label:'גובה (מ"מ)' },
    { key:"tier",       label:"דרג" },
    { key:"color",               label:"צבע" },
    { key:"kitLayout",               label:"מבנה הערכה" },
    { key:"rgb",               label:"תאורת RGB" }
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
    { key:"powerConnectors",     label:"מחברי הזנה" },
    { key:"memType",               label:"סוג זיכרון גרפי" },
    { key:"memBusBit",               label:"רוחב פס זיכרון (bit)" },
    { key:"outputs",               label:"יציאות תצוגה" },
    { key:"pcieIface",               label:"ממשק PCIe" },
    { key:"boostClockMhz",               label:"תדר Boost (MHz)" },
    { key:"color",               label:"צבע" }
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
    { key:"tier",                label:"דרג" },
    { key:"fanMm",               label:'גודל מאוורר (מ"מ)' },
    { key:"noiseDb",               label:"רעש מירבי (dBA)" },
    { key:"color",               label:"צבע" }
  ],

  storage: [
    { key:"driveType",  label:"סוג כונן" },
    { key:"capacityGb", label:"נפח (GB)" },
    { key:"formFactor", label:"גודל פיזי" },
    { key:"pcieGen",    label:"דור PCIe" },
    { key:"tier",       label:"דרג" },
    { key:"readMbs",               label:"קריאה (MB/s)" },
    { key:"writeMbs",               label:"כתיבה (MB/s)" },
    { key:"tbw",               label:"עמידות (TBW)" },
    { key:"color",               label:"צבע" }
  ],

  psu: [
    { key:"wattage",    label:"הספק (W)" },
    { key:"formFactor", label:"תקן ספק" },
    { key:"lengthMm",   label:'אורך (מ"מ)' },
    { key:"efficiency", label:"תקן יעילות" },
    { key:"modular",    label:"מודולרי" },
    { key:"connectors", label:"פירוט חיבורים" },
    { key:"tier",       label:"דרג" },
    { key:"fanMm",               label:'גודל מאוורר (מ"מ)' },
    { key:"color",               label:"צבע" },
    { key:"atxVer",               label:"תקן ATX" }
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
    /* נוספו 18.08.2026 יחד עם הרחבת הסכימה ב-11-catalog.gs */
    { key:"sidePanel",               label:"פאנל צדדי" },
    { key:"frontPorts",              label:"יציאות בחזית" },
    { key:"includedFans",            label:"מאווררים מותקנים" },
    { key:"color",                   label:"צבע" },
    { key:"tier",                    label:"דרג" }
  ],


  caseFans: [
    { key:"fans",        label:"כמות מאווררים" },
    { key:"sizeMm",      label:'גודל (מ"מ)' },
    { key:"argb",        label:"תאורת ARGB" },
    { key:"pwm",         label:"בקרת PWM" },
    { key:"hubIncluded", label:"כולל האב" },
    { key:"noiseDb",               label:"רעש מירבי (dBA)" },
    { key:"color",               label:"צבע" }
  ],

  paste: [
    { key:"grams",                  label:"כמות (גרם)" },
    { key:"conductivity",           label:"מוליכות (W/m·K)" },
    { key:"electricallyConductive", label:"מוליך חשמל" },
    { key:"color",               label:"צבע" }
  ],

  wifi: [
    { key:"busType",      label:"סוג חיבור" },
    { key:"netType",      label:"סוג רשת" },
    { key:"wifiStandard", label:"תקן WiFi" },
    { key:"speedMbps",    label:"מהירות (Mbps)" },
    { key:"bluetooth",    label:"Bluetooth" },
    { key:"color",               label:"צבע" }
  ],

  extras: [
    { key:"subType",        label:"סוג אביזר" },
    { key:"argb",           label:"תאורת ARGB" },
    { key:"lengthCm",       label:'אורך (ס"מ)' },
    { key:"compatibleWith", label:"מתאים ל-" },
    { key:"color",               label:"צבע" }
  ],

  readyPc: [
    { key:"useCase",        label:"ייעוד" },
    { key:"cpuName",        label:"מעבד" },
    { key:"gpuName",        label:"כרטיס מסך" },
    { key:"ramGb",          label:"זיכרון (GB)" },
    { key:"storageGb",      label:"אחסון (GB)" },
    { key:"storageType",    label:"סוג אחסון" },
    { key:"moboChipset",    label:"ערכת שבבים" },
    { key:"psuWatts",       label:"ספק כוח (W)" },
    { key:"ramType",        label:"סוג זיכרון" },
    { key:"os",             label:"מערכת הפעלה" },
    { key:"warrantyMonths", label:"אחריות (חודשים)" },
    { key:"color",               label:"צבע" }
  ],

  laptop: [
    { key:"useCase",        label:"ייעוד" },
    { key:"cpuName",        label:"מעבד" },
    { key:"gpuName",        label:"כרטיס מסך" },
    { key:"ramGb",          label:"זיכרון (GB)" },
    { key:"storageGb",      label:"אחסון (GB)" },
    { key:"sizeInch",       label:"גודל מסך (אינץ')" },
    { key:"resolution",     label:"רזולוציה" },
    { key:"refreshHz",      label:"רענון (Hz)" },
    { key:"weightKg",       label:'משקל (ק"ג)' },
    { key:"os",             label:"מערכת הפעלה" },
    { key:"warrantyMonths", label:"אחריות (חודשים)" },
    { key:"color",               label:"צבע" }
  ],

  peripherals: [
    { key:"subType",    label:"סוג מוצר" },
    { key:"connection", label:"חיבור" },
    { key:"rgb",        label:"תאורת RGB" },
    { key:"dpi",        label:"DPI (עכבר)" },
    { key:"switchType", label:"מתגים (מקלדת)" },
    { key:"sizeInch",   label:"גודל מסך (אינץ')" },
    { key:"refreshHz",  label:"רענון (Hz)" },
    { key:"resolution", label:"רזולוציה" },
    { key:"panel",      label:"סוג פאנל" },
    { key:"responseMs",               label:"זמן תגובה (ms)" },
    { key:"curved",               label:"מסך קעור" },
    { key:"vesaMm",               label:'תושבת VESA (מ"מ)' },
    { key:"hdr",               label:"תקן HDR" },
    { key:"driverMm",               label:'גודל דרייבר (מ"מ)' },
    { key:"anc",               label:"ביטול רעשים אקטיבי" },
    { key:"micType",               label:"סוג מיקרופון" },
    { key:"batteryHours",               label:"שעות סוללה" },
    { key:"weightG",               label:"משקל (גרם)" },
    { key:"color",               label:"צבע" },
    { key:"ports",               label:"יציאות" }
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
/* ==================== מקטע המפרט ====================
   🔴 **תוקן 23.08.** דביר: "יש מוצרים כמו פנל שערות 19 1U — שצריך
   לבדוק אם יש מה לכתוב במפרט. אם אין, לא צריך להיות מפרט / צריך
   להיות משהו במקום, כי הוא ריק וזה לא נראה טוב."

   נמדד על הקטלוג החי: **116 מוצרים מתוך 1,229** בלי אף שדה מפרט,
   ‏**103 מהם באביזרים** — שם יושבים פנלים, מסילות, ברגים וכבלים.

   מה שהיה: כותרת "מפרט טכני" ומתחתיה שורת התנצלות "המפרט עדיין לא
   הוזן". ⚠️ זה גרוע משתי בחינות — הוא **מכריז על חוסר** במקום
   הבולט ביותר בדף, והוא **לא נכון** לגבי פנל אטימה 1U: אין לו מפרט
   טכני, וזה לא פער בנתונים אלא טבע המוצר.

   מה שיש עכשיו, בשלוש מדרגות:
     1. יש שדות מפרט         → טבלה, כמו קודם.
     2. אין מפרט אבל יש עובדות (יצרן / אחריות / מה מתאים לו)
                             → כותרת "פרטי המוצר" והעובדות שיש.
     3. אין כלום             → **המקטע לא נוצר בכלל.**

   ⚠️ מדרגה 3 היא העיקר: מקטע שלא קיים לא נראה כמו תקלה, ומקטע ריק כן.

   ⚠️ **זה תיקון תצוגה ולא תחליף לנתונים.** רוב 103 האביזרים כן
   יקבלו מפרט מ-`mlParseSpecs_` (22-supplier-specs.gs) שמושך את כל
   רשימת המפרט מעמוד הספק. מה שיישאר ריק אחרי זה — ריק בצדק. */
function pdSpecSectionHtml(it, specRows){
  if(specRows.length){
    return `
      <section class="pd-section">
        <h2>${tr("מפרט טכני","Technical specifications")}</h2>
        <table class="pd-spec">
          <tbody>
            ${specRows.map(r => `<tr><th>${pdEsc(r.label)}</th><td>${pdEsc(r.value)}</td></tr>`).join("")}
          </tbody>
        </table>
        <p class="pd-spec-note">${tr("המפרט נמסר על ידי היצרן ועשוי להשתנות בין מהדורות. בכל שאלה — דברו איתנו לפני ההזמנה.",
                                     "Specifications are supplied by the manufacturer and may vary between revisions. In doubt — talk to us before ordering.")}</p>
      </section>`;
  }

  /* עובדות שקיימות כמעט תמיד, ואינן "מפרט טכני". ⚠️ רק שדות שבאמת
     יש בהם ערך — שורה ריקה כאן מחזירה בדיוק את הבעיה שתוקנה. */
  const facts = [];
  if(it.brand)          facts.push([tr("יצרן","Brand"), it.brand]);
  if(it.mfrSku)         facts.push([tr('מק"ט יצרן',"Manufacturer SKU"), it.mfrSku]);
  if(it.compatibleWith) facts.push([tr("מתאים ל-","Fits"), it.compatibleWith]);
  if(it.warranty)       facts.push([tr("אחריות","Warranty"), it.warranty]);

  if(!facts.length) return "";          // ⚠️ מדרגה 3 — בלי מקטע כלל

  return `
      <section class="pd-section">
        <h2>${tr("פרטי המוצר","Product details")}</h2>
        <table class="pd-spec">
          <tbody>
            ${facts.map(f => `<tr><th>${pdEsc(f[0])}</th><td>${pdEsc(f[1])}</td></tr>`).join("")}
          </tbody>
        </table>
        <p class="pd-spec-note">${tr("צריך פרט טכני שלא מופיע כאן? דברו איתנו ונבדוק מול היצרן.",
                                     "Need a technical detail that isn't listed? Talk to us and we'll check with the manufacturer.")}</p>
      </section>`;
}

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

/* ==================== אחריות ====================
   עמודת warranty בגיליון היא טקסט חופשי כפי שהספק מנסח אותו ("אחריות
   במעבדת מור לוי" · "אחריות יבואן"), ולא מספר חודשים — ולכן היא מוצגת
   כמו שהיא ולא מפורקת ליחידות. warrantyMonths, שקיים במחשבים ומחשבים
   ניידים, נשאר שדה נפרד בטבלת המפרט.

   ⚠️ מוצג רק כשיש ערך. מוצר בלי אחריות בגיליון לא מקבל שורה ריקה ולא
   "לא ידוע" — הצהרה על אחריות היא התחייבות מול לקוח, וניחוש כאן גרוע
   בהרבה משתיקה.

   ⚠️ אין תרגום לאנגלית: הטקסט מגיע בעברית מהספק, ותרגום מכונה של תנאי
   אחריות הוא בדיוק הסוג של דיוק שאסור להמציא. */
/* גם מספר מתקבל: מי שיקליד "36" בעמודה התכוון לכתוב משהו, ולבלוע
   ערך שהוקלד ביד גרוע מלהציג אותו. אובייקט (תא שעוצב כתאריך) נדחה —
   הוא היה מודפס כ-[object Object]. */
function pdWarrantyText(it){
  const raw = it && it.warranty;
  if(typeof raw === "string")  return raw.trim();
  if(typeof raw === "number")  return String(raw);
  return "";
}

function pdWarrantyHtml(it){
  const txt = pdWarrantyText(it);
  if(!txt) return "";
  return `<div class="pd-warranty">
      <svg class="ui-ic"><use href="#ui-shield"/></svg>
      <span>${pdEsc(txt)}</span>
    </div>`;
}

/* השורה הקבועה שמתחת למחיר. ⚠️ כשיש למוצר טקסט אחריות משלו מהספק,
   "כולל אחריות יבואן רשמי" יורד ממנה: שתי אמירות אחריות זו ליד זו,
   אחת גנרית ואחת ספציפית, סותרות זו את זו כשהספציפית אומרת משהו אחר
   ("אחריות במעבדת מור לוי" איננה אחריות יבואן). מה שנשאר הוא התשלומים,
   שנכון תמיד. */
/* ⚠️ (עודכן 25.08) המדיניות החדשה: 1-2 תשלומים חינם, מ-3 עם עמלה
   מוצגת מראש. "3 תשלומים ללא עמלה" הפך לא-נכון ולכן ירד; מובילים
   עם הפריסה עצמה, והעמלה מוצגת בקופה לצד כל אפשרות. */
function pdPriceNote(it){
  const spread = tr("פריסה עד 12 תשלומים", "Up to 12 installments");
  return pdWarrantyText(it)
    ? spread
    : tr("אחריות יבואן רשמי", "Official importer warranty") + " · " + spread;
}

function pdStockHtml(it){
  /* מצבי אמצע (לקסיקון דביר 18.08.2026): "זמינות מוגבלת" נקנה רגיל עם
     תג כתום שמזרז; "ליצור קשר" מציג פנייה במקום קנייה (ראה הכפתור). */
  const state = (typeof dvtStockState === "function") ? dvtStockState(it) : (pdInStock(it) ? "in" : "oos");
  if(state === "low"){
    return `<div class="pd-stock pd-stock--low">${tr("זמינות מוגבלת — כדאי להזדרז","Limited stock — order soon")}</div>`;
  }
  if(state === "ask"){
    return `<div class="pd-stock pd-stock--ask">${tr("לבדיקת זמינות — דברו איתי ואחזור אליכם מהר","Availability on request — message me")}</div>`;
  }
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
    <a href="home.html">${tr("ראשי","Home")}</a>
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

  /* ⚠️ אחרי כתיבת ה-HTML, אחרת האלמנטים עוד לא קיימים. */
  const pdRenderDone = () => { try{ pdZoomInit(); }catch(e){} };
  document.getElementById("pdBody").innerHTML = `
    <div class="pd-main">
      <div class="pd-media">
        <!-- ⚠️ העדשה **בתוך** המסגרת ולא לצידה. כשהיא הייתה אחות,
             position:absolute נמדד יחסית ל-.pd-media (sticky) בזמן
             שהקואורדינטות חושבו יחסית למסגרת — היסט קבוע. -->
        <div class="pd-art pd-art-frame" id="pdArtFrame"
             data-zoom="${it.image ? pdEsc(it.image) : ""}">${pdArt(it, PD_CAT)}<div
             class="pd-zoom-lens" id="pdZoomLens" aria-hidden="true"></div></div>
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
        <!-- מק"ט גלוי ללקוח. עד עכשיו הוא נשלח רק ל-JSON-LD של גוגל
             (data.sku) — כלומר מנועי החיפוש ראו אותו והלקוח לא.
             הוא מה שמאפשר ללקוח לצטט מוצר מדויק בוואטסאפ או בטלפון. -->
        <p class="pd-sku">\u05de\u05e7"\u05d8: <span>${pdEsc(String(it.id || ""))}</span></p>

        <div class="pd-price-box">
          <div class="pd-price-row">
            <span class="pd-price">${pdNis(it.price)}</span>
            ${onSale ? `<span class="pd-price-was">${pdNis(dvtOldPrice(it))}</span>
                        <span class="pd-save">-${dvtDiscountPct(it)}%</span>` : ""}
          </div>
          <div class="pd-price-note">${pdPriceNote(it)}</div>
          ${pdStockHtml(it)}
          ${pdWarrantyHtml(it)}
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
          ${(typeof dvtStockState === "function" && dvtStockState(it) === "ask")
            ? `<a class="btn btn-primary pd-add" target="_blank" rel="noopener"
                 href="https://wa.me/972502000373?text=${encodeURIComponent(tr("היי דביר, רציתי לבדוק זמינות של: ","Hi Dvir, checking availability of: ") + itemName(it).slice(0, 60))}">${tr("בדקו זמינות איתי בוואטסאפ","Check availability with me")}</a>`
            : canBuy
            ? `<button class="btn btn-primary pd-add" onclick="pdAddToCart()">${t("addToCartBtn")}</button>`
            : `<button class="btn btn-primary pd-add" disabled>${tr("אזל המלאי","Out of stock")}</button>`}
        </div>

        ${pdShareHtml()}

        <ul class="pd-perks">
          <li><svg class="ui-ic"><use href="#ui-truck"/></svg>${(typeof dvtText === "function"
            ? tr("משלוח ", "Delivery in ") + dvtText("shipping.standardDays")
            : tr("משלוח 3-7 ימי עסקים","Delivery in 3-7 business days"))}</li>
          <li><svg class="ui-ic"><use href="#ui-shield"/></svg>${tr("אחריות מלאה על כל רכיב","Full warranty on every part")}</li>
          <!-- ⚠️ **היה "הרכבה והתקנה בתוספת תשלום" — הפוך מהאמת.**
               הרכבת מחשב שלם שנקנה כאן היא **ללא עלות** ונוספת
               אוטומטית (assembly-included ב-0 ₪). מה שכן בתשלום זה
               התקנת Windows והתוכנות, והן מפורטות ב-pdServicesHtml. -->
          <li><svg class="ui-ic"><use href="#ui-tools"/></svg>${tr("הרכבה ללא עלות במחשב שלם","Free assembly on a complete PC")}</li>
          <li><svg class="ui-ic"><use href="#ui-chat"/></svg>${tr("שאלה על המוצר?","Questions about this product?")}
            <a class="pd-wa" href="${pdWhatsappHref(it)}" target="_blank" rel="noopener"
               >${tr("דברו איתנו","Talk to us")}</a></li>
        </ul>

        <!-- ⚠️ פס אמון. ארבע העובדות שלקוח מחפש רגע לפני שהוא לוחץ
             "הוסף לסל", ושעד עכשיו היו קבורות בתקנון בלבד. הן אינן
             הבטחות חדשות — כל אחת מהן כבר נכונה במערכת:
               · התאמת מחיר ........... מדיניות מוצהרת (25.08)
               · איסוף עצמי ללא עלות .. תקנון §5.3
               · ביטול 14 יום ......... תקנון §8, חובה בדין
               · סליקה חיצונית ........ תקנון §4, PCI-DSS
             ⚠️ אין להוסיף כאן שורה שאין לה כיסוי במערכת ובתקנון. -->
        <ul class="pd-perks pd-perks-trust">
          <!-- 🔴 התאמת מחיר (דביר, 25.08): "מצאת זול יותר בישראל? שלח
               לינק ונשווה" — מסיר את החשש שמפיל עגלות, ועולה כמעט
               כלום כי רוב הלקוחות לא טורחים לבדוק. ההשוואה אינה
               התחייבות אוטומטית — דביר עונה אישית על כל פנייה. -->
          <li><svg class="ui-ic"><use href="#ui-spark"/></svg><b>${
            tr("מצאת זול יותר בישראל?","Found it cheaper in Israel?")}</b> <a class="pd-wa" href="${pdWhatsappHref(it)}" target="_blank" rel="noopener">${
            tr("שלח לינק ונשווה","Send the link — we'll match")}</a></li>
          <li><svg class="ui-ic"><use href="#ui-box"/></svg>${
            tr("איסוף עצמי ללא עלות מ","Free pickup from ") + (typeof dvtText === "function"
              ? dvtText("shipping.pickupPlace") : tr("אבן שמואל","Even Shmuel"))} ${
            tr("· בתיאום מראש","· by prior arrangement")}</li>
          <li><svg class="ui-ic"><use href="#ui-check"/></svg>${
            tr("ביטול עסקה עד 14 יום","Cancel within 14 days")} — <a href="terms.html#s8">${
            tr("בהתאם לחוק","as provided by law")}</a></li>
          <!-- ⚠️ **נוסח 23.08.** קודם היה כתוב "פרטי האשראי לא עוברים
               דרך האתר", ודביר שאל "מה זאת אומרת?". העובדה עצמה נכונה
               ומדויקת — beginredirect ב-4-payment-api.gs מעביר את
               הלקוח לדף של חברת הסליקה, והמספר מוקלד שם ולא כאן —
               אבל **הניסוח תיאר מנגנון פנימי במקום להרגיע**. אם בעל
               העסק לא הבין אותו, לקוח בוודאי לא.
               ⚠️ **ונוסח שוב 23.08 אחרי הערה שנייה של דביר:** "אנחנו
               לא רואים ולא שומרים" נכון לגבינו, אבל דביר צדק שהוא
               נשמע כאילו **אף אחד** לא שומר — ו-SUMIT כן שומרת.
               אמירה שנשמעת רחבה מהאמת בענייני אשראי היא בדיוק מה
               שאסור. הנוסח עכשיו זהה במשמעותו לתקנון §10.3: הפרטים
               נמסרים **לחברת הסליקה** ולא מגיעים אלינו. -->
          <li><svg class="ui-ic"><use href="#ui-lock"/></svg>${
            tr("התשלום מתבצע בדף המאובטח של חברת הסליקה","Payment happens on the clearing company's secure page")} — ${
            tr("פרטי הכרטיס נמסרים לה ישירות ולא מגיעים אלינו","card details go straight to them and never reach us")}</li>
        </ul>
      </div>
    </div>

    <div class="pd-sections">
      <section class="pd-section">
        <h2>${tr("תיאור","Description")}</h2>
        <p class="pd-desc">${pdEsc(pdDescription(it, catName))}</p>
      </section>

      ${pdSpecSectionHtml(it, specRows)}

      ${pdServicesHtml(PD_CAT)}
    </div>`;

  // ⚠️ הטמפלייט נבנה מחדש בכל רינדור (החלפת שפה / רענון קטלוג ברקע),
  // ולכן הכמות והסה"כ חייבים להיכתב אחריו ולא להישאר על 1 של ה-HTML.
  pdRenderTotal();
  /* ⚠️ אותה סיבה בדיוק: העדשה נקשרת לאלמנטים שנוצרו זה עתה, ולכן
     חייבת להיקרא **אחרי** כתיבת ה-HTML ובכל רינדור מחדש. */
  pdRenderDone();
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

/* =====================================================================
   SEO — שהמוצר יימצא בגוגל, עם קישור ישר לדף שלו
   =====================================================================
   דף המוצר נבנה כולו ב-JS מ-getCatalog, ולכן ה-HTML שיוצא מהשרת זהה
   לכל 1,271 המוצרים: אותה כותרת ("DvirTech — מוצר") ובלי שום תיאור.
   שלושת הדברים כאן נותנים לגוגל את מה שהוא צריך כדי להציג את המוצר
   הנכון עם המחיר והזמינות שלו:
     · <title> ו-<meta name="description"> לפי המוצר עצמו
     · <link rel="canonical"> לכתובת אחת מוסכמת
     · JSON-LD מסוג Product עם offers

   ⚠️ **מוצר שאזל מקבל availability=OutOfStock ולא נעלם.** גוגל מסמן
   אותו כאזל ומדרג אותו נמוך יותר מעצמו, ומרצ'נט סנטר מוציא אותו
   מהקניות — בלי שאף אחד יצטרך להסתיר את הדף. הסתרת הדף לעומת זאת
   מוחקת את כל הדירוג שהוא צבר, ומחזירה אותו לאפס ביום שהוא חוזר
   למלאי. זו אותה החלטה בדיוק כמו בחנות: מוצר שאזל נשאר מוצג עם תג.

   ⚠️ שדה שאין בקטלוג פשוט לא נכתב. אין כאן ניחוש של יצרן, של מק"ט
   יצרן, של דירוג או של מצב המוצר — "לוח משופץ" בקטלוג היה הופך כל
   הצהרת itemCondition גורפת לשקר. */

/* קנוניקל = **קטגוריית המקור** ולא הווירטואלית. לאותו מסך יש שתי
   כתובות תקינות (?cat=monitor ו-?cat=peripherals), וזה תוכן כפול
   בעיני גוגל. הקנוניקל מאחד אותן לאחת ומרכז אליה את הדירוג. */
function pdCanonicalUrl(){
  if(!/^https?:$/.test(location.protocol)) return "";      // file:// — אין כתובת אמיתית
  return location.origin + location.pathname +
    "?cat=" + encodeURIComponent(PD_CAT) + "&id=" + encodeURIComponent(PD_ITEM.id);
}

function pdHeadTag_(selector, make){
  let el = document.head.querySelector(selector);
  if(!el){ el = make(); document.head.appendChild(el); }
  return el;
}

function pdSetMeta_(name, content){
  const el = pdHeadTag_(`meta[name="${name}"]`, () => {
    const m = document.createElement("meta");
    m.setAttribute("name", name);
    return m;
  });
  el.setAttribute("content", content);
}

/* תיאור המטא נגזר מאותו טקסט שמוצג בדף עצמו — תיאור שלא מופיע בעמוד
   הוא בדיוק מה שגוגל מתעלם ממנו. נחתך על גבול מילה סביב 155 תווים,
   האורך שגוגל מציג בפועל. */
function pdMetaDescription(text){
  const s = String(text || "").replace(/\s+/g, " ").trim();
  if(s.length <= 155) return s;
  const cut = s.slice(0, 155);
  const sp = cut.lastIndexOf(" ");
  return (sp > 80 ? cut.slice(0, sp) : cut).trim() + "…";
}

/* ⚠️ הבריחה היחידה שחשובה בתוך <script type="application/ld+json">:
   התוכן שם אינו HTML, אבל הדפדפן עדיין מחפש בו את המחרוזת "</script".
   שם מוצר עם < או & (ובקטלוג יש שמות כאלה) היה קוטע את התג ושובר את
   כל ה-JSON. JSON.stringify כבר מטפל בגרשיים ובשורות חדשות. */
function pdJsonLdText_(obj){
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

function pdBuildJsonLd(it, catName, description){
  const url = pdCanonicalUrl();
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: itemName(it),
    description: description
  };
  if(catName) data.category = catName;
  if(it.id) data.sku = String(it.id);
  if(it.brand) data.brand = { "@type": "Brand", name: String(it.brand) };
  // רק כתובת תמונה אמיתית. נתיב יחסי או ערך זבל גרוע מלא לשלוח כלום.
  if(it.image && /^https?:\/\//i.test(String(it.image))) data.image = String(it.image);

  const price = Number(it.price);
  if(price > 0){
    const offer = {
      "@type": "Offer",
      price: String(price),
      priceCurrency: "ILS",
      availability: pdInStock(it) ? "https://schema.org/InStock"
                                  : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "DvirTech" }
    };
    if(url) offer.url = url;
    data.offers = offer;
  }
  return data;
}

/* ⚠️ עטוף כולו: תקלה בבניית ה-SEO לא אמורה להשאיר את הלקוח בלי דף
   מוצר. זה מטא-דאטה לרובוטים, לא תוכן. */
function pdSeo(){
  try{
    const it = PD_ITEM;
    if(!it) return;
    const catName = dvtCatLabel(PD_VIEW_CAT, PD_CATALOG ? PD_CATALOG[PD_VIEW_CAT] : null);
    const description = pdDescription(it, catName);

    document.title = itemName(it) + " — DvirTech";
    pdSetMeta_("description", pdMetaDescription(description));

    const url = pdCanonicalUrl();
    if(url){
      pdHeadTag_('link[rel="canonical"]', () => {
        const l = document.createElement("link");
        l.setAttribute("rel", "canonical");
        return l;
      }).setAttribute("href", url);
    }

    const tag = pdHeadTag_('script[type="application/ld+json"]', () => {
      const s = document.createElement("script");
      s.setAttribute("type", "application/ld+json");
      return s;
    });
    tag.textContent = pdJsonLdText_(pdBuildJsonLd(it, catName, description));
  }catch(e){
    console.error("[product] seo failed:", e);
  }
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
  return (g.items || []).filter(x => dvtIsSellable(x, cat)).map(x => Object.assign({ _realCat: cat }, x));
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
    // ראשון: גם אם הרינדור החזותי ייפול, לגוגל כבר יש את הנתונים הנכונים
    pdSeo();
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
  // ה-<title> נקבע ב-pdSeo יחד עם שאר המטא-דאטה, כדי שיהיה מקום אחד
  // שקובע מה גוגל רואה — והוא רץ גם במעבר שפה וגם ברענון הקטלוג.

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


/* ==================== שיתוף מוצר ====================
   ⚠️ שיתוף בין הלקוח לחברים שלו — **לא** אלינו. לכן קישור הוואטסאפ כאן
   הוא wa.me בלי מספר טלפון: זה פותח את בורר אנשי הקשר של הלקוח ומאפשר
   לו לבחור למי לשלוח. (הכפתור "דברו איתנו" שבהמשך הדף כן מכיל את המספר
   שלנו — שני דברים שונים, לא לבלבל ביניהם.)

   ⚠️ המחיר לא נכנס לטקסט המשותף בכוונה. הודעת וואטסאפ חיה לנצח, ומחיר
   שהשתנה מאז השיתוף הופך אותה להצגת מחיר שגוי. השם והקישור בלבד —
   הקישור תמיד מציג את המחיר הנוכחי.

   הקישור נבנה מחדש ולא נלקח מ-location.href, כדי לא לגרור פרמטרים
   זמניים (utm, חיפוש, עוגן) לתוך מה שהלקוח משתף. */

function pdShareUrl(){
  const it = PD_ITEM;
  if(!it) return location.href;
  // PD_CAT (הקטגוריה האמיתית) ולא PD_VIEW_CAT — קישור קנוני אחד למוצר.
  return location.origin + location.pathname +
         "?cat=" + encodeURIComponent(PD_CAT) +
         "&id="  + encodeURIComponent(it.id);
}

function pdShareTitle(){
  return PD_ITEM ? itemName(PD_ITEM) : "DvirTech";
}

/* הטקסט שנשלח לוואטסאפ/טלגרם/מייל. שורה ראשונה שם המוצר, שורה שנייה
   הקישור — כך זה נראה בהודעה, ורוב האפליקציות יפיקו תצוגה מקדימה. */
function pdShareText(){
  return pdShareTitle() + "\n" + pdShareUrl();
}

function pdShareHtml(){
  const u = encodeURIComponent(pdShareUrl());
  const t = encodeURIComponent(pdShareTitle());
  const full = encodeURIComponent(pdShareText());
  const canNative = typeof navigator !== "undefined" && !!navigator.share;

  const item = (href, icon, label) =>
    `<a class="pd-share-item" role="menuitem" href="${href}" target="_blank" rel="noopener noreferrer">
       <svg class="ui-ic" aria-hidden="true"><use href="#${icon}"/></svg><span>${label}</span></a>`;

  return `
    <div class="pd-share" id="pdShare">
      <button type="button" class="pd-share-btn" id="pdShareBtn"
              aria-haspopup="menu" aria-expanded="false" aria-controls="pdShareMenu"
              aria-label="${tr("שתף את המוצר","Share this product")}"
              onclick="pdShareToggle(event)">
        <svg class="ui-ic" aria-hidden="true"><use href="#ui-share"/></svg>
        <span>${tr("שתף","Share")}</span>
      </button>

      <div class="pd-share-menu" id="pdShareMenu" role="menu" hidden
           aria-label="${tr("שיתוף המוצר","Share this product")}">
        <p class="pd-share-head">${tr("שיתוף המוצר","Share this product")}</p>

        ${item("https://wa.me/?text=" + full, "ui-wa", tr("וואטסאפ","WhatsApp"))}
        ${item("https://www.facebook.com/sharer/sharer.php?u=" + u, "ui-fb", tr("פייסבוק","Facebook"))}
        ${item("https://t.me/share/url?url=" + u + "&text=" + t, "ui-tg", tr("טלגרם","Telegram"))}
        ${item("mailto:?subject=" + t + "&body=" + full, "ui-mail", tr("אימייל","Email"))}

        <button type="button" class="pd-share-item" role="menuitem" onclick="pdShareCopy(this)">
          <svg class="ui-ic" aria-hidden="true"><use href="#ui-link"/></svg><span>${tr("העתקת קישור","Copy link")}</span>
        </button>

        ${canNative ? `
        <button type="button" class="pd-share-item" role="menuitem" onclick="pdShareNative()">
          <svg class="ui-ic" aria-hidden="true"><use href="#ui-dots"/></svg><span>${tr("עוד אפשרויות…","More options…")}</span>
        </button>` : ""}
      </div>
    </div>`;
}

function pdShareToggle(ev){
  if(ev) ev.stopPropagation();
  const menu = document.getElementById("pdShareMenu");
  const btn  = document.getElementById("pdShareBtn");
  if(!menu || !btn) return;
  const open = menu.hasAttribute("hidden");
  if(open){ menu.removeAttribute("hidden"); } else { menu.setAttribute("hidden",""); }
  btn.setAttribute("aria-expanded", open ? "true" : "false");
}

function pdShareClose(){
  const menu = document.getElementById("pdShareMenu");
  const btn  = document.getElementById("pdShareBtn");
  if(menu) menu.setAttribute("hidden","");
  if(btn)  btn.setAttribute("aria-expanded","false");
}

/* בורר השיתוף של מערכת ההפעלה (בעיקר בנייד): נותן ללקוח כל אפליקציה
   שמותקנת אצלו, לא רק את הארבע שרשומות למעלה. נפילה בשיתוף היא בדרך
   כלל AbortError — הלקוח פשוט סגר את החלון, וזו לא שגיאה להציג. */
function pdShareNative(){
  if(!navigator.share) return;
  navigator.share({ title: pdShareTitle(), text: pdShareTitle(), url: pdShareUrl() })
    .then(pdShareClose)
    .catch(err => { if(err && err.name !== "AbortError") console.warn("[share]", err); });
}

function pdShareCopy(btn){
  const url = pdShareUrl();
  const done = ok => {
    if(!btn) return;
    const span = btn.querySelector("span");
    const use  = btn.querySelector("use");
    const was  = span ? span.textContent : "";
    if(span) span.textContent = ok ? tr("הקישור הועתק","Link copied") : tr("ההעתקה נכשלה","Copy failed");
    if(use && ok) use.setAttribute("href", "#ui-check");
    btn.classList.add(ok ? "is-ok" : "is-bad");
    setTimeout(() => {
      if(span) span.textContent = was;
      if(use) use.setAttribute("href", "#ui-link");
      btn.classList.remove("is-ok","is-bad");
      pdShareClose();
    }, 1500);
  };

  // clipboard API קיים רק בהקשר מאובטח (https). ב-http או בדפדפן ישן
  // נופלים למסלול ה-textarea, שעדיין עובד כמעט בכל מקום.
  if(navigator.clipboard && window.isSecureContext){
    navigator.clipboard.writeText(url).then(() => done(true), () => pdShareCopyFallback(url, done));
  } else {
    pdShareCopyFallback(url, done);
  }
}

function pdShareCopyFallback(url, done){
  try{
    const ta = document.createElement("textarea");
    ta.value = url;
    ta.setAttribute("readonly","");
    ta.style.cssText = "position:fixed;top:-999px;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    done(!!ok);
  }catch(e){ done(false); }
}

/* סגירה בלחיצה בחוץ / Escape. מאזין אחד ברמת המסמך — התפריט נבנה מחדש
   בכל רינדור, אז אסור לתלות מאזין על האלמנט עצמו. */
document.addEventListener("click", function(e){
  const wrap = document.getElementById("pdShare");
  const menu = document.getElementById("pdShareMenu");
  if(!wrap || !menu || menu.hasAttribute("hidden")) return;
  if(!wrap.contains(e.target)) pdShareClose();
});
document.addEventListener("keydown", function(e){
  if(e.key === "Escape") pdShareClose();
});

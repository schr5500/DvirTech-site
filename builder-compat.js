/* =====================================================================
   DvirTech — מנוע התאמה לבונה המחשבים (builder-compat.js)
   =====================================================================
   מחליף את ה"תאימות" שהייתה בעיצוב החדש — שם היא הייתה קוסמטית בלבד:
   לכל מוצר היה שדה note קבוע בקוד, ואם היה בו טקסט הוצג "יש הערת
   תאימות". זה בדיוק מה שגרם למקרה של רדיאטור 240 שנצבע כבעייתי בזמן
   ש-360 (הגדול יותר!) לא נבדק כלל.

   כאן הכל *מחושב* מהמפרט של הרכיבים שנבחרו בפועל, ומתעדכן בכל שינוי.

   ---------------------------------------------------------------------
   מבנה: טבלת חוקים דקלרטיבית (DVT_RULES), לא שרשרת if-ים.
   ---------------------------------------------------------------------
   כל חוק מצהיר על:
     cats  — אילו קטגוריות חייבות להיבחר כדי שהחוק בכלל יופעל
     when  — האם החוק בכלל רלוונטי לבחירה הזו (אופציונלי)
     needs — אילו שדות מפרט הוא קורא ("mobo.ramSlots")
     wants — שדות שמשפרים דיוק אבל לא חוסמים
     on    — תחת איזו קטגוריה הממצא מוצג בממשק
     level — error חוסם / warn מתריע / info מסביר
     run   — מחזיר טקסט אם יש בעיה, או null

   ⚠️ when נבדק *לפני* needs, וזה לא ניואנס: בלי זה גוף קירור אווירי
   היה מדווח ש"חסרה עמודת radiatorMm" — עמודה שאין לה שום משמעות
   עבורו. דוח עמודות שמבקש שדות מיותרים גורם לעבודה מיותרת בגיליון,
   ולכן חוק שלא רלוונטי לא מבקש כלום.

   שלוש סיבות למבנה הזה במקום if-ים:
   1. **סינון.** אותה טבלה מריצה גם את dvtRateOption — "מה יישבר אם
      אבחר דווקא את המוצר הזה" — ולכן כל חוק חדש משפר אוטומטית גם את
      הרשימה בבורר, בלי קוד נוסף.
   2. **דוח עמודות.** dvtRequiredColumns() נגזר מ-needs, כך שהתיעוד של
      מה שהגיליון צריך לא יכול להתיישן ביחס לקוד.
   3. **שלמות.** אפשר לראות בעין אילו צמדי קטגוריות מכוסים ואילו לא.

   ⚠️ עיקרון מנחה שלא משתנה: שדה חסר ≠ שגיאה. אם לגיליון עדיין אין את
   העמודה, החוק מדלג (ומדווח ב-missingFields כדי שנדע מה להוסיף).
   מנוע שממציא נתונים גרוע ממנוע ששותק.
===================================================================== */

const DVT_LEVEL_RANK = { info: 0, warn: 1, error: 2 };

const DVT_CAT_LABELS = {
  cpu:"מעבד", mobo:"לוח אם", ram:"זיכרון", storage:"אחסון", gpu:"כרטיס מסך",
  psu:"ספק כוח", case:"מארז", cooling:"קירור למעבד", caseFans:"מאווררי מארז",
  paste:"משחה תרמית", wifi:"רשת", extras:"אביזרים"
};

/* ---------------------------------------------------------------
   1. קריאת ערכים מהמפרט
   ---------------------------------------------------------------
   ⚠️ הגיליון והנתונים לדוגמה לא תמיד קוראים לשדה באותו שם (watt מול
   wattage, t מול tier). הכינויים מרוכזים כאן במקום אחד, כדי שהחוקים
   עצמם יקראו שם אחד קנוני ולא יתמלאו ב-?? כפולים. */
const DVT_FIELD_ALIASES = {
  /* 🔴 שלושת הכינויים הבאים נוספו 19.08 אחרי סריקה שמצאה
     ש-11 חוקי תאימות מתים. ארבעה מהם לא היו חסרי נתונים — הנתון
     היה שם כל הזמן תחת שם אחר, והחוק חיפש מפתח שלא קיים.

     ⚠️ החמור מביניהם: `cpu-cooling-socket` — החוק שחוסם
     קירור שלא מתאים לתושבת המעבד. הוא לא נורה אף פעם.

     ⚠️ וזו גם הסיבה שחבילת הבדיקות עברה 14,986 צירופים בלי
     אף שגיאה: חוק שלא יורה אינו יכול ליצור false-positive, והאורקל
     הפייתוני מממש את אותה טעות בדיוק. הסכמה בין שני מימושים
     שגויים אינה נכונות. */
  unlocked:           ["unlocked","overclockable"],
  supportedSockets:   ["supportedSockets","sockets"],
  maxCoolerHeightMm:  ["maxCoolerHeightMm","maxAirCoolerHeightMm"],

  wattage:            ["wattage","watt","watts","powerWatts"],
  tdpWatts:           ["tdpWatts","tdp"],
  recommendedPsuWatts:["recommendedPsuWatts","psuWatts","recommendedPsu"],
  lengthMm:           ["lengthMm","length","lenMm"],
  heightMm:           ["heightMm","height"],
  formFactor:         ["formFactor","form"],
  cpuSockets:         ["cpuSockets","sockets"],
  pcieX16Slots:       ["pcieX16Slots","x16Slots","pcie16"],
  pcieX1Slots:        ["pcieX1Slots","x1Slots"],
  fanMounts:          ["fanMounts","maxFans","fanSlots"],
  fans:               ["fans","fanCount"],
  radiatorMm:         ["radiatorMm","radiator","radSize"],
  capacityGb:         ["capacityGb","capacity","gb"],
  supportedFormFactors:["supportedFormFactors","moboSupport","formFactors"],
  maxRamSpeedMhz:     ["maxRamSpeedMhz","maxRamSpeed","ramSpeedMax"],
  speedMhz:           ["speedMhz","speed","ramSpeed"],
  argb:               ["argb","rgb"],

  /* ⚠️ אלה לא ניחושים — אלה השמות שקיימים *היום* בגיליון. בלי הכינויים
     האלה המנוע היה מדווח "חסרה עמודת maxCoolerHeightMm" בזמן שהנתון
     כבר שם תחת maxAirCoolerHeightMm, והיינו ממלאים עמודה כפולה. */
  maxCoolerHeightMm:  ["maxCoolerHeightMm","maxAirCoolerHeightMm"],
  coolerType:         ["coolerType","type","cool"],
  coolerTdpWatts:     ["coolerTdpWatts","tdpRating","coolerTdp"],
  supportedSockets:   ["supportedSockets","socketSupport","sockets"],
  unlocked:           ["unlocked","overclockable"],
  supportsOc:         ["supportsOc","supportsOverclocking"],
  modules:            ["modules","sticks","dimms"]
};

/* ---------------------------------------------------------------
   שדות נגזרים — מה שאפשר לחשב במקום לבקש שיוקלד
   ---------------------------------------------------------------
   ⚠️ בגיליון יש בספק כוח עמודת connectors בטקסט חופשי, למשל
   "24-pin, 2x8-pin CPU, 1x16-pin (12VHPWR)". אפשר לפרסר אותה ולקבל
   ארבע בדיקות בחינם, במקום לבקש ארבע עמודות מספריות חדשות. */
function dvtPsuConn(psu){
  const raw = dvtGet(psu, "connectors");
  if(raw === undefined) return null;
  const out = { pcie8:0, eps:0, vhpwr:0, sata:0 };
  String(raw).split(/[,;·|]+/).forEach(seg => {
    const s = seg.toLowerCase();
    const m = s.match(/(\d+)\s*[x×*]/);
    const n = m ? Number(m[1]) : 1;
    if(/12vhpwr|12v-?2x6|16\s*-?\s*pin/.test(s))      out.vhpwr += n;
    else if(/\bcpu\b|eps/.test(s))                     out.eps   += n;
    else if(/pcie|pci-e|vga|gpu/.test(s))              out.pcie8 += n;
    else if(/sata/.test(s))                            out.sata  += n;
    /* ⚠️ הגיליון כותב את מחבר ה-12VHPWR גם כ-"1x12V" חשוף — נמדד על
       45 ספקים בקטלוג החי. בלי הענף הזה ספק "3xPCIe8pin,1x12V" נראה
       כאילו אין לו 12VHPWR, ו-RTX 5090 (שדורש מתאם 4×8) היה נחסם
       עליו בטעות. הבדיקה קפדנית — מקטע שכולו "מספר x 12v" — כדי לא
       לתפוס "ATX12V"/"EPS12V" שהם שמות תקן, לא מחברים. */
    else if(/^\s*\d+\s*[x×*]?\s*12v\s*$/.test(s))      out.vhpwr += n;
  });
  return out;
}

/* זיהוי iGPU לפי הדגם שבשם המוצר — לא ניחוש, חוקי הסיומות של היצרנים.
   ---------------------------------------------------------------
   ⚠️ הדרישה המפורשת של דביר: "מעבד 14900K דורש כרטיס מסך" היא שגיאה
   שאסור שתקרה (ל-K יש UHD770). הטבלה בגיליון (hasIgpu) היא מקור האמת
   הראשון; הפונקציה הזו נכנסת רק כשהעמודה ריקה — מעבדים חדשים שנכנסו
   למחירון לפני שטבלת ENRICH_CPU ב-13-enrich-specs.gs הכירה אותם
   (נמדד מול הקטלוג החי: 5 מעבדים כאלה, למשל Ultra 5 250KF Plus).

   החוקים, כפי שדביר ניסח אותם:
   · Intel: סיומת F/KF = בלי iGPU (14900KF, 12400F). בלי F = יש.
   · AMD: סיומת G = iGPU חזק. דורות 7000/8000/9000 = iGPU בסיסי,
     **חוץ** מסיומת F (7500F/8400F/8700F = אין). דורות 5000 ומטה =
     אין, אלא אם G. Threadripper = אין.
   הצהרה מפורשת בשם ("no GPU", "Radeon Graphics", "UHD770") גוברת
   על כל היסק מסיומת. שם שלא מסתדר עם אף חוק → undefined, והעמודה
   מופיעה בדוח החוסרים — לא ממציאים. */
function dvtCpuIgpuFromName(name){
  const n = String(name == null ? "" : name);
  if(!n) return undefined;
  if(/\bno\s*GPU\b|ללא\s*ליבה\s*גרפית|בלי\s*ליבה\s*גרפית/i.test(n)) return false;
  if(/Radeon\s*(?:Graphics|\d{3}M)|Vega\s*\d|UHD\s*\d{3}|Intel\s*Graphics/i.test(n)) return true;
  // Intel — דורש קידומת i3/i5/i7/i9 או Core Ultra כדי לא לתפוס מספרים אקראיים
  let m = n.match(/\b(?:i[3579][\s-]?|Ultra\s*[3579]\s*(?:processors?\s*)?)(\d{3,5})\s*(KS|KF|K|F|T|S)?\b/i);
  if(m) return !/^K?F$/i.test(m[2] || "");
  if(/threadripper/i.test(n)) return false;
  // AMD — "Ryzen 5 9600X" / "R5 5600X" / "Ryzen7 9850X3D"
  m = n.match(/\b(?:Ryzen\s*|R)[3579]?\s*(\d{4})\s*(X3D|XT|GE|G|X|F)?\b/i);
  if(m){
    const suf = (m[2] || "").toUpperCase();
    if(suf === "G" || suf === "GE") return true;
    if(suf === "F") return false;
    return Number(m[1][0]) >= 7;   // 7xxx/8xxx/9xxx = בסיסי · 5xxx ומטה = אין
  }
  return undefined;
}

/* "כולל קירור" — השם גובר על העמודה, בכיוון אחד בלבד.
   ---------------------------------------------------------------
   ⚠️ נמדד מול הקטלוג החי (16.08.2026): 20 מעבדים מסומנים בגיליון
   coolerIncluded=TRUE בעוד שבשמם כתוב במפורש "Tray" / "no fan".
   fixCoolerIncluded() ב-13-enrich-specs.gs מתקן את הגיליון, אבל עד
   שהוא רץ (וגם אחרי — כל ייבוא ספקים חדש יכול להחזיר את הטעות) המנוע
   חייב להגן על עצמו: מעבד כזה שיוצג כ"כולל קירור" ימכור מחשב שלא
   נדלק. הביטוי חייב להישאר זהה לזה שב-13-enrich-specs.gs.
   רק הכיוון "יש→אין" נדרס: שם ששותק לא ממציא קירור שאין. */
const DVT_NO_COOLER_NAME_RE = /\bno\s*fans?\b|\bTray\b|\bno\s*cooler\b/i;
function dvtCoolerIncluded(cpu){
  if(!cpu) return null;
  if(DVT_NO_COOLER_NAME_RE.test(String(cpu.name || ""))) return false;
  return dvtBoolOf(cpu, "coolerIncluded");
}

/* אפשרות "קירור בסיסי שמגיע עם המעבד" — פריט סינתטי שהגשר מזריק
   לרשימת הקירור (builder-bridge.js). כל בדיקת מידות/שקע/TDP חסרת
   משמעות עבורו: הוא מגיע בקופסה של המעבד עצמו ומתאים לו בהגדרה. */
function dvtIsStockCooler(c){
  return !!(c && (c.stockCooler === true || c.id === "stock-cooler"));
}

/* מאווררים שמגיעים מותקנים במארז — נגזר מהשם, כי אין עמודה בגיליון.
   "ANTEC 900 Full Tower 6PWM Fans" · "4x120mm ARGB" · "3 מאווררים".
   שם ששותק מחזיר undefined — הערת מידע ולא חסימה, אז מותר להחמיץ. */
function dvtCaseFansFromName(name){
  const n = String(name == null ? "" : name);
  if(!n) return undefined;
  if(/ללא\s*מאווררים|\bNo\s*Fans?\b/i.test(n)) return 0;
  let m = n.match(/(\d)\s*[x×]\s*\d{2,3}\s*mm/i)
       || n.match(/\b(\d)\s*(?:PWM\s*|A?RGB\s*)*Fans?\b/i)
       || n.match(/(\d)\s*מאווררים/);
  if(!m) return undefined;
  const c = Number(m[1]);
  return (c >= 1 && c <= 9) ? c : undefined;
}

/* גדלי מאוורר של מארז — כולל תיקון שיבוש נתונים אמיתי מהגיליון.
   ---------------------------------------------------------------
   ⚠️ נמדד מול הקטלוג החי: 25 מארזים מחזיקים fanSizesMm=120140 —
   מישהו הקליד "120,140" ו-Google Sheets בלע את הפסיק כמפריד אלפים
   והפך את זה למספר אחד. בלי הפירוק כאן, ערכת 120mm הייתה נחסמת מול
   מארז שתומך גם 120 וגם 140 — false positive על שליש מהקטלוג.
   הפירוק חמדני מול רשימת הגדלים הקיימים בשוק; מה שלא מתפרק חוזר
   להתנהגות הישנה (המחרוזת כמו שהיא). */
function dvtFanSizeList(v){
  const s = String(v == null ? "" : v).trim();
  if(!s) return [];
  if(/^\d+$/.test(s) && s.length > 3){
    /* 🔴 הרשימה חסרה 160, ובגלל זה **מארז נעל את כל קטגוריית
       המאווררים**. נמצא בסריקה על הקטלוג החי: Antec C8 RGB רשום
       "120140160", הפירוק הגיע ל-"160", לא זיהה אותו, נפל לגיבוי
       והחזיר את המספר כולו [120140160]. מאותו רגע שום מאוורר לא
       "מתאים" למארז — 10 מתוך 10 נחסמו והלקוח מצא רשימה ריקה.

       ⚠️ הרשימה חייבת להיות ממוינת מהארוך לקצר: בלי זה "80" היה
       נתפס בתוך "800" ודומיו. נוספו כאן כל מידות המאוורר המקובלות
       ולא רק אלה שבמקרה הופיעו בגיליון — הגיליון גדל, והבאג הזה
       הוא בדיוק מה שקורה כשמופיע ערך חדש.

       ⚠️ הגיבוי גם שופר: אם נותרה שארית לא מזוהה אבל כבר פירקנו
       מידות תקינות, מחזירים אותן במקום לזרוק הכל. */
    const KNOWN = ["220","200","180","160","140","120","92","80","70","60","40"];
    const out = [];
    let rest = s;
    while(rest.length){
      const hit = KNOWN.find(k => rest.indexOf(k) === 0);
      if(!hit) return out.length ? out : dvtArr(s).map(Number).filter(Number.isFinite);
      out.push(Number(hit));
      rest = rest.slice(hit.length);
    }
    return out;
  }
  return dvtArr(v).map(Number).filter(Number.isFinite);
}

const DVT_DERIVED = {
  /* ⚠️ אפס = "לא ידוע", לא "אין". ספק כוח בלי אף מחבר PCIe לא קיים
     במציאות, ובגיליון יש מחרוזות כמו "1x16-pin (12VHPWR) + 2x8-pin"
     שהפרסור לא מפרק לגמרי. עדיף לדלג על הבדיקה מאשר לחסום כרטיס מסך
     תקין בגלל טקסט שנכתב אחרת — ולכן מחזירים undefined והעמודה
     תופיע בדוח כמשהו שכדאי לוודא ידנית. */
  pcieConnectors:      it => { const c = dvtPsuConn(it); return (c && c.pcie8 > 0) ? c.pcie8 : undefined; },
  epsConnectors:       it => { const c = dvtPsuConn(it); return c ? c.eps : undefined; },
  has12vhpwr:          it => { const c = dvtPsuConn(it); return c ? c.vhpwr > 0 : undefined; },
  sataPowerConnectors: it => { const c = dvtPsuConn(it); return (c && c.sata) ? c.sata : undefined; },

  /* עמודה ריקה בגיליון ≠ מנוע עיוור: מה שנגזר בוודאות מהשם משלים את
     החסר. הגיליון, כשמלא, תמיד גובר (dvtGet בודק אותו קודם). */
  hasIgpu:      it => dvtCpuIgpuFromName(it && it.name),
  includedFans: it => dvtCaseFansFromName(it && it.name),
  /* רק הכיוון הבטוח: שם שאומר במפורש Tray/no fan ⇒ אין קירור.
     שם ששותק לא ממלא true — את זה רק הגיליון יודע. */
  coolerIncluded: it => DVT_NO_COOLER_NAME_RE.test(String((it && it.name) || "")) ? false : undefined
};

/* ==================== מחברי הספק — נגזרים מהמחרוזת ====================
   \U0001F534 ארבעה חוקי תאימות ביקשו `psu.epsConnectors` · `pcieConnectors` ·
   `has12vhpwr` — שדות שלא קיימים בגיליון ומעולם לא היו. מה שכן קיים
   הוא עמודה אחת, `connectors`, בפורמט אחיד להפליא:

       "1x24pin,2xEPS,4xPCIe8pin,1x12VHPWR"     (65 מתוך 73 הספקים)

   ⚠️ **וזו הייתה הכוונה מלכתחילה.** ההערה על העמודה ב-11-catalog.gs
   אומרת במפורש "האתר מפרסר את זה לבדיקת מחברים" — הפרסור פשוט מעולם
   לא נכתב, ולכן ארבעת החוקים היו מתים בשקט.

   החמור מביניהם: `gpu-psu-connectors`, שחוסם כרטיס מסך שהספק לא יכול
   להזין. לקוח היה יכול להרכיב RTX 5090 עם ספק בלי 12VHPWR.

   ⚠️ `sataPowerConnectors` **לא** נגזר: מחברי SATA אינם מופיעים
   במחרוזת אצל אף ספק. החוק שנשען עליו נשאר מדולג, וזה עדיף על
   ניחוש — כמעט כל ספק ATX מגיע עם ארבעה ומעלה ממילא. */
const DVT_PSU_DERIVED = {
  pcieConnectors: function (raw) {
    const m = String(raw).match(/(\d+)\s*[x\u00d7*]\s*PCIe\s*8\s*pin/i);
    return m ? Number(m[1]) : null;
  },
  epsConnectors: function (raw) {
    const m = String(raw).match(/(\d+)\s*[x\u00d7*]\s*EPS/i);
    return m ? Number(m[1]) : null;
  },
  has12vhpwr: function (raw) {
    return /12VHPWR|12V-?2x6/i.test(String(raw)) ? true : false;
  }
};

function dvtGet(item, field){
  /* גזירה לפני הכינויים: אם השדה מבוקש, לא קיים, ויש connectors —
     מפרסרים. כך החוקים ממשיכים לקרוא שם קנוני אחד. */
  if(item && DVT_PSU_DERIVED[field] &&
     (item[field] === undefined || item[field] === null || item[field] === "") &&
     item.connectors){
    const v = DVT_PSU_DERIVED[field](item.connectors);
    if(v !== null) return v;
  }
  return dvtGetRaw_(item, field);
}

function dvtGetRaw_(item, field){
  if(!item) return undefined;
  if(item[field] !== undefined && item[field] !== null && item[field] !== "") return item[field];
  const alts = DVT_FIELD_ALIASES[field];
  if(alts){
    for(const a of alts){
      if(item[a] !== undefined && item[a] !== null && item[a] !== "") return item[a];
    }
  }
  const derive = DVT_DERIVED[field];
  if(derive){ const v = derive(item); if(v !== undefined) return v; }
  return undefined;
}

function dvtNum(v){ const n = Number(v); return Number.isFinite(n) ? n : null; }
function dvtNumOf(item, field){ return dvtNum(dvtGet(item, field)); }

function dvtArr(v){
  if (Array.isArray(v)) return v.map(String).map(s => s.trim()).filter(Boolean);
  if (typeof v === "string" && v.trim()) return v.split(/[,،;·|\/]+/).map(s => s.trim()).filter(Boolean);
  return [];
}
function dvtArrOf(item, field){ return dvtArr(dvtGet(item, field)); }

function dvtBool(v){
  if (v === true || v === false) return v;
  if (v == null || v === "") return null;
  const s = String(v).trim().toLowerCase();
  if (["true","yes","כן","1","v","✓","yep","y"].includes(s)) return true;
  if (["false","no","לא","0","-","x","none","אין"].includes(s)) return false;
  return null;
}
function dvtBoolOf(item, field){ return dvtBool(dvtGet(item, field)); }

/* ---------------------------------------------------------------
   2. נרמול ערכים
   ---------------------------------------------------------------
   ⚠️ הנתונים מוקלדים ביד בגיליון. "LGA 1700", "lga1700" ו-"LGA-1700"
   הם אותו שקע, ובלי נרמול הבדיקה הכי חשובה במנוע הייתה נכשלת על רווח.
   אותו דבר ל-Micro-ATX / mATX / uATX. */
function dvtSocket(v){
  return String(v == null ? "" : v).toUpperCase().replace(/[\s\-_.]/g, "");
}
function dvtSameSocket(a, b){
  const x = dvtSocket(a), y = dvtSocket(b);
  return x && y && x === y;
}

const DVT_FF_CANON = {
  "atx":"atx", "standardatx":"atx", "fullatx":"atx",
  "eatx":"eatx", "extendedatx":"eatx", "xlatx":"eatx",
  "matx":"matx", "microatx":"matx", "uatx":"matx", "µatx":"matx", "microatx m":"matx",
  "itx":"itx", "miniitx":"itx", "mitx":"itx",
  "dtx":"dtx", "minidtx":"dtx"
};
function dvtFF(v){
  const k = String(v == null ? "" : v).toLowerCase().replace(/[\s\-_.]/g, "");
  return DVT_FF_CANON[k] || k;
}
/* מארז גדול מקבל לוח קטן יותר גם אם לא רשמו את זה במפורש בגיליון.
   ⚠️ רק לכיוון אחד: ATX נכנס למארז ATX, ITX לא "מכיל" ATX. */
const DVT_FF_ORDER = ["itx","dtx","matx","atx","eatx"];
function dvtCaseFits(supportedList, moboFF){
  const want = dvtFF(moboFF);
  const list = supportedList.map(dvtFF);
  if(list.includes(want)) return true;
  const wi = DVT_FF_ORDER.indexOf(want);
  if(wi < 0) return false;
  return list.some(f => {
    const fi = DVT_FF_ORDER.indexOf(f);
    return fi >= 0 && fi > wi;                 // המארז מצהיר על גדול יותר
  });
}

/* היררכיית תקני **ספק כוח** — נפרדת מזו של לוח האם בכוונה.
   ---------------------------------------------------------------
   ⚠️ כאן includes פשוט מייצר שתי טעויות הפוכות, ושתיהן עולות כסף:

   1. **SFX-L הוא SFX שהתארך ב-30mm** (100mm מול 130mm עומק). מארז
      שמצהיר "SFX,SFX-L" מקבל את שניהם; מארז שמצהיר SFX **בלבד** לא
      מקבל SFX-L — הוא פשוט לא נכנס בכלוב. זו ההבחנה שהמנוע פספס.
   2. **ספק SFX נכנס למארז ATX** דרך בראקט מתאם שמגיע בקופסה של כמעט
      כל ספק SFX. חסימה שם היא חסימת מכירה תקינה, ולכן זו הערה.

   TFX ו-Flex לעומת זאת הם תקני OEM עם תבנית ברגים וצורה משלהם —
   הם לא נכנסים למארז ATX וכן ראויים לחסימה.

   מחזיר "fits" (נכנס כמו שהוא) · "bracket" (נכנס עם מתאם) · "no". */
const DVT_PSU_FF_CANON = {
  "atx":"atx", "atx12v":"atx", "ps2":"atx", "atxps2":"atx", "standardatx":"atx",
  "sfx":"sfx", "sfxl":"sfxl", "sfxlarge":"sfxl",
  "tfx":"tfx", "flex":"flex", "flexatx":"flex"
};
function dvtPsuFF(v){
  const k = String(v == null ? "" : v).toLowerCase().replace(/[\s\-_.]/g, "");
  return DVT_PSU_FF_CANON[k] || k;
}
function dvtPsuFits(supportedList, psuFF){
  const want = dvtPsuFF(psuFF);
  const list = (supportedList || []).map(dvtPsuFF).filter(Boolean);
  if(!list.length || !want) return "fits";          // בלי נתון לא חוסמים
  if(list.includes(want)) return "fits";
  if(want === "sfx"  && list.includes("sfxl")) return "fits";   // הכלוב הארוך מקבל גם קצר
  if((want === "sfx" || want === "sfxl") && list.includes("atx")) return "bracket";
  return "no";
}

/* תמיכת רדיאטור: או אובייקט {front,top,...}, או עמודות נפרדות
   radiatorFrontMm / radiatorTopMm / radiatorRearMm בגיליון.

   ⚠️ **באג אמיתי שנתפס בבדיקה הצולבת (golden) ותוקן כאן:** ה-API
   מחזיר radiatorSupport לכל מארז — גם כשאין נתון, בצורת
   {front:null, top:null}. Number(null) הוא 0 ב-JS, ולכן dvtNum(null)
   החזיר 0 — והמנוע קרא "תומך עד 0mm" וחסם **כל** קירור נוזלי על כל
   מארז שאין לו נתוני רדיאטור (17 מארזים בקטלוג החי). null חייב
   להיות "לא ידוע" שמדלג, לא אפס שחוסם — זה בדיוק העיקרון המנחה
   של הקובץ הזה. */
function dvtRadSupport(cs){
  if(!cs) return null;
  const o = cs.radiatorSupport;
  const val = (ov, col) => {
    const v = (ov === null || ov === undefined || ov === "") ? null : dvtNum(ov);
    return v ?? dvtNumOf(cs, col);
  };
  const out = {
    front: val(o && o.front, "radiatorFrontMm"),
    top:   val(o && o.top,   "radiatorTopMm"),
    rear:  val(o && o.rear,  "radiatorRearMm")
  };
  const any = out.front !== null || out.top !== null || out.rear !== null;
  return any ? out : null;
}
const DVT_RAD_SPOT_HE = { front:"קדמי", top:"עליון", rear:"אחורי" };

/* מזהי סוג — משמשים כ-when כדי שחוק לא ידרוש עמודה שלא רלוונטית לו. */
function dvtIsAio(cooling){
  const type = String(dvtGet(cooling,"coolerType") || "").toLowerCase();
  if(/aio|liquid|נוזל|water/.test(type)) return true;
  if(/air|אווירי|tower/.test(type)) return false;
  return dvtNumOf(cooling,"radiatorMm") !== null;   // בלי עמודת סוג — לפי קיום רדיאטור
}
function dvtIsSataDrive(storage){
  const s = (String(dvtGet(storage,"driveType") || "") + " " + String(dvtGet(storage,"formFactor") || "")).toLowerCase();
  if(/nvme|m\.?2|2280/.test(s)) return false;
  return /sata|hdd|2\.5|3\.5/.test(s);
}
function dvtIsNvmeDrive(storage){
  const s = (String(dvtGet(storage,"driveType") || "") + " " + String(dvtGet(storage,"formFactor") || "")).toLowerCase();
  return /nvme|m\.?2|2280/.test(s);
}

/* מחברי הזנה: "2x8pin", "8+8", "1x12VHPWR", "12VHPWR (3x8 מתאם)".
   מחזיר {pcie8, vhpwr} — כמה מחברי PCIe 8-פין וכמה 12VHPWR. */
function dvtConnectors(v){
  const s = String(v == null ? "" : v).toLowerCase();
  if(!s.trim()) return null;
  const vhpwr = /12vhpwr|12v-?2x6|16\s*-?\s*pin|16pin/.test(s) ? 1 : 0;
  let pcie8 = 0;
  // "3x8" / "2 × 8 pin" / "2*8"
  const multi = s.match(/(\d+)\s*[x×*]\s*(6|8)\s*(?:\+\s*2)?\s*(?:pin|פין)?/g) || [];
  multi.forEach(m => {
    const n = Number((m.match(/^\d+/) || [1])[0]);
    if(Number.isFinite(n)) pcie8 += n;
  });
  if(!pcie8){
    // "8+8" / "8+6"
    const plus = s.match(/\b(6|8)\s*\+\s*(6|8)\b/);
    if(plus) pcie8 = 2;
    else if(/\b(6|8)\s*(?:\+\s*2)?\s*(?:pin|פין)\b/.test(s)) pcie8 = 1;
  }
  return { pcie8, vhpwr };
}

/* כמה מחברי PCIe 8-פין דורש מתאם 12VHPWR של הכרטיס הזה.
   ---------------------------------------------------------------
   ⚠️ קודם היה כאן 3 קבוע, וזה חסם מכירות אמיתיות: RTX 5070 (250W)
   מגיע עם מתאם 2×8 בקופסה, ונחסם מול כל ספק עם שני מחברי PCIe.
   בכיוון השני 3 היה **מקל מדי** — RTX 5090 (575W) עבר עם מתאם 3×8
   שמדורג ל-450W בלבד.

   כל מחבר 8-פין מספק 150W, וזה בדיוק מדרגות ה-sense של התקן
   (150/300/450/600W) ומה שהיצרנים שמים בקופסה בפועל:
     5070 250W → 2×8 · 5070 Ti 300W → 2×8 · 5080 360W → 3×8 · 5090 575W → 4×8
   בלי tdpWatts חוזרים ל-3 השמרני שהיה כאן קודם. */
function dvtVhpwrAdapter8pin(gpu){
  const w = dvtNumOf(gpu, "tdpWatts");
  if(w === null || w <= 0) return 3;
  return Math.max(1, Math.min(4, Math.ceil(w / 150)));
}

/* ---------------------------------------------------------------
   3. תקרות כמות — כמה יחידות מותר מכל קטגוריה
   ---------------------------------------------------------------
   זו התשובה ל"אפשר להגיע ל-4 מעבדים": התקרה נגזרת מהחומרה שנבחרה. */
function dvtMaxQty(cat, sel){
  sel = sel || {};
  const mobo = sel.mobo, psu = sel.psu, gpu = sel.gpu, cs = sel.case, ram = sel.ram;
  switch(cat){
    case "cpu": {
      // לוחות צרכניים = שקע אחד. רק לוח שרת מצהיר על יותר.
      const sockets = dvtNumOf(mobo, "cpuSockets");
      return Math.max(1, sockets || 1);
    }
    case "ram": {
      const slots = dvtNumOf(mobo, "ramSlots");
      if(slots === null) return 4;                 // ברירת מחדל שמרנית
      // ⚠️ ערכה של 2×16GB תופסת שני חריצים, לא אחד. בלי זה אפשר היה
      // לבחור 4 ערכות דו-מודוליות ללוח עם 4 חריצים.
      const perKit = Math.max(1, dvtNumOf(ram, "modules") || 1);
      return Math.max(1, Math.floor(slots / perKit));
    }
    case "storage": {
      const m2 = dvtNumOf(mobo, "m2Slots");
      const sata = dvtNumOf(mobo, "sataPorts");
      if(m2 === null && sata === null) return 2;
      return Math.max(1, (m2 || 0) + (sata || 0)) || 2;
    }
    case "gpu": {
      const slots = dvtNumOf(mobo, "pcieX16Slots");
      if (slots === null) return 1;            // בלי נתון — לא מציעים ריבוי כרטיסים
      let max = Math.max(1, slots);
      // ספק כוח מגביל בפועל: כל כרטיס נוסף דורש את ההספק המומלץ שלו
      const need = dvtNumOf(gpu, "recommendedPsuWatts");
      const have = dvtNumOf(psu, "wattage");
      if(need && have) max = Math.min(max, Math.max(1, Math.floor(have / need)));
      // וגם חריצי הרחבה פיזיים במארז
      const slotW = dvtNumOf(gpu, "slotWidth");
      const bays  = dvtNumOf(cs, "expansionSlots");
      if(slotW && bays) max = Math.min(max, Math.max(1, Math.floor(bays / slotW)));
      return max;
    }
    case "caseFans": {
      const mounts = dvtNumOf(cs, "fanMounts");
      return mounts === null ? 2 : Math.max(1, mounts);
    }
    default: return 1;
  }
}

/* עמדות המאווררים במארז, ומה כבר "נתפס" ע"י הרדיאטור. */
function dvtFanBudget(sel, qty){
  const cs = sel.case;
  const mounts = dvtNumOf(cs, "fanMounts");
  const rad = dvtNumOf(sel.cooling, "radiatorMm");
  // רדיאטור 240 תופס 2 עמדות של 120mm, 360 תופס 3 וכו'
  const usedByRad = rad ? Math.round(rad / 120) : 0;
  const perKit = dvtNumOf(sel.caseFans, "fans") || 0;
  const kitFans = perKit * Math.max(1, Number((qty||{}).caseFans) || 1);
  return { mounts, usedByRad, kitFans,
           free: mounts === null ? null : mounts - usedByRad - kitFans };
}

/* ---------------------------------------------------------------
   4. אומדן צריכת חשמל של ההרכב כולו
   ---------------------------------------------------------------
   ⚠️ קודם החישוב הסתמך רק על ההמלצה של יצרן הכרטיס. זה מפספס הרכב
   בלי כרטיס מסך נפרד, וגם הרכב עם מעבד 253W וששה כוננים. כאן סוכמים
   את כל הצרכנים ומוסיפים מרווח, וההמלצה של היצרן משמשת כרצפה. */
function dvtEstimateWatts(sel, qty){
  const q = c => Math.max(1, Number((qty||{})[c]) || 1);
  let w = 60;                                   // לוח אם, זיכרון, מאווררים, בסיס
  /* ⚠️ אם יש maxTurboWatts הוא *כבר* צריכת השיא ואין להכפיל אותו שוב;
     רק TDP בסיס דורש מקדם. בגיליון עמודת tdp של i5-13400F היא 148W —
     כלומר PL2 ולא 65W — ולכן הכפלה כפולה הייתה מנפחת את ההמלצה. */
  const turbo = dvtNumOf(sel.cpu, "maxTurboWatts");
  const base  = dvtNumOf(sel.cpu, "tdpWatts");
  const cpuW  = turbo !== null ? turbo : (base !== null ? base * 1.25 : null);
  if(cpuW) w += cpuW * q("cpu");
  const gpuW = dvtNumOf(sel.gpu, "tdpWatts");
  if(gpuW) w += gpuW * q("gpu") * 1.15;
  w += q("storage") * 8;
  const fans = dvtNumOf(sel.caseFans, "fans") || 0;
  w += fans * 3;
  if(dvtNumOf(sel.cooling, "radiatorMm")) w += 15;   // משאבה
  const est = Math.round(w / 50) * 50;

  // רצפה: ההמלצה של יצרן הכרטיס כבר כוללת מערכת טיפוסית
  const vendor = dvtNumOf(sel.gpu, "recommendedPsuWatts");
  const floor = vendor ? vendor * q("gpu") : 0;
  const known = !!(cpuW || gpuW || vendor);
  return { watts: Math.max(est, floor), known, vendor };
}

/* =====================================================================
   5. מטריצת ההצלבה — כל צמד קטגוריות
   =====================================================================
   הסדר בטבלה הוא סדר ההצגה בקבוצות; הדירוג הסופי לפי חומרה.
   כל חוק מוסיף כיסוי גם ל-dvtRateOption (הסינון בבורר) בלי קוד נוסף.
===================================================================== */
const DVT_RULES = [

  /* ============ מעבד ↔ לוח אם ============ */
  {
    id:"cpu-mobo-socket", cats:["cpu","mobo"], on:"mobo", level:"error",
    needs:["cpu.socket","mobo.socket"],
    run:({cpu,mobo}) => dvtSameSocket(cpu.socket, mobo.socket) ? null :
      `המעבד ${cpu.name} הוא שקע ${cpu.socket}, והלוח ${mobo.name} הוא ${mobo.socket}. הם לא מתחברים.`
  },
  {
    /* ⚠️ שקע תואם *לא* אומר שהלוח מריץ את המעבד. B660 ו-13th gen הם
       שניהם LGA1700 אבל דורשים עדכון BIOS, וזה מחשב שלא עולה. */
    id:"cpu-mobo-support-list", cats:["cpu","mobo"], on:"mobo", level:"warn",
    needs:["cpu.cpuGen","mobo.supportedCpuGens"],
    run:({cpu,mobo}) => {
      /* 🔴 נמדד בסריקה של 20 הרכבות: החוק ירה **313 אזהרות — בדיוק
         כמספר חסימות השקע**. הסיבה: מעבד AM5 מול לוח Intel נחסם ממילא
         על השקע, ואז קיבל *בנוסף* "הלוח לא מצוין כתומך בדור". שתי
         הודעות על אותה עובדה אחת, והשנייה מוסיפה בלבול ולא מידע.

         ⚠️ החוק הזה נועד למקרה ההפוך לגמרי, וזה כתוב בהערה שמעליו:
         **שקע תואם** אבל הדור לא נתמך (B660 מול דור 13) — מצב שבו
         המחשב פיזית מתחבר ופשוט לא עולה בלי עדכון BIOS. זה המידע
         היקר, והוא נבלע ב-313 חזרות.

         לכן: אם השקעים כבר לא תואמים, אין כאן מה לומר. */
      if(!dvtSameSocket(dvtGet(cpu,"socket"), dvtGet(mobo,"socket"))) return null;
      const gen = String(dvtGet(cpu,"cpuGen")).toLowerCase();
      const list = dvtArrOf(mobo,"supportedCpuGens").map(s => s.toLowerCase());
      if(!list.length) return null;
      if(list.includes(gen)) return null;
      const needsBios = dvtArrOf(mobo,"biosUpdateGens").map(s => s.toLowerCase());
      if(needsBios.includes(gen)){
        return `הלוח ${mobo.name} מריץ את ${cpu.name} רק אחרי עדכון BIOS. אני מעדכן לפני המשלוח — רק שתדע שזה חלק מההרכבה.`;
      }
      return `הלוח ${mobo.name} לא מצוין כתומך בדור של ${cpu.name} (${gen}). שווה לוודא לפני הזמנה.`;
    }
  },
  {
    /* מעבד עם סיומת F/KF בלי כרטיס מסך = מחשב בלי תמונה. */
    id:"cpu-igpu-no-gpu", cats:["cpu"], on:"gpu", level:"error",
    needs:["cpu.hasIgpu"],
    run:({cpu,sel}) => {
      if(sel.gpu) return null;
      return dvtBoolOf(cpu,"hasIgpu") === false
        ? `ל-${cpu.name} אין גרפיקה מובנית, ולא נבחר כרטיס מסך. המחשב יעלה אבל לא תהיה תמונה במסך.`
        : null;
    }
  },
  {
    id:"cpu-mobo-oc", cats:["cpu","mobo"], on:"mobo", level:"info",
    needs:["cpu.unlocked","mobo.supportsOc"],
    run:({cpu,mobo}) => (dvtBoolOf(cpu,"unlocked") === true && dvtBoolOf(mobo,"supportsOc") === false)
      ? `${cpu.name} הוא מעבד פתוח להאצה (Overclocking), אבל ${mobo.name} אינו תומך בהאצה. המעבד יעבוד מצוין — פשוט בלי היכולת להעלות לו את התדר מעבר למפעל.`
      : null
  },
  {
    id:"cpu-mobo-vrm", cats:["cpu","mobo"], on:"mobo", level:"warn",
    needs:["cpu.tdpWatts","mobo.maxCpuTdpWatts"],
    run:({cpu,mobo}) => {
      const need = dvtNumOf(cpu,"tdpWatts"), max = dvtNumOf(mobo,"maxCpuTdpWatts");
      return need > max
        ? `${cpu.name} צורך עד ${need}W ו-${mobo.name} מדורג ל-${max}W. הלוח יחנוק את המעבד בעומס ממושך.`
        : null;
    }
  },

  /* ============ מעבד ↔ זיכרון ============ */
  {
    id:"cpu-ram-speed", cats:["cpu","ram"], on:"ram", level:"info",
    needs:["cpu.maxRamSpeedMhz","ram.speedMhz"],
    run:({cpu,ram}) => {
      /* 🔴 ירה 237 פעמים — **54% מכל אפשרויות הזיכרון**. אותה סיבה
         כמו ב-mobo-ram-speed: `maxRamSpeedMhz` של המעבד הוא מפרט
         JEDEC (5600 לדור 14), וכל ערכת 6000 חורגת ממנו. כלומר תג
         "לידיעתך" ישב על יותר ממחצית הרשימה.

         ⚠️ המסר עצמו ("אני מפעיל XMP לפני המשלוח") הוא דווקא מסר
         טוב ומבדל — ולכן הוא לא נמחק אלא **עבר למקום הנכון**:
         הערה חיובית אחת על ההרכבה בפאנל הסיכום (buildNotesList),
         במקום חזרה על כל כרטיס זיכרון ברשימה.

         כאן נשאר רק פער חריג באמת (מעל 20%), שבו יש מה לומר על
         הפריט המסוים. */
      const max = dvtNumOf(cpu,"maxRamSpeedMhz"), got = dvtNumOf(ram,"speedMhz");
      if(!(got > max * 1.2)) return null;
      return `${ram.name} מדורג ל-${got}MHz, הרבה מעל המפרט הרשמי של ${cpu.name} (${max}MHz). ` +
             `זה עובד דרך פרופיל XMP/EXPO — אני מפעיל אותו בהרכבה.`;
    }
  },

  /* ============ מעבד ↔ קירור ============ */
  {
    /* ⚠️ הבדיקה הכי מפוספסת בבוני מחשבים: גוף קירור בלי בראקט לשקע
       הנכון פשוט לא מתברג. */
    id:"cpu-cooling-socket", cats:["cpu","cooling"], on:"cooling", level:"error",
    when:({cooling}) => !dvtIsStockCooler(cooling),
    needs:["cpu.socket","cooling.supportedSockets"],
    run:({cpu,cooling}) => {
      const list = dvtArrOf(cooling,"supportedSockets");
      if(!list.length) return null;
      return list.some(s => dvtSameSocket(s, cpu.socket)) ? null :
        `${cooling.name} לא מגיע עם מנגנון הרכבה לשקע ${cpu.socket} (תומך ב-${list.join(", ")}).`;
    }
  },
  {
    /* 🔴 היה level:"error" עד 19.08 — והחוק חסם את הבחירה בזמן
       שההודעה שלו עצמה אומרת שהמחשב **עובד** ורק מוריד תדרים.
       דביר: "לא חסומים אחד לשני, פשוט יש אזהרה".

       ⚠️ ההבחנה שקובעת כאן: חסימה שמורה למה ש**פיזית לא נכנס או לא
       עולה** — שקע, מידות, חריצים, ספק שיכבה את המחשב. מרווח תרמי
       הוא שאלה של ביצועים ורעש, והלקוח רשאי להחליט עליה בעצמו.
       חסימה על ביצועים גם מלמדת להתעלם מהחסימות האמיתיות. */
    id:"cpu-cooling-tdp", cats:["cpu","cooling"], on:"cooling", level:"warn",
    when:({cooling}) => !dvtIsStockCooler(cooling),
    needs:["cpu.tdpWatts","cooling.coolerTdpWatts"],
    run:({cpu,cooling}) => {
      const need = dvtNumOf(cpu,"tdpWatts"), can = dvtNumOf(cooling,"coolerTdpWatts");
      // המקרה ה"בגבול" מטופל בחוק ה-warn שאחריו
      if(!(need > can)) return null;
      /* הפער עצמו נאמר ללקוח, כי 10W ו-150W הם לא אותה המלצה. */
      const gap = Math.round((need - can) / can * 100);
      return `${cooling.name} מפנה עד ${can}W ו-${cpu.name} מייצר ${need}W` +
             (gap >= 40
               ? ` — פער של ${gap}%. המעבד יוריד תדרים משמעותית בעומס ממושך; מומלץ קירור חזק יותר.`
               : `. בעומס ממושך המעבד עשוי להוריד תדרים.`);
    }
  },
  {
    id:"cpu-cooling-tdp-tight", cats:["cpu","cooling"], on:"cooling", level:"warn",
    when:({cooling}) => !dvtIsStockCooler(cooling),
    needs:["cpu.tdpWatts","cooling.coolerTdpWatts"],
    run:({cpu,cooling}) => {
      const need = dvtNumOf(cpu,"tdpWatts"), can = dvtNumOf(cooling,"coolerTdpWatts");
      return (need <= can && need > can * 0.85)
        ? `${cooling.name} עומד ב-${cpu.name} בדיוק בגבול (${need}W מול ${can}W). זה יעבוד, אבל יהיה רועש בעומס.`
        : null;
    }
  },
  {
    /* ⚠️ dvtCoolerIncluded ולא dvtBoolOf: העמודה בגיליון עדיין מחזיקה
       TRUE שגוי על מעבדי Tray (ראה ההערה מעל DVT_NO_COOLER_NAME_RE).
       בלי העקיפה, מעבד Tray היה מקבל "מגיע עם גוף קירור מהיצרן" —
       והלקוח היה מוותר על קירור למחשב שלא נדלק בלעדיו. */
    id:"cpu-cooler-included", cats:["cpu","cooling"], on:"cooling", level:"info",
    needs:["cpu.coolerIncluded"],
    run:({cpu,cooling}) => (dvtCoolerIncluded(cpu) === true && Number(cooling.price) > 0)
      ? `${cpu.name} מגיע עם גוף קירור מהיצרן. הקירור שבחרת ישפר טמפרטורות ורעש, אבל הוא לא חובה.`
      : null
  },
  {
    id:"cpu-no-cooler", cats:["cpu"], on:"cooling", level:"error",
    needs:["cpu.coolerIncluded"],
    run:({cpu,sel}) => (!sel.cooling && dvtCoolerIncluded(cpu) === false)
      ? `${cpu.name} מגיע בלי גוף קירור, ועדיין לא נבחר קירור. חובה לבחור אחד.`
      : null
  },
  {
    /* אפשרות "קירור בסיסי שמגיע עם המעבד" (מוזרקת ב-builder-bridge.js)
       חוקית **רק** כשלמעבד שנבחר באמת מצורף גוף קירור — זו דרישה
       מפורשת של דביר. בלי מעבד, או עם מעבד Tray, היא חסומה. */
    id:"cooling-stock-needs-cpu", cats:["cooling"], on:"cooling", level:"error",
    when:({cooling}) => dvtIsStockCooler(cooling),
    needs:[],
    run:({cooling,sel}) => {
      if(!sel.cpu) return `"${cooling.name}" זמין רק אחרי בחירת מעבד שמגיע עם גוף קירור בקופסה.`;
      return dvtCoolerIncluded(sel.cpu) === true ? null :
        `${sel.cpu.name} לא מגיע עם גוף קירור בקופסה — להרכב הזה חייבים קירור אמיתי.`;
    }
  },
  {
    /* ההודעה שדביר ביקש להצמיד לאפשרות הזו: קירור מהקופסה עובד, אבל
       הוא הבסיס — שידע במה הוא בוחר. info, לא אזהרה: זו בחירה תקינה. */
    id:"cooling-stock-basic", cats:["cpu","cooling"], on:"cooling", level:"info",
    when:({cooling}) => dvtIsStockCooler(cooling),
    needs:[],
    run:({cpu}) => dvtCoolerIncluded(cpu) === true
      ? `הקירור שמגיע עם ${cpu.name} בסיסי: שקט ומספיק לעבודה יומיומית, אבל בעומס ממושך גוף קירור ייעודי ישפר טמפרטורות ורעש.`
      : null
  },

  /* ============ לוח אם ↔ זיכרון ============ */
  {
    id:"mobo-ram-type", cats:["mobo","ram"], on:"ram", level:"error",
    needs:["mobo.ramType","ram.ramType"],
    run:({mobo,ram}) => {
      const a = String(dvtGet(ram,"ramType")).toUpperCase().replace(/\s/g,"");
      const b = String(dvtGet(mobo,"ramType")).toUpperCase().replace(/\s/g,"");
      return a === b ? null : `הלוח תומך ב-${b} והזיכרון שנבחר הוא ${a}. אלה חריצים שונים פיזית — הם לא מתחברים.`;
    }
  },
  {
    id:"mobo-ram-slots", cats:["mobo","ram"], on:"ram", level:"error",
    needs:["mobo.ramSlots"],
    run:({mobo,ram,q}) => {
      const slots = dvtNumOf(mobo,"ramSlots");
      const perKit = Math.max(1, dvtNumOf(ram,"modules") || 1);
      const used = q("ram") * perKit;
      return used > slots
        ? `נבחרו ${q("ram")} ערכות של ${perKit} מודולים (${used} מקלות) אבל בלוח יש ${slots} חריצים.`
        : null;
    }
  },
  {
    /* ⚠️ needs מבקש במפורש ram.sticks ולא נשען על ברירת המחדל של
       dvtMaxQty. שם "ריק = 1" הוא שמרנות נכונה כי היא רק *מרחיבה*
       את התקרה; כאן היא הייתה מספרת ללקוח על תפוסת חריצים שאיש לא
       מדד. 71 מוצרי זיכרון בקטלוג בלי הערך — עליהם החוק פשוט שותק. */
    id:"mobo-ram-slots-full", cats:["mobo","ram"], on:"ram", level:"info",
    needs:["mobo.ramSlots","ram.sticks"],
    run:({mobo,ram,q}) => {
      const slots = dvtNumOf(mobo,"ramSlots");
      const used = q("ram") * Math.max(1, dvtNumOf(ram,"modules") || 1);
      return (used === slots && slots > 1)
        ? `הערכה תאכלס את כל ${slots} חריצי הזיכרון של ${mobo.name}. מבחינת ביצועים זה המצב הטוב ביותר, רק שים לב שהרחבה בעתיד תהיה החלפה של הערכה ולא הוספת מקל לידה.`
        : null;
    }
  },
  {
    id:"ram-single-channel", cats:["mobo","ram"], on:"ram", level:"info",
    needs:["mobo.ramSlots","ram.sticks"],
    run:({mobo,ram,q}) => {
      const used = q("ram") * Math.max(1, dvtNumOf(ram,"modules") || 1);
      const slots = dvtNumOf(mobo,"ramSlots");
      return (used === 1 && slots >= 2)
        ? `נבחר מקל זיכרון אחד, כך שהזיכרון ירוץ בערוץ יחיד — כמחצית מרוחב הפס. שתי יחידות של חצי הנפח (למשל 2×8GB במקום 1×16GB) עולות בערך אותו דבר ונותנות יותר, במיוחד במשחקים ובגרפיקה מובנית.`
        : null;
    }
  },
  {
    id:"mobo-ram-capacity", cats:["mobo","ram"], on:"ram", level:"error",
    needs:["mobo.maxRamGb","ram.capacityGb"],
    run:({mobo,ram,q}) => {
      const max = dvtNumOf(mobo,"maxRamGb"), have = dvtNumOf(ram,"capacityGb") * q("ram");
      return have > max ? `הלוח ${mobo.name} מקבל עד ${max}GB זיכרון, ונבחרו ${have}GB.` : null;
    }
  },
  {
    /* 🔴 היה `warn` עם התנאי `got > max` בלבד, וירה **249 פעמים
       בסריקה של 20 הרכבות — 45% מכל אפשרויות הזיכרון**. הבדיקה מול
       הנתונים בגיליון הראתה שזו אזהרה **שגויה שיטתית**:

         · `maxRamSpeedMhz` של הלוחות מתפלג 5600×60 ו-6400×29.
         · אלה ערכי **JEDEC** — מהירות הבסיס הרשמית, לא התקרה.
           לוח Z890 רשום כאן 6400 ובפועל מריץ DDR5-8000 עם XMP.
         · 51 מתוך ערכות הזיכרון בקטלוג הן 6000MHz — הערכה הנפוצה
           ביותר לגיימינג, ורצה מצוין על כל לוח DDR5 מודרני.

       כלומר הלקוח קיבל "הזיכרון יעבוד לאט יותר" על הצירוף הכי נפוץ
       ובריא שיש, ועלול היה לוותר על ערכה טובה בגלל אזהרה לא נכונה.

       ⚠️ מה נשאר: רק פער אמיתי (מעל 20% מעל הבסיס) מקבל הערה, והיא
       `info` ומנוסחת כמידע על XMP/EXPO — שזו האמת המעשית, ובדיוק
       הדבר שדביר מגדיר בביוס לפני המשלוח. */
    id:"mobo-ram-speed", cats:["mobo","ram"], on:"ram", level:"info",
    needs:["mobo.maxRamSpeedMhz","ram.speedMhz"],
    run:({mobo,ram}) => {
      const max = dvtNumOf(mobo,"maxRamSpeedMhz"), got = dvtNumOf(ram,"speedMhz");
      if(!(got > max * 1.2)) return null;
      return `הזיכרון מדורג ל-${got}MHz, ומעל המהירות הרשמית של ${mobo.name} (${max}MHz). ` +
             `הוא יעבוד — אני מפעיל את פרופיל ה-XMP/EXPO בביוס לפני המשלוח.`;
    }
  },
  {
    /* ⚠️ דרישת דביר: מהירות ו-CL הם רף **איכות** — "חלש מדי יגביל
       ביצועים" — לא חסימה. הרף לפי הפלטפורמה: DDR5 מתחת ל-5200
       ו-DDR4 מתחת ל-3000 נקנים רק בגלל המחיר, והפער מורגש במיוחד
       עם גרפיקה מובנית שנשענת על זיכרון המערכת. סוג הזיכרון חובה
       בבדיקה — 3200MHz הוא איטי ל-DDR5 אבל הסטנדרט הבריא של DDR4. */
    id:"ram-speed-weak", cats:["ram"], on:"ram", level:"warn",
    needs:["ram.ramType","ram.speedMhz"],
    run:({ram}) => {
      const type = String(dvtGet(ram,"ramType") || "").toUpperCase().replace(/\s/g,"");
      const spd = dvtNumOf(ram,"speedMhz");
      if(spd === null) return null;
      const floor = type === "DDR5" ? 5200 : type === "DDR4" ? 3000 : 0;
      if(!floor || spd >= floor) return null;
      return `${ram.name} רץ ב-${spd}MHz — איטי לתקן ${type}. זה יעבוד, אבל זיכרון איטי מגביל את המעבד ואת הגרפיקה המובנית; ${type === "DDR5" ? "5600-6000" : "3200-3600"}MHz עולה כמעט אותו דבר ונותן יותר.`;
    }
  },
  {
    /* CL לבדו לא אומר כלום — 6000 CL36 מהיר מ-4800 CL30. ההשוואה
       הנכונה היא ההשהיה בפועל: CL/מהירות×2000 = ננו-שניות למילה
       הראשונה. מעל 15ns זה הזיכרון שנראה טוב רק על האריזה. */
    id:"ram-latency-weak", cats:["ram"], on:"ram", level:"info",
    needs:["ram.speedMhz","ram.cl"],
    run:({ram}) => {
      const spd = dvtNumOf(ram,"speedMhz"), cl = dvtNumOf(ram,"cl");
      if(!spd || !cl) return null;
      const ns = (cl / spd) * 2000;
      return ns > 15
        ? `הצירוף של CL${cl} ב-${spd}MHz נותן ל-${ram.name} השהיה גבוהה (כ-${ns.toFixed(1)}ns). ערכה עם CL נמוך יותר באותה מהירות תרגיש חדה יותר, לרוב באותו מחיר.`
        : null;
    }
  },

  /* ============ לוח אם ↔ מארז ============ */
  {
    id:"mobo-case-form", cats:["mobo","case"], on:"case", level:"error",
    needs:["mobo.formFactor","case.supportedFormFactors"],
    run:({mobo,cs}) => {
      const supported = dvtArrOf(cs,"supportedFormFactors");
      if(!supported.length) return null;
      return dvtCaseFits(supported, dvtGet(mobo,"formFactor")) ? null :
        `הלוח הוא ${dvtGet(mobo,"formFactor")} והמארז ${cs.name} תומך ב-${supported.join(", ")}. הלוח לא ייכנס.`;
    }
  },

  /* ============ לוח אם ↔ אחסון ============ */
  {
    id:"mobo-storage-m2", cats:["mobo","storage"], on:"storage", level:"error",
    when:({storage}) => dvtIsNvmeDrive(storage),
    needs:["mobo.m2Slots"],
    run:({mobo,q}) => {
      const m2 = dvtNumOf(mobo,"m2Slots");
      return q("storage") > m2
        ? `נבחרו ${q("storage")} כונני NVMe אבל בלוח ${mobo.name} יש ${m2} חריצי M.2.`
        : null;
    }
  },
  {
    id:"mobo-storage-sata", cats:["mobo","storage"], on:"storage", level:"error",
    when:({storage}) => dvtIsSataDrive(storage),
    needs:["mobo.sataPorts"],
    run:({mobo,q}) => {
      const ports = dvtNumOf(mobo,"sataPorts");
      return q("storage") > ports
        ? `נבחרו ${q("storage")} כונני SATA אבל בלוח ${mobo.name} יש ${ports} יציאות SATA.`
        : null;
    }
  },
  {
    /* גוטצ'ה קלאסי: אכלוס חריץ M.2 מנטרל שתי יציאות SATA. */
    id:"mobo-m2-shares-sata", cats:["mobo","storage"], on:"storage", level:"info",
    when:({storage}) => dvtIsNvmeDrive(storage),
    needs:["mobo.m2SharesSata"],
    run:({mobo}) => dvtBoolOf(mobo,"m2SharesSata") === true
      ? `בלוח ${mobo.name} חריץ ה-M.2 חולק ערוץ עם יציאות SATA — אכלוס שלו מנטרל חלק מהן. רלוונטי רק אם תוסיף כוננים בהמשך.`
      : null
  },

  /* ============ לוח אם ↔ כרטיס מסך ============ */
  {
    id:"mobo-gpu-slots", cats:["mobo","gpu"], on:"gpu", level:"error",
    needs:["mobo.pcieX16Slots"],
    run:({mobo,q}) => {
      const slots = dvtNumOf(mobo,"pcieX16Slots");
      return q("gpu") > slots
        ? `נבחרו ${q("gpu")} כרטיסי מסך אבל בלוח ${mobo.name} יש ${slots} חריצי PCIe x16.`
        : null;
    }
  },
  {
    id:"gpu-multi-advice", cats:["gpu"], on:"gpu", level:"warn",
    needs:[],
    run:({q}) => q("gpu") > 1
      ? "שני כרטיסי מסך ומעלה לא מגדילים ביצועים ברוב המשחקים והתוכנות — רק בעומסים ייעודיים כמו רינדור. שווה לוודא שזה מה שצריך."
      : null
  },

  /* ============ לוח אם ↔ רשת ============ */
  {
    id:"mobo-wifi-builtin", cats:["mobo","wifi"], on:"wifi", level:"info",
    needs:["mobo.wifiBuiltIn"],
    run:({mobo,wifi}) => (dvtBoolOf(mobo,"wifiBuiltIn") === true && Number(wifi.price) > 0)
      ? `ללוח ${mobo.name} כבר יש WiFi מובנה — הכרטיס הנוסף מיותר.`
      : null
  },
  {
    id:"mobo-wifi-missing", cats:["mobo"], on:"wifi", level:"warn",
    needs:["mobo.wifiBuiltIn"],
    run:({mobo,sel}) => {
      if(sel.wifi) return null;
      return dvtBoolOf(mobo,"wifiBuiltIn") === false
        ? `ללוח ${mobo.name} אין WiFi מובנה. בלי כרטיס רשת אלחוטית תצטרך כבל רשת למחשב.`
        : null;
    }
  },
  {
    /* ⚠️ רק לכרטיס נרכש: אפשרות "כלול בלוח" / "ללא" היא לא חומרה
       ואין טעם לבקש עבורה עמודת busType. */
    id:"mobo-wifi-x1-slot", cats:["mobo","wifi"], on:"wifi", level:"error",
    when:({wifi}) => Number(wifi.price) > 0,
    needs:["mobo.pcieX1Slots","wifi.busType"],
    run:({mobo,wifi}) => {
      if(!/pcie/i.test(String(dvtGet(wifi,"busType")))) return null;
      const slots = dvtNumOf(mobo,"pcieX1Slots");
      if(slots > 0) return null;
      return `ל-${wifi.name} צריך חריץ PCIe x1 פנוי, ולפי המפרט אין כזה ב-${mobo.name}.`;
    }
  },

  /* ============ לוח אם ↔ ספק כוח ============ */
  {
    /* ⚠️ warn ולא error, וזה שינוי מכוון אחרי שהנתונים נכנסו לגיליון.
       epsConnectors בלוח סופר **שקעים על הלוח** — לוח 8+4 נרשם 2 —
       והמחבר השני בלוח צרכני הוא תוספת להאצה ולעומס ממושך, לא תנאי
       לעלייה. מחשב עם כבל EPS אחד בלוח כזה עולה ורץ.
       על הקטלוג של היום זה 30 לוחות × 4 ספקים בעלי EPS יחיד = 120
       צמדים שהיו נחסמים למכירה בלי סיבה פיזית. */
    id:"mobo-psu-eps", cats:["mobo","psu"], on:"psu", level:"warn",
    needs:["mobo.epsConnectors","psu.epsConnectors"],
    run:({mobo,psu}) => {
      const need = dvtNumOf(mobo,"epsConnectors"), have = dvtNumOf(psu,"epsConnectors");
      return need > have
        ? `ל-${mobo.name} יש ${need} שקעי EPS להזנת המעבד ול-${psu.name} יש ${have} כבל${have>1?"ים":""}. המחשב יעלה ויעבוד ככה — השקע הנוסף נחוץ למעבד חזק בעומס ממושך או להאצה (Overclocking). אם זה הכיוון, שווה ספק עם ${need} מחברי EPS.`
        : null;
    }
  },

  /* ============ זיכרון ↔ קירור ============ */
  {
    /* ⚠️ תקלה אמיתית ונפוצה: גוף קירור אווירי גדול "יושב" מעל חריץ
       הזיכרון הראשון, וזיכרון עם גוף קירור גבוה לא נכנס תחתיו. */
    id:"ram-cooling-clearance", cats:["ram","cooling"], on:"cooling", level:"error",
    // רדיאטור לא נתלה מעל הזיכרון, וקירור מהקופסה נמוך מכל מקל זיכרון
    when:({cooling}) => !dvtIsAio(cooling) && !dvtIsStockCooler(cooling),
    needs:["ram.heightMm","cooling.ramClearanceMm"],
    run:({ram,cooling}) => {
      const h = dvtNumOf(ram,"heightMm"), clear = dvtNumOf(cooling,"ramClearanceMm");
      if(h > clear) return `${ram.name} בגובה ${h}mm, ו-${cooling.name} משאיר ${clear}mm מעל חריצי הזיכרון. הם מתנגשים.`;
      return null;
    }
  },
  {
    id:"ram-cooling-clearance-tight", cats:["ram","cooling"], on:"cooling", level:"warn",
    when:({cooling}) => !dvtIsAio(cooling) && !dvtIsStockCooler(cooling),
    needs:["ram.heightMm","cooling.ramClearanceMm"],
    run:({ram,cooling}) => {
      const h = dvtNumOf(ram,"heightMm"), clear = dvtNumOf(cooling,"ramClearanceMm");
      return (h <= clear && clear - h < 3)
        ? `${ram.name} (${h}mm) נכנס תחת ${cooling.name} בהפרש של פחות מ-3mm. זה יעבוד, אבל בלי מרווח.`
        : null;
    }
  },

  /* ============ כרטיס מסך ↔ מארז ============ */
  {
    id:"gpu-case-length", cats:["gpu","case"], on:"case", level:"error",
    needs:["gpu.lengthMm","case.maxGpuLengthMm"],
    run:({gpu,cs}) => {
      const len = dvtNumOf(gpu,"lengthMm"), max = dvtNumOf(cs,"maxGpuLengthMm");
      return len > max ? `כרטיס המסך באורך ${len}mm והמארז ${cs.name} מקבל עד ${max}mm. הוא לא ייכנס.` : null;
    }
  },
  {
    id:"gpu-case-length-tight", cats:["gpu","case"], on:"case", level:"warn",
    needs:["gpu.lengthMm","case.maxGpuLengthMm"],
    run:({gpu,cs}) => {
      const len = dvtNumOf(gpu,"lengthMm"), max = dvtNumOf(cs,"maxGpuLengthMm");
      return (len <= max && max - len < 15)
        ? `הכרטיס (${len}mm) כמעט ממלא את המארז (${max}mm) — ההרכבה תהיה צפופה וכבלי ההזנה ילחצו.`
        : null;
    }
  },
  {
    /* כרטיסים עבים תופסים 3 ואפילו 4 חריצי הרחבה. */
    id:"gpu-case-slots", cats:["gpu","case"], on:"case", level:"error",
    needs:["gpu.slotWidth","case.expansionSlots"],
    run:({gpu,cs,q}) => {
      const w = dvtNumOf(gpu,"slotWidth") * q("gpu"), bays = dvtNumOf(cs,"expansionSlots");
      return w > bays
        ? `כרטיס המסך תופס ${w} חריצי הרחבה ובמארז ${cs.name} יש ${bays}.`
        : null;
    }
  },
  {
    /* ⚠️ slotWidth בגיליון הוא מידה ולא ספירה: 2.5 ו-3.5 הם ערכים
       אמיתיים ונפוצים (12 ו-7 כרטיסים בקטלוג). פיזית כרטיס 3.5 חוסם
       ארבעה חריצים — הוא לא "נכנס בשלושה וחצי" — ולכן העיגול כלפי
       מעלה, והשוואה מול הכמות ולא מול המידה הגולמית.
       זו אזהרה ולא חסימה: הכרטיס נכנס, פשוט לא נשאר אחריו כלום. */
    id:"gpu-case-slots-tight", cats:["gpu","case"], on:"case", level:"warn",
    needs:["gpu.slotWidth","case.expansionSlots"],
    run:({gpu,cs,q}) => {
      const raw = dvtNumOf(gpu,"slotWidth") * q("gpu");
      const used = Math.ceil(raw);
      const bays = dvtNumOf(cs,"expansionSlots");
      if(raw > bays) return null;                  // זו כבר שגיאה בחוק שמעל
      return used >= bays
        ? `כרטיס המסך חוסם בפועל ${used} מתוך ${bays} חריצי ההרחבה של ${cs.name}. הוא ייכנס, אבל לא יישאר מקום לכרטיס נוסף כמו רשת או כרטיס קול, והחריץ התחתון יהיה צמוד לרצפת המארז. אם תרצה להוסיף כרטיס בהמשך — כדאי מארז עם יותר חריצים.`
        : null;
    }
  },
  {
    id:"gpu-case-height", cats:["gpu","case"], on:"case", level:"error",
    needs:["gpu.heightMm","case.maxGpuHeightMm"],
    run:({gpu,cs}) => {
      const h = dvtNumOf(gpu,"heightMm"), max = dvtNumOf(cs,"maxGpuHeightMm");
      return h > max
        ? `הכרטיס בעובי/רוחב ${h}mm והמארז מאפשר ${max}mm — הפאנל הצדדי לא ייסגר.`
        : null;
    }
  },

  /* ============ כרטיס מסך ↔ ספק כוח ============ */
  {
    /* ⚠️ ספק חזק מספיק ב-וואטים ועדיין בלי המחבר הנכון = כרטיס שלא
       מקבל חשמל. זו תקלה נפוצה יותר מהספק עצמו. */
    id:"gpu-psu-connectors", cats:["gpu","psu"], on:"psu", level:"error",
    needs:["gpu.powerConnectors","psu.pcieConnectors"],
    /* ⚠️ wants ולא needs: בלי tdpWatts הבדיקה עדיין רצה, רק עם ההנחה
       השמרנית של מתאם 3×8 במקום מספר שנגזר מצריכת הכרטיס. */
    wants:["gpu.tdpWatts"],
    run:({gpu,psu,q}) => {
      const need = dvtConnectors(dvtGet(gpu,"powerConnectors"));
      if(!need) return null;
      const have8 = dvtNumOf(psu,"pcieConnectors") ?? 0;
      const haveVhpwr = dvtBoolOf(psu,"has12vhpwr") === true ? 1 : 0;
      const n = q("gpu");
      if(need.vhpwr * n > 0 && !haveVhpwr){
        // מתאם PCIe → 12VHPWR הוא פתרון לגיטימי ומגיע בקופסה, אבל
        // מספר המחברים שהוא דורש נגזר מצריכת הכרטיס ולא קבוע.
        const per = dvtVhpwrAdapter8pin(gpu);
        if(have8 >= per * n){
          return null;
        }
        return `${gpu.name} מוזן במחבר 12VHPWR. ל-${psu.name} אין מחבר כזה, וגם אין ${per*n} מחברי PCIe 8-פין למתאם שהכרטיס דורש. צריך ספק ATX 3.0 עם 12VHPWR, או ספק עם מספיק מחברי PCIe.`;
      }
      if(need.pcie8 * n > have8){
        return `${gpu.name} דורש ${need.pcie8 * n} מחברי PCIe 8-פין, ול-${psu.name} יש ${have8}.`;
      }
      return null;
    }
  },
  {
    id:"gpu-psu-vhpwr-adapter", cats:["gpu","psu"], on:"psu", level:"info",
    needs:["gpu.powerConnectors","psu.has12vhpwr"],
    run:({gpu,psu}) => {
      const need = dvtConnectors(dvtGet(gpu,"powerConnectors"));
      if(!need || !need.vhpwr) return null;
      return dvtBoolOf(psu,"has12vhpwr") === false
        ? `${gpu.name} יחובר ל-${psu.name} דרך מתאם 12VHPWR שמגיע עם הכרטיס. עובד תקין; ספק ATX 3.0 היה חוסך את המתאם.`
        : null;
    }
  },

  /* ============ ספק כוח ↔ ההרכב כולו ============ */
  {
    id:"psu-wattage", cats:["psu"], on:"psu", level:"error",
    needs:["psu.wattage"],
    /* ⚠️ wants ולא needs: בלי הצריכה של המעבד/הכרטיס האומדן פשוט שותק
       במקום לחסום. הן מופיעות בדוח העמודות כ"משפר דיוק". */
    wants:["cpu.maxTurboWatts","cpu.tdpWatts","gpu.tdpWatts","gpu.recommendedPsuWatts"],
    run:({psu,sel,qty}) => {
      const have = dvtNumOf(psu,"wattage");
      const est = dvtEstimateWatts(sel, qty);
      if(!est.known) return null;
      return have < est.watts
        ? `ספק ${have}W נמוך מהנדרש להרכב הזה (~${est.watts}W). המחשב ייכבה בעומס.`
        : null;
    }
  },
  {
    id:"psu-wattage-tight", cats:["psu"], on:"psu", level:"warn",
    needs:["psu.wattage"],
    wants:["cpu.tdpWatts","gpu.tdpWatts"],
    run:({psu,sel,qty}) => {
      const have = dvtNumOf(psu,"wattage");
      const est = dvtEstimateWatts(sel, qty);
      if(!est.known) return null;
      return (have >= est.watts && have < est.watts * 1.15)
        ? `ספק ${have}W עומד בדיוק בגבול (~${est.watts}W). מומלץ מרווח של 15-20% — גם לשקט וגם לשדרוג עתידי.`
        : null;
    }
  },
  {
    /* ⚠️ במילים של דביר: "ספק כוח יכול להרוס את כל ה-BUILD". דרג 1-2
       הוא הרבע התחתון של הקטלוג (נגזר מהמחיר או מוקלד בגיליון). לא
       חוסמים — הספק עובד — אבל מזהירים, ורק כשההרכב באמת נשען עליו
       (כרטיס מסך מדרג 4+ או צריכה מוערכת מעל 550W). בלי הסינון הזה
       התג היה מופיע על כל מחשב משרדי זול והופך לרעש שאיש לא קורא. */
    id:"psu-quality-tier", cats:["psu"], on:"psu", level:"warn",
    needs:["psu.tier"],
    wants:["gpu.tier","cpu.tdpWatts","gpu.tdpWatts"],
    run:({psu,sel,qty}) => {
      const t = Number(dvtGet(psu,"tier") ?? psu.t ?? 0);
      if(!t || t > 2) return null;
      const gpuT = Number((sel.gpu && (sel.gpu.tier ?? sel.gpu.t)) || 0);
      const est = dvtEstimateWatts(sel, qty);
      return (gpuT >= 4 || (est.known && est.watts >= 550))
        ? `${psu.name} הוא ספק מהדרג הבסיסי, וההרכב הזה יקר ורגיש לאיכות ההזנה. ספק כוח חלש הוא הרכיב היחיד שיכול להרוס את כל שאר המחשב כשהוא נכשל — כאן שווה ספק איכותי עם דירוג 80+ Gold.`
        : null;
    }
  },
  {
    /* 80+ White הוא רצפת היעילות. לא נבדק כשאין דירוג בגיליון —
       "אין נתון" ≠ "ספק גרוע", והדירוג נגזר מהשם עבור 86% מהספקים. */
    id:"psu-quality-eff", cats:["psu","gpu"], on:"psu", level:"info",
    needs:["psu.efficiency","gpu.tdpWatts"],
    run:({psu,gpu}) => {
      const eff = String(dvtGet(psu,"efficiency") || "");
      if(!/white/i.test(eff)) return null;
      return (dvtNumOf(gpu,"tdpWatts") || 0) >= 180
        ? `${psu.name} מדורג ${eff} — דירוג היעילות הנמוך ביותר. למחשב עם כרטיס מסך חזק עדיף 80+ Bronze ומעלה: פחות חום, פחות רעש, ויציבות לאורך זמן.`
        : null;
    }
  },
  {
    id:"psu-sata-power", cats:["psu","storage"], on:"psu", level:"error",
    when:({storage}) => dvtIsSataDrive(storage),
    needs:["psu.sataPowerConnectors"],
    run:({psu,q}) => {
      const have = dvtNumOf(psu,"sataPowerConnectors");
      return q("storage") > have
        ? `נבחרו ${q("storage")} כונני SATA ול-${psu.name} יש ${have} מחברי הזנת SATA.`
        : null;
    }
  },

  /* ============ ספק כוח ↔ מארז ============ */
  {
    id:"psu-case-form", cats:["psu","case"], on:"case", level:"error",
    needs:["psu.formFactor","case.supportedPsuFormFactors"],
    run:({psu,cs}) => {
      const list = dvtArrOf(cs,"supportedPsuFormFactors");
      if(!list.length) return null;
      const f = dvtGet(psu,"formFactor");
      if(dvtPsuFits(list, f) !== "no") return null;
      /* ההבחנה SFX מול SFX-L שווה משפט משלה: אלה לא שני תקנים שונים
         אלא אותו תקן בשני עומקים, והלקוח צריך לדעת מה לחפש במקומו. */
      if(dvtPsuFF(f) === "sfxl" && list.map(dvtPsuFF).includes("sfx")){
        return `${psu.name} הוא SFX-L — עמוק ב-30mm מ-SFX רגיל — והמארז ${cs.name} מקבל SFX בלבד. הכלוב לא ייתן לו להיכנס. חפש ספק שכתוב עליו SFX ולא SFX-L.`;
      }
      return `${psu.name} הוא ${f} והמארז ${cs.name} מקבל ${list.join(", ")}. זה לא אותה תבנית הברגה.`;
    }
  },
  {
    /* ⚠️ מכוון להיות info ולא חסימה: בראקט המתאם מגיע בקופסה של כמעט
       כל ספק SFX, וזו הרכבה שנמכרת כל יום. חסימה כאן הייתה פוסלת
       מכירה תקינה — בדיוק הנזק שהמנוע הזה אמור למנוע. */
    id:"psu-case-form-bracket", cats:["psu","case"], on:"case", level:"info",
    needs:["psu.formFactor","case.supportedPsuFormFactors"],
    run:({psu,cs}) => {
      const list = dvtArrOf(cs,"supportedPsuFormFactors");
      if(!list.length) return null;
      const f = dvtGet(psu,"formFactor");
      return dvtPsuFits(list, f) === "bracket"
        ? `${psu.name} הוא ספק קטן (${f}) והמארז ${cs.name} בנוי לספק ATX. הוא מתחבר דרך בראקט המתאם שמגיע איתו — אני מוודא שהוא בקופסה לפני ההרכבה. ספק ATX רגיל היה נותן לך יותר וואטים לאותו מחיר.`
        : null;
    }
  },
  {
    id:"psu-case-length", cats:["psu","case"], on:"case", level:"error",
    needs:["psu.lengthMm","case.maxPsuLengthMm"],
    run:({psu,cs}) => {
      const len = dvtNumOf(psu,"lengthMm"), max = dvtNumOf(cs,"maxPsuLengthMm");
      return len > max ? `הספק באורך ${len}mm והמארז ${cs.name} מקבל עד ${max}mm.` : null;
    }
  },
  {
    /* ⚠️ המידה במארז היא עד קצה הספק — היא לא מכילה את צרור הכבלים
       שיוצא מאחוריו, וזה עוד 30-40mm בספק מודולרי. לכן זו אזהרה ולא
       הערה: ההרכבה נסגרת, אבל בדחיסה של הכבלים. */
    id:"psu-case-length-tight", cats:["psu","case"], on:"case", level:"warn",
    needs:["psu.lengthMm","case.maxPsuLengthMm"],
    run:({psu,cs}) => {
      const len = dvtNumOf(psu,"lengthMm"), max = dvtNumOf(cs,"maxPsuLengthMm");
      if(!(len <= max && max - len < 20)) return null;
      return `הספק (${len}mm) כמעט ממלא את תא הספק במארז ${cs.name} (${max}mm) — נשארים ${max - len}mm לצרור הכבלים שיוצא מאחוריו. זה נסגר, אבל בדוחק; ספק קצר יותר או מארז שאפשר להזיז בו את כלוב הכוננים יקלו על ההרכבה.`;
    }
  },

  /* ============ קירור ↔ מארז ============ */
  {
    id:"cooling-case-height", cats:["cooling","case"], on:"case", level:"error",
    // לרדיאטור אין "גובה מגדל", וקירור מהקופסה (עד ~70mm) נכנס בכל מארז
    when:({cooling}) => !dvtIsAio(cooling) && !dvtIsStockCooler(cooling),
    needs:["cooling.heightMm","case.maxCoolerHeightMm"],
    run:({cooling,cs}) => {
      const h = dvtNumOf(cooling,"heightMm"), max = dvtNumOf(cs,"maxCoolerHeightMm");
      return h > max ? `גוף הקירור בגובה ${h}mm והמארז ${cs.name} מקבל עד ${max}mm. הפאנל הצדדי לא ייסגר.` : null;
    }
  },
  {
    id:"cooling-case-height-tight", cats:["cooling","case"], on:"case", level:"warn",
    when:({cooling}) => !dvtIsAio(cooling) && !dvtIsStockCooler(cooling),
    needs:["cooling.heightMm","case.maxCoolerHeightMm"],
    run:({cooling,cs}) => {
      const h = dvtNumOf(cooling,"heightMm"), max = dvtNumOf(cs,"maxCoolerHeightMm");
      return (h <= max && max - h < 5)
        ? `גוף הקירור (${h}mm) כמעט נוגע בפאנל (${max}mm). זה נכנס, אבל בלי מרווח.`
        : null;
    }
  },
  {
    /* ⚠️ זו ההערה שקודם הייתה כתובה ידנית על ה-240 בלבד — ולכן 360
       לא נבדק כלל. עכשיו היא מחושבת מהמפרט של המארז. */
    id:"cooling-case-radiator", cats:["cooling","case"], on:"cooling", level:"error",
    when:({cooling}) => dvtIsAio(cooling),
    needs:["cooling.radiatorMm","case.radiatorSupport"],
    run:({cooling,cs}) => {
      const rad = dvtNumOf(cooling,"radiatorMm");
      if(!rad) return null;
      const sup = dvtRadSupport(cs);
      if(!sup) return null;
      const spots = Object.keys(sup).filter(k => sup[k] !== null && sup[k] >= rad);
      if(spots.length) return null;
      const best = Math.max(0, ...Object.values(sup).filter(v => v !== null));
      return `רדיאטור ${rad}mm לא נכנס למארז ${cs.name} (תומך עד ${best}mm).`;
    }
  },
  {
    id:"cooling-case-radiator-single", cats:["cooling","case"], on:"cooling", level:"info",
    when:({cooling}) => dvtIsAio(cooling),
    needs:["cooling.radiatorMm","case.radiatorSupport"],
    run:({cooling,cs}) => {
      const rad = dvtNumOf(cooling,"radiatorMm");
      if(!rad) return null;
      const sup = dvtRadSupport(cs);
      if(!sup) return null;
      const spots = Object.keys(sup).filter(k => sup[k] !== null && sup[k] >= rad);
      return spots.length === 1
        ? `רדיאטור ${rad}mm ייכנס במיקום ה${DVT_RAD_SPOT_HE[spots[0]] || spots[0]} בלבד במארז הזה.`
        : null;
    }
  },
  {
    id:"cooling-case-rad-thickness", cats:["cooling","case"], on:"cooling", level:"warn",
    when:({cooling}) => dvtIsAio(cooling),
    needs:["cooling.radiatorThicknessMm","case.maxRadiatorThicknessMm"],
    run:({cooling,cs}) => {
      const t = dvtNumOf(cooling,"radiatorThicknessMm"), max = dvtNumOf(cs,"maxRadiatorThicknessMm");
      return t > max
        ? `הרדיאטור בעובי ${t}mm (עם מאווררים) והמארז מפנה ${max}mm. ייתכן שיתנגש בלוח האם או בכונים.`
        : null;
    }
  },

  /* ============ מארז ↔ מאווררים ============ */
  {
    /* 🔴 היה `error`, וזה **חסם קטגוריה שלמה**. נמדד בסריקה של 30
       הרכבות על הקטלוג החי: אחרי בחירת מארז מיני-טאואר (2 עמדות
       מאוורר — נפוץ מאוד) כל 10 ערכות המאווררים נחסמו, כי רובן
       ערכות של 3. הלקוח הגיע לשלב המאווררים ומצא רשימה ריקה.

       ⚠️ וזו גם לא הייתה חסימה נכונה: ערכה של 3 מאווררים במארז עם 2
       עמדות אינה אי-אפשרות פיזית — המחשב נבנה ועובד מצוין, פשוט
       נשאר מאוורר אחד בקופסה. לפי הכלל שקבענו (חסימה שמורה למה שלא
       נכנס או לא עולה; בזבוז ועודף הם אזהרה) זו אזהרה.

       ⚠️ הניסוח שונה בהתאם: "חסרות עמדות" נשמע ככשל, בעוד המידע
       שהלקוח באמת צריך הוא כמה מאווררים יישארו לו בלי מקום. */
    id:"case-fans-budget", cats:["case","caseFans"], on:"caseFans", level:"warn",
    needs:["case.fanMounts"],
    run:({sel,qty}) => {
      const b = dvtFanBudget(sel, qty);
      if(b.free === null || b.free >= 0) return null;
      const extra = Math.abs(b.free);
      const radPart = b.usedByRad ? `, והרדיאטור תופס ${b.usedByRad} מהן` : "";
      return `במארז ${b.mounts} עמדות מאוורר${radPart}, והערכה כוללת ${b.kitFans}. ` +
             `אפשר להתקין — ${extra === 1 ? "מאוורר אחד יישאר" : extra + " מאווררים יישארו"} בלי מקום.`;
    }
  },
  {
    id:"case-fans-size", cats:["case","caseFans"], on:"caseFans", level:"error",
    needs:["case.fanSizesMm","caseFans.sizeMm"],
    run:({cs,fans}) => {
      /* dvtFanSizeList ולא dvtArrOf: הגיליון מחזיק "120140" במקום
         "120,140" (פסיק שנבלע כמפריד אלפים) על 25 מארזים — ראה את
         ההערה על הפונקציה. dvtArrOf היה חוסם כאן ערכות תקינות. */
      const sizes = dvtFanSizeList(dvtGet(cs,"fanSizesMm"));
      const want = dvtNumOf(fans,"sizeMm");
      if(!sizes.length || want === null) return null;
      return sizes.includes(want) ? null :
        `${fans.name} הם ${want}mm והמארז ${cs.name} מקבל ${sizes.join("/")}mm.`;
    }
  },
  {
    /* ⚠️ בקשת דביר: לציין מאווררים שכבר מותקנים במארז — הערה בלבד,
       לא חסימה. אין עמודה בגיליון; הכמות נגזרת מהשם ("6PWM Fans",
       "3x120mm"). needs ריק בכוונה: זו לא עמודת גיליון, ושם ששותק
       לא צריך להופיע בדוח החוסרים — פשוט אין הערה. */
    id:"case-included-fans", cats:["case"], on:"caseFans", level:"info",
    needs:[],
    run:({cs,sel}) => {
      const n = dvtNumOf(cs,"includedFans");
      if(!n) return null;
      return `${cs.name} מגיע עם ${n} מאווררים מותקנים מראש` +
             (sel.caseFans ? " — ערכת המאווררים שבחרת מתווספת אליהם." : " — ברוב ההרכבות אין צורך להוסיף ערכה.");
    }
  },
  {
    id:"case-fans-argb-header", cats:["caseFans","mobo"], on:"caseFans", level:"warn",
    needs:["caseFans.argb","mobo.argbHeaders"],
    run:({fans,mobo}) => {
      if(dvtBoolOf(fans,"argb") !== true) return null;
      const headers = dvtNumOf(mobo,"argbHeaders");
      return headers === 0
        ? `ל-${mobo.name} אין חיבור ARGB. המאווררים יאירו בצבע קבוע דרך הבקר שמגיע איתם, בלי סנכרון מהלוח.`
        : null;
    }
  },

  /* ============ מארז ↔ אחסון ============ */
  {
    /* M.2 יושב על הלוח ולא במארז — לכן החוק כולו לא רלוונטי לו. */
    id:"case-storage-bays", cats:["case","storage"], on:"case", level:"error",
    when:({storage}) => dvtIsSataDrive(storage),
    needs:["storage.formFactor"],
    wants:["case.bays25","case.bays35"],
    run:({cs,storage,q}) => {
      const ff = String(dvtGet(storage,"formFactor")).toLowerCase();
      const is35 = /3\.?5/.test(ff);
      const bays = is35 ? dvtNumOf(cs,"bays35") : dvtNumOf(cs,"bays25");
      if(bays === null) return null;
      return q("storage") > bays
        ? `נבחרו ${q("storage")} כוננים בגודל ${is35 ? "3.5" : "2.5"}״ ובמארז ${cs.name} יש ${bays} מקומות.`
        : null;
    }
  },

  /* ============ מארז ↔ חום ההרכב ============ */
  {
    id:"case-airflow", cats:["case","cpu"], on:"case", level:"warn",
    needs:["case.frontPanel","cpu.tdpWatts"],
    run:({cs,cpu,sel}) => {
      const panel = String(dvtGet(cs,"frontPanel")).toLowerCase();
      const tdp = dvtNumOf(cpu,"tdpWatts");
      const gpuW = dvtNumOf(sel.gpu,"tdpWatts") || 0;
      if(!/solid|closed|glass|אטום|זכוכית/.test(panel)) return null;
      return (tdp + gpuW > 350)
        ? `${cs.name} עם פאנל קדמי אטום, וההרכב מייצר מעל 350W חום. שווה מארז עם רשת קדמית או תוספת מאווררים.`
        : null;
    }
  },

  /* ============ קירור ↔ משחה ============ */
  {
    id:"cooling-paste-included", cats:["cooling","paste"], on:"paste", level:"info",
    needs:["cooling.pasteIncluded"],
    run:({cooling,paste}) => (dvtBoolOf(cooling,"pasteIncluded") === true && Number(paste.price) > 0)
      ? `ל-${cooling.name} כבר מצורפת משחה תרמית — משחה נוספת אינה נחוצה.`
      : null
  },
  {
    id:"cooling-paste-missing", cats:["cooling"], on:"paste", level:"warn",
    needs:["cooling.pasteIncluded"],
    run:({cooling,sel}) => {
      if(sel.paste && Number(sel.paste.price) > 0) return null;
      return dvtBoolOf(cooling,"pasteIncluded") === false
        ? `ל-${cooling.name} לא מצורפת משחה תרמית — צריך להוסיף אחת.`
        : null;
    }
  },

  /* ============ איזון מעבד ↔ כרטיס מסך ============ */
  {
    /* לא בעיית תאימות אלא בעיית כסף: אחד מהשניים מגביל את השני. */
    id:"cpu-gpu-balance", cats:["cpu","gpu"], on:"cpu", level:"info",
    needs:[],
    run:({cpu,gpu}) => {
      const c = Number(cpu.t || cpu.tier || 0), g = Number(gpu.t || gpu.tier || 0);
      if(!c || !g) return null;
      if(g - c >= 2) return `${gpu.name} חזק משמעותית מ-${cpu.name}. במשחקים ברזולוציה נמוכה המעבד יגביל את הכרטיס — שווה לשקול מעבד חזק יותר או כרטיס זול יותר.`;
      if(c - g >= 2) return `${cpu.name} חזק משמעותית מ-${gpu.name}. אם המחשב מיועד למשחקים, אותו תקציב בכרטיס מסך ייתן יותר.`;
      return null;
    }
  }
];

/* =====================================================================
   6. הרצת המטריצה
===================================================================== */
/* ==================== שם קצר להודעות ====================
   🔴 הבעיה: שמות הקטלוג ארוכים מאוד — **59 מתוך 59 המעבדים ו-133
   מתוך 138 הלוחות מעל 45 תווים** — והם מוטמעים בתוך משפטי ההודעות.
   התוצאה נראית כך:

     "מארז ללא ספק ANTEC VSK3000B-U3 Mini TOWER mini-ATX CASE
      מגיע עם 1 מאוורר..."

   הלקוח צריך לחצות שמונה מילים לפני שהוא מגיע למידע. דביר על אותה
   הודעה: "מארז ללא ספק? מה זה בכלל".

   ⚠️ הפתרון הוא **לא** לשנות את הקטלוג. השם בגיליון הוא שם המוצר של
   הספק וצריך להישאר כפי שהוא — כאן מקצרים לתצוגה בלבד, ורק את
   קידומת הקטגוריה בעברית ("מארז ללא ספק", "כרטיס מסך", "מעבד"),
   שממילא ידועה מההקשר: ההודעה כבר יושבת על כרטיס בקטגוריה הזו.

   ⚠️ **שני תנאי בטיחות**, בלעדיהם זה שובר דברים:
     1. שם בלי אותיות לטיניות כלל נשאר שלם. פריטי-הדמה של הבונה
        ("ללא כרטיס מסך", "קירור בסיסי שמגיע עם המעבד") הם עברית
        מלאה, וחיתוך עד לאות הלטינית הראשונה היה מוחק אותם.
     2. קידומת של יותר מ-4 מילים לא נחתכת — שם חריג לא ייפגע.

   ⚠️ החיתוך חל על `name` בתוך ה-ctx של החוקים בלבד. הפרסרים שקוראים
   את השם (dvtCpuIgpuFromName, dvtCoolerIncluded, dvtCaseFansFromName,
   dvtGpuIsWorkstation) מחפשים תבניות לטיניות — Tray / No Fan / BOX /
   RTX PRO — ולכן הסרת קידומת עברית אינה נוגעת בהם. */
function dvtShortName(name){
  const n = String(name || "");
  if(!/[A-Za-z]/.test(n)) return n;                    // עברית בלבד — לא נוגעים
  const i = n.search(/[A-Za-z0-9]/);
  if(i <= 0) return n;
  const prefix = n.slice(0, i).trim();
  if(!prefix) return n;
  if(/[A-Za-z]/.test(prefix)) return n;
  if(prefix.split(/\s+/).length > 4) return n;             // קידומת חריגה — משאירים
  return n.slice(i).trim() || n;
}

function dvtRuleCtx(sel, qty){
  const q = c => Math.max(1, Number((qty||{})[c]) || 1);
  /* עותק רדוד לכל פריט עם שם מקוצר. ⚠️ עותק ולא שינוי במקום — הפריט
     עצמו מגיע מהקטלוג המשותף, ודריסת `name` שם הייתה משנה את השם
     בכל האתר. `rawName` נשמר למי שיצטרך את המקור. */
  const short = {};
  Object.keys(sel || {}).forEach(k => {
    const it = sel[k];
    if(it && typeof it === "object" && it.name)
      short[k] = Object.assign({}, it, { name: dvtShortName(it.name), rawName: it.name });
    else short[k] = it;
  });
  return Object.assign({}, short, {
    cs: short.case, fans: short.caseFans, cooling: short.cooling,
    sel: short, qty, q
  });
}

/* בודק שכל השדות ש-needs מבקש באמת קיימים. מחזיר את החסרים. */
function dvtMissingFor(rule, sel){
  const miss = [];
  (rule.needs || []).forEach(path => {
    const [cat, field] = path.split(".");
    const item = cat === "case" ? sel.case : sel[cat];
    if(!item) return;                       // הקטגוריה לא נבחרה — לא חסר, פשוט לא רלוונטי
    if(field === "radiatorSupport"){ if(!dvtRadSupport(item)) miss.push(path); return; }
    if(dvtGet(item, field) === undefined) miss.push(path);
  });
  return miss;
}

function dvtFieldLabel(path){
  const [cat, field] = path.split(".");
  return `${field} (${DVT_CAT_LABELS[cat] || cat})`;
}

/* ==================== רמת הממצא: הרכב או מוצר ====================
   🔴 הבקשה של דביר: "הלקוח בחר א' — עכשיו הוא על ב'. האם ב' מתאים
   לא'?" ובנפרד: "את השגיאות על ההרכב הכללי צריך להיות למטה/בצד ולא
   על כל מוצר".

   שני סוגי ממצאים שהיו מעורבבים:

   **ממצא מוצר** — "המעבד AM5 והלוח LGA1700 לא מתחברים". אמירה על
   הפריט הזה מול מה ש**כבר נבחר**. מקומו על כרטיס המוצר.

   **ממצא הרכב** — "למעבד אין גרפיקה מובנית ולא נבחר כרטיס מסך".
   זו אמירה על ההרכבה כשלמה, והיא נפתרת ברגע שהלקוח יבחר את הרכיב
   החסר. מקומה בסיכום ההרכבה למטה.

   🔴 המחיר של הערבוב, נמדד על הקטלוג החי: **39 מתוך 48 המעבדים**
   נצבעו אדום ב"בונה ריק — לפני שהלקוח בחר משהו. הלקוח רואה קטלוג
   שכולו פסול ומסיק שאין לו מה לבחור.

   ⚠️ הסיווג **נגזר ולא נכתב ידנית**: חוק שה-`on` שלו אינו ב-`cats`
   שלו מייחס את הממצא לרכיב שהוא כלל לא דורש שייבחר — וזו בדיוק
   ההגדרה של ממצא-הרכב. אותו עיקרון כמו dvtRequiredColumns: תיוג
   ידני מתיישן ברגע שמישהו מוסיף חוק ושוכח לתייג.

   כרגע נגזרים כך 5 חוקים: cpu-igpu-no-gpu, cpu-no-cooler,
   mobo-wifi-missing, case-included-fans, cooling-paste-missing. */
function dvtRuleScope(rule){
  const cats = rule.cats || [];
  return cats.indexOf(rule.on) > -1 ? "item" : "build";
}

function dvtCheckBuild(sel, qty){
  sel = sel || {}; qty = qty || {};
  const out = [];
  const missing = new Set();
  const ctx = dvtRuleCtx(sel, qty);

  DVT_RULES.forEach(rule => {
    // כל הקטגוריות שהחוק דורש חייבות להיות בחורות
    if((rule.cats || []).some(c => !sel[c])) return;
    // ...והחוק חייב להיות רלוונטי לבחירה (לפני בדיקת השדות!)
    if(rule.when){ let ok = false; try{ ok = !!rule.when(ctx); }catch(e){ ok = false; } if(!ok) return; }
    const miss = dvtMissingFor(rule, sel);
    if(miss.length){ miss.forEach(m => missing.add(dvtFieldLabel(m))); return; }
    let text = null;
    try{ text = rule.run(ctx); }
    catch(e){ /* חוק בודד שנפל לא מפיל את כל הבדיקה */ return; }
    if(text) out.push({ level: rule.level, cat: rule.on, text, id: rule.id,
                        scope: dvtRuleScope(rule) });
  });

  // כמות מעבדים מעבר לתקרה — נגזרת ולא חוק זוגי
  const cpuMax = dvtMaxQty("cpu", sel);
  const cpuQ = Math.max(1, Number(qty.cpu) || 1);
  if(sel.cpu && cpuQ > cpuMax){
    // ממצא-מוצר: הוא מדבר על המעבד שנבחר מול הלוח שנבחר
    out.push({ level:"error", cat:"cpu", id:"cpu-qty", scope:"item",
      text:`הלוח שנבחר תומך ב-${cpuMax} מעבד${cpuMax>1?"ים":""} בלבד. מחשב ביתי כמעט תמיד עם מעבד אחד.` });
  }

  out.sort((a,b) => DVT_LEVEL_RANK[b.level] - DVT_LEVEL_RANK[a.level]);
  return { issues: out, missingFields: [...missing].sort(),
           errors: out.filter(i => i.level === "error").length,
           warns:  out.filter(i => i.level === "warn").length,
           watts:  dvtEstimateWatts(sel, qty) };
}

/* ---------------------------------------------------------------
   7. סינון והמלצה בבורר
   ---------------------------------------------------------------
   "מה יישבר אם אבחר דווקא את המוצר הזה".

   ⚠️ ההשוואה היא מול ההרכב *בלי* הקטגוריה הזו, ורק ממצאים חדשים
   נזקפים למועמד. בלי זה כל כרטיסי המסך ברשימה היו מסומנים באדום עם
   "הלוח לא נכנס למארז" — בעיה קיימת שאין לה שום קשר לבחירת הכרטיס,
   והלקוח היה חושב שאין שום כרטיס מתאים. */
function dvtBaseline(cat, sel, qty){
  const base = Object.assign({}, sel || {});
  delete base[cat];
  return { base, keys: new Set(dvtCheckBuild(base, qty).issues.map(i => i.id + "|" + i.text)) };
}

/* baseline אופציונלי — dvtRankOptions מחשב אותו פעם אחת לכל הרשימה
   במקום פעמיים לכל פריט. */
function dvtRateOption(cat, item, sel, qty, baseline){
  const { base, keys: baseKeys } = baseline || dvtBaseline(cat, sel, qty);

  const trial = Object.assign({}, base, { [cat]: item });
  const r = dvtCheckBuild(trial, qty);
  const fresh = r.issues.filter(i => !baseKeys.has(i.id + "|" + i.text));

  /* 🔴 לב השינוי (A2/A4): פסק הדין על המוצר נגזר **רק** מממצאי-מוצר.
     ממצא-הרכב עדיין קיים ועדיין חשוב — הוא פשוט מדווח בסיכום ההרכבה
     ולא צובע באדום כל מעבד ברשימה בגלל רכיב שהלקוח עוד לא הגיע אליו.

     ⚠️ המשמעות המעשית: פריט נחסם רק ממה שכבר נבחר. בונה ריק לא חוסם
     כלום — אין מול מה. */
  const mine  = fresh.filter(i => i.scope !== "build");
  const build = fresh.filter(i => i.scope === "build");

  const top = mine[0] || null;
  return {
    level: top ? top.level : "ok",
    text: top ? top.text : null,
    blocked: mine.some(x => x.level === "error"),
    issues: mine,
    /* נשמר כדי שהממשק יוכל להסביר "יחסר לך קירור" כהערה רכה על
       הפריט, בלי שזה ייחשב אי-התאמה. */
    buildIssues: build
  };
}

/* ---------------------------------------------------------------
   המלצה לפי סוג השימוש שהלקוח בחר
   ---------------------------------------------------------------
   ⚠️ זה **לא** חלק ממנוע התאימות. תאימות אומרת "נכנס / לא נכנס"
   ועובדת על עובדות פיזיות; ההמלצה כאן אומרת "שווה לך בשביל מה
   שאמרת שאתה עושה", וזו שאלה אחרת לגמרי. לכן היא בפונקציה נפרדת
   ולא כחוק ב-DVT_RULES.

   ⚠️ **הרף גבוה בכוונה.** תג "מומלץ לגיימינג" שמתנוסס על כל כרטיס
   מסך בקטלוג לא אומר כלום ורק שוחק אמון. מסמנים רק פריט שבאמת מעל
   הרף לשימוש הזה, ורק כשהשדה שעליו נשענים קיים בגיליון — שדה חסר
   מחזיר null ולא ניחוש. */
const DVT_USE_LABEL = {
  gaming:   "מומלץ לגיימינג",
  creative: "מומלץ לעריכה ויצירה",
  office:   "מתאים לעבודה משרדית",
  general:  "מתאים לשימוש כללי"
};

/* ==================== כרטיס תחנת עבודה מול כרטיס גיימינג ====================
   🔴 דביר: "איך כ.המסך האלה מומלצים לגיימינג?" — ובצדק. שמונה כרטיסי
   **תחנת עבודה** נשאו את התג: RTX PRO 2000/4000/5000 ו-Radeon Pro
   W7800/W7900. הם יקרים מאוד, והם לא כרטיסי גיימינג.

   ⚠️ למה זה קרה: ההמלצה נשענה על `tier` בלבד, ובדרג 5 יושבים גם
   RTX 5090 וגם RTX PRO 5000. הדרג מודד עוצמה, והם באמת חזקים —
   אבל "חזק" ו"מתאים לגיימינג" אינם אותה שאלה. הכרטיסים האלה מכוונים
   ל-CAD, רינדור ו-AI: הדרייברים והאופטימיזציה שלהם לשם, המחיר לפריים
   גרוע בהרבה מכרטיס גיימינג באותו כסף, וחלקם אפילו איטיים יותר
   במשחקים מכרטיס זול משמעותית.

   ⚠️ **טעות יקרה במיוחד**: לקוח שסומך על התג עלול לשלם אלפי שקלים
   מיותרים ולקבל ביצועי משחק נמוכים יותר.

   הם כן מקבלים "מומלץ לעריכה ויצירה" — שם הם באמת הבחירה הנכונה. */
function dvtGpuIsWorkstation(name){
  const n = String(name || "");
  return /RTX\s*PRO\s*\d{4}/i.test(n)      // RTX PRO 2000/4000/5000/6000
      || /QUADRO/i.test(n)
      || /RADEON\s*PRO/i.test(n)                 // Radeon Pro W-series
      || /\bW7[89]\d{2}\b/i.test(n)                  // W7800 / W7900
      || /\bRTX\s*A\d{4}\b/i.test(n)               // RTX A4000 וכו'
      || /\bNVS\b/i.test(n)
      || /\bT(?:400|600|1000)\b/i.test(n);
}

function dvtRecommendFor(cat, it, useCase){
  if(!it || !useCase || !DVT_USE_LABEL[useCase]) return null;
  const t    = Number(it.tier ?? it.t ?? 0);
  const num  = f => dvtNumOf(it, f);
  const gb   = num("capacityGb");
  const ok   = () => DVT_USE_LABEL[useCase];

  /* ⚠️ **ספק כוח לא מקבל תג המלצה בשום שימוש, בכוונה.** הרף הטבעי
     (650W ומעלה) תפס 68 מתוך 77 הספקים בקטלוג — תג שמופיע על 88%
     מהרשימה הוא רעש. וחשוב מזה: התאמת ספק לכרטיס המסך היא ממילא חוק
     במנוע (`gpu-psu-wattage`), והוא מדויק יותר מכל רף גורף.
     אותו שיקול הוציא את `storage` מ"משרדי" ומ"כללי": כל NVMe עונה,
     ולכן אין שם מידע. */

  if(useCase === "gaming"){
    if(cat === "gpu")     return (t >= 4 && !dvtGpuIsWorkstation(it.name)) ? ok() : null;
    if(cat === "cpu")     return (t >= 3 && (num("cores") || 0) >= 6) ? ok() : null;
    if(cat === "ram")     return (gb >= 32 && (num("speedMhz") || 0) >= 6000) ? ok() : null;
    if(cat === "storage") return (dvtIsNvmeDrive(it) && (num("pcieGen") || 0) >= 4 && gb >= 1000) ? ok() : null;
    if(cat === "cooling") return (num("tdpRating") || 0) >= 180 ? ok() : null;
    return null;
  }
  if(useCase === "creative"){
    // עריכה נשענת על ליבות, זיכרון ואחסון מהיר — לא על ה-GPU לבדו
    if(cat === "cpu")     return (num("cores") || 0) >= 12 ? ok() : null;
    if(cat === "ram")     return gb >= 64 ? ok() : null;
    if(cat === "storage") return (dvtIsNvmeDrive(it) && gb >= 2000) ? ok() : null;
    /* ⚠️ כרטיס תחנת עבודה נכנס גם בלי `vramGb` בגיליון: הוא נבנה
       בדיוק לשימוש הזה, וחבל שההמלצה תיפול על שדה חסר. */
    if(cat === "gpu")     return ((num("vramGb") || 0) >= 16 ||
                                  (dvtGpuIsWorkstation(it.name) && t >= 4)) ? ok() : null;
    return null;
  }
  if(useCase === "office"){
    /* ⚠️ כאן ההמלצה הפוכה מהאינטואיציה: למשרד עדיף מעבד **עם** גרפיקה
       מובנית, כי הוא חוסך כרטיס מסך לגמרי. תג על מעבד יקר בלי iGPU
       היה דוחף את הלקוח בדיוק לכיוון הלא נכון. */
    if(cat === "cpu")     return (dvtBoolOf(it, "hasIgpu") && t <= 3) ? ok() : null;
    if(cat === "ram")     return (gb >= 8 && gb <= 16) ? ok() : null;
    return null;
  }
  if(useCase === "general"){
    if(cat === "cpu")     return (t >= 2 && t <= 3) ? ok() : null;
    /* 16GB בדיוק ולא "16 ומעלה": הטווח הרחב תפס 125 מתוך 147 הזיכרונות,
       וזה חוזר לאותו רעש. לשימוש כללי 16GB היא נקודת המתיקות — 64GB
       זה כסף מבוזבז ולא "מומלץ". */
    if(cat === "ram")     return gb === 16 ? ok() : null;
    return null;
  }
  return null;
}

/* רשימה מדורגת: תואמים קודם, חסומים בסוף — בלי להסתיר כלום.
   ⚠️ בכוונה *לא* מסננים החוצה: לקוח שלא מוצא מוצר שהוא מכיר חושב
   שהאתר שבור. עדיף להראות אותו מסומן ועם הסבר למה הוא לא מתאים. */
function dvtRankOptions(cat, items, sel, qty, useCase){
  const baseline = dvtBaseline(cat, sel, qty);
  return (items || []).map(it => {
    const v = dvtRateOption(cat, it, sel, qty, baseline);
    return Object.assign({}, it, { __compat: v, __rec: dvtRecommendFor(cat, it, useCase) });
  }).sort((a,b) => {
    const rank = x => x.__compat.blocked ? 2 : (x.__compat.level === "warn" ? 1 : 0);
    const d = rank(a) - rank(b);
    if(d !== 0) return d;
    // בתוך אותה רמת תאימות — המומלצים לשימוש שנבחר עולים למעלה
    return (b.__rec ? 1 : 0) - (a.__rec ? 1 : 0);
  });
}

/* ---------------------------------------------------------------
   8. אילו עמודות הגיליון צריך — נגזר מהחוקים עצמם
   ---------------------------------------------------------------
   ⚠️ בכוונה נגזר ולא כתוב ידנית: תיעוד שמתחזקים בנפרד מהקוד מתיישן,
   ואז מוסיפים לגיליון עמודה שאף אחד לא קורא. dvtRequiredColumns()
   הוא מקור האמת ל-DVT-SHEET-COLUMNS.md. */
function dvtRequiredColumns(){
  const byCat = {};
  const note = (path, rule, required) => {
    const [cat, field] = path.split(".");
    byCat[cat] = byCat[cat] || {};
    const e = byCat[cat][field] = byCat[cat][field] ||
      { field, cat, rules: [], levels: new Set(), required: false };
    e.rules.push(rule.id);
    e.levels.add(rule.level);
    if(required) e.required = true;        // needs של חוק אחד גובר על wants של אחר
  };
  DVT_RULES.forEach(rule => {
    (rule.needs || []).forEach(p => note(p, rule, true));
    (rule.wants || []).forEach(p => note(p, rule, false));
  });
  return Object.keys(byCat).sort().map(cat => ({
    cat, label: DVT_CAT_LABELS[cat] || cat,
    fields: Object.values(byCat[cat])
      .map(f => ({ field:f.field, rules:f.rules, levels:[...f.levels], required:f.required }))
      .sort((a,b) => (Number(b.required) - Number(a.required)) || a.field.localeCompare(b.field))
  }));
}

/* אילו צמדי קטגוריות מכוסים — לבדיקת שלמות המטריצה. */
function dvtCoverageMatrix(){
  const pairs = {};
  DVT_RULES.forEach(r => {
    const cats = (r.cats || []).slice().sort();
    const key = cats.join("↔") || "(כללי)";
    (pairs[key] = pairs[key] || []).push(r.id);
  });
  return pairs;
}

/* =====================================================================
   9. ניקוד ההרכבה — מחליף את ניתוח ה-AI. הכל מחושב מקומית, בלי עלות
   ובלי המתנה: כל ציון נגזר מהרכיבים עצמם ומהשימוש שהלקוח בחר.
===================================================================== */
const DVT_SCORE_TOPICS = [
  { key:"gaming",  label:"משחקים" },
  { key:"editing", label:"עריכה ויצירה" },
  { key:"cooling", label:"קירור ורעש" },
  { key:"upgrade", label:"מוכנות לשדרוג" },
  { key:"value",   label:"תמורה למחיר" }
];

function dvtScoreBuild(sel, qty){
  sel = sel || {};
  const t = c => Number((sel[c] && (sel[c].tier ?? sel[c].t)) || 0);   // דרג 1-5
  const pct = v => Math.max(0, Math.min(100, Math.round(v)));
  const q = c => Math.max(1, Number((qty||{})[c]) || 1);

  const gpuT = t("gpu"), cpuT = t("cpu"), ramT = t("ram"),
        stT = t("storage"), coolT = t("cooling"), moboT = t("mobo");

  const ramGb = dvtNumOf(sel.ram, "capacityGb") || (ramT * 16);

  const scores = {
    // משחקים: כרטיס המסך הוא המכריע, המעבד תומך
    gaming:  pct(gpuT * 16 + cpuT * 4),
    // עריכה: מעבד + זיכרון + אחסון מהיר
    editing: pct(cpuT * 11 + Math.min(ramGb, 64) / 64 * 45 + stT * 5),
    // קירור: דרג הקירור מול חום המעבד
    cooling: pct(coolT * 17 + (dvtNumOf(sel.cpu, "tdpWatts") > 150 ? -12 : 6) + 10),
    // שדרוג: לוח אם, ספק כוח ומקום פנוי
    upgrade: pct(moboT * 12 + t("psu") * 8 + t("case") * 6),
    value:   0
  };

  // תמורה למחיר: כמה "ביצועים" יצאו לכל שקל, מנורמל לטווח סביר
  let total = 0;
  Object.keys(sel).forEach(c => { const it = sel[c]; if(it && it.price) total += Number(it.price) * q(c); });
  const perf = (gpuT * 2 + cpuT * 2 + ramT + stT);
  scores.value = total > 0 ? pct((perf / (total / 1000)) * 12) : 0;

  const overall = Math.round(
    (scores.gaming * 0.3 + scores.editing * 0.2 + scores.cooling * 0.2 +
     scores.upgrade * 0.15 + scores.value * 0.15)
  );

  return { topics: DVT_SCORE_TOPICS.map(x => ({ ...x, score: scores[x.key] })), overall };
}

/* =====================================================================
   10. הסרה אוטומטית של רכיב שכבר לא מתאים
   =====================================================================
   דרישת דביר: אם שינוי ברכיב א' גורם לכך שרכיב ב' שכבר נבחר לא מתאים
   יותר — רכיב ב' יוסר אוטומטית עם הודעה ברורה. לעולם לא משאירים הרכבה
   שבורה בשקט: הלקוח שממשיך ממנה לתשלום מקבל מחשב שלא נדלק.

   ⚠️ **רשימה סגורה של חוקים, בכוונה.** מסירים רק על התנגשות פיזית
   בין שני רכיבים שנבחרו (שקע, תקן זיכרון, מידות, מחברים). שגיאות
   "חסר רכיב" (מעבד F בלי כרטיס מסך) לא מסירות כלום — הן נפתרות
   בבחירה, לא במחיקה. וחוקים תלויי-כמות (mobo-ram-slots) מוחרגים:
   העלאת כמות לא אמורה להעיף את הלוח, ו-dvtMaxQty ממילא חוסם אותה. */
const DVT_AUTO_REMOVE_RULES = new Set([
  "cpu-mobo-socket", "mobo-ram-type", "mobo-case-form", "cpu-cooling-socket",
  "gpu-case-length", "gpu-case-height", "cooling-case-height", "cooling-case-radiator",
  "psu-case-form", "psu-case-length", "ram-cooling-clearance", "cpu-cooling-tdp",
  "gpu-psu-connectors", "mobo-ram-capacity", "cooling-stock-needs-cpu"
]);

/* מי נשאר כשיש התנגשות: הרכיב המרכזי יותר. מעבד גובר על לוח, לוח על
   מארז וכו' — כי סביר שהלקוח בחר את היקר/החשוב קודם ובנה סביבו. */
const DVT_CAT_KEEP_ORDER = ["cpu","mobo","gpu","ram","case","psu","cooling","storage","caseFans","wifi","paste","extras"];

function dvtInvalidateSelection(sel, qty, keepCat){
  const cur = Object.assign({}, sel || {});
  const removed = [];
  const byId = {};
  DVT_RULES.forEach(r => { byId[r.id] = r; });

  /* לולאה כי הסרה יכולה לחשוף התנגשות הבאה בתור; הגבול מונע לולאה
     אינסופית אם חוק עתידי יתנהג לא צפוי. */
  for(let guard = 0; guard < 12; guard++){
    const res = dvtCheckBuild(cur, qty);
    const conflict = res.issues.find(i => {
      if(i.level !== "error" || !DVT_AUTO_REMOVE_RULES.has(i.id)) return false;
      const rule = byId[i.id];
      return rule && (rule.cats || []).length > 0 && (rule.cats || []).every(c => !!cur[c]);
    });
    if(!conflict) break;
    const cats = (byId[conflict.id].cats || []).filter(c => c !== keepCat);
    const drop = cats.slice().sort((a,b) =>
      DVT_CAT_KEEP_ORDER.indexOf(b) - DVT_CAT_KEEP_ORDER.indexOf(a))[0];
    if(!drop || !cur[drop]) break;
    removed.push({ cat: drop, item: cur[drop], reason: conflict.text, ruleId: conflict.id });
    delete cur[drop];
  }
  return { sel: cur, removed };
}

/* =====================================================================
   11. בדיקת עגלה — אותו מנוע, בלי הבונה (dvtCheckBuildCompat)
   =====================================================================
   לקוח שאסף רכיבים ידנית מהקטלוג מקבל הרכבה חינם בדף התשלום — ולכן
   העגלה שלו חייבת לעבור את **אותו** מנוע בדיוק, לא בדיקה מקבילה
   שתתפצל ממנו ביום שיתווסף חוק. הפונקציה טהורה: שורות עגלה + קטלוג
   נכנסים, תוצאת dvtCheckBuild יוצאת. בלי DOM ובלי תלות בדף הבונה —
   checkout.js טוען את הקובץ הזה לבדו.

   items: [{sku:"cpu:CPU-1023", qty:1} | {type:"build", parts:[...]}]
   catalog: {cpu:{items:[...]}, ...} — אם לא סופק, ננסה את מטמון
   ה-localStorage שכל דפי האתר חולקים.

   ⚠️ שני מוצרים *שונים* מאותה קטגוריה (שני מעבדים שונים בעגלה):
   נבדק הראשון, והשני מדווח ב-duplicates — שהמסך יגיד את זה ללקוח
   במקום לבדוק בשקט רק חצי עגלה. */
function dvtCheckBuildCompat(items, catalog){
  catalog = catalog || dvtCompatCatalogFromCache_();
  const index = {};
  if(catalog){
    Object.keys(catalog).forEach(cat => {
      const g = catalog[cat];
      const list = (g && Array.isArray(g.items)) ? g.items : (Array.isArray(g) ? g : []);
      list.forEach(it => { if(it && it.id !== undefined) index[cat + ":" + it.id] = { cat, it }; });
    });
  }
  const sel = {}, qty = {}, unknown = [], duplicates = [];
  const addSku = (sku, n) => {
    const hit = index[String(sku)];
    if(!hit){ unknown.push(String(sku)); return; }
    if(!sel[hit.cat]){ sel[hit.cat] = hit.it; qty[hit.cat] = n; }
    else if(String(sel[hit.cat].id) === String(hit.it.id)){ qty[hit.cat] += n; }
    else duplicates.push({ cat: hit.cat, name: hit.it.name });
  };
  (items || []).forEach(i => {
    if(!i) return;
    // sku בלי נקודתיים ("assembly-included", שורות שירות) אינו מוצר קטלוג
    if(typeof i.sku === "string" && i.sku.indexOf(":") > 0) addSku(i.sku, Math.max(1, Number(i.qty) || 1));
    if(Array.isArray(i.parts)) i.parts.forEach(p => {
      if(p && typeof p.sku === "string" && p.sku.indexOf(":") > 0) addSku(p.sku, Math.max(1, Number(p.qty) || 1));
    });
  });
  const r = dvtCheckBuild(sel, qty);
  return Object.assign(r, { sel, qty, unknown, duplicates });
}

function dvtCompatCatalogFromCache_(){
  try{
    if(typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem("dvirtech_catalog_v1");
    if(!raw) return null;
    const o = JSON.parse(raw);
    return o && o.catalog ? o.catalog : null;
  }catch(e){ return null; }
}

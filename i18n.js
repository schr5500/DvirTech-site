/* =====================================================================
   DvirTech — קובץ תרגומים (עברית / אנגלית)
   =====================================================================
   כל טקסט קבוע של האתר (לא נתוני מוצר — אלו ב-catalog.js) חי כאן.
   LANG הוא המצב הגלובלי הנוכחי ('he' או 'en'). שינוי שפה קורא ל-setLang()
   שנמצא ב-app.js (כי הוא צריך לרנדר מחדש את כל האתר).
===================================================================== */

let LANG = "he";
try { LANG = localStorage.getItem("dvirtech_lang") || "he"; } catch(e) { /* storage unavailable — default to Hebrew */ }

function tr(he, en){ return LANG === "en" ? en : he; }

/* Core language switch shared by every page: updates state + <html> attrs + storage.
   Each page defines its own setLang(lang) wrapper that calls this and then re-renders itself. */
function setLangCore(lang){
  LANG = lang;
  try { localStorage.setItem("dvirtech_lang", lang); } catch(e) { /* storage unavailable — language just won't persist */ }
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
}

const UI_TEXT = {
  he: {
    navReady:"מחשבים מוכנים", navBuilder:"בונה המחשבים", navPeripherals:"ציוד היקפי",
    navLab:"מעבדה ושירות", navContact:"צור קשר",
    heroTitle:"בנה את המחשב שלך", heroTitleHighlight:"צעד־אחר־צעד",
    heroSubtitle:"בחר רכיבים תואמים בלבד, קבל מחיר מדויק בזמן אמת, תרשים חי שמתמלא לפי הבחירות שלך, וניתוח AI שמסביר למה ההרכבה מתאימה לך.",
    trustWarranty:"אחריות יבואן רשמי", trustStress:"בדיקת מאמץ לפני מסירה",
    trustSupport:"מענה אנושי ישיר מול המרכיב", trustShipping:"משלוח או איסוף עצמי",
    summaryTitle:"📋 סיכום ההרכבה", summarySubtitle:"מתעדכן אוטומטית לפי הבחירות שלך",
    totalLabel:"סה\"כ", diagramTitle:"🖥️ ההרכבה שלך — מתמלאת בזמן אמת",
    useCaseLabel:"מה מטרת השימוש העיקרית?", resolutionLabel:"רזולוציית משחק",
    analyzeBtn:"✨ נתח את המערכת עם AI", analyzeBtnSub:"(סיכום מותאם אישית)",
    whatsappBtn:"💬 שלח הזמנה בוואטסאפ", aiLoadingText:"מריץ ניתוח...",
    footerText:"DvirTech © 2026 — הרכבה מקצועית, אחריות רשמית, יחס אישי.",
    notSelected:"טרם נבחר", addBtn:"הוסף", oneOption:"בחר אפשרות אחת", optional:"אופציונלי",
    lockMobo:"בחר קודם מעבד (שלב 1) כדי לראות לוחות אם תואמים ⬆",
    gpuSubWithCpu:"כרטיסים שמתאימים הכי טוב למעבד, לספק הכוח ולמארז שנבחרו מסומנים ומדורגים ראשונים.",
    gpuSubNoCpu:"בחר מעבד לקבלת המלצה מותאמת אישית — אפשר גם לבחור כרטיס כבר עכשיו.",
    coolingSub:"מסונן לפי תושבת המעבד ולפי המארז שנבחר, ומדורג לפי יכולת הפיזור מול חום המעבד.",
    psuSub:"מדורג לפי ההספק הנדרש לכרטיס המסך שנבחר.",
    caseSub:"מסונן לפי אורך כרטיס המסך וגודל הקירור שנבחרו.",
    ramCpuSub:"בחר אפשרות אחת — ניתן להגדיל כמות בסיכום ההרכבה אם הלוח אם תומך.",
    validationPrefix:"כדי להמשיך, השלם עוד:", aiErrorMsg:"⚠️ לא הצלחנו לקבל ניתוח כרגע. נסה שוב בעוד רגע.",
    fpsHeading:"הערכת ביצועים", fpsNote:"* הערכה משוערת המבוססת על חיפוש בנקודות ייחוס פומביות. ביצועים בפועל עשויים להשתנות.",
    highSettings:"הגדרות גבוהות",
    included:"כלול",
    filterExplainer:"💡 המערכת מסננת ומדרגת רכיבים בזמן אמת לפי התאמה פיזית וביצועית להרכב שלך — זו הסיבה שאפשרויות מסוימות משתנות או נעלמות תוך כדי הבחירה.",
    qtyLimitRam:"מקסימום לפי חריצי ה-RAM בלוח האם שנבחר",
    qtyLimitCpu:"מקסימום לפי מספר תושבות המעבד בלוח האם שנבחר",
    qtyLimitStorage:"מקסימום לפי חריצי ה-M.2 בלוח האם שנבחר",
    qtyLimitDefault:"בחר לוח אם כדי לראות את המקסימום המדויק",
    resOptions:{ "1080p":"1080p (Full HD)", "1440p":"1440p (2K)", "4K":"4K (Ultra HD)" },
    landingServiceHeading:"באיזה שירות נוכל לעזור לך היום?",
    landingServiceSub:"בחר את מה שהכי מתאים לך — תמיד אפשר לשנות אחר כך",
    changeLanguage:"↺ שנה שפה",
    serviceBuilderTitle:"בניית מחשב בהתאמה אישית", serviceBuilderDesc:"בחר רכיבים תואמים צעד־אחר־צעד, וקבל הרכבה שמתאימה בדיוק לך",
    serviceCatalogTitle:"מחשבים ומוצרים מהקטלוג", serviceCatalogDesc:"עיין במחשבים מוכנים ובציוד היקפי הזמינים למשלוח",
    serviceSupportTitle:"תמיכה טכנית", serviceSupportDesc:"יש לך תקלה או שאלה על מחשב קיים? אנחנו כאן בשבילך",
    serviceContactTitle:"יצירת קשר", serviceContactDesc:"שאלה כללית? דברו איתנו ישירות בוואטסאפ",
    comingSoonTitle:"בקרוב באתר", comingSoonText:"הדף הזה נמצא כרגע בבנייה. בינתיים אפשר לבנות מחשב בהתאמה אישית או לפנות אלינו ישירות.",
    backToServices:"⟵ חזרה לתפריט השירותים", goToBuilder:"לבניית מחשב בהתאמה אישית",
    siteComingSoonTitle:"האתר החדש שלנו בדרך!",
    siteComingSoonText:"אנחנו עובדים על חוויית קנייה חדשה ומשודרגת ל-DvirTech. בינתיים, נשמח לעזור לכם ישירות.",
    contactWhatsappBtn:"💬 דברו איתנו בוואטסאפ"
  },
  en: {
    navReady:"Ready-Made PCs", navBuilder:"PC Builder", navPeripherals:"Peripherals",
    navLab:"Lab & Service", navContact:"Contact Us",
    heroTitle:"Build Your PC", heroTitleHighlight:"Step by Step",
    heroSubtitle:"Pick only compatible parts, get an accurate real-time price, a live build diagram that fills in as you choose, and an AI breakdown of why this build suits you.",
    trustWarranty:"Official Importer Warranty", trustStress:"Stress-Tested Before Delivery",
    trustSupport:"Direct Human Support From the Builder", trustShipping:"Delivery or Self Pickup",
    summaryTitle:"📋 Build Summary", summarySubtitle:"Updates automatically as you choose",
    totalLabel:"Total", diagramTitle:"🖥️ Your Build — Filling In Live",
    useCaseLabel:"What's the main use for this PC?", resolutionLabel:"Gaming Resolution",
    analyzeBtn:"✨ Analyze My Build with AI", analyzeBtnSub:"(personalized summary)",
    whatsappBtn:"💬 Send Order via WhatsApp", aiLoadingText:"Running analysis...",
    footerText:"DvirTech © 2026 — Professional builds, official warranty, personal service.",
    notSelected:"Not selected yet", addBtn:"Add", oneOption:"Choose one option", optional:"Optional",
    lockMobo:"Choose a CPU first (step 1) to see compatible motherboards ⬆",
    gpuSubWithCpu:"Cards that best match the CPU, PSU and case you've chosen are marked and ranked first.",
    gpuSubNoCpu:"Choose a CPU for a personalized recommendation — you can also pick a card right away.",
    coolingSub:"Filtered by CPU socket and by the chosen case, ranked by heat-dissipation capacity vs. the CPU's heat output.",
    psuSub:"Ranked by the wattage required for the chosen graphics card.",
    caseSub:"Filtered by the chosen graphics card length and cooler size.",
    ramCpuSub:"Choose one option — quantity can be increased in the build summary if the motherboard supports it.",
    validationPrefix:"To continue, please complete:", aiErrorMsg:"⚠️ Couldn't get an analysis right now. Please try again shortly.",
    fpsHeading:"Performance Estimate", fpsNote:"* Estimated based on public benchmark data. Actual performance may vary.",
    highSettings:"High settings",
    included:"Included",
    filterExplainer:"💡 The system filters and ranks components in real time based on physical and performance compatibility with your build — that's why some options change or disappear as you choose.",
    qtyLimitRam:"Maximum based on the RAM slots on the chosen motherboard",
    qtyLimitCpu:"Maximum based on the number of CPU sockets on the chosen motherboard",
    qtyLimitStorage:"Maximum based on the M.2 slots on the chosen motherboard",
    qtyLimitDefault:"Choose a motherboard to see the exact maximum",
    resOptions:{ "1080p":"1080p (Full HD)", "1440p":"1440p (2K)", "4K":"4K (Ultra HD)" },
    landingServiceHeading:"How can we help you today?",
    landingServiceSub:"Pick whichever fits best — you can always change later",
    changeLanguage:"↺ Change language",
    serviceBuilderTitle:"Build a Custom PC", serviceBuilderDesc:"Choose compatible parts step by step, for a build made exactly for you",
    serviceCatalogTitle:"Browse Our Catalog", serviceCatalogDesc:"Browse ready-made PCs and peripherals available for delivery",
    serviceSupportTitle:"Technical Support", serviceSupportDesc:"Have an issue or question about an existing PC? We're here for you",
    serviceContactTitle:"Contact Us", serviceContactDesc:"General question? Chat with us directly on WhatsApp",
    comingSoonTitle:"Coming Soon", comingSoonText:"This page is currently under construction. In the meantime, you can build a custom PC or reach out to us directly.",
    backToServices:"⟵ Back to services", goToBuilder:"Go to Custom PC Builder",
    siteComingSoonTitle:"Our New Website Is On Its Way!",
    siteComingSoonText:"We're working on a new, upgraded shopping experience for DvirTech. In the meantime, we'd love to help you directly.",
    contactWhatsappBtn:"💬 Chat With Us on WhatsApp"
  }
};

function t(key){ return UI_TEXT[LANG][key]; }

const USE_CASES = ["gaming","office","creative","general"];
const USE_CASE_LABELS = {
  gaming:   { he:"גיימינג", en:"Gaming" },
  office:   { he:"עבודה משרדית", en:"Office Work" },
  creative: { he:"עריכת וידאו/גרפיקה", en:"Video / Graphic Editing" },
  general:  { he:"שימוש כללי", en:"General Use" }
};

const CONTEXT_CONFIG = {
  gaming: {
    he: { label:"אילו משחקים מעניינים אותך? (עד 6, אופציונלי)", placeholder:"הקלד שם משחק נוסף...",
      options:["Fortnite","Valorant","GTA V","Call of Duty: Warzone","Cyberpunk 2077","EA FC 25","Apex Legends","Minecraft"] },
    en: { label:"Which games are you interested in? (up to 6, optional)", placeholder:"Type another game...",
      options:["Fortnite","Valorant","GTA V","Call of Duty: Warzone","Cyberpunk 2077","EA FC 25","Apex Legends","Minecraft"] },
    showResolution: true
  },
  office: {
    he: { label:"אילו שימושים תעשה במחשב הזה ביום-יום? (עד 6, אופציונלי)", placeholder:"הקלד שימוש נוסף...",
      options:["מסמכי אופיס וגיליונות", "עשרות טאבי דפדפן פתוחים", "שיחות זום / טימז", "כמה תוכנות בו-זמנית", "מערכת CRM / ניהול", "הדפסה וסריקה"] },
    en: { label:"What will you use this PC for day-to-day? (up to 6, optional)", placeholder:"Type another use...",
      options:["Office docs & spreadsheets", "Dozens of open browser tabs", "Zoom / Teams calls", "Several apps at once", "CRM / management software", "Printing & scanning"] },
    showResolution: false
  },
  creative: {
    he: { label:"באילו תוכנות אתה מתכוון להשתמש? (עד 6, אופציונלי)", placeholder:"הקלד תוכנה נוספת...",
      options:["Adobe Premiere Pro", "DaVinci Resolve", "Adobe Photoshop", "After Effects", "Blender", "Adobe Illustrator"] },
    en: { label:"Which software do you plan to use? (up to 6, optional)", placeholder:"Type another app...",
      options:["Adobe Premiere Pro", "DaVinci Resolve", "Adobe Photoshop", "After Effects", "Blender", "Adobe Illustrator"] },
    showResolution: false
  },
  general: {
    he: { label:"רוצה לתת דוגמה לשימוש יומיומי במחשב? (אופציונלי)", placeholder:"לדוגמה: גלישה, לימודים, נטפליקס...",
      options:["גלישה ורשתות חברתיות", "צפייה בסטרימינג", "שיעורי בית / לימודים", "ניהול תקציב ביתי", "שימוש משפחתי משותף"] },
    en: { label:"Want to give an example of your daily use? (optional)", placeholder:"e.g. browsing, studying, Netflix...",
      options:["Browsing & social media", "Streaming video", "Homework / studying", "Home budgeting", "Shared family use"] },
    showResolution: false
  }
};

/* ---------- catalog text helpers (language-aware) ---------- */
function localName(item){ return (LANG === "en" && item.nameEn) ? item.nameEn : item.name; }
function localSpec(item){ return (LANG === "en" && item.specEn) ? item.specEn : item.spec; }
function localLabel(cat){ return LANG === "en" ? CATALOG[cat].labelEn : CATALOG[cat].label; }

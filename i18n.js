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
  applyDataLang();
}

/* =====================================================================
   טקסטים סטטיים ב-HTML — [data-he] / [data-en]
   =====================================================================
   🔴 **"העמוד השבור" — gifts.html בלי כותרת, שלבים ריקים (27.08).**
   התבנית data-he שימשה 15+ דפים, אבל כל דף יישם אותה בסקריפט משלו
   (home.js, support.js, terms.js…) — ודף חדש בלי סקריפט משלו קיבל
   טקסט ריק בלי שום שגיאה. דביר לחץ על המודעה בקטלוג ונחת בדיוק שם.
   מעכשיו i18n.js — שנטען בכל דף — מיישם את התבנית בעצמו: פעם אחת
   בטעינה, ושוב בכל החלפת שפה. הדפים הוותיקים מריצים את זה גם
   בעצמם — אותה תוצאה בדיוק, ריצה כפולה אינה מזיקה (idempotent).
   ⚠️ textContent ולא innerHTML — הערכים הם טקסט; תגית שתוכנס לשם
   תוצג כטקסט ולא תרונדר, וזה מכוון (אין הזרקת HTML מ-attributes). */
function applyDataLang(root){
  (root || document).querySelectorAll("[data-he]").forEach(function(el){
    var v = LANG === "en" ? (el.dataset.en || el.dataset.he) : el.dataset.he;
    if (v != null) el.textContent = v;
  });
}

/* דף בלי setLang משלו (gifts.html, accessibility.html, account.html)
   מקבל ברירת מחדל: החלפה + רענון הטקסטים הסטטיים. דף עם setLang
   משלו מנצח — ההגדרה שלו נטענת אחרי הקובץ הזה ודורסת את החלון. */
document.addEventListener("DOMContentLoaded", function(){
  applyDataLang();
  if (typeof window.setLang !== "function") {
    window.setLang = function(lang){ setLangCore(lang); location.reload(); };
  }
  /* סימון כפתור השפה הפעיל — הדפים בלי סקריפט משלהם צריכים גם את זה. */
  document.querySelectorAll(".lang-btn").forEach(function(b){
    b.classList.toggle("active", b.dataset.lang === LANG);
  });
});

const UI_TEXT = {
  he: {
    navHome:"ראשי", navReady:"מחשבים מוכנים", navBuilder:"בונה המחשבים", navPeripherals:"ציוד היקפי",
    navComponents:"רכיבים", navLab:"שירות ותמיכה", navWhy:"למה DvirTech?", navContact:"צור קשר",
    heroTitle:"בנה את המחשב שלך", heroTitleHighlight:"צעד־אחר־צעד",
    heroSubtitle:"בחר רכיבים תואמים בלבד, קבל מחיר מדויק בזמן אמת, תרשים חי שמתמלא לפי הבחירות שלך, וניתוח AI שמסביר למה ההרכבה מתאימה לך.",
    trustWarranty:"אחריות יבואן רשמי", trustStress:"בדיקת מאמץ לפני מסירה",
    trustSupport:"מענה אנושי ישיר מול המרכיב", trustShipping:"משלוח או איסוף עצמי",
    summaryTitle:"📋 סיכום ההרכבה", summarySubtitle:"מתעדכן אוטומטית לפי הבחירות שלך",
    totalLabel:"סה\"כ", diagramTitle:"🖥️ ההרכבה שלך — מתמלאת בזמן אמת",
    pcVisualEmptyHint:"בחרו רכיב מהרשימה<br>כדי להתחיל להרכיב",
    useCaseLabel:"מה מטרת השימוש העיקרית?", resolutionLabel:"רזולוציית משחק",
    analyzeBtn:"✨ נתח את המערכת עם AI", analyzeBtnSub:"(סיכום מותאם אישית)",
    whatsappBtn:"💬 שלח הזמנה בוואטסאפ", aiLoadingText:"מריץ ניתוח...",
    cartTitle:"🛒 העגלה שלך", cartEmpty:"העגלה ריקה כרגע. הוסף הרכבה או מוצר מהקטלוג.",
    checkoutTotalLabel:"סה\"כ", checkoutBtn:"מעבר לתשלום",
    checkoutSubtotalLabel:"סכום הרכישה", grandTotalLabel:"סה\"כ לתשלום",
    installmentsCountLabel:"מספר תשלומים",
    installmentsHint:"תשלום אחד ללא עמלה. מ-2 תשלומים ומעלה מתווספת עמלת תשלומים, מפורטת למטה לפני התשלום.",
    feeLabelPrefix:"עמלת תשלומים",
    monthlyBreakdownPrefix:"פירוט החיוב:", monthlyBreakdownMiddle:"תשלומים של", monthlyBreakdownSuffix:"כל אחד.",
    checkoutTitle:"סיכום הזמנה", checkoutScreenSubtitle:"מילוי הפרטים והמשך יעביר אותך לדף תשלום מאובטח של SUMIT — התשלום מלא ומראש, לפי המחיר הסופי שיחושב כאן למטה.",
    labelName:"שם מלא", labelPhone:"טלפון", labelEmail:"אימייל (לא חובה)",
    submitOrderBtn:"המשך להזמנה ←",
    checkoutValidationBasic:"נא למלא שם וטלפון תקין",
    continueBrowsing:"⟵ המשך גלישה באתר",
    addToCartBtn:"הוסף לעגלה", finishBuildBtn:"🛒 סיום הרכבה + הוספה לעגלה",
    /* 🔴 **"הרכבה חינם" בוטלה 26.08.** ההטבה היום היא מחיר מוזל —
       199 ₪ במקום 300 ₪ — ולא אפס. ראה SERVICE_ASSEMBLY_KEY_
       ב-4-payment-api.gs. */
    freeAssemblyEligibilityNote:"⚠️ שימו לב: מחיר ההרכבה המוזל (199 ₪ במקום 300 ₪) חל רק כשכל רכיבי המחשב נרכשים דרכנו/דרך האתר. השלימו את כל השלבים הנדרשים כדי להמשיך.",
    catalogTitle:"קטלוג מוצרים", catalogSubtitle:"מחשבים מוכנים וציוד היקפי — הדגמה ראשונית, המחירים והמלאי עוד לא סופיים.",
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
    qtyLimitStorageSata:"מקסימום 4 כוננים בחיבור SATA",
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

    /* ---- footer legal row (shared across all pages) ---- */
    navAbout:"אודות", navTerms:"תקנון",

    /* ---- about.html ---- */
    aboutTitle:"אודות DvirTech",
    aboutIntro:"DvirTech הוא עסק עצמאי לשירותי מחשוב, בניהולו האישי של דביר — הרכבת מחשבים בהתאמה אישית, אבחון ותיקון תקלות, התקנת מערכות הפעלה ותוכנה, וליווי טכני שוטף ללקוחות פרטיים ועסקים קטנים.",
    aboutHowTitle:"איך אנחנו עובדים",
    aboutHowText:"מול רשתות שיווק גדולות אי אפשר להתחרות במחיר הזול ביותר — ואנחנו גם לא מנסים. החוזק של DvirTech הוא שירות אישי: מענה ישיר וזמין, הסבר בגובה העיניים בלי לחץ למכור, והגעה עד הבית כשצריך.",
    aboutQuote:"“החוזק שלי הוא לא להיות הזול ביותר. החוזק שלי הוא להיות זה שעונה לטלפון.”",
    aboutQuoteAttr:"— דביר, DvirTech",
    aboutServicesTitle:"מה אנחנו מציעים",
    aboutServicesList:["הרכבת מחשבים בהתאמה אישית מרכיבים תואמים, עם אחריות רשמית של היבואן על החומרה","ביקורי בית ואבחון תקלות","תמיכה טכנית מרחוק","התקנת Windows עם רישיון מקורי בלבד — לא רישיונות נפח שעלולים להתבטל","ייעוץ טלפוני לפני רכישה, ללא עלות"],
    aboutAreaTitle:"אזור שירות",
    aboutAreaText:"מוצרים ומשלוחים — לכל הארץ. שירותים בתיאום אישי (ביקורי בית, התקנות, תיקונים) ניתנים בקריית גת והסביבה, ולפי זמינות גם באזור השפלה והמרכז — הכי פשוט לכתוב לי בוואטסאפ ונבדוק יחד. ייעוץ ותמיכה מרחוק — מכל מקום.",
    aboutLegalTitle:"פרטי העסק",
    aboutLegalText:"DvirTech מנוהל על ידי דביר פרץ, עוסק פטור, מס' עוסק 322999582. לפרטי התקשרות מלאים ולתנאי השימוש המלאים ראו את עמודי צור קשר ותקנון.",

    /* ---- contact.html ---- */
    contactTitle:"צור קשר",
    contactSubtitle:"יש שאלה, בקשה להצעת מחיר, או תקלה קיימת? נשמח לשמוע — יש שתי דרכים ליצור קשר ישירות:",
    contactPhoneLabel:"טלפון / וואטסאפ", contactEmailLabel:"אימייל",
    contactCallBtn:"📞 התקשר עכשיו", contactWhatsappBtn:"💬 שלח הודעה בוואטסאפ", contactEmailBtn:"✉️ שלח מייל",
    contactHoursLabel:"זמינות", contactHoursText:"א׳–ה׳ 09:00–19:00, שישי 09:00–14:00. אין עבודה בשבתות ובחגים. מחוץ לשעות אלו אפשר להשאיר הודעה בוואטסאפ או במייל ונחזור בהקדם האפשרי.",
    contactAreaLabel:"אזור שירות", contactAreaText:"קריית גת והסביבה · שפלה ומרכז בתיאום — דברו איתי ונבדוק · משלוחים לכל הארץ",
    contactCancelTitle:"רוצה לבטל עסקה קיימת?",
    contactCancelText:"אפשר לבטל עסקה בהתאם למדיניות הביטול המפורטת בתקנון, בפנייה ישירה ובכתב — בהודעת וואטסאפ או במייל, עם פרטי ההזמנה.",
    contactCancelBtn:"✍️ שליחת בקשת ביטול עסקה",

    /* ---- terms.html ---- */
    termsTitle:"תקנון האתר",
    termsUpdated:"עודכן לאחרונה: אוגוסט 2026",

    /* ---- checkout terms checkbox ---- */
    termsAgreeLabelHtml:"קראתי ואני מסכים/ה ל<a href=\"terms.html\" target=\"_blank\" rel=\"noopener\">תקנון האתר</a>",
    termsAgreeRequired:"יש לאשר את התקנון כדי להמשיך",

    /* ---- checkout business/company toggle ---- */
    isBusinessLabel:"אני רוכש/ת בתור עסק / חברה",
    labelCompanyName:"שם העסק / החברה + ח.פ (אם יש)",
    invoiceTypeHint:"הקבלה תופק על שם העסק שציינת, במקום על שמך הפרטי. DvirTech הינו עוסק פטור ומפיק קבלה בלבד — לא ניתן להפיק חשבונית מס.",

    /* ---- checkout real submit flow ---- */
    checkoutSubmitting:"⏳ שולח...",
    checkoutErrorGeneric:"אירעה שגיאה. נסה שוב או פנה ל-DvirTech בוואטסאפ.",
    checkoutErrorNetwork:"שגיאת תקשורת. בדוק את החיבור ונסה שוב.",
    checkoutCancelledNotice:"התשלום בוטל — ההזמנה עדיין שמורה בעגלה שלך, אפשר לנסות שוב בכל עת."
  },
  en: {
    navHome:"Home", navReady:"Ready-Made PCs", navBuilder:"PC Builder", navPeripherals:"Peripherals",
    navComponents:"Components", navLab:"Service & Support", navWhy:"Why DvirTech?", navContact:"Contact Us",
    heroTitle:"Build Your PC", heroTitleHighlight:"Step by Step",
    heroSubtitle:"Pick only compatible parts, get an accurate real-time price, a live build diagram that fills in as you choose, and an AI breakdown of why this build suits you.",
    trustWarranty:"Official Importer Warranty", trustStress:"Stress-Tested Before Delivery",
    trustSupport:"Direct Human Support From the Builder", trustShipping:"Delivery or Self Pickup",
    summaryTitle:"📋 Build Summary", summarySubtitle:"Updates automatically as you choose",
    totalLabel:"Total", diagramTitle:"🖥️ Your Build — Filling In Live",
    pcVisualEmptyHint:"Pick a component from the list<br>to start building",
    useCaseLabel:"What's the main use for this PC?", resolutionLabel:"Gaming Resolution",
    analyzeBtn:"✨ Analyze My Build with AI", analyzeBtnSub:"(personalized summary)",
    whatsappBtn:"💬 Send Order via WhatsApp", aiLoadingText:"Running analysis...",
    cartTitle:"🛒 Your Cart", cartEmpty:"Your cart is empty. Add a build or a product from the catalog.",
    checkoutTotalLabel:"Total", checkoutBtn:"Proceed to Checkout",
    checkoutSubtotalLabel:"Purchase Amount", grandTotalLabel:"Total to Pay",
    installmentsCountLabel:"Number of Payments",
    installmentsHint:"One payment with no extra fee. From 2 payments and up, an installment fee is added, itemized below before payment.",
    feeLabelPrefix:"Installment Fee",
    monthlyBreakdownPrefix:"Breakdown:", monthlyBreakdownMiddle:"payments of", monthlyBreakdownSuffix:"each.",
    checkoutTitle:"Order Summary", checkoutScreenSubtitle:"Filling in your details and continuing will take you to a secure SUMIT payment page — full payment upfront, per the final price calculated below.",
    labelName:"Full name", labelPhone:"Phone", labelEmail:"Email (optional)",
    submitOrderBtn:"Continue to order →",
    checkoutValidationBasic:"Please enter a name and a valid phone number",
    continueBrowsing:"⟵ Continue Browsing",
    addToCartBtn:"Add to Cart", finishBuildBtn:"🛒 Finish Build + Add to Cart",
    freeAssemblyEligibilityNote:"⚠️ Note: the reduced assembly price (199 ₪ instead of 300 ₪) applies only when every component is purchased through us / the site. Please complete all required steps to continue.",
    catalogTitle:"Product Catalog", catalogSubtitle:"Ready-made PCs and peripherals — early preview, prices and stock not final yet.",
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
    qtyLimitStorageSata:"Maximum 4 SATA drives",
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

    /* ---- footer legal row (shared across all pages) ---- */
    navAbout:"About", navTerms:"Terms of Service",

    /* ---- about.html ---- */
    aboutTitle:"About DvirTech",
    aboutIntro:"DvirTech is an independent computer-services business, personally run by Dvir — custom PC builds, troubleshooting and repairs, OS and software setup, and ongoing technical support for individuals and small businesses.",
    aboutHowTitle:"How we work",
    aboutHowText:"Against big retail chains, competing on the lowest price isn't realistic — and it's not what we try to do. DvirTech's strength is personal service: a direct, reachable response, plain explanations with no sales pressure, and an in-home visit when it's needed.",
    aboutQuote:"“My strength isn't being the cheapest. My strength is being the one who actually answers the phone.”",
    aboutQuoteAttr:"— Dvir, DvirTech",
    aboutServicesTitle:"What we offer",
    aboutServicesList:["Custom PC builds from compatible parts, with the official importer warranty on hardware","Home visits and troubleshooting","Remote technical support","Windows installation with a genuine license only — never bulk licenses that can get revoked","Free phone consultation before you buy"],
    aboutAreaTitle:"Service area",
    aboutAreaText:"Products ship nationwide. In-person services (home visits, installations, repairs) cover the Kiryat Gat area, and by availability the Shfela and Center too — simplest is to message me and we’ll check together. Advice and remote support — from anywhere.",
    aboutLegalTitle:"Business details",
    aboutLegalText:"DvirTech is run by Dvir Peretz, a licensed sole proprietor (עוסק פטור), business ID 322999582. For full contact details and terms of use, see the Contact and Terms of Service pages.",

    /* ---- contact.html ---- */
    contactTitle:"Contact Us",
    contactSubtitle:"Have a question, need a quote, or dealing with an issue? We'd love to hear from you — two direct ways to reach us:",
    contactPhoneLabel:"Phone / WhatsApp", contactEmailLabel:"Email",
    contactCallBtn:"📞 Call Now", contactWhatsappBtn:"💬 Message on WhatsApp", contactEmailBtn:"✉️ Send an Email",
    contactHoursLabel:"Availability", contactHoursText:"Sun–Thu 09:00–19:00, Fri 09:00–14:00. Closed Saturdays and Jewish holidays. Outside these hours, leave a message on WhatsApp or email and we'll get back to you as soon as possible.",
    contactAreaLabel:"Service area", contactAreaText:"Kiryat Gat area · Shfela & Center by arrangement — message me · Nationwide delivery",
    contactCancelTitle:"Want to cancel an existing order?",
    contactCancelText:"You can cancel a transaction per the cancellation policy detailed in the Terms of Service, by contacting us directly and in writing — via WhatsApp or email, with your order details.",
    contactCancelBtn:"✍️ Send a Cancellation Request",

    /* ---- terms.html ---- */
    termsTitle:"Terms of Service",
    termsUpdated:"Last updated: August 2026",

    /* ---- checkout terms checkbox ---- */
    termsAgreeLabelHtml:"I have read and agree to the <a href=\"terms.html\" target=\"_blank\" rel=\"noopener\">Terms of Service</a>",
    termsAgreeRequired:"Please agree to the Terms of Service to continue",

    /* ---- checkout business/company toggle ---- */
    isBusinessLabel:"I'm purchasing as a business / company",
    labelCompanyName:"Company name + business ID (if any)",
    invoiceTypeHint:"The receipt will be issued in the company name you provide instead of your personal name. DvirTech is a tax-exempt sole proprietor (עוסק פטור) and issues receipts only — not tax invoices.",

    /* ---- checkout real submit flow ---- */
    checkoutSubmitting:"⏳ Submitting...",
    checkoutErrorGeneric:"Something went wrong. Please try again or reach us on WhatsApp.",
    checkoutErrorNetwork:"Connection error. Check your connection and try again.",
    checkoutCancelledNotice:"Payment was cancelled — your order is still saved in your cart, you can try again anytime."
  }
};

function t(key){ return UI_TEXT[LANG][key]; }

/* Shared footer legal-links row (אודות / צור קשר / תקנון) — injected on every
   page's footer. Each page's own render function should call this too, but
   calling it here on load covers pages that forget. */
function renderFooterLegal(){
  const a = document.getElementById("footerAboutLink");
  const c = document.getElementById("footerContactLink");
  const tr_ = document.getElementById("footerTermsLink");
  if(a) a.textContent = t("navAbout");
  if(c) c.textContent = t("navContact");
  if(tr_) tr_.textContent = t("navTerms");
}

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

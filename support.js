/* =====================================================================
   DvirTech — שירות ותמיכה (support.html)
   =====================================================================
   מחליף את support.html בדף אמיתי: רשימת השירותים
   מהמחירון + טופס פנייה שהשאלות בו משתנות לפי השירות שנבחר.

   ⚠️ מקור המחירים והמק"טים
   ------------------------
   השמות והמחירים כאן הם העתק מדויק של PRICE_LIST ב-
   CRM+SUPPLIERS/2-pricelist-picker.gs, והמפתחות (key) והמק"טים (sku)
   הם אותם מפתחות בדיוק כמו ב-REAL_SUMIT_SKUS ב-4-payment-api.gs.
   זה לא מקרי: כשהדף הזה יחובר בעתיד להזמנה אמיתית, ה-key שנשמר ב-
   data-key על הכרטיס הוא כבר המפתח שהשרת יודע לתרגם למק"ט SUMIT.
   מחיר שמשתנה במחירון — לעדכן גם כאן.

   ⚠️ לא כל 23 השירותים שבמחירון מופיעים כאן. שלושה מהם הם תמחור פנימי
   ולא מוצר מדף, ולכן הושמטו במכוון:
     • CLI-4004 "הרכבה (כשקונים ממני חלקים)" ₪0 — הטבה אוטומטית שנוספת
       לעגלה דרך הבונה. כרטיס "לפנייה" ב-₪0 היה מזמין בקשות להרכבה
       חינם של חלקים שנקנו במקום אחר. מוצג כהערה בראש קטגוריית ההרכבה.
     • CLI-4005 "הרכבה מוזלת (כשקונים ממני חלקים)" ₪150 — מדרגת ביניים
       שנקבעת לפי כמה מהחלקים נקנו דרכנו. החלטה של דביר לכל מקרה.
     • CLI-4012 "נסיעה בלבד (מעל שעה וחצי)" ₪200 — תוספת נסיעה שנטענת
       על שירות אחר, לא שירות שמזמינים.

   ⚠️ השליחה היא וואטסאפ ולא endpoint. אין לטופס הזה שרת, וגם לא צריך:
   זו אותה דרך שכבר עובדת ב-contact.html, והפנייה מגיעה לדביר לטלפון
   מיד עם כל התשובות מסודרות בהודעה אחת.
===================================================================== */

const SUP_WHATSAPP_NUMBER = "972502000373";

function supEsc(s){
  return String(s == null ? "" : s)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function supTr(he, en){ return (typeof LANG !== "undefined" && LANG === "en") ? en : he; }

/* ==================== קטגוריות ==================== */
/* אותן שש קטגוריות ובאותו סדר כמו במחירון. */
const SUP_CATS = [
  { key:"assembly", he:"הרכבה",        en:"Assembly",
    noteHe:"קנית את החלקים דרך האתר או דרכי? ההרכבה כלולה ללא עלות ומתווספת לעגלה מעצמה — אין צורך לפנות דרך כאן.",
    noteEn:"Bought the parts through the site? Assembly is included at no cost and is added to your cart automatically — no need to request it here." },
  { key:"os",       he:"מערכת הפעלה",  en:"Operating system" },
  { key:"visit",    he:"ביקור בית",    en:"Home visit",
    noteHe:"המחיר נקבע לפי זמן הנסיעה אליך. לא בטוח לאיזו מדרגה אתה שייך? בחר את הקרובה ביותר — בטופס תתבקש רק לציין את היישוב, ואני אאשר לך את המחיר המדויק לפני שנקבע.",
    noteEn:"The price depends on travel time to you. Not sure which tier fits? Pick the closest one — the form only asks for your town, and I'll confirm the exact price before we schedule." },
  { key:"support",  he:"תמיכה",        en:"Support" },
  { key:"repairs",  he:"תיקונים",      en:"Repairs" },
  { key:"bundles",  he:"חבילות",       en:"Bundles" }
];

/* ==================== שאלות משותפות ==================== */
/* שאלה שחוזרת בכמה שירותים מוגדרת פעם אחת — גם כדי שהניסוח יהיה זהה
   בכל מקום, וגם כדי שלא יהיו שתי גרסאות אנגלית לאותה שאלה. */
const SQ = {
  partsReady: { id:"partsReady", type:"select",
    he:"כל החלקים כבר אצלך?", en:"Do you already have all the parts?",
    options:[["הכל הגיע","Everything has arrived"],
             ["חלק מהחלקים הגיעו","Some of the parts have arrived"],
             ["עוד לא הזמנתי","I haven't ordered yet"]] },

  partsList: { id:"partsList", type:"textarea", opt:true, max:400,
    he:"אילו חלקים? (לא חובה, אבל עוזר לי להעריך זמן)",
    en:"Which parts? (optional — helps me estimate the time)",
    phHe:"מעבד, לוח אם, כרטיס מסך, קירור, מארז…",
    phEn:"CPU, motherboard, GPU, cooler, case…" },

  handover: { id:"handover", type:"select",
    he:"איך נעביר את המחשב?", en:"How should we hand over the PC?",
    options:[["אני מביא ואוסף","I'll drop it off and pick it up"],
             ["אשמח שתגיע אליי (ביקור בית — בתוספת תשלום)","I'd like you to come to me (home visit — extra charge)"],
             ["עוד לא יודע","Not sure yet"]] },

  deskOrLaptop: { id:"deskOrLaptop", type:"select",
    he:"נייח או נייד?", en:"Desktop or laptop?",
    options:[["מחשב נייח","Desktop"],["מחשב נייד","Laptop"],["לא בטוח","Not sure"]] },

  boots: { id:"boots", type:"select",
    he:"המחשב עולה ועובד כרגע?", en:"Does the PC currently boot and work?",
    options:[["כן, עובד","Yes, it works"],
             ["עולה אבל עם תקלות","It boots but misbehaves"],
             ["לא נדלק בכלל","It doesn't power on at all"]] },

  files: { id:"files", type:"select",
    he:"מה לגבי הקבצים האישיים?", en:"What about your personal files?",
    options:[["יש לי גיבוי — אפשר למחוק הכל","I have a backup — everything can be wiped"],
             ["אין גיבוי — חשוב לי שתשמור אותם","No backup — please preserve them"],
             ["אין שם שום דבר חשוב","There's nothing important on it"]] },

  winEdition: { id:"winEdition", type:"select",
    he:"איזו גרסה?", en:"Which edition?",
    options:[["Windows 11 Home","Windows 11 Home"],
             ["Windows 11 Pro","Windows 11 Pro"],
             ["לא משנה לי — תמליץ","No preference — recommend one"]] },

  /* ⚠️ יישוב ולא כתובת מלאה. הכתובת המדויקת נמסרת בטלפון כשקובעים,
     ואין שום סיבה שהיא תעבור דרך טופס באתר. */
  city: { id:"city", type:"text", max:60,
    he:"באיזה יישוב?", en:"Which town?",
    hintHe:"קובע את מחיר הנסיעה — לכן זו השאלה היחידה על המיקום. את הכתובת המדויקת נסגור בטלפון.",
    hintEn:"This sets the travel price — it's the only location question. We'll settle the exact address by phone.",
    phHe:"למשל: פתח תקווה", phEn:"e.g. Petah Tikva" },

  when: { id:"when", type:"select",
    he:"מתי נוח לך?", en:"When suits you?",
    options:[["בוקר","Morning"],["צהריים","Midday"],["אחר הצהריים / ערב","Afternoon / evening"],
             ["סוף שבוע","Weekend"],["גמיש","Flexible"]] },

  budget: { id:"budget", type:"select",
    he:"תקציב משוער", en:"Approximate budget",
    options:[["עד 3,000 ₪","Up to ₪3,000"],["3,000–5,000 ₪","₪3,000–5,000"],
             ["5,000–8,000 ₪","₪5,000–8,000"],["8,000–12,000 ₪","₪8,000–12,000"],
             ["מעל 12,000 ₪","Over ₪12,000"],["עוד לא יודע","Not sure yet"]] }
};

/* ==================== השירותים ==================== */
/* key + sku זהים ל-REAL_SUMIT_SKUS ב-4-payment-api.gs. */
const SUP_SERVICES = [

  /* ---------- הרכבה ---------- */
  { key:"assembly-parts", sku:"CLI-4001", cat:"assembly", price:300,
    he:"הרכבת מחשב (החלקים שלך)", en:"PC assembly (your own parts)",
    descHe:"הרכבה מלאה, סידור כבלים ובדיקת יציבות. בלי התקנת מערכת הפעלה.",
    descEn:"Full build, cable management and a stability test. OS install not included.",
    q:[ SQ.partsReady, SQ.partsList, SQ.handover ] },

  { key:"assembly-win", sku:"CLI-4002", cat:"assembly", price:400,
    he:"הרכבה + Windows + דרייברים", en:"Assembly + Windows + drivers",
    descHe:"הרכבה, התקנת Windows ודרייברים. הרישיון לא כלול במחיר.",
    descEn:"Build, Windows install and drivers. The license is not included.",
    q:[ SQ.partsReady, SQ.partsList,
        { id:"hasKey", type:"select",
          he:"יש לך כבר מפתח Windows?", en:"Do you already have a Windows key?",
          hintHe:"המחיר הזה לא כולל רישיון. אם אין לך — אפשר להוסיף אותו (ההרכבה עם רישיון עולה 550 ₪).",
          hintEn:"This price excludes the license. If you don't have one, it can be added (assembly with a license is ₪550).",
          options:[["כן, יש לי מפתח","Yes, I have a key"],
                   ["לא — אשמח שתוסיף רישיון","No — please add a license"],
                   ["לא בטוח","Not sure"]] } ] },

  { key:"assembly-win-lic", sku:"CLI-4003", cat:"assembly", price:550,
    he:"הרכבה + Windows + דרייברים + רישיון", en:"Assembly + Windows + drivers + license",
    descHe:"הכל כלול: הרכבה, מערכת הפעלה, דרייברים ורישיון Windows חוקי.",
    descEn:"All included: build, OS, drivers and a genuine Windows license.",
    q:[ SQ.partsReady, SQ.partsList, SQ.winEdition ] },

  /* ---------- מערכת הפעלה ---------- */
  { key:"win11-license", sku:"CLI-4006", cat:"os", price:300,
    he:"התקנת Windows 11 + רישיון", en:"Windows 11 install + license",
    descHe:"התקנה נקייה, דרייברים, עדכונים ורישיון חוקי.",
    descEn:"Clean install, drivers, updates and a genuine license.",
    q:[ SQ.deskOrLaptop, SQ.files, SQ.boots, SQ.winEdition ] },

  { key:"win11-own-license", sku:"CLI-4007", cat:"os", price:200,
    he:"התקנת Windows (יש לך רישיון)", en:"Windows install (you have a license)",
    descHe:"אותה התקנה, בלי עלות הרישיון.",
    descEn:"The same install, without the cost of the license.",
    q:[ SQ.deskOrLaptop,
        { id:"licenseKind", type:"select",
          he:"איזה רישיון יש לך?", en:"What kind of license do you have?",
          options:[["מפתח שקניתי","A key I purchased"],
                   ["רישיון דיגיטלי שכבר מחובר למחשב","A digital license already tied to this PC"],
                   ["רישיון של מקום העבודה / Microsoft 365","A work / Microsoft 365 license"],
                   ["לא בטוח","Not sure"]] },
        SQ.files, SQ.boots ] },

  { key:"format-reinstall", sku:"CLI-4008", cat:"os", price:350,
    he:"פירמוט + התקנה מחדש", en:"Format + clean reinstall",
    descHe:"מחיקה מלאה והתקנה מאפס, כולל דרייברים ותוכנות בסיס.",
    descEn:"Full wipe and a from-scratch install, including drivers and basic software.",
    q:[ { id:"whyFormat", type:"select",
          he:"למה מפרמטים?", en:"Why a format?",
          options:[["המחשב איטי מאוד","The PC is very slow"],
                   ["וירוס / נוזקה / פרסומות","Virus / malware / adware"],
                   ["שגיאות ותקלות חוזרות","Recurring errors and crashes"],
                   ["מחשב יד שנייה — רוצה להתחיל נקי","Second-hand PC — starting clean"],
                   ["אחר","Other"]] },
        SQ.files, SQ.deskOrLaptop, SQ.boots ] },

  /* ---------- ביקור בית ----------
     שלוש המדרגות נבדלות רק בזמן הנסיעה — נתון שהלקוח לא באמת יודע.
     לכן כל שלושתן שואלות קודם כל את היישוב, וההערה בראש הקטגוריה
     מסבירה שהמחיר הסופי מאושר לפני הקביעה. */
  { key:"visit-30", sku:"CLI-4009", cat:"visit", price:250,
    he:"ביקור בית — עד 30 דק' נסיעה", en:"Home visit — up to 30 min travel",
    q:[ SQ.city,
        { id:"visitIssue", type:"textarea", max:500,
          he:"מה צריך לעשות בביקור?", en:"What needs to be done during the visit?",
          phHe:"המחשב לא עולה / להתקין ציוד חדש / הרשת נופלת…",
          phEn:"PC won't boot / install new gear / the network keeps dropping…" },
        { id:"deviceCount", type:"select",
          he:"כמה מחשבים או מכשירים?", en:"How many computers or devices?",
          options:[["אחד","One"],["שניים","Two"],["שלושה ומעלה","Three or more"]] },
        SQ.when ] },

  { key:"visit-60", sku:"CLI-4010", cat:"visit", price:350,
    he:"ביקור בית — עד שעה נסיעה", en:"Home visit — up to 1 hour travel",
    q:[ SQ.city,
        { id:"visitIssue", type:"textarea", max:500,
          he:"מה צריך לעשות בביקור?", en:"What needs to be done during the visit?",
          phHe:"המחשב לא עולה / להתקין ציוד חדש / הרשת נופלת…",
          phEn:"PC won't boot / install new gear / the network keeps dropping…" },
        { id:"deviceCount", type:"select",
          he:"כמה מחשבים או מכשירים?", en:"How many computers or devices?",
          options:[["אחד","One"],["שניים","Two"],["שלושה ומעלה","Three or more"]] },
        SQ.when ] },

  { key:"visit-90", sku:"CLI-4011", cat:"visit", price:450,
    he:"ביקור בית — עד שעה וחצי נסיעה", en:"Home visit — up to 1.5 hours travel",
    q:[ SQ.city,
        { id:"visitIssue", type:"textarea", max:500,
          he:"מה צריך לעשות בביקור?", en:"What needs to be done during the visit?",
          phHe:"המחשב לא עולה / להתקין ציוד חדש / הרשת נופלת…",
          phEn:"PC won't boot / install new gear / the network keeps dropping…" },
        { id:"deviceCount", type:"select",
          he:"כמה מחשבים או מכשירים?", en:"How many computers or devices?",
          options:[["אחד","One"],["שניים","Two"],["שלושה ומעלה","Three or more"]] },
        SQ.when ] },

  { key:"onsite-setup", sku:"CLI-4013", cat:"visit", price:400,
    he:"התקנת מחשב בעמדת הלקוח", en:"On-site PC setup",
    descHe:"מגיע, מחבר ומעמיד את העמדה לעבודה. כולל הגעה עד 30 דק' נסיעה.",
    descEn:"I come over, connect everything and get the workstation running. Includes travel of up to 30 minutes.",
    q:[ SQ.city,
        { id:"setupWhat", type:"select",
          he:"מה מתקינים?", en:"What are we setting up?",
          options:[["מחשב חדש שקניתי דרכך","A new PC I bought from you"],
                   ["מחשב חדש שקניתי במקום אחר","A new PC I bought elsewhere"],
                   ["העברה או סידור של עמדה קיימת","Moving or reorganising an existing setup"]] },
        { id:"setupExtras", type:"multi",
          he:"מה עוד בעמדה?", en:"What else is in the setup?",
          options:[["מסך אחד","One monitor"],["שני מסכים או יותר","Two monitors or more"],
                   ["מדפסת / סורק","Printer / scanner"],["חיבור לרשת ולאינטרנט","Network & internet setup"],
                   ["העברת קבצים מהמחשב הישן","Move files from the old PC"]] },
        SQ.when ] },

  /* ---------- תמיכה ---------- */
  { key:"remote-support", sku:"CLI-4014", cat:"support", price:120,
    he:"תמיכה מרחוק (שעה)", en:"Remote support (1 hour)",
    descHe:"מתחבר למחשב שלך ופותר בזמן אמת. שעת עבודה.",
    descEn:"I connect to your PC and fix things live. One working hour.",
    q:[ { id:"remoteIssue", type:"textarea", max:500,
          he:"מה הבעיה?", en:"What's the problem?",
          phHe:"תוכנה שלא נפתחת, מדפסת שלא מדפיסה, הגדרה שלא מסתדרת…",
          phEn:"An app that won't open, a printer that won't print, a setting that won't stick…" },
        /* ⚠️ השאלה החשובה כאן. בלי אינטרנט אין תמיכה מרחוק בכלל, ועדיף
           לגלות את זה עכשיו ולא אחרי שנקבע שעה. */
        { id:"hasInternet", type:"select",
          he:"המחשב מתחבר לאינטרנט?", en:"Does the PC connect to the internet?",
          hintHe:"בלי חיבור אין תמיכה מרחוק — נצטרך ביקור בית או מסירה.",
          hintEn:"Without a connection remote support isn't possible — we'd need a home visit or a drop-off.",
          options:[["כן","Yes"],["מתנתק לסירוגין","It keeps dropping"],["לא מתחבר בכלל","No connection at all"]] },
        { id:"osVersion", type:"select",
          he:"איזו מערכת הפעלה?", en:"Which operating system?",
          options:[["Windows 11","Windows 11"],["Windows 10","Windows 10"],
                   ["אחר","Other"],["לא יודע","Not sure"]] },
        SQ.when ] },

  /* השירות המרכזי בדף — כאן השאלות הן בדיוק מה שטכנאי שואל בטלפון. */
  { key:"diagnostics", sku:"CLI-4015", cat:"support", price:150,
    he:"אבחון תקלה", en:"Fault diagnosis",
    descHe:"בודק מה באמת התקלה ואומר לך מה צריך — לפני שמחליפים חלקים.",
    descEn:"I find out what's actually wrong and tell you what it needs — before anything gets replaced.",
    q:[ { id:"whatHappens", type:"textarea", max:600,
          he:"מה קורה?", en:"What's happening?",
          phHe:"תאר במילים שלך: מתי זה קורה, מה רואים על המסך, יש רעש או ריח…",
          phEn:"In your own words: when it happens, what's on the screen, any noise or smell…" },
        { id:"powersOn", type:"select",
          he:"המחשב נדלק בכלל?", en:"Does the PC power on at all?",
          options:[["נדלק ועובד","Powers on and works"],
                   ["נדלק אבל אין תמונה","Powers on but no display"],
                   ["מאווררים מסתובבים ומיד נכבה","Fans spin then it shuts off"],
                   ["נכבה מעצמו תוך כדי עבודה","Shuts down by itself while in use"],
                   ["לא נדלק בכלל","Doesn't power on at all"]] },
        { id:"since", type:"select",
          he:"מתי זה התחיל?", en:"When did it start?",
          options:[["היום","Today"],["השבוע","This week"],
                   ["לפני יותר מחודש","More than a month ago"],["תמיד היה ככה","It's always been like this"]] },
        { id:"changed", type:"select",
          he:"משהו השתנה לפני שזה התחיל?", en:"Did anything change right before it started?",
          options:[["הוספתי או החלפתי חומרה","I added or replaced hardware"],
                   ["עדכון Windows","A Windows update"],
                   ["התקנתי תוכנה או משחק","I installed software or a game"],
                   ["הפסקת חשמל או נפילת מתח","A power cut or surge"],
                   ["הזזתי או ניקיתי את המחשב","I moved or cleaned the PC"],
                   ["לא, כלום","No, nothing"]] },
        SQ.deskOrLaptop ] },

  /* ⚠️ 300 ולא 450. הלקוח שכבר יודע שהוא רוצה שאתקן בוחר כאן ישירות,
     והאבחון נבלע במחיר — בלי הכרטיס הזה הוא היה בוחר "אבחון" ואז
     "תיקון" ומשלם 150+300 על אותה עבודה. אותה טעות בדיוק שהיתה
     בחבילת "הכל כלול". המחיר חייב להישאר זהה ל-PRICE_LIST ב-
     2-pricelist-picker.gs ול-REAL_SUMIT_SKUS ב-4-payment-api.gs. */
  { key:"diagnose-repair", sku:"CLI-4023", cat:"support", price:300,
    he:"אבחון + תיקון תקלה", en:"Diagnosis + repair",
    descHe:"כולל את האבחון — לא משלמים עליו פעמיים. אם התיקון דורש חלק חדש, אומר לך את המחיר לפני שמזמינים.",
    descEn:"The diagnosis is included — you don't pay for it twice. If the repair needs a new part, I'll quote it before ordering.",
    q:[ { id:"whatHappens", type:"textarea", max:600,
          he:"מה קורה?", en:"What's happening?",
          phHe:"תאר במילים שלך: מתי זה קורה, מה רואים על המסך, יש רעש או ריח…",
          phEn:"In your own words: when it happens, what's on the screen, any noise or smell…" },
        { id:"powersOn", type:"select",
          he:"המחשב נדלק בכלל?", en:"Does the PC power on at all?",
          options:[["נדלק ועובד","Powers on and works"],
                   ["נדלק אבל אין תמונה","Powers on but no display"],
                   ["מאווררים מסתובבים ומיד נכבה","Fans spin then it shuts off"],
                   ["נכבה מעצמו תוך כדי עבודה","Shuts down by itself while in use"],
                   ["לא נדלק בכלל","Doesn't power on at all"]] },
        { id:"knownPart", type:"select",
          he:"אתה כבר יודע מה תקול?", en:"Do you already know what's faulty?",
          options:[["לא — בשביל זה אני פונה","No — that's why I'm asking"],
                   ["יש לי ניחוש","I have a guess"],
                   ["כן, מישהו כבר אבחן","Yes, someone already diagnosed it"]] },
        SQ.deskOrLaptop,
        SQ.handover ] },

  { key:"pre-buy-advice", sku:"CLI-4016", cat:"support", price:0,
    he:"ייעוץ לפני קנייה", en:"Pre-purchase advice",
    descHe:"אומר לך מה באמת צריך בשביל מה שאתה עושה — ומה מיותר.",
    descEn:"I tell you what you actually need for what you do — and what's a waste.",
    q:[ { id:"purpose", type:"select",
          he:"למה המחשב?", en:"What's the PC for?",
          options:[["גיימינג","Gaming"],["עריכת וידאו / גרפיקה","Video / graphics editing"],
                   ["עבודה ומשרד","Work & office"],["לימודים","Studies"],
                   ["שרת / תחנת עבודה","Server / workstation"],["שימוש כללי","General use"]] },
        SQ.budget,
        { id:"reuse", type:"multi",
          he:"יש משהו קיים שאפשר לשמור?", en:"Anything you already own that we can keep?",
          options:[["מסך","Monitor"],["מקלדת ועכבר","Keyboard & mouse"],["מארז","Case"],
                   ["דיסקים","Drives"],["לא — הכל חדש","Nothing — all new"]] },
        { id:"mustHave", type:"textarea", opt:true, max:300,
          he:"משהו שחשוב לך במיוחד? (לא חובה)", en:"Anything that matters to you in particular? (optional)",
          phHe:"שקט, גודל קטן, תאורה, אפשרות לשדרג בעתיד…",
          phEn:"Quiet, small footprint, RGB, room to upgrade later…" } ] },

  /* ---------- תיקונים ---------- */
  { key:"part-upgrade", sku:"CLI-4017", cat:"repairs", price:150,
    he:"שדרוג רכיב (התקנה בלבד)", en:"Component upgrade (installation only)",
    descHe:"התקנה והרצה של הרכיב. מחיר הרכיב עצמו לא כלול.",
    descEn:"Installing and running in the component. The part itself is not included.",
    q:[ { id:"whichPart", type:"multi",
          he:"איזה רכיב?", en:"Which component?",
          options:[["כרטיס מסך","Graphics card"],["מעבד","CPU"],["זיכרון RAM","RAM"],
                   ["דיסק SSD / NVMe","SSD / NVMe drive"],["ספק כוח","Power supply"],
                   ["קירור","Cooling"],["מארז","Case"],["אחר","Other"]] },
        { id:"hasPart", type:"select",
          he:"החלק כבר אצלך?", en:"Do you already have the part?",
          options:[["כן, קניתי אותו","Yes, I bought it"],
                   ["לא — אשמח שתזמין בשבילי","No — please order it for me"],
                   ["עוד לא החלטתי מה לקנות","I haven't decided what to buy"]] },
        { id:"currentPc", type:"textarea", max:400,
          he:"מה המחשב שיש לך היום?", en:"What PC do you have today?",
          hintHe:"דגם או הרכיבים העיקריים — כדי לוודא שהשדרוג בכלל מתאים לו.",
          hintEn:"Model or the main components — so I can confirm the upgrade actually fits.",
          phHe:"למשל: מעבד i5-12400, לוח B660, ספק 550W",
          phEn:"e.g. i5-12400 CPU, B660 board, 550W PSU" },
        SQ.deskOrLaptop ] },

  { key:"clean-thermal", sku:"CLI-4018", cat:"repairs", price:150,
    he:"ניקוי פנימי + משחה תרמית", en:"Internal cleaning + thermal paste",
    descHe:"פירוק, ניקוי אבק והחלפת משחה תרמית. מוריד חום ורעש.",
    descEn:"Teardown, dust removal and fresh thermal paste. Lower temps and less noise.",
    q:[ SQ.deskOrLaptop,
        { id:"symptom", type:"select",
          he:"מה מרגישים?", en:"What are you noticing?",
          options:[["מתחמם ומאט","It gets hot and slows down"],
                   ["המאווררים רועשים","The fans are loud"],
                   ["נכבה מעצמו","It shuts down by itself"],
                   ["הכל בסדר — תחזוקה תקופתית","Nothing wrong — routine maintenance"]] },
        { id:"lastClean", type:"select",
          he:"מתי ניקו לאחרונה?", en:"When was it last cleaned?",
          options:[["אף פעם","Never"],["לפני יותר משנה","Over a year ago"],
                   ["בשנה האחרונה","Within the past year"],["לא יודע","Not sure"]] } ] },

  { key:"data-transfer", sku:"CLI-4019", cat:"repairs", price:200,
    he:"העברת נתונים / גיבוי", en:"Data transfer / backup",
    descHe:"מעביר קבצים, תמונות ומיילים — גם ממחשב שכבר לא עולה.",
    descEn:"Moving files, photos and mail — including off a PC that no longer boots.",
    q:[ { id:"fromWhere", type:"select",
          he:"מאיפה מעבירים?", en:"Transfer from where?",
          options:[["מחשב ישן שעובד","An old PC that still works"],
                   ["מחשב שלא נדלק","A PC that won't power on"],
                   ["דיסק חיצוני / דיסק שלוף","External or removed drive"],
                   ["טלפון","A phone"],["לא בטוח","Not sure"]] },
        { id:"toWhere", type:"select",
          he:"לאן?", en:"Transfer to where?",
          options:[["מחשב חדש","A new PC"],["דיסק חיצוני","An external drive"],
                   ["ענן","Cloud storage"],["עוד לא יודע","Not sure yet"]] },
        { id:"volume", type:"select",
          he:"כמה נפח בערך?", en:"Roughly how much data?",
          options:[["עד 100GB","Up to 100GB"],["100GB–500GB","100GB–500GB"],
                   ["500GB–1TB","500GB–1TB"],["מעל 1TB","Over 1TB"],["לא יודע","Not sure"]] } ] },

  /* ---------- חבילות ---------- */
  { key:"bundle-new-pc", sku:"CLI-4020", cat:"bundles", price:700,
    he:"חבילה: מחשב חדש — הכל כלול", en:"Bundle: new PC — everything included",
    descHe:"הרכבה + Windows + רישיון + התקנה אצלך. הכל בפגישה אחת.",
    descEn:"Assembly + Windows + license + setup at your place. All in one go.",
    q:[ { id:"partsSource", type:"select",
          he:"מאיפה החלקים?", en:"Where are the parts coming from?",
          options:[["בניתי בבונה המחשבים באתר","I built it in the site's PC builder"],
                   ["קניתי חלקים בעצמי","I bought the parts myself"],
                   ["אשמח שתרכיב ותזמין הכל בשבילי","I'd like you to spec and order everything"]] },
        { id:"bundleSpec", type:"textarea", opt:true, max:400,
          he:"מה החלקים או מה התקציב? (לא חובה)", en:"Which parts, or what budget? (optional)",
          phHe:"רשימת חלקים אם יש, או תקציב משוער",
          phEn:"A parts list if you have one, or an approximate budget" },
        { id:"needsOnsite", type:"select",
          he:"צריך גם התקנה אצלך בבית?", en:"Do you also need setup at your place?",
          options:[["כן","Yes"],["לא — אאסוף בעצמי","No — I'll pick it up"]] },
        { id:"needsTransfer", type:"select",
          he:"להעביר נתונים ממחשב ישן?", en:"Move data from an old PC?",
          options:[["כן","Yes"],["לא","No"],["אין לי מחשב ישן","I don't have an old PC"]] } ] },

  { key:"bundle-upgrade", sku:"CLI-4021", cat:"bundles", price:350,
    he:"חבילה: שדרוג מלא", en:"Bundle: full upgrade",
    descHe:"בודק מה שווה לשדרג במחשב הקיים, מתקין ומריץ.",
    descEn:"I work out what's worth upgrading in your current PC, then install and run it in.",
    q:[ { id:"currentPc", type:"textarea", max:400,
          he:"מה המחשב שיש לך היום?", en:"What PC do you have today?",
          phHe:"דגם או הרכיבים העיקריים, ואם ידוע — גיל המחשב",
          phEn:"Model or the main components, and its age if you know it" },
        { id:"painPoint", type:"select",
          he:"מה הכי מפריע?", en:"What bothers you most?",
          options:[["איטי בהכל","Slow at everything"],["משחקים לא רצים חלק","Games don't run smoothly"],
                   ["נגמר מקום אחסון","Out of storage space"],["רועש ומתחמם","Loud and hot"],
                   ["אחר","Other"]] },
        { id:"hasParts", type:"select",
          he:"יש לך כבר חלקים לשדרוג?", en:"Do you already have upgrade parts?",
          options:[["כן","Yes"],["לא — אשמח להמלצה","No — I'd like a recommendation"]] },
        SQ.budget ] },

  { key:"bundle-yearly", sku:"CLI-4022", cat:"bundles", price:600,
    he:"חבילת ליווי שנתית", en:"Annual support plan",
    descHe:"זמין לך לאורך השנה — תקלות, תחזוקה וייעוץ, בלי לספור שיחות.",
    descEn:"Available to you all year — faults, maintenance and advice, without counting calls.",
    q:[ { id:"machines", type:"select",
          he:"כמה מחשבים בליווי?", en:"How many computers in the plan?",
          options:[["אחד","One"],["שניים","Two"],["שלושה עד חמישה","Three to five"],
                   ["יותר מחמישה","More than five"]] },
        { id:"homeOrBiz", type:"select",
          he:"בית או עסק?", en:"Home or business?",
          options:[["בית","Home"],["עסק קטן","Small business"]] },
        { id:"planFocus", type:"multi",
          he:"מה הכי חשוב לך?", en:"What matters most to you?",
          options:[["זמינות מהירה כשיש תקלה","Fast response when something breaks"],
                   ["תחזוקה תקופתית","Routine maintenance"],
                   ["גיבויים","Backups"],
                   ["ייעוץ ורכש","Advice & purchasing"]] } ] }
];

/* ==================== מצב ==================== */
let supSelectedKey = null;

function supSvc(key){ return SUP_SERVICES.find(s => s.key === key) || null; }
function supName(s){ return supTr(s.he, s.en); }
function supPriceLabel(p){
  return p === 0 ? supTr("חינם","Free") : p.toLocaleString() + " ₪";
}

/* ==================== רינדור הקטלוג ==================== */
function supRenderCatalog(){
  const nav = document.getElementById("supCats");
  const host = document.getElementById("supCatalog");
  if(!nav || !host) return;

  nav.innerHTML = SUP_CATS.map(c =>
    `<button type="button" class="sup-chip" data-jump="supcat-${c.key}">${supEsc(supTr(c.he, c.en))}</button>`
  ).join("");

  host.innerHTML = SUP_CATS.map(c => {
    const list = SUP_SERVICES.filter(s => s.cat === c.key);
    if(!list.length) return "";
    const note = c.noteHe
      ? `<p class="sup-note">${supEsc(supTr(c.noteHe, c.noteEn))}</p>` : "";
    return `
      <section class="sup-sec" id="supcat-${c.key}">
        <h2 class="sup-sec-h">${supEsc(supTr(c.he, c.en))}</h2>
        ${note}
        <div class="sup-grid">
          ${list.map(supCardHtml).join("")}
        </div>
      </section>`;
  }).join("");
}

function supCardHtml(s){
  const desc = s.descHe ? `<p class="sup-card-d">${supEsc(supTr(s.descHe, s.descEn))}</p>` : "";
  /* הכרטיס כולו לחיץ (שטח נגיעה גדול בטלפון), ולכן הוא גם צריך להיות
     נגיש מהמקלדת — role+tabindex+aria-pressed, ו-Enter/רווח מטופלים
     ב-supInit. ה-.sup-cta הוא span ולא button בכוונה: כפתור בתוך אזור
     לחיץ יוצר שני יעדי טאב לאותה פעולה. */
  return `
    <article class="sup-card${s.key === supSelectedKey ? " is-on" : ""}"
             role="button" tabindex="0" aria-pressed="${s.key === supSelectedKey ? "true" : "false"}"
             data-key="${supEsc(s.key)}" data-sku="${supEsc(s.sku)}" data-price="${s.price}">
      <h3 class="sup-card-t">${supEsc(supName(s))}</h3>
      ${desc}
      <div class="sup-card-f">
        <span class="sup-price${s.price === 0 ? " is-free" : ""}">${supEsc(supPriceLabel(s.price))}</span>
        <span class="sup-cta">${supEsc(supTr("לפנייה","Request"))}</span>
      </div>
    </article>`;
}

/* ==================== רינדור הטופס ==================== */
/* ⚠️ פרטי הקשר נשמרים כשמחליפים שירות. מי שמילא שם וטלפון ואז שינה
   דעה לגבי השירות לא אמור להקליד אותם שוב. */
function supKeepContact(){
  const g = id => { const e = document.getElementById(id); return e ? e.value : ""; };
  return { name:g("supName"), phone:g("supPhone"), email:g("supEmail") };
}

function supQuestionHtml(q, idx){
  const label = supEsc(supTr(q.he, q.en));
  const hint  = q.hintHe ? `<p class="sup-hint">${supEsc(supTr(q.hintHe, q.hintEn))}</p>` : "";
  const req   = q.opt ? "" : ` <span class="sup-req" aria-hidden="true">*</span>`;
  const name  = `q_${q.id}`;
  let control = "";

  if(q.type === "select"){
    control = `<select class="sup-in" id="${name}" data-qid="${supEsc(q.id)}" data-qtype="select">
        <option value="">${supEsc(supTr("בחר…","Choose…"))}</option>
        ${q.options.map(o => `<option value="${supEsc(supTr(o[0], o[1]))}">${supEsc(supTr(o[0], o[1]))}</option>`).join("")}
      </select>`;
  } else if(q.type === "textarea"){
    control = `<textarea class="sup-in sup-ta" id="${name}" data-qid="${supEsc(q.id)}" data-qtype="textarea"
        rows="3" maxlength="${q.max || 500}"
        placeholder="${supEsc(q.phHe ? supTr(q.phHe, q.phEn) : "")}"></textarea>`;
  } else if(q.type === "multi"){
    control = `<div class="sup-opts" id="${name}" data-qid="${supEsc(q.id)}" data-qtype="multi">
        ${q.options.map((o, i) => {
          const v = supTr(o[0], o[1]);
          return `<label class="sup-opt"><input type="checkbox" value="${supEsc(v)}"><span>${supEsc(v)}</span></label>`;
        }).join("")}
      </div>`;
  } else {
    control = `<input class="sup-in" type="text" id="${name}" data-qid="${supEsc(q.id)}" data-qtype="text"
        maxlength="${q.max || 120}" placeholder="${supEsc(q.phHe ? supTr(q.phHe, q.phEn) : "")}">`;
  }

  return `<div class="sup-q" data-q="${supEsc(q.id)}">
      <label class="field-label" for="${name}">${idx + 1}. ${label}${req}</label>
      ${hint}
      ${control}
    </div>`;
}

function supRenderForm(){
  const box = document.getElementById("supForm");
  if(!box) return;

  const s = supSvc(supSelectedKey);
  if(!s){ box.hidden = true; box.innerHTML = ""; return; }

  const keep = supKeepContact();

  box.hidden = false;
  box.innerHTML = `
    <div class="sup-form-head">
      <div>
        <p class="sup-form-kicker">${supEsc(supTr("הפנייה שלך בנושא","Your request about"))}</p>
        <h2 class="sup-form-t">${supEsc(supName(s))}</h2>
      </div>
      <div class="sup-form-price">
        <span class="sup-price${s.price === 0 ? " is-free" : ""}">${supEsc(supPriceLabel(s.price))}</span>
        <button type="button" class="sup-change" id="supChangeBtn">${supEsc(supTr("שינוי שירות","Change service"))}</button>
      </div>
    </div>

    <div class="sup-qs">
      ${s.q.map(supQuestionHtml).join("")}
    </div>

    <div class="sup-contact">
      <h3 class="sup-sub-h">${supEsc(supTr("איך אחזור אליך?","How do I get back to you?"))}</h3>
      <div class="sup-q">
        <label class="field-label" for="supName">${supEsc(supTr("שם","Name"))} <span class="sup-req" aria-hidden="true">*</span></label>
        <input class="sup-in" type="text" id="supName" autocomplete="name" maxlength="60">
      </div>
      <div class="sup-q">
        <label class="field-label" for="supPhone">${supEsc(supTr("טלפון","Phone"))} <span class="sup-req" aria-hidden="true">*</span></label>
        <input class="sup-in" type="tel" id="supPhone" autocomplete="tel" dir="ltr" maxlength="20" placeholder="050-0000000">
      </div>
      <div class="sup-q">
        <label class="field-label" for="supEmail">${supEsc(supTr("אימייל (לא חובה)","Email (optional)"))}</label>
        <input class="sup-in" type="email" id="supEmail" autocomplete="email" dir="ltr" maxlength="80">
      </div>
    </div>

    <div class="validation-msg" id="supValidation" style="display:none"></div>

    <button type="button" class="btn btn-accent" id="supSendBtn">
      ${supEsc(supTr("שליחת הפנייה בוואטסאפ","Send request on WhatsApp"))}
    </button>
    <p class="sup-send-note">${supEsc(supTr(
      "הכפתור פותח וואטסאפ עם ההודעה מוכנה — רק ללחוץ שליחה. הפרטים לא נשמרים באתר.",
      "The button opens WhatsApp with the message ready — just hit send. Nothing is stored on the site."))}</p>
    <p class="sup-fallback" id="supFallback" hidden></p>`;

  document.getElementById("supName").value  = keep.name;
  document.getElementById("supPhone").value = keep.phone;
  document.getElementById("supEmail").value = keep.email;

  document.getElementById("supSendBtn").addEventListener("click", supSend);
  document.getElementById("supChangeBtn").addEventListener("click", () => {
    const card = document.querySelector(`.sup-card[data-key="${supSelectedKey}"]`);
    if(card) card.scrollIntoView({ behavior:"smooth", block:"center" });
  });
}

/* ==================== בחירת שירות ==================== */
/* scroll: "smooth" (לחיצה על כרטיס) | "auto" (קישור ישיר — קפיצה מיידית,
   בלי אנימציה מוזרה בטעינת הדף) | false (בלי גלילה). */
function supSelect(key, scroll){
  if(!supSvc(key)) return;
  supSelectedKey = key;
  document.querySelectorAll(".sup-card").forEach(c => {
    const on = c.dataset.key === key;
    c.classList.toggle("is-on", on);
    c.setAttribute("aria-pressed", on ? "true" : "false");
  });
  supRenderForm();
  try{ history.replaceState(null, "", "support.html?service=" + encodeURIComponent(key)); }catch(e){}
  if(scroll !== false){
    const box = document.getElementById("supForm");
    if(box) box.scrollIntoView({ behavior: scroll || "smooth", block:"start" });
  }
}

/* ==================== איסוף תשובות ובדיקה ==================== */
function supCollect(s){
  const out = [];
  let missing = null;

  s.q.forEach(q => {
    const el = document.getElementById(`q_${q.id}`);
    if(!el) return;
    let val = "";
    if(q.type === "multi"){
      val = Array.from(el.querySelectorAll("input:checked")).map(i => i.value).join(", ");
    } else {
      val = (el.value || "").trim();
    }
    if(!val){
      if(!q.opt && !missing) missing = q;
      return;
    }
    out.push({ q: supTr(q.he, q.en).replace(/\s*\(לא חובה\)|\s*\(optional\)/g, ""), a: val });
  });

  return { answers: out, missing };
}

function supNormPhone(raw){
  let p = String(raw || "").replace(/[\s\-()]/g, "");
  if(p.indexOf("+972") === 0) p = "0" + p.slice(4);
  else if(p.indexOf("972") === 0 && p.length > 10) p = "0" + p.slice(3);
  return p;
}

function supShowError(msg){
  const box = document.getElementById("supValidation");
  if(!box) return;
  box.textContent = msg;
  box.style.display = "block";
  box.scrollIntoView({ behavior:"smooth", block:"center" });
}

/* ==================== בניית ההודעה ושליחה ==================== */
function supBuildMessage(s, answers, c){
  const L = [];
  L.push(supTr("היי דביר, אשמח לפנות בנושא שירות:","Hi Dvir, I'd like to request a service:"));
  L.push("*" + supName(s) + "* — " + supPriceLabel(s.price));
  L.push("");
  L.push(supTr("שם","Name") + ": " + c.name);
  L.push(supTr("טלפון","Phone") + ": " + c.phone);
  if(c.email) L.push(supTr("אימייל","Email") + ": " + c.email);
  if(answers.length){
    L.push("");
    answers.forEach(a => L.push("• " + a.q + " — " + a.a));
  }
  L.push("");
  L.push(supTr("(נשלח מדף השירות באתר · מק\"ט ","(sent from the site's service page · SKU ") + s.sku + ")");
  return L.join("\n");
}

function supSend(){
  const s = supSvc(supSelectedKey);
  if(!s) return;

  const box = document.getElementById("supValidation");
  if(box) box.style.display = "none";

  const { answers, missing } = supCollect(s);
  if(missing){
    supShowError(supTr("חסרה תשובה לשאלה: ","Missing an answer: ") + supTr(missing.he, missing.en));
    const el = document.getElementById(`q_${missing.id}`);
    if(el){ el.scrollIntoView({ behavior:"smooth", block:"center" }); if(el.focus) el.focus(); }
    return;
  }

  const name  = document.getElementById("supName").value.trim();
  const phone = supNormPhone(document.getElementById("supPhone").value);
  const email = document.getElementById("supEmail").value.trim();

  /* אותה בדיקת טלפון כמו ב-checkout.js, כדי שלא יהיו שני תקנים לאותו שדה. */
  if(name.length < 2 || !/^0\d{8,9}$/.test(phone)){
    supShowError(supTr("נא למלא שם וטלפון תקין (למשל 050-0000000).",
                       "Please fill in a name and a valid phone number (e.g. 050-0000000)."));
    return;
  }

  const msg = supBuildMessage(s, answers, { name, phone, email });
  const url = `https://wa.me/${SUP_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

  const w = window.open(url, "_blank", "noopener");
  /* חוסם פופ-אפים במובייל הוא מציאות. במקום לאבד את הפנייה — קישור גלוי. */
  if(!w){
    const fb = document.getElementById("supFallback");
    if(fb){
      fb.hidden = false;
      fb.innerHTML = `<a href="${url}" target="_blank" rel="noopener">${
        supEsc(supTr("הדפדפן חסם את החלון — לחץ כאן לפתיחת וואטסאפ","Your browser blocked the window — tap here to open WhatsApp"))
      }</a>`;
      fb.scrollIntoView({ behavior:"smooth", block:"center" });
    }
  }
}

/* ==================== תרגום ומעבר שפה ==================== */
function supApplyI18n(){
  document.querySelectorAll("[data-he]").forEach(el => {
    const v = LANG === "en" ? el.dataset.en : el.dataset.he;
    if(v != null) el.textContent = v;
  });
  document.querySelectorAll("[data-ph-he]").forEach(el => {
    el.placeholder = LANG === "en" ? el.dataset.phEn : el.dataset.phHe;
  });
  const ft = document.getElementById("footerText");
  if(ft) ft.textContent = t("footerText");
  renderFooterLegal();
  document.querySelectorAll(".lang-btn").forEach(b => b.classList.toggle("active", b.dataset.lang === LANG));
}

function setLang(lang){
  if(lang === LANG) return;
  const keep = supKeepContact();
  setLangCore(lang);
  supApplyI18n();
  supRenderCatalog();
  supRenderForm();
  if(supSelectedKey){
    const g = id => document.getElementById(id);
    if(g("supName")){ g("supName").value = keep.name; g("supPhone").value = keep.phone; g("supEmail").value = keep.email; }
  }
  /* ⚠️ ההדר נבנה פעם אחת ב-site-header.js ולא מתרגם את עצמו מחדש.
     בונים אותו שוב כדי שהניווט יתחלף יחד עם הדף. */
  const header = document.querySelector("header");
  if(header && typeof buildSiteHeader === "function"){
    delete header.dataset.shBuilt;
    buildSiteHeader();
  }
  document.querySelectorAll(".lang-btn").forEach(b => b.classList.toggle("active", b.dataset.lang === LANG));
}

/* ==================== איתחול ==================== */
/* ה-header של האתר הוא sticky, וגובהו משתנה בין מובייל לדסקטופ. מודדים
   אותו פעם אחת (ובכל שינוי גודל) כדי שרצועת הקטגוריות תיצמד *מתחתיו*
   ולא תיעלם מאחוריו, ושקפיצה לקטגוריה לא תסתיים מתחת לשניהם. */
function supSyncHeaderHeight(){
  const h = document.querySelector("header");
  if(!h) return;
  const px = Math.round(h.getBoundingClientRect().height);
  if(px > 0) document.documentElement.style.setProperty("--sup-headh", px + "px");
}

function supInit(){
  supApplyI18n();
  supRenderCatalog();
  supSyncHeaderHeight();
  /* ההדר נבנה ב-site-header.js שרץ לפנינו, אבל הלוגו מוחלף ב-sprite.js
     והגופנים נטענים מאוחר — שתי סיבות שגובה ההדר ישתנה אחרי הטעינה. */
  window.addEventListener("load", supSyncHeaderHeight);
  window.addEventListener("resize", supSyncHeaderHeight);

  const host = document.getElementById("supCatalog");
  if(host){
    host.addEventListener("click", e => {
      const card = e.target.closest(".sup-card");
      if(card) supSelect(card.dataset.key);
    });
    host.addEventListener("keydown", e => {
      if(e.key !== "Enter" && e.key !== " ") return;
      const card = e.target.closest(".sup-card");
      if(!card) return;
      e.preventDefault();          /* רווח גולל את הדף אם לא עוצרים אותו */
      supSelect(card.dataset.key);
    });
  }

  const nav = document.getElementById("supCats");
  if(nav){
    nav.addEventListener("click", e => {
      const btn = e.target.closest("[data-jump]");
      if(!btn) return;
      const sec = document.getElementById(btn.dataset.jump);
      if(sec) sec.scrollIntoView({ behavior:"smooth", block:"start" });
    });
  }

  /* קישור ישיר: support.html?service=diagnostics — כדי שאפשר יהיה
     להפנות מהאתר או מהודעה ישר לשירות הנכון. מי שהגיע דרך קישור כזה
     כבר בחר, ולכן נוחתים על הטופס ולא בראש הדף. */
  let want = "";
  try{ want = new URLSearchParams(location.search).get("service") || ""; }catch(e){}
  if(want && supSvc(want)) supSelect(want, "auto");
}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", supInit);
} else {
  supInit();
}

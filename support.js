/* =====================================================================
   DvirTech — שירות ותמיכה (support.html)
   =====================================================================
   רשימת השירותים מהמחירון + לוח פנייה שהשאלות בו משתנות לפי מה שנבחר.

   ⚠️ בחירה מרובה — האינטראקציה המרכזית של הדף
   -------------------------------------------
   אפשר לסמן ✓ כמה שירותים ולשלוח אותם בפנייה אחת, וגם ללחוץ "פנייה
   בוואטסאפ" על כרטיס בודד ולשלוח רק אותו. ההודעה המשולבת מציגה כל
   שירות בשורה משלו עם "+" בתחילתה, והתשובות שלו בשורות מתחתיו:

       היי דביר, אני מעוניין בשירותים הבאים:
       + אבחון תקלה — 150 ₪
          • מה קורה? — המסך נשאר שחור
       + ניקוי פנימי + משחה תרמית — 150 ₪

   ⚠️ אין ולא יהיה כאן סכום, עגלה או תשלום. השירותים אינם נרכשים בדף
   הזה — כל פנייה נסגרת מול דביר אישית. סכום בתחתית ההודעה היה הופך
   פנייה להזמנה מאושרת, וזה בדיוק מה שאסור.

   ⚠️ מקור המחירים והמק"טים
   ------------------------
   השמות והמחירים כאן הם העתק מדויק של PRICE_LIST ב-
   CRM+SUPPLIERS/2-pricelist-picker.gs, והמפתחות (key) והמק"טים (sku)
   הם אותם מפתחות בדיוק כמו ב-REAL_SUMIT_SKUS ב-4-payment-api.gs.
   זה לא מקרי: כשהדף הזה יחובר בעתיד להזמנה אמיתית, ה-key שנשמר ב-
   data-key על הכרטיס הוא כבר המפתח שהשרת יודע לתרגם למק"ט SUMIT.
   מחיר שמשתנה במחירון — לעדכן גם כאן.

   ⚠️ לא כל 24 השירותים שבמחירון מופיעים כאן. שלושה מהם הם תמחור פנימי
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
    /* 🔴 **תוקן 26.08 — דביר: "זה כבר לא נכון".** ההרכבה אינה חינם
       ואינה מתווספת לעגלה מעצמה: היא שירות בתשלום שנבחר בקופה. */
    noteHe:"קונה את החלקים דרך האתר? מחיר לקוחות DvirTech (הרכבה מ-250 ₪ במקום 450 ₪) נבחר ישירות בקופה תחת \"שירותים נוספים\" — אין צורך לפנות דרך כאן.",
    noteEn:"Buying the parts through the site? The DvirTech customer price (assembly from 250 ₪ instead of 450 ₪) is picked right at checkout under \"Add-on services\" — no need to request it here." },
  { key:"os",       he:"מערכת הפעלה",  en:"Operating system" },
  { key:"visit",    he:"ביקור בית",    en:"Home visit",
    noteHe:"המחיר נקבע לפי זמן הנסיעה אליך. לא בטוח לאיזו מדרגה אתה שייך? בחר את הקרובה ביותר — בטופס תתבקש רק לציין את היישוב, ואני אאשר לך את המחיר המדויק לפני שנקבע.",
    noteEn:"The price depends on travel time to you. Not sure which tier fits? Pick the closest one — the form only asks for your town, and I'll confirm the exact price before we schedule." },
  { key:"support",  he:"תמיכה",        en:"Support" },
  { key:"repairs",  he:"תיקונים",      en:"Repairs" },
  { key:"bundles",  he:"חבילות",       en:"Bundles" }
];


/* =====================================================================
   🎯 מקטעים לפי כוונה — סוגר את פתוח #3 (30.08)
   =====================================================================
   דביר: "עמוד השירותים לפי כוונה + בורר מה המחיר שלי."

   🔴 **למה זה נדרש:** הקטגוריות (הרכבה · מערכת הפעלה · תיקונים…)
   הן איך **דביר** חושב על העבודה. הלקוח לא מגיע עם "אני צריך
   קטגוריית תיקונים" — הוא מגיע עם **"המחשב שלי איטי"** או **"בניתי
   מחשב וצריך שיורכב"**. הכוונות כאן הן שכבה מעל הקטגוריות: הן
   מסננות אותן, לא מחליפות אותן, ולכן הכל ממשיך לעבוד גם כשלא
   נבחרה כוונה (ברירת המחדל = הכל, בדיוק כמו קודם).

   ⚠️ שירות יכול להופיע בכמה כוונות — זה מכוון: "העברת נתונים"
   רלוונטית גם למחשב חדש וגם לתקלה. */
const SUP_INTENTS = [
  { key:"new",     ic:"🖥️", he:"קניתי / בניתי מחשב",  en:"I bought or built a PC",
    subHe:"הרכבה, Windows, תוכנות, התקנה אצלך", subEn:"Assembly, Windows, software, setup at your place",
    keys:["assembly-parts","assembly-premium","assembly-win","win11-own-license",
          "win-laptop","onsite-setup","bundle-home","data-transfer"] },
  { key:"broken",  ic:"🚑", he:"משהו לא עובד",         en:"Something is broken",
    subHe:"אבחון, תיקון, פירמוט, מחשב שנתקע או איטי", subEn:"Diagnosis, repair, clean install, a slow or stuck PC",
    keys:["diagnostics","diagnose-repair","format-reinstall","clean-thermal",
          "bundle-revive","remote-support"] },
  { key:"upgrade", ic:"⚡", he:"רוצה לשדרג",           en:"I want an upgrade",
    subHe:"החלפת רכיב, שדרוג מלא, ניקוי ומשחה", subEn:"Component swap, full upgrade, cleaning and paste",
    keys:["part-upgrade","part-complex","bundle-upgrade","bundle-full-upgrade","clean-thermal"] },
  { key:"home",    ic:"🏠", he:"שיגיעו אליי הביתה",    en:"Come to my place",
    subHe:"ביקור בית, התקנה בעמדה שלך", subEn:"Home visit, setup at your desk",
    keys:["visit-30","onsite-setup","bundle-home"] },
  { key:"quick",   ic:"💬", he:"עזרה מהירה",           en:"Quick help",
    subHe:"תמיכה מרחוק, התקנת תוכנות, העברת נתונים", subEn:"Remote support, software install, data transfer",
    keys:["remote-support","software-install","data-transfer"] }
];

let supIntent = "";           /* "" = הכל */

function supIntentKeys_(){
  const it = SUP_INTENTS.filter(function(x){ return x.key === supIntent; })[0];
  return it ? it.keys : null;
}

function supInIntent_(s){
  const keys = supIntentKeys_();
  return !keys || keys.indexOf(s.key) !== -1;
}

function supSetIntent(key){
  supIntent = (supIntent === key) ? "" : key;
  supRenderIntents();
  supRenderCats();
  supRenderCatalog();
  supSyncCatBadges();
  const host = document.getElementById("supCatalog");
  if(host && supIntent) host.scrollIntoView({ behavior:"smooth", block:"start" });
}

function supRenderIntents(){
  const host = document.getElementById("supIntents");
  if(!host) return;
  host.innerHTML =
    '<p class="sup-int-lead">' + supEsc(supTr("מה הביא אותך?","What brings you here?")) +
      ' <span>' + supEsc(supTr("בוחרים — ורואים רק את מה שרלוונטי","Pick one and see only what is relevant")) + '</span></p>' +
    '<div class="sup-int-row">' +
    SUP_INTENTS.map(function(it){
      const n = SUP_SERVICES.filter(function(s){ return it.keys.indexOf(s.key) !== -1; }).length;
      return '<button type="button" class="sup-int' + (supIntent === it.key ? " is-on" : "") +
             '" data-intent="' + it.key + '" aria-pressed="' + (supIntent === it.key) + '">' +
             '<span class="sup-int-ic" aria-hidden="true">' + it.ic + '</span>' +
             '<b>' + supEsc(supTr(it.he, it.en)) + '</b>' +
             '<span class="sup-int-sub">' + supEsc(supTr(it.subHe, it.subEn)) + '</span>' +
             '<span class="sup-int-n">' + n + '</span>' +
             '</button>';
    }).join("") +
    '</div>' +
    (supIntent
      ? '<button type="button" class="sup-int-clear" data-intent-clear="1">' +
        supEsc(supTr("× הצג את כל השירותים","× Show all services")) + '</button>'
      : "");

  /* מאזין אחד על המכל — לא onclick בתוך HTML (מדיניות CSP-ידידותית,
     וגם כי ה-HTML נבנה מחדש בכל סינון). */
  if(!host.dataset.wired){
    host.dataset.wired = "1";
    host.addEventListener("click", function(e){
      const clear = e.target.closest("[data-intent-clear]");
      if(clear){ supIntent = ""; supRenderIntents(); supRenderCats(); supRenderCatalog(); supSyncCatBadges(); return; }
      const b = e.target.closest("[data-intent]");
      if(b) supSetIntent(b.dataset.intent);
    });
  }
}


/* =====================================================================
   💳 "מה המחיר שלי?" — ואיסור כפל הטבות
   =====================================================================
   דביר (30.08): *"כל דבר צריך להיות מחובר ישירות ללקוח שיראה לו
   מחירים מוזלים… צריך גם להוסיף שאין כפל מבצעים — אי אפשר גם מחיר
   הרכבה חלקים מהחנות וגם עוד מחיר DvirTech, זה ירושש אותי."*

   🔴 **הכלל: הטבה אחת — הטובה ביותר. לעולם לא סכום שלהן.**
   שלוש דרכים לקבל מחיר מוזל, והן **מתחרות** זו בזו:
     1. מחיר DvirTech (רכשת אצלנו חומרה) — 250 ₪ במקום 450.
     2. הנחת מנוי Care — אחוז ממחיר הטכנאי (PLUS: 450 → 414).
     3. (עתידי) מבצע נקודתי — ייכנס לאותו חישוב בדיוק.
   המחיר שמוצג = **הנמוך מביניהם**, ומצוין איזו הטבה חלה. בדוגמה
   למעלה DvirTech מנצח (250 < 414) — ולכן מנוי PLUS **אינו** מוריד
   את ה-250 ל-230, כפי שהיה עד 30.08. זה השינוי שדביר ביקש.

   ⚠️⚠️ **אבטחה — כל זה תצוגה בלבד.** הנתונים נקראים ממטמון שנכתב
   רק אחרי כניסה מאומתת (OTP), אבל **הדפדפן אינו מקור אמת**: בקופה
   השרת מתמחר מחדש מ-SERVICE_OPTIONS_ ומתעלם מכל מספר שהגיע ממנו,
   ובקריאת שירות דביר גובה ידנית מול הגיליון. ערך מזויף
   ב-localStorage משנה מה שכתוב על המסך של המזייף — ולא שקל אחד
   במה שנגבה. **אסור** להוסיף כאן מסלול שבו מחיר עובר מהדפדפן לשרת.
   ⚠️ הכלל חייב להישאר זהה לתקנון §6.8א (אין כפל הטבות). */
function supMe_(){
  try{
    const raw = localStorage.getItem("dvt_acct_profile");
    if(!raw) return null;
    const p = JSON.parse(raw);
    if(!p || !(p.exp > Date.now())) return null;
    return p;
  }catch(e){ return null; }
}

/* המחיר האפקטיבי לגולש הזה + איזו הטבה יצרה אותו. */
function supEffective_(s){
  const tech = Number(s.price) || 0;
  const me = supMe_();
  const plan = supPlan_();
  let best = tech, via = "";

  /* מחיר DvirTech — רק ללקוח שהוכח כזכאי. גולש לא מזוהה רואה את
     מחיר הטכנאי כראשי ואת מחיר DvirTech כיעד להשגה. */
  if(s.dvt != null && s.dvt < best && me && me.eligible){ best = s.dvt; via = "dvt"; }

  /* הנחת מנוי — על מחיר הטכנאי, ורק אם היא טובה יותר. */
  if(plan && plan.pct > 0){
    const planPrice = Math.round(tech * (1 - plan.pct / 100));
    if(planPrice < best){ best = planPrice; via = "plan"; }
  }
  return { tech: tech, dvt: (s.dvt != null ? s.dvt : tech), price: best, via: via };
}

function supMyPriceRender(){
  const host = document.getElementById("supMyPrice");
  if(!host) return;
  const me = supMe_();
  const plan = supPlan_();

  if(!me){
    host.className = "sup-me";
    host.innerHTML =
      '<div class="sup-me-in">' +
        '<span class="sup-me-ic" aria-hidden="true">🔎</span>' +
        '<div><b>' + supEsc(supTr("מה המחיר שלי?","What is my price?")) + '</b>' +
        '<span>' + supEsc(supTr(
          "המחירים למטה הם מחיר הטכנאי. ללקוחות שקנו אצלנו חומרה יש מחיר מוזל — התחברו וכל העמוד יציג את המחיר שלכם.",
          "Prices below are the technician price. Customers who bought hardware here get a reduced price — sign in and the whole page shows yours.")) + '</span></div>' +
        '<a class="btn btn-primary sup-me-cta" href="account.html">' +
          supEsc(supTr("כניסה לחשבון","Sign in")) + '</a>' +
      '</div>';
    return;
  }

  const first = supEsc(String(me.name || "").split(" ")[0]);
  const rows = [];
  if(me.eligible){
    rows.push('<span class="sup-me-tag is-on">✅ ' +
      supEsc(supTr("לקוח DvirTech — מחיר מועדף על כל העמוד","DvirTech customer — preferred pricing across this page")) + '</span>');
  }else{
    const need = Math.max(0, (Number(me.eligMin) || 3000) - (Number(me.buy12) || 0));
    rows.push('<span class="sup-me-tag">' + supEsc(supTr(
      "עוד " + need.toLocaleString() + " ₪ בקניית מוצרים (או מחשב שלם / מנוי) — ומחיר DvirTech נפתח",
      need.toLocaleString() + " more in product purchases (or a full PC / a plan) unlocks DvirTech pricing")) + '</span>');
  }
  if(plan){
    rows.push('<span class="sup-me-tag is-plan">🛡️ Care ' + supEsc(plan.plan) + ' · ' +
      supEsc(supTr("הנחה " + plan.pct + "% על עבודה", plan.pct + "% off labour")) + '</span>');
  }

  host.className = "sup-me is-in";
  host.innerHTML =
    '<div class="sup-me-in">' +
      '<span class="sup-me-ic" aria-hidden="true">👤</span>' +
      '<div><b>' + supEsc(supTr("שלום " + first + " — אלה המחירים שלך", "Hi " + first + " — these are your prices")) + '</b>' +
      '<div class="sup-me-tags">' + rows.join("") + '</div></div>' +
      '<a class="sup-me-link" href="account.html">' + supEsc(supTr("האזור האישי ←","My account →")) + '</a>' +
    '</div>' +
    ((me.eligible && plan)
      ? '<p class="sup-me-note">' + supEsc(supTr(
          "יש לך גם מחיר DvirTech וגם מנוי — ההטבות לא מצטברות, ובכל שירות מוצג המחיר הנמוך מביניהן.",
          "You have both DvirTech pricing and a plan — benefits do not stack; each service shows the lower of the two.")) + '</p>'
      : "");
}

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
  /* 🔴 **הפירוט "מה כלול" — הגדרת דביר, 25.08.** ההרכבה והתקנת
     Windows התערבבו; מהיום כל פירוט יושב בשירות הנכון:
       הרכבה  = כבלים, POST, תקינות רכיבים, עלייה עד BIOS (בלי OS!)
       Windows = בדיקת רכיבים, דרייברים בסיסיים, טמפרטורות, יציבות
     "דברים מהסוג הזה ממש מעשירים את האתר." */
  /* 🔴 **המחירון הדו-שכבתי (27.08, DVT-NEXT-BUILD §1.2).**
     `price` = מחיר טכנאי (לכל אחד) · `dvt` = מחיר לקוחות DvirTech —
     מחשב שלם / 3,000 ₪+ ב-12 החודשים / מנוי פעיל (הרף עלה מ-1,000
     בהחלטת דביר 27.08). שני המחירים אמיתיים ונגבים בפועל — לכן
     מותר להציגם זה לצד זה. */
  /* 🔴 שלוש רמות ההרכבה צומצמו לשתיים (27.08, החלטת דביר): מחיר
     אחד לכל מחשב — כולל נוזלי/RGB/זכוכית — ופרימיום עם בדיקת עומס. */
  { key:"assembly-parts", sku:"CLI-4010", cat:"assembly", price:450, dvt:250,
    he:"הרכבת מחשב", en:"PC assembly",
    descHe:"הרכבה מלאה של כל הרכיבים — כולל קירור נוזלי, RGB ומארז זכוכית, באותו מחיר. סידור כבלים, הפעלת XMP/EXPO, בדיקת POST ותקינות מלאה עד ה-BIOS. בלי התקנת Windows.",
    descEn:"A full build of every component — liquid cooling, RGB and glass cases included, same price. Cable management, XMP/EXPO, POST check and full health check to BIOS. Windows install not included.",
    q:[ SQ.partsReady, SQ.partsList, SQ.handover ] },

  { key:"assembly-premium", sku:"CLI-4011", cat:"assembly", price:650, dvt:450,
    he:"הרכבה פרימיום — עם דוח מסירה", en:"Premium build — with a hand-over report",
    descHe:"כל מה שבהרכבת המחשב + בדיקת עומס של 3 שעות (טמפרטורות, תדרים, יציבות), דוח מסירה חתום עם התוצאות, וכיול עקומות לשקט או לביצועים.",
    descEn:"Everything in the standard build + a 3-hour stress test (temperatures, clocks, stability), a signed hand-over report, and fan curves tuned for silence or performance.",
    q:[ SQ.partsReady, SQ.partsList, SQ.handover ] },

  { key:"assembly-win", sku:"CLI-4012", cat:"assembly", price:180, dvt:100,
    he:"תוספת Windows להרכבה (+דרייברים ועדכונים)", en:"Windows add-on to a build (+drivers & updates)",
    descHe:"כל מה שבהרכבה (כבלים, POST, תקינות רכיבים, עלייה ל-BIOS) + ערכת Windows מלאה: התקנה נקייה, דרייברים בסיסיים, בדיקת טמפרטורות ובדיקת יציבות. הרישיון לא כלול במחיר.",
    descEn:"Everything in the build (cables, POST, component checks, BIOS boot) + the full Windows kit: clean install, basic drivers, temperature check and a stability test. License not included.",
    q:[ SQ.partsReady, SQ.partsList,
        { id:"hasKey", type:"select",
          he:"יש לך כבר מפתח Windows?", en:"Do you already have a Windows key?",
          hintHe:"המחיר הזה לא כולל רישיון. אם אין לך — אפשר להוסיף אותו (ההרכבה עם רישיון עולה 550 ₪).",
          hintEn:"This price excludes the license. If you don't have one, it can be added (assembly with a license is ₪550).",
          options:[["כן, יש לי מפתח","Yes, I have a key"],
                   ["לא — אשמח שתוסיף רישיון","No — please add a license"],
                   ["לא בטוח","Not sure"]] } ] },

  /* 🔴 CLI-4003 ("הרכבה+Windows+רישיון" 550) ו-CLI-4006 ("Windows+
     רישיון" 300) **נמחקו 27.08** — הרישיון לבדו עולה 200-300 ₪ דילר,
     כלומר מכירה בהפסד ודאי. עד שיש מפיץ מורשה: הלקוח מביא מפתח
     (CLI-4007), ורישיון נסגר רק בתיאום, בלי מחיר מפורסם (§1.4).
     ללקוח עסקי — מקורי בלבד, תמיד. */

  /* ---------- מערכת הפעלה ---------- */
  { key:"win11-own-license", sku:"CLI-4012", cat:"os", price:200, dvt:100,
    he:"התקנת Windows (ללא רישיון/אקטיבציה)", en:"Windows install (no license/activation)",
    descHe:"אותה ערכת התקנה מלאה (בדיקת רכיבים, דרייברים, טמפרטורות, יציבות) — בלי עלות הרישיון.",
    descEn:"The same full install kit (component check, drivers, temperatures, stability) — without the cost of the license.",
    q:[ SQ.deskOrLaptop,
        { id:"licenseKind", type:"select",
          he:"איזה רישיון יש לך?", en:"What kind of license do you have?",
          options:[["מפתח שקניתי","A key I purchased"],
                   ["רישיון דיגיטלי שכבר מחובר למחשב","A digital license already tied to this PC"],
                   ["רישיון של מקום העבודה / Microsoft 365","A work / Microsoft 365 license"],
                   ["לא בטוח","Not sure"]] },
        SQ.files, SQ.boots ] },

  { key:"win-laptop", sku:"CLI-4013", cat:"os", price:280, dvt:150,
    he:"התקנת Windows למחשב נייד (כולל ציד דרייברים)", en:"Windows install on a laptop (incl. driver hunt)",
    descHe:"התקנה נקייה למחשב נייד — כולל איתור והתקנה של הדרייברים הייעודיים של היצרן (טאצ'פד, מקשי פונקציה, סוללה), שזה החלק שלוקח את הזמן.",
    descEn:"A clean install on a laptop — including hunting down the maker's dedicated drivers (touchpad, function keys, battery), which is the part that takes the time.",
    q:[ SQ.files, SQ.boots ] },

  { key:"format-reinstall", sku:"CLI-4014", cat:"os", price:320, dvt:250,
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
  /* 🔴 **מודל הביקור השתנה (27.08):** דמי הגעה לפי מרחק (90/140/
     ‏200 ₪ — זהים לכולם, "הנסיעה עולה לי אותו דבר") + עבודה לפי שעה
     (‏180 ₪ / 140 ₪ ללקוחות DvirTech, שעה נוספת 150/120). הכרטיס
     מציג "מ-" — הסכום המדויק מאושר בטלפון לפני שקובעים. */
  { key:"visit-30", sku:"CLI-4040", cat:"visit", price:270, dvt:230, from:true,
    he:"ביקור בית — אבחון וטיפול אצלך", en:"Home visit — diagnosis & help at your place",
    descHe:"דמי הגעה 90–200 ₪ לפי מרחק הנסיעה + שעת עבודה ראשונה (180 ₪, או 140 ₪ ללקוחות DvirTech). שעה נוספת: 150/120 ₪. המחיר המדויק מאושר איתך לפני שקובעים.",
    descEn:"A travel fee of 90–200 ₪ by distance + the first working hour (180 ₪, or 140 ₪ for DvirTech customers). Extra hour: 150/120 ₪. The exact price is confirmed with you before scheduling.",
    q:[ SQ.city,
        { id:"visitIssue", type:"textarea", max:500,
          he:"מה צריך לעשות בביקור?", en:"What needs to be done during the visit?",
          phHe:"המחשב לא עולה / להתקין ציוד חדש / הרשת נופלת…",
          phEn:"PC won't boot / install new gear / the network keeps dropping…" },
        { id:"deviceCount", type:"select",
          he:"כמה מחשבים או מכשירים?", en:"How many computers or devices?",
          options:[["אחד","One"],["שניים","Two"],["שלושה ומעלה","Three or more"]] },
        SQ.when ] },

  { key:"onsite-setup", sku:"CLI-4017", cat:"visit", price:450, dvt:300,
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
  { key:"remote-support", sku:"CLI-4032", cat:"support", price:170, dvt:120,
    he:"תמיכה מרחוק (עד 45 דק')", en:"Remote support (up to 45 min)",
    descHe:"מתחבר למחשב שלך ופותר בזמן אמת. עד 45 דקות; כל 30 דקות נוספות — 80 ₪ (60 ₪ ללקוחות DvirTech).",
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
  { key:"diagnostics", sku:"CLI-4030", cat:"support", price:150, dvt:100,
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
  { key:"diagnose-repair", sku:"CLI-4031", cat:"support", price:350, dvt:280,
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

  /* ⚠️ המחיר 80 ₪ **אושר על ידי דביר** (16.08.2026) — הוא הועלה ל-100
     בטיוטה ואז הורד. חייב להישאר זהה לשלושת המקומות האחרים:
     PRICE_LIST ב-2-pricelist-picker.gs · DVT_SERVICES ב-checkout.js ·
     SERVICE_OPTIONS_ ב-4-payment-api.gs. שינוי באחד בלי השאר =
     הלקוח רואה מחיר אחד ומשלם אחר.
     ⚠️ מק"ט CLI-4024 **עדיין לא נוצר ב-SUMIT.** כאן זו פנייה בוואטסאפ
     בלבד ולכן אין סיכון, אבל בקופה השורה תיפול עד שהמק"ט ייווצר. */
  { key:"software-install", sku:"CLI-4015", cat:"support", price:80, dvt:50,
    he:"התקנת תוכנות", en:"Software installation",
    descHe:"מתקין ומגדיר את מה שאתה צריך — אופיס, דרייברים, אנטי-וירוס, תוכנות עבודה.",
    descEn:"I install and set up what you need — Office, drivers, antivirus, work software.",
    q:[ { id:"whatSoftware", type:"textarea", max:400,
          he:"אילו תוכנות?", en:"Which software?",
          phHe:"אופיס, כרום, אנטי-וירוס, תוכנת עריכה…",
          phEn:"Office, Chrome, antivirus, an editing suite…" },
        /* ⚠️ שאלת הרישיונות היא לא פורמליות: דביר אינו מספק רישיונות
           לתוכנות צד שלישי, וההנחה השגויה הזו מתגלה בדרך כלל רק כשהוא
           כבר מול המחשב. עדיף לברר את זה בפנייה. */
        { id:"hasLicenses", type:"select",
          he:"יש לך רישיונות לתוכנות האלה?", en:"Do you have licenses for them?",
          hintHe:"רישיונות בתשלום אינם כלולים במחיר השירות.",
          hintEn:"Paid licenses are not included in the service price.",
          options:[["כן, יש לי","Yes, I have them"],
                   ["רק לחלק","For some of them"],
                   ["לא — צריך ייעוץ","No — I need advice"],
                   ["רק תוכנות חינמיות","Free software only"]] },
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
  /* פוצל 27.08: פשוט (זיכרון/SSD) מול מורכב (ספק/קירור/לוח) —
     ההשוואה לשוק הראתה ש-150 אחיד היה +114% מול Sagi על הפשוט. */
  { key:"part-upgrade", sku:"CLI-4034", cat:"repairs", price:100, dvt:50,
    he:"התקנת רכיב פשוט (זיכרון · SSD · כרטיס)", en:"Simple component install (RAM · SSD · card)",
    descHe:"התקנה והרצה של רכיב בהחלפה פשוטה. מחיר הרכיב עצמו לא כלול.",
    descEn:"Installing and running in a simple swap-in component. The part itself is not included.",
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

  { key:"part-complex", sku:"CLI-4035", cat:"repairs", price:200, dvt:120,
    he:"התקנת רכיב מורכב (ספק · קירור · לוח אם)", en:"Complex component install (PSU · cooling · motherboard)",
    descHe:"החלפה שדורשת פירוק והרכבה מחדש של חלק מהמחשב — ספק כוח, קירור או לוח אם — כולל בדיקת יציבות אחרי ההתקנה. מחיר הרכיב לא כלול.",
    descEn:"A swap that needs partial teardown and rebuild — PSU, cooling or motherboard — including a stability check afterwards. The part itself is not included.",
    q:[ SQ.deskOrLaptop ] },

  /* 🔴 **חדש 25.08 — לבקשת דביר.** מחיר 200 ₪ = אמצע טווח השוק
     למעבדות בארץ (150-250 ₪ ל"האצת מחשב"); יושב מעל תמיכה מרחוק
     (120) ומתחת לפירמוט (350), שהוא המדרגה הבאה כשאופטימיזציה לא
     מספיקה. ⚠️ CLI-4033 עדיין לא קיים ב-SUMIT — ליצור שם ידנית. */
  { key:"pc-optimize", sku:"CLI-4033", cat:"repairs", price:200,
    he:"אופטימיזציה ושיפור ביצועים", en:"PC optimization & tune-up",
    descHe:"ניקוי תוכנתי מעמיק: הסרת תוכנות מיותרות, עדכוני מערכת ודרייברים, כיוון תוכנות רקע ואתחול, ובדיקת טמפרטורות. המחשב מרגיש חדש — בלי פירמוט.",
    descEn:"A deep software tune-up: junk removal, system and driver updates, startup and background-app tuning, and a temperature check. Feels new — without a format.",
    q:[ SQ.deskOrLaptop,
        { id:"optSymptom", type:"select",
          he:"מה הכי מפריע?", en:"What bothers you most?",
          options:[["איטי בהפעלה","Slow to start"],
                   ["איטי בעבודה שוטפת","Slow in daily use"],
                   ["משחקים לא רצים חלק","Games don't run smoothly"],
                   ["הכל — תחזוקה כללית","Everything — a general tune-up"]] } ] },

  { key:"clean-thermal", sku:"CLI-4036", cat:"repairs", price:180, dvt:140,
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

  { key:"data-transfer", sku:"CLI-4016", cat:"repairs", price:250, dvt:180,
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
  /* 🔴 עודכן 27.08 — המחירים והתכולה לפי DVT-NEXT-BUILD §1.2.
     "רישיון" הוסר מהתכולה (‏§1.4 — אין מקור רישיונות עדיין). */
  { key:"bundle-new-pc", sku:"CLI-4020", cat:"bundles", price:330,
    he:"חבילה: מחשב חדש — מוכן לעבודה", en:"Bundle: new PC — ready to work",
    descHe:"הרכבה + Windows (ללא רישיון) + דרייברים ועדכונים + תוכנות בסיס. בנפרד: 400 ₪ — חוסך 70 ₪. מחיר לקוחות DvirTech.",
    descEn:"Assembly + Windows (no license) + drivers & updates + base software. Separately: 400 ₪ — you save 70 ₪. DvirTech customer price.",
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

  { key:"bundle-home", sku:"CLI-4021", cat:"bundles", price:790, dvt:650,
    he:"חבילה: מחשב חדש עד הבית", en:"Bundle: new PC to your door",
    descHe:"הכל — הרכבה, Windows, תוכנות, הגעה אליך, התקנה מלאה בעמדה, העברת נתונים מהישן והדרכה קצרה.",
    descEn:"Everything — assembly, Windows, software, arrival, full desk setup, data transfer from the old PC and a short walkthrough.",
    q:[ SQ.city,
        { id:"bundleSpec2", type:"textarea", opt:true, max:400,
          he:"מה החלקים או מה התקציב? (לא חובה)", en:"Which parts, or what budget? (optional)",
          phHe:"רשימת חלקים אם יש, או תקציב משוער",
          phEn:"A parts list if you have one, or an approximate budget" } ] },

  { key:"bundle-upgrade", sku:"CLI-4022", cat:"bundles", price:240, dvt:190,
    he:"חבילה: שדרוג מהיר", en:"Bundle: quick upgrade",
    descHe:"התקנת עד 2 רכיבים + ניקוי פנימי + משחה תרמית + בדיקת ביצועים. מחיר הרכיבים לא כלול.",
    descEn:"Up to 2 components installed + internal clean + thermal paste + a performance check. Parts not included.",
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

  /* 🔴 **"חבילת ליווי שנתית" (CLI-4022) הוסרה מהדף — 25.08, הוראת
     דביר:** "יש לנו כבר 3 כאלה של DvirTech Care." המסלולים CARE/PLUS/
     PRO מוצגים באזור #care ומנוהלים בהצטרפות מתואמת (ראה תקנון 6.6).
     המק"ט נשאר ב-SUMIT ובמחירון — להיסטוריית מסמכים בלבד. */

  { key:"bundle-full-upgrade", sku:"CLI-4023", cat:"bundles", price:620, dvt:500,
    he:"חבילה: שדרוג מלא", en:"Bundle: full upgrade",
    descHe:"כל מה שבשדרוג המהיר + פירמוט והתקנה מחדש של Windows + העברת הנתונים חזרה. המחשב חוזר כמו חדש.",
    descEn:"Everything in the quick upgrade + a format and clean Windows reinstall + your data moved back. The PC comes back like new.",
    q:[ { id:"currentPc2", type:"textarea", max:400,
          he:"מה המחשב שיש לך היום?", en:"What PC do you have today?",
          phHe:"דגם או הרכיבים העיקריים, ואם ידוע — גיל המחשב",
          phEn:"Model or the main components, and its age if you know it" } ] },

  /* ⭐ "החייאת מחשב" — החבילה החשובה ביותר לפי מחקר המודעות: אנשים
     מחפשים תסמינים ("מחשב איטי", "לא נדלק") — לא שם של שירות. */
  { key:"bundle-revive", sku:"CLI-4024", cat:"bundles", price:830, dvt:690,
    he:"⭐ החייאת מחשב — איטי? תקוע? נחזיר אותו לחיים", en:"⭐ PC revival — slow? stuck? back to life",
    descHe:"ביקור בית + אבחון מלא + פירמוט והתקנה מחדש + העברת כל הקבצים + התקנת התוכנות שלך. הכל בפגישה אחת, אצלך.",
    descEn:"A home visit + full diagnosis + format and clean reinstall + all your files moved + your software installed. All in one visit, at your place.",
    q:[ SQ.city,
        { id:"reviveSymptom", type:"select",
          he:"מה קורה עם המחשב?", en:"What's going on with the PC?",
          options:[["איטי מאוד","Very slow"],["נתקע או קורס","Freezes or crashes"],
                   ["לא נדלק בכלל","Won't turn on at all"],["וירוסים / פרסומות","Viruses / adware"],
                   ["הכל ביחד","All of the above"]] },
        SQ.when ] },
];

/* ==================== מצב ==================== */
/* ⚠️ הבחירה היא **רשימה** ולא מפתח בודד, וזה כל השינוי המהותי בדף.
   לקוח שצריך גם ניקוי פנימי וגם שדרוג רכיב לא אמור לשלוח שתי פניות
   נפרדות ולא אמור לבחור אחד ולוותר על השני. הסדר נשמר לפי סדר הסימון
   כדי שההודעה תצא באותו סדר שבו הלקוח חשב עליה.

   supAnswers חי מעבר לרינדור מחדש של הלוח (וגם אחרי ביטול סימון), כך
   ששירות שהוסר ואז הוחזר חוזר עם התשובות שכבר נכתבו בו. */
let supPicked = [];
const supAnswers = Object.create(null);            /* "svcKey|qid" -> string | string[] */
const supContactState = { name:"", phone:"", email:"" };
let supPanelSeen = false;                          /* האם לוח הפנייה במסך */
let supSpyObs = null;

function supSvc(key){ return SUP_SERVICES.find(s => s.key === key) || null; }
function supName(s){ return supTr(s.he, s.en); }
function supPriceLabel(p, from){
  if(p === 0) return supTr("חינם","Free");
  const n = p.toLocaleString() + " ₪";
  return from ? supTr("מ-","from ") + n : n;
}

/* מנוי Care פעיל של הגולש — נכתב ע"י account.js אחרי כניסה מאומתת.
   🔴 **תצוגה בלבד.** מה שקובע בפועל הוא המנוי בגיליון, שדביר שולף
   בעצמו בעת החיוב — ערך מזויף ב-localStorage משנה מה מוצג על המסך
   של המזייף, ולא שקל אחד במה שנגבה. תוקף מקומי שבוע — אחרי זה
   הלקוח פשוט ייכנס שוב לאזור האישי. */
function supPlan_(){
  try{
    const raw = localStorage.getItem("dvt_acct_plan");
    if(!raw) return null;
    const p = JSON.parse(raw);
    if(!p || !(p.pct > 0) || !(p.exp > Date.now())) return null;
    return p;
  }catch(e){ return null; }
}

/* המחיר בכרטיס — שתי שכבות כשיש `dvt`, ושלישית כשיש מנוי פעיל:
   מחיר הטכנאי מחוק, מחיר DvirTech פעיל, ומתחתיו "המחיר שלך עם PLUS".
   ⚠️ שני המחירים העליונים נגבים בפועל — לכן הקו החתוך חוקי (§6.8).
   הנחת המנוי חלה על מחיר DvirTech, כפי שקובע התקנון (על עבודה בלבד). */
function supPriceHtml(s){
  if(s.dvt != null && s.dvt < s.price){
    /* 🔴 **הוסר 30.08 — כאן ישב חישוב כפל ההטבות.** הגרסה הקודמת
       הכפילה את הנחת המנוי על **מחיר DvirTech** (250 → 230), כלומר
       העניקה את שתי ההטבות יחד. דביר: "אי אפשר גם מחיר הרכבה
       חלקים מהחנות וגם עוד מחיר DvirTech — זה ירושש אותי."
       ההכרעה עברה ל-supEffective_: הטבה אחת, הטובה ביותר.
       ⚠️ לא להחזיר שורת "שלך עם PLUS" שמחושבת מ-dvt. */
    const eff = supEffective_(s);
    const why = `<button type="button" class="sup-price-tag sup-price-why" onclick="supWhyTiers(event)">${
      supEsc(eff.via === "plan" ? supTr("מחיר המנוי שלך · מה זה?","Your plan price · what's this?")
           : eff.via === "dvt"  ? supTr("המחיר שלך · לקוח DvirTech","Your price · DvirTech customer")
           : supTr("ללקוחות DvirTech · מה זה?","DvirTech customers · what's this?"))}</button>`;
    /* מחובר וזכאי → המחיר שלו ראשי ומחיר הטכנאי מחוק לצידו.
       לא מחובר / לא זכאי → מחיר הטכנאי ראשי, ומחיר DvirTech מוצג
       כיעד להשגה. בשני המקרים מוצג **מחיר אחד** ולא סכום הטבות. */
    if(eff.via){
      return `<s class="sup-price-was">${supEsc(supPriceLabel(eff.tech, s.from))}</s>` +
             `<span class="sup-price-now">${supEsc(supPriceLabel(eff.price, s.from))}</span>` + why;
    }
    return `<span class="sup-price-now">${supEsc(supPriceLabel(eff.tech, s.from))}</span>` +
           `<span class="sup-price-dvt">${supEsc(supTr("ללקוחות DvirTech: ","DvirTech customers: ") +
             supPriceLabel(eff.dvt, s.from))}</span>` + why;
  }
  return supEsc(supPriceLabel(s.price, s.from));
}

/* =====================================================================
   ❓ ההסבר על שני המחירים — בקשת דביר (27.08): "צריך לתת ללקוח
   אפשרות להבין מה ההבדל בין מחירי DvirTech לבין המחיר הרגיל."
   =====================================================================
   ⚠️ הרף המצוין כאן (3,000 ₪ / מחשב / מנוי) חייב להישאר זהה
   ל-ACCT_ELIG_MIN_ בשרת ולתקנון §6.8. */
function supWhyTiers(ev){
  if(ev){ ev.preventDefault(); ev.stopPropagation(); }
  let m = document.getElementById("supWhyModal");
  if(!m){
    m = document.createElement("div");
    m.id = "supWhyModal";
    m.className = "sup-why-overlay";
    m.innerHTML =
      '<div class="sup-why-box" role="dialog" aria-modal="true" aria-label="' +
        supEsc(supTr("הסבר על המחירים","About the prices")) + '">' +
        '<button class="sup-why-x" aria-label="close" onclick="document.getElementById(\'supWhyModal\').remove()">✕</button>' +
        '<h3>' + supEsc(supTr("למה יש שני מחירים?","Why two prices?")) + '</h3>' +
        '<p><b>' + supEsc(supTr("מחיר טכנאי","Technician price")) + '</b> — ' +
          supEsc(supTr("המחיר הרגיל, לכל פונה. זה מחיר אמיתי שנגבה בפועל ממי שמגיע עם חומרה שנקנתה במקום אחר.",
                       "The regular price, for anyone. It is a real price, actually charged when the hardware was bought elsewhere.")) + '</p>' +
        '<p><b>' + supEsc(supTr("מחיר DvirTech","DvirTech price")) + '</b> — ' +
          supEsc(supTr("מחיר מוזל ללקוחות הבית שלנו. מי נחשב? מספיק אחד מאלה: קניתם כאן מחשב שלם · קניתם מוצרים (לא שירותים) ב-3,000 ₪+ בשנה האחרונה · יש לכם מנוי Care פעיל.",
                       "A reduced price for our house customers. Any one of these qualifies: you bought a full PC here · you bought 3,000 ₪+ of products (not services) in the last year · you hold an active Care plan.")) + '</p>' +
        '<p><b>' + supEsc(supTr("אין כפל הטבות","Benefits do not stack")) + '</b> — ' +
          supEsc(supTr("למי שיש גם מחיר DvirTech וגם מנוי Care — חל הנמוך מביניהם, לא שניהם יחד. תמיד מוצג המחיר הטוב ביותר שמגיע לכם.",
                       "If you have both DvirTech pricing and a Care plan, the lower of the two applies — not both together. The best price you qualify for is always the one shown.")) + '</p>' +
        '<p class="sup-why-note">' +
          supEsc(supTr("בקנייה באתר שכוללת מחשב — המחיר המוזל חל אוטומטית בקופה. בקריאת שירות — הזכאות נבדקת מול הרישום שלנו לפני החיוב.",
                       "Buying a PC on the site applies the reduced price automatically at checkout. For service calls, eligibility is checked against our records before billing.")) + '</p>' +
      '</div>';
    m.addEventListener("click", function(e){ if(e.target === m) m.remove(); });
    document.body.appendChild(m);
  }
}
function supAnsKey(key, qid){ return key + "|" + qid; }
/* התווית להודעה — בלי הסיומת "(לא חובה)" שנועדה למסך בלבד. */
function supQLabel(q){ return supTr(q.he, q.en).replace(/\s*\(לא חובה\)|\s*\(optional\)/g, ""); }
function supCountLabel(n){
  if(n === 1) return supTr("שירות אחד","1 service");
  return supTr(n + " שירותים", n + " services");
}
/* האייקון מגיע מ-sprite.js (#ui-wa) שנטען לפני הקובץ הזה. שם המחלקה
   *לא* מכיל "ui-" בכוונה: הכלל הגלובלי [class*="ui-"] use{fill:none}
   ב-style.css היה מוחק את הצורה הממולאת הזו. */
function supWaIcon(){
  return `<svg class="sup-wa-ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#ui-wa"></use></svg>`;
}

/* ==================== רינדור הקטלוג ==================== */
function supRenderCats(){
  const nav = document.getElementById("supCats");
  if(!nav) return;
  nav.setAttribute("aria-label", supTr("קטגוריות שירות","Service categories"));
  nav.innerHTML = SUP_CATS.map(c => {
    const n = SUP_SERVICES.filter(s => s.cat === c.key && supInIntent_(s)).length;
    if(!n) return "";
    return `<button type="button" class="sup-chip" data-jump="supcat-${supEsc(c.key)}" data-cat="${supEsc(c.key)}">
        <span>${supEsc(supTr(c.he, c.en))}</span>
        <span class="sup-chip-n" data-n="${n}">${n}</span>
      </button>`;
  }).join("");
}

/* המונה על הצ'יפ מתחלף בין "כמה יש" ל"כמה סימנת" — כך רואים מרצועת
   הקטגוריות לבד שנשארה בחירה בקטגוריה שכבר גללנו ממנה. */
function supSyncCatBadges(){
  document.querySelectorAll(".sup-chip").forEach(chip => {
    const cat = chip.dataset.cat;
    const badge = chip.querySelector(".sup-chip-n, .sup-chip-on");
    if(!badge) return;
    const on = SUP_SERVICES.filter(s => s.cat === cat && supPicked.indexOf(s.key) !== -1).length;
    badge.className = on ? "sup-chip-on" : "sup-chip-n";
    badge.textContent = on ? String(on) : badge.dataset.n;
  });
}

function supRenderCatalog(){
  const host = document.getElementById("supCatalog");
  if(!host) return;

  supMyPriceRender();
  host.innerHTML = SUP_CATS.map(c => {
    const list = SUP_SERVICES.filter(s => s.cat === c.key && supInIntent_(s));
    if(!list.length) return "";
    const note = c.noteHe
      ? `<p class="sup-note">${supEsc(supTr(c.noteHe, c.noteEn))}</p>` : "";
    return `
      <section class="sup-sec" id="supcat-${supEsc(c.key)}">
        <h2 class="sup-sec-h">
          <span>${supEsc(supTr(c.he, c.en))}</span>
          <span class="sup-sec-c">${supEsc(supCountLabel(list.length))}</span>
        </h2>
        ${note}
        <div class="sup-grid">
          ${list.map(supCardHtml).join("")}
        </div>
      </section>`;
  }).join("");
}

/* ⚠️ בכרטיס יש שתי פעולות נפרדות ולכן שני משטחים נפרדים:
     • ה-<label> העליון מסמן/מבטל — צ'קבוקס אמיתי, כך שהמקלדת עובדת
       לבד ואין צורך ב-role="button" ידני כמו בגרסה הקודמת.
     • כפתור הוואטסאפ בפס התחתון שולח *רק* את השירות הזה, מיד.
   שתי הפעולות לא יכולות להתחלף בטעות כי הן לא חולקות אותו שטח לחיץ. */
function supCardHtml(s){
  const on = supPicked.indexOf(s.key) !== -1;
  const desc = s.descHe
    ? `<span class="sup-card-d">${supEsc(supTr(s.descHe, s.descEn))}</span>` : "";
  const qn = (s.q && s.q.length)
    ? supTr(s.q.length + " שאלות קצרות", s.q.length + " quick questions")
    : supTr("בלי שאלות","No questions");
  const aria = supTr("הוספה לפנייה: ","Add to request: ") + supName(s) + " — " +
    supPriceLabel(s.dvt != null ? s.dvt : s.price, s.from);

  return `
    <article class="sup-card${on ? " is-on" : ""}"
             data-key="${supEsc(s.key)}" data-sku="${supEsc(s.sku)}" data-price="${s.price}">
      <label class="sup-pick">
        <input type="checkbox" class="sup-tick" data-pick="${supEsc(s.key)}"
               aria-label="${supEsc(aria)}"${on ? " checked" : ""}>
        <span class="sup-box" aria-hidden="true"></span>
        <span class="sup-head">
          <span class="sup-card-t">${supEsc(supName(s))}</span>
          <span class="sup-price${s.price === 0 ? " is-free" : ""}">${supPriceHtml(s)}</span>
        </span>
        ${desc}
      </label>
      <div class="sup-card-f">
        <span class="sup-qn">${supEsc(qn)}</span>
        <button type="button" class="sup-wa" data-quick="${supEsc(s.key)}">
          ${supWaIcon()}<span>${supEsc(supTr("פנייה בוואטסאפ","Ask on WhatsApp"))}</span>
        </button>
      </div>
    </article>`;
}

function supSyncCards(){
  document.querySelectorAll(".sup-card").forEach(card => {
    const on = supPicked.indexOf(card.dataset.key) !== -1;
    card.classList.toggle("is-on", on);
    const cb = card.querySelector(".sup-tick");
    if(cb && cb.checked !== on) cb.checked = on;
  });
}

/* ==================== רינדור לוח הפנייה ==================== */
function supCtrlHtml(s, q, id){
  const saved = supAnswers[supAnsKey(s.key, q.id)];
  const arr   = Array.isArray(saved) ? saved : [];
  const str   = Array.isArray(saved) ? "" : String(saved == null ? "" : saved);
  const meta  = `id="${id}" data-ans="${supEsc(supAnsKey(s.key, q.id))}" data-qtype="${supEsc(q.type || "text")}"`;
  const ph    = supEsc(q.phHe ? supTr(q.phHe, q.phEn) : "");

  if(q.type === "select"){
    return `<select class="sup-in" ${meta}>
        <option value="">${supEsc(supTr("בחר…","Choose…"))}</option>
        ${q.options.map(o => {
          const v = supTr(o[0], o[1]);
          return `<option value="${supEsc(v)}"${v === str ? " selected" : ""}>${supEsc(v)}</option>`;
        }).join("")}
      </select>`;
  }
  if(q.type === "textarea"){
    return `<textarea class="sup-in sup-ta" ${meta} rows="3" maxlength="${q.max || 500}"
        placeholder="${ph}">${supEsc(str)}</textarea>`;
  }
  if(q.type === "multi"){
    return `<div class="sup-opts" ${meta}>
        ${q.options.map(o => {
          const v = supTr(o[0], o[1]);
          return `<label class="sup-opt"><input type="checkbox" value="${supEsc(v)}"${
            arr.indexOf(v) !== -1 ? " checked" : ""}><span>${supEsc(v)}</span></label>`;
        }).join("")}
      </div>`;
  }
  return `<input class="sup-in" type="text" ${meta} maxlength="${q.max || 120}"
      value="${supEsc(str)}" placeholder="${ph}">`;
}

function supQuestionHtml(s, q, idx, strict){
  const id    = "q_" + s.key + "_" + q.id;
  const hint  = q.hintHe ? `<p class="sup-hint">${supEsc(supTr(q.hintHe, q.hintEn))}</p>` : "";
  const req   = (!q.opt && strict) ? ` <span class="sup-req" aria-hidden="true">*</span>` : "";
  return `<div class="sup-q">
      <label class="field-label" for="${id}">${idx + 1}. ${supEsc(supTr(q.he, q.en))}${req}</label>
      ${hint}
      ${supCtrlHtml(s, q, id)}
    </div>`;
}

function supItemHtml(s, strict){
  const qs = s.q || [];
  const qHtml = qs.length ? `
      <details class="sup-item-q"${strict ? " open" : ""}>
        <summary>${supEsc(strict
          ? supTr("כמה פרטים שיעזרו לי להגיע מוכן","A few details so I arrive prepared")
          : supTr("פרטים על השירות הזה (לא חובה)","Details for this service (optional)"))}</summary>
        <div class="sup-item-qs">${qs.map((q, i) => supQuestionHtml(s, q, i, strict)).join("")}</div>
      </details>` : "";

  return `
    <div class="sup-item" data-item="${supEsc(s.key)}">
      <div class="sup-item-h">
        <span class="sup-plus" aria-hidden="true">+</span>
        <span class="sup-item-n">${supEsc(supName(s))}</span>
        <span class="sup-item-p">${supEsc(supPriceLabel(s.dvt != null ? s.dvt : s.price, s.from))}</span>
        <button type="button" class="sup-item-x" data-drop="${supEsc(s.key)}"
                aria-label="${supEsc(supTr("הסרה מהפנייה: ","Remove from request: ") + supName(s))}">✕</button>
      </div>
      ${qHtml}
    </div>`;
}

function supRenderPanel(){
  const box = document.getElementById("supPanel");
  if(!box) return;

  const services = supPicked.map(supSvc).filter(Boolean);
  const n = services.length;
  /* ⚠️ שירות אחד = פנייה ממוקדת, ולכן השאלות שלו נשארות חובה בדיוק כמו
     בגרסה הקודמת. שניים ומעלה = רשימת רצונות, ואז 4 שאלות כפול 5
     שירותים הן בדיוק הקיר שדביר התלונן עליו — לכן הן הופכות לרשות
     והבלוקים נסגרים. הכלל נאמר במפורש על המסך כדי שלא יהיה קסם. */
  /* ⚠️ **תמיד חובה — החלטת דביר, 16.08.2026.** בגרסה הקודמת שאלות
     החובה התרככו כשנבחר יותר משירות אחד, כדי להוריד נטישה. דביר העדיף
     את הצד השני של הטרייד-אוף במפורש: "אני צריך לקבל כמה שיותר מידע,
     זה או שם או בטלפון, עדיף שיהיה שם ואני אתקשר וארחיב".
     כלומר השיחה אינה מוחלפת — היא נעשית מוכנה. `strict` נשאר כפרמטר
     ולא נמחק, כדי שאפשר יהיה לרכך שוב בשורה אחת אם הנטישה תתברר
     כבעיה אמיתית ולא משוערת. */
  const strict = true;
  void n;

  const head = `
    <div class="sup-panel-head">
      <div>
        <p class="sup-kicker">${supEsc(supTr("שלב אחרון","Last step"))}</p>
        <h2 class="sup-panel-t">${supEsc(supTr("הפנייה שלך","Your request"))}</h2>
      </div>
      <div class="sup-panel-meta">
        <span class="sup-count">${supEsc(n ? supCountLabel(n) : supTr("לא נבחר שירות","No service picked"))}</span>
        ${n ? `<button type="button" class="sup-clear" id="supClear">${supEsc(supTr("ניקוי","Clear"))}</button>` : ""}
      </div>
    </div>`;

  const tail = `
    <div class="validation-msg" id="supValidation" role="alert" style="display:none"></div>
    <p class="sup-fallback" id="supFallback" hidden></p>`;

  if(!n){
    box.innerHTML = head + `
      <p class="sup-empty">${supEsc(supTr(
        "עוד לא סימנת שירות. אפשר לסמן ✓ על כמה שירותים שרוצים ולשלוח הכל בהודעה אחת, או ללחוץ “פנייה בוואטסאפ” על כרטיס בודד ולשלוח רק אותו.",
        "Nothing ticked yet. Tick ✓ as many services as you need and send them in one message, or press “Ask on WhatsApp” on a single card to send just that one."))}</p>` + tail;
    return;
  }

  const multiNote = strict ? "" : `<p class="sup-note">${supEsc(supTr(
    "בחרת כמה שירותים, ולכן השאלות בכל שירות אינן חובה — ענה על מה שנוח, ואת השאר נשלים בשיחה.",
    "You picked several services, so the questions under each one are optional — answer what's easy and we'll cover the rest by phone."))}</p>`;

  box.innerHTML = head + `
    <div class="sup-picked">${services.map(s => supItemHtml(s, strict)).join("")}</div>
    ${multiNote}

    <div class="sup-contact">
      <h3 class="sup-sub-h">${supEsc(supTr("איך אחזור אליך?","How do I get back to you?"))}</h3>
      <p class="sup-sub-note">${supEsc(supTr(
        "שם וטלפון בלבד. הפרטים נוסעים בתוך ההודעה עצמה ולא נשמרים באתר.",
        "Name and phone only. They travel inside the message itself and are never stored on the site."))}</p>
      <div class="sup-fields">
        <div class="sup-q">
          <label class="field-label" for="supCName">${supEsc(supTr("שם","Name"))} <span class="sup-req" aria-hidden="true">*</span></label>
          <input class="sup-in" type="text" id="supCName" autocomplete="name" maxlength="60" value="${supEsc(supContactState.name)}">
        </div>
        <div class="sup-q">
          <label class="field-label" for="supCPhone">${supEsc(supTr("טלפון","Phone"))} <span class="sup-req" aria-hidden="true">*</span></label>
          <input class="sup-in" type="tel" id="supCPhone" autocomplete="tel" dir="ltr" maxlength="20"
                 placeholder="050-0000000" value="${supEsc(supContactState.phone)}">
        </div>
        <div class="sup-q is-wide">
          <label class="field-label" for="supCEmail">${supEsc(supTr("אימייל (לא חובה)","Email (optional)"))}</label>
          <input class="sup-in" type="email" id="supCEmail" autocomplete="email" dir="ltr" maxlength="80" value="${supEsc(supContactState.email)}">
        </div>
      </div>
    </div>

    <details class="sup-preview">
      <summary>${supEsc(supTr("תצוגה מקדימה של ההודעה","Preview the message"))}</summary>
      <pre class="sup-pre" id="supPreview"></pre>
    </details>
    ${tail}
    <button type="button" class="btn btn-accent" id="supSendBtn">
      ${supWaIcon()}<span>${supEsc(supTr("שליחת הפנייה בוואטסאפ","Send the request on WhatsApp"))}</span>
      <small>· ${supEsc(supCountLabel(n))}</small>
    </button>
    <p class="sup-send-note">${supEsc(supTr(
      "הכפתור פותח וואטסאפ עם ההודעה מוכנה — רק ללחוץ שליחה. שום דבר לא נרכש כאן: נסגור ביחד לפני שמתחילים.",
      "The button opens WhatsApp with the message ready — just hit send. Nothing is purchased here: we'll agree on it together before starting."))}</p>`;

  supUpdatePreview();
}

/* ==================== קליטת תשובות ==================== */
/* נקראת לפני כל רינדור מחדש של הלוח, כך שסימון שירות נוסף באמצע
   מילוי טופס לא מוחק את מה שכבר נכתב. */
function supCapture(){
  document.querySelectorAll("#supPanel [data-ans]").forEach(el => {
    const k = el.dataset.ans;
    if(el.dataset.qtype === "multi"){
      supAnswers[k] = Array.prototype.slice.call(el.querySelectorAll("input:checked")).map(i => i.value);
    } else {
      supAnswers[k] = el.value;
    }
  });
  const g = id => { const e = document.getElementById(id); return e ? e.value : null; };
  const nm = g("supCName"), ph = g("supCPhone"), em = g("supCEmail");
  if(nm !== null) supContactState.name  = nm;
  if(ph !== null) supContactState.phone = ph;
  if(em !== null) supContactState.email = em;
}

/* ⚠️ תשובות של select/multi הן מחרוזות בשפה שבה נבחרו. במעבר שפה הן
   כבר לא תואמות לאף אפשרות ברשימה החדשה, והיו יוצאות בעברית בתוך
   הודעה באנגלית. טקסט חופשי נשאר — הוא נכתב בידי הלקוח. */
function supDropLocalizedAnswers(){
  SUP_SERVICES.forEach(s => (s.q || []).forEach(q => {
    if(q.type === "select" || q.type === "multi") delete supAnswers[supAnsKey(s.key, q.id)];
  }));
}

function supItemFor(s){
  const answers = [];
  (s.q || []).forEach(q => {
    const raw = supAnswers[supAnsKey(s.key, q.id)];
    const val = Array.isArray(raw) ? raw.join(", ") : String(raw == null ? "" : raw).trim();
    if(val) answers.push({ q: supQLabel(q), a: val });
  });
  return { s: s, answers: answers };
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
function supHideError(){
  const box = document.getElementById("supValidation");
  if(box) box.style.display = "none";
}

/* ==================== בניית ההודעה ==================== */
/* ⚠️ הפורמט הוא הדרישה עצמה, לא קישוט. שירות אחד = שורה אחת שמתחילה
   ב-"+", והתשובות שלו בשורות משלהן מתחתיו. בלי זה חמישה שירותים היו
   נדחסים לשורה אחת ארוכה שאי אפשר לקרוא בטלפון.
   ⚠️ אין כאן סכום. הדף אינו עגלה והשירותים אינם נרכשים בו, וסכום
   בתחתית ההודעה היה הופך פנייה להזמנה מאושרת. */
const SUP_SUBLINE = "   • ";

function supBuildMessage(items, c){
  const L = [];
  L.push(items.length === 1
    ? supTr("היי דביר, אשמח לפנות בנושא השירות הבא:",
            "Hi Dvir, I'd like to ask about the following service:")
    : supTr("היי דביר, אני מעוניין בשירותים הבאים:",
            "Hi Dvir, I'm interested in the following services:"));

  items.forEach(it => {
    /* ⚠️ בהודעה מצוינים שני המחירים כשיש שכבה כפולה — הזכאות למחיר
       DvirTech (‏3,000 ₪+ בשנה / מחשב שלם / מנוי — §6.8) נבדקת
       בשיחה, ואסור שההודעה "תבטיח" מראש את המחיר המוזל. */
    L.push("+ " + supName(it.s) + " — " + (it.s.dvt != null && it.s.dvt < it.s.price
      ? supPriceLabel(it.s.price, it.s.from) + supTr(" (ללקוחות DvirTech: "," (DvirTech customers: ") + supPriceLabel(it.s.dvt, it.s.from) + ")"
      : supPriceLabel(it.s.price, it.s.from)));
    it.answers.forEach(a => L.push(SUP_SUBLINE + a.q + " — " + a.a));
  });

  const who = [];
  if(c.name)  who.push(supTr("שם","Name") + ": " + c.name);
  if(c.phone) who.push(supTr("טלפון","Phone") + ": " + c.phone);
  if(c.email) who.push(supTr("אימייל","Email") + ": " + c.email);
  if(who.length){ L.push(""); who.forEach(x => L.push(x)); }

  L.push("");
  L.push(supTr("(נשלח מדף השירות באתר · מק\"ט: ", "(sent from the site's service page · SKU: ")
         + items.map(it => it.s.sku).join(", ") + ")");
  return L.join("\n");
}

function supUpdatePreview(){
  const pre = document.getElementById("supPreview");
  if(!pre) return;
  const items = supPicked.map(supSvc).filter(Boolean).map(supItemFor);
  pre.textContent = items.length ? supBuildMessage(items, supContactForMessage()) : "";
}

function supContactForMessage(){
  const name  = String(supContactState.name || "").trim();
  const phone = supNormPhone(supContactState.phone);
  const email = String(supContactState.email || "").trim();
  return {
    name : name.length >= 2 ? name : "",
    phone: /^0\d{8,9}$/.test(phone) ? phone : "",
    email: email
  };
}

/* ==================== שליחה ==================== */
function supOpenWa(msg){
  const url = `https://wa.me/${SUP_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  const w = window.open(url, "_blank", "noopener");
  /* חוסם פופ-אפים במובייל הוא מציאות. במקום לאבד את הפנייה — קישור גלוי. */
  if(!w){
    const fb = document.getElementById("supFallback");
    if(fb){
      fb.hidden = false;
      fb.innerHTML = `<a href="${supEsc(url)}" target="_blank" rel="noopener">${
        supEsc(supTr("הדפדפן חסם את החלון — לחץ כאן לפתיחת וואטסאפ",
                     "Your browser blocked the window — tap here to open WhatsApp"))
      }</a>`;
      fb.scrollIntoView({ behavior:"smooth", block:"center" });
    }
  }
  return url;
}

/* פנייה מהירה מכרטיס בודד. אין כאן ולידציה בכוונה: מספר הטלפון של
   הלקוח מגיע לדביר ממילא יחד עם הודעת הוואטסאפ, ולכן לחסום את הכפתור
   עד שימלא טופס זה לאבד פנייה בלי שום תמורה. פרטים שכבר מולאו בלוח
   הפנייה כן נכנסים להודעה. */
function supQuickSend(key){
  const s = supSvc(key);
  if(!s) return;
  supCapture();
  supOpenWa(supBuildMessage([supItemFor(s)], supContactForMessage()));
}

function supFirstMissing(services){
  for(let i = 0; i < services.length; i++){
    const s = services[i];
    const qs = s.q || [];
    for(let j = 0; j < qs.length; j++){
      const q = qs[j];
      if(q.opt) continue;
      const raw = supAnswers[supAnsKey(s.key, q.id)];
      const val = Array.isArray(raw) ? raw.join("") : String(raw == null ? "" : raw).trim();
      if(!val) return { s: s, q: q };
    }
  }
  return null;
}

function supSend(){
  supCapture();
  supHideError();

  const services = supPicked.map(supSvc).filter(Boolean);
  if(!services.length){
    supShowError(supTr("עוד לא סימנת שירות. סמן ✓ על שירות אחד לפחות.",
                       "Nothing is ticked yet. Tick ✓ at least one service."));
    return;
  }

  /* ראה ההערה ב-supRenderPanel: חובה רק כשנבחר שירות אחד. */
  if(services.length === 1){
    const miss = supFirstMissing(services);
    if(miss){
      supShowError(supTr("חסרה תשובה — ","Missing an answer — ") + supName(miss.s) + ": " +
                   supTr(miss.q.he, miss.q.en));
      const el = document.getElementById("q_" + miss.s.key + "_" + miss.q.id);
      if(el){
        const d = el.closest("details");
        if(d) d.open = true;
        el.scrollIntoView({ behavior:"smooth", block:"center" });
        const f = el.matches('[data-qtype="multi"]') ? el.querySelector("input") : el;
        if(f && f.focus) f.focus();
      }
      return;
    }
  }

  const name  = String(supContactState.name || "").trim();
  const phone = supNormPhone(supContactState.phone);
  /* אותה בדיקת טלפון כמו ב-checkout.js, כדי שלא יהיו שני תקנים לאותו שדה. */
  if(name.length < 2 || !/^0\d{8,9}$/.test(phone)){
    supShowError(supTr("נא למלא שם וטלפון תקין (למשל 050-0000000).",
                       "Please fill in a name and a valid phone number (e.g. 050-0000000)."));
    const bad = document.getElementById(name.length < 2 ? "supCName" : "supCPhone");
    if(bad) bad.focus();
    return;
  }

  supOpenWa(supBuildMessage(services.map(supItemFor),
    { name: name, phone: phone, email: String(supContactState.email || "").trim() }));
}

/* ==================== בחירה ==================== */
function supToggle(key, on){
  if(!supSvc(key)) return;
  supCapture();
  const i = supPicked.indexOf(key);
  if(on  && i === -1) supPicked.push(key);
  if(!on && i !== -1) supPicked.splice(i, 1);
  supAfterChange();
}

function supClearAll(){
  supCapture();
  supPicked = [];
  supAfterChange();
}

function supAfterChange(){
  supSyncCards();
  supSyncCatBadges();
  supRenderPanel();
  supSyncJump();
  /* קישור ישיר שאפשר לשלוח: support.html?service=diagnostics,clean-thermal */
  try{
    history.replaceState(null, "", supPicked.length
      ? "support.html?service=" + supPicked.map(encodeURIComponent).join(",")
      : "support.html");
  }catch(e){}
}

function supSyncJump(){
  const btn = document.getElementById("supJump");
  if(!btn) return;
  const n = supPicked.length;
  if(!n || supPanelSeen){ btn.hidden = true; return; }
  btn.innerHTML = `<span>${supEsc(supTr("המשך לפנייה","Go to request"))}</span>` +
                  `<span class="sup-jump-n">${n}</span>`;
  btn.hidden = false;
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
  supCapture();
  supDropLocalizedAnswers();
  setLangCore(lang);
  supApplyI18n();
  supRenderIntents();
  supRenderCats();
  supRenderCatalog();
  supSyncCatBadges();
  supRenderPanel();
  supSyncJump();
  supSpy();
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

/* צביעת הצ'יפ של הקטגוריה שנמצאת במסך. עם 20 כרטיסים קל מאוד לאבד
   את המיקום, והרצועה הדביקה היא הדבר היחיד שקבוע על המסך. */
function supSpy(){
  if(!("IntersectionObserver" in window)) return;
  if(supSpyObs){ supSpyObs.disconnect(); supSpyObs = null; }
  const secs = Array.prototype.slice.call(document.querySelectorAll(".sup-sec"));
  if(!secs.length) return;

  const head = document.querySelector("header");
  const top  = Math.round((head ? head.getBoundingClientRect().height : 85) + 74);
  const seen = Object.create(null);

  supSpyObs = new IntersectionObserver(entries => {
    entries.forEach(e => { seen[e.target.id] = e.isIntersecting; });
    let cur = "";
    for(let i = 0; i < secs.length; i++){
      if(seen[secs[i].id]){ cur = secs[i].id; break; }
    }
    document.querySelectorAll(".sup-chip").forEach(ch =>
      ch.classList.toggle("is-cur", !!cur && ch.dataset.jump === cur));
  }, { rootMargin: "-" + top + "px 0px -55% 0px" });

  secs.forEach(s => supSpyObs.observe(s));
}

/* הכפתור הצף נעלם ברגע שלוח הפנייה עצמו נכנס למסך — אחרת הוא מציע
   לגלול למקום שכבר רואים. */
function supWatchPanel(){
  const panel = document.getElementById("supPanel");
  if(!panel || !("IntersectionObserver" in window)) return;
  new IntersectionObserver(entries => {
    entries.forEach(e => { supPanelSeen = e.isIntersecting; });
    supSyncJump();
  }, { rootMargin: "0px 0px -80px 0px" }).observe(panel);
}

function supInit(){
  supApplyI18n();
  supRenderIntents();
  supRenderCats();
  supRenderCatalog();
  supRenderPanel();
  supSyncHeaderHeight();
  /* ההדר נבנה ב-site-header.js שרץ לפנינו, אבל הלוגו מוחלף ב-sprite.js
     והגופנים נטענים מאוחר — שתי סיבות שגובה ההדר ישתנה אחרי הטעינה. */
  window.addEventListener("load", () => { supSyncHeaderHeight(); supSpy(); });
  window.addEventListener("resize", supSyncHeaderHeight);

  const host = document.getElementById("supCatalog");
  if(host){
    host.addEventListener("change", e => {
      const cb = e.target.closest(".sup-tick");
      if(cb) supToggle(cb.dataset.pick, cb.checked);
    });
    host.addEventListener("click", e => {
      const q = e.target.closest("[data-quick]");
      if(!q) return;
      e.preventDefault();
      supQuickSend(q.dataset.quick);
    });
  }

  const panel = document.getElementById("supPanel");
  if(panel){
    panel.addEventListener("click", e => {
      const drop = e.target.closest("[data-drop]");
      if(drop){ supToggle(drop.dataset.drop, false); return; }
      if(e.target.closest("#supClear")){ supClearAll(); return; }
      if(e.target.closest("#supSendBtn")) supSend();
    });
    /* התצוגה המקדימה מתעדכנת תוך כדי הקלדה — הלקוח רואה בדיוק מה
       יישלח, וזו הדרך הפשוטה ביותר להראות שההודעה אכן קריאה. */
    panel.addEventListener("input",  () => { supCapture(); supUpdatePreview(); });
    panel.addEventListener("change", () => { supCapture(); supUpdatePreview(); });
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

  const jump = document.getElementById("supJump");
  if(jump){
    jump.addEventListener("click", () => {
      const box = document.getElementById("supPanel");
      if(box) box.scrollIntoView({ behavior:"smooth", block:"start" });
    });
  }

  /* קישור ישיר: support.html?service=diagnostics או ?service=a,b,c —
     כדי שאפשר יהיה להפנות מהאתר או מהודעה ישר לשירותים הנכונים. מי
     שהגיע דרך קישור כזה כבר בחר, ולכן נוחתים על הלוח ולא בראש הדף. */
  let want = "";
  try{ want = new URLSearchParams(location.search).get("service") || ""; }catch(e){}
  if(want){
    want.split(",").forEach(raw => {
      const k = raw.trim();
      if(k && supSvc(k) && supPicked.indexOf(k) === -1) supPicked.push(k);
    });
    if(supPicked.length){
      supSyncCards();
      supSyncCatBadges();
      supRenderPanel();
      const box = document.getElementById("supPanel");
      if(box) box.scrollIntoView({ behavior:"auto", block:"start" });
    }
  }

  supWatchPanel();
  supSyncJump();
  supSpy();
}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", supInit);
} else {
  supInit();
}


/* ==================== DvirTech Care ====================
   ⚠️ **הטבלה נבנית ב-JS ולא ב-HTML בכוונה.** אותם נתונים בדיוק מופיעים
   גם בכרטיסים וגם בטבלת ההשוואה; כתיבה כפולה ב-HTML הייתה מבטיחה
   שיום אחד אחד מהם יעודכן והשני לא. כאן יש מקור אחד — CARE_PLANS.

   ⚠️ **המחירים כאן זמניים.** היעד: קריאה מהגיליון דרך אותה תשובת
   getCatalog שכבר נטענת (קטגוריית "מנויים" ב-PRICE_LIST). עד אז
   מספר שמשתנה כאן חייב להשתנות גם ב-support.html.

   ⚠️ **אין רכישה.** ההצטרפות בתיאום ובאישור העסק — כך בתקנון, ולכן
   הכפתור פותח וואטסאפ ולא עגלה. */
/* ⚠️ **המחיר הוא שנתי; החודשי הוא רק תצוגת הפריסה.** כל המכסות
   (שעות תמיכה, בדיקת תחזוקה) הן שנתיות — מנוי חודשי היה מאפשר לממש
   שנה שלמה של הטבות בחודש הראשון ולבטל. ראה הנימוק המלא ב-PRICE_LIST
   שב-2-pricelist-picker.gs. */
/* 🔴 **עודכן 27.08 — חייב להישאר זהה ל-CARE_TIERS ב-
   5-care-subscriptions.gs ולמחירים ב-PRICE_LIST.** השינויים
   (DVT-NEXT-BUILD §3.1): שעות 1/3/5 → 1/1.5/2 · הנחות 5/10/15 →
   5/8/12 · "קדימות" הפכה לשני דברים מדידים — **זמן מענה** ו**מקום
   בתור** (לעולם לא זמן תיקון: דביר אדם אחד) · נוסף **דוח בריאות
   אוטומטי** — הרצת סקריפט האבחון ושליחת דוח; עולה כמעט אפס, אף
   טכנאי לא נותן, ומייצר לידים לשדרוגים. */
const CARE_PLANS = [
  { key:"CARE", monthly:50,  yearly:599,
    response:["יום עסקים","One business day"], queue:["לפי סדר הפנייה","In order of arrival"],
    checks:["פעם בשנה","Once a year"], reports:["דוח שנתי","Yearly report"],
    remote:["עד שעה בשנה","Up to 1 hour a year"], discount:"5%" },
  { key:"PLUS", monthly:67,  yearly:799,
    response:["4 שעות עבודה","4 working hours"], queue:["מקדים פניות מזדמנות","Ahead of walk-ins"],
    checks:["פעם בשנה","Once a year"], reports:["פעמיים בשנה","Twice a year"],
    remote:["עד שעה וחצי בשנה","Up to 1.5 hours a year"], discount:"8%" },
  { key:"PRO",  monthly:92,  yearly:1099,
    response:["שעתיים","Two hours"], queue:["ראשון בתור","First in line"],
    checks:["פעמיים בשנה","Twice a year"], reports:["רבעוני","Quarterly"],
    remote:["עד שעתיים בשנה","Up to 2 hours a year"], discount:"12%" }
];

function careMoney(n){ return n.toLocaleString("he-IL") + " ₪"; }

function careTableHtml(){
  const cls = { CARE:"c-care", PLUS:"c-plus", PRO:"c-pro" };
  const ico = { CARE:"🛡", PLUS:"⚡", PRO:"🚀" };
  const cell = (p, v) => `<td class="${cls[p.key]}">${supEsc(v)}</td>`;
  const row  = (label, get) =>
    `<tr><th scope="row">${supEsc(label)}</th>${CARE_PLANS.map(p => cell(p, get(p))).join("")}</tr>`;
  const yes = `<span class="yes">✓</span>`;

  return `
    <table>
      <caption>${supEsc(supTr("השוואה מלאה","Full comparison"))}</caption>
      <thead><tr>
        <th scope="col">${supEsc(supTr("הטבה","Benefit"))}</th>
        ${CARE_PLANS.map(p => `<th scope="col" class="${cls[p.key]}">${ico[p.key]} ${p.key}</th>`).join("")}
      </tr></thead>
      <tbody>
        <tr class="row-price"><th scope="row">${supEsc(supTr("מחיר שנתי","Yearly"))}</th>
          ${CARE_PLANS.map(p => cell(p, careMoney(p.yearly))).join("")}</tr>
        <tr><th scope="row">${supEsc(supTr("בפריסה לתשלומים","In installments"))}</th>
          ${CARE_PLANS.map(p => cell(p, supTr("כ-","~") + careMoney(p.monthly) + supTr(" לחודש"," / mo"))).join("")}</tr>
        <tr><th scope="row">${supEsc(supTr("תקופת הזכאות","Entitlement period"))}</th>
          ${CARE_PLANS.map(p => cell(p, supTr("12 חודשים","12 months"))).join("")}</tr>
        <tr><th scope="row">${supEsc(supTr("תמיכה וייעוץ טכני","Technical support & advice"))}</th>
          ${CARE_PLANS.map(p => `<td class="${cls[p.key]}">${yes}</td>`).join("")}</tr>
        ${row(supTr("זמן מענה","Response time"), p => supTr(p.response[0], p.response[1]))}
        ${row(supTr("מקום בתור","Place in the queue"), p => supTr(p.queue[0], p.queue[1]))}
        ${row(supTr("בדיקת תחזוקה (מרחוק)","Maintenance check (remote)"), p => supTr(p.checks[0], p.checks[1]))}
        ${row(supTr("דוח בריאות אוטומטי","Automatic health report"), p => supTr(p.reports[0], p.reports[1]))}
        ${row(supTr("תמיכה מרחוק","Remote support"), p => supTr(p.remote[0], p.remote[1]))}
        ${row(supTr("הנחה על עבודה","Discount on labour"), p => p.discount)}
      </tbody>
    </table>
    <p class="care-fine">${supTr(
      "<b>מה לא כלול:</b> חלקי חילוף וחומרה, רישיונות ותוכנות, משלוחים, שחזור מידע מורכב, ונזק שנגרם משימוש בלתי תקין. <b>בדיקת התחזוקה ומכסת התמיכה ממומשות לפי פנייה שלך</b> — אין צורך להמתין למועד קבוע, והתיאום לפי זמינות. המכסה אישית, אינה נצברת משנה לשנה ואינה ניתנת להעברה או לפדיון. הקדימות היא העדפה תפעולית ואינה התחייבות לזמן תגובה. <b>החבילה אינה אחריות על החומרה</b> ואינה מאריכה את אחריות היצרן או היבואן. ההצטרפות בתיאום מראש ובאישור העסק, ולא ברכישה ישירה באתר.",
      "<b>Not included:</b> spare parts and hardware, licenses and software, shipping, complex data recovery, and damage caused by improper use. <b>The maintenance check and support allowance are used on your request</b> — no fixed date to wait for, scheduled by availability. The allowance is personal, does not roll over between years and cannot be transferred or cashed out. Priority is an operational preference, not a guaranteed response time. <b>The plan is not a hardware warranty</b> and does not extend the manufacturer's or importer's warranty. Joining is arranged in advance and subject to approval, not bought directly on the site.")}</p>`;
}

function careInit(){
  const btn = document.getElementById("careMoreBtn");
  const box = document.getElementById("careTable");
  if(btn && box){
    btn.addEventListener("click", function(){
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      if(!open && !box.innerHTML) box.innerHTML = careTableHtml();
      box.hidden = open;
    });
  }
  /* ההצטרפות היא שיחה, לא עגלה — הכפתור פותח וואטסאפ עם שם המסלול. */
  document.querySelectorAll("[data-care]").forEach(function(a){
    a.addEventListener("click", function(e){
      e.preventDefault();
      const plan = a.getAttribute("data-care");
      const msg = supTr("היי דביר, אשמח לפרטים על מסלול DvirTech Care — " + plan,
                        "Hi Dvir, I'd like details about the DvirTech Care " + plan + " plan");
      window.open("https://wa.me/" + SUP_WHATSAPP_NUMBER + "?text=" + encodeURIComponent(msg), "_blank");
    });
  });
}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", careInit);
}else{
  careInit();
}

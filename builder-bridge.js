/* =====================================================================
   DvirTech — חיבור הבונה החדש לאתר (builder-bridge.js)
   =====================================================================
   העיצוב של הבונה נשאר בדיוק כפי שהוא. הקובץ הזה רק מחבר אותו למערכת:

   1. מחליף את הקטלוג הסטטי שב-builder-data.js בקטלוג החי מהגיליון
      (אותו dvtGetCatalog שכל שאר הדפים משתמשים בו — מטמון משותף,
      בקשה אחת, ואותם מוצרים בדיוק כמו בדף המוצרים).
   2. מפעיל את מנוע ההתאמה (builder-compat.js) על כל שינוי בחירה.
   3. מחבר את "הוסף לעגלה" ל-cart.js של האתר.

   ⚠️ קטגוריות שעדיין אין להן לשונית בגיליון (מאווררי מארז, משחה,
   רשת, אביזרים) ממשיכות לרוץ על הנתונים לדוגמה שבאו עם העיצוב, כדי
   שהבונה יעבוד עכשיו. ברגע שתיווצר לשונית — הן יתחלפו אוטומטית.
===================================================================== */

(() => {
  const D = window.DVIR_BUILDER_DATA;
  if(!D){ console.error("builder-bridge: DVIR_BUILDER_DATA לא נטען"); return; }

  /* קטגוריות שמגיעות מהגיליון. השאר נשארות מהנתונים לדוגמה.
     ⚠️ ארבע האחרונות מקבלות לשונית בגיליון רק עכשיו (ראה
     8-prepare-catalog-sheet.gs). עד שיהיו בהן מוצרים הן פשוט לא
     יוחזרו מה-API, ו-hideLiveless_ יסתיר אותן — בלי שגיאה. */
  /* ⚠️ "paste" הוסרה 21.08 — ראה ההערה בלשונית שב-builder.html. */
  const LIVE_CATS = ["cpu","mobo","ram","gpu","cooling","storage","psu","case",
                     "caseFans","wifi","extras"];

  /* אילו קטגוריות באמת התמלאו מהגיליון. נדרש כדי להבדיל בין
     "יש לזה מוצרי דמו בקוד" לבין "יש לזה מוצרים אמיתיים". */
  const liveFilled = new Set();

  /* דרג 1-5 לתצוגה ולניקוד. אם הגיליון לא מספק tier, גוזרים אותו
     מהמחיר בתוך הקטגוריה — כך שהמדדים עובדים גם בלי העמודה. */
  function deriveTier(item, all){
    const explicit = Number(item.tier ?? item.t);
    if(Number.isFinite(explicit) && explicit > 0) return Math.max(1, Math.min(5, explicit));
    const prices = all.map(i => Number(i.price) || 0).filter(p => p > 0).sort((a,b) => a-b);
    if(!prices.length) return 3;
    const p = Number(item.price) || 0;
    const idx = prices.findIndex(x => x >= p);
    const rel = idx < 0 ? 1 : idx / Math.max(1, prices.length - 1);
    return Math.max(1, Math.min(5, Math.round(1 + rel * 4)));
  }

  /* פריט מהגיליון → הצורה שהבונה מצפה לה. כל שאר השדות נשמרים כמו
     שהם, כי מנוע ההתאמה קורא אותם ישירות (socket/ramType/lengthMm...). */
  function toBuilderItem(it, all){
    return Object.assign({}, it, {
      id: String(it.id),
      name: (typeof itemName === "function") ? itemName(it) : it.name,
      spec: (typeof itemSpec === "function") ? itemSpec(it) : (it.spec || ""),
      price: Number(it.price) || 0,
      t: deriveTier(it, all)
      // ⚠️ note לא מועתק: בעיצוב המקורי הוא היה טקסט קבוע שקבע את
      // "התאימות". עכשיו ההערות מחושבות ב-builder-compat.js.
    });
  }

  /* ⚠️ בלשונית המארזים בגיליון יושבים גם **מארזים חיצוניים לדיסקים**
     (ADATA AED600, MAIVO Dual Bay...). בחנות זה בסדר — זה באמת מוצר
     מאותה משפחה — אבל בבונה "מארז" פירושו מארז מחשב, ולקוח שבוחר
     קופסת USB לדיסק כמארז להרכבה מקבל הזמנה בלתי אפשרית. למנוע
     ההתאמה אין איך לתפוס את זה (אין להם מפרט מארז, אז החוקים פשוט
     שותקים) — לכן הסינון כאן, בכניסה לבונה. */
  function isBuildableCaseItem(i){
    return !/מארז\s*חיצוני|enclosure|docking/i.test(String((i && i.name) || ""));
  }

  /* 🔴 שני מתוך עשרת "מאווררי המארז" בקטלוג הם **מצנני מעבד**:
     NOCTUA NH-D15 250W TDP DUAL 140mm FAN. זהו מגדל קירור למעבד
     שעולה מאות שקלים, ולא מאוורר שמתברג לדופן המארז.

     ⚠️ הוא הגיע לכאן כי בשמו כתוב "140mm FAN", וסיווג לפי מילת
     המפתח שלח אותו לקטגוריה הלא נכונה. הלקוח שבחר "מאווררי מארז"
     קיבל אותו כאפשרות ראשונה ברשימה.

     ⚠️ הסינון כאן הוא רשת ביטחון בלבד — התיקון האמיתי הוא בגיליון
     (להעביר לקטגוריית `cooling`). הרשת נשארת גם אחריו, כי המקרה
     הזה יחזור: כל מצנן מגדל מזכיר בשמו את מידת המאוורר שלו. */
  function isBuildableFanItem(i){
    const n = String((i && i.name) || "");
    if(/NH-D\d|NH-U\d|HYPER\s*\d|TOWER\s*COOLER/i.test(n)) return false;
    if(/TDP/i.test(n)) return false;              // מפרט של מצנן מעבד, לא של מאוורר
    return true;
  }

  /* אפשרות "קירור בסיסי שמגיע עם המעבד" — דרישה מפורשת של דביר:
     כשלמעבד שנבחר באמת מצורף גוף קירור (coolerIncluded, אחרי אימות
     מהשם — ראה dvtCoolerIncluded ב-builder-compat.js), שלב הקירור
     מציע גם את הקירור מהקופסה ב-0 ₪. הזמינות נאכפת ע"י החוק
     cooling-stock-needs-cpu במנוע: בלי מעבד מתאים האפשרות מוצגת
     חסומה עם הסיבה, בדיוק כמו כל רכיב לא תואם אחר.
     pasteIncluded:true כי משחה תרמית מרוחה עליו מהמפעל. */
  const STOCK_COOLER = {
    id: "stock-cooler", stockCooler: true, price: 0, t: 1,
    name: "קירור בסיסי שמגיע עם המעבד",
    spec: "הגוף שמצורף למעבד בקופסה · ללא עלות · מתאים לעבודה יומיומית",
    pasteIncluded: true, inStock: true
  };
  function ensureStockCooler(){
    const list = D.CATALOG.cooling;
    if(!Array.isArray(list)) return;
    if(!list.some(i => i && i.id === STOCK_COOLER.id)) list.unshift(STOCK_COOLER);
  }

  function applyCatalog(catalog){
    if(!catalog) return false;
    let changed = false;
    LIVE_CATS.forEach(cat => {
      const group = catalog[cat];
      if(!group || !Array.isArray(group.items)) return;
      /* ⚠️ בבונה, בניגוד לחנות, מוצר שאזל *כן* נשמט מהרשימה: אי אפשר
         להרכיב מחשב מרכיב שאין, והצגתו רק תגרום ללקוח לבחור בו ואז
         להיתקע. בחנות הוא נשאר מוצג עם תג "אזל". */
      let sellable = group.items.filter(i =>
        (typeof dvtCanBuy === "function") ? dvtCanBuy(i)
        : (typeof dvtIsSellable === "function") ? dvtIsSellable(i) : (i && i.id !== "none"));
      if(cat === "case")     sellable = sellable.filter(isBuildableCaseItem);
      if(cat === "caseFans") sellable = sellable.filter(isBuildableFanItem);
      if(!sellable.length) return;
      D.CATALOG[cat] = sellable.map(i => toBuilderItem(i, sellable));
      liveFilled.add(cat);
      changed = true;
    });
    ensureStockCooler();
    return changed;
  }

  /* --- טעינה מיידית מהמטמון, בדיוק כמו בשאר הדפים ---
     קריאת localStorage היא סינכרונית, ולכן הבונה נפתח מלא מיד ולא
     מחכה לשרת. הרענון מהשרת מגיע אחר כך ומעדכן אם משהו השתנה. */
  try{
    const raw = localStorage.getItem("dvirtech_catalog_v1");
    if(raw){
      const cached = JSON.parse(raw);
      if(cached && cached.catalog) applyCatalog(cached.catalog);
    }
  }catch(e){ /* מטמון פגום — פשוט ממשיכים לשרת */ }
  // גם בלי מטמון (ביקור ראשון, גלישה פרטית) — האפשרות קיימת ברשימה
  ensureStockCooler();

  /* ---------- הודעת "הוסר בשל חוסר התאמה" ----------
     ⚠️ הבאנר חי כאן ולא ב-builder.html בכוונה: העיצוב של הבונה מוחלף
     בימים אלה, והגשר חייב לעבוד עם כל גרסה שלו. סגנון inline בלבד —
     בלי תלות ב-style.css. aria-live כדי שגם קורא מסך ישמע את ההסרה. */
  function dvtCompatToast(messages){
    if(!messages || !messages.length || !document.body) return;
    let host = document.getElementById("dvtCompatToast");
    if(!host){
      host = document.createElement("div");
      host.id = "dvtCompatToast";
      host.setAttribute("dir", "rtl");
      host.setAttribute("aria-live", "polite");
      host.style.cssText = "position:fixed;bottom:18px;right:18px;z-index:9999;display:flex;flex-direction:column;gap:8px;max-width:min(420px,calc(100vw - 36px));font-family:'Heebo',sans-serif";
      document.body.appendChild(host);
    }
    messages.forEach(msg => {
      const card = document.createElement("div");
      card.style.cssText = "background:#FFF6EA;border:1.5px solid #F6DDAF;color:#92650F;border-radius:14px;padding:12px 16px;font-size:14px;line-height:1.5;box-shadow:0 8px 24px rgba(14,42,71,.14)";
      card.textContent = msg;
      host.appendChild(card);
      // נשאר מספיק זמן לקריאה; לא לנצח — זו הודעה, לא מצב
      setTimeout(() => { if(card.parentNode) card.parentNode.removeChild(card); }, 12000);
    });
  }

  /* ---------- הסרה אוטומטית של רכיב שכבר לא מתאים ----------
     דרישת דביר (סעיף 6): שינוי ברכיב א' שהופך את רכיב ב' ללא-תואם
     חייב להסיר את ב' עם הודעה — לעולם לא הרכבה שבורה בשקט.

     בזמן רגיל ה-UI כבר מונע בחירה מתנגשת (פריט חסום אינו לחיץ), אבל
     שלושה מסלולים כן מייצרים הרכבה שבורה: הרכבה שמורה מ-localStorage
     שהמפרט שלה תוקן בגיליון מאז; חוק חדש שנוסף למנוע; ומעבד שהוחלף
     כשנבחר "קירור בסיסי שמגיע עם המעבד". שלושתם עוברים דרך כאן. */
  function dvtResolveSel(selIds){
    const out = {};
    Object.keys(selIds || {}).forEach(cat => {
      const it = (D.CATALOG[cat] || []).find(i => i.id === selIds[cat]);
      if(it) out[cat] = it;
    });
    return out;
  }

  function dvtAutoInvalidate(selIds, qty, keepCat){
    if(typeof dvtInvalidateSelection !== "function") return null;
    const res = dvtInvalidateSelection(dvtResolveSel(selIds), qty || {}, keepCat);
    if(!res.removed.length) return null;
    res.removed.forEach(r => { delete selIds[r.cat]; });
    dvtCompatToast(res.removed.map(r =>
      `${r.item.name} הוסר מההרכבה בשל חוסר התאמה: ${r.reason}`));
    return res.removed;
  }

  /* --- מסתירים קטגוריות שאין להן נתונים בגיליון ---
     ⚠️ העיצוב הגיע עם מוצרי דמו למאווררי מארז / משחה / רשת / אביזרים.
     אלה *לא* מוצרים אמיתיים ואי אפשר לתמחר אותם בשרת, ולכן הקטגוריה
     כולה מוסתרת עד שיהיו לה מוצרים אמיתיים מהגיליון.

     ⚠️ באג שתוקן: הבדיקה הישנה הייתה
       `(D.CATALOG[key] || []).length && !DEMO_ONLY.includes(key)`
     — התנאי השני תמיד שקרי עבור מפתח מ-DEMO_ONLY, ולכן הקטגוריה
     נמחקה *גם* אחרי שהגיליון מילא אותה. כלומר ברגע שהלשוניות
     החדשות היו נוצרות, הן עדיין לא היו מופיעות בבונה ואף אחד לא היה
     מבין למה. עכשיו ההחלטה לפי liveFilled — מה שבאמת הגיע מהשרת. */
  const DEMO_ONLY = ["caseFans", "wifi", "extras"];

  /* ⚠️ צילום של הרשימות המקוריות. הסינון הוא הרסני, ורענון מהשרת
     מגיע *אחרי* ההרצה הראשונה — בלי הצילום, קטגוריה שהגיליון ימלא
     בשנייה השלישייה כבר לא תוכל לחזור לתפריט. */
  /* 🔴 סינון "משחה" מרשימת הקטגוריות עצמה. בלי זה הקטגוריה נשארת
     ב-D.CATS, מקבלת שורה בסיכום ושלב בבונה — גם בלי לשונית. */
  const ALL_CATS = D.CATS.slice().filter(function (c) { return c.key !== "paste"; });
  const ALL_NEEDED = Array.isArray(D.NEEDED) ? D.NEEDED.slice() : [];

  /* ⚠️ עריכה *בתוך* המערך ולא השמה של מערך חדש. builder.html מצלם
     `const CATS = DATA.CATS` בטעינה, ולכן `D.CATS = ...` היה מנתק אותו:
     קטגוריה שהגיליון מילא רק בתשובת השרת לא הייתה מקבלת לשונית גם
     אחרי רנדר מחדש, ואף אחד לא היה מבין למה. */
  function replaceInPlace(arr, next){ arr.length = 0; next.forEach(x => arr.push(x)); }

  function hideDemoCats(){
    const keep = k => !DEMO_ONLY.includes(k) || liveFilled.has(k);
    replaceInPlace(D.CATS, ALL_CATS.filter(c => keep(c.key)));
    DEMO_ONLY.forEach(c => {
      if(!liveFilled.has(c) && D.CATALOG[c]) delete D.CATALOG[c];
    });
    if(ALL_NEEDED.length) replaceInPlace(D.NEEDED, ALL_NEEDED.filter(keep));
  }
  hideDemoCats();

  /* --- שמירה ושחזור של ההרכבה ---
     מה שהלקוח בחר נשמר מקומית, כך שסגירה בטעות לא מאפסת עבודה.
     ⚠️ אבל כניסה *ראשונה* חייבת להיות ריקה — לכן אין כאן שום ברירת
     מחדל: אם אין רשומה שמורה, הבונה מתחיל בלי אף מוצר. */
  const BUILD_KEY = "dvirtech_build_v1";

  function loadSavedBuild(){
    try{
      const raw = localStorage.getItem(BUILD_KEY);
      if(!raw) return null;
      const o = JSON.parse(raw);
      if(!o || typeof o !== "object" || !o.sel) return null;
      // מזהה ששוב לא קיים בקטלוג (מוצר שהוסר מהגיליון) פשוט נשמט
      const sel = {};
      Object.keys(o.sel).forEach(cat => {
        const list = D.CATALOG[cat] || [];
        if(list.some(i => i.id === o.sel[cat])) sel[cat] = o.sel[cat];
      });
      /* ⚠️ הרכבה שמורה עוברת את מנוע ההתאמה לפני שהיא חוזרת למסך:
         מאז השמירה המפרט בגיליון יכול היה להשתנות (או שנוסף חוק חדש),
         ומה שהיה תקין אתמול יכול להיות שבור היום. עדיף רכיב שנעלם עם
         הסבר מאשר הרכבה שבורה שנראית תקינה. */
      dvtAutoInvalidate(sel, o.qty || {});
      return { sel, qty: o.qty || {}, services: o.services || ["assembly"] };
    }catch(e){ return null; }
  }
  window.__DVT_SAVED_BUILD = loadSavedBuild();

  window.dvtSaveBuild = function(state){
    /* ⚠️ **זו נקודת ההיאחזות של ההסרה האוטומטית, וזה לא מקרי.**
       builder.html קורא לכאן מתוך setState:
           const next = { sel: Object.assign({}, s.sel, {[cat]: id}), last: cat };
           dvtSaveBuild(Object.assign({}, s, next));
           return next;
       האובייקט שמגיע אלינו חולק את **אותה** רפרנס sel עם next —
       ולכן מחיקת מפתח מ-state.sel כאן משנה גם את מה ש-setState יחיל.
       כך ההסרה נכנסת למצב הרכיב בלי לגעת ב-builder.html (שאסור לגעת
       בו — הוא מוחלף בעיצוב מחדש במקביל). אם התבנית שם תשתנה כך
       שהשיתוף יישבר, ההסרה תפסיק לעבוד בשקט — ולכן גם הבדיקה בזמן
       טעינה (loadSavedBuild) וגם dvtCheckBuild במסך ממשיכים לתפוס
       את ההתנגשות; הלקוח לעולם לא רואה "תאימות תקינה" על הרכבה שבורה.
       state.last = הקטגוריה שהרגע נבחרה = מי שנשאר; הרכיב השני מוסר. */
    if(state && state.sel) dvtAutoInvalidate(state.sel, state.qty, state.last);
    try{
      localStorage.setItem(BUILD_KEY, JSON.stringify({
        sel: state.sel || {}, qty: state.qty || {}, services: state.services || []
      }));
    }catch(e){ /* אחסון מלא / גלישה פרטית */ }
  };
  window.dvtResetBuild = function(){
    try{ localStorage.removeItem(BUILD_KEY); }catch(e){}
  };

  /* רענון מהשרת: מחליף קטלוג ומרענן את הרכיב אם הוא כבר עלה. */
  function refreshFrom(catalog){
    if(!applyCatalog(catalog)) return;
    // קטגוריה שהתמלאה רק עכשיו מהשרת צריכה לחזור לתפריט
    hideDemoCats();
    if(window.__dvtBuilderRerender) window.__dvtBuilderRerender();
  }

  if(typeof dvtGetCatalog === "function"){
    dvtGetCatalog().then(refreshFrom).catch(e => console.error("builder-bridge catalog:", e));
    if(typeof dvtOnCatalogRefresh === "function") dvtOnCatalogRefresh(refreshFrom);
  }

  /* ---------- הוספה לעגלה ----------
     מקבל את מה שנבחר בבונה ומעביר ל-API הרגיל של העגלה, כולל parts
     (SKU לכל רכיב) — זה מה שהשרת מתמחר מחדש ב-checkout. */
  window.dvtBuilderAddToCart = function(sel, qty, services, total){
    if(typeof addBuildToCart !== "function"){ console.error("cart.js לא נטען"); return; }
    const lines = [], parts = [];
    Object.keys(sel).forEach(cat => {
      const it = sel[cat];
      if(!it || Number(it.price) === 0 && /none|ללא/.test(String(it.id))) return;
      const n = Math.max(1, Number((qty||{})[cat]) || 1);
      const label = (D.CATS.find(c => c.key === cat) || {}).label || cat;
      /* ⚠️ הקירור מהקופסה של המעבד הוא לא מוצר בגיליון: שולחים אותו
         כשורת תיאור בלבד (שדביר יראה בהזמנה מה סוכם) אבל **בלי** SKU —
         "cooling:stock-cooler" היה נופל בתמחור השרת כמוצר לא מוכר
         ומפיל את כל התשלום. */
      if(it.stockCooler === true){
        lines.push({ label, name: it.name + " (כלול במעבד)", qty: 1 });
        return;
      }
      lines.push({ label, name: it.name, qty: n });
      // רק קטגוריות שקיימות בגיליון מקבלות SKU אמיתי לתמחור בשרת
      if(LIVE_CATS.includes(cat)) parts.push({ sku: cat + ":" + it.id, qty: n });
    });
    (services || []).forEach(s => {
      lines.push({ label: "שירותים", name: s.label, qty: 1 });
      if(s.sku) parts.push({ sku: s.sku, qty: 1 });
    });
    addBuildToCart(lines, Number(total) || 0, parts);
  };
})();

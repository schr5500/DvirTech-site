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
  const LIVE_CATS = ["cpu","mobo","ram","gpu","cooling","storage","psu","case",
                     "caseFans","paste","wifi","extras"];

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

  function applyCatalog(catalog){
    if(!catalog) return false;
    let changed = false;
    LIVE_CATS.forEach(cat => {
      const group = catalog[cat];
      if(!group || !Array.isArray(group.items)) return;
      /* ⚠️ בבונה, בניגוד לחנות, מוצר שאזל *כן* נשמט מהרשימה: אי אפשר
         להרכיב מחשב מרכיב שאין, והצגתו רק תגרום ללקוח לבחור בו ואז
         להיתקע. בחנות הוא נשאר מוצג עם תג "אזל". */
      const sellable = group.items.filter(i =>
        (typeof dvtCanBuy === "function") ? dvtCanBuy(i)
        : (typeof dvtIsSellable === "function") ? dvtIsSellable(i) : (i && i.id !== "none"));
      if(!sellable.length) return;
      D.CATALOG[cat] = sellable.map(i => toBuilderItem(i, sellable));
      liveFilled.add(cat);
      changed = true;
    });
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
  const DEMO_ONLY = ["caseFans", "paste", "wifi", "extras"];

  /* ⚠️ צילום של הרשימות המקוריות. הסינון הוא הרסני, ורענון מהשרת
     מגיע *אחרי* ההרצה הראשונה — בלי הצילום, קטגוריה שהגיליון ימלא
     בשנייה השלישייה כבר לא תוכל לחזור לתפריט. */
  const ALL_CATS = D.CATS.slice();
  const ALL_NEEDED = Array.isArray(D.NEEDED) ? D.NEEDED.slice() : [];

  function hideDemoCats(){
    const keep = k => !DEMO_ONLY.includes(k) || liveFilled.has(k);
    D.CATS = ALL_CATS.filter(c => keep(c.key));
    DEMO_ONLY.forEach(c => {
      if(!liveFilled.has(c) && D.CATALOG[c]) delete D.CATALOG[c];
    });
    if(ALL_NEEDED.length) D.NEEDED = ALL_NEEDED.filter(keep);
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
      return { sel, qty: o.qty || {}, services: o.services || ["assembly"] };
    }catch(e){ return null; }
  }
  window.__DVT_SAVED_BUILD = loadSavedBuild();

  window.dvtSaveBuild = function(state){
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

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
let PD_QTY = 1;

/* שדות שלא מציגים בטבלת המפרט: או פנימיים, או שכבר מוצגים במקום אחר
   בדף (שם, מחיר, תיאור, תמונה). */
const PD_HIDDEN_FIELDS = new Set([
  "id","name","nameEn","spec","specEn","price","brand","image","images",
  "_realCat","icon","desc","descEn","label","labelEn"
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

/* ==================== תמונה ==================== */
function pdArt(item, cat){
  if(item.image) return `<img src="${pdEsc(item.image)}" alt="${pdEsc(itemName(item))}">`;
  const catImg = (typeof PD_CAT_IMAGE !== "undefined") ? PD_CAT_IMAGE[cat] : null;
  if(catImg) return `<img src="${catImg}" alt="${pdEsc(itemName(item))}">`;
  return `<svg aria-hidden="true"><use href="#${dvtIcon(cat)}"/></svg>`;
}

/* אותה מפה כמו ב-home.js. משוכפלת כאן במודע ובקטן, כי home.js לא נטען
   בדף הזה — ולהעביר את המפה ל-search-core.js היה מכניס לשם ידע על
   קבצי תמונה, שזה לא התפקיד שלו. */
const PD_CAT_IMAGE = {
  cpu:"images/categories/cpu.jpg", gpu:"images/categories/gpu.jpg",
  ram:"images/categories/ram.jpg", mobo:"images/categories/mobo.jpg",
  storage:"images/categories/storage.jpg", psu:"images/categories/psu.jpg",
  cooling:"images/categories/cooling.jpg", "case":"images/categories/case.jpg",
  monitor:"images/categories/monitor.jpg", readyPc:"images/categories/readyPc.jpg",
  peripherals:"images/categories/peripherals.jpg"
};

/* ==================== מפרט טכני ==================== */
/* בונה את הטבלה מהשדות שקיימים בפועל על הפריט. אין רשימת שדות קשיחה:
   עמודה חדשה בגיליון תופיע כאן לבד, עם התווית מ-FACET_LABELS אם יש
   ואחרת עם שם השדה עצמו. */
function pdSpecRows(item){
  const rows = [];
  Object.keys(item).forEach(k => {
    if(PD_HIDDEN_FIELDS.has(k)) return;
    const v = item[k];
    if(v === undefined || v === null || v === "") return;
    if(Array.isArray(v) && !v.length) return;
    const shown = Array.isArray(v)
      ? v.map(x => valueLabel(k, x)).join(" · ")
      : valueLabel(k, v);
    rows.push({ key: k, label: facetLabel(k), value: shown });
  });
  return rows;
}

/* ==================== רינדור ==================== */
function pdRenderNotFound(){
  document.getElementById("pdCrumbs").innerHTML = "";
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
  const catName = dvtCatLabel(PD_CAT, PD_CATALOG[PD_CAT]);
  document.getElementById("pdCrumbs").innerHTML = `
    <a href="index.html">${tr("ראשי","Home")}</a>
    <span class="pd-crumb-sep">›</span>
    <a href="products.html?cat=all">${tr("מוצרים","Products")}</a>
    <span class="pd-crumb-sep">›</span>
    <a href="products.html?cat=${encodeURIComponent(PD_CAT)}">${pdEsc(catName)}</a>
    <span class="pd-crumb-sep">›</span>
    <span class="pd-crumb-cur">${pdEsc(itemName(PD_ITEM))}</span>`;
}

function pdRenderBody(){
  const it = PD_ITEM;
  const specRows = pdSpecRows(it);
  const catName = dvtCatLabel(PD_CAT, PD_CATALOG[PD_CAT]);

  document.getElementById("pdBody").innerHTML = `
    <div class="pd-main">
      <div class="pd-media">
        <div class="pd-art">${pdArt(it, PD_CAT)}</div>
        <!-- גילוי נאות ליד התמונה עצמה. הנוסח המחייב המלא נמצא בסעיף 2
             בתקנון; כאן רק שורה קצרה שהלקוח באמת רואה. -->
        <p class="pd-img-note">${tr("התמונה להמחשה בלבד. המפרט הכתוב הוא המחייב.",
                                    "Image for illustration only. The written specification prevails.")}
          <a href="terms.html">${tr("לתקנון","Terms")}</a></p>
      </div>

      <div class="pd-info">
        <a class="pd-cat-link" href="products.html?cat=${encodeURIComponent(PD_CAT)}">${pdEsc(catName)}</a>
        ${it.brand ? `<div class="pd-brand">${pdEsc(it.brand)}</div>` : ""}
        <h1 class="pd-title">${pdEsc(itemName(it))}</h1>
        ${itemSpec(it) ? `<p class="pd-sub">${pdEsc(itemSpec(it))}</p>` : ""}

        <div class="pd-price-box">
          <div class="pd-price">${pdNis(it.price)}</div>
          <div class="pd-price-note">${tr("כולל אחריות יבואן רשמי · עד 12 תשלומים",
                                          "Official importer warranty · up to 12 installments")}</div>
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
            <span id="pdQty">1</span>
            <button type="button" onclick="pdChangeQty(1)" aria-label="${tr("הוסף","Increase")}">+</button>
          </div>
          ${(typeof dvtInStock === "function" && !dvtInStock(it))
            ? `<button class="btn btn-primary pd-add" disabled>${tr("אזל המלאי","Out of stock")}</button>`
            : `<button class="btn btn-primary pd-add" onclick="pdAddToCart()">${t("addToCartBtn")}</button>`}
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

      ${specRows.length ? `
      <section class="pd-section">
        <h2>${tr("מפרט טכני","Technical specifications")}</h2>
        <table class="pd-spec">
          <tbody>
            ${specRows.map(r => `<tr><th>${pdEsc(r.label)}</th><td>${pdEsc(r.value)}</td></tr>`).join("")}
          </tbody>
        </table>
      </section>` : ""}
    </div>`;
}

/* תיאור: אם יש עמודת desc בגיליון — מציגים אותה. אין עדיין כזו, ולכן
   בינתיים מרכיבים משפט מהנתונים הקיימים במקום להשאיר שדה ריק. ברגע
   שתתווסף עמודה desc/descEn היא תגבר אוטומטית. */
/* שמות הקטגוריות בחנות הם ברבים ("כרטיסי מסך"), ומשפט תיאור צריך יחיד.
   חיתוך אוטומטי של סיומת רבים לא עובד בעברית ("כרטיסי מסך" לא נגמר
   ב-ים), ולכן יש כאן מיפוי מפורש. */
const PD_CAT_SINGULAR = {
  readyPc:"מחשב מוכן", monitor:"מסך", peripherals:"פריט ציוד היקפי",
  cpu:"מעבד", gpu:"כרטיס מסך", mobo:"לוח אם", ram:"ערכת זיכרון",
  storage:"כונן", cooling:"פתרון קירור", psu:"ספק כוח", "case":"מארז"
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
  const same = sellableInCat(PD_CAT)
    .filter(x => String(x.id) !== String(PD_ITEM.id))
    .sort((a,b) => Math.abs(a.price - PD_ITEM.price) - Math.abs(b.price - PD_ITEM.price))
    .slice(0, 5);
  if(!same.length){ document.getElementById("pdRelated").innerHTML = ""; return; }

  document.getElementById("pdRelated").innerHTML = `
    <div class="sec-head"><h2>${tr("מוצרים דומים","Similar products")}</h2>
      <a class="more" href="products.html?cat=${encodeURIComponent(PD_CAT)}">${tr("הכל","View all")}</a></div>
    <div class="rowscroll">
      ${same.map(x => `
        <a class="deal" href="product.html?cat=${encodeURIComponent(PD_CAT)}&id=${encodeURIComponent(x.id)}">
          <div class="deal-art">${pdArt(x, PD_CAT)}</div>
          <div class="deal-name">${pdEsc(itemName(x))}</div>
          <div class="deal-foot"><span class="deal-price">${pdNis(x.price)}</span></div>
        </a>`).join("")}
    </div>`;
}

function sellableInCat(cat){
  const g = PD_CATALOG[cat];
  if(!g) return [];
  return (g.items || []).filter(dvtIsSellable);
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
  PD_QTY = Math.max(1, Math.min(20, PD_QTY + d));   // 20 = התקרה שהשרת אוכף
  document.getElementById("pdQty").textContent = PD_QTY;
  pdRenderTotal();
}

/* סה"כ חי לפי הכמות. מופיע רק מכמות 2 ומעלה. */
function pdRenderTotal(){
  const box = document.getElementById("pdTotalBox");
  if(!box || !PD_ITEM) return;
  if(PD_QTY < 2){ box.hidden = true; return; }
  box.hidden = false;
  document.getElementById("pdTotalQty").textContent = PD_QTY;
  document.getElementById("pdTotalVal").textContent = pdNis(Number(PD_ITEM.price) * PD_QTY);
}

function pdAddToCart(){
  if(!PD_ITEM) return;
  if(typeof dvtInStock === "function" && !dvtInStock(PD_ITEM)) return;
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
  if(PD_ITEM){ pdRenderCrumbs(); pdRenderBody(); pdRenderRelated(); }
}

/* ==================== טעינה ==================== */
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

  const found = (cat && id) ? pdFindItem(PD_CATALOG, cat, id) : null;
  if(!found){ pdRenderNotFound(); return; }

  PD_ITEM = found;
  PD_CAT  = found._realCat;
  document.title = itemName(found) + " — DvirTech";

  pdRenderCrumbs();
  pdRenderBody();
  pdRenderRelated();

  dvtOnCatalogRefresh(fresh => {
    PD_CATALOG = fresh;
    const again = pdFindItem(fresh, PD_CAT, PD_ITEM.id);
    if(again){ PD_ITEM = again; pdRenderBody(); pdRenderRelated(); }
  });
}

loadProduct();

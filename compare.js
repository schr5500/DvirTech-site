/* =====================================================================
   DvirTech — השוואת מוצרים (compare.html)
   =====================================================================
   דביר, 25.08: *"בלי בחירת דגמים באופן אוטומטי שנכפית על הלקוח, אלא
   לחצן — הוספת דגמים דומים. שבמידה והוא ירצה להוסיף דגמים בעצמו זה
   לא יעשה לו OVERRIDE או יהיה מעצבן, כי הוא לא ביקש בכלל."*

   שלושת הכללים שנגזרים מזה, וכל הקובץ בנוי סביבם:

   1. 🔴 **הדף לעולם לא מוסיף מוצר מעצמו.** נטען עם מה שבכתובת, נקודה.
      "הוסף דגמים דומים" הוא **כפתור**, והוא הדרך היחידה שמוצר נכנס
      בלי שהלקוח בחר אותו בשמו.
   2. 🔴 **הוספה אוטומטית לעולם לא דורסת בחירה.** היא ממלאת **רק
      מקומות פנויים** מתוך ארבעה, ואף פעם לא מסירה מוצר שהלקוח שם.
      אם אין מקום — היא אומרת את זה ולא עושה כלום.
   3. 🔴 **הכל הפיך.** X על כל עמודה, והכתובת מתעדכנת — כלומר גם
      "אחורה" בדפדפן וגם שליחת הקישור בוואטסאפ עובדים.

   ⚠️ **קטגוריה אחת בהשוואה, תמיד.** טבלה שמשווה מעבד מול מארז היא
   90% תאים ריקים. הקטגוריה נקבעת ע"י המוצר הראשון, וכל השאר חייבים
   להשתייך אליה — הבורר בצד ממילא מציג רק אותה.

   ⚠️ **המפרט מגיע מ-`pdSpecRows` שב-product.js** — אותה פונקציה
   בדיוק שבונה את טבלת המפרט בדף המוצר. לא הועתקה לכאן: שתי רשימות
   שדות היו נפרדות ביום שמישהו מעדכן אחת מהן.

   דורש: search-core.js · i18n.js · product.js (לאוצר המילים) · cart.js
   ===================================================================== */

const CMP_MAX = 4;          /* מעל 4 הטבלה לא נקראת בנייד */
const CMP_PARAM_CAT = "cat";
const CMP_PARAM_IDS = "ids";

let CMP_CATALOG = null;
let CMP_CAT = null;         /* מפתח הקטגוריה שנעולה להשוואה */
let CMP_IDS = [];           /* מזהי המוצרים, לפי הסדר שהלקוח בחר */

/* ==================== כתובת ==================== */

function cmpReadUrl(){
  const p = new URLSearchParams(location.search);
  CMP_CAT = p.get(CMP_PARAM_CAT) || null;
  CMP_IDS = (p.get(CMP_PARAM_IDS) || "").split(",")
    .map(s => s.trim()).filter(Boolean).slice(0, CMP_MAX);
}

/* ⚠️ replaceState ולא pushState: כל הסרה/הוספה הייתה מוסיפה כניסה
   להיסטוריה, ו"אחורה" היה מטייל בין מצבי ביניים במקום לחזור לדף
   הקודם. הכתובת כן מתעדכנת — כדי שאפשר יהיה לשתף אותה. */
function cmpWriteUrl(){
  const u = new URL(location.href);
  if(CMP_CAT) u.searchParams.set(CMP_PARAM_CAT, CMP_CAT);
  else u.searchParams.delete(CMP_PARAM_CAT);
  if(CMP_IDS.length) u.searchParams.set(CMP_PARAM_IDS, CMP_IDS.join(","));
  else u.searchParams.delete(CMP_PARAM_IDS);
  history.replaceState({}, "", u.pathname + u.search + u.hash);
}

/* ==================== גישה לנתונים ==================== */

function cmpItems(){
  const node = CMP_CATALOG && CMP_CATALOG[CMP_CAT];
  return (node && Array.isArray(node.items)) ? node.items : [];
}

function cmpById(id){
  const list = cmpItems();
  for(let i = 0; i < list.length; i++){
    if(String(list[i].id) === String(id)) return list[i];
  }
  return null;
}

function cmpChosen(){
  return CMP_IDS.map(cmpById).filter(Boolean);
}

/* קטגוריות שיש בהן לפחות שני מוצרים — אין טעם להציע השוואה של אחד. */
function cmpComparableCats(){
  if(!CMP_CATALOG) return [];
  return Object.keys(CMP_CATALOG).filter(k => {
    const n = CMP_CATALOG[k];
    return n && Array.isArray(n.items) && n.items.length >= 2 && k !== "services";
  });
}

/* ==================== פעולות ==================== */

function cmpAdd(id){
  if(CMP_IDS.length >= CMP_MAX){
    cmpToast(tr("אפשר להשוות עד " + CMP_MAX + " מוצרים. הסר אחד כדי להוסיף אחר.",
                "You can compare up to " + CMP_MAX + " products. Remove one to add another."));
    return;
  }
  if(CMP_IDS.indexOf(id) > -1) return;    /* כבר בהשוואה — לא כפילות */
  CMP_IDS.push(id);
  cmpWriteUrl();
  cmpRender();
}

function cmpRemove(id){
  CMP_IDS = CMP_IDS.filter(x => x !== id);
  cmpWriteUrl();
  cmpRender();
}

function cmpClear(){
  CMP_IDS = [];
  cmpWriteUrl();
  cmpRender();
}

/* 🔴 **"הוסף דגמים דומים" — הכפתור, לא התנהגות אוטומטית.**
   הדמיון נמדד לפי **מחיר** בלבד, וזו החלטה מכוונת: זה הקריטריון
   היחיד שנכון בכל קטגוריה בלי לדעת עליה כלום, והוא גם מה שהלקוח
   באמת משווה. דירוג לפי מפרט היה דורש משקל לכל שדה בכל קטגוריה —
   הרבה קוד, והרבה מקומות להיות שגוי בהם.

   ⚠️ **ממלא רק מקומות פנויים.** לא מסיר, לא מסדר מחדש, לא נוגע
   במה שהלקוח בחר. */
function cmpAddSimilar(){
  const chosen = cmpChosen();
  if(!chosen.length) return;
  const room = CMP_MAX - CMP_IDS.length;
  if(room <= 0){
    cmpToast(tr("ההשוואה מלאה (" + CMP_MAX + " מוצרים). הסר אחד כדי לפנות מקום.",
                "The comparison is full (" + CMP_MAX + "). Remove one to make room."));
    return;
  }

  /* עוגן המחיר: ממוצע מה שכבר נבחר. */
  const anchor = chosen.reduce((s, it) => s + Number(it.price || 0), 0) / chosen.length;

  const pool = cmpItems()
    .filter(it => CMP_IDS.indexOf(String(it.id)) === -1)
    .filter(it => Number(it.price) > 0)
    .map(it => ({ it: it, d: Math.abs(Number(it.price) - anchor) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, room);

  if(!pool.length){
    cmpToast(tr("לא נמצאו דגמים נוספים בקטגוריה הזו.",
                "No other models found in this category."));
    return;
  }
  pool.forEach(p => { if(CMP_IDS.length < CMP_MAX) CMP_IDS.push(String(p.it.id)); });
  cmpWriteUrl();
  cmpRender();
  cmpToast(tr("נוספו " + pool.length + (pool.length === 1 ? " דגם" : " דגמים") + ". אפשר להסיר כל אחד ב-✕.",
              "Added " + pool.length + " model(s). Remove any with ✕."));
}

/* ==================== רינדור ==================== */

function cmpRender(){
  cmpRenderPicker();
  const host = document.getElementById("cmpMain");
  const chosen = cmpChosen();

  if(!CMP_CAT || !chosen.length){
    host.innerHTML = cmpEmptyHtml();
    return;
  }

  /* שורות המפרט: איחוד כל השדות שיש לפחות למוצר אחד, בסדר של
     הקטגוריה. שדה שריק אצל כולם לא מודפס בכלל. */
  const perItem = chosen.map(it => {
    const rows = (typeof pdSpecRows === "function") ? pdSpecRows(it, CMP_CAT) : [];
    const map = {};
    rows.forEach(r => { map[r.label] = r.value; });
    return map;
  });

  const labels = [];
  perItem.forEach(m => Object.keys(m).forEach(l => {
    if(labels.indexOf(l) === -1) labels.push(l);
  }));

  const head = chosen.map(it => `
    <th class="cmp-col">
      <button class="cmp-remove" onclick="cmpRemove('${escHtml(String(it.id))}')"
              aria-label="${tr("הסר מההשוואה","Remove from comparison")}">✕</button>
      <a class="cmp-card" href="product.html?cat=${encodeURIComponent(CMP_CAT)}&id=${encodeURIComponent(it.id)}">
        ${it.image ? `<img class="cmp-img" src="${escHtml(it.image)}" alt="" loading="lazy">`
                   : `<div class="cmp-img cmp-img-none"></div>`}
        <div class="cmp-name">${escHtml(itemName ? itemName(it) : it.name)}</div>
      </a>
      <div class="cmp-price">${Number(it.price).toLocaleString()} ₪</div>
      <button class="btn btn-accent cmp-add-cart"
              onclick="cmpAddToCart('${escHtml(String(it.id))}')">${tr("הוסף לסל","Add to cart")}</button>
    </th>`).join("");

  /* 🔴 **הדגשת הבדלים — זה כל הערך של הדף.**
     שורה שבה כל המוצרים זהים היא רעש: היא לא עוזרת להכריע. היא
     מוצגת בעמעום, והשורות שבהן יש הבדל אמיתי בולטות. */
  const body = labels.map(label => {
    const vals = perItem.map(m => m[label] === undefined ? null : m[label]);
    const present = vals.filter(v => v !== null);
    const same = present.length === vals.length &&
                 present.every(v => v === present[0]);
    return `<tr class="${same ? "cmp-same" : "cmp-diff"}">
      <th class="cmp-label">${escHtml(label)}</th>
      ${vals.map(v => `<td>${v === null
        ? `<span class="cmp-na">${tr("—","—")}</span>`
        : escHtml(String(v))}</td>`).join("")}
    </tr>`;
  }).join("");

  const catLabel = (typeof dvtCatLabel === "function") ? dvtCatLabel(CMP_CAT) : CMP_CAT;

  host.innerHTML = `
    <div class="cmp-toolbar">
      <div class="cmp-toolbar-info">
        <span class="cmp-chip">${escHtml(catLabel)}</span>
        <span class="cmp-count">${chosen.length}/${CMP_MAX}</span>
      </div>
      <div class="cmp-toolbar-actions">
        <button class="btn btn-secondary" onclick="cmpAddSimilar()">
          ${tr("הוסף דגמים דומים","Add similar models")}</button>
        <button class="btn btn-secondary" onclick="cmpShare()">
          ${tr("שתף השוואה","Share comparison")}</button>
        <button class="btn btn-secondary" onclick="cmpClear()">
          ${tr("נקה","Clear")}</button>
      </div>
    </div>

    <div class="cmp-scroll">
      <table class="cmp-table">
        <thead><tr><th class="cmp-corner"></th>${head}</tr></thead>
        <tbody>${body || `<tr><td class="cmp-nospec" colspan="${chosen.length + 1}">${
          tr("אין עדיין מפרט מוזן למוצרים האלה.","No specifications recorded for these products yet.")
        }</td></tr>`}</tbody>
      </table>
    </div>

    ${labels.length ? `<p class="cmp-legend">${
      tr("שורות מודגשות = יש הבדל בין הדגמים. שורות מעומעמות = כולם זהים.",
         "Highlighted rows differ between models. Dimmed rows are identical.")
    }</p>` : ""}
  `;
}

function cmpEmptyHtml(){
  return `<div class="cmp-empty">
    <h2>${tr("השוואת מוצרים","Compare products")}</h2>
    <p>${tr("בחר קטגוריה מימין ואז עד " + CMP_MAX + " דגמים להשוואה — או הגע לכאן מכפתור “השווה” בדף מוצר.",
            "Pick a category on the right, then up to " + CMP_MAX + " models — or arrive here from the “Compare” button on a product page.")}</p>
  </div>`;
}

/* ==================== הבורר בצד ====================
   דביר: "יהיה טוב אם גם יהיה אפשר לבחור דגמים מאותה קטגוריה בדף
   ההשוואה — בשביל שהוא לא יצטרך לחזור כל פעם לדף הקטלוג." */
function cmpRenderPicker(){
  const host = document.getElementById("cmpPicker");
  const cats = cmpComparableCats();

  const catOpts = cats.map(k => {
    const label = (typeof dvtCatLabel === "function") ? dvtCatLabel(k) : k;
    return `<option value="${escHtml(k)}"${k === CMP_CAT ? " selected" : ""}>${escHtml(label)}</option>`;
  }).join("");

  const q = (document.getElementById("cmpSearch") || {}).value || "";
  const needle = q.trim().toLowerCase();
  const list = cmpItems()
    .filter(it => Number(it.price) > 0)
    .filter(it => !needle || String(itemName ? itemName(it) : it.name).toLowerCase().indexOf(needle) > -1)
    .slice(0, 60);

  host.innerHTML = `
    <label class="cmp-pick-label">${tr("קטגוריה","Category")}</label>
    <select id="cmpCatSel" class="cmp-select" onchange="cmpSwitchCat(this.value)">
      <option value="">${tr("בחר קטגוריה…","Choose a category…")}</option>
      ${catOpts}
    </select>

    ${CMP_CAT ? `
      <label class="cmp-pick-label">${tr("הוסף דגם","Add a model")}</label>
      <input id="cmpSearch" class="cmp-select" type="search" value="${escHtml(q)}"
             placeholder="${tr("חפש דגם…","Search models…")}" oninput="cmpRenderPicker()">
      <ul class="cmp-pick-list">
        ${list.length ? list.map(it => {
          const on = CMP_IDS.indexOf(String(it.id)) > -1;
          return `<li>
            <button class="cmp-pick-item${on ? " is-on" : ""}"
                    ${on ? "disabled" : ""}
                    onclick="cmpAdd('${escHtml(String(it.id))}')">
              <span class="cmp-pick-name">${escHtml(itemName ? itemName(it) : it.name)}</span>
              <span class="cmp-pick-price">${Number(it.price).toLocaleString()} ₪</span>
            </button></li>`;
        }).join("") : `<li class="cmp-pick-none">${tr("לא נמצאו דגמים","No models found")}</li>`}
      </ul>` : ""}
  `;

  /* שמירת מיקוד בשדה החיפוש — בלי זה כל הקלדה מאבדת את הסמן. */
  const s = document.getElementById("cmpSearch");
  if(s && needle){ s.focus(); s.setSelectionRange(s.value.length, s.value.length); }
}

/* מעבר קטגוריה מנקה את הבחירה — מוצרים מקטגוריה אחרת לא יכולים
   להישאר בטבלה שכל השדות שלה שייכים לקטגוריה החדשה. */
function cmpSwitchCat(k){
  if(k === CMP_CAT) return;
  CMP_CAT = k || null;
  CMP_IDS = [];
  cmpWriteUrl();
  cmpRender();
}

/* ==================== שיתוף + עגלה ==================== */

function cmpShare(){
  const url = location.href;
  const txt = tr("השוואת דגמים ב-DvirTech:", "A model comparison at DvirTech:") + "\n" + url;
  if(navigator.share){
    navigator.share({ title: "DvirTech", text: txt, url: url }).catch(() => {});
    return;
  }
  window.open("https://wa.me/?text=" + encodeURIComponent(txt), "_blank", "noopener");
}

function cmpAddToCart(id){
  const it = cmpById(id);
  if(!it || typeof addToCart !== "function") return;
  addToCart({
    sku: CMP_CAT + ":" + it.id,
    type: "product",
    name: itemName ? itemName(it) : it.name,
    price: Number(it.price),
    qty: 1
  });
}

/* הודעה קצרה — במקום alert שחוסם, ובמקום כלום שלא מסביר. */
function cmpToast(msg){
  let el = document.getElementById("cmpToast");
  if(!el){
    el = document.createElement("div");
    el.id = "cmpToast";
    el.className = "cmp-toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("is-on");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("is-on"), 3200);
}

/* ==================== אתחול ==================== */

async function cmpInit(){
  cmpReadUrl();
  const host = document.getElementById("cmpMain");
  host.innerHTML = `<div class="pd-loading"><span class="spinner"></span>${
    tr("טוען…","Loading…")}</div>`;
  try{
    CMP_CATALOG = await dvtGetCatalog();
  }catch(e){
    host.innerHTML = `<div class="cmp-empty"><p>${
      tr("לא הצלחנו לטעון את הקטלוג כרגע. רענן/י את הדף.",
         "Couldn't load the catalog right now. Please refresh.")}</p></div>`;
    return;
  }
  /* קטגוריה שלא קיימת בכתובת (הוסרה מאז) — מתאפסת בשקט. */
  if(CMP_CAT && !CMP_CATALOG[CMP_CAT]){ CMP_CAT = null; CMP_IDS = []; }
  cmpRender();
}

if(document.getElementById("cmpMain")) cmpInit();

/* =====================================================================
   DvirTech — לוגיקת האתר
   =====================================================================
   גנרי לגמרי מול CATALOG: הוספת מוצר לקטגוריה קיימת לא דורשת לגעת כאן.
   כל טקסט קבוע עובר דרך t() / tr() כדי לתמוך בעברית ואנגלית בו-זמנית.

   ⚠️ CATALOG כבר לא const מקומי מ-catalog.js — הוא נטען חי מהגיליון
   הפרטי דרך catalog-loader.js (fetch ל-4-payment-api.gs, action=getCatalog),
   ומאתחל את הקבצים כאן רק אחרי שהוא מגיע. אם קורא לקובץ הזה עצמאית,
   ודא ש-CATALOG כבר קיים לפני שקוראים לפונקציות למטה.
===================================================================== */

const ICONS = {
  cpu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="6" y="6" width="12" height="12" rx="1.5"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3M12 2v3M15 2v3M9 19v3M12 19v3M15 19v3M2 9h3M2 12h3M2 15h3M19 9h3M19 12h3M19 15h3"/></svg>`,
  mobo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="1.5"/><rect x="6" y="6" width="6" height="6"/><path d="M15 6h3M15 9h3M15 13h3M6 15h3M11 15h7"/></svg>`,
  ram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="7" width="16" height="9" rx="1"/><path d="M7 16v3M10 16v3M13 16v3M16 16v3M7 7v3M10 7v2M13 7v2M16 7v3"/></svg>`,
  gpu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="8" width="18" height="8" rx="1.5"/><circle cx="8" cy="12" r="1.8"/><circle cx="13" cy="12" r="1.8"/><path d="M3 10.5h-1.5M3 13.5h-1.5M18 16v2h-3v-2"/></svg>`,
  cooling: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="3"/><path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M6.3 17.7l2.8-2.8M14.9 9.1l2.8-2.8"/></svg>`,
  storage: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r=".6" fill="currentColor"/></svg>`,
  psu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="5" width="16" height="14" rx="1.5"/><path d="M9 9h6l-2 3h2l-4 5 1-4h-2z" fill="currentColor" stroke="none"/></svg>`,
  case: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="6" y="2" width="12" height="20" rx="1.5"/><circle cx="12" cy="6" r="1"/><path d="M9 11h6M9 14h6"/></svg>`,
  services: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>`
};

const REQUIRED_CATEGORIES = ["cpu","mobo","ram","storage","psu","case"]; // gpu, cooling, services optional
let selections = {}; // selections[cat] = { id, qty } | undefined
let useCaseKey = "gaming";
let lastChangedCat = null;
let lastTotal = null;

function getItem(cat){ return selections[cat] ? CATALOG[cat].items.find(i => i.id === selections[cat].id) : null; }
function getQty(cat){ return selections[cat] ? selections[cat].qty : 0; }

function radiatorFits(mm, support){ return !!support && (support.front === mm || support.top === mm); }

/* ================= quantity limits ================= */
function maxQtyFor(cat, item){
  if(cat === "ram"){
    const mobo = getItem("mobo");
    return mobo ? Math.max(1, Math.floor(mobo.ramSlots / item.sticks)) : 2;
  }
  if(cat === "cpu"){
    const mobo = getItem("mobo");
    return mobo ? (mobo.cpuSockets || 1) : 1;
  }
  if(cat === "storage"){
    // חריצי M.2 מגבילים כונני NVMe בלבד. כונן SATA (SSD או דיסק מכני)
    // מתחבר בכבל ולא תופס חריץ, ולכן אין לו את התקרה הזו. כונן בלי
    // driveType בגיליון נחשב NVMe — כך היה כל המלאי עד שנוספה העמודה.
    if(item && item.driveType && item.driveType !== "nvme") return 4;
    const mobo = getItem("mobo");
    return mobo ? Math.max(1, mobo.m2Slots || 1) : 1;
  }
  return 1;
}
const QTY_CATEGORIES = ["cpu","ram","storage"];

/* ================= compatibility engine ================= */
function evaluateItem(cat, item){
  const cpu = getItem("cpu"), mobo = getItem("mobo"), gpu = getItem("gpu"),
        cooling = getItem("cooling"), psu = getItem("psu"), pcCase = getItem("case");

  if(cat === "mobo"){
    if(cpu && item.socket !== cpu.socket) return { hidden:true };
    const ram = getItem("ram");
    if(ram && ram.ramType !== item.ramType) return { hidden:true };
    if(pcCase && !pcCase.supportedFormFactors.includes(item.formFactor)) return { hidden:true };
    if(!cpu) return { hidden:false, status:"recommended", reason:null };
    const diff = item.tier - cpu.tier;
    if(diff >= 1)
      return { hidden:false, status:"above_need", reason: tr(
        "לוח אם ברמה גבוהה מהנדרש למעבד שנבחר — לרוב עולה יותר מהמעבד עצמו, ולא יתרום לביצועים בפועל, אלא אם מתוכנן שדרוג מעבד בעתיד",
        "A higher-tier board than this CPU needs — often costs more than the CPU itself and won't add real performance, unless you're planning a future CPU upgrade") };
    if(diff <= -2)
      return { hidden:false, status:"works", reason: tr(
        "לוח בסיסי יחסית למעבד החזק שנבחר, ועלול להגביל אספקת מתח או תכונות מתקדמות",
        "A fairly basic board for this powerful CPU — may limit power delivery or advanced features") };
    if(cpu.overclockable && !item.supportsOverclocking)
      return { hidden:false, status:"works", reason: tr(
        "תואם פיזית, אך לא תומך ב-Overclocking של המעבד שנבחר",
        "Physically compatible, but doesn't support overclocking on the chosen CPU") };
    return { hidden:false, status:"recommended", reason:null };
  }

  if(cat === "gpu"){
    if(item.id === "none") return { hidden:false, status:null, reason:null };
    if(pcCase && item.lengthMm > pcCase.maxGpuLengthMm) return { hidden:true };
    if(psu && (item.recommendedPsuWatts - psu.wattage) > 150) return { hidden:true };
    if(psu && psu.wattage < item.recommendedPsuWatts)
      return { hidden:false, status:"not_recommended", reason: tr(
        `ספק הכוח שנבחר (${psu.wattage}W) חלש מהמומלץ לכרטיס המסך הזה (${item.recommendedPsuWatts}W) — עלול להגביל ביצועים או לגרום לכיבויים בעומס`,
        `The chosen PSU (${psu.wattage}W) is weaker than recommended for this graphics card (${item.recommendedPsuWatts}W) — may limit performance or cause shutdowns under load`) };
    if(cpu){
      const diff = item.tier - cpu.tier;
      if(diff >= 2) return { hidden:false, status:"not_recommended", reason: tr(
        "המעבד שנבחר עלול להוות צוואר בקבוק ולא לנצל את מלוא הביצועים של כרטיס המסך",
        "The chosen CPU may bottleneck the graphics card and hold back its full performance") };
      if(diff === 1) return { hidden:false, status:"works", reason: tr(
        "שילוב תקין, אך המעבד עשוי להגביל מעט את הביצועים המקסימליים של כרטיס המסך",
        "A valid pairing, but the CPU may slightly limit the graphics card's peak performance") };
      if(diff <= -2) return { hidden:false, status:"works", reason: tr(
        "שילוב תקין, אך לא ינצל את מלוא הפוטנציאל של המעבד",
        "A valid pairing, but won't use the CPU's full potential") };
      return { hidden:false, status:"recommended", reason:null };
    }
    return { hidden:false, status:null, reason:null };
  }

  if(cat === "cooling"){
    if(cpu && !item.sockets.includes(cpu.socket)) return { hidden:true };
    if(pcCase){
      if(item.type === "aio" && !radiatorFits(item.radiatorMm, pcCase.radiatorSupport)) return { hidden:true };
      if(item.type === "air" && item.heightMm > pcCase.maxAirCoolerHeightMm) return { hidden:true };
    }
    if(cpu){
      if(item.tdpRating < cpu.tdp) return { hidden:false, status:"not_recommended", reason: tr(
        `דירוג הקירור (${item.tdpRating}W) נמוך מהחום שהמעבד עשוי לפלוט בפועל תחת עומס (${cpu.tdp}W) — צפוי חימום יתר והאטת ביצועים (Thermal Throttling)`,
        `Cooling rating (${item.tdpRating}W) is below what this CPU can actually output under load (${cpu.tdp}W) — expect overheating and thermal throttling`) };
      if(item.tdpRating > cpu.tdp * 2) return { hidden:false, status:"above_need", reason: tr(
        "קירור חזק משמעותית מהנדרש למעבד זה — לא יתרום לביצועים, ומתאים בעיקר למי שמתכנן שדרוג מעבד בעתיד",
        "Cooling significantly beyond what this CPU needs — won't improve performance, mainly useful if planning a future CPU upgrade") };
      if(item.tdpRating >= cpu.tdp * 1.1) return { hidden:false, status:"recommended", reason:null };
      return { hidden:false, status:"works", reason: tr(
        "יספיק ברוב המקרים, אך עם מרווח נמוך מאוד בעומסים ממושכים",
        "Sufficient for most cases, but very little headroom under sustained load") };
    }
    return { hidden:false, status:null, reason:null };
  }

  if(cat === "psu"){
    if(gpu && gpu.id !== "none" && (gpu.recommendedPsuWatts - item.wattage) > 150) return { hidden:true };
    if(gpu && gpu.id !== "none"){
      if(item.wattage < gpu.recommendedPsuWatts) return { hidden:false, status:"not_recommended", reason: tr(
        "ההספק נמוך מהמומלץ לכרטיס המסך שנבחר", "Wattage is below what's recommended for the chosen graphics card") };
      if(item.wattage >= gpu.recommendedPsuWatts + 150) return { hidden:false, status:"recommended", reason:null };
      return { hidden:false, status:"works", reason: tr(
        "עומד בדרישת המינימום, אך כמעט ללא מרווח נשימה",
        "Meets the minimum requirement, but with almost no headroom") };
    }
    return { hidden:false, status:"recommended", reason:null };
  }

  if(cat === "case"){
    if(gpu && gpu.id !== "none" && gpu.lengthMm > item.maxGpuLengthMm) return { hidden:true };
    if(mobo && !item.supportedFormFactors.includes(mobo.formFactor)) return { hidden:true };
    if(cooling){
      if(cooling.type === "aio" && !radiatorFits(cooling.radiatorMm, item.radiatorSupport)) return { hidden:true };
      if(cooling.type === "air" && cooling.heightMm > item.maxAirCoolerHeightMm) return { hidden:true };
    }
    if(gpu && gpu.id !== "none" && (item.maxGpuLengthMm - gpu.lengthMm) < 15)
      return { hidden:false, status:"works", reason: tr(
        "כרטיס המסך יתאים, אך במרווח צר מאוד", "The graphics card will fit, but with very little clearance") };
    return { hidden:false, status:"recommended", reason:null };
  }

  if(cat === "ram"){
    if(mobo && item.ramType !== mobo.ramType) return { hidden:true };
    const currentQty = (selections.ram && selections.ram.id === item.id) ? selections.ram.qty : 1;
    const totalGb = item.capacityGb * currentQty;
    if(totalGb < 16) return { hidden:false, status:"not_recommended", reason: tr(
      `סה"כ ${totalGb}GB — נמוך מדי לשימוש מודרני בכל תרחיש, מומלץ 16GB לפחות`,
      `Total ${totalGb}GB — too low for modern use in any scenario, 16GB minimum recommended`) };
    const idealGb = cpu ? (cpu.tier >= 3 ? 32 : 16) : 16;
    if(totalGb >= idealGb) return { hidden:false, status:"recommended", reason:null };
    return { hidden:false, status:"works", reason: tr(
      `סה"כ ${totalGb}GB מספיק לשימוש קליל, אך בעומסים כבדים עלול להיות צוואר בקבוק`,
      `Total ${totalGb}GB is enough for light use, but may bottleneck under heavy workloads`) };
  }

  return { hidden:false, status:null, reason:null };
}

const STATUS_META = {
  recommended: { label: () => tr("🏆 מומלץ להרכב", "🏆 Great Match"), cls:"badge-rec" },
  above_need: { label: () => tr("💡 מעבר לנדרש", "💡 More Than Needed"), cls:"badge-info" },
  works: { label: () => tr("⚠️ עובד עם ההרכב", "⚠️ Works, But Limited"), cls:"badge-works" },
  not_recommended: { label: () => tr("⛔ לא מומלץ להרכב", "⛔ Not Recommended"), cls:"badge-bad" }
};

/* ================= static text (language switch) ================= */
function renderStaticText(){
  document.documentElement.lang = LANG;
  document.documentElement.dir = LANG === "he" ? "rtl" : "ltr";

  document.getElementById("navReady").textContent = t("navReady");
  document.getElementById("navBuilder").textContent = t("navBuilder");
  document.getElementById("navPeripherals").textContent = t("navPeripherals");
  document.getElementById("navLab").textContent = t("navLab");
  document.getElementById("navContact").textContent = t("navContact");

  document.getElementById("heroTitle").textContent = t("heroTitle") + " ";
  document.getElementById("heroTitleHighlight").textContent = t("heroTitleHighlight");
  document.getElementById("heroSubtitle").textContent = t("heroSubtitle");

  document.getElementById("trustWarranty").textContent = t("trustWarranty");
  document.getElementById("trustStress").textContent = t("trustStress");
  document.getElementById("trustSupport").textContent = t("trustSupport");
  document.getElementById("trustShipping").textContent = t("trustShipping");

  document.getElementById("summaryTitle").textContent = t("summaryTitle");
  document.getElementById("summarySubtitle").textContent = t("summarySubtitle");
  document.getElementById("filterExplainer").textContent = t("filterExplainer");
  document.getElementById("totalLabel").textContent = t("totalLabel");
  document.getElementById("diagramTitle").textContent = t("diagramTitle");
  document.getElementById("useCaseLabel").textContent = t("useCaseLabel");
  document.getElementById("resolutionLabel").textContent = t("resolutionLabel");

  document.getElementById("useCase").innerHTML = USE_CASES.map(k =>
    `<option value="${k}"${k===useCaseKey?" selected":""}>${USE_CASE_LABELS[k][LANG]}</option>`).join("");
  document.getElementById("resolution").innerHTML = Object.keys(UI_TEXT[LANG].resOptions).map(k =>
    `<option value="${k}">${UI_TEXT[LANG].resOptions[k]}</option>`).join("");

  document.getElementById("analyzeBtnText").textContent = t("analyzeBtn");
  document.getElementById("analyzeBtnSub").textContent = t("analyzeBtnSub");
  document.getElementById("whatsappBtn").textContent = t("whatsappBtn");
  document.getElementById("aiLoadingText").textContent = t("aiLoadingText");
  document.getElementById("footerText").textContent = t("footerText");
  renderFooterLegal();
  document.getElementById("customContextInput").placeholder = CONTEXT_CONFIG[useCaseKey][LANG].placeholder;
  document.getElementById("addContextBtn").textContent = t("addBtn");

  document.querySelectorAll(".lang-btn").forEach(b => b.classList.toggle("active", b.dataset.lang === LANG));
}

function setLang(lang){
  if(lang === LANG) return;
  setLangCore(lang);
  renderStaticText();
  renderSteps();
  renderContextPicker();
}

/* ================= step + option rendering ================= */
function renderSteps(){
  if(!CATALOG) return;   // עוד לא נטען מהגיליון (ראה catalog-loader.js) — הגנה מפני מרוץ עם החלפת שפה מוקדמת
  const container = document.getElementById("stepsContainer");
  container.innerHTML = STEP_ORDER.map((key, idx) => `
    <div class="panel" id="panel-${key}">
      <h3><span class="step-num">${idx+1}</span> ${localLabel(key)}</h3>
      <p class="sub" id="subtext-${key}"></p>
      <div id="body-${key}"></div>
    </div>`).join("");
  STEP_ORDER.forEach(cat => renderOptions(cat));
  updateSummary();
}

function iconFallback(el, iconKey){ el.parentElement.innerHTML = ICONS[iconKey]; }

function thumbHtml(item, cat){
  const iconKey = CATALOG[cat].icon;
  if(item.img) return `<div class="thumb"><img src="${item.img}" alt="${localName(item)}" onerror="iconFallback(this,'${iconKey}')"></div>`;
  return `<div class="thumb">${ICONS[iconKey]}</div>`;
}

function renderOptions(cat){
  const body = document.getElementById(`body-${cat}`);
  const subtext = document.getElementById(`subtext-${cat}`);
  const panel = document.getElementById(`panel-${cat}`);

  if(cat === "mobo" && !getItem("cpu")){
    panel.classList.add("locked");
    subtext.textContent = "";
    body.innerHTML = `<div class="lock-msg">${t("lockMobo")}</div>`;
    return;
  }
  panel.classList.remove("locked");

  if(cat === "mobo"){
    subtext.innerHTML = `<span class="filter-note">${tr(`מציג רק לוחות אם תואמים לסוקט ${getItem("cpu").socket}`, `Showing only motherboards compatible with socket ${getItem("cpu").socket}`)}</span>`;
  } else if(cat === "gpu"){
    subtext.textContent = getItem("cpu") ? t("gpuSubWithCpu") : t("gpuSubNoCpu");
  } else if(cat === "cooling"){
    subtext.textContent = t("coolingSub");
  } else if(cat === "psu"){
    subtext.textContent = t("psuSub");
  } else if(cat === "case"){
    subtext.textContent = t("caseSub");
  } else if(cat === "ram" || cat === "cpu"){
    subtext.textContent = t("ramCpuSub");
  } else {
    subtext.textContent = cat === "services" ? t("optional") : t("oneOption");
  }

  let items = CATALOG[cat].items.map(item => ({ item, meta: evaluateItem(cat, item) })).filter(x => !x.meta.hidden);

  if(cat === "gpu" || cat === "cooling" || cat === "psu" || cat === "mobo"){
    const rank = { recommended:0, above_need:1, works:2, not_recommended:3, null:2 };
    items.sort((a,b) => (rank[a.meta.status] ?? 2) - (rank[b.meta.status] ?? 2));
  }

  body.innerHTML = `<div class="options">${items.map(({item, meta}) => {
    const selected = selections[cat] && selections[cat].id === item.id;
    const badge = meta.status && STATUS_META[meta.status] ? `<div class="badge-tag ${STATUS_META[meta.status].cls}">${STATUS_META[meta.status].label()}</div>` : "";
    return `
    <div class="opt${selected ? " selected" : ""}" data-cat="${cat}" data-id="${item.id}" onclick="selectItem('${cat}','${item.id}')" title="${meta.reason || ""}">
      ${badge}
      ${thumbHtml(item, cat)}
      <div class="name">${localName(item)}</div>
      <div class="spec">${localSpec(item)}</div>
      ${meta.reason ? `<div class="reason">${meta.reason}</div>` : ""}
      <div class="price">${item.price === 0 ? t("included") : item.price.toLocaleString()+" ₪"}</div>
    </div>`;
  }).join("")}</div>`;
}

function selectItem(cat, id){
  const existing = selections[cat];
  selections[cat] = { id, qty: (existing && existing.id === id) ? existing.qty : 1 };
  lastChangedCat = cat;
  refreshAll();
}

function changeQty(cat, delta){
  if(!selections[cat]) return;
  const item = getItem(cat);
  const max = maxQtyFor(cat, item);
  selections[cat].qty = Math.max(1, Math.min(max, selections[cat].qty + delta));
  lastChangedCat = cat;
  refreshAll();
}

function refreshAll(){
  pruneInvalidSelections();
  STEP_ORDER.forEach(c => renderOptions(c));
  updateSummary();
  document.getElementById("aiPanel").classList.remove("show");
}

/* If an earlier change makes a currently-selected item physically incompatible
   (e.g. switching CPU socket invalidates the chosen motherboard), clear it rather
   than silently keeping a broken combination in the summary/price/diagram. Runs
   in STEP_ORDER so clearing one stale pick can correctly un-block the next check. */
function pruneInvalidSelections(){
  STEP_ORDER.forEach(cat => {
    if(!selections[cat]) return;
    const item = CATALOG[cat].items.find(i => i.id === selections[cat].id);
    if(!item || evaluateItem(cat, item).hidden) delete selections[cat];
  });
}

/* ================= summary + live build diagram ================= */
function updateSummary(){
  const list = document.getElementById("summaryList");
  let total = 0;
  list.innerHTML = STEP_ORDER.map(cat=>{
    const item = getItem(cat);
    if(!item) return `<li><span class="k">${localLabel(cat)}</span><span class="v empty">${t("notSelected")}</span></li>`;
    const qty = getQty(cat);
    total += item.price * qty;
    const max = maxQtyFor(cat, item);
    const atMax = qty >= max;
    // כונן SATA לא מוגבל בחריצי M.2 — גם ההסבר למשתמש חייב להשתנות איתו
    const storageKey = (item.driveType && item.driveType !== "nvme") ? "qtyLimitStorageSata" : "qtyLimitStorage";
    const limitKey = { ram:"qtyLimitRam", cpu:"qtyLimitCpu", storage:storageKey }[cat];
    // תקרת SATA לא תלויה בלוח האם, ולכן ההסבר שלה תקף גם לפני שנבחר לוח
    const limitText = (getItem("mobo") || storageKey === "qtyLimitStorageSata" && cat === "storage")
      ? t(limitKey) : t("qtyLimitDefault");
    const limitNote = (atMax && QTY_CATEGORIES.includes(cat)) ? `<div class="qty-limit-note">${limitText}</div>` : "";
    const qtyControls = QTY_CATEGORIES.includes(cat) ? `
      <span class="qty-ctrl">
        <button onclick="changeQty('${cat}',-1)" ${qty<=1?"disabled":""}>−</button>
        <span>${qty}</span>
        <button onclick="changeQty('${cat}',1)" ${atMax?"disabled":""} title="${atMax ? limitText : ""}">+</button>
      </span>${limitNote}` : "";
    return `<li><span class="k">${localLabel(cat)}</span><span class="v">${localName(item)}${qty>1?` × ${qty}`:""}${qtyControls}</span></li>`;
  }).join("");
  const newTotal = total.toLocaleString() + " ₪";
  document.getElementById("totalPrice").textContent = newTotal;
  const totalRow = document.querySelector(".total-row");
  if(lastTotal !== null && lastTotal !== newTotal){
    totalRow.classList.remove("price-bump");
    void totalRow.offsetWidth;
    totalRow.classList.add("price-bump");
  }
  lastTotal = newTotal;
  renderCaseDiagram();
  renderValidation();
}

const PC_VISUAL_PARTS = [
  { cat:"mobo", cls:"pc-mobo", calTop:45 },
  { cat:"cpu", cls:"pc-cpu", calTop:103 },
  { cat:"cooling", cls:"pc-cooling", calTop:161 },
  { cat:"ram", cls:"pc-ram", calTop:219 },
  { cat:"gpu", cls:"pc-gpu", calTop:277, emphasize:true },
  { cat:"storage", cls:"pc-storage", calTop:335 },
  { cat:"psu", cls:"pc-psu", calTop:393 }
];

function renderCaseDiagram(){
  const stage = document.getElementById("pcStage");
  const caseItem = getItem("case");
  const caseStyleClass = "style-" + (caseItem ? caseItem.id : "glass");
  const anySelected = PC_VISUAL_PARTS.some(p => getItem(p.cat));
  const poweredOn = !!(getItem("mobo") && getItem("cpu"));

  const partsHtml = PC_VISUAL_PARTS.map(p => {
    if(!getItem(p.cat)) return "";
    const justFilled = p.cat === lastChangedCat ? " just-filled" : "";
    return `<div class="pc-part ${p.cls}${justFilled}"></div>`;
  }).join("");

  const calloutsHtml = PC_VISUAL_PARTS.map(p => {
    const item = getItem(p.cat);
    if(!item) return "";
    const qty = getQty(p.cat);
    const justFilled = p.cat === lastChangedCat ? " just-filled" : "";
    return `
      <div class="pc-callout${p.emphasize ? " pc-callout-emph" : ""}${justFilled}" style="top:${p.calTop}px">
        <div class="pc-callout-cat">${localLabel(p.cat)}</div>
        <div class="pc-callout-name">${localName(item)}${qty>1?` ×${qty}`:""}</div>
      </div>`;
  }).join("");

  stage.innerHTML = `
    <div class="pc-case ${caseStyleClass}">
      <div class="pc-shell">
        <div class="pc-border"></div>
        <div class="pc-shine"></div>
        <div class="pc-vent pc-vent-top"></div>
        <div class="pc-vent pc-vent-bottom"></div>
        <div class="pc-io"><span class="pc-io-dot"></span><span class="pc-io-usb"></span><span class="pc-io-usb"></span><span class="pc-io-jack"></span></div>
        <div class="pc-brand-label">CUSTOM PC · ATX Tower</div>
        <div class="pc-brand-plate">CUSTOM PC BUILDER</div>
        <div class="pc-led${anySelected ? " on" : ""}"></div>
        <div class="pc-foot pc-foot-l"></div>
        <div class="pc-foot pc-foot-r"></div>
      </div>
      ${!anySelected ? `<div class="pc-empty-hint"><span class="pc-empty-hint-text">${t("pcVisualEmptyHint")}</span></div>` : ""}
      ${partsHtml}
      ${poweredOn ? `<div class="pc-glow-bar"></div>` : ""}
    </div>
    <div class="pc-callouts">${calloutsHtml}</div>
  `;
  lastChangedCat = null;
}

function renderValidation(){
  document.getElementById("validationMsg").innerHTML = missingRequired().length
    ? `<div class="validation-msg">${t("validationPrefix")} ${missingRequired().join(", ")}.</div>` : "";
}
function missingRequired(){ return REQUIRED_CATEGORIES.filter(cat => !selections[cat]).map(cat => localLabel(cat)); }

/* ================= WhatsApp ================= */
const WHATSAPP_NUMBER = "972502000373";

function sendWhatsApp(){
  if(missingRequired().length){ renderValidation(); return; }
  const total = document.getElementById("totalPrice").textContent;
  let msg = tr("היי דביר, אשמח להזמין את ההרכבה הבאה מ-DvirTech:\n\n", "Hi Dvir, I'd like to order the following build from DvirTech:\n\n");
  STEP_ORDER.forEach(cat=>{
    const item = getItem(cat);
    if(item && item.id !== "none"){
      const qty = getQty(cat);
      msg += `• ${localLabel(cat)}: ${localName(item)}${qty>1?` ×${qty}`:""}\n`;
    }
  });
  const contextItems = [...selectedContext, ...customContext];
  msg += tr(`\nסה"כ: ${total}\nמטרת שימוש: ${USE_CASE_LABELS[useCaseKey][LANG]}`, `\nTotal: ${total}\nMain use: ${USE_CASE_LABELS[useCaseKey][LANG]}`);
  if(useCaseKey === "gaming") msg += tr(`\nרזולוציה מבוקשת: ${document.getElementById("resolution").value}`, `\nRequested resolution: ${document.getElementById("resolution").value}`);
  if(contextItems.length) msg += tr(`\nפירוט נוסף: ${contextItems.join(", ")}`, `\nAdditional details: ${contextItems.join(", ")}`);
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
}

/* ================= usage-context picker ================= */
let selectedContext = new Set();
let customContext = [];

function renderContextPicker(){
  const cfg = CONTEXT_CONFIG[useCaseKey][LANG];
  document.getElementById("contextLabel").textContent = cfg.label;
  document.getElementById("customContextInput").placeholder = cfg.placeholder;
  document.getElementById("resolutionField").style.display = CONTEXT_CONFIG[useCaseKey].showResolution ? "block" : "none";
  document.getElementById("popularOptions").innerHTML = cfg.options.map(o =>
    `<span class="pick-chip${selectedContext.has(o)?" active":""}" onclick="toggleContext('${o.replace(/'/g,"\\'")}')">${o}</span>`).join("");
  document.getElementById("customContextRow").innerHTML = customContext.map(o =>
    `<span class="pick-chip custom active">${o} <span class="x" onclick="removeCustomContext('${o.replace(/'/g,"\\'")}')">✕</span></span>`).join("");
}
function onUseCaseChange(){
  useCaseKey = document.getElementById("useCase").value;
  selectedContext = new Set();
  customContext = [];
  renderContextPicker();
  document.getElementById("aiPanel").classList.remove("show");
}
function toggleContext(o){
  if(selectedContext.has(o)) selectedContext.delete(o);
  else if(selectedContext.size + customContext.length < 6) selectedContext.add(o);
  renderContextPicker();
}
function addCustomContext(){
  const input = document.getElementById("customContextInput");
  const val = input.value.trim();
  if(val && customContext.length + selectedContext.size < 6 && !customContext.includes(val)){
    customContext.push(val); input.value = ""; renderContextPicker();
  }
}
function removeCustomContext(o){ customContext = customContext.filter(x => x !== o); renderContextPicker(); }

/* ================= AI analysis ================= */
async function analyzeWithAI(){
  if(missingRequired().length){ renderValidation(); return; }

  const btn = document.getElementById("analyzeBtn");
  const panel = document.getElementById("aiPanel");
  const loading = document.getElementById("aiLoading");
  const content = document.getElementById("aiContent");
  panel.classList.add("show");
  loading.style.display = "flex";
  content.innerHTML = "";
  btn.disabled = true;

  const isGaming = useCaseKey === "gaming";
  const resolution = document.getElementById("resolution").value;
  const contextItems = [...selectedContext, ...customContext];
  const useCaseLabelHe = USE_CASE_LABELS[useCaseKey].he; // internal prompt is always composed in Hebrew for consistency; response language is requested explicitly below

  const partsText = STEP_ORDER.filter(c => getItem(c) && getItem(c).id !== "none")
    .map(c => `${CATALOG[c].label}: ${getItem(c).name}${getQty(c)>1?` ×${getQty(c)}`:""}`).join(", ");

  let contextText;
  if(isGaming){
    contextText = contextItems.length
      ? `בדוק אך ורק את המשחקים הבאים ברזולוציית ${resolution}: ${contextItems.join(", ")}.`
      : `בחר בעצמך 4 משחקים פופולריים רלוונטיים וספק הערכת FPS ברזולוציית ${resolution}.`;
  } else if(contextItems.length){
    contextText = `פירוט שימוש שסיפק הלקוח: ${contextItems.join(", ")}. התייחס לכך בסיכום. אין צורך בהערכת FPS — החזר מערך fps ריק.`;
  } else {
    contextText = `הלקוח לא סיפק פירוט שימוש נוסף. אין צורך בהערכת FPS — החזר מערך fps ריק.`;
  }

  const specText = `רכיבי המחשב: ${partsText}. מטרת שימוש עיקרית: ${useCaseLabelHe}.\n${contextText}`;
  const languageInstruction = LANG === "en"
    ? "IMPORTANT: Write the summary text in natural, professional English (the customer's site is set to English)."
    : "חשוב: כתוב את הסיכום בעברית טבעית ומקצועית.";

  const systemPrompt = `אתה עוזר טכני חם ואדיב של חנות מחשבים בישראל בשם DvirTech.
${isGaming ? "בצע חיפוש קצר באינטרנט כדי לאמוד ביצועי FPS ריאליים עבור הרכיבים שצוינו, ברזולוציה ובהגדרות גבוהות, עבור *בדיוק* המשחקים שהתבקשת (או שבחרת אם לא צוינו). אם אין כרטיס מסך נפרד, ציין FPS נמוך משמעותית." : "אין צורך בחיפוש FPS — התמקד בסיכום מילולי איכותי שמסביר האם ולמה ההרכבה מתאימה לשימושים שצוינו."}
${languageInstruction}
בסיום, החזר אך ורק אובייקט JSON יחיד, ללא הקדמה, ללא markdown, ללא גדרות קוד, בפורמט המדויק:
{"summary": "2-3 משפטים קצרים, בגובה עיניים וחיוביים, שמסבירים למה ההרכבה מתאימה (או לא) למטרת השימוש והפירוט שצוין — בשפה שצוינה למעלה", "fps": [{"game": "שם", "fps": מספר}]}
אם אין רלוונטיות ל-FPS, החזר "fps": [].`;

  try{
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: specText }],
        tools: isGaming ? [{ type: "web_search_20250305", name: "web_search" }] : []
      })
    });
    const data = await response.json();
    const textBlocks = (data.content || []).filter(b => b.type === "text").map(b => b.text);
    let raw = textBlocks.join("\n").trim().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}")+1));
    renderAIResult(parsed, resolution);
  } catch(err){
    content.innerHTML = `<div class="ai-summary ai-error">${t("aiErrorMsg")}</div>`;
    console.error("AI analysis error:", err);
  } finally {
    loading.style.display = "none";
    btn.disabled = false;
  }
}

function renderAIResult(parsed, resolution){
  const content = document.getElementById("aiContent");
  let fpsHtml = "";
  if(parsed.fps && parsed.fps.length){
    const maxFps = Math.max(...parsed.fps.map(f=>f.fps), 60);
    fpsHtml = `
      <div style="font-size:13px;font-weight:700;margin-bottom:8px;color:var(--ink-soft)">${t("fpsHeading")} (${resolution}, ${t("highSettings")})</div>
      ${parsed.fps.map(f=>`
        <div class="fps-row">
          <div class="fps-label"><span>${f.game}</span><span>${f.fps} FPS</span></div>
          <div class="fps-track"><div class="fps-fill" style="width:${Math.min(100,(f.fps/maxFps)*100)}%"></div></div>
        </div>`).join("")}
      <div class="fps-note">${t("fpsNote")}</div>`;
  }
  content.innerHTML = `<div class="ai-summary">🧠 ${parsed.summary}</div>${fpsHtml}`;
}

/* אין קריאת init כאן — catalog-loader.js קורא ל-renderStaticText/renderSteps/
   renderContextPicker אחרי ש-CATALOG נטען בפועל מהגיליון (ראה הערה למעלה). */

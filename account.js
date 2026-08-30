/* =====================================================================
   DvirTech — האזור האישי (account.js)
   =====================================================================
   שלושה מצבים: טלפון → קוד → דשבורד. הצד השרתי והאבטחה —
   4-payment-api.gs (acctOtpRequest, acctOtpVerify, acctData, acctUpdate).

   🔴 **מה נשמר בדפדפן ומה לא:**
     • `dvt_acct_token` — הטוקן החתום (30 יום). בלעדיו אין גישה.
     • `dvt_acct_plan`  — {plan, pct, exp} בלבד — כדי שעמוד השירותים
       יציג "המחיר שלך" בלי בקשת רשת. **תצוגה בלבד**: החיוב האמיתי
       נעשה מול דביר, ששולף את המנוי מהגיליון — לא מהדפדפן.
     • שום פרט אישי אחר לא נשמר מקומית.
   ⚠️ טוקן שפג (תשובת "expired") מוחזר למסך הכניסה בשקט — בלי
   הודעת שגיאה מפחידה על משהו שהוא פשוט עבר-זמנו.
===================================================================== */

const ACCT_API = (typeof DVT_API_URL === "string" && DVT_API_URL) || "";
const ACCT_TOKEN_KEY = "dvt_acct_token";
const ACCT_PLAN_KEY  = "dvt_acct_plan";
/* פרופיל תצוגה להדר ולקופה: {name, phone, email, plan, pct, exp}.
   נשמר רק אחרי כניסה מאומתת, נמחק בהתנתקות/מחיקה. תצוגה בלבד. */
const ACCT_PROFILE_KEY = "dvt_acct_profile";

let acctPhone = "";
let acctData_ = null;

function acctT(he, en){ return (typeof tr === "function") ? tr(he, en) : he; }

function acctToken(){
  try { return localStorage.getItem(ACCT_TOKEN_KEY) || ""; } catch(e){ return ""; }
}

async function acctApi(action, payload){
  const res = await fetch(ACCT_API, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(Object.assign({ action: action }, payload || {}))
  });
  return res.json();
}

/* ---------- מעברי מסך ---------- */
function acctShow(id){
  ["acctLogin", "acctCode", "acctDash"].forEach(s => {
    const el = document.getElementById(s);
    if(el) el.hidden = s !== id;
  });
}

function acctMsg(id, text, good){
  const el = document.getElementById(id);
  if(!el) return;
  el.style.display = text ? "block" : "none";
  el.textContent = text || "";
  el.classList.toggle("is-good", !!good);
}

/* ---------- שלב 1: שליחת קוד ---------- */
async function acctSendCode(){
  const phone = document.getElementById("acctPhone").value.replace(/[^0-9]/g, "");
  if(!/^0\d{8,9}$/.test(phone)){
    acctMsg("acctLoginMsg", acctT("מספר טלפון לא תקין", "Invalid phone number"));
    return;
  }
  acctMsg("acctLoginMsg", "");
  const btn = document.getElementById("acctSendBtn");
  btn.disabled = true;
  btn.textContent = acctT("שולחים קוד…", "Sending code…");
  try{
    const d = await acctApi("acctOtpRequest", { phone: phone });
    if(!d.ok){
      acctMsg("acctLoginMsg", d.error || acctT("משהו השתבש — נסו שוב", "Something went wrong — try again"));
      return;
    }
    /* 🔴 תשובה מפורשת — החלטת דביר (27.08): מספר שלא נמצא נשאר
       במסך הטלפון עם הסבר, במקום לשלוח את הלקוח לחכות למייל שלא
       יגיע. ההשלכה (אפשר לגלות שטלפון הוא לקוח) התקבלה במודע —
       ראה ההערה בצד השרת. */
    if(!d.sent){
      acctMsg("acctLoginMsg", d.note || acctT("המספר לא נמצא במערכת", "This number is not in our system"));
      return;
    }
    acctPhone = phone;
    document.getElementById("acctCodeLead").textContent =
      acctT("✓ נמצאת במערכת! שלחנו קוד בן 6 ספרות אל " + (d.emailMask || "המייל הרשום") + ". הקוד תקף ל-10 דקות.",
            "✓ Found you! We sent a 6-digit code to " + (d.emailMask || "your email on file") + ". Valid for 10 minutes.");
    acctShow("acctCode");
    const ci = document.getElementById("acctCodeInput");
    ci.value = ""; ci.focus();
  }catch(e){
    acctMsg("acctLoginMsg", acctT("אין חיבור — נסו שוב", "No connection — try again"));
  }finally{
    btn.disabled = false;
    btn.textContent = acctT("שלחו לי קוד", "Send me a code");
  }
}

/* ---------- שלב 2: אימות ---------- */
async function acctVerify(){
  const code = document.getElementById("acctCodeInput").value.trim();
  if(!/^\d{6}$/.test(code)){
    acctMsg("acctCodeMsg", acctT("הקוד הוא 6 ספרות", "The code is 6 digits"));
    return;
  }
  acctMsg("acctCodeMsg", "");
  const btn = document.getElementById("acctVerifyBtn");
  btn.disabled = true;
  btn.textContent = acctT("מאמתים…", "Verifying…");
  try{
    const d = await acctApi("acctOtpVerify", { phone: acctPhone, code: code });
    if(!d.ok){
      acctMsg("acctCodeMsg", d.error || acctT("קוד שגוי", "Wrong code"));
      return;
    }
    try{ localStorage.setItem(ACCT_TOKEN_KEY, d.token); }catch(e){}
    acctApply(d);
  }catch(e){
    acctMsg("acctCodeMsg", acctT("אין חיבור — נסו שוב", "No connection — try again"));
  }finally{
    btn.disabled = false;
    btn.textContent = acctT("כניסה", "Sign in");
  }
}

function acctBackToPhone(){ acctShow("acctLogin"); }

function acctLogout(){
  try{
    localStorage.removeItem(ACCT_TOKEN_KEY);
    localStorage.removeItem(ACCT_PLAN_KEY);
    localStorage.removeItem(ACCT_PROFILE_KEY);
    sessionStorage.removeItem("dvtCartPulled");
  }catch(e){}
  acctData_ = null;
  acctShow("acctLogin");
  if(typeof shAcctRender === "function") shAcctRender();
}

/* ---------- הדשבורד ---------- */
function acctApply(d){
  acctData_ = d;

  /* המנוי — לשימוש עמוד השירותים ("המחיר שלך"). תצוגה בלבד. */
  try{
    if(d.sub && d.planDiscountPct > 0){
      localStorage.setItem(ACCT_PLAN_KEY, JSON.stringify({
        plan: d.sub.plan, pct: d.planDiscountPct, exp: Date.now() + 7 * 86400000
      }));
    }else{
      localStorage.removeItem(ACCT_PLAN_KEY);
    }
    /* הפרופיל — להדר ("שלום דביר · PLUS") ולהשלמת הפרטים בקופה. */
    localStorage.setItem(ACCT_PROFILE_KEY, JSON.stringify({
      name: (d.profile && d.profile.name) || "",
      phone: (d.profile && d.profile.phone) || "",
      email: (d.profile && d.profile.email) || "",
      plan: d.sub ? d.sub.plan : "", pct: d.planDiscountPct || 0,
      /* 🔎 הזכאות — כדי שעמוד השירותים יציג "המחיר שלך" בלי בקשת
         רשת (supMe_/supEffective_). ⚠️ תצוגה בלבד: השרת מתמחר
         מחדש בקופה, ודביר גובה שירות ידנית מול הגיליון. */
      eligible: !!d.eligible, buy12: d.buy12 || 0, eligMin: d.eligMin || 3000,
      exp: Date.now() + 7 * 86400000
    }));
  }catch(e){}
  if(typeof shAcctRender === "function") shAcctRender();
  if(typeof dvtCartPullOnce_ === "function") dvtCartPullOnce_();

  const esc = (typeof escHtml === "function") ? escHtml : function(s){ return String(s); };
  const p = d.profile || {};

  /* --- פרופיל --- */
  document.getElementById("acctProfileCard").innerHTML =
    `<h2>${acctT("שלום, ", "Hello, ")}${esc((p.name || "").split(" ")[0] || p.name)} 👋</h2>
     <p class="acct-row"><span>${acctT("טלפון", "Phone")}</span><b dir="ltr">${esc(p.phone)}</b></p>
     <p class="acct-row"><span>${acctT("מייל", "Email")}</span><b dir="ltr">${esc(p.email || "—")}</b></p>
     <p class="acct-row"><span>${acctT("כתובת", "Address")}</span><b>${esc(p.address || "—")}</b></p>
     <p class="acct-badge ${d.eligible ? "is-on" : ""}">${d.eligible
        ? acctT("✅ לקוח DvirTech — מחיר מועדף על כל השירותים", "✅ DvirTech customer — preferred pricing on all services")
        : acctT("למחיר לקוחות DvirTech: מחשב שלם, או מנוי Care, או קניית מוצרים ב-" +
                  (d.eligMin || 3000).toLocaleString() + " ₪ בשנה (צברת עד כה " + (d.buy12 || 0).toLocaleString() + " ₪)",
                "DvirTech pricing unlocks with a full PC, a Care plan, or " +
                  (d.eligMin || 3000).toLocaleString() + " ₪/year in product purchases (you're at " + (d.buy12 || 0).toLocaleString() + " ₪)")}</p>`;

  /* --- מנוי --- */
  const sub = d.sub;
  document.getElementById("acctSubCard").innerHTML = sub
    ? `<h2>🛡️ DvirTech Care — ${esc(sub.plan)}</h2>
       <p class="acct-row"><span>${acctT("בתוקף עד", "Valid until")}</span><b>${esc(sub.until)}</b></p>
       ${sub.hoursLeft != null ? `<p class="acct-row"><span>${acctT("שעות תמיכה ביתרה", "Support hours left")}</span><b>${sub.hoursLeft}</b></p>` : ""}
       ${sub.checksLeft != null ? `<p class="acct-row"><span>${acctT("בדיקות תחזוקה ביתרה", "Maintenance checks left")}</span><b>${sub.checksLeft}</b></p>` : ""}
       <p class="acct-note">${acctT("ההנחה שלך (" + d.planDiscountPct + "%) מוצגת אוטומטית בעמוד השירותים.",
                                    "Your discount (" + d.planDiscountPct + "%) shows automatically on the services page.")}</p>`
    : `<h2>🛡️ DvirTech Care</h2>
       <p class="acct-note">${acctT("אין מנוי פעיל. מנוי Care נותן תמיכה שוטפת, בדיקות תחזוקה והנחה על כל עבודה.",
                                    "No active plan. A Care plan gives ongoing support, maintenance checks and a discount on all labour.")}</p>
       <a class="btn btn-secondary" href="support.html#care">${acctT("למסלולי Care", "See Care plans")}</a>`;

  /* --- הזמנות --- */
  const orders = d.orders || [];
  document.getElementById("acctOrdersCard").innerHTML =
    `<h2>📦 ${acctT("ההזמנות שלי", "My orders")}</h2>` +
    (orders.length
      ? `<div class="acct-orders">` + orders.map(o => `
          <div class="acct-order">
            <div class="acct-order-h">
              <b>${esc(o.id)}</b><span>${esc(o.date)}</span>
              <b class="acct-order-amt">${(Number(o.amount) || 0).toLocaleString()} ₪</b>
            </div>
            <div class="acct-order-d">${esc(o.desc)}</div>
            <div class="acct-order-f">
              <span class="acct-order-st">${esc(o.status)}</span>
              ${o.track ? `<a href="${esc(o.track)}" target="_blank" rel="noopener">${acctT("מעקב הזמנה ←", "Track order →")}</a>` : ""}
            </div>
          </div>`).join("") + `</div>`
      : `<p class="acct-note">${acctT("עוד אין הזמנות. הקנייה הראשונה שלך תופיע כאן.", "No orders yet — your first purchase will show here.")}</p>`);

  /* --- מימושי המנוי — "לאן הלכו השעות" (מקושר לכרטיס הלקוח) --- */
  const red = d.redemptions || [];
  const redCard = document.getElementById("acctRedeemCard");
  if(redCard){
    redCard.hidden = !(d.sub || red.length);
    redCard.innerHTML =
      `<h2>⏱️ ${acctT("מה נוצל מהמנוי","What your plan covered")}</h2>` +
      (red.length
        ? red.map(x => `<p class="acct-row"><span>${esc(x.date)} · ${esc(x.kind)}${
            x.what ? " — " + esc(x.what) : ""}</span><b>${esc(x.used)}${
            x.left ? " · " + acctT("נותרו ","left ") + esc(x.left) : ""}</b></p>`).join("")
        : `<p class="acct-note">${acctT("עוד לא נוצל כלום מהמכסה שלך — הכל זמין.",
                                        "Nothing has been used from your allowance yet — it is all available.")}</p>`);
  }

  /* --- ציוד באחריות --- */
  const eq = d.equipment || [];
  document.getElementById("acctEquipCard").innerHTML =
    `<h2>🛡️ ${acctT("ציוד באחריות", "Equipment under warranty")}</h2>` +
    (eq.length
      ? eq.map(x => `<p class="acct-row"><span>${esc(x.product)}</span><b>${
          x.days != null && x.days >= 0 ? acctT("עד " + x.until, "until " + x.until)
          : x.days != null              ? acctT("הסתיימה", "expired")
          : acctT("לפי היבואן", "per importer")}</b></p>`).join("")
      : `<p class="acct-note">${acctT("כשנרשום עבורך ציוד — תראה כאן בדיוק מתי כל אחריות נגמרת.",
                                      "When equipment is registered for you, you'll see exactly when each warranty ends.")}</p>`);

  /* --- הגדרות --- */
  document.getElementById("acctSettingsCard").innerHTML =
    `<h2>⚙️ ${acctT("עדכון פרטים", "Update details")}</h2>
     <label class="field-label">${acctT("מייל", "Email")}</label>
     <input id="acctSetEmail" type="email" dir="ltr" value="${esc(p.email || "")}">
     <label class="field-label">${acctT("כתובת למשלוחים", "Shipping address")}</label>
     <input id="acctSetAddr" type="text" value="${esc(p.address || "")}">
     <div class="validation-msg" id="acctSetMsg" style="display:none"></div>
     <button class="btn btn-primary" onclick="acctSave()">${acctT("שמירה", "Save")}</button>
     <p class="acct-note">${acctT("שינוי טלפון או שם — רק מולי, בוואטסאפ 050-200-0373. הטלפון הוא המפתח לחשבון, ולכן הוא לא משתנה מהאתר.",
                                  "Changing your phone or name — with me directly, WhatsApp 050-200-0373. The phone is the account key, so it can't change from the site.")}</p>
     <div class="acct-danger">
       <button class="acct-danger-link" onclick="acctDeleteStart()">${acctT("מחיקת חשבון", "Delete account")}</button>
       <span>${acctT("— מוחקת את פרטי הקשר שלך לצמיתות. רישומי עסקאות וקבלות נשמרים כנדרש בחוק (7 שנים).",
                     "— permanently deletes your contact details. Transaction records and receipts are kept as the law requires (7 years).")}</span>
     </div>`;

  acctShow("acctDash");
}

async function acctSave(){
  const email = document.getElementById("acctSetEmail").value.trim();
  const address = document.getElementById("acctSetAddr").value.trim();
  acctMsg("acctSetMsg", "");
  try{
    const d = await acctApi("acctUpdate", { token: acctToken(), email: email, address: address });
    if(!d.ok){
      if(d.error === "expired") return acctSessionExpired();
      acctMsg("acctSetMsg", d.error || acctT("השמירה נכשלה", "Save failed"));
      return;
    }
    if(acctData_ && acctData_.profile){
      acctData_.profile.email = email || acctData_.profile.email;
      acctData_.profile.address = address || acctData_.profile.address;
    }
    /* 🔴 משוב מיידי — דביר: "הכפתור עובד אבל לא אומר כלום, נראה
       תקוע." קודם רואים ✓ ירוק, הרינדור המלא מגיע אחרי שנייה. */
    const sb = document.querySelector("#acctSettingsCard .btn-primary");
    if(sb){ sb.textContent = acctT("✓ נשמר!", "✓ Saved!"); sb.classList.add("is-saved"); }
    acctMsg("acctSetMsg", acctT("✓ הפרטים נשמרו", "✓ Details saved"), true);
    setTimeout(function(){ if(acctData_) acctApply(acctData_); }, 1200);
  }catch(e){
    acctMsg("acctSetMsg", acctT("אין חיבור — נסו שוב", "No connection — try again"));
  }
}

/* ---------- מחיקת חשבון (תיקון 13) — שני אישורים, בלתי הפיך ---------- */
async function acctDeleteStart(){
  const a = confirm(acctT(
    "למחוק את החשבון?\n\nיימחקו לצמיתות: שם, טלפון, מייל, כתובת והערות.\n" +
    "יישמרו כנדרש בחוק: רישומי עסקאות וקבלות (7 שנים).\n\nאי אפשר לבטל את הפעולה.",
    "Delete the account?\n\nPermanently deleted: name, phone, email, address, notes.\n" +
    "Kept as required by law: transaction records and receipts (7 years).\n\nThis cannot be undone."));
  if(!a) return;
  const b = prompt(acctT('לאישור סופי — הקלידו: מחק', 'To confirm, type: DELETE'));
  if(b === null) return;
  const okWord = String(b).trim();
  if(okWord !== "מחק" && okWord.toUpperCase() !== "DELETE"){
    alert(acctT("לא אושר — החשבון לא נמחק.", "Not confirmed — the account was not deleted."));
    return;
  }
  try{
    const d = await acctApi("acctDelete", { token: acctToken() });
    if(!d.ok){
      if(d.error === "expired") return acctSessionExpired();
      alert(d.error || acctT("המחיקה נכשלה — דברו איתנו בוואטסאפ", "Deletion failed — WhatsApp us"));
      return;
    }
    try{
      localStorage.removeItem(ACCT_TOKEN_KEY);
      localStorage.removeItem(ACCT_PLAN_KEY);
      localStorage.removeItem(ACCT_PROFILE_KEY);
    }catch(e){}
    acctData_ = null;
    if(typeof shAcctRender === "function") shAcctRender();
    acctShow("acctLogin");
    acctMsg("acctLoginMsg", acctT("החשבון נמחק. רישומי העסקאות נשמרו כנדרש בחוק. תודה שהיית איתנו 💙",
                                  "Account deleted. Transaction records kept as required by law. Thanks for being with us 💙"), true);
  }catch(e){
    alert(acctT("אין חיבור — נסו שוב", "No connection — try again"));
  }
}

function acctSessionExpired(){
  try{ localStorage.removeItem(ACCT_TOKEN_KEY); }catch(e){}
  acctShow("acctLogin");
  acctMsg("acctLoginMsg", acctT("החיבור פג — נכנסים שוב עם קוד חדש", "Session expired — sign in again with a new code"));
}

/* ---------- טקסטים קבועים + אתחול ---------- */
function acctRenderStatic(){
  document.getElementById("acctTitle").textContent = acctT("האזור האישי", "My account");
  document.getElementById("acctLoginLead").textContent =
    acctT("נכנסים עם קוד חד-פעמי שנשלח למייל — בלי סיסמאות, בלי מה לשכוח.",
          "Sign in with a one-time code sent to your email — no passwords, nothing to forget.");
  document.getElementById("acctPhoneLabel").textContent = acctT("הטלפון שאיתו קניתם", "The phone you ordered with");
  document.getElementById("acctSendBtn").textContent = acctT("שלחו לי קוד", "Send me a code");
  document.getElementById("acctLoginNote").textContent =
    acctT("עוד לא קניתם אצלנו? החשבון נוצר אוטומטית בקנייה הראשונה.",
          "Haven't bought from us yet? Your account is created automatically with your first purchase.");
  document.getElementById("acctCodeLabel").textContent = acctT("הקוד מהמייל", "The code from the email");
  document.getElementById("acctVerifyBtn").textContent = acctT("כניסה", "Sign in");
  document.getElementById("acctBackBtn").textContent = acctT("→ מספר אחר", "→ Different number");
  document.getElementById("acctLogoutBtn").textContent = acctT("התנתקות", "Sign out");
}

async function acctInit(){
  acctRenderStatic();
  const tok = acctToken();
  if(tok){
    acctShow("acctDash");   /* שלד מיידי; הנתונים נטענים */
    document.getElementById("acctProfileCard").innerHTML =
      "<h2>" + acctT("טוען…", "Loading…") + "</h2>";
    try{
      const d = await acctApi("acctData", { token: tok });
      if(d.ok) return acctApply(d);
      if(d.error === "expired") return acctSessionExpired();
    }catch(e){ /* ננסה כניסה רגילה */ }
  }
  acctShow("acctLogin");
}

/* Enter מפעיל את הפעולה של המסך הנוכחי. */
document.addEventListener("keydown", function(e){
  if(e.key !== "Enter") return;
  if(!document.getElementById("acctLogin").hidden) acctSendCode();
  else if(!document.getElementById("acctCode").hidden) acctVerify();
});

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", acctInit);
}else{
  acctInit();
}

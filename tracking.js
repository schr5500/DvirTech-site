/* =====================================================================
   DvirTech — מעקב הזמנה (tracking.js)
   =====================================================================
   קורא טוקן אטום מה-URL (‎?order=<טוקן>), מבקש מהשרת את סטטוס ההזמנה,
   ומרנדר סרגל שלבים + צפי הגעה. מקור האמת: גיליון ה-CRM.

   חוזה השרת (4-payment-api.gs, action=getOrderStatus — ייבנה בשלב הבא):
     GET {API}?action=getOrderStatus&token=<טוקן>
     → { ok:true, orderNo:"DVT-1042", placedAt:"2026-08-17",
         status:2,               // 1..5, השלב הקנוני הנוכחי
         hasAssembly:true,       // כולל הרכבה? קובע אם שלב 3 מוצג + ה-ETA
         etaText:"2–5 ימי עסקים",
         careTier:"PRO",         // "" אם לא מנוי
         items:[{name,qty},…],
         trackingNumber:"", trackingUrl:"" }   // מתמלאים כששולח (שלב ≥4)
     → { ok:false } / טוקן שגוי  → מצב "לא מצאנו".

   ⚠️ המחיר/סכום לא מוצג כאן וזה בכוונה — זה דף מעקב, לא קבלה. עוסק
   פטור: שום אזכור מע"מ בשום מצב.
   ⚠️ הטוקן אטום ואקראי; אסור להחליף למספר הזמנה רץ (חשיפת הזמנות זרות).
===================================================================== */

var TRK_WA = "972502000373";   // וואטסאפ של דביר (כמו בשאר האתר)

/* חמשת השלבים — הניסוח אושר ע"י דביר. "בהכנה" (שלב 2) הוא מטריה
   ניטרלית שמכסה גם הזמנה מהספק וגם הכנה פנימית, בלי לחשוף וקבלי לשקר.
   assemblyOnly:true → השלב מוצג רק כשההזמנה כוללת הרכבה. */
var TRK_STAGES = [
  { n:1, name:"ממתין לאישור תשלום", desc:"מוודאים שהתשלום נקלט. זה עשוי לקחת עד יום עסקים אחד." },
  { n:2, name:"בהכנה",              desc:"ההזמנה שלך בהכנה אצלנו." },
  { n:3, name:"בהרכבה ובדיקות",     desc:"המחשב מורכב ועובר בדיקות תקינות לפני יציאה.", assemblyOnly:true },
  { n:4, name:"בדרך אליך",          desc:"ההזמנה יצאה ונמצאת בדרך אליך." },
  { n:5, name:"נמסר",               desc:"ההזמנה נמסרה. תודה שקנית ב-DvirTech!" }
];

/* דמו לעיצוב/בדיקה בלבד — עד שנקודת הקצה בשרת מוכנה. הטוקנים "demo"
   ו-"demo-parts" מציגים הזמנות לדוגמה כדי לראות את הדף מרונדר. */
var TRK_DEMO = {
  "demo": { ok:true, orderNo:"DVT-1042", placedAt:"2026-08-17", status:3,
    hasAssembly:true, etaText:"2–5 ימי עסקים", careTier:"PRO",
    items:[{name:"מחשב גיימינג מותאם אישית",qty:1},{name:"מסך 27\" 165Hz",qty:1},{name:"הרכבה ובדיקות",qty:1}],
    trackingNumber:"", trackingUrl:"" },
  "demo-parts": { ok:true, orderNo:"DVT-1043", placedAt:"2026-08-17", status:4,
    hasAssembly:false, etaText:"1–3 ימי עסקים", careTier:"",
    items:[{name:"כרטיס מסך RTX",qty:1},{name:"זיכרון RAM 32GB",qty:2}],
    trackingNumber:"ZZ-7781200", trackingUrl:"https://www.zigzag.co.il/tracking/ZZ-7781200" }
};

function trkToken(){ return new URLSearchParams(location.search).get("order") || ""; }

function trkWaHref(){
  var msg = "היי דביר, יש לי שאלה על הזמנה" + (trkToken() ? " (" + trkToken() + ")" : "");
  return "https://wa.me/" + TRK_WA + "?text=" + encodeURIComponent(msg);
}

function trkShow(id){
  ["trkLoading","trkEmpty","trkOrder"].forEach(function(x){
    var el = document.getElementById(x); if(el) el.style.display = (x === id ? "" : "none");
  });
}

/* 🔴 **נוסף 23.08 — כניסה לפי קוד ולא רק לפי קישור.**
   דביר: "דף המעקב באתר יכלול שורה שאפשר להכניס לשם את מספר המעקב".
   ⚠️ עד עכשיו הדף היה שמיש **רק** דרך קישור עם טוקן; מי שהגיע אליו
   ישירות ראה "לא מצאנו את ההזמנה" בלי שום דרך להתקדם.

   ⚠️ המקפים נשארים ב-URL ובשדה — השרת מסיר אותם (`normTrackCode_`).
   ⚠️ **בלי `toLowerCase`**: הקוד הוא base64 web-safe ורגיש לרישיות. */
function trkLookup(token, onFail){
  TRK_LAST_CODE = token;
  if(TRK_DEMO[token]){ trkRender(TRK_DEMO[token]); return; }

  var api = (typeof DVT_API_URL === "string" && DVT_API_URL) ||
            (typeof PAYMENT_API_URL === "string" && PAYMENT_API_URL) || "";
  if(!api){ onFail(); return; }

  /* ⚠️ `cache:"no-store"` + חותמת זמן. הסטטוס משתנה בצד דביר בכל
     רגע, ולקוח שמרענן את הדף חייב לראות את המצב העדכני — לא עותק
     שהדפדפן שמר לפני שעה. שתי ההגנות יחד ולא אחת: יש דפדפנים
     ומתווכים שמתעלמים מ-no-store על GET, ופרמטר ייחודי עוקף אותם. */
  fetch(api + "?action=getOrderStatus&token=" + encodeURIComponent(token) +
        "&_=" + Date.now(), { cache: "no-store" })
    .then(function(r){ return r.json(); })
    .then(function(d){ if(d && d.ok){ trkRender(d); } else { onFail(); } })
    .catch(function(){ onFail(); });
}

function trkInit(){
  var wa = document.getElementById("trkWa"), wa2 = document.getElementById("trkWa2");
  if(wa) wa.href = trkWaHref();
  if(wa2) wa2.href = trkWaHref();

  var form = document.getElementById("trkCodeForm");
  if(form){
    form.addEventListener("submit", function(e){
      e.preventDefault();
      var inp = document.getElementById("trkCodeIn");
      var err = document.getElementById("trkCodeErr");
      var val = (inp && inp.value ? inp.value : "").trim();
      if(!val) return;
      if(err) err.hidden = true;
      trkShow("trkLoading");
      trkLookup(val, function(){
        trkShow("trkEmpty");
        if(err) err.hidden = false;
        /* ⚠️ הערך נשאר בשדה בכוונה — לקוח שהקליד 22 תווים ושגה
           בתו אחד לא אמור להקליד הכל מחדש. */
        if(inp) inp.focus();
      });
    });
  }

  var token = trkToken();
  /* בלי טוקן בכתובת — מציגים את שדה הקוד, וזה **לא** שגיאה. */
  if(!token){ trkShow("trkEmpty"); return; }

  trkShow("trkLoading");
  trkLookup(token, function(){ trkShow("trkEmpty"); });
}

var TRK_LAST_CODE = "";

function trkRender(o){
  document.getElementById("trkOrdNo").textContent = o.orderNo || "DVT-—";
  /* קוד המעקב שבו נעשה שימוש — כדי שהלקוח יוכל לשמור אותו. */
  var mc = document.getElementById("trkMyCode"), mcv = document.getElementById("trkMyCodeV");
  if(mc && mcv && TRK_LAST_CODE){ mcv.textContent = TRK_LAST_CODE; mc.hidden = false; }
  var placed = document.getElementById("trkPlaced");
  placed.textContent = o.placedAt ? ("הזמנה מתאריך " + trkFmtDate(o.placedAt)) : "";

  // תג Care
  var care = document.getElementById("trkCare");
  if(o.careTier){
    care.style.display = "";
    care.className = "trk-care tier-" + o.careTier;
    document.getElementById("trkCareLbl").textContent = "לקוח " + o.careTier + " · עדיפות טיפול";
  } else { care.style.display = "none"; }

  // צפי הגעה — מוסתר כשעדיין ממתין לתשלום (שלב 1) או כשנמסר (שלב 5)
  var etaBox = document.getElementById("trkEtaBox");
  if(o.status >= 2 && o.status <= 4 && o.etaText){
    etaBox.style.display = "";
    document.getElementById("trkEtaVal").textContent = o.etaText;
  } else { etaBox.style.display = "none"; }

  trkRenderSteps(o);

  // מספר מעקב שילוח — משלב 4 ואילך
  var ship = document.getElementById("trkShip");
  if(o.status >= 4 && (o.trackingUrl || o.trackingNumber)){
    ship.classList.add("show");
    var btn = document.getElementById("trkShipBtn"), no = document.getElementById("trkShipNo");
    if(o.trackingUrl){ btn.style.display = ""; btn.href = o.trackingUrl; no.style.display = "none"; }
    else { btn.style.display = "none"; no.style.display = ""; no.textContent = "מספר מעקב: " + o.trackingNumber; }
  } else { ship.classList.remove("show"); }

  // פריטים
  var box = document.getElementById("trkItemsBox"), list = document.getElementById("trkItems");
  if(o.items && o.items.length){
    box.style.display = "";
    list.innerHTML = o.items.map(function(it){
      return '<div class="trk-item"><span>' + trkEsc(it.name) + '</span>' +
             (it.qty > 1 ? '<em>×' + it.qty + '</em>' : '') + '</div>';
    }).join("");
  } else { box.style.display = "none"; }

  trkShow("trkOrder");
}

function trkRenderSteps(o){
  var stages = TRK_STAGES.filter(function(s){ return !s.assemblyOnly || o.hasAssembly; });
  var html = stages.map(function(s){
    var cls = s.n < o.status ? "done" : (s.n === o.status ? "current" : "pending");
    var check = '<svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>';
    return '<li class="trk-step ' + cls + '">' +
             '<span class="trk-dot">' + (cls === "done" ? check : "") + '</span>' +
             '<span class="trk-body">' +
               '<span class="trk-name">' + trkEsc(s.name) + '</span>' +
               '<span class="trk-desc">' + trkEsc(s.desc) + '</span>' +
             '</span>' +
           '</li>';
  }).join("");
  document.getElementById("trkSteps").innerHTML = html;
}

function trkFmtDate(s){
  // מקבל "YYYY-MM-DD" ומחזיר "DD.MM.YYYY"
  var m = String(s).match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? (m[3] + "." + m[2] + "." + m[1]) : String(s);
}
function trkEsc(s){
  return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){
    return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c];
  });
}

if(document.readyState === "loading"){ document.addEventListener("DOMContentLoaded", trkInit); }
else { trkInit(); }

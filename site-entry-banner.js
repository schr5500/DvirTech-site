/* =====================================================================
   DvirTech — באנר כניסה (site-entry-banner.js)
   =====================================================================
   מודעת פתיחה שנפתחת בכניסה לאתר, עם וו שיווקי חזק, כפתור להעמקה,
   ו**קו-זמן שאוזל מתחתיו** — מסמל שהבאנר עומד להיעלם, ואז נסגר לבד.
   דרישת דביר: הלקוח רוצה לראות את החנות, אז לא כופים דף — מקפיצים
   מודעה קצרה שמושכת לשירותים/חנות ונעלמת מעצמה.

   ⚠️ פעם אחת לכל סשן (sessionStorage) — לא לחזור על כל טעינת דף.
   ⚠️ מדלג על checkout/pay ועל מצב "בקרוב" (אין שם חנות למשוך אליה).
   ⚠️ עצמאי לגמרי: מזריק גם את ה-CSS, כדי שאפשר להוסיף/להסיר בקובץ אחד.
   ⚠️ ריחוף עוצר את הקו — מי שמתחיל לקרוא לא מאבד את הבאנר באמצע.
===================================================================== */
(function(){
  var SKIP = ["checkout.html", "pay.html", "coming-soon.html", "site-coming-soon.html"];
  var page = (location.pathname.split("/").pop() || "index.html");
  if (SKIP.indexOf(page) > -1) return;
  // index.html יכול להיות עותק של דף הבקרוב — בודקים את התוכן בפועל.
  var mark = (document.title || "") + " " + (document.body ? document.body.className : "");
  if (/בקרוב|coming\s*soon/i.test(mark)) return;
  if (document.querySelector(".coming-soon, #comingSoon")) return;
  try { if (sessionStorage.getItem("dvtEntrySeen")) return; } catch (e) {}

  var he = true;
  try { he = (localStorage.getItem("dvirtech_lang") || "he") !== "en"; } catch (e) {}
  var tr = function (h, e) { return he ? h : e; };

  var HOOK = {
    kicker:   tr("רגע לפני שמתחילים", "Before you start"),
    title:    tr("תמיד רצית לבנות מחשב משלך?", "Always wanted your own custom PC?"),
    sub:      tr("הרכבה מקצועית ללא עלות · אחריות מלאה · מחיר כתוב מראש — בלי הפתעות.",
                 "Pro assembly at no cost · Full warranty · Price up front — no surprises."),
    cta:      tr("בוא נבנה יחד", "Let's build it"),
    ctaHref:  "builder.html",
    more:     tr("למה DvirTech?", "Why DvirTech?"),
    moreHref: "why-dvirtech.html"
  };

  var LIFE_MS = 9000;   // כמה זמן הקו לוקח לאזול לפני סגירה

  var css =
    ".dvt-entry{position:fixed;inset:0;z-index:4000;display:flex;align-items:flex-start;" +
      "justify-content:center;padding:78px 16px 16px;pointer-events:none}" +
    ".dvt-entry-back{position:absolute;inset:0;background:rgba(10,30,54,.34);" +
      "opacity:0;transition:opacity .3s ease;pointer-events:auto}" +
    ".dvt-entry.in .dvt-entry-back{opacity:1}" +
    ".dvt-entry-card{position:relative;pointer-events:auto;width:min(520px,100%);" +
      "background:var(--surface,#fff);border:1px solid var(--line,#E6EDF5);border-radius:20px;" +
      "box-shadow:0 24px 60px rgba(14,42,71,.28);overflow:hidden;" +
      "transform:translateY(-14px) scale(.97);opacity:0;transition:transform .34s cubic-bezier(.2,.8,.2,1),opacity .34s}" +
    ".dvt-entry.in .dvt-entry-card{transform:none;opacity:1}" +
    ".dvt-entry-body{padding:26px 26px 22px;direction:rtl;text-align:center}" +
    "[dir=ltr] .dvt-entry-body{direction:ltr}" +
    ".dvt-entry-kicker{display:inline-block;font-family:'Rubik',sans-serif;font-size:12px;font-weight:800;" +
      "letter-spacing:.02em;color:var(--blue,#1B6FE0);background:#EAF3FF;padding:5px 12px;border-radius:999px;margin-bottom:14px}" +
    ".dvt-entry-title{font-family:'Rubik',sans-serif;font-size:clamp(22px,4vw,27px);font-weight:800;" +
      "color:var(--ink,#0E2A47);line-height:1.2;margin:0 0 10px;letter-spacing:-.01em}" +
    ".dvt-entry-sub{font-size:14.5px;color:var(--ink-soft,#5F7590);line-height:1.6;margin:0 0 20px}" +
    ".dvt-entry-row{display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap}" +
    ".dvt-entry-cta{display:inline-flex;align-items:center;gap:8px;background:var(--grad,linear-gradient(135deg,#1B6FE0,#0E4FA8));" +
      "color:#fff;text-decoration:none;font-weight:800;font-size:15px;padding:13px 24px;border-radius:12px;" +
      "box-shadow:0 6px 16px rgba(27,111,224,.28);transition:filter .15s,transform .15s}" +
    ".dvt-entry-cta:hover{filter:brightness(1.06);transform:translateY(-1px)}" +
    ".dvt-entry-more{color:var(--ink-soft,#5F7590);text-decoration:none;font-weight:700;font-size:13.5px}" +
    ".dvt-entry-more:hover{color:var(--blue,#1B6FE0);text-decoration:underline}" +
    ".dvt-entry-x{position:absolute;inset-inline-end:12px;top:10px;width:32px;height:32px;border:none;" +
      "background:transparent;color:var(--ink-soft,#5F7590);font-size:22px;line-height:1;cursor:pointer;border-radius:8px}" +
    ".dvt-entry-x:hover{background:var(--surface-2,#EDF2F8);color:var(--ink,#0E2A47)}" +
    /* הקו האוזל */
    ".dvt-entry-timer{height:4px;background:var(--line,#E6EDF5)}" +
    ".dvt-entry-fill{height:100%;width:100%;background:var(--grad,linear-gradient(90deg,#1B6FE0,#2FC4B0));" +
      "transform-origin:right;animation:dvtEntryDrain " + LIFE_MS + "ms linear forwards}" +
    "[dir=ltr] .dvt-entry-fill{transform-origin:left}" +
    ".dvt-entry-card:hover .dvt-entry-fill{animation-play-state:paused}" +
    "@keyframes dvtEntryDrain{to{transform:scaleX(0)}}" +
    "@media(prefers-reduced-motion:reduce){.dvt-entry-fill{animation-duration:14000ms}" +
      ".dvt-entry-card,.dvt-entry-back{transition:none}}";

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var wrap = document.createElement("div");
  wrap.className = "dvt-entry";
  wrap.setAttribute("role", "dialog");
  wrap.setAttribute("aria-label", tr("הצעה מ-DvirTech", "An offer from DvirTech"));
  wrap.innerHTML =
    '<div class="dvt-entry-back" data-close="1"></div>' +
    '<div class="dvt-entry-card">' +
      '<button class="dvt-entry-x" data-close="1" aria-label="' + tr("סגור", "Close") + '">×</button>' +
      '<div class="dvt-entry-body">' +
        '<span class="dvt-entry-kicker">' + HOOK.kicker + "</span>" +
        '<h2 class="dvt-entry-title">' + HOOK.title + "</h2>" +
        '<p class="dvt-entry-sub">' + HOOK.sub + "</p>" +
        '<div class="dvt-entry-row">' +
          '<a class="dvt-entry-cta" href="' + HOOK.ctaHref + '">' + HOOK.cta +
            ' <span aria-hidden="true">' + (he ? "←" : "→") + "</span></a>" +
          '<a class="dvt-entry-more" href="' + HOOK.moreHref + '">' + HOOK.more + "</a>" +
        "</div>" +
      "</div>" +
      '<div class="dvt-entry-timer"><span class="dvt-entry-fill"></span></div>' +
    "</div>";

  document.body.appendChild(wrap);
  try { sessionStorage.setItem("dvtEntrySeen", "1"); } catch (e) {}

  // אנימציית כניסה
  requestAnimationFrame(function () { requestAnimationFrame(function () { wrap.classList.add("in"); }); });

  var timer = null;
  function close(){
    if (!wrap.parentNode) return;
    if (timer) clearTimeout(timer);
    wrap.classList.remove("in");
    setTimeout(function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }, 340);
  }
  // סגירה: X, רקע, Escape, וכשהקו אוזל. לחיצה על CTA מנווטת (בלי סגירה יזומה).
  wrap.addEventListener("click", function (e) { if (e.target.getAttribute("data-close")) close(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  var fill = wrap.querySelector(".dvt-entry-fill");
  if (fill) fill.addEventListener("animationend", close);
  // רשת ביטחון אם אנימציות כבויות
  timer = setTimeout(close, LIFE_MS + 1500);
})();

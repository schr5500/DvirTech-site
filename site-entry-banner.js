/* =====================================================================
   DvirTech — טוסט כניסה (site-entry-banner.js)
   =====================================================================
   מודעה קטנה שקופצת בפינה העליונה **תוך כדי גלישה** — לא חוסמת כלום,
   המשתמש ממשיך ללחוץ/לגלול חופשי. דרישת דביר: מלבן קטן בפינה, בלי
   שכבת-חושך שמגבילה. יש קו-זמן שאוזל ומסמל שהטוסט נעלם, ואז נסגר לבד.

   ⚠️ תדירות (30.08, דביר: "פעם ביום סה\"כ — לא רוצה חופר, אבל כן
   רוצה שיכירו את העסק"): מוצג לכל היותר פעם ב-24 שעות, ונעלם
   **לתמיד** ברגע שהלקוח הכיר — לחץ על אחד הכפתורים, או ביקר בעמוד
   "למה DvirTech" מכל מקור. סגירה ב-X היא "לא עכשיו" — מחר שוב.
   ⚠️ עצמאי לגמרי (מזריק גם CSS). ריחוף עוצר את הקו.
   ⚠️ **אין overlay ו-pointer-events רק על הכרטיס** — הדף נשאר אינטראקטיבי.
===================================================================== */
(function(){
  var SKIP = ["checkout.html", "pay.html", "coming-soon.html", "site-coming-soon.html"];
  var page = (location.pathname.split("/").pop() || "index.html");
  if (SKIP.indexOf(page) > -1) return;
  var mark = (document.title || "") + " " + (document.body ? document.body.className : "");
  if (/בקרוב|coming\s*soon/i.test(mark)) return;
  if (document.querySelector(".coming-soon, #comingSoon")) return;

  /* מי שהגיע לעמוד "למה DvirTech" — הכיר. הבאנר סיים את תפקידו,
     מכל מקור הגעה (הבאנר, התפריט, קישור ישיר). */
  if (page === "why-dvirtech.html") {
    try { localStorage.setItem("dvtEntryDone", "1"); } catch (e) {}
    return;
  }
  try {
    if (localStorage.getItem("dvtEntryDone")) return;
    var last = Number(localStorage.getItem("dvtEntryLast")) || 0;
    if (Date.now() - last < 24 * 3600 * 1000) return;
  } catch (e) {}

  var he = true;
  try { he = (localStorage.getItem("dvirtech_lang") || "he") !== "en"; } catch (e) {}
  var tr = function (h, e) { return he ? h : e; };

  var HOOK = {
    kicker:   tr("רגע 👋", "Hey 👋"),
    title:    tr("תמיד רצית לבנות מחשב משלך?", "Always wanted your own custom PC?"),
    /* 🔴 **"הרכבה ללא עלות" הוסר 26.08.** זה הטקסט הראשון שלקוח
       רואה בכניסה לאתר — הבטחה שכבר לא נכונה כאן היא הגרועה
       מכולן. ההטבה היום היא מחיר מוזל (199 ₪ במקום 300 ₪), אבל
       באנר כניסה הוא לא המקום למספרים; הוא מוכר את **הסיבה**
       לקנות, והמחיר מופיע בקופה. */
    sub:      tr("רכיבים תואמים · אחריות מלאה · מחיר מראש.",
                 "Compatible parts · Full warranty · Price up front."),
    cta:      tr("לבונה", "Builder"),
    ctaHref:  "builder.html",
    more:     tr("למה DvirTech?", "Why DvirTech?"),
    moreHref: "why-dvirtech.html"
  };
  /* 🔴 היה 9000. תשע שניות זה בקושי זמן לקרוא כותרת + שתי שורות,
     ובוודאי לא זמן להחליט ללחוץ על קישור משני. דביר ביקש ~30 שניות
     — "מספיק כדי שיקלטו את זה".
     ⚠️ הבאנר יושב בפינה העליונה ולא חוסם דבר (pointer-events:none
     על העוטף), ולכן הארכה כאן אינה פוגעת במי שלא מתעניין. */
  var LIFE_MS = 30000;

  var css =
    /* פינה עליונה, לא חוסם. pointer-events:none על העוטף, auto על הכרטיס */
    ".dvt-toast{position:fixed;top:84px;inset-inline-end:18px;z-index:3000;" +
      "width:min(330px,calc(100vw - 32px));pointer-events:none}" +
    "@media(max-width:600px){.dvt-toast{top:auto;bottom:16px;inset-inline:16px;width:auto}}" +
    ".dvt-toast-card{pointer-events:auto;background:var(--surface,#fff);border:1px solid var(--line,#E6EDF5);" +
      "border-radius:16px;box-shadow:0 16px 40px rgba(14,42,71,.20);overflow:hidden;" +
      "transform:translateY(-12px) scale(.98);opacity:0;transition:transform .32s cubic-bezier(.2,.8,.2,1),opacity .32s}" +
    ".dvt-toast.in .dvt-toast-card{transform:none;opacity:1}" +
    ".dvt-toast-body{padding:15px 16px 14px;direction:rtl}[dir=ltr] .dvt-toast-body{direction:ltr}" +
    ".dvt-toast-kicker{font-family:'Rubik',sans-serif;font-size:11.5px;font-weight:800;color:var(--blue,#1B6FE0)}" +
    ".dvt-toast-title{font-family:'Rubik',sans-serif;font-size:15.5px;font-weight:800;color:var(--ink,#0E2A47);" +
      "line-height:1.25;margin:3px 0 4px;padding-inline-end:18px}" +
    ".dvt-toast-sub{font-size:12.5px;color:var(--ink-soft,#5F7590);line-height:1.5;margin:0 0 12px}" +
    ".dvt-toast-row{display:flex;gap:10px;align-items:center}" +
    ".dvt-toast-cta{display:inline-flex;align-items:center;gap:6px;background:var(--grad,linear-gradient(135deg,#1B6FE0,#0E4FA8));" +
      "color:#fff;text-decoration:none;font-weight:800;font-size:13.5px;padding:9px 16px;border-radius:10px}" +
    ".dvt-toast-cta:hover{filter:brightness(1.06)}" +
    /* 🔴 "למה DvirTech?" היה טקסט אפור (--ink-soft) ליד כפתור בגרדיאנט —
       כלומר נראה כמו הערת שוליים. זה הדף שמסביר למה לקנות דווקא כאן,
       והוא ראוי לכפתור אמיתי. עכשיו כפתור-מתאר (outline): נוכח לעין,
       ועדיין משני ברור לעומת ה-CTA הראשי ולא מתחרה בו. */
    ".dvt-toast-more{display:inline-flex;align-items:center;gap:5px;color:var(--blue,#1B6FE0);" +
      "text-decoration:none;font-weight:800;font-size:12.5px;border:1.5px solid var(--blue-soft,#C9DEF8);" +
      "background:#fff;border-radius:11px;padding:9px 13px;transition:.16s;white-space:nowrap}" +
    ".dvt-toast-more:hover{background:var(--blue-soft,#EAF2FE);border-color:var(--blue,#1B6FE0);" +
      "transform:translateY(-1px)}" +
    ".dvt-toast-x{position:absolute;inset-inline-end:8px;top:7px;width:26px;height:26px;border:none;background:transparent;" +
      "color:var(--ink-soft,#5F7590);font-size:19px;line-height:1;cursor:pointer;border-radius:7px}" +
    ".dvt-toast-x:hover{background:var(--surface-2,#EDF2F8);color:var(--ink,#0E2A47)}" +
    ".dvt-toast-timer{height:3px;background:var(--line,#E6EDF5)}" +
    ".dvt-toast-fill{height:100%;width:100%;background:var(--grad,linear-gradient(90deg,#1B6FE0,#2FC4B0));" +
      "transform-origin:right;animation:dvtToastDrain " + LIFE_MS + "ms linear forwards}" +
    "[dir=ltr] .dvt-toast-fill{transform-origin:left}" +
    ".dvt-toast-card:hover .dvt-toast-fill{animation-play-state:paused}" +
    "@keyframes dvtToastDrain{to{transform:scaleX(0)}}" +
    "@media(prefers-reduced-motion:reduce){.dvt-toast-fill{animation-duration:" + LIFE_MS + "ms}"
    /* 🔴 כאן היה 14000ms קבוע. סיום האנימציה הוא מה שסוגר את הטוסט
       (animationend -> close), ולכן משתמש עם prefers-reduced-motion
       קיבל 14 שניות בלבד — בלי קשר ל-LIFE_MS. הגדרת נגישות אינה
       אמורה לקצר תוכן, רק להרגיע תנועה. */
      ".dvt-toast-card{transition:none}}";

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var wrap = document.createElement("div");
  wrap.className = "dvt-toast";
  wrap.setAttribute("role", "status");
  wrap.innerHTML =
    '<div class="dvt-toast-card">' +
      '<button class="dvt-toast-x" data-close="1" aria-label="' + tr("סגור", "Close") + '">×</button>' +
      '<div class="dvt-toast-body">' +
        '<div class="dvt-toast-kicker">' + HOOK.kicker + "</div>" +
        '<div class="dvt-toast-title">' + HOOK.title + "</div>" +
        '<div class="dvt-toast-sub">' + HOOK.sub + "</div>" +
        '<div class="dvt-toast-row">' +
          '<a class="dvt-toast-cta" href="' + HOOK.ctaHref + '">' + HOOK.cta +
            ' <span aria-hidden="true">' + (he ? "←" : "→") + "</span></a>" +
          '<a class="dvt-toast-more" href="' + HOOK.moreHref + '">' + HOOK.more + "</a>" +
        "</div>" +
      "</div>" +
      '<div class="dvt-toast-timer"><span class="dvt-toast-fill"></span></div>' +
    "</div>";

  document.body.appendChild(wrap);
  try { localStorage.setItem("dvtEntryLast", String(Date.now())); } catch (e) {}
  requestAnimationFrame(function () { requestAnimationFrame(function () { wrap.classList.add("in"); }); });

  var timer = null;
  function close(){
    if (!wrap.parentNode) return;
    if (timer) clearTimeout(timer);
    wrap.classList.remove("in");
    setTimeout(function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }, 320);
  }
  wrap.addEventListener("click", function (e) {
    if (e.target.getAttribute("data-close")) close();
    /* לחיצה על אחד משני הקישורים = הכיר את העסק — לא מציגים שוב. */
    if (e.target.closest && e.target.closest("a")) {
      try { localStorage.setItem("dvtEntryDone", "1"); } catch (e2) {}
    }
  });
  var fill = wrap.querySelector(".dvt-toast-fill");
  if (fill) fill.addEventListener("animationend", close);
  timer = setTimeout(close, LIFE_MS + 1500);

  /* ⚠️ dvtToastHold — מי שמרחף מעל הכרטיס קורא אותו, ולסגור לו אותו
     באמצע זה בדיוק ההפך ממה שהבאנר נועד לעשות. הריחוף עוצר גם את
     הטיימר וגם את פס ההתקדמות; ביציאה ניתנות עוד 8 שניות ולא 30,
     כי הוא כבר קרא. `focusin` נכלל כדי שגם ניווט במקלדת לא ייקטע. */
  function dvtToastHold(){
    if (timer) { clearTimeout(timer); timer = null; }
    if (fill) fill.style.animationPlayState = "paused";
  }
  function dvtToastResume(){
    if (!wrap.parentNode || timer) return;
    if (fill) fill.style.animationPlayState = "running";
    timer = setTimeout(close, 8000);
  }
  wrap.addEventListener("mouseenter", dvtToastHold);
  wrap.addEventListener("focusin",    dvtToastHold);
  wrap.addEventListener("mouseleave", dvtToastResume);
})();

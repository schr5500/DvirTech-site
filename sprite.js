/* =====================================================================
   DvirTech — ספריית איורים משותפת
   =====================================================================
   מזריק סט <symbol> אחד ל-<body> של כל דף שטוען את הקובץ, כך שכל דף
   (וגם קוד שמייצר HTML דינמית, כמו products.js) יכול לצייר איור עם
   <svg><use href="#ic-gpu"/></svg> בלי בקשת רשת נוספת.

   סגנון: "רנדר מוצר" ולא אייקון שטוח — גוף כהה עם גרדיאנט, זכוכית,
   מסכים זוהרים, טבעות RGB עם filter של זוהר, וצל רך על הרצפה. זה מה
   שמקרב את האיורים לצילומי המוצר שבמוקאפ.

   ⚠️ מוצר עם תמונה אמיתית (עמודת image בגיליון) תמיד גובר על האיור.
   האיור הוא ברירת המחדל כדי שהחנות לא תיראה שבורה כשאין תמונה.

   הלוגו (#dvt-logo) הוא שרטוט וקטורי של הלוגו הקיים. הוא הוזמן כי קובץ
   הלוגו המקורי הוא הדמיה על קיר משרד ולא נכס גרפי נקי. אם יגיע קובץ
   מקורי (AI/SVG) — עדיף להחליף אותו כאן.
===================================================================== */

(function () {
  if (document.getElementById("dvt-sprite")) return;

  var SPRITE = `
<svg id="dvt-sprite" width="0" height="0" aria-hidden="true" focusable="false"
     style="position:absolute;width:0;height:0;overflow:hidden">
<defs>
  <!-- מסך דולק -->
  <linearGradient id="dScreen" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%"   stop-color="#0A2A5E"/>
    <stop offset="45%"  stop-color="#1B6FE0"/>
    <stop offset="100%" stop-color="#2FC4B0"/>
  </linearGradient>
  <!-- זכוכית של מארז -->
  <linearGradient id="dGlass" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%"   stop-color="#5A9BE0" stop-opacity=".38"/>
    <stop offset="48%"  stop-color="#12283F" stop-opacity=".14"/>
    <stop offset="100%" stop-color="#0B1B2C" stop-opacity=".30"/>
  </linearGradient>
  <!-- גוף מתכת כהה -->
  <linearGradient id="dBody" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%"   stop-color="#33475F"/>
    <stop offset="55%"  stop-color="#1C2E44"/>
    <stop offset="100%" stop-color="#111F31"/>
  </linearGradient>
  <linearGradient id="dBodyL" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%"   stop-color="#3B5273"/>
    <stop offset="100%" stop-color="#16273C"/>
  </linearGradient>
  <!-- ברק עליון על גוף המוצר -->
  <linearGradient id="dGloss" x1="0" y1="0" x2="0.35" y2="1">
    <stop offset="0%"   stop-color="#FFFFFF" stop-opacity=".22"/>
    <stop offset="55%"  stop-color="#FFFFFF" stop-opacity=".03"/>
    <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
  </linearGradient>
  <radialGradient id="dShadow" cx="50%" cy="50%">
    <stop offset="0%"   stop-color="#0E2A47" stop-opacity=".26"/>
    <stop offset="70%"  stop-color="#0E2A47" stop-opacity=".07"/>
    <stop offset="100%" stop-color="#0E2A47" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="dRgbA" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#38D9C4"/><stop offset="100%" stop-color="#2C7BE5"/>
  </linearGradient>
  <linearGradient id="dRgbB" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#8B5CF6"/><stop offset="100%" stop-color="#3B82F6"/>
  </linearGradient>
  <linearGradient id="dLogoBlue" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#2E86C8"/><stop offset="100%" stop-color="#12578F"/>
  </linearGradient>
  <linearGradient id="dLogoTeal" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#49C4CE"/><stop offset="100%" stop-color="#2A9FAE"/>
  </linearGradient>

  <!-- זוהר רך סביב אלמנטים דולקים -->
  <filter id="dGlow" x="-70%" y="-70%" width="240%" height="240%">
    <feGaussianBlur stdDeviation="2.6" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="dGlowSoft" x="-90%" y="-90%" width="280%" height="280%">
    <feGaussianBlur stdDeviation="5" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>

<!-- ============ הלוגו ============ -->
<!-- שרטוט וקטורי של הלוגו הקיים: משושה של מסלולי מעגל, גלגל שיניים עם
     סמן עכבר וקו פעימה, והלוגוטייפ DvirTech + סלוגן. -->
<symbol id="dvt-logo" viewBox="0 0 360 104">
  <g stroke="#2E86C8" stroke-width="1.5" fill="none" stroke-linecap="round">
    <path d="M300 30c-8-10-18-17-30-20"/>
    <path d="M356 30c-6-9-14-15-24-18"/>
    <path d="M300 30v10M356 30v6"/>
    <path d="M282 78c10 8 22 13 35 15M356 78c-6 6-14 10-23 12"/>
  </g>
  <g fill="#49C4CE">
    <circle cx="300" cy="42" r="2.6"/><circle cx="356" cy="38" r="2.2"/>
    <circle cx="317" cy="94" r="2.4"/><circle cx="333" cy="91" r="2"/>
  </g>

  <!-- גלגל שיניים + סמן + פעימה -->
  <g transform="translate(292 18)">
    <path d="M26 0l3.4 4.6 5.6-1.2 1 5.7 5.6 1.4-1.6 5.5 4.4 3.7-4 4.1 2.6 5.1-5.2 2.4.2 5.7-5.7-.6-2.5 5.2-4.8-3.1-4.8 3.1-2.5-5.2-5.7.6.2-5.7-5.2-2.4 2.6-5.1-4-4.1 4.4-3.7-1.6-5.5 5.6-1.4 1-5.7 5.6 1.2z"
          fill="url(#dLogoBlue)"/>
    <circle cx="26" cy="26" r="10" fill="#FFFFFF"/>
    <path d="M14 40L34 12l1 15 6-6z" fill="url(#dLogoTeal)"/>
    <path d="M40 24h8l4-9 5 18 4-9h11" stroke="#49C4CE" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- הלוגוטייפ. הטקסט אינו מומר לנתיבים בכוונה: כך הוא חד בכל גודל
       ומשתמש ב-Rubik שממילא נטען בכל דף. -->
  <text x="272" y="66" text-anchor="end" font-family="Rubik,Arial,sans-serif" font-weight="800" font-size="42" letter-spacing="-1">
    <tspan fill="url(#dLogoBlue)">Dvir</tspan><tspan fill="url(#dLogoTeal)">Tech</tspan>
  </text>
  <text x="272" y="88" text-anchor="end" font-family="Heebo,Rubik,Arial,sans-serif" font-weight="600" font-size="14.5" fill="#2E86C8" direction="rtl">שירותי מחשוב ותמיכה טכנית</text>
</symbol>

<!-- ============ קטגוריות — סגנון רנדר ============ -->

<symbol id="ic-desktop" viewBox="0 0 128 112">
  <ellipse cx="64" cy="102" rx="42" ry="8" fill="url(#dShadow)"/>
  <rect x="38" y="8" width="52" height="90" rx="8" fill="url(#dBodyL)"/>
  <rect x="44" y="14" width="40" height="78" rx="5" fill="#0A1726"/>
  <rect x="44" y="14" width="40" height="78" rx="5" fill="url(#dGlass)"/>
  <g filter="url(#dGlow)">
    <circle cx="64" cy="32" r="10" fill="none" stroke="url(#dRgbA)" stroke-width="3.2"/>
    <circle cx="64" cy="54" r="10" fill="none" stroke="url(#dRgbB)" stroke-width="3.2"/>
    <circle cx="64" cy="76" r="10" fill="none" stroke="url(#dRgbA)" stroke-width="3.2"/>
  </g>
  <circle cx="64" cy="32" r="2.6" fill="#8FF0E4"/><circle cx="64" cy="54" r="2.6" fill="#C4B5FD"/><circle cx="64" cy="76" r="2.6" fill="#8FF0E4"/>
  <rect x="38" y="8" width="52" height="90" rx="8" fill="url(#dGloss)"/>
  <rect x="43" y="12" width="9" height="2.6" rx="1.3" fill="#4E7CA8"/>
</symbol>

<symbol id="ic-laptop" viewBox="0 0 128 112">
  <ellipse cx="64" cy="100" rx="52" ry="8" fill="url(#dShadow)"/>
  <rect x="26" y="20" width="76" height="52" rx="5" fill="url(#dBody)"/>
  <rect x="31" y="25" width="66" height="42" rx="3" fill="url(#dScreen)"/>
  <path d="M35 58c14-22 24 8 34-8s16 4 24-12" fill="none" stroke="#CFF3EC" stroke-width="3" opacity=".8" filter="url(#dGlow)"/>
  <path d="M35 64c16-18 22 6 34-6s18 4 24-10" fill="none" stroke="#8FD8FF" stroke-width="1.8" opacity=".45"/>
  <path d="M14 78h100l-7 11a5 5 0 0 1-4 2H25a5 5 0 0 1-4-2z" fill="url(#dBodyL)"/>
  <path d="M14 78h100l-1.6 2.5H15.6z" fill="#4E7CA8" opacity=".5"/>
  <rect x="54" y="82" width="20" height="3" rx="1.5" fill="#2FC4B0" opacity=".75"/>
</symbol>

<symbol id="ic-gpu" viewBox="0 0 128 112">
  <ellipse cx="64" cy="94" rx="50" ry="8" fill="url(#dShadow)"/>
  <rect x="10" y="30" width="106" height="48" rx="6" fill="url(#dBodyL)"/>
  <rect x="10" y="30" width="106" height="48" rx="6" fill="url(#dGloss)"/>
  <g filter="url(#dGlow)">
    <circle cx="40" cy="54" r="16" fill="none" stroke="url(#dRgbA)" stroke-width="2.6"/>
    <circle cx="82" cy="54" r="16" fill="none" stroke="url(#dRgbB)" stroke-width="2.6"/>
  </g>
  <g stroke="#7FA8CE" stroke-width="1.6" opacity=".65" fill="none">
    <path d="M40 40v28M26 54h28M30 44l20 20M50 44L30 64"/>
    <path d="M82 40v28M68 54h28M72 44l20 20M92 44L72 64"/>
  </g>
  <circle cx="40" cy="54" r="4.5" fill="#16273C" stroke="#8FF0E4" stroke-width="1.4"/>
  <circle cx="82" cy="54" r="4.5" fill="#16273C" stroke="#C4B5FD" stroke-width="1.4"/>
  <rect x="20" y="78" width="26" height="6" rx="2.5" fill="#2A3D55"/>
  <rect x="52" y="78" width="14" height="6" rx="2.5" fill="#2A3D55"/>
  <rect x="112" y="26" width="8" height="56" rx="3" fill="#48627E"/>
</symbol>

<symbol id="ic-monitor" viewBox="0 0 128 112">
  <ellipse cx="64" cy="102" rx="40" ry="7" fill="url(#dShadow)"/>
  <rect x="8" y="10" width="112" height="70" rx="6" fill="url(#dBody)"/>
  <rect x="14" y="16" width="100" height="58" rx="3" fill="url(#dScreen)"/>
  <path d="M22 56c22-32 34 12 50-10s26 6 34-14" fill="none" stroke="#CFF3EC" stroke-width="4" opacity=".8" filter="url(#dGlow)"/>
  <path d="M22 66c24-26 32 10 50-8s28 6 34-12" fill="none" stroke="#8FD8FF" stroke-width="2.2" opacity=".45"/>
  <path d="M54 80v14h20V80" fill="none" stroke="#3D5B7C" stroke-width="5"/>
  <rect x="42" y="94" width="44" height="6" rx="3" fill="url(#dBodyL)"/>
  <rect x="8" y="10" width="112" height="70" rx="6" fill="url(#dGloss)"/>
</symbol>

<symbol id="ic-peri" viewBox="0 0 128 112">
  <ellipse cx="64" cy="100" rx="42" ry="7" fill="url(#dShadow)"/>
  <path d="M24 70V54a40 40 0 0 1 80 0v16" fill="none" stroke="url(#dBodyL)" stroke-width="11" stroke-linecap="round"/>
  <path d="M24 70V54a40 40 0 0 1 80 0v16" fill="none" stroke="#5A7B9E" stroke-width="3" stroke-linecap="round" opacity=".5"/>
  <rect x="12" y="60" width="26" height="40" rx="12" fill="url(#dBody)"/>
  <rect x="90" y="60" width="26" height="40" rx="12" fill="url(#dBody)"/>
  <g filter="url(#dGlow)">
    <path d="M25 70v20M103 70v20" stroke="#2FC4B0" stroke-width="3.4" stroke-linecap="round"/>
  </g>
  <path d="M90 92c-6 10-16 14-26 14" fill="none" stroke="#3D5B7C" stroke-width="2.6" stroke-linecap="round"/>
</symbol>

<symbol id="ic-cpu" viewBox="0 0 128 112">
  <ellipse cx="64" cy="98" rx="38" ry="7" fill="url(#dShadow)"/>
  <g stroke="#5A7B9E" stroke-width="3" stroke-linecap="round">
    <path d="M42 10v10M64 10v10M86 10v10M42 88v10M64 88v10M86 88v10M18 32h10M18 54h10M18 76h10M100 32h10M100 54h10M100 76h10"/>
  </g>
  <rect x="26" y="18" width="76" height="72" rx="8" fill="url(#dBodyL)"/>
  <rect x="26" y="18" width="76" height="72" rx="8" fill="url(#dGloss)"/>
  <rect x="44" y="36" width="40" height="36" rx="5" fill="url(#dScreen)" filter="url(#dGlow)"/>
  <path d="M50 44h28M50 52h28M50 60h20" stroke="#BFEFE6" stroke-width="2" stroke-linecap="round" opacity=".55"/>
  <path d="M26 28a8 8 0 0 1 8-8" stroke="#2FC4B0" stroke-width="3" fill="none" stroke-linecap="round"/>
</symbol>

<symbol id="ic-ram" viewBox="0 0 128 112">
  <ellipse cx="64" cy="98" rx="46" ry="7" fill="url(#dShadow)"/>
  <path d="M22 26h84l-8 16H30z" fill="url(#dRgbA)" filter="url(#dGlow)"/>
  <rect x="18" y="40" width="92" height="42" rx="4" fill="url(#dBodyL)"/>
  <rect x="18" y="40" width="92" height="42" rx="4" fill="url(#dGloss)"/>
  <g fill="#0F1E30" opacity=".85">
    <rect x="26" y="50" width="16" height="12" rx="2"/><rect x="46" y="50" width="16" height="12" rx="2"/>
    <rect x="66" y="50" width="16" height="12" rx="2"/><rect x="86" y="50" width="16" height="12" rx="2"/>
  </g>
  <g stroke="#5A7B9E" stroke-width="3.4" stroke-linecap="round">
    <path d="M26 82v10M40 82v10M54 82v10M68 82v10M82 82v10M96 82v10"/>
  </g>
</symbol>

<symbol id="ic-storage" viewBox="0 0 128 112">
  <ellipse cx="64" cy="94" rx="44" ry="7" fill="url(#dShadow)"/>
  <rect x="10" y="42" width="94" height="34" rx="6" fill="url(#dBodyL)"/>
  <rect x="10" y="42" width="94" height="34" rx="6" fill="url(#dGloss)"/>
  <rect x="22" y="52" width="30" height="16" rx="3" fill="url(#dScreen)" filter="url(#dGlow)"/>
  <rect x="58" y="52" width="22" height="16" rx="3" fill="#0F1E30"/>
  <rect x="104" y="46" width="14" height="26" rx="4" fill="#48627E"/>
  <g stroke="#5A7B9E" stroke-width="3" stroke-linecap="round">
    <path d="M18 76v9M26 76v9M34 76v9"/>
  </g>
</symbol>

<symbol id="ic-psu" viewBox="0 0 128 112">
  <ellipse cx="64" cy="96" rx="44" ry="7" fill="url(#dShadow)"/>
  <rect x="10" y="24" width="98" height="64" rx="8" fill="url(#dBodyL)"/>
  <rect x="10" y="24" width="98" height="64" rx="8" fill="url(#dGloss)"/>
  <g filter="url(#dGlow)"><circle cx="48" cy="56" r="22" fill="none" stroke="url(#dRgbA)" stroke-width="2.6"/></g>
  <g stroke="#7FA8CE" stroke-width="1.8" opacity=".6" fill="none">
    <path d="M48 34v44M26 56h44M32 40l32 32M64 40L32 72"/>
  </g>
  <circle cx="48" cy="56" r="6" fill="#16273C" stroke="#8FF0E4" stroke-width="1.5"/>
  <rect x="80" y="44" width="16" height="24" rx="4" fill="#0F1E30"/>
  <path d="M108 44c12 0 12 6 12 12s0 12-12 12" stroke="#48627E" stroke-width="5" fill="none" stroke-linecap="round"/>
</symbol>

<symbol id="ic-case" viewBox="0 0 128 112">
  <ellipse cx="64" cy="102" rx="40" ry="8" fill="url(#dShadow)"/>
  <rect x="36" y="6" width="56" height="94" rx="9" fill="url(#dBodyL)"/>
  <rect x="43" y="16" width="42" height="72" rx="5" fill="#0A1726"/>
  <rect x="43" y="16" width="42" height="72" rx="5" fill="url(#dGlass)"/>
  <g filter="url(#dGlow)">
    <circle cx="64" cy="36" r="11" fill="none" stroke="url(#dRgbB)" stroke-width="3"/>
    <circle cx="64" cy="66" r="11" fill="none" stroke="url(#dRgbA)" stroke-width="3"/>
  </g>
  <rect x="49" y="50" width="30" height="6" rx="2" fill="#2A3D55"/>
  <circle cx="82" cy="12" r="2.6" fill="#8FF0E4" filter="url(#dGlow)"/>
  <rect x="36" y="6" width="56" height="94" rx="9" fill="url(#dGloss)"/>
</symbol>

<symbol id="ic-cool" viewBox="0 0 128 112">
  <ellipse cx="64" cy="100" rx="40" ry="7" fill="url(#dShadow)"/>
  <rect x="16" y="10" width="96" height="84" rx="12" fill="url(#dBodyL)"/>
  <rect x="16" y="10" width="96" height="84" rx="12" fill="url(#dGloss)"/>
  <g fill="url(#dRgbA)" opacity=".92" filter="url(#dGlow)">
    <path d="M64 24c12 6 15 17 10 26-6-4-14-4-20 0-5-9-2-20 10-26z"/>
    <path d="M64 24c12 6 15 17 10 26-6-4-14-4-20 0-5-9-2-20 10-26z" transform="rotate(90 64 52)"/>
    <path d="M64 24c12 6 15 17 10 26-6-4-14-4-20 0-5-9-2-20 10-26z" transform="rotate(180 64 52)"/>
    <path d="M64 24c12 6 15 17 10 26-6-4-14-4-20 0-5-9-2-20 10-26z" transform="rotate(270 64 52)"/>
  </g>
  <circle cx="64" cy="52" r="10" fill="url(#dBody)" stroke="#5A7B9E" stroke-width="1.5"/>
</symbol>

<symbol id="ic-mobo" viewBox="0 0 128 112">
  <ellipse cx="64" cy="102" rx="42" ry="7" fill="url(#dShadow)"/>
  <rect x="12" y="8" width="104" height="88" rx="8" fill="#12303A"/>
  <rect x="12" y="8" width="104" height="88" rx="8" fill="url(#dGloss)"/>
  <g stroke="#2FC4B0" stroke-width="1.2" opacity=".45" fill="none">
    <path d="M24 20h24v14M60 20v20h30M24 60h18v22M96 34v40H70"/>
  </g>
  <rect x="24" y="20" width="30" height="30" rx="5" fill="url(#dScreen)" filter="url(#dGlow)"/>
  <g fill="#2A3D55">
    <rect x="66" y="18" width="8" height="34" rx="2"/><rect x="78" y="18" width="8" height="34" rx="2"/>
    <rect x="90" y="18" width="8" height="34" rx="2"/>
  </g>
  <rect x="24" y="64" width="72" height="8" rx="4" fill="#48627E"/>
  <rect x="24" y="80" width="50" height="8" rx="4" fill="#33475F"/>
  <circle cx="90" cy="84" r="7" fill="none" stroke="#5A7B9E" stroke-width="2"/>
</symbol>

<symbol id="ic-keyboard" viewBox="0 0 128 112">
  <ellipse cx="64" cy="96" rx="50" ry="7" fill="url(#dShadow)"/>
  <path d="M14 44h76l10 40H8z" fill="url(#dBodyL)"/>
  <g fill="#2FC4B0" opacity=".8" filter="url(#dGlow)">
    <rect x="18" y="52" width="10" height="7" rx="2.5"/><rect x="32" y="52" width="10" height="7" rx="2.5"/>
    <rect x="46" y="52" width="10" height="7" rx="2.5"/><rect x="60" y="52" width="10" height="7" rx="2.5"/>
    <rect x="74" y="52" width="10" height="7" rx="2.5"/>
  </g>
  <g fill="#8B5CF6" opacity=".75">
    <rect x="16" y="64" width="10" height="7" rx="2.5"/><rect x="30" y="64" width="42" height="7" rx="3.5"/>
    <rect x="76" y="64" width="10" height="7" rx="2.5"/>
  </g>
  <path d="M104 50a13 13 0 0 1 13 13v14a13 13 0 0 1-26 0V63a13 13 0 0 1 13-13z" fill="url(#dBody)"/>
  <path d="M104 58v10" stroke="#2FC4B0" stroke-width="3.4" stroke-linecap="round" filter="url(#dGlow)"/>
</symbol>

<symbol id="ic-acc" viewBox="0 0 128 112">
  <ellipse cx="64" cy="100" rx="38" ry="7" fill="url(#dShadow)"/>
  <path d="M34 34h60a10 10 0 0 1 10 10v48a10 10 0 0 1-10 10H34a10 10 0 0 1-10-10V44a10 10 0 0 1 10-10z" fill="url(#dBodyL)"/>
  <path d="M48 34V22a16 16 0 0 1 32 0v12" fill="none" stroke="#48627E" stroke-width="5"/>
  <rect x="34" y="56" width="60" height="18" rx="5" fill="url(#dScreen)" opacity=".8"/>
  <path d="M42 86h20" stroke="#2FC4B0" stroke-width="3.4" stroke-linecap="round" filter="url(#dGlow)"/>
  <path d="M34 34h60a10 10 0 0 1 10 10v48a10 10 0 0 1-10 10H34a10 10 0 0 1-10-10V44a10 10 0 0 1 10-10z" fill="url(#dGloss)"/>
</symbol>

<symbol id="ic-service" viewBox="0 0 128 112">
  <ellipse cx="64" cy="100" rx="38" ry="7" fill="url(#dShadow)"/>
  <path d="M84 8a30 30 0 0 0-27 43L16 92a12 12 0 0 0 17 17l41-41a30 30 0 0 0 39-27 30 30 0 0 0-3-13l-19 19-15-15 19-19A30 30 0 0 0 84 8z"
        fill="url(#dBodyL)"/>
  <path d="M84 8a30 30 0 0 0-27 43L16 92a12 12 0 0 0 17 17l41-41a30 30 0 0 0 39-27 30 30 0 0 0-3-13l-19 19-15-15 19-19A30 30 0 0 0 84 8z"
        fill="url(#dGloss)"/>
  <circle cx="27" cy="97" r="5" fill="#2FC4B0" filter="url(#dGlow)"/>
</symbol>

<!-- ============ אייקוני ממשק (קו) ============ -->
<symbol id="ui-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/></symbol>
<symbol id="ui-cart" viewBox="0 0 24 24"><path d="M3 4h2.2l2.4 11h10l2-7.5H6.5"/><circle cx="9.5" cy="19" r="1.6"/><circle cx="17" cy="19" r="1.6"/></symbol>
<symbol id="ui-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></symbol>
<symbol id="ui-heart" viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 7.7a4.4 4.4 0 0 1 7.5 2.7C19.5 15.4 12 20 12 20z"/></symbol>
<symbol id="ui-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>
<symbol id="ui-truck" viewBox="0 0 24 24"><path d="M2 7h11v9H2zM13 10h4l3 3v3h-7z"/><circle cx="6.5" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/></symbol>
<symbol id="ui-shield" viewBox="0 0 24 24"><path d="M12 3l7 3v5.5c0 4.4-2.9 8-7 9.5-4.1-1.5-7-5.1-7-9.5V6z"/><path d="M9.2 12.2l2 2 3.8-4"/></symbol>
<symbol id="ui-lock" viewBox="0 0 24 24"><rect x="4.5" y="10" width="15" height="10.5" rx="2.5"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/></symbol>
<symbol id="ui-headset" viewBox="0 0 24 24"><path d="M4.5 14v-2a7.5 7.5 0 0 1 15 0v2"/><rect x="2.5" y="13" width="4" height="6.5" rx="2"/><rect x="17.5" y="13" width="4" height="6.5" rx="2"/><path d="M17.5 19c-1.4 2-3.2 2.6-5 2.6"/></symbol>
<symbol id="ui-box" viewBox="0 0 24 24"><path d="M12 3l8 4v10l-8 4-8-4V7z"/><path d="M4 7l8 4 8-4M12 11v10"/></symbol>
<symbol id="ui-chat" viewBox="0 0 24 24"><path d="M20.5 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-4.4A8 8 0 1 1 20.5 11.5z"/><path d="M9 11h.01M12.5 11h.01M16 11h.01"/></symbol>
<symbol id="ui-tools" viewBox="0 0 24 24"><path d="M14.5 3.5a5 5 0 0 0-6 6L4 14v5.5h5.5L14 15a5 5 0 0 0 6-6l-3 3-3-3z"/></symbol>
<symbol id="ui-spark" viewBox="0 0 24 24"><path d="M12 3l2.2 5.6L20 11l-5.8 2.4L12 19l-2.2-5.6L4 11l5.8-2.4z"/></symbol>
<symbol id="ui-arrow" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></symbol>
<symbol id="ui-pin" viewBox="0 0 24 24"><path d="M12 21s7-5.3 7-11a7 7 0 1 0-14 0c0 5.7 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></symbol>
<symbol id="ui-wa" viewBox="0 0 24 24"><path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.6c.1-.2.2-.3.3-.5 0-.2 0-.4 0-.5 0-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.4 1.3 4.9L2 22l5.3-1.4c1.4.8 3 1.2 4.7 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z"/></symbol>
<symbol id="ui-share" viewBox="0 0 24 24"><circle cx="17" cy="5.5" r="2.6"/><circle cx="6.5" cy="12" r="2.6"/><circle cx="17" cy="18.5" r="2.6"/><path d="M8.9 10.8 14.6 6.9M8.9 13.2l5.7 3.9"/></symbol>
<symbol id="ui-link" viewBox="0 0 24 24"><path d="M10.6 13.4a3.6 3.6 0 0 0 5.4.4l2.4-2.4a3.6 3.6 0 0 0-5.1-5.1l-1.4 1.4"/><path d="M13.4 10.6a3.6 3.6 0 0 0-5.4-.4l-2.4 2.4a3.6 3.6 0 0 0 5.1 5.1l1.4-1.4"/></symbol>
<symbol id="ui-fb" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4.5"/><path d="M15.6 8.2h-1.3c-.9 0-1.5.6-1.5 1.5v1.6h2.7l-.4 2.7h-2.3V21"/></symbol>
<symbol id="ui-tg" viewBox="0 0 24 24"><path d="M21.4 3.6 2.9 10.6c-.4.2-.4.7 0 .8l4.6 1.6 1.8 5.5c.1.4.6.5.8.2l2.5-2.8 4.5 3.3c.3.2.8.1.9-.3l3.4-14.7c.1-.5-.4-.8-.8-.6z"/><path d="m7.5 13 11.9-8.5-8 10"/></symbol>
<symbol id="ui-mail" viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="m3.6 7.2 8.4 5.9 8.4-5.9"/></symbol>
<symbol id="ui-check" viewBox="0 0 24 24"><path d="m4.5 12.6 5 5 10-11"/></symbol>
<symbol id="ui-dots" viewBox="0 0 24 24"><circle cx="5.5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.5" fill="currentColor" stroke="none"/></symbol>
</svg>`;

  function inject() {
    var holder = document.createElement("div");
    holder.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    holder.innerHTML = SPRITE;
    document.body.insertBefore(holder.firstElementChild, document.body.firstChild);
    swapLogos();
  }

  /* מחליף את מקור תמונת הלוגו בקובץ הנקי (images/logo-dvirtech-transparent.png).
     נעשה כאן ולא ב-11 קבצי ה-HTML כדי לשנות במקום אחד. עד 10 באוגוסט זה
     בנה SVG מהשרטוט הווקטורי (#dvt-logo, עדיין מוגדר למעלה כגיבוי) —
     עכשיו שיש PNG שקוף אמיתי, מספיק לעדכן src. ה-span.footer-logo-crop
     שעטף את לוגו הפוטר נשאר במקומו בלי נזק; ה-CSS שלו כבר לא כולל את
     חיתוך ה-overflow הישן. */
  function swapLogos() {
    document.querySelectorAll("img.brand-logo, img.footer-logo").forEach(function (img) {
      img.src = "images/logo-dvirtech-transparent.png";
    });
  }

  if (document.body) inject();
  else document.addEventListener("DOMContentLoaded", inject);
})();

/* מיפוי קטגוריה בגיליון → איור. משמש את products.js וגם את דף הבית.
   קטגוריה שלא ברשימה מקבלת את איור המארז כברירת מחדל. */
var DVT_CAT_ICON = {
  cpu:"ic-cpu", mobo:"ic-mobo", ram:"ic-ram", gpu:"ic-gpu",
  cooling:"ic-cool", storage:"ic-storage", psu:"ic-psu", case:"ic-case",
  readyPc:"ic-desktop", peripherals:"ic-peri", services:"ic-service",
  monitor:"ic-monitor", laptop:"ic-laptop", keyboard:"ic-keyboard", accessories:"ic-acc",

  /* ⚠️ הושלם 19.08 כשהתפריט קיבל אייקונים: 12 מתוך 33 השורות נשארו
     בלי, כי המפתח בתפריט הוא הקטגוריה בגיליון ("extras", "caseFans")
     או תת-סוג ("external-drive"), ואלה לא היו במפה.
     ⚠️ אין איור ייעודי לעכבר/אוזניות/מצלמה, ולכן הם ממופים ל-ic-peri
     שהוא איור הציוד ההיקפי — קרוב מספיק, ועדיף על שורה בלי סמל
     שנראית כמו פריט מסוג אחר. */
  mouse:"ic-peri", headset:"ic-peri", webcam:"ic-peri", speakers:"ic-peri",
  microphone:"ic-peri", mousepad:"ic-peri",
  caseFans:"ic-cool", paste:"ic-cool",
  wifi:"ic-mobo",
  extras:"ic-acc",
  /* תת-סוגי האביזרים */
  "external-drive":"ic-storage", "flash-drive":"ic-storage",
  adapter:"ic-acc", "gpu-bracket":"ic-gpu", cable:"ic-acc",
  "case-glass":"ic-case", tools:"ic-acc"
};
/* ==================== תצלום קטגוריה ====================
   🔴 דביר: "אני לא רוצה סתם תמונות גנריות כאלה כמו עכשיו" — בתפריט
   העליון הוצגו איורי ה-sprite, ולאתר **כבר יש 13 תצלומי קטגוריה
   אמיתיים** שמשמשים את כרטיסי דף הבית.

   ⚠️ הם ישבו ב-`HOME_CAT_IMAGE` בתוך home.js, שנטען רק בדף הבית,
   ולכן התפריט — שמוזרק בכל דף — לא יכול היה להגיע אליהם. המפה עברה
   לכאן (sprite.js נטען בכל 12 הדפים), ו-home.js ממשיך להשתמש בה.

   ⚠️ מי שאין לו תצלום (תת-סוגים כמו "מאווררי מארז", "עכבר") נופל
   חזרה לאיור — עדיף איור מדויק מתצלום של קטגוריה אחרת. */
var DVT_CAT_PHOTO = {
  cpu:         "images/categories/cpu.jpg",
  gpu:         "images/categories/gpu.jpg",
  ram:         "images/categories/ram.jpg",
  mobo:        "images/categories/mobo.jpg",
  storage:     "images/categories/storage.jpg",
  psu:         "images/categories/psu.jpg",
  cooling:     "images/categories/cooling.jpg",
  "case":      "images/categories/case.jpg",
  monitor:     "images/categories/monitor.jpg",
  readyPc:     "images/categories/readyPc.jpg",
  peripherals: "images/categories/peripherals.jpg",
  laptop:      "images/categories/laptop.jpg",
  accessories: "images/categories/accessories.jpg"
};
function dvtCatPhoto(cat){ return DVT_CAT_PHOTO[cat] || null; }

function dvtIcon(cat){ return DVT_CAT_ICON[cat] || "ic-case"; }

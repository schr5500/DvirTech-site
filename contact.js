/* =====================================================================
   DvirTech — עמוד צור קשר (contact.html)
   =====================================================================
   שתי דרכי התקשרות אמיתיות: טלפון/וואטסאפ + אימייל (עומד בדרישת "לפחות
   שתי דרכי תקשורת" של חברת הסליקה). כולל גם כפתור "ביטול עסקה" נפרד וברור
   (נדרש מ-1 בינואר 2026 בתקנות הגנת הצרכן) שפותח הודעת וואטסאפ מוכנה מראש.
===================================================================== */

const CONTACT_WHATSAPP_NUMBER = "972502000373";
const CONTACT_EMAIL = "schr5500@gmail.com";

function renderContactPage(){
  { const _e=document.getElementById("navHome"); if(_e) _e.textContent = t("navHome"); }
  { const _e=document.getElementById("navReady"); if(_e) _e.textContent = t("navReady"); }
  { const _e=document.getElementById("navPeripherals"); if(_e) _e.textContent = t("navPeripherals"); }
  { const _e=document.getElementById("navComponents"); if(_e) _e.textContent = t("navComponents"); }
  { const _e=document.getElementById("navBuilder"); if(_e) _e.textContent = t("navBuilder"); }
  { const _e=document.getElementById("navLab"); if(_e) _e.textContent = t("navLab"); }
  { const _e=document.getElementById("navWhy"); if(_e) _e.textContent = t("navWhy"); }
  { const _e=document.getElementById("navContact"); if(_e) _e.textContent = t("navContact"); }

  document.getElementById("pageTitle").textContent = t("contactTitle");
  document.getElementById("pageSubtitle").textContent = t("contactSubtitle");

  document.getElementById("phoneLabel").textContent = t("contactPhoneLabel");
  document.getElementById("emailLabel").textContent = t("contactEmailLabel");

  const generalMsg = tr("היי דביר, יש לי שאלה כללית", "Hi Dvir, I have a general question");
  document.getElementById("whatsappBtn").href = `https://wa.me/${CONTACT_WHATSAPP_NUMBER}?text=${encodeURIComponent(generalMsg)}`;
  document.getElementById("whatsappBtn").textContent = t("contactWhatsappBtn");
  document.getElementById("callBtn").textContent = t("contactCallBtn");

  // ⚠️ לא mailto: — בלי תוכנת דואר מוגדרת בווינדוס הכפתור פשוט לא עושה
  // כלום, וזה המצב אצל רוב משתמשי Gmail. פותחים חלון כתיבה ב-Gmail.
  document.getElementById("emailBtn").href =
    `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONTACT_EMAIL)}`;
  document.getElementById("emailBtn").textContent = tr("כתוב לי במייל","Email me");

  // כותרות ותיאורים חדשים בכרטיסים
  const setTxt = (id, v) => { const e = document.getElementById(id); if(e) e.textContent = v; };
  setTxt("waTitle", tr("וואטסאפ — הדרך המהירה","WhatsApp — fastest"));
  setTxt("waDesc",  tr("שולחים הודעה ואני חוזר בהקדם. אפשר לצרף תמונות של התקלה או של המחשב.",
                       "Send a message and I'll get back to you. Feel free to attach photos of the issue."));
  setTxt("respLabel", tr("זמן תגובה","Response time"));
  setTxt("respText",  tr("בדרך כלל תוך מספר שעות בשעות הפעילות. בפניות דחופות — עדיף בטלפון.",
                         "Usually within a few hours during working hours. For anything urgent, calling is best."));

  // כפתורי "העתק" — עובדים תמיד, גם בלי תוכנת דואר או חייגן
  document.querySelectorAll(".ccard-copy").forEach(btn => {
    btn.textContent = tr("העתק","Copy");
    btn.onclick = async () => {
      try{
        await navigator.clipboard.writeText(btn.dataset.copy);
        const was = btn.textContent;
        btn.textContent = tr("הועתק ✓","Copied ✓");
        btn.classList.add("done");
        setTimeout(() => { btn.textContent = was; btn.classList.remove("done"); }, 1600);
      }catch(e){ /* דפדפן ללא הרשאת קליפבורד — הטקסט ממילא מוצג ליד */ }
    };
  });

  document.getElementById("hoursLabel").textContent = t("contactHoursLabel");
  document.getElementById("hoursText").textContent = t("contactHoursText");
  document.getElementById("areaLabel").textContent = t("contactAreaLabel");
  document.getElementById("areaText").textContent = t("contactAreaText");

  document.getElementById("cancelTitle").textContent = t("contactCancelTitle");
  document.getElementById("cancelText").textContent = t("contactCancelText");
  const cancelMsg = tr(
    "היי דביר, אני מעוניין/ת בביטול עסקה. פרטי ההזמנה: [תאריך ההזמנה / מה הוזמן]",
    "Hi Dvir, I'd like to cancel an order. Order details: [order date / what was ordered]"
  );
  document.getElementById("cancelBtn").href = `https://wa.me/${CONTACT_WHATSAPP_NUMBER}?text=${encodeURIComponent(cancelMsg)}`;
  document.getElementById("cancelBtn").textContent = t("contactCancelBtn");

  document.getElementById("footerText").textContent = t("footerText");
  renderFooterLegal();
  document.querySelectorAll(".lang-btn").forEach(b => b.classList.toggle("active", b.dataset.lang === LANG));
}

function setLang(lang){
  if(lang === LANG) return;
  setLangCore(lang);
  renderContactPage();
}

renderContactPage();

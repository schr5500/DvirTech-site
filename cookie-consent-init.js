/* =====================================================================
   DvirTech — הסכמת עוגיות + Google Consent Mode v2 (cookie-consent-init.js)
   =====================================================================
   בקשת דביר (29.08): "צריך להוסיף את זה לאתר + לחבר לגוגל… וברגע
   שהמשתמש אישר — לתת אור ירוק לגוגל/פייסבוק. מקצועי וע"פ חוק."

   הספרייה: CookieConsent v3 של orestbida (MIT) — **באחסון עצמי**
   ב-Web/vendor/ (בלי CDN בזמן ריצה: פרטיות, מהירות, ואין תלות בצד
   שלישי). הטעינה: site-header.js מזריק את הקבצים בכל דף.

   🔴 **מה המצב העובדתי היום, ולמה זה קובע את העיצוב:**
   לאתר אין כרגע שום עוגיית מעקב — אין Analytics, אין פיקסלים, אין
   פרסום (תקנון §10.4). לכן שתי הקטגוריות הנבחרות ("סטטיסטיקה",
   "שיווק") הן **הכנה לעתיד**: הבחירה של הגולש נשמרת ומתורגמת
   לאותות Consent Mode, וברגע שדביר יוסיף GA4/פיקסל — הם יכבדו את
   מה שכבר נבחר, בלי לשנות שורת קוד כאן.

   🔴 **Google Consent Mode v2 — הסדר קריטי:** ברירת המחדל "denied"
   נשלחת כאן, לפני כל סקריפט של גוגל שייתכן ויתווסף בעתיד. הקובץ
   הזה חייב להיטען לפני כל תג gtag/GTM עתידי (site-header מזריק
   אותו מוקדם — לשמור על זה).

   ⚠️ עוגיית ההעדפה עצמה (cc_cookie) היא עוגיה הכרחית — מותרת בלי
   הסכמה לפי כל המשטרים (היא זוכרת את הסירוב…).
   ⚠️ ניסוחי הבאנר בעברית ובאנגלית לפי שפת האתר; RTL אוטומטי.
   ===================================================================== */

/* ---------- Consent Mode v2: ברירת מחדל — הכל דחוי ---------- */
window.dataLayer = window.dataLayer || [];
function gtag(){ window.dataLayer.push(arguments); }
gtag("consent", "default", {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
  functionality_storage: "granted",   /* עגלה/שפה — הכרחי לתפעול */
  security_storage: "granted",
  wait_for_update: 500
});
/* פייסבוק (עתידי): fbq('consent','revoke') עד להסכמה — הפונקציה
   תיקרא רק אם הפיקסל יתווסף אי-פעם. */
if (typeof window.fbq === "function") { try { window.fbq("consent", "revoke"); } catch (e) {} }

function dvtConsentSync_(){
  try{
    const cc = window.CookieConsent;
    if (!cc) return;
    const analytics = cc.acceptedCategory("analytics");
    const marketing = cc.acceptedCategory("marketing");
    gtag("consent", "update", {
      analytics_storage: analytics ? "granted" : "denied",
      ad_storage: marketing ? "granted" : "denied",
      ad_user_data: marketing ? "granted" : "denied",
      ad_personalization: marketing ? "granted" : "denied"
    });
    if (typeof window.fbq === "function") {
      try { window.fbq("consent", marketing ? "grant" : "revoke"); } catch (e) {}
    }
  }catch(e){ /* הסכמה לעולם לא מפילה דף */ }
}

/* ---------- הפעלת הבאנר ---------- */
function dvtCookieInit(){
  const cc = window.CookieConsent;
  if (!cc || dvtCookieInit._done) return;
  dvtCookieInit._done = true;

  let lang = "he";
  try { lang = localStorage.getItem("dvirtech_lang") || "he"; } catch (e) {}

  cc.run({
    /* הקטגוריות מפעילות/חוסמות סקריפטים עתידיים שיסומנו
       data-category="analytics|marketing" — התקן של הספרייה. */
    categories: {
      necessary: { readOnly: true },
      analytics: {
        autoClear: { cookies: [{ name: /^_ga/ }, { name: "_gid" }] }
      },
      marketing: {
        autoClear: { cookies: [{ name: /^_fb/ }, { name: "_gcl_au" }] }
      }
    },

    guiOptions: {
      consentModal: { layout: "box inline", position: "bottom right", equalWeightButtons: true, flipButtons: false },
      preferencesModal: { layout: "box", equalWeightButtons: true }
    },

    onConsent: dvtConsentSync_,
    onChange: dvtConsentSync_,

    language: {
      default: lang === "en" ? "en" : "he",
      rtl: "he",
      translations: {
        he: {
          consentModal: {
            title: "🍪 קצת שקיפות על עוגיות",
            description:
              "האתר משתמש באחסון הכרחי בלבד (עגלה, שפה, חשבון). עוגיות סטטיסטיקה ושיווק " +
              "יופעלו רק אם תאשרו — וכרגע אנחנו אפילו לא מפעילים כאלה. הבחירה נשמרת וניתנת " +
              "לשינוי בכל רגע.",
            acceptAllBtn: "אישור הכל",
            acceptNecessaryBtn: "הכרחי בלבד",
            showPreferencesBtn: "הגדרות",
            footer: '<a href="privacy.html">מדיניות פרטיות</a> <a href="terms.html">תקנון</a>'
          },
          preferencesModal: {
            title: "העדפות עוגיות",
            acceptAllBtn: "אישור הכל",
            acceptNecessaryBtn: "הכרחי בלבד",
            savePreferencesBtn: "שמירת הבחירה",
            closeIconLabel: "סגירה",
            sections: [
              {
                title: "איך זה עובד",
                description:
                  "בחירה כאן קובעת אילו כלים מותר לאתר להפעיל בדפדפן שלכם. אפשר לחזור ולשנות " +
                  "בכל עת דרך «🍪 הגדרות עוגיות» שבתחתית האתר."
              },
              {
                title: "הכרחי לתפעול",
                description:
                  "עגלת הקניות, העדפת השפה, וחיבור לחשבון. בלעדיהם האתר פשוט לא עובד. לא כולל מעקב.",
                linkedCategory: "necessary"
              },
              {
                title: "סטטיסטיקה",
                description:
                  "מדידת שימוש אנונימית (למשל Google Analytics) — כדי להבין אילו עמודים עוזרים. " +
                  "נכון להיום האתר אינו מפעיל כלי כזה; ההעדפה תכובד אם יופעל.",
                linkedCategory: "analytics"
              },
              {
                title: "שיווק",
                description:
                  "עוגיות פרסום (Google Ads / Meta) למדידת קמפיינים והתאמת מודעות. נכון להיום " +
                  "האתר אינו מפעיל כלי כזה; ההעדפה תכובד אם יופעל.",
                linkedCategory: "marketing"
              },
              {
                title: "עוד פרטים",
                description:
                  'הפירוט המלא — ב<a href="privacy.html">מדיניות הפרטיות</a> ובתקנון (§10.4). ' +
                  'שאלות? וואטסאפ 050-200-0373.'
              }
            ]
          }
        },
        en: {
          consentModal: {
            title: "🍪 A word about cookies",
            description:
              "This site uses essential storage only (cart, language, account). Analytics and " +
              "marketing cookies run only if you approve — and right now we do not even use any. " +
              "You can change your choice at any time.",
            acceptAllBtn: "Accept all",
            acceptNecessaryBtn: "Essential only",
            showPreferencesBtn: "Settings",
            footer: '<a href="privacy.html">Privacy policy</a> <a href="terms.html">Terms</a>'
          },
          preferencesModal: {
            title: "Cookie preferences",
            acceptAllBtn: "Accept all",
            acceptNecessaryBtn: "Essential only",
            savePreferencesBtn: "Save choice",
            closeIconLabel: "Close",
            sections: [
              { title: "How this works",
                description: "Your choice controls which tools the site may run in your browser. Change it any time via “🍪 Cookie settings” in the footer." },
              { title: "Essential", description: "Cart, language, account sign-in. No tracking.", linkedCategory: "necessary" },
              { title: "Analytics", description: "Anonymous usage measurement (e.g. Google Analytics). Not currently active; your preference will be honoured if enabled.", linkedCategory: "analytics" },
              { title: "Marketing", description: "Advertising cookies (Google Ads / Meta). Not currently active; your preference will be honoured if enabled.", linkedCategory: "marketing" },
              { title: "More", description: 'Full details in the <a href="privacy.html">privacy policy</a> and terms (§10.4).' }
            ]
          }
        }
      }
    }
  });
}

/* פתיחת ההעדפות מכל מקום (הקישור בפוטר). */
function dvtCookiePrefs(){
  try { if (window.CookieConsent) window.CookieConsent.showPreferences(); } catch (e) {}
}

/* =====================================================================
   DvirTech — תקנון האתר (terms.html)
   =====================================================================
   🔴🔴 אזהרה — לקרוא לפני שנוגעים בקובץ הזה
   ---------------------------------------------------------------------
   דביר ביקש מפורשות לתעד ולהזכיר: **GPT המליץ להתייעץ עם עו"ד לפני
   השקה.** הטקסט כאן נוסח על ידי מודל שפה, מתוך אימות מול מקורות דין
   (ראה DVT-TERMS-REVIEW.md בשורש הפרויקט) — אבל **הוא אינו ייעוץ
   משפטי.** אסור להתחיל למכור בפועל דרך האתר לפני שעו"ד ישראלי
   (צרכנות / מסחר אלקטרוני) עבר על הנוסח.

   כל מקום שמסומן בטקסט כ"⚠️ לאישור עו״ד" הוא נקודה שלא ניתן היה
   להכריע בה מתוך מקורות פתוחים, ולכן היא **מנוסחת בזהירות ולא כאילו
   היא סופית**. אל תסיר את הסימונים האלה בלי אישור בפועל.

   ---------------------------------------------------------------------
   ⚠️ הכלל שקובע מה מותר לכתוב כאן
   ---------------------------------------------------------------------
   **התקנון מתאר את מה שהמערכת באמת עושה — לא את מה שנחמד להבטיח.**
   תקנון שמבטיח משהו שהקוד לא מבצע גרוע מתקנון חסר. כל עובדה כאן
   נגזרה מקובץ אמיתי, ואלה המקורות:
     • קבלה (DocumentType 2) ולא חשבונית מס .... 4-payment-api.gs:84-86
     • סליקת SUMIT/UPAY בדף חיצוני ............. 4-payment-api.gs / checkout.js:38
     • 1-3 תשלומים ללא עמלה, 4+ עם עמלה ........ checkout.js:18-45
     • משלוח 29/49/0 ₪ + זמנים ................. checkout.js:229-237
     • איסוף עצמי באבן שמואל ................... checkout.js:230
     • שירותים שנמכרים בקופה ................... checkout.js:315-329
     • מלאי ומחירים מסונכרנים כל ~15 דקות ...... 4-payment-api.gs:270,676
     • אחריות פר-מוצר מהספק .................... product.js:455-472
     • ניסוחים חוזרים (משלוח/אחריות/תשלומים) ... site-content.js
   אם אחד מהם משתנה — הסעיף כאן חייב להשתנות איתו.

   מבנה: TERMS_SECTIONS.he / .en — כל סעיף הוא { title, html } כדי
   שיהיה קל להוסיף/לערוך סעיף אחד בלי לגעת בשאר. שתי הרשימות חייבות
   להישאר באותו סדר ובאותו מספור, אחרת הפניה פנימית ("ראה סעיף 8.5")
   תשלח את הקורא האנגלי לסעיף אחר.
===================================================================== */

/* סימון אחיד לנקודה שממתינה לעו"ד. פונקציה ולא מחרוזת קבועה כדי
   ששתי השפות ייראו זהות ויהיה אפשר למצוא את כולן בגריפ אחד. */
/* ⚠️ **הסימונים אינם מוצגים ללקוח — החלטת דביר, 16.08.2026.**
   "⚠️ לאישור עו״ד" באמצע תקנון משדר ללקוח שהמסמך לא גמור, וזה פוגע
   באמון בלי להוסיף לו שום זכות: כל הנקודות האלה כבר מנוסחות בזהירות
   ובכפוף לדין, והדין גובר עליהן ממילא (סעיף 1).

   ⚠️ **הסימונים לא נמחקו — הם רוקנו.** המחרוזות ריקות, אבל כל שמונה
   המופעים נשארים במקומם בקוד, ולכן:
     • `grep LEGAL_TODO_HE Web/terms.js` עדיין מראה בדיוק אילו סעיפים
       ממתינים לעו"ד ואיפה הם יושבים;
     • החזרת התצוגה היא שינוי של שתי שורות כאן, בלי לגעת בטקסט.
   הרשימה המלאה לעו"ד נשארת ב-DVT-TERMS-REVIEW.md סעיף 5 — **שם**
   המעקב, לא מול הלקוח. */
const LEGAL_TODO_HE = '';
const LEGAL_TODO_EN = '';

const TERMS_SECTIONS = {

  he: [
    {
      title: "1. פרטי בית העסק ותחולת התקנון",
      html: `<p>אתר זה (״האתר״) מופעל על ידי <b>דביר פרץ</b>, <b>עוסק פטור</b>, מס׳ עוסק 322999582 (״DvirTech״ או ״בית העסק״).</p>
             <p>בית העסק הוא עסק מקוון ו<b>אינו מפעיל חנות פיזית הפתוחה לקהל</b>. איסוף עצמי אפשרי מ<b>אבן שמואל</b>, בתיאום מראש בלבד. ביקורי טכנאי מתבצעים באזור קריית גת והסביבה, ולפי זמינות גם באזור השפלה והמרכז — בתיאום מועד מראש; משלוחי מוצרים — לכל הארץ.</p>
             <p>זמינות: ימים א׳–ה׳ 09:00–19:00, יום ו׳ 09:00–14:00. אין עבודה בשבתות ובחגים. יצירת קשר: טלפון/וואטסאפ 050-200-0373, דוא״ל schr5500@gmail.com — פרטים מלאים בעמוד <a href="contact.html">צור קשר</a>.</p>
             <p>הגלישה באתר ו/או ביצוע הזמנה דרכו מהווים הסכמה לתנאי תקנון זה. אם אינך מסכים לתנאי מתנאיו, נא להימנע משימוש באתר.</p>
             <p><b>הדין גובר.</b> בכל מקום שבו הוראה בתקנון זה סותרת הוראת דין שאינה ניתנת להתניה — ובפרט חוק הגנת הצרכן, תשמ״א-1981 והתקנות מכוחו — <b>הוראת הדין גוברת</b>, והסעיף כאן יפורש במידה הנדרשת כדי להתיישב עם הדין. אין בתקנון זה כדי לגרוע מזכות המוקנית לצרכן לפי דין.</p>
             <p>הוראות חוק הגנת הצרכן חלות על ״צרכן״ כהגדרתו בחוק. רכישה הנעשית במסגרת פעילות עסקית, מסחרית או מקצועית עשויה להיות כפופה להוראות שונות ולא להיות מוגנת באותו אופן. <b>הסיווג אינו נקבע לפי סימון תיבה בעמוד התשלום אלא לפי הנסיבות ומטרת הרכישה בפועל.</b> ${LEGAL_TODO_HE}</p>`
    },
    {
      title: "2. מוצרים, מידע באתר, מלאי ומחירים",
      html: `<p>האתר מציג מחשבים מוכנים, מחשבים ניידים, רכיבי חומרה וציוד היקפי, וכן כלי ״בונה מחשבים״ להגדרת הרכבה בהתאמה אישית.</p>
             <p><b>מלאי ומחירים.</b> נתוני המלאי והמחירים מסונכרנים אוטומטית מהספק <b>אחת לכ-15 דקות</b>. למרות זאת ייתכן פער בין המוצג באתר לבין המצב בפועל אצל הספק. מחיר וזמינות המוצגים באתר אינם התחייבות מוחלטת עד לאישור ההזמנה. אם התגלה פער מהותי במחיר או בזמינות, בית העסק ייצור קשר עם הלקוח ויאפשר לו לאשר את המחיר המעודכן או לבטל את ההזמנה <b>ללא כל עלות</b>.</p>
             <p>אם לאחר אישור ההזמנה מתברר שהמוצר אזל ואינו ניתן לאספקה, בית העסק יודיע ללקוח בהקדם, ינסה בתום לב להשיגו מספק חלופי, ואם לא ניתן — יבצע השבה מלאה של הסכום ששולם בהתאם לדין.</p>
             <p><b>הרכבות בהתאמה אישית.</b> עבור הרכבה שהוגדרה בבונה המחשבים, האתר מציג <b>הצעת מחיר</b> בתוקף ל-7 ימים ממועד הצגתה. המחיר הסופי נבדק מול הספקים בעת ביצוע ההזמנה. תחילת ביצוע ההזמנה (רכישת הרכיבים בפועל אצל הספקים) מותנית בתשלום מלוא סכום העסקה מראש.</p>
             <p><b>תמונות להמחשה בלבד.</b> התמונות באתר, לרבות תמונות מוצרים, קטגוריות ובאנרים, הן להמחשה ולהתרשמות כללית בלבד. ייתכנו הבדלים בין התמונה לבין המוצר בפועל — בגוון, בגימור, באריזה, באביזרים הנלווים ובגרסת הדגם. <b>המפרט הטכני הכתוב לצד המוצר הוא המחייב</b>, ובכל מקרה של אי-התאמה בין התמונה לבין המפרט הכתוב — המפרט הכתוב גובר. סימני מסחר, תמונות ומפרטי יצרנים שייכים לבעליהם.</p>`
    },
    {
      title: "3. מעמד עוסק פטור ומסמכי עסקה",
      html: `<p>בית העסק הוא <b>עוסק פטור</b> ואינו גובה מהלקוח מע״מ בנפרד. <b>למחירים המוצגים באתר לא מתווסף מע״מ</b>, והם המחירים שהלקוח נדרש לשלם עבור המוצר או השירות עצמו. לסכום העסקה מתווספים רק סכומים שהלקוח בוחר במפורש ורואה על המסך לפני האישור: דמי משלוח (סעיף 5.1), ועמלת תשלומים בבחירת 4 תשלומים ומעלה (סעיף 4).</p>
             <p><b>על כל עסקה באתר מופקת קבלה — ולא חשבונית מס.</b> עוסק פטור אינו רשאי להפיק חשבונית מס, ובית העסק אינו מציג עצמו כמי שגובה מע״מ ואינו מנפיק מסמך שאינו רשאי להנפיק.</p>
             <p>הקבלה מופקת אוטומטית עם השלמת התשלום ונשלחת לכתובת הדוא״ל שנמסרה בעמוד התשלום. לקוח שסימן ״עסק/חברה״ והזין שם חברה — שם החברה יופיע על הקבלה כשם המשלם; <b>סוג המסמך אינו משתנה</b> ונשאר קבלה.</p>
             <p>המחיר הקובע לעסקה הוא המחיר שהוצג ואושר בעמוד התשלום, בכפוף לסעיף 13 (טעויות).</p>`
    },
    {
      title: "4. תשלום, סליקה ותשלומים",
      html: `<p><b>סליקה חיצונית מאובטחת.</b> התשלום אינו מתבצע באתר עצמו. עם אישור ההזמנה מופנה הלקוח ל<b>דף סליקה מאובטח חיצוני</b> המופעל על ידי חברת הסליקה (SUMIT/UPAY). <b>פרטי כרטיס האשראי אינם עוברים דרך האתר, אינם נראים לבית העסק ואינם נשמרים אצלו</b> — הם מוזנים ומעובדים מול חברת הסליקה בלבד.</p>
             <p><b>מספר תשלומים.</b> ניתן לבחור עד <b>12 תשלומים</b> בעמוד התשלום.</p>
             <p><b>1 עד 3 תשלומים — ללא כל עמלה.</b> הסכום שייגבה זהה למחיר המוצג, ללא תוספת כלשהי.</p>
             <p><b>4 תשלומים ומעלה — עמלת תשלומים.</b> בחירה ב-4 תשלומים ומעלה היא בחירה אופציונלית של הלקוח, וכרוכה בעמלה המשקפת את עלות המימון בפועל. העמלה מחושבת <b>לכל חודש תשלום</b> (ולכן 6 תשלומים עולים יותר מ-4), בתוספת רכיב הקצאת אשראי של עד 1% בתקרה קבועה — בהתאם לתעריפי חברת הסליקה בפועל — ומוצגת ללקוח <b>בסכום שקלי מדויק, יחד עם הסכום הכולל לתשלום, לפני</b> אישור העסקה — ולא לאחריו.</p>
             <p><b>לא ייגבה מהלקוח סכום שלא הוצג לו על המסך לפני אישור העסקה, ולא ייגבה סכום העולה על הסכום הכולל שהוצג ואושר על ידו.</b></p>
             <p>אופן הצגת העמלה ותאימותו המלאה לדרישות ״המחיר הכולל״ שבחוק הגנת הצרכן — ${LEGAL_TODO_HE}</p>
             <p>המעבר לדף התשלום מותנה בסימון תיבת אישור פעילה, המעידה כי הלקוח קרא ומסכים לתקנון זה (ראה סעיף 17).</p>`
    },
    {
      title: "5. אספקה: משלוח, איסוף עצמי וביקור טכנאי",
      html: `<p><b>5.1 משלוח.</b> המשלוח מתבצע באמצעות <b>חברת שילוח חיצונית</b>, בשתי אפשרויות הנבחרות בעמוד התשלום: <b>משלוח רגיל — 29 ₪, טווח משוער 3-7 ימי עסקים</b>; <b>משלוח מהיר — 49 ₪, טווח משוער 2-5 ימי עסקים</b>. המחיר וזמן האספקה המוצגים בעמוד התשלום במועד ביצוע ההזמנה הם המחייבים.</p>
             <p>בית העסק רשאי להסתייע בחברת שילוח אחת או יותר ולהחליפן מעת לעת, ולכן <b>אין בתקנון זה התחייבות לחברת שילוח מסוימת</b>; זהות החברה שדרכה נשלחה ההזמנה תימסר באתר או בפרטי ההזמנה, ככל שהדבר רלוונטי. <b>אין במסירת המשלוח לחברת שילוח חיצונית כדי לגרוע מאחריות בית העסק כלפי הלקוח לפי דין.</b> ${LEGAL_TODO_HE}</p>
             <p><b>5.2 מתי מתחילה הספירה.</b> ספירת ימי האספקה מתחילה <b>מיום העסקים שלאחר אישור ההזמנה והסדרת התשלום</b> — <b>יום ביצוע ההזמנה עצמו אינו נספר</b>. הזמנה שבוצעה בסוף יום עסקים, בשבת, בחג או ביום שבתון תיחשב כאילו נתקבלה ביום העסקים הבא. הסיבה: התשלום נקלט בפועל ביום העסקים שלאחר ההזמנה, ורק אז ניתן להזמין את הרכיב מהספק. <b>הימים נספרים בימי עסקים</b>, ואינם כוללים שבתות, חגים וימי שבתון. הספירה מותנית גם בזמינות המוצר למשלוח; הזמנות הכוללות רכיבים שיש להזמין מספק תלויות בזמינות אצל הספק, והערכת זמן תימסר ללקוח מראש ככל הידוע.</p>
             <p><b>5.3 איסוף עצמי.</b> איסוף עצמי אפשרי <b>ללא עלות</b>, מ<b>אבן שמואל</b>, <b>בתיאום מראש בלבד</b>. אין מדובר בחנות פתוחה לקבלת קהל, ואין להגיע ללא תיאום. על הלקוח להגיע במועד שתואם ולהציג פרטי הזמנה. לא נאסף מוצר בתוך זמן סביר לאחר הודעת מוכנות — בית העסק יתאם מועד חדש.</p>
             <p><b>5.4 ביקור טכנאי.</b> ביקור בית, התקנה בעמדת הלקוח, אבחון ותיקון <b>אינם נרכשים דרך האתר</b> — ראה סעיף 6.</p>
             <p><b>5.5 מסירה ועיכובים.</b> המסירה תתבצע לכתובת שמסר הלקוח; טעות בכתובת עלולה לגרום לעיכוב או לעלות נוספת, בכפוף לדין. בעת קבלת המשלוח מומלץ לבדוק את האריזה, ולצלם ולדווח לבית העסק בהקדם על נזק חיצוני משמעותי. זמני האספקה משוערים ואינם כוללים עיכובים שאינם בשליטת בית העסק (עיכוב ספק או חברת שילוח, שביתה, מצב חירום או כוח עליון); בעיכוב מהותי בית העסק יעדכן את הלקוח ויפעל למצוא פתרון בהתאם לדין.</p>`
    },
    {
      title: "6. שירותים נלווים ותמיכה",
      html: `<p><b>6.1 שירותים שניתן לרכוש בעמוד התשלום.</b> לצד המוצרים ניתן להוסיף להזמנה שירותים מוגדרים, שמחירם מוצג לצדם: התקנת Windows 11 עם רישיון, או התקנת Windows ללא רישיון — <b>רק כאשר ההזמנה כוללת מחשב</b>; התקנת תוכנות; העברת נתונים מהמחשב הישן; ניקוי פנימי והחלפת משחה תרמית. כל שירות שנרכש מופיע כשורה נפרדת בקבלה. רשימת השירותים המוצעים בעמוד התשלום עשויה להשתנות מעת לעת, והמחייב הוא מה שמוצג בעמוד התשלום במועד ההזמנה.</p>
             <p><b>6.2 שירותים שאינם נרכשים דרך האתר.</b> שירותים הכרוכים בהגעה פיזית, בתיאום אישי או בהערכת התקלה מראש — <b>ביקור בית, התקנת מחשב בעמדת הלקוח, אבחון תקלה ותיקון, וכן תמיכה מרחוק</b> — <b>אינם נמכרים דרך האתר</b>. יש לפנות דרך עמוד <a href="support.html">שירות ותמיכה</a>; המחיר נגזר מהמרחק ומהעבודה בפועל, ויאושר מול הלקוח <b>לפני</b> תחילת העבודה.</p>
             <p><b>6.3 אם העבודה מתבררת כשונה.</b> אם בפועל נדרשת עבודה שונה ממה שתואר בפנייה, בית העסק יעדכן את הלקוח על הצורך ועל התמחור <b>לפני</b> שהוא ממשיך.</p>
             <p><b>6.4 הרכבה ללא עלות.</b> הטבת ההרכבה ללא עלות ניתנת על הרכבות שהוגדרו ונרכשו דרך <a href="builder.html">בונה המחשבים</a> שבאתר, שכן רק שם נבדקת ההתאמה בין הרכיבים. רכישת רכיבים בודדים בנפרד אינה מזכה אוטומטית בהטבה זו. <b>ההטבה היא הנחה על מחיר שירות ההרכבה</b>, הניתנת משום שהרכיבים נרכשו דרך בית העסק — <b>ואין בה כדי לאחד את הרכיבים ואת השירות למוצר אחד</b>. השירות ממשיך להופיע כשורה נפרדת במסמך העסקה, גם כשמחירו 0 ₪ (ראה סעיף 7.2).</p>
             <p><b>6.5 מחירי שירות.</b> מחירי השירותים מופיעים בעמוד <a href="support.html">שירות ותמיכה</a> ובעמוד התשלום, והם המחירים המחייבים במועד ההזמנה. תקנון זה אינו מחירון ואינו נועל מחיר.</p>
             <p><b>6.6 חבילות DvirTech Care.</b> בית העסק מציע, בהתאם לזמינותו ולשיקול דעתו, חבילות ליווי ותחזוקה לתקופה של <b>12 חודשים</b> (CARE / PLUS / PRO). המסלולים, מחיריהם והשירותים וההטבות הכלולים בהם מפורטים בעמוד <a href="support.html#care">שירות ותמיכה</a>, והמפורט שם במועד ההצטרפות הוא המחייב. ההצטרפות אינה מתבצעת ברכישה אוטומטית באתר אלא <b>בתיאום מראש ובאישור בית העסק</b>; התשלום — בתשלום אחד או בפריסה לתשלומים, כפי שיסוכם בעת ההצטרפות, והפריסה אינה משנה את תקופת הזכאות.</p>
             <p>הטבות החבילה אישיות ללקוח הרשום כמנוי פעיל ומותנות בתשלום כסדרו; הן אינן ניתנות להעברה, לצבירה משנה לשנה, להמרה לכסף או למימוש רטרואקטיבי. ההנחות חלות על שירותים הזכאים לכך בלבד — לא על חומרה, מוצרים, חלקי חילוף, תוכנות, רישיונות, משלוחים או תשלומים לצדדים שלישיים — וימומשו בעת תיאום השירות מול בית העסק. מימוש שירות הכלול במכסה (לרבות שעות תמיכה ובדיקות תחזוקה) נעשה <b>לבקשת הלקוח</b> ובתיאום מראש; בית העסק אינו מחויב ליזום פנייה. שירות החורג מהמכסה יחויב לפי המחירון שבתוקף, לאחר עדכון הלקוח.</p>
             <p>קדימות בשירות היא העדפה תפעולית בלבד ואינה התחייבות לזמן תגובה או פתרון. <b>החבילה אינה אחריות על חומרה</b>, אינה מאריכה או משנה אחריות יצרן או יבואן, ואינה גורעת מזכות שבדין. בית העסק רשאי לעדכן את תנאי החבילות ומחיריהן עבור הצטרפויות חדשות, בכפוף לדין; ביטול, שינוי מסלול או סיום ייעשו בהתאם לתנאים שנמסרו בעת ההצטרפות ולהוראות הדין.</p>`
    },
    {
      title: "7. אחריות",
      html: `<p><b>7.1 אחריות על מוצרים וחומרה — משתנה מוצר למוצר.</b> תקופת האחריות והגורם הנותן אותה <b>אינם אחידים</b> באתר: הם נשלפים מהספק/היבואן ומוצגים <b>בדף כל מוצר בנפרד</b>. <b>אין באתר הבטחה גורפת לתקופת אחריות אחידה לכל המוצרים.</b> מוצר שלא מוצגת לצדו אחריות — יש לברר את תנאיו מול בית העסק לפני הרכישה.</p>
             <p><b>7.2 רכיבים ושירות הרכבה — שני דברים נפרדים.</b> הרכיבים נמכרים ללקוח <b>כפי שהם</b>, במצבם ובאריזתם המקוריים מאת היצרן/היבואן, ללא כל שינוי, עיבוד או ייצור מצד בית העסק. <b>הלקוח הוא שבוחר את הרכיבים</b>, והוא רשאי לקבלם כמות שהם — ארוזים ולא מורכבים. <b>בית העסק אינו מייצר את רכיבי החומרה, אינו משנה את אופן ייצורם ואינו משנה את מפרטם.</b></p>
             <p>״שירות הרכבת מחשב״ הוא <b>שירות נפרד</b> המוזמן לבקשת הלקוח עבור רכיבים שנרכשו במסגרת העסקה, בדיוק כפי שניתן להזמינו עבור רכיבים שנרכשו במקום אחר. <b>הלקוח בוחר את הרכיבים ואת שירות ההרכבה בנפרד זה מזה.</b> השירות כולל הרכבה פיזית של הרכיבים, חיבורם, בדיקה בסיסית של תקינות ההרכבה והפעלת המערכת, בהתאם להיקף השירות שנרכש.</p>
             <p><b>ההפרדה משתקפת גם במסמך העסקה:</b> כל רכיב מופיע ב<b>שורה נפרדת</b> עם מחירו, ושירות ההרכבה מופיע ב<b>שורה נפרדת משלו</b>. אין מכירה של ״מחשב מורכב״ כמוצר אחד בעל מחיר אחד. תנאי הזכאות להטבת הרכבה ללא עלות מפורטים בסעיף 6.4.</p>
             <p><b>7.3 אחריות על הרכיבים.</b> הרכיבים השונים המסופקים במסגרת העסקה כפופים לאחריות החלה עליהם בהתאם להוראות הדין ולתנאי האחריות של היצרן ו/או היבואן הרלוונטי. <b>בית העסק מוסר ללקוח את תעודות האחריות והמסמכים שצורפו לרכיבים על ידי היצרן/היבואן</b>, כפי שהתקבלו ובמרוכז. ככל שנדרש, העסק יסייע ללקוח באיתור גורם השירות הרלוונטי ובהתנהלות מולו, בהתאם להוראות הדין.</p>
             <p><b>7.4 אחריות על שירות ההרכבה.</b> בכפוף להוראות כל דין, האחריות על שירות ההרכבה תינתן למשך <b>90 ימים (3 חודשים)</b> ממועד אספקת המוצר ללקוח. האחריות תתייחס לתקלות הנובעות במישרין מביצוע לקוי של עבודת ההרכבה הפיזית שבוצעה על ידי העסק.</p>
             <p>אחריות זו אינה חלה על תקלות או נזקים שמקורם ברכיב חומרה, בתוכנה, במערכת ההפעלה, בווירוסים או בנוזקות, בשינויים או בעדכוני תוכנה שבוצעו במערכת לאחר ההרכבה, בשימוש שאינו בהתאם להוראות היצרן, לרבות ביצוע המהרה (Overclocking), בנזק פיזי כגון שבר, מכה או נזק שנגרם כתוצאה מנוזלים או קורוזיה, או בכל גורם אחר שאינו קשור במישרין לעבודת ההרכבה שבוצעה על ידי העסק, והכול בכפוף להוראות כל דין.</p>
             <p><b>7.5 שמירת זכויות לפי דין.</b> <b>אין בסעיף 7 זה, ואין בתקנון כולו, כדי לגרוע מזכות אחריות המוקנית ללקוח לפי דין</b>, לרבות לפי חוק הגנת הצרכן, תשמ״א-1981 ותקנותיו. תקופת 90 הימים שבסעיף 7.4 היא התחייבות חוזית של בית העסק ביחס לעבודת ההרכבה בלבד — היא <b>אינה מקצרת ואינה מחליפה</b> אחריות יצרן, אחריות יבואן או אחריות שהדין מקנה על הרכיבים עצמם.</p>`
    },
    {
      title: "8. ביטול עסקה, החזרות והחזרים",
      html: `<p><b>8.1 מוצר מוגמר — 14 יום.</b> לקוח שרכש מוצר מוגמר (מחשב מוכן, מחשב נייד, רכיב בודד או ציוד היקפי) רשאי לבטל את העסקה בתוך <b>14 ימים</b> מיום קבלת המוצר <b>או</b> מיום קבלת מסמך פרטי העסקה — <b>לפי המאוחר מביניהם</b>, בהתאם לסעיף 14ג לחוק הגנת הצרכן, תשמ״א-1981.</p>
             <p><b>8.2 תקופת ביטול מורחבת — 4 חודשים.</b> לקוח שהוא <b>אדם עם מוגבלות</b>, <b>מי שמלאו לו 65 שנים</b>, או <b>עולה חדש</b> (עד 5 שנים ממועד הזכאות), רשאי לבטל את העסקה בתוך <b>4 חודשים</b> ממועד העסקה, קבלת המוצר או קבלת מסמך פרטי העסקה — לפי המאוחר — <b>ובלבד שההתקשרות כללה שיחה</b> בין הלקוח לבין בית העסק, לרבות תקשורת אלקטרונית (סעיף 14ג1 לחוק). בית העסק רשאי לבקש מסמך המעיד על הזכאות.</p>
             <p><b>8.3 דמי ביטול.</b> בביטול שאינו עקב פגם, אי-התאמה או הפרה, רשאי בית העסק לגבות דמי ביטול בשיעור <b>הנמוך מבין 5% ממחיר העסקה או 100 ₪</b>. החזרת המוצר תיעשה למקום עסקו של בית העסק או בתיאום אחר עמו, והמוצר יוחזר באריזתו המקורית ובמצב תקין.</p>
             <p><b>דמי ביטול ייגבו רק בגבולות המותרים בדין, ואין קביעה גורפת שדמי המשלוח מתווספים להם.</b> יש להבחין בין ביטול כדין שאינו עקב הפרה — שבו רשאי בית העסק לגבות דמי ביטול כאמור — לבין ביטול עקב <b>פגם, אי-התאמה, אי-אספקה במועד או הפרה אחרת מצד בית העסק</b>: במקרים אלה <b>לא ייגבו דמי ביטול כלל</b>, ובית העסק נושא בעלויות ההחזרה או האיסוף בהתאם לדין (ראה סעיף 8.5). גביית עלות משלוח החזרה בביטול שאינו עקב פגם, מעבר לדמי הביטול — ${LEGAL_TODO_HE}</p>
             <p><b>8.4 מועד ההחזר.</b> החזר כספי, ככל שמגיע, יבוצע באותו אמצעי תשלום ששימש לביצוע העסקה, <b>בתוך 14 ימים</b> ממועד קבלת הודעת הביטול, בהתאם לסעיף 14ה לחוק.</p>
             <p><b>8.5 מוצר פגום או שאינו תואם להזמנה.</b> סופק מוצר פגום, או שאינו תואם את ההזמנה, או שלא סופק במועד — זכאי הלקוח לתיקון, החלפה, או ביטול העסקה וקבלת <b>מלוא כספו בחזרה ללא דמי ביטול</b>, בהתאם לחוק הגנת הצרכן ולחוק המכר, תשכ״ח-1968. במקרים אלה <b>יישא בית העסק בעלות ההחזרה או האיסוף של המוצר</b> בהתאם לדין, ולא ייגבו מהלקוח דמי ביטול או עלות משלוח החזרה. <b>שום חריג בסעיף 8.6 אינו חל על מקרה של פגם.</b></p>
             <p><b>8.6 הרכבות מחשב בהתאמה אישית.</b> החוק מחריג מזכות הביטול ״טובין שיוצרו במיוחד בעבור הצרכן על פי מידות או דרישות מיוחדות״. <b>חריג זה אינו חל אוטומטית על כל מחשב</b>, ובוודאי לא על מחשב המורכב מרכיבים סטנדרטיים שנבחרו מהקטלוג; תחולתו תלויה בסוג המוצר ובשלב הייצור/ההרכבה. <b>אין בעצם בחירת רכיבים מתוך קטלוג האתר כדי לקבוע שמדובר בטובין שיוצרו במיוחד.</b> ככל שיתברר שחל על עסקה מסוימת חריג חוקי לזכות הביטול, לא תחול זכות ביטול מכוח ההוראה שממנה נגזר אותו חריג — והכול בכפוף לתנאי הדין ולסייגיו, ומבלי לגרוע מכל זכות אחרת של הלקוח. ${LEGAL_TODO_HE}</p>
             <p style="margin-right:18px">עד להכרעה בכך, ובכל מקרה מבלי לגרוע מזכות שבדין, זו <b>מדיניות בית העסק</b>: כל עוד לא בוצע תשלום והרכיבים לא הוזמנו — ניתן לבטל בכל שלב, ללא כל עלות. לאחר תשלום אך <u>לפני</u> שהרכיבים הוזמנו בפועל אצל הספק — החזר מלא, בניכוי הוצאות ממשיות שכבר נגרמו (אם היו). <u>לאחר</u> שהרכיבים הוזמנו בפועל — בית העסק יבחן כל פנייה לגופה לפי הדין והנסיבות ו<b>לא יסתמך על החריג באופן אוטומטי</b>; ככל שיתברר שאין זכות ביטול לפי דין, בית העסק רשאי, לפי שיקול דעתו, לזכות את הלקוח בסכום ששולם כנגד רכישה עתידית.</p>
             <p><b>8.7 ביטול או דחייה של ביקור בית שתואם.</b> ניתן לבטל או לדחות ביקור שתואם, ללא עלות, בהודעה של 4 שעות לפחות לפני המועד. ביטול בהתראה קצרה יותר, או לאחר שהטכנאי כבר יצא לדרך או הגיע, עלול לחייב בדמי נסיעה בהתאם למחירון.</p>
             <p><b>8.8 איך מבטלים.</b> בקשת ביטול תוגש <b>בכתב</b> — בהודעת וואטסאפ או בדוא״ל, לפרטי ההתקשרות שבעמוד <a href="contact.html">צור קשר</a> (שם מופיע גם כפתור ״ביטול עסקה״ ייעודי) — בצירוף פרטי ההזמנה הדרושים לזיהוי. ניתן גם להודיע טלפונית במספר 050-200-0373. <b>לא ייגבו דמי ביטול בניגוד למגבלות הדין.</b></p>`
    },
    {
      title: "9. אחריות בית העסק, בונה המחשבים והגבלת אחריות",
      html: `<p><b>9.1 דיוק המידע.</b> בית העסק עושה מאמץ סביר לוודא שהמידע המוצג באתר (מחירים, מפרטים, זמינות) מדויק ועדכני, אך אינו מתחייב לכך במלואו — ראה סעיף 2. נפלה טעות סופר או טעות מחיר, יחול סעיף 13.</p>
             <p><b>9.2 בונה המחשבים — כלי עזר בלבד.</b> כלי ״בונה המחשבים״ נועד לסייע ללקוח בבחירת רכיבים תואמים, ובדיקות ההתאמה שהוא מבצע (שקע מעבד, סוג זיכרון, גודל מארז, הספק ספק כוח וכיו״ב) הן <b>הנחיה כללית בלבד</b>. הכלי אינו מהווה ייעוץ מקצועי, התחייבות או ערובה לכך שההרכב יפעל, ואינו מכסה בהכרח כל אי-תאימות אפשרית בין רכיבים. ייתכנו טעויות, חוסרים או אי-דיוקים בנתוני הרכיבים ובלוגיקת הבדיקה, לרבות כאלה שאינם בשליטת בית העסק (למשל נתונים שגויים מצד היצרן או הספק). האחריות לבדיקה הסופית ולהתאמת הרכיבים זה לזה מוטלת על הלקוח, ובית העסק לא יישא באחריות לנזק, להוצאה או לאובדן שנגרמו כתוצאה מהסתמכות על תוצאות הכלי. <b>לקוח שאינו בטוח מוזמן לפנות לבית העסק לפני ביצוע ההזמנה</b> לקבלת בדיקה אישית של ההרכב, ללא עלות.</p>
             <p><b>9.3 גיבוי מידע.</b> האחריות לגיבוי קבצים, תמונות, מסמכים ותוכנות לפני מסירת מחשב לטיפול <b>מוטלת על הלקוח</b>. פעולות טכניות עלולות במקרים מסוימים לגרום למחיקת מידע או לצורך בהתקנה מחדש. בית העסק יפעל בזהירות סבירה, אך אינו מתחייב לשימור מידע כאשר לא נרכש עבורו שירות גיבוי/העברת נתונים. נדרש גיבוי — יש לתאם אותו מראש כשירות.</p>
             <p><b>9.4 נזק עקיף.</b> בית העסק אינו אחראי לנזק עקיף או תוצאתי, או לאובדן מידע/נתונים, אלא ככל שהדבר נובע מרשלנותו ובכפוף לכל דין.</p>
             <p><b>9.5 שירותי צד שלישי.</b> בית העסק אינו אחראי לתקלות שמקורן בשירותי צד שלישי — ספק אינטרנט, חברת שילוח, יצרן, יבואן, מערכת סליקה, מערכת הפעלה או תוכנת צד שלישי — מעבר לאחריות המוטלת עליו לפי דין.</p>
             <p><b>9.6 כוח עליון.</b> בית העסק לא ייחשב כמפר התחייבות כאשר אי-הביצוע נגרם עקב אירוע שאינו בשליטתו הסבירה, כגון מלחמה, מצב חירום, שביתה, תקלה מערכתית רחבה, הפסקת שירות של ספק מהותי, מזג אוויר קיצוני או הוראת רשות.</p>
             <p><b>9.7 גבול ההגבלה.</b> <b>אין בסעיף 9 זה, ואין בתקנון כולו, כדי לפטור את בית העסק מאחריות שאינה ניתנת להתניה לפי דין.</b> כל הגבלת אחריות תחול רק במידה המותרת בדין.</p>`
    },
    {
      title: "10. פרטיות ואבטחת מידע",
      html: `<p><b>10.1 מה נאסף ולשם מה.</b> בית העסק אוסף ושומר פרטים שנמסרים על ידי הלקוח באופן יזום — שם, טלפון, דוא״ל, כתובת (לצורך משלוח או ביקור בית) ופרטי ההזמנה — לצורך ביצוע ההזמנה, מתן השירות, תיעוד, מעקב אחר קריאות שירות עתידיות ויצירת קשר בנוגע לאותה הזמנה.</p>
             <p><b>10.2 היכן הוא נשמר ולמי הוא מועבר.</b> רישומי העסקאות והלקוחות מנוהלים במערכת הסליקה והחשבונאות של בית העסק (SUMIT); בית העסק רשאי לנהל בנוסף רישום לקוחות פנימי לצורכי מתן שירות. הפרטים אינם נמכרים ואינם מועברים לצד שלישי לצורכי שיווק. העברה נעשית רק כנדרש לביצוע העסקה עצמה — חברת סליקה לצורך התשלום, חברת שילוח לצורך המשלוח, וספקים לצורך הזמנת המוצר — או כאשר הדבר נדרש לפי דין.</p>
             <p><b>10.3 פרטי אשראי.</b> בית העסק <b>אינו רואה, אינו מקבל ואינו שומר פרטי כרטיס אשראי</b>. הפרטים מוזנים ומעובדים ישירות בדף הסליקה המאובטח של חברת הסליקה (ראה סעיף 4).</p>
             <p><b>10.4 אחסון בדפדפן.</b> האתר משתמש באחסון מקומי בדפדפן (Local Storage) לארבע מטרות בלבד: תכולת עגלת הקניות, העדפת השפה, הרכבה שנשמרה בבונה המחשבים, ומטמון קטלוג לזירוז הטעינה. <b>אין באתר Cookies של צד שלישי, אין Google Analytics, אין Google Ads ואין פיקסלים פרסומיים כלשהם</b>, ואין העברת מידע לצדדים שלישיים לצורכי פרסום. אם ייווספו בעתיד כלים כאלה — סעיף זה יעודכן והדבר יובא לידיעת המשתמשים.</p>
             <p><b>10.5 זכויות הלקוח.</b> לקוח רשאי לבקש בכל עת לעיין במידע השמור אודותיו, לתקנו או למחקו, בפנייה לפרטי ההתקשרות שבאתר — בהתאם לחוק הגנת הפרטיות, תשמ״א-1981, לרבות תיקון מס׳ 13 שנכנס לתוקף ביום 14.08.2025.</p>
             <p><b>10.6 משך שמירה ומדיניות פרטיות נפרדת.</b> פרטי ההזמנה ומסמכי העסקה נשמרים למשך התקופה הנדרשת לפי דין ולצורכי תיעוד, אחריות וטיפול בפניות, ולאחר מכן נמחקים או נשמרים באופן שאינו מזהה — אלא אם הדין מחייב אחרת. בית העסק פועל בהתאם לחוק הגנת הפרטיות, תשמ״א-1981, לרבות תיקון מס׳ 13. <b><a href="privacy.html">מדיניות פרטיות מלאה ונפרדת</a></b> — הכוללת את סוגי המידע הנאספים, מטרות השימוש, משך השמירה, הגורמים שאליהם מועבר המידע וזכויות נושא המידע — מפורסמת באתר ומהווה חלק מתנאי השימוש.</p>
             <p>נוסח מדיניות הפרטיות הנפרדת, והיקף החובות החלות על בית העסק מכוח תיקון 13 — ${LEGAL_TODO_HE}</p>`
    },
    {
      title: "11. קטינים",
      html: `<p>הרכישה באתר מיועדת לבגירים, או לקטין שקיבל את הסכמת האחראי עליו כנדרש לפי דין. בית העסק רשאי לבקש אימות פרטים כאשר הדבר נדרש.</p>`
    },
    {
      title: "12. נגישות",
      html: `<p>בית העסק רואה חשיבות במתן שירות שוויוני ונגיש, פועל בהתאם להוראות הדין בעניין נגישות, וככל שתחול עליו חובת נגישות נוספת — יפעל לביצועה.</p>
             <p>תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), תשע״ג-2013 קובעות פטור מהתאמות נגישות לשירותי אינטרנט לעוסק פטור כהגדרתו בחוק מע״מ. בית העסק הוא עוסק פטור וסבור כי הפטור חל עליו. תחולת הפטור בפועל, והיקפו — ${LEGAL_TODO_HE}</p>
             <p><b>גם אם הפטור חל, הוא אינו פוטר את בית העסק ממתן שירות נגיש בדרך חלופית.</b> לקוח שנתקל בקושי להשתמש באתר או לקבל מידע או שירות דרכו — מוזמן לפנות לדביר פרץ בטלפון או בוואטסאפ 050-200-0373, או בדוא״ל schr5500@gmail.com, ובית העסק יספק דרך חלופית סבירה לקבלת המידע או השירות.</p>
             <p>הצהרת נגישות נפרדת תפורסם באתר לאחר בדיקת מצב הנגישות בפועל. אין בסעיף זה כדי לגרוע מחובות בית העסק לפי חוק שוויון זכויות לאנשים עם מוגבלות, תשנ״ח-1998.</p>`
    },
    {
      title: "13. טעויות ותקלות באתר",
      html: `<p>ייתכנו באתר טעויות אנוש, תקלות סנכרון מול הספק, שגיאות מחיר או תקלות טכניות. במקרה של טעות גלויה ומהותית במחיר, בית העסק רשאי שלא להשלים את העסקה במחיר השגוי, בכפוף לדין — ובמקרה כזה יודיע ללקוח, יציע לו לבטל <b>ללא כל עלות</b>, וישיב כל סכום ששולם.</p>
             <p>בית העסק רשאי לבצע תחזוקה, עדכונים ושדרוגים באתר, ואינו מתחייב לזמינות רציפה של האתר או של כלי הבונה.</p>`
    },
    {
      title: "14. קניין רוחני",
      html: `<p>כל זכויות הקניין הרוחני בתכני האתר — לרבות עיצוב, טקסטים, לוגו, קוד, תמונות מקוריות וכלי בניית המחשב — שייכות לבית העסק או לבעלי הזכויות הרלוונטיים, ואין להעתיקם, לשכפלם, להפיצם או לעשות בהם כל שימוש מסחרי ללא אישור מראש ובכתב, למעט שימוש המותר לפי דין.</p>
             <p>סימני מסחר, שמות מותג, תמונות ומפרטי יצרנים המוצגים באתר שייכים לבעליהם; הצגתם באתר אינה יוצרת בהם זכות כלשהי לבית העסק.</p>`
    },
    {
      title: "15. דיוור ופרסום",
      html: `<p><b>נכון למועד עדכון תקנון זה, בית העסק אינו מנהל רשימת דיוור ואינו שולח דברי פרסומת.</b> הודעות הנשלחות ללקוח — אישור הזמנה, קבלה, עדכון על מצב ההזמנה — הן <b>מסרים תפעוליים</b> הקשורים לעסקה עצמה.</p>
             <p>ככל שבעתיד יישלחו דברי פרסומת, הדבר ייעשה בהתאם לסעיף 30א לחוק התקשורת (בזק ושידורים), תשמ״ב-1982 — לרבות קבלת הסכמה מראש ומנגנון הסרה בכל הודעה.</p>`
    },
    {
      title: "16. דין חל, סמכות שיפוט ושינויים בתקנון",
      html: `<p>על תקנון זה ועל כל עסקה שתבוצע באתר יחולו <b>דיני מדינת ישראל</b>.</p>
             <p>הצדדים יפעלו ליישוב מחלוקות בדרך של פנייה ישירה. מחלוקת שלא נפתרה בדרך זו תידון בבית המשפט המוסמך בישראל <b>לפי כללי הסמכות העניינית והמקומית הקבועים בדין</b> — <b>ותקנון זה אינו קובע סמכות שיפוט ייחודית לבית משפט מסוים</b>. <b>אין בתקנון זה כדי לגרוע מזכותו של צרכן לפנות לכל ערכאה מוסמכת לפי דין</b>, לרבות בית משפט לתביעות קטנות, או לממש כל זכות או סעד אחרים המוקנים לו לפי דין. ניסוח סעיף השיפוט והתאמתו לדיני החוזים האחידים — ${LEGAL_TODO_HE}</p>
             <p>בית העסק רשאי לעדכן תקנון זה מעת לעת. <b>הנוסח המחייב לגבי עסקה מסוימת הוא הנוסח שהיה מפורסם באתר במועד ביצוע אותה עסקה.</b></p>`
    },
    {
      title: "17. אישור התקנון",
      html: `<p>ביצוע הזמנה ומעבר לתשלום באתר מותנים בסימון תיבת אישור פעילה (☑) בעמוד התשלום, המעידה כי הלקוח קרא ומסכים לתקנון זה במלואו.</p>`
    }
  ],

  en: [
    {
      title: "1. Business Details & Scope of These Terms",
      html: `<p>This website (the "Site") is operated by <b>Dvir Peretz</b>, an <b>exempt dealer (עוסק פטור)</b> under Israeli VAT law, business ID 322999582 ("DvirTech" or "the Business").</p>
             <p>The Business is an online business and <b>does not operate a physical walk-in store</b>. Self-pickup is available from <b>Even Shmuel</b>, by prior arrangement only. Technician visits are made in the Kiryat Gat area, and by availability in the Shfela and Center regions, by prior appointment; product delivery is nationwide.</p>
             <p>Availability: Sun–Thu 09:00–19:00, Fri 09:00–14:00. Closed Saturdays and Jewish holidays. Contact: phone/WhatsApp 050-200-0373, email schr5500@gmail.com — full details on the <a href="contact.html">Contact</a> page.</p>
             <p>Browsing the Site and/or placing an order through it constitutes acceptance of these Terms. If you do not agree to any part of them, please refrain from using the Site.</p>
             <p><b>The law prevails.</b> Wherever a provision of these Terms conflicts with a non-waivable provision of law — in particular the Consumer Protection Law, 1981, and its regulations — <b>the law prevails</b>, and the provision here shall be read so far as necessary to conform with it. Nothing in these Terms derogates from any right granted to a consumer by law.</p>
             <p>Consumer Protection Law provisions apply to a "consumer" as defined in that law. A purchase made in the course of a business, commercial or professional activity may be governed by different provisions and may not be protected in the same way. <b>That classification does not follow from ticking a box at checkout; it is determined by the circumstances and the actual purpose of the purchase.</b> ${LEGAL_TODO_EN}</p>`
    },
    {
      title: "2. Products, Site Information, Stock & Prices",
      html: `<p>The Site presents ready-made PCs, laptops, hardware components and peripherals, along with a "PC Builder" tool for configuring a custom build.</p>
             <p><b>Stock and prices.</b> Stock and price data are synced automatically from the supplier <b>approximately every 15 minutes</b>. Even so, a gap may exist between what the Site shows and the supplier's actual state. Displayed price and availability are not an absolute commitment until the order is confirmed. If a material gap in price or availability is found, the Business will contact the customer and allow them to accept the updated price or cancel the order <b>at no cost</b>.</p>
             <p>If, after order confirmation, a product turns out to be unavailable, the Business will notify the customer promptly, will make a good-faith attempt to source it from an alternative supplier, and failing that will refund the full amount paid as required by law.</p>
             <p><b>Custom builds.</b> For a build configured in the PC Builder, the Site presents a <b>price quote</b>, valid for 7 days from when it is shown. The final price is verified against supplier pricing when the order is placed. Beginning fulfillment (actually purchasing the parts from suppliers) requires payment of the full transaction amount in advance.</p>
             <p><b>Images are for illustration only.</b> Images on the Site — product images, category images and banners — are for general illustration only. Differences may exist between the image and the actual product: colour, finish, packaging, bundled accessories and model revision. <b>The written technical specification alongside the product is the binding one</b>, and in any discrepancy between image and written specification, the written specification prevails. Trademarks, manufacturer images and manufacturer specifications belong to their owners.</p>`
    },
    {
      title: "3. Exempt-Dealer Status & Transaction Documents",
      html: `<p>The Business is an <b>exempt dealer (עוסק פטור)</b> and does not charge VAT separately. <b>No VAT is added to the prices shown on the Site</b>; those are the prices the customer pays for the product or service itself. The only amounts added to the transaction total are ones the customer expressly selects and sees on screen before confirming: the delivery charge (section 5.1), and the installment fee where 4 or more installments are chosen (section 4).</p>
             <p><b>Every transaction on the Site produces a receipt (קבלה) — not a tax invoice (חשבונית מס).</b> An exempt dealer is not permitted to issue a tax invoice, and the Business does not present itself as charging VAT and does not issue any document it is not permitted to issue.</p>
             <p>The receipt is generated automatically upon completion of payment and sent to the email address provided at checkout. A customer who ticked "business/company" and entered a company name will see that company name on the receipt as the payer; <b>the document type does not change</b> and remains a receipt.</p>
             <p>The binding price for a transaction is the price displayed and confirmed on the payment page, subject to Section 13 (errors).</p>`
    },
    {
      title: "4. Payment, Card Processing & Installments",
      html: `<p><b>External secure processing.</b> Payment does not take place on the Site itself. On confirming the order, the customer is redirected to an <b>external secure payment page</b> operated by the payment processor (SUMIT/UPAY). <b>Credit card details do not pass through the Site, are not visible to the Business and are not stored by it</b> — they are entered and processed by the payment processor alone.</p>
             <p><b>Number of installments.</b> Up to <b>12 installments</b> may be selected on the payment page.</p>
             <p><b>1 to 3 installments — no fee whatsoever.</b> The amount charged is identical to the displayed price, with no addition.</p>
             <p><b>4 installments or more — installment fee.</b> Choosing 4 or more installments is an optional choice by the customer and carries a fee reflecting the actual financing cost. The fee is calculated <b>per payment month</b> (so 6 installments cost more than 4), plus a credit-allocation component of up to 1% with a fixed cap — per the processor’s actual tariff — and is shown to the customer <b>as an exact shekel amount, together with the total payable, before</b> the transaction is confirmed — not after.</p>
             <p><b>No amount will be charged that was not displayed on screen before the transaction was confirmed, and no amount exceeding the total the customer saw and approved will be charged.</b></p>
             <p>How the fee is presented, and its full compliance with the "total price" requirements of the Consumer Protection Law — ${LEGAL_TODO_EN}</p>
             <p>Proceeding to the payment page requires actively ticking a confirmation checkbox stating that the customer has read and agrees to these Terms (see Section 17).</p>`
    },
    {
      title: "5. Fulfillment: Shipping, Self-Pickup & Technician Visits",
      html: `<p><b>5.1 Shipping.</b> Shipping is carried out by an <b>external courier company</b>, in two options selectable on the payment page: <b>standard delivery — ₪29, estimated 3-7 business days</b>; <b>express delivery — ₪49, estimated 2-5 business days</b>. The price and delivery time shown on the payment page at the time of ordering are the binding ones.</p>
             <p>The Business may use one or more courier companies and may change them from time to time, so <b>these Terms do not commit to any particular courier</b>; the identity of the company used for a given order will be given on the Site or in the order details, as relevant. <b>Handing a shipment to an external courier does not derogate from the Business's own liability to the customer under law.</b> ${LEGAL_TODO_EN}</p>
             <p><b>5.2 When the clock starts.</b> Delivery-day counting begins after the order is confirmed, payment is settled and the product is available to ship — not necessarily from the moment the order button is pressed. <b>Days are counted in business days</b> and exclude weekends, public holidays and days of rest. Orders including parts that must be ordered from a supplier depend on supplier availability, and a time estimate will be given to the customer in advance as best known.</p>
             <p><b>5.3 Self-pickup.</b> Self-pickup is available <b>free of charge</b>, from <b>Even Shmuel</b>, <b>by prior arrangement only</b>. This is not a store open to the public and no one should arrive without arranging it first. The customer must arrive at the agreed time and present order details. If a product is not collected within a reasonable time after a readiness notice, the Business will arrange a new time.</p>
             <p><b>5.4 Technician visits.</b> Home visits, on-site setup, diagnostics and repair <b>are not purchased through the Site</b> — see Section 6.</p>
             <p><b>5.5 Delivery and delays.</b> Delivery is made to the address the customer provided; an incorrect address may cause delay or additional cost, subject to law. On receiving a shipment it is advisable to inspect the packaging, and to photograph and report significant external damage to the Business promptly. Delivery times are estimates and do not account for delays outside the Business's control (supplier or courier delay, strike, state of emergency, force majeure); in the event of a material delay the Business will update the customer and work to find a solution as required by law.</p>`
    },
    {
      title: "6. Add-On Services & Support",
      html: `<p><b>6.1 Services purchasable at checkout.</b> Alongside products, defined services may be added to an order, with their price shown next to them: Windows 11 installation with a license, or Windows installation without a license — <b>only when the order includes a computer</b>; software installation; data transfer from the customer's old PC; internal cleaning and thermal paste replacement. Each purchased service appears as a separate line on the receipt. The list of services offered at checkout may change from time to time; what is shown on the payment page at the time of ordering is what binds.</p>
             <p><b>6.2 Services not sold through the Site.</b> Services involving a physical visit, personal scheduling, or assessing a fault in advance — <b>home visits, on-site computer setup, fault diagnosis and repair, and remote support</b> — <b>are not sold through the Site</b>. Please use the <a href="support.html">Service &amp; Support</a> page; the price depends on distance and the actual work, and will be agreed with the customer <b>before</b> work begins.</p>
             <p><b>6.3 If the job turns out different.</b> If the work actually required differs from what was described in the request, the Business will tell the customer about the need and the pricing <b>before</b> continuing.</p>
             <p><b>6.4 Free assembly.</b> The free-assembly benefit applies to builds configured and purchased through the Site's <a href="builder.html">PC Builder</a>, since that is where part compatibility is checked. Purchasing individual parts separately does not automatically qualify for this benefit. <b>The benefit is a discount on the price of the assembly service</b>, given because the components were bought through the Business — <b>it does not merge the components and the service into a single product</b>. The service continues to appear as a separate line on the transaction document even when its price is ₪0 (see section 7.2).</p>
             <p><b>6.5 Service prices.</b> Service prices appear on the <a href="support.html">Service &amp; Support</a> page and on the payment page, and those are the binding prices at the time of ordering. These Terms are not a price list and do not lock any price.</p>
             <p><b>6.6 DvirTech Care plans.</b> Subject to availability and at its discretion, the Business offers care and maintenance plans for a period of <b>12 months</b> (CARE / PLUS / PRO). The plans, their prices and the services and benefits they include are set out on the <a href="support.html#care">Service &amp; Support</a> page, and what is listed there at the time of joining is binding. Joining is not an automatic site purchase but is arranged <b>in advance and subject to the Business's approval</b>; payment is made in one payment or in installments as agreed at joining, and installments do not change the entitlement period.</p>
             <p>Plan benefits are personal to the customer registered as an active subscriber and conditional on payments being made as agreed; they cannot be transferred, carried over between years, converted to cash or used retroactively. Discounts apply only to eligible services — not to hardware, products, spare parts, software, licenses, shipping or payments to third parties — and are applied when the service is arranged with the Business. Using a service included in the allowance (including support hours and maintenance checks) is done <b>at the customer's request</b> and by prior arrangement; the Business is not obliged to initiate. Work beyond the allowance is billed per the price list in force, after informing the customer.</p>
             <p>Service priority is an operational preference only and is not a commitment to any response or resolution time. <b>The plan is not a hardware warranty</b>, does not extend or change a manufacturer's or importer's warranty, and does not derogate from any statutory right. The Business may update plan terms and prices for new joiners, subject to law; cancellation, plan changes or termination follow the terms given at joining and the provisions of law.</p>`
    },
    {
      title: "7. Warranty",
      html: `<p><b>7.1 Product and hardware warranty — varies per product.</b> The warranty period and the party providing it are <b>not uniform</b> across the Site: they are pulled from the supplier/importer and shown <b>on each individual product page</b>. <b>The Site makes no blanket promise of a uniform warranty period across all products.</b> If no warranty is shown for a product, please clarify its terms with the Business before purchasing.</p>
             <p><b>7.2 Components and assembly service — two separate things.</b> Components are sold to the customer <b>as they are</b>, in their original condition and packaging from the manufacturer/importer, without any change, processing or manufacture by the Business. <b>The customer is the one who chooses the components</b>, and may receive them exactly as they are — boxed and unassembled. <b>The Business does not manufacture the hardware components, does not alter how they are manufactured, and does not alter their specification.</b></p>
             <p>"PC assembly service" is a <b>separate service</b> ordered at the customer's request for components purchased as part of the transaction — exactly as it can be ordered for components bought elsewhere. <b>The customer chooses the components and the assembly service separately from one another.</b> The service covers the physical assembly of the components, connecting them, a basic check that the assembly is sound, and bringing the system up, according to the scope of service purchased.</p>
             <p><b>The separation is reflected in the transaction document as well:</b> each component appears on its <b>own line</b> with its price, and the assembly service appears on a <b>separate line of its own</b>. No "assembled computer" is sold as a single product with a single price. Eligibility for the free-assembly benefit is set out in section 6.4.</p>
             <p><b>7.3 Warranty on the components.</b> The various components supplied as part of the transaction are subject to the warranty applicable to them under the law and under the warranty terms of the relevant manufacturer and/or importer. <b>The Business hands over to the customer the warranty certificates and documents supplied with the components by the manufacturer/importer</b>, as received and collected together. Where needed, the Business will assist the customer in identifying the relevant service provider and in dealing with them, in accordance with the law.</p>
             <p><b>7.4 Warranty on the assembly service.</b> Subject to any law, the warranty on the assembly service is given for <b>90 days (3 months)</b> from the date the product is supplied to the customer. The warranty covers faults arising directly from defective performance of the physical assembly work carried out by the Business.</p>
             <p>This warranty does not apply to faults or damage originating in a hardware component, in software, in the operating system, in viruses or malware, in changes or software updates made to the system after assembly, in use that does not follow the manufacturer's instructions — including overclocking — in physical damage such as breakage or impact, in damage caused by liquids or corrosion, or in any other cause not directly connected to the assembly work carried out by the Business, all subject to any law.</p>
             <p><b>7.5 Statutory rights preserved.</b> <b>Nothing in this section 7, or in these Terms as a whole, derogates from any warranty right granted to the customer by law</b>, including under the Consumer Protection Law, 1981 and its regulations. The 90-day period in section 7.4 is a contractual commitment by the Business in respect of the assembly work only — it <b>does not shorten or replace</b> a manufacturer warranty, an importer warranty, or any warranty the law grants on the components themselves.</p>`
    },
    {
      title: "8. Cancellation, Returns & Refunds",
      html: `<p><b>8.1 Finished products — 14 days.</b> A customer who purchased a finished product (ready-made PC, laptop, single component or peripheral) may cancel within <b>14 days</b> of receiving the product <b>or</b> of receiving the transaction details document — <b>whichever is later</b> — under Section 14C of the Consumer Protection Law, 1981.</p>
             <p><b>8.2 Extended cancellation period — 4 months.</b> A customer who is a <b>person with a disability</b>, <b>aged 65 or over</b>, or a <b>new immigrant</b> (within 5 years of eligibility) may cancel within <b>4 months</b> of the transaction, receipt of the product, or receipt of the transaction details document — whichever is latest — <b>provided the engagement included a conversation</b> between the customer and the Business, including electronic communication (Section 14C1 of the Law). The Business may request documentation evidencing eligibility.</p>
             <p><b>8.3 Cancellation fee.</b> For a cancellation not due to a defect, non-conformity or breach, the Business may charge a cancellation fee of <b>the lower of 5% of the transaction price or ₪100</b>. The product is returned to the Business's place of business, or as otherwise arranged with it, in its original packaging and in working condition.</p>
             <p><b>Cancellation fees are charged only within the limits the law permits, and there is no blanket rule adding shipping costs to them.</b> A lawful cancellation that is not due to a breach — where the Business may charge the fee described above — must be distinguished from a cancellation due to a <b>defect, non-conformity, late delivery or other breach by the Business</b>: in those cases <b>no cancellation fee is charged at all</b>, and the Business bears the cost of return or collection as required by law (see section 8.5). Whether return-shipping cost may be charged on top of the cancellation fee, in a cancellation not due to a defect — ${LEGAL_TODO_EN}</p>
             <p><b>8.4 Refund timing.</b> Any refund due will be issued via the same payment method used for the transaction, <b>within 14 days</b> of receiving the cancellation notice, under Section 14E of the Law.</p>
             <p><b>8.5 Defective or non-conforming products.</b> If a product is delivered defective, does not match the order, or is not delivered on time, the customer is entitled to repair, replacement, or cancellation and a <b>full refund with no cancellation fee</b>, under the Consumer Protection Law and the Sale Law, 1968. In such cases <b>the Business bears the cost of returning or collecting the product</b> as required by law, and no cancellation fee or return-shipping cost is charged to the customer. <b>No exception in Section 8.6 applies to a defect.</b></p>
             <p><b>8.6 Custom PC builds.</b> The Law excludes from the cancellation right "goods manufactured specially for the consumer according to special measurements or requirements". <b>This exception does not apply automatically to every computer</b>, and certainly not to a computer assembled from standard catalogue parts; its applicability depends on the type of product and the stage of manufacture/assembly. <b>Choosing components from the Site's catalogue does not, in itself, make a build "goods manufactured specially".</b> Where a statutory exception to the cancellation right is found to apply to a particular transaction, no cancellation right arises under the provision that exception is drawn from — all subject to the conditions and qualifications of the law, and without derogating from any other right of the customer. ${LEGAL_TODO_EN}</p>
             <p style="margin-left:18px">Pending resolution of that question, and in any event without derogating from any right under law, this is the <b>Business's policy</b>: as long as no payment has been made and no parts have been ordered — the order may be cancelled at any stage at no cost. After payment but <u>before</u> parts are actually ordered from the supplier — a full refund, less any real costs already incurred (if any). <u>After</u> parts have actually been ordered — the Business will examine each request on its merits under the law and the circumstances and <b>will not rely on the exception automatically</b>; if it emerges that no cancellation right exists under law, the Business may, at its discretion, credit the amount paid toward a future purchase.</p>
             <p><b>8.7 Cancelling or rescheduling a booked home visit.</b> A booked visit may be cancelled or rescheduled at no cost with at least 4 hours' notice. Cancelling with less notice, or after the technician has set out or arrived, may incur a travel fee per the price list.</p>
             <p><b>8.8 How to cancel.</b> A cancellation request should be submitted <b>in writing</b> — by WhatsApp message or email, to the contact details on the <a href="contact.html">Contact</a> page (which also has a dedicated "Cancel Transaction" button) — with the order details needed to identify it. Notice may also be given by phone at 050-200-0373. <b>No cancellation fee will be charged contrary to the limits set by law.</b></p>`
    },
    {
      title: "9. Business Liability, the PC Builder & Limitation of Liability",
      html: `<p><b>9.1 Accuracy of information.</b> The Business makes a reasonable effort to keep information on the Site (prices, specs, availability) accurate and current, but does not fully guarantee it — see Section 2. If a typographical or pricing error occurs, Section 13 applies.</p>
             <p><b>9.2 The PC Builder is an assistive tool only.</b> The "PC Builder" is intended to help the customer choose compatible parts, and the compatibility checks it performs (CPU socket, memory type, case clearance, PSU headroom, etc.) are <b>general guidance only</b>. It does not constitute professional advice, a commitment, or a guarantee that the configuration will work, and it does not necessarily cover every possible incompatibility. Errors, gaps or inaccuracies may exist in the part data and in the checking logic, including ones outside the Business's control (e.g. incorrect data from a manufacturer or supplier). Final verification and compatibility of the parts is the customer's responsibility, and the Business shall not be liable for damage, expense or loss arising from reliance on the tool's results. <b>Customers who are unsure are invited to contact the Business before ordering</b> for a personal review of the configuration, free of charge.</p>
             <p><b>9.3 Data backup.</b> Responsibility for backing up files, photos, documents and software before handing over a computer for service <b>rests with the customer</b>. Technical work may in some cases cause data loss or require a reinstall. The Business will act with reasonable care, but does not undertake to preserve data where no backup/data-transfer service was purchased. If a backup is needed, it should be arranged in advance as a service.</p>
             <p><b>9.4 Indirect damage.</b> The Business is not liable for indirect or consequential damage, or for loss of data, except to the extent caused by its negligence and subject to applicable law.</p>
             <p><b>9.5 Third-party services.</b> The Business is not liable for faults originating in third-party services — internet provider, courier, manufacturer, importer, payment system, operating system or third-party software — beyond the liability imposed on it by law.</p>
             <p><b>9.6 Force majeure.</b> The Business will not be considered in breach where non-performance is caused by an event outside its reasonable control, such as war, a state of emergency, strike, a wide-scale systems failure, a material supplier's service outage, extreme weather, or an order of an authority.</p>
             <p><b>9.7 The limit of the limitation.</b> <b>Nothing in this Section 9, or in these Terms as a whole, exempts the Business from liability that cannot be contracted out of under law.</b> Every limitation of liability applies only to the extent permitted by law.</p>`
    },
    {
      title: "10. Privacy & Data Security",
      html: `<p><b>10.1 What is collected and why.</b> The Business collects and stores details voluntarily provided by the customer — name, phone, email, address (for shipping or a home visit) and order details — in order to fulfil the order, provide the service, keep records, follow up on future service calls, and communicate regarding that order.</p>
             <p><b>10.2 Where it is kept and who it is shared with.</b> Transaction and customer records are managed in the Business's payment and accounting system (SUMIT); the Business may additionally keep an internal customer record for service purposes. Details are not sold and not shared with third parties for marketing. Sharing occurs only as required to carry out the transaction itself — the payment processor for payment, the courier for shipping, and suppliers for ordering the product — or where required by law.</p>
             <p><b>10.3 Card details.</b> The Business <b>does not see, does not receive and does not store credit card details</b>. They are entered and processed directly on the payment processor's secure page (see Section 4).</p>
             <p><b>10.4 Browser storage.</b> The Site uses browser Local Storage for four purposes only: cart contents, language preference, a build saved in the PC Builder, and a catalogue cache to speed up loading. <b>The Site uses no third-party cookies, no Google Analytics, no Google Ads and no advertising pixels of any kind</b>, and transfers no information to third parties for advertising purposes. If such tools are added in future, this section will be updated and users will be informed.</p>
             <p><b>10.5 Customer rights.</b> A customer may at any time request to review, correct or delete the information held about them, by contacting the details listed on the Site — under the Privacy Protection Law, 1981, including Amendment No. 13, which entered into force on 14.08.2025.</p>
             <p><b>10.6 Retention period and a separate privacy policy.</b> Order details and transaction documents are kept for as long as the law requires and for record-keeping, warranty and handling of enquiries, and are then deleted or kept in non-identifying form — unless the law requires otherwise. The Business acts in accordance with the Privacy Protection Law, 1981, including Amendment No. 13. The full, separate <a href="privacy.html">privacy policy</a> — covering the categories of information collected, the purposes of use, retention periods, the parties information is shared with, and data subject rights — is published on the Site and forms part of these Terms.</p>
             <p>The wording of that separate privacy policy, and the scope of the obligations Amendment 13 imposes on the Business — ${LEGAL_TODO_EN}</p>`
    },
    {
      title: "11. Minors",
      html: `<p>Purchasing on the Site is intended for adults, or for a minor who has obtained the consent of their guardian as required by law. The Business may request verification of details where necessary.</p>`
    },
    {
      title: "12. Accessibility",
      html: `<p>The Business considers equal, accessible service important, acts in accordance with the accessibility requirements of the law, and will act to meet any further accessibility obligation that comes to apply to it.</p>
             <p>The Equal Rights for Persons with Disabilities Regulations (Service Accessibility Adjustments), 2013 provide an exemption from internet-service accessibility adjustments for an exempt dealer (עוסק פטור) as defined in the VAT Law. The Business is an exempt dealer and believes the exemption applies to it. Whether and to what extent the exemption actually applies — ${LEGAL_TODO_EN}</p>
             <p><b>Even if the exemption applies, it does not release the Business from providing accessible service by an alternative route.</b> A customer who has difficulty using the Site or obtaining information or service through it is invited to contact Dvir Peretz by phone or WhatsApp at 050-200-0373, or by email at schr5500@gmail.com, and the Business will provide a reasonable alternative means of obtaining the information or service.</p>
             <p>A separate accessibility statement will be published on the Site after the Site's actual accessibility state is assessed. Nothing in this section derogates from the Business's obligations under the Equal Rights for Persons with Disabilities Law, 1998.</p>`
    },
    {
      title: "13. Errors & Site Faults",
      html: `<p>The Site may contain human error, supplier sync failures, pricing errors or technical faults. In the case of an obvious and material pricing error, the Business may decline to complete the transaction at the erroneous price, subject to law — and in that case will notify the customer, offer cancellation <b>at no cost</b>, and refund any amount paid.</p>
             <p>The Business may perform maintenance, updates and upgrades on the Site, and does not guarantee continuous availability of the Site or of the Builder tool.</p>`
    },
    {
      title: "14. Intellectual Property",
      html: `<p>All intellectual property rights in the Site's content — including design, text, logo, code, original images and the PC-builder tool — belong to the Business or to the relevant rights holders, and may not be copied, reproduced, distributed or used commercially without prior written permission, except as permitted by law.</p>
             <p>Trademarks, brand names, manufacturer images and manufacturer specifications shown on the Site belong to their owners; displaying them on the Site creates no right in them for the Business.</p>`
    },
    {
      title: "15. Marketing Communications",
      html: `<p><b>As of the date these Terms were updated, the Business does not maintain a mailing list and does not send advertising messages.</b> Messages sent to the customer — order confirmation, receipt, order status updates — are <b>operational messages</b> relating to the transaction itself.</p>
             <p>If advertising messages are sent in future, this will be done in accordance with Section 30A of the Communications (Telecommunications and Broadcasting) Law, 1982 — including obtaining prior consent and an unsubscribe mechanism in every message.</p>`
    },
    {
      title: "16. Governing Law, Jurisdiction & Changes to These Terms",
      html: `<p>These Terms and any transaction made on the Site are governed by <b>the laws of the State of Israel</b>.</p>
             <p>The parties will seek to resolve disputes by direct contact. A dispute not resolved that way will be heard by the competent court in Israel <b>according to the subject-matter and territorial jurisdiction rules set by law</b> — <b>these Terms do not designate an exclusive forum</b>. <b>Nothing in these Terms derogates from a consumer's right to approach any competent forum under law</b>, including the Small Claims Court, or to exercise any other right or remedy granted to them by law. The wording of this jurisdiction clause and its compatibility with standard-contract law — ${LEGAL_TODO_EN}</p>
             <p>The Business may update these Terms from time to time. <b>The binding version for a given transaction is the version published on the Site at the time that transaction was made.</b></p>`
    },
    {
      title: "17. Acceptance of These Terms",
      html: `<p>Placing an order and proceeding to payment on the Site requires actively ticking a confirmation checkbox (☑) on the payment page, confirming that the customer has read and agrees to these Terms in full.</p>`
    }
  ]
};

/* ⚠️ באנר "טיוטה לאישור עו״ד" ושאר הטקסט הסטטי ב-terms.html כתובים
   כ-data-he / data-en, בדיוק כמו ב-contact.html וב-support.html —
   כך אפשר לערוך אותם ב-HTML בלי לגעת בקובץ הזה. */
function termsApplyLangAttrs(){
  document.querySelectorAll("[data-he]").forEach(el => {
    const v = el.getAttribute(LANG === "en" ? "data-en" : "data-he");
    if(v != null && el.textContent !== v) el.textContent = v;
  });
}

function renderTermsPage(){
  { const _e=document.getElementById("navHome"); if(_e) _e.textContent = t("navHome"); }
  { const _e=document.getElementById("navReady"); if(_e) _e.textContent = t("navReady"); }
  { const _e=document.getElementById("navPeripherals"); if(_e) _e.textContent = t("navPeripherals"); }
  { const _e=document.getElementById("navComponents"); if(_e) _e.textContent = t("navComponents"); }
  { const _e=document.getElementById("navBuilder"); if(_e) _e.textContent = t("navBuilder"); }
  { const _e=document.getElementById("navLab"); if(_e) _e.textContent = t("navLab"); }
  { const _e=document.getElementById("navWhy"); if(_e) _e.textContent = t("navWhy"); }
  { const _e=document.getElementById("navContact"); if(_e) _e.textContent = t("navContact"); }

  document.getElementById("pageTitle").textContent = t("termsTitle");
  document.getElementById("pageUpdated").textContent = t("termsUpdated");

  termsApplyLangAttrs();

  const sections = TERMS_SECTIONS[LANG];
  document.getElementById("termsBody").innerHTML = sections.map(s => `
    <div class="terms-section">
      <h2>${s.title}</h2>
      ${s.html}
    </div>`).join("");

  /* ⚠️ **הפוטר כבר לא של הדף הזה.** עד 16.08.2026 terms.html החזיק פוטר
     ידני עם #footerText, והשורות כאן מילאו אותו. איחוד הפוטר
     (site-footer.js) הסיר את האלמנט — והקריאה אליו קרסה כאן על כל
     טעינה, והפילה גם את סימון כפתור השפה שאחריה. הפוטר מתעדכן היום
     לבד דרך MutationObserver על lang. */
  document.querySelectorAll(".lang-btn").forEach(b => b.classList.toggle("active", b.dataset.lang === LANG));
}

function setLang(lang){
  if(lang === LANG) return;
  setLangCore(lang);
  renderTermsPage();
}

renderTermsPage();

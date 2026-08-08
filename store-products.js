/* =====================================================================
   DvirTech — קטלוג מוצרים (שלד ראשוני, מוצרי דוגמה)
   =====================================================================
   קובץ נפרד לגמרי מ-catalog.js (שמשמש את בונה המחשבים — לא נוגעים בו).
   כרגע כל המוצרים כאן הם דוגמאות placeholder כדי לפתוח את קוד העגלה
   ולוודא שהוספה/הסרה/כמויות עובדות חלק. מחירים ומלאי אמיתיים יגיעו
   בהמשך מתוך קובץ הספקים.
===================================================================== */

const STORE_PRODUCTS = [
  { id:"pc-office",  name:"מחשב משרדי מוכן",     nameEn:"Ready-Made Office PC",   price:2575,  desc:"i3, 16GB, SSD 512GB — לעבודה יומיומית וגלישה",      descEn:"i3, 16GB RAM, 512GB SSD — everyday work & browsing", icon:"🖥️" },
  { id:"pc-gaming",  name:"מחשב גיימינג מוכן",   nameEn:"Ready-Made Gaming PC",   price:4326,  desc:"Ryzen 5, RTX 4060, 16GB — גיימינג ברזולוציית 1080p/1440p", descEn:"Ryzen 5, RTX 4060, 16GB — 1080p/1440p gaming", icon:"🎮" },
  { id:"pc-creative",name:"מחשב עריכה מוכן",     nameEn:"Ready-Made Creator PC",  price:7210,  desc:"i7, RTX 4070, 32GB — עריכת וידאו וגרפיקה",           descEn:"i7, RTX 4070, 32GB — video & graphic editing", icon:"🎬" },
  { id:"peri-mouse", name:"עכבר גיימינג",         nameEn:"Gaming Mouse",           price:124,   desc:"עכבר אופטי עם תאורת RGB",                            descEn:"Optical mouse with RGB lighting", icon:"🖱️" },
  { id:"peri-kb",     name:"מקלדת מכנית",         nameEn:"Mechanical Keyboard",    price:227,   desc:"מקלדת מכנית עם תאורה אחורית",                        descEn:"Mechanical keyboard with backlight", icon:"⌨️" },
  { id:"peri-mon",    name:"מסך 27\" 144Hz",       nameEn:"27\" 144Hz Monitor",     price:876,   desc:"מסך גיימינג 27 אינץ', 144Hz",                        descEn:"27\" gaming monitor, 144Hz", icon:"🖥️" },
  { id:"peri-head",   name:"אוזניות גיימינג",     nameEn:"Gaming Headset",         price:185,   desc:"אוזניות עם מיקרופון ותאורה",                          descEn:"Headset with mic and lighting", icon:"🎧" }
];

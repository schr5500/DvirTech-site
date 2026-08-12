/* נתוני הבונה: קטגוריות, קטלוג, שירותים ותרחישי שימוש.
   נטען כסקריפט רגיל ומספק window.DVIR_BUILDER_DATA לעמוד הבונה. */
(() => {
  const P = "builder-assets/assets/parts/";
  /* סדר הבנייה: מארז → לוח אם → מעבד → זיכרון → אחסון → כרטיס מסך → ספק →
     מאווררים → משחה → קירור → רשת */
  const CATS = [
    { key:"case", label:"מארז", img:P+"case.jpg" },
    { key:"mobo", label:"לוח אם", img:P+"mobo.jpg" },
    { key:"cpu", label:"מעבד", img:P+"cpu.jpg" },
    { key:"ram", label:"זיכרון", img:P+"ram.jpg" },
    { key:"storage", label:"אחסון", img:P+"storage.jpg" },
    { key:"gpu", label:"כרטיס מסך", img:P+"gpu.jpg" },
    { key:"psu", label:"ספק כוח", img:P+"psu.jpg" },
    { key:"caseFans", label:"מאווררי מארז", img:P+"cooling.jpg", optional:true },
    { key:"paste", label:"משחה תרמית", img:P+"cooling.jpg", optional:true },
    { key:"cooling", label:"קירור למעבד", img:P+"cooling.jpg" },
    { key:"wifi", label:"רשת אלחוטית", img:P+"mobo.jpg", optional:true },
    { key:"extras", label:"אביזרים נלווים", img:P+"cooling.jpg", optional:true }
  ];
  const CATALOG = {
    cpu:[
      { id:"i5-13400f", name:"Intel Core i5-13400F", spec:"10 ליבות / 16 תהליכים, עד 4.6GHz", price:979, t:3 },
      { id:"i5-13600kf", name:"Intel Core i5-13600KF", spec:"14 ליבות / 20 תהליכים, עד 5.1GHz", price:1249, t:4 },
      { id:"r5-7600x", name:"AMD Ryzen 5 7600X", spec:"6 ליבות / 12 תהליכים, עד 5.3GHz", price:1039, t:3 },
      { id:"r7-7800x3d", name:"AMD Ryzen 7 7800X3D", spec:"8 ליבות / 16 תהליכים, עד 5.0GHz", price:2099, t:5 },
      { id:"i7-14700kf", name:"Intel Core i7-14700KF", spec:"20 ליבות / 28 תהליכים, עד 5.6GHz", price:1905, t:5 },
      { id:"r9-7900x", name:"AMD Ryzen 9 7900X", spec:"12 ליבות / 24 תהליכים, עד 5.6GHz", price:1709, t:5 }
    ],
    cooling:[
      { id:"pa120", name:"Thermalright Peerless Assassin 120 SE", spec:"אווירי · 155mm · 2 מאווררים", price:229, t:3, cool:"air" },
      { id:"ak620", name:"DeepCool AK620 Digital", spec:"אווירי · 160mm · מדידת טמפ'", price:349, t:4, cool:"air" },
      { id:"lf3-240", name:"Arctic Liquid Freezer III 240", spec:"נוזלי · רדיאטור 240mm", price:429, t:4, cool:"aio", fans:2, note:"נכנס למארז שנבחר בהתקנה קדמית בלבד" },
      { id:"lf3-360", name:"Arctic Liquid Freezer III 360", spec:"נוזלי · רדיאטור 360mm", price:559, t:5, cool:"aio", fans:3 }
    ],
    ram:[
      { id:"16-5600", name:"16GB DDR5 5600MHz CL36", spec:"2×8GB · CL36", price:299, t:3 },
      { id:"32-6000", name:"32GB DDR5 6000MHz CL30", spec:"2×16GB · CL30 · EXPO", price:589, t:4 },
      { id:"64-6000", name:"64GB DDR5 6000MHz CL32", spec:"2×32GB · CL32", price:1090, t:5 }
    ],
    gpu:[
      { id:"rx7600", name:"Sapphire PULSE RX 7600 8GB", spec:"8GB GDDR6 · 204mm · 550W מומלץ", price:1079, t:3, fans:2 },
      { id:"rtx4060", name:"MSI VENTUS RTX 4060 8GB", spec:"8GB GDDR6 · 199mm · 550W מומלץ", price:1349, t:3, fans:2 },
      { id:"rtx4070", name:"ASUS DUAL RTX 4070 12GB", spec:"12GB GDDR6X · 227mm · 650W מומלץ", price:2599, t:4, fans:2, big:true, note:"ספק הכוח שנבחר בגבול התחתון של ההמלצה ליצרן" },
      { id:"rtx4070ti", name:"Gigabyte RTX 4070 Ti SUPER", spec:"16GB GDDR6X · 261mm · 700W מומלץ", price:3899, t:5, fans:3, big:true }
    ],
    mobo:[
      { id:"b760m-a", name:"MSI PRO B760M-A WIFI", spec:"B760 · mATX · DDR5 · 2×M.2", price:699, t:3, form:"matx" },
      { id:"b760-plus", name:"ASUS PRIME B760-PLUS", spec:"B760 · ATX · DDR5 · 3×M.2", price:829, t:3, form:"atx" },
      { id:"z790-ud", name:"Gigabyte Z790 UD AX", spec:"Z790 · ATX · תמיכת OC · 4×M.2", price:1199, t:4, form:"atx", note:"ברמה גבוהה מהנדרש למעבד שנבחר — שווה רק אם מתוכנן שדרוג" }
    ],
    storage:[
      { id:"nv3-500", name:"Kingston NV3 500GB NVMe Gen4", spec:"עד 6,000MB/s · M.2 2280", price:199, t:2 },
      { id:"sn770-1t", name:"WD Black SN770 1TB NVMe", spec:"עד 5,150MB/s · M.2 2280", price:319, t:3 },
      { id:"990-2t", name:"Samsung 990 EVO Plus 2TB", spec:"עד 7,250MB/s · M.2 2280", price:699, t:4 }
    ],
    psu:[
      { id:"gx650", name:"Seasonic Focus GX-650 80+ Gold", spec:"650W · מודולרי מלא · 10 שנות אחריות", price:379, t:3, watt:650 },
      { id:"rm750", name:"Corsair RM750e 80+ Gold", spec:"750W · מודולרי מלא · ATX 3.0", price:499, t:4, watt:750 },
      { id:"mpg850", name:"MSI MPG A850G 80+ Gold", spec:"850W · ATX 3.0 · 12VHPWR", price:679, t:5, watt:850 }
    ],
    case:[
      { id:"aerocool", name:"Aerocool Quantum Mesh", spec:"Mid Tower · פאנל זכוכית · 3 מאווררי ARGB", price:159, t:2, w:292, h:460, mesh:"mesh", form:"mid", argb:true },
      { id:"lancool", name:"Lian Li LANCOOL 216", spec:"Full Tower · זרימת אוויר גבוהה", price:459, t:4, w:304, h:476, mesh:"mesh", form:"full", argb:false },
      { id:"nr200", name:"Cooler Master NR200P", spec:"Mini-ITX · קומפקטי", price:429, t:3, w:262, h:404, mesh:"solid", form:"itx", argb:false, note:"מארז קטן — מגביל את אורך כרטיס המסך ל-330mm" }
    ],
    caseFans:[
      { id:"fans-none", name:"ללא תוספת", spec:"המאווררים שמגיעים עם המארז", price:0, t:2, fans:0 },
      { id:"fans-3", name:"ערכת 3 מאווררי 120mm", spec:"3×120mm · שקטים · בלי תאורה", price:99, t:3, fans:3, rgb:false },
      { id:"fans-3-argb", name:"ערכת 3 מאווררי 120mm ARGB", spec:"3×120mm · תאורה נשלטת", price:149, t:3, fans:3, rgb:true },
      { id:"fans-6", name:"ערכת 6 מאווררי 120mm", spec:"6×120mm · כניסה + יציאה · בלי תאורה", price:189, t:4, fans:6, rgb:false },
      { id:"fans-6-argb", name:"ערכת 6 מאווררי 120mm ARGB", spec:"6×120mm · האב ובקר תאורה כלולים", price:279, t:4, fans:6, rgb:true }
    ],
    paste:[
      { id:"paste-std", name:"משחה תרמית סטנדרטית", spec:"כלולה בהרכבה", price:0, t:2 },
      { id:"paste-kryo", name:"Thermal Grizzly Kryonaut", spec:"מוליכות גבוהה · לעומסים כבדים", price:69, t:4 }
    ],
    extras:[
      { id:"ex-none", name:"ללא אביזרים", spec:"הרכבה סטנדרטית", price:0, t:2 },
      { id:"ex-cable", name:"כבל PCIe מסולסל ARGB", spec:"כבל הזנה לכרטיס המסך · שרוול צבעוני מואר", price:129, t:3, rgbCable:true },
      { id:"ex-strip", name:"רצועת ARGB פנימית", spec:"רצועה לאורך הגג · מסונכרנת עם המאווררים", price:89, t:3, strip:true },
      { id:"ex-both", name:"ערכת תאורה מלאה", spec:"כבל מסולסל ARGB + רצועה פנימית", price:189, t:4, rgbCable:true, strip:true }
    ],
    wifi:[
      { id:"wifi-none", name:"ללא — חיבור קווי בלבד", spec:"לא חובה; מתאים למי שמחובר בכבל רשת", price:0, t:2 },
      { id:"wifi-mobo", name:"WiFi מובנה בלוח האם", spec:"לפי הלוח שנבחר", price:0, t:2 },
      { id:"wifi-ax", name:"כרטיס WiFi 6E PCIe", spec:"WiFi 6E + Bluetooth 5.3", price:189, t:3 },
      { id:"wifi-25g", name:"כרטיס רשת 2.5GbE", spec:"חיבור קווי מהיר", price:129, t:3 }
    ]
  };
  const SERVICES = [
    { id:"assembly", label:"הרכבה מקצועית ובדיקת עומסים", price:0 },
    { id:"windows", label:"התקנת Windows 11 + דרייברים", price:149 }
  ];
  const USE_CASES = [
    { key:"gaming", icon:"🎮", label:"גיימינג", chipsLabel:"אילו משחקים מעניינים אותך?", res:true,
      chips:["Fortnite","Valorant","GTA V","Call of Duty: Warzone","Cyberpunk 2077","EA FC 25","Apex Legends","Minecraft"] },
    { key:"office", icon:"💼", label:"עבודה משרדית", chipsLabel:"מה תריץ ביום-יום?", res:false,
      chips:["מסמכי אופיס וגיליונות","עשרות טאבים פתוחים","שיחות זום / טימז","כמה תוכנות בו-זמנית","מערכת CRM / ניהול"] },
    { key:"creative", icon:"🎬", label:"עריכת וידאו/גרפיקה", chipsLabel:"באילו תוכנות תשתמש?", res:false,
      chips:["Adobe Premiere Pro","DaVinci Resolve","Adobe Photoshop","After Effects","Blender","Adobe Illustrator"] },
    { key:"general", icon:"🏠", label:"שימוש כללי", chipsLabel:"איך המחשב ישמש אותך?", res:false,
      chips:["גלישה ורשתות חברתיות","צפייה בסטרימינג","שיעורי בית / לימודים","ניהול תקציב ביתי","שימוש משפחתי משותף"] }
  ];
  const NEEDED = ["cpu","mobo","ram","storage","psu","case"];
  window.DVIR_BUILDER_DATA = { P, CATS, CATALOG, SERVICES, USE_CASES, NEEDED };
})();

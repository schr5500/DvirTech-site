/* =====================================================================
   DvirTech — קובץ הקטלוג
   =====================================================================
   הקובץ היחיד שצריך לערוך כדי להוסיף/להסיר/לעדכן מוצרים. שאר האתר קורא
   ממנו אוטומטית: אפשרויות הבחירה, מנוע ההתאמה, התרשים החי, וה-AI.

   שדות משותפים לכל פריט: id, name, spec, price. img אופציונלי.
   nameEn / specEn — התרגום לאנגלית להצגה כשהאתר במצב שפה אנגלי. אם
   nameEn חסר, מוצג name גם באנגלית (טוב לשמות מותג שזהים בשתי השפות,
   כמו "Intel Core i5-13400F"). specEn מומלץ תמיד כי מפרטים כוללים עברית.
   labelEn על כל קטגוריה — שם הקטגוריה באנגלית.

   שדות מיוחדים לפי קטגוריה מפורטים בהערה שמעל כל קטגוריה למטה.
===================================================================== */

const CATALOG = {

  // socket, tier(1-4, למניעת bottleneck), ramType, maxRamGb, overclockable (K-series וכו')
  // tdp: לצורך התאמת קירור, זהו הספק החום המרבי בפועל (Intel: PL2/Turbo, AMD: PPT) ולא ה-"TDP הבסיסי"
  // השיווקי — כי זה המספר שקירור אמיתי צריך להתמודד איתו. מקור: בדיקה מול נתוני יצרן/סקירות (יולי 2026).
  cpu: { label:"מעבד", labelEn:"CPU", icon:"cpu", items:[
    { id:"i3-13100f", name:"Intel Core i3-13100F", spec:"4 core · 1700 socket", specEn:"4 cores · Socket 1700", price:550, socket:"LGA1700", tier:1, ramType:"DDR5", maxRamGb:128, tdp:89, overclockable:false, img:"" },
    { id:"i5-13400f", name:"Intel Core i5-13400F", spec:"6P+4E core · 1700 socket", specEn:"6P+4E core · Socket 1700", price:1250, socket:"LGA1700", tier:2, ramType:"DDR5", maxRamGb:128, tdp:148, overclockable:false, img:"" },
    { id:"i7-14700kf", name:"Intel Core i7-14700KF", spec:"20 core · 1700 socket", specEn:"20 core · Socket 1700", price:2050, socket:"LGA1700", tier:4, ramType:"DDR5", maxRamGb:192, tdp:253, overclockable:true, img:"" },
    { id:"i9-14900k", name:"Intel Core i9-14900K", spec:"24 core · 1700 socket", specEn:"24 core · Socket 1700", price:2650, socket:"LGA1700", tier:4, ramType:"DDR5", maxRamGb:192, tdp:253, overclockable:true, img:"" },
    { id:"r5-7600", name:"AMD Ryzen 5 7600", spec:"6 core · AM5 socket", specEn:"6 core · Socket AM5", price:1100, socket:"AM5", tier:2, ramType:"DDR5", maxRamGb:128, tdp:88, overclockable:true, img:"" },
    { id:"r7-7800x3d", name:"AMD Ryzen 7 7800X3D", spec:"8 core 3D V-Cache · AM5", specEn:"8 core 3D V-Cache · Socket AM5", price:2150, socket:"AM5", tier:3, ramType:"DDR5", maxRamGb:128, tdp:162, overclockable:false, img:"" },
    { id:"r9-7900x", name:"AMD Ryzen 9 7900X", spec:"12 core · AM5 socket", specEn:"12 cores · Socket AM5", price:1800, socket:"AM5", tier:4, ramType:"DDR5", maxRamGb:128, tdp:230, overclockable:true, img:"" },
    { id:"xeon-4310", name:"Intel Xeon Silver 4310 (שרת)", nameEn:"Intel Xeon Silver 4310 (Server)", spec:"12 core · LGA4189 · תומך בהתקנה כפולה", specEn:"12 core · LGA4189 · supports dual-CPU install", price:3200, socket:"LGA4189", tier:3, ramType:"DDR4", maxRamGb:1024, tdp:120, overclockable:false, img:"" }
  ]},

  // socket, ramSlots, maxRamGb, cpuSockets (ברירת מחדל 1), supportsOverclocking,
  // tier (1=בסיסי עד 4=פרימיום — לזיהוי "מעבר לנדרש"), m2Slots (כמות חריצי NVMe),
  // ramType (DDR4/DDR5 — סוג הזיכרון הפיזי שהלוח תומך בו), formFactor (גודל פיזי, לבדיקת התאמה למארז)
  mobo:{ label:"לוח אם", labelEn:"Motherboard", icon:"mobo", items:[
    { id:"b760m", name:"MSI PRO B760M-A", spec:"DDR5 · 1700 socket · 4 חריצי RAM", specEn:"DDR5 · Socket 1700 · 4 RAM slots", price:550, socket:"LGA1700", ramSlots:4, maxRamGb:192, cpuSockets:1, supportsOverclocking:false, tier:1, m2Slots:2, ramType:"DDR5", formFactor:"mATX", img:"" },
    { id:"z790", name:"ASUS ROG STRIX Z790-A", spec:"DDR5 · 1700 socket · 4 חריצי RAM", specEn:"DDR5 · Socket 1700 · 4 RAM slots", price:1450, socket:"LGA1700", ramSlots:4, maxRamGb:192, cpuSockets:1, supportsOverclocking:true, tier:3, m2Slots:4, ramType:"DDR5", formFactor:"ATX", img:"" },
    { id:"b650m", name:"Gigabyte B650M AORUS", spec:"DDR5 · AM5 socket · 4 חריצי RAM", specEn:"DDR5 · Socket AM5 · 4 RAM slots", price:650, socket:"AM5", ramSlots:4, maxRamGb:128, cpuSockets:1, supportsOverclocking:true, tier:1, m2Slots:2, ramType:"DDR5", formFactor:"mATX", img:"" },
    { id:"b650-atx", name:"Gigabyte B650 AORUS ELITE AX", spec:"DDR5 · AM5 socket · 4 חריצי RAM", specEn:"DDR5 · Socket AM5 · 4 RAM slots", price:750, socket:"AM5", ramSlots:4, maxRamGb:128, cpuSockets:1, supportsOverclocking:true, tier:2, m2Slots:3, ramType:"DDR5", formFactor:"ATX", img:"" },
    { id:"x670e", name:"ASUS ROG X670E-E", spec:"DDR5 · AM5 socket · 4 חריצי RAM", specEn:"DDR5 · Socket AM5 · 4 RAM slots", price:1700, socket:"AM5", ramSlots:4, maxRamGb:128, cpuSockets:1, supportsOverclocking:true, tier:3, m2Slots:4, ramType:"DDR5", formFactor:"ATX", img:"" },
    { id:"supermicro-x12", name:"Supermicro X12DPi-N6 (שרת, Dual CPU)", nameEn:"Supermicro X12DPi-N6 (Server, Dual CPU)", spec:"LGA4189 · 16 חריצי RAM · 2 תושבות מעבד", specEn:"LGA4189 · 16 RAM slots · 2 CPU sockets", price:5200, socket:"LGA4189", ramSlots:16, maxRamGb:2048, cpuSockets:2, supportsOverclocking:false, tier:4, m2Slots:2, ramType:"DDR4", formFactor:"EEB", img:"" }
  ]},

  // capacityGb = קיבולת הקיט כולו, sticks = מקלות פיזיים בקיט, speedMhz/cl = מהירות וזמן תגובה אמיתיים
  // ramType (DDR4/DDR5) — חייב להתאים ל-ramType של הלוח אם, אחרת לא נכנס פיזית לחריץ
  ram:{ label:"זיכרון RAM", labelEn:"RAM", icon:"ram", items:[
    { id:"16gb", name:"16GB DDR5 5600MHz CL36", spec:"קיט 2x8GB · DDR5-5600 CL36", specEn:"2x8GB kit · DDR5-5600 CL36", price:320, capacityGb:16, sticks:2, speedMhz:5600, cl:36, ramType:"DDR5", img:"" },
    { id:"32gb", name:"32GB DDR5 6000MHz CL30", spec:"קיט 2x16GB · DDR5-6000 CL30", specEn:"2x16GB kit · DDR5-6000 CL30", price:620, capacityGb:32, sticks:2, speedMhz:6000, cl:30, ramType:"DDR5", img:"" },
    { id:"48gb", name:"48GB DDR5 6000MHz CL30", spec:"קיט 2x24GB · DDR5-6000 CL30", specEn:"2x24GB kit · DDR5-6000 CL30", price:850, capacityGb:48, sticks:2, speedMhz:6000, cl:30, ramType:"DDR5", img:"" },
    { id:"64gb", name:"64GB DDR5 6000MHz CL32", spec:"קיט 2x32GB · DDR5-6000 CL32", specEn:"2x32GB kit · DDR5-6000 CL32", price:1250, capacityGb:64, sticks:2, speedMhz:6000, cl:32, ramType:"DDR5", img:"" },
    { id:"32gb-ddr4", name:"32GB DDR4 3200MHz CL22 ECC", spec:"קיט 2x16GB · DDR4-3200 ECC (לשרתים)", specEn:"2x16GB kit · DDR4-3200 ECC (for servers)", price:580, capacityGb:32, sticks:2, speedMhz:3200, cl:22, ramType:"DDR4", img:"" }
  ]},

  // tier(0-4), lengthMm (אורך הכרטיס לבדיקת מארז), tdpWatts, recommendedPsuWatts (הספק ספק כוח מומלץ)
  gpu:{ label:"כרטיס מסך (אופציונלי)", labelEn:"Graphics Card (optional)", icon:"gpu", items:[
    { id:"none", name:"ללא כרטיס מסך (מובנה)", nameEn:"No dedicated GPU (integrated)", spec:"למשרד / גלישה בלבד", specEn:"For office use / browsing only", price:0, tier:0, lengthMm:0, tdpWatts:0, recommendedPsuWatts:0, img:"" },
    { id:"rx7600", name:"AMD RX 7600", spec:"8GB GDDR6 · 204mm", specEn:"8GB GDDR6 · 204mm", price:1050, tier:1, lengthMm:204, tdpWatts:165, recommendedPsuWatts:550, img:"" },
    { id:"rtx4060", name:"NVIDIA RTX 4060", spec:"8GB GDDR6 · 244mm", specEn:"8GB GDDR6 · 244mm", price:1450, tier:2, lengthMm:244, tdpWatts:115, recommendedPsuWatts:550, img:"" },
    { id:"rtx4060ti-16gb", name:"NVIDIA RTX 4060 Ti 16GB", spec:"16GB GDDR6 · 244mm", specEn:"16GB GDDR6 · 244mm", price:1900, tier:2, lengthMm:244, tdpWatts:165, recommendedPsuWatts:600, img:"" },
    { id:"rx7800xt", name:"AMD RX 7800 XT", spec:"16GB GDDR6 · 267mm", specEn:"16GB GDDR6 · 267mm", price:2200, tier:3, lengthMm:267, tdpWatts:263, recommendedPsuWatts:700, img:"" },
    { id:"rtx4070s", name:"NVIDIA RTX 4070 Super", spec:"12GB GDDR6X · 267mm", specEn:"12GB GDDR6X · 267mm", price:2650, tier:3, lengthMm:267, tdpWatts:220, recommendedPsuWatts:650, img:"" },
    { id:"rtx4080s", name:"NVIDIA RTX 4080 Super", spec:"16GB GDDR6X · 310mm", specEn:"16GB GDDR6X · 310mm", price:4600, tier:4, lengthMm:310, tdpWatts:320, recommendedPsuWatts:750, img:"" }
  ]},

  // type: "air"/"aio". heightMm רלוונטי ל-air בלבד. radiatorMm רלוונטי ל-aio בלבד.
  // sockets: תושבות נתמכות. tdpRating: כמה חום הקירור מסוגל לפנות (וואט).
  cooling:{ label:"קירור מעבד", labelEn:"CPU Cooling", icon:"cooling", items:[
    { id:"air-basic", name:"Cooler Master Hyper 212", spec:"קירור אוויר · גובה 159mm", specEn:"Air cooler · 159mm height", price:150, type:"air", heightMm:159, tdpRating:150, sockets:["LGA1700","AM5","LGA4189"], img:"" },
    { id:"air-highend", name:"Noctua NH-D15", spec:"קירור אוויר פרימיום · גובה 165mm", specEn:"Premium air cooler · 165mm height", price:420, type:"air", heightMm:165, tdpRating:220, sockets:["LGA1700","AM5"], img:"" },
    { id:"aio240", name:"AIO נוזלי 240mm", nameEn:"240mm Liquid AIO Cooler", spec:"רדיאטור 240mm", specEn:"240mm radiator", price:380, type:"aio", radiatorMm:240, tdpRating:200, sockets:["LGA1700","AM5"], img:"" },
    { id:"aio280", name:"AIO נוזלי 280mm", nameEn:"280mm Liquid AIO Cooler", spec:"רדיאטור 280mm", specEn:"280mm radiator", price:450, type:"aio", radiatorMm:280, tdpRating:240, sockets:["LGA1700","AM5"], img:"" },
    { id:"aio360", name:"AIO נוזלי 360mm", nameEn:"360mm Liquid AIO Cooler", spec:"רדיאטור 360mm", specEn:"360mm radiator", price:520, type:"aio", radiatorMm:360, tdpRating:280, sockets:["LGA1700","AM5"], img:"" }
  ]},

  storage:{ label:"אחסון", labelEn:"Storage", icon:"storage", items:[
    { id:"500gb", name:"500GB NVMe Gen4 SSD", spec:"מהירות קריאה עד 5000MB/s", specEn:"Read speeds up to 5000MB/s", price:180, img:"" },
    { id:"1tb", name:"1TB NVMe Gen4 SSD", spec:"מהירות קריאה עד 7000MB/s", specEn:"Read speeds up to 7000MB/s", price:280, img:"" },
    { id:"2tb", name:"2TB NVMe Gen4 SSD", spec:"מהירות קריאה עד 7000MB/s", specEn:"Read speeds up to 7000MB/s", price:480, img:"" },
    { id:"4tb", name:"4TB NVMe Gen4 SSD", spec:"מהירות קריאה עד 7000MB/s", specEn:"Read speeds up to 7000MB/s", price:850, img:"" }
  ]},

  // wattage = הספק בוואט. connectors מוצג כמידע ללקוח (לא חוסם בפני עצמו).
  psu:{ label:"ספק כוח", labelEn:"Power Supply (PSU)", icon:"psu", items:[
    { id:"650w", name:"650W 80+ Gold", spec:"מודולרי חלקית", specEn:"Semi-modular", price:330, wattage:650, connectors:"24-pin, 1x8-pin CPU, 2x PCIe 8-pin", img:"" },
    { id:"750w", name:"750W 80+ Gold", spec:"מודולרי מלא", specEn:"Fully modular", price:400, wattage:750, connectors:"24-pin, 2x8-pin CPU, 1x16-pin (12VHPWR)", img:"" },
    { id:"850w", name:"850W 80+ Gold", spec:"מודולרי מלא", specEn:"Fully modular", price:480, wattage:850, connectors:"24-pin, 2x8-pin CPU, 1x16-pin (12VHPWR)", img:"" },
    { id:"1000w", name:"1000W 80+ Platinum", spec:"מודולרי מלא", specEn:"Fully modular", price:650, wattage:1000, connectors:"24-pin, 2x8-pin CPU, 1x16-pin (12VHPWR) + 2x8-pin", img:"" }
  ]},

  // maxGpuLengthMm, maxAirCoolerHeightMm, radiatorSupport: {front, top} בגודל מ"מ הגדול ביותר הנתמך (null = לא נתמך)
  // supportedFormFactors: אילו גדלי לוח אם נכנסים פיזית למארז (מהקטן לגדול: ITX < mATX < ATX < EEB)
  case:{ label:"מארז", labelEn:"Case", icon:"case", items:[
    { id:"white", name:"מארז קומפקטי לבן", nameEn:"White Compact Case", spec:"זרימת אוויר טובה", specEn:"Good airflow", price:320, maxGpuLengthMm:300, maxAirCoolerHeightMm:160, radiatorSupport:{front:240, top:null}, supportedFormFactors:["ITX","mATX"], img:"" },
    { id:"lancool216", name:"Lian Li LANCOOL 216 ARGB", spec:"זרימת אוויר גבוהה · 2x160mm+1x140mm ARGB", specEn:"High airflow · 2x160mm+1x140mm ARGB fans", price:460, maxGpuLengthMm:392, maxAirCoolerHeightMm:180, radiatorSupport:{front:360, top:360}, supportedFormFactors:["ITX","mATX","ATX"], img:"" },
    { id:"glass", name:"מארז ATX עם זכוכית", nameEn:"ATX Case with Tempered Glass", spec:"3 מאווררים כלולים", specEn:"3 fans included", price:420, maxGpuLengthMm:340, maxAirCoolerHeightMm:170, radiatorSupport:{front:360, top:240}, supportedFormFactors:["ITX","mATX","ATX"], img:"" },
    { id:"fulltower", name:"מארז Full-Tower / שרת", nameEn:"Full-Tower / Server Case", spec:"תומך בלוחות ענק ובקירור מקסימלי", specEn:"Fits oversized boards with maximum cooling room", price:680, maxGpuLengthMm:400, maxAirCoolerHeightMm:190, radiatorSupport:{front:360, top:360}, supportedFormFactors:["ITX","mATX","ATX","EEB"], img:"" }
  ]},

  // שירותים אופציונליים, תמיד תואמים לכל הרכב
  services:{ label:"שירותים נוספים", labelEn:"Additional Services", icon:"services", items:[
    { id:"none", name:"ללא שירות נוסף", nameEn:"No additional service", spec:"", specEn:"", price:0, img:"" },
    { id:"winsetup", name:"התקנת Windows 11 + כל הדרייברים", nameEn:"Windows 11 installation + all drivers", spec:"מותקן ונבדק לפני מסירה", specEn:"Installed and tested before delivery", price:150, img:"" }
  ]}
};

const STEP_ORDER = ["cpu","mobo","ram","gpu","cooling","storage","psu","case","services"];

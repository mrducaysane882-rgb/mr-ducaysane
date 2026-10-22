/* ============================================================
   MR.ducaysane — Nuxurka Waxbarashada / Learning Content Data
   Dhammaan casharrada iyo imtixaannada Af-Soomaali.
   Faylkan waa xog-keliya (data only) — HTML ma jiro halkan.
   ============================================================ */

const CATEGORIES = [
  {
    id: "computer",
    title: "Aasaaska Computer-ka",
    icon: "computer",
    desc: "Bilow meesha: baro qaybaha computer-ka, sida loo isticmaalo, faylalka iyo qalabka aasaasiga ah ee maalinlaha ah.",
    color: "#1D6BF0"
  },
  {
    id: "internet",
    title: "Internet-ka iyo Email-ka",
    icon: "globe",
    desc: "Baro sida internet-ka u shaqeeyo, sida loo sameeyo email, loo isticmaalo browser-ka oo loo raadiyo xog aan la kala qaybin.",
    color: "#0EA5E9"
  },
  {
    id: "safety",
    title: "Badbaadada Internet-ka",
    icon: "shield",
    desc: "Xirfad muhiim ah: ilaalinta furaha sirta ah, xatooyada xogta (phishing), khaladaadka online-ka iyo xogtaada gaarka ah.",
    color: "#16A34A"
  },
  {
    id: "html",
    title: "Barashada HTML",
    icon: "code",
    desc: "Aasaaska web-dhiska: baro HTML-ka, xarfaha (tags), qoraalka, xiriirka, sawirka iyo qaab-dhismeedka bogga.",
    color: "#E11D48"
  },
  {
    id: "css",
    title: "Barashada CSS",
    icon: "palette",
    desc: "Sida boggaga loo qaabeeyo: midab, fonto, is-dhaf, layout-ga iyo sida boggu uga muuqdo telefoonka iyo komputerka.",
    color: "#7C3AED"
  },
  {
    id: "js",
    title: "JavaScript aasaasiga ah",
    icon: "braces",
    desc: "Computer-ka u dir amarro: variables, shuruudo, loops iyo sida bogga loo sameeyo mid firfircoon oo la falgala.",
    color: "#D97706"
  }
];

/* Content block types:
   h2, h3  → heading (x)
   p       → paragraph (x)
   ul      → bullet list (items)
   ol      → numbered list (items)
   code    → code sample (label, code, lang)
   tip     → tip callout (title, x)
   warn    → warning callout (title, x)
   safe    → safety callout (title, x)
   example → example box (title, x)
   table   → table (head: [], rows: [[]])
*/

const LESSONS = [
  /* ==================== COMPUTER ==================== */
  {
    id: "computer-1",
    category: "computer",
    title: "Computer-ku waa maxay?",
    summary: "Baro waxa computer-ku yahay, taariydiisa kooban iyo sababta uu u noqday qalabka ugu muhiimsan adduunka.",
    duration: "8 daqiiqo",
    level: "Aasaas",
    content: [
      { t: "p", x: "Computer-ka (kombuyuutarka) waa qalab elektroonig ah oo ku shaqeeya xisaabta (mathematics) oo aad u tiro badan. Wuxuu qaadan karaa xog (data), wuxuu ku xisaabin karaa, wuxuuna soo saaraa natiijooyin. Magaca <strong>“computer”</strong> ka yimid yahay ereyga English-ka <em>“to compute”</em> oo ah “xisaabi”." },
      { t: "h2", x: "Taariikh kooban" },
      { t: "p", x: "Computer-ku ma bilaabmin sida maanta oo kale. Waxay bilaabatay mishiinno waaweyn oo loo yaqaan <strong>“mainframes”</strong> kuwaas oo buuxin jiray qolal oo aad u qaali ah. Sanaddii 1970-yadii waxaa yimid computer-yada yaryar (personal computers) kuwaas oo guriga iyo xafiiska loo isticmaali karo. Maanta, laptop-ka, telefoonka gacanta (smartphone) iyo tablet-ka waxaa lagu tirinayaa nooc computer-yada yaryar ah." },
      { t: "h2", x: "Maxaa ugu muhiimsan computer-ka?" },
      { t: "ul", items: [
        "<strong>Xisaab degdeg ah:</strong> computer-ku wuxuu milyan xisaab ah ka dhaqaajin karaa ilbiriqsi.",
        "<strong>Kaydinta xogta:</strong> warqado, sawiro, muuqaal iyo casharro buuxa ayuu kaydin karaa meel yar.",
        "<strong>Xiriirka dadweynaha:</strong> wuxuu kuu ogolaadayaa inaad la hadasho qof ku nool dunida kale.",
        "<strong>Shaqooyinka cusub:</strong> web-dhiska, sawir-qaadista, barnaamijyada iyo waxbarashada online-ka."
      ] },
      { t: "example", title: "Tusaale fudud", x: "Markaad telefoonkaaga ku qorto “4 + 5 = ”, telefoonku wuxuu ku tusayaa “9”. Computer-ku wuxuu sameeyay mid ka mid ah hawlaha ugu fudud: xisaab. Fikirka computer-ka wax badan ayuu ka fudud yahay kan bani'aadam, laakiin wuxuu ku shaqeeyaa amarro badan oo xawaare sare leh." },
      { t: "h2", x: "Qaybaha ugu muhiimsan" },
      { t: "p", x: "Computer-ku waxaa lagu kala saaraa laba qaybood weyn: <strong>Qalabka (Hardware)</strong> oo ah waxa aad arki karto oo taaban karto, iyo <strong>Barnaamijyada (Software)</strong> oo ah amarro aan la arki karin laakiin computer-ka ku shaqeeya." },
      { t: "table", head: ["Qayb", "Waa maxay?", "Tusaale"], rows: [
        ["Hardware", "Qalabka jidhka ee computer-ka", "Keyboard-ka, mowjada (screen), mouse-ka"],
        ["Software", "Barnaamijyada iyo nidaamyada", "Windows, browser-ka, barnaamijka qoraalka"],
        ["Input", "Waxa aad computer-ka siiyso", "Keyboard-ka, mouse-ka, kamaradda"],
        ["Output", "Waxa computer-ku kuu soo saaro", "Mowjada, codka, daabacaadda"]
      ] },
      { t: "tip", title: "Xusuus", x: "Computer-ku ma fahmo af Soomaali ama English ilaa aad u sheegto sida loo fahmo — taas waxaa lagu sameeyaa barnaamijyo (programs) iyo luqado loo sameeyay computer-ka." }
    ],
    quiz: [
      { q: "Computer-ku waxaa lagu qeexi karaa sida…", options: ["Qalab elektroonig ah oo xog qaata, xisaabiyaa, kaydiyana", "Qalab warshadeed oo keliya xisaabta u shaqeeya", "Telefoonka gacanta ah ee kaliya", "Mishiinka daabacaadda"], answer: 0, explain: "Computer-ku wuxuu xog qaadaa (input), wuxuu ku xisaabiyaa, wuxuuna kaydiyaa oo soo saaraa natiijo (output)." },
      { q: "Ereyga “computer” wuxuu ka yimid yahay ereyga…", options: ["English-ka “to compute” oo ah xisaabid", "Latin-ka oo ah qoraal", "Carabi oo ah xisaabid", "Chinese oo ah mishiin"], answer: 0, explain: "“Compute” macnihiisu waa “xisaabi”, taas darteed computer-ka macnihiisu waa “xisaabiye”." },
      { q: "Qaybaha computer-ka waxaa lagu kala saaraa…", options: ["Qalab (hardware) iyo Barnaamij (software)", "Kaliya qalab", "Kaliya barnaamij", "Mowjada iyo keyboard-ka"], answer: 0, explain: "Hardware waa waxa taaban karo, software-ka waa amarro aan la arki karin." },
      { q: "Tusaalaha ugu fiican ee “Input” (waxa computer-ka la siiyo) waa…", options: ["Keyboard-ka", "Mowjada (screen)", "Codka ka soo baxaya", "Sawirka daabacan"], answer: 0, explain: "Keyboard-ka waa qalab aad ku siinayso xogta computer-ka. Mowjada iyo codka waa Output." },
      { q: "Computer-yada yaryar (personal computers) waxay yimaadeen…", options: ["Sanadihii 1970-yadii", "Sanadkii 2020", "Maanta oo keliya", "Qarnigii 15aad"], answer: 0, explain: "Sanadihii 1970-yadii waxaa yimid computer-yada yaryar ee guriga iyo xafiiska loo isticmaalo." }
    ]
  },
  {
    id: "computer-2",
    category: "computer",
    title: "Qaybaha Computer-ka: Hardware iyo Software",
    summary: "Bilan qayb kasta oo computer-ka: keyboard, mowjada, processor-ka, nidaamka hawl-galka iyo barnaamijyada.",
    duration: "10 daqiiqo",
    level: "Aasaas",
    content: [
      { t: "p", x: "Si aad u fahanto computer-ka, waa inaad wax ka qabataa qaybihiisa. Waxaan ku bilaabaynaa <strong>Qalabka (Hardware)</strong> iyo <strong>Barnaamijyada (Software)</strong>." },
      { t: "h2", x: "Hardware — Qalabka jidhka" },
      { t: "p", x: "Hardware waa dhammaan qaybaha jidhka ee computer-ka oo aad arki karto oo taaban karto. Waxaa ka mid ah:" },
      { t: "ul", items: [
        "<strong>Keyboard-ka:</strong> qalabka aad ku qorto farriimo, xisaab iyo barnaamijyo.",
        "<strong>Mowjada (Monitor/Screen):</strong> meesha waxyaabaha computer-ka ka muuqdaan.",
        "<strong>Mouse-ka:</strong> qalab yar oo aad ku dhaqaajiso gacanta (cursor) mowjada ku jirta.",
        "<strong>Processor-ka (CPU):</strong> “maskaxda” computer-ka, wuxuu fuliyaa dhammaan amarrada.",
        "<strong>Kaydinta (RAM & Disk):</strong> RAM waa kayd gaaban oo xawaare, Disk-ka (SSD/HDD) waa kayd waayeel oo waqti dheer.",
        "<strong>Keyboard-ka, headset-ka iyo kamaradda:</strong> qalabka dhinacyada ah ee la isticmaalo."
      ] },
      { t: "h2", x: "Software — Barnaamijyada" },
      { t: "p", x: "Software-ka waa amarro aan la taaban karin oo computer-ka ku shaqeeya. Waxaa loo kala saaraa laba nooc:" },
      { t: "table", head: ["Nooc", "Sharax", "Tusaale"], rows: [
        ["Nidaamka hawl-galka (OS)", "Barnaamijka ugu weyn oo qalabka kale u shaqeeya", "Windows, macOS, Linux, Android"],
        ["Barnaamijyada (Apps)", "Shaquo gaar ah qabanaya", "Browser, Word, Excel, barnaamijka sawirka"]
      ] },
      { t: "tip", title: "Faham fudud", x: "Fikir computer-ka sida gaari: Hardware waa gaariga jidhkiisa (baabuurka), software-ka waa darawalka oo maamula. Gaari la'aan darawal ma jiro, darawal la'aan gaari ma shaqeeyo." },
      { t: "h2", x: "Sida ay isugu xiran yihiin" },
      { t: "ol", items: [
        "Waxaad taabataa keyboard-ka (input).",
        "Processor-ku (CPU) wuxuu akhriyaa amarka.",
        "Nidaamka hawl-galku wuxuu u diraa barnaamijka saxda ah.",
        "Barnaamijku wuxuu soo saaraa natiijo mowjada ku muuqata (output)."
      ] },
      { t: "example", title: "Tusaale hawleed", x: "Markaad furto barnaamijka qoraalka oo aad qorto “Salaan”, keyboard-ku waa input, processor-ku wuxuu fahmayaa, nidaamka hawl-galku wuxuu furaya barnaamijka qoraalka, qoraalkuna wuxuu ka muuqdaa mowjada." },
      { t: "warn", title: "Digniin", x: "Ha ku dhibin inaad xafiddo magacyada dhammaan qaybaha. Waxyaabaha muhiimka ah waa inaad fahanto shaqadooda oo aad aragto s ay isugu xiran yihiin." }
    ],
    quiz: [
      { q: "Processor-ka (CPU) waxaa loo yaqaan…", options: ["Maskaxda computer-ka", "Mowjada computer-ka", "Keyboard-ka", "Kaydinta weyn"], answer: 0, explain: "CPU: (CPU) waa qaybta fulisa dhammaan amarrada, sida maskaxda." },
      { q: "Nidaamka hawl-galka (Operating System) waa…", options: ["Barnaamijka ugu weyn ee qalabka maamula", "Browser-ka kaliya", "Keyboard-ka", "Sawir-qaade"], answer: 0, explain: "Nidaamka hawl-galka (tusaale Windows) wuxuu maamulaa dhammaan qalabka iyo barnaamijyada." },
      { q: "RAM-ku waxaa ugu fiican…", options: ["Xisaabinta iyo hawlgelinta hadda", "Kaydinta muuqaalada waqti dheer", "Daabacaadda warqadaha", "Xiriirka internet-ka"], answer: 0, explain: "RAM waa kayd xawaare sare leh oo la isticmaalo inta barnaamijku shaqaynayo. Disk-ka waa kayd waayeel." },
      { q: "Markaad qabato mouse-ka oo aad tabaabusho gacanta mowjada ku jirta, waxaad isticmaalaysaa…", options: ["Input device", "Output device", "Processor", "RAM"], answer: 0, explain: "Mouse-ka waa qalab aad computer-ka ku siinayso tilmaamo (input)." },
      { q: "Tusaalaha nidaamka hawl-galka ee telefoonka gacanta waa…", options: ["Android ama iOS", "Word", "Chrome", "Excel"], answer: 0, explain: "Android iyo iOS waa nidaamyo hawl-gal oo telefoonada gacanta lagu isticmaalo." }
    ]
  },
  {
    id: "computer-3",
    category: "computer",
    title: "Faylalka, Foldarada iyo Qalabka Aasaasiga ah",
    summary: "Baro sida loo kaydiyo faylalka, sida foldarada loo maamulo iyo qalabka aasaasiga ah ee qoraalka iyo daabacaadda.",
    duration: "9 daqiiqo",
    level: "Aasaas",
    content: [
      { t: "p", x: "Computer-ka waxaa lagu kaydiyaa <strong>faylal (files)</strong> iyo <strong>foldaro (folders)</strong>. Fahamkoodu waa aasaaska maamulka xogtaada." },
      { t: "h2", x: "Faylalka (Files)" },
      { t: "p", x: "Fayl waa kayd xog ah oo magac leh. Tusaale, qoraal aad qortay, sawir aad qaaday, ama muuqaal aad duubtay — dhammaantood waa faylal. Kow kasta wuxuu leeyahay <strong>magac (name)</strong> iyo <strong>nooc (type)</strong>." },
      { t: "table", head: ["Nooca faylka", "Dhamaadka", "Tusaale"], rows: [
        ["Qoraal", ".txt / .docx", "cashar.txt"],
        ["Sawir", ".jpg / .png", "sawir.png"],
        ["Muuqaal", ".mp4", "video.mp4"],
        ["Barnaamij", ".exe / .app", "barn.exe"],
        ["Web", ".html / .css", "bog.html"]
      ] },
      { t: "h2", x: "Foldarada (Folders)" },
      { t: "p", x: "Foldar waa meel faylal loo kaydiyo, sida sanduuq warqado lagu keydiyo. Isticmaalka foldaro kala duwan wuxuu ka dhigayaa helitaanka faylalka mid fudud." },
      { t: "ol", items: [
        "Samee foldar loo yaqaan “Waxbarasho”.",
        "Gudihiisa samee “Casharro” iyo “Imtixaanno”.",
        "Ku kaydi faylalka qaybtooda si aad u hesho."
      ] },
      { t: "example", title: "Tusaale nidaam", x: "Computer-ka → Waxbarasho → Casharro → cashar-1.txt. Nidaamkan oo kale ayaa lagu maamulaa xafiisyada waaweyn ee dunida." },
      { t: "h2", x: "Qalabka aasaasiga ah" },
      { t: "ul", items: [
        "<strong>Barnaamijka qoraalka (Word/Notepad):</strong> qoraal iyo warqado samaynta.",
        "<strong>Barnaamijka xisaabta (Excel):</strong> xisaab, jadwal iyo macluumaad.",
        "<strong>Browser-ka:</strong> internet-ka iyo bogagga daawashada.",
        "<strong>Barnaamijka sawirka:</strong> sawiro samaynta iyo hagaajinta.",
        "<strong>USB/Cloud:</strong> kaydinta iyo gaadhsiinta faylalka meel fog."
      ] },
      { t: "safe", title: "Xeer muhiim ah", x: "Ha kaydin faylalka muhiimka ah meel keliya. Isticmaal laba meel: qalabkaaga iyo kayd dibadeed (USB ama cloud) si aad uga hortagto luminta." },
      { t: "warn", title: "Feejignaan", x: "Faylalka ka shakiya kuwa ka soo baxaya qof aan aqoon — waxay noqon karaan barnaamijyeedyo khatar ah (virus). Fur oo kaliya kuwa aad kalsoonto leedahay." }
    ],
    quiz: [
      { q: "Faylka .jpg waa nooc…", options: ["Sawir", "Qoraal", "Muuqaal", "Barnaamij"], answer: 0, explain: ".jpg iyo .png waa dhamaadyada faylalka sawirka." },
      { q: "Foldarka (folder) waxaa loo isticmaalaa…", options: ["Si faylal badan loo kaydiyo si nidaamsan", "Internet-ka si loo furto", "Computer-ka si loo xiro", "Qoraalka si loo daabaco"], answer: 0, explain: "Foldar waa meel faylal lagu kaydiyo, sida sanduuq warqado lagu keydiyo." },
      { q: "Barnaamijka xisaabta (Excel) waxaa loo isticmaalaa ugu badnaan…", options: ["Xisaab iyo jadwal", "Muuqaal duubista", "Sawir samaynta", "Internet-ka daawashada"], answer: 0, explain: "Excel waa barnaamij xisaab iyo macluumaad jadwalaysan lagu maamulo." },
      { q: "Si aad uga hortagto luminta faylalka, waxaa lagu talinayaa…", options: ["Kaydinta meel labaad (USB/cloud)", "Kala tirtirista faylalka", "U dirista qof kasta", "Luminta computer-ka"], answer: 0, explain: "Kaydinta laba meel (qalab + dibad) waa xeer aasaasi ah oo badbaado." },
      { q: "“Input” aasaasiga ah ee qalabka waa…", options: ["Keyboard-ka iyo mouse-ka", "Mowjada", "Kareemka", "Daabacaadda"], answer: 0, explain: "Keyboard-ka iyo mouse-ka waa qalabka aad computer-ka ku siinayso tilmaamo." }
    ]
  },

  /* ==================== INTERNET ==================== */
  {
    id: "internet-1",
    category: "internet",
    title: "Internet-ku waa maxay?",
    summary: "Faham sida internet-ku u shaqeeyo, waa maxay webpage, browser iyo sida xogtu u soo gaadho qalabkaaga.",
    duration: "9 daqiiqo",
    level: "Aasaas",
    content: [
      { t: "p", x: "Internet-ku waa xarig weyn oo isku xira milyan computer-yada adduunka oo dhan. Wuxuu u ogolaadayaa in xog la wadaagto qof kasta oo dunida ku nool. Magaca <strong>“internet”</strong> ka yimid yahay ereyga <em>“inter-network”</em> — “network” oo ka dhigan “network computer-yada isku xiran”." },
      { t: "h2", x: "Sidee u shaqeeyaa?" },
      { t: "ul", items: [
        "<strong>Web-yada (websites):</strong> bogag internet-ka ku jira, sida bogga aad hadda joogto.",
        "<strong>Server-ka:</strong> computer waayeel ah oo kaydiya bogagga oo markaad weydiisato kuu soo diro.",
        "<strong>Browser-ka:</strong> barnaamijka aad ku furto bogagga, tusaale Chrome, Firefox, Safari.",
        "<strong>URL/link:</strong> cinwaanka bogga, tusaale <span class='inline-code'>https://</span>…"
      ] },
      { t: "p", x: "Markaad taabato xiriir (link), browser-kaagu wuxuu server-ka ka codsanayaa bogga, server-ka wuxuu soo dirayaa xogta, browser-ka wuxuu ku muujinayaa mowjadaada." },
      { t: "example", title: "Tusaale fudud", x: "Fadlan fur browser-kaaga oo ku qor cinwaanka boggan (MR.ducaysane) — waad arki doontaa bogga oo dhan. Taas waxaa sameeya server-ka oo aad ka codsatay." },
      { t: "h2", x: "Noocyada adeegyada internet-ka" },
      { t: "table", head: ["Adeeg", "Shaqo", "Tusaale"], rows: [
        ["Email", "Farriimo qoraal ah dirida", "Gmail, Outlook"],
        ["Search engine", "Xog raadinta", "Google, Bing"],
        ["Social media", "Wadaagista nolosha", "Facebook, WhatsApp"],
        ["Streaming", "Muuqaal iyo muusig", "YouTube, Spotify"]
      ] },
      { t: "tip", title: "Xusuus", x: "Internet-ku waa “buug weyn oo online ah” — laakiin sidoo kale waa meel khatar ah jirta. Casharrada badbaadada internet-ka ayaan ku baran doonnaa sii aad u ilaaliso naftaada." }
    ],
    quiz: [
      { q: "Internet-ku waxaa lagu qeexi karaa…", options: ["Xarig isku xira computer-yada dunida oo dhan", "Qalab keyboard ah", "Nidaam hawl-gal", "Barnaamij qoraal"], answer: 0, explain: "Internet-ku waa network computer-yada dunida isku xira." },
      { q: "Bogga internet-ka ee aad ku aragto mowjada waxaa lagu magacaabaa…", options: ["Webpage/website", "Server", "RAM", "File"], answer: 0, explain: "Webpage waa bogga internet-ka ku jira oo browser-ka ku muuqda." },
      { q: "Barnaaamijka aad ku furto bogagga internet-ka waa…", options: ["Browser (Chrome, Firefox)", "Word", "Excel", "Notepad"], answer: 0, explain: "Browser-ku waa alaabta aad ku daawato bogagga internet-ka." },
      { q: "Server-ku waxaa ka shaqeeya…", options: ["Kaydinta bogagga oo soo dirista marka la weydiiyo", "Qoraalka faylalka", "Sawir-qaadista", "Daabacaadda"], answer: 0, explain: "Server-ka waa computer waayeel ah oo kaydiya bogagga oo kuu soo diro markaad weydiisato." },
      { q: "URL-ku (cinwaanka bogga) waa…", options: ["Magaca bogga internet-ka", "Magaca faylka", "Magaca processor-ka", "Magaca email-ka"], answer: 0, explain: "URL waa cinwaanka bogga internet-ka, sida cinwaanka guriga." }
    ]
  },
  {
    id: "internet-2",
    category: "internet",
    title: "Sida Loo Sameeyo Email (Iimayl)",
    summary: "Talooyin ku saabsan samaynta cinwaanka email, qaybaha cinwaanka iyo sida fariin sax ah loo diro.",
    duration: "10 daqiiqo",
    level: "Aasaas",
    content: [
      { t: "p", x: "Email (iimayl) waa farriin qoraal ah oo internet-ka loo diro. Waa qalabka ugu muhiimsan ee xafiiska, waxbarashada iyo xiriirka maalinlaha ah." },
      { t: "h2", x: "Sida loo sameeyo cinwaanka email" },
      { t: "ol", items: [
        "Fur bogga bixiya adeegga email (tusaale Gmail.com).",
        "Ka dooro “Create account” (Samee akoon).",
        "Buuxi magacaaga, cinwaanka aad rabto iyo erayga sirta ah.",
        "Xaqiiji akoonkaaga waxaad ku xaqiijinaysaa lambarka telefoonka ama email kale.",
        "Hadda akoonkaaga wuu shaqaynayaa."
      ] },
      { t: "h2", x: "Qaybaha cinwaanka email" },
      { t: "p", x: "Cinwaan kastaa wuxuu ka kooban yahay laba qayb oo ay kala soocaan <strong>@</strong>:" },
      { t: "code", label: "Tusaale", code: "maxamedmustafe882@gmail.com\n↑                   ↑         ↑\nMagaca  @  adeegyada  bixiyaha", lang: "text" },
      { t: "ul", items: [
        "<strong>Magaca qofka:</strong> maxamedmustafe882 — waxaad dooran kartaa.",
        "<strong>Simbolka @:</strong> wuxuu kala soocaa magaca iyo adeegyada.",
        "<strong>Adeegyada bixiyaha:</strong> gmail.com, outlook.com — waa meesha akoonka ku jira."
      ] },
      { t: "h2", x: "Sida fariin sax ah loo diro" },
      { t: "table", head: ["Qayb", "Sharax", "Tusaale"], rows: [
        ["To (Cinwaanka qofka)", "Qofka fariintu u socoto", "macmiil@example.com"],
        ["Subject (Mawduuca)", "Mawduuca fariinta", "Codsiga Casharka"],
        ["Body (Qoraalka)", "Qoraalka fariintaada", "Salaam, waxaan rabay…"],
        ["Attachment", "Fayl aad ku darayso", "cashar.pdf"]
      ] },
      { t: "example", title: "Tusaale fariin", x: "To: maxamedmustafe882@gmail.com · Subject: Su'aal Cashar · Body: “Salaam, waxaan jeclaan lahaa inaan ka helayo casharka HTML-ka.”" },
      { t: "tip", title: "Hagaaji qoraalka", x: "Isticmaal salam, mahadsanid iyo qoraal cad. Fariin qoraal nadiif ah waxay ka dhigaysaa qofka akhrinta mid fudud." },
      { t: "warn", title: "Feejignaan email", x: "Ha akhriyin email ka soo baxaya qof aan aqoon oo kuu sheegaya inaad gujirto xiriir aan la garanayn — waxay noqon kartaa xatooyo (phishing)." }
    ],
    quiz: [
      { q: "Simbolka @ waxaa loo isticmaalaa…", options: ["Kala soocida magaca iyo adeegyada bixiyaha emailka", "Qoraalka farriinta", "Soo rarista faylalka", "Soo dejinta barnaamijyo"], answer: 0, explain: "@ wuxuu kala soocaa magaca qofka iyo bixiyaha email (tusaale gmail.com)." },
      { q: "“Subject” ee email-ku waa…", options: ["Mawduuca farriinta", "Qoraalka farriinta", "Cinwaanka qofka", "Faylka ku lifaaqan"], answer: 0, explain: "Subject waa mawduuca ama cinwaanka kooban ee farriinta." },
      { q: "Sida ugu wanaagsan ee akoon email loo sameeyo waa…", options: ["Isticmaale eray sirta ah oo adag oo aad ilaalinayso", "U dir dhammaan qoraalada erayga sirta ah", "U isticmaal erayga sirta ah ee akoonkaaga kale", "Ha eegin erayga sirta ah"], answer: 0, explain: "Eray sirta ah oo adag oo aad ilaalinaysid waa aasaaska badbaadada akoonkaaga." },
      { q: "“Attachment” ee email-ku waxay tahay…", options: ["Fayl lagu daray farriinta", "Cinwaanka qofka", "Mawduuca", "Erayga sirta ah"], answer: 0, explain: "Attachment waa fayl (sawir, qoraal, PDF) lagu lifaaqay farriinta." },
      { q: "Haddii aad heshay email ka soo baxaya qof aan aqoon oo kuu sheegaya inaad gujirto xiriir, waxaa habboon…", options: ["Ka fogow oo ka shaki", "Si degdeg ah u guji", "U dir erayga sirta ah", "Ku biir akoonka"], answer: 0, explain: "Email noocan oo kale ah waa astaan xatooyo (phishing) — ha gujin, ha akhriyin." }
    ]
  },
  {
    id: "internet-3",
    category: "internet",
    title: "Raadinta Macluumaadka iyo Isticmaalka Browser-ka",
    summary: "Baro sida browser-ka loo isticmaalo, sida xog sax ah loo raadiyo iyo sida aad uga hortagto macluumaad been abuur ah.",
    duration: "8 daqiiqo",
    level: "Aasaas",
    content: [
      { t: "p", x: "Browser-kaagu waa alaabta aad ku raadiso xogta internet-ka. Bartiisa (search bar) waxaad ku qortaa waxa aad raadinayso, mashiinka raadintana (search engine) wuxuu kuu soo dhoonayaa bogagga ku habboon." },
      { t: "h2", x: "Sida xog sax ah loo raadiyo" },
      { t: "ol", items: [
        "Isticmaal ereyo kooban oo cad (tusaale: “barashada HTML aasaas”).",
        "Ku dar magaca bogga aad kalsoonto leedahay (tusaale: “site:gov” si aad u hesho bogga dowladda).",
        "Akhri ugu yaraan laba bog oo kala duwan si aad xogta u xaqiijiso.",
        "Ka fogow bogagga qoraal nacsaan leh ama kuwa ballan qaadi kara wax aan macquul ahayn."
      ] },
      { t: "example", title: "Tusaale raadid", x: "Haddii aad rabto inaad barato “excel xisaab”, ku qor: “excel xisaab aasaas Soomaali” — mashiinku wuxuu soo dhoon doonaa casharro ku habboon." },
      { t: "h2", x: "Qalabka browser-ka" },
      { t: "ul", items: [
        "<strong>Tab-yada (tabs):</strong> fur bogag badan hal mar adigoo isticmaalaya tab-yada kore.",
        "<strong>Bookmarks:</strong> kaydi bog aad jeceshahay si aad dib u hesho.",
        "<strong>History:</strong> liiska bogagga aid horay u furatay.",
        "<strong>Private mode:</strong> bogagga ma kaydiyaan taariikhda."
      ] },
      { t: "h2", x: "Macluumaad been abuur (Fake news)" },
      { t: "p", x: "Internet-ka waxaa ku jira macluumaad sax ah iyo mid been ah. Sida loo kala saaro:" },
      { t: "table", head: ["Sax", "Been"], rows: [
        ["Bogga waxaa leh cinwaan caan ah", "Bogga magac la mid ah laakiin qoraal khaldan"],
        ["Xogta waxaa xaqiijiyay ilo kala duwan", "Qof keliya oo aan cadeyn"],
        ["Qoraalku waa mid cad oo nadiif ah", "Qoraal nacsan oo balanqaadyo waaweyn"],
        ["Waa bog dowladeed (.gov, .org)", "Bog la sameeyay maalmihii la soo dhaafay"]
      ] },
      { t: "safe", title: "Xeer wanaagsan", x: "Markasta oo aad ka shakisan tahay xog, weydiiso qof aad aqoon u leedahay ama ka eeg bog rasmi ah oo dowladeed ama caalami ah." }
    ],
    quiz: [
      { q: "Mashiinka raadintu wuxuu ka shaqeeyaa…", options: ["Soo dejinta bogagga aad weydiisatay", "Qoraalka faylalka", "Daabacaadda", "Kaydinta xogta"], answer: 0, explain: "Mashiinka raadintu wuxuu soo dhoonayaa bogagga ugu habboon ereyada aad qortay." },
      { q: "Sida ugu wanaagsan ee xog loo xaqiijiyo waa…", options: ["Akhrinta ilo kala duwan", "Amin qof keliya", "Gujid xiriir kasta", "Qoraal nacsan la akhriyay"], answer: 0, explain: "Ilo kala duwan oo xaqiijinaya waxay ka dhigaan xogta mid la isku halleyn karo." },
      { q: "“Tab” ee browser-ku waxaa loo isticmaalaa…", options: ["Furista bogag badan hal mar", "Kaydinta faylalka", "Qoraalka", "Daabacaadda"], answer: 0, explain: "Tab-yadu waxay kuu ogolaadaan inaad furto bogag badan adigoo isticmaalaya hal daaqad." },
      { q: "Bogga dowladda ee la isku halleyn karo waxaa lagu gartaa…", options: ["Dhamaadka .gov ama .org oo rasmi ah", "Qoraal nacsan", "Magac la mid ah kan caanka ah", "Bilow la'aan"], answer: 0, explain: "Dhamaadyada .gov, .org, .edu waxay muujinayaan bog rasmi ah." },
      { q: "Haddii aad aragto balanqaad “lacag badan oo bilaash ah”, waxaa habboon…", options: ["Ka shaki oo ka fogow", "Si degdeg ah u guji", "U dir qarashaad", "Amin"], answer: 0, explain: "Balanqaadyo noocan oo kale ah waxay inta badan noqdaan khaladaad (scams)." }
    ]
  },

  /* ==================== SAFETY ==================== */
  {
    id: "safety-1",
    category: "safety",
    title: "Furaha Sirta Ah ee Adka",
    summary: "Baro sida furaha sirta ah loo sameeyo, loo ilaaliyo oo loo badalo si aad akoonadaaga u badbaadiso.",
    duration: "9 daqiiqo",
    level: "Aasaas",
    content: [
      { t: "p", x: "Furaha sirta ah (password) waa eray khaas ah oo akoonadaaga ilaaliya. Haddii qof akoonkaaga helo, wuxuu akhrin karaa fariimahaaga, wuxuuna beddeli kaa macluumaadkaaga. Taas darteed, samee furahaas adag oo aad ilaalinayso." },
      { t: "h2", x: "Sida furaha sirta ah loo sameeyo" },
      { t: "ol", items: [
        "U isticmaal ugu yaraan 8 xaraf — dhererka waa aasaaska.",
        "Ku dar xarfaha kala duwan: xarfo waaweyn, yaryar, nambaro iyo astaan (symbols).",
        "Ha ku darin magacaaga, sannadka dhalashadaada ama kelmad caan ah.",
        "U isticmaal akoon kasta furaha sirta ah oo kala duwan.",
        "Ka fogow erayga “123456” ama “password” — kuwaas waa kuwa ugu fudud in la jabiyo."
      ] },
      { t: "table", head: ["Furaha (ka fogow)", "Sababta", "Furaha (fiican)"], rows: [
        ["123456", "Aad u fudud, waxaa lagu arkaa liisaska", "T3knoloji@2026!"],
        ["password", "Kelmad caan ah oo la isku halleyn karo", "Saf3r-Kiilo-Ba7!"],
        ["maxamed123", "Magaca + nambaro fudud", "X5h!Rabta-Kee1"]
      ] },
      { t: "example", title: "Tilmaam sameynta", x: "Furaha “Saf3r-Kiilo-Ba7!” waa mid adag: dherer, xarfaha kala duwan, nambaro iyo astaan. Laakiin waa inaad xafididaa — ku qor meel khaas ah oo aad ilaalinayso." },
      { t: "h2", x: "Sida loo ilaaliyo" },
      { t: "ul", items: [
        "<strong>Ha qaybin:</strong> ha u sheegin qof kale furahaaga, xitaa qofka ugu dhow.",
        "<strong>Beddel markasta:</strong> haddii aad tuhunto in qof akoonkaaga arkay, beddel degdeg.",
        "<strong>Isticmaal kaydiye (password manager):</strong> barnaamij ku kaydiya dhammaan furayaasha si aad u heshid kaliya hal eray-adag.",
        "<strong>Two-factor authentication (2FA):</strong> dar lambarka telefoonka si qof kale uusan akoonkaaga gelin."
      ] },
      { t: "safe", title: "Xeer dahsi ah", x: "Furaha sirta ah waa furaha gurigaaga. Qof kasta oo furahaas qaatay, wuxuu geli karaa akoonkaaga oo dhan. Ha siin qof kasta." },
      { t: "warn", title: "Feejignaan", x: "Haddii email kuu soo diro “akoonkaaga waa la xiray, guji si aad u cusboonaysiiso” — ka shaki. Noocan oo email ah waa xatooyo (phishing)." }
    ],
    quiz: [
      { q: "Furaha sirta ah ee ugu wanaagsan waa…", options: ["Dherer, xarfo kala duwan, nambaro iyo astaan", "Magacaaga + sannadka dhalashada", "123456", "Kelmad keliya oo caan ah"], answer: 0, explain: "Furaha adag wuxuu ka kooban yahay dherer, xarfaha kala duwan, nambaro iyo astaan." },
      { q: "“123456” waxaa loo arkaa…", options: ["Furaha ugu fudud ee la jabi karo", "Furaha ugu adag", "Furaha wanaagsan", "Furaha khaas ah"], answer: 0, explain: "“123456” waa tirada ugu caansan ee la isku halleyn karo, waxaa lagu arkaa liisaska jabiyaasha." },
      { q: "Sida ugu wanaagsan ee akoon kasta loogu ilaaliyo waa…", options: ["Furaha sirta ah oo kala duwan akoon kasta", "Isticmaal furaha isku mid ah dhammaan", "Qaybin furaha qof walba", "U qor warqad dadka"], answer: 0, explain: "Furaha kala duwan waxay ka dhigaan in hal akoon la jabiyay aanu saamayn ku yeelan kuwa kale." },
      { q: "Two-factor authentication (2FA) waxay daraysaa…", options: ["Lambarka telefoonka ama codadka", "Erayga sirta ah ee kale", "Magacaaga", "Cinwaanka emailka"], answer: 0, explain: "2FA waxay ku daraysaa xaqiijin labaad, tusaale lambarka telefoonka, si qof kale uusan akoonkaaga gelin." },
      { q: "Haddii aad tuhunto in qof arkay furahaaga, waxaa ugu horeeya…", options: ["Beddel degdeg ah furaha", "Ka fiirso", "U sheeg qof kasta", "Ha waxba sameyn"], answer: 0, explain: "Beddelida furaha si degdeg ah waa tallaabada ugu muhiimsan ee badbaadada." }
    ]
  },
  {
    id: "safety-2",
    category: "safety",
    title: "Xatooyada Xogta (Phishing) iyo Khaladaadka Online-ka",
    summary: "Baro sida aad u aragto xatooyada xogta, khaladaadka lacagta iyo barnaamijyada khatar ah ee internet-ka.",
    duration: "10 daqiiqo",
    level: "Aasaas",
    content: [
      { t: "p", x: "<strong>Phishing</strong> (xatooyada xogta) waa khiyaamo qof ku doonayo inuu helo furaha sirta ah, akoonka bangiga ama macluumaadkaaga gaarka ah isagoo kuu soo diraya email, farriin ama bog been abuur ah." },
      { t: "h2", x: "Noocyada xatooyada" },
      { t: "ul", items: [
        "<strong>Email xatooyo:</strong> email ka soo baxaya bangi ama shirkad oo kuu sheegaya inaad bixiso macluumaad.",
        "<strong>Bog been abuur ah (fake website):</strong> bog la sameeyay si uu u ekaado kan rasmiga ah si aad erayga sirta ah u geliso.",
        "<strong>Fariin telefoon (SMS):</strong> “Waad ku guuleysatay lacag, fadlan bixi…”.",
        "<strong>Barnaamij khatar ah:</strong> barnaamij soo dejinaysa oo xogtaada dhaca."
      ] },
      { t: "h2", x: "Sida loo aragto" },
      { t: "table", head: ["Astahan", "Sababta"], rows: [
        ["Urgency: “degdeg u samee”", "Waxay doonayaan inaadan waqti fiican u yeelanin inaad fiiriso"],
        ["Cinwaan email khaldan", "Magaca waa la beddelay si uu u ekaado mid rasmiga ah"],
        ["Xiriir ku jira email", "Wuxuu ku ridayaa bog been abuur ah"],
        ["Codsiga erayga sirta ah", "Banga rasmigu ma weydiisto erayga sirta ah email"],
        ["Qalad qoraal / xarfaha oo khaldan", "Bogga been abuurku inta badan waa qoraal liita"]
      ] },
      { t: "example", title: "Tusaale phishing", x: "Email: “Waad ku guuleysatay $1000! Guji si aad u hesho. Fadlan noo soo dir erayga sirta ah si aad u xaqiijiso.” — Tan oo dhan waa khiyaamo. Dowlad iyo bangi ma weydiistaan erayga sirta ah email." },
      { t: "h2", x: "Barnaamijyada khatar ah (Malware)" },
      { t: "p", x: "Barnaamij khatar ah (malware) waa software loo sameeyay in lagu kharash bixiyo qalabkaaga ama xogtaada. Waxaa ka mid ahaa:" },
      { t: "ul", items: [
        "<strong>Virus:</strong> wuxuu ku faafaa faylalka oo dhaawaca computer-ka.",
        "<strong>Ransomware:</strong> wuxuu xayiraayo faylalkaaga oo lacag weydiista.",
        "<strong>Spyware:</strong> wuxuu khaldan kaa dhigayaa waxa aad samaynayso."
      ] },
      { t: "safe", title: "Tallaabooyin", x: "Ka fogow gujista xiriirada shaki leh. Soo dejin oo kaliya barnaamijyada bogagga rasmiga ah. Isticmaal barnaamijka ilaalinta (antivirus) oo cusboonaysii nidaamka hawl-galka." }
    ],
    quiz: [
      { q: "Phishing (xatooyada xogta) waa…", options: ["Khiyaamo lagu doonayo in la helo erayga sirta ah ama macluumaad", "Barnaamij qoraal", "Nidaam hawl-gal", "Adeeg email"], answer: 0, explain: "Phishing waa khiyaamo qof lagu doonayo in laga xado macluumaad gaar ah." },
      { q: "Astahan waxaa ka mid ah…", options: ["Urgency: “degdeg u samee”", "Qoraal nadiif ah", "Bog rasmi ah", "Email ka soo baxaya aqoonyahan"], answer: 0, explain: "Kuwa khiyaamada ah waxay isticmaalaan degdeg si aadan waqti u yeelanin inaad fiiriso." },
      { q: "Bangiga rasmigu wuxuu weydiin karaa erayga sirta ah…", options: ["Wuxuu weydiin karaa email", "Wuxuu weydiin karaa fariin qoraal", "Wuxuu weydiin karaa bog rasmigiisa oo kaliya", "Wuxuu weydiin karaa qof kasta"], answer: 2, explain: "Bangiga rasmigu erayga sirta ah wuxuu weydiin karaa oo kaliya boggiisa rasmiga ah, ha ahaato email iyo fariin." },
      { q: "Ransomware-ku waxaa ka shaqeeya…", options: ["Xayiraadda faylalka oo lacag weydiista", "Qoraalka", "Soo dejinta", "Daabacaadda"], answer: 0, explain: "Ransomware-ku wuxuu xayiraayo faylalkaaga oo wuxuu ku weydiistaa lacag." },
      { q: "Sida ugu wanaagsan ee barnaamij khatar looga hortago waa…", options: ["Soo dejin kaliya bogagga rasmiga ah", "Gujid xiriir kasta", "Amin qof kasta", "Furista email kasta"], answer: 0, explain: "Soo dejinta barnaamijyada bogagga rasmiga ah waa habka ugu wanaagsan ee laga hortago malware." }
    ]
  },
  {
    id: "safety-3",
    category: "safety",
    title: "Ilaalinta Xogtaada Gaarka ah Online-ka",
    summary: "Baro sida aad u ilaaliso macluumaadkaaga gaarka ah (magac, cinwaan, kharash) markaad online ku jirto.",
    duration: "9 daqiiqo",
    level: "Aasaas",
    content: [
      { t: "p", x: "Xogtaada gaarka ah (personal data) waxaa ka mid ah magacaaga, cinwaankaaga, lambarka telefoonka, cinwaanka emailka, furaha sirta ah iyo xogta bangiga. Ilinta xogtan waa mid ka mid ah xirfadaha ugu muhiimsan ee internet-ka." },
      { t: "h2", x: "Maxaa la wadaagi karaa, maxaa la qarinayo?" },
      { t: "table", head: ["Wax wadaagi kara (dhammaan)", "Wax qarinayo (qof kasta)"], rows: [
        ["Magaca kooban (first name)", "Erayga sirta ah"],
        ["Hobby-yada", "Xogta bangiga"],
        ["Mawduuca aad jeceshahay", "Lambarka telefoonka (qof qof)"],
        ["Fikirkaaga waxbarashada", "Cinwaanka guriga"]
      ] },
      { t: "h2", x: "Xeerarka aasaasiga ah" },
      { t: "ol", items: [
        "Ha qaybin xog gaar ah qof aan aqoon.",
        "Hubi qawaaniinta asturnaanta (privacy) ee barnaamijyada.",
        "Ka fiirso sawirada aad soo dejinayso — waxay muujin karaan meesha aad joogto.",
        "U isticmaal eray sirta ah oo kala duwan akoon kasta.",
        "Ka fogow ku biirista “giveaways” oo la weydiinayo macluumaad."
      ] },
      { t: "h2", x: "Asturnaanta (Privacy) online" },
      { t: "p", x: "Bogagga badan waxay ku waajibinayaan inaad akoon samayso si aad u isticmaasho. Markasta eeg qawaaniinta asturnaanta oo ka fiirso waxa aad wadaagayso." },
      { t: "example", title: "Tusaale", x: "Haddii aad rabto inaad ku biirto bog cusub, ka hor inta aanad akoon samayn, akhri qawaaniinta: maxaa la kaydinayaa? Maxaa la wadaagaa? Sida loo tirtiro akoonka?" },
      { t: "tip", title: "Xusuus", x: "Xogtaada gaarka ah waa lacagtaada dhijital ah. Ilinta xogtan waxay ka dhigmaa ilinta hantidaada." }
    ],
    quiz: [
      { q: "Xogta gaarka ah ee la qarinayo waxaa ka mid ah…", options: ["Erayga sirta ah", "Hobby-yada", "Mawduuca aad jeceshahay", "Fikirkaaga"], answer: 0, explain: "Erayga sirta ah waa mid ka mid ah waxyaabaha ugu muhiimsan ee la qarinayo." },
      { q: "Sida ugu wanaagsan ee xogta gaarka ah loo ilaaliyo waa…", options: ["Qaybin qof aan aqoon", "Qaybin dhammaan", "Wadaagin", "U dirin"], answer: 0, explain: "Xogta gaarka ah waa in lagu qabtaa qof aan aqoon." },
      { q: "Qawaaniinta asturnaanta (privacy) waxay sheegaysaa…", options: ["Sida xogta loo kaydiyo iyo loo wadaago", "Sida faylalka loo qoro", "Sida sawirka loo qaado", "Sida internet-ka loo furto"], answer: 0, explain: "Qawaaniinta asturnaanta waxay qeexaysaa xogta la kaydinayo iyo sida loo wadaagayo." },
      { q: "Sawirada aad soo dejinayso waxay muujin karaan…", options: ["Meesha aad joogto", "Erayga sirta ah", "Xogta bangiga", "Faylalka"], answer: 0, explain: "Sawirada qaarkood waxay ka muujin karaan meesha (location) aad joogto — ka digtoonow." },
      { q: "“Giveaway” la weydiinayo macluumaad waxaa la mid ah…", options: ["Khaladaad (scams)", "Wax sax ah", "Wax la isku halleyn karo", "Adeeg caadi ah"], answer: 0, explain: "Balaaqadyada noocan oo kale ah waxay inta badan noqdaan khaladaad." }
    ]
  },

  /* ==================== HTML ==================== */
  {
    id: "html-1",
    category: "html",
    title: "HTML-ku waa maxay? Aasaaska",
    summary: "Bilan qaybta koobad ee web-dhiska: waa maxay HTML, sida loo sameeyo boggii ugu horreeyay iyo qaybtiisa.",
    duration: "10 daqiiqo",
    level: "Aasaas",
    content: [
      { t: "p", x: "<strong>HTML</strong> (HyperText Markup Language) waa luqadda aasaasiga ah ee lagu dhiso bogagga internet-ka. HTML keliya ma dhiso bog cad-cad — waxay ku daraysaa qoraalka, xiriirka, sawirka iyo qaybaha kale ee bogga." },
      { t: "p", x: "HTML ma aha luqad barnaamij (programming) sida Python ama JavaScript — waa luqad <em>calaaqaad (markup)</em> oo qeexaysa qaab-dhismeedka bogga." },
      { t: "h2", x: "Boggii ugu horreeyay HTML" },
      { t: "code", label: "bog.html", code: "<!DOCTYPE html>\n<html lang=\"so\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Boggayga</title>\n</head>\n<body>\n  <h1>Salaam Dunida!</h1>\n  <p>Waa boggayga ugu horreeyay HTML.</p>\n</body>\n</html>", lang: "html" },
      { t: "p", x: "Fur fayl qoraal ah (Notepad), ku qor qoraalkan, u kaydi magaca <span class='inline-code'>bog.html</span>, ka dibna fur browser-kaaga — waad arki doontaa boggii ugu horreeyay!" },
      { t: "h2", x: "Qaybaha HTML" },
      { t: "table", head: ["Qayb", "Shaqo"], rows: [
        ["<!DOCTYPE html>", "Wuxuu ku sheegayaa browser-ka inay tahay HTML5"],
        ["<html>", "Xarfaha ugu weyn ee dhammaan qaybaha ku jira"],
        ["<head>", "Macluumaadka bogga (title, encoding)"],
        ["<body>", "Waxyaabaha bogga muuqda (qoraal, sawir)"]
      ] },
      { t: "h2", x: "Xarfaha aasaasiga ah (Tags)" },
      { t: "p", x: "HTML waxaa lagu qotomaa <strong>xarfaha (tags)</strong>, kuwaas oo badanaa laba qayb ka kooban: bilow iyo dhammaad." },
      { t: "code", label: "Tusaale", code: "<p>Kani waa qoraal.</p>\n<h1>Cinwaan weyn</h1>\n<a href=\"https://example.com\">Xiriir</a>", lang: "html" },
      { t: "ul", items: [
        "<strong><h1> — <h6>:</strong> cinwaanno (headings), <h1> waa ugu weyn.",
        "<strong><p>:</strong> qoraal (paragraph).",
        "<strong><a>:</strong> xiriir (link), <span class='inline-code'>href</span> waa cinwaanka.",
        "<strong><img>:</strong> sawir, <span class='inline-code'>src</span> waa khayraadka sawirka."
      ] },
      { t: "tip", title: "Tilmaam", x: "Bilaaw markaad qorto <span class='inline-code'>&lt;p&gt;</span> — browser-ku wuxuu sugayaa <span class='inline-code'>&lt;/p&gt;</span> si uu u fahmo in qoraalku dhammaaday." }
    ],
    quiz: [
      { q: "HTML waxaa loo yaqaan…", options: ["Luqad calaaqaad (markup) oo lagu dhiso bogagga", "Luqad barnaamij (programming)", "Nidaam hawl-gal", "Barnaamij sawir"], answer: 0, explain: "HTML waa luqad calaaqaad (markup language) oo qeexaysa qaab-dhismeedka bogga." },
      { q: "Xarafka <h1> waxaa loo isticmaalaa…", options: ["Cinwaanka ugu weyn", "Qoraalka", "Xiriirka", "Sawirka"], answer: 0, explain: "<h1> waa cinwaanka ugu weyn bogga." },
      { q: "Qaybta <body> ee HTML waxaa ku jira…", options: ["Waxyaabaha bogga muuqda", "Macluumaadka bogga (title)", "Xarfaha ugu weyn", "Faylalka"], answer: 0, explain: "<body> waa meesha waxyaabaha bogga muuqda ku jiraan." },
      { q: "Xarafka <a> waxaa loo isticmaalaa…", options: ["Xiriir (link)", "Sawir", "Qoraal", "Cinwaan"], answer: 0, explain: "<a> waa xarafka xiriirka (anchor), href-kiisa waa cinwaanka." },
      { q: "Faylka HTML-ka waxaa lagu kaydiyaa dhamaadka…", options: [".html", ".css", ".jpg", ".exe"], answer: 0, explain: "Faylalka HTML waxay ku dhammaadaan .html." }
    ]
  },
  {
    id: "html-2",
    category: "html",
    title: "Qoraalka, Xiriirka iyo Sawirka",
    summary: "Baro sida qoraalka loo qoro, xiriirka loo sameeyo iyo sida sawirka bogga kuugu muuqdo.",
    duration: "9 daqiiqo",
    level: "Aasaas",
    content: [
      { t: "p", x: "Hadda aad aasaaska heshay, waxaan baranaynaa sida qoraalka, xiriirka iyo sawirka loo dhiso HTML." },
      { t: "h2", x: "Qoraalka (Text)" },
      { t: "code", label: "Qoraal", code: "<h2> Casharka HTML-ka </h2>\n<p>Waa qoraal caadi ah oo bogga ku muuqda.</p>\n<p>Qoraal <strong>adag</strong> iyo qoraal <em>eegmo</em> leh.</p>", lang: "html" },
      { t: "ul", items: [
        "<strong><h1> — <h6>:</strong> cinwaanno, <h1> ugu weyn, <h6> ugu yar.",
        "<strong><p>:</strong> qoraal (paragraph).",
        "<strong><strong>:</strong> qoraal adag (bold).",
        "<strong><em>:</strong> qoraal eegmo leh (italic)."
      ] },
      { t: "h2", x: "Xiriirka (Links)" },
      { t: "code", label: "Xiriir", code: "<a href=\"https://mr-ducaysane.example\">Boggayga</a>\n<a href=\"cashar.html\">U gudub casharka</a>", lang: "html" },
      { t: "p", x: "Attribute-ka <span class='inline-code'>href</span> waa meesha xiriirku u socdo. Waxay noqon kartaa cinwaan buuxa (https://…) ama fayl gudaha ah (cashar.html)." },
      { t: "h2", x: "Sawirka (Images)" },
      { t: "code", label: "Sawir", code: "<img src=\"sawir.png\" alt=\"Sawir tusaale ah\">", lang: "html" },
      { t: "ul", items: [
        "<strong>src:</strong> meesha sawirka ku jira (fayl ama cinwaan).",
        "<strong>alt:</strong: qoraal soo bandhiga marka sawirku soo bixin (muhiim accessibility)."
      ] },
      { t: "example", title: "Tusaale isku-dhafan", x: "<h2>Maqaal</h2>\n<p>Waa maqaal <strong>muhiim</strong> ah.</p>\n<img src=\"sawir.png\" alt=\"Sawir maqaal\">\n<a href=\"https://example.com\">Akhri wax badan</a>" },
      { t: "tip", title: "Accessibility", x: "Attribute-ka <span class='inline-code'>alt</span> waa muhiim — dadka indhaha la' waxay ku akhriyaan qoraalka sawirka. Ha iloobin." }
    ],
    quiz: [
      { q: "Xarafka <strong> waxaa loo isticmaalaa…", options: ["Qoraal adag (bold)", "Qoraal eegmo (italic)", "Xiriir", "Sawir"], answer: 0, explain: "<strong> waxay muujinaysaa qoraal adag (bold)." },
      { q: "Attribute-ka href ee <a> waa…", options: ["Cinwaanka xiriirka", "Qoraalka xiriirka", "Sawirka", "Magaca faylka"], answer: 0, explain: "href waa meesha xiriirku u socdo." },
      { q: "Attribute-ka alt ee <img> waa…", options: ["Qoraal soo bandhiga marka sawirku bixin", "Cinwaanka sawirka", "Cabbirka sawirka", "Rangga sawirka"], answer: 0, explain: "alt waa qoraal muhiim u ah accessibility-ka, waxaana akhriya dadka indhaha la'." },
      { q: "Xarafka <h3> waa…", options: ["Cinwaan dhexdhexaad", "Cinwaan ugu weyn", "Qoraal", "Xiriir"], answer: 0, explain: "<h3> waa cinwaan dhexdhexaad (h1 waa ugu weyn)." },
      { q: "Sida loo sameeyo xiriir u socda bog gudaha ah waa…", options: ["<a href=\"cashar.html\">…</a>", "<img src=\"cashar.html\">", "<p>cashar.html</p>", "<h1>cashar.html</h1>"], answer: 0, explain: "<a href=\"…\"> waxay sameynaysaa xiriir." }
    ]
  },
  {
    id: "html-3",
    category: "html",
    title: "Liisyo, Jadwal iyo Foomamka HTML",
    summary: "Baro sida liisaska, jadwalka iyo foomamka (forms) loo dhiso HTML — kuwaas oo aasaas u ah bogagga casriga ah.",
    duration: "11 daqiiqo",
    level: "Aasaas",
    content: [
      { t: "p", x: "Bogagga casriga ah waxaa ku jira liisyo, jadwal iyo foomam. HTML waxay bixisaa xarfahaas oo dhan." },
      { t: "h2", x: "Liisaska (Lists)" },
      { t: "code", label: "Liis aan nidaam lahayn (unordered)", code: "<ul>\n  <li>Computer</li>\n  <li>Internet</li>\n  <li>Web-dhis</li>\n</ul>", lang: "html" },
      { t: "code", label: "Liis nidaamsan (ordered)", code: "<ol>\n  <li>Fur browser-ka</li>\n  <li>Ku qor cinwaanka</li>\n  <li>Guji Enter</li>\n</ol>", lang: "html" },
      { t: "p", x: "<strong><ul></strong> waa liis aan nidaam lahayn (bullets), <strong><ol></strong> waa liis nidaamsan (1, 2, 3). Labaduba waxay isticmaalaan <strong><li></strong> qayb kasta." },
      { t: "h2", x: "Jadwalka (Tables)" },
      { t: "code", label: "Jadwal", code: "<table>\n  <tr>\n    <th>Magac</th>\n    <th>Da`d</th>\n  </tr>\n  <tr>\n    <td>Amiir</td>\n    <td>20</td>\n  </tr>\n</table>", lang: "html" },
      { t: "ul", items: [
        "<strong><table>:</strong> bilowga jadwalka.",
        "<strong><tr>:</strong> saf (row).",
        "<strong><th>:</strong> cinwaan safka (header).",
        "<strong><td>:</strong> qaybta safka (cell)."
      ] },
      { t: "h2", x: "Foomamka (Forms)" },
      { t: "p", x: "Foomamka waa sida boggu ka qaado macluumaadkaaga, sida foomka xiriirka ama akoon samaynta." },
      { t: "code", label: "Foon fudud", code: "<form>\n  <label>Magaca:</label>\n  <input type=\"text\" name=\"magac\">\n  <label>Email:</label>\n  <input type=\"email\" name=\"email\">\n  <button type=\"submit\">Dir</button>\n</form>", lang: "html" },
      { t: "table", head: ["Nooca input", "Shaqo"], rows: [
        ["text", "Qoraal kooban (magac)"],
        ["email", "Cinwaan email (browser-ku xaqiijinayaa)"],
        ["password", "Eray sirta ah (qoraalka waa la qariyay)"],
        ["submit", "Guji si aad u dirto foomka"]
      ] },
      { t: "example", title: "Tusaale foom xiriir", x: "<form>\n  <input type=\"text\" placeholder=\"Magaca\">\n  <input type=\"email\" placeholder=\"Email\">\n  <textarea placeholder=\"Fariin\"></textarea>\n  <button>Dir</button>\n</form>" },
      { t: "tip", title: "Xusuus", x: "Foom HTML keliya ma dirin fariinta — waa in barnaamij server (backend) loo sameeyaa si fariinta dhabta ah loo diro. HTML waa qaybta muuqata oo keliya." }
    ],
    quiz: [
      { q: "Xarafka <ul> waa…", options: ["Liis aan nidaam lahayn (bullets)", "Liis nidaamsan (1,2,3)", "Jadwal", "Foom"], answer: 0, explain: "<ul> waa liis aan nidaam lahayn; <ol> waa kuwa nidaamsan." },
      { q: "Xarafka <th> waxaa lagu isticmaalaa…", options: ["Cinwaanka safka jadwalka", "Qaybta safka", "Bilowga jadwalka", "Dhammaadka jadwalka"], answer: 0, explain: "<th> waa cinwaanka safka (header cell)." },
      { q: "Nooca input-ka <span class='inline-code'>password</span> waxaa loo isticmaalaa…", options: ["Eray sirta ah (qoraalka waa la qariyay)", "Magac", "Email", "Fariin"], answer: 0, explain: "input-ka password waxaa qoraalkiisa la qariyay, si badbaado loo helo." },
      { q: "Xarafka <li> waxaa lagu isticmaalaa…", options: ["Qayb kasta oo liis ah", "Jadwal", "Foom", "Sawir"], answer: 0, explain: "<li> waa qayb kasta oo liis ah (list item)." },
      { q: "Foom HTML keliya wuxuu…", options: ["Ma dirin fariinta — server ayaa loo baahan yahay", "Wuxuu diraa fariinta", "Wuxuu kaydiyaa", "Wuxuu daabacaa"], answer: 0, explain: "HTML waa qaybta muuqata — fariinta dhabta ah waa in server (backend) loo diro." }
    ]
  },

  /* ==================== CSS ==================== */
  {
    id: "css-1",
    category: "css",
    title: "CSS-ku waa maxay? Aasaaska",
    summary: "Baro waa maxay CSS, sida loo dhigo bogga midab iyo qaab leh, iyo xeerarka aasaasiga ah.",
    duration: "9 daqiiqo",
    level: "Aasaas",
    content: [
      { t: "p", x: "<strong>CSS</strong> (Cascading Style Sheets) waa luqadda loo isticmaalo in lagu qaabeeyo bogga internet-ka: midab, fonto, cabbir, is-dhaf iyo wax badan. HTML waa lafaha bogga, CSS-na waa qurxinta iyo dharka." },
      { t: "h2", x: "Sida CSS loo isticmaalo" },
      { t: "code", label: "CSS gudaha HTML", code: "<style>\n  h1 {\n    color: blue;\n    font-size: 32px;\n  }\n</style>\n<h1>Salaam</h1>", lang: "css" },
      { t: "p", x: "CSS waxaa ka kooban: <strong>xulashayaal (selectors)</strong> oo tilmaamaya waxa la qaabeeyo, iyo <strong>xeerarka (properties)</strong> sida <span class='inline-code'>color</span> iyo <span class='inline-code'>font-size</span>." },
      { t: "h2", x: "Xeerarka aasaasiga ah" },
      { t: "table", head: ["Xeerka", "Shaqo", "Tusaale"], rows: [
        ["color", "Rangga qoraalka", "color: navy;"],
        ["background-color", "Rangga daboolka", "background: #EFF6FF;"],
        ["font-size", "Cabbirka qoraalka", "font-size: 20px;"],
        ["font-family", "Nooca fontada", "font-family: Arial;"],
        ["padding", "Fadalka gudaha", "padding: 16px;"],
        ["margin", "Fadalka dibadda", "margin: 10px;"]
      ] },
      { t: "h2", x: "Xulashayaal (Selectors)" },
      { t: "code", label: "Tusaale xulashayaal", code: "/* Qoraal kasta */\np { color: gray; }\n\n/* Cinwaan kasta */\nh1 { color: navy; }\n\n/* Waxa leh class=\"highlight\" */\n.highlight { background: yellow; }\n\n/* Waxa leh id=\"madax\" */\n#madax { font-size: 24px; }", lang: "css" },
      { t: "ul", items: [
        "<strong>Magaca xarfaha (element):</strong> <span class='inline-code'>p</span>, <span class='inline-code'>h1</span> — qeexaya qaybta.",
        "<strong>Class (.):</strong> <span class='inline-code'>.highlight</span> — waxaa lagu dabaqi karaa qaybo badan.",
        "<strong>ID (#):</strong> <span class='inline-code'>#madax</span> — waxaa lagu dabaqaa qayb keliya."
      ] },
      { t: "example", title: "Tusaale isku-dhafan", x: "<style>\n  body { font-family: Arial; color: navy; }\n  .btn { background: blue; color: white; padding: 10px; }\n</style>\n<button class=\"btn\">Guji</button>" },
      { t: "tip", title: "Tilmaam", x: "Isticmaal CSS dibadda ah (external file .css) si aad u kala qaybinayso qoraalka iyo qurxinta — taas waxay ka dhigaysaa mashruuca fudud in la maamulo." }
    ],
    quiz: [
      { q: "CSS waxaa loo isticmaalaa…", options: ["Qaabeeynta bogga (midab, fonto, cabbir)", "Qoraalka HTML", "Internet-ka", "Nidaamka hawl-galka"], answer: 0, explain: "CSS waa luqadda qurxinta bogga." },
      { q: "Xeerka <span class='inline-code'>color</span> waxaa loo isticmaalaa…", options: ["Rangga qoraalka", "Cabbirka qoraalka", "Rangga daboolka", "Fadalka"], answer: 0, explain: "color waa rangga qoraalka (text)." },
      { q: "Xulashada <span class='inline-code'>.highlight</span> waxay dabaqaysaa…", options: ["Qaybaha leh class=\"highlight\"", "Qayb keliya oo ID leh", "Dhammaan qaybaha", "Qoraalka keliya"], answer: 0, explain: ". waa calaamad class; waxay dabaqaysaa qaybaha leh class-kaas." },
      { q: "Fadalka gudaha (inside) waa…", options: ["padding", "margin", "color", "font"], answer: 0, explain: "padding waa fadalka gudaha; margin waa fadalka dibadda." },
      { q: "CSS-ka dibadda ah (external) waa…", options: ["Fayl .css kala duwan HTML", "CSS gudaha HTML", "Barnaamij", "Nidaam"], answer: 0, explain: "CSS dibadda ah waa fayl .css kala duwan oo HTML laga hagaajinayo." }
    ]
  },
  {
    id: "css-2",
    category: "css",
    title: "Midab, Fonto iyo Is-dhaf (Layout)",
    summary: "Baro sida midabka, fontada iyo is-dhafka (box model) loo isticmaalo si boggagu u noqdo mid qurux badan.",
    duration: "10 daqiiqo",
    level: "Aasaas",
    content: [
      { t: "p", x: "Hadda aad aasaaska heshay, waxaan baranaynaa sida boggagu u yeesho midab, fonto iyo qaab-dhis sax ah." },
      { t: "h2", x: "Midabka (Colors)" },
      { t: "p", x: "CSS waxay isticmaashaa magac midab (blue) ama heer-hex (hex) sida <span class='inline-code'>#1D6BF0</span>." },
      { t: "code", label: "Tusaale midab", code: "h1 { color: #0A1F44; }\np  { color: #4A5A72; }\n.btn { background: #1D6BF0; color: white; }", lang: "css" },
      { t: "table", head: ["Rangga", "Heer-hex"], rows: [
        ["Navy madow", "#0A1F44"],
        ["Buluug iftiin", "#1D6BF0"],
        ["Cadaan", "#FFFFFF"],
        ["Buluug khafiif", "#EFF6FF"]
      ] },
      { t: "h2", x: "Fontada (Fonts)" },
      { t: "code", label: "Tusaale fonto", code: "body {\n  font-family: Arial, sans-serif;\n  font-size: 16px;\n  line-height: 1.6;\n}\nh1 { font-weight: bold; }", lang: "css" },
      { t: "h2", x: "Is-dhafka (Box Model)" },
      { t: "p", x: "Qayb kasta oo HTML ah waa <strong>sanduuq (box)</strong> ka kooban:" },
      { t: "table", head: ["Qayb", "Sharax"], rows: [
        ["Content", "Qoraalka gudihiisa"],
        ["Padding", "Fadalka gudaha ee qoraalka"],
        ["Border", "Xadka sanduuqa"],
        ["Margin", "Fadalka dibadda ee qaybaha kale"]
      ] },
      { t: "code", label: "Tusaale box model", code: ".card {\n  padding: 20px;\n  border: 2px solid #DCE6F5;\n  margin: 10px;\n}", lang: "css" },
      { t: "h2", x: "Is-dhafka (Layout)" },
      { t: "p", x: "CSS waxay bixisaa qaabab kala duwan oo qaybaha loo dhigo. mid ka mid ah kuwa caanka ah waa <strong>flexbox</strong>:" },
      { t: "code", label: "Flexbox fudud", code: ".container {\n  display: flex;\n  justify-content: space-between;\n  gap: 20px;\n}", lang: "css" },
      { t: "tip", title: "Tilmaam", x: "Isticmaal midab yar oo isku mid (2-3) si boggagu u noqdo mid professional. Midab badan waxay ka dhigaysaa bog nacsan." }
    ],
    quiz: [
      { q: "Heer-hex ee buluug iftiin <span class='inline-code'>#1D6BF0</span> waxaa loo isticmaalaa…", options: ["Rangga qoraal ama dabool", "Cabbirka qoraalka", "Fadalka", "Fontada"], answer: 0, explain: "Heer-hex waa sidoo kale loo isticmaalaa rangga." },
      { q: "Padding-ku waxaa…", options: ["Fadalka gudaha ee qoraalka", "Fadalka dibadda", "Xadka sanduuqa", "Rangga"], answer: 0, explain: "Padding waa fadalka gudaha; margin waa dibadda." },
      { q: "Line-height waxaa loo isticmaalaa…", options: ["Dhererka safka qoraalka", "Cabbirka qoraalka", "Rangga", "Fadalka"], answer: 0, explain: "line-height wuxuu qeexayaa dhererka safka qoraalka." },
      { q: "Flexbox-ku waa…", options: ["Qaab-dhis qaybaha loo dhigo (layout)", "Rangga", "Fonto", "Xerka"], answer: 0, explain: "Flexbox waa qaab-dhis (layout) qaybaha loo dhigo si hufan." },
      { q: "Xeerka <span class='inline-code'>font-weight: bold</span> waxaa loo isticmaalaa…", options: ["Qoraal adag", "Rangga", "Cabbirka", "Fadalka"], answer: 0, explain: "font-weight: bold waxay qoraalka ka dhigaysaa mid adag." }
    ]
  },
  {
    id: "css-3",
    category: "css",
    title: "Responsive Design: Bog ku habboon Telefoonka",
    summary: "Baro sida boggagu uga muuqdo si fiican telefoonka, tablet-ka iyo komputerka (responsive design).",
    duration: "10 daqiiqo",
    level: "Aasaas",
    content: [
      { t: "p", x: "Maanta dadku waxay internet-ka ku soo galayaan telefoon, tablet iyo komputer. <strong>Responsive design</strong> waa fikirka boggagu u qaab dhisan yahay si uu uga muuqdo si fiican qalab kasta." },
      { t: "h2", x: "Viewport meta tag" },
      { t: "p", x: "Bilow HTML-ka viewport tag — taas waxay ka dhigaysaa bogga mid telefoonka ku habboon:" },
      { t: "code", label: "Gudaha <head>", code: "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">", lang: "html" },
      { t: "h2", x: "Media Queries" },
      { t: "p", x: "Media queries waa CSS xoog leh oo qeexaya xeerar kala duwan qalab kasta. Tusaale, cabbirka mowjada (screen) ka yar 600px waa telefoon:" },
      { t: "code", label: "Tusaale media query", code: "/* Komputer */\n.container {\n  display: flex;\n  gap: 20px;\n}\n\n/* Telefoon */\n@media (max-width: 600px) {\n  .container {\n    flex-direction: column;\n  }\n}", lang: "css" },
      { t: "p", x: "Marka cabbirka mowjada ka yar yahay 600px, qaybuhu waxay noqonayaan saf (column) — taas waxay ka dhigaysaa bogga mid telefoonka ku habboon." },
      { t: "h2", x: "Tilmaamo responsive" },
      { t: "ol", items: [
        "Isticmaal units la mid ah (%) ama vw/vh si qaybuhu u qaab dhacaan.",
        "Ka fogow cabbir joogto ah (px) qaybaha waaweyn.",
        "Tijaabi bogga telefoonka (browser dev tools).",
        "Isticmaal flexbox iyo grid si qaybuhu isugu habboonaadaan."
      ] },
      { t: "example", title: "Tusaale buuxa", code: "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n<style>\n  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }\n  @media (max-width: 700px) { .grid { grid-template-columns: 1fr; } }\n</style>", lang: "html" },
      { t: "safe", title: "Xeer muhiim ah", x: "Telefoonka waa qalabka ugu badan ee loo isticmaalo internet-ka. Markaad samaynayso bog, bilow telefoonka ka hor inta aadan komputer ka eegin." }
    ],
    quiz: [
      { q: "Viewport meta tag waxaa loo isticmaalaa…", options: ["Si boggagu uga muuqdo si fiican telefoonka", "Rangga bogga", "Cabbirka qoraalka", "Fadalka"], answer: 0, explain: "Viewport tag wuxuu ka dhigayaa bogga mid telefoonka ku habboon." },
      { q: "Media query-ku waxay qeexaysaa…", options: ["Xeerar kala duwan qalab kasta", "Rangga", "Fontada", "Xerka"], answer: 0, explain: "Media query waa CSS xoog leh oo qalab kasta loogu qaabeeyo." },
      { q: "<span class='inline-code'>max-width: 600px</span> media query waxay khuseysaa…", options: ["Mowjo ka yar 600px (tusaale telefoon)", "Mowjo ka weyn 600px", "Komputer kasta", "Bog kasta"], answer: 0, explain: "max-width: 600px waxay khuseysaa mowjo ka yar 600px." },
      { q: "Units-ka <span class='inline-code'>%</span> waxay…", options: ["Qaybaha u qaab dhacaan cabbirka qoysaska", "Qoraal", "Rangga", "Xerka"], answer: 0, explain: "% waa unit la mid ah cabbirka qoysaska (parent), taas waxay ka dhigaysaa mid responsive." },
      { q: "Responsive design-ku waa…", options: ["Boggagu u qaab dhisan yahay si fiican qalab kasta", "Bog telefoon keliya", "Bog komputer keliya", "Bog aan la hagaajin"], answer: 0, explain: "Responsive design waa fikirka boggagu u qaab dhisan yahay qalab kasta." }
    ]
  },

  /* ==================== JAVASCRIPT ==================== */
  {
    id: "js-1",
    category: "js",
    title: "JavaScript-ku waa maxay?",
    summary: "Baro waa maxay JavaScript, sida loogu daro bogga firfircoon iyo khadka first ee JS.",
    duration: "9 daqiiqo",
    level: "Aasaas",
    content: [
      { t: "p", x: "<strong>JavaScript</strong> waa luqadda barnaamij (programming) ee internet-ka. Waxay bogga ka dhigaysaa mid firfircoon: badhano, foomam, muraayado (animations) iyo waxyaabo kale oo la falgala." },
      { t: "p", x: "HTML waa lafaha, CSS waa qurxinta, JavaScript-na waa nolosha iyo dhaqdhaqaaqa bogga." },
      { t: "h2", x: "Sida JavaScript loo isticmaalo" },
      { t: "code", label: "Bog fudud oo JS leh", code: "<!DOCTYPE html>\n<html>\n<body>\n\n  <h1 id=\"madax\">Salaam</h1>\n  <button onclick=\"gudi()\">Guji</button>\n\n  <script>\n    function gudi() {\n      document.getElementById(\"madax\").innerHTML = \"Mahadsanid!\";\n    }\n  </script>\n\n</body>\n</html>", lang: "html" },
      { t: "p", x: "Markaad taabato badhamka, JavaScript-ku wuxuu beddelaa qoraalka <span class='inline-code'>h1</span> — taas waa bog firfircoon!" },
      { t: "h2", x: "Aasaaska JavaScript" },
      { t: "code", label: "Qoraal JS", code: "// Qoraal (comment)\nlet magac = \"Amiir\";\nconsole.log(magac);\n\n// Xisaab\nlet a = 5;\nlet b = 3;\nconsole.log(a + b);  // 8", lang: "javascript" },
      { t: "table", head: ["Fikir", "Tusaale"], rows: [
        ["Variable", "let x = 5;"],
        ["Qoraal", "console.log(\"Salaam\");"],
        ["Xisaab", "a + b, a * b"],
        ["Function", "function gudi() { … }"]
      ] },
      { t: "example", title: "Tusaale:beddelka qoraalka", code: "document.getElementById(\"madax\").innerHTML = \"Cusub!\";", lang: "javascript" },
      { t: "tip", title: "Tilmaam", x: "JavaScript waa luqad xoog leh — bilow wax yar yar, ka dibna weyn. Casharrada soo socda waxaan ku baran doonnaa variables, shuruudo iyo loops." }
    ],
    quiz: [
      { q: "JavaScript waxaa loo isticmaalaa…", options: ["Bogga firfircoon ka dhigid", "Qoraalka HTML", "Rangga CSS", "Nidaamka hawl-galka"], answer: 0, explain: "JavaScript waa luqadda bogga firfircoon." },
      { q: "Xarafka <script> HTML wuxuu…", options: ["Qeexaya JavaScript gudaha bogga", "Qeexaya CSS", "Qeexaya HTML", "Kaydiya faylalka"], answer: 0, explain: "<script> waa meesha JavaScript-ku ku jiro bogga." },
      { q: "Fikirka <span class='inline-code'>document.getElementById()</span> wuxuu…", options: ["Helaysaa qaybta leh ID-ga", "Qoraa qoraal", "Kaydiyaa fayl", "Furayaa bog"], answer: 0, explain: "document.getElementById() waxay helaysaa qaybta HTML ee leh ID-gaas." },
      { q: "JavaScript-ku wuxuu bogga ka dhigayaa…", options: ["Firfircoon (interactive)", "Midab", "Qoraal", "Cabbir"], answer: 0, explain: "JavaScript wuxuu bogga ka dhigayaa mid firfircoon oo la falgala." },
      { q: "<span class='inline-code'>console.log()</span> waxaa loo isticmaalaa…", options: ["Soo bandhiga xogta browser-ka debug", "Qoraalka", "Rangga", "Soo dejinta"], answer: 0, explain: "console.log() waxay xogta ku tusaysaa browser-ka debug (development)." }
    ]
  },
  {
    id: "js-2",
    category: "js",
    title: "Variables iyo Noocyada Xogta",
    summary: "Baro variables (let, const), noocyada xogta iyo sida loo isticmaalo qoraal, nambaro iyo maqal.",
    duration: "10 daqiiqo",
    level: "Aasaas",
    content: [
      { t: "p", x: "<strong>Variables</strong> waa magacyo aad ku kaydiso xogta JavaScript. Waxaa loo isticmaalaa <span class='inline-code'>let</span> (beddeli kara) iyo <span class='inline-code'>const</span> (aan la beddelin)." },
      { t: "code", label: "Variables", code: "let magac = \"Amiir\";   // qoraal (string)\nlet da = 20;          // nambar (number)\nconst waddan = \"Soomaaliya\";  // aan la beddelin", lang: "javascript" },
      { t: "table", head: ["Nooca", "Tusaale", "Sharax"], rows: [
        ["String", "\"Salaam\"", "Qoraal"],
        ["Number", "20, 3.14", "Nambar"],
        ["Boolean", "true / false", "Sax ama khaldan"],
        ["Null", "null", "Banaan"],
        ["Undefined", "undefined", "Aan la cayimin"]
      ] },
      { t: "h2", x: "Sida loo isticmaalo" },
      { t: "code", label: "Tusaale", code: "let magac = \"Amiir\";\nlet da = 20;\n\n// Qoraal isku-dhafan\nlet salaam = \"Salaam \" + magac;\nconsole.log(salaam);  // \"Salaam Amiir\"\n\n// Xisaab\nlet guud = da + 5;\nconsole.log(guud);  // 25", lang: "javascript" },
      { t: "h2", x: "let iyo const" },
      { t: "ul", items: [
        "<strong>let:</strong> waxaad beddeli kartaa markasta (tusaale nambar dherer ah).",
        "<strong>const:</strong> marka la sameeyo ma beddeli karto (tusaale waddan)."
      ] },
      { t: "example", title: "Tusaale buuxa", code: "const magaca = \"Amiir\";\nlet da = 20;\nda = 21;  // waa la beddelay\n// magaca = \"Cusub\";  // khalad! const ma beddeli karto", lang: "javascript" },
      { t: "tip", title: "Xeer wanaagsan", x: "Isticmaal const markasta oo aad aamusan tahay, let marka aad beddeli doonto. Var (nooca hore) ha isticmaalin — waa mid hore." }
    ],
    quiz: [
      { q: "Variables waxaa loo isticmaalaa…", options: ["Kaydinta xogta JavaScript", "Qoraalka HTML", "Rangga CSS", "Soo dejinta"], answer: 0, explain: "Variables waa magacyo xogta lagu kaydiyo." },
      { q: "<span class='inline-code'>const</span> waxay…", options: ["Aan la beddeli karin marka la sameeyo", "Waa la beddeli karaa", "Waa qoraal", "Waa nambar"], answer: 0, explain: "const waa xog aan la beddelin; let waa mid la beddeli karo." },
      { q: "Nooca xogta <span class='inline-code'>\"Salaam\"</span> waa…", options: ["String (qoraal)", "Number (nambar)", "Boolean", "Null"], answer: 0, explain: "Qoraalka guud waa String; nambar waa Number." },
      { q: "Nooca xogta <span class='inline-code'>true</span> waa…", options: ["Boolean", "String", "Number", "Undefined"], answer: 0, explain: "true iyo false waa Boolean (sax ama khaldan)." },
      { q: "Isku-dhafka qoraalka <span class='inline-code'>\"Salaam \" + magac</span> wuxuu…", options: ["Sameeyaa qoraal isku-dhafan", "Xisaab", "Beddelaa xog", "Kaydiya"], answer: 0, explain: "+ wuxuu ku darayaa qoraallada si isku-dhafan." }
    ]
  },
  {
    id: "js-3",
    category: "js",
    title: "Shuruudaha (Conditions) iyo Loops-ka",
    summary: "Baro sida shuruudaha (if/else) loo isticmaalo iyo loops-ka (for) si aad u qorto barnaamijyo fudud.",
    duration: "11 daqiiqo",
    level: "Aasaas",
    content: [
      { t: "p", x: "JavaScript waxay kuu ogolaadayaa inaad qorto barnaamijyo qeexaya sida loo sameeyo. Waxaan baranaynaa <strong>shuruudaha (if/else)</strong> iyo <strong>loops-ka (for)</strong>." },
      { t: "h2", x: "Shuruudaha (Conditions)" },
      { t: "code", label: "If/Else", code: "let da = 20;\n\nif (da >= 18) {\n  console.log(\"Waa qof weyn\");\n} else {\n  console.log(\"Waa ilmo\");\n}", lang: "javascript" },
      { t: "p", x: "JavaScript-ku wuxuu eegayaa shuruudda <span class='inline-code'>da >= 18</span> — haddii ay tahay sax, wuxuu qoraa waxa ku jira <span class='inline-code'>if</span>, kale waa <span class='inline-code'>else</span>." },
      { t: "h2", x: "Xeerarka isbarbardhiga" },
      { t: "table", head: ["Xeerka", "Macnihiisu"], rows: [
        ["==", "La mid (nisbayn)"],
        ["===", "La mid (dhab ah, nooca)"],
        ["!=", "Kala duwan"],
        [">", "Ka weyn"],
        ["<", "Ka yar"],
        [">=", "Ka weyn ama la mid"]
      ] },
      { t: "h2", x: "Loops-ka (for)" },
      { t: "code", label: "For loop", code: "for (let i = 0; i < 5; i++) {\n  console.log(\"Loo qabay \" + i);\n}", lang: "javascript" },
      { t: "p", x: "Loop-ku wuxuu ku celinayaa qoraalka 5 jeer (0, 1, 2, 3, 4) — taas waxay ka dhigaysaa qoraalka mid fudud oo aan ku qorin qoraal keliya." },
      { t: "example", title: "Tusaale: shuruud iyo loop isku-dhafan", code: "for (let i = 1; i <= 3; i++) {\n  if (i % 2 === 0) {\n    console.log(i + \" waa nambar tolan\");\n  } else {\n    console.log(i + \" waa nambar lamid\");\n  }\n}", lang: "javascript" },
      { t: "tip", title: "Tilmaam", x: "Shuruudaha iyo loops-ku waa aasaaska barnaamijyada. Ku tababar tusaalooyin fudud ka hor inta aadan ku darsan kuwa adag." }
    ],
    quiz: [
      { q: "Shuruudda <span class='inline-code'>if</span> waxay qortaa waxa…", options: ["Sax ah marka shuruudda la buuxiyo", "Markasta", "Marka khaldan", "Aan la beddelin"], answer: 0, explain: "if waxay qortaa waxa ku jira marka shuruudda la buuxiyo." },
      { q: "<span class='inline-code'>for (let i = 0; i < 3; i++)</span> wuxuu…", options: ["Ku celinayaa 3 jeer", "2 jeer", "4 jeer", "Mar keliya"], answer: 0, explain: "Loop-ku wuxuu ku celinayaa 3 jeer (0, 1, 2)." },
      { q: "Xeerka <span class='inline-code'>==</span> wuxuu…", options: ["Isbarbar dhigaa", "Kala soocaa", "Beddelaa", "Kaydiyaa"], answer: 0, explain: "== waa isbarbar dhig (comparison)." },
      { q: "Shuruudda <span class='inline-code'>else</span> waxay qortaa waxa…", options: ["Marka shuruuddu khaldan tahay", "Marka sax tahay", "Markasta", "Aan la beddelin"], answer: 0, explain: "else waxay qortaa marka shuruudda if khaldan tahay." },
      { q: "<span class='inline-code'>i++</span> wuxuu…", options: ["Ku darayaa 1 i", "Beddelaa i", "Kaydiyaa i", "Tirtiraa i"], answer: 0, explain: "i++ wuxuu ku darayaa 1 (increment)." }
    ]
  }
];

/* Imtixaanka guud ee isku-dhafan (mixed general quiz) */
const GENERAL_QUIZ = {
  title: "Imtixaan Guud: Aasaaska Dijitalada",
  intro: "Imtixaan isku-dhafan oo ka kooban su'aalo ka yimid dhammaan casharrada. Ka bilow meesha aad joogto!",
  questions: [
    { q: "Qaybaha computer-ka waxaa lagu kala saaraa…", options: ["Qalab (hardware) iyo Barnaamij (software)", "Kaliya qalab", "Mowjada iyo keyboard-ka", "Nidaam iyo browser"], answer: 0, explain: "Hardware waa waxa taaban karo, software-ka waa amarro." },
    { q: "Furaha sirta ah ee ugu wanaagsan waa…", options: ["Dherer + xarfo kala duwan + nambaro", "Magacaaga + sannadka", "123456", "Kelmad caan ah"], answer: 0, explain: "Furaha adag wuxuu ka kooban yahay dherer, xarfaha kala duwan iyo astaan." },
    { q: "Phishing-ku waa…", options: ["Khiyaamo lagu doonayo in la helo xog gaar ah", "Barnaamij qoraal", "Adeeg email", "Nidaam hawl-gal"], answer: 0, explain: "Phishing waa khiyaamo xog lagu doonayo in laga xado." },
    { q: "HTML waxaa loo isticmaalaa…", options: ["Qaabeeynta bogga", "Qurxinta bogga", "Bogga firfircoon ka dhigid", "Internet-ka"], answer: 0, explain: "HTML waa luqadda qaabeeynta bogga; CSS waa qurxinta, JS waa firfircoonida." },
    { q: "CSS waxaa loo isticmaalaa…", options: ["Qurxinta bogga (midab, fonto)", "Qoraalka", "Xisaab", "Nidaamka"], answer: 0, explain: "CSS waa luqadda qurxinta bogga." },
    { q: "JavaScript waxaa loo isticmaalaa…", options: ["Bogga firfircoon ka dhigid", "Qoraalka", "Rangga", "Kaydinta"], answer: 0, explain: "JavaScript waa luqadda bogga firfircoon." },
    { q: "Server-ku wuxuu…", options: ["Kaydiyaa bogagga oo soo diraa", "Qoraa qoraal", "Kaydiyaa faylalka", "Furaa bog"], answer: 0, explain: "Server-ka waa computer waayeel ah oo kaydiya bogagga." },
    { q: "Attribute-ka alt ee <img> waa…", options: ["Qoraal soo bandhiga marka sawirku bixin", "Cinwaanka sawirka", "Cabbirka", "Rangga"], answer: 0, explain: "alt waa qoraal muhiim u ah accessibility-ka." },
    { q: "Media query-ku waxaa loo isticmaalaa…", options: ["Qalab kasta loogu qaabeeyo", "Rangga", "Fontada", "Xerka"], answer: 0, explain: "Media query waa CSS qalab kasta loogu qaabeeyo (responsive)." },
    { q: "<span class='inline-code'>const</span> JavaScript…", options: ["Aan la beddeli karin", "Waa la beddeli karaa", "Waa qoraal", "Waa nambar"], answer: 0, explain: "const waa xog aan la beddelin; let waa mid la beddeli karo." }
  ]
};

/* Khayraadka dibadda ah (external resources) */
const RESOURCES = [
  { title: "MDN Web Docs", desc: "Dokumenteerka rasmiga ah ee HTML, CSS iyo JavaScript (English).", url: "https://developer.mozilla.org/so/docs/Web" },
  { title: "freeCodeCamp", desc: "Casharro bilaash ah oo web-dhiska iyo barnaamijyada ku qoran (English).", url: "https://www.freecodecamp.org/learn" },
  { title: "W3Schools", desc: "Tusaalooyin fudud oo HTML, CSS iyo JavaScript (English).", url: "https://www.w3schools.com/" },
  { title: "Khan Academy — Internet Safety", desc: "Casharro badbaadada internet-ka (English).", url: "https://www.khanacademy.org/computing/computer-science/internet-tutorials" },
  { title: "Cyber Essentials — Password Advice", desc: "Tilmaamo badbaadada erayga sirta ah (English).", url: "https://www.ncsc.gov.uk/cyberessentials/backup-your-data" }
];

/* Xeerarka asturnaanta (privacy tips) for safety page */
const SAFETY_TIPS = [
  { icon: "lock", title: "Furaha Sirta Ah ee Adka", desc: "Samee furaha dherer leh oo xarfaha kala duwan, nambaro iyo astaan ku jiraan. U isticmaal akoon kasta furaha kala duwan." },
  { icon: "mail", title: "Ka Fogow Phishing", desc: "Email ka soo baxaya qof aan aqoon oo kuu sheegaya inaad bixiso macluumaad waa khiyaamo. Ha gujin xiriirada shaki leh." },
  { icon: "shield", title: "Ilaali Xogtaada Gaarka Ah", desc: "Magaca, cinwaanka, lambarka telefoonka iyo xogta bangiga ha u qaybin qof aan aqoon." },
  { icon: "alert", title: "Ka Digtoonow Khaladaadka", desc: "Balanqaadyo lacag bilaash ah iyo ‘aad ku guuleysatay’ waxay inta badan noqdaan khaladaad (scams)." },
  { icon: "key", title: "Beddel Furaha Markasta", desc: "Haddii aad tuhunto in qof akoonkaaga arkay, beddel degdeg ah furaha sirta ah." },
  { icon: "wifi", title: "Internet-ka Dadweynaha", desc: "Ka fogow galitaanka akoonada muhiimka ah markaad isticmaalayso WiFi dadweyne; Isticmaal VPN haddii aad heli karto." }
];

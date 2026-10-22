# MR.ducaysane — Website-ka Waxbarashada Dijitalada

Website waxbarasho oo Soomaali ah (6 qaybood · 18 cashar · 90 su'aal) oo leh
**gelitaanka website-ka (login-gate)** — qof kasta waa inuu **email + password**
ku soo galaa ka hor inta uusan bogagga arag — **gelitaanka maamulaha (admin)**
iyo **isdiiwaangelinta isticmaalayaasha** (Supabase).
Server-ku waa Python **stdlib** — **dependency ma baahnid** (pip install ma jiro).

---

## Waxa ku jira

```
mr-ducaysane\
├── server.py                 ← server-ka (website + admin + isticmaale auth)
├── index.html                ← bogga hore (+ 10 bog kale .html)
├── login.html / register.html / account.html   ← bogagga isticmaalaha
├── admin\login.html, dashboard.html            ← bogagga maamulaha
├── assets\css, js, img       ← CSS, JavaScript, summad SVG
├── data\content.js           <− nuxurka casharrada (18 cashar/90 su'aal)
├── tools\                    ← script-yada caawinta + imtixaannada
│   ├── set_admin_password.py     (cayi furaha maamulaha)
│   ├── set_supabase.py           (kaydi lambararka database)
│   ├── supabase_users.sql        (SQL-ka jadwalka users)
│   └── *_test.py / qa-test.js    (imtixaannada)
├── .env.example              ← TEMPLATE sir la'aan (NUGUL ka samee `.env`)
├── ADMIN_SETUP.md            <− hage gelitaanka maamulaha
└── DATABASE_SETUP.md         ← hage Supabase (talaabo-talaabo)
```

> **`.env` ku jira ma jiro** — faylkaas sir (furaha + lambararka) ayaa ku jira,
> sidaas darteed waa laga saaray. Beddelkiisa waa `.env.example`.

---

## Soo-dejinta ZIP-ka — link toos ah (ma baahna login)

Server-ku wuxuu bixiyaa laba link oo **taabasho keliya** ku soo dejiya ZIP-ka
(``Content-Disposition: attachment`` — browser-ku ma furo, wuu soo dejiyaa):

```
/mr-ducaysane-source.zip      ← link-ka gaaban ee la taabanayo
/download/source.zip          ← isla faylkaas, magac kale
```

Faylkaasi waa source-ka oo dhan **sir la'aan** (`.env`, `data/users.db`,
`server.log` kuma jiraan), sidaas darteed **site-gate (login) looma baahna** —
bogagga website-ka weli way xiran yihiin.

Dib u dhis ZIP-ka marka source beddelo:

```bash
python3 tools/build_zip.py     # 53 fayl, sir 0
```

---

## Waxa u baahan tahay (Windows)

1. **Python 3.10+** — [python.org/downloads](https://www.python.org/downloads/)
   - Marka aad rakibayso **勾选 "Add python.exe to PATH"** (muhiim!)
2. **Browser** kasta (Chrome/Edge/Firefox)
3. *(Ikhtiyaari)* **Node.js** — kaliya haddii aad rabto inaad shiibaadka (tests) shiibdo

---

## Tallabo-talaabo (Windows) — 5 daqiiqo

### 1. Furi faylka ZIP-ka
Right-click `mr-ducaysane-source.zip` → **Extract All…** → **Extract**.
Fur terminal (PowerShell) oo gal faylka:

```powershell
cd path\to\mr-ducaysane
```

### 2. Samee faylka `.env` (sirahaaga)
```powershell
copy .env.example .env
```
Faylka `.env` wax ku qor **adiga keligaa** — ha soo bandhin, ha soo dejin.

### 3. Cayi furaha maamulaha (hash keliya waa la kaydinayaa)
```powershell
python tools\set_admin_password.py
```
- Waxay ku weydiinaysaa **email** iyo **furaha sirta ah** (qoraalka kuma muuqdo)
- Furaha **qoraal ahaan meelna kuma qorayaan** — `PBKDF2-SHA256` hash oo keliya
  ayaa `.env` gasha

### 4. Bilow server-ka
```powershell
python server.py
```

### 5. Fur browser-ka — website-ku wuu xiran yahay (login)

| Bogga | Link |
|---|---|
| **Website-ka** (→ waxaa kuugu soo dhawaanaysa bogga Galitaanka) | http://localhost:3000 |
| **Gal Website-ka** (email + password) | http://localhost:3000/login |
| **Isdiiwaangeli** (akoon cusub) | http://localhost:3000/register |
| **Gelitaanka Maamulaha** | http://localhost:3000/admin/login |

> **Sida ugu horreysa:** http://localhost:3000 fur — **bogga Galitaanka (login)**
> ayaa ku soo dhawaanaya. Ilaa aad **email-ka iyo password-ka** soo buuxiso,
> website-ka gudihiisa **gelin kartid**. Akoon ma leedahay? Ku bilow
> **/register** ("Isdiiwaangeli").

- **Email-ka maamulaha:** kan aad qortay tallaabada 3-aad
- **Furaha:** kan aad samaysay tallaabada 3-aad
- Jooji server-ka: terminal-ka riix **Ctrl+C**

---

## Database-ka isticmaalayaasha — WAJIB, laakiin wuu SHAQEYNAYAA ISLA MARKIIBA

> ✅ **DB-gu wuu shaqaynayaa adigoon wax dejin — database maxali ah (SQLite)
> `data/users.db` ayaa si OTOMAATIK ah loo sameeyaa** markaad bilowdo server-ka.
> Isdiiwaangelinta iyo soo-geliddu way shaqeeyaan hadda — fariin *"Database-ka
> ... weli loo soo xirin"* **waligeed ma arki doontid**.

**Xogta kaydka:** akoonnada waxaa lagu keydiyaa `data/users.db` (PBKDF2 hash
oo keliya; `data/` waa 404 ka reeban serving-ka). Faylkaas `.env`-ka la mid
ku dar backup-ka.

### Ikhtiyaari: Supabase (database shabakadeed — markaad rabto inaad kor u qaaddo)

Haddii aad rabto in akoonnada ay ku noolaadaan **mashiin kasta** (ama aad
website-ka dhigto server ka duwan), ku xir Supabase — **5 tallaabo** ku qor
[DATABASE_SETUP.md](DATABASE_SETUP.md):

1. [supabase.com](https://supabase.com) → **New project** (bilaash)
2. SQL Editor → ku dheji nuxurka [`tools/supabase_users.sql`](tools/supabase_users.sql) → **Run**
3. `python tools\set_supabase.py` → ku weydiinaysaa **Project URL** + **`service_role`** key
   (Settings → API — *`anon` key maaha*)
4. Server-ka dib u bilow: `python server.py` — Supabase wuu qaadayaa (SQLite-ka
   meesha buu ka baxayaa)
5. Imtixaan tooska ah: `python tools\db_live_test.py`
   → `DATABASE CONNECTED AND TESTED ✅` ayay daabacaysaa

> ⚠️ **Xusuus:** akoonnada SQLite-ga maxaliga ah iyo kuwa Supabase **kal iyo
> la' maaha** — markaad Supabase ku xirto, akoonnada horay u jiray `data/users.db`
> kuma soo baxayaan. Isticmaalayaasha ku qor mar labaad, ama xogta CSV ahaan u
> wareeji (Supabase Dashboard → Table Editor → Import).

---

## Imtixaanno (ikhtiyaari)

```powershell
# Amniga maamulaha (59 imtixaan)
python tools\admin_test.py

# Isdiiwaangelinta + soo-galidda + maamulka isticmaalayaasha (97 imtixaan, database mock ah)
python tools\db_mock_test.py

# Dashboard-ka maamulaha: dhammaan isticmaalayaasha SQLite ayaa soo baxaya (8 imtixaan, Node.js + jsdom)
node tools/dashboard-render-test.js http://127.0.0.1:3000 <cookie-file> <dashboard.html>

# Bogagga dhammaan (31 QA — waa u baahan tahay Node.js + jsdom)
#   QA-ku wuxuu samaynayaa akoon tijaabo qa-test@example.com oo uu ku soo
#   galaa — DB-gu (SQLite maxaliga ah) wuu la shaqeeyaa adigoon wax dejin.
npm install -g jsdom        # ama: npm install jsdom halka maxaliga ah
set NODE_PATH=%APPDATA%\npm\node_modules
node tools\qa-test.js
```

---

## Dhibaatooyin (troubleshooting)

| Dhib | Xal |
|---|---|
| `'python' is not recognized` | Python ma PATH ku jiro — rakib mar kale oo dhig **Add to PATH**, ama isticmaal `py` beddelka `python` |
| `Address already in use` | Server hore ayaa shaqaynaya — terminal-ka hore `Ctrl+C` qabso, ama `set PORT=3001` |
| "Database ... weli loo soo xirin" | **Waa fariin hore — hagaajiyay!** DB-gu hadda SQLite maxali ah ayaa isticmaala isla markiiba (Supabase ma u baahnid). Weli aragtaa? Server-ka dib u bilow (`python server.py`) — faylka `server.py` cusub maaha, mid hore ayaa shaqaynaya |
| Website-ku `/login` ayuu ii soo dirayaa | **Waa la filayo** — email + password ku buuxi (akoon ka samayso /register) |
| "Origin-ka uma dhigma boggan" (403) | Horey bay u dhacday — hadda waxaa la hagaajiyay: dhammaan foomarka (`/login`, `/register`, `/admin/login`, foomka xiriirka) waxay `csrf_token` diraan (frame/sandbox-ka `Origin: null` wuu aqbalaa token-la'aan maaha), marab-korka (proxy) `Host`/`X-Forwarded-Host` wuu ka qiyaasaa. server-ka oo dib loo bilaabay kadib isku day. Token dhacay (dib-u-bilaabid) **419** ayuu ku noqdaa foom cusub oo aad dib u diri karto — 403 khaad ah maaha. Weli 403? Khadiijka (`server.log`) `origin mismatch` wuu ku qoraa — `TRUSTED_ORIGINS=https://…` `.env`-in ku dar |
| Furaha maamulaha ma xasuusto | `python tools\set_admin_password.py` — cusub samee (kama lumayso wax) |
| Foomka xiriirka "server-ka lama gaarsiin" | Server-ku uma shaqaynayo — `python server.py` hubi |

---

## Amniga (muhiim)

- **`.env` ha soo bandhin, ha soo dejin, ha git-gelin** — sirahaaga ku jiraan
- Furaha sirta ah **qoraal ahaan kuma keydsana** meelna — **hash (PBKDF2, 600k iterations, salt)** oo keliya
- **Website-ku wuu xiran yahay** — bog kasta (static iyo API) `/login` ayuu ka gudbaa; kaliya `/login`, `/register` iyo `/assets/` (styling) ayaa furan
- `/admin` waxaa server-ka ilaaliya — session-ka 4 saac kadib wuu dhacaa (markaa dib aad u soo galaysaa)
- **Dashboard-ka maamulaha** (`/admin`): liiska isticmaalayaasha (raadi, jari, bogaysi, profile) + jooji/ka shaqeeyi/tirtir (xaqiijiin la socota). Hash/qoraal/sir **waligiis** lama tuso
- **Amni dheeraad ah:** Content-Security-Policy (`script-src 'self'`), Secure cookies marka HTTPS, session cusub markaad soo gasho, HSTS, Permissions-Policy
- Markaad dhaqaaqayso: `.env` ka reeb, koobiga ZIP-ka ah **keliya** soo dejiso

---

## Xogta kaydinta (backup)

- **Faylalka:** dhammaan `.html`, `assets\`, `data\content.js` — kuwanu waa dhammaan nuxurka
- **Database (SQLite, caadiga):** `data\users.db` — faylkaas oo kaliya ku dar backup-ka
- **Database (markaad Supabase xirto):** Supabase Dashboard → Table Editor → `users` → **Export CSV**
- **Furahaaga:** `.env` meel amaan ah ku keydi (USB/khayr) — lumintiisa = furaha cusub oo kaliya

Wax la daabacay (deploy) ma jiro, domain lama iibin. Kaliya **localhost** — adiga keligaa.

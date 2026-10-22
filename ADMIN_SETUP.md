# 🛡️ MR.ducaysane — Maamulaha (Admin): Sidee loo cayiyo, loo gasho, loo beddelo

> **XAQIIQI:** Bogagga dadweynaha (public) **kama baahna furaha sirta ah**.
> Furaha sirta ah kaliya ayaa loo baahan yahay `/admin` (dashboard-ka).
> Faylka `.env` (halka lagu kaydiyo cayinta) **server-ka ayaa diidan inuu bixiyo** —
> kumana jiraan furayaasha HTML/CSS/JS-ga dadweynaha ama meel kasta la arki karo.

---

## 1) Day furaha sirta ah (aad doorbatay) — tallaabooyin

Terminal-ka (bidixda ama xaqda) ku qor, kana jawaab su'aalaha:

```bash
python3 tools/set_admin_password.py
```

- 🔹 **Email-ka Maamulaha** — `Enter` ku rid haddii aad rabto `maxamedmustafe882@gmail.com`
- 🔹 **Password** — ku qor furaha aad doorbatay (laba jeer). **Ku soo baxi maayo** meel kasta,
  kuna **qorin** fayl kasta — kaliya **PBKDF2-SHA256 hash** (600k iterations, salt
  casuu ah) ayaa ku recording `.env` faylka.

> 💡 Talo: eray-adag oo dhan, ugu yaraan **12+ xaraf** — tusaale isku dhan:
> `#Aqoon-2026!Medo` (kan ha isticmaalin — samee kaagaaga oo kale).

Faylka `.env` (maqan `.gitignore`) waxaa ku jira:

```
ADMIN_EMAIL=maxamedmustafe882@gmail.com
ADMIN_PASSWORD_HASH=pbkdf2_sha256$600000$...   # hash KELIYA — qoraal furaha ma jiro
ADMIN_SESSION_TTL_MINUTES=240                  # muddada soo-galida (daqiiqo)
```

**Dib u bilaab server-ka** si cayinta cusub loo soo qaado:

```bash
# haddii server-ka shaqaynayo, xir marka hore (SERVER_PID-kaaga)
kill $(pgrep -f "python3 server.py") 2>/dev/null
python3 server.py
```

Cabbirka kale ee environment (haddii aad doorbido server-provider):
`ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` (doorbid), `ADMIN_PASSWORD` (halis: qoraal —
waa la hashing gudaha), `ADMIN_SESSION_TTL_MINUTES`, `ADMIN_COOKIE_SECURE=1`
(marka HTTPS isticmaasho).

---

## 2) Sood galitaanka dashboard-ka

1. Fur: **`http://localhost:3000/admin/login`**
2. Ku qor **email-ka maamulaha** + **furaha sirta ah** → riix **Soo Gal**.
3. Waxaad heshaa **`/admin`** — Dashboard-ka Maamulaha.

**Xeerarka xafiiftyada (server-side):**

| Xaalad | Natiijada |
|---|---|
| Furaha khalad ah | Fariin cad: *"Email-ka ama furaha sirta ah si sax ah uma ahayn"* — **isku mid** khaladka email ama password (lama kala saacayo) |
| **5 isku-day oo khalad ah** | **5 daqiiqo xaaran (429)** — difaac ka-bixitaanka (brute force) |
| La soo galin | `/admin` — **302 → `/admin/login`** (dashboard ma arki karo) |
| Cookie been ah | Waa la diidaaa |
| `ADMIN_PASSWORD_HASH` la cayimin | Fariin ku tilmaanta sida loo cayiyo |

---

## 3) Sida loo beddelo nuxurka ilaaliyay (badbaadsan)

1. Gal `/admin` → qaybta **"Ogeysiiska Bogga Hore"**.
2. Ku qor qoraalka (max **500 xaraf**) → **Kaydi (Save)**.
3. Ogeysiisku wuu ka soo baxaa **Bogga Hore** (`data/announcement.json` – server-ka kaliya
   ayaa qoraya; HTTP aan la kala soocin **401** buu heli, CSS/JS-ga dadweynahana
   **kuma qorin** wax).

Beddelidda khaaska ah ee bogagga (casharrada, iwm) waxay ka dhacdaa faylasha HTML ee
jira — **ka hor intaadan beddelin, kaydi (backup) koobiyad**, ka dibna `tools/validate-content.js`
iyo `tools/qa-test.js` mar.

---

## 4) Sood bixid (Logout) & muddada dhicitaanka

- **Ka Bax (Logout)** — badhan dashboard-ka sare — session-ka wuu server-ka ka baxaa
  (cookie keliya ma filanto).
- **Muddada session-ka** — default **240 daqiiqo**; markuu dhaco, bogga login
  wuxuu tusayaa *"Your session has expired. Please sign in again."*
- Dib u soo gal imaanshaha kasta.

---

## 5) Imtixaannada la ogaaday (59/59 PASS)

`TEST_ADMIN_PASSWORD=<tijaabo> python3 tools/admin_test.py`

- `/admin`, `/admin/dashboard.html` → **302** iyada aan la soo galin; API → **401**
- `/.env`, `/server.py`, `/tools/*` → **404** (sir kuma bixiyen; pytest ma oggola)
- Cookie = token casuu ah, **HttpOnly + SameSite=Lax**, `Cache-Control: no-store`
- Login khalad → fariin astaan ah; 5kood → **429 lockout**
- Logout + expiration + origin (CSRF) guard + PBKDF2 salt/iteration checks
- **Origin-ka (`/admin/login`) hadda wuu shaqeeyaa** — dhammaan foomarka
  `csrf_token` bay diraan: `Origin: null` (panel/preview-ka) **token la'aan maaha**,
  token dhacay (server dib loo bilaabay) **419** ayuu ku noqdaa foom dib-u-shubid ah
  (ma aha 403 khaldan), marab-korka `Host`/`X-Forwarded-Host` wuu ka qiyaasaa,
  `TRUSTED_ORIGINS=https://…` `.env`-in ku dar — **khasnadda shisheye (foreign Origin) waligiis 403**
- Public site: **23/23 QA test groups** (quizzes, forms, WhatsApp/Email buttons)

---

## 6) Waxa aan samayn (ogolaansho la'aan)

- ❌ **Ma daabicin** (no deployment) ❌ **domain ma iibin** ❌ **fayl mashaarin (existing) ma tirin**
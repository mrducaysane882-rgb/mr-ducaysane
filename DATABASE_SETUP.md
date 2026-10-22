# DATABASE-KA ISDIIWAANGELINTA — Supabase (ikhtiyaari, kor-u-qaadid)

> ✅ **DB-gu hadda si OTOMAATIK ah ayuu u shaqeeyaa** — database maxali ah
> (SQLite, `data/users.db`) marka uusan Supabase jirin. Boggaan waxaa u baahan
> tahay **kaliya** haddii aad rabto in akoonnada ay ku noolaadaan shabakad
> (Supabase) — tusaale ahaan markaad website-ka dhigto server ka duwan ama
> aad rabto in mishiin badan ay akoonnada wadaagaan.

> ⚠️ **WAJIB hadda:** website-ku wuu ku xiran yahay **login-gate** (email +
> password). Supabase waa kan bixiya isdiiwaangelinta iyo soo-galidda —
> la'aantiisa **qofna website-ka geli maayo** (bogga `/login` kaliya ayaa furan,
> oo *"Database-ka ... weli loo soo xirin"* ayuu tusayaa).

Database-ka waxaa loo isticmaalaa **isdiiwaangelinta akoonada** iyo
**soo-galidda (login)** ee website-ka oo dhan.

> **Sababta Supabase:** server-kaagu waa Python stdlib ah (dependency ma leh).
> Supabase waxay bixisaa **Postgres + REST (PostgREST)** — server-ka isticmaala
> `urllib` kaliya, package cusub ma baahna. Furaha service-role-ka wuxuu ku jiraa
> `.env` oo server-ka oo kaliya akhriya; browser-ka waxba ma gaadho.

---

## Waa maxay la sameeyaa (guud ahaan)

| Tallaabo | Waxa dhacaya | Waqti |
|---|---|---|
| 1 | Samee Supabase project (bilaash) | ~2 daqiiqo |
| 2 | Samee `users` table (SQL-ka soo dejiso) | ~1 daqiiqo |
| 3 | Kaydi furayaasha: `python3 tools/set_supabase.py` | ~1 daqiiqo |
| 4 | Dib u bilow server-ka | 10 sonkod |
| 5 | Imtixaan tooska ah: `python3 tools/db_live_test.py` | ~10 sonkod |
| 6 | Gal website-ka: `/register` → `/login` | ~1 daqiiqo |

---

## Tallaabo 1 — Samee Supabase project (adiga qofkaagu)

1. Fur **https://supabase.com** → **Sign up** (GitHub ama email — waa bilaash).
2. **New project** dooro:
   - **Name:** `mr-ducaysane` (ama mid aad jeceshahay)
   - **Database password:** eray sirta ah oo ad sugto — **hujuu kasta** (ma noo
     baahan tahay, server-ka kama isticmaalayo).
   - **Region:** `EU (Frankfurt)` (ama ugu dhow Soomaaliya).
3. Sug ilaa project-ku diyaar yahay (~1 daqiiqo).

## Tallaabo 2 — Samee `users` table-ka

1. Midig ka dooro **SQL Editor** → **New query**.
2. Faylka [`tools/supabase_users.sql`](tools/supabase_users.sql) oo dhan ku dheji,
   kadibna riix **Run**.
3. Waqtigaan waxaa la sameeyaa:
   - `public.users` (id, name, email, password_hash, is_active, created_at)
   - `email` **unique** ah (akoon labaad isku email ma samayn karto)
   - `is_active` — xaaladda akoonka: maamulaha dashboard-ka ku joojin/kaga
     shaqeeyi karaa (akoon la joojiyay soo-gelin maayo)
   - **Row Level Security** oo xiran + `anon`/`authenticated` oo aan wax akhrisan
     karin — fariin kasta browser-ka ka timid **zero rows** ayay helaan.
     Waxa kaliya ee qoraa waa server-ka **service-role** key (RLS wuu ka gudbaa).

> **Jadwal horey u sameeyay?** SQL-ka weli wuu ku darayaa `is_active`
> (`alter table ... add column if not exists`) — ku rari mar labaad
> SQL Editor-ka, waana ka shaqaynaysaa. Haddii aadan run-gelin, dashboard-ku
> wuxuu bixinayaa fariin cad oo ku saabsan column-ka maqan (ma jabayo).

> Xogta: `password_hash` kaliya ayaa la keydiyaa — furaha sirta ah ee isticmaaleha
> **qoraal ahaan** kuma jiro database-ka (PBKDF2-SHA256, 600,000 iterations, salt
> kasta wuu kala duwan yahay). Dashboard-ka waligiis hash (ama qoraal) tusmaayo.

## Tallaabo 3 — Kaydi furayaasha (sir ahaan)

Terminal-ka ka qor (faylka furaha ma tuso, qoraalka kuma qorayo):

```bash
python3 tools/set_supabase.py
```

Waxay kuu weydiinaysaa laba wax oo keliya:

- **SUPABASE_URL** — Project → **Settings → API → Project URL**
  (`https://xxxxxxxx.supabase.co`)
- **Service-role key** — isla boggaas, **`service_role`** secret-ka
  (**`anon` key maaha** — kan public ayuu yahay, kani waa kan server-ka).

Waxa kaydiya: `.env` (chmod 600, git-ignored, server.py blocked ka dhigay mid aan
la kala soo qaadi karin `/`, `/server.py`, `/tools/`).

> **Siraha ha ku soo bandhin chat, email, ama screenshot.** Haddii aad qalad
> samayso, wali ka dibna `python3 tools/set_supabase.py` wuu ka beddeli karaa.
> Supabase Dashboard → Settings → API ka sidoo kale **waad cursor-gelin kartaa**
> (rotate) haddii aad maanta qalad mooddo in sirtoodu soo baxday.

## Tallaabo 4 — Dib u bilow server-ka

```bash
python3 server.py
```

## Tallaabo 5 — Imtixaan tooska ah (waa MUHIIM)

```bash
python3 tools/db_live_test.py
```

Waxa uu sameeyaa (wuxuu isticmaalaa email khaas ah, kadibna wuu iska tirtiraa):

1. `/register` wuu furayaa ✅
2. Isdiiwaangelin dhab ah → akoon cusub database-ka ✅
3. Email isku mid oo labaad → diidmo (unique constraint) ✅
4. Row-ka la keydiyay wuu eegayaa — `password_hash` **PBKDF2** ayay tahay,
   furaha sirta ah qoraal kuma jiro ✅
5. Email khaldan → diidmo, database-ka lama taabto ✅
6. Tirtiridda test-row-ka — residues ma jiraan ✅

`DATABASE CONNECTED AND TESTED ✅` ayay daabacaysaa = **database-ku wuu shaqaynayaa**.
`BLOCKED` (exit 2) = weli wax baa haray — fariinta ayay kuu sheegaysaa waxa.

---

## Amniga (maxaa ilaaliya)

| Badbaado | Sida |
|---|---|
| Furaha service-role | `.env` kaliya (chmod 600, git-ignored) — HTML/CSS/JS ma gelin |
| Furaha aan la kala qaadi karin | `/.env`, `/server.py`, `/tools/*` → **404** (tijaabay) |
| Furaha browser-ka | **0 jeer** — dhammaan xogta Supabase waxaa ka qoraa server-ka |
| Furaha isticmaaleha | PBKDF2 hash oo keliya database-ka |
| Xogta akoonada | RLS xiran + `anon` revoke — browser-ku rows heli maayo |
| Isku-dayada badan | 15 isdiiwaangelin / 10 daqiiqo / IP (429) |
| Fariin cad | Email la qoray → "horey ayuu akoon u leeyahay" (xog ma sii muujinayo) |

## Dhibatooyin (troubleshooting)

| Fariin | Sabab | Xalka |
|---|---|---|
| "Database-ka ... weli loo soo xirin" (503) | Server-ka waa mid hore (pre-fix) | `server.py` cusub isticmaal + dib u bilow — SQLite-ka wuu shaqeeyaa isla markiiba |
| "Jadwalka 'users' lama helin" | SQL-ka weli lama run-garin | Tallaabo 2 dib u samee |
| "Furaha API-ga ... waa la diiday" | `anon` key aad gelisay ama key hore la cursor-geliyay | `service_role` key dheji (Tallaabo 3) |
| "Database-ku ma jabo hadda" (503) | Supabase-ku down ayay tahay ama URL khaldan | URL fiiri, daqiiqad dib u isku day |
| `LIVE_RC=2 (BLOCKED)` | mid wax ka maqan yahay | fariinta uu bixiyo raac |

## Xogta kaydinta (backup)

Supabase Dashboard → **Table Editor** → `users` → **Export CSV**.
Markasta oo aad rabto inaad soo dejiso. (Furayaasha waa hash — CSV wax sir ah ma
leedii doonto haddii aad si amaan ah u haysato.)

## Galitaanka website-ka (tallaabada u dambeysa)

Database-ka ka dib, **adiga** akoonkaaga ku bilow:

1. Fur `http://localhost:3000` → waxaa kaa hor tegaya bogga **Gal Website-ka**
2. Ku dhufo link-ka **"Isdiiwaangeli"** → magac, email, password (≥8 xaraf) → **Samee Akoonka**
3. `http://localhost:3000/login` → email-ka iyo password-ka ku soo gal ✅
4. Website-ka gudihii waa furan yahay — kor ama hoose ka bix **"Ka Bax"**

Dadka kale: isla `/register` ayay isticmaalayaan (ama aad adiga u samayn karto
email-kooda database-ka Table Editor-ka).

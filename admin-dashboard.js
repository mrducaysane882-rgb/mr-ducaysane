/* ============================================================
   MR.ducaysane — Dashboard-ka Maamulaha (admin-only)
   - Ogeysiiska bogga hore (announcement)
   - Fariimaha xiriirka (contact messages)
   - Maamulka isticmaalayaasha: raadi / jari / bogaysi / profile /
     jooji / ka shaqeeyi / tirtir — dhammaan CSRF + confirm la socda
   - Dhammaan xogta DOM-ka loo dirsado waa textContent (XSS hortag)
   ============================================================ */
(function () {
  "use strict";

  var csrfEl = document.getElementById("adminCsrf");
  var CSRF = csrfEl ? csrfEl.value : "";

  function postJSON(url, payload) {
    payload.csrf_token = CSRF;
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  function goExpired() {
    setTimeout(function () { location.href = "/admin/login?i=expired"; }, 1200);
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text; // textContent: XSS hortag
    return node;
  }

  /* ================= Ogeysiiska bogga hore ================= */
  (function announcement() {
    var form = document.getElementById("announceForm");
    var textarea = document.getElementById("annText");
    var status = document.getElementById("adminStatus");
    var count = document.getElementById("annCount");

    function setStatus(type, msg) {
      if (!status) return;
      status.className = "form-status show " + type;
      status.innerHTML = "<p></p>";
      status.firstChild.textContent = msg;
    }
    function updateCount() {
      if (count) count.textContent = textarea.value.length + " / 500";
    }
    if (textarea) { textarea.addEventListener("input", updateCount); updateCount(); }

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        postJSON("/admin/api/announcement", { text: textarea.value })
          .then(function (res) {
            if (res.status === 401) {
              setStatus("error", "Session-ku wuu dhacay — fadlan soo gal mar kale.");
              goExpired();
              return null;
            }
            return res.json().then(function (data) {
              if (data && data.ok) setStatus("success", "Waa la kaydiyay — ogeysiiska wuu ka muuqdaa Bogga Hore.");
              else setStatus("error", "Kaydinta way fashilantay. Isku day mar kale.");
            });
          })
          .catch(function () {
            setStatus("error", "Xirmo shabakadeed (network) — isku day mar kale.");
          });
      });
    }
  })();

  /* ================= Fariimaha xiriirka ================= */
  (function messages() {
    var list = document.getElementById("messagesList");
    var clearBtn = document.getElementById("clearMsgs");
    if (!list) return;

    function renderMessages(items) {
      list.textContent = "";
      if (!items.length) {
        list.appendChild(el("p", "admin-hint", "Weli fariin xiriir ma jirto."));
        if (clearBtn) clearBtn.hidden = true;
        return;
      }
      if (clearBtn) clearBtn.hidden = false;
      items.forEach(function (m) {
        var box = el("article", "msg-item");
        box.appendChild(el("h4", "", m.subject || "(mawduuc ma jiro)"));
        box.appendChild(el("p", "msg-meta",
          (m.name || "") + " · " + (m.email || "") + " · " + (m.at || "")));
        box.appendChild(el("p", "msg-body", m.message || ""));
        var del = el("button", "btn btn-outline btn-sm", "Tirtir");
        del.type = "button";
        del.addEventListener("click", function () {
          if (!window.confirm("Xaqiiji: fariintan waa la tirtirayaa?")) return;
          postJSON("/admin/api/messages", { action: "delete:" + m.id })
            .then(function (r) { if (r.ok) load(); });
        });
        box.appendChild(del);
        list.appendChild(box);
      });
    }

    function load() {
      fetch("/admin/api/messages", { cache: "no-store" }).then(function (res) {
        if (res.status === 401) {
          list.textContent = "Session-ku wuu dhacay — soo gal mar kale.";
          goExpired();
          return null;
        }
        return res.json().then(function (data) {
          renderMessages((data && data.ok && data.messages) || []);
        });
      }).catch(function () {
        list.textContent = "Xirmo shabakadeed — isku day mar kale.";
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        if (!window.confirm("Xaqiiji: dhammaan fariimaha waa la tirtirayaa?")) return;
        postJSON("/admin/api/messages", { action: "clear" })
          .then(function (r) { if (r.ok) load(); });
      });
    }
    load();
  })();

  /* ================= Maamulka isticmaalayaasha ================= */
  (function users() {
    var summary = document.getElementById("usersSummary");
    var table = document.getElementById("usersTable");
    var tbody = document.getElementById("usersBody");
    var search = document.getElementById("userSearch");
    var sortSel = document.getElementById("userSort");
    var perSel = document.getElementById("userPerPage");
    var pager = document.getElementById("usersPager");
    var prevBtn = document.getElementById("userPrev");
    var nextBtn = document.getElementById("userNext");
    var pageInfo = document.getElementById("userPageInfo");
    var detailBox = document.getElementById("userDetail");
    if (!summary || !table || !tbody) return;

    var state = { q: "", sort: "joined_desc", page: 1, per: 10, pages: 1 };

    function statusPill(status) {
      var inactive = status === "inactive";
      return el("span", "status-pill " + (inactive ? "inactive" : "active"),
        inactive ? "La joojiyay" : "Firfan");
    }

    function actBtn(label, title, onClick) {
      var b = el("button", "btn btn-outline btn-sm", label);
      b.type = "button";
      if (title) b.title = title;
      b.addEventListener("click", onClick);
      return b;
    }

    function showDetail(email) {
      fetch("/admin/api/users?detail=" + encodeURIComponent(email),
            { cache: "no-store" })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          var u = data && data.user;
          detailBox.textContent = "";
          if (!u) {
            detailBox.appendChild(el("p", "admin-hint",
              "Isticmaalahan lama helin (waa la tirtiray ama email-ku khalad yahay)."));
            detailBox.hidden = false;
            return;
          }
          detailBox.appendChild(el("h3", "", "Faahfaahinta: " + u.name));
          var dl = document.createElement("dl");
          dl.className = "admin-facts";
          [["ID-ga", u.id || "—"], ["Magaca", u.name], ["Email-ka", u.email],
           ["Diiwaangelada", u.joined], ["Xaaladda",
            u.status === "inactive" ? "La joojiyay" : "Firfan"]
          ].forEach(function (pair) {
            var wrap = document.createElement("div");
            wrap.appendChild(el("dt", "", pair[0]));
            wrap.appendChild(el("dd", "", pair[1]));
            dl.appendChild(wrap);
          });
          detailBox.appendChild(dl);
          detailBox.appendChild(el("p", "admin-hint",
            "Furaha sirta ah (hash), session-ka iyo token-yada waligeed lama tuso."));
          var close = actBtn("Xir", "", function () { detailBox.hidden = true; });
          detailBox.appendChild(close);
          detailBox.hidden = false;
          detailBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
        })
        .catch(function () {
          summary.textContent = "Xirmo shabakadeed — isku day mar kale.";
        });
    }

    function userAction(action, u) {
      var asks = action === "delete"
        ? "Xaqiiji: " + u.email + " — akoonkan waa la TIRTIRAYAA si walba ah. Ma hubtaa?"
        : "Xaqiiji: akoonka " + u.email + " waa la JOOJINAYAA (wuu soo galin karaa ilaa la ka shaqeeyo).";
      if (!window.confirm(asks)) return;
      postJSON("/admin/api/users", { action: action, email: u.email })
        .then(function (res) {
          return res.json().then(function (data) {
            if (res.status === 401) { goExpired(); return; }
            if (data && data.ok) {
              if (!data.found) {
                summary.textContent = "Email-kan database-ka kuma jiro: " + u.email;
              } else if (action === "delete") {
                summary.textContent = "Akoonka waa la tirtiray: " + u.email;
              } else {
                summary.textContent = action === "activate"
                  ? "Akoonka wuu ka shaqaynayaa hadda: " + u.email
                  : "Akoonka waa la joojiyay: " + u.email;
              }
              load();
            } else if (data && data.error === "status_unsupported") {
              summary.textContent = "Jadwalka 'users' wuxuu ku maqan yahay cinwaanka 'is_active' — tools/supabase_users.sql ku dar SQL-ka cusub (ALTER TABLE).";
            } else {
              summary.textContent = "Ficilka way fashilantay — isku day mar kale.";
            }
          });
        })
        .catch(function () {
          summary.textContent = "Xirmo shabakadeed — isku day mar kale.";
        });
    }

    function renderRows(items) {
      tbody.textContent = "";
      var first = (state.page - 1) * state.per;
      items.forEach(function (u, i) {
        var tr = document.createElement("tr");
        tr.appendChild(el("td", "", String(first + i + 1)));
        var idText = (u.id || "—");
        tr.appendChild(el("td", "", idText.length > 12 ? idText.slice(0, 8) + "…" : idText));
        tr.appendChild(el("td", "", u.name));
        tr.appendChild(el("td", "", u.email));
        tr.appendChild(el("td", "", u.joined));
        var tdStatus = document.createElement("td");
        tdStatus.appendChild(statusPill(u.status));
        tr.appendChild(tdStatus);
        var tdAct = document.createElement("td");
        var row = el("div", "row-actions");
        row.appendChild(actBtn("Tafaasiil", "Eeg faahfaahinta", function () {
          showDetail(u.email);
        }));
        row.appendChild(actBtn(u.status === "inactive" ? "Ka shaqeeyi" : "Jooji",
          u.status === "inactive" ? "U ogolow soo-gelidda" : "Jooji soo-gelidda",
          function () {
            userAction(u.status === "inactive" ? "activate" : "deactivate", u);
          }));
        row.appendChild(actBtn("Tirtir", "Tirtir akoonka", function () {
          userAction("delete", u);
        }));
        tdAct.appendChild(row);
        tr.appendChild(tdAct);
        tbody.appendChild(tr);
      });
      table.hidden = !items.length;
    }

    function load() {
      var url = "/admin/api/users?q=" + encodeURIComponent(state.q)
        + "&sort=" + encodeURIComponent(state.sort)
        + "&page=" + state.page + "&per=" + state.per;
      fetch(url, { cache: "no-store" }).then(function (res) {
        if (res.status === 401) {
          summary.textContent = "Session-ku wuu dhacay — soo gal mar kale.";
          goExpired();
          return null;
        }
        return res.json().then(function (data) {
          if (!data || !data.ok) {
            summary.textContent = data && data.error === "not_configured"
              ? "Database-ka isticmaalayaasha weli loo soo xirin — fadlan raac DATABASE_SETUP.md."
              : "Database-ku ma jawaabo hadda — isku day mar kale.";
            return;
          }
          state.pages = data.pages || 1;
          state.page = data.page || 1;
          var total = data.total || 0;
          summary.textContent = total === 0
            ? (state.q
                ? "Isticmaalahaan lama helin: “" + state.q + "”."
                : "Weli ma jiro isticmaale diiwaangashan — ku biir bogga Isdiiwaangelinta.")
            : "Wadar: " + total + " isticmaale"
              + (state.q ? " (raadinta “" + state.q + "”)" : "")
              + ". Furaha sirta ah (hash) waligeed lama tuso.";
          renderRows(data.users || []);
          if (pager) {
            pager.hidden = total <= (data.per || 10);
            if (pageInfo) {
              pageInfo.textContent = "Bogga " + state.page + " / " + state.pages;
            }
            if (prevBtn) prevBtn.disabled = state.page <= 1;
            if (nextBtn) nextBtn.disabled = state.page >= state.pages;
          }
        });
      }).catch(function () {
        summary.textContent = "Xirmo shabakadeed — isku day mar kale.";
      });
    }

    var debounce;
    if (search) {
      search.addEventListener("input", function () {
        clearTimeout(debounce);
        debounce = setTimeout(function () {
          state.q = search.value.trim();
          state.page = 1;
          load();
        }, 350);
      });
    }
    if (sortSel) {
      sortSel.addEventListener("change", function () {
        state.sort = sortSel.value;
        state.page = 1;
        load();
      });
    }
    if (perSel) {
      perSel.addEventListener("change", function () {
        state.per = parseInt(perSel.value, 10) || 10;
        state.page = 1;
        load();
      });
    }
    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        if (state.page > 1) { state.page -= 1; load(); }
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        if (state.page < state.pages) { state.page += 1; load(); }
      });
    }

    load();
  })();

  if (window.MR) window.MR.hydrateIcons(document);
})();

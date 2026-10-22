/* ============================================================
   MR.ducaysane — Foomka Xiriirka / Contact Form Script
   - Xaqiijinta xogta (client-side validation)
   - Wax ka qabashada fariinta: mailto fallback (daacad ah)
   ============================================================ */
(function () {
  "use strict";

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function boot() {
    const form = document.getElementById("contactForm");
    if (!form) return;

    const status = document.getElementById("formStatus");
    const mailtoLink = document.getElementById("mailtoLink");

    const fields = {
      name: {
        input: document.getElementById("cfName"),
        error: document.getElementById("errName"),
        check: (v) => v.trim().length >= 2
      },
      email: {
        input: document.getElementById("cfEmail"),
        error: document.getElementById("errEmail"),
        check: (v) => EMAIL_RE.test(v.trim())
      },
      subject: {
        input: document.getElementById("cfSubject"),
        error: document.getElementById("errSubject"),
        check: (v) => v.trim().length >= 3
      },
      message: {
        input: document.getElementById("cfMessage"),
        error: document.getElementById("errMessage"),
        check: (v) => v.trim().length >= 10
      }
    };

    function validateField(f, showError) {
      const ok = f.check(f.input.value);
      f.input.classList.toggle("invalid", !ok && showError);
      f.input.setAttribute("aria-invalid", String(!ok && showError));
      if (f.error) f.error.classList.toggle("show", !ok && showError);
      return ok;
    }

    // Xaqiiji marka la beddelo (marka la bogay ka dib)
    Object.values(fields).forEach((f) => {
      f.input.addEventListener("blur", () => validateField(f, true));
      f.input.addEventListener("input", () => {
        if (f.input.classList.contains("invalid")) validateField(f, true);
      });
    });

    function buildMailto() {
      const { name, email, subject, message } = fields;
      const subjectLine = subject.input.value.trim() || "Fariin ka timid MR.ducaysane";
      const body = [
        "Salaam MR.ducaysane,",
        "",
        message.input.value.trim(),
        "",
        "—",
        "Magac: " + name.input.value.trim(),
        "Email: " + email.input.value.trim()
      ].join("\n");
      return (
        "mailto:maxamedmustafe882@gmail.com?subject=" +
        encodeURIComponent(subjectLine) +
        "&body=" +
        encodeURIComponent(body)
      );
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      let firstInvalid = null;
      let allOk = true;
      Object.values(fields).forEach((f) => {
        const ok = validateField(f, true);
        if (!ok) {
          allOk = false;
          if (!firstInvalid) firstInvalid = f.input;
        }
      });

      if (!allOk) {
        window.showStatus(
          status,
          "error",
          "Fadlan sax qaybaha la calaamaday — waxaa la rabaa inaad buuxiso dhammaan meelaha waajibka ah."
        );
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Daacadnimo: mailto waa la diyaariyaa weliba (haddii server-ku fashilmo).
      if (mailtoLink) mailtoLink.href = buildMailto();

      var payload = {
        name: fields.name.input.value.trim(),
        email: fields.email.input.value.trim(),
        subject: fields.subject.input.value.trim(),
        message: fields.message.input.value.trim()
      };

      function done(ok) {
        window.showStatus(
          status,
          "success",
          ok
            ? "Mahadsanid! Fariintaada waa la gaarsiiyay MR.ducaysane — waanu ka jawaabi doonnaa email-kaaga."
            : "Mahadsanid! Xogtaada waa la xaqiijiyay, laakiin fariinta <strong>server-ka lama gaarsiin</strong> — app-ka emailka ayaa diyaariyay, riix badhanka “Ku dir Email” ee hoose si aad u dirto dhab ahaan."
        );
        var mailBtn = document.getElementById("mailtoLink");
        if (mailBtn && !ok) {
          mailBtn.classList.add("btn-primary");
          mailBtn.focus();
          if (typeof mailBtn.scrollIntoView === "function") {
            mailBtn.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      }      // Server-ka hadduu jiro: u dir /api/contact; hadduu fashilmo, mailto waa sii shaqaynaya.
      // CSRF: server-ku wuxuu rabaa synchronizer token (Origin: null -ka
      // panel-ka iyo ajnabiba waa loo diidan yahay token-la'aan).
      if (typeof fetch === "function") {
        fetch("/api/csrf-token", { cache: "no-store" })
          .then(function (res) { return res.ok ? res.json() : null; })
          .then(function (data) {
            if (data && data.csrf_token) payload.csrf_token = data.csrf_token;
            return fetch("/api/contact", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
          })
          .then(function (res) {
            done(res && res.ok);
          })
          .catch(function () {
            done(false);
          });
      } else {
        done(false);
      }

      const mailBtn = document.getElementById("mailtoLink");
      if (mailBtn) {
        mailBtn.classList.add("btn-primary");
        mailBtn.focus();
        if (typeof mailBtn.scrollIntoView === "function") {
          mailBtn.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    });

    // Dhaqaaqida mailto-ga haddii macluumaad la beddelay
    Object.values(fields).forEach((f) => {
      f.input.addEventListener("input", () => {
        if (mailtoLink) mailtoLink.href = buildMailto();
      });
    });
  }

  document.addEventListener("DOMContentLoaded", boot);
})();

/**
 * Contacto B2B — calificación de leads + envío a /api/contact
 */
(function () {
  "use strict";

  function $(id) {
    return document.getElementById(id);
  }

  function buildMessage(challenge, company, role) {
    var parts = [];
    if (company) parts.push("Empresa/Planta: " + company);
    if (role) parts.push("Cargo/Área: " + role);
    parts.push("");
    parts.push(challenge);
    return parts.join("\n");
  }

  function buildSubject(company, role) {
    var bits = ["Evaluación/Cotización web"];
    if (company) bits.push(company);
    if (role) bits.push(role);
    return bits.join(" · ");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = $("contactForm");
    if (!form) return;

    var msg = $("contactMsg");
    var btn = $("contactSubmit");
    var defaultLabel = btn ? btn.textContent : "Enviar Requerimiento Técnico";

    // Prefill desde query (ej. ?quote= / ?name= desde otras páginas)
    try {
      var params = new URLSearchParams(window.location.search);
      var preMsg = params.get("message") || params.get("desafio") || "";
      var preCompany = params.get("empresa") || params.get("company") || "";
      var preName = params.get("name") || "";
      var preEmail = params.get("email") || "";
      var prePhone = params.get("phone") || params.get("tel") || "";
      if (preMsg && $("contactMessage")) $("contactMessage").value = preMsg;
      if (preCompany && $("contactCompany")) $("contactCompany").value = preCompany;
      if (preName && $("contactName")) $("contactName").value = preName;
      if (preEmail && $("contactEmail")) $("contactEmail").value = preEmail;
      if (prePhone && $("contactPhone")) $("contactPhone").value = prePhone;
    } catch (_) {
      /* ignore */
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!btn || !msg) return;

      var name = ($("contactName") && $("contactName").value.trim()) || "";
      var email = ($("contactEmail") && $("contactEmail").value.trim()) || "";
      var phone = ($("contactPhone") && $("contactPhone").value.trim()) || "";
      var company = ($("contactCompany") && $("contactCompany").value.trim()) || "";
      var role = ($("contactRole") && $("contactRole").value.trim()) || "";
      var challenge =
        ($("contactMessage") && $("contactMessage").value.trim()) || "";
      var website =
        ($("contactWebsite") && $("contactWebsite").value) || "";

      if (!name || !email || !phone || !company || !challenge) {
        msg.hidden = false;
        msg.textContent = "Completa los campos obligatorios marcados con *.";
        msg.className = "form-msg is-error";
        return;
      }

      btn.disabled = true;
      btn.textContent = "Enviando…";
      msg.hidden = true;

      var payload = {
        website: website,
        name: name,
        email: email,
        phone: phone,
        subject: buildSubject(company, role),
        message: buildMessage(challenge, company, role),
        company: company,
        role: role,
      };

      var api =
        window.Lpaez && typeof Lpaez.api === "function"
          ? Lpaez.api("/api/contact", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : fetch("/api/contact", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
              credentials: "same-origin",
            }).then(function (r) {
              return r.json().then(function (data) {
                return { ok: r.ok, data: data };
              });
            });

      api
        .then(function (res) {
          msg.hidden = false;
          msg.textContent =
            (res.data && res.data.message) ||
            (res.ok ? "Requerimiento enviado. Te contactaremos pronto." : "No se pudo enviar.");
          msg.className = "form-msg " + (res.ok ? "is-ok" : "is-error");
          if (res.ok) form.reset();
        })
        .catch(function () {
          msg.hidden = false;
          msg.textContent = "Error de conexión. Intenta por WhatsApp.";
          msg.className = "form-msg is-error";
        })
        .then(function () {
          btn.disabled = false;
          btn.textContent = defaultLabel;
        });
    });
  });
})();

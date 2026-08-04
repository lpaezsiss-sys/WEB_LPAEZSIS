(function () {
  "use strict";

  function ensureMeta(attr, key, content) {
    var sel =
      attr === "property"
        ? 'meta[property="' + key + '"]'
        : 'meta[name="' + key + '"]';
    var el = document.querySelector(sel);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    if (!el.getAttribute("content")) el.setAttribute("content", content);
  }

  function isStagingHost() {
    var host = (location.hostname || "").toLowerCase();
    if (!host || host === "localhost" || host === "127.0.0.1") return true;
    return /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host);
  }

  function ensureHeadAssets() {
    if (!document.querySelector('link[rel="icon"]')) {
      var ico = document.createElement("link");
      ico.rel = "icon";
      ico.href = "img/icons/favicon.ico";
      ico.sizes = "any";
      document.head.appendChild(ico);
      var icon32 = document.createElement("link");
      icon32.rel = "icon";
      icon32.type = "image/png";
      icon32.sizes = "32x32";
      icon32.href = "img/icons/favicon-32.png";
      document.head.appendChild(icon32);
      var icon192 = document.createElement("link");
      icon192.rel = "icon";
      icon192.type = "image/png";
      icon192.sizes = "192x192";
      icon192.href = "img/icons/favicon-192.png";
      document.head.appendChild(icon192);
      var apple = document.createElement("link");
      apple.rel = "apple-touch-icon";
      apple.href = "img/icons/apple-touch-icon.png";
      document.head.appendChild(apple);
    }

    ensureMeta("property", "og:type", "website");
    ensureMeta("property", "og:locale", "es_CL");
    ensureMeta("property", "og:site_name", "LPAEZsis");
    ensureMeta("property", "og:image", "https://lpaezsis.cl/img/hero/line.jpg");
    ensureMeta("name", "twitter:card", "summary_large_image");
    ensureMeta("name", "twitter:image", "https://lpaezsis.cl/img/hero/line.jpg");
    ensureMeta("name", "theme-color", "#D81F37");

    if (!document.querySelector('link[rel="alternate"][hreflang="es-CL"]')) {
      var alt = document.createElement("link");
      alt.rel = "alternate";
      alt.hreflang = "es-CL";
      alt.href = document.querySelector('link[rel="canonical"]')
        ? document.querySelector('link[rel="canonical"]').href
        : "https://lpaezsis.cl" + location.pathname;
      document.head.appendChild(alt);
    }

    // Avoid indexing the QNAP/LAN mirror; production canonicals stay on lpaezsis.cl
    if (isStagingHost()) {
      var robots = document.querySelector('meta[name="robots"]');
      if (!robots) {
        robots = document.createElement("meta");
        robots.setAttribute("name", "robots");
        document.head.appendChild(robots);
      }
      robots.setAttribute("content", "noindex,nofollow");
    }
  }

  function navIcon(paths) {
    return (
      '<svg class="nav-ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8">' +
      paths +
      "</svg>"
    );
  }

  function headerHtml() {
    var icoCart =
      '<path d="M6 7h15l-1.5 9H8L6 7z"/><path d="M6 7 5 4H3"/><circle cx="10" cy="20" r="1.3"/><circle cx="17.5" cy="20" r="1.3"/>';
    var icoQuote =
      '<path d="M7 5h10v14H7z"/><path d="M10 9h4M10 12h4M10 15h2.5"/>';

    return (
      '<a class="skip-link" href="#main">Ir al contenido</a>' +
      '<header class="site-header">' +
      '<div class="header-inner">' +
      '<a class="logo" href="index.html" aria-label="LPAEZsis inicio">' +
      '<img src="img/brand/logo.png" alt="LPAEZsis" width="160" height="37">' +
      "</a>" +
      '<button type="button" class="nav-toggle" id="navToggle" aria-label="Abrir menú" aria-expanded="false" aria-controls="mainNav">☰</button>' +
      '<nav class="nav" id="mainNav" aria-label="Principal">' +
      '<a href="catalogo.html">Productos</a>' +
      '<div class="nav-dropdown" id="navBrands">' +
      '<button type="button" class="nav-dropdown__toggle" id="navBrandsToggle" aria-expanded="false" aria-controls="navBrandsMenu">' +
      '<span>Representaciones y Distribución</span>' +
      '<span class="nav-dropdown__chevron" aria-hidden="true"></span>' +
      "</button>" +
      '<div class="nav-dropdown__menu" id="navBrandsMenu" hidden>' +
      '<a href="marcas.html?slug=sonic-air-systems">Sonic Air Systems</a>' +
      '<a href="marcas.html?slug=lyc-ltda">LYC LTDA</a>' +
      '<a href="marcas.html?slug=movex">MOVEX</a>' +
      '<a href="marcas.html?slug=isodur">ISODUR</a>' +
      '<a href="marcas.html?slug=combi">COMBI packaging systems</a>' +
      '<a href="marcas.html?slug=haida">HAIDA</a>' +
      '<a class="nav-dropdown__all" href="marcas.html">Ver todas</a>' +
      "</div></div>" +
      '<a href="nosotros.html">Nosotros</a>' +
      '<a href="novedades.html">Novedades</a>' +
      '<a href="contacto.html">Contacto</a>' +
      '<div class="nav-cta">' +
      '<a class="icon-count" href="carrito.html" aria-label="Carrito" title="Carrito">' +
      navIcon(icoCart) +
      '<span class="icon-count-label">Carrito</span>' +
      '<span class="badge" data-cart-count hidden>0</span></a>' +
      '<a class="icon-count" href="cotizacion.html" aria-label="Lista de cotización" title="Lista de cotización">' +
      navIcon(icoQuote) +
      '<span class="icon-count-label">Cotización</span>' +
      '<span class="badge" data-quote-count hidden>0</span></a>' +
      "</div></nav></div></header>"
    );
  }

  function footerHtml() {
    return (
      '<footer class="site-footer">' +
      '<div class="footer-inner">' +
      '<div><a href="index.html"><img class="footer-logo" src="img/brand/logo-white.png" alt="LPAEZsis" width="180" height="42"></a>' +
      "<p>LPAEZsis-Soluciones Industriales SpA — ingeniería, ahorro energético y optimización de packaging y fin de línea en Chile. Distribuidores Sonic Air Systems.</p></div>" +
      "<div><h3>Contacto</h3><ul>" +
      '<li><a data-email href="mailto:ventas@lpaezsis.cl">ventas@lpaezsis.cl</a></li>' +
      '<li><a data-phone href="tel:+56968232745">+56 9 6823 2745</a></li>' +
      '<li><a data-phone2 href="tel:+56941857051">+56 9 4185 7051</a></li>' +
      '<li><a data-wa href="#">WhatsApp</a></li>' +
      "</ul></div>" +
      "<div><h3>Explorar</h3><ul>" +
      '<li><a href="catalogo.html">Productos</a></li>' +
      '<li><a href="nosotros.html">Nosotros</a></li>' +
      '<li><a href="novedades.html">Novedades</a></li>' +
      '<li><a href="cotizacion.html">Pedir cotización</a></li>' +
      '<li><a data-linkedin href="https://cl.linkedin.com/company/lpaez-blowers-secadores-latas-botellas-conveyors-paletizado-etiquetado-cintas-transportadoras" target="_blank" rel="noopener">LinkedIn</a></li>' +
      '<li data-social-optional hidden><a data-instagram href="#" target="_blank" rel="noopener">Instagram</a></li>' +
      '<li data-social-optional hidden><a data-youtube href="#" target="_blank" rel="noopener">YouTube</a></li>' +
      "</ul></div></div>" +
      '<div class="footer-bottom"><p>&copy; <span id="year"></span> LPAEZsis. Todos los derechos reservados.</p></div>' +
      "</footer>" +
      '<a class="wa-float" data-wa href="https://wa.me/56968232745" target="_blank" rel="noopener noreferrer" aria-label="Escribir por WhatsApp" title="WhatsApp">' +
      '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">' +
      '<path fill="currentColor" d="M16.04 3C9.37 3 4 8.3 4 14.9c0 2.1.56 4.1 1.62 5.88L4 29l8.42-2.2a12.2 12.2 0 0 0 3.62.55c6.67 0 12.04-5.3 12.04-11.9C28.08 8.3 22.71 3 16.04 3zm0 21.7c-1.14 0-2.26-.3-3.24-.86l-.23-.13-4.99 1.3 1.33-4.86-.15-.25a9.6 9.6 0 0 1-1.5-5.15c0-5.35 4.4-9.7 9.78-9.7s9.78 4.35 9.78 9.7-4.4 9.7-9.78 9.7zm5.37-7.26c-.29-.15-1.73-.85-2-.95-.27-.1-.46-.15-.66.15-.2.29-.76.95-.93 1.14-.17.2-.34.22-.63.07-.29-.15-1.22-.45-2.32-1.42-.86-.76-1.44-1.7-1.61-1.99-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.51-.07-.15-.66-1.58-.9-2.16-.24-.58-.48-.49-.66-.5h-.56c-.2 0-.51.07-.78.37-.27.29-1.02.99-1.02 2.42s1.05 2.8 1.19 3c.15.2 2.06 3.15 5 4.41.7.3 1.24.48 1.67.61.7.22 1.34.19 1.84.12.56-.09 1.73-.7 1.97-1.38.24-.68.24-1.26.17-1.38-.07-.12-.27-.2-.56-.34z"/>' +
      "</svg>" +
      "</a>" +
      '<div class="toast" id="toast" hidden></div>'
    );
  }

  ensureHeadAssets();

  var mountHeader = document.getElementById("site-header-mount");
  var mountFooter = document.getElementById("site-footer-mount");
  if (mountHeader) mountHeader.outerHTML = headerHtml();
  if (mountFooter) mountFooter.outerHTML = footerHtml();

  var path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav > a").forEach(function (a) {
    var href = a.getAttribute("href");
    if (href === path) a.classList.add("is-active");
  });
  if (path === "marcas.html") {
    var brandsToggle = document.getElementById("navBrandsToggle");
    if (brandsToggle) brandsToggle.classList.add("is-active");
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function bindNavBrandsDropdown() {
    var drop = document.getElementById("navBrands");
    var toggle = document.getElementById("navBrandsToggle");
    var menu = document.getElementById("navBrandsMenu");
    if (!drop || !toggle || !menu) return;

    var leaveTimer = null;
    var ignoreDocClickUntil = 0;

    function canHoverOpen() {
      return window.matchMedia(
        "(min-width: 901px) and (hover: hover) and (pointer: fine)"
      ).matches;
    }

    function setOpen(open) {
      if (leaveTimer) {
        clearTimeout(leaveTimer);
        leaveTimer = null;
      }
      drop.classList.toggle("is-open", !!open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        menu.hidden = false;
        menu.removeAttribute("hidden");
      } else {
        menu.hidden = true;
        menu.setAttribute("hidden", "");
      }
    }

    toggle.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      ignoreDocClickUntil = Date.now() + 400;
      setOpen(!drop.classList.contains("is-open"));
    });

    // Prevent the opening tap from immediately closing via document click.
    document.addEventListener("click", function (e) {
      if (Date.now() < ignoreDocClickUntil) return;
      if (drop.contains(e.target)) return;
      setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });

    drop.addEventListener("mouseenter", function () {
      if (!canHoverOpen()) return;
      setOpen(true);
    });
    drop.addEventListener("mouseleave", function () {
      if (!canHoverOpen()) return;
      leaveTimer = window.setTimeout(function () {
        setOpen(false);
      }, 180);
    });

    function fillBrands(brands) {
      if (!brands || !brands.length) return;
      menu.innerHTML =
        brands
          .map(function (b) {
            return (
              '<a href="marcas.html?slug=' +
              encodeURIComponent(b.slug) +
              '">' +
              escapeHtml(b.name) +
              "</a>"
            );
          })
          .join("") +
        '<a class="nav-dropdown__all" href="marcas.html">Ver todas</a>';
    }

    function loadBrands() {
      if (!window.Lpaez || typeof window.Lpaez.api !== "function") return;
      window.Lpaez.api("/api/brands").then(function (res) {
        if (res.ok) fillBrands((res.data && res.data.brands) || []);
      });
    }

    if (window.Lpaez) loadBrands();
    else window.addEventListener("load", loadBrands);
  }

  bindNavBrandsDropdown();

  function stickyHeaderOffset() {
    var header = document.querySelector(".site-header");
    var h = header ? header.getBoundingClientRect().height : 64;
    return Math.round(h + 20);
  }

  function scrollToAnchor(id, behavior) {
    var el = document.getElementById(id);
    if (!el) return false;
    var top =
      el.getBoundingClientRect().top + window.pageYOffset - stickyHeaderOffset();
    window.scrollTo({ top: Math.max(0, top), behavior: behavior || "smooth" });
    return true;
  }

  function clearLocationHash() {
    if (!location.hash) return;
    if (history.replaceState) {
      history.replaceState(null, "", location.pathname + location.search);
    }
  }

  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  document.addEventListener("click", function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    var href = link.getAttribute("href");
    if (!href || href === "#" || href.length < 2) return;
    var id = decodeURIComponent(href.slice(1));
    if (!document.getElementById(id)) return;
    e.preventDefault();
    scrollToAnchor(id, "smooth");
    // Keep hash out of the URL — mobile browsers re-snap to fragments while scrolling.
    clearLocationHash();
  });

  var hashScrollDone = false;
  function settleHashScroll() {
    if (hashScrollDone) return;
    if (!location.hash || location.hash.length < 2) return;
    var id = decodeURIComponent(location.hash.slice(1));
    if (!document.getElementById(id)) return;
    hashScrollDone = true;
    scrollToAnchor(id, "auto");
    window.setTimeout(function () {
      scrollToAnchor(id, "auto");
      clearLocationHash();
    }, 150);
  }

  settleHashScroll();
  window.addEventListener("hashchange", function () {
    hashScrollDone = false;
    settleHashScroll();
  });
  window.addEventListener("load", settleHashScroll);
})();

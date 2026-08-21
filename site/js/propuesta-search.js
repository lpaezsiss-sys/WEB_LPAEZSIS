/**
 * propuesta-search.js — buscador predictivo del header.
 * Usa GET api/search.php?q= (productos + marcas). Fallback client-side si la API falla.
 */
(function () {
  "use strict";

  var DEBOUNCE_MS = 180;
  var MIN_CHARS = 2;
  var abortController = null;
  var debounceTimer = null;
  var activeIndex = -1;
  var fallbackCache = { products: null, brands: null, loading: null };

  function escapeHtml(str) {
    if (window.Lpaez && Lpaez.escapeHtml) return Lpaez.escapeHtml(str);
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function searchMarkupHtml() {
    return (
      '<div class="header-search-container">' +
      '<form id="globalSearchForm" class="search-form" onsubmit="return false;">' +
      '<input type="text" id="globalSearchInput" placeholder="Buscar equipo, repuesto o marca..." autocomplete="off" aria-label="Buscar productos o repuestos" aria-autocomplete="list" aria-controls="searchResultsDropdown" aria-expanded="false">' +
      '<button type="button" class="search-btn" aria-label="Buscar">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
      '<circle cx="11" cy="11" r="8"></circle>' +
      '<line x1="21" y1="21" x2="16.65" y2="16.65"></line>' +
      "</svg></button></form>" +
      '<div id="searchResultsDropdown" class="search-results-dropdown" style="display: none;" role="listbox" aria-label="Resultados de búsqueda"></div>' +
      "</div>"
    );
  }

  function injectSearchIntoHeader() {
    if (document.getElementById("globalSearchInput")) {
      return document.querySelector(".header-search-container");
    }

    var nav = document.getElementById("mainNav");
    var cta = nav && nav.querySelector(".nav-cta");
    if (!nav || !cta) return null;

    var tpl = document.getElementById("headerSearchTemplate");
    if (tpl && tpl.content) {
      nav.insertBefore(tpl.content.cloneNode(true), cta);
    } else {
      var wrap = document.createElement("div");
      wrap.innerHTML = searchMarkupHtml();
      nav.insertBefore(wrap.firstChild, cta);
    }
    return document.querySelector(".header-search-container");
  }

  function tipoLabel(tipo) {
    if (tipo === "equipo") return "Equipo";
    if (tipo === "repuesto") return "Repuesto";
    if (tipo === "marca") return "Marca";
    return tipo || "Producto";
  }

  function splitApiResults(rows) {
    var products = [];
    var brands = [];
    (rows || []).forEach(function (row) {
      var cat = String(row.categoria || "").toLowerCase();
      if (cat === "marca" || row.tipo === "marca") brands.push(row);
      else products.push(row);
    });
    return { products: products, brands: brands };
  }

  function fetchSearchApi(query) {
    if (abortController) {
      try {
        abortController.abort();
      } catch (e) { /* ignore */ }
    }
    abortController = typeof AbortController !== "undefined" ? new AbortController() : null;

    var url = "api/search.php?q=" + encodeURIComponent(query);
    var opts = { credentials: "same-origin", cache: "no-store" };
    if (abortController) opts.signal = abortController.signal;

    return fetch(url, opts).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    }).then(function (data) {
      if (!Array.isArray(data)) throw new Error("bad payload");
      return splitApiResults(data);
    });
  }

  function loadFallbackCatalog() {
    if (fallbackCache.products && fallbackCache.brands) {
      return Promise.resolve(fallbackCache);
    }
    if (fallbackCache.loading) return fallbackCache.loading;

    var productsP = window.Lpaez && Lpaez.api
      ? Lpaez.api("/api/products").then(function (res) {
          return (res.data && res.data.products) || [];
        })
      : fetch("api/productos.php", { credentials: "same-origin" })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            return Array.isArray(data) ? data : data.products || data.productos || [];
          });

    var brandsP = window.Lpaez && Lpaez.api
      ? Lpaez.api("/api/brands").then(function (res) {
          return (res.data && res.data.brands) || [];
        })
      : fetch("api/marcas.php", { credentials: "same-origin" })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            return Array.isArray(data) ? data : data.brands || data.marcas || [];
          });

    fallbackCache.loading = Promise.all([productsP, brandsP])
      .then(function (pair) {
        fallbackCache.products = pair[0] || [];
        fallbackCache.brands = pair[1] || [];
        fallbackCache.loading = null;
        return fallbackCache;
      })
      .catch(function () {
        fallbackCache.products = fallbackCache.products || [];
        fallbackCache.brands = fallbackCache.brands || [];
        fallbackCache.loading = null;
        return fallbackCache;
      });

    return fallbackCache.loading;
  }

  function matchScore(haystack, needle) {
    var h = normalize(haystack);
    var n = normalize(needle);
    if (!n) return 0;
    if (h === n) return 100;
    if (h.indexOf(n) === 0) return 80;
    if (h.indexOf(n) !== -1) return 60;
    return 0;
  }

  function fallbackSearch(query) {
    var q = String(query || "").trim();
    var products = (fallbackCache.products || [])
      .map(function (p) {
        return {
          item: {
            id: p.id,
            titulo: p.name,
            slug: p.slug,
            tipo: p.tipo || "producto",
            imagen: p.image_url,
            categoria: "producto",
            brand_name: p.brand_name
          },
          score:
            matchScore(p.name, q) * 2 +
            matchScore(p.brand_name, q) +
            matchScore(p.tipo, q) +
            matchScore(p.slug, q)
        };
      })
      .filter(function (x) { return x.score > 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 6)
      .map(function (x) { return x.item; });

    var brands = (fallbackCache.brands || [])
      .map(function (b) {
        var nombre = b.name || b.nombre || "";
        return {
          item: {
            id: b.id,
            titulo: nombre,
            slug: b.slug,
            tipo: "marca",
            imagen: b.logo_url,
            categoria: "marca"
          },
          score: matchScore(nombre, q) * 2 + matchScore(b.slug, q)
        };
      })
      .filter(function (x) { return x.score > 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 4)
      .map(function (x) { return x.item; });

    return { products: products, brands: brands };
  }

  function renderDropdown(results, query) {
    var dropdown = document.getElementById("searchResultsDropdown");
    var input = document.getElementById("globalSearchInput");
    if (!dropdown || !input) return;

    var products = results.products || [];
    var brands = results.brands || [];
    activeIndex = -1;

    if (!query || query.trim().length < MIN_CHARS) {
      hideDropdown();
      return;
    }

    if (!products.length && !brands.length) {
      dropdown.innerHTML =
        '<div class="search-empty">Sin resultados para “' +
        escapeHtml(query.trim()) +
        '”. Prueba con otra marca o modelo.</div>';
      showDropdown();
      return;
    }

    var html = "";
    if (products.length) {
      html += '<div class="search-group-label">Productos</div>';
      products.forEach(function (p, i) {
        var href = "producto.html?slug=" + encodeURIComponent(p.slug || "");
        var title = p.titulo || p.name || "";
        var meta = [tipoLabel(p.tipo), p.brand_name].filter(Boolean).join(" · ");
        html +=
          '<a class="search-result-item" role="option" data-index="' +
          i +
          '" href="' +
          href +
          '">' +
          '<span class="search-result-item__main">' +
          '<span class="search-result-item__title">' +
          escapeHtml(title) +
          "</span>" +
          (meta
            ? '<span class="search-result-item__meta">' + escapeHtml(meta) + "</span>"
            : "") +
          "</span>" +
          '<span class="search-result-item__kind">' +
          escapeHtml(tipoLabel(p.tipo)) +
          "</span>" +
          "</a>";
      });
    }

    if (brands.length) {
      html += '<div class="search-group-label">Marcas</div>';
      brands.forEach(function (b, i) {
        var slug = b.slug || "";
        var nombre = b.titulo || b.name || b.nombre || slug;
        var href = "marcas.html?slug=" + encodeURIComponent(slug);
        var idx = products.length + i;
        html +=
          '<a class="search-result-item search-result-item--brand" role="option" data-index="' +
          idx +
          '" href="' +
          href +
          '">' +
          '<span class="search-result-item__main">' +
          '<span class="search-result-item__title">' +
          escapeHtml(nombre) +
          "</span>" +
          '<span class="search-result-item__meta">Representación / distribución</span>' +
          "</span>" +
          '<span class="search-result-item__kind">Marca</span>' +
          "</a>";
      });
    }

    var total = products.length + brands.length;
    html +=
      '<a class="search-footer-link" href="catalogo.html?q=' +
      encodeURIComponent(query.trim()) +
      '">Ver todos los resultados en catálogo (' +
      total +
      "+)</a>";

    dropdown.innerHTML = html;
    showDropdown();
  }

  function showDropdown() {
    var dropdown = document.getElementById("searchResultsDropdown");
    var input = document.getElementById("globalSearchInput");
    if (!dropdown || !input) return;
    dropdown.style.display = "block";
    input.setAttribute("aria-expanded", "true");
  }

  function hideDropdown() {
    var dropdown = document.getElementById("searchResultsDropdown");
    var input = document.getElementById("globalSearchInput");
    if (!dropdown || !input) return;
    dropdown.style.display = "none";
    input.setAttribute("aria-expanded", "false");
    activeIndex = -1;
    dropdown.querySelectorAll(".is-active").forEach(function (el) {
      el.classList.remove("is-active");
    });
  }

  function getResultItems() {
    var dropdown = document.getElementById("searchResultsDropdown");
    if (!dropdown) return [];
    return Array.prototype.slice.call(
      dropdown.querySelectorAll(".search-result-item")
    );
  }

  function setActive(index) {
    var items = getResultItems();
    if (!items.length) return;
    items.forEach(function (el) {
      el.classList.remove("is-active");
    });
    if (index < 0 || index >= items.length) {
      activeIndex = -1;
      return;
    }
    activeIndex = index;
    items[activeIndex].classList.add("is-active");
    items[activeIndex].scrollIntoView({ block: "nearest" });
  }

  function runSearch(query) {
    var q = String(query || "").trim();
    if (q.length < MIN_CHARS) {
      hideDropdown();
      return;
    }

    fetchSearchApi(q)
      .then(function (results) {
        renderDropdown(results, q);
      })
      .catch(function (err) {
        if (err && err.name === "AbortError") return;
        loadFallbackCatalog().then(function () {
          renderDropdown(fallbackSearch(q), q);
        });
      });
  }

  function bindEvents(container) {
    var input = document.getElementById("globalSearchInput");
    var btn = container.querySelector(".search-btn");
    var form = document.getElementById("globalSearchForm");
    if (!input) return;

    input.addEventListener("focus", function () {
      if (input.value.trim().length >= MIN_CHARS) runSearch(input.value);
    });

    input.addEventListener("input", function () {
      clearTimeout(debounceTimer);
      var value = input.value;
      debounceTimer = setTimeout(function () {
        runSearch(value);
      }, DEBOUNCE_MS);
    });

    input.addEventListener("keydown", function (e) {
      var items = getResultItems();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive(Math.min(activeIndex + 1, items.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive(Math.max(activeIndex - 1, 0));
      } else if (e.key === "Enter") {
        if (activeIndex >= 0 && items[activeIndex]) {
          e.preventDefault();
          window.location.href = items[activeIndex].href;
        } else if (input.value.trim()) {
          e.preventDefault();
          window.location.href =
            "catalogo.html?q=" + encodeURIComponent(input.value.trim());
        }
      } else if (e.key === "Escape") {
        hideDropdown();
        input.blur();
      }
    });

    if (btn) {
      btn.addEventListener("click", function () {
        var q = input.value.trim();
        if (q) window.location.href = "catalogo.html?q=" + encodeURIComponent(q);
        else input.focus();
      });
    }

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
      });
    }

    document.addEventListener("click", function (e) {
      if (!container.contains(e.target)) hideDropdown();
    });
  }

  function init() {
    var container = injectSearchIntoHeader();
    if (!container) return;
    bindEvents(container);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

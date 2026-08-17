/**
 * marcas.js — solo hidratación de datos.
 * La plantilla HTML y el CSS de marcas.html son estables; este archivo
 * rellena nodos existentes y no crea la estructura de maquetado.
 */
(function () {
  "use strict";

  if (!window.Lpaez) {
    console.error("[marcas] Lpaez no está disponible");
    return;
  }

  var els = {
    title: document.getElementById("brandTitle"),
    description: document.getElementById("brandDescription"),
    selector: document.getElementById("brandSelectorGrid"),
    content: document.getElementById("brandContent"),
    gallery: document.getElementById("brandGallery"),
    productsTitle: document.getElementById("brandProductsTitle"),
    productsGrid: document.getElementById("brandProductsGrid"),
    canonical: document.getElementById("brandCanonical"),
    quoteCta: document.getElementById("brandQuoteCta"),
  };

  var slug = Lpaez.queryParam("slug") || "";

  function setText(el, text) {
    if (el) el.textContent = text == null ? "" : String(text);
  }

  function brandCardHtml(b) {
    var href = "marcas.html?slug=" + encodeURIComponent(b.slug);
    var active = slug && slug === b.slug ? " is-active" : "";
    if (b.logo_url) {
      return (
        '<a class="brand-card-item' +
        active +
        '" href="' +
        href +
        '" title="' +
        Lpaez.escapeHtml(b.name) +
        '">' +
        '<img src="' +
        Lpaez.escapeHtml(b.logo_url) +
        '" alt="' +
        Lpaez.escapeHtml(b.name) +
        '" loading="lazy">' +
        "</a>"
      );
    }
    return (
      '<a class="brand-card-item' +
      active +
      '" href="' +
      href +
      '" title="' +
      Lpaez.escapeHtml(b.name) +
      '">' +
      Lpaez.escapeHtml(b.name) +
      "</a>"
    );
  }

  function renderSelector(brands) {
    if (!els.selector) return;
    if (!brands.length) {
      els.selector.innerHTML =
        "<p class='empty-state'>No hay marcas activas por ahora.</p>";
      return;
    }
    els.selector.innerHTML = brands.map(brandCardHtml).join("");
  }

  function renderGallery(urls) {
    if (!els.gallery) return;
    if (!urls || !urls.length) {
      els.gallery.hidden = true;
      els.gallery.innerHTML = "";
      return;
    }
    els.gallery.hidden = false;
    els.gallery.innerHTML = urls
      .map(function (u) {
        return (
          '<a class="brand-gallery-item" href="' +
          Lpaez.escapeHtml(u) +
          '" target="_blank" rel="noopener">' +
          '<img src="' +
          Lpaez.escapeHtml(u) +
          '" alt="" loading="lazy"></a>'
        );
      })
      .join("");
  }

  function hydrateContent(html) {
    if (!els.content) return;
    var hasHtml = !!(html && String(html).trim());
    if (!hasHtml) {
      els.content.innerHTML = "";
      els.content.hidden = true;
      return;
    }
    els.content.innerHTML = html;
    els.content.querySelectorAll("img").forEach(function (img) {
      var real =
        img.getAttribute("data-src") ||
        img.getAttribute("data-lazy-src") ||
        img.getAttribute("data-original");
      if (real) {
        img.setAttribute("src", real);
        img.removeAttribute("data-src");
        img.removeAttribute("data-lazy-src");
      }
      if ((img.getAttribute("src") || "").indexOf("data:image") === 0) {
        img.remove();
      }
    });
    els.content.hidden = false;
  }

  function renderProducts(products, brandName) {
    if (!els.productsGrid) return;
    setText(
      els.productsTitle,
      brandName ? "Equipos " + brandName : "Equipos de la marca"
    );
    if (!products || !products.length) {
      els.productsGrid.innerHTML =
        "<p class='empty-state'>Esta marca se cotiza por proyecto. Solicita una cotización para evaluar tu línea.</p>";
      return;
    }
    if (typeof Lpaez.productCardHtml === "function") {
      els.productsGrid.innerHTML = products.map(Lpaez.productCardHtml).join("");
    } else {
      els.productsGrid.innerHTML = products
        .map(function (p) {
          var name = Lpaez.escapeHtml(p.name || "Producto");
          var href =
            "producto.html?slug=" + encodeURIComponent(p.slug || "");
          return (
            '<article class="product-card"><h3><a href="' +
            href +
            '">' +
            name +
            "</a></h3></article>"
          );
        })
        .join("");
    }
    if (typeof Lpaez.observeReveals === "function") Lpaez.observeReveals();
  }

  function applyBrand(brand, products) {
    document.title = (brand.name || "Marca") + " | LPAEZsis";
    setText(els.title, brand.name || "Representaciones y Distribución");
    setText(
      els.description,
      brand.description ||
        "Productos e información de la representación."
    );

    if (brand.content_html && String(brand.content_html).trim()) {
      hydrateContent(brand.content_html);
    } else if (brand.description) {
      hydrateContent("<p>" + Lpaez.escapeHtml(brand.description) + "</p>");
    } else {
      hydrateContent("");
    }

    renderGallery(brand.gallery || []);
    renderProducts(products || [], brand.name || "");

    if (els.canonical && brand.slug) {
      els.canonical.setAttribute(
        "href",
        "https://lpaezsis.cl/marcas.html?slug=" + encodeURIComponent(brand.slug)
      );
    }
    if (els.quoteCta && brand.slug) {
      els.quoteCta.href =
        "cotizacion.html?brand=" + encodeURIComponent(brand.slug);
    }
  }

  function showLoadError(message) {
    if (els.productsGrid) {
      els.productsGrid.innerHTML =
        "<p class='empty-state'>" +
        Lpaez.escapeHtml(message || "No se pudo cargar la marca.") +
        "</p>";
    }
  }

  function pickDefaultSlug(brands) {
    var sonic = brands.find(function (b) {
      return b.slug === "sonic-air-systems" || /sonic/i.test(b.name || "");
    });
    return (sonic && sonic.slug) || (brands[0] && brands[0].slug) || "";
  }

  function loadBrandDetail(brands) {
    if (!slug) {
      showLoadError("Elige una marca para ver sus equipos.");
      return;
    }

    return Lpaez.api("/api/brands/" + encodeURIComponent(slug)).then(function (r) {
      if (!r.ok) {
        // Marca inactiva o inexistente: redirigir a la primera activa sin romper el shell.
        if (brands.length && brands[0].slug !== slug) {
          window.location.replace(
            "marcas.html?slug=" + encodeURIComponent(brands[0].slug)
          );
          return;
        }
        setText(els.title, "Marca no disponible");
        setText(
          els.description,
          "Esta representación no está activa o no existe."
        );
        showLoadError("No se encontró esta marca (puede estar inactiva).");
        return;
      }
      var brand = (r.data && r.data.brand) || {};
      var products = (r.data && r.data.products) || [];
      applyBrand(brand, products);
    });
  }

  Lpaez.api("/api/brands")
    .then(function (res) {
      var brands = (res.data && res.data.brands) || [];

      if (!slug && brands.length) {
        slug = pickDefaultSlug(brands);
        if (slug && history.replaceState) {
          history.replaceState(
            null,
            "",
            "marcas.html?slug=" + encodeURIComponent(slug)
          );
        }
      }

      renderSelector(brands);
      return loadBrandDetail(brands);
    })
    .catch(function () {
      setText(els.title, "Representaciones y Distribución");
      setText(
        els.description,
        "No se pudieron cargar las marcas. Intenta recargar la página."
      );
      if (els.selector) {
        els.selector.innerHTML =
          "<p class='empty-state'>No se pudieron cargar las marcas.</p>";
      }
      showLoadError("No se pudo cargar la marca. Intenta recargar.");
    });
})();

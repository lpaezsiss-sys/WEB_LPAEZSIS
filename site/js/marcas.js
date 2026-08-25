/**
 * marcas.js — hidratación de datos sobre plantilla HTML estática.
 * Catálogo de marca separado en Equipos y Repuestos.
 * Usa api/marcas.php[?slug=] → { marca, todas } o { marcas, brands }.
 */
document.addEventListener("DOMContentLoaded", function () {
  initMarcasPage();
});

function escapeHtml(str) {
  if (window.Lpaez && typeof Lpaez.escapeHtml === "function") {
    return Lpaez.escapeHtml(str);
  }
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/`/g, "&#96;");
}

function productTipoOf(p) {
  if (!p) return "equipo";
  if (p.tipo === "repuesto" || p.tipo === "equipo") return p.tipo;
  if (p.sale_mode === "buy") return "repuesto";
  return "equipo";
}

function isBrandActive(b) {
  if (!b) return false;
  return (
    b.activo == 1 ||
    b.is_active == 1 ||
    b.activo === true ||
    b.is_active === true ||
    /* listados públicos ya vienen filtrados por activo */
    (b.activo === undefined && b.is_active === undefined)
  );
}

async function initMarcasPage() {
  var urlParams = new URLSearchParams(window.location.search);
  var currentSlug = urlParams.get("slug") || "";

  var selectorContainer =
    document.getElementById("brandSelectorGrid") ||
    document.querySelector(".brand-selector");
  var loaderEl = document.getElementById("brandLoadingText");

  try {
    var url =
      "api/marcas.php" +
      (currentSlug ? "?slug=" + encodeURIComponent(currentSlug) : "");
    var res = await fetch(url, { credentials: "same-origin" });
    if (!res.ok) throw new Error("HTTP " + res.status + " al cargar marcas");

    var data = await res.json();

    // Contrato: array plano | { todas|marcas|brands } + opcional { marca }
    var activeBrands = (
      Array.isArray(data)
        ? data
        : data.todas || data.marcas || data.brands || []
    ).filter(isBrandActive);

    var currentBrand = Array.isArray(data)
      ? data[0]
      : data.marca || null;

    if (
      currentBrand &&
      currentSlug &&
      currentBrand.slug &&
      currentBrand.slug !== currentSlug
    ) {
      // slug pedido no coincide; preferir match en listado
      currentBrand =
        activeBrands.find(function (b) {
          return b.slug === currentSlug;
        }) || currentBrand;
    }

    if (!currentBrand && activeBrands.length > 0) {
      currentBrand =
        activeBrands.find(function (b) {
          return b.slug === currentSlug;
        }) ||
        activeBrands.find(function (b) {
          return b.slug === "sonic-air-systems" || /sonic/i.test(b.nombre || b.name || "");
        }) ||
        activeBrands[0];

      if (!currentSlug && currentBrand.slug && history.replaceState) {
        history.replaceState(
          null,
          "",
          "marcas.html?slug=" + encodeURIComponent(currentBrand.slug)
        );
      }
      currentSlug = currentBrand.slug || currentSlug;
    }

    if (!activeBrands.length) {
      if (selectorContainer) {
        selectorContainer.innerHTML =
          '<p class="text-muted empty-state">No hay marcas disponibles actualmente.</p>';
      }
      var eqGridEmpty = document.getElementById("brandEquiposGrid");
      if (eqGridEmpty) {
        eqGridEmpty.innerHTML =
          '<p class="no-products">No hay marcas activas por ahora.</p>';
      }
      return;
    }

    renderBrandSelector(activeBrands, currentSlug || (currentBrand && currentBrand.slug) || "");

    if (currentBrand) {
      if (loaderEl) loaderEl.style.display = "none";
      updateBrandHero(currentBrand);
      loadBrandDetailExtras(currentBrand.slug);
      loadBrandProducts(
        currentBrand.id || currentBrand.slug,
        currentBrand.nombre || currentBrand.name || currentBrand
      );
    } else {
      var eqGrid = document.getElementById("brandEquiposGrid");
      var rpSec = document.getElementById("brandRepuestosSection");
      if (eqGrid) {
        eqGrid.innerHTML =
          '<p class="no-products">No hay marcas activas por ahora.</p>';
      }
      if (rpSec) rpSec.style.display = "none";
    }
  } catch (error) {
    console.error("Error en marcas.js:", error);
    if (selectorContainer) {
      selectorContainer.innerHTML =
        '<p class="text-muted">No se pudieron cargar las marcas. Intenta recargar la página.</p>';
    }
    var eqGridErr = document.getElementById("brandEquiposGrid");
    var rpSecErr = document.getElementById("brandRepuestosSection");
    if (eqGridErr) {
      eqGridErr.innerHTML =
        '<p class="no-products">No se pudieron cargar las marcas. Intenta recargar.</p>';
    }
    if (rpSecErr) rpSecErr.style.display = "none";
  }
}

function renderBrandSelector(brands, activeSlug) {
  var container =
    document.getElementById("brandSelectorGrid") ||
    document.querySelector(".logo-carousel-track.track-marcas-detail") ||
    document.querySelector(".brand-selector");
  if (!container) return;

  var PLACEHOLDER = "img/placeholder-logo.png";
  var list = (brands || []).filter(function (b) {
    var slug = b.slug || "";
    // "Otras marcas": excluir la marca activa de la vista de detalle
    return slug && slug !== activeSlug;
  });
  // Si por algún motivo queda vacío, mostrar todas
  if (!list.length) list = brands || [];

  if (!list.length) {
    container.innerHTML =
      '<p class="empty-state pm-empty-hint">No hay marcas activas por ahora.</p>';
    container.style.animation = "none";
    return;
  }

  var cards = list
    .map(function (b) {
      var slug = b.slug || "";
      var nombre = b.nombre || b.name || slug;
      var logo = b.logo_url || b.imagen || "";
      if (logo && logo.charAt(0) === "/" && logo.indexOf("//") !== 0) {
        /* keep absolute site path */
      }
      var img = logo
        ? '<img src="' +
          escapeAttr(logo) +
          '" alt="' +
          escapeAttr(nombre) +
          '" loading="lazy" decoding="async" width="140" height="60" ' +
          'onerror="if(!this.dataset.fb){this.dataset.fb=1;this.src=\'' +
          PLACEHOLDER +
          '\';}else{this.style.display=\'none\';}">'
        : '<span class="industrial-brand-card__name">' +
          escapeHtml(nombre) +
          "</span>";
      return (
        '<a href="marcas.html?slug=' +
        encodeURIComponent(slug) +
        '" class="industrial-brand-card" role="listitem" title="' +
        escapeAttr(nombre) +
        '">' +
        img +
        "</a>"
      );
    })
    .join("");

  // Duplicar secuencia para carrusel continuo seamless
  container.innerHTML = cards + cards;
  container.style.animation = "";
}

function updateBrandHero(brand) {
  var titleEl = document.getElementById("brandTitle");
  var descEl =
    document.getElementById("brandShortDesc") ||
    document.getElementById("brandDescription");
  var logoEl = document.getElementById("brandHeroLogo");
  var nombre = brand.nombre || brand.name || "";
  var desc = brand.descripcion || brand.description || "";
  var slug = brand.slug || "";

  if (titleEl) titleEl.textContent = nombre || "Representaciones y Distribución";
  if (descEl) descEl.textContent = desc;
  var legacyDesc = document.getElementById("brandDescription");
  if (legacyDesc && legacyDesc !== descEl) legacyDesc.textContent = desc;
  document.title = (nombre || "Marca") + " | LPAEZsis";

  if (logoEl) {
    var logoBox = logoEl.closest
      ? logoEl.closest(".brand-hero-logo-box")
      : logoEl.parentElement;
    var LOGO_BY_SLUG = {
      "sonic-air-systems": "img/brand/sonic-air.png",
      sonic: "img/brand/sonic-air.png",
      lyc: "img/brand/lyc.png",
      movex: "img/brand/movex.png",
      isodur: "img/brand/isodur.png",
      combi: "img/brand/combi.png",
      haida: "img/brand/haida.png",
      "columbia-machine": "img/uploads/p-57c09a0440925f86.png",
      "cmc-klebetechnik": "img/uploads/p-4123e04f38ce02ea.png",
    };
    var src = String(brand.logo_url || brand.imagen || brand.logo || "").trim();
    if (!src && slug && LOGO_BY_SLUG[slug]) src = LOGO_BY_SLUG[slug];
    if (!src && slug) {
      var guess = String(slug).toLowerCase().replace(/-systems$/i, "");
      if (LOGO_BY_SLUG[guess]) src = LOGO_BY_SLUG[guess];
    }
    function hideHeroLogo() {
      logoEl.onerror = null;
      logoEl.removeAttribute("src");
      logoEl.alt = "";
      logoEl.hidden = true;
      logoEl.style.display = "none";
      if (logoBox) logoBox.hidden = true;
    }
    function showHeroLogo(url) {
      logoEl.onerror = function () {
        hideHeroLogo();
      };
      logoEl.src = url;
      logoEl.alt = "Logo " + (nombre || slug || "marca");
      logoEl.hidden = false;
      logoEl.style.display = "";
      if (logoBox) logoBox.hidden = false;
    }
    if (src) showHeroLogo(src);
    else hideHeroLogo();
  }

  var canonical = document.getElementById("brandCanonical");
  if (canonical && slug) {
    var origin = window.location.origin || "https://prueba1.lpaezsis.cl";
    canonical.setAttribute(
      "href",
      origin + "/marcas.html?slug=" + encodeURIComponent(slug)
    );
  }
  var quoteCta = document.getElementById("brandQuoteCta");
  if (quoteCta && slug) {
    quoteCta.href =
      "contacto.html?empresa=" +
      encodeURIComponent(nombre || slug) +
      "&motivo=cotizacion";
  }

  updateSectionTitles(nombre);
}

function updateSectionTitles(nombre) {
  var eqTitle = document.getElementById("brandEquiposTitle");
  var rpTitle = document.getElementById("brandRepuestosTitle");
  if (eqTitle) {
    eqTitle.textContent = nombre ? "Equipos " + nombre : "Equipos";
  }
  if (rpTitle) {
    rpTitle.textContent = nombre
      ? "Repuestos y Consumibles " + nombre
      : "Repuestos y Consumibles";
  }
}

async function loadBrandDetailExtras(slug) {
  if (!slug) return;
  var contentEl = document.getElementById("brandContent");
  var galleryEl = document.getElementById("brandGallery");
  try {
    if (!(window.Lpaez && typeof Lpaez.api === "function")) return;
    var packed = await Lpaez.api("/api/brands/" + encodeURIComponent(slug));
    if (!packed.ok) return;
    var brand = (packed.data && packed.data.brand) || packed.data || {};
    if (!brand) return;

    if (contentEl) {
      var html = brand.content_html || "";
      if (html && String(html).trim()) {
        contentEl.innerHTML = html;
        contentEl.querySelectorAll("img").forEach(function (img) {
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
        contentEl.hidden = false;
      } else {
        contentEl.innerHTML = "";
        contentEl.hidden = true;
      }
    }

    if (galleryEl) {
      var urls = brand.gallery || [];
      if (urls && urls.length) {
        galleryEl.hidden = false;
        galleryEl.innerHTML = urls
          .map(function (u) {
            return (
              '<a class="brand-gallery-item" href="' +
              escapeAttr(u) +
              '" target="_blank" rel="noopener">' +
              '<img src="' +
              escapeAttr(u) +
              '" alt="" loading="lazy"></a>'
            );
          })
          .join("");
      } else {
        galleryEl.hidden = true;
        galleryEl.innerHTML = "";
      }
    }
  } catch (err) {
    console.error("Error cargando ficha de la marca:", err);
  }
}

function renderProductCardHtml(p) {
  if (window.Lpaez && typeof Lpaez.productCardHtml === "function") {
    return Lpaez.productCardHtml(p);
  }
  var name = escapeHtml(p.name || p.nombre || "Producto");
  var slug = p.slug || "";
  return (
    '<article class="product-card catalog-card">' +
    '<div class="product-card-body"><h3><a href="producto.html?slug=' +
    encodeURIComponent(slug) +
    '">' +
    name +
    "</a></h3></div></article>"
  );
}

async function loadBrandProducts(brandIdentifier, brandOrName) {
  var equiposGrid = document.getElementById("brandEquiposGrid");
  var repuestosGrid = document.getElementById("brandRepuestosGrid");
  var equiposSection = document.getElementById("brandEquiposSection");
  var repuestosSection = document.getElementById("brandRepuestosSection");

  var brandName =
    typeof brandOrName === "string"
      ? brandOrName
      : (brandOrName && (brandOrName.nombre || brandOrName.name)) ||
        (document.getElementById("brandTitle") &&
          document.getElementById("brandTitle").textContent) ||
        "";

  if (!equiposGrid || !repuestosGrid) return;

  try {
    var res = await fetch(
      "api/productos.php?brand=" + encodeURIComponent(brandIdentifier),
      { credentials: "same-origin" }
    );
    if (!res.ok) throw new Error("HTTP " + res.status);
    var products = await res.json();
    if (products && !Array.isArray(products) && Array.isArray(products.products)) {
      products = products.products;
    }

    if (!Array.isArray(products) || products.length === 0) {
      equiposGrid.innerHTML =
        '<p class="no-products">No hay productos disponibles para esta marca.</p>';
      if (repuestosSection) repuestosSection.style.display = "none";
      if (equiposSection) equiposSection.style.display = "block";
      var eqCountEmpty = document.getElementById("equiposCount");
      var rpCountEmpty = document.getElementById("repuestosCount");
      if (eqCountEmpty) eqCountEmpty.textContent = "0 equipos";
      if (rpCountEmpty) rpCountEmpty.textContent = "0 repuestos";
      return;
    }

    var equipos = products.filter(function (p) {
      return productTipoOf(p) === "equipo";
    });
    var repuestos = products.filter(function (p) {
      return productTipoOf(p) === "repuesto";
    });

    var eqTitle = document.getElementById("brandEquiposTitle");
    var rpTitle = document.getElementById("brandRepuestosTitle");
    var eqCount = document.getElementById("equiposCount");
    var rpCount = document.getElementById("repuestosCount");
    if (eqTitle) eqTitle.textContent = "Equipos " + brandName;
    if (rpTitle) rpTitle.textContent = "Repuestos y Consumibles " + brandName;
    if (eqCount) eqCount.textContent = equipos.length + " equipos";
    if (rpCount) rpCount.textContent = repuestos.length + " repuestos";

    if (equipos.length > 0) {
      equiposGrid.innerHTML = equipos.map(renderProductCardHtml).join("");
      if (equiposSection) equiposSection.style.display = "block";
    } else if (equiposSection) {
      equiposSection.style.display = "none";
    }

    if (repuestos.length > 0) {
      repuestosGrid.innerHTML = repuestos.map(renderProductCardHtml).join("");
      if (repuestosSection) repuestosSection.style.display = "block";
    } else if (repuestosSection) {
      repuestosSection.style.display = "none";
    }

    if (window.Lpaez && typeof Lpaez.observeReveals === "function") {
      Lpaez.observeReveals();
    }
  } catch (err) {
    console.error("Error cargando catálogo de la marca:", err);
    equiposGrid.innerHTML =
      '<p class="no-products">No se pudo cargar el catálogo de esta marca.</p>';
    if (repuestosSection) repuestosSection.style.display = "none";
  }
}

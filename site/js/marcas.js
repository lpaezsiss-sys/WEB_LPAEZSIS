/**
 * marcas.js — hidratación de datos sobre plantilla HTML estática.
 * Catálogo de marca separado en Equipos y Repuestos.
 */
document.addEventListener("DOMContentLoaded", function () {
  initBrandPage();
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

async function initBrandPage() {
  var urlParams = new URLSearchParams(window.location.search);
  var currentSlug = urlParams.get("slug");

  try {
    var brandsRes = await fetch("api/marcas.php", { credentials: "same-origin" });
    if (!brandsRes.ok) throw new Error("Error al consultar la API de marcas");
    var brandsData = await brandsRes.json();

    var activeBrands = (Array.isArray(brandsData)
      ? brandsData
      : brandsData.marcas || brandsData.brands || []
    ).filter(function (b) {
      return b && (b.activo == 1 || b.is_active == 1 || b.activo === true || b.is_active === true);
    });

    var currentBrand = activeBrands.find(function (b) {
      return b.slug === currentSlug;
    });
    if (!currentBrand && activeBrands.length > 0) {
      currentBrand =
        activeBrands.find(function (b) {
          return b.slug === "sonic-air-systems" || /sonic/i.test(b.nombre || b.name || "");
        }) || activeBrands[0];
      if (currentBrand.slug && history.replaceState) {
        history.replaceState(
          null,
          "",
          "marcas.html?slug=" + encodeURIComponent(currentBrand.slug)
        );
      }
      currentSlug = currentBrand.slug;
    }

    renderBrandSelector(activeBrands, currentSlug);

    if (currentBrand) {
      updateBrandHero(currentBrand);
      loadBrandDetailExtras(currentBrand.slug);
      loadBrandProducts(currentBrand.id || currentBrand.slug, currentBrand);
    } else {
      renderSplitGrids([], "la marca");
    }
  } catch (error) {
    console.error("Error inicializando la página de marcas:", error);
    setGridError(
      "brandEquiposGrid",
      "No se pudieron cargar las marcas. Intenta recargar."
    );
    setGridError("brandRepuestosGrid", "");
  }
}

function renderBrandSelector(brands, activeSlug) {
  var container = document.getElementById("brandSelectorGrid");
  if (!container) return;

  container.className = "brand-selector-grid";
  if (!brands.length) {
    container.innerHTML =
      '<p class="empty-state">No hay marcas activas por ahora.</p>';
    return;
  }

  container.innerHTML = brands
    .map(function (b) {
      var slug = b.slug || "";
      var nombre = b.nombre || b.name || slug;
      var logo = b.logo_url || b.imagen || "";
      var active = slug && slug === activeSlug ? " is-active" : "";
      var img = logo
        ? '<img src="' +
          escapeAttr(logo) +
          '" alt="' +
          escapeAttr(nombre) +
          '" loading="lazy">'
        : escapeHtml(nombre);
      return (
        '<a href="marcas.html?slug=' +
        encodeURIComponent(slug) +
        '" class="brand-card-item' +
        active +
        '" title="' +
        escapeAttr(nombre) +
        '">' +
        img +
        "</a>"
      );
    })
    .join("");
}

function updateBrandHero(brand) {
  var titleEl = document.getElementById("brandTitle");
  var descEl = document.getElementById("brandDescription");
  var nombre = brand.nombre || brand.name || "";
  var desc = brand.descripcion || brand.description || "";

  if (titleEl) titleEl.textContent = nombre;
  if (descEl) descEl.textContent = desc;
  document.title = (nombre || "Marca") + " | LPAEZsis";

  var canonical = document.getElementById("brandCanonical");
  if (canonical && brand.slug) {
    canonical.setAttribute(
      "href",
      "https://lpaezsis.cl/marcas.html?slug=" + encodeURIComponent(brand.slug)
    );
  }
  var quoteCta = document.getElementById("brandQuoteCta");
  if (quoteCta && brand.slug) {
    quoteCta.href = "cotizacion.html?brand=" + encodeURIComponent(brand.slug);
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

function setCount(elId, n, singular, plural) {
  var el = document.getElementById(elId);
  if (!el) return;
  var label = n === 1 ? singular : plural;
  el.textContent = n + " " + label;
}

function setGridError(gridId, message) {
  var grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = message
    ? '<p class="no-products empty-state">' + escapeHtml(message) + "</p>"
    : "";
}

function renderSplitGrids(products, brandName) {
  var equipos = [];
  var repuestos = [];
  (Array.isArray(products) ? products : []).forEach(function (p) {
    if (productTipoOf(p) === "repuesto") repuestos.push(p);
    else equipos.push(p);
  });

  var eqGrid = document.getElementById("brandEquiposGrid");
  var rpGrid = document.getElementById("brandRepuestosGrid");
  var eqSec = document.getElementById("brandEquiposSection");
  var rpSec = document.getElementById("brandRepuestosSection");

  setCount("equiposCount", equipos.length, "equipo", "equipos");
  setCount("repuestosCount", repuestos.length, "repuesto", "repuestos");
  updateSectionTitles(brandName || "");

  if (eqGrid) {
    eqGrid.innerHTML = equipos.length
      ? equipos.map(renderProductCardHtml).join("")
      : '<p class="no-products empty-state">No hay equipos disponibles para esta marca actualmente.</p>';
  }
  if (rpGrid) {
    rpGrid.innerHTML = repuestos.length
      ? repuestos.map(renderProductCardHtml).join("")
      : '<p class="no-products empty-state">No hay repuestos disponibles para esta marca actualmente.</p>';
  }

  // Ocultar sección vacía solo si la otra tiene ítems (siempre mostrar ambas si ambas vacías)
  if (eqSec) {
    eqSec.hidden = equipos.length === 0 && repuestos.length > 0;
  }
  if (rpSec) {
    rpSec.hidden = repuestos.length === 0 && equipos.length > 0;
  }

  if (window.Lpaez && typeof Lpaez.observeReveals === "function") {
    Lpaez.observeReveals();
  }
}

async function loadBrandProducts(brandIdentifier, brand) {
  var nombre =
    (brand && (brand.nombre || brand.name)) ||
    (document.getElementById("brandTitle") && document.getElementById("brandTitle").textContent) ||
    "";

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
    renderSplitGrids(Array.isArray(products) ? products : [], nombre);
  } catch (err) {
    console.error("Error cargando productos de la marca:", err);
    setGridError(
      "brandEquiposGrid",
      "No se pudieron cargar los equipos de esta marca."
    );
    setGridError(
      "brandRepuestosGrid",
      "No se pudieron cargar los repuestos de esta marca."
    );
    setCount("equiposCount", 0, "equipo", "equipos");
    setCount("repuestosCount", 0, "repuesto", "repuestos");
  }
}

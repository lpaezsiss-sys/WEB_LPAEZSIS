/**
 * marcas.js — hidratación de datos sobre plantilla HTML estática.
 * No crea hero/selector/secciones: solo rellena nodos existentes.
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

async function initBrandPage() {
  var urlParams = new URLSearchParams(window.location.search);
  var currentSlug = urlParams.get("slug");

  try {
    // 1. Obtener listado de marcas activas
    var brandsRes = await fetch("api/marcas.php", { credentials: "same-origin" });
    if (!brandsRes.ok) throw new Error("Error al consultar la API de marcas");
    var brandsData = await brandsRes.json();

    // Filtrar solo marcas activas (la API ya filtra; refuerzo en cliente)
    var activeBrands = (Array.isArray(brandsData)
      ? brandsData
      : brandsData.marcas || brandsData.brands || []
    ).filter(function (b) {
      return b && (b.activo == 1 || b.is_active == 1 || b.activo === true || b.is_active === true);
    });

    // 2. Determinar marca actual (si la del slug no existe o está inactiva, preferir Sonic o la primera activa)
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

    // 3. Renderizar el selector de marcas (con slug efectivo para is-active)
    renderBrandSelector(activeBrands, currentSlug);

    if (currentBrand) {
      updateBrandHero(currentBrand);
      // Ficha enriquecida + galería (detalle) sin alterar el shell HTML
      loadBrandDetailExtras(currentBrand.slug);
      loadBrandProducts(currentBrand.id || currentBrand.slug);
    } else {
      var gridEl = document.getElementById("brandProductsGrid");
      if (gridEl) {
        gridEl.innerHTML =
          '<p class="no-products empty-state">No hay marcas activas por ahora.</p>';
      }
    }
  } catch (error) {
    console.error("Error inicializando la página de marcas:", error);
    var grid = document.getElementById("brandProductsGrid");
    if (grid) {
      grid.innerHTML =
        '<p class="no-products empty-state">No se pudieron cargar las marcas. Intenta recargar.</p>';
    }
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
  var productsTitle = document.getElementById("brandProductsTitle");
  if (productsTitle) {
    productsTitle.textContent = nombre
      ? "Equipos " + nombre
      : "Equipos de la marca";
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

async function loadBrandProducts(brandIdentifier) {
  var gridEl = document.getElementById("brandProductsGrid");
  if (!gridEl) return;

  try {
    var res = await fetch(
      "api/productos.php?brand=" + encodeURIComponent(brandIdentifier),
      { credentials: "same-origin" }
    );
    if (!res.ok) throw new Error("HTTP " + res.status);
    var products = await res.json();
    // Compat: a veces viene envuelto
    if (products && !Array.isArray(products) && Array.isArray(products.products)) {
      products = products.products;
    }

    if (Array.isArray(products) && products.length > 0) {
      gridEl.innerHTML = products.map(renderProductCardHtml).join("");
      if (window.Lpaez && typeof Lpaez.observeReveals === "function") {
        Lpaez.observeReveals();
      }
    } else {
      gridEl.innerHTML =
        '<p class="no-products empty-state">No hay equipos disponibles para esta marca actualmente.</p>';
    }
  } catch (err) {
    console.error("Error cargando productos de la marca:", err);
    gridEl.innerHTML =
      '<p class="no-products empty-state">No se pudieron cargar los equipos de esta marca.</p>';
  }
}

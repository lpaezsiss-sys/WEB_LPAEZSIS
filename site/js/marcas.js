/**
 * marcas.js — hidratación de datos sobre plantilla HTML estática.
 * Catálogo de marca separado en Equipos y Repuestos.
 * Usa api/marcas.php[?slug=] → { marca, todas } o { marcas, brands }.
 */
document.addEventListener("DOMContentLoaded", function () {
  initMarcasPage();
});

var BRAND_IMG_PLACEHOLDER = "img/placeholder.jpg";

/**
 * DEBUG temporal: captura fallos de carga de <img> antes de tocar rutas/lógica.
 * Expuesto en window para handlers onerror inline.
 */
function logImageError(imgElement, originalUrl) {
  console.group("❌ Error al Cargar Imagen");
  console.error("URL Intentada:", imgElement && imgElement.src);
  console.error("URL Original recibida:", originalUrl);
  console.error(
    "Estado de Red:",
    window.navigator.onLine ? "Online" : "Offline"
  );
  console.groupEnd();

  // Evita bucle infinito y asigna placeholder neutro
  if (imgElement) {
    imgElement.onerror = null;
    imgElement.src = "img/placeholder.jpg";
  }
}
window.logImageError = logImageError;

/**
 * Normaliza cualquier URL de imagen de marca (logo, banner, galería, fotos).
 * Reescribe legacy wp-content/uploads → img/products/FILE (WP ya no sirve binarios).
 * Quita slashes iniciales redundantes y cae a placeholder si viene vacía.
 */
function formatBrandImg(url) {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return BRAND_IMG_PLACEHOLDER;
  }
  var trimmed = url.trim();
  // Legacy WordPress: responde text/html, no la imagen → mapa local
  if (/wp-content\/uploads/i.test(trimmed)) {
    var wpFile = trimmed.match(/\/([^\/?#]+\.(jpe?g|png|webp|gif))$/i);
    if (wpFile) return "img/products/" + wpFile[1];
  }
  // Absolutos http(s) sin alterar
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Protocol-relative → https
  if (trimmed.indexOf("//") === 0) return "https:" + trimmed;
  // Elimina slashes iniciales redundantes
  var cleaned = trimmed.replace(/^(\/\/|\/)/, "");
  return cleaned !== "" ? cleaned : BRAND_IMG_PLACEHOLDER;
}

/**
 * Extrae URL cruda desde string u objeto de galería/foto.
 * Equivale a: imgObj.url || imgObj.imagen || imgObj.src || imgObj
 */
function brandImgSource(imgObj) {
  if (imgObj == null) return "";
  if (typeof imgObj === "string") return imgObj;
  if (typeof imgObj === "object") {
    return (
      imgObj.url ||
      imgObj.imagen ||
      imgObj.src ||
      imgObj.imagen_url ||
      imgObj.image_url ||
      ""
    );
  }
  return String(imgObj);
}

/** Markup <img> homogéneo para logos / galería / banners de marca. */
function brandImgTag(imgObj, alt) {
  var originalRaw = brandImgSource(imgObj);
  var imgSrc = formatBrandImg(
    (imgObj && (imgObj.url || imgObj.imagen || imgObj.src)) || imgObj
  );
  // Si imgObj es objeto sin url/imagen/src, brandImgSource cubre imagen_url/etc.
  if (imgSrc === BRAND_IMG_PLACEHOLDER && imgObj && typeof imgObj === "object") {
    imgSrc = formatBrandImg(brandImgSource(imgObj));
  }
  var nombre = alt || "Marca";
  return (
    '<img src="' +
    escapeAttr(imgSrc) +
    '" data-original-url="' +
    escapeAttr(originalRaw) +
    '" alt="' +
    escapeAttr(nombre) +
    '" class="img-fluid" onerror="logImageError(this, this.getAttribute(\'data-original-url\') || \'\')">'
  );
}

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

/** Prefiere hermano .webp bajo img/{brand,products,hero,marcas}/.
 *  No inventa .webp en img/uploads/ (uploads admin sin pareja → picture roto).
 *  Devuelve "" si no aplica conversión (ya es webp, externo o ruta no elegible).
 */
function preferWebpUrl(url) {
  var formatted = formatBrandImg(url);
  if (!formatted || formatted === BRAND_IMG_PLACEHOLDER) return "";
  if (/^https?:\/\//i.test(formatted)) return "";
  if (
    /(\/|^)img\/(products|hero|brand|marcas)\//i.test(formatted) &&
    /\.(jpe?g|png)$/i.test(formatted)
  ) {
    return formatted.replace(/\.(jpe?g|png)$/i, ".webp");
  }
  return "";
}

/** Img de logo de marca: formatBrandImg + img-fluid + onerror → placeholder. */
function brandLogoPictureHtml(src, alt) {
  return brandImgTag(src, alt || "Marca");
}

/**
 * Extrae y normaliza el logo de marca (hero + carrusel).
 * imagen_url | logo_url | imagen → formatBrandImg; vacío → placeholder / mapa slug.
 */
function resolveBrandLogoUrl(brand) {
  brand = brand || {};
  var slug = String(brand.slug || "").trim();
  var rawImg =
    brand.imagen_url ||
    brand.logo_url ||
    brand.imagen_logo ||
    brand.imagen ||
    brand.logo ||
    brand.banner_url ||
    brand.banner ||
    "";
  rawImg = String(rawImg || "").trim();
  if (rawImg) return formatBrandImg(rawImg);

  // Sin URL en API: guess por slug (mapa / rutas estáticas)
  if (slug && typeof LOGO_BY_SLUG !== "undefined" && LOGO_BY_SLUG[slug]) {
    return formatBrandImg(LOGO_BY_SLUG[slug]);
  }
  if (slug) return formatBrandImg("img/brand/" + slug + ".png");
  return BRAND_IMG_PLACEHOLDER;
}

var LOGO_BY_SLUG = {
  "sonic-air-systems": "img/brand/sonic-air.png",
  sonic: "img/brand/sonic-air.png",
  lyc: "img/brand/lyc.png",
  movex: "img/brand/movex.png",
  isodur: "img/brand/isodur.png",
  combi: "img/brand/combi.png",
  haida: "img/brand/haida.png",
  "columbia-machine": "img/uploads/p-57c09a0440925f86.png",
  "columbia-okura": "img/uploads/p-57c09a0440925f86.png",
  "cmc-klebetechnik": "img/uploads/p-4123e04f38ce02ea.png",
};

function resolveBrandLogoWithSlugFallback(brand) {
  var src = resolveBrandLogoUrl(brand);
  var slug = String((brand && brand.slug) || "").trim();
  if (src && src !== BRAND_IMG_PLACEHOLDER && !/^img\/marcas\//i.test(src)) {
    return formatBrandImg(src);
  }
  if (slug && LOGO_BY_SLUG[slug]) return formatBrandImg(LOGO_BY_SLUG[slug]);
  if (slug) {
    var guess = slug.toLowerCase().replace(/-systems$/i, "");
    if (LOGO_BY_SLUG[guess]) return formatBrandImg(LOGO_BY_SLUG[guess]);
  }
  return formatBrandImg(src);
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
      var eqGridEmpty =
        document.getElementById("brandProductsGrid") ||
        document.getElementById("brandEquiposGrid");
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
      var eqGrid =
        document.getElementById("brandProductsGrid") ||
        document.getElementById("brandEquiposGrid");
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
    var eqGridErr =
      document.getElementById("brandProductsGrid") ||
      document.getElementById("brandEquiposGrid");
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
      var nombre = b.nombre || b.name || "Marca";
      var rawImg = b.imagen_url || b.logo_url || b.imagen || "";
      var finalSrc = formatBrandImg(
        resolveBrandLogoWithSlugFallback(b) || rawImg
      );
      var img = brandImgTag(finalSrc, nombre);
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
  container.classList.add("is-ready");
}

function updateBrandHero(brand) {
  var titleEl = document.getElementById("brandTitle");
  var descEl =
    document.getElementById("brandShortDesc") ||
    document.getElementById("brandDescription");
  var logoEl = document.getElementById("brandHeroLogo");
  var nombre = brand.nombre || brand.name || "";
  var desc =
    brand.descripcion_corta ||
    brand.short_description ||
    brand.descripcion ||
    brand.description ||
    "";
  var slug = brand.slug || "";

  if (titleEl) titleEl.textContent = nombre || "Representaciones y Distribución";
  if (descEl) descEl.textContent = desc;
  var legacyDesc = document.getElementById("brandDescription");
  if (legacyDesc && legacyDesc !== descEl) legacyDesc.textContent = desc;
  document.title = (nombre || "Marca") + " | LPAEZsis";

  if (logoEl) {
    var logoBox = logoEl.closest
      ? logoEl.closest(".brand-intro-logo") ||
        logoEl.closest(".brand-hero-logo-box")
      : logoEl.parentElement;
    var WEBSITE_BY_SLUG = {
      "sonic-air-systems": "https://www.sonicairsystems.com",
      sonic: "https://www.sonicairsystems.com",
    };
    var src = resolveBrandLogoWithSlugFallback(brand);
    var websiteUrl = String(
      brand.website_url || brand.website || brand.url || ""
    ).trim();
    if (!websiteUrl && slug && WEBSITE_BY_SLUG[slug]) {
      websiteUrl = WEBSITE_BY_SLUG[slug];
    }
    if (!websiteUrl && slug) {
      var guessWeb = String(slug).toLowerCase().replace(/-systems$/i, "");
      if (WEBSITE_BY_SLUG[guessWeb]) websiteUrl = WEBSITE_BY_SLUG[guessWeb];
    }

    function unwrapLogoLink() {
      var node = logoEl;
      var pic = logoEl.parentElement;
      if (pic && pic.tagName === "PICTURE") node = pic;
      var parent = node.parentElement;
      if (
        parent &&
        parent.tagName === "A" &&
        parent.classList.contains("brand-logo-link")
      ) {
        parent.parentNode.insertBefore(node, parent);
        parent.remove();
      }
    }

    function ensureLogoLink(href) {
      var node = logoEl;
      if (logoEl.parentElement && logoEl.parentElement.tagName === "PICTURE") {
        node = logoEl.parentElement;
      }
      var parent = node.parentElement;
      var title =
        "Visitar sitio oficial de " + (nombre || slug || "la marca");
      if (
        parent &&
        parent.tagName === "A" &&
        parent.classList.contains("brand-logo-link")
      ) {
        parent.href = href;
        parent.target = "_blank";
        parent.rel = "noopener noreferrer";
        parent.title = title;
        return parent;
      }
      var a = document.createElement("a");
      a.className = "brand-logo-link";
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.title = title;
      node.parentNode.insertBefore(a, node);
      a.appendChild(node);
      return a;
    }

    function hideHeroLogo() {
      logoEl.onerror = null;
      logoEl.removeAttribute("src");
      logoEl.alt = "";
      logoEl.hidden = true;
      logoEl.style.display = "none";
      unwrapLogoLink();
      if (logoBox) logoBox.hidden = true;
    }
    function showHeroLogo(url) {
      var raster = formatBrandImg(url);
      var webp = preferWebpUrl(raster);
      logoEl.onerror = function () {
        // DEBUG: solo log; se conserva la cadena de fallback existente
        console.group("❌ Error al Cargar Imagen (hero logo)");
        console.error("URL Intentada:", logoEl.src);
        console.error("URL Original recibida:", url);
        console.error(
          "Estado de Red:",
          window.navigator.onLine ? "Online" : "Offline"
        );
        console.groupEnd();
        if (!logoEl.dataset.fb) {
          logoEl.dataset.fb = "1";
          var alt = slug && LOGO_BY_SLUG[slug] ? LOGO_BY_SLUG[slug] : "";
          if (alt && alt !== raster) {
            logoEl.src = formatBrandImg(alt);
            return;
          }
        }
        if (logoEl.dataset.fb === "1") {
          logoEl.dataset.fb = "2";
          logoEl.src = BRAND_IMG_PLACEHOLDER;
          return;
        }
        hideHeroLogo();
      };
      logoEl.classList.add("img-fluid");
      logoEl.src = raster;
      logoEl.alt = "Logo " + (nombre || slug || "marca");
      logoEl.hidden = false;
      logoEl.style.display = "";
      if (websiteUrl) ensureLogoLink(websiteUrl);
      else unwrapLogoLink();
      // picture alrededor del <img> (webp opcional; el raster evita huecos si 404)
      if (webp && webp !== raster) {
        var wrapParent = logoEl.parentElement;
        if (wrapParent && wrapParent.tagName !== "PICTURE") {
          var pic = document.createElement("picture");
          var source = document.createElement("source");
          source.type = "image/webp";
          source.srcset = webp;
          wrapParent.insertBefore(pic, logoEl);
          pic.appendChild(source);
          pic.appendChild(logoEl);
        }
      }
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
    eqTitle.textContent = nombre
      ? "Equipos y Soluciones de " + nombre
      : "Equipos y Soluciones";
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
            img.getAttribute("data-original") ||
            img.getAttribute("src");
          if ((real || "").indexOf("data:image") === 0) {
            img.remove();
            return;
          }
          var formatted = formatBrandImg(real || "");
          img.setAttribute("src", formatted);
          img.setAttribute("data-original-url", real || "");
          img.classList.add("img-fluid");
          img.onerror = function () {
            logImageError(this, real || "");
          };
          img.removeAttribute("data-src");
          img.removeAttribute("data-lazy-src");
          img.removeAttribute("data-original");
        });
        contentEl.hidden = false;
      } else {
        contentEl.innerHTML = "";
        contentEl.hidden = true;
      }
    }

    if (galleryEl) {
      var urls = brand.gallery || brand.galeria || brand.fotos || brand.images || [];
      if (urls && urls.length) {
        var marcaNombre = brand.nombre || brand.name || "Marca";
        galleryEl.hidden = false;
        galleryEl.innerHTML = urls
          .map(function (imgObj) {
            var imgSrc = formatBrandImg(
              (imgObj && (imgObj.url || imgObj.imagen || imgObj.src)) || imgObj
            );
            var originalRaw = brandImgSource(imgObj);
            return (
              '<a class="brand-gallery-item" href="' +
              escapeAttr(imgSrc) +
              '" target="_blank" rel="noopener">' +
              '<img src="' +
              escapeAttr(imgSrc) +
              '" data-original-url="' +
              escapeAttr(originalRaw) +
              '" alt="' +
              escapeAttr(marcaNombre) +
              '" class="img-fluid" onerror="logImageError(this, this.getAttribute(\'data-original-url\') || \'\')">' +
              "</a>"
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

/**
 * Normaliza imagen de equipo/producto: imagen_url | image_url.
 * Si no hay URL, usa Lpaez.resolveProductImage (mapa slug / fallbacks diversos),
 * no el placeholder genérico (antes era una foto de impeller).
 */
function resolveEquipImage(eq) {
  var raw =
    (eq && (eq.imagen_url || eq.image_url || eq.imagen || eq.image)) || "";
  raw = String(raw || "").trim();
  if (raw) return formatBrandImg(raw);
  if (window.Lpaez && typeof Lpaez.resolveProductImage === "function") {
    try {
      return formatBrandImg(Lpaez.resolveProductImage(eq));
    } catch (_) {
      /* fall through */
    }
  }
  return BRAND_IMG_PLACEHOLDER;
}

function renderProductCardHtml(p) {
  var eqImg = resolveEquipImage(p);
  // Propagar URL normalizada para Lpaez.productCardHtml / fallback local
  var normalized = Object.assign({}, p, {
    image_url: eqImg,
    imagen_url: eqImg,
    imagen: eqImg,
  });

  if (window.Lpaez && typeof Lpaez.productCardHtml === "function") {
    return Lpaez.productCardHtml(normalized);
  }
  var name = escapeHtml(normalized.name || normalized.nombre || "Producto");
  var slug = normalized.slug || "";
  var imgSrc = formatBrandImg(eqImg);
  var webp = preferWebpUrl(imgSrc);
  var imgTag = brandImgTag(imgSrc, name);
  var visual = webp
    ? '<picture><source type="image/webp" srcset="' +
      escapeAttr(webp) +
      '">' +
      imgTag +
      "</picture>"
    : imgTag;
  return (
    '<article class="product-card catalog-card">' +
    '<a class="product-card-visual" href="producto.html?slug=' +
    encodeURIComponent(slug) +
    '">' +
    visual +
    "</a>" +
    '<div class="product-card-body"><h3><a href="producto.html?slug=' +
    encodeURIComponent(slug) +
    '">' +
    name +
    "</a></h3></div></article>"
  );
}

async function loadBrandProducts(brandIdentifier, brandOrName) {
  var equiposGrid =
    document.getElementById("brandProductsGrid") ||
    document.getElementById("brandEquiposGrid");
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
    if (eqTitle) {
      eqTitle.textContent = brandName
        ? "Equipos y Soluciones de " + brandName
        : "Equipos y Soluciones";
    }
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

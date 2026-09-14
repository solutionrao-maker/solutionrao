/*
 * Solution RAO — Consentimento de Cookies Granular (LGPD & Google Consent Mode v2)
 *
 * Categorias:
 * - Necessários: funcionamento básico e armazenamento da preferência (sempre ativos)
 * - Analíticos: Google Analytics 4 (G-LJGPMWB42D)
 * - Marketing: Meta Pixel (1419049243423112)
 *
 * O gtag.js e o Meta Pixel são estritamente bloqueados até o consentimento.
 * O usuário pode aceitar todos, rejeitar não essenciais ou personalizar por categoria.
 */
(function () {
  "use strict";

  var CHAVE_STORAGE = "solutionrao_consent_v2";
  var CHAVE_ANTIGA = "solutionrao_consent";
  var GA_ID = "G-LJGPMWB42D";
  var META_PIXEL_ID = "1419049243423112";

  var gaCarregado = false;
  var metaPixelCarregado = false;

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500
  });

  function lerPreferencia() {
    try {
      var salvo = window.localStorage.getItem(CHAVE_STORAGE);
      if (salvo) {
        return JSON.parse(salvo);
      }
      var antigo = window.localStorage.getItem(CHAVE_ANTIGA);
      if (antigo === "granted") {
        return { necessarios: true, analiticos: true, marketing: true };
      } else if (antigo === "denied") {
        return { necessarios: true, analiticos: false, marketing: false };
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  function salvarPreferencia(pref) {
    try {
      window.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(pref));
    } catch (e) {}
  }

  function apagarCookies(tipos) {
    var partes = document.cookie.split(";");
    for (var i = 0; i < partes.length; i++) {
      var nome = partes[i].split("=")[0].trim();
      var ehGA = nome === "_ga" || nome === "_gid" || nome.indexOf("_ga_") === 0;
      var ehMeta = nome === "_fbp" || nome === "_fbc";
      if ((tipos.analiticos && ehGA) || (tipos.marketing && ehMeta)) {
        document.cookie = nome + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = nome + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + location.hostname + ";";
      }
    }
  }

  function carregarGA4() {
    if (gaCarregado) {
      gtag("consent", "update", { analytics_storage: "granted" });
      return;
    }
    gaCarregado = true;
    gtag("consent", "update", { analytics_storage: "granted" });
    gtag("js", new Date());
    gtag("config", GA_ID);

    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(script);
  }

  function carregarMetaPixel() {
    if (metaPixelCarregado) {
      gtag("consent", "update", {
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted"
      });
      return;
    }
    metaPixelCarregado = true;
    gtag("consent", "update", {
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted"
    });

    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

    window.fbq("init", META_PIXEL_ID);
    window.fbq("track", "PageView");
  }

  function aplicarPreferencia(pref) {
    if (!pref) return;

    if (pref.analiticos) {
      carregarGA4();
    } else {
      if (gaCarregado) {
        gtag("consent", "update", { analytics_storage: "denied" });
      }
      apagarCookies({ analiticos: true });
    }

    if (pref.marketing) {
      carregarMetaPixel();
    } else {
      if (metaPixelCarregado) {
        gtag("consent", "update", {
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied"
        });
      }
      apagarCookies({ marketing: true });
    }
  }

  window.SolutionRAOConsent = {
    obterPreferencia: lerPreferencia,

    definirPreferencia: function (pref) {
      var valorFinal = {
        necessarios: true,
        analiticos: Boolean(pref.analiticos),
        marketing: Boolean(pref.marketing),
        dataAtualizacao: new Date().toISOString()
      };
      salvarPreferencia(valorFinal);
      aplicarPreferencia(valorFinal);
      return valorFinal;
    },

    aceitarTodos: function () {
      return this.definirPreferencia({ analiticos: true, marketing: true });
    },

    apenasNecessarios: function () {
      return this.definirPreferencia({ analiticos: false, marketing: false });
    },

    inicializar: function (aoPrecisarDecisao) {
      var atual = lerPreferencia();
      if (atual) {
        aplicarPreferencia(atual);
      } else if (typeof aoPrecisarDecisao === "function") {
        aoPrecisarDecisao();
      }
    }
  };

  document.addEventListener("click", function (e) {
    var link = e.target.closest('a[href*="wa.me"]');
    if (!link) return;
    if (window.gtag && gaCarregado) {
      window.gtag("event", "whatsapp_click", {
        event_category: "conversion",
        event_label: link.href
      });
    }
    if (window.fbq && metaPixelCarregado) {
      window.fbq("track", "Contact");
    }
  });
})();

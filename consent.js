/*
 * Solution RAO — consentimento de cookies (Google Consent Mode, modo Basic)
 *
 * Basic Consent Mode: o gtag.js do Google Analytics e o Meta Pixel só são
 * inseridos no DOM depois que o usuário aceita. Antes disso, nenhum request
 * sai pro Google ou pra Meta, nenhum cookie analítico/de marketing é criado.
 * Compartilhado entre index.html, politica-de-privacidade.html e
 * politica-de-cookies.html — mesma lógica nas 3 páginas, um arquivo só pra
 * evitar divergência entre cópias.
 */
(function () {
  "use strict";

  var CHAVE_CONSENTIMENTO = "solutionrao_consent"; // "granted" | "denied", em localStorage — não é cookie
  var GA_ID = "G-LJGPMWB42D";
  var META_PIXEL_ID = "1419049243423112";
  var gaCarregado = false;
  var metaPixelCarregado = false;

  function lerPreferencia() {
    try {
      return window.localStorage.getItem(CHAVE_CONSENTIMENTO);
    } catch (e) {
      return null;
    }
  }

  function salvarPreferencia(valor) {
    try {
      window.localStorage.setItem(CHAVE_CONSENTIMENTO, valor);
    } catch (e) {}
  }

  function apagarCookiesAnaliticos() {
    var partes = document.cookie.split(";");
    for (var i = 0; i < partes.length; i++) {
      var nome = partes[i].split("=")[0].trim();
      var doGA = nome === "_ga" || nome === "_gid" || nome.indexOf("_ga_") === 0;
      var doMeta = nome === "_fbp" || nome === "_fbc";
      if (doGA || doMeta) {
        document.cookie = nome + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = nome + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + location.hostname + ";";
      }
    }
  }

  function carregarGA4() {
    if (gaCarregado) return;
    gaCarregado = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID);
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(script);
  }

  // Snippet oficial da Meta (Facebook Pixel base code), só com nomes de variável
  // deixados como a própria Meta distribui.
  function carregarMetaPixel() {
    if (metaPixelCarregado) return;
    metaPixelCarregado = true;
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

  function aplicarPreferencia(valor) {
    if (valor === "granted") {
      carregarGA4();
      carregarMetaPixel();
    } else if (valor === "denied") {
      if (gaCarregado && window.gtag) {
        window.gtag("consent", "update", { analytics_storage: "denied" });
      }
      apagarCookiesAnaliticos();
    }
  }

  window.SolutionRAOConsent = {
    // "granted", "denied" ou null (usuário ainda não decidiu)
    obterPreferencia: lerPreferencia,

    // usado pelos botões Aceitar/Recusar do banner
    definirPreferencia: function (valor) {
      salvarPreferencia(valor);
      aplicarPreferencia(valor);
    },

    // roda no carregamento de cada página: aplica a preferência já salva,
    // ou pede pra mostrar o banner se ainda não houver decisão
    inicializar: function (aoPrecisarDecisao) {
      var atual = lerPreferencia();
      if (atual === "granted" || atual === "denied") {
        aplicarPreferencia(atual);
      } else if (typeof aoPrecisarDecisao === "function") {
        aoPrecisarDecisao();
      }
    }
  };

  // Evento de conversão: clique em qualquer link do WhatsApp (wa.me). Manda pros
  // dois (GA4 e Meta) sempre que estiverem carregados — é o mesmo clique que
  // conta como "virou lead" pros dois lados, então os dois precisam do sinal
  // pra otimizar entrega/relatório de conversão.
  document.addEventListener("click", function (e) {
    var link = e.target.closest('a[href*="wa.me"]');
    if (!link) return;
    if (window.gtag) {
      window.gtag("event", "whatsapp_click", {
        event_category: "engagement",
        event_label: link.href
      });
    }
    if (window.fbq) {
      window.fbq("track", "Contact");
    }
  });
})();

/*
 * Solution RAO — consentimento de cookies (Google Consent Mode, modo Basic)
 *
 * Basic Consent Mode: o gtag.js do Google Analytics só é inserido no DOM
 * depois que o usuário aceita. Antes disso, nenhum request sai pro Google,
 * nenhum cookie analítico é criado. Compartilhado entre index.html,
 * politica-de-privacidade.html e politica-de-cookies.html — mesma lógica
 * nas 3 páginas, um arquivo só pra evitar divergência entre cópias.
 */
(function () {
  "use strict";

  var CHAVE_CONSENTIMENTO = "solutionrao_consent"; // "granted" | "denied", em localStorage — não é cookie
  var GA_ID = "G-LJGPMWB42D";
  var gaCarregado = false;

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

  function apagarCookiesGA() {
    var partes = document.cookie.split(";");
    for (var i = 0; i < partes.length; i++) {
      var nome = partes[i].split("=")[0].trim();
      if (nome === "_ga" || nome === "_gid" || nome.indexOf("_ga_") === 0) {
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

  function aplicarPreferencia(valor) {
    if (valor === "granted") {
      carregarGA4();
    } else if (valor === "denied") {
      if (gaCarregado && window.gtag) {
        window.gtag("consent", "update", { analytics_storage: "denied" });
      }
      apagarCookiesGA();
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

  // Evento de conversão: clique em qualquer link do WhatsApp (wa.me).
  // Só dispara se o gtag já foi carregado (usuário aceitou cookies) — ver
  // limitação do Consent Mode no topo deste arquivo.
  document.addEventListener("click", function (e) {
    var link = e.target.closest('a[href*="wa.me"]');
    if (link && window.gtag) {
      window.gtag("event", "whatsapp_click", {
        event_category: "engagement",
        event_label: link.href
      });
    }
  });
})();

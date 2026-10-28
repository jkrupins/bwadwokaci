/* =============================================
   ZGODA NA MAPĘ GOOGLE (pliki cookies) — BW Adwokaci

   Jak to działa:
   - Mapa (iframe z atrybutem data-consent-src) NIE ładuje się, dopóki
     użytkownik nie wyrazi zgody — do tego czasu widać zastępczy blok.
   - Baner pojawia się przy pierwszej wizycie na stronie z mapą.
   - Wybór jest zapamiętany w przeglądarce (localStorage) na 12 miesięcy,
     potem baner pojawi się ponownie.
   - Przycisk „Ustawienia cookies” w stopce (data-cookie-settings)
     pozwala zmienić lub wycofać zgodę w każdej chwili.

   Gdyby na stronie pojawiły się kolejne zewnętrzne narzędzia
   (np. Google Analytics, YouTube), trzeba je podpiąć tutaj
   i opisać w polityce prywatności.
   ============================================= */
(function () {
    'use strict';

    var KEY = 'bw-cookie-consent';
    var VERSION = 1;                               // zmień na 2, aby ponownie zapytać wszystkich o zgodę
    var MAX_AGE = 365 * 24 * 60 * 60 * 1000;      // 12 miesięcy

    // Adres polityki liczony od położenia tego skryptu - działa też na podstronach w folderze blog/
    var POLICY_URL = 'polityka-prywatnosci.html#cookies';
    try {
        if (document.currentScript && document.currentScript.src) {
            POLICY_URL = new URL('polityka-prywatnosci.html#cookies', document.currentScript.src).href;
        }
    } catch (e) { /* zostaje adres względny */ }

    var frames = document.querySelectorAll('iframe[data-consent-src]');
    var banner = null;
    var returnFocusTo = null;

    // ---------- zapis / odczyt decyzji ----------
    function readConsent() {
        try {
            var c = JSON.parse(localStorage.getItem(KEY));
            if (!c || c.v !== VERSION || typeof c.maps !== 'boolean') return null;
            if (Date.now() - c.ts > MAX_AGE) return null;
            return c;
        } catch (e) {
            return null;
        }
    }

    function saveConsent(maps) {
        var c = { v: VERSION, maps: maps, ts: Date.now() };
        try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { /* tryb prywatny itp. */ }
        return c;
    }

    var consent = readConsent();

    // ---------- mapa ----------
    function applyMaps(allowed) {
        frames.forEach(function (f) {
            var ph = document.getElementById(f.getAttribute('data-consent-placeholder'));
            if (allowed) {
                if (f.getAttribute('src') !== f.getAttribute('data-consent-src')) {
                    f.setAttribute('src', f.getAttribute('data-consent-src'));
                }
                f.hidden = false;
                if (ph) ph.hidden = true;
            } else {
                if (f.getAttribute('src')) f.setAttribute('src', 'about:blank');
                f.hidden = true;
                if (ph) ph.hidden = false;
            }
        });
    }

    // ---------- baner ----------
    function buildBanner() {
        banner = document.createElement('div');
        banner.className = 'cookie-banner';
        banner.setAttribute('role', 'region');
        banner.setAttribute('aria-labelledby', 'cookie-banner-title');
        banner.hidden = true;
        banner.innerHTML =
            '<p class="cookie-banner-title" id="cookie-banner-title">Pliki cookies i mapa Google</p>' +
            '<p class="cookie-banner-text">Strona nie używa narzędzi analitycznych ani reklamowych. ' +
            'Jedynym elementem zewnętrznym jest mapa Google — po jej wyświetleniu Google otrzyma ' +
            'Twój adres IP i może zapisać pliki cookies. Mapę pokażemy tylko za Twoją zgodą, ' +
            'którą możesz w każdej chwili wycofać w „Ustawieniach cookies” na dole strony. ' +
            'Szczegóły: <a href="' + POLICY_URL + '">Polityka prywatności</a>.</p>' +
            '<p class="cookie-banner-status" hidden></p>' +
            '<div class="cookie-banner-actions">' +
                '<button type="button" class="cookie-btn" data-consent-choice="accept">Akceptuję</button>' +
                '<button type="button" class="cookie-btn" data-consent-choice="reject">Odrzucam</button>' +
            '</div>';

        banner.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-consent-choice]');
            if (btn) decide(btn.getAttribute('data-consent-choice') === 'accept');
        });

        // Za odnośnikiem „Przejdź do treści”, żeby użytkownik klawiatury trafił na baner od razu
        var skip = document.querySelector('.skip-link');
        if (skip && skip.parentNode === document.body) {
            skip.insertAdjacentElement('afterend', banner);
        } else {
            document.body.insertBefore(banner, document.body.firstChild);
        }
    }

    function showBanner(moveFocus) {
        if (!banner) buildBanner();
        var status = banner.querySelector('.cookie-banner-status');
        if (consent) {
            status.textContent = consent.maps
                ? 'Obecnie: mapa Google jest włączona.'
                : 'Obecnie: mapa Google jest wyłączona.';
            status.hidden = false;
        } else {
            status.hidden = true;
        }
        banner.hidden = false;
        if (moveFocus) banner.querySelector('.cookie-btn').focus();
    }

    function hideBanner() {
        if (banner) banner.hidden = true;
    }

    function decide(allowed, focusMap) {
        consent = saveConsent(allowed);
        applyMaps(allowed);
        hideBanner();
        if (focusMap && frames.length) {
            frames[0].focus();
        } else if (returnFocusTo) {
            returnFocusTo.focus();
        }
        returnFocusTo = null;
    }

    // ---------- start ----------
    // Elementy, które bez JavaScriptu nie miałyby sensu, są domyślnie ukryte
    document.querySelectorAll('[data-consent-accept]').forEach(function (btn) {
        btn.hidden = false;
        btn.addEventListener('click', function () { decide(true, true); });
    });

    document.querySelectorAll('[data-cookie-settings]').forEach(function (btn) {
        btn.hidden = false;
        btn.addEventListener('click', function () {
            returnFocusTo = btn;
            showBanner(true);
        });
    });

    if (consent) {
        applyMaps(consent.maps);
    } else {
        applyMaps(false);
        if (frames.length) showBanner(false);
    }
})();

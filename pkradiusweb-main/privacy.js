(function () {
  'use strict';

  var STORAGE_KEY = 'pkradius_privacy_choice_v2';
  var ACCEPTED = 'accepted';
  var REJECTED = 'rejected';
  var MAP_LINK = 'https://yandex.ru/maps/-/CPVeFK1d';

  function getChoice() {
    try {
      var value = window.localStorage.getItem(STORAGE_KEY);
      return value === ACCEPTED || value === REJECTED ? value : null;
    } catch (error) {
      return null;
    }
  }

  function saveChoice(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch (error) {
      /* The decision remains valid for the current page if storage is disabled. */
    }
  }

  function createBanner() {
    var existing = document.getElementById('privacyBanner');
    if (existing) return existing;

    var banner = document.createElement('section');
    banner.id = 'privacyBanner';
    banner.className = 'privacy-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'false');
    banner.setAttribute('aria-labelledby', 'privacyBannerTitle');
    banner.innerHTML =
      '<div class="privacy-banner-inner">' +
        '<div class="privacy-banner-copy">' +
          '<h2 class="privacy-banner-title" id="privacyBannerTitle">Cookie-файлы</h2>' +
          '<p class="privacy-banner-text">На нашем сайте используются cookie-файлы сторонней карты. Нажимая «Принять», вы подтверждаете своё согласие на их использование в соответствии с <a href="cookies.html">Уведомлением об использовании cookie</a>, <a href="terms.html">Пользовательским соглашением</a> и <a href="policy.html">Политикой конфиденциальности</a>. При отказе карта Яндекса останется отключённой.</p>' +
        '</div>' +
        '<div class="privacy-banner-actions">' +
          '<button class="privacy-btn privacy-btn-secondary" type="button" data-privacy-reject>Отклонить</button>' +
          '<button class="privacy-btn privacy-btn-primary" type="button" data-privacy-accept>Принять</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(banner);
    return banner;
  }

  function ensureMapPlaceholder(frame) {
    var shell = frame.closest('.map-consent-shell') || frame.parentElement;
    if (!shell) return null;
    shell.classList.add('map-consent-shell');

    var placeholder = shell.querySelector('.map-consent-placeholder');
    if (placeholder) return placeholder;

    placeholder = document.createElement('div');
    placeholder.className = 'map-consent-placeholder';
    placeholder.innerHTML =
      '<h3 class="map-consent-title">Карта отключена</h3>' +
      '<p class="map-consent-text">До вашего согласия браузер не обращается к сервисам Яндекса. Можно разрешить карту здесь или открыть адрес на стороннем сайте самостоятельно.</p>' +
      '<div class="map-consent-actions">' +
        '<button class="map-consent-action" type="button" data-map-accept>Разрешить и показать</button>' +
        '<a class="map-consent-link" href="' + MAP_LINK + '" target="_blank" rel="noopener noreferrer">Открыть Яндекс Карты ↗</a>' +
      '</div>';
    shell.insertBefore(placeholder, frame);
    return placeholder;
  }

  function loadMaps() {
    document.querySelectorAll('iframe[data-consent-src]').forEach(function (frame) {
      var source = frame.getAttribute('data-consent-src');
      if (!source) return;
      var placeholder = ensureMapPlaceholder(frame);
      frame.setAttribute('src', source);
      frame.classList.add('is-loaded');
      if (placeholder) placeholder.hidden = true;
    });
  }

  function blockMaps() {
    document.querySelectorAll('iframe[data-consent-src]').forEach(function (frame) {
      var placeholder = ensureMapPlaceholder(frame);
      if (frame.hasAttribute('src')) {
        frame.setAttribute('src', 'about:blank');
        frame.removeAttribute('src');
      }
      frame.classList.remove('is-loaded');
      if (placeholder) placeholder.hidden = false;
    });
  }

  function hideBanner() {
    var banner = document.getElementById('privacyBanner');
    if (banner) banner.hidden = true;
  }

  function showBanner() {
    var banner = createBanner();
    banner.hidden = false;
    var firstButton = banner.querySelector('button');
    if (firstButton) firstButton.focus({ preventScroll: true });
  }

  function setChoice(value) {
    saveChoice(value);
    document.documentElement.setAttribute('data-privacy-choice', value);
    if (value === ACCEPTED) loadMaps();
    else blockMaps();
    hideBanner();
  }

  function bindControls() {
    document.addEventListener('click', function (event) {
      var accept = event.target.closest('[data-privacy-accept], [data-map-accept]');
      if (accept) {
        setChoice(ACCEPTED);
        return;
      }

      var reject = event.target.closest('[data-privacy-reject]');
      if (reject) {
        setChoice(REJECTED);
        return;
      }

      var settings = event.target.closest('[data-privacy-settings]');
      if (settings) showBanner();
    });
  }

  function init() {
    createBanner();
    bindControls();
    document.querySelectorAll('iframe[data-consent-src]').forEach(ensureMapPlaceholder);

    var choice = getChoice();
    if (choice === ACCEPTED) {
      document.documentElement.setAttribute('data-privacy-choice', ACCEPTED);
      loadMaps();
      hideBanner();
    } else if (choice === REJECTED) {
      document.documentElement.setAttribute('data-privacy-choice', REJECTED);
      blockMaps();
      hideBanner();
    } else {
      blockMaps();
      showBanner();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

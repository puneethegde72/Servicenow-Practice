function link(scope, element, attrs, controller) {
  var root = element[0];
  var c = controller;
  var allowNative = false;
  var observer;

  function nativeSubmit(button) {
    if (!button || !button.matches ||
        !button.matches('button, input[type="submit"], input[type="button"]')) {
      return false;
    }
    var name = (button.getAttribute('name') || '').toLowerCase();
    var id = (button.id || '').toLowerCase();
    var label = (button.value || button.textContent || '').trim().toLowerCase();
    if (c.data.nativeSubmitSelector) {
      try {
        if (button.matches(c.data.nativeSubmitSelector)) return true;
      } catch (e) { /* Ignore an invalid instance option. */ }
    }
    return name === 'submit' || name === 'order_now' ||
      id === 'submit-btn' || button.type === 'submit' ||
      label === 'submit' || label === 'order now';
  }
  function buttons() {
    var body = root.querySelector('.intake-form__body');
    return body ? Array.prototype.filter.call(
      body.querySelectorAll('button, input[type="submit"], input[type="button"]'),
      nativeSubmit
    ) : [];
  }
  function tidyCatalog() {
    buttons().forEach(function (button) {
      button.classList.add('intake-native-submit');
      button.setAttribute('tabindex', '-1');
      button.setAttribute('aria-hidden', 'true');

      // In releases that retain the two-column catalog layout,
      // remove only the action column and expand its form sibling.
      var side = button.closest('.col-md-3, .col-md-4, .col-sm-3, .col-sm-4');
      if (!side || side.querySelector('sp-model, #catalog-form')) return;
      side.classList.add('intake-native-side');
      if (!side.parentElement) return;
      Array.prototype.forEach.call(side.parentElement.children, function (sibling) {
        if (sibling !== side &&
            /\bcol-(md|sm)-(8|9|10)\b/.test(sibling.className || '')) {
          sibling.classList.add('intake-native-main');
        }
      });
    });
  }
  function guardClick(event) {
    var button = event.target.closest && event.target.closest('button, input');
    var body = root.querySelector('.intake-form__body');
    if (!body || !button || !body.contains(button) || !nativeSubmit(button)) return;
    if (allowNative) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }
  function guardSubmit(event) {
    if (allowNative || c.showingAll) return;
    event.preventDefault();
    event.stopPropagation();
  }
  root.addEventListener('click', guardClick, true);
  root.addEventListener('submit', guardSubmit, true);

  c.invokeCatalogSubmit = function () {
    tidyCatalog();
    var available = buttons().filter(function (button) { return !button.disabled; });
    if (!available.length) {
      scope.$evalAsync(function () {
        c.error = 'We could not send this form. Please try again.';
      });
      return;
    }
    allowNative = true;
    try {
      available[0].click(); // Preserves the OOB catalog submission and redirect.
    } finally {
      allowNative = false;
    }
  };

  observer = new MutationObserver(tidyCatalog);
  observer.observe(root, { childList: true, subtree: true });
  tidyCatalog();
  scope.$on('$destroy', function () {
    observer.disconnect();
    root.removeEventListener('click', guardClick, true);
    root.removeEventListener('submit', guardSubmit, true);
  });
}

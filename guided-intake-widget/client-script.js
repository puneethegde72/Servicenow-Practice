api.controller = function ($rootScope, $scope, $timeout) {
  'use strict';
  var c = this;
  var states = {};
  var unbindForm, unbindChange;

  c.pages = c.data.pages || [];
  c.index = 0;
  c.maxVisited = 0;
  c.gForm = null;
  c.formReady = false;
  c.showingAll = false;
  c.transitioning = false;
  c.error = '';

  function page() { return c.pages[c.index]; }
  function fields(p) { return p ? p.variables || [] : []; }
  function state(name) { return states[name] || {}; }
  function safely(fn, fallback) {
    try { return fn(); } catch (e) { return fallback; }
  }
  function isMandatory(f, p) {
    var s = state(f.name);
    if (s.hiddenByNavigator && p !== page() && !c.showingAll) {
      return !!s.mandatory;
    }
    return safely(function () { return !!c.gForm.isMandatory(f.name); }, !!f.mandatory);
  }
  function isVisible(f, p) {
    if (!f.name || f.marker !== 'field') return false;
    var s = state(f.name);
    if (s.hiddenByNavigator && p !== page() && !c.showingAll) {
      return s.wasVisible !== false;
    }
    return safely(function () { return !!c.gForm.isVisible(f.name); }, true);
  }
  function value(f) {
    return safely(function () { return c.gForm.getValue(f.name); }, undefined);
  }
  function empty(v) {
    if (v === null || v === undefined) return true;
    if (typeof v === 'string') return !v.trim() || v === '[]';
    if (Array.isArray(v)) return v.length === 0;
    return false;
  }
  function setVisible(name, visible) {
    safely(function () { c.gForm.setVisible(name, visible); });
  }
  function setMandatory(name, mandatory) {
    safely(function () { c.gForm.setMandatory(name, mandatory); });
  }
  function hidePage(p) {
    fields(p).forEach(function (f) {
      if (!f.name) return;
      var s = state(f.name);
      if (!s.hiddenByNavigator) {
        s.wasVisible = safely(function () { return !!c.gForm.isVisible(f.name); }, true);
        s.mandatory = f.marker === 'field' ? isMandatory(f, p) : false;
      }
      if (f.marker === 'field') setMandatory(f.name, false);
      setVisible(f.name, false);
      s.hiddenByNavigator = true;
      states[f.name] = s;
    });
  }
  function showPage(p) {
    fields(p).forEach(function (f) {
      var s = state(f.name);
      if (!f.name || !s.hiddenByNavigator) return;
      setVisible(f.name, s.wasVisible !== false);
      if (f.marker === 'field') {
        setMandatory(f.name, s.wasVisible !== false && !!s.mandatory);
      }
      s.hiddenByNavigator = false;
    });
  }
  function applyPages() {
    if (!c.formReady || !c.pages.length) return;
    c.pages.forEach(function (p, i) {
      if (c.showingAll || i === c.index) showPage(p);
      else hidePage(p);
    });
  }
  function transition() {
    c.transitioning = true;
    $timeout(applyPages, 120);
    $timeout(function () { c.transitioning = false; }, 320);
  }
  function missing(p) {
    if (!p || !c.gForm) return [{ name: '', label: 'Form' }];
    return fields(p).filter(function (f) {
      return isVisible(f, p) && isMandatory(f, p) && empty(value(f));
    });
  }
  function validate(p) {
    var absent = missing(p);
    if (!absent.length) {
      c.error = '';
      return true;
    }
    c.error = 'Complete the required fields on this page.';
    if (p === page() && absent[0].name) {
      safely(function () {
        c.gForm.showFieldMsg(absent[0].name, 'Required before continuing', 'error');
      });
    }
    return false;
  }

  c.currentPage = page;
  c.isLast = function () { return c.index === c.pages.length - 1; };
  c.pageReady = function () {
    return c.formReady && !c.transitioning && missing(page()).length === 0;
  };
  c.pageProgress = function (i) {
    if (!c.formReady || !c.pages[i]) return 0;
    var questions = fields(c.pages[i]).filter(function (f) {
      return isVisible(f, c.pages[i]);
    });
    if (!questions.length) return 0;
    var answered = questions.filter(function (f) { return !empty(value(f)); }).length;
    return Math.round(answered * 100 / questions.length);
  };
  c.isComplete = function (i) {
    return c.formReady && (i < c.maxVisited || c.showingAll) &&
      missing(c.pages[i]).length === 0;
  };
  c.progress = function () {
    if (!c.formReady || !c.pages.length) return 0;
    var complete = 0;
    c.pages.forEach(function (p, i) {
      if (c.isComplete(i)) complete++;
    });
    return Math.round(complete * 100 / c.pages.length);
  };
  c.selectPage = function (i) {
    if (!c.formReady || c.transitioning || c.showingAll ||
        i < 0 || i >= c.pages.length || i > c.maxVisited) return;
    if (i > c.index) {
      for (var j = c.index; j < i; j++) {
        if (!validate(c.pages[j])) {
          c.index = j;
          transition();
          return;
        }
      }
    }
    c.index = i;
    c.error = '';
    transition();
  };
  c.next = function () {
    if (!c.formReady || c.transitioning || c.isLast() || !validate(page())) return;
    c.maxVisited = Math.max(c.maxVisited, c.index + 1);
    c.index++;
    transition();
  };
  c.previous = function () {
    if (!c.formReady || c.transitioning || c.showingAll || c.index === 0) return;
    c.index--;
    c.error = '';
    transition();
  };
  c.reviewAll = function () {
    if (!c.formReady || c.transitioning || !c.isLast() || !validate(page())) return;
    for (var i = 0; i < c.pages.length; i++) {
      if (missing(c.pages[i]).length) {
        c.index = i;
        c.error = 'Complete the required fields on this page.';
        transition();
        return;
      }
    }
    c.showingAll = true;
    c.error = '';
    transition();
  };
  c.backToSteps = function () {
    if (c.transitioning) return;
    c.showingAll = false;
    c.error = '';
    transition();
  };
  c.submitFinal = function () {
    if (!c.formReady || c.transitioning || !c.showingAll) return;
    for (var i = 0; i < c.pages.length; i++) {
      if (missing(c.pages[i]).length) {
        c.showingAll = false;
        c.index = i;
        c.error = 'Complete the required fields on this page.';
        transition();
        return;
      }
    }
    if (typeof c.invokeCatalogSubmit === 'function') c.invokeCatalogSubmit();
    else c.error = 'The submit action is unavailable. Refresh and try again.';
  };

  unbindForm = $rootScope.$on('spModel.gForm.initialized', function (event, form) {
    if (!form || c.gForm === form) return;
    c.gForm = form;
    c.formReady = true;
    c.index = 0;
    c.maxVisited = 0;
    c.showingAll = false;
    $timeout(applyPages, 0);
  });
  unbindChange = $rootScope.$on('field.change', function () {
    $scope.$evalAsync(function () {
      if (c.error && c.pageReady()) c.error = '';
    });
  });
  $scope.$on('$destroy', function () {
    if (unbindForm) unbindForm();
    if (unbindChange) unbindChange();
  });
};

(function () {
  function option(name, fallback) {
    var value = options && options[name];
    return value === undefined || value === null || value === ''
      ? fallback : value.toString();
  }
  function integer(value, fallback) {
    var parsed = parseInt(value, 10);
    return isNaN(parsed) ? fallback : parsed;
  }
  function yes(value) {
    return value === true || value === 1 ||
      value === '1' || value === 'true';
  }
  function cleanTitle(name) {
    return (name || '').replace(/^(page_start_|container_start_)/i, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/(^|\s)\S/g, function (s) { return s.toUpperCase(); })
      .trim() || 'Details';
  }
  function variableType(label, fallback) {
    var choice = new GlideRecord('sys_choice');
    choice.addQuery('name', 'item_option_new');
    choice.addQuery('element', 'type');
    choice.addQuery('label', label);
    choice.setLimit(1);
    choice.query();
    return choice.next() ? choice.getValue('value') : fallback;
  }

  data.pages = [];
  data.error = '';
  data.catalogItemWidget = null;
  var itemId = option('catalog_item_id', $sp.getParameter('sys_id') || '');
  if (!itemId) {
    data.error = 'This form is unavailable right now.';
    return;
  }
  var item = new GlideRecord('sc_cat_item');
  if (!item.get(itemId) || !item.canRead()) {
    data.error = 'This form is unavailable right now.';
    return;
  }
  data.copy = {
    title: option('title', item.getDisplayValue('name') || 'How can we help?'),
    intro: option('intro', item.getValue('short_description') ||
      'Answer a few questions to get started.'),
    progress: option('progress_label', 'Your progress'),
    next: option('next_label', 'Continue'),
    review: option('review_label', 'Review'),
    submit: option('submit_label', 'Send request'),
    singlePage: option('single_page_title', 'Your details')
  };
  data.nativeSubmitSelector = option('native_submit_selector', '');

  var widgetId = option('catalog_widget_id', 'widget-sc-cat-item-v2');
  try {
    data.catalogItemWidget = $sp.getWidget(widgetId, {
      sys_id: itemId,
      show_field_validation_messages: false,
      display_cart_on_right: false,
      show_add_cart_button: false,
      show_add_to_wishlist_button: false
    });
  } catch (e) {
    data.error = 'This form is unavailable right now.';
    return;
  }
  if (!data.catalogItemWidget) {
    data.error = 'This form is unavailable right now.';
    return;
  }

  var startType = variableType('Container Start', '19');
  var endType = variableType('Container End', '20');
  var layoutTypes = [
    variableType('Container Split', ''), variableType('Break', ''),
    variableType('Label', ''), variableType('HTML', ''),
    variableType('Rich Text Label', ''), variableType('Container Layout', '')
  ].filter(function (type) { return !!type; });
  var setIds = [], setOrder = {}, variables = [];
  var relation = new GlideRecord('io_set_item');
  relation.addQuery('sc_cat_item', itemId);
  relation.orderBy('order');
  relation.query();
  while (relation.next()) {
    var setId = relation.getValue('variable_set');
    if (!setId) continue;
    var variableSet = new GlideRecord('item_option_new_set');
    if (!variableSet.get(setId) ||
        variableSet.getValue('type') !== 'one_to_one') continue;
    setIds.push(setId);
    setOrder[setId] = integer(relation.getValue('order'),
      integer(variableSet.getValue('order'), 0));
  }
  var variable = new GlideRecord('item_option_new');
  var itemQuery = variable.addQuery('cat_item', itemId);
  if (setIds.length) {
    itemQuery.addOrCondition('variable_set', 'IN', setIds.join(','));
  }
  variable.addQuery('active', true);
  variable.orderBy('order');
  variable.query();
  while (variable.next()) {
    var name = variable.getValue('name');
    var setId = variable.getValue('variable_set');
    var order = integer(variable.getValue('order'), 0);
    variables.push({
      name: name,
      label: variable.getValue('question_text') || cleanTitle(name),
      type: variable.getValue('type'),
      answerable: layoutTypes.indexOf(variable.getValue('type')) === -1,
      order: order,
      sequence: setId && setOrder[setId] !== undefined
        ? setOrder[setId] * 100000 + order : order,
      mandatory: yes(variable.getValue('mandatory'))
    });
  }
  variables.sort(function (a, b) {
    return a.sequence - b.sequence || a.order - b.order;
  });

  var hasMarkers = variables.some(function (v) {
    return v.type === startType || v.type === endType;
  });
  if (!hasMarkers) {
    data.pages = [{
      key: 'details',
      title: data.copy.singlePage,
      variables: variables.map(function (v) {
        return { name: v.name, label: v.label,
          marker: v.answerable ? 'field' : 'layout', mandatory: v.mandatory };
      })
    }];
    return;
  }

  var current = null, seen = {}, invalid = false;
  variables.forEach(function (v) {
    if (invalid) return;
    if (v.type === startType) {
      var key = (v.name || '').toLowerCase();
      if (current || !key || seen[key]) {
        invalid = true;
        return;
      }
      seen[key] = true;
      current = { key: key, title: v.label ||
        cleanTitle(v.name), variables: [
          { name: v.name, marker: 'start', mandatory: false }
        ] };
      return;
    }
    if (!current) {
      invalid = true; // Never omit a field outside a container pair.
      return;
    }
    current.variables.push({
      name: v.name,
      label: v.label,
      marker: v.type === endType ? 'end' :
        (v.answerable ? 'field' : 'layout'),
      mandatory: v.mandatory
    });
    if (v.type === endType) {
      data.pages.push(current);
      current = null;
    }
  });
  if (invalid || current || !data.pages.length) {
    data.pages = [];
    data.catalogItemWidget = null;
    data.error = 'This form is unavailable right now.';
  }
})();

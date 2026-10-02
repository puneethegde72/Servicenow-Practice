# Guided intake Service Portal widget

A reusable, theme-aware wrapper around the ServiceNow **SC Catalog Item** widget. Copy each file to the matching field of a new Service Portal widget: `template.html` to HTML Template, `client-script.js` to Client Script, `server-script.js` to Server Script, `link-function.js` to Link Function, `styles.scss` to CSS/SCSS, and `option-schema.json` to Option schema.

## Configure

1. Place the widget on a Service Portal page with a catalog item `sys_id` URL parameter, or set the `catalog_item_id` instance option.
2. For several pages, surround each page's active variables with a unique Container Start and Container End pair. Give each Container Start useful question text; it becomes the page title. Keep all active variables within a pair. An item without containers uses one page.
3. Set the text instance options if you want a different heading, description or button labels. The default heading and description come from the item name and short description.
4. If your embedded catalog widget has different submit markup, set `native_submit_selector` to its native submit button's CSS selector and test it in your instance. The default embedded widget ID is `widget-sc-cat-item-v2`.
5. For guest use, configure the page, wrapper widget, embedded catalog widget and item availability for the intended audience. Public widget settings alone do not grant catalog or table access.

The overall bar advances by completed pages (one of four is 25%). Each page number stays numeric, with a ring showing answered questions on that page. Continue/Review appears only when the current page's visible mandatory fields are filled. The sole visible send action appears on the final review view. Native submission remains responsible for catalog validation, submission and redirect.

Supports regular catalog variables and one-to-one variable sets. Multi-row variable sets, unusual custom variable widgets, conditional UI policies and release-specific native action markup require validation in a subproduction portal. This is widget source, not an update set or an instance export.

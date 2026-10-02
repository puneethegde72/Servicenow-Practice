# Training catalogue Service Portal widget

A course catalogue with a left-hand category tree, search, dynamic filters, sorting, 10/20/50 pagination, course links, CPD presentation, images and a details modal. On smaller screens the category browser moves above the results.

## Widget Editor mapping

| ServiceNow field | File |
|---|---|
| HTML Template | `template.html` |
| Client controller | `client-controller.js` |
| Server script | `server-script.js` |
| CSS | `styles.css` |
| Option schema | `option-schema.json` |

Create a new custom widget and copy the five files into the matching fields. No decoding or assembly is required.

## Data model

The default tables are `u_training` and `u_training_category`. Change their widget options to your own table names and adapt the `TF` and `CF` field maps in the server script if needed.

Training fields include `u_active`, `u_training_name`, `u_short_description`, `u_description`, `u_category`, `u_delivery_type`, `u_course_model`, `u_level`, `u_cpd`, `u_average_rating`, `u_feedback_count`, `u_display_order`, `u_course_url` and `u_course_image`.

Category fields include `u_active`, `u_title`, `u_parent`, `u_icon`, `u_display_order` and `u_theme_colour`.

At minimum, training needs the active, name and category fields, and categories need title and parent. Configure reference relationships and read ACLs in your instance. The server uses `GlideRecordSecure`; it does not grant table access.

## Configure and validate

- Set dynamic filter fields to your own training choices. The server includes level and CPD filters when those fields exist.
- Set image sources to attachments or image records as appropriate.
- Leave brand options empty to inherit styling, or configure colours in the widget options.
- Check category nesting, empty results, search, sorting, page navigation, keyboard behaviour and the details modal with synthetic data.
- Validate allowed and denied users and attachment access.

The catalogue loads a bounded set of records and filters that set in the browser. Its default maximum is 500 active courses; increase limits only after checking performance, or implement server-side pagination for a larger catalogue.

Rich descriptions use HTML sanitisation and client-side trusted HTML rendering. Review that handling against your content trust model and use a platform-approved allowlist sanitizer before accepting untrusted rich content. Configure course and image URLs from trusted sources.

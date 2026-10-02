#!/usr/bin/env python3
"""Extract source-oriented files from ServiceNow sys_update_xml payloads."""
from __future__ import annotations

import argparse
import html
import re
from pathlib import Path
import xml.etree.ElementTree as ET

TYPE_DIR = {
    "sys_script": "business-rules",
    "sys_script_client": "client-scripts",
    "sys_script_include": "script-includes",
    "sys_ui_action": "ui-actions",
    "sys_ui_page": "ui-pages",
    "sp_widget": "service-portal/widgets",
    "sysevent_email_action": "notifications",
    "sys_security_acl": "acls",
    "sc_cat_item_producer": "record-producers",
    "item_option_new": "catalog-variables",
    "sys_dictionary": "dictionary",
    "sys_properties": "properties",
    "sys_report": "reports",
}

FIELD_FILES = {
    "script": "script.js",
    "client_script": "client-script.js",
    "processing_script": "processing-script.js",
    "template": "template.html",
    "html": "html.html",
    "css": "style.css",
    "link": "link.js",
    "option_schema": "option-schema.json",
    "condition": "condition.txt",
    "advanced_condition": "advanced-condition.js",
    "message_html": "message.html",
    "message_text": "message.txt",
}


def slug(value):
    value = html.unescape((value or "").strip()).lower()
    value = re.sub(r"[^a-z0-9._-]+", "-", value).strip("-.")
    return value[:100] or "unnamed"


def text(element, field):
    child = element.find(field)
    return (child.text or "") if child is not None else ""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("xml", type=Path)
    parser.add_argument("--out", type=Path, default=Path("extracted-update-set"))
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    root = ET.parse(args.xml).getroot()
    updates = root.findall("sys_update_xml")
    if not updates:
        raise SystemExit(
            "No <sys_update_xml> records found. Export or retrieve the complete ServiceNow update set first."
        )

    count = 0
    for update in updates:
        payload = text(update, "payload")
        if not payload.strip():
            continue

        try:
            payload_root = ET.fromstring(payload)
        except ET.ParseError:
            try:
                payload_root = ET.fromstring(html.unescape(payload))
            except ET.ParseError:
                continue

        record = next((child for child in list(payload_root) if isinstance(child.tag, str)), None)
        if record is None:
            continue

        table = record.tag
        name = (
            text(record, "name")
            or text(record, "title")
            or text(record, "sys_name")
            or text(update, "name")
        )
        sys_id = text(record, "sys_id") or text(update, "target_name") or str(count)

        base = (
            args.out
            / TYPE_DIR.get(table, f"other/{table}")
            / f"{slug(name)}--{slug(sys_id)}"
        )
        base.mkdir(parents=True, exist_ok=True)

        (base / "record.xml").write_text(
            ET.tostring(record, encoding="unicode"), encoding="utf-8"
        )

        for field, filename in FIELD_FILES.items():
            value = text(record, field)
            if value.strip():
                (base / filename).write_text(value, encoding="utf-8")

        count += 1

    print(f"Extracted {count} payload records from {len(updates)} sys_update_xml rows")


if __name__ == "__main__":
    main()

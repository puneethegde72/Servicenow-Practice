#!/usr/bin/env python3
"""Convert a ServiceNow XML containing sys_update_set records into CSV/JSON inventory."""
from __future__ import annotations

import argparse
import csv
import html
import json
from pathlib import Path
import xml.etree.ElementTree as ET

FIELDS = [
    "application", "base_update_set", "batch_install_plan", "completed_by", "completed_on",
    "description", "install_date", "installed_from", "is_default", "merged_to", "name",
    "origin_sys_id", "parent", "release_date", "remote_sys_id", "state", "sys_created_by",
    "sys_created_on", "sys_id", "sys_mod_count", "sys_updated_by", "sys_updated_on"
]


def clean(value):
    value = (value or "").strip()
    for _ in range(5):
        decoded = html.unescape(value)
        if decoded == value:
            break
        value = decoded
    return value


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("xml", type=Path)
    parser.add_argument("--out", type=Path, default=Path("update-set-inventory"))
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    root = ET.parse(args.xml).getroot()
    update_sets = root.findall("sys_update_set")
    update_xml = root.findall("sys_update_xml")

    rows = []
    for record in update_sets:
        row = {}
        for field in FIELDS:
            element = record.find(field)
            row[field] = clean(element.text if element is not None else "")
            if element is not None and "display_value" in element.attrib:
                row[field + "_display"] = clean(element.attrib.get("display_value"))
        rows.append(row)

    (args.out / "update_sets.json").write_text(
        json.dumps(rows, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    keys = sorted({key for row in rows for key in row})
    with (args.out / "update_sets.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=keys)
        writer.writeheader()
        writer.writerows(rows)

    print(f"sys_update_set records: {len(update_sets)}")
    print(f"sys_update_xml records: {len(update_xml)}")
    if not update_xml:
        print("No sys_update_xml payloads found. This file provides update-set metadata only.")


if __name__ == "__main__":
    main()

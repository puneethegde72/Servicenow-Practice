# Local update-set utilities

These utilities inspect XML exports locally. They do not publish or anonymise their output.

```bash
python3 tools/update-sets/parse_update_set_export.py private/sample.xml --out private/inventory
python3 tools/update-sets/extract_update_xml_payloads.py private/sample.xml --out private/extracted
```

`parse_update_set_export.py` creates a CSV/JSON inventory of `sys_update_set` records. An export containing metadata only cannot recover scripts.

`extract_update_xml_payloads.py` reads `sys_update_xml` payloads and writes record XML plus source fields organised by record type. It requires the complete exported payloads.

Use trusted local exports. Inspect the results before reusing code: output can include names, record IDs, addresses, credentials and operational configuration. The `private/` directory is ignored by Git, and generated inventories/exports must remain outside this public repository.

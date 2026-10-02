#!/usr/bin/env python3
"""Check example source for common accidental disclosures."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
PATTERNS = {
    'record identifier': re.compile(r'\b[0-9a-fA-F]{32}\b'),
    'ticket number': re.compile(r'\b(?:INC|CHG|KB|SF)\d{6,}\b', re.I),
    'email address': re.compile(r'[\w.+%-]+@[\w.-]+\.[A-Za-z]{2,}'),
    'access token': re.compile(r'\bgh[pousr]_[A-Za-z0-9]{20,}\b'),
}
SKIP = {'.git', '__pycache__', 'node_modules', '.venv'}
PRIVATE_SUFFIXES = {'.har', '.log', '.zip', '.xml', '.b64', '.hex', '.pem', '.key'}


def inspect_text(text):
    return [(text.count('\n', 0, m.start()) + 1, category)
            for category, pattern in PATTERNS.items() for m in pattern.finditer(text)]


def main():
    findings = []
    count = 0
    for path in sorted(ROOT.rglob('*')):
        relative = path.relative_to(ROOT)
        if not path.is_file() or any(part in SKIP for part in relative.parts):
            continue
        count += 1
        if path.suffix.lower() in PRIVATE_SUFFIXES or path.name == '.env' or (
            path.name.startswith('.env.') and path.name != '.env.example'
        ):
            findings.append((str(relative), 1, 'private/export file type'))
            continue
        try:
            text = path.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            findings.append((str(relative), 1, 'binary file needs manual review'))
            continue
        for line, category in inspect_text(text):
            findings.append((str(relative), line, category))
        for _, category in inspect_text(str(relative)):
            findings.append((str(relative), 1, 'path: ' + category))
    for path, line, category in findings:
        print(f'{path}:{line}: {category}')
    print(f'Checked {count} files; {len(findings)} findings. Manual review is still required.')
    return 1 if findings else 0


if __name__ == '__main__':
    sys.exit(main())

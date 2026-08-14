#!/usr/bin/env python3
"""Import data/lpaezsis_backup_final.sql into data/lpaezsis.sqlite for local preview."""
from __future__ import annotations

import re
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SQL_PATH = ROOT / "data" / "lpaezsis_backup_final.sql"
DB_PATH = ROOT / "data" / "lpaezsis.sqlite"
TABLES = ("brands", "categories", "products", "site_settings", "admin_credentials")


def extract_create(raw: str, name: str) -> list[tuple[str, str]]:
    m = re.search(rf"CREATE TABLE `{name}` \((.*?)\) ENGINE=", raw, re.S)
    if not m:
        raise SystemExit(f"CREATE TABLE `{name}` not found")
    cols: list[tuple[str, str]] = []
    for line in m.group(1).split("\n"):
        line = line.strip().rstrip(",")
        if not line or line.startswith(
            ("PRIMARY", "UNIQUE", "KEY", "CONSTRAINT", "CHECK")
        ):
            continue
        cm = re.match(r"`(\w+)`\s+(\w+)", line)
        if not cm:
            continue
        col, typ = cm.group(1), cm.group(2).upper()
        st = (
            "INTEGER"
            if typ in {"INT", "TINYINT", "SMALLINT", "BIGINT", "INTEGER"}
            else "TEXT"
        )
        cols.append((col, st))
    return cols


def extract_insert_blob(raw: str, table: str) -> str:
    """Return VALUES blob; stop at ';' only outside quoted strings."""
    key = f"INSERT INTO `{table}` VALUES"
    start = raw.find(key)
    if start < 0:
        return ""
    i = start + len(key)
    while i < len(raw) and raw[i] in " \n\r\t":
        i += 1
    in_str = False
    esc = False
    j = i
    while j < len(raw):
        ch = raw[j]
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == "'":
                if j + 1 < len(raw) and raw[j + 1] == "'":
                    j += 2
                    continue
                in_str = False
        else:
            if ch == "'":
                in_str = True
            elif ch == ";":
                break
        j += 1
    return raw[i:j].strip()


def parse_values(blob: str) -> list[list[object]]:
    rows: list[list[object]] = []
    i, n = 0, len(blob)
    while i < n:
        while i < n and blob[i] in " \n\r\t,":
            i += 1
        if i >= n:
            break
        if blob[i] != "(":
            raise SystemExit(f"expected '(' in INSERT parse near: {blob[i : i + 40]!r}")
        i += 1
        fields: list[object] = []
        while True:
            while i < n and blob[i] in " \n\r\t":
                i += 1
            if i >= n:
                raise SystemExit("unterminated row")
            if blob[i] == ")":
                i += 1
                break
            if blob[i] == "'":
                i += 1
                buf: list[str] = []
                while i < n:
                    ch = blob[i]
                    if ch == "\\" and i + 1 < n:
                        nxt = blob[i + 1]
                        mapping = {
                            "n": "\n",
                            "r": "\r",
                            "t": "\t",
                            '"': '"',
                            "'": "'",
                            "\\": "\\",
                        }
                        buf.append(mapping.get(nxt, nxt))
                        i += 2
                        continue
                    if ch == "'" and i + 1 < n and blob[i + 1] == "'":
                        buf.append("'")
                        i += 2
                        continue
                    if ch == "'":
                        i += 1
                        break
                    buf.append(ch)
                    i += 1
                fields.append("".join(buf))
            elif blob[i : i + 4].upper() == "NULL" and (
                i + 4 >= n or blob[i + 4] in ",) \n\r\t"
            ):
                fields.append(None)
                i += 4
            else:
                j = i
                while j < n and blob[j] not in ",)":
                    j += 1
                token = blob[i:j].strip()
                if re.fullmatch(r"-?\d+", token):
                    fields.append(int(token))
                else:
                    try:
                        fields.append(float(token))
                    except ValueError:
                        fields.append(token)
                i = j
            while i < n and blob[i] in " \n\r\t":
                i += 1
            if i < n and blob[i] == ",":
                i += 1
                continue
            if i < n and blob[i] == ")":
                i += 1
                break
        rows.append(fields)
    return rows


def main() -> int:
    if not SQL_PATH.is_file():
        print("Missing", SQL_PATH, file=sys.stderr)
        return 1
    raw = SQL_PATH.read_text(encoding="utf-8", errors="replace")
    if DB_PATH.exists():
        DB_PATH.unlink()
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    for table in TABLES:
        cols = extract_create(raw, table)
        coldefs = ", ".join(f'"{c}" {t}' for c, t in cols)
        cur.execute(f'CREATE TABLE "{table}" ({coldefs})')
        blob = extract_insert_blob(raw, table)
        rows = parse_values(blob) if blob else []
        if not rows:
            print(table, "0 rows")
            continue
        names = [c for c, _ in cols]
        placeholders = ",".join("?" for _ in names)
        colnames = ",".join(f'"{c}"' for c in names)
        fixed = []
        for r in rows:
            r = list(r)
            if len(r) < len(names):
                r = r + [None] * (len(names) - len(r))
            fixed.append(r[: len(names)])
        cur.executemany(
            f'INSERT INTO "{table}" ({colnames}) VALUES ({placeholders})', fixed
        )
        print(table, len(fixed), "rows")

    # Keep classic nav order: Sonic…HAIDA first; Columbia after.
    cur.execute(
        "UPDATE brands SET sort_order = 70 WHERE slug = 'columbia-okura' AND COALESCE(sort_order, 0) = 0"
    )
    cur.execute(
        'UPDATE brands SET is_active = 1 WHERE is_active IS NULL OR is_active = ""'
    )
    conn.commit()
    conn.close()
    print("Wrote", DB_PATH)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

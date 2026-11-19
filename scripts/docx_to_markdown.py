#!/usr/bin/env python3
"""Convert a Word document to Markdown, preserving headings, lists, and tables."""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from typing import Iterator

from docx import Document
from docx.document import Document as DocumentObject
from docx.oxml.ns import qn
from docx.table import Table, _Cell
from docx.text.paragraph import Paragraph
from docx.text.run import Run


# Change this path to select a different document when running without arguments.
INPUT_DOCX = (
    Path(__file__).resolve().parent.parent
    / "docs"
    / "Order Pipeline with Audit Trail - Revised-v2.docx"
)


def escape_markdown(text: str) -> str:
    text = text.replace("\\", "\\\\")
    return re.sub(r"([`*_{}\[\]<>#+.!|~-])", r"\\\1", text)


def render_run(run: Run) -> str:
    text = escape_markdown(run.text)
    if not text:
        return text
    if run.font.strike:
        text = f"~~{text}~~"
    if run.underline:
        text = f"<u>{text}</u>"
    if run.italic:
        text = f"*{text}*"
    if run.bold:
        text = f"**{text}**"
    return text


def render_paragraph(paragraph: Paragraph) -> str:
    parts: list[str] = []
    for child in paragraph._p.iterchildren():
        if child.tag == qn("w:r"):
            parts.append(render_run(Run(child, paragraph)))
        elif child.tag == qn("w:hyperlink"):
            text = escape_markdown("".join(
                node.text or "" for node in child.iter(qn("w:t"))
            ))
            relationship_id = child.get(qn("r:id"))
            if relationship_id and relationship_id in paragraph.part.rels:
                target = paragraph.part.rels[relationship_id].target_ref
                parts.append(f"[{text}]({target})")
            else:
                parts.append(text)

    text = "".join(parts).strip()
    if not text:
        return ""

    style_name = paragraph.style.name if paragraph.style else ""
    heading_match = re.fullmatch(r"Heading ([1-6])", style_name, re.IGNORECASE)
    if heading_match:
        return f"{'#' * int(heading_match.group(1))} {text}"
    if style_name.lower() == "title":
        return f"# {text}"
    if style_name.lower() == "subtitle":
        return f"*{text}*"

    list_match = re.match(r"List (Bullet|Number)(?:\s+(\d+))?", style_name, re.IGNORECASE)
    if list_match:
        kind, level_text = list_match.groups()
        indent = "  " * max(0, int(level_text or "1") - 1)
        marker = "-" if kind.lower() == "bullet" else "1."
        return f"{indent}{marker} {text}"
    return text


def iter_block_items(parent: DocumentObject | _Cell) -> Iterator[Paragraph | Table]:
    if isinstance(parent, DocumentObject):
        parent_element = parent.element.body
    else:
        parent_element = parent._tc

    for child in parent_element.iterchildren():
        if child.tag == qn("w:p"):
            yield Paragraph(child, parent)
        elif child.tag == qn("w:tbl"):
            yield Table(child, parent)


def render_table(table: Table) -> str:
    rows = [
        [cell_text(cell) for cell in row.cells]
        for row in table.rows
    ]
    if not rows:
        return ""

    column_count = max(map(len, rows))
    rows = [row + [""] * (column_count - len(row)) for row in rows]
    lines = [
        "| " + " | ".join(rows[0]) + " |",
        "| " + " | ".join("---" for _ in range(column_count)) + " |",
    ]
    lines.extend("| " + " | ".join(row) + " |" for row in rows[1:])
    return "\n".join(lines)


def cell_text(cell: _Cell) -> str:
    paragraphs = [render_paragraph(paragraph) for paragraph in cell.paragraphs]
    return "<br>".join(part for part in paragraphs if part)


def convert_document(input_path: Path, output_path: Path) -> None:
    document = Document(input_path)
    blocks: list[str] = []
    list_items: list[str] = []

    def flush_list() -> None:
        if list_items:
            blocks.append("\n".join(list_items))
            list_items.clear()

    for block in iter_block_items(document):
        if isinstance(block, Paragraph):
            rendered = render_paragraph(block)
            if not rendered:
                continue
            if rendered.startswith(("- ", "1. ", "  - ", "  1. ")):
                list_items.append(rendered)
            else:
                flush_list()
                blocks.append(rendered)
        else:
            flush_list()
            rendered_table = render_table(block)
            if rendered_table:
                blocks.append(rendered_table)

    flush_list()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n\n".join(blocks).rstrip() + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "input_path",
        nargs="?",
        type=Path,
        help="path to a DOCX file (defaults to INPUT_DOCX in this script)",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        help="Markdown output path (defaults to the input path with a .md extension)",
    )
    args = parser.parse_args()

    if args.input_path is None:
        args.input_path = INPUT_DOCX
    if not args.input_path.is_file():
        parser.error(f"input file does not exist: {args.input_path}")

    if args.output is None:
        args.output = args.input_path.with_suffix(".md")
    return args


def main() -> int:
    args = parse_args()
    convert_document(args.input_path, args.output)
    print(f"Converted {args.input_path} -> {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

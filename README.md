# ORDER_PIPELINE_WITH_AUDIT_TRIAL
A Web-based Online Book store processing system

## Development environments

The React frontend, IntelliJ-ready Java Spring Boot backend, and MySQL database
setup are in [stacks/](./stacks/). Start-up instructions are in
[stacks/README.md](./stacks/README.md).
For the full local run-through, API examples, and database configuration, see
[docs/Backend End-to-End Walkthrough.md](<./docs/Backend End-to-End Walkthrough.md>).

## Convert a Word document to Markdown

Install the converter dependency and run the script from the repository root:

```powershell
python -m pip install -r requirements.txt
python scripts\docx_to_markdown.py
```

By default, the script converts the document specified by `INPUT_DOCX` near the
top of `scripts/docx_to_markdown.py`. Change that value to select another
document. The output defaults to a Markdown file beside the input. You can also
override the input and output paths on the command line:

```powershell
python scripts\docx_to_markdown.py "docs\document.docx" --output "docs\document.md"
```

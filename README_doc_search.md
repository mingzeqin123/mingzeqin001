# Local Document Index and Search

This tool builds an index from local documents and supports keyword search with
highlighted snippets.

## Build an index

```bash
python3 doc_search.py build --source docs --index doc_index.json
```

You can pass multiple `--source` entries and customize extensions:

```bash
python3 doc_search.py build --source docs --source notes --index doc_index.json --ext md --ext txt
```

## Search with highlights

```bash
python3 doc_search.py search --index doc_index.json --query "watermark"
```

Optional flags:

- `--mode all|any` (default: `all`)
- `--phrase` to treat the query as a substring
- `--context 80` to adjust snippet size
- `--highlight-start "<mark>" --highlight-end "</mark>"`
- `--json` for JSON output

## Example

```bash
python3 doc_search.py build --source docs --index doc_index.json
python3 doc_search.py search --index doc_index.json --query "watermark" --phrase
```

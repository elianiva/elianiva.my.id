# Notes

## GitHub Token Requirements

This project requires a `GH_TOKEN` environment variable (fine-grained personal access token) with the following repository permissions:

- **Pull requests** (`pull_requests:read`) - Read access to pull requests
- **Metadata** (`metadata:read`) - Repository metadata access
- **Contents** (`contents:read`) - Read repository contents

Used in:
- `src/content/loaders/github.ts` - Fetching merged pull requests via GraphQL API
- `src/content/loaders/notes.ts` - Fetching notes index and content via GitHub Contents API

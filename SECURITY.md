# Security notes

## CodeQL setup-state triage (2026-10-29)

`scripts/create-agent.mjs` intentionally persists the agent ID and client key
returned by the configured D-ID API in the fixed, gitignored
`.seance-agent.json` file. The response cannot choose the destination path and
is serialized as JSON rather than executed. The `js/http-to-file-access` alert
records this deliberate operator-run setup behavior. It is not arbitrary-path
file writing. The script sends provider credentials and creates provider
resources, so it must only be run as an explicitly authorized setup operation.
The security verification did not execute it or call a provider.

# Node upgrade review

Reviewed locally on 2026-10-26, based on `origin/main` at `edf2f46`.
The newer upstream Next.js security release and Zod override are preserved.

## Runtime and compiler

- Local Node: 26.12.1. Hosting compatibility: Node 24.22.1.
- CI runs the configured lint, typecheck and build on both versions.
- Google GenAI SDK: 2.28.0 to 2.31.0. Node typings: 24 to 26.6.5.
- TypeScript 7.0.2 runs through the explicit `typescript7` alias in
  `npm run typecheck`. TypeScript 6.0.3 supplies the JavaScript compiler API
  required by typescript-eslint, whose installed peer range is below 6.1.
  TypeScript 7 does not expose `createProgram`; TypeScript 6 does.
- Next.js also checks the build with its resolved TypeScript package. No type
  errors are suppressed. No script depends on which package owns `.bin/tsc`.
- ESLint 9.39.5 is retained because the installed React lint plugin supports
  ESLint through version 9. `npm outdated` reports only this compatibility hold
  and the TypeScript 6 API package; the TypeScript 7 alias is current.

## Verification

- Node 26.12.1: clean `npm ci`, lint, explicit TypeScript 7 check and production
  build pass. Node 24.22.1: lint, explicit TypeScript 7 check and production
  build pass. Both versions also pass the explicit TypeScript 6 compatibility
  check before build in CI.
- `npm audit` and `npm audit --omit=dev`: zero reported vulnerabilities.
- Local production browser checks pass with external requests blocked:
  homepage hydration, fake camera/microphone capture reaching the missing
  credentials error, denied-camera error, credentials API 503 and optional
  vision API 501. No browser page errors occurred.
- There is no configured unit test suite. No application source change was
  necessary: the previously reported lint failures are absent after upstream
  reconciliation.

## Release boundary and gains

The checked production build is ready for review. No push, deployment, tag,
provider setup, or real account call was made. GitHub Actions contains only CI
on main pushes and pull requests, and GitHub reports no deployment history.
The repository has no local Vercel project link. A separately configured Git
integration could create previews or production deployments after a future
push; its connection has not been confirmed.

[Vercel currently lists Node 24 and 22](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions),
so removing Node 24 support would block the documented hosting path.
Live D-ID/ElevenLabs conversation and Gemini vision success paths still require
configured accounts and separate authorized validation.

The demonstrated gains are compatibility coverage, a current standalone
TypeScript checker and a smaller maintenance gap. No before/after performance
benchmark was run, so no application speedup is claimed. This work preserves
upstream's existing zero-vulnerability dependency state.

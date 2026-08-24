# RPG - Game Master Console

An abandoned, local-first RPG Game Master console for managing characters,
enemies, inventory, shops, currencies, statuses, battles, gacha pulls, and an
event log. It is built with Next.js, React, TypeScript, and SQLite.

## Status

This project **can be deployed and run**, but it is **abandoned**, contains
known bugs and incomplete functionality, and is **not production-ready at all**.
Use it for experimentation, local demos, or reference only. Do not rely on it
for production data or live services without substantial maintenance and
testing.

## Development

Requirements: Node.js and pnpm.

```bash
pnpm install
pnpm dev
```

Then open `http://localhost:3000`.

## Deployment

The app can be built and started as a standard Next.js application:

```bash
pnpm install
pnpm build
pnpm start
```

The application uses a local SQLite database. Make sure the deployment
environment provides persistent storage for the database files; ephemeral
hosting may lose data between restarts or deployments.

## Disclaimer

No ongoing maintenance or support is provided. Bugs, missing features,
incomplete safeguards, data-loss risks, and deployment-specific issues should
be expected.

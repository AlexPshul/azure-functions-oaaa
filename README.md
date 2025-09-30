# Azure Functions OAAA – Local Development

This repo contains two Azure Functions apps managed with Nx: `management` and `finance`. Each of them has their own agents that will do AI work.
Follow the steps below to set up your environment, configure the AI Foundry endpoint, and run both apps locally in parallel.

## 1) Install required software

- Node.js (LTS recommended, v20+)

  - Download: https://nodejs.org/en/download

- Azure Functions Core Tools v4
  - Install guide: https://learn.microsoft.com/azure/azure-functions/functions-run-local

Notes:

- After installing Core Tools, restart your terminal so the `func` command is available.
- This workspace uses Nx; you can invoke it via `npx nx` without a global install. It also uses the `@nxazure/func` plugin, which makes it easy to run multiple Azure Functions apps from a single Nx monorepo.

## 2) Install dependencies

From the repository root, install Node dependencies:

```pwsh
npm install
```

## 3) Create a .env file with your AI Foundry endpoint

Create a `.env` file at the repository root (next to `package.json`) and set the following variable to your Azure AI Foundry project endpoint URL:

```
AZURE_AI_FOUNDRY_PROJECT_ENDPOINT=<your-ai-foundry-project-endpoint>
```

Tip: Do not commit secrets. The `.env` file is intended for local development only.

## 4) Run both Azure Functions together

Use Nx to start both apps in parallel:

```pwsh
npx nx run-many --target=start --parallel=2
```

By default, the apps are configured to listen on:

- `management` → http://localhost:7071
- `finance` → http://localhost:7072

If you want to start a single app, you can run:

```pwsh
npx nx start management
# or
npx nx start finance
```

## 5) Try the sample HTTP scenarios

There are three `.http` files at the repo root you can run to see different scenarios:

- `approved.http`
- `reasonable.http`
- `ridiculous.http`

Recommended: install the "REST Client" VS Code extension to execute requests directly from these files. Alternatively, send the same requests via tools like Postman or curl.

### Troubleshooting

- "func not found" or Azure Functions Core Tools missing: ensure Core Tools v4 is installed (see link above) and restart the terminal.
- Port already in use: Probably the app is running or another process is using the same port. A simple restart to end hung processes could help.
- Environment variables not loading: confirm your `.env` file is at the repo root and the variable name is spelled exactly as `AZURE_AI_FOUNDRY_PROJECT_ENDPOINT`.

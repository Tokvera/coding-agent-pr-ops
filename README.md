# coding-agent-pr-ops

[Quick start](#quick-start) · [Launch assets](./LAUNCH_ASSETS.md) · [Content distribution](./CONTENT_DISTRIBUTION.md) · [Contributing](./CONTRIBUTING.md) · [License](./LICENSE)

A realistic coding-agent starter that turns a GitHub-style task into a patch plan, review checklist, and PR summary while tracing the full workflow with Tokvera.

## Why this repo matters

Most coding-agent demos stop at "generate code." Real engineering teams need more:

- task diagnosis
- repository-context inspection
- implementation planning
- risk framing
- PR summary generation
- one root trace that explains the whole handoff

This repo is built to be useful as:

- a reference project for coding-agent operations
- a Tokvera tracing example for multi-step engineering workflows
- a traffic-friendly repo for blog posts, videos, and comparisons
- a practical demo for teams evaluating coding-agent observability

## What it does

For each incoming task, the app:

1. classifies the work type and rollout risk
2. inspects basic repository context
3. drafts a concrete implementation plan
4. generates a PR title and summary
5. returns a review checklist
6. emits Tokvera trace data for the full workflow

## Stack

- Node.js
- Express
- OpenAI
- Tokvera JavaScript SDK
- Zod

## Why Tokvera is useful here

Coding agents are not just model calls. Teams need to inspect:

- the root engineering workflow trace
- task diagnosis and risk framing
- repo-context lookups
- plan generation
- PR summary generation
- mock vs live provider execution

That makes Tokvera useful for debugging coding-agent handoffs, not just counting tokens.

## Endpoints

- `GET /health`
- `GET /api/demo-task`
- `GET /api/sample-tasks`
- `POST /api/pr-plan`

## Quick start

```bash
npm install
copy .env.example .env
npm run dev
```

The server starts on `http://localhost:3300` by default.

## Environment

Mock mode is enabled by default, so you can run the project without provider credentials.

To use a live provider:

- set `MOCK_MODE=false`
- provide `OPENAI_API_KEY`
- provide `TOKVERA_API_KEY`

Main environment variables:

- `PORT`
- `MOCK_MODE`
- `TOKVERA_API_KEY`
- `TOKVERA_INGEST_URL`
- `TOKVERA_TENANT_ID`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

## Example request

```bash
curl -X POST http://localhost:3300/api/pr-plan \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix duplicate webhook retries when the upstream API returns 429",
    "body": "When the upstream billing API returns 429, our retry worker creates duplicate webhook attempts instead of backing off cleanly.",
    "repoName": "acme/ops-agent",
    "branchName": "main",
    "labels": ["bug", "webhooks", "billing"],
    "filesHint": ["src/workers/webhook-dispatch.ts", "src/lib/backoff.ts"]
  }'
```

## Example response shape

```json
{
  "traceId": "trc_123",
  "runId": "run_123",
  "task": {
    "title": "Fix duplicate webhook retries when the upstream API returns 429",
    "repoName": "acme/ops-agent"
  },
  "diagnosis": {
    "workType": "bugfix",
    "risk": "high",
    "owner": "backend",
    "repoArea": "request handling and retries",
    "shortReason": "error or retry language detected",
    "shouldRequestReplay": true
  },
  "summary": "This looks like a bugfix task in request handling and retries with high rollout risk.",
  "implementationPlan": [
    {
      "title": "Reproduce and isolate the current behavior",
      "detail": "..."
    }
  ],
  "reviewChecklist": [
    "Root workflow trace shows classify -> inspect -> plan -> draft PR summary"
  ],
  "prTitle": "fix: fix duplicate webhook retries when the upstream api returns 429",
  "prSummary": "This change addresses ..."
}
```

## Architecture

```text
engineering task
  -> diagnose_task
  -> inspect_repo_context
  -> draft_plan
  -> return PR plan + review checklist
```

Tokvera traces the workflow root plus the child steps so you can inspect the complete engineering handoff lifecycle.

## Repo structure

```text
src/
  sample-tasks.ts
  server.ts
```

## Useful local routes

- `GET /api/demo-task` for one default payload
- `GET /api/sample-tasks` for reusable demo tasks
- `POST /api/pr-plan` to run the coding-agent planning workflow directly

## Extension ideas

- connect a real GitHub issue fetcher
- inspect repository files through MCP or GitHub APIs
- add patch generation after plan approval
- add PR-review comments and rollout checklists
- support multi-agent handoff between planner, patcher, and reviewer
- attach links to Tokvera traces inside generated PR summaries

## Suggested article angles

- What to trace before coding agents start opening pull requests
- How to debug coding-agent handoffs with one root trace
- How to turn AI coding incidents into regression tests
- What engineering managers should review before trusting coding-agent PRs

## Related Tokvera concepts to highlight in content

- one root trace for the full coding-agent workflow
- child spans for diagnosis, repo context, and planning
- release-aware engineering reviews
- debugging multi-step agent handoffs instead of isolated model calls

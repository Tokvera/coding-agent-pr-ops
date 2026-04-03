# Build a Coding-Agent PR Planner in Node.js with One Root Trace

Coding agents are useful long before you let them write code directly into production repositories.

The first operationally useful step is smaller:

- take a real engineering task
- classify it
- inspect the relevant repo area
- draft a concrete implementation plan
- generate a PR title and summary
- keep the whole workflow inside one root trace

That is what I built in `coding-agent-pr-ops`:

`https://github.com/Tokvera/coding-agent-pr-ops`

## Why this is a better starting point than full auto-code generation

Most coding-agent demos jump too quickly from task input to generated code. That looks impressive, but it skips the part engineering teams actually need to trust:

- why the task was classified a certain way
- which repo area the agent thinks matters
- how risky the task is
- whether the review checklist actually protects the rollout

If you cannot inspect those steps, the final PR is just a black box with a diff attached.

## What the repo does

For each task, the starter:

1. diagnoses work type and rollout risk
2. inspects basic repository context
3. drafts an implementation plan
4. generates a PR title and PR summary
5. returns a review checklist
6. traces the workflow with Tokvera

Workflow shape:

```text
engineering task
  -> diagnose_task
  -> inspect_repo_context
  -> draft_plan
  -> return PR plan + review checklist
```

## Stack

- Node.js
- Express
- OpenAI
- Tokvera JavaScript SDK
- Zod

Mock mode is enabled by default, so you can run the whole thing without a live model key.

## Local setup

```bash
git clone https://github.com/Tokvera/coding-agent-pr-ops.git
cd coding-agent-pr-ops
npm install
copy .env.example .env
npm run dev
```

The server runs on `http://localhost:3300`.

## Endpoints

- `GET /health`
- `GET /api/demo-task`
- `GET /api/sample-tasks`
- `POST /api/pr-plan`

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
  "diagnosis": {
    "workType": "bugfix",
    "risk": "high",
    "owner": "backend",
    "repoArea": "request handling and retries"
  },
  "summary": "This looks like a bugfix task in request handling and retries with high rollout risk.",
  "implementationPlan": [
    {
      "title": "Reproduce and isolate the current behavior",
      "detail": "Use the labels and hinted files to confirm where the current path fails."
    }
  ],
  "reviewChecklist": [
    "Root workflow trace shows classify -> inspect -> plan -> draft PR summary"
  ],
  "prTitle": "fix: fix duplicate webhook retries when the upstream api returns 429"
}
```

## Why the root trace matters

Coding-agent failures are workflow failures, not just bad completions.

The diagnosis might be wrong.
The repo context might point at the wrong files.
The plan might look coherent but still be aimed at the wrong area.

Without one root trace, you only see fragments.

With one root trace, you can inspect:

- diagnosis
- repo-context lookup
- planning
- output handoff

That gives reviewers something operationally useful instead of just “the model generated this.”

## Why mock mode is a feature

Mock mode makes the repo far more reusable:

- easier to demo
- easier to screenshot
- easier to explain in articles
- easier for developers to fork without setup friction

Once the workflow is clear, you can replace static hints with:

- GitHub issue fetches
- repo inspection through MCP or GitHub APIs
- patch generation
- PR review comments

The workflow stays the same. The trace stays useful.

## What I would inspect before trusting a coding agent

- whether diagnosis and risk match what a human reviewer would say
- whether repo context points to the right code path
- whether the review checklist protects the risky path
- whether the PR summary explains rollout verification
- whether similar tasks are getting cheaper and more reliable over time

## Useful follow-up reading

- Website post:
  - `https://tokvera.org/blog/how-to-build-a-coding-agent-pr-planning-workflow-with-one-root-trace`
- Coding-agent docs:
  - `https://tokvera.org/docs/coding-agent-tracing`
- Coding-agent use case:
  - `https://tokvera.org/use-cases/coding-agent-observability`
- Agent evals in CI:
  - `https://tokvera.org/docs/agent-evals-in-ci`

If you want to fork it, the repo is here:

`https://github.com/Tokvera/coding-agent-pr-ops`

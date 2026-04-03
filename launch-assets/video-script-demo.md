# Demo Video Script

Length:
2 to 4 minutes

## Opening

Today I want to show a small repo we built called `coding-agent-pr-ops`.

The point is not to show a flashy coding agent.
The point is to show the first part teams actually need to trust:
task diagnosis, repo context, plan generation, and PR handoff, all inside one root trace.

## Problem

Most coding-agent demos skip straight to generated code.

That creates a review problem:

- why did the agent think this was a bugfix
- what repo area did it inspect
- what rollout risk did it assign
- what should the reviewer actually verify

If you cannot answer those questions, the final PR is still opaque.

## Repo walkthrough

Show:
- README
- endpoints
- mock mode note

Narration:
This repo is intentionally small.
It gives you one planning workflow instead of pretending to automate the full engineering lifecycle from day one.

## Demo request

Show the curl request:

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

## Response walkthrough

Highlight:
- diagnosis
- risk
- implementation plan
- review checklist
- PR title
- PR summary

Narration:
This is the handoff artifact a reviewer can actually use.

## Trace walkthrough

Show Tokvera trace.

Narration:
This is the main reason the repo exists.

You can inspect:

- `diagnose_task`
- `inspect_repo_context`
- `draft_plan`

So if the workflow goes wrong, you do not only see the last output. You see the step where the workflow drifted.

## Why mock mode matters

Explain:
- easy local run
- easy screenshots
- easy tutorials
- easy team demos

Then note:
Once the workflow is clear, you can swap in real GitHub issue fetches, repo inspection, or patch generation.

## Closing

If you are experimenting with coding agents, PR planning is a better first operational surface than full autonomous code generation.

Repo:
`https://github.com/Tokvera/coding-agent-pr-ops`

Website post:
`https://tokvera.org/blog/how-to-build-a-coding-agent-pr-planning-workflow-with-one-root-trace`

# Short Video Script

Length:
30 to 45 seconds

## Hook

If your coding agent can open pull requests, you need to inspect more than the final diff.

## Scene 1

Show:
- repo homepage
- task payload

Voice:
This repo takes a real coding task and turns it into a diagnosis, a repo-context snapshot, a PR plan, and a review checklist.

## Scene 2

Show:
- `POST /api/pr-plan`
- response JSON

Voice:
The useful part is not just the output. It is the workflow behind the output.

## Scene 3

Show:
- Tokvera trace
- steps:
  - `diagnose_task`
  - `inspect_repo_context`
  - `draft_plan`

Voice:
Everything stays inside one root trace, so reviewers can see how the agent got to the handoff.

## Close

Show:
- repo URL
- blog URL

Voice:
Repo is `coding-agent-pr-ops`. If you are building coding-agent workflows, start by making the plan inspectable before you trust the PR.

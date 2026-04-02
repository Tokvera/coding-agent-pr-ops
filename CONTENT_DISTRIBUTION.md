# Content Distribution Plan

This repo should not ship as code alone. It should ship as a traffic cluster.

## Primary angle

How to trace coding-agent workflows before they open bad pull requests.

## Website blog posts

1. What to trace before coding agents start opening pull requests
2. How to debug coding-agent handoffs with one root trace
3. Turn AI coding incidents into regression tests before rollout

## Dev.to

1. Build a coding-agent PR planner in Node.js with trace visibility
2. Add root-trace visibility to multi-step coding agents

Focus:

- runnable local setup
- curl examples
- screenshots of the trace
- link to this repo and Tokvera docs

## Medium

1. Why coding agents need workflow-level observability, not just logs
2. How engineering teams should review coding-agent PRs before rollout

Focus:

- operational narrative
- team workflow
- rollout risk
- link back to repo and Tokvera comparison/use-case pages

## LinkedIn

1. Founder post:
   - "We built a small coding-agent PR planner that shows diagnosis, planning, and PR-summary generation in one trace."
2. Demo clip post:
   - issue -> plan -> PR summary -> Tokvera trace replay
3. Carousel:
   - 5 things teams should inspect before coding agents open PRs

## Reddit

Target communities:

- r/LocalLLaMA
- r/AI_Agents
- r/programming
- framework-specific subreddits where allowed

Post shape:

- value first
- include build details and lessons learned
- avoid launch spam language

Suggested angles:

1. We built a small coding-agent PR planner with one root trace for the full workflow
2. What broke the first time we tried to trace coding-agent handoffs end to end

## Video

1. Short demo
   - task input
   - diagnosis
   - plan output
   - Tokvera trace
2. Longer walkthrough
   - architecture
   - why root traces matter
   - how to adapt this repo for real GitHub tasks

## Tokvera pages to link

- `/use-cases/coding-agent-observability`
- `/compare/langsmith-for-coding-agents`
- `/compare/langfuse-for-coding-agents`
- `/docs/coding-agent-tracing`
- `/docs/agent-evals-in-ci`

## Screenshot checklist

- task input payload
- response JSON with plan and PR summary
- Tokvera trace showing diagnose -> inspect -> draft plan
- compare page or docs page for internal backlink screenshots

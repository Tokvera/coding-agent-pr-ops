export const sampleTasks = [
  {
    title: "Fix duplicate webhook retries when the upstream API returns 429",
    repoName: "acme/ops-agent",
    branchName: "main",
    labels: ["bug", "webhooks", "billing"],
    body:
      "When the upstream billing API returns 429, our retry worker creates duplicate webhook attempts instead of backing off cleanly. We need one retry schedule, not parallel duplicate jobs.",
    filesHint: ["src/workers/webhook-dispatch.ts", "src/lib/backoff.ts"],
  },
  {
    title: "Add customer usage export endpoint for finance review",
    repoName: "acme/control-plane",
    branchName: "main",
    labels: ["feature", "finance", "api"],
    body:
      "Finance wants a CSV export of customer usage rollups by month, project, and customer_id. The endpoint should be safe for the finance role and should not expose raw trace payloads.",
    filesHint: ["src/routes/customers.ts", "src/lib/exporters/customer-usage.ts"],
  },
  {
    title: "Reduce noisy model fallback alerts in the gateway",
    repoName: "acme/gateway",
    branchName: "main",
    labels: ["ops", "routing", "alerts"],
    body:
      "The gateway currently pages the team on every fallback. We need better grouping so only repeated fallback bursts or high-cost routing shifts trigger a real incident path.",
    filesHint: ["src/gateway/router.ts", "src/alerts/fallback-alerts.ts"],
  },
];

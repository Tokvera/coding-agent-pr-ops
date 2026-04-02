import "dotenv/config";
import express, { Request, Response } from "express";
import OpenAI from "openai";
import { z } from "zod";
import {
  createTokveraTracer,
  finishSpan,
  getTrackOptionsFromTraceContext,
  startSpan,
  startTrace,
  trackOpenAI,
} from "@tokvera/sdk";
import { sampleTasks } from "./sample-tasks.js";

const app = express();
app.use(express.json());

const port = Number(process.env.PORT || 3300);
const isMockMode = process.env.MOCK_MODE !== "false";
const openAIModel = process.env.OPENAI_MODEL || "gpt-4o-mini";
const tokveraTenantId = process.env.TOKVERA_TENANT_ID || "acme-demo";
const tokveraApiKey = process.env.TOKVERA_API_KEY || "tkv_demo_key";
const tokveraIngestUrl = process.env.TOKVERA_INGEST_URL;
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const tracer = createTokveraTracer({
  api_key: tokveraApiKey,
  ingest_url: tokveraIngestUrl,
  feature: "coding_agent_pr_ops",
  tenant_id: tokveraTenantId,
  environment: process.env.NODE_ENV === "production" ? "production" : "development",
  emit_lifecycle_events: true,
});

const taskSchema = z.object({
  title: z.string().min(8),
  body: z.string().min(20),
  repoName: z.string().min(3),
  branchName: z.string().min(1).default("main"),
  labels: z.array(z.string()).default([]),
  filesHint: z.array(z.string()).default([]),
});

type Task = z.infer<typeof taskSchema>;
type WorkType = "bugfix" | "feature" | "ops" | "refactor";
type RiskLevel = "low" | "medium" | "high";

type Diagnosis = {
  workType: WorkType;
  risk: RiskLevel;
  owner: string;
  repoArea: string;
  shortReason: string;
  shouldRequestReplay: boolean;
};

type PlanStep = {
  title: string;
  detail: string;
};

type PullRequestPlan = {
  summary: string;
  implementationPlan: PlanStep[];
  reviewChecklist: string[];
  prTitle: string;
  prSummary: string;
};

function parseModelJson<T>(value: string, fallback: T): T {
  try {
    const normalized = value.replace(/^```json\s*/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
    return JSON.parse(normalized) as T;
  } catch {
    return fallback;
  }
}

function heuristicDiagnose(task: Task): Diagnosis {
  const text = `${task.title} ${task.body} ${task.labels.join(" ")}`.toLowerCase();
  if (text.includes("bug") || text.includes("error") || text.includes("duplicate") || text.includes("429")) {
    return {
      workType: "bugfix",
      risk: "high",
      owner: "backend",
      repoArea: "request handling and retries",
      shortReason: "error or retry language detected",
      shouldRequestReplay: true,
    };
  }
  if (text.includes("export") || text.includes("endpoint") || text.includes("feature")) {
    return {
      workType: "feature",
      risk: "medium",
      owner: "api",
      repoArea: "customer usage and reporting",
      shortReason: "delivery language detected",
      shouldRequestReplay: false,
    };
  }
  if (text.includes("alert") || text.includes("fallback") || text.includes("ops")) {
    return {
      workType: "ops",
      risk: "medium",
      owner: "platform",
      repoArea: "routing and incident thresholds",
      shortReason: "ops and routing language detected",
      shouldRequestReplay: true,
    };
  }
  return {
    workType: "refactor",
    risk: "low",
    owner: "application",
    repoArea: "general code path",
    shortReason: "default implementation path",
    shouldRequestReplay: false,
  };
}

function buildMockPlan(task: Task, diagnosis: Diagnosis): PullRequestPlan {
  const implementationPlan: PlanStep[] = [
    {
      title: "Reproduce and isolate the current behavior",
      detail: `Use the labels ${task.labels.join(", ") || "none"} and the hinted files ${task.filesHint.join(", ") || "none"} to confirm where the current path fails.`,
    },
    {
      title: "Patch the core path",
      detail: `Update the ${diagnosis.repoArea} code so the behavior matches the request and the new branch logic is explicit instead of implicit.`,
    },
    {
      title: "Add regression coverage",
      detail: "Write or extend tests around the failing path so the same issue does not slip back in after later prompt or code changes.",
    },
    {
      title: "Document rollout and verification",
      detail: "Summarize how to verify the patch in staging and what trace signals or metrics should stay healthy after deploy.",
    },
  ];

  const reviewChecklist = [
    "Root workflow trace shows classify -> inspect -> plan -> draft PR summary",
    "Regression test proves the issue is fixed",
    "PR summary explains risk and rollout verification",
    diagnosis.shouldRequestReplay ? "Replay or synthetic test exists for the risky path" : "No replay requirement for this patch",
  ];

  return {
    summary: `This looks like a ${diagnosis.workType} task in ${diagnosis.repoArea} with ${diagnosis.risk} rollout risk.`,
    implementationPlan,
    reviewChecklist,
    prTitle: `fix: ${task.title.toLowerCase()}`,
    prSummary:
      `This change addresses ${task.title}. It focuses on ${diagnosis.repoArea}, adds regression coverage, and documents how to verify the new behavior before rollout.`,
  };
}

async function diagnoseTask(task: Task, parent: ReturnType<typeof startSpan>): Promise<Diagnosis> {
  const fallback = heuristicDiagnose(task);
  if (isMockMode || !openai) {
    return fallback;
  }

  const trackedOpenAI = trackOpenAI(
    openai,
    getTrackOptionsFromTraceContext(parent, {
      step_name: "diagnose_task",
      span_kind: "model",
      capture_content: true,
    })
  );

  const completion = await trackedOpenAI.chat.completions.create({
    model: openAIModel,
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "Classify coding-agent tasks. Return minified JSON with keys workType, risk, owner, repoArea, shortReason, shouldRequestReplay. workType must be bugfix, feature, ops, or refactor. risk must be low, medium, or high. shouldRequestReplay must be boolean.",
      },
      {
        role: "user",
        content: JSON.stringify(task),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content || "";
  const parsed = parseModelJson<Partial<Diagnosis>>(content, fallback);
  finishSpan(parent, { response: completion, model: openAIModel });
  return {
    ...fallback,
    ...parsed,
  };
}

async function draftPlan(task: Task, diagnosis: Diagnosis, parent: ReturnType<typeof startSpan>): Promise<PullRequestPlan> {
  const fallback = buildMockPlan(task, diagnosis);
  if (isMockMode || !openai) {
    return fallback;
  }

  const trackedOpenAI = trackOpenAI(
    openai,
    getTrackOptionsFromTraceContext(parent, {
      step_name: "draft_plan",
      span_kind: "model",
      capture_content: true,
    })
  );

  const completion = await trackedOpenAI.chat.completions.create({
    model: openAIModel,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are an engineering planning agent. Return minified JSON with keys summary, implementationPlan, reviewChecklist, prTitle, prSummary. implementationPlan must be an array of {title, detail}. reviewChecklist must be an array of strings. Keep the plan concrete and rollout-aware.",
      },
      {
        role: "user",
        content: JSON.stringify({ task, diagnosis }),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content || "";
  const parsed = parseModelJson<Partial<PullRequestPlan>>(content, fallback);
  finishSpan(parent, { response: completion, model: openAIModel });
  return {
    ...fallback,
    ...parsed,
    implementationPlan: Array.isArray(parsed.implementationPlan) && parsed.implementationPlan.length > 0 ? parsed.implementationPlan as PlanStep[] : fallback.implementationPlan,
    reviewChecklist: Array.isArray(parsed.reviewChecklist) && parsed.reviewChecklist.length > 0 ? parsed.reviewChecklist : fallback.reviewChecklist,
  };
}

app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true, mockMode: isMockMode });
});

app.get("/api/demo-task", (_req: Request, res: Response) => {
  res.json(sampleTasks[0]);
});

app.get("/api/sample-tasks", (_req: Request, res: Response) => {
  res.json(sampleTasks);
});

app.post("/api/pr-plan", async (req: Request, res: Response) => {
  const parsed = taskSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const task = parsed.data;
  const root = startTrace(tracer.baseOptions, {
    step_name: "coding_agent_pr_ops",
    model: "coding-agent-pr-ops",
    span_kind: "orchestrator",
  });

  try {
    const diagnoseSpan = startSpan(root, {
      step_name: "diagnose_task",
      span_kind: "model",
      provider: isMockMode ? "tokvera" : "openai",
      model: isMockMode ? "heuristic-code-triage" : openAIModel,
    });
    const diagnosis = await diagnoseTask(task, diagnoseSpan);
    if (isMockMode) {
      finishSpan(diagnoseSpan, { response: diagnosis, model: "heuristic-code-triage" });
    }

    const inspectSpan = startSpan(root, {
      step_name: "inspect_repo_context",
      span_kind: "tool",
      tool_name: "repo_context",
    });
    const repoContext = {
      repoName: task.repoName,
      branchName: task.branchName,
      filesHint: task.filesHint,
      labels: task.labels,
      note: "This starter uses static hints. Replace with a real repository inspector or MCP/GitHub connector in production.",
    };
    finishSpan(inspectSpan, { response: repoContext });

    const planSpan = startSpan(root, {
      step_name: "draft_plan",
      span_kind: "model",
      provider: isMockMode ? "tokvera" : "openai",
      model: isMockMode ? "mock-planner" : openAIModel,
    });
    const pullRequestPlan = await draftPlan(task, diagnosis, planSpan);
    if (isMockMode) {
      finishSpan(planSpan, { response: pullRequestPlan, model: "mock-planner" });
    }

    finishSpan(root, {
      response: {
        diagnosis,
        prTitle: pullRequestPlan.prTitle,
        risk: diagnosis.risk,
      },
    });

    return res.json({
      traceId: root.trace_id,
      runId: root.run_id,
      task,
      diagnosis,
      repoContext,
      ...pullRequestPlan,
      meta: {
        mockMode: isMockMode,
        provider: isMockMode ? "mock" : "openai",
        model: isMockMode ? "mock-planner" : openAIModel,
      },
    });
  } catch (error) {
    finishSpan(root, {
      response: {
        status: "error",
        message: error instanceof Error ? error.message : String(error),
      },
      outcome: "failure",
    });
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
      traceId: root.trace_id,
      runId: root.run_id,
    });
  }
});

app.listen(port, () => {
  console.log(`coding-agent-pr-ops listening on :${port}`);
});

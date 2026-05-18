import * as azdev from "azure-devops-node-api";
import { getPat } from "./auth.ts";

const ORG_URL = process.env.AZDO_ORG_URL ?? "https://dev.azure.com/grupoltm";
const PROJECT = process.env.AZDO_PROJECT ?? "Vertem Innovation";
const TEAM = process.env.AZDO_TEAM ?? "Vertem Innovation Team";
const SPRINT = process.argv[2] ?? process.env.AZDO_SPRINT ?? "Sprint 67";

type AssignedTo = { displayName?: string } | undefined;

async function main(): Promise<void> {
  const conn = new azdev.WebApi(
    ORG_URL,
    azdev.getPersonalAccessTokenHandler(getPat()),
  );

  const work = await conn.getWorkApi();
  const wit = await conn.getWorkItemTrackingApi();

  const teamCtx = { project: PROJECT, team: TEAM };
  const iterations = await work.getTeamIterations(teamCtx);

  const sprint = iterations.find((i) => i.name === SPRINT);
  if (!sprint?.id) {
    console.error(`Sprint não encontrada: "${SPRINT}".`);
    console.error(
      `Sprints disponíveis: ${iterations.map((i) => i.name).join(", ")}`,
    );
    process.exit(1);
  }

  const relations = await work.getIterationWorkItems(teamCtx, sprint.id);
  const ids =
    relations.workItemRelations
      ?.map((r) => r.target?.id)
      .filter((id): id is number => typeof id === "number") ?? [];

  if (ids.length === 0) {
    console.log(`Sprint "${SPRINT}" não tem work items.`);
    return;
  }

  const items = await wit.getWorkItems(ids, [
    "System.Title",
    "System.WorkItemType",
    "System.State",
    "System.AssignedTo",
  ]);

  console.log(`Sprint: ${SPRINT} (${ids.length} work items)\n`);
  for (const it of items) {
    const f = it.fields ?? {};
    const assignee =
      (f["System.AssignedTo"] as AssignedTo)?.displayName ?? "—";
    console.log(
      `[${it.id}] (${f["System.WorkItemType"]}) ${f["System.Title"]} • ${f["System.State"]} • ${assignee}`,
    );
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

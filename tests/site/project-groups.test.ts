import assert from "node:assert/strict";
import test from "node:test";
import { projects } from "../../data/projects";
import { groupProjects, homeProjectIds } from "../../data/project-groups";

test("editorial grouping retains every source project exactly once", () => {
  const grouped = groupProjects(projects).flatMap((group) => group.projects);
  assert.equal(grouped.length, projects.length);
  assert.deepEqual(grouped.map((p) => p.id).sort(), projects.map((p) => p.id).sort());
  grouped.forEach((project) => assert.equal(project, projects.find((p) => p.id === project.id)));
});
test("new catalog entries remain visible without an editorial assignment", () => {
  const added = { ...projects[0], id: "unassigned-project" };
  const grouped = groupProjects([...projects, added]);
  assert.equal(grouped.find((group) => group.id === "other")?.projects[0], added);
});
test("homepage selection resolves to distinct source entries", () => {
  assert.equal(new Set(homeProjectIds).size, homeProjectIds.length);
  homeProjectIds.forEach((id) => assert.ok(projects.some((p) => p.id === id), id));
});

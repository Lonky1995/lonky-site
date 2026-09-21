export type ThesisStatus = "exploring" | "monitoring" | "supported" | "weakened" | "invalidated" | "archived";
export type ThesisCategory = "crypto" | "us-equities" | "market-structure" | "other";

export type ThesisProjection = {
  id: string;
  title: string;
  symbols: string[];
  category: ThesisCategory;
  status: ThesisStatus;
  revision: number;
  claim: { text: string; horizon?: string; scope?: string };
  causalChain: string[];
  keyQuestions: string[];
  evidence: Array<{ id: string; statement: string; stance: "supports" | "weakens" | "context"; source: { name: string; observedAt: string } }>;
  alternatives: Array<{ id: string; text: string; whatWouldDifferentiate?: string }>;
  validationSignals: Array<{ id: string; direction: "support" | "weaken"; condition: string; status: "pending" | "observed" }>;
  createdAt: string;
  updatedAt: string;
};

export type ThesisSnapshot = { schemaVersion: 1; syncedAt: string; theses: ThesisProjection[] };

const OWNER = "Lonky1995";
const REPO = "lonky-thesis-data";
const PATH = "theses/latest.json";

function headers() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN not configured");
  return { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" };
}

export async function readThesisSnapshot(): Promise<ThesisSnapshot> {
  const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`, { headers: headers(), cache: "no-store" });
  if (response.status === 404) return { schemaVersion: 1, syncedAt: "", theses: [] };
  if (!response.ok) throw new Error(`thesis store read failed: ${response.status}`);
  const body = await response.json() as { content: string };
  return JSON.parse(Buffer.from(body.content, "base64").toString("utf8")) as ThesisSnapshot;
}

export async function writeThesisSnapshot(snapshot: ThesisSnapshot): Promise<void> {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
  const existing = await fetch(url, { headers: headers(), cache: "no-store" });
  let sha: string | undefined;
  if (existing.ok) sha = (await existing.json() as { sha: string }).sha;
  else if (existing.status !== 404) throw new Error(`thesis store lookup failed: ${existing.status}`);
  const response = await fetch(url, { method: "PUT", headers: { ...headers(), "Content-Type": "application/json" }, body: JSON.stringify({ message: `sync Thesis snapshot ${snapshot.syncedAt}`, content: Buffer.from(JSON.stringify(snapshot, null, 2)).toString("base64"), ...(sha ? { sha } : {}) }) });
  if (!response.ok) throw new Error(`thesis store write failed: ${response.status}`);
}

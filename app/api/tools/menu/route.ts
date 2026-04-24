import { streamText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { NextRequest } from "next/server";
import recipesData from "@/data/recipes.json";

const deepseek = createOpenAICompatible({
  name: "deepseek",
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.DEEPSEEK_API_KEY!,
});

interface Recipe {
  id: string;
  name: string;
  category: string;
  difficulty: number;
  ingredients: string[];
  steps: string[];
  sourceUrl: string;
}

const RECIPES = (recipesData as { recipes: Recipe[] }).recipes;

// 宝宝禁忌/高风险食材（1岁半）
const BABY_UNSAFE = [
  "辣椒", "花椒", "胡椒", "芥末", "白酒", "啤酒", "料酒过多",
  "整颗坚果", "蜂蜜", // 蜂蜜主要是1岁以下禁忌，1岁半可少量，但保守起见避开
];

function isBabyFriendlyBase(recipe: Recipe): boolean {
  const text = (recipe.name + recipe.ingredients.join("") + recipe.steps.join("")).toLowerCase();
  const spicy = ["辣", "麻辣", "香辣", "剁椒", "泡椒", "咖喱", "芥末", "孜然"];
  return !spicy.some((k) => text.includes(k));
}

function pickRandom<T>(arr: T[], n: number): T[] {
  const pool = [...arr];
  const result: T[] = [];
  for (let i = 0; i < n && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}

function pickTodayMenu(adults: number) {
  const meat = RECIPES.filter((r) => r.category === "meat" && r.difficulty <= 3);
  const veg = RECIPES.filter((r) => r.category === "vegetable" && r.difficulty <= 3);
  const soup = RECIPES.filter((r) => r.category === "soup" && r.difficulty <= 3);
  const staple = RECIPES.filter((r) => r.category === "staple" && r.difficulty <= 3);

  // 菜的数量 = 大人人数（荤素各半，向上取整给荤）
  // 特例：1 人只出 1 菜（不区分荤素，优先荤）
  let meatCount: number;
  let vegCount: number;
  if (adults <= 1) {
    meatCount = 1;
    vegCount = 0;
  } else {
    meatCount = Math.ceil(adults / 2);
    vegCount = Math.floor(adults / 2);
  }

  return {
    adult: [
      ...pickRandom(meat, meatCount),
      ...pickRandom(veg, vegCount),
      ...pickRandom(soup, 1),
      ...pickRandom(staple, 1),
    ],
  };
}

export async function POST(req: NextRequest) {
  let adults = 4;
  let babies = 2;
  try {
    const body = await req.json();
    if (typeof body?.adults === "number") {
      adults = Math.max(1, Math.min(10, Math.floor(body.adults)));
    }
    if (typeof body?.babies === "number") {
      babies = Math.max(0, Math.min(4, Math.floor(body.babies)));
    }
  } catch {
    // no body, use defaults
  }

  const { adult } = pickTodayMenu(adults);

  // 从大人菜谱中挑出适合宝宝的原菜，让 AI 改造
  const babyBaseCandidates = adult.filter(isBabyFriendlyBase);
  const babyBase = babyBaseCandidates.length > 0
    ? pickRandom(babyBaseCandidates, Math.min(2, babyBaseCandidates.length))
    : pickRandom(adult, 2);

  const date = new Date().toLocaleDateString("zh-CN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const babyCount = babies;
  const babyDishCount = babyCount > 0 ? Math.min(2, Math.max(1, babyCount)) : 0;

  const babyInstructions = babyDishCount > 0
    ? `2. 基于其中 ${babyDishCount} 道成人菜，改造成适合【1岁半宝宝】的版本（${babyCount} 人份）

宝宝版改造原则：
- 不加盐、不加味精、不加酱油（或改用少量婴儿酱油）
- 不加辣椒、花椒、料酒等刺激性调料
- 食物切小丁/剁碎/煮软烂，避免坚果整颗、葡萄整颗等噎呛风险
- 可以调整食材，比如把"红烧肉"改成"清蒸肉末"
- 给宝宝版菜品起一个新名字（如"宝宝版番茄鸡肉软饭"）`
    : `2. 本次无需生成宝宝菜，baby_meals 字段返回空数组 []`;

  const systemPrompt = `你是一位专业的营养师和儿童饮食专家。我会给你一份成人菜谱（已从权威菜谱库选出），请你完成两件事：

1. 为每道成人菜补充一个「营养标签」（如"高蛋白·补铁"），10字以内
${babyInstructions}

严格按照以下 JSON 格式输出，不要有任何多余文字或 markdown 代码块标记：

{
  "adult_tags": {
    "菜名1": "营养标签",
    "菜名2": "营养标签"
  },
  "baby_meals": [
    {
      "name": "宝宝版菜名",
      "based_on": "来源成人菜名",
      "category": "主食/辅食",
      "nutrition": "营养标签",
      "ingredients": ["食材1 用量", "食材2 用量"],
      "steps": ["步骤1", "步骤2"]
    }
  ]
}`;

  const userPrompt = `今天的成人菜谱：

${adult.map((r, i) => `【菜 ${i + 1}】${r.name}（${categoryLabel(r.category)}）
食材：${r.ingredients.slice(0, 6).join("、")}
`).join("\n")}

请选择其中最适合改造给宝宝的 2 道菜（优先选清淡、食材软烂的），生成宝宝版。`;

  const result = streamText({
    model: deepseek.chatModel("deepseek-chat"),
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  // 把成人原菜数据和日期塞进响应头，前端合并
  const meta = {
    date,
    adults,
    babies,
    adult: adult.map((r) => ({
      name: r.name,
      category: categoryLabel(r.category),
      ingredients: r.ingredients,
      steps: r.steps,
      sourceUrl: r.sourceUrl,
      difficulty: r.difficulty,
    })),
    babyBaseNames: babyBase.map((r) => r.name),
  };

  const response = result.toTextStreamResponse();
  response.headers.set("X-Menu-Meta", encodeURIComponent(JSON.stringify(meta)));
  return response;
}

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    meat: "荤菜",
    vegetable: "素菜",
    soup: "汤",
    staple: "主食",
    breakfast: "早餐",
    aquatic: "水产",
  };
  return map[cat] || cat;
}

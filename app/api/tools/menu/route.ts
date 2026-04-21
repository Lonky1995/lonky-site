import { streamText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { NextRequest } from "next/server";

const deepseek = createOpenAICompatible({
  name: "deepseek",
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.DEEPSEEK_API_KEY!,
});

const SYSTEM_PROMPT = `你是一位专业的营养师和中国家庭厨师。请为一个6人家庭（2位大人、2位阿姨、2位1岁半的宝宝）设计今日菜谱。

请严格按照以下 JSON 格式返回，不要有任何多余文字：

{
  "date": "今天的日期（如：2024年1月15日 周一）",
  "adult": {
    "label": "大人菜谱（4人份）",
    "meals": [
      {
        "name": "菜名",
        "category": "分类（如：荤菜/素菜/汤/主食）",
        "nutrition": "主要营养（如：高蛋白·补铁）",
        "ingredients": ["食材1 适量", "食材2 适量"],
        "steps": ["步骤1", "步骤2", "步骤3"]
      }
    ]
  },
  "baby": {
    "label": "宝宝菜谱（1岁半，2人份）",
    "meals": [
      {
        "name": "菜名",
        "category": "分类",
        "nutrition": "主要营养",
        "ingredients": ["食材1 适量", "食材2 适量"],
        "steps": ["步骤1", "步骤2", "步骤3"]
      }
    ]
  }
}

大人菜谱要求：
- 3道菜（1荤1素1汤）+ 主食
- 营养均衡，符合中国饮食习惯
- 食材易购买，做法家常

宝宝菜谱要求：
- 2道（1主食1菜/粥）
- 食物软烂，不加盐、不加味精
- 食材新鲜，适合1岁半幼儿
- 与大人菜谱尽量使用相同食材，减少采购

每次生成不同的菜谱，保证多样性。`;

export async function POST(_req: NextRequest) {
  const result = streamText({
    model: deepseek.chatModel("deepseek-chat"),
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `今天是 ${new Date().toLocaleDateString("zh-CN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}，请生成今日菜谱。`,
      },
    ],
  });

  return result.toTextStreamResponse();
}

import { OpenAI } from "openai";

const client = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HUGGINGFACE_API_KEY,
});

export async function generateHashtagsFree(description: string): Promise<string[]> {
  const prompt = `Generate 5 relevant and trending hashtags for this social media post:\n"${description}"`;

  const chatCompletion = await client.chat.completions.create({
    model: "Qwen/Qwen3-235B-A22B-Instruct-2507:novita",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const text = chatCompletion.choices[0].message.content || "";
    console.log("Generated hashtags:", text);
  return text
    .split(/[\s,]+/)
    .filter(word => word.startsWith("#"))
    .slice(0, 5);
}
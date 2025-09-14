import { imagekit } from "@/lib/imagekit";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const PROMPT = `You are an expert in product photography... [您的提示词保持不变] ... You MUST respond in a valid JSON format like this: { "textToImage": "your_prompt_here", "imageToVideo": "your_prompt_here" }`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error("DEEPSEEK_API_KEY is not configured.");
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

    const deepseek = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.deepseek.com/v1",
    });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file found in the request." },
        { status: 400 }
      );
    }

    // --- 关键修改：我们现在直接使用 base64 数据 ---
    const arrayBuffer = await file.arrayBuffer();
    const base64File = Buffer.from(arrayBuffer).toString("base64");
    // 获取文件的 MIME 类型，例如 "image/jpeg"
    const mimeType = file.type;

    // --- 我们不再需要上传到 ImageKit 了 (暂时)，直接将 base64 发送给 DeepSeek ---
    // const imageKitRef = await imagekit.upload({...});

    const response = await deepseek.chat.completions.create({
      model: "deepseek-vl-chat",
      messages: [
        {
          role: "user",
          // --- 这是最关键的修改部分 ---
          content: [
            {
              type: "text",
              text: PROMPT,
            },
            {
              type: "image_url",
              // 我们将 image_url 简化为一个只包含 url 的对象
              // url 的值是一个标准的 Data URL
              image_url: {
                url: `data:${mimeType};base64,${base64File}`,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const textOutput = response.choices[0].message.content;

    if (!textOutput) {
      throw new Error("DeepSeek API did not return any content.");
    }

    const json = JSON.parse(textOutput);
    return NextResponse.json(json);
  } catch (error) {
    console.error("[API_ERROR]", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}

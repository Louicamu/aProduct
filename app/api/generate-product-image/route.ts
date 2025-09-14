import { imagekit } from "@/lib/imagekit";
import OpenAI from "openai"; // 1. 我们仍然使用 OpenAI 的官方库！
import { NextRequest, NextResponse } from "next/server";

const PROMPT = `You are an expert in product photography.
Based on the user-uploaded product image, create a prompt for a text-to-image AI to generate a vibrant product showcase image.
The showcase image should feature the product in the center, surrounded by dynamic splashes of liquid or relevant materials.
Use a clean, colorful background to make the product stand out. Include related ingredients or themes floating around to add context and visual interest.
Ensure the product is sharp and in focus, with motion and energy conveyed through the splash effects.

Additionally, create a prompt for an image-to-video AI based on the generated showcase image idea.

You MUST respond in a valid JSON format like this: { "textToImage": "your_prompt_here", "imageToVideo": "your_prompt_here" }`;

export async function POST(req: NextRequest) {
  try {
    // --- 读取 Vercel 上的新环境变量 ---
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      console.error("DEEPSEEK_API_KEY is not configured.");
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

    // 2. 创建一个指向 DeepSeek 服务器的客户端实例
    const deepseek = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.deepseek.com/v1", // <-- 这是关键！我们把地址指向了 DeepSeek
    });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file found in the request." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64File = Buffer.from(arrayBuffer).toString("base64");

    const imageKitRef = await imagekit.upload({
      file: base64File,
      fileName: Date.now() + ".jpeg",
      isPublished: true,
    });

    console.log("Image uploaded to ImageKit:", imageKitRef.url);

    // 3. 调用 DeepSeek 的视觉模型
    const response = await deepseek.chat.completions.create({
      model: "deepseek-vl-chat", // <-- DeepSeek 的视觉语言模型名称
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: PROMPT,
            },
            {
              type: "image_url",
              image_url: {
                url: imageKitRef.url,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" }, // DeepSeek 也支持 JSON 模式
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

import OpenAI from "openai"; // 我们仍然用它来发送请求，但会手动构建 payload
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
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error("DEEPSEEK_API_KEY is not configured.");
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

    // 我们不再使用 OpenAI 的 client 实例来构建请求体了
    // const deepseek = new OpenAI({ ... });

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
    const mimeType = file.type;

    // --- 这是最核心的修改：手动构建请求体 (Payload) ---
    const payload = {
      model: "deepseek-chat",
      messages: [
        {
          role: "user",
          // content 现在是一个单一的字符串
          content: `data:${mimeType};base64,${base64File}\n${PROMPT}`,
        },
      ],
      // 我们仍然可以尝试请求 JSON 输出，但手动解析会更稳定
      // response_format: { type: "json_object" }, // 暂时注释掉以确保最大兼容性
      max_tokens: 1000,
      stream: false, // 确保不是流式响应
    };

    // --- 使用 fetch API 手动发送请求 ---
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // 如果响应状态不是 2xx，则抛出错误
      const errorData = await response.json();
      console.error("DeepSeek API Error:", errorData);
      throw new Error(`DeepSeek API responded with status: ${response.status}`);
    }

    const responseData = await response.json();
    const textOutput = responseData.choices[0].message.content;

    if (!textOutput) {
      throw new Error("DeepSeek API did not return any content.");
    }

    // --- 更稳定的 JSON 解析 ---
    // DeepSeek 返回的可能是包含在 markdown 代码块中的 JSON
    const jsonString =
      textOutput.match(/```json\n([\s\S]*?)\n```/)?.[1] || textOutput;

    const json = JSON.parse(jsonString);
    return NextResponse.json(json);
  } catch (error) {
    console.error("[API_ERROR]", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}

import { imagekit } from "@/lib/imagekit";
import { clientOpenAi } from "@/lib/openai"; // 假设这个文件导出了一个正确的 OpenAI 实例
import { NextRequest, NextResponse } from "next/server";

// 您的提示词保持不变
const PROMPT = `Create a vibrant product showcase image featuring a uploaded image in the center, surrounded by dynamic splashes of liquid or relevant mate.
       Use a clean, colorful background to make the product stand out. Including ingredients, or theme floating around to add context and visual interest.
       Ensure the product is sharp and in focus, with motion and energy conveyed through the splash effects.
       Also give me image to video prompt for same in JSON format:{textToImage:'',imageToVideo:''}`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    // --- 健壮性检查 ---
    if (!file) {
      return NextResponse.json(
        { error: "No file found in the request." },
        { status: 400 }
      );
    }

    // --- 1. 上传图片到 ImageKit ---
    const arrayBuffer = await file.arrayBuffer();
    const base64File = Buffer.from(arrayBuffer).toString("base64");

    const imageKitRef = await imagekit.upload({
      file: base64File,
      fileName: Date.now() + ".jpeg",
      isPublished: true, // 确保您的 imagekit 配置支持此项
    });

    console.log("Image uploaded to ImageKit:", imageKitRef.url);

    // --- 2. 调用 OpenAI API (使用修正后的格式) ---
    // 注意: "gpt-5" 目前不存在，请使用一个有效的视觉模型，例如 "gpt-4o"
    const model = "gpt-4o";

    const response = await clientOpenAi.chat.completions.create({
      model: model,
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
                url: imageKitRef.url, // 直接使用 ImageKit 返回的公开 URL
                detail: "auto", // 添加必需的 detail 属性
              },
            },
          ],
        },
      ],
      // 如果您希望 OpenAI 返回 JSON 格式，强烈建议使用 JSON 模式
      response_format: { type: "json_object" },
      max_tokens: 1000, // 根据需要调整
    });

    // --- 3. 处理 OpenAI 的响应 ---
    const textOutput = response.choices[0].message.content;

    if (!textOutput) {
      throw new Error("OpenAI did not return any content.");
    }

    // 因为我们使用了 JSON 模式，所以可以直接解析
    const json = JSON.parse(textOutput);

    return NextResponse.json(json);
  } catch (error) {
    // 详细的错误日志对于调试至关重要
    console.error("[API_ERROR]", error);

    // 向客户端返回一个通用的错误信息
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}

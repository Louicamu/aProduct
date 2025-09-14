import RPCClient from "@alicloud/pop-core"; // 1. 导入阿里云 SDK
import { NextRequest, NextResponse } from "next/server";

// 提示 DeepSeek 成为一个专业的“提示词工程师”
const PROMPT_ENGINEERING_PROMPT = `You are a world-class prompt engineer for the Alibaba Cloud Tongyi Wanxiang AI image generator.
Based on the user's uploaded image and their simple description, your task is to create a single, highly detailed, and visually descriptive prompt in English that will be used to generate a stunning product showcase image.

Follow these rules:
- Describe the main product from the image as the central subject.
- Incorporate the user's description.
- Describe a dynamic and vibrant scene around the product (e.g., "dynamic splashes of colorful liquid," "glowing particles," "relevant ingredients like fresh oranges and mint leaves floating gracefully").
- Specify the background (e.g., "a clean, minimalist studio background with soft pastel colors," "a dramatic, dark background with cinematic lighting").
- Describe the lighting and atmosphere (e.g., "bright, energetic, commercial-style lighting," "soft, ethereal morning light").
- The final output MUST be a single paragraph of text. DO NOT add any other text, explanations, or formatting.`;

// 通义万相支持的尺寸
type AliyunSize = "1024*1024" | "720*1280" | "1280*720";

export async function POST(req: NextRequest) {
  try {
    // --- 读取两个 API 密钥 ---
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    const aliyunAccessKeyId = process.env.ALIYUN_ACCESS_KEY_ID;
    const aliyunAccessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET;

    if (!deepseekApiKey || !aliyunAccessKeyId || !aliyunAccessKeySecret) {
      console.error("API keys are not configured.");
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

    // --- 1. 从前端获取数据 ---
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const description = formData.get("description") as string | null;
    const size = (formData.get("size") as string) || "1024*1024";

    if (!file) {
      return NextResponse.json(
        { error: "No file found in the request." },
        { status: 400 }
      );
    }

    // --- 2. 【第一步】调用 DeepSeek 生成专业的图像提示 ---
    console.log("Step 1: Generating prompt with DeepSeek...");
    // ... (这部分代码与之前完全相同，保持不变) ...
    const arrayBuffer = await file.arrayBuffer();
    const base64File = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type;

    const deepseekPayload = {
      model: "deepseek-chat",
      messages: [
        {
          role: "user",
          content: `data:${mimeType};base64,${base64File}\nUser Description: ${
            description || "A beautiful product shot."
          }\n\n${PROMPT_ENGINEERING_PROMPT}`,
        },
      ],
      max_tokens: 400,
      stream: false,
    };
    const deepseekResponse = await fetch(
      "https://api.deepseek.com/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${deepseekApiKey}`,
        },
        body: JSON.stringify(deepseekPayload),
      }
    );
    if (!deepseekResponse.ok) throw new Error("DeepSeek API failed");
    const deepseekData = await deepseekResponse.json();
    const generatedImagePrompt = deepseekData.choices[0].message.content;
    if (!generatedImagePrompt)
      throw new Error("DeepSeek did not return a prompt.");
    console.log("Generated Tongyi Wanxiang Prompt:", generatedImagePrompt);

    // --- 3. 【第二步】调用阿里云通义万相生成最终的图片 ---
    console.log(
      "Step 2: Generating image with Alibaba Cloud Tongyi Wanxiang..."
    );

    // 2.1 初始化阿里云客户端
    const client = new RPCClient({
      accessKeyId: aliyunAccessKeyId,
      accessKeySecret: aliyunAccessKeySecret,
      endpoint: "https://pai-vision.cn-hangzhou.aliyuncs.com", // 这是通义万相的杭州地域节点
      apiVersion: "2022-07-25", // 通义万相的 API 版本号
    });

    // 2.2 转换尺寸格式
    const sizeMapping: { [key: string]: AliyunSize } = {
      "1024*1024": "1024*1024",
      "1536*1024": "1280*720", // 映射到最接近的16:9比例
      "1024*1536": "720*1280", // 映射到最接近的9:16比例
    };
    const aliyunSize = sizeMapping[size] || "1024*1024";

    // 2.3 发送请求
    const aliyunResponse = await client.request(
      "GenerateImage", // 调用的 API 动作
      {
        Prompt: generatedImagePrompt,
        N: 1,
        Size: aliyunSize,
        // Style: '<photo>', // 您可以指定风格，例如 '<photo>', '<anime>', '<sketch>' 等
      },
      {
        method: "POST", // 必须使用 POST 方法
      }
    );

    // 2.4 从复杂的响应结构中提取图片 URL
    // @ts-ignore
    const imageUrl = aliyunResponse?.Data?.Tasks?.[0]?.ImageUrls?.[0];

    console.log("Generated Image URL:", imageUrl);

    // --- 4. 将最终的图片 URL 返回给前端 ---
    if (!imageUrl) {
      console.error(
        "Aliyun API response did not contain an image URL.",
        aliyunResponse
      );
      throw new Error("Tongyi Wanxiang did not return an image URL.");
    }

    return NextResponse.json({ imageUrl: imageUrl });
  } catch (error) {
    console.error("[API_ERROR]", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}

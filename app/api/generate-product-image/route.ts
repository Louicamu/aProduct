// 我们不再需要阿里云的 SDK 了
// import RPCClient from '@alicloud/pop-core';
import { NextRequest, NextResponse } from "next/server";
// 我们需要 Node.js 的 crypto 模块来做签名
import crypto from "crypto";

// ... PROMPT_ENGINEERING_PROMPT 保持不变 ...
const PROMPT_ENGINEERING_PROMPT = `You are a world-class prompt engineer... [内容省略]`;
type AliyunSize = "1024*1024" | "720*1280" | "1280*720";

// --- 这是一个新的辅助函数，专门用于调用阿里云 API ---
async function callAliyunWanxiang(
  prompt: string,
  size: AliyunSize,
  accessKeyId: string,
  accessKeySecret: string
) {
  const endpoint = "pai-vision.cn-hangzhou.aliyuncs.com";
  const requestUrl = `https://pai-vision.cn-hangzhou.aliyuncs.com/`;

  // 1. 准备公共请求参数
  const commonParams = {
    Format: "JSON",
    Version: "2022-07-25",
    AccessKeyId: accessKeyId,
    SignatureMethod: "HMAC-SHA1",
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    SignatureVersion: "1.0",
    SignatureNonce: crypto.randomUUID(),
    Action: "GenerateImage",
    RegionId: "cn-hangzhou",
  };

  // 2. 准备动作特定参数
  const actionParams = {
    Prompt: prompt,
    N: 1,
    Size: size,
  };

  // 3. 合并并排序所有参数
  const allParams = { ...commonParams, ...actionParams };
  const sortedKeys = Object.keys(allParams).sort();
  const canonicalizedQueryString = sortedKeys
    .map(
      (key) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(
          allParams[key as keyof typeof allParams]
        )}`
    )
    .join("&");

  // 4. 创建待签名字符串
  const stringToSign = `POST&${encodeURIComponent("/")}&${encodeURIComponent(
    canonicalizedQueryString
  )}`;

  // 5. 计算签名
  const signature = crypto
    .createHmac("sha1", `${accessKeySecret}&`)
    .update(stringToSign)
    .digest("base64");

  // 6. 最终的请求 URL (签名作为查询参数)
  const finalUrl = `${requestUrl}?${canonicalizedQueryString}&Signature=${encodeURIComponent(
    signature
  )}`;

  // 7. 发送 POST 请求
  const response = await fetch(finalUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Host: endpoint,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Aliyun API Error:", errorData);
    throw new Error(`Aliyun API responded with status: ${response.status}`);
  }

  return response.json();
}

export async function POST(req: NextRequest) {
  try {
    // ... 读取密钥和表单数据的部分保持不变 ...
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

    // ... DeepSeek 生成提示的部分保持不变 ...
    console.log("Step 1: Generating prompt with DeepSeek...");
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

    // --- 【第二步】调用阿里云通义万相 (使用新的辅助函数) ---
    console.log(
      "Step 2: Generating image with Alibaba Cloud Tongyi Wanxiang..."
    );

    const sizeMapping: { [key: string]: AliyunSize } = {
      "1024*1024": "1024*1024",
      "1536*1024": "1280*720",
      "1024*1536": "720*1280",
    };
    const aliyunSize = sizeMapping[size] || "1024*1024";

    const aliyunResponse = await callAliyunWanxiang(
      generatedImagePrompt,
      aliyunSize,
      aliyunAccessKeyId,
      aliyunAccessKeySecret
    );

    const imageUrl = aliyunResponse?.Data?.Tasks?.[0]?.ImageUrls?.[0];
    console.log("Generated Image URL:", imageUrl);

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

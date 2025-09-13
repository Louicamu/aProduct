import { imagekit } from "@/lib/imagekit";

import { clientOpenAi } from "@/lib/openai";

import { NextRequest, NextResponse } from "next/server";

const PROMPT = `Create a vibrant product showcase image featuring a uploaded image in the center,surrounded by dynamic splashes of liquid or relevant mate.

​       Use a clean,colorful background to make the product stand out.Including ingredients,or theme floating  around to add context and visual interest.

​       Ensure the product is sharp and in focus,with motion and energy conveyed through the splash effects

​       Also give me image to video prompt for same in JSON format:{textToImage:'',imageToVideo:''}

`;

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const file = formData.get("file") as File;

  const description = formData.get("description");

  const size = formData?.get("size");

  //上传产品图片

  const arrayBuffer = await file.arrayBuffer();

  const base64File = Buffer.from(arrayBuffer).toString("base64");

  const imageKitRef = await imagekit.upload({
    file: base64File,

    fileName: Date.now() + ".jpeg",

    isPublished: true,
  });

  console.log(imageKitRef.url);

  const response = await clientOpenAi.responses.create({
    model: "gpt-4.1-mini",

    input: [
      {
        role: "user",

        content: [
          {
            type: "input_text",

            text: PROMPT,
          }, //@ts-ignore

          {
            type: "input_image",

            image_url: imageKitRef.url,
          },
        ],
      },
    ],
  });

  const textOutput = response.output_text?.trim();

  let json = JSON.parse(textOutput);

  return NextResponse.json(json);
}

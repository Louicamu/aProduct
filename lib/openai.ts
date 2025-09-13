import OpenAI from "openai";
export const clientOpenAi = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

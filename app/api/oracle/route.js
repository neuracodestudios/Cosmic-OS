import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
  try {
    const { message, systemPrompt, history } = await req.json();
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ success: false, error: "NO API KEY FOUND" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
      generationConfig: { temperature: 0.8, maxOutputTokens: 1000 },
    });

    const contents = [];
    if (history?.length > 0) {
      history.slice(-8).forEach(msg => {
        if (msg.role && msg.content) {
          contents.push({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }]
          });
        }
      });
    }
    contents.push({ role: "user", parts: [{ text: message }] });

    const response = await model.generateContent({ contents });
    const reply = response.response.text();
    return Response.json({ success: true, reply });
  } catch (error) {
    return Response.json({ success: false, error: error?.message }, { status: 500 });
  }
}

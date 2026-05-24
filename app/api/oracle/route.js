import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const { message, systemPrompt, history } = await req.json();
    if (!message) {
      return Response.json({ success: false, error: "Message required" }, { status: 400 });
    }
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt,
      generationConfig: { temperature: 0.8, topP: 0.95, maxOutputTokens: 1000 },
    });
    const contents = [];
    if (history && history.length > 0) {
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
    if (!reply) throw new Error("Empty response");
    return Response.json({ success: true, reply });
  } catch (error) {
    console.error("Oracle error:", error);
    return Response.json({ success: false, error: "Oracle error. Please try again." }, { status: 500 });
  }
}

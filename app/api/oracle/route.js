import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export async function POST(req) {
  try {
    const { message, systemPrompt, history, mode } = await req.json();

    if (!message) {
      return Response.json({ success: false, error: "Message required" }, { status: 400 });
    }

    const validModes = ["standard", "shadow", "dream", "ritual"];
    const activeMode = (mode && validModes.includes(mode)) ? mode : "standard";

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: `${systemPrompt}\n[Mode: ${activeMode}]`,
      generationConfig: {
        temperature: activeMode === "dream" ? 0.9 : (activeMode === "shadow" ? 0.75 : 0.7),
        topP: 0.95,
        maxOutputTokens: 1548,
      }
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

    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await model.generateContent({ contents });
    const reply = response.response.text();

    if (!reply) throw new Error("Empty response");

    return Response.json({
      success: true,
      reply: reply,
      mode: activeMode,
    });

  } catch (error) {
    console.error("Oracle error:", error);
    return Response.json(
      { success: false, error: "Oracle error. Please try again." },
      { status: 500 }
    );
  }
}

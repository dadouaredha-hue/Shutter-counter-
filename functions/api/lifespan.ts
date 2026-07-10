import { GoogleGenAI } from "@google/genai";

export async function onRequestPost(context: any) {
  try {
    const req = context.request;
    const body = await req.json();
    const { make, model } = body;
    
    if (!make || !model) {
      return new Response(JSON.stringify({ error: "Make and model are required" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Attempt to get API key from Cloudflare env vars
    const apiKey = context.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured in Cloudflare environment variables." }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });

    const prompt = `What is the typical or estimated shutter lifespan (shutter count rating or mechanical shutter life expectancy) for the ${make} ${model} camera? Return ONLY the number (e.g., 150000). If you cannot find a specific number, return 150000 as a default.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const match = text.replace(/,/g, "").match(/\d+/);
    const lifespan = match ? parseInt(match[0], 10) : 150000;

    return new Response(JSON.stringify({ lifespan }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return new Response(JSON.stringify({ error: "Failed to determine lifespan" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

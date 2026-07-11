import { GoogleGenAI } from "@google/genai";

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/lifespan' && request.method === 'POST') {
      try {
        const body = await request.json() as any;
        const { make, model } = body;
        if (!make || !model) {
          return new Response(JSON.stringify({ error: "Make and model are required" }), { status: 400 });
        }
        
        const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
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
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to determine lifespan" }), { status: 500 });
      }
    }
    
    // Serve static assets for all other routes
    return env.ASSETS.fetch(request);
  }
}


import { GoogleGenAI, Type } from "@google/genai";
import { HouseElement } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getAISuggestions(elements: HouseElement[]) {
  const currentPlan = JSON.stringify(elements);
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this 2D house floor plan (JSON format) and suggest improvements or identify flaws: ${currentPlan}.
    Focus on living flow, window placement for light, and room accessibility. 
    Keep the response concise and friendly.`,
    config: {
      systemInstruction: "You are a senior architect assistant. Provide helpful, professional advice on residential floor plans.",
    }
  });

  return response.text;
}

export async function generateNewLayout(description: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Create a simple house floor plan based on this request: "${description}". 
    Return the layout as a JSON array of objects with the following structure:
    [{ "type": "room" | "wall" | "door" | "window", "x": number, "y": number, "width": number, "height": number, "label": string }]
    Use a coordinate system where the house fits in a 800x600 area.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            x: { type: Type.NUMBER },
            y: { type: Type.NUMBER },
            width: { type: Type.NUMBER },
            height: { type: Type.NUMBER },
            label: { type: Type.STRING }
          },
          required: ["type", "x", "y", "width", "height"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse AI layout", e);
    return null;
  }
}

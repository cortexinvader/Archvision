import { GoogleGenAI, Type } from "@google/genai";
import { HouseElement } from "../types";

export async function getAISuggestions(elements: HouseElement[]) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const currentPlan = JSON.stringify(elements);
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `As an expert architect and interior designer, analyze this floor plan: ${currentPlan}.
    Focus on:
    1. Space efficiency and flow (e.g., "The hallway is too narrow").
    2. Suggested color palette improvements for a modern luxury aesthetic.
    3. Furniture placement optimization.
    4. Structural integrity suggestions.
    
    Keep response professional, bulleted, and high-value. Limit to 150 words.`,
    config: {
      systemInstruction: "You are a world-class architectural consultant. You provide concise, actionable, and elite-level design feedback.",
    }
  });

  return response.text;
}

export async function generateNewLayout(description: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Design a high-end architectural floor plan for: "${description}". 
    
    CRITICAL COORDINATE SYSTEM:
    - Origin (0,0) is top-left. Max bounds are 1200x900.
    - Rooms should be clustered to form a cohesive house.
    - Walls should align with room edges.
    - Use professional hex colors.
    - Material types: plaster, wood, glass, brick, stone, metal.
    
    Return a JSON array of HouseElements.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ["room", "wall", "door", "window", "furniture"] },
            variant: { type: Type.STRING, enum: ["rect", "l-shape", "t-shape"] },
            x: { type: Type.NUMBER },
            y: { type: Type.NUMBER },
            width: { type: Type.NUMBER },
            height: { type: Type.NUMBER },
            rotation: { type: Type.NUMBER },
            label: { type: Type.STRING },
            color: { type: Type.STRING },
            material: { type: Type.STRING, enum: ["plaster", "wood", "glass", "brick", "stone", "metal"] }
          },
          required: ["type", "x", "y", "width", "height", "rotation", "color"]
        }
      }
    }
  });

  try {
    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (e) {
    console.error("AI Layout Parse Error", e);
    return null;
  }
}
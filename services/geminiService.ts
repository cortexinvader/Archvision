
import { GoogleGenAI, Type } from "@google/genai";
import { HouseElement } from "../types";

export async function getAISuggestions(elements: HouseElement[]) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const currentPlan = JSON.stringify(elements);
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `As an expert architect and interior designer, analyze this floor plan: ${currentPlan}.
    Focus on:
    1. Space efficiency and flow.
    2. Suggested color palette improvements for a modern aesthetic.
    3. Furniture placement optimization.
    
    Keep response professional, bulleted, and high-value.`,
    config: {
      systemInstruction: "You are a world-class architectural consultant and interior designer. You favor modern, minimalist, and functional designs.",
    }
  });

  return response.text;
}

export async function generateNewLayout(description: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Design a high-end architectural floor plan for: "${description}". 
    
    GUIDELINES:
    - Use a professional color palette: Soft neutrals for walls, specific accent colors for rooms (e.g., #E0F2FE for bedrooms, #F1F5F9 for kitchen, #FEF3C7 for living).
    - Ensure exterior walls encompass the rooms.
    - Place doors at room intersections.
    - Add windows to every exterior-facing room.
    - Place essential furniture (beds in bedrooms, sofas in living).
    
    Return a JSON array of objects representing HouseElements. Coordinate space 1200x900.`,
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
            color: { type: Type.STRING, description: "Professional hex color code" },
            material: { type: Type.STRING, enum: ["plaster", "wood", "glass", "brick", "stone", "metal"] }
          },
          required: ["type", "x", "y", "width", "height", "rotation", "color"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("AI Layout Parse Error", e);
    return null;
  }
}

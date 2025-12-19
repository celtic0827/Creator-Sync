import { GoogleGenAI, Type } from "@google/genai";
import { Project, ProjectStatus, ScheduleItem } from "../types";

export const generateScheduleSuggestions = async (
  projects: Project[],
  startDate: string,
  endDate: string,
  existingSchedule: ScheduleItem[]
): Promise<ScheduleItem[]> => {
  // Ensure API key is selected
  if (typeof window !== 'undefined' && (window as any).aistudio) {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) {
      const success = await (window as any).aistudio.openSelectKey();
      if (!success) return [];
    }
  }

  // Initialize client with the latest key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelId = "gemini-3-flash-preview";

  const systemInstruction = `
    You are an expert Project Manager and Content Strategist for a Patreon creator.
    Your goal is to create a balanced content release schedule.
    
    Rules:
    1. 'IN_PROGRESS' projects should have high priority for scheduling updates.
    2. 'COMPLETED' projects can be scheduled for "Final Release" or "Post-mortem".
    3. 'PLANNING' projects can be scheduled for "Teasers" or "Concept Art" reveals.
    4. Do not schedule on dates that already have a release in the 'existingSchedule'.
    5. Avoid scheduling more than one release per day.
    6. Distribute content evenly to keep patrons engaged.
    7. Only return the JSON array.
  `;

  const prompt = `
    Current Date Range: ${startDate} to ${endDate}.
    
    Projects Available:
    ${JSON.stringify(projects.map(p => ({ id: p.id, name: p.name, status: p.status, type: p.type })))}
    
    Existing Schedule (Do not overwrite these dates):
    ${JSON.stringify(existingSchedule.map(s => ({ date: s.date, projectId: s.projectId })))}
    
    Generate a list of new schedule items to fill gaps in the calendar.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: "YYYY-MM-DD format" },
              projectId: { type: Type.STRING, description: "The ID of the project to schedule" },
              note: { type: Type.STRING, description: "A short note for the release (e.g. 'WIP Update', 'Teaser')" }
            },
            required: ["date", "projectId", "note"]
          }
        }
      }
    });

    if (response.text) {
      const suggestions = JSON.parse(response.text) as any[];
      return suggestions.map((s: any) => ({
        id: crypto.randomUUID(),
        date: s.date,
        projectId: s.projectId,
        note: s.note
      }));
    }
    return [];
  } catch (error) {
    console.error("Error generating schedule:", error);
    if (error instanceof Error && error.message.includes('Requested entity was not found')) {
       if (typeof window !== 'undefined' && (window as any).aistudio) {
          await (window as any).aistudio.openSelectKey();
       }
    }
    throw error;
  }
};
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Skill } from "../types";

// Note: In a real environment, ensure process.env.API_KEY is defined.
// If running locally without env, this will throw.
const apiKey = process.env.API_KEY || ''; 

const ai = new GoogleGenAI({ apiKey });

/**
 * Parses a resume (PDF base64 or Text) to extract skills.
 */
export const parseResumeForSkills = async (
  fileData: string, 
  mimeType: string
): Promise<Skill[]> => {
  try {
    const model = 'gemini-3-flash-preview'; 
    
    const prompt = `
      Analyze this resume and extract a list of professional skills. 
      Categorize them into 'technical' (hard skills, tools, languages) and 'soft' (communication, leadership, etc.).
      Return strictly a JSON object with a list of skills.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { data: fileData, mimeType } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skills: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  category: { type: Type.STRING, enum: ['technical', 'soft', 'other'] }
                }
              }
            }
          }
        }
      }
    });

    const jsonText = response.text || "{}";
    const data = JSON.parse(jsonText);
    
    return (data.skills || []).map((s: any, index: number) => ({
      id: `skill-${index}`,
      name: s.name,
      category: s.category,
      selected: true // Default to selected
    }));

  } catch (error) {
    console.error("Error parsing resume:", error);
    throw new Error("Failed to parse resume. Please try again.");
  }
};

/**
 * Generates an interview question based on selected skills.
 */
export const generateInterviewQuestion = async (
  selectedSkills: Skill[],
  previousQuestions: string[]
): Promise<string> => {
  const model = 'gemini-3-flash-preview';
  const skillsList = selectedSkills.map(s => s.name).join(', ');
  
  const prompt = `
    You are an expert technical interviewer. 
    The candidate has the following skills: ${skillsList}.
    
    Previous questions asked: ${JSON.stringify(previousQuestions)}.
    
    Generate ONE new, challenging, but fair interview question relevant to one or more of these skills.
    Do not repeat previous topics exactly.
    Keep the question concise (under 30 words).
    Do not include greetings or introductory text, just the question.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      temperature: 0.8
    }
  });

  return response.text?.trim() || "Could not generate a question.";
};

/**
 * Validates the user's answer and provides feedback.
 */
export const validateAnswer = async (
  question: string,
  answer: string
): Promise<{ feedback: string; score: number }> => {
  const model = 'gemini-3-flash-preview'; // Using 3-flash for text logic as recommended
  
  const prompt = `
    Question: "${question}"
    Candidate Answer: "${answer}"
    
    Evaluate the answer. 
    1. Give a score from 1 to 10 (10 being perfect).
    2. Provide concise, constructive feedback (max 2 sentences).
    
    Return JSON.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER },
          feedback: { type: Type.STRING }
        }
      }
    }
  });

  const jsonText = response.text || "{}";
  const data = JSON.parse(jsonText);
  return {
    feedback: data.feedback || "No feedback provided.",
    score: data.score || 0
  };
};

/**
 * Generates audio from text using Gemini TTS.
 */
export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const model = 'gemini-2.5-flash-preview-tts';
    
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [{ text }]
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' } // 'Kore' is usually a good default
          }
        }
      }
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return audioData || null;

  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

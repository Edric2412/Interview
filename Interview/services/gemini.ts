import { Skill } from "../types";

const BACKEND_URL = "http://localhost:8000";

/**
 * Parses a resume (PDF base64 or Text) to extract skills via Backend.
 */
export const parseResumeForSkills = async (
  fileData: string,
  mimeType: string
): Promise<Skill[]> => {
  try {
    // Convert base64 to Blob to send as file
    const byteCharacters = atob(fileData);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    const formData = new FormData();
    formData.append("file", blob, "resume.pdf");

    const response = await fetch(`${BACKEND_URL}/parse-resume`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Backend failed to parse resume");
    }

    const skills: Skill[] = await response.json();
    return skills;

  } catch (error) {
    console.error("Error parsing resume:", error);
    throw new Error("Failed to parse resume. Please try again.");
  }
};

/**
 * Generates an interview question based on selected skills via Backend.
 */
export const generateInterviewQuestion = async (
  selectedSkills: Skill[],
  previousQuestions: string[]
): Promise<string> => {
  try {
    const response = await fetch(`${BACKEND_URL}/generate-question`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selected_skills: selectedSkills,
        previous_questions: previousQuestions
      })
    });

    if (!response.ok) return "Could not generate a question.";

    const data = await response.json();
    return data.question;

  } catch (error) {
    console.error("Error generating question:", error);
    return "Could not generate a question.";
  }
};

/**
 * Validates the user's answer and provides feedback via Backend.
 */
export const validateAnswer = async (
  question: string,
  answer: string
): Promise<{ feedback: string; score: number }> => {
  try {
    const response = await fetch(`${BACKEND_URL}/validate-answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, answer })
    });

    if (!response.ok) return { feedback: "Error validating answer", score: 0 };

    return await response.json();

  } catch (error) {
    console.error("Error validating answer:", error);
    return { feedback: "Error validating answer", score: 0 };
  }
};

/**
 * Generates audio from text using Backend TTS.
 * Returns Base64 string of audio.
 */
export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const response = await fetch(`${BACKEND_URL}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.audio || null;

  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

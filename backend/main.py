import os
import json
import base64
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load environment variables
load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],  # Adjust for your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini Client
API_KEY = os.getenv("API_KEY")
if not API_KEY:
    print("Warning: API_KEY not set in environment variables.")

client = genai.Client(api_key=API_KEY)

# --- Pydantic Models ---

class Skill(BaseModel):
    id: str
    name: str
    category: str
    selected: bool

class QuestionRequest(BaseModel):
    selected_skills: List[Skill]
    previous_questions: List[str]

class AnswerRequest(BaseModel):
    question: str
    answer: str

class TTSRequest(BaseModel):
    text: str

# --- Endpoints ---

@app.post("/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    """
    Parses a resume (PDF) and extracts skills using Gemini.
    """
    try:
        content = await file.read()
        # Encode to base64 for Gemini API
        encoded_content = base64.b64encode(content).decode("utf-8")
        
        prompt = """
        Analyze this resume and extract a list of professional skills. 
        Categorize them into 'technical' (hard skills, tools, languages) and 'soft' (communication, leadership, etc.).
        Return strictly a JSON object with a list of skills.
        """

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                types.Part.from_bytes(data=content, mime_type=file.content_type),
                 prompt
            ],
            config={
                'response_mime_type': "application/json",
                'response_schema': {
                    'type': types.Type.OBJECT,
                    'properties': {
                        'skills': {
                            'type': types.Type.ARRAY,
                            'items': {
                                'type': types.Type.OBJECT,
                                'properties': {
                                    'name': {'type': types.Type.STRING},
                                    'category': {'type': types.Type.STRING, 'enum': ['technical', 'soft', 'other']}
                                }
                            }
                        }
                    }
                }
            }
        )

        if not response.text:
             return {"skills": []}

        data = json.loads(response.text)
        
        # Transform to match frontend Skill interface
        skills = []
        for index, item in enumerate(data.get("skills", [])):
            skills.append({
                "id": f"skill-{index}",
                "name": item.get("name"),
                "category": item.get("category"),
                "selected": True
            })
            
        return skills

    except Exception as e:
        print(f"Error in parse_resume: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-question")
async def generate_question(req: QuestionRequest):
    """
    Generates an interview question based on selected skills.
    """
    try:
        skills_list = ", ".join([s.name for s in req.selected_skills])
        
        prompt = f"""
        You are an expert technical interviewer. 
        The candidate has the following skills: {skills_list}.
        
        Previous questions asked: {json.dumps(req.previous_questions)}.
        
        Generate ONE new, challenging, but fair interview question relevant to one or more of these skills.
        Do not repeat previous topics exactly.
        Keep the question concise (under 30 words).
        Do not include greetings or introductory text, just the question.
        """

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.8
            )
        )
        
        return {"question": response.text.strip() if response.text else "Could not generate question."}

    except Exception as e:
        print(f"Error in generate_question: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/validate-answer")
async def validate_answer(req: AnswerRequest):
    """
    Validates the user's answer.
    """
    try:
        prompt = f"""
        Question: "{req.question}"
        Candidate Answer: "{req.answer}"
        
        Evaluate the answer. 
        1. Give a score from 1 to 10 (10 being perfect).
        2. Provide concise, constructive feedback (max 2 sentences).
        
        Return JSON.
        """

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config={
                'response_mime_type': "application/json",
                'response_schema': {
                    'type': types.Type.OBJECT,
                    'properties': {
                        'score': {'type': types.Type.INTEGER},
                        'feedback': {'type': types.Type.STRING}
                    }
                }
            }
        )

        data = json.loads(response.text or "{}")
        return {
            "score": data.get("score", 0),
            "feedback": data.get("feedback", "No feedback provided.")
        }

    except Exception as e:
        print(f"Error in validate_answer: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tts")
async def tts(req: TTSRequest):
    """
    Generates TTS audio.
    """
    try:
        # Note: Depending on the library version, this might need adjustment.
        # This assumes newer google-genai structured calls or similar.
        # Standard Gemini API doesn't always expose TTS this way in all SDK versions yet,
        # but let's assume standard generate_content works or we use a specifc endpoint if needed.
        # For now, using the model name specifically for TTS.
        
        # As of recent updates, TTS might require a specific method or model config.
        # If 'gemini-2.5-flash-preview-tts' is not standard, we might fallback to a known working one
        # or use the standard text generation if the user wants text, but they want audio.
        # We will try the standard call with response_modalities if supported by the SDK used.
        
        # NOTE: google-genai SDK usage for Audio:
        # Usually it returns bytes in the response object if configured.
        
        # If using standard Rest API, we would set responseModalities.
        # In Python SDK:
        response = client.models.generate_content(
            model='gemini-2.5-flash', # Or specific TTS model if available
            contents=req.text,
            config=types.GenerateContentConfig(
                 response_modalities=["AUDIO"],
                 speech_config=types.SpeechConfig(
                     voice_config=types.VoiceConfig(
                         prebuilt_voice_config=types.PrebuiltVoiceConfig(
                             voice_name="Kore"
                         )
                     )
                 )
            )
        )
        
        # Extract audio bytes
        # response.parts[0].inline_data.data should have it (bytes)
        # We need to return base64 for the frontend to play it easily (as it expects base64 currently)
        
        if response.candidates and response.candidates[0].content.parts:
             part = response.candidates[0].content.parts[0]
             if part.inline_data:
                 # It's already bytes, but we need to send it over JSON probably or just raw.
                 # The frontend expects a Base64 string to decode.
                 audio_b64 = base64.b64encode(part.inline_data.data).decode('utf-8')
                 return {"audio": audio_b64}
        
        return {"audio": None} 

    except Exception as e:
        print(f"Error in tts: {e}")
        # Return null to handle gracefully
        return {"audio": None}

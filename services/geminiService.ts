// Fix: This file was empty. Added a function to analyze speech using the Gemini API.
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisReport } from "../types";

export const analyzeSpeechWithGemini = async (originalText: string, transcript: string): Promise<AnalysisReport> => {
    if (!process.env.API_KEY) {
        console.error("API_KEY not found.");
        // Return a default error report
        return {
            diction: { score: 0, feedback: "Chave de API não configurada. Por favor, contate um administrador.", errors: [] },
            rhythm: { score: 0, feedback: "Análise indisponível." },
            intonation: { score: 0, feedback: "Análise indisponível." },
            pauses: { score: 0, feedback: "Análise indisponível." },
            overallScore: 0,
            suggestions: ["O serviço de análise está indisponível no momento."],
        };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
    As an expert speech coach, analyze the following speech performance. The user was reading from a script using a teleprompter.
    
    **Original Script:**
    ---
    ${originalText}
    ---

    **User's Spoken Transcript:**
    ---
    ${transcript}
    ---

    Your task is to provide a detailed, constructive, and encouraging analysis. Evaluate the performance based on four key criteria: Diction, Rhythm, Intonation, and Pauses. For each criterion, provide a numerical score from 0 to 100 and concise, actionable feedback.

    Here are the definitions for each criterion:
    - **Diction**: Accuracy of words compared to the script. Note any omissions, additions, or substitutions.
    - **Rhythm**: The pace and flow of the speech. Was it too fast, too slow, rushed, or natural?
    - **Intonation**: The variation in pitch and tone. Did the user sound engaging and expressive, or monotonous and robotic?
    - **Pauses**: The use of silence for emphasis and clarity. Were pauses used effectively, or were there distracting filled pauses (like "um", "uh") or awkward silences?

    After analyzing each criterion, calculate an 'overallScore' which should be the average of the four individual scores.

    Finally, provide a list of 2-3 high-level, actionable 'suggestions' for what the user should focus on next time.

    The user's transcript is generated from an audio recording, so it might contain minor transcription errors. Focus on patterns of mistakes rather than single-word discrepancies that could be transcription artifacts.
    `;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            diction: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.NUMBER, description: "Score for diction from 0 to 100." },
                    feedback: { type: Type.STRING, description: "Feedback on diction." },
                    errors: {
                        type: Type.ARRAY,
                        description: "List of specific word errors. This can be empty.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                expected: { type: Type.STRING, description: "The word from the original script." },
                                actual: { type: Type.STRING, description: "What the user said instead." }
                            }
                        }
                    }
                },
                required: ['score', 'feedback', 'errors']
            },
            rhythm: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.NUMBER, description: "Score for rhythm from 0 to 100." },
                    feedback: { type: Type.STRING, description: "Feedback on rhythm and pacing." }
                },
                required: ['score', 'feedback']
            },
            intonation: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.NUMBER, description: "Score for intonation from 0 to 100." },
                    feedback: { type: Type.STRING, description: "Feedback on intonation and expressiveness." }
                },
                required: ['score', 'feedback']
            },
            pauses: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.NUMBER, description: "Score for use of pauses from 0 to 100." },
                    feedback: { type: Type.STRING, description: "Feedback on pauses." }
                },
                required: ['score', 'feedback']
            },
            overallScore: { type: Type.NUMBER, description: "The average of the four scores." },
            suggestions: {
                type: Type.ARRAY,
                description: "A list of 2-3 key suggestions for improvement.",
                items: { type: Type.STRING }
            }
        },
        required: ['diction', 'rhythm', 'intonation', 'pauses', 'overallScore', 'suggestions']
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro", // Complex Text Tasks
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const jsonText = response.text.trim();
        const analysisResult = JSON.parse(jsonText);

        if (analysisResult && analysisResult.diction && typeof analysisResult.overallScore === 'number') {
            return analysisResult as AnalysisReport;
        } else {
            throw new Error("Invalid analysis format received from Gemini.");
        }

    } catch (error) {
        console.error("Error analyzing speech with Gemini:", error);
        return {
            diction: { score: 0, feedback: "Erro ao analisar a dicção.", errors: [] },
            rhythm: { score: 0, feedback: "Erro ao analisar o ritmo." },
            intonation: { score: 0, feedback: "Erro ao analisar a entonação." },
            pauses: { score: 0, feedback: "Erro ao analisar as pausas." },
            overallScore: 0,
            suggestions: ["Não foi possível analisar o desempenho devido a um erro na API. Por favor, tente novamente."],
        };
    }
};
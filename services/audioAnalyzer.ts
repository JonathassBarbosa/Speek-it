// Fix: This file was empty. Added a mock transcription service.
// MOCK IMPLEMENTATION: In a real app, this would use a speech-to-text API.
// This function simulates transcription based on the original text with some errors.
export const mockTranscribe = async (audioBlob: Blob, originalText: string): Promise<string> => {
    console.log("Mock transcription for blob:", audioBlob);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate some transcription errors
    const words = originalText.split(' ');
    let transcript = '';
    
    words.forEach(word => {
        const random = Math.random();
        if (random < 0.05) {
            // 5% chance to skip a word
            return;
        }
        if (random > 0.95) {
            // 5% chance to add a word
            transcript += word + ' ãh ';
        } else {
            transcript += word + ' ';
        }
    });

    if (Math.random() > 0.8) {
        transcript += ' algo a mais no final.';
    }

    return transcript.trim();
};
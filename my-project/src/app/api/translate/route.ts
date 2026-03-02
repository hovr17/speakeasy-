import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

const TRANSLATE_PROMPT = `You are a professional English-Russian dictionary. Given an English word and its context, provide translation and usage information.

Return a JSON object with this exact structure:
{
  "word": "the original word",
  "translation": "Russian translation",
  "transcription": "phonetic transcription like /wɜːrd/",
  "definition": "brief English definition",
  "examples": ["example sentence 1", "example sentence 2"]
}

Rules:
- translation must be in Russian
- transcription should use IPA format
- definition should be in English, concise (1 sentence)
- examples should be 2-3 sentences using the word naturally
- If the word is part of a phrase in context, translate it in that context
- Return ONLY valid JSON, no markdown or extra text`;

export async function POST(req: NextRequest) {
  try {
    const { word, context } = await req.json();

    if (!word) {
      return NextResponse.json(
        { error: 'Word is required' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: TRANSLATE_PROMPT },
        { role: 'user', content: `Word: "${word}"\nContext: "${context || 'No context provided'}"` }
      ],
      thinking: { type: 'disabled' }
    });

    const responseText = completion.choices[0]?.message?.content || '';
    
    // Parse JSON response
    let result;
    try {
      let jsonStr = responseText;
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      result = JSON.parse(jsonStr);
    } catch {
      // Fallback if parsing fails
      result = {
        word,
        translation: 'Перевод недоступен',
        transcription: '',
        definition: 'Translation temporarily unavailable',
        examples: [],
      };
    }

    return NextResponse.json({
      success: true,
      translation: result,
    });
  } catch (error) {
    console.error('Translate Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Translation failed' },
      { status: 500 }
    );
  }
}

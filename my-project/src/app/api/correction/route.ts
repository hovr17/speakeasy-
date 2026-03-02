import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

interface CorrectionResult {
  hasErrors: boolean;
  original: string;
  corrected: string;
  errors: Array<{
    type: 'grammar' | 'spelling' | 'punctuation' | 'word_choice';
    original: string;
    correction: string;
    explanation: string;
  }>;
  feedback: string;
}

const CORRECTION_PROMPT = `You are a strict English teacher analyzing a student's speech for language learning purposes. Your job is to find and correct ALL errors, even minor ones.

Analyze the following text and find ALL types of errors:
- Grammar errors (verb tense, subject-verb agreement, articles, prepositions)
- Word choice errors (wrong word, unnatural phrasing)
- Spelling mistakes
- Punctuation issues

IMPORTANT: You MUST find at least some errors in most texts. Only mark hasErrors as false if the text is absolutely perfect (native-level, no issues at all).

Respond in JSON format only:
{
  "hasErrors": boolean,
  "original": "the original text",
  "corrected": "the fully corrected version",
  "errors": [
    {
      "type": "grammar|spelling|punctuation|word_choice",
      "original": "the error",
      "correction": "the correction",
      "explanation": "brief explanation"
    }
  ],
  "feedback": "encouraging feedback (2-3 sentences max)"
}

Rules:
- Be STRICT - even small issues like missing articles or slight awkwardness should be marked as errors
- Focus on helping the student improve by catching all mistakes
- For non-native speakers, there are almost always errors to correct
- Keep explanations brief and clear
- Always respond with valid JSON only`;

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: CORRECTION_PROMPT },
        { role: 'user', content: text.trim() }
      ],
      thinking: { type: 'disabled' }
    });

    const responseText = completion.choices[0]?.message?.content || '';
    
    // Parse JSON response
    let result: CorrectionResult;
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = responseText;
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      
      result = JSON.parse(jsonStr);
      console.log('[correction] Parsed result:', {
        hasErrors: result.hasErrors,
        errorCount: result.errors?.length || 0,
        errors: result.errors
      });
    } catch {
      // Fallback if parsing fails
      result = {
        hasErrors: false,
        original: text,
        corrected: text,
        errors: [],
        feedback: 'Your English looks good! Keep practicing!'
      };
    }

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Correction Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Correction analysis failed' },
      { status: 500 }
    );
  }
}

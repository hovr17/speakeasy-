import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

interface ErrorItem {
  original: string;
  correction: string;
  type: string;
  explanation: string;
}

interface SessionStatsInput {
  speakingMinutes: number;
  userMessageCount: number;
  totalErrors: number;
  errorsPerMinute: number;
  errorTypes: {
    grammar: number;
    spelling: number;
    punctuation: number;
    word_choice: number;
  };
  totalWordsSpoken: number;
  mostCommonErrors: Array<{
    original: string;
    correction: string;
    type: string;
    explanation: string;
    count: number;
  }>;
  dominantErrorType: [string, number];
  errorsList: ErrorItem[];
  calculatedScore: number;
}

interface ConversationSummary {
  overallFeedback: string;
  strengths: string[];
  areasToImprove: string[];
  grammarTips: string[];
  vocabulary: Array<{
    word: string;
    definition: string;
    example: string;
  }>;
  topicWords: Array<{
    word: string;
    definition: string;
    example: string;
  }>;
  overallScore: number;
  sessionStats: {
    speakingMinutes: number;
    userMessageCount: number;
    totalErrors: number;
    errorsPerMinute: number;
    errorTypes: {
      grammar: number;
      spelling: number;
      punctuation: number;
      word_choice: number;
    };
    totalWordsSpoken: number;
    mostCommonErrors: Array<{
      original: string;
      correction: string;
      type: string;
      explanation: string;
      count: number;
    }>;
    dominantErrorType: [string, number];
    improvementTips: Array<{
      errorType: string;
      description: string;
      tips: string[];
      examples: Array<{ wrong: string; correct: string }>;
    }>;
  };
}

const SUMMARY_PROMPT = `You are an expert English teacher analyzing a student's conversation. Analyze the following conversation between a student learning English and an AI tutor.

The conversation consists of multiple exchanges. Focus ONLY on the student's messages (marked as "Student:") for your analysis.

Provide a comprehensive analysis in JSON format:

{
  "overallFeedback": "2-3 sentences summarizing the student's performance",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "areasToImprove": ["area 1", "area 2", "area 3"],
  "grammarTips": ["tip 1", "tip 2"],
  "vocabulary": [
    {
      "word": "word from student's speech that could be improved",
      "definition": "brief definition",
      "example": "example sentence using the word correctly"
    }
  ],
  "topicWords": [
    {
      "word": "relevant vocabulary word related to the conversation topic",
      "definition": "brief definition",
      "example": "example sentence"
    }
  ]
}

Rules:
- strengths: 2-3 things the student did well
- areasToImprove: 2-3 specific areas needing work
- grammarTips: 1-2 specific grammar tips based on mistakes noticed
- vocabulary: 3-5 words from student's speech that could be used better (with corrections)
- topicWords: 10-15 vocabulary words related to the conversation topic that would be useful to learn
- Be encouraging but honest in feedback
- Always respond with valid JSON only`;

function generateImprovementTips(
  errorTypes: SessionStatsInput['errorTypes'],
  mostCommonErrors: SessionStatsInput['mostCommonErrors'],
  dominantErrorType: [string, number]
): ConversationSummary['sessionStats']['improvementTips'] {
  const tips: ConversationSummary['sessionStats']['improvementTips'] = [];

  // Grammar tips
  if (errorTypes.grammar > 0) {
    const grammarExamples = mostCommonErrors
      .filter(e => e.type === 'grammar')
      .slice(0, 2)
      .map(e => ({ wrong: e.original, correct: e.correction }));

    tips.push({
      errorType: 'grammar',
      description: 'Focus on sentence structure and verb forms',
      tips: [
        'Pay attention to subject-verb agreement',
        'Check verb tenses - make sure they match the timeframe you\'re describing',
        'Read more English texts to internalize correct sentence structures'
      ],
      examples: grammarExamples.length > 0 ? grammarExamples : [
        { wrong: 'She go to school', correct: 'She goes to school' }
      ]
    });
  }

  // Word choice tips
  if (errorTypes.word_choice > 0) {
    const wordChoiceExamples = mostCommonErrors
      .filter(e => e.type === 'word_choice')
      .slice(0, 2)
      .map(e => ({ wrong: e.original, correct: e.correction }));

    tips.push({
      errorType: 'word_choice',
      description: 'Expand your vocabulary and use words more precisely',
      tips: [
        'Keep a vocabulary journal with synonyms and context',
        'Look up words you\'re unsure about before using them',
        'Practice using new words in sentences'
      ],
      examples: wordChoiceExamples.length > 0 ? wordChoiceExamples : [
        { wrong: 'I made a photo', correct: 'I took a photo' }
      ]
    });
  }

  // Spelling tips
  if (errorTypes.spelling > 0) {
    tips.push({
      errorType: 'spelling',
      description: 'Work on spelling accuracy',
      tips: [
        'Use spell-check tools and note your common mistakes',
        'Learn spelling rules (like "i before e except after c")',
        'Practice writing tricky words multiple times'
      ],
      examples: []
    });
  }

  // Punctuation tips
  if (errorTypes.punctuation > 0) {
    tips.push({
      errorType: 'punctuation',
      description: 'Improve punctuation usage',
      tips: [
        'Review basic punctuation rules for commas and periods',
        'Read sentences aloud to hear natural pauses',
        'Practice writing sentences with correct punctuation'
      ],
      examples: []
    });
  }

  // Sort by error count
  tips.sort((a, b) => {
    const aCount = errorTypes[a.errorType as keyof typeof errorTypes] || 0;
    const bCount = errorTypes[b.errorType as keyof typeof errorTypes] || 0;
    return bCount - aCount;
  });

  return tips.slice(0, 3); // Return top 3 tips
}

export async function POST(req: NextRequest) {
  try {
    const { conversation, stats } = await req.json() as { 
      conversation: Array<{ role: string; content: string }>;
      stats: SessionStatsInput;
    };

    if (!conversation || conversation.length === 0) {
      return NextResponse.json(
        { error: 'Conversation is required' },
        { status: 400 }
      );
    }

    // Format conversation for analysis
    const formattedConversation = conversation
      .map((msg) => 
        `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.content}`
      )
      .join('\n\n');

    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: SUMMARY_PROMPT },
        { role: 'user', content: `Analyze this conversation:\n\n${formattedConversation}` }
      ],
      thinking: { type: 'disabled' }
    });

    const responseText = completion.choices[0]?.message?.content || '';
    
    // Parse JSON response
    let baseResult;
    try {
      let jsonStr = responseText;
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      
      baseResult = JSON.parse(jsonStr);
    } catch {
      baseResult = {
        overallFeedback: 'Thank you for the conversation! You did a great job practicing your English.',
        strengths: ['Good effort in expressing your thoughts', 'Active participation in the conversation'],
        areasToImprove: ['Continue practicing regularly', 'Try to expand your vocabulary'],
        grammarTips: ['Keep practicing verb tenses'],
        vocabulary: [],
        topicWords: [
          { word: 'practice', definition: 'to do something regularly to improve', example: 'I practice English every day.' },
          { word: 'conversation', definition: 'a talk between two or more people', example: 'We had a nice conversation.' }
        ]
      };
    }

    // Generate improvement tips based on error stats
    const improvementTips = stats ? generateImprovementTips(
      stats.errorTypes,
      stats.mostCommonErrors,
      stats.dominantErrorType
    ) : [];

    // Build complete result with stats
    const result: ConversationSummary = {
      ...baseResult,
      overallScore: stats?.calculatedScore || 70,
      sessionStats: stats ? {
        speakingMinutes: stats.speakingMinutes,
        userMessageCount: stats.userMessageCount,
        totalErrors: stats.totalErrors,
        errorsPerMinute: stats.errorsPerMinute,
        errorTypes: stats.errorTypes,
        totalWordsSpoken: stats.totalWordsSpoken,
        mostCommonErrors: stats.mostCommonErrors,
        dominantErrorType: stats.dominantErrorType,
        improvementTips,
        calculatedScore: stats.calculatedScore,
      } : undefined,
    };

    return NextResponse.json({
      success: true,
      summary: result
    });
  } catch (error) {
    console.error('Summary Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Summary generation failed' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are SpeakEasy AI, a friendly and patient English conversation partner. Your role is to:

1. Have natural, engaging conversations in English
2. Keep responses concise (2-3 sentences max) to maintain dialogue flow
3. Be encouraging and supportive
4. Gently correct major mistakes by rephrasing correctly in your response
5. Ask follow-up questions to keep the conversation going
6. Adapt to the user's English level

Start conversations casually and make the user feel comfortable practicing. If they make mistakes, don't explicitly point them out - just model correct English in your response.`;

// Store conversations in memory (use database in production)
const conversations = new Map<string, Message[]>();

export async function POST(req: NextRequest) {
  try {
    const { sessionId, message } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    // Get or create conversation history
    let history = conversations.get(sessionId) || [];
    
    const messages: { role: 'assistant' | 'user'; content: string }[] = [
      { role: 'assistant', content: SYSTEM_PROMPT },
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' }
    });

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, I could not process your message. Could you please try again?';

    // Update history
    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: aiResponse });
    
    // Keep only last 20 messages to avoid token limits
    if (history.length > 20) {
      history = history.slice(-20);
    }
    
    conversations.set(sessionId, history);

    return NextResponse.json({
      success: true,
      response: aiResponse,
    });
  } catch (error) {
    console.error('Chat Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Chat failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  
  if (sessionId) {
    conversations.delete(sessionId);
  }
  
  return NextResponse.json({ success: true });
}

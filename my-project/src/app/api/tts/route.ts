import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(req: NextRequest) {
  try {
    const { text, voice = 'jam', speed = 1.0 } = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Split text if too long (max 1024 chars)
    const maxLength = 1000;
    const chunks: string[] = [];
    
    if (text.length > maxLength) {
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      let currentChunk = '';
      
      for (const sentence of sentences) {
        if ((currentChunk + sentence).length <= maxLength) {
          currentChunk += sentence;
        } else {
          if (currentChunk) chunks.push(currentChunk.trim());
          currentChunk = sentence;
        }
      }
      if (currentChunk) chunks.push(currentChunk.trim());
    } else {
      chunks.push(text.trim());
    }

    const zai = await ZAI.create();
    
    // Process first chunk for now (for longer text, concatenate audio)
    const response = await zai.audio.tts.create({
      input: chunks[0],
      voice: voice,
      speed: speed,
      response_format: 'wav',
      stream: false,
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('TTS Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Text-to-speech failed' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(req: NextRequest) {
  try {
    const { audioBase64 } = await req.json();

    if (!audioBase64) {
      return NextResponse.json(
        { success: false, error: 'No audio data provided' },
        { status: 400 }
      );
    }

    // Validate base64 data
    if (typeof audioBase64 !== 'string' || audioBase64.length < 100) {
      return NextResponse.json(
        { success: false, error: 'Audio data is too short or invalid' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const response = await zai.audio.asr.create({
      file_base64: audioBase64,
    });

    // Check if we got a valid response
    if (!response || !response.text) {
      return NextResponse.json(
        { success: false, error: 'No speech detected. Please try speaking louder or closer to the microphone.' },
        { status: 200 }
      );
    }

    const text = response.text.trim();
    
    // Check if the transcribed text is meaningful
    if (text.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Could not understand the audio. Please try again.' },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      text: text,
    });
  } catch (error) {
    console.error('ASR Error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Speech recognition failed. Please try again.';
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = 'Speech recognition timed out. Please try a shorter recording.';
      } else if (error.message.includes('size') || error.message.includes('large')) {
        errorMessage = 'Audio file is too large. Please record a shorter message (max 60 seconds).';
      } else if (error.message.includes('format')) {
        errorMessage = 'Audio format not supported. Please try again.';
      } else if (error.message.includes('network') || error.message.includes('connection')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

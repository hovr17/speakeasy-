// Dictionary Words API - v2
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Get all dictionary words (optionally filtered by category)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');

    const where = categoryId ? { categoryId } : {};

    const words = await prisma.dictionary.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      words,
    });
  } catch (error) {
    console.error('Dictionary GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch words' },
      { status: 500 }
    );
  }
}

// POST - Add a new word to dictionary
export async function POST(req: NextRequest) {
  try {
    const { word, translation, definition, example, categoryId } = await req.json();

    if (!word || !translation) {
      return NextResponse.json(
        { error: 'Word and translation are required' },
        { status: 400 }
      );
    }

    // Check if word already exists
    const existing = await prisma.dictionary.findUnique({
      where: { word: word.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Word already exists in dictionary', success: false },
        { status: 400 }
      );
    }

    const newWord = await prisma.dictionary.create({
      data: {
        word: word.toLowerCase(),
        translation,
        definition: definition || null,
        example: example || null,
        categoryId: categoryId || null,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      word: newWord,
    });
  } catch (error) {
    console.error('Dictionary POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to add word' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a word from dictionary
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Word ID is required' },
        { status: 400 }
      );
    }

    await prisma.dictionary.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Dictionary DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete word' },
      { status: 500 }
    );
  }
}

// PUT - Update a word (e.g., change category)
export async function PUT(req: NextRequest) {
  try {
    const { id, categoryId } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Word ID is required' },
        { status: 400 }
      );
    }

    const word = await prisma.dictionary.update({
      where: { id },
      data: {
        categoryId: categoryId === 'none' ? null : categoryId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      word,
    });
  } catch (error) {
    console.error('Dictionary PUT Error:', error);
    return NextResponse.json(
      { error: 'Failed to update word' },
      { status: 500 }
    );
  }
}

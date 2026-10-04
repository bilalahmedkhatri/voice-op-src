import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth/googleAuth';
import { isDatabaseEnabled } from '@/app/lib/config';
import { verifyCreditBalance, deductCredits } from '@/app/lib/credits';

// POST /api/facebook/generate-caption - AI Caption & Hashtags Generator (Cost: 1 Credit)
export async function POST(request: NextRequest) {
  try {
    const isDb = isDatabaseEnabled();
    let user = null;

    if (isDb) {
      user = await getCurrentUser();
      if (!user) {
        return NextResponse.json(
          { error: 'Please sign in to generate AI captions.' },
          { status: 401 }
        );
      }

      // 1. Strict Balance Verification (Cost: 1 Credit)
      const creditCheck = await verifyCreditBalance(user.id, 'caption_generation');
      if (!creditCheck.ok) {
        return NextResponse.json(
          {
            error: creditCheck.error,
            code: 'INSUFFICIENT_CREDITS',
            requiredCredits: creditCheck.requiredCredits,
            availableCredits: creditCheck.availableCredits,
            tier: creditCheck.tier,
          },
          { status: 402 }
        );
      }
    }

    const body = await request.json();
    const { topic = '', postType = 'reel', tone = 'engaging' } = body;

    const cleanTopic = (topic || 'Inspiring Content').trim();

    // 2. Generate viral caption and hashtags
    let caption = '';

    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;
    if (geminiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are a viral social media growth expert. Write an engaging, high-retention caption with strong hook, concise body, call-to-action, and 5-8 trending hashtags for a ${postType} about: "${cleanTopic}". Tone: ${tone}. Output ONLY the caption and hashtags without extra commentary.`,
                    },
                  ],
                },
              ],
            }),
          }
        );
        const data = await response.json();
        const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generatedText) {
          caption = generatedText.trim();
        }
      } catch (aiErr) {
        console.warn('Gemini API call failed, falling back to smart template engine:', aiErr);
      }
    }

    // High-retention fallback template generator if API key is not present or failed
    if (!caption) {
      const hooks = [
        `🔥 The secret behind ${cleanTopic} that nobody talks about...`,
        `💡 Stop scrolling if you want to master ${cleanTopic}!`,
        `✨ Here is what you need to know about ${cleanTopic} today:`,
        `🚀 Want to level up? Watch how ${cleanTopic} changes everything!`,
      ];
      const selectedHook = hooks[Math.floor(Math.random() * hooks.length)];
      caption = `${selectedHook}\n\nConsistency and strategy are what truly matter. Save this post for later and share with someone who needs to see this! 👇\n\n#Viral #ContentCreator #GrowthMindset #Trending #${cleanTopic.replace(/[^a-zA-Z0-9]/g, '') || 'Reels'}`;
    }

    // 3. Atomically Deduct 1 Credit
    let remainingCredits = 50;
    if (isDb && user) {
      const deductResult = await deductCredits(user.id, 'caption_generation', {
        description: `AI Caption: "${cleanTopic.slice(0, 30)}..."`,
        metadata: {
          topic: cleanTopic,
          postType,
          tone,
        },
      });
      remainingCredits = deductResult.balanceAfter;
    }

    return NextResponse.json({
      success: true,
      caption,
      credits_deducted: 1,
      remaining_credits: remainingCredits,
    });
  } catch (error: any) {
    console.error('Error generating AI caption:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate AI caption.' },
      { status: 500 }
    );
  }
}

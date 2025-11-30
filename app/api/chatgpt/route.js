import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request) {
  const raw = await request.text();
  if (!raw || !raw.trim()) {
    return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
  }

  let message;
  try {
    const body = JSON.parse(raw);
    message = body?.message;
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'Please provide a message string.' }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY not configured on the server.' },
      { status: 500 }
    );
  }

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a concise teaching aide for a solar-system and wayfinding simulator. Keep answers short and classroom-friendly.'
        },
        { role: 'user', content: message }
      ],
      temperature: 0.5,
      max_tokens: 256
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || '';
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('ChatGPT route error', error);
    return NextResponse.json({ error: 'Unable to contact ChatGPT right now.' }, { status: 502 });
  }
}

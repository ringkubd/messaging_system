import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    if (!message) return NextResponse.json({ response: 'Please provide a message.' }, { status: 400 });

    const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    const model = process.env.OLLAMA_MODEL || 'llama3.2:1b';

    const systemPrompt = `You are an AI assistant for the ISDB-BISEW Scholarship Community Platform. Answer questions about scholarships, events, jobs, alumni, and platform features. Be concise and helpful.`;

    const res = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: `${systemPrompt}\n\nUser: ${message}\n\nAssistant:`,
        stream: false,
        options: { temperature: 0.1, max_tokens: 500 },
      }),
    });

    if (!res.ok) throw new Error('Ollama request failed');

    const data = await res.json();
    return NextResponse.json({ response: data.response?.trim() || 'No response generated.' });
  } catch (error) {
    console.error('Chatbot error:', error);
    return NextResponse.json({ response: 'I apologize, but I\'m having trouble connecting to the AI service. Please try again later.' });
  }
}

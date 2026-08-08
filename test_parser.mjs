import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const { buildSystemPrompt } = await import('./api/lib/groq');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function test() {
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: 'hi' },
      ],
      temperature: 0.1,
      max_tokens: 300,
    });
    console.log("Raw hi response (8b):\n", completion.choices[0]?.message?.content);
  } catch (err) {
    console.error("Failed 8b:", err.message);
  }
}
test();

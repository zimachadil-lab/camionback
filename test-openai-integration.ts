import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

console.log('=== Testing OpenAI Integration ===');
console.log('Base URL:', process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ? 'SET' : 'NOT SET');
console.log('API Key:', process.env.AI_INTEGRATIONS_OPENAI_API_KEY ? 'SET' : 'NOT SET');
console.log('');

async function testSimpleCall() {
  try {
    console.log('Making test call to GPT-5...');
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: "You are a helpful assistant. Respond in JSON format." },
        { role: "user", content: "Return a JSON object with a greeting message" }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 100
    });
    
    console.log('SUCCESS!');
    console.log('Response:', JSON.stringify(response, null, 2));
    console.log('');
    console.log('Content:', response.choices[0]?.message?.content);
  } catch (error: any) {
    console.error('FAILED!');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
  }
}

testSimpleCall();

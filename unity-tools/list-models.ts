import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyCj0YNNIlF6_BEg8UrhUxVMZAeII62lfyg';
const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    console.log('🔍 Fetching available models...\n');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();

    if (data.models) {
      console.log('✅ Available models:\n');
      data.models.forEach((model: any) => {
        const modelName = model.name.split('/')[1];
        console.log(`  - ${modelName}`);
        if (model.displayName) console.log(`    Display: ${model.displayName}`);
        if (model.supportedGenerationMethods) {
          console.log(`    Methods: ${model.supportedGenerationMethods.join(', ')}`);
        }
        console.log('');
      });
    } else {
      console.log('❌ Error:', JSON.stringify(data.error, null, 2));
    }
  } catch (error) {
    console.error('❌ Failed to list models:', error);
  }
}

listModels();

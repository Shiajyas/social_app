import axios from 'axios';

export async function analyzeSentiment(text: string) {
  const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;  // Set this in your .env file

  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/ProsusAI/finbert',
      { inputs: text },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
        },
      }
    );

    const result = response.data;
    // console.log('Sentiment Analysis Result:', result);
    return result;
  } catch (error : any) {
    console.error('Sentiment API Error:', error.response?.data || error.message);
    return null;
  }
}

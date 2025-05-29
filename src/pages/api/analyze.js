// pages/api/analyze.js
import formidable from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { OpenAI } from 'openai';

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  console.log('=== API ROUTE CALLED ===');
  console.log('Method:', req.method);

  if (req.method !== 'POST') {
    console.log('Wrong method, returning 405');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    const [fields, files] = await form.parse(req);
    let pdfFile = files.pdf;

    if (Array.isArray(pdfFile)) {
      pdfFile = pdfFile[0];
    }

    if (!pdfFile) {
      console.error('No PDF file found');
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const filePath = pdfFile.filepath || pdfFile.path;
    if (!filePath) {
      console.error('No file path found');
      return res.status(400).json({ error: 'No file path available' });
    }

    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);

    // Delete temp file
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.warn('Could not clean up temp file:', err.message);
    }

    const extractedText = data.text.slice(0, 3000); // limit to ~3000 chars

    const prompt = `
You are a financial analyst. Based on the following bank statement text:

- Summarize the user's investment and spending patterns
- Highlight any unusual trends or large transactions
- Suggest how the user can optimize their portfolio
- Compare performance to general market trends (e.g., NIFTY/SENSEX)
- Provide actionable tips for improvement

BANK STATEMENT TEXT:
${extractedText}
`;

    const chat = await openai.chat.completions.create({
      model: "gpt-4", // use "gpt-3.5-turbo" if you don't have GPT-4 access
      messages: [
        { role: "system", content: "You are an expert financial advisor." },
        { role: "user", content: prompt },
      ],
    });

    const summary = chat.choices[0].message.content;

    return res.status(200).json({
      summary,
      filename: pdfFile.originalFilename,
      pages: data.numpages,
      textLength: data.text.length,
    });

  } catch (error) {
    console.error('=== ERROR IN API ROUTE ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    return res.status(500).json({
      error: 'Server error processing PDF',
      message: error.message,
      type: error.constructor.name,
    });
  }
}

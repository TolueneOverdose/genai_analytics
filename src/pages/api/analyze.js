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

    

  
  console.log("Extracted PDF text (first 500 chars):", data.text.slice(0, 500));

  const prompt2 = `
You are a financial assistant.

From the following raw bank statement text, extract all **financial transactions** in this JSON format:

[
  {
    "date": "DD/MM/YYYY",
    "description": "Some merchant or reason",
    "amount": -1234.56
  },
  ...
]

Only include lines that clearly represent financial activity.
Use negative values for debits and positive for credits.

Text:
${data.text}
`;

const completion = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [
    {
      role: "user",
      content: prompt2
    }
  ],
  temperature: 0.2,
});

const aiText = completion.choices[0]?.message?.content || "";

let transactions = [];
try {
  const jsonStart = aiText.indexOf("[");
  const jsonEnd = aiText.lastIndexOf("]");
  const json = aiText.substring(jsonStart, jsonEnd + 1);
  transactions = JSON.parse(json);
} catch (err) {
  console.warn("Failed to parse transactions:", err.message);
}

function summarizeCategories(transactions) {
  const summary = {};

  for (const txn of transactions) {
    const cat = txn.category;
    if (!summary[cat]) summary[cat] = 0;
    summary[cat] += txn.amount;
  }

  return Object.entries(summary).map(([category, total]) => ({
    category,
    amount: Math.abs(total),
  }));
}

const categorySummary = summarizeCategories(transactions);




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
- Provide actionable tips and ideas for improvement

BANK STATEMENT TEXT:
${extractedText}
`;

    const chat = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // use "gpt-3.5-turbo" if you don't have GPT-4 access
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
      transactions,
      categorySummary
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

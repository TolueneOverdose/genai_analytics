import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError(null);
    setResult(null);
    
    // Validate file type and size
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Please select a PDF file');
        setFile(null);
        return;
      }
      
      // Check file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        setFile(null);
        return;
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please upload a PDF first");
      return;
    }
    
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("pdf", file);
    
    try {
      console.log('Uploading file:', file.name, 'Size:', file.size);
      
      const response = await axios.post("/api/analyze", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });
      
      console.log('Upload successful:', response.data);
      setResult(response.data);
      
    } catch (error) {
      console.error("Upload failed:", error);
      
      let errorMessage = "Failed to analyze PDF";
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = "Request timed out - file may be too large";
      } else if (error.response?.status === 413) {
        errorMessage = "File too large";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold mb-4">Bank Statement Analyzer</h1>

        <div className="mb-4">
          <input 
            type="file" 
            accept="application/pdf,.pdf" 
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <button
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          onClick={handleUpload}
          disabled={loading || !file}
        >
          {loading ? "Processing..." : "Upload & Analyze"}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Analysis Results</h2>
            <div className="mb-2 text-sm text-gray-600">
              PDF Info: {result.pages} pages, {result.textLength} characters extracted
            </div>
            <div className="p-4 bg-gray-50 rounded border">
              <pre className="whitespace-pre-wrap text-sm">{result.summary}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



/********************************************************************************************************************************************************************************************************************************/
/********************************************************************************************************************************************************************************************************************************/
/*******************************************************************************************************************************************************************************************************************************
    if (!pdfFile || !pdfFile.filepath) {
      return res.status(400).json({ error: 'No PDF uploaded or filepath missing' });
    }

    const dataBuffer = await fs.readFile(pdfFile.filepath);
    const data = await pdfParse(dataBuffer);
    const text = data.text;

    // Trim to safe token length
    const shortText = text.substring(0, 3000);

    const prompt = `
You are a financial analyst. Analyze the following bank statement text and:
- Summarize the investment performance
- Highlight good/bad spending habits
- Suggest ways to optimize the portfolio
- Mention any market trends to consider

BANK STATEMENT TEXT:
${shortText}
`;

    const chat = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an expert financial advisor." },
        { role: "user", content: prompt },
      ],
    });

    const summary = chat.choices[0].message.content;

    res.status(200).json({ summary });
  } catch (e) {
    console.error("API error:", e);
    res.status(500).json({ error: 'Failed to parse or analyze PDF' });
  }
}
******************************************************************************************************************************************************************************************************************************/
/****************************************************************************************************************/
/********************************************************************************************************************************************************************************************************************************/
  
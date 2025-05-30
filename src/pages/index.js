// src/pages/index.js
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import axios from "axios";

export default function Home() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("pdf", file);
    setLoading(true);
    setResult(null);
    console.log("Uploading file to /api/analyze...");
    try {
      const response = await axios.post("/api/analyze", formData);
      setResult(response.data);
    } catch (error) {
      console.error("API error:", error);
      setResult({ summary: "Failed to process file. Please try again." });
    } finally {
      setLoading(false);
    }
  };

 const realChartData = result?.categorySummary || [];
// console.log("Chart Data:", result?.categorySummary);
 //console.log("TransactionalData:: ", result?.transactions.length);


  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>📄 Bank Statement Analyzer</h1>
      <form onSubmit={handleUpload}>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button type="submit" disabled={!file} style={{ marginLeft: "1rem" }}>
          Analyze
        </button>
      </form>

      {loading && <p>Processing PDF... ⏳</p>}
      <h3 style={{ marginTop: "2rem" }}>📈 Portfolio Breakdown</h3>

      {result && (
        <div style={{ marginTop: "2rem" }}>
          <h2>📊 Insights for: {result.filename}</h2>
          <p><strong>Pages:</strong> {result.pages}</p>
          <p><strong>Text Length:</strong> {result.textLength} characters</p>
          <div style={{ whiteSpace: "pre-wrap", marginTop: "1rem", background: "#f5f5f5", padding: "1rem", borderRadius: "8px" }}>
            {result.summary}
          </div>
        </div>
        
      )}
      <div style={{ width: "100%", height: 300 }}>
  <ResponsiveContainer>
    <BarChart data={realChartData}>
      
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="category" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="amount" fill="#8884d8" />
    </BarChart>
  </ResponsiveContainer>
</div>
{result && result.transactions && result.transactions.length > 0 && (
  <div style={{ marginTop: "2rem" }}>
    <h3>📅 Extracted Transactions</h3>
    <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", marginTop: "1rem" }}>
      <thead>
        <tr>
          <th>Date</th>
          <th>Description</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        {result.transactions.map((txn, index) => (
          <tr key={index}>
            <td>{txn.date}</td>
            <td>{txn.description}</td>
            <td
              style={{
                color: txn.amount < 0 ? "red" : "green",
                fontWeight: "bold",
              }}
            >
              ₹{txn.amount.toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

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
  
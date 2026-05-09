require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.MY_API_KEY;
const GROQ_MODEL   = "llama-3.3-70b-versatile";  
const GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions";

app.post('/api/chat', async (req, res) => {
    const { messages } = req.body; 

    if (!GROQ_API_KEY) {
        return res.status(500).json({ error: "Server missing API Key." });
    }

    try {
        const groqResponse = await fetch(GROQ_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: messages,
                max_tokens: 512,
                temperature: 0.7
            })
        });

        if (!groqResponse.ok) {
            const err = await groqResponse.json().catch(() => ({}));
            throw new Error(err?.error?.message || `HTTP ${groqResponse.status}`);
        }

        const data = await groqResponse.json();
        res.json(data); // Send Groq's reply back to your frontend

    } catch (error) {
        console.error("[Backend Error]", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('Secure backend server running on http://localhost:3000');
});
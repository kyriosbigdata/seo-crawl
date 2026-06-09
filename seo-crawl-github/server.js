require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // ← pega tu key aquí

app.post('/api/analyze', async (req, res) => {
    try {
        const { prompt } = req.body;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                max_tokens: 1000,
                messages: [{ role: 'user', content: prompt }]
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('OpenAI error:', response.status, err);
            return res.status(response.status).json({ error: err });
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        console.log('Análisis generado correctamente');
        res.json({ analysis: text });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(3001, () => {
    console.log('Servidor IA corriendo en http://localhost:3001');
});
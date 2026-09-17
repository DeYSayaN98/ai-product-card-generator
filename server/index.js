import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

app.post("/api/generate", async (req, res) => {
  const { productName, category } = req.body;

  if (!productName || !productName.trim()) {
    return res.status(400).json({ error: "Product name is required." });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: "Server is missing GROQ_API_KEY." });
  }

  const cleanName = productName.trim().slice(0, 120);
  const cleanCategory = (category || "").trim().slice(0, 80);

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a product copywriter. Do not explain your reasoning. " +
            "Respond with ONLY a compact JSON object, no other text, with exactly these keys: " +
            '"title" (catchy product title, under 60 characters), ' +
            '"description" (2-3 sentence product description), ' +
            '"tags" (array of 4-6 short lowercase keywords).',
        },
        {
          role: "user",
          content: `Product name: ${cleanName}\nCategory: ${cleanCategory || "general"}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1024,
      reasoning_effort: "low",
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "{}";
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(502).json({ error: "AI returned an unexpected format. Try again." });
    }

    const { title, description, tags } = parsed;

    if (!title || !description || !Array.isArray(tags)) {
      return res.status(502).json({ error: "AI response was missing required fields. Try again." });
    }

    res.json({
      title: String(title).slice(0, 120),
      description: String(description).slice(0, 500),
      tags: tags.slice(0, 6).map((t) => String(t).toLowerCase().slice(0, 30)),
      productName: cleanName,
      category: cleanCategory,
    });
  } catch (err) {
    console.error("Generate error:", err.message);
    res.status(500).json({ error: "Failed to generate product details. " + err.message });
  }
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

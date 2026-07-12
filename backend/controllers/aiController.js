// Fallback chain — if one free model fails/times out, try the next
const MODEL_CHAIN = [
  'openrouter/free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'qwen/qwen3-coder:free',
  'openai/gpt-oss-20b:free'
];

const SYSTEM_PROMPT = `You are an AI issue triage assistant for a maintenance management platform.
Convert the user's natural-language complaint into structured JSON only — no markdown, no extra text.
Return exactly this shape:
{
  "title": "short professional issue title",
  "category": "short category",
  "priority": "Low" | "Medium" | "High" | "Critical",
  "possibleCauses": ["cause 1", "cause 2"],
  "initialChecks": ["safe check 1", "safe check 2"],
  "recurringWarning": "short note if this looks like a recurring pattern, else empty string"
}
Rules:
- Never give unsafe electrical, mechanical, fire, or medical instructions.
- For anything involving live electricity, gas, fire risk, or structural safety, set priority to "High" or "Critical" and explicitly recommend a qualified technician in initialChecks.
- Output ONLY the JSON object, nothing else.`;

const callModel = async (model, assetContext, complaint) => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Asset context: ${assetContext}\n\nComplaint: ${complaint}` }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Model ${model} failed with status ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error(`Model ${model} returned no content`);

  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
};

const aiTriage = async (req, res) => {
  try {
    const { assetType, assetCondition, assetLocation, recentHistory, complaint } = req.body;

    if (!complaint) {
      return res.status(400).json({ message: 'complaint is required' });
    }

    const assetContext = `Type: ${assetType || 'unknown'}, Condition: ${assetCondition || 'unknown'}, Location: ${assetLocation || 'unknown'}, Recent history: ${recentHistory || 'none'}`;

    let result = null;
    let lastError = null;

    for (const model of MODEL_CHAIN) {
      try {
        result = await callModel(model, assetContext, complaint);
        break;
      } catch (err) {
        lastError = err;
        continue;
      }
    }

    if (!result) {
      return res.status(200).json({
        aiUnavailable: true,
        message: 'AI suggestion unavailable right now — please fill the fields manually',
        error: lastError?.message
      });
    }

    res.json({ aiUnavailable: false, ...result });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { aiTriage };

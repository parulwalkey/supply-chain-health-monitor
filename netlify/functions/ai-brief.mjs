const SYSTEM_PROMPT = `You are an AI decision-support assistant for a supply-chain/procurement analyst.

Your task is to explain supplier risk using ONLY the trusted Supplier Context JSON provided by the application.

RULES
1. Treat Aggregated_Supplier_Risk.Risk_Tier as deterministic system output. Repeat it exactly. Never recalculate, upgrade, downgrade, or contradict it.
2. Use only facts present in the Supplier Context. Never invent contracts, costs, demand, purchase orders, financial distress, SLA breaches, shutdowns, or supplier history.
3. Distinguish risk signals from healthy signals. A negative Avg_Lead_Time_Deviation means faster than the portfolio average; a positive value means slower than the portfolio average.
4. Delayed_Shipments is the SQL field name for SKUs with Lead_Time_Flag = 'Above Avg'. Do not describe these as contractual late deliveries unless contractual data is supplied.
5. Provide at most 3 top risk drivers. Every risk driver MUST include evidence copied or faithfully paraphrased from the supplied context.
6. Provide at most 3 recommended investigation or mitigation actions. Keep actions advisory and proportionate to the evidence.
7. Do not recommend automatic supplier termination, sourcing-volume changes, PO issuance, contract changes, or other consequential execution. These require human review.
8. If important information needed for a stronger conclusion is not supplied, state it in data_limitations instead of guessing.
9. human_review_required must always be true.
10. Return only output matching the required JSON schema.`

const OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'risk_tier',
    'summary',
    'top_risk_drivers',
    'healthy_signals',
    'recommended_actions',
    'data_limitations',
    'human_review_required',
  ],
  properties: {
    risk_tier: { type: 'string', enum: ['Low Risk', 'Medium Risk', 'High Risk'] },
    summary: { type: 'string' },
    top_risk_drivers: {
      type: 'array',
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['driver', 'evidence'],
        properties: {
          driver: { type: 'string' },
          evidence: { type: 'string' },
        },
      },
    },
    healthy_signals: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['signal', 'evidence'],
        properties: {
          signal: { type: 'string' },
          evidence: { type: 'string' },
        },
      },
    },
    recommended_actions: {
      type: 'array',
      maxItems: 3,
      items: { type: 'string' },
    },
    data_limitations: {
      type: 'array',
      items: { type: 'string' },
    },
    human_review_required: { type: 'boolean', const: true },
  },
}

function findOutputText(data) {
  for (const item of data.output || []) {
    if (item.type !== 'message') continue
    for (const content of item.content || []) {
      if (content.type === 'output_text' && content.text) return content.text
    }
  }
  return null
}

export default async (request) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const { context } = await request.json()
    if (!context) {
      return new Response(JSON.stringify({ error: 'Supplier context is required.' }), { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({
        error: 'OPENAI_API_KEY is not configured in Netlify environment variables.'
      }), { status: 503 })
    }

    const model = process.env.OPENAI_MODEL || 'gpt-5.6-luna'
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
          { role: 'developer', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Analyze this trusted Supplier Context JSON:\n${JSON.stringify(context, null, 2)}`,
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'supplier_risk_brief',
            strict: true,
            schema: OUTPUT_SCHEMA,
          },
        },
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      console.error('OpenAI error', data)
      return new Response(JSON.stringify({ error: 'The AI service could not generate a brief.' }), { status: 502 })
    }

    const text = findOutputText(data)
    if (!text) {
      return new Response(JSON.stringify({ error: 'No structured AI output was returned.' }), { status: 502 })
    }

    const parsed = JSON.parse(text)

    // Application-level guardrail: deterministic tier wins even if model output is unexpected.
    parsed.risk_tier = context.Aggregated_Supplier_Risk.Risk_Tier
    parsed.human_review_required = true

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: 'Unable to generate supplier risk brief.' }), { status: 500 })
  }
}

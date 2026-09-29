import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "Gemini API key not configured. Set GEMINI_API_KEY in your Supabase project secrets.",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const { schema } = body;

    if (!schema) {
      return new Response(
        JSON.stringify({ error: "Schema is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Build a compact schema description for Gemini
    const schemaDescription = buildSchemaDescription(schema);

    const prompt = `You are an expert data engineer analyzing a database schema for a synthetic data generation platform called SynthForge.

Analyze the following schema and return a JSON object with this exact structure:

{
  "summary": "A 1-2 sentence summary of the schema",
  "columns": [
    {
      "name": "column_name",
      "semanticType": "the detected semantic type (e.g. person_name, email, uuid, currency, date, integer, boolean, category, text, address, phone, age, decimal)",
      "role": "primary_key | foreign_key | attribute | metadata",
      "notes": "Brief note about this column's purpose and constraints"
    }
  ],
  "relationships": [
    {
      "from": "table.column",
      "to": "table.column",
      "type": "1:1 | 1:N | N:N",
      "description": "Description of the relationship"
    }
  ],
  "constraints": ["List of identified constraints"],
  "recommendations": [
    "5-10 realistic generation recommendations including appropriate distributions, realistic ranges, and data quality tips"
  ],
  "edgeCases": [
    {
      "column": "column_name",
      "type": "null | boundary | extreme | unusual_valid | rare_category",
      "description": "What edge case this represents",
      "example": "An example value"
    }
  ]
}

Provide 5-10 useful edge cases that would be important to test in synthetic data generation.

Schema to analyze:
${schemaDescription}

Return ONLY valid JSON, no markdown formatting or code fences.`;

    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      return new Response(
        JSON.stringify({ error: `Gemini API error (${geminiResponse.status}): ${errorText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const geminiData = await geminiResponse.json();
    const textContent = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      return new Response(
        JSON.stringify({ error: "Gemini returned an empty response." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Parse the JSON response from Gemini
    let parsed;
    try {
      parsed = JSON.parse(textContent);
    } catch {
      // Try to extract JSON from the text if it has surrounding markdown
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        return new Response(
          JSON.stringify({ error: "Failed to parse Gemini response as JSON." }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Validate and normalize the response
    const analysis = normalizeAnalysis(parsed);

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

function buildSchemaDescription(schema: any): string {
  const tables = Array.isArray(schema) ? schema : [schema];
  const lines: string[] = [];

  for (const table of tables) {
    lines.push(`TABLE: ${table.name}`);
    if (table.description) lines.push(`  Description: ${table.description}`);
    for (const col of table.columns) {
      const parts: string[] = [`  - ${col.name}: ${col.dataType}`];
      if (col.semanticType) parts.push(`(semantic: ${col.semanticType})`);
      if (col.primaryKey) parts.push("[PK]");
      if (col.foreignKey) parts.push(`[FK → ${col.foreignKey.table}.${col.foreignKey.column}]`);
      if (col.nullable) parts.push("[nullable]");
      if (col.unique) parts.push("[unique]");
      if (col.min !== undefined) parts.push(`[min: ${col.min}]`);
      if (col.max !== undefined) parts.push(`[max: ${col.max}]`);
      if (col.allowedValues && col.allowedValues.length > 0) parts.push(`[values: ${col.allowedValues.join(", ")}]`);
      if (col.description) parts.push(`— ${col.description}`);
      lines.push(parts.join(" "));
    }
    lines.push("");
  }

  // Include relationships if present
  if (schema.relationships && schema.relationships.length > 0) {
    lines.push("RELATIONSHIPS:");
    for (const rel of schema.relationships) {
      lines.push(`  ${rel.fromTable}.${rel.fromColumn} → ${rel.toTable}.${rel.toColumn} (${rel.type})`);
    }
  }

  return lines.join("\n");
}

function normalizeAnalysis(parsed: any): any {
  return {
    summary: typeof parsed.summary === "string" ? parsed.summary : "Schema analysis complete.",
    columns: Array.isArray(parsed.columns)
      ? parsed.columns.map((c: any) => ({
          name: String(c.name ?? "unknown"),
          semanticType: String(c.semanticType ?? "text"),
          role: (["primary_key", "foreign_key", "attribute", "metadata"].includes(c.role) ? c.role : "attribute") as string,
          notes: String(c.notes ?? ""),
        }))
      : [],
    relationships: Array.isArray(parsed.relationships)
      ? parsed.relationships.map((r: any) => ({
          from: String(r.from ?? ""),
          to: String(r.to ?? ""),
          type: String(r.type ?? "1:N"),
          description: String(r.description ?? ""),
        }))
      : [],
    constraints: Array.isArray(parsed.constraints) ? parsed.constraints.map(String) : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.map(String) : [],
    edgeCases: Array.isArray(parsed.edgeCases)
      ? parsed.edgeCases.map((e: any) => ({
          column: String(e.column ?? ""),
          type: (["null", "boundary", "extreme", "unusual_valid", "rare_category"].includes(e.type) ? e.type : "boundary") as string,
          description: String(e.description ?? ""),
          example: String(e.example ?? ""),
        }))
      : [],
  };
}

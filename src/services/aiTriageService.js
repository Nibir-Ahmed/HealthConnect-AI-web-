/**
 * HealthConnect Symptom Checker Service
 * 
 * Handles symptom analysis using local datasets and Groq API fallback.
 */

import knowledgeBase from '../data/symptom_knowledge_base.json';

// Critical emergency patterns across English, Banglish, and Bengali script
const EMERGENCY_PATTERNS = [
  /chest\s*pain/i,
  /crushing\s*chest/i,
  /shortness\s*of\s*breath/i,
  /cannot\s*breathe/i,
  /can't\s*breathe/i,
  /stroke/i,
  /heart\s*attack/i,
  /severe\s*bleeding/i,
  /unconscious/i,
  /passed\s*out/i,
  /buke\s*betha/i,
  /buke\s*batha/i,
  /buke\s*chap/i,
  /shash\s*kosto/i,
  /shas\s*nite\s*parchina/i,
  /দম\s*বন্ধ/,
  /বুকে\s*ব্যথা/,
  /বুকে\s*চাপ/,
  /শ্বাসকষ্ট/,
  /অজ্ঞান/,
  /প্রচণ্ড\s*রক্তপাত/,
];

/**
 * Searches the clinical knowledge base for matching symptoms & diseases
 */
export function matchKnowledgeBase(userText) {
  const text = (userText || '').toLowerCase();
  const matchedConditions = [];

  for (const condition of knowledgeBase.conditions) {
    let matchScore = 0;
    const detectedSymptoms = [];

    // Check multilingual aliases
    if (condition.multilingual_aliases) {
      for (const [canonicalSymptom, aliasList] of Object.entries(condition.multilingual_aliases)) {
        for (const alias of aliasList) {
          const lowerAlias = alias.toLowerCase();
          if (text.includes(lowerAlias)) {
            matchScore += 1;
            detectedSymptoms.push(canonicalSymptom);
            break; // Count symptom once
          }
        }
      }
    }

    if (matchScore > 0) {
      matchedConditions.push({
        id: condition.id,
        name: condition.name,
        bengaliName: condition.bengali_name,
        triageCategory: condition.triage_category,
        severityScore: condition.severity_score,
        suggestedSpecialty: condition.suggested_specialty,
        precautions: condition.precautions,
        emergencyRedFlags: condition.emergency_red_flags,
        matchedSymptomCount: matchScore,
        confidence: Math.min(Math.round((matchScore / condition.canonical_symptoms.length) * 100), 95),
      });
    }
  }

  // Sort by highest match score and severity
  matchedConditions.sort((a, b) => b.matchedSymptomCount - a.matchedSymptomCount || b.severityScore - a.severityScore);

  return matchedConditions;
}

/**
 * Strips markdown asterisks/hashes so text always reads like natural human writing
 */
export function cleanHumanText(text) {
  if (!text) return '';
  return String(text)
    .replace(/\*\*+/g, '')
    .replace(/\*+/g, '')
    .replace(/^#+\s*/gm, '')
    .trim();
}

/**
 * Deterministic local fallback response generator
 */
function generateLocalTriageResponse(userText, matchedConditions) {
  if (matchedConditions.length === 0) {
    return {
      isEmergency: false,
      urgencyLevel: 'Mild',
      severityScore: 2,
      suggestedSpecialty: 'General Physician',
      matchedConditions: [],
      clinicalAssessment: `Thanks for sharing how you're feeling. From what you've described so far, this doesn't look like an immediate emergency, though it's important to keep a close eye on how your symptoms progress over the next 24 to 48 hours.\n\nTry to get plenty of rest, drink enough water or oral rehydration fluids, and avoid taking antibiotics on your own. If you don't start feeling better soon, booking a quick checkup with a General Physician would be the safest step.`,
      precautions: [
        'Drink plenty of clean water, soup, or ORS throughout the day.',
        'Keep track of your temperature and how you feel every few hours.',
        'Avoid taking antibiotics or strong painkillers without a doctor’s advice.',
        'Book a checkup with a General Physician if symptoms last more than 2 days.'
      ],
      warningSigns: [
        'High fever above 102°F (38.9°C) that does not come down',
        'Severe dizziness, persistent vomiting, or inability to keep fluids down',
        'Trouble breathing or any new chest discomfort'
      ]
    };
  }

  const primaryMatch = matchedConditions[0];
  const severityMap = {
    'Critical_Emergency': 'Critical',
    'Urgent': 'Urgent',
    'Moderate': 'Moderate',
    'Mild': 'Mild'
  };

  const urgency = severityMap[primaryMatch.triageCategory] || 'Moderate';

  return {
    isEmergency: primaryMatch.triageCategory === 'Critical_Emergency',
    urgencyLevel: urgency,
    severityScore: primaryMatch.severityScore,
    suggestedSpecialty: primaryMatch.suggestedSpecialty,
    matchedConditions: matchedConditions.slice(0, 3).map(c => ({
      name: c.name,
      bengaliName: c.bengaliName,
      confidence: c.confidence
    })),
    clinicalAssessment: `From the symptoms you mentioned, this closely matches signs commonly seen with ${primaryMatch.name} (${primaryMatch.bengaliName}).\n\nBecause this usually requires timely medical attention, it would be best to consult a ${primaryMatch.suggestedSpecialty} soon for a proper examination and any needed lab tests. In the meantime, please follow the care steps below and watch out for the warning signs listed.`,
    precautions: primaryMatch.precautions || [],
    warningSigns: primaryMatch.emergencyRedFlags || []
  };
}

/**
 * Evaluates symptoms using the hybrid Clinical AI Engine
 * 
 * @param {string} symptomText - Patient's reported symptoms in Bangla, Banglish, or English
 * @returns {Promise<Object>} Structured triage result
 */
export async function evaluateSymptomsWithAI(symptomText) {
  const cleanText = (symptomText || '').trim();

  // -------------------------------------------------------------
  // Layer 1: Deterministic Emergency Circuit Breaker
  // -------------------------------------------------------------
  const isEmergency = EMERGENCY_PATTERNS.some((pattern) => pattern.test(cleanText));
  if (isEmergency) {
    return {
      isEmergency: true,
      urgencyLevel: 'Critical',
      severityScore: 7,
      suggestedSpecialty: 'Cardiology / Emergency Ward',
      matchedConditions: [
        { name: 'Acute Coronary Syndrome / Emergency Distress', bengaliName: 'তীব্র জরুরী অবস্থা', confidence: 95 }
      ],
      clinicalAssessment: `Please seek emergency medical care right away. The symptoms you described ("${cleanText}") can be a sign of a serious, time-critical condition that needs immediate attention at a hospital.\n\nPlease stop any physical activity and sit upright in a comfortable position. Do not try to drive yourself. Call 999 for an ambulance or have someone take you to the nearest emergency room immediately.`,
      precautions: [
        'Stop all physical activity immediately.',
        'Loosen tight clothing around neck and waist.',
        'Sit upright or semi-reclined to ease breathing.',
        'Have someone stay with you while emergency responders arrive.'
      ],
      warningSigns: [
        'Crushing chest pressure radiating to arm, neck, or jaw',
        'Severe breathlessness or inability to speak',
        'Loss of consciousness, cold clammy sweat, or blue discoloration'
      ]
    };
  }

  // -------------------------------------------------------------
  // Layer 2: Knowledge Base Matcher (Dataset Grounding)
  // -------------------------------------------------------------
  const matchedConditions = matchKnowledgeBase(cleanText);

  // -------------------------------------------------------------
  // Layer 3: Groq Cloud LLM Inference
  // -------------------------------------------------------------
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  const preferredModel = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile';
  const modelsToTry = preferredModel === 'llama-3.3-70b-versatile'
    ? [preferredModel]
    : [preferredModel, 'llama-3.3-70b-versatile'];

  if (apiKey && apiKey !== 'your_groq_api_key_here') {
    const topMatchesContext = matchedConditions.slice(0, 3).map(c => 
      `- ${c.name} (${c.bengaliName}): Category=${c.triageCategory}, Score=${c.severityScore}/7, Specialty=${c.suggestedSpecialty}. Precautions: ${c.precautions.join('; ')}`
    ).join('\n');

    const systemPrompt = `You are a caring, experienced medical triage coordinator at HealthConnect.
You help patients understand their symptoms across English, Banglish (e.g. "amar 2 din dhore matha batha r jor"), and Bengali script.
Write in warm, natural, conversational plain text like a real human clinician speaking to a patient.
STRICT FORMATTING RULE: Never use asterisks (* or **), markdown headers (#), or robotic bullet labels like "Initial Assessment:" or "Urgency Level:". Write 2 short, natural paragraphs in plain text.

KNOWLEDGE BASE CONTEXT:
${topMatchesContext || 'Use standard medical guidelines.'}

GUIDELINES:
1. Categorize urgency as Mild (self-care), Moderate (clinic visit), Urgent (same-day doctor visit), or Critical (emergency 999).
2. DO NOT prescribe specific prescription drugs (like antibiotics or steroids). Recommend supportive care like fluids, ORS, paracetamol for fever, and rest.
3. Suggest the most relevant medical specialist from: General Physician, Cardiology, Dermatology, Gastroenterology, Neurology, Pulmonology, Urology, Pediatrics, Orthopedics.
4. Output STRICT JSON adhering to this exact schema with NO markdown wrapping around the JSON:
{
  "isEmergency": boolean,
  "urgencyLevel": "Mild" | "Moderate" | "Urgent" | "Critical",
  "severityScore": number (1 to 7),
  "suggestedSpecialty": string,
  "matchedConditions": [
    { "name": string, "bengaliName": string, "confidence": number }
  ],
  "clinicalAssessment": string (2 short warm paragraphs in plain text with NO asterisks * or ** and NO bullet points),
  "precautions": [string, string, string],
  "warningSigns": [string, string, string]
}`;

    for (const modelName of modelsToTry) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: cleanText },
            ],
            temperature: 0.3,
            max_tokens: 800,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || '';
          
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
              isEmergency: Boolean(parsed.isEmergency),
              urgencyLevel: parsed.urgencyLevel || 'Moderate',
              severityScore: Number(parsed.severityScore) || 3,
              suggestedSpecialty: parsed.suggestedSpecialty || 'General Physician',
              matchedConditions: Array.isArray(parsed.matchedConditions)
                ? parsed.matchedConditions.map((c) => ({
                    ...c,
                    confidence:
                      typeof c.confidence === 'number'
                        ? c.confidence <= 1
                          ? Math.round(c.confidence * 100)
                          : Math.round(c.confidence)
                        : 85,
                  }))
                : [],
              clinicalAssessment: cleanHumanText(parsed.clinicalAssessment || content),
              precautions: Array.isArray(parsed.precautions)
                ? parsed.precautions.map(cleanHumanText)
                : [],
              warningSigns: Array.isArray(parsed.warningSigns)
                ? parsed.warningSigns.map(cleanHumanText)
                : [],
            };
          }
        }
      } catch (err) {
        console.warn(`Triage request failed for ${modelName}:`, err);
      }
    }
  }

  // -------------------------------------------------------------
  // Layer 4: Offline Deterministic Fallback Engine
  // -------------------------------------------------------------
  return generateLocalTriageResponse(cleanText, matchedConditions);
}

export default {
  evaluateSymptomsWithAI,
  matchKnowledgeBase,
};

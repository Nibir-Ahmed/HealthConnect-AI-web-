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
      clinicalAssessment: `**Summary of Symptoms**\n\nThank you for sharing your symptoms. They do not appear to indicate an immediate emergency, but if symptoms persist for more than 48 hours or worsen, consulting a doctor is strongly recommended.\n\n• Get plenty of rest and stay well hydrated.\n• Monitor your temperature and symptoms.\n• Schedule a consultation with a General Physician if symptoms do not improve.`,
      precautions: [
        'Maintain adequate oral hydration (2.5–3L clean water or ORS daily).',
        'Monitor temperature, blood pressure, and resting pulse every 6 hours.',
        'Avoid self-medicating with antibiotics without a prescription.',
        'Consult a verified doctor if symptoms worsen.'
      ],
      warningSigns: [
        'High fever (>102°F or 38.9°C) lasting over 3 days',
        'Sudden severe dizziness or inability to keep fluids down',
        'Difficulty breathing or chest discomfort'
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
    clinicalAssessment: `**Initial Assessment: ${primaryMatch.name} (${primaryMatch.bengaliName})**\n\nBased on your reported symptoms, they are consistent with common signs of **${primaryMatch.name}**.\n\n• **Urgency Level**: ${urgency}\n• **Recommended Specialist**: ${primaryMatch.suggestedSpecialty}\n\nWe recommend consulting a doctor for a proper checkup. Please review the recommended self-care tips below.`,
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
      clinicalAssessment: `🚨 **EMERGENCY MEDICAL ALERT: SEEK IMMEDIATE CARE**\n\nBased on your reported symptoms (*"${cleanText}"*), this could indicate a serious or time-critical condition requiring emergency medical help.\n\n**What to do right now:**\n1. Stop all physical exertion immediately and sit upright in a comfortable position.\n2. Do NOT drive yourself.\n3. Dial **999** for emergency ambulance dispatch or go to the nearest emergency room immediately.`,
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
  // Layer 3: Groq Cloud LLM Inference (openai/gpt-oss-120b)
  // -------------------------------------------------------------
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  const modelName = import.meta.env.VITE_GROQ_MODEL || 'openai/gpt-oss-120b';

  if (apiKey && apiKey !== 'your_groq_api_key_here') {
    try {
      const topMatchesContext = matchedConditions.slice(0, 3).map(c => 
        `- ${c.name} (${c.bengaliName}): Category=${c.triageCategory}, Score=${c.severityScore}/7, Specialty=${c.suggestedSpecialty}. Precautions: ${c.precautions.join('; ')}`
      ).join('\n');

      const systemPrompt = `You are a medical intake and symptom guidance assistant for HealthConnect.
You specialize in evaluating patient complaints across English, Banglish (e.g. "amar 2 din dhore matha batha r jor"), and Bengali script.
Never identify yourself as an AI, bot, or machine learning model. Speak warmly, respectfully, and empathetically like a healthcare coordinator helping a patient.

KNOWLEDGE BASE CONTEXT:
${topMatchesContext || 'Use standard medical guidelines.'}

GUIDELINES:
1. Categorize urgency as Mild (self-care), Moderate (clinic visit), Urgent (same-day doctor visit), or Critical (emergency 999).
2. DO NOT prescribe specific prescription pharmaceutical drugs (like antibiotics or steroids). Recommend supportive care like fluids, ORS, paracetamol for fever, and rest.
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
  "clinicalAssessment": string (markdown formatted empathetic explanation of what these symptoms suggest, clear self-care advice, and guidance on when to see a doctor. Do NOT mention you are an AI or LLM),
  "precautions": [string, string, string],
  "warningSigns": [string, string, string]
}`;

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
          temperature: 0.2,
          max_tokens: 800,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        
        // Extract JSON from response (handling potential code block wraps)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            isEmergency: Boolean(parsed.isEmergency),
            urgencyLevel: parsed.urgencyLevel || 'Moderate',
            severityScore: Number(parsed.severityScore) || 3,
            suggestedSpecialty: parsed.suggestedSpecialty || 'General Physician',
            matchedConditions: Array.isArray(parsed.matchedConditions) ? parsed.matchedConditions : [],
            clinicalAssessment: parsed.clinicalAssessment || content,
            precautions: Array.isArray(parsed.precautions) ? parsed.precautions : [],
            warningSigns: Array.isArray(parsed.warningSigns) ? parsed.warningSigns : [],
          };
        }
      }
    } catch (err) {
      console.warn('Groq AI Triage inference failed, falling back to local clinical engine:', err);
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

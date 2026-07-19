import { prisma } from '../index.js';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Universal safety filter - only blocks truly dangerous direct prescribing
export const filterAIOutput = (text) => {
  if (!text || typeof text !== 'string') return "I'm sorry, I couldn't generate a response.";
  // Only block if the AI is trying to self-prescribe specific dosages
  const dangerousPattern = /\b(take|administer)\s+\d+\s?(mg|ml|tablet|pill)/i;
  if (dangerousPattern.test(text)) {
    return "Please consult your doctor for specific dosage instructions. I can provide general health information but cannot prescribe medication.";
  }
  // Always append non-diagnostic disclaimer
  if (!text.includes('*Note:') && !text.includes('*Disclaimer:')) {
    text += "\n\n*Note: This is general health information and does not replace professional medical advice. Always consult your doctor.*";
  }
  return text;
};

// Emergency Override - runs BEFORE any provider, highest priority
const checkEmergencyOverride = (symptoms) => {
  const s = symptoms.join(' ').toLowerCase();
  const emergencyPatterns = [
    ['chest pain', 'breathing'],
    ['chest pain', 'dizz'],
    ['chest pain', 'arm'],
    ['severe headache', 'vomit'],
    ['loss of consciousness'],
    ['unconscious'],
    ['not breathing'],
    ['heart attack'],
    ['stroke'],
    ['seizure'],
    ['severe bleeding'],
    ['difficulty breathing'],
  ];
  for (const combo of emergencyPatterns) {
    if (combo.every(word => s.includes(word))) {
      return {
        isEmergency: true,
        urgency: 'EMERGENCY',
        department: 'Emergency Room',
        summary: '🚨 SEEK IMMEDIATE MEDICAL ATTENTION. Call emergency services (911) or go to the nearest Emergency Room NOW.\n\nDo not wait. These symptoms may indicate a life-threatening condition.'
      };
    }
  }
  return null;
};

// Parse free-text symptoms intelligently
const parseSymptoms = (text) => {
  // If already an array, use it
  if (Array.isArray(text)) return text.filter(s => s.trim().length > 0);
  // Split by common delimiters
  return text.split(/,|and|also|\n/).map(s => s.trim()).filter(s => s.length > 2);
};

class RuleBasedProvider {
  async checkSymptoms(symptoms) {
    const s = symptoms.join(', ').toLowerCase();
    let urgency = 'LOW';
    let department = 'General Medicine';
    let advice = [];

    if (s.includes('chest') || s.includes('heart') || s.includes('palpitation')) {
      department = 'Cardiology'; urgency = 'HIGH';
      advice.push('Chest-related symptoms require prompt evaluation by a cardiologist.');
    }
    if (s.includes('breath') || s.includes('asthma') || s.includes('wheez')) {
      department = 'Pulmonology'; urgency = 'HIGH';
      advice.push('Breathing difficulties should be evaluated immediately.');
    }
    if (s.includes('rash') || s.includes('skin') || s.includes('itch')) {
      department = 'Dermatology';
      advice.push('Skin symptoms are best evaluated by a dermatologist.');
    }
    if (s.includes('bone') || s.includes('joint') || s.includes('fracture') || s.includes('ortho')) {
      department = 'Orthopedics';
      advice.push('Bone and joint issues should be reviewed by an orthopedic specialist.');
    }
    if (s.includes('head') || s.includes('brain') || s.includes('neuro') || s.includes('seizure')) {
      department = 'Neurology'; urgency = 'HIGH';
      advice.push('Neurological symptoms require specialist evaluation.');
    }
    if (s.includes('fever') || s.includes('cough') || s.includes('cold') || s.includes('flu')) {
      urgency = urgency === 'LOW' ? 'MEDIUM' : urgency;
      advice.push('Rest, stay hydrated, and monitor your temperature. Seek care if fever exceeds 103°F (39.4°C).');
    }
    if (s.includes('stomach') || s.includes('nausea') || s.includes('vomit') || s.includes('diarrhea')) {
      department = 'Gastroenterology';
      advice.push('Stay hydrated. Seek care if symptoms persist beyond 48 hours or are severe.');
    }
    if (s.includes('eye') || s.includes('vision') || s.includes('blur')) {
      department = 'Ophthalmology';
      advice.push('Eye symptoms should be promptly evaluated to rule out serious conditions.');
    }
    if (s.includes('ear') || s.includes('hearing') || s.includes('throat')) {
      department = 'ENT';
    }
    if (s.includes('child') || s.includes('baby') || s.includes('infant') || s.includes('toddler')) {
      department = 'Pediatrics';
    }

    if (advice.length === 0) {
      advice.push('Your symptoms will be evaluated by our General Medicine team. Please ensure you get adequate rest and stay hydrated.');
    }

    const summary = `Based on your symptoms (${symptoms.join(', ')}), I recommend visiting the **${department}** department.\n\n**Urgency Level:** ${urgency}\n\n**Guidance:**\n${advice.map(a => `• ${a}`).join('\n')}\n\nPlease book an appointment to get a proper clinical evaluation.`;

    return { isEmergency: false, urgency, department, summary: filterAIOutput(summary) };
  }

  async parseAppointmentRequest(text) {
    const t = text.toLowerCase();
    let specialty = 'General Medicine';
    let date = null;
    let timePreference = null;
    let message = '';

    if (t.includes('skin') || t.includes('rash') || t.includes('dermatolog')) specialty = 'Dermatology';
    else if (t.includes('heart') || t.includes('cardio') || t.includes('chest')) specialty = 'Cardiology';
    else if (t.includes('child') || t.includes('baby') || t.includes('pediatric')) specialty = 'Pediatrics';
    else if (t.includes('bone') || t.includes('joint') || t.includes('ortho')) specialty = 'Orthopedics';
    else if (t.includes('eye') || t.includes('vision') || t.includes('ophthal')) specialty = 'Ophthalmology';
    else if (t.includes('brain') || t.includes('neuro') || t.includes('headache')) specialty = 'Neurology';
    else if (t.includes('stomach') || t.includes('digest') || t.includes('gastro')) specialty = 'Gastroenterology';
    else if (t.includes('lung') || t.includes('breath') || t.includes('pulmo')) specialty = 'Pulmonology';

    const today = new Date();
    if (t.includes('today')) { date = today.toISOString().split('T')[0]; }
    else if (t.includes('tomorrow')) { const d = new Date(); d.setDate(d.getDate() + 1); date = d.toISOString().split('T')[0]; }
    else if (t.includes('next week')) { const d = new Date(); d.setDate(d.getDate() + 7); date = d.toISOString().split('T')[0]; }

    if (t.includes('morning')) timePreference = 'MORNING';
    else if (t.includes('afternoon')) timePreference = 'AFTERNOON';
    else if (t.includes('evening')) timePreference = 'EVENING';

    message = `I'd be happy to help you book an appointment with our **${specialty}** department!\n\n` +
      (date ? `📅 Preferred Date: ${date}\n` : '') +
      (timePreference ? `🕐 Time Preference: ${timePreference}\n` : '') +
      `\nPlease head to the **Patient Dashboard → Book Appointment** section and select the ${specialty} department to confirm your slot.`;

    return { success: true, specialty, date, timePreference, message };
  }

  async answerChatQuery(query, userRole = 'PATIENT') {
    const t = query.toLowerCase();
    let response = '';

    if (t.includes('hello') || t.includes('hi') || t.includes('hey') || t.includes('good morning') || t.includes('good evening')) {
      if (userRole === 'DOCTOR') {
        response = "Hello Doctor! 👋 I'm here to assist you with diagnosis suggestions, prescription details, and medical summaries.";
      } else if (userRole === 'RECEPTIONIST') {
        response = "Hello! 👋 I'm here to help with appointment scheduling, queue guidance, and patient inquiries.";
      } else if (userRole === 'ADMIN') {
        response = "Hello Admin! 👋 I can assist you with analytics insights, operational recommendations, and system overviews.";
      } else {
        response = "Hello! 👋 I'm the NovaCare AI Health Assistant. I'm here to help you with:\n\n• Checking your symptoms\n• Booking appointments\n• Understanding your lab reports\n• Explaining your prescriptions\n• General health tips\n\nHow can I assist you today?";
      }
    } else if (t.includes('emergency') || t.includes('urgent') || t.includes('critical') || t.includes('ambulance')) {
      response = "🚨 **If this is an emergency, call 911 or your local emergency number immediately.**\n\nNovaCare's Emergency Room is open 24/7. You can also reach us at:\n📞 Emergency: 1-800-NOVA-911\n📍 Emergency Entrance: Main Hospital Building, Ground Floor";
    } else if (t.includes('hour') || t.includes('timing') || t.includes('open') || t.includes('when')) {
      response = "🏥 **NovaCare Hospital Hours:**\n\n• Emergency & ICU: 24/7\n• OPD (Outpatient): 9:00 AM – 6:00 PM, Mon–Sat\n• Pharmacy: 8:00 AM – 10:00 PM daily\n• Lab Services: 7:00 AM – 8:00 PM daily\n• Administration: 9:00 AM – 5:00 PM, Mon–Fri";
    } else if (t.includes('book') || t.includes('appointment') || t.includes('schedule') || t.includes('consult')) {
      response = "📅 **Booking an Appointment:**\n\n1. Go to your **Patient Dashboard**\n2. Click **Book Appointment** (top right)\n3. Choose your preferred doctor and time slot\n\nAlternatively, call our reception:\n📞 1-800-MEDICORE (Mon–Sat, 9 AM – 5 PM)";
    } else if (t.includes('fee') || t.includes('cost') || t.includes('charge') || t.includes('price') || t.includes('billing') || t.includes('payment')) {
      response = "💰 **Fee Information:**\n\n• General Consultation: ₹500–₹800\n• Specialist Consultation: ₹800–₹2,000\n• Lab Tests: Varies by test (view in Lab section)\n• Emergency: ₹2,000–₹5,000\n\nFor exact doctor fees, check the **Our Doctors** page. For billing queries, contact our Finance Desk.";
    } else if (t.includes('report') || t.includes('lab') || t.includes('result') || t.includes('test')) {
      response = "🧪 **Accessing Your Lab Reports:**\n\n1. Go to **Patient Dashboard**\n2. Click on **Medical Records** in the sidebar\n3. Your reports are listed with download options\n\nFor an AI summary of your results, click **Lab Summary** in the quick actions below!";
    } else if (t.includes('prescription') || t.includes('medicine') || t.includes('medication') || t.includes('drug')) {
      response = "💊 **Prescription & Medication Help:**\n\nYou can view your active prescriptions in the **Patient Dashboard** under **Active Prescriptions**.\n\nWant me to explain any specific medication? Just type the medicine name and I'll provide general information about its use and precautions.";
    } else if (t.includes('contact') || t.includes('phone') || t.includes('email') || t.includes('address')) {
      response = "📞 **Contact NovaCare:**\n\n• Main Reception: 1-800-MEDICORE\n• Emergency: 1-800-NOVA-911\n• Email: support@novacare.com\n• WhatsApp: +91-98765-43210\n\n📍 NovaCare Smart Hospital, Medical District, City – 110001";
    } else if (t.includes('insurance') || t.includes('cashless') || t.includes('claim')) {
      response = "🏥 **Insurance & Cashless Treatment:**\n\nNovaCare accepts all major insurance providers including:\n• Star Health, HDFC Ergo, Bajaj Allianz\n• Government schemes: PMJAY, ESI, CGHS\n\nFor cashless admission, visit the Insurance Desk at the hospital entrance with your policy documents.";
    } else if (t.includes('doctor') || t.includes('specialist') || t.includes('physician')) {
      response = "👨‍⚕️ **Find a Doctor:**\n\nVisit our **Our Doctors** page to:\n• Browse all specialists\n• View their experience and fees\n• Book directly from the listing\n\nNovaCare has specialists in: Cardiology, Neurology, Orthopedics, Dermatology, Pediatrics, Gastroenterology, and more!";
    } else if (t.includes('blood') || t.includes('blood bank') || t.includes('donate')) {
      response = "🩸 **Blood Bank Services:**\n\nNovaCare maintains a 24/7 Blood Bank.\n• All blood types available\n• Emergency supply: Call 1-800-NOVA-911\n• Donation: Visit Blood Bank on Floor 2, Mon–Sat, 9 AM–4 PM\n\nDonating blood saves lives! Walk-in donors are always welcome.";
    } else if (t.includes('ward') || t.includes('admit') || t.includes('admit') || t.includes('bed') || t.includes('room')) {
      response = "🛏️ **Ward & Admission:**\n\n• General Ward: Available for all patients\n• Private Rooms: Book through Reception\n• ICU/CCU: Specialist-referred only\n\nFor admission queries, visit the **Reception Desk** or call 1-800-MEDICORE.";
    } else if (t.includes('diet') || t.includes('food') || t.includes('nutrition') || t.includes('eat')) {
      response = "🥗 **General Dietary Guidance:**\n\n• Eat balanced meals with fruits, vegetables, lean proteins, and whole grains\n• Stay hydrated — drink 8–10 glasses of water daily\n• Limit processed foods, sugar, and saturated fats\n• Eat smaller, more frequent meals for better digestion\n\nFor a personalized diet plan, consult our Nutrition specialist.";
    } else if (t.includes('exercise') || t.includes('workout') || t.includes('fitness') || t.includes('walk')) {
      response = "🏃 **Exercise & Fitness Tips:**\n\n• Aim for 30 minutes of moderate exercise, 5 days a week\n• Walking, swimming, and cycling are excellent low-impact options\n• Strength training 2–3 times a week helps maintain muscle mass\n• Always warm up before and cool down after exercise\n\nIf you have a medical condition, consult your doctor before starting a new exercise regimen.";
    } else if (t.includes('sleep') || t.includes('insomnia') || t.includes('rest')) {
      response = "😴 **Sleep Health Tips:**\n\n• Adults need 7–9 hours of quality sleep per night\n• Keep a consistent sleep schedule (same bedtime & wake time)\n• Avoid screens 1 hour before bed\n• Keep your bedroom cool, dark, and quiet\n\nPersistent sleep problems should be discussed with a doctor.";
    } else if (t.includes('stress') || t.includes('anxiety') || t.includes('mental health') || t.includes('depression')) {
      response = "🧘 **Mental Health Support:**\n\nYour mental health is just as important as your physical health.\n\n• Practice deep breathing or meditation daily\n• Stay connected with friends and family\n• Limit news and social media consumption\n• Regular exercise significantly improves mood\n\nNovaCare has a Mental Health & Psychiatry department. If you're struggling, please don't hesitate to reach out to a professional.";
    } else {
      response = "I'm here to help! 😊 You can ask me about:\n\n• **Symptoms** – \"I have a headache and fever\"\n• **Appointments** – \"Book a dermatology appointment for tomorrow\"\n• **Lab Reports** – \"Summarize my lab results\"\n• **Prescriptions** – \"Explain my prescription\"\n• **Health Tips** – \"Give me health tips\"\n• **Hospital Info** – Hours, fees, contact, departments\n\nWhat would you like to know?";
    }

    return { reply: filterAIOutput(response) };
  }

  async summarizeLabReport(labReportResults) {
    if (!labReportResults || labReportResults.length === 0) {
      return {
        summary: "🧪 **Lab Report Summary**\n\nYou don't have any lab reports on file yet, or your results haven't been entered into the system.\n\n**What you can do:**\n• Visit **Patient Dashboard → Medical Records** to view any uploaded reports\n• Ask your doctor to upload your lab results digitally after your next test\n• If you have a printed report, your doctor will explain each value at your next consultation\n\nOnce your reports are in the system, I can provide a clear summary of each test result in simple language!"
      };
    }

    const pending = labReportResults.filter(r => r.status === 'PENDING' || r.value === 'Pending');
    const completed = labReportResults.filter(r => r.status === 'COMPLETED' || (r.value && r.value !== 'Pending'));
    const abnormal = labReportResults.filter(r => r.flag === 'HIGH' || r.flag === 'LOW' || r.status === 'ABNORMAL');

    let summary = `🧪 **Your Lab Report Summary**\n\n`;
    summary += `📊 Total Tests: **${labReportResults.length}** | ✅ Completed: **${completed.length}** | ⏳ Pending: **${pending.length}**\n\n`;

    if (completed.length > 0) {
      summary += `---\n**Test Results:**\n`;
      completed.forEach(r => {
        const statusIcon = (r.flag === 'HIGH' || r.flag === 'LOW' || r.status === 'ABNORMAL') ? '⚠️' : '✅';
        summary += `${statusIcon} **${r.testName}**`;
        if (r.value && r.value !== 'Pending') summary += `: ${r.value} ${r.unit || ''}`;
        if (r.flag && r.flag !== 'NORMAL') summary += ` *(${r.flag})*`;
        if (r.date) summary += ` — ${new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        summary += '\n';
      });
      summary += '\n';
    }

    if (pending.length > 0) {
      summary += `---\n⏳ **Pending Results:**\n`;
      pending.forEach(r => {
        summary += `• ${r.testName} — awaiting results\n`;
      });
      summary += '\n';
    }

    if (abnormal.length > 0) {
      summary += `---\n⚠️ **Important — Values Requiring Attention:**\n`;
      abnormal.forEach(r => {
        summary += `• **${r.testName}** is flagged as **${r.flag || 'Abnormal'}** — please discuss this with your doctor.\n`;
      });
      summary += `\n🩺 It is recommended you **book a follow-up appointment** to review these results with your doctor.\n`;
    } else if (completed.length > 0) {
      summary += `---\n✅ **Overall:** Your completed test results appear to be within acceptable ranges. Continue your healthy lifestyle and follow your doctor's advice for the next check-up.`;
    }

    return { summary: filterAIOutput(summary) };
  }

  async explainPrescription(medicineData) {
    // medicineData may have .medicines (array from real DB) or just .medicine (single)
    const medicines = medicineData?.medicines || (medicineData?.medicine ? [medicineData.medicine] : null);

    if (!medicines || medicines.length === 0) {
      return {
        explanation: "💊 **Prescription Explanation**\n\nYou don't have any active prescriptions on file yet, or your doctor hasn't added them to the system.\n\nYou can:\n• Ask your doctor to add your prescriptions digitally at your next visit\n• View any existing prescriptions in your **Patient Dashboard → Active Prescriptions** section\n\nIf you have a printed prescription, your pharmacist can also explain each medicine's purpose and dosage."
      };
    }

    let explanation = `💊 **Your Prescription Explained**\n\nHere is a summary of your prescribed medications:\n\n`;

    medicines.forEach((med, idx) => {
      explanation += `---\n**${idx + 1}. ${med.name}**\n`;
      if (med.categoryName && med.categoryName !== 'General') {
        explanation += `📋 Category: ${med.categoryName}\n`;
      }
      if (med.dosage) explanation += `💉 Dosage: ${med.dosage}\n`;
      if (med.frequency) explanation += `🕐 Frequency: ${med.frequency}\n`;
      if (med.duration) explanation += `📅 Duration: ${med.duration}\n`;
      if (med.instructions) explanation += `📝 Instructions: ${med.instructions}\n`;
      if (med.prescribedBy) explanation += `👨‍⚕️ Prescribed by: ${med.prescribedBy}\n`;
      explanation += `\n`;
    });

    explanation += `---\n\n**General Reminders:**\n`;
    explanation += `• Take all medications exactly as prescribed — do not skip doses\n`;
    explanation += `• Do not stop medication early, even if you feel better\n`;
    explanation += `• Inform your doctor of any side effects or allergies\n`;
    explanation += `• Keep all medications stored as directed (usually cool, dry place)\n`;
    explanation += `• Do not share your prescription medications with anyone\n`;

    return { explanation: filterAIOutput(explanation) };
  }

  async generateHealthTips(patientData) {
    const age = patientData?.age || patientData?.dob
      ? Math.floor((new Date() - new Date(patientData.dob)) / (365.25 * 24 * 60 * 60 * 1000))
      : 30;
    const gender = patientData?.gender;
    const bloodGroup = patientData?.bloodGroup;

    let tips = `🌟 **Personalized Health Tips for You:**\n\n`;

    if (age < 18) {
      tips += `• 🧒 Ensure adequate sleep (9–11 hours for teenagers)\n• 🏃 Stay physically active — at least 1 hour of play/sports daily\n• 🥗 Eat a calcium-rich diet for strong bone development\n• 📚 Balance screen time with outdoor activities\n`;
    } else if (age < 40) {
      tips += `• 🏃 Aim for 150 minutes of moderate exercise weekly\n• 🥗 Focus on a balanced diet rich in vegetables and lean proteins\n• 😴 Prioritize 7–8 hours of quality sleep each night\n• 🧘 Practice stress management through meditation or yoga\n`;
    } else if (age < 60) {
      tips += `• ❤️ Schedule annual heart health check-ups\n• 🦴 Include calcium and vitamin D in your diet for bone health\n• 🏃 Low-impact exercises like swimming or walking are excellent\n• 🩺 Regular screenings for blood pressure, cholesterol, and blood sugar\n`;
    } else {
      tips += `• 🚶 Daily walks (30 minutes) maintain cardiovascular health\n• 💊 Keep up with all prescribed medications consistently\n• 🦴 Prevent falls — ensure good lighting and use support rails\n• 🩺 Regular health check-ups every 3–6 months\n• 🤝 Stay socially active — it benefits mental health greatly\n`;
    }

    if (gender === 'FEMALE') {
      tips += `• 🌸 Regular gynecological check-ups are important\n`;
    }
    if (bloodGroup) {
      tips += `• 🩸 Your blood group is **${bloodGroup}** — consider donating blood if you're eligible!\n`;
    }

    tips += `\n💧 **Always remember:**\n• Drink 8–10 glasses of water daily\n• Avoid smoking and limit alcohol\n• Maintain a healthy weight\n\nFor personalized health advice tailored to your specific conditions, consult your doctor at NovaCare!`;

    return { tip: filterAIOutput(tips) };
  }
}

class LLMProvider {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-flash-lite-latest",
      systemInstruction: "You are the NovaCare AI Healthcare Assistant. Always be empathetic, concise, and professional. You must ALWAYS include a disclaimer stating that your advice does not replace professional medical advice, diagnosis, or treatment. Never prescribe specific medication dosages or offer definitive medical diagnoses."
    });
  }

  async _generate(prompt) {
    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text().trim();
    } catch (err) {
      console.error("[Gemini API Error]:", err);
      throw err;
    }
  }

  async checkSymptoms(symptoms) {
    const prompt = `You are a clinical AI triage assistant for NovaCare Hospital.
Patient symptoms: ${symptoms.join(', ')}
Respond with ONLY a valid JSON object (no markdown, no backticks):
{"urgency": "LOW|MEDIUM|HIGH", "department": "best department name", "summary": "2-3 sentence compassionate triage assessment. Do NOT prescribe medication or provide a definitive diagnosis."}`;
    try {
      let text = await this._generate(prompt);
      if (text.startsWith('`')) text = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(text);
      return { isEmergency: parsed.urgency === 'HIGH', urgency: parsed.urgency, department: parsed.department, summary: filterAIOutput(parsed.summary) };
    } catch {
      return new RuleBasedProvider().checkSymptoms(symptoms);
    }
  }

  async parseAppointmentRequest(text) {
    const prompt = `Parse this appointment request for NovaCare Hospital: "${text}"
Respond with ONLY valid JSON (no markdown):
{"specialty": "department name or General Medicine", "date": "YYYY-MM-DD or null", "timePreference": "MORNING|AFTERNOON|EVENING|null", "message": "friendly confirmation message telling the patient what you understood and directing them to the booking section"}`;
    try {
      let out = await this._generate(prompt);
      if (out.startsWith('`')) out = out.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(out);
      return { success: true, ...parsed };
    } catch {
      return new RuleBasedProvider().parseAppointmentRequest(text);
    }
  }

  async answerChatQuery(query, userRole = 'PATIENT') {
    let roleInstructions = "You are assisting a Patient with symptom guidance, appointment help, and report explanation.";
    if (userRole === 'DOCTOR') roleInstructions = "You are assisting a Doctor with diagnosis suggestions, prescription assistance, and medical summaries.";
    if (userRole === 'RECEPTIONIST') roleInstructions = "You are assisting a Receptionist with appointment assistance and queue guidance.";
    if (userRole === 'ADMIN') roleInstructions = "You are assisting an Admin with analytics insights and operational recommendations.";

    const systemPrompt = `You are the official AI Health Assistant for NovaCare Smart Hospital. Be helpful, empathetic, and concise.
${roleInstructions}
Rules:
1. Hospital hours: Emergency 24/7, OPD 9AM-6PM Mon-Sat
2. Patients book appointments through their Patient Dashboard
3. Do NOT provide specific drug dosages or definitive diagnoses
4. For emergencies always say: call 911 or visit Emergency Room immediately
5. Keep responses under 200 words and use bullet points for clarity
6. Use emojis sparingly to make responses friendly

User message: "${query}"
Respond helpfully:`;
    try {
      const reply = await this._generate(systemPrompt);
      return { reply: filterAIOutput(reply) };
    } catch {
      return new RuleBasedProvider().answerChatQuery(query);
    }
  }

  async summarizeLabReport(labReportResults) {
    if (!labReportResults || labReportResults.length === 0) {
      return new RuleBasedProvider().summarizeLabReport([]);
    }
    const prompt = `You are an AI health assistant summarizing lab results for a patient in simple, non-technical language.

Lab results data: ${JSON.stringify(labReportResults, null, 2)}

Please provide:
1. A brief overall summary (1-2 sentences)
2. List each test with its result in plain English
3. Highlight any values that seem outside normal ranges (flag=HIGH/LOW or status=ABNORMAL)
4. Provide reassuring, actionable advice (e.g., follow up with doctor if needed)

Rules:
- Do NOT prescribe treatment or medication
- Do NOT make a definitive diagnosis
- Be empathetic and easy to understand
- Use bullet points and emoji for readability`;
    try {
      const summary = await this._generate(prompt);
      return { summary: filterAIOutput(summary) };
    } catch {
      return new RuleBasedProvider().summarizeLabReport(labReportResults);
    }
  }

  async explainPrescription(medicineData) {
    const medicines = medicineData?.medicines || (medicineData?.medicine ? [medicineData.medicine] : []);
    const prompt = `Explain these prescribed medications to a patient in simple, reassuring language. For each medicine, explain what it's generally used for, how to take it (based on dosage/frequency provided), and key precautions. Do NOT give specific dosage advice beyond what is provided. Be empathetic and clear:\n\n${JSON.stringify(medicines, null, 2)}`;
    try {
      const explanation = await this._generate(prompt);
      return { explanation: filterAIOutput(explanation) };
    } catch {
      return new RuleBasedProvider().explainPrescription(medicineData);
    }
  }

  async generateHealthTips(patientData) {
    const prompt = `Generate 5 personalized, actionable health tips for a patient with this profile: ${JSON.stringify(patientData)}. Be specific, practical, and encouraging. Use bullet points.`;
    try {
      const tip = await this._generate(prompt);
      return { tip: filterAIOutput(tip) };
    } catch {
      return new RuleBasedProvider().generateHealthTips(patientData);
    }
  }
}

// ---------------------------------------------------------
// Hybrid AI Execution Engine
//
// Strategy:
//   CHATBOT (open-ended / random messages) → Try Gemini first, fall back to Rule-Based
//   All structured medical tools (SYMPTOM_CHECKER, LAB_SUMMARY, etc.) → Always Rule-Based
//     (deterministic, no quota risk, medically safe)
//
// Admin can override to 'gemini' (all tools via Gemini) or 'rule_based' (all rule-based)
// via the AI Settings panel.
// ---------------------------------------------------------

export const executeAI = async (userId, toolType, inputData, conversationId = null, userRole = 'PATIENT') => {
  const dbSetting = await prisma.aISetting.findUnique({ where: { key: 'provider' } });
  const adminOverride = dbSetting?.value;
  const envProvider = process.env.AI_PROVIDER;

  // Determine if Gemini should be attempted
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const geminiAvailable = !!geminiApiKey;

  // Hybrid mode: CHATBOT uses Gemini, structured tools use Rule-Based
  // Admin can force-override via settings
  const useGeminiForTool = adminOverride === 'gemini'
    || (adminOverride !== 'rule_based' && envProvider !== 'rule_based' && toolType === 'CHATBOT' && geminiAvailable);

  const ruleProvider = new RuleBasedProvider();

  let llmProvider = null;
  if (useGeminiForTool) {
    try { llmProvider = new LLMProvider(); } catch { llmProvider = null; }
  }

  let output;
  let isEmergency = false;
  let sourceTag = 'rule_based';

  // 1. Emergency override always runs first for SYMPTOM_CHECKER
  if (toolType === 'SYMPTOM_CHECKER') {
    const emergencyResult = checkEmergencyOverride(inputData.symptoms || []);
    if (emergencyResult) {
      output = emergencyResult;
      isEmergency = true;
      sourceTag = 'rule_based_emergency_override';
    }
  }

  if (!output) {
    // 2. For CHATBOT: try Gemini → fall back to Rule-Based
    if (toolType === 'CHATBOT' && llmProvider) {
      try {
        output = await llmProvider.answerChatQuery(inputData.text || '', userRole);
        sourceTag = 'gemini';
        console.log('[AI] CHATBOT → Gemini responded successfully');
      } catch (err) {
        console.warn('[AI] Gemini failed for CHATBOT, falling back to Rule-Based:', err.message);
        output = await ruleProvider.answerChatQuery(inputData.text || '', userRole);
        sourceTag = 'rule_based_fallback';
      }
    }
    // 3. All structured medical tools → Rule-Based (reliable & quota-free)
    else {
      try {
        switch (toolType) {
          case 'SYMPTOM_CHECKER':
            output = await ruleProvider.checkSymptoms(parseSymptoms(inputData.symptoms || []));
            sourceTag = 'rule_based';
            break;
          case 'APPOINTMENT_PARSER':
            output = await ruleProvider.parseAppointmentRequest(inputData.text || '');
            sourceTag = 'rule_based';
            break;
          case 'CHATBOT':
            output = await ruleProvider.answerChatQuery(inputData.text || '', userRole);
            sourceTag = 'rule_based';
            break;
          case 'LAB_SUMMARY':
            output = await ruleProvider.summarizeLabReport(inputData.results || []);
            sourceTag = 'rule_based';
            break;
          case 'PRESCRIPTION_EXPLAINER':
            output = await ruleProvider.explainPrescription(inputData);
            sourceTag = 'rule_based';
            break;
          case 'HEALTH_TIPS':
            output = await ruleProvider.generateHealthTips(inputData.patient || {});
            sourceTag = 'rule_based';
            break;
          default:
            throw new Error(`Unknown AI Tool Type: ${toolType}`);
        }
      } catch (err) {
        console.error('[AI] Rule-Based provider error:', err.message);
        output = { reply: "I'm sorry, I encountered an issue. Please try again or contact hospital support." };
        sourceTag = 'error';
      }
    }
  }

  output.source = sourceTag;

  const interaction = await prisma.aIInteraction.create({
    data: {
      userId,
      toolType,
      input: inputData,
      output,
      provider: sourceTag,
      conversationId: conversationId || uuidv4(),
    }
  });

  return { ...output, interactionId: interaction.id, conversationId: interaction.conversationId };
};

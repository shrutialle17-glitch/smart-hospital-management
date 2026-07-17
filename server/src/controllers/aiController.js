import { executeAI } from '../services/aiService.js';
import { prisma } from '../index.js';

/**
 * Main entry point for all AI capabilities.
 * POST /api/v1/ai/execute
 */
export const handleAIRequest = async (req, res, next) => {
  try {
    const { toolType, inputData, conversationId } = req.body;
    const userId = req.user.id;

    if (!toolType || !inputData) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: "toolType and inputData are required" }
      });
    }

    let enrichedInputData = { ...inputData };

    // Auto-enrich PRESCRIPTION_EXPLAINER with the patient's real prescriptions
    if (toolType === 'PRESCRIPTION_EXPLAINER') {
      try {
        const patient = await prisma.patient.findUnique({ where: { userId } });
        if (patient) {
          const prescriptions = await prisma.prescription.findMany({
            where: { patientId: patient.id },
            include: {
              doctor: { include: { user: true } },
              items: {
                include: {
                  medicine: { include: { category: true } }
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 5 // latest 5 prescriptions
          });

          if (prescriptions.length > 0) {
            // Flatten all medicines from all recent prescriptions
            const medicines = prescriptions.flatMap(rx =>
              rx.items.map(item => ({
                name: item.medicine.name,
                categoryName: item.medicine.category?.name || 'General',
                dosage: item.dosage,
                frequency: item.frequency,
                duration: item.duration,
                instructions: item.instructions || null,
                prescribedBy: `Dr. ${rx.doctor.user.firstName} ${rx.doctor.user.lastName}`,
                date: rx.createdAt
              }))
            );
            enrichedInputData = { ...enrichedInputData, medicines, medicine: medicines[0] };
          }
        }
      } catch (err) {
        console.error('Could not auto-enrich prescription data:', err.message);
        // Non-fatal — AI will use whatever inputData was sent
      }
    }

    // Auto-enrich LAB_SUMMARY with the patient's real lab results
    if (toolType === 'LAB_SUMMARY') {
      try {
        const patient = await prisma.patient.findUnique({ where: { userId } });
        if (patient) {
          const labReports = await prisma.labReport.findMany({
            where: { patientId: patient.id },
            include: { test: true },
            orderBy: { createdAt: 'desc' },
            take: 10
          });

          if (labReports.length > 0) {
            const results = labReports.map(r => ({
              testName: r.test?.name || 'Unknown Test',
              value: r.result || 'Pending',
              unit: '',
              referenceRange: 'See report',
              flag: r.status === 'COMPLETED' ? 'NORMAL' : r.status,
              status: r.status,
              date: r.createdAt
            }));
            enrichedInputData = { ...enrichedInputData, results };
          }
        }
      } catch (err) {
        console.error('Could not auto-enrich lab data:', err.message);
      }
    }

    // Auto-enrich HEALTH_TIPS with the patient's real profile
    if (toolType === 'HEALTH_TIPS') {
      try {
        const patient = await prisma.patient.findUnique({
          where: { userId },
          include: { user: true }
        });
        if (patient) {
          const age = patient.dob
            ? Math.floor((new Date() - new Date(patient.dob)) / (365.25 * 24 * 60 * 60 * 1000))
            : 30;
          enrichedInputData = {
            ...enrichedInputData,
            patient: {
              age,
              gender: patient.gender,
              bloodGroup: patient.bloodGroup,
              name: `${patient.user.firstName} ${patient.user.lastName}`
            }
          };
        }
      } catch (err) {
        console.error('Could not auto-enrich patient profile:', err.message);
      }
    }

    const result = await executeAI(userId, toolType, enrichedInputData, conversationId, req.user.role);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch conversation history scoped to the logged-in user.
 * GET /api/v1/ai/history
 */
export const getConversationHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Explicit RBAC check: Users can only fetch their own interactions
    const interactions = await prisma.aIInteraction.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });

    // Group by conversation ID
    const grouped = interactions.reduce((acc, curr) => {
      if (!curr.conversationId) return acc;
      if (!acc[curr.conversationId]) {
        acc[curr.conversationId] = {
          conversationId: curr.conversationId,
          toolType: curr.toolType,
          lastUpdated: curr.timestamp,
          messages: []
        };
      }
      acc[curr.conversationId].messages.push(curr);
      return acc;
    }, {});

    const historyArray = Object.values(grouped).sort((a, b) => b.lastUpdated - a.lastUpdated);

    res.status(200).json({ success: true, data: historyArray });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a specific conversation by ID.
 * DELETE /api/v1/ai/history/:conversationId
 */
export const deleteConversation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const result = await prisma.aIInteraction.deleteMany({
      where: {
        userId,
        conversationId
      }
    });

    res.status(200).json({ success: true, message: "Conversation deleted successfully", count: result.count });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch AI analytics (Admin only)
 * GET /api/v1/ai/analytics
 */
export const getAIAnalytics = async (req, res, next) => {
  try {
    const interactions = await prisma.aIInteraction.findMany({
      orderBy: { timestamp: 'desc' },
    });

    // Compute metrics
    const totalRequests = interactions.length;
    
    const toolCounts = interactions.reduce((acc, curr) => {
      acc[curr.toolType] = (acc[curr.toolType] || 0) + 1;
      return acc;
    }, {});

    const latestRequests = interactions.slice(0, 50).map(i => ({
      id: i.id,
      toolType: i.toolType,
      timestamp: i.timestamp,
      provider: i.provider
    }));

    res.status(200).json({
      success: true,
      data: {
        totalRequests,
        toolCounts,
        latestRequests
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch AI settings (Admin only)
 * GET /api/v1/ai/settings
 */
export const getAISettings = async (req, res, next) => {
  try {
    // We only have one settings record conceptually, or multiple rows by key
    const settings = await prisma.aISetting.findMany();
    
    let config = { provider: process.env.AI_PROVIDER || 'rule_based', isGeminiConfigured: !!process.env.GEMINI_API_KEY, isOpenAIConfigured: !!process.env.OPENAI_API_KEY };
    
    settings.forEach(s => {
      config[s.key] = s.value;
    });

    res.status(200).json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
};

/**
 * Update AI settings (Admin only)
 * POST /api/v1/ai/settings
 */
export const updateAISettings = async (req, res, next) => {
  try {
    const { key, value } = req.body;
    
    const setting = await prisma.aISetting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });

    res.status(200).json({ success: true, data: setting });
  } catch (error) {
    next(error);
  }
};

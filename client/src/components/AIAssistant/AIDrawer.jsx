import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, User, Loader2, Maximize2, AlertTriangle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAIStore } from '../../store/aiStore';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

const roleQuickActions = {
  PATIENT: ['Check Symptoms', 'Book Appointment', 'Health Tips'],
  DOCTOR: ['Draft Certificate', 'Lab Summary', 'Voice Notes'],
  RECEPTIONIST: ['Check Doctor Availability', 'Suggest Appointment'],
  LAB_STAFF: ['Summarize Lab Report', 'Detect Critical Values'],
  PHARMACIST: ['Medicine Information', 'Stock Insights'],
  ADMIN: ['Hospital Insights', 'Revenue Summary']
};

const AIDrawer = () => {
  const { isDrawerOpen, closeDrawer, messages, addMessage, activeConversationId, setActiveConversationId, setMessages } = useAIStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const quickActions = user ? roleQuickActions[user.role] || [] : [];

  const deleteMutation = useMutation({
    mutationFn: (convId) => api.delete(`/ai/history/${convId}`),
    onSuccess: () => {
      toast.success('Chat deleted');
      setActiveConversationId(null);
      setMessages([]);
      queryClient.invalidateQueries(['aiHistory']);
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text, overrideType = null) => {
    if (!text.trim()) return;
    
    const userMsg = { id: Date.now(), role: 'user', content: text, timestamp: new Date() };
    addMessage(userMsg);
    setInput('');
    setIsTyping(true);

    try {
      let toolType = 'CHATBOT';
      const lowerText = text.toLowerCase();

      if (overrideType) {
        toolType = overrideType;
      } else if (
        lowerText.includes('symptom') || lowerText.includes('i feel') || lowerText.includes('i have') ||
        lowerText.includes('pain') || lowerText.includes('fever') || lowerText.includes('headache') ||
        lowerText.includes('cough') || lowerText.includes('nausea') || lowerText.includes('dizzy') ||
        lowerText.includes('rash') || lowerText.includes('sore') || lowerText.includes('ache')
      ) {
        toolType = 'SYMPTOM_CHECKER';
      } else if (lowerText.includes('book') || lowerText.includes('appointment') || lowerText.includes('schedule') || lowerText.includes('consult')) {
        toolType = 'APPOINTMENT_PARSER';
      } else if (lowerText.includes('health tip') || lowerText.includes('wellness') || lowerText.includes('lifestyle') || lowerText.includes('personalized')) {
        toolType = 'HEALTH_TIPS';
      } else if (lowerText.includes('lab') || lowerText.includes('report') || lowerText.includes('blood test') || lowerText.includes('summarize my')) {
        toolType = 'LAB_SUMMARY';
      } else if (lowerText.includes('medicine') || lowerText.includes('prescription') || lowerText.includes('medication') || lowerText.includes('explain my') || lowerText.includes('tablet')) {
        toolType = 'PRESCRIPTION_EXPLAINER';
      }

      let inputData = { text };
      if (toolType === 'SYMPTOM_CHECKER') {
        const parts = text.split(/,|and |also |plus /i).map(s => s.trim()).filter(s => s.length > 2);
        inputData = { symptoms: parts.length > 0 ? parts : [text] };
      } else if (toolType === 'HEALTH_TIPS') {
        inputData = { patient: { age: user?.patientProfile?.age || 30, gender: user?.gender, bloodGroup: user?.patientProfile?.bloodGroup } };
      } else if (toolType === 'LAB_SUMMARY') {
        inputData = { results: [], text };
      } else if (toolType === 'PRESCRIPTION_EXPLAINER') {
        const medMatch = text.match(/(?:about|explain|what is|for)\s+([A-Za-z]+)/i);
        const medName = medMatch ? medMatch[1] : text.replace(/explain|medicine|prescription|what is|drug|tablet|about/gi, '').trim() || 'your medication';
        inputData = { medicine: { name: medName, categoryName: 'General' } };
      }

      const payload = { toolType, inputData, conversationId: activeConversationId };
      const res = await api.post('/ai/execute', payload);
      const data = res.data.data;

      if (data.conversationId) {
        setActiveConversationId(data.conversationId);
        queryClient.invalidateQueries(['aiHistory']);
      }

      const formatOutput = (output) => {
        if (typeof output === 'string') return output;
        if (output.summary) return output.summary;
        if (output.reply) return output.reply;
        if (output.explanation) return output.explanation;
        if (output.tip) return output.tip;
        if (output.message) return output.message;
        if (output.success !== undefined) {
          return output.message || (output.specialty
            ? `I understand you need an appointment for ${output.specialty}. Please go to the Patient Dashboard → Book Appointment section to confirm your slot.`
            : "I've processed your appointment request. Please visit the booking section.");
        }
        return "I've processed your request.";
      };

      let aiContent = formatOutput(data);
      if (data.isEmergency) aiContent = data.summary;

      addMessage({
        id: Date.now() + 1,
        role: 'ai',
        content: aiContent,
        isEmergency: data.isEmergency,
        timestamp: new Date()
      });

    } catch (err) {
      addMessage({
        id: Date.now() + 1,
        role: 'ai',
        content: 'Sorry, I encountered an error connecting to the AI service. Please try again.',
        isError: true,
        timestamp: new Date()
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (action) => {
    let tool = 'CHATBOT';
    let prompt = '';
    if (action.includes('Symptoms') || action.includes('Check')) {
      tool = 'SYMPTOM_CHECKER';
      prompt = 'I would like to check my symptoms. I feel unwell.';
    } else if (action.includes('Appointment') || action.includes('Book')) {
      tool = 'APPOINTMENT_PARSER';
      prompt = 'I would like to book an appointment with a doctor.';
    } else if (action.includes('Health Tips') || action.includes('Tips')) {
      tool = 'HEALTH_TIPS';
      prompt = 'Please give me personalized health tips.';
    } else if (action.includes('Lab Summary') || action.includes('Lab')) {
      tool = 'LAB_SUMMARY';
      prompt = 'Please summarize my lab report results.';
    } else if (action.includes('Medicine') || action.includes('Prescription')) {
      tool = 'PRESCRIPTION_EXPLAINER';
      prompt = 'Please explain my prescription medication.';
    } else {
      prompt = `I want to ${action.toLowerCase()}`;
    }
    handleSend(prompt, tool);
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 bg-black/20 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[440px] bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-surface">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
                  <Bot size={24} />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">NovaCare Assistant</h2>
                  <p className="text-xs text-gray-500">How can I help you, {user?.firstName}?</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {activeConversationId && (
                  <button 
                    onClick={() => deleteMutation.mutate(activeConversationId)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete Conversation"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                <button 
                  onClick={() => { closeDrawer(); navigate('/ai-assistant'); }}
                  className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                  title="Open in full workspace"
                >
                  <Maximize2 size={20} />
                </button>
                <button 
                  onClick={closeDrawer}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" aria-live="polite">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-70">
                  <div className="p-4 bg-gray-50 rounded-full">
                    <Bot size={40} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500 max-w-[250px]">
                    I'm your AI health assistant. You can ask me questions, check symptoms, or use the quick actions below.
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-primary/10 text-gray-800 rounded-tr-sm' 
                        : msg.isEmergency 
                          ? 'bg-red-50 border border-red-200 text-red-800 rounded-tl-sm'
                          : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm'
                    }`}>
                      {msg.isEmergency && (
                        <div className="flex items-center space-x-2 font-bold mb-1">
                          <AlertTriangle size={18} className="text-red-600" />
                          <span>EMERGENCY ALERT</span>
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <span className="text-[10px] text-gray-400 block mt-1 opacity-70">
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                ))
              )}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm p-4 shadow-sm">
                    <Loader2 size={18} className="text-primary animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions & Input area */}
            <div className="p-4 bg-white border-t border-gray-100">
              <div className="flex overflow-x-auto space-x-2 pb-3 scrollbar-hide">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickAction(action)}
                    className="whitespace-nowrap px-3 py-1.5 text-xs bg-gray-50 hover:bg-primary/10 hover:text-primary text-gray-600 rounded-full border border-gray-200 transition-colors"
                  >
                    {action}
                  </button>
                ))}
              </div>
              
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
                className="relative flex items-center"
              >
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(input);
                    }
                  }}
                  placeholder="Ask a medical question or enter symptoms..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none max-h-32"
                  rows="1"
                  disabled={isTyping}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2 p-2 bg-primary text-white rounded-lg disabled:opacity-50 hover:bg-secondary transition-colors"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AIDrawer;

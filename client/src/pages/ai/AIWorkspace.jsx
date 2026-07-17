import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, Loader2, MessageSquare, Plus, AlertTriangle, FileText, Trash2 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAIStore } from '../../store/aiStore';
import { useAuthStore } from '../../store/authStore';

const roleQuickActions = {
  PATIENT: ['Check Symptoms', 'Book Appointment', 'Health Tips'],
  DOCTOR: ['Draft Certificate', 'Lab Summary', 'Voice Notes'],
  RECEPTIONIST: ['Check Doctor Availability', 'Suggest Appointment'],
  LAB_STAFF: ['Summarize Lab Report', 'Detect Critical Values'],
  PHARMACIST: ['Medicine Information', 'Stock Insights'],
  ADMIN: ['Hospital Insights', 'Revenue Summary']
};

const fetchHistory = async () => {
  const { data } = await api.get('/ai/history');
  return data.data;
};

const formatInput = (input) => {
   if (typeof input === 'string') return input;
   if (input.text) return input.text;
   if (input.symptoms) return `Symptoms: ${input.symptoms.join(', ')}`;
   return JSON.stringify(input);
};

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

const AIWorkspace = () => {
  const { user } = useAuthStore();
  const { messages, addMessage, setMessages, activeConversationId, setActiveConversationId } = useAIStore();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const { data: history, refetch } = useQuery({
    queryKey: ['aiHistory'],
    queryFn: fetchHistory
  });

  const deleteMutation = useMutation({
    mutationFn: (convId) => api.delete(`/ai/history/${convId}`),
    onSuccess: (_, convId) => {
      toast.success('Chat deleted');
      if (activeConversationId === convId) {
        setActiveConversationId(null);
        setMessages([]);
      }
      refetch();
    }
  });

  const quickActions = user ? roleQuickActions[user.role] || [] : [];

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

      if (data.conversationId && data.conversationId !== activeConversationId) {
        setActiveConversationId(data.conversationId);
        refetch();
      }

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

  const loadConversation = (conv) => {
    setActiveConversationId(conv.conversationId);
    const formattedMessages = [];
    conv.messages.forEach(m => {
      formattedMessages.push({ id: m.id + '_u', role: 'user', content: formatInput(m.input), timestamp: m.timestamp });
      formattedMessages.push({
        id: m.id + '_a',
        role: 'ai',
        content: formatOutput(m.output),
        isEmergency: m.output?.isEmergency || false,
        timestamp: m.timestamp
      });
    });
    setMessages(formattedMessages);
  };

  const startNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100">
      
      {/* Sidebar - History */}
      <div className="w-64 bg-gray-50 border-r border-gray-100 flex flex-col hidden md:flex">
        <div className="p-4 border-b border-gray-100">
          <button 
            onClick={startNewConversation}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-primary text-white rounded-lg hover:bg-secondary transition-colors text-sm font-medium"
          >
            <Plus size={16} /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase px-2 mb-2">Recent Conversations</p>
          {history?.map((conv) => (
            <div key={conv.conversationId} className="flex group relative">
              <button
                onClick={() => loadConversation(conv)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate flex items-center gap-2 transition-colors pr-8 ${
                  activeConversationId === conv.conversationId ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <MessageSquare size={14} className={activeConversationId === conv.conversationId ? 'text-primary' : 'text-gray-400'} />
                {conv.toolType.replace('_', ' ')}
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  deleteMutation.mutate(conv.conversationId);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        <div className="flex-1 overflow-y-auto p-6 space-y-6" aria-live="polite">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="p-4 bg-primary/10 rounded-full mb-6">
                <Bot size={48} className="text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">How can I assist you today?</h2>
              <p className="text-gray-500 mb-8">
                I can help you check symptoms, book appointments, summarize lab reports, and answer general health queries.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(`I want to ${action.toLowerCase()}`)}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-colors text-left"
                  >
                    <FileText size={18} className="text-primary" />
                    <span className="text-sm font-medium text-gray-700">{action}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl p-4 shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-primary/10 text-gray-800 rounded-tr-sm' 
                    : msg.isEmergency 
                      ? 'bg-red-50 border border-red-200 text-red-800 rounded-tl-sm'
                      : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm'
                }`}>
                  {msg.isEmergency && (
                    <div className="flex items-center gap-2 font-bold mb-2">
                      <AlertTriangle size={20} className="text-red-600" />
                      <span>EMERGENCY ALERT</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <span className="text-xs text-gray-400 block mt-2 opacity-70">
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
            ))
          )}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm p-4 shadow-sm">
                <Loader2 size={20} className="text-primary animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-gray-100">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="max-w-4xl mx-auto relative flex items-center"
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
              placeholder="Type your message here..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none max-h-32"
              rows="1"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-3 p-2.5 bg-primary text-white rounded-lg disabled:opacity-50 hover:bg-secondary transition-colors"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>

    </div>
  );
};

export default AIWorkspace;

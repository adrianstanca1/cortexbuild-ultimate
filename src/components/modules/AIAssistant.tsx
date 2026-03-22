// Module: AIAssistant — CortexBuild Ultimate
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Zap, Check, AlertCircle, DollarSign, FileText, BarChart3, Sparkles, Clock, Wrench, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { aiApi } from '../../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agent?: string;
  data?: any;
}

interface Agent {
  id: string;
  name: string;
  icon: React.FC<{ className?: string }>;
  active: boolean;
  lastUsed: string;
  description: string;
  capabilities: string[];
}

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('general');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [suggestions, setSuggestions] = useState<string[]>([
    "Show me all projects",
    "What invoices are overdue?",
    "Show me open safety incidents",
    "What's our current budget position?",
    "Show me open RFIs",
    "What's in our tender pipeline?",
  ]);

  const agents: Agent[] = [
    { 
      id: 'general', 
      name: 'General Assistant', 
      icon: Sparkles, 
      active: true, 
      lastUsed: 'Now',
      description: 'Answer questions across all modules',
      capabilities: ['Projects', 'Invoicing', 'Safety', 'Budget', 'RFIs', 'Tenders']
    },
    { 
      id: 'safety', 
      name: 'Safety Analyser', 
      icon: AlertCircle, 
      active: true, 
      lastUsed: '2 hours ago',
      description: 'Analyze safety incidents and compliance',
      capabilities: ['Incident Analysis', 'Risk Assessment', 'Compliance']
    },
    { 
      id: 'rfi', 
      name: 'RFI Responder', 
      icon: FileText, 
      active: true, 
      lastUsed: '1 day ago',
      description: 'Help draft RFI responses',
      capabilities: ['Response Templates', 'Priority Assessment']
    },
    { 
      id: 'rams', 
      name: 'RAMS Generator', 
      icon: Zap, 
      active: true, 
      lastUsed: '3 days ago',
      description: 'Generate risk assessments and method statements',
      capabilities: ['Template Generation', 'Hazard Identification']
    },
    { 
      id: 'report', 
      name: 'Daily Report Agent', 
      icon: BarChart3, 
      active: true, 
      lastUsed: '1 hour ago',
      description: 'Create and analyze daily site reports',
      capabilities: ['Report Templates', 'Progress Tracking']
    },
    { 
      id: 'change', 
      name: 'Change Order Agent', 
      icon: DollarSign, 
      active: true, 
      lastUsed: '5 days ago',
      description: 'Draft change orders and variations',
      capabilities: ['Cost Estimation', 'Impact Analysis']
    },
    { 
      id: 'tender', 
      name: 'Tender Scorer', 
      icon: TrendingUp, 
      active: true, 
      lastUsed: '1 week ago',
      description: 'Score and evaluate tender submissions',
      capabilities: ['Scoring', 'Feasibility Analysis']
    },
    { 
      id: 'plant', 
      name: 'Plant Manager', 
      icon: Wrench, 
      active: true, 
      lastUsed: '3 days ago',
      description: 'Manage equipment and plant hire',
      capabilities: ['Availability', 'Scheduling', 'Maintenance']
    }
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);


  const handleSendMessage = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      agent: selectedAgent,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setStreamingContent('');

    try {
      const result = await aiApi.chat(messageText, selectedAgent);
      
      // Simulate streaming for better UX
      const fullResponse = result.reply;
      let currentIndex = 0;
      
      const streamInterval = setInterval(() => {
        currentIndex += Math.floor(Math.random() * 10) + 5;
        if (currentIndex >= fullResponse.length) {
          setStreamingContent(fullResponse);
          clearInterval(streamInterval);
        } else {
          setStreamingContent(fullResponse.slice(0, currentIndex));
        }
      }, 20);
      
      // Wait for "streaming" to complete
      await new Promise(resolve => setTimeout(resolve, fullResponse.length * 20 + 100));
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
        agent: selectedAgent,
        data: result.data,
      }]);
      setStreamingContent('');
      if (result.suggestions?.length) setSuggestions(result.suggestions);
    } catch (err) {
      toast.error('AI assistant error. Please try again.');
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error reaching the backend. Please try again.',
        timestamp: new Date(),
        agent: selectedAgent,
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-full flex bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Left Sidebar - Enhanced Agents */}
      <div className="w-72 border-r border-gray-800 bg-gray-900/50 p-4 overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-amber-400" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">AI Agents</h2>
        </div>
        <div className="space-y-3">
          {agents.map(agent => {
            const Icon = agent.icon;
            const isSelected = selectedAgent === agent.id;
            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={clsx(
                  'w-full rounded-xl border p-4 text-left transition-all',
                  isSelected
                    ? 'border-blue-600 bg-blue-900/30 shadow-lg shadow-blue-900/20'
                    : 'border-gray-800 bg-gray-800/30 hover:bg-gray-800/50 hover:border-gray-700'
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={clsx(
                    'p-2 rounded-lg',
                    isSelected ? 'bg-blue-600/30' : 'bg-gray-700/50'
                  )}>
                    <Icon className={clsx('h-4 w-4', isSelected ? 'text-blue-400' : 'text-gray-400')} />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-white">{agent.name}</span>
                    {isSelected && (
                      <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-blue-600 text-white rounded">Active</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-2">{agent.description}</p>
                <div className="flex flex-wrap gap-1">
                  {agent.capabilities.slice(0, 3).map((cap, i) => (
                    <span key={i} className="px-2 py-0.5 bg-gray-700/50 text-gray-400 text-[10px] rounded-full">
                      {cap}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-800 bg-gradient-to-r from-blue-900/20 to-purple-900/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <Bot className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                {agents.find(a => a.id === selectedAgent)?.name || 'CortexBuild AI'}
              </h1>
              <p className="text-xs text-blue-300">Powered by local AI · No data leaves your server</p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <div className="p-4 bg-blue-600/10 rounded-2xl mb-4">
                <Sparkles className="h-12 w-12 text-blue-500" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-white">
                How can I help you today?
              </h2>
              <p className="mb-6 text-center text-sm text-gray-400 max-w-lg">
                Ask about your projects, safety incidents, invoices, tenders, or any construction management topic.
              </p>
              <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                {suggestions.slice(0, 6).map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-3 text-sm text-gray-300 transition hover:border-orange-500 hover:bg-gray-800 hover:text-white text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map(msg => (
                <div key={msg.id} className={clsx('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-600/30">
                      <Bot className="h-5 w-5 text-blue-400" />
                    </div>
                  )}
                  <div
                    className={clsx(
                      'max-w-2xl rounded-2xl px-5 py-3 text-sm',
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-900/30'
                        : 'bg-gray-800 text-gray-100 border border-gray-700 shadow-lg'
                    )}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {msg.data && (
                      <div className="mt-3 pt-3 border-t border-gray-700/50">
                        <div className="flex gap-2 flex-wrap">
                          {Object.entries(msg.data).slice(0, 4).map(([key, value]) => (
                            <span key={key} className="px-2 py-1 bg-gray-700/50 rounded text-xs">
                              <span className="text-gray-400">{key}:</span>{' '}
                              <span className="text-blue-300">{typeof value === 'object' ? JSON.stringify(value).slice(0, 30) : String(value)}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {streamingContent && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-600/30">
                    <Bot className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="max-w-2xl rounded-2xl px-5 py-3 text-sm bg-gray-800 text-gray-100 border border-gray-700">
                    <div className="whitespace-pre-wrap">{streamingContent}<span className="animate-pulse">▌</span></div>
                  </div>
                </div>
              )}
              {isTyping && !streamingContent && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-600/30">
                    <Bot className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="bg-gray-800 text-gray-400 rounded-2xl px-5 py-3 border border-gray-700">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 rounded-full bg-gray-500 animate-bounce" />
                      <div className="h-2 w-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="h-2 w-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Suggestion chips */}
        {messages.length > 0 && suggestions.length > 0 && (
          <div className="border-t border-gray-800 bg-gray-900/30 px-4 py-3">
            <p className="text-xs text-gray-500 mb-2">Suggested follow-ups:</p>
            <div className="flex gap-2 flex-wrap">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => handleSendMessage(s)}
                  className="rounded-full border border-gray-700 bg-gray-800/50 px-3 py-1.5 text-xs text-gray-400 transition hover:border-orange-500 hover:text-white">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-800 bg-gray-900/50 p-4">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={`Ask the ${agents.find(a => a.id === selectedAgent)?.name || 'AI'}...`}
              className="flex-1 rounded-xl border border-gray-700 bg-gray-800 px-5 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isTyping}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-3 text-white transition hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/30"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <p className="text-[10px] text-gray-600 mt-2 text-center">
            Local AI processing · Your data stays on this server
          </p>
        </div>
      </div>
    </div>
  );
}

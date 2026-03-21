// Module: AIAssistant — CortexBuild Ultimate
import { useState, useEffect } from 'react';
import { Send, Bot, Zap, Check, AlertCircle, DollarSign, FileText, BarChart3 } from 'lucide-react';
import clsx from 'clsx';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Agent {
  id: string;
  name: string;
  icon: React.FC<{ className?: string }>;
  active: boolean;
  lastUsed: string;
}

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('safety');
  const [isTyping, setIsTyping] = useState(false);

  const agents: Agent[] = [
    { id: 'safety', name: 'Safety Analyser', icon: AlertCircle, active: true, lastUsed: '2 hours ago' },
    { id: 'rfi', name: 'RFI Responder', icon: FileText, active: true, lastUsed: '1 day ago' },
    { id: 'rams', name: 'RAMS Generator', icon: Zap, active: true, lastUsed: '3 days ago' },
    { id: 'report', name: 'Daily Report Agent', icon: BarChart3, active: true, lastUsed: '1 hour ago' },
    { id: 'change', name: 'Change Order Agent', icon: DollarSign, active: true, lastUsed: '5 days ago' },
    { id: 'tender', name: 'Tender Scorer', icon: Check, active: true, lastUsed: '1 week ago' }
  ];

  const suggestedPrompts = [
    "Analyse this week's safety incidents",
    "Draft response for RFI-CW-042",
    "Generate RAMS for scaffold erection",
    "Summarise Canary Wharf daily report",
    "Calculate CIS deduction for Apex Electrical",
    "What's our current cash position?"
  ];

  const mockResponses: Record<string, string> = {
    "Analyse this week's safety incidents": "This week has shown a 15% reduction in near-miss incidents compared to the previous week, with the primary concern being fall-from-height risks on elevated work areas. I recommend prioritising working-at-height toolbox talks and conducting secondary inspections of all fall protection equipment. The Canary Wharf site particularly needs attention with 3 near-miss reports.",
    "Draft response for RFI-CW-042": "RFI-CW-042 Structural beam specification — Response: The UC 305×305×198 specification per the structural drawings should take precedence over the earlier notation. The higher capacity design provides necessary safety margins for the anticipated loading patterns and is recommended by the structural engineer. Approval granted to proceed with UC 305 sections.",
    "Generate RAMS for scaffold erection": "RAMS document generated for Scaffold Erection Activity. Key hazards identified: (1) Falls from height — controls: full harness systems, guardrails; (2) Collapse of scaffold — controls: design verification, weekly inspections; (3) Falling objects — controls: safety nets, hard hat zones. Document ready for review by HSE team.",
    "Summarise Canary Wharf daily report": "Canary Wharf Site Summary — Floor 8 steel erection 92% complete. Concrete pour scheduled for Level 7 on schedule. MEP rough-in work progressing well on floors 3-4. No safety incidents. Weather ideal for external works. Weekly target tracking 98% completion.",
    "Calculate CIS deduction for Apex Electrical": "CIS Deduction Calculation (Apex Electrical, March 2026): Gross Payment: £48,500 | Materials: £12,000 | Labour: £36,500 | CIS Rate (Verified): 20% | Deduction: £7,300 | Net Payment: £41,200. Monthly summary and payment advice prepared for submission.",
    "What's our current cash position?": "Current Cash Position (as of 21 March 2026): Invoiced to clients: £588.5K | Paid in: £94.5K | Outstanding: £279.2K (including £67.2K overdue). Recommended actions: Chase overdue invoices on WM Council (£67.2K) and issue escalation notice on disputed invoice from Nordic Logistics."
  };

  const handleSendMessage = (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: mockResponses[messageText] || `I'll analyse your request regarding "${messageText}". Based on current project data and safety protocols, here are my insights and recommendations for the CortexBuild team.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="h-full flex bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Left Sidebar - Agents */}
      <div className="w-64 border-r border-gray-800 bg-gray-900/50 p-4 overflow-y-auto">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">AI Agents</h2>
        <div className="space-y-2">
          {agents.map(agent => {
            const Icon = agent.icon;
            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={clsx(
                  'w-full rounded-xl border p-3 text-left transition-all',
                  selectedAgent === agent.id
                    ? 'border-blue-600 bg-blue-900/30'
                    : 'border-gray-800 bg-gray-800/30 hover:bg-gray-800/50'
                )}
              >
                <div className="mb-2 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-semibold text-white">{agent.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 text-emerald-400">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Active
                  </span>
                  <span className="text-gray-500">{agent.lastUsed}</span>
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
          <h1 className="mb-1 text-2xl font-bold text-white">CortexBuild AI</h1>
          <p className="text-xs text-blue-300">Powered by Claude · Advanced Construction Intelligence</p>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <Zap className="mb-4 h-12 w-12 text-blue-500/50" />
              <h2 className="mb-2 text-xl font-bold text-white">Ask CortexBuild AI</h2>
              <p className="mb-6 text-center text-sm text-gray-400 max-w-md">
                Get instant insights on safety, RFIs, RAMS, reports, and more. Our AI agents are ready to assist.
              </p>
              <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                {suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-xs text-gray-300 transition hover:border-blue-600 hover:bg-gray-800 hover:text-white"
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
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-600/20 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-blue-400" />
                    </div>
                  )}
                  <div
                    className={clsx(
                      'max-w-md rounded-xl px-4 py-3 text-sm',
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-100 border border-gray-700'
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-600/20 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="bg-gray-800 text-gray-400 rounded-xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 rounded-full bg-gray-500 animate-bounce" />
                      <div className="h-2 w-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="h-2 w-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-800 bg-gray-900/50 p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask anything about your projects..."
              className="flex-1 rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-600"
            />
            <button
              onClick={() => handleSendMessage()}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-3 text-white transition hover:from-blue-500 hover:to-blue-600"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

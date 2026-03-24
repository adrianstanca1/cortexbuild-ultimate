// Module: AIAssistant — CortexBuild Ultimate
import { useState, useEffect, useRef } from 'react';
import {
  Send, Bot, Zap, Shield, TrendingUp, FileText, Calendar,
  MessageSquare, Award, Brain, Clock, Archive, Plus
} from 'lucide-react';
import clsx from 'clsx';
import {
  projects, invoices, safetyIncidents, rfis, changeOrders,
  teamMembers
} from '../../data/mockData';
import { sendChatMessage } from '../../services/ai';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatSession {
  id: string;
  firstMessage: string;
  date: Date;
}

interface Agent {
  id: string;
  name: string;
  icon: React.FC<{ className?: string }>;
  active: boolean;
  lastUsed: string;
  systemPrompt: string;
  suggestedPrompts: string[];
}

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('project-analyzer');
  const [isTyping, setIsTyping] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const agents: Agent[] = [
    {
      id: 'project-analyzer',
      name: 'Project Analyzer',
      icon: Brain,
      active: true,
      lastUsed: '2 hours ago',
      systemPrompt: 'You are an expert construction project manager. Provide insights on project progress, budgets, schedules, and risks. Reference real project data when answering questions.',
      suggestedPrompts: [
        'What projects are currently active?',
        'Show me the Canary Wharf project status',
        'Which projects are over budget?',
        'Project completion forecast for Q2?',
        'Compare Birmingham Bridge vs Manchester Apartments',
        'Show risk summary for all projects'
      ]
    },
    {
      id: 'safety-compliance',
      name: 'Safety Compliance',
      icon: Shield,
      active: true,
      lastUsed: '1 hour ago',
      systemPrompt: 'You are a safety and compliance expert. Analyze incidents, generate RAMS documents, ensure regulatory adherence, and provide safety recommendations. Use actual safety data in your responses.',
      suggestedPrompts: [
        "What are this week's safety incidents?",
        'Generate RAMS for scaffold erection',
        'Show serious hazards requiring action',
        'Compliance status across all sites?',
        'Near-miss trend analysis',
        'RAMS approval summary'
      ]
    },
    {
      id: 'financial-advisor',
      name: 'Financial Advisor',
      icon: TrendingUp,
      active: true,
      lastUsed: '30 mins ago',
      systemPrompt: 'You are a financial expert in construction. Analyze invoices, cash flow, CIS deductions, change orders, and profitability. Provide real financial data and recommendations.',
      suggestedPrompts: [
        'Any overdue invoices?',
        'What is our current cash position?',
        'Calculate CIS for Apex Electrical',
        'Change orders status summary',
        'Invoice aging analysis',
        'Project profitability breakdown'
      ]
    },
    {
      id: 'document-processor',
      name: 'Document Processor',
      icon: FileText,
      active: true,
      lastUsed: '3 days ago',
      systemPrompt: 'You are an expert in construction documentation. Help with RFIs, drawings, contracts, permits, and document management. Reference actual documents and RFI data.',
      suggestedPrompts: [
        'Draft response for RFI-CW-042',
        'RFI status across all projects',
        'What documents do we need for Sheffield Hospital?',
        'Pending RFI responses',
        'Document version control summary',
        'Create specification clarification'
      ]
    },
    {
      id: 'schedule-manager',
      name: 'Schedule Manager',
      icon: Calendar,
      active: true,
      lastUsed: '5 days ago',
      systemPrompt: 'You are a construction scheduling expert. Manage timelines, milestone tracking, schedule impacts, and resource planning. Use actual project schedule data.',
      suggestedPrompts: [
        'Project timeline overview',
        'Critical path analysis — Canary Wharf',
        'Schedule delay risks',
        'Upcoming milestones this month',
        'Resource allocation by project',
        'Programme impact of change orders'
      ]
    },
    {
      id: 'rams-generator',
      name: 'RAMS Generator',
      icon: Zap,
      active: true,
      lastUsed: '1 week ago',
      systemPrompt: 'You are a RAMS (Risk Assessment Method Statement) specialist. Generate comprehensive RAMS documents with hazard identification, controls, and method statements.',
      suggestedPrompts: [
        'Generate RAMS for concrete pour',
        'RAMS for crane operations',
        'Working at height method statement',
        'Excavation and shoring RAMS',
        'Steelwork erection RAMS',
        'Review RAMS approval status'
      ]
    },
    {
      id: 'rfi-responder',
      name: 'RFI Responder',
      icon: MessageSquare,
      active: true,
      lastUsed: '2 days ago',
      systemPrompt: 'You are an RFI (Request For Information) specialist. Respond to RFI queries with technical accuracy, referencing drawings and specifications. Use actual RFI data.',
      suggestedPrompts: [
        'Outstanding RFI list',
        'Draft technical response for RFI-MC-018',
        'RFI priority matrix',
        'Average RFI response time',
        'Critical path RFIs',
        'RFI resolution summary'
      ]
    },
    {
      id: 'tender-scorer',
      name: 'Tender Scorer',
      icon: Award,
      active: true,
      lastUsed: '3 days ago',
      systemPrompt: 'You are a tender and bid specialist. Evaluate opportunities, score tenders, assess win probability, and provide strategy recommendations.',
      suggestedPrompts: [
        'Tender pipeline status',
        'Win probability analysis',
        'Tender scoring breakdown',
        'Royal Liverpool University Hospital opportunity',
        'Resource capacity for upcoming tenders?',
        'Tender strategy recommendations'
      ]
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateContextAwareResponse = (query: string, agentId: string): string => {
    const lowercaseQuery = query.toLowerCase();

    // Project Analyzer responses
    if (agentId === 'project-analyzer') {
      if (lowercaseQuery.includes('active') && lowercaseQuery.includes('project')) {
        const activeProjects = projects.filter(p => p.status === 'active');
        return `## Active Projects Summary\n\nWe currently have **${activeProjects.length} active projects**:\n\n${activeProjects.map(p =>
          `**${p.name}**\n` +
          `• Location: ${p.location}\n` +
          `• Progress: ${p.progress}%\n` +
          `• Budget: £${(p.budget / 1000000).toFixed(1)}M | Spent: £${(p.spent / 1000000).toFixed(1)}M\n` +
          `• Manager: ${p.manager}\n` +
          `• Phase: ${p.phase}`
        ).join('\n\n')}`;
      }

      if (lowercaseQuery.includes('canary wharf') || lowercaseQuery.includes('cw')) {
        const cw = projects.find(p => p.name.includes('Canary Wharf'));
        if (cw) {
          return `## Canary Wharf Office Complex Status\n\n**Project Details**\n• Manager: ${cw.manager}\n• Progress: ${cw.progress}%\n• Budget: £${(cw.budget / 1000000).toFixed(1)}M\n• Spent: £${(cw.spent / 1000000).toFixed(1)}M\n• Current Phase: ${cw.phase}\n• Workers On Site: ${cw.workers}\n\n**Financial Summary**\n• Contract Value: £${(cw.contractValue / 1000000).toFixed(1)}M\n• Spend Rate: ${((cw.spent / cw.budget) * 100).toFixed(1)}%\n• Remaining Budget: £${((cw.budget - cw.spent) / 1000000).toFixed(1)}M`;
        }
      }

      if (lowercaseQuery.includes('over budget') || lowercaseQuery.includes('budget overrun')) {
        const overBudget = projects.filter(p => p.spent > p.budget);
        if (overBudget.length === 0) {
          return 'Good news! All active projects are currently within budget. Spend rates are healthy across the portfolio.';
        }
        return `${overBudget.length} projects are currently over budget:\n\n${overBudget.map(p =>
          `• **${p.name}**: Over by £${((p.spent - p.budget) / 1000).toFixed(0)}K (${((p.spent / p.budget - 1) * 100).toFixed(1)}% overrun)`
        ).join('\n')}`;
      }
    }

    // Safety Compliance responses
    if (agentId === 'safety-compliance') {
      if (lowercaseQuery.includes('incident') || lowercaseQuery.includes('safety')) {
        const thisWeekIncidents = safetyIncidents.filter(s => {
          const incidentDate = new Date(s.date);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return incidentDate > weekAgo;
        });

        const seriousIncidents = thisWeekIncidents.filter(s => s.severity === 'serious');
        return `## Safety Incident Summary\n\n**This Week's Incidents:** ${thisWeekIncidents.length}\n\n${thisWeekIncidents.map(s =>
          `**${s.title}** (${s.type.toUpperCase()})\n` +
          `• Project: ${s.project}\n` +
          `• Severity: ${s.severity}\n` +
          `• Status: ${s.status}\n` +
          `• Reported: ${s.reportedBy}`
        ).join('\n\n')}\n\n${seriousIncidents.length > 0 ? `⚠️ **Action Required:** ${seriousIncidents.length} serious incidents need immediate attention.` : '✓ No serious incidents this week.'}`;
      }

      if (lowercaseQuery.includes('rams')) {
        return `## RAMS Status\n\nRAMS documents in system: **${projects.length}** primary documents\n\n**Approval Status:**\n• James Harrington: ${teamMembers.filter(t => t.ramsCompleted).length}/8 team members RAMS completed\n• Next review: 2026-04-01\n\nKey RAMS Activities:\n• Structural Steelwork Installation (Canary Wharf) — Approved, signature 8/10\n• Scaffold Erection — Ready for generation\n• Concrete Pour Operations — Draft pending review`;
      }
    }

    // Financial Advisor responses
    if (agentId === 'financial-advisor') {
      if (lowercaseQuery.includes('overdue') || lowercaseQuery.includes('cash')) {
        const overdueInvoices = invoices.filter(i => i.status === 'overdue' || i.status === 'disputed');
        const totalOutstanding = invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.amount + i.vat, 0);
        const totalOverdue = overdueInvoices.reduce((sum, i) => sum + i.amount + i.vat, 0);

        return `## Financial Status\n\n**Overdue Invoices:** ${overdueInvoices.length}\n**Total Overdue: £${(totalOverdue / 1000).toFixed(0)}K**\n\n${overdueInvoices.map(i =>
          `**${i.number}** — ${i.client}\n` +
          `• Project: ${i.project}\n` +
          `• Amount: £${i.amount.toLocaleString()}\n` +
          `• Due: ${i.dueDate}\n` +
          `• Status: ${i.status}`
        ).join('\n\n')}\n\n**Action Items:**\nPriority: Chase West Midlands Council (£67.2K) and Nordic Logistics (£234.96K) this week.`;
      }

      if (lowercaseQuery.includes('cash position') || lowercaseQuery.includes('position')) {
        const totalInvoiced = invoices.reduce((sum, i) => sum + i.amount + i.vat, 0);
        const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount + i.vat, 0);
        const totalOutstanding = totalInvoiced - totalPaid;

        return `## Current Cash Position (as of 23 March 2026)\n\n**Invoicing & Payments**\n• Total Invoiced: £${(totalInvoiced / 1000).toFixed(0)}K\n• Paid In: £${(totalPaid / 1000).toFixed(0)}K\n• Outstanding: £${(totalOutstanding / 1000).toFixed(0)}K\n\n**Invoice Status Breakdown**\n• Paid: ${invoices.filter(i => i.status === 'paid').length}\n• Sent: ${invoices.filter(i => i.status === 'sent').length}\n• Overdue: ${invoices.filter(i => i.status === 'overdue').length}\n• Disputed: ${invoices.filter(i => i.status === 'disputed').length}\n\n**Recommendation:** Prioritize collection of overdue amounts from West Midlands Council and Nordic Logistics.`;
      }

      if (lowercaseQuery.includes('cis')) {
        return `## CIS Deduction Summary\n\nTotal CIS-registered contractors: 3\n\n**Pending CIS Returns (March 2026)**\n• Apex Electrical Ltd: £7,300 deduction on £48,500 gross\n• Northen Groundworks Ltd: £3,900 deduction on £28,000 gross\n\n**Submission Deadline:** 14th of following month (14 April 2026)\n\nAll contractors verified and current. No compliance issues.`;
      }
    }

    // Document Processor responses
    if (agentId === 'document-processor') {
      if (lowercaseQuery.includes('rfi-cw-042')) {
        const rfi = rfis.find(r => r.number === 'RFI-CW-042');
        if (rfi) {
          return `## RFI-CW-042 Response Draft\n\n**Subject:** ${rfi.subject}\n\n**Question:** ${rfi.question}\n\n**Recommended Response:**\n\nThe UC 305×305×198 specification per the structural drawings should take precedence over the earlier notation. The higher capacity design provides necessary safety margins for the anticipated loading patterns and is recommended by the structural engineer. Approval granted to proceed with UC 305 sections.\n\n**Action:** Provide formal written confirmation to Meridian Properties within 48 hours to avoid programme impact.`;
        }
      }

      if (lowercaseQuery.includes('rfi')) {
        return `## RFI Status Summary\n\n**Open RFIs:** ${rfis.filter(r => r.status === 'open').length}\n**Pending Responses:** ${rfis.filter(r => r.status === 'pending').length}\n**Answered:** ${rfis.filter(r => r.status === 'answered').length}\n\n**Critical Priority RFIs:**\n${rfis.filter(r => r.priority === 'critical').map(r =>
          `• **${r.number}** — ${r.subject}\n  Project: ${r.project}\n  Due: ${r.dueDate}`
        ).join('\n')}\n\n**Recommendation:** Address RFI-MC-018 (Waterproofing system) urgently — due 2026-03-21.`;
      }
    }

    // RFI Responder responses
    if (agentId === 'rfi-responder') {
      if (lowercaseQuery.includes('outstanding') || lowercaseQuery.includes('rfi') && lowercaseQuery.includes('list')) {
        const openRfis = rfis.filter(r => r.status !== 'answered');
        return `## Outstanding RFIs\n\n**Total: ${openRfis.length}**\n\n${openRfis.map(r =>
          `**${r.number}** — ${r.project}\n` +
          `• Status: ${r.status}\n` +
          `• Priority: ${r.priority}\n` +
          `• Due: ${r.dueDate}\n` +
          `• Subject: ${r.subject}`
        ).join('\n\n')}\n\nAverage response time: 4-6 days. Critical path RFIs flagged for expedited handling.`;
      }
    }

    // Tender Scorer responses
    if (agentId === 'tender-scorer') {
      if (lowercaseQuery.includes('pipeline') || lowercaseQuery.includes('tender')) {
        return `## Tender Pipeline Status\n\n**Draft:** 1 opportunity\n**Shortlisted:** 1 opportunity\n**Submitted:** 1 opportunity\n**Won:** 1 opportunity\n\n**High-Probability Opportunities (Win % > 60%):**\n\n1. **Nottingham City Centre Hotel — New Build**\n   • Client: Premier Hospitality\n   • Value: £4.2M\n   • Win Probability: 65%\n   • AI Score: 81/100\n   • Deadline: 2026-04-30\n   • Notes: Excellent client relationship, competitive pricing\n\n**Strategic Recommendation:** Prioritize Nottingham (65% win) and Royal Liverpool (45% win with NHS track record). Consider sub-contracting partnership for Manchester Airport (25% win — too risky as lead contractor).`;
      }
    }

    // Default intelligent response
    return `I'll analyze your request regarding "${query}". Based on current project data and CortexBuild systems, here are my insights:\n\n**Key Data Points:**\n• Active Projects: ${projects.filter(p => p.status === 'active').length}\n• Team Members: ${teamMembers.length}\n• Outstanding RFIs: ${rfis.filter(r => r.status !== 'answered').length}\n• Safety Incidents (this week): ${safetyIncidents.filter(s => {
      const d = new Date(s.date);
      return d > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }).length}\n\nPlease ask a more specific question to get targeted insights from this agent.`;
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

    if (messages.length === 0) {
      const newSessionId = Date.now().toString();
      setChatSessions(prev => [
        { id: newSessionId, firstMessage: messageText, date: new Date() },
        ...prev
      ]);
      setCurrentSessionId(newSessionId);
    }

    setIsTyping(true);

    sendChatMessage(messageText, { agent: selectedAgent, context: {} })
      .then((response) => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          isStreaming: true
        };

        setMessages(prev => [...prev, assistantMessage]);

        const words = response.reply.split(' ');
        let currentIndex = 0;

        const streamInterval = setInterval(() => {
          if (currentIndex < words.length) {
            const newContent = words.slice(0, currentIndex + 1).join(' ');
            setMessages(prev => [
              ...prev.slice(0, -1),
              { ...assistantMessage, content: newContent + ' |' }
            ]);
            currentIndex++;
          } else {
            clearInterval(streamInterval);
            setMessages(prev => [
              ...prev.slice(0, -1),
              { ...assistantMessage, content: response.reply, isStreaming: false }
            ]);
            setIsTyping(false);
          }
        }, Math.random() * 20 + 40);
      })
      .catch((error) => {
        console.error('AI Chat error:', error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Sorry, I encountered an error: ${error.message}. Please try again or check if the server is running.`,
          timestamp: new Date(),
          isStreaming: false
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsTyping(false);
      });
  };

  const selectedAgentData = agents.find(a => a.id === selectedAgent)!;

  return (
    <div className="h-full flex bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Left Sidebar - Chat History & Agents */}
      <div className="w-64 border-r border-gray-800 bg-gray-900/50 p-4 overflow-y-auto flex flex-col">
        {/* New Chat Button */}
        <button
          onClick={() => {
            setMessages([]);
            setInput('');
            setCurrentSessionId(null);
          }}
          className="mb-4 w-full flex items-center justify-center gap-2 rounded-xl border border-gray-700 bg-blue-900/30 px-4 py-2 text-sm text-blue-300 transition hover:bg-blue-900/50"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>

        {/* Chat History */}
        {chatSessions.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500">Today's Chats</h3>
            <div className="space-y-1">
              {chatSessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => {
                    setCurrentSessionId(session.id);
                    // In a real app, load messages from this session
                  }}
                  className={clsx(
                    'w-full rounded-lg border px-3 py-2 text-left text-xs transition',
                    currentSessionId === session.id
                      ? 'border-blue-600 bg-blue-900/30 text-white'
                      : 'border-gray-700 bg-gray-800/20 text-gray-400 hover:text-gray-300'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-3 w-3" />
                    <span className="truncate font-medium">{session.firstMessage.slice(0, 40)}</span>
                  </div>
                  <div className="text-xs text-gray-500">{session.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Agents */}
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">AI Agents</h2>
        <div className="space-y-2 flex-1">
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-1 text-2xl font-bold text-white">CortexBuild AI</h1>
              <p className="text-xs text-blue-300">
                {selectedAgentData.name} · {selectedAgentData.systemPrompt.slice(0, 60)}...
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-gray-800/50 px-3 py-2">
              <Archive className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-300">
                <span className="font-semibold text-white">{projects.length}</span> Projects ·
                <span className="ml-1 font-semibold text-white">{invoices.length}</span> Invoices ·
                <span className="ml-1 font-semibold text-white">{safetyIncidents.length}</span> Incidents
              </span>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <selectedAgentData.icon className="mb-4 h-12 w-12 text-blue-500/50" />
              <h2 className="mb-2 text-xl font-bold text-white">{selectedAgentData.name}</h2>
              <p className="mb-6 text-center text-sm text-gray-400 max-w-md">
                {selectedAgentData.systemPrompt}
              </p>
              <div className="grid grid-cols-1 gap-2 w-full max-w-2xl">
                {selectedAgentData.suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2 text-sm text-gray-300 text-left transition hover:border-blue-600 hover:bg-gray-800 hover:text-white"
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
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-600/20 flex items-center justify-center mt-1">
                      <selectedAgentData.icon className="h-4 w-4 text-blue-400" />
                    </div>
                  )}
                  <div
                    className={clsx(
                      'max-w-2xl rounded-xl px-4 py-3 text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-100 border border-gray-700'
                    )}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-invert prose-sm">
                        {msg.content.split('\n').map((line, idx) => {
                          if (line.startsWith('##')) {
                            return (
                              <h3 key={idx} className="text-base font-bold text-white mt-3 mb-2">
                                {line.replace(/^##\s*/, '')}
                              </h3>
                            );
                          }
                          if (line.startsWith('•')) {
                            return (
                              <li key={idx} className="ml-4 text-gray-200">
                                {line.replace(/^•\s*/, '')}
                              </li>
                            );
                          }
                          if (line.includes('**') && line.includes('**')) {
                            return (
                              <p key={idx} className="text-gray-300">
                                {line.split(/\*\*(.*?)\*\*/g).map((part, i) =>
                                  i % 2 === 1 ? (
                                    <strong key={i} className="text-white font-semibold">
                                      {part}
                                    </strong>
                                  ) : (
                                    part
                                  )
                                )}
                              </p>
                            );
                          }
                          if (line.startsWith('⚠️') || line.startsWith('✓')) {
                            return (
                              <p key={idx} className={clsx(
                                'rounded px-3 py-2 mt-2',
                                line.startsWith('⚠️') ? 'bg-amber-900/30 text-amber-200' : 'bg-emerald-900/30 text-emerald-200'
                              )}>
                                {line}
                              </p>
                            );
                          }
                          return line.trim() ? (
                            <p key={idx} className="text-gray-300 mb-2">
                              {line}
                            </p>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-600/20 flex items-center justify-center mt-1">
                    <selectedAgentData.icon className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="bg-gray-800 text-gray-400 rounded-xl px-4 py-3 border border-gray-700">
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

        {/* Input Area */}
        <div className="border-t border-gray-800 bg-gray-900/50 p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={`Ask ${selectedAgentData.name.toLowerCase()}...`}
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

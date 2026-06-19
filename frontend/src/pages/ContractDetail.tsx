import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useContractStore, Clause } from "../store/contractStore";
import { api, BASE_URL } from "../services/api";
import { 
  FileText, 
  ShieldAlert, 
  ArrowLeft, 
  Download, 
  Bot, 
  Send,
  MessageSquare,
  Sparkles,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileSearch2,
  ChevronRight,
  TrendingDown
} from "lucide-react";

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const { selectedContract, isLoading, fetchContractDetail } = useContractStore();
  const [activeTab, setActiveTab] = useState<"overview" | "clauses" | "missing" | "compliance">("overview");
  
  // Interactive clause highlighting
  const [selectedClauseType, setSelectedClauseType] = useState<string | null>(null);
  
  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ q: string; a: string; time: Date }>>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load contract details on load
  useEffect(() => {
    if (id) {
      fetchContractDetail(id);
    }
  }, [id]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, chatLoading]);

  if (isLoading || !selectedContract) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <LoaderSpinner />
        <p className="text-xs text-muted-foreground font-semibold">Running Multi-Agent Audit Pipeline...</p>
      </div>
    );
  }

  const { clauses = [], compliance_reports = [], risk_assessments = [] } = selectedContract;

  // Click handler for heatmap sections
  const handleHeatmapClick = (category: string) => {
    setActiveTab("clauses");
    // Map heatmap category to clause types
    let targetClause = category;
    if (category === "Liability") targetClause = "Liability";
    else if (category === "Financial Risk") targetClause = "Payment Terms";
    else if (category === "Compliance Risk") targetClause = "Governing Law";
    else if (category === "IP Risk") targetClause = "Intellectual Property";
    else if (category === "Data Privacy Risk") targetClause = "Data Protection";
    else if (category === "Operational Risk") targetClause = "Termination";
    
    setSelectedClauseType(targetClause);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !id) return;
    
    const userQ = question;
    setQuestion("");
    setChatHistory(prev => [...prev, { q: userQ, a: "", time: new Date() }]);
    setChatLoading(true);
    
    try {
      const response = await api.post<any>("/chat", {
        contract_id: id,
        question: userQ
      });
      
      // Update history with response
      setChatHistory(prev => {
        const updated = [...prev];
        updated[updated.length - 1].a = response.answer;
        return updated;
      });
    } catch (err: any) {
      setChatHistory(prev => {
        const updated = [...prev];
        updated[updated.length - 1].a = `Failed to get response: ${err.message}`;
        return updated;
      });
    } finally {
      setChatLoading(false);
    }
  };

  // Simulated obligation data based on contract type
  const obligationData = {
    NDA: {
      dates: ["Effective Date: Upon signing", "Expiration: 3 years from signature"],
      conditions: "NDA expires 36 months after signature. All confidentiality obligations survive for 5 years.",
      commitments: "No financial payments under standard NDA template.",
      obligations: [
        "Use Confidential Information solely for the Purpose of evaluation.",
        "Refrain from disclosing details to third party vendors.",
        "Securely return or destroy copies upon written request."
      ]
    },
    default: {
      dates: ["Effective Date: Upon signing", "Renewal Notice: 30 days prior"],
      conditions: "Auto-renews for consecutive 12-month terms unless terminated via prior notice.",
      commitments: "Standard Net 30/90 invoice payment cycles.",
      obligations: [
        "Maintain confidentiality covenants.",
        "Render services and goods in accordance with SLAs.",
        "Deliver written termination statements to proper channels."
      ]
    }
  };

  const getObligations = () => {
    if (selectedContract.contract_type.includes("NDA")) {
      return obligationData.NDA;
    }
    return obligationData.default;
  };
  
  const obligations = getObligations();

  // Helper to highlight contract text containing clause keywords
  const highlightClauseInText = (text: string) => {
    if (!selectedClauseType) return text;
    
    // Find keywords for selected clause type
    const keywords: { [key: string]: string[] } = {
      Confidentiality: ["confidential", "disclosure", "proprietary", "secret"],
      Liability: ["liable", "liability", "damages", "limitation of liability", "indemnify limit"],
      Termination: ["terminate", "termination", "cure period", "material breach"],
      Indemnification: ["indemnify", "indemnification", "hold harmless", "defend"],
      "Governing Law": ["governing law", "jurisdiction", "choice of law", "arbitration"],
      "Force Majeure": ["force majeure", "act of god", "unforeseen", "natural disaster"],
      "Payment Terms": ["payment", "invoice", "fees", "net 30", "net 90", "price"],
      "Intellectual Property": ["intellectual property", "ip", "patent", "copyright", "ownership"],
      "Data Protection": ["data protection", "gdpr", "privacy", "personal data", "dpa", "security"],
      "Non-Compete": ["non-compete", "solicit", "restrictive covenant"]
    };

    const targetKws = keywords[selectedClauseType] || [];
    if (targetKws.length === 0) return text;

    // Standard high-level highlighter split
    const parts = text.split(new RegExp(`(${targetKws.join("|")})`, "gi"));
    return (
      <>
        {parts.map((part, i) => {
          const isMatch = targetKws.some(kw => part.toLowerCase() === kw.toLowerCase());
          return isMatch ? (
            <span key={i} className="bg-teal-500/25 border-b border-teal-400 font-semibold px-0.5 text-white">
              {part}
            </span>
          ) : (
            part
          );
        })}
      </>
    );
  };

  // Helper to color heatmap grid blocks
  const getRiskColorClass = (score: number) => {
    if (score >= 75) return "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/15";
    if (score >= 50) return "bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/15";
    if (score >= 30) return "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/15";
    return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/15";
  };

  const getRiskBadge = (score: number) => {
    if (score >= 70) return "risk-badge-high";
    if (score >= 40) return "risk-badge-medium";
    return "risk-badge-low";
  };

  // Simulated contract text if text is short
  const contractRawText = selectedContract.status === "completed" 
    ? (clauses.map(c => c.clause_text).join("\n\n") || "Standard contract terms and obligations agreement.") 
    : "Extracting contract content...";

  // Simulated missing clauses (matches backend)
  const missingClausesMock = [
    {
      missing_clause: "Force Majeure",
      why_it_matters: "Excuses non-performance due to natural disasters, war, pandemics, or unforeseen events.",
      suggested_clause: "Neither party shall be liable for any failure or delay in performance due to circumstances beyond their reasonable control, including acts of God, war, riot, or government orders."
    },
    {
      missing_clause: "Data Processing Addendum",
      why_it_matters: "Establishes compliance parameters for processing personal data under GDPR/CCPA regulations.",
      suggested_clause: "To the extent that Supplier processes personal data on behalf of Customer, the parties shall execute and abide by the Data Processing Addendum (DPA) attached hereto as Exhibit B."
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      {/* Action header bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/documents"
            className="p-1.5 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white rounded border border-white/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-400" />
              {selectedContract.contract_name}
            </h1>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">
              Type: <span className="text-teal-400">{selectedContract.contract_type}</span> | Status: <span className="text-emerald-400">Ready</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`${BASE_URL}/reports/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-teal-500/10"
          >
            <Download className="w-3.5 h-3.5" />
            Export Audit Report
          </a>

          <button
            onClick={() => setShowChat(!showChat)}
            className="bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-all"
          >
            <Bot className="w-3.5 h-3.5 text-teal-400" />
            AI Negotiator Chat
          </button>
        </div>
      </div>

      {/* Main Split Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Pane: Document Viewer */}
        <div className="glass-panel rounded-xl border border-white/5 flex flex-col h-[75vh]">
          <div className="px-6 py-4 border-b border-white/5 bg-slate-950/20 flex items-center justify-between shrink-0">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
              <FileSearch2 className="w-4 h-4 text-teal-400" />
              Extracted Contract Text
            </h3>
            {selectedClauseType && (
              <button 
                onClick={() => setSelectedClauseType(null)}
                className="text-[9px] bg-teal-500/10 border border-teal-500/30 text-teal-400 font-semibold px-1.5 py-0.5 rounded hover:bg-teal-500/20 transition-all"
              >
                Clear Highlight: {selectedClauseType}
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-6 font-mono text-[11px] leading-relaxed text-muted-foreground bg-slate-950/20 whitespace-pre-line">
            {highlightClauseInText(contractRawText)}
          </div>
        </div>

        {/* Right Pane: Audits & Tabs */}
        <div className="glass-panel rounded-xl border border-white/5 flex flex-col h-[75vh]">
          {/* Tab Selector */}
          <div className="px-4 py-2 border-b border-white/5 bg-slate-950/20 flex items-center gap-1 shrink-0">
            {(["overview", "clauses", "missing", "compliance"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                  activeTab === tab 
                    ? "bg-teal-500/10 border border-teal-500/20 text-teal-400" 
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                {tab === "overview" ? "Executive Summary" : tab === "missing" ? "Missing Clauses" : tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* Overview / Heatmap tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Risk Heatmap Matrix</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {risk_assessments.map((r) => (
                      <div
                        key={r.risk_type}
                        onClick={() => handleHeatmapClick(r.risk_type)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all flex flex-col justify-between h-24 ${getRiskColorClass(r.risk_score)}`}
                      >
                        <span className="text-[10px] font-bold tracking-wide uppercase">{r.risk_type}</span>
                        <div className="flex items-end justify-between">
                          <span className="text-xs font-semibold">{r.severity}</span>
                          <span className="text-xl font-bold">{r.risk_score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-white/5" />

                {/* Obligations & Commitments */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Key Obligations Summary</h3>
                  <div className="space-y-3">
                    {obligations.obligations.map((ob, idx) => (
                      <div key={idx} className="flex gap-2.5 items-start text-xs text-muted-foreground leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                        <span>{ob}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-white/5" />

                {/* Important Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <h4 className="font-semibold text-white mb-2">Important Dates</h4>
                    <div className="space-y-1 text-muted-foreground">
                      {obligations.dates.map((d, idx) => (
                        <p key={idx}>{d}</p>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Renewal Conditions</h4>
                    <p className="text-muted-foreground leading-relaxed">{obligations.conditions}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Clauses Review Tab */}
            {activeTab === "clauses" && (
              <div className="space-y-4">
                {clauses.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedClauseType(c.clause_type)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                      selectedClauseType === c.clause_type
                        ? "bg-teal-500/[0.03] border-teal-500/50 shadow-md shadow-teal-500/[0.02]"
                        : "bg-slate-950/20 border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <ChevronRight className="w-4 h-4 text-teal-400" />
                        {c.clause_type}
                      </h4>
                      <span className={getRiskBadge(c.risk_score)}>
                        Risk: {c.risk_score}/100
                      </span>
                    </div>

                    <p className="text-[10px] text-muted-foreground font-mono leading-relaxed mb-3 line-clamp-3 bg-slate-950/20 p-2.5 rounded border border-white/5">
                      "{c.clause_text}"
                    </p>

                    {c.recommendation && (
                      <div className="flex gap-2 p-2.5 bg-teal-500/5 border border-teal-500/10 rounded-lg text-[10px] text-teal-300 leading-normal">
                        <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-teal-200">Mitigation: </strong>
                          {c.recommendation}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Missing Clauses Tab */}
            {activeTab === "missing" && (
              <div className="space-y-4">
                {missingClausesMock.map((mc, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-white/5 bg-slate-950/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-rose-400 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" />
                        Missing: {mc.missing_clause}
                      </h4>
                      <span className="text-[9px] bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold px-2 py-0.5 rounded">
                        Critical Omission
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-[10px] text-muted-foreground leading-normal">
                        <strong className="text-white">Why It Matters: </strong>
                        {mc.why_it_matters}
                      </p>
                    </div>

                    <div className="bg-slate-950/50 p-3 rounded border border-white/5">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-1.5 text-teal-400">Suggested Drafting:</p>
                      <p className="text-[10px] text-white font-mono leading-relaxed">
                        {mc.suggested_clause}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Compliance Audit Tab */}
            {activeTab === "compliance" && (
              <div className="space-y-4">
                {compliance_reports.map((comp) => {
                  const status = comp.score >= 80 ? "Compliant" : comp.score >= 40 ? "Partially" : "Non-Compliant";
                  return (
                    <div key={comp.id} className="p-4 rounded-xl border border-white/5 bg-slate-950/20 flex items-start gap-4">
                      <div className="mt-0.5">
                        {status === "Compliant" ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : status === "Partially" ? (
                          <HelpCircle className="w-5 h-5 text-amber-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-400" />
                        )}
                      </div>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold text-white">{comp.framework} Audit</h4>
                          <span className={`text-[9px] font-semibold uppercase px-2 py-0.5 rounded ${
                            status === "Compliant" 
                              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                              : status === "Partially"
                              ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                              : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                          }`}>
                            {status} ({comp.score}%)
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          {comp.findings}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating AI Chat Sidebar */}
      {showChat && (
        <div className="fixed inset-y-0 right-0 w-96 bg-slate-950 border-l border-white/10 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="h-16 px-6 border-b border-white/5 flex items-center justify-between bg-slate-950/80">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-teal-400" />
              <span className="font-semibold text-xs text-white uppercase tracking-wider">AI Negotiator</span>
            </div>
            <button
              onClick={() => setShowChat(false)}
              className="text-muted-foreground hover:text-white text-xs font-semibold px-2 py-1 bg-white/5 border border-white/5 rounded-lg"
            >
              Close
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex gap-3">
              <div className="w-7 h-7 bg-teal-500/10 border border-teal-500/20 rounded-full flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-xs leading-normal max-w-[80%]">
                <p className="text-white font-medium">Hello! I am your AI Negotiator. I have analyzed the contract clauses. You can ask me questions like:</p>
                <ul className="list-disc pl-4 mt-2 space-y-1 text-muted-foreground">
                  <li>What is the liability cap?</li>
                  <li>Is there any termination convenience?</li>
                  <li>How is Governing Law assigned?</li>
                </ul>
              </div>
            </div>

            {chatHistory.map((chat, idx) => (
              <div key={idx} className="space-y-4">
                {/* User Q */}
                <div className="flex gap-3 justify-end">
                  <div className="bg-teal-500 text-slate-950 rounded-xl p-3 text-xs leading-normal max-w-[80%] font-medium">
                    {chat.q}
                  </div>
                </div>

                {/* AI A */}
                <div className="flex gap-3">
                  <div className="w-7 h-7 bg-teal-500/10 border border-teal-500/20 rounded-full flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-teal-400" />
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-xs leading-normal max-w-[80%] text-muted-foreground">
                    {chat.a ? (
                      <p className="text-white whitespace-pre-line">{chat.a}</p>
                    ) : (
                      <div className="flex items-center gap-1.5 py-1 text-[10px] text-teal-400 font-semibold uppercase tracking-wider animate-pulse">
                        <Sparkles className="w-3.5 h-3.5" />
                        Generating Response...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Form Input */}
          <form onSubmit={handleChatSubmit} className="p-4 border-t border-white/5 bg-slate-950/80 flex gap-2">
            <input
              type="text"
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask negotiator about this contract..."
              className="flex-1 bg-slate-900 border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-teal-500/50"
            />
            <button
              type="submit"
              disabled={chatLoading}
              className="bg-teal-500 hover:bg-teal-600 text-slate-950 p-2 rounded-lg transition-colors shrink-0 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function LoaderSpinner() {
  return (
    <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
  );
}

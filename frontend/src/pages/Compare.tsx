import React, { useState, useEffect } from "react";
import { useContractStore, ComparisonResult } from "../store/contractStore";
import { 
  Columns, 
  FileText, 
  ArrowRightLeft, 
  AlertTriangle, 
  CheckCircle,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Sparkles
} from "lucide-react";

export default function Compare() {
  const { contracts, fetchContracts, compare, comparison, isLoading, clearComparison } = useContractStore();
  const [contractAId, setContractAId] = useState("");
  const [contractBId, setContractBId] = useState("");

  useEffect(() => {
    fetchContracts();
    clearComparison();
  }, []);

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractAId || !contractBId) return;
    try {
      await compare(contractAId, contractBId);
    } catch (err: any) {
      alert(`Comparison failed: ${err.message}`);
    }
  };

  const completedContracts = contracts.filter(c => c.status === "completed");

  const getRiskColorClass = (score: number | null) => {
    if (score === null) return "text-muted-foreground";
    if (score >= 70) return "text-rose-400 font-semibold";
    if (score >= 40) return "text-amber-400 font-semibold";
    return "text-emerald-400 font-semibold";
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Comparison Workspace</h1>
        <p className="text-muted-foreground text-xs mt-1">
          Perform a side-by-side audit of two agreements, highlighting discrepancies in clause structures, obligations, and risk levels.
        </p>
      </div>

      {/* Select panel */}
      <div className="glass-panel p-6 rounded-xl border border-white/5 bg-slate-950/20">
        <form onSubmit={handleCompare} className="flex flex-col md:flex-row items-end gap-6">
          <div className="flex-1 space-y-1.5 w-full">
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Contract A</label>
            <select
              value={contractAId}
              onChange={(e) => setContractAId(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none focus:border-teal-500/50"
            >
              <option value="">-- Choose first contract --</option>
              {completedContracts.map((c) => (
                <option key={c.id} value={c.id} disabled={c.id === contractBId}>
                  {c.contract_name} ({c.contract_type})
                </option>
              ))}
            </select>
          </div>

          <div className="shrink-0 pb-3 hidden md:block">
            <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
          </div>

          <div className="flex-1 space-y-1.5 w-full">
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Contract B</label>
            <select
              value={contractBId}
              onChange={(e) => setContractBId(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none focus:border-teal-500/50"
            >
              <option value="">-- Choose second contract --</option>
              {completedContracts.map((c) => (
                <option key={c.id} value={c.id} disabled={c.id === contractAId}>
                  {c.contract_name} ({c.contract_type})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading || !contractAId || !contractBId}
            className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold px-6 py-2.5 rounded-lg text-xs transition-colors shrink-0 disabled:opacity-50 w-full md:w-auto shadow-lg shadow-teal-500/10"
          >
            {isLoading ? "Running Comparison..." : "Compare Contracts"}
          </button>
        </form>
      </div>

      {/* Comparison results */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">
          Executing multi-agent side-by-side comparison...
        </div>
      ) : comparison ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Executive Summary Card */}
          <div className="glass-panel p-6 rounded-xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Comparison Executive Analysis</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Overall discrepancy evaluation</p>
              </div>

              {/* Similarity score */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground font-semibold">Similarity Match:</span>
                <span className="px-3 py-1 bg-teal-500/15 border border-teal-500/30 text-teal-400 rounded-lg text-base font-bold">
                  {comparison.match_percentage}%
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed bg-slate-950/20 p-4 rounded border border-white/5">
              {comparison.overall_comparison_summary}
            </p>
          </div>

          {/* Grid Side-by-Side Clauses */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Side-by-Side Clause Alignment</h3>
            
            <div className="space-y-3">
              {comparison.common_clauses.map((item: any, idx: number) => (
                <div key={idx} className="glass-panel rounded-xl border border-white/5 overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/5 bg-slate-950/30 flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{item.clause_type}</span>
                    <span className="text-[10px] text-muted-foreground leading-normal">
                      Risk Diff:{" "}
                      <span className={getRiskColorClass(item.risk_a)}>A: {item.risk_a ?? "N/A"}</span>
                      {" / "}
                      <span className={getRiskColorClass(item.risk_b)}>B: {item.risk_b ?? "N/A"}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
                    {/* Clause A */}
                    <div className="p-5 space-y-2">
                      <p className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">{comparison.contract_a_name}</p>
                      {item.found_in_a ? (
                        <p className="text-[10px] text-muted-foreground font-mono leading-relaxed line-clamp-4">
                          "{item.text_a}"
                        </p>
                      ) : (
                        <p className="text-[10px] text-rose-400 font-semibold italic">Clause is missing from Contract A.</p>
                      )}
                    </div>

                    {/* Clause B */}
                    <div className="p-5 space-y-2">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{comparison.contract_b_name}</p>
                      {item.found_in_b ? (
                        <p className="text-[10px] text-muted-foreground font-mono leading-relaxed line-clamp-4">
                          "{item.text_b}"
                        </p>
                      ) : (
                        <p className="text-[10px] text-rose-400 font-semibold italic">Clause is missing from Contract B.</p>
                      )}
                    </div>
                  </div>

                  {/* Difference Recommendation Banner */}
                  <div className="px-5 py-2.5 bg-teal-500/5 border-t border-teal-500/10 flex items-start gap-2 text-[10px] text-teal-300">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-teal-200">Comparison Finding: </strong>
                      {item.diff_summary}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-xl border border-white/5 text-center text-xs text-muted-foreground">
          Select two completed contracts above and click "Compare Contracts" to initialize comparison analysis.
        </div>
      )}
    </div>
  );
}

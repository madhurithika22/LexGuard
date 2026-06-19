import { create } from "zustand";
import { api } from "../services/api";

export interface Clause {
  id: string;
  clause_type: string;
  clause_text: string;
  risk_score: number;
  recommendation?: string;
}

export interface RiskAssessment {
  id: string;
  risk_type: string;
  risk_score: number;
  severity: string;
  reason?: string;
}

export interface ComplianceReport {
  id: string;
  framework: string;
  score: number;
  findings?: string;
}

export interface Contract {
  id: string;
  contract_name: string;
  contract_type: string;
  status: string;
  created_at: string;
  clauses?: Clause[];
  compliance_reports?: ComplianceReport[];
  risk_assessments?: RiskAssessment[];
}

export interface ComparisonResult {
  contract_a_name: string;
  contract_b_name: string;
  match_percentage: number;
  common_clauses: any[];
  unique_to_a: string[];
  unique_to_b: string[];
  overall_comparison_summary: string;
}

interface ContractState {
  contracts: Contract[];
  selectedContract: Contract | null;
  comparison: ComparisonResult | null;
  isLoading: boolean;
  error: string | null;
  fetchContracts: () => Promise<void>;
  fetchContractDetail: (id: string) => Promise<void>;
  uploadContract: (file: File) => Promise<Contract>;
  deleteContract: (id: string) => Promise<void>;
  compare: (contractAId: string, contractBId: string) => Promise<void>;
  clearComparison: () => void;
}

export const useContractStore = create<ContractState>((set, get) => ({
  contracts: [],
  selectedContract: null,
  comparison: null,
  isLoading: false,
  error: null,
  
  fetchContracts: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.get<Contract[]>("/contracts");
      set({ contracts: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || "Failed to fetch contracts.", isLoading: false });
    }
  },
  
  fetchContractDetail: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.get<Contract>(`/contracts/${id}`);
      set({ selectedContract: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || "Failed to load contract details.", isLoading: false });
    }
  },
  
  uploadContract: async (file) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append("file", file);
      const data = await api.post<Contract>("/contracts/upload", formData);
      
      // Add contract to local state
      const currentContracts = get().contracts;
      set({ 
        contracts: [data, ...currentContracts],
        isLoading: false 
      });
      return data;
    } catch (err: any) {
      set({ error: err.message || "Failed to upload contract.", isLoading: false });
      throw err;
    }
  },
  
  deleteContract: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/contracts/${id}`);
      const updatedContracts = get().contracts.filter(c => c.id !== id);
      
      set({ 
        contracts: updatedContracts,
        selectedContract: get().selectedContract?.id === id ? null : get().selectedContract,
        isLoading: false 
      });
    } catch (err: any) {
      set({ error: err.message || "Failed to delete contract.", isLoading: false });
      throw err;
    }
  },
  
  compare: async (contractAId, contractBId) => {
    set({ isLoading: true, error: null, comparison: null });
    try {
      const data = await api.post<ComparisonResult>("/contracts/compare", {
        contract_a_id: contractAId,
        contract_b_id: contractBId
      });
      set({ comparison: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || "Failed to compare contracts.", isLoading: false });
      throw err;
    }
  },
  
  clearComparison: () => set({ comparison: null })
}));

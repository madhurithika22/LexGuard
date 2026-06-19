import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useContractStore } from "../store/contractStore";
import { 
  UploadCloud, 
  FileText, 
  Trash2, 
  ExternalLink, 
  Loader2,
  Calendar,
  User,
  ArrowUpRight,
  RefreshCcw
} from "lucide-react";

export default function Documents() {
  const { contracts, isLoading, error, fetchContracts, uploadContract, deleteContract } = useContractStore();
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchContracts();
    
    // Poll for status updates every 4 seconds if there are pending/processing contracts
    const interval = setInterval(() => {
      const activeContracts = contracts.some(c => c.status === "pending" || c.status === "processing");
      if (activeContracts) {
        fetchContracts();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [contracts]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFiles = async (files: FileList) => {
    if (files.length === 0) return;
    setUploadStatus("Uploading documents...");
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const tempId = Math.random().toString();
      
      // Simulate frontend upload progress
      setUploadProgress(prev => ({ ...prev, [tempId]: 10 }));
      const timer = setInterval(() => {
        setUploadProgress(prev => {
          const current = prev[tempId] || 10;
          if (current >= 90) {
            clearInterval(timer);
            return prev;
          }
          return { ...prev, [tempId]: current + 20 };
        });
      }, 300);

      try {
        await uploadContract(file);
        setUploadProgress(prev => ({ ...prev, [tempId]: 100 }));
      } catch (err: any) {
        alert(`Failed to upload ${file.name}: ${err.message}`);
      } finally {
        clearInterval(timer);
      }
    }
    
    setUploadStatus(null);
    fetchContracts();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFiles(e.target.files);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this contract?")) {
      await deleteContract(id);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Document Management</h1>
        <p className="text-muted-foreground text-xs mt-1">
          Upload and review agreements. Multi-agent processing categorizes, scores, and audits details in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload portal */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-semibold text-white">Upload Agreements</h3>
          
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`glass-panel p-8 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all h-72 ${
              dragActive 
                ? "border-teal-500 bg-teal-500/[0.02]" 
                : "border-white/10 hover:border-white/20"
            }`}
          >
            <input
              type="file"
              id="file-upload"
              multiple
              accept=".pdf,.docx,.txt"
              onChange={handleFileInput}
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-4">
                <UploadCloud className="w-6 h-6 text-teal-400" />
              </div>
              <p className="text-xs font-semibold text-white mb-1">Drag & drop files here</p>
              <p className="text-[10px] text-muted-foreground mb-4">or click to browse from folders</p>
              <span className="text-[9px] bg-white/5 text-muted-foreground border border-white/5 px-2 py-1 rounded font-mono uppercase tracking-wider">
                PDF, DOCX, TXT
              </span>
            </label>
          </div>

          {/* Progress Indicators */}
          {Object.keys(uploadProgress).length > 0 && (
            <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-3">
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Processing uploads</h4>
              {Object.entries(uploadProgress).map(([id, progress]) => (
                <div key={id} className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-white flex items-center gap-1.5 font-medium">
                      <Loader2 className="w-3 h-3 text-teal-400 animate-spin" />
                      Analyzing contract...
                    </span>
                    <span className="text-teal-400 font-semibold">{progress}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload History / List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Repository Directory</h3>
            <button 
              onClick={() => fetchContracts()}
              className="p-1.5 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white rounded border border-white/5 transition-colors"
              title="Refresh Directory"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
            {isLoading && contracts.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                Loading contracts database...
              </div>
            ) : contracts.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                No agreements loaded. Drag or click the upload panel to analyze your first document.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {contracts.map((contract) => (
                  <div key={contract.id} className="p-5 flex items-center justify-between hover:bg-white/[0.01] transition-colors group">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-10 h-10 bg-teal-500/5 border border-teal-500/20 rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-teal-400" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <h4 className="text-xs font-semibold text-white truncate max-w-[280px] md:max-w-[400px]">
                          {contract.contract_name}
                        </h4>
                        
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                          <span className="bg-teal-500/10 text-teal-300 border border-teal-500/20 px-1.5 py-0.5 rounded font-medium">
                            {contract.contract_type}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            {new Date(contract.created_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-muted-foreground" />
                            Charley
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div>
                        {contract.status === "completed" && (
                          <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold uppercase tracking-wider">
                            Ready
                          </span>
                        )}
                        {contract.status === "processing" && (
                          <span className="px-2.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10px] font-semibold uppercase tracking-wider animate-pulse">
                            Parsing
                          </span>
                        )}
                        {contract.status === "pending" && (
                          <span className="px-2.5 py-0.5 rounded bg-slate-500/10 border border-slate-500/30 text-slate-400 text-[10px] font-semibold uppercase tracking-wider animate-pulse">
                            Pending
                          </span>
                        )}
                        {contract.status === "failed" && (
                          <span className="px-2.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-semibold uppercase tracking-wider">
                            Failed
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {contract.status === "completed" && (
                          <Link
                            to={`/documents/${contract.id}`}
                            className="p-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 rounded transition-colors border border-teal-500/20 flex items-center gap-1 text-[10px] font-semibold"
                          >
                            Open Audit
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        <button
                          onClick={() => handleDelete(contract.id)}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded border border-rose-500/20 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

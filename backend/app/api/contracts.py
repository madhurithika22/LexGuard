import os
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import shutil
import uuid
import json

from app.core.database import get_db
from app.core.security import get_current_user, require_user, require_analyst
from app.core.config import settings
from app.models.models import User, Contract, Clause, ComplianceReport, RiskAssessment
from app.schemas.schemas import ContractOut, ContractDetailOut, ComparisonRequest, ComparisonOut, ComparisonItem
from app.services.agents import run_agent_workflow
from app.services.vector_store import vector_store
from app.services.reports import generate_pdf_report

router = APIRouter(tags=["Contracts & Analysis"])

# Background task to run analysis pipeline
def process_contract_analysis(contract_id: str, file_path: str, filename: str, db_session_factory):
    db = db_session_factory()
    try:
        contract = db.query(Contract).filter(Contract.id == contract_id).first()
        if not contract:
            return
            
        contract.status = "processing"
        db.commit()
        
        # Run the Multi-Agent workflow
        result = run_agent_workflow(filename, file_path)
        
        # Update contract metadata
        contract.contract_type = result["contract_type"]
        contract.status = "completed"
        
        # Clear existing associations in case of re-analysis
        db.query(Clause).filter(Clause.contract_id == contract_id).delete()
        db.query(ComplianceReport).filter(ComplianceReport.contract_id == contract_id).delete()
        db.query(RiskAssessment).filter(RiskAssessment.contract_id == contract_id).delete()
        
        # Save extracted clauses
        for c in result["clauses"]:
            clause_row = Clause(
                contract_id=contract_id,
                clause_type=c["clause_type"],
                clause_text=c["clause_text"],
                risk_score=c["risk_score"],
                recommendation=c.get("recommendation", "")
            )
            db.add(clause_row)
            
        # Save compliance audits
        for comp in result["compliance_reports"]:
            comp_row = ComplianceReport(
                contract_id=contract_id,
                framework=comp["framework"],
                score=comp["score"],
                findings=comp["findings"]
            )
            db.add(comp_row)
            
        # Save risk assessments
        for ra in result["risk_assessments"]:
            ra_row = RiskAssessment(
                contract_id=contract_id,
                risk_type=ra["risk_type"],
                risk_score=ra["risk_score"],
                severity=ra["severity"],
                reason=ra.get("reason", "")
            )
            db.add(ra_row)
            
        db.commit()
        
        # Index contract text into Vector Database (FAISS/TF-IDF)
        vector_store.index_contract(contract_id, result["raw_text"])
        
    except Exception as e:
        contract = db.query(Contract).filter(Contract.id == contract_id).first()
        if contract:
            contract.status = "failed"
            db.commit()
        # print(f"Analysis Pipeline Error: {str(e)}")
    finally:
        db.close()

@router.post("/contracts/upload", response_model=ContractOut)
def upload_contract(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate extension
    filename = file.filename
    _, ext = os.path.splitext(filename.lower())
    if ext not in [".pdf", ".docx", ".txt"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload PDF, DOCX or TXT."
        )
        
    # Save file to disk
    contract_id = str(uuid.uuid4())
    org_upload_dir = os.path.join(settings.UPLOAD_DIR, current_user.organization_id)
    os.makedirs(org_upload_dir, exist_ok=True)
    
    file_path = os.path.join(org_upload_dir, f"{contract_id}{ext}")
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
        
    # Create DB entry
    contract = Contract(
        id=contract_id,
        organization_id=current_user.organization_id,
        uploaded_by=current_user.id,
        file_path=file_path,
        contract_name=filename,
        contract_type="Unknown",
        status="pending"
    )
    db.add(contract)
    db.commit()
    db.refresh(contract)
    
    # Trigger AI Multi-Agent analysis
    # We use a session factory in background tasks to avoid sharing the request thread session
    from app.core.database import SessionLocal
    background_tasks.add_task(
        process_contract_analysis,
        contract_id,
        file_path,
        filename,
        SessionLocal
    )
    
    return contract

@router.get("/contracts", response_model=List[ContractOut])
def list_contracts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contracts = db.query(Contract).filter(
        Contract.organization_id == current_user.organization_id
    ).order_by(Contract.created_at.desc()).all()
    return contracts

@router.get("/contracts/{contract_id}", response_model=ContractDetailOut)
def get_contract(
    contract_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.organization_id == current_user.organization_id
    ).first()
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found."
        )
        
    return contract

@router.delete("/contracts/{contract_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contract(
    contract_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.organization_id == current_user.organization_id
    ).first()
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found."
        )
        
    # Remove file from disk
    if os.path.exists(contract.file_path):
        os.remove(contract.file_path)
        
    # Clean vector indexes
    vector_index_path = os.path.join(settings.UPLOAD_DIR, "vector_indices", f"{contract_id}.json")
    if os.path.exists(vector_index_path):
        os.remove(vector_index_path)
        
    db.delete(contract)
    db.commit()
    return None

@router.post("/contracts/compare", response_model=ComparisonOut)
def compare_contracts(
    request: ComparisonRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contract_a = db.query(Contract).filter(
        Contract.id == request.contract_a_id,
        Contract.organization_id == current_user.organization_id
    ).first()
    
    contract_b = db.query(Contract).filter(
        Contract.id == request.contract_b_id,
        Contract.organization_id == current_user.organization_id
    ).first()
    
    if not contract_a or not contract_b:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or both contracts not found."
        )
        
    # Build side by side clause comparison
    clauses_a = {c.clause_type: c for c in contract_a.clauses}
    clauses_b = {c.clause_type: c for c in contract_b.clauses}
    
    all_clause_types = set(list(clauses_a.keys()) + list(clauses_b.keys()))
    
    common_items = []
    unique_a = []
    unique_b = []
    
    for ctype in all_clause_types:
        in_a = ctype in clauses_a
        in_b = ctype in clauses_b
        
        if in_a and in_b:
            text_a = clauses_a[ctype].clause_text
            text_b = clauses_b[ctype].clause_text
            
            # Simple text mismatch helper
            if text_a.lower() == text_b.lower():
                diff_summary = "Clauses are identical."
            else:
                diff_summary = f"Clauses differ. Contract A assigns risk of {clauses_a[ctype].risk_score}/100 whereas Contract B assigns risk of {clauses_b[ctype].risk_score}/100."
                
            common_items.append(ComparisonItem(
                clause_type=ctype,
                found_in_a=True,
                found_in_b=True,
                text_a=text_a,
                text_b=text_b,
                risk_a=clauses_a[ctype].risk_score,
                risk_b=clauses_b[ctype].risk_score,
                diff_summary=diff_summary
            ))
        elif in_a:
            unique_a.append(ctype)
            common_items.append(ComparisonItem(
                clause_type=ctype,
                found_in_a=True,
                found_in_b=False,
                text_a=clauses_a[ctype].clause_text,
                text_b=None,
                risk_a=clauses_a[ctype].risk_score,
                risk_b=None,
                diff_summary="This clause type exists only in Contract A."
            ))
        elif in_b:
            unique_b.append(ctype)
            common_items.append(ComparisonItem(
                clause_type=ctype,
                found_in_a=False,
                found_in_b=True,
                text_a=None,
                text_b=clauses_b[ctype].clause_text,
                risk_a=None,
                risk_b=clauses_b[ctype].risk_score,
                diff_summary="This clause type exists only in Contract B."
            ))
            
    # Calculate simple match score
    match_percentage = 100
    if len(all_clause_types) > 0:
        common_count = sum(1 for item in common_items if item.found_in_a and item.found_in_b and "differ" not in item.diff_summary)
        match_percentage = int((common_count / len(all_clause_types)) * 100)
        
    return ComparisonOut(
        contract_a_name=contract_a.contract_name,
        contract_b_name=contract_b.contract_name,
        match_percentage=match_percentage,
        common_clauses=common_items,
        unique_to_a=unique_a,
        unique_to_b=unique_b,
        overall_comparison_summary=f"Contract comparison completed between {contract_a.contract_name} and {contract_b.contract_name}. They share a similarity rating of {match_percentage}%. Key variances are located in the following clauses: {', '.join(unique_a + unique_b) if (unique_a + unique_b) else 'None'}."
    )

@router.get("/reports/{contract_id}")
def download_report(
    contract_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.organization_id == current_user.organization_id
    ).first()
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found."
        )
        
    if contract.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contract analysis is not complete yet."
        )
        
    # Generate the report dynamically and save it as a temp file
    report_filename = f"Audit_Report_{contract_id}.pdf"
    report_path = os.path.join(settings.UPLOAD_DIR, report_filename)
    
    # Read text for summary generation
    try:
        from app.services.agents import parse_document, HeuristicAIEngine
        raw_text = parse_document(contract.file_path, contract.contract_name)
        summary_details = HeuristicAIEngine.generate_summary(raw_text, contract.contract_type)
        
        # Load associated clauses, risks, compliance details
        clauses_list = [{"clause_type": c.clause_type, "clause_text": c.clause_text, "risk_score": c.risk_score, "recommendation": c.recommendation} for c in contract.clauses]
        risks_list = [{"risk_type": r.risk_type, "risk_score": r.risk_score, "severity": r.severity, "reason": r.reason} for r in contract.risk_assessments]
        comp_list = [{"framework": co.framework, "score": co.score, "findings": co.findings} for co in contract.compliance_reports]
        
        # Detect missing clauses
        missing_list = HeuristicAIEngine.detect_missing_clauses(clauses_list, contract.contract_type)
        
        generate_pdf_report(
            report_path,
            contract.contract_name,
            contract.contract_type,
            clauses_list,
            risks_list,
            comp_list,
            missing_list,
            summary_details
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate report PDF: {str(e)}"
        )
        
    return FileResponse(
        report_path,
        media_type="application/pdf",
        filename=f"LexGuard_Audit_{contract.contract_name}.pdf"
    )

# Map compatibility endpoints
@router.post("/analyze", status_code=status.HTTP_200_OK)
def trigger_analysis(
    contract_id: str = Form(...),
    background_tasks: BackgroundTasks = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.organization_id == current_user.organization_id
    ).first()
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found."
        )
        
    # Rerun the processing in background
    from app.core.database import SessionLocal
    background_tasks.add_task(
        process_contract_analysis,
        contract.id,
        contract.file_path,
        contract.contract_name,
        SessionLocal
    )
    
    return {"detail": "Analysis re-queued successfully."}

@router.get("/analysis/{contract_id}", response_model=ContractDetailOut)
def get_analysis_by_id(
    contract_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_contract(contract_id, current_user, db)

@router.post("/compliance/check")
def compliance_check(
    contract_id: str = Form(...),
    framework: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.organization_id == current_user.organization_id
    ).first()
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found."
        )
        
    report = db.query(ComplianceReport).filter(
        ComplianceReport.contract_id == contract_id,
        ComplianceReport.framework.ilike(framework)
    ).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Compliance audits for {framework} not found on this contract."
        )
        
    return report

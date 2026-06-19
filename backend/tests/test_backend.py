import os
import sys
import pytest
from fastapi.testclient import TestClient

# Adjust path to find backend
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.main import app
from app.core.config import settings
from app.services.agents import HeuristicAIEngine, parse_document
from app.services.vector_store import vector_store

client = TestClient(app)

def test_api_status():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_heuristic_classifier():
    saas_text = "This Software as a Service Agreement governs the subscription service of the platform."
    nda_text = "This non-disclosure agreement protects confidential information from disclosure."
    
    classify_saas = HeuristicAIEngine.classify(saas_text)
    classify_nda = HeuristicAIEngine.classify(nda_text)
    
    assert classify_saas["contract_type"] == "SaaS Agreement"
    assert classify_nda["contract_type"] == "NDA"

def test_vector_store_indexing():
    contract_id = "test_contract_uuid"
    sample_text = "The limitation of liability cap shall be capped at exactly ten thousand dollars."
    
    # Index
    vector_store.index_contract(contract_id, sample_text)
    
    # Search
    results = vector_store.search_contract(contract_id, "liability cap")
    assert len(results) > 0
    assert "liability" in results[0].lower()
    
    # Clean up index file
    index_file = os.path.join(settings.UPLOAD_DIR, "vector_indices", f"{contract_id}.json")
    if os.path.exists(index_file):
        os.remove(index_file)

def test_pdf_exporter():
    from app.services.reports import generate_pdf_report
    
    output_path = os.path.join(settings.UPLOAD_DIR, "test_report.pdf")
    
    generate_pdf_report(
        output_path,
        "Test Contract",
        "NDA",
        [{"clause_type": "Liability", "clause_text": "Unlimited liability is active.", "risk_score": 90}],
        [{"risk_type": "Liability", "risk_score": 90, "severity": "High", "reason": "No liability cap."}],
        [{"framework": "GDPR", "score": 20, "findings": "Missing DPA."}],
        [{"missing_clause": "Force Majeure", "why_it_matters": "Omitted.", "suggested_clause": "Standard drafting."}],
        {"executive_summary": "Test overview.", "obligations": ["Obligation A"], "dates": []}
    )
    
    assert os.path.exists(output_path)
    # Clean up
    if os.path.exists(output_path):
        os.remove(output_path)

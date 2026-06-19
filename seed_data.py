import os
import sys
import uuid
from datetime import datetime

# Adjust Python path to load app modules
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.models import Organization, User, Contract, Clause, ComplianceReport, RiskAssessment

def seed():
    print("Initializing Database...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Check if we already have seeded data
    existing_org = db.query(Organization).filter(Organization.name == "Acme Corp").first()
    if existing_org:
        print("Database already seeded. Skipping.")
        db.close()
        return
        
    print("Seeding Organizations...")
    org = Organization(
        id=str(uuid.uuid4()),
        name="Acme Corp",
        industry="Technology"
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    
    print("Seeding Users...")
    pw_hash = get_password_hash("password123")
    
    admin = User(
        id=str(uuid.uuid4()),
        name="Alice Admin",
        email="admin@lexguard.ai",
        password_hash=pw_hash,
        role="admin",
        organization_id=org.id
    )
    analyst = User(
        id=str(uuid.uuid4()),
        name="Bob Analyst",
        email="analyst@lexguard.ai",
        password_hash=pw_hash,
        role="analyst",
        organization_id=org.id
    )
    user = User(
        id=str(uuid.uuid4()),
        name="Charlie User",
        email="user@lexguard.ai",
        password_hash=pw_hash,
        role="user",
        organization_id=org.id
    )
    db.add_all([admin, analyst, user])
    db.commit()
    
    # Seed Contract A (SaaS Agreement)
    print("Seeding Sample Contract A...")
    contract_a_id = str(uuid.uuid4())
    contract_a = Contract(
        id=contract_a_id,
        organization_id=org.id,
        uploaded_by=user.id,
        file_path="uploads/sample_saas_agreement.pdf",
        contract_name="Acme_SaaS_Service_Agreement.pdf",
        contract_type="SaaS Agreement",
        status="completed"
    )
    db.add(contract_a)
    
    # Seed Contract A Clauses
    clauses_a = [
        Clause(
            contract_id=contract_a_id,
            clause_type="Confidentiality",
            clause_text="Each party agrees to protect the Confidential Information of the other party with the same degree of care it uses to protect its own confidential information, but in no event less than a reasonable standard of care.",
            risk_score=15,
            recommendation="Clause is standard. No changes needed."
        ),
        Clause(
            contract_id=contract_a_id,
            clause_type="Liability",
            clause_text="EXCEPT FOR LIABILITY ARISING OUT OF BREACH OF CONFIDENTIALITY, IN NO EVENT SHALL EITHER PARTY'S LIABILITY EXCEED THE TOTAL FEES PAID TO PROVIDER IN THE TWELVE (12) MONTH PERIOD PRECEDING THE CLAIM.",
            risk_score=40,
            recommendation="12-month fee cap is standard. Ensure mutual exceptions are symmetric."
        ),
        Clause(
            contract_id=contract_a_id,
            clause_type="Termination",
            clause_text="Either party may terminate this Agreement for convenience upon sixty (60) days prior written notice to the other party.",
            risk_score=50,
            recommendation="A 60-day notice for convenience is standard, but check if transition assistance is needed."
        ),
        Clause(
            contract_id=contract_a_id,
            clause_type="Payment Terms",
            clause_text="Customer shall pay all invoiced amounts within ninety (90) days from the invoice date. Late payments shall accrue interest at 1.5% per month.",
            risk_score=75,
            recommendation="Net 90 payment terms are disadvantageous for cash flow. Negotiate down to Net 30 or Net 45."
        ),
        Clause(
            contract_id=contract_a_id,
            clause_type="Intellectual Property",
            clause_text="Provider retains all right, title, and interest in and to the Software, Services, and any developments made under this Agreement. Customer receives only a limited subscription license.",
            risk_score=20,
            recommendation="Standard subscription license. Ensure Customer data ownership is explicitly stated."
        )
    ]
    db.add_all(clauses_a)
    
    # Seed Contract A Compliance Reports
    compliance_a = [
        ComplianceReport(contract_id=contract_a_id, framework="GDPR", score=85, findings="GDPR compliance mentioned, but lacks explicit sub-processor definitions."),
        ComplianceReport(contract_id=contract_a_id, framework="CCPA", score=90, findings="Acceptable California consumer notification provisions present."),
        ComplianceReport(contract_id=contract_a_id, framework="DPDP Act", score=50, findings="Lacks explicit Indian resident consent mechanism and data fiduciary definitions."),
        ComplianceReport(contract_id=contract_a_id, framework="HIPAA", score=0, findings="No Business Associate Agreement (BAA) referenced. Non-compliant for health data."),
        ComplianceReport(contract_id=contract_a_id, framework="SOC2", score=85, findings="Mentions SOC2 Type II audit report availability upon request."),
        ComplianceReport(contract_id=contract_a_id, framework="ISO 27001", score=80, findings="General information security controls mapped to ISO 27001 standard.")
    ]
    db.add_all(compliance_a)
    
    # Seed Contract A Risk Assessments
    risks_a = [
        RiskAssessment(contract_id=contract_a_id, risk_type="Liability", risk_score=40, severity="Medium", reason="Liability is limited to 12 months fees, which is standard but excludes breach of confidentiality exceptions."),
        RiskAssessment(contract_id=contract_a_id, risk_type="Financial Risk", risk_score=75, severity="High", reason="Net 90 payment terms delay cash flow and 1.5% late interest is high."),
        RiskAssessment(contract_id=contract_a_id, risk_type="Compliance Risk", risk_score=45, severity="Medium", reason="Missing explicit Indian DPDP Act details and HIPAA BAA references."),
        RiskAssessment(contract_id=contract_a_id, risk_type="IP Risk", risk_score=20, severity="Low", reason="Standard IP allocation where Provider owns the SaaS tool."),
        RiskAssessment(contract_id=contract_a_id, risk_type="Data Privacy Risk", risk_score=35, severity="Low", reason="Standard privacy definitions included."),
        RiskAssessment(contract_id=contract_a_id, risk_type="Operational Risk", risk_score=50, severity="Medium", reason="Termination for convenience allowed on 60 days notice by either party.")
    ]
    db.add_all(risks_a)
    
    # Seed Contract B (Vendor Agreement)
    print("Seeding Sample Contract B...")
    contract_b_id = str(uuid.uuid4())
    contract_b = Contract(
        id=contract_b_id,
        organization_id=org.id,
        uploaded_by=user.id,
        file_path="uploads/sample_vendor_agreement.pdf",
        contract_name="Alpha_Vendor_Contract_Final.pdf",
        contract_type="Vendor Contract",
        status="completed"
    )
    db.add(contract_b)
    
    # Seed Contract B Clauses
    clauses_b = [
        Clause(
            contract_id=contract_b_id,
            clause_type="Confidentiality",
            clause_text="Vendor shall keep strictly confidential all technical and commercial information obtained from Client during the performance of services.",
            risk_score=10,
            recommendation="Clause is standard. No changes needed."
        ),
        Clause(
            contract_id=contract_b_id,
            clause_type="Liability",
            clause_text="IN NO EVENT SHALL CLIENT'S LIABILITY TO VENDOR EXCEED $10,000. VENDOR AGREES TO DEFEND, INDEMNIFY AND HOLD CLIENT HARMLESS AGAINST ALL CLAIMS WITH UNLIMITED LIABILITY.",
            risk_score=95,
            recommendation="Highly asymmetric. Client liability is capped at $10k, but Vendor liability is completely uncapped. Negotiate mutual caps."
        ),
        Clause(
            contract_id=contract_b_id,
            clause_type="Termination",
            clause_text="Client may terminate this Agreement immediately at any time for any reason. Vendor may terminate only for cause upon 90 days written notice.",
            risk_score=85,
            recommendation="One-sided termination logic. Negotiate mutual 30-day notice for convenience."
        ),
        Clause(
            contract_id=contract_b_id,
            clause_type="Payment Terms",
            clause_text="Payment shall be made by Client to Vendor within thirty (30) days after receipt of a correct and undisputed invoice.",
            risk_score=20,
            recommendation="Net 30 invoice processing is standard and acceptable."
        ),
        Clause(
            contract_id=contract_b_id,
            clause_type="Intellectual Property",
            clause_text="All work product, deliverables, patents, and copyright created by Vendor under this Agreement shall belong solely and exclusively to Client as works-made-for-hire.",
            risk_score=10,
            recommendation="Standard work-made-for-hire clause. Favorable to the Client."
        )
    ]
    # Adjust for termination clause typo/extra arg
    clauses_b[2] = Clause(
        contract_id=contract_b_id,
        clause_type="Termination",
        clause_text="Client may terminate this Agreement immediately at any time for any reason. Vendor may terminate only for cause upon 90 days written notice.",
        risk_score=85,
        recommendation="One-sided termination logic. Negotiate mutual 30-day notice for convenience."
    )
    db.add_all(clauses_b)
    
    # Seed Contract B Compliance Reports
    compliance_b = [
        ComplianceReport(contract_id=contract_b_id, framework="GDPR", score=60, findings="Requires DPA to be signed separately. Standard terms are basic."),
        ComplianceReport(contract_id=contract_b_id, framework="CCPA", score=75, findings="Basic compliance definitions included."),
        ComplianceReport(contract_id=contract_b_id, framework="DPDP Act", score=40, findings="No DPDP definitions found."),
        ComplianceReport(contract_id=contract_b_id, framework="HIPAA", score=0, findings="HIPAA is not covered in default vendor terms."),
        ComplianceReport(contract_id=contract_b_id, framework="SOC2", score=50, findings="Vendor does not mention SOC2 audit reports."),
        ComplianceReport(contract_id=contract_b_id, framework="ISO 27001", score=60, findings="Limited information security commitment.")
    ]
    db.add_all(compliance_b)
    
    # Seed Contract B Risk Assessments
    risks_b = [
        RiskAssessment(contract_id=contract_b_id, risk_type="Liability", risk_score=95, severity="High", reason="Vendor has uncapped liability, while Client's liability is capped at $10,000. Negotiate symmetric caps."),
        RiskAssessment(contract_id=contract_b_id, risk_type="Financial Risk", risk_score=20, severity="Low", reason="Net 30 payment is standard and favorable."),
        RiskAssessment(contract_id=contract_b_id, risk_type="Compliance Risk", risk_score=60, severity="Medium", reason="Limited compliance commitments by the vendor. Missing SOC2 or DPA references."),
        RiskAssessment(contract_id=contract_b_id, risk_type="IP Risk", risk_score=10, severity="Low", reason="Client owns all work products as work-made-for-hire."),
        RiskAssessment(contract_id=contract_b_id, risk_type="Data Privacy Risk", risk_score=65, severity="Medium", reason="Data protection standards are basic and require signing a separate DPA."),
        RiskAssessment(contract_id=contract_b_id, risk_type="Operational Risk", risk_score=85, severity="High", reason="Client can terminate immediately, but Vendor needs 90 days notice for cause.")
    ]
    db.add_all(risks_b)
    
    db.commit()
    
    # Index both contracts for QA vector retrieval mock
    try:
        from app.services.vector_store import vector_store
        vector_store.index_contract(contract_a_id, " ".join([c.clause_text for c in clauses_a]))
        vector_store.index_contract(contract_b_id, " ".join([c.clause_text for c in clauses_b]))
    except Exception as e:
        print(f"Indexing error: {e}")
        
    print("Database seeding completed successfully!")
    db.close()

if __name__ == "__main__":
    seed()

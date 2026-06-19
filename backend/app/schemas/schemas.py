from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    name: str
    organization_id: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
    type: Optional[str] = None

class RefreshRequest(BaseModel):
    refresh_token: str

# Organization Schemas
class OrganizationCreate(BaseModel):
    name: str = Field(..., min_length=2)
    industry: Optional[str] = None

class OrganizationOut(BaseModel):
    id: str
    name: str
    industry: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# User Schemas
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=6)
    organization_name: str = Field(..., min_length=2)
    industry: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    organization_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Clause Schemas
class ClauseOut(BaseModel):
    id: str
    clause_type: str
    clause_text: str
    risk_score: int
    recommendation: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# Risk Assessment Schemas
class RiskAssessmentOut(BaseModel):
    id: str
    risk_type: str
    risk_score: int
    severity: str
    reason: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# Compliance Report Schemas
class ComplianceReportOut(BaseModel):
    id: str
    framework: str
    score: int
    findings: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Contract Schemas
class ContractOut(BaseModel):
    id: str
    organization_id: str
    uploaded_by: Optional[str] = None
    file_path: str
    contract_name: str
    contract_type: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ContractDetailOut(ContractOut):
    clauses: List[ClauseOut] = []
    compliance_reports: List[ComplianceReportOut] = []
    risk_assessments: List[RiskAssessmentOut] = []

    model_config = ConfigDict(from_attributes=True)

# Chat Schemas
class AIChatCreate(BaseModel):
    contract_id: str
    question: str

class AIChatOut(BaseModel):
    id: str
    user_id: str
    contract_id: str
    question: str
    answer: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Comparison Schemas
class ComparisonRequest(BaseModel):
    contract_a_id: str
    contract_b_id: str

class ComparisonItem(BaseModel):
    clause_type: str
    found_in_a: bool
    found_in_b: bool
    text_a: Optional[str] = None
    text_b: Optional[str] = None
    risk_a: Optional[int] = None
    risk_b: Optional[int] = None
    diff_summary: str

class ComparisonOut(BaseModel):
    contract_a_name: str
    contract_b_name: str
    match_percentage: int
    common_clauses: List[ComparisonItem]
    unique_to_a: List[str]
    unique_to_b: List[str]
    overall_comparison_summary: str

# Obligation Summary Schema
class ObligationSummaryOut(BaseModel):
    executive_summary: str
    obligations: List[str]
    important_dates: List[str]
    renewal_conditions: Optional[str] = None
    financial_commitments: Optional[str] = None
    legal_risks: List[str]
    compliance_concerns: List[str]

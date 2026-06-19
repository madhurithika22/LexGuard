import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    industry = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    contracts = relationship("Contract", back_populates="organization", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="user")  # admin, analyst, user
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="users")
    uploaded_contracts = relationship("Contract", back_populates="uploader")
    chats = relationship("AIChat", back_populates="user", cascade="all, delete-orphan")


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    uploaded_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    file_path = Column(String(512), nullable=False)
    contract_name = Column(String(255), nullable=False)
    contract_type = Column(String(100), default="Unknown")  # NDA, SaaS, etc.
    status = Column(String(50), default="pending")  # pending, processing, completed, failed
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="contracts")
    uploader = relationship("User", back_populates="uploaded_contracts")
    clauses = relationship("Clause", back_populates="contract", cascade="all, delete-orphan")
    compliance_reports = relationship("ComplianceReport", back_populates="contract", cascade="all, delete-orphan")
    risk_assessments = relationship("RiskAssessment", back_populates="contract", cascade="all, delete-orphan")
    chats = relationship("AIChat", back_populates="contract", cascade="all, delete-orphan")


class Clause(Base):
    __tablename__ = "clauses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    contract_id = Column(String(36), ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False)
    clause_type = Column(String(100), nullable=False)  # Confidentiality, Liability, etc.
    clause_text = Column(Text, nullable=False)
    risk_score = Column(Integer, default=0)  # 0-100
    recommendation = Column(Text, nullable=True)

    contract = relationship("Contract", back_populates="clauses")


class ComplianceReport(Base):
    __tablename__ = "compliance_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    contract_id = Column(String(36), ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False)
    framework = Column(String(100), nullable=False)  # GDPR, CCPA, etc.
    score = Column(Integer, default=0)  # 0-100
    findings = Column(Text, nullable=True)  # JSON-string or text list of findings
    created_at = Column(DateTime, default=datetime.utcnow)

    contract = relationship("Contract", back_populates="compliance_reports")


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    contract_id = Column(String(36), ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False)
    risk_type = Column(String(100), nullable=False)  # Liability, IP, Data Privacy, etc.
    risk_score = Column(Integer, default=0)  # 0-100
    severity = Column(String(50), nullable=False)  # Low, Medium, High
    reason = Column(Text, nullable=True)

    contract = relationship("Contract", back_populates="risk_assessments")


class AIChat(Base):
    __tablename__ = "ai_chats"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    contract_id = Column(String(36), ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chats")
    contract = relationship("Contract", back_populates="chats")

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import User, Contract, AIChat
from app.schemas.schemas import AIChatCreate, AIChatOut
from app.services.vector_store import vector_store

router = APIRouter(tags=["AI Q&A Chat"])

@router.post("/chat", response_model=AIChatOut)
def chat_with_contract(
    chat_in: AIChatCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify contract belongs to user organization
    contract = db.query(Contract).filter(
        Contract.id == chat_in.contract_id,
        Contract.organization_id == current_user.organization_id
    ).first()
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found or access denied."
        )
        
    # Get answer using RAG from vector store
    try:
        from app.services.agents import parse_document
        raw_text = parse_document(contract.file_path, contract.contract_name)
        answer = vector_store.query_contract_chat(contract.id, chat_in.question, raw_text)
    except Exception as e:
        answer = f"Error processing AI answer: {str(e)}"
        
    # Store chat history in DB
    chat = AIChat(
        user_id=current_user.id,
        contract_id=contract.id,
        question=chat_in.question,
        answer=answer
    )
    db.add(chat)
    db.commit()
    db.refresh(chat)
    
    return chat

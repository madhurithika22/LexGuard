from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from app.core.database import get_db
from app.core.security import (
    get_password_hash, verify_password, create_access_token, 
    create_refresh_token, decode_token
)
from app.models.models import User, Organization
from app.schemas.schemas import UserRegister, UserLogin, Token, RefreshRequest, UserOut

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )
        
    # Create Organization
    org = Organization(
        name=user_in.organization_name,
        industry=user_in.industry
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    
    # Create User
    # First user in organization is registered as 'admin' role, subsequent as 'user' or 'analyst'
    # For testing and seeding convenience, we check if organization already had users
    user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role="admin",  # Creator of organization defaults to admin
        organization_id=org.id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create JWT Access and Refresh Tokens
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": user.role,
        "name": user.name,
        "organization_id": org.id
    }

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": user.role,
        "name": user.name,
        "organization_id": user.organization_id
    }

@router.post("/refresh", response_model=Token)
def refresh_tokens(refresh_in: RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(refresh_in.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
        
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
        
    access_token = create_access_token(subject=user.id)
    new_refresh_token = create_refresh_token(subject=user.id)
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "role": user.role,
        "name": user.name,
        "organization_id": user.organization_id
    }

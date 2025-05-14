# routers/auth
from fastapi import APIRouter, Depends, HTTPException, status, Form, Body, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from models.models import User, UserRole
from schemas.schemas import UserCreate, User as UserSchema
from utils.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_current_active_user
)
from database.database import get_db
from utils.logger import logger
from pydantic import BaseModel, EmailStr
import traceback
from sqlalchemy import func
from typing import List, Optional
from sqlalchemy.exc import IntegrityError

# Custom login form for email-based login
class EmailPasswordForm(BaseModel):
    email: str
    password: str

router = APIRouter(
    prefix="/auth",
    tags=["authentication"]
)

@router.post("/register", response_model=UserSchema)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    logger.info(f"Attempting to register new user with email: {user.email}")
    
    # Check if email exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        logger.warning(f"Registration failed: Email {user.email} already registered")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username exists
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        logger.warning(f"Registration failed: Username {user.username} already taken")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    try:
        # Create new user
        hashed_password = get_password_hash(user.password)
        db_user = User(
            email=user.email,
            username=user.username,
            hashed_password=hashed_password,
            is_active=True,
            is_superuser=False,
            role=user.role
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        logger.info(f"Successfully registered new user: {user.username} with role: {user.role}")
        return db_user
    except Exception as e:
        db.rollback()
        error_msg = f"Error during user registration: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error during user registration"
        )

@router.post("/login")
async def login(
    login_data: EmailPasswordForm = Body(...),
    db: Session = Depends(get_db)
):
    logger.info(f"Login attempt for email: {login_data.email}")
    
    try:
        user = db.query(User).filter(User.email == login_data.email).first()
        
        # Check if user exists
        if not user:
            error_msg = f"Failed login attempt: User with email {login_data.email} not found"
            logger.warning(error_msg)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if account is locked
        if user.account_locked:
            error_msg = f"Failed login attempt: Account locked for user {user.username} (email: {user.email})"
            logger.warning(error_msg)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is locked. Please contact support.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if account is active
        if not user.is_active:
            error_msg = f"Failed login attempt: Inactive account for user {user.username} (email: {user.email})"
            logger.warning(error_msg)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is inactive",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verify password
        if not verify_password(login_data.password, user.hashed_password):
            # Increment failed login attempts
            user.failed_login_attempts += 1
            
            # Lock account after 5 failed attempts
            if user.failed_login_attempts >= 5:
                user.account_locked = True
                error_msg = f"Account locked for user {user.username} (email: {user.email}) after {user.failed_login_attempts} failed attempts"
                logger.warning(error_msg)
            else:
                error_msg = f"Failed login attempt for user {user.username} (email: {user.email}): Invalid password. Attempt {user.failed_login_attempts} of 5"
                logger.warning(error_msg)
            
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Reset failed login attempts on successful login
        user.failed_login_attempts = 0
        user.last_login = datetime.utcnow()
        db.commit()
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        
        logger.info(f"Successful login for user: {user.username} (email: {user.email})")
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "username": user.username,
                "email": user.email,
                "role": user.role.value
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Unexpected error during login: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during login"
        )

@router.get("/users/me", response_model=UserSchema)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    logger.info(f"User profile accessed for: {current_user.username}")
    return current_user

@router.get("/statistics")
async def get_user_statistics(db: Session = Depends(get_db)):
    logger.info("Fetching user statistics")
    
    # Get current date and first day of current month
    current_date = datetime.utcnow()
    first_day_of_month = current_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Total Users (both ADMIN and USER)
    total_users = db.query(func.count(User.id)).scalar()
    
    # Active Users (both ADMIN and USER)
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar()
    
    # New Users this month (both ADMIN and USER)
    new_users_this_month = db.query(func.count(User.id)).filter(
        User.created_at >= first_day_of_month
    ).scalar()
    
    statistics = {
        "total_users": total_users,
        "active_users": active_users,
        "new_users_this_month": new_users_this_month
    }
    
    logger.info(f"User statistics retrieved successfully: {statistics}")
    return statistics

class PaginatedUserResponse(BaseModel):
    total: int
    skip: int
    limit: int
    users: List[UserSchema]

@router.get("/users", response_model=PaginatedUserResponse)
async def get_all_users(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=100, description="Number of records to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if current user is admin
    if not current_user.is_admin():
        logger.warning(f"Non-admin user {current_user.username} attempted to access all users")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can access this endpoint"
        )
    
    logger.info(f"Admin {current_user.username} is fetching all users")
    
    # Get total count
    total_users = db.query(func.count(User.id)).scalar()
    
    # Get users with pagination
    users = db.query(User).offset(skip).limit(limit).all()
    
    logger.info(f"Retrieved {len(users)} users out of {total_users} total users")
    
    return PaginatedUserResponse(
        total=total_users,
        skip=skip,
        limit=limit,
        users=users
    )

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None

@router.put("/users/{user_id}", response_model=UserSchema)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        logger.warning(f"Update failed: User with ID {user_id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )


    if not current_user.is_admin() and current_user.id != user_id:
        logger.warning(f"Unauthorized update attempt: User {current_user.username} tried to update user {db_user.username}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this user"
        )

    # Regular users can't change their role
    if not current_user.is_admin() and user_update.role is not None:
        logger.warning(f"Unauthorized role change attempt by user {current_user.username}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to change user role"
        )

    try:
        # Update user fields if provided
        if user_update.email is not None:
            # Check if new email is already taken
            existing_user = db.query(User).filter(User.email == user_update.email, User.id != user_id).first()
            if existing_user:
                logger.warning(f"Update failed: Email {user_update.email} already in use")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            db_user.email = user_update.email

        if user_update.username is not None:
            # Check if new username is already taken
            existing_user = db.query(User).filter(User.username == user_update.username, User.id != user_id).first()
            if existing_user:
                logger.warning(f"Update failed: Username {user_update.username} already taken")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken"
                )
            db_user.username = user_update.username

        if user_update.password is not None:
            db_user.hashed_password = get_password_hash(user_update.password)

        if user_update.is_active is not None and current_user.is_admin():
            db_user.is_active = user_update.is_active

        if user_update.role is not None and current_user.is_admin():
            db_user.role = user_update.role

        db.commit()
        db.refresh(db_user)
        
        logger.info(f"Successfully updated user {db_user.username}")
        return db_user

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = f"Error updating user: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating user"
        )

@router.delete("/users/{user_id}", response_model=dict)
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if user exists
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        logger.warning(f"Delete failed: User with ID {user_id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check if user is trying to delete themselves
    if current_user.id == user_id:
        logger.warning(f"User {current_user.username} attempted to delete their own account")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Users cannot delete their own account"
        )

    # Check if current user is admin
    if not current_user.is_admin():
        logger.warning(f"Non-admin user {current_user.username} attempted to delete user {db_user.username}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can delete accounts"
        )

    try:
        # Store username for logging before deletion
        username = db_user.username
        
        # Delete the user
        db.delete(db_user)
        db.commit()
        
        logger.info(f"User {username} (ID: {user_id}) successfully deleted by admin {current_user.username}")
        return {
            "message": f"User {username} successfully deleted",
            "user_id": user_id
        }

    except IntegrityError as e:
        db.rollback()
        error_msg = f"Database integrity error while deleting user {db_user.username}: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete user due to existing relationships. Please remove associated data first."
        )
    except Exception as e:
        db.rollback()
        error_msg = f"Error deleting user {db_user.username}: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting user"
        ) 
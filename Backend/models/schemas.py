#models/scheams
from pydantic import BaseModel, EmailStr, field_validator,ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    USER = "USER"
    ADMIN = "ADMIN"
# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str
    password_confirm: str

    @field_validator('password_confirm')
    def passwords_match(cls, v, info):
        if 'password' in info.data and v != info.data['password']:
            raise ValueError('passwords do not match')
        return v

    @field_validator('password')
    def password_complexity(cls, v):
        if len(v) < 8:
            raise ValueError('password must be at least 8 characters')
        # Add more complexity rules as needed
        return v

class UserOut(UserBase):
    id: int
    is_active: bool
    email_verified: bool

    class Config:
        from_attributes = True


class UserOut(UserBase):
    id: int
    is_active: bool
    email_verified: bool
    role: UserRole  # Include role in output

    # For Pydantic v2:
    model_config = ConfigDict(from_attributes=True)

    # For Pydantic v1:
    # class Config:
    #     from_attributes = True
# Course Schemas
class CourseBase(BaseModel):
    title: str
    description: str

class CourseCreate(CourseBase):
    pass

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class Course(CourseBase):
    id: int
    instructor_id: int

    class Config:
        from_attributes = True

# Lesson Schemas
class LessonBase(BaseModel):
    title: str
    content: str
    order: int

class LessonCreate(LessonBase):
    course_id: int

class LessonUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    order: Optional[int] = None

class Lesson(LessonBase):
    id: int
    course_id: int

    class Config:
        from_attributes = True

# Enrollment Schemas
class EnrollmentBase(BaseModel):
    course_id: int

class EnrollmentCreate(EnrollmentBase):
    pass

class Enrollment(EnrollmentBase):
    id: int
    user_id: int
    completed: bool

    class Config:
        from_attributes = True


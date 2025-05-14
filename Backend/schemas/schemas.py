from pydantic import BaseModel, EmailStr, Field, validator, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from models.models import UserRole, CourseLevel, CourseStatus

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    password_confirm: str
    role: UserRole = UserRole.USER

    @validator('password_confirm')
    def passwords_match(cls, v, values, **kwargs):
        if 'password' in values and v != values['password']:
            raise ValueError('passwords do not match')
        return v

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None

class UserInDB(UserBase):
    id: int
    is_active: bool
    is_superuser: bool
    role: UserRole
    email_verified: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class User(UserInDB):
    pass

class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    duration_weeks: int
    level: CourseLevel
    category: str
    status: CourseStatus = CourseStatus.DRAFT

class CourseCreate(CourseBase):
    pass

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    duration_weeks: Optional[int] = None
    level: Optional[CourseLevel] = None
    category: Optional[str] = None
    status: Optional[CourseStatus] = None

class Course(CourseBase):
    id: int
    instructor_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PaginatedCourseResponse(BaseModel):
    total: int
    skip: int
    limit: int
    courses: List[Course]

    model_config = ConfigDict(from_attributes=True)

# Lesson Schemas
class LessonBase(BaseModel):
    title: str
    content: str
    order: int
    duration_minutes: Optional[int] = None

class LessonCreate(LessonBase):
    course_id: int

class LessonUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    order: Optional[int] = None
    duration_minutes: Optional[int] = None

class Lesson(LessonBase):
    id: int
    course_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PaginatedLessonResponse(BaseModel):
    total: int
    skip: int
    limit: int
    lessons: List[Lesson]

    model_config = ConfigDict(from_attributes=True)

class TextContentCreate(BaseModel):
    course_id: int
    raw_text: str
    formatted_text: Optional[str] = None
    formatting_options: Optional[Dict[str, Any]] = None  # e.g., {"font_size": 16, "font_family": "Arial"}
    version: Optional[int] = 1
    published: Optional[bool] = False

class TextContentOut(BaseModel):
    id: int
    course_id: int
    raw_text: str
    formatted_text: Optional[str]
    formatting_options: Optional[Dict[str, Any]]
    version: int
    published: bool
    created_at: str
    updated_at: str

    @validator('created_at', 'updated_at', pre=True)
    def convert_datetime_to_str(cls, v):
        if isinstance(v, datetime):
            return v.isoformat()
        return v

    class Config:
        orm_mode = True 
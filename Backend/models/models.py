#models/models.py
from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, ForeignKey, Float,Enum, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from database.database import Base
from enum import Enum as PyEnum
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.sql import func
from sqlalchemy import Enum as SQLEnum

class UserRole(str, PyEnum):
    USER = "USER"
    ADMIN = "ADMIN"

class EnrollmentStatus(str, PyEnum):
    ACTIVE = "active"
    COMPLETED = "completed"
    DROPPED = "dropped"

class ContentType(str, PyEnum):
    LESSON = "lesson"
    QUIZ = "quiz"
    ASSIGNMENT = "assignment"
    RESOURCE = "resource"

class CourseContent(Base):
    __tablename__ = "course_contents"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    content_type = Column(SQLEnum(ContentType, name="contenttype"), nullable=False)
    content = Column(Text)  # For lessons, this could be HTML content
    order = Column(Integer, nullable=False)  # For ordering content within a course
    duration_minutes = Column(Integer)  # Estimated duration in minutes
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    course = relationship("Course", back_populates="contents")

    def __repr__(self):
        return f"<CourseContent {self.id}: {self.title} ({self.content_type})>"

class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    status = Column(SQLEnum(EnrollmentStatus, name="enrollmentstatus"), default=EnrollmentStatus.ACTIVE)
    progress = Column(Float, default=0.0)  # Progress percentage
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")

    def __repr__(self):
        return f"<Enrollment {self.id}: User {self.user_id} in Course {self.course_id}>"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(100))
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    role = Column(SQLEnum(UserRole, name="userrole", create_constraint=True), default=UserRole.USER)
    email_verified = Column(Boolean, default=False)

    # Security fields
    last_login = Column(DateTime, nullable=True)
    failed_login_attempts = Column(Integer, default=0)
    account_locked = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    courses = relationship("Course", back_populates="instructor")
    enrollments = relationship("Enrollment", back_populates="user")

    def set_password(self, password):
        self.hashed_password = generate_password_hash(
            password,
            method='pbkdf2:sha256',
            salt_length=16
        )

    def check_password(self, password):
        return check_password_hash(self.hashed_password, password)

    def is_admin(self):
        return self.role == UserRole.ADMIN

    def __repr__(self):
        return f"<User {self.username}, Role: {self.role}>"

class CourseLevel(str, PyEnum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"

class CourseStatus(str, PyEnum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    description = Column(Text)
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    duration_weeks = Column(Integer, nullable=False)
    level = Column(SQLEnum(CourseLevel, name="courselevel"), nullable=False)
    category = Column(String(50), nullable=False)
    status = Column(SQLEnum(CourseStatus, name="coursestatus"), default=CourseStatus.DRAFT)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    instructor = relationship("User", back_populates="courses")
    enrollments = relationship("Enrollment", back_populates="course")
    contents = relationship("CourseContent", back_populates="course")
    text_contents = relationship("TextContent", back_populates="course", cascade="all, delete-orphan")

class TextContent(Base):
    __tablename__ = "text_contents"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    raw_text = Column(Text)
    formatted_text = Column(Text)
    formatting_options = Column(JSON)
    version = Column(Integer, nullable=False, default=1)
    published = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationship
    course = relationship("Course", back_populates="text_contents")

    def __repr__(self):
        return f"<TextContent {self.id}: Version {self.version}>"
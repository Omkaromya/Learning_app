from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from models.models import User, Course, CourseStatus
from schemas.schemas import (
    Course as CourseSchema,
    CourseCreate,
    CourseUpdate,
    Lesson as LessonSchema,
    LessonCreate,
    LessonUpdate,
    PaginatedCourseResponse
)
from utils.auth import get_current_active_user
from database.database import get_db
from utils.logger import logger

router = APIRouter(
    prefix="/courses",
    tags=["courses"]
)

# Course endpoints
@router.post("/", response_model=CourseSchema)
async def create_course(
    course: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_course = Course(
        **course.dict(),
        instructor_id=current_user.id
    )
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

@router.get("/", response_model=PaginatedCourseResponse)
async def read_courses(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of records to return"),
    db: Session = Depends(get_db)
):
    """
    Get all courses with pagination.
    Returns a paginated list of courses with all fields.
    """
    try:
        # Get total count
        total_courses = db.query(func.count(Course.id)).scalar()
        
        # Get courses with pagination
        courses = db.query(Course).offset(skip).limit(limit).all()
        
        logger.info(f"Retrieved {len(courses)} courses out of {total_courses} total courses")
        
        return PaginatedCourseResponse(
            total=total_courses,
            skip=skip,
            limit=limit,
            courses=courses
        )
    except Exception as e:
        logger.error(f"Error fetching courses: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error fetching courses"
        )

@router.get("/{course_id}", response_model=CourseSchema)
async def read_course(
    course_id: int,
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@router.put("/{course_id}", response_model=CourseSchema)
async def update_course(
    course_id: int,
    course: CourseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_course = db.query(Course).filter(Course.id == course_id).first()
    if db_course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    if db_course.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this course")

    for key, value in course.dict(exclude_unset=True).items():
        setattr(db_course, key, value)

    db.commit()
    db.refresh(db_course)
    return db_course

@router.delete("/{course_id}")
async def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_course = db.query(Course).filter(Course.id == course_id).first()
    if db_course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    if db_course.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this course")

    db.delete(db_course)
    db.commit()
    return {"message": "Course deleted successfully"}

@router.put("/{course_id}/publish", response_model=CourseSchema)
async def publish_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_course = db.query(Course).filter(Course.id == course_id).first()
    if db_course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    if db_course.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to publish this course"
        )

    try:
        # Toggle between PUBLISHED and DRAFT
        new_status = CourseStatus.DRAFT if db_course.status == CourseStatus.PUBLISHED else CourseStatus.PUBLISHED
        db_course.status = new_status
        
        db.commit()
        db.refresh(db_course)
        
        action = "published" if new_status == CourseStatus.PUBLISHED else "unpublished"
        logger.info(f"Course {db_course.title} (ID: {course_id}) {action} by user {current_user.username}")
        
        return db_course
    except Exception as e:
        db.rollback()
        error_msg = f"Error updating course status: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating course status"
        )

@router.get("/published", response_model=PaginatedCourseResponse)
async def get_published_courses(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of records to return"),
    db: Session = Depends(get_db)
):
    """
    Get all published courses with pagination.
    """
    try:
        # Get total count of published courses
        total_courses = db.query(func.count(Course.id)).filter(
            Course.status == CourseStatus.PUBLISHED
        ).scalar()
        
        # Get published courses with pagination
        courses = db.query(Course).filter(
            Course.status == CourseStatus.PUBLISHED
        ).offset(skip).limit(limit).all()
        
        logger.info(f"Retrieved {len(courses)} published courses out of {total_courses} total published courses")
        
        return PaginatedCourseResponse(
            total=total_courses,
            skip=skip,
            limit=limit,
            courses=courses
        )
    except Exception as e:
        logger.error(f"Error fetching published courses: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching published courses"
        )

# # Lesson endpoints
# @router.post("/{course_id}/lessons", response_model=LessonSchema)
# async def create_lesson(
#     course_id: int,
#     lesson: LessonCreate,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_active_user)
# ):
#     course = db.query(Course).filter(Course.id == course_id).first()
#     if course is None:
#         raise HTTPException(status_code=404, detail="Course not found")
#     if course.instructor_id != current_user.id:
#         raise HTTPException(status_code=403, detail="Not authorized to add lessons to this course")
#
#     db_lesson = Lesson(**lesson.dict())
#     db.add(db_lesson)
#     db.commit()
#     db.refresh(db_lesson)
#     return db_lesson
#
# @router.get("/{course_id}/lessons", response_model=List[LessonSchema])
# async def read_lessons(
#     course_id: int,
#     db: Session = Depends(get_db)
# ):
#     lessons = db.query(Lesson).filter(Lesson.course_id == course_id).order_by(Lesson.order).all()
#     return lessons
#
# @router.put("/{course_id}/lessons/{lesson_id}", response_model=LessonSchema)
# async def update_lesson(
#     course_id: int,
#     lesson_id: int,
#     lesson: LessonUpdate,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_active_user)
# ):
#     course = db.query(Course).filter(Course.id == course_id).first()
#     if course is None:
#         raise HTTPException(status_code=404, detail="Course not found")
#     if course.instructor_id != current_user.id:
#         raise HTTPException(status_code=403, detail="Not authorized to update lessons in this course")
#
#     db_lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
#     if db_lesson is None:
#         raise HTTPException(status_code=404, detail="Lesson not found")
#
#     for key, value in lesson.dict(exclude_unset=True).items():
#         setattr(db_lesson, key, value)
#
#     db.commit()
#     db.refresh(db_lesson)
#     return db_lesson
#
# @router.delete("/{course_id}/lessons/{lesson_id}")
# async def delete_lesson(
#     course_id: int,
#     lesson_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_active_user)
# ):
#     course = db.query(Course).filter(Course.id == course_id).first()
#     if course is None:
#         raise HTTPException(status_code=404, detail="Course not found")
#     if course.instructor_id != current_user.id:
#         raise HTTPException(status_code=403, detail="Not authorized to delete lessons from this course")
#
#     db_lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
#     if db_lesson is None:
#         raise HTTPException(status_code=404, detail="Lesson not found")
#
#     db.delete(db_lesson)
#     db.commit()
#     return {"message": "Lesson deleted successfully"}
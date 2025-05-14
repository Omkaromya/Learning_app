from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from models.models import User, Course
from models.schemas import Enrollment as EnrollmentSchema, EnrollmentCreate
from utils.auth import get_current_active_user
from database.database import get_db

router = APIRouter(
    prefix="/enrollments",
    tags=["enrollments"]
)

@router.post("/", response_model=EnrollmentSchema)
async def create_enrollment(
    enrollment: EnrollmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if course exists
    course = db.query(Course).filter(Course.id == enrollment.course_id).first()
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")

    # Check if already enrolled
    existing_enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == enrollment.course_id
    ).first()
    if existing_enrollment:
        raise HTTPException(status_code=400, detail="Already enrolled in this course")

    # Create enrollment
    db_enrollment = Enrollment(
        user_id=current_user.id,
        course_id=enrollment.course_id
    )
    db.add(db_enrollment)
    db.commit()
    db.refresh(db_enrollment)
    return db_enrollment

@router.get("/my-enrollments", response_model=List[EnrollmentSchema])
async def read_my_enrollments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    enrollments = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id
    ).all()
    return enrollments

@router.put("/{enrollment_id}/complete")
async def mark_course_completed(
    enrollment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    enrollment = db.query(Enrollment).filter(
        Enrollment.id == enrollment_id,
        Enrollment.user_id == current_user.id
    ).first()
    if enrollment is None:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    enrollment.completed = True
    db.commit()
    return {"message": "Course marked as completed"}

@router.delete("/{enrollment_id}")
async def delete_enrollment(
    enrollment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    enrollment = db.query(Enrollment).filter(
        Enrollment.id == enrollment_id,
        Enrollment.user_id == current_user.id
    ).first()
    if enrollment is None:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    db.delete(enrollment)
    db.commit()
    return {"message": "Enrollment deleted successfully"}
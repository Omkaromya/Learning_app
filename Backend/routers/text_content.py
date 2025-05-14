from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database.database import get_db
from models.models import TextContent, Course
from schemas.schemas import TextContentCreate, TextContentOut
from typing import List
from pydantic import BaseModel

class PaginatedTextContentResponse(BaseModel):
    total: int
    skip: int
    limit: int
    text_contents: List[TextContentOut]

router = APIRouter(
    prefix="/text-contents",
    tags=["text-contents"]
)

@router.post("/", response_model=TextContentOut, status_code=status.HTTP_201_CREATED)
def create_text_content(
    text_content: TextContentCreate,
    db: Session = Depends(get_db)
):
    # Check if the course exists
    course = db.query(Course).filter(Course.id == text_content.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Check if a TextContent record already exists for this course_id
    existing_text_content = db.query(TextContent).filter(TextContent.course_id == text_content.course_id).first()

    if existing_text_content:
        # Update existing record
        existing_text_content.raw_text = text_content.raw_text
        existing_text_content.formatted_text = text_content.formatted_text
        existing_text_content.formatting_options = text_content.formatting_options
        existing_text_content.version = text_content.version or existing_text_content.version
        existing_text_content.published = text_content.published or existing_text_content.published
        db.commit()
        db.refresh(existing_text_content)
        return existing_text_content
    else:
        # Create new record
        db_text_content = TextContent(
            course_id=text_content.course_id,
            raw_text=text_content.raw_text,
            formatted_text=text_content.formatted_text,
            formatting_options=text_content.formatting_options,
            version=text_content.version or 1,
            published=text_content.published or False
        )
        db.add(db_text_content)
        db.commit()
        db.refresh(db_text_content)
        return db_text_content

@router.get("/", response_model=PaginatedTextContentResponse)
def get_all_text_contents(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=100, description="Number of records to return"),
    db: Session = Depends(get_db)
):
    # Get total count
    total_text_contents = db.query(TextContent).count()
    
    # Get text contents with pagination
    text_contents = db.query(TextContent).offset(skip).limit(limit).all()
    
    # Convert SQLAlchemy models to dictionaries and then to Pydantic models
    text_content_out_list = [
        TextContentOut(
            id=tc.id,
            course_id=tc.course_id,
            raw_text=tc.raw_text,
            formatted_text=tc.formatted_text,
            formatting_options=tc.formatting_options,
            version=tc.version,
            published=tc.published,
            created_at=tc.created_at,
            updated_at=tc.updated_at
        ) for tc in text_contents
    ]
    
    return PaginatedTextContentResponse(
        total=total_text_contents,
        skip=skip,
        limit=limit,
        text_contents=text_content_out_list
    ) 
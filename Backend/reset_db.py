from database.database import engine
from models.models import Base
from utils.logger import logger

def reset_db():
    try:
        # Drop all tables
        logger.info("Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        logger.info("All tables dropped successfully")

        # Create all tables
        logger.info("Creating new tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error resetting database: {str(e)}")
        raise

if __name__ == "__main__":
    logger.info("Starting database reset...")
    reset_db()
    logger.info("Database reset completed.") 
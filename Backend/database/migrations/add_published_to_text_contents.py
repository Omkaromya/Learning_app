import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy import create_engine, text
from database.database import SQLALCHEMY_DATABASE_URL

def migrate():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    # SQL to add the published column
    sql = """
    ALTER TABLE text_contents
    ADD COLUMN published BOOLEAN DEFAULT FALSE;
    """
    
    try:
        with engine.connect() as connection:
            connection.execute(text(sql))
            connection.commit()
            print("Successfully added 'published' column to text_contents table")
    except Exception as e:
        print(f"Error adding 'published' column: {str(e)}")
        raise

if __name__ == "__main__":
    migrate() 
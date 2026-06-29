import os
os.environ['DATABASE_URL'] = 'postgresql+psycopg2://Dell@localhost:5432/zoom_clone'

from sqlalchemy import create_engine, text

engine = create_engine(os.environ['DATABASE_URL'])
with engine.connect() as conn:
    conn.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL;'))
    conn.commit()
    print("Database updated on 5432!")

import os
os.environ['DATABASE_URL'] = 'postgresql+psycopg2://Dell@localhost:5432/zoom_clone'

from sqlalchemy import create_engine, text

engine = create_engine(os.environ['DATABASE_URL'])
with engine.connect() as conn:
    res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='users';"))
    print("Columns:", [r[0] for r in res])

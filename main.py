from sqlmodel import SQLModel, Field, create_engine, Session, select
from fastapi import FastAPI, Depends

class Task(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str
    description: str | None = None
    status: str
    done: bool = False

sqlite_filename = "board_database.db"
sqlite_url = f"sqlite:///{sqlite_filename}"

engine = create_engine(sqlite_url, echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

app = FastAPI()

def get_session():
    with Session(engine) as session:
        yield session

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.post("/task/")
def create_task(task: Task, session: Session = Depends(get_session)):
    session.add(task)
    session.commit()
    session.refresh(task)
    return task

@app.get("/task/")
def read_tasks(session: Session = Depends(get_session)):
    return session.exec(select(Task)).all()

@app.get("/")
def root():
    return {"message": "API is running"}

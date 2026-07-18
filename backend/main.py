from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import solve, scramble, websockets

app = FastAPI(title="Rubik's Cube Solver API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

app.include_router(scramble.router, prefix="/api/scramble")
app.include_router(solve.router, prefix="/api/solve")
app.include_router(websockets.router, prefix="/api")

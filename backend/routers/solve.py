from fastapi import APIRouter, HTTPException
import time
from models.schemas import SolveRequest, SolveResponse
from solvers.kociemba_solver import solve_kociemba
from solvers.custom_solver import solve_custom

router = APIRouter()

@router.post("/optimal", response_model=SolveResponse)
def solve_optimal_endpoint(request: SolveRequest):
    start_time = time.time()
    try:
        solution = solve_kociemba(request.state)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    time_ms = int((time.time() - start_time) * 1000)
    
    return SolveResponse(
        solution=solution,
        moves=len(solution),
        time_ms=time_ms,
        nodes_visited=1
    )

@router.post("/custom", response_model=SolveResponse)
def solve_custom_endpoint(request: SolveRequest):
    start_time = time.time()
    try:
        solution, nodes_visited = solve_custom(request.state)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    time_ms = int((time.time() - start_time) * 1000)
    
    return SolveResponse(
        solution=solution,
        moves=len(solution),
        time_ms=time_ms,
        nodes_visited=nodes_visited
    )

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from models.schemas import ScrambleResponse
from core.cube import generate_scramble, apply_move

router = APIRouter()

class ScrambleRequest(BaseModel):
    state: Optional[str] = None
    length: Optional[int] = 20
    moves: Optional[list[str]] = None

@router.post("", response_model=ScrambleResponse)
def get_scramble(request: ScrambleRequest = None):
    if request and request.moves is not None:
        moves = request.moves
    else:
        length = request.length if request and request.length else 20
        moves = generate_scramble(length=length)
    
    if request and request.state:
        state_arr = list(request.state)
    else:
        from core.cube import SOLVED_STATE
        state_arr = list(SOLVED_STATE)
        
    for move in moves:
        apply_move(state_arr, move)
        
    final_state = "".join(state_arr)
    return ScrambleResponse(scramble=moves, state=final_state)

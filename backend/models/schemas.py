from pydantic import BaseModel
from typing import List

class SolveRequest(BaseModel):
    state: str  # 54-char facelet string
    
class SolveResponse(BaseModel):
    solution: List[str]
    moves: int
    time_ms: int
    nodes_visited: int = 0

class ScrambleResponse(BaseModel):
    scramble: List[str]
    state: str

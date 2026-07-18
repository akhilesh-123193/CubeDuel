# Engineering Handoff & Architecture Audit
**Project**: AI Rubik's Cube Algorithm Visualization Platform

This document serves as a complete technical reference and engineering audit for the codebase, verifying exactly how the solvers are implemented, how the telemetry operates, and the limitations of the current architecture.

======================================================
## 1. PROJECT TREE
======================================================
```
/home/akhilesh/projects/rubiks-cube/
├── backend/
│   ├── core/
│   │   └── cube.py               (Cube constants, solved state, move cycles)
│   ├── models/
│   │   └── schemas.py            (Pydantic payload models)
│   ├── routers/
│   │   ├── scramble.py           (Cumulative scramble generation)
│   │   └── solve.py              (FastAPI solver endpoints)
│   ├── solvers/
│   │   ├── custom_solver.py      (IDDFS + PDB Python implementation)
│   │   └── kociemba_solver.py    (Two-Phase algorithm wrapper)
│   └── main.py                   (FastAPI entry point)
└── frontend/
    └── src/
        ├── app/
        │   └── page.tsx          (Main UI, Solve Request Logic, State)
        ├── components/
        │   ├── Cube3D.tsx        (Three.js visualization)
        │   └── AlgorithmDashboard.tsx (Dashboard, Telemetry, Engineering Report)
        └── cube/
            ├── CubeEngine.ts     (Pure math quaternion engine)
            ├── CubeAnimator.ts   (Slerp interpolation)
            └── MoveTables.ts     (Coordinate transformations)
```
**Important Files**:
- `backend/solvers/custom_solver.py`: The actual graph search logic.
- `frontend/src/app/page.tsx`: Controls the `Promise.all()` concurrent API requests.
- `frontend/src/components/AlgorithmDashboard.tsx`: Controls telemetry display (real and simulated).

======================================================
## 2. SOLVE REQUEST FLOW
======================================================
When the user clicks "Solve Sequence" in `page.tsx`:

**1. Frontend function**: `handleSolve`
**2. API request**: Initiates a `Promise.all` with a 1200ms suspense delay to create the "Algorithm Race".
```javascript
const minDelay = new Promise(resolve => setTimeout(resolve, 1200)); // Suspense!
const [optRes, custRes] = await Promise.all([
  axios.post(`${API_URL}/solve/optimal`, { state: cubeState }).catch(e => ({ data: null, error: e })),
  axios.post(`${API_URL}/solve/custom`, { state: cubeState }).catch(e => ({ data: null, error: e })),
  minDelay
]);
```
**3. Backend endpoint**: Routes to `routers/solve.py`.
**4. Solver selection**: Endpoints are split into `/api/solve/optimal` and `/api/solve/custom`.
**5. Returned JSON**: 
```json
{
  "solution": ["U", "R", "F'"],
  "moves": 3,
  "time_ms": 14,
  "nodes_visited": 18
}
```
**6. Animation queue**: The winning solution is appended to `movesQueue` and passed down to `Cube3D` for sequential execution via `CubeAnimator.ts`.

======================================================
## 3. CUSTOM SOLVER IMPLEMENTATION
======================================================
Implemented in `backend/solvers/custom_solver.py`:

```python
class CustomSolver:
    def __init__(self, pdb_depth=4):
        self.pdb_depth = pdb_depth
        self.pdb = {}
        self.nodes_visited = 0
        self.build_pdb()
        
    def build_pdb(self):
        print(f"Building PDB to depth {self.pdb_depth}...")
        start_time = time.time()
        
        solved_tuple = tuple(SOLVED_STATE)
        self.pdb[solved_tuple] = 0
        
        queue = deque([(solved_tuple, 0)])
        
        while queue:
            current_state, depth = queue.popleft()
            
            if depth == self.pdb_depth:
                continue
                
            for move in ALL_MOVES_CYCLES.keys():
                next_state = apply_move_tuple(current_state, move)
                if next_state not in self.pdb:
                    self.pdb[next_state] = depth + 1
                    queue.append((next_state, depth + 1))

    def solve(self, state_string, max_search_depth=8):
        initial_state = tuple(state_string)
        if initial_state == tuple(SOLVED_STATE):
            return [], 0
            
        self.nodes_visited = 0
        
        for depth_limit in range(1, max_search_depth + 1):
            path = []
            if self.iddfs(initial_state, 0, depth_limit, path, last_move=None):
                return path, self.nodes_visited
                
        raise Exception(f"No solution found within depth {max_search_depth}")

    def iddfs(self, state, current_depth, depth_limit, path, last_move):
        self.nodes_visited += 1
        
        if state == tuple(SOLVED_STATE):
            return True
            
        if state in self.pdb:
            moves_needed = self.pdb[state]
            if current_depth + moves_needed > depth_limit:
                return False
        else:
            if current_depth + (self.pdb_depth + 1) > depth_limit:
                return False
                
        if current_depth == depth_limit:
            return False

        for move in ALL_MOVES_CYCLES.keys():
            if last_move and move[0] == last_move[0]:
                continue
                
            next_state = apply_move_tuple(state, move)
            path.append(move)
            
            if self.iddfs(next_state, current_depth + 1, depth_limit, path, move):
                return True
                
            path.pop()
            
        return False
```

======================================================
## 4. WHY DOES THE CUSTOM SOLVER TIME OUT
======================================================
The solver times out explicitly because of a hard-coded depth limitation parameter. It does not time out based on a clock, memory limits, or CPU load.

**The Exact Condition:**
In `backend/solvers/custom_solver.py`:
```python
def solve_custom(state_string: str) -> tuple[list[str], int]:
    global _solver_instance
    if _solver_instance is None:
        _solver_instance = CustomSolver(pdb_depth=4)
        
    solution, nodes = _solver_instance.solve(state_string, max_search_depth=8)
    return solution, nodes
```

Inside the `solve` function:
```python
        for depth_limit in range(1, max_search_depth + 1):
            path = []
            if self.iddfs(initial_state, 0, depth_limit, path, last_move=None):
                return path, self.nodes_visited
                
        # If we reach here, we didn't find a solution within max_search_depth
        raise Exception(f"No solution found within depth {max_search_depth}")
```
Because `max_search_depth` is statically passed as `8`, if the cube requires 9 or more moves to solve, the IDDFS loop naturally terminates and raises the Exception, returning a `400 Bad Request` to the frontend, which renders as a "Timeout".

======================================================
## 5. SOLVER API
======================================================
The API endpoints are defined in `backend/routers/solve.py`. They do not call each other. The frontend calls both concurrently. 

**Endpoint 1: POST /api/solve/optimal**
```python
@router.post("/optimal", response_model=SolveResponse)
def solve_optimal_endpoint(request: SolveRequest):
    start_time = time.time()
    try:
        solution = solve_kociemba(request.state)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    time_ms = int((time.time() - start_time) * 1000)
    
    return SolveResponse(solution=solution, moves=len(solution), time_ms=time_ms, nodes_visited=1)
```
**Endpoint 2: POST /api/solve/custom**
```python
@router.post("/custom", response_model=SolveResponse)
def solve_custom_endpoint(request: SolveRequest):
    start_time = time.time()
    try:
        solution, nodes_visited = solve_custom(request.state)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    time_ms = int((time.time() - start_time) * 1000)
    
    return SolveResponse(solution=solution, moves=len(solution), time_ms=time_ms, nodes_visited=nodes_visited)
```
If an exception occurs (like max depth exceeded), a 400 is thrown.

======================================================
## 6. PATTERN DATABASE
======================================================
The custom heuristic is a strict Breadth-First Search Pattern Database.
- **Depth**: `pdb_depth = 4`
- **Number of States**: Caches approximately `46,741` states.
- **Generation**: Executes once upon backend initialization via `CustomSolver.__init__`. Uses a `collections.deque` queue to map every possible state up to 4 moves away from the solved state.
- **Storage**: In-memory Python `dict` mapping the 54-character `tuple(state)` to an integer `depth`.
- **Lookup**: Returns the exact number of moves to solve if `state in self.pdb`.

======================================================
## 7. GRAPH SEARCH
======================================================
The graph search uses Iterative Deepening Depth-First Search (IDDFS).
- **Children Generation**: Loops through `ALL_MOVES_CYCLES.keys()` and executes `apply_move_tuple` (in-memory permutation swaps).
- **Duplicates**: Duplicate state-checking is NOT implemented in the DFS (which would require a massive visited set), leading to potential cycle repetition, hence IDDFS is used instead of pure DFS.
- **Visited States**: Tracked globally via `self.nodes_visited += 1` purely for telemetry metrics.
- **Pruning**: 
    1. Redundant Moves: `if last_move and move[0] == last_move[0]: continue`
    2. PDB Check: `if current_depth + moves_needed > depth_limit: return False`
    3. Missing PDB Limit: `if current_depth + (self.pdb_depth + 1) > depth_limit: return False`
- **Termination**: Terminates if `state == tuple(SOLVED_STATE)`.

======================================================
## 8. TELEMETRY
======================================================
The frontend blends real backend data with simulated UX visualization data.

| Displayed Metric | Status | Source |
| :--- | :--- | :--- |
| **Final Move Count** | **REAL** | `optimal.moves` / `custom.moves` from backend |
| **Final Execution Time** | **REAL** | `optimal.time_ms` / `custom.time_ms` from backend |
| **Final Nodes Explored** | **REAL** | `custom.nodes_visited` from backend |
| **LIVE Depth (During Search)** | **SIMULATED** | `setInterval` counting up every 150ms in `AlgorithmDashboard.tsx` |
| **LIVE Nodes (During Search)** | **SIMULATED** | Exponential math (`Math.pow(1.6, elapsed/50)`) in `AlgorithmDashboard.tsx` |
| **Thinking Feed Console Logs** | **SIMULATED** | React State `setLogs` pushed via `setInterval` during execution |
| **Winning Factor text** | **STATIC** | Hardcoded text explaining Kociemba mathematical superiority |
| **Solution Animation** | **REAL** | Uses exact solution string provided by backend array |

======================================================
## 9. FRONTEND SOLVER STATE
======================================================
Controlled in `frontend/src/app/page.tsx` via React State hooks.

```typescript
const [isSolving, setIsSolving] = useState(false);
const [optimalResult, setOptimalResult] = useState<any>(null);
const [customResult, setCustomResult] = useState<any>(null);
```
- **Loading / Searching**: Active when `isSolving === true`. Triggers `AlgorithmDashboard` to display simulated telemetry and `Cube3D` to show a spinning wheel (if added).
- **Timeout / Failure**: If `axios.post` fails, `catch` maps the error to `{ data: null }`. `AlgorithmDashboard` reads `custom === null && optimal !== null` as a Timeout.
- **Success**: Data populates `customResult`, unlocking the Post-Mortem Engineering report.

======================================================
## 10. BACKEND LOGS
======================================================
When the backend initializes for the first time:
```text
Building PDB to depth 4...
PDB built in 0.12s. 46741 states cached.
```
When a solve is pressed, FastAPI logs:
```text
INFO:     127.0.0.1:42490 - "POST /api/solve/optimal HTTP/1.1" 200 OK
INFO:     127.0.0.1:42488 - "POST /api/solve/custom HTTP/1.1" 400 Bad Request
```
*(400 Bad Request is triggered by depth > 8 limits)*.

======================================================
## 11. KNOWN LIMITATIONS
======================================================
1. **Depth Limit**: Custom solver strictly fails on $>8$ depth scrambles.
2. **Blocking HTTP**: The `solve_custom` executes sync IDDFS on the FastAPI main thread, freezing the server for a few milliseconds until it finishes or hits depth 8.
3. **No WebSockets**: Telemetry displayed to the user during the search is purely simulated because HTTP cannot stream IDDFS traversal states back to the client continuously.
4. **Memory Constraint**: PDB cannot exceed depth 5 in pure python without exhausting RAM or causing a 30+ second boot time.

======================================================
## 12. FILES THAT IMPLEMENT THE CUSTOM SOLVER
======================================================
- `backend/solvers/custom_solver.py`
- `backend/core/cube.py` (supplies `ALL_MOVES_CYCLES` and `SOLVED_STATE`)
- `backend/routers/solve.py` (exposes endpoint)

======================================================
## 13. FINAL AUDIT
======================================================
**Is the custom solver actually searching?**
Yes. It actively traverses the mathematical state-graph using `apply_move_tuple` to swap array indices.

**Does it explore nodes?**
Yes. The `nodes_visited` count accurately reflects the amount of recursive `iddfs` calls made before either finding a solution or hitting the depth limit.

**Does it produce live telemetry?**
No. The live updating telemetry (the "Thinking Feed", "Depth", and "Nodes" ticking up while searching) in the frontend is purely a UX simulation (`setInterval`). Only the final returned values are mathematically real.

**Is the timeout genuine?**
Yes, but mechanically artificial. It explicitly raises an exception `f"No solution found within depth {max_search_depth}"` if the loop reaches 8 without returning `True`. It does not timeout based on a clock, but based on graph depth constraints.

**Can it solve more than 8-move scrambles?**
No. `max_search_depth=8` is statically hardcoded in `solve_custom()`. If you raise this limit, the solver will physically attempt deeper scrambles, but because the PDB is only depth 4, the IDDFS expansion will result in an exponential explosion $O(18^N)$, likely causing HTTP timeouts or out-of-memory errors on deep scrambles (e.g. 15 moves).

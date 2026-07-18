import time
from collections import deque
from core.cube import ALL_MOVES_CYCLES, SOLVED_STATE

# We create an optimized apply_move for the custom solver to avoid overhead
def apply_move_tuple(state_tuple, move):
    state_list = list(state_tuple)
    cycles = ALL_MOVES_CYCLES[move]
    for cycle in cycles:
        if len(cycle) == 4:
            a, b, c, d = cycle
            temp = state_list[d]
            state_list[d] = state_list[c]
            state_list[c] = state_list[b]
            state_list[b] = state_list[a]
            state_list[a] = temp
        elif len(cycle) == 2:
            a, b = cycle
            state_list[a], state_list[b] = state_list[b], state_list[a]
    return tuple(state_list)

class CustomSolver:
    def __init__(self, pdb_depth=4):
        self.pdb_depth = pdb_depth
        self.pdb = {}
        self.nodes_visited = 0
        self.build_pdb()
        
    def build_pdb(self):
        """
        Precomputes a BFS Pattern Database from the solved state up to `pdb_depth`.
        Instead of a full corner/edge PDB, we just store full cube states.
        This limits us to depth 4 or 5 due to memory/time, but is perfect for MVP.
        """
        print(f"Building PDB to depth {self.pdb_depth}...")
        start_time = time.time()
        
        solved_tuple = tuple(SOLVED_STATE)
        self.pdb[solved_tuple] = 0
        
        # Queue stores: (state_tuple, depth)
        queue = deque([(solved_tuple, 0)])
        
        while queue:
            current_state, depth = queue.popleft()
            
            if depth == self.pdb_depth:
                continue
                
            for move in ALL_MOVES_CYCLES.keys():
                # We apply the INVERSE move because we are searching backwards from solved.
                # Actually, any move from solved generates valid states. Distance is symmetric.
                next_state = apply_move_tuple(current_state, move)
                if next_state not in self.pdb:
                    self.pdb[next_state] = depth + 1
                    queue.append((next_state, depth + 1))
                    
        print(f"PDB built in {time.time() - start_time:.2f}s. {len(self.pdb)} states cached.")

    def solve(self, state_string, max_search_depth=8):
        """
        Iterative Deepening DFS using the PDB for pruning.
        """
        initial_state = tuple(state_string)
        if initial_state == tuple(SOLVED_STATE):
            return [], 0
            
        self.nodes_visited = 0
        
        # Iterative deepening
        for depth_limit in range(1, max_search_depth + 1):
            path = []
            if self.iddfs(initial_state, 0, depth_limit, path, last_move=None):
                return path, self.nodes_visited
                
        # If we reach here, we didn't find a solution within max_search_depth
        raise Exception(f"No solution found within depth {max_search_depth}")

    def iddfs(self, state, current_depth, depth_limit, path, last_move):
        self.nodes_visited += 1
        
        # Base case: reached solved state
        if state == tuple(SOLVED_STATE):
            return True
            
        # Pruning using BFS Pattern Database
        # If the state is in PDB, we know exactly how many moves it takes to solve it.
        # If current_depth + moves_needed > depth_limit, this branch cannot yield a solution.
        if state in self.pdb:
            moves_needed = self.pdb[state]
            if current_depth + moves_needed > depth_limit:
                return False
        else:
            # If state is NOT in PDB, we know it takes MORE than pdb_depth moves to solve.
            # So if current_depth + (pdb_depth + 1) > depth_limit, we can prune.
            if current_depth + (self.pdb_depth + 1) > depth_limit:
                return False
                
        # If we've reached the depth limit and it wasn't solved, stop.
        if current_depth == depth_limit:
            return False

        # Explore neighbors
        for move in ALL_MOVES_CYCLES.keys():
            # Redundant move pruning (don't turn the same face twice in a row)
            if last_move and move[0] == last_move[0]:
                continue
                
            # Opposite face pruning could also be added here for optimization
                
            next_state = apply_move_tuple(state, move)
            path.append(move)
            
            if self.iddfs(next_state, current_depth + 1, depth_limit, path, move):
                return True
                
            path.pop()
            
        return False

# Global instance so PDB is built once on startup
_solver_instance = None

def solve_custom(state_string: str) -> tuple[list[str], int]:
    global _solver_instance
    if _solver_instance is None:
        _solver_instance = CustomSolver(pdb_depth=4) # Depth 4 takes ~0.5s in Python. Depth 5 takes ~5s.
        
    solution, nodes = _solver_instance.solve(state_string, max_search_depth=8)
    return solution, nodes

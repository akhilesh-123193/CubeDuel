import time
from collections import deque
from core.cube import SOLVED_STATE, ALL_MOVES_CYCLES
from engine.state import compute_zobrist, apply_move_with_hash

class PatternDatabase:
    def __init__(self, depth: int = 5):
        self.depth = depth
        self.pdb = {}
        self._build()
        
    def _build(self):
        print(f"[PDB] Initializing Heuristic Pattern Database to depth {self.depth}...")
        start_time = time.time()
        
        solved_tuple = tuple(SOLVED_STATE)
        solved_hash = compute_zobrist(solved_tuple)
        
        self.pdb[solved_hash] = 0
        
        # Queue stores: (state_tuple, zobrist_hash, depth, last_move)
        queue = deque([(solved_tuple, solved_hash, 0, None)])
        
        nodes_expanded = 0
        
        while queue:
            current_state, current_hash, current_depth, last_move = queue.popleft()
            
            if current_depth == self.depth:
                continue
                
            for move in ALL_MOVES_CYCLES.keys():
                # Basic move pruning: don't turn the same face twice in a row
                if last_move and move[0] == last_move[0]:
                    continue
                    
                next_state, next_hash = apply_move_with_hash(current_state, current_hash, move)
                
                if next_hash not in self.pdb:
                    self.pdb[next_hash] = current_depth + 1
                    queue.append((next_state, next_hash, current_depth + 1, move))
                    nodes_expanded += 1
                    
        elapsed = time.time() - start_time
        print(f"[PDB] Database built in {elapsed:.2f}s. Cached {len(self.pdb):,} compressed states.")
        
    def get_heuristic(self, state_hash: int) -> int:
        """
        Returns the admissible heuristic (minimum moves to solve).
        If the state is in the PDB, returns exact distance.
        If not, it must take AT LEAST (pdb_depth + 1) moves.
        """
        return self.pdb.get(state_hash, self.depth + 1)

# Global singleton
_pdb_instance = None

def get_pdb() -> PatternDatabase:
    global _pdb_instance
    if _pdb_instance is None:
        _pdb_instance = PatternDatabase(depth=5)
    return _pdb_instance

from core.cube import SOLVED_STATE, ALL_MOVES_CYCLES
from engine.state import compute_zobrist, apply_move_with_hash
from engine.heuristic import get_pdb
from engine.telemetry import TelemetryState
import time

class IDAStarSolver:
    def __init__(self, telemetry: TelemetryState):
        self.pdb = get_pdb()
        self.telemetry = telemetry
        
        # Transposition table for pruning duplicates.
        # Maps zobrist_hash -> min_g_cost_found_so_far
        self.tt = {}
        
    def solve(self, state_string: str, max_depth: int = 20):
        self.telemetry.start()
        initial_state = tuple(state_string)
        initial_hash = compute_zobrist(initial_state)
        
        if initial_state == tuple(SOLVED_STATE):
            self.telemetry.finish({"solution": [], "moves": 0, "time_ms": 0, "nodes_visited": 0})
            return
            
        initial_h = self.pdb.get_heuristic(initial_hash)
        threshold = initial_h
        
        self.start_time = time.time()
        
        try:
            while threshold <= max_depth:
                if time.time() - self.start_time > 5.0:
                    self.telemetry.fail("Search timed out (5.0s limit). Search space exploded.")
                    return

                self.telemetry.set_depth_limit(threshold)
                self.tt.clear() # Clear TT on each depth iteration to avoid unbounded memory growth
                
                path = []
                result = self._search(initial_state, initial_hash, 0, threshold, path, None)
                
                if result is True:
                    # Solution found
                    elapsed = int((time.time() - self.start_time) * 1000)
                    self.telemetry.finish({
                        "solution": list(path),
                        "moves": len(path),
                        "time_ms": elapsed,
                        "nodes_visited": self.telemetry.nodes_explored
                    })
                    return
                elif result == float('inf'):
                    # No solution possible
                    break
                    
                # Increase threshold to the minimum f-cost that exceeded the previous threshold
                threshold = result
                
            # If we exit loop
            self.telemetry.fail("Search exhausted or max depth reached.")
            
        except Exception as e:
            self.telemetry.fail(str(e))
            
    def _search(self, state, state_hash, g, threshold, path, last_move):
        # Update telemetry sparingly to avoid lock overhead, maybe every 1000 nodes?
        # We will batch telemetry updates.
        
        h = self.pdb.get_heuristic(state_hash)
        f = g + h
        
        if f > threshold:
            return f
            
        if state == tuple(SOLVED_STATE):
            return True
            
        # Transposition Table lookup
        # If we reached this exact state before with an equal or lower cost, prune it!
        if state_hash in self.tt and self.tt[state_hash] <= g:
            # We must record that we pruned a branch for telemetry!
            return float('inf') # Pruned
            
        self.tt[state_hash] = g
        
        min_f_exceeded = float('inf')
        
        # Move generation and ordering
        # We want to order moves by their resulting heuristic value (h-cost) to explore promising branches first.
        candidates = []
        for move in ALL_MOVES_CYCLES.keys():
            if last_move and move[0] == last_move[0]:
                continue
                
            next_state, next_hash = apply_move_with_hash(state, state_hash, move)
            next_h = self.pdb.get_heuristic(next_hash)
            candidates.append((next_h, move, next_state, next_hash))
            
        # Sort candidates by h (ascending)
        candidates.sort(key=lambda x: x[0])
        
        # Batch nodes to limit lock contention
        nodes_this_branch = 0
        pruned_this_branch = 0
        
        for next_h, move, next_state, next_hash in candidates:
            nodes_this_branch += 1
            path.append(move)
            
            # Send sample of path to telemetry occasionally
            if nodes_this_branch % 500 == 0:
                 self.telemetry.update(nodes=500, pruned=pruned_this_branch, path=list(path), h=next_h)
                 nodes_this_branch = 0
                 pruned_this_branch = 0
                 if time.time() - self.start_time > 5.0:
                     raise TimeoutError("5s execution limit exceeded.")
                 
            result = self._search(next_state, next_hash, g + 1, threshold, path, move)
            
            if result is True:
                # Flush remaining stats before returning true
                self.telemetry.update(nodes=nodes_this_branch, pruned=pruned_this_branch, path=list(path), h=next_h)
                return True
                
            if result == float('inf'):
                pruned_this_branch += 1
            elif result < min_f_exceeded:
                min_f_exceeded = result
                
            path.pop()
            
        # Flush remaining stats
        if nodes_this_branch > 0 or pruned_this_branch > 0:
            self.telemetry.update(nodes=nodes_this_branch, pruned=pruned_this_branch)
            
        return min_f_exceeded

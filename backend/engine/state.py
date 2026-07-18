import random
from core.cube import SOLVED_STATE, ALL_MOVES_CYCLES

# Precompute Zobrist random numbers
# 54 facelets, each can have 6 possible colors ('U', 'R', 'F', 'D', 'L', 'B')
_COLORS = ['U', 'R', 'F', 'D', 'L', 'B']
ZOBRIST_TABLE = {}

# Fixed seed for reproducibility
random.seed(42)

for facelet_idx in range(54):
    for color in _COLORS:
        ZOBRIST_TABLE[(facelet_idx, color)] = random.getrandbits(64)

def compute_zobrist(state_tuple: tuple[str, ...]) -> int:
    """Computes a 64-bit Zobrist hash for a given cube state."""
    h = 0
    for idx, color in enumerate(state_tuple):
        h ^= ZOBRIST_TABLE[(idx, color)]
    return h

def apply_move(state_tuple: tuple[str, ...], move: str) -> tuple[str, ...]:
    """Optimized move application using pre-defined cycles."""
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

def apply_move_with_hash(state_tuple: tuple[str, ...], h: int, move: str) -> tuple[tuple[str, ...], int]:
    """Applies a move and updates the Zobrist hash incrementally."""
    state_list = list(state_tuple)
    new_h = h
    cycles = ALL_MOVES_CYCLES[move]
    
    for cycle in cycles:
        if len(cycle) == 4:
            a, b, c, d = cycle
            # Remove old colors from hash
            new_h ^= ZOBRIST_TABLE[(a, state_list[a])]
            new_h ^= ZOBRIST_TABLE[(b, state_list[b])]
            new_h ^= ZOBRIST_TABLE[(c, state_list[c])]
            new_h ^= ZOBRIST_TABLE[(d, state_list[d])]
            
            # Swap in list
            temp = state_list[d]
            state_list[d] = state_list[c]
            state_list[c] = state_list[b]
            state_list[b] = state_list[a]
            state_list[a] = temp
            
            # Add new colors to hash
            new_h ^= ZOBRIST_TABLE[(a, state_list[a])]
            new_h ^= ZOBRIST_TABLE[(b, state_list[b])]
            new_h ^= ZOBRIST_TABLE[(c, state_list[c])]
            new_h ^= ZOBRIST_TABLE[(d, state_list[d])]
            
        elif len(cycle) == 2:
            a, b = cycle
            # Remove old
            new_h ^= ZOBRIST_TABLE[(a, state_list[a])]
            new_h ^= ZOBRIST_TABLE[(b, state_list[b])]
            
            # Swap
            state_list[a], state_list[b] = state_list[b], state_list[a]
            
            # Add new
            new_h ^= ZOBRIST_TABLE[(a, state_list[a])]
            new_h ^= ZOBRIST_TABLE[(b, state_list[b])]
            
    return tuple(state_list), new_h

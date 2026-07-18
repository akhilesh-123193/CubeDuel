from backend.core.cube import generate_scramble, apply_moves_to_solved_state
from backend.solvers.custom_solver import solve_custom
import time

moves = generate_scramble(6)
print("Scramble moves:", moves)
state = apply_moves_to_solved_state(moves)
print("Scrambled state:", state)

t0 = time.time()
try:
    solution = solve_custom(state, max_depth=15)
    print("Solution:", solution)
except Exception as e:
    print("Error:", e)
print("Time:", time.time() - t0)

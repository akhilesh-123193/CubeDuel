import kociemba
from core.cube import generate_scramble, apply_moves_to_solved_state

moves = generate_scramble(6)
state = apply_moves_to_solved_state(moves)
print("Scramble:", moves)
print("State:", state)

try:
    sol = kociemba.solve(state)
    print("Kociemba:", sol)
except Exception as e:
    print("Kociemba Error:", e)

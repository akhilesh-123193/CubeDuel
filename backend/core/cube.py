import random

SOLVED_STATE = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"

CYCLES = {
  "U": [
    [0, 2, 8, 6], [1, 5, 7, 3],
    [9, 18, 36, 45], [10, 19, 37, 46], [11, 20, 38, 47]
  ],
  "D": [
    [15, 51, 42, 24], [16, 52, 43, 25], [17, 53, 44, 26],
    [27, 29, 35, 33], [28, 32, 34, 30]
  ],
  "R": [
    [2, 51, 29, 20], [5, 48, 32, 23], [8, 45, 35, 26],
    [9, 11, 17, 15], [10, 14, 16, 12]
  ],
  "L": [
    [0, 18, 27, 53], [3, 21, 30, 50], [6, 24, 33, 47],
    [36, 38, 44, 42], [37, 41, 43, 39]
  ],
  "F": [
    [6, 9, 29, 44], [7, 12, 28, 41], [8, 15, 27, 38],
    [18, 20, 26, 24], [19, 23, 25, 21]
  ],
  "B": [
    [0, 42, 35, 11], [1, 39, 34, 14], [2, 36, 33, 17],
    [45, 47, 53, 51], [46, 50, 52, 48]
  ]
}

ALL_MOVES_CYCLES = {}
for face, cycles in CYCLES.items():
    ALL_MOVES_CYCLES[face] = cycles
    ALL_MOVES_CYCLES[face + "'"] = [[d, c, b, a] for [a, b, c, d] in cycles]
    ALL_MOVES_CYCLES[face + "2"] = [[a, c] for [a, b, c, d] in cycles] + [[b, d] for [a, b, c, d] in cycles]

ALL_MOVES = list(ALL_MOVES_CYCLES.keys())

def apply_move(state_arr: list[str], move: str):
    cycles = ALL_MOVES_CYCLES[move]
    for cycle in cycles:
        if len(cycle) == 4:
            a, b, c, d = cycle
            temp = state_arr[d]
            state_arr[d] = state_arr[c]
            state_arr[c] = state_arr[b]
            state_arr[b] = state_arr[a]
            state_arr[a] = temp
        elif len(cycle) == 2:
            a, b = cycle
            state_arr[a], state_arr[b] = state_arr[b], state_arr[a]

def apply_moves_to_solved_state(moves: list[str]) -> str:
    state_arr = list(SOLVED_STATE)
    for move in moves:
        apply_move(state_arr, move)
    return "".join(state_arr)

def generate_scramble(length=20) -> list[str]:
    faces = ['U', 'D', 'L', 'R', 'F', 'B']
    modifiers = ['', "'", '2']
    
    scramble = []
    last_face = None
    last_last_face = None
    
    for _ in range(length):
        valid_faces = [f for f in faces if f != last_face]
        
        opposite_pairs = [{'U', 'D'}, {'L', 'R'}, {'F', 'B'}]
        if last_face and last_last_face:
            for pair in opposite_pairs:
                if last_face in pair and last_last_face in pair:
                    valid_faces = [f for f in valid_faces if f not in pair]
                    break
                    
        chosen_face = random.choice(valid_faces)
        chosen_mod = random.choice(modifiers)
        
        scramble.append(chosen_face + chosen_mod)
        last_last_face = last_face
        last_face = chosen_face
        
    return scramble

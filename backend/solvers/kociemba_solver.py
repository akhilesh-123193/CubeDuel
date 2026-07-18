import kociemba

def solve_kociemba(state_string: str) -> list[str]:
    # Kociemba accepts the 54 char string U R F D L B
    # returns space separated string e.g. "R U R' U'"
    try:
        solution_str = kociemba.solve(state_string)
        if solution_str.strip() == "":
            return []
        return solution_str.split(" ")
    except Exception as e:
        raise ValueError(f"Invalid cube state: {e}")

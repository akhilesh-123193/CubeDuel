# build_perms.py
import json

def get_facelets():
    facelets = []
    for z in [-1, 0, 1]:
        for x in [-1, 0, 1]:
            facelets.append((x, 1, z, 0, 1, 0)) # U (0-8)
    for y in [1, 0, -1]:
        for z in [1, 0, -1]:
            facelets.append((1, y, z, 1, 0, 0)) # R (9-17)
    for y in [1, 0, -1]:
        for x in [-1, 0, 1]:
            facelets.append((x, y, 1, 0, 0, 1)) # F (18-26)
    for z in [1, 0, -1]:
        for x in [-1, 0, 1]:
            facelets.append((x, -1, z, 0, -1, 0)) # D (27-35)
    for y in [1, 0, -1]:
        for z in [-1, 0, 1]:
            facelets.append((-1, y, z, -1, 0, 0)) # L (36-44)
    for y in [1, 0, -1]:
        for x in [1, 0, -1]:
            facelets.append((x, y, -1, 0, 0, -1)) # B (45-53)
    return facelets

def rotate_cw(x, y, z, nx, ny, nz, axis):
    if axis == 'U': # Look from y=1: up is -z, right is +x. (x, z) -> (-z, x). Top->Right is (-z)->(+x). So z=-1->x=1. (-(-1) = 1). Correct.
        return -z, y, x, -nz, ny, nx
    elif axis == 'D': # Look from y=-1: up is +z, right is +x. (x, z) -> (z, -x). Top(+z)->Right(+x). z=1->x=1. Correct.
        return z, y, -x, nz, ny, -nx
    elif axis == 'R': # Look from x=1: up is +y, right is -z. (y, z) -> (z, -y). Top(+y)->Right(-z). y=1->z=-1. Correct.
        return x, z, -y, nx, nz, -ny
    elif axis == 'L': # Look from x=-1: up is +y, right is +z. (y, z) -> (-z, y). Top(+y)->Right(+z). y=1->z=1. Correct.
        return x, -z, y, nx, -nz, ny
    elif axis == 'F': # Look from z=1: up is +y, right is +x. (x, y) -> (y, -x). Top(+y)->Right(+x). y=1->x=1. Correct.
        return y, -x, z, ny, -nx, nz
    elif axis == 'B': # Look from z=-1: up is +y, right is -x. (x, y) -> (-y, x). Top(+y)->Right(-x). y=1->x=-1. Correct.
        return -y, x, z, -ny, nx, nz

def build_cycles():
    facelets = get_facelets()
    
    def find_idx(pt):
        for i, f in enumerate(facelets):
            if f == pt: return i
        return -1
        
    moves = {}
    for face in ['U', 'D', 'R', 'L', 'F', 'B']:
        cycle_list = []
        visited = set()
        for i in range(54):
            if i in visited: continue
            curr = i
            cycle = []
            while curr not in visited:
                visited.add(curr)
                cycle.append(curr)
                pt = facelets[curr]
                if (face == 'U' and (pt[1] == 1 or pt[4] == 1)) or \
                   (face == 'D' and (pt[1] == -1 or pt[4] == -1)) or \
                   (face == 'R' and (pt[0] == 1 or pt[3] == 1)) or \
                   (face == 'L' and (pt[0] == -1 or pt[3] == -1)) or \
                   (face == 'F' and (pt[2] == 1 or pt[5] == 1)) or \
                   (face == 'B' and (pt[2] == -1 or pt[5] == -1)):
                    new_pt = rotate_cw(*pt, face)
                else:
                    new_pt = pt
                curr = find_idx(new_pt)
                
            if len(cycle) > 1:
                cycle_list.append(tuple(cycle))
        moves[face] = cycle_list
    
    with open('cycles.json', 'w') as f:
        json.dump(moves, f, indent=2)

if __name__ == '__main__':
    build_cycles()

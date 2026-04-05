from .moves import can_capture

# Mobility heuristic
def h_mobility(state):
    pieces = state.pieces
    I = 0
    W = 0

    for i, target in enumerate(pieces):
        du = 0
        for j, attacker in enumerate(pieces):
            if i == j:
                continue
            if can_capture(attacker, target, state):
                du += 1

        if du == 0:
            I += 1
        elif du == 1:
            W += 1

    return I + 0.5 * W

# Isolated heuristic
def h_isolated(state):
    pieces = state.pieces
    I = 0

    for i, target in enumerate(pieces):
        du = 0
        for j, attacker in enumerate(pieces):
            if i == j:
                continue
            if can_capture(attacker, target, state):
                du += 1

        if du == 0:
            I += 1

    return I
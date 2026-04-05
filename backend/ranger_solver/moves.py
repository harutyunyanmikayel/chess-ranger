BOARD_SIZE = 8


def inside(r, c):
    return 0 <= r < BOARD_SIZE and 0 <= c < BOARD_SIZE

def generate_moves(state):
    """
    Returns a list of moves:
    Each move is (attacker_piece, target_piece, new_state)
    """
    moves = []

    for attacker in state.pieces:
        for target in state.pieces:
            if attacker.id == target.id:
                continue  # cannot capture itself

            if can_capture(attacker, target, state):
                new_state = state.clone()

                attacker_clone = new_state.get_piece_at(attacker.row, attacker.col)
                target_clone = new_state.get_piece_at(target.row, target.col)

                # moving attacker onto target
                attacker_clone.row = target_clone.row
                attacker_clone.col = target_clone.col

                # remove target
                new_state.remove_piece(target_clone)

                moves.append((attacker, target, new_state))

    return moves

def can_capture(attacker, target, state):
    a_r, a_c = attacker.row, attacker.col
    t_r, t_c = target.row, target.col

    piece = attacker.type

    if piece == "R":
        return rook_can_capture(a_r, a_c, t_r, t_c, state)

    if piece == "B":
        return bishop_can_capture(a_r, a_c, t_r, t_c, state)

    if piece == "Q":
        return (
            rook_can_capture(a_r, a_c, t_r, t_c, state)
            or bishop_can_capture(a_r, a_c, t_r, t_c, state)
        )

    if piece == "N":
        return knight_can_capture(a_r, a_c, t_r, t_c)

    if piece == "K":
        return king_can_capture(a_r, a_c, t_r, t_c)

    if piece == "P":
        return pawn_can_capture(attacker, t_r, t_c)

    return False

def rook_can_capture(a_r, a_c, t_r, t_c, state):
    # must share row or column
    if a_r != t_r and a_c != t_c:
        return False

    step_r = 0 if a_r == t_r else (1 if t_r > a_r else -1)
    step_c = 0 if a_c == t_c else (1 if t_c > a_c else -1)

    r, c = a_r + step_r, a_c + step_c

    while (r, c) != (t_r, t_c):
        if state.get_piece_at(r, c):
            return False  # blocked
        r += step_r
        c += step_c

    return True


def bishop_can_capture(a_r, a_c, t_r, t_c, state):
    if abs(a_r - t_r) != abs(a_c - t_c):
        return False

    step_r = 1 if t_r > a_r else -1
    step_c = 1 if t_c > a_c else -1

    r, c = a_r + step_r, a_c + step_c

    while (r, c) != (t_r, t_c):
        if state.get_piece_at(r, c):
            return False # blocked
        r += step_r
        c += step_c

    return True


def knight_can_capture(a_r, a_c, t_r, t_c):
    return (abs(a_r - t_r), abs(a_c - t_c)) in [(2, 1), (1, 2)]

def king_can_capture(a_r, a_c, t_r, t_c):
    return max(abs(a_r - t_r), abs(a_c - t_c)) == 1

def pawn_can_capture(pawn, t_r, t_c):
    a_r, a_c = pawn.row, pawn.col
    return (t_r == a_r - 1) and (abs(t_c - a_c) == 1)

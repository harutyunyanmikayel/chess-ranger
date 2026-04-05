def state_key(state):
    """
    Creating a hashable representation for a State.
    Using piece type, id, row, col.
    """
    return frozenset((p.type, p.id, p.row, p.col) for p in state.pieces)


def move_to_dict(attacker, target, from_row, from_col):
    """
    Attacker/target are Piece objects.
    """
    return {
        "attacker_label": f"{attacker.type}{attacker.id}",
        "attacker_type": attacker.type,
        "attacker_id": attacker.id,
        "attacker_from": (from_row, from_col),
        "attacker_to": (target.row, target.col),

        "target_label": f"{target.type}{target.id}",
        "target_type": target.type,
        "target_id": target.id,
    }
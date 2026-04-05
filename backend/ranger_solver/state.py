from copy import deepcopy

class Piece:
    def __init__(self, type, row, col, id):
        self.type = type.upper()       # 'K', 'Q', 'R', 'B', 'N', 'P'
        self.row = row
        self.col = col
        self.id = id                   # unique identifier per piece

    def __repr__(self):
        return f"{self.type}{self.id}@({self.row},{self.col})"


class State:
    def __init__(self, pieces):
        self.pieces = pieces

    def clone(self):
        return deepcopy(self)

    def is_goal(self):
        return len(self.pieces) == 1

    def get_piece_at(self, r, c):
        for p in self.pieces:
            if p.row == r and p.col == c:
                return p
        return None

    def remove_piece(self, piece):
        self.pieces = [p for p in self.pieces if p.id != piece.id]

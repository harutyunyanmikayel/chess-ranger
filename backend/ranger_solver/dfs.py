import time

from .moves import generate_moves
from .utils import move_to_dict, state_key


class SolverDFS:
    """
    Depth-First Search:

    Returns the first solution found.
    """

    def __init__(self, initial_state, max_depth=50_000):
        self.initial_state = initial_state
        self.max_depth = max_depth
        self.visited = set()

        # ---- STATS ----
        self.expanded = 0
        self.generated = 0
        self.max_depth_reached = 0
        self.visited = set()
        # ---------------

    def solve(self):
        self.expanded = 0
        self.generated = 1
        self.max_depth_reached = 0
        self.visited.clear()
        t0 = time.time()

        result = self._dfs(self.initial_state, [], 0)

        dt = (time.time() - t0) * 1000

        if result is None:
            result = []  # no solution

        return {
            "moves": result,
            "expanded": self.expanded,
            "generated": self.generated,
            "max_depth": self.max_depth_reached,
            "time_ms": round(dt, 2),
        }

    def _dfs(self, state, path, depth):
        # updating stats
        self.expanded += 1
        self.max_depth_reached = max(self.max_depth_reached, depth)

        if depth > self.max_depth:
            return None

        if state.is_goal():
            return path

        state_k = state_key(state)
        if state_k in self.visited:
            return None
        self.visited.add(state_k)

        for attacker, target, new_state in generate_moves(state):
            self.generated += 1  # counting successors

            move_dict = move_to_dict(attacker, target, attacker.row, attacker.col)
            result = self._dfs(new_state, path + [move_dict], depth + 1)

            if result is not None:
                return result

        return None

import heapq
import time

from .moves import generate_moves
from .heuristics import h_mobility
from .utils import state_key, move_to_dict


class SolverAStarMobility:
    """
    A* search using mobility heuristic.

    Returns:
        list of move_dicts (for GUI), or None if no solution exists.
    """

    def __init__(self, initial_state):
        self.initial_state = initial_state

    def reconstruct_path(self, came_from, goal_key):
        path = []
        current_key = goal_key

        while current_key in came_from:
            prev_key, move_dict = came_from[current_key]
            path.append(move_dict)
            current_key = prev_key

        return path[::-1]

    def solve(self):
        # ---- STATS ----
        t0 = time.time()
        expanded = 0
        generated = 0
        max_depth = 0
        # ---------------

        start = self.initial_state
        start_key = state_key(start)

        open_heap = []
        counter = 0

        g_score = {start_key: 0}
        came_from = {}
        states = {start_key: start}

        h0 = h_mobility(start)
        heapq.heappush(open_heap, (h0, 0, counter, start_key))

        closed = set()

        while open_heap:
            f, g, _, current_key = heapq.heappop(open_heap)

            if current_key in closed:
                continue

            current = states[current_key]

            expanded += 1
            max_depth = max(max_depth, g)
            closed.add(current_key)

            if current.is_goal():
                dt = (time.time() - t0) * 1000
                return {
                    "moves": self.reconstruct_path(came_from, current_key),
                    "expanded": expanded,
                    "generated": generated,
                    "max_depth": max_depth,
                    "time_ms": round(dt, 2),
                }

            for attacker, target, new_state in generate_moves(current):
                generated += 1  # counting successors

                neighbor_key = state_key(new_state)
                tentative_g = g + 1

                if tentative_g >= g_score.get(neighbor_key, float("inf")):
                    continue

                move_dict = move_to_dict(attacker, target, attacker.row, attacker.col)

                came_from[neighbor_key] = (current_key, move_dict)
                g_score[neighbor_key] = tentative_g
                states[neighbor_key] = new_state

                h = h_mobility(new_state)
                f_new = tentative_g + h

                counter += 1
                heapq.heappush(open_heap, (f_new, tentative_g, counter, neighbor_key))

        # No solution
        dt = (time.time() - t0) * 1000
        return {
            "moves": [],
            "expanded": expanded,
            "generated": generated,
            "max_depth": max_depth,
            "time_ms": round(dt, 2),
        }

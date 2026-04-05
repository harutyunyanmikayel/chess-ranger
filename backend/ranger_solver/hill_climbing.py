import time

from .moves import generate_moves
from .heuristics import h_mobility
from .utils import move_to_dict


class SolverHillClimbing:
    """
    Hill-Climbing solver using mobility heuristic.

    Stops on:
        - local minimum
        - dead end
        - goal
    """

    def __init__(self, initial_state, max_steps=200):
        self.initial_state = initial_state
        self.max_steps = max_steps

    def solve(self):
        # ----- STATS -----
        t0 = time.time()
        expanded = 0
        generated = 0
        max_depth = 0
        # ------------------

        current = self.initial_state
        current_h = h_mobility(current)
        path = []

        for step in range(self.max_steps):
            # updating stats
            expanded += 1
            max_depth = max(max_depth, step)

            if current.is_goal():
                dt = (time.time() - t0) * 1000
                return {
                    "moves": path,
                    "expanded": expanded,
                    "generated": generated,
                    "max_depth": max_depth,
                    "time_ms": round(dt, 2)
                }

            moves = generate_moves(current)
            if not moves:
                dt = (time.time() - t0) * 1000
                return {
                    "moves": path,
                    "expanded": expanded,
                    "generated": generated,
                    "max_depth": max_depth,
                    "time_ms": round(dt, 2)
                }

            best_h = float("inf")
            best_move_data = None

            for attacker, target, new_state in moves:
                generated += 1  # counting successors

                h = h_mobility(new_state)

                if h < best_h:
                    best_h = h
                    move_dict = move_to_dict(attacker, target, attacker.row, attacker.col)
                    best_move_data = (move_dict, new_state)

            if best_h >= current_h or best_move_data is None:
                dt = (time.time() - t0) * 1000
                return {
                    "moves": path,
                    "expanded": expanded,
                    "generated": generated,
                    "max_depth": max_depth,
                    "time_ms": round(dt, 2)
                }

            move_dict, next_state = best_move_data
            path.append(move_dict)
            current = next_state
            current_h = best_h

        # Exceeded max steps
        dt = (time.time() - t0) * 1000
        return {
            "moves": path,
            "expanded": expanded,
            "generated": generated,
            "max_depth": max_depth,
            "time_ms": round(dt, 2)
        }
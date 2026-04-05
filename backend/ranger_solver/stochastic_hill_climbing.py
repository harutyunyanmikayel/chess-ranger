import random
import time
from .moves import generate_moves
from .heuristics import h_mobility
from .utils import move_to_dict

class SolverStochasticHillClimbing:
    def __init__(self, initial_state, max_steps=300, sideways_limit=15):
        self.initial_state = initial_state
        self.max_steps = max_steps
        self.sideways_limit = sideways_limit

    def solve(self):
        # -------- STATS ----------
        t0 = time.time()
        expanded = 0
        generated = 0
        max_depth = 0
        # --------------------------

        current = self.initial_state
        current_h = h_mobility(current)
        path = []
        sideways_moves = 0

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

            # shuffling moves to avoid deterministic traps
            random.shuffle(moves)

            # first-choice improvement
            chosen = None
            chosen_h = float("inf")

            for attacker, target, new_state in moves:
                generated += 1  # counting successors
                h = h_mobility(new_state)

                if h < current_h:
                    # improvement
                    move_dict = move_to_dict(attacker, target, attacker.row, attacker.col)
                    chosen = (move_dict, new_state)
                    chosen_h = h
                    sideways_moves = 0
                    break

                if h == current_h and sideways_moves < self.sideways_limit:
                    # sideways allowed
                    move_dict = move_to_dict(attacker, target, attacker.row, attacker.col)
                    chosen = (move_dict, new_state)
                    chosen_h = h
                    sideways_moves += 1
                    break

            # small randomness to escape traps
            if chosen is None and random.random() < 0.05:
                attacker, target, new_state = random.choice(moves)
                generated += 1

                h = h_mobility(new_state)
                move_dict = move_to_dict(attacker, target, attacker.row, attacker.col)
                chosen = (move_dict, new_state)
                chosen_h = h
                sideways_moves = 0

            if chosen is None:
                dt = (time.time() - t0) * 1000
                return {
                    "moves": path,
                    "expanded": expanded,
                    "generated": generated,
                    "max_depth": max_depth,
                    "time_ms": round(dt, 2)
                }

            move_dict, current = chosen
            current_h = chosen_h
            path.append(move_dict)

        # Exceeded max steps
        dt = (time.time() - t0) * 1000
        return {
            "moves": path,
            "expanded": expanded,
            "generated": generated,
            "max_depth": max_depth,
            "time_ms": round(dt, 2)
        }


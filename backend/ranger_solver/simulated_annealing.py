import math
import random
import time

from .moves import generate_moves
from .heuristics import h_mobility
from .utils import move_to_dict


class SolverSimulatedAnnealing:
    """
    Simulated Annealing solver using mobility heuristic.

    Acceptance rule:
        If new_h < current_h, then accept always
        Else accept with probability exp(-(new_h - current_h) / T)

    Temperature schedule:
        T(k) = T0 * alpha^k
    """

    def __init__(self, initial_state, T0=1.0, alpha=0.99, max_steps=3000):
        self.initial_state = initial_state
        self.T0 = T0
        self.alpha = alpha
        self.max_steps = max_steps

    def temperature(self, step):
        return self.T0 * (self.alpha ** step)

    def solve(self):
        # -------- STATS ----------
        t0 = time.time()
        expanded = 0
        generated = 0
        accepted_moves = 0
        max_depth = 0
        # --------------------------

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
                    "accepted": accepted_moves,
                    "max_depth": max_depth,
                    "time_ms": round(dt, 2),
                }

            T = self.temperature(step)
            moves = generate_moves(current)
            if not moves:
                dt = (time.time() - t0) * 1000
                return {
                    "moves": path,
                    "expanded": expanded,
                    "generated": generated,
                    "accepted": accepted_moves,
                    "max_depth": max_depth,
                    "time_ms": round(dt, 2),
                }

            attacker, target, new_state = random.choice(moves)
            generated += len(moves)  # counting successors

            new_h = h_mobility(new_state)

            if new_h < current_h:
                accept = True
            else:
                delta = new_h - current_h
                accept = random.random() < math.exp(-delta / T)

            if accept:
                accepted_moves += 1
                move_dict = move_to_dict(attacker, target, attacker.row, attacker.col)
                path.append(move_dict)
                current = new_state
                current_h = new_h

        # Exceeded max steps
        dt = (time.time() - t0) * 1000
        return {
            "moves": path,
            "expanded": expanded,
            "generated": generated,
            "accepted": accepted_moves,
            "max_depth": max_depth,
            "time_ms": round(dt, 2),
        }
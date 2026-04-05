from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from ranger_solver.a_star_mobility import SolverAStarMobility
from ranger_solver.a_star_isolated import SolverAStarIsolated
from ranger_solver.dfs import SolverDFS
from ranger_solver.hill_climbing import SolverHillClimbing
from ranger_solver.simulated_annealing import SolverSimulatedAnnealing
from ranger_solver.stochastic_hill_climbing import SolverStochasticHillClimbing

from ranger_solver.state import Piece, State
from ranger_solver.moves import can_capture

def serialize_state(state: State):
    """
    Turn a State into a list of piece dicts to use in Frontend (React)
    """
    return [
        {
            "id": p.id,
            "type": p.type,
            "row": p.row,
            "col": p.col,
        }
        for p in state.pieces
    ]

class SolvePuzzle(APIView):
    def post(self, request, algorithm):

        pieces_data = request.data.get("pieces", [])

        try:
            pieces = [
                Piece(
                    p["type"],
                    p["row"],
                    p["col"],
                    p["id"],
                )
                for p in pieces_data
            ]
        except KeyError:
            return Response(
                {"error": "Bad piece format"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        state = State(pieces)

        if algorithm == "astarm":
            solution = SolverAStarMobility(state).solve()

        elif algorithm == "astari":
            solution = SolverAStarIsolated(state).solve()

        elif algorithm == "dfs":
            solution = SolverDFS(state).solve()

        elif algorithm == "hill":
            solution = SolverHillClimbing(state).solve()

        elif algorithm == "shill":
            solution = SolverStochasticHillClimbing(state).solve()

        elif algorithm == "anneal":
            solution = SolverSimulatedAnnealing(state).solve()

        else:
            return Response({"error": "Invalid algorithm"}, status=400)

        return Response({
            "solution": solution["moves"],
            "stats": {
                "expanded": solution["expanded"],
                "generated": solution["generated"],
                "max_depth": solution["max_depth"],
                "time_ms": solution["time_ms"],
            }
        })

class ValidateMove(APIView):
    def post(self, request):
        data = request.data

        attacker = data.get("attacker")
        target = data.get("target")
        pieces_data = data.get("pieces")

        if attacker is None or target is None:
            return Response({"error": "Missing attacker/target"}, status=400)

        # converting pieces to state
        pieces = [
            Piece(p["type"], p["row"], p["col"], p["id"])
            for p in pieces_data
        ]
        state = State(pieces)

        attacker_piece = next(p for p in pieces if p.id == attacker["id"])
        target_piece = next(p for p in pieces if p.id == target["id"])

        legal = can_capture(attacker_piece, target_piece, state)

        return Response({"legal": legal})

from django.urls import path
from .views import SolvePuzzle, ValidateMove

urlpatterns = [
    path('solve/<str:algorithm>/', SolvePuzzle.as_view(), name="solve_puzzle"),
    path("validate-move/", ValidateMove.as_view(), name="validate_move"),
]
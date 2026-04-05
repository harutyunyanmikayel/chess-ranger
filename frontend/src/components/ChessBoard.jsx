import { useEffect, useRef, useState } from "react";
import "./ChessBoard.css";

import whiteKing from "../assets/images/white-king.png";
import whiteQueen from "../assets/images/white-queen.png";
import whiteRook from "../assets/images/white-rook.png";
import whiteBishop from "../assets/images/white-bishop.png";
import whiteKnight from "../assets/images/white-knight.png";
import whitePawn from "../assets/images/white-pawn.png";

const pieceImages = {
  K: whiteKing,
  Q: whiteQueen,
  R: whiteRook,
  B: whiteBishop,
  N: whiteKnight,
  P: whitePawn,
};

function ChessBoard({
  pieces,
  selectedPiece,
  onSquareClick,
  onDropSquare,
  onDragStartPiece,
  isDragging,
  mode,
  solution,
  onApplyState,
}) {
  const boardRef = useRef(null);

  // local drag state for the moving sprite
  const [dragState, setDragState] = useState({
    active: false,
    piece: null,
    x: 0,
    y: 0,
    offsetX: 0,
    offsetY: 0,
  });

  // press state to distinguish click from drag
  const [pressState, setPressState] = useState({
    pending: false,
    piece: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    pointerId: null,
  });

  // SOLVER ANIMATION
  useEffect(() => {
    if (!solution || solution.length === 0) return;
    if (!onApplyState) return;

    let i = 0;
    const interval = setInterval(() => {
      onApplyState(solution[i]);
      i++;
      if (i >= solution.length) clearInterval(interval);
    }, 800);

    return () => clearInterval(interval);
  }, [solution]);

  // PIECE LOOKUP
  const getPieceAt = (row, col) =>
    pieces.find((p) => p.row === row && p.col === col);

  // POINTER HANDLERS
  const handlePiecePointerDown = (e, p) => {
    if (mode !== "play") return;
    if (!boardRef.current) return;

    const rect = boardRef.current.getBoundingClientRect();
    const pointerX = e.clientX - rect.left;
    const pointerY = e.clientY - rect.top;

    const startX = p.col * 80;
    const startY = p.row * 80;

    const offsetX = pointerX - startX;
    const offsetY = pointerY - startY;

    setPressState({
      pending: true,
      piece: p,
      startX: pointerX,
      startY: pointerY,
      offsetX,
      offsetY,
      pointerId: e.pointerId,
    });

    setDragState((prev) => ({
      ...prev,
      active: false,
      piece: null,
    }));

    try {
      boardRef.current.setPointerCapture(e.pointerId);
    } catch {
      // ignore if capture not supported
    }

    e.preventDefault();
    e.stopPropagation();
  };

  const handleBoardPointerMove = (e) => {
    if (!boardRef.current) return;

    const rect = boardRef.current.getBoundingClientRect();
    const pointerX = e.clientX - rect.left;
    const pointerY = e.clientY - rect.top;

    if (pressState.pending && pressState.piece) {
      const dx = pointerX - pressState.startX;
      const dy = pointerY - pressState.startY;
      const distSq = dx * dx + dy * dy;
      const threshold = 4 * 4;

      if (distSq > threshold) {
        // Start drag
        const p = pressState.piece;

        setDragState({
          active: true,
          piece: p,
          x: p.col * 80,
          y: p.row * 80,
          offsetX: pressState.offsetX,
          offsetY: pressState.offsetY,
        });

        // Notify App that a drag started
        onDragStartPiece(p);

        setPressState({
          pending: false,
          piece: null,
          startX: 0,
          startY: 0,
          offsetX: 0,
          offsetY: 0,
          pointerId: null,
        });
      }
    }

    // If drag is active, move piece
    setDragState((prev) => {
      if (!prev.active) return prev;
      const x = pointerX - prev.offsetX;
      const y = pointerY - prev.offsetY;
      return { ...prev, x, y };
    });
  };

  const finishPointerInteraction = () => {
    setPressState({
      pending: false,
      piece: null,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0,
      pointerId: null,
    });

    setDragState((prev) => ({
      ...prev,
      active: false,
      piece: null,
    }));
  };

  const handleBoardPointerUp = (e) => {
    if (!boardRef.current) return;

    const rect = boardRef.current.getBoundingClientRect();

    try {
      if (
        pressState.pointerId != null &&
        boardRef.current.hasPointerCapture(pressState.pointerId)
      ) {
        boardRef.current.releasePointerCapture(pressState.pointerId);
      }
    } catch {
      // ignore if not supported
    }

    // Case 1: drag was active, then drop
    if (dragState.active && dragState.piece) {
      const { x, y } = dragState;

      let col = Math.round(x / 80);
      let row = Math.round(y / 80);
      col = Math.max(0, Math.min(7, col));
      row = Math.max(0, Math.min(7, row));

      finishPointerInteraction();
      onDropSquare(row, col);
      return;
    }

    // Case 2: press but never moved enough, then treat as click on piece
    if (pressState.pending && pressState.piece) {
      const p = pressState.piece;
      finishPointerInteraction();
      onSquareClick(p.row, p.col);
      return;
    }
  };

  // SQUARES (click and drop targets)
  const renderSquares = () => (
    <div className="squares-layer">
      {[...Array(8)].map((_, row) =>
        [...Array(8)].map((_, col) => {
          const isDark = (row + col) % 2 === 1;

          const isSelected =
            selectedPiece &&
            selectedPiece.row === row &&
            selectedPiece.col === col;

          return (
            <div
              key={`sq-${row}-${col}`}
              className={`square ${isDark ? "square-dark" : "square-light"} ${
                isSelected ? "square-selected" : ""
              }`}
              onClick={() => {
                // ignore click during dragging
                if (isDragging) return;
                onSquareClick(row, col);
              }}
            />
          );
        })
      )}
    </div>
  );

  // PIECES
  const renderPieces = () => (
    <div className="pieces-layer">
      {pieces.map((p) => {
        const baseX = p.col * 80;
        const baseY = p.row * 80;

        const isDraggingThis =
          dragState.active &&
          dragState.piece &&
          dragState.piece.id === p.id;

        const x = isDraggingThis ? dragState.x : baseX;
        const y = isDraggingThis ? dragState.y : baseY;

        const className =
          "piece-img " + (isDraggingThis ? "" : "piece-animated");

        return (
          <img
            key={p.id}
            src={pieceImages[p.type]}
            alt={p.type}
            className={className}
            style={{ transform: `translate(${x}px, ${y}px)`, zIndex: isDraggingThis ? 999 : 1}}
            draggable={false} // disable native HTML5 drag
            onPointerDown={(e) => handlePiecePointerDown(e, p)}
            onClick={(e) => {
              if (mode === "delete") {
                e.stopPropagation();
                onSquareClick(p.row, p.col);
              }
            }}
          />
        );
      })}
    </div>
  );

  return (
    <div className="board-wrapper">
      <div className="board-and-ranks">
        {/* Top A–H */}
        <div className="files-row top">
          {"ABCDEFGH".split("").map((f) => (
            <div key={f} className="file-label">
              {f}
            </div>
          ))}
        </div>

        {/* Left 1-8 */}
        <div className="ranks-col left">
          {[8, 7, 6, 5, 4, 3, 2, 1].map((r) => (
            <div key={r} className="rank-label">
              {r}
            </div>
          ))}
        </div>

        {/* Board */}
        <div
          className="board"
          ref={boardRef}
          onPointerMove={handleBoardPointerMove}
          onPointerUp={handleBoardPointerUp}
          onPointerLeave={handleBoardPointerUp}
        >
          {renderSquares()}
          {renderPieces()}
        </div>

        {/* Right 1-8 */}
        <div className="ranks-col right">
          {[8, 7, 6, 5, 4, 3, 2, 1].map((r) => (
            <div key={r} className="rank-label">
              {r}
            </div>
          ))}
        </div>

        {/* Bottom A–H */}
        <div className="files-row bottom">
          {"ABCDEFGH".split("").map((f) => (
            <div key={f} className="file-label">
              {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ChessBoard;

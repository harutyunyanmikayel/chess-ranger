import { useState } from 'react'
import './App.css'
import ChessBoard from './components/ChessBoard'

import captureSound from "./assets/sounds/capture.mp3";
import gameStartSound from "./assets/sounds/game-start.mp3";
import gameEndSound from "./assets/sounds/game-end.mp3";

const pieceTypes = ['K', 'Q', 'R', 'B', 'N', 'P']

const captureAudio = new Audio(captureSound);
const startAudio = new Audio(gameStartSound);
const endAudio = new Audio(gameEndSound);

function App() {
  // Initial states of the game
  const [mode, setMode] = useState("place")
  const [pieces, setPieces] = useState([])
  const [nextId, setNextId] = useState(1)
  const [selectedPieceType, setSelectedPieceType] = useState('Q')
  const [algorithm, setAlgorithm] = useState('astarm')
  const [solution, setSolution] = useState([])
  const [stats, setStats] = useState(null)
  const [solutionStatus, setSolutionStatus] = useState(null);
  const [selectedPiece, setSelectedPiece] = useState(null)
  const [draggedPiece, setDraggedPiece] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [randomCount, setRandomCount] = useState(4)
  const [savedRandomPosition, setSavedRandomPosition] = useState(null)
  const [moveList, setMoveList] = useState([])

  // REMOVE PIECE
  const removePiece = (piece) => {
    setPieces(pieces.filter(p => p.id !== piece.id))
    if (selectedPiece?.id === piece.id) {
      setSelectedPiece(null)
    }
  }

  // ADD PIECE
  const addPiece = (row, col) => {
    const newPiece = {
      type: selectedPieceType,
      row,
      col,
      id: nextId,
    }
    setPieces([...pieces, newPiece])
    setNextId(nextId + 1)
  }

  // MANUAL PLAY HANDLER
  const handleManualPlay = async (row, col) => {
    const clicked = pieces.find(p => p.row === row && p.col === col)
    const attacker = draggedPiece || selectedPiece

    if (!attacker) {
      if (clicked) setSelectedPiece(clicked)
      return
    }

    if (attacker.row === row && attacker.col === col) {
      setSelectedPiece(null)
      return
    }

    if (!clicked) {
      // alert("You can only capture another piece.")
      return
    }

    const response = await fetch("http://localhost:8000/api/validate-move/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attacker, target: clicked, pieces })
    })

    const data = await response.json()

    if (!data.legal) {
      // alert("Illegal capture.")
      setSelectedPiece(null)
      return
    }

    setPieces(prev => {
      const updated = prev
        .filter(p => p.id !== clicked.id)
        .map(p =>
          p.id === attacker.id ? { ...p, row, col } : p
        );

      captureAudio.currentTime = 0;
      captureAudio.play();

      // check for win condition
      if (updated.length === 1) {
        setTimeout(() => {
          endAudio.currentTime = 0;
          endAudio.play();
        }, 150);
      }

      return updated;
    });

    setSelectedPiece(null)
  }

  // CLICK HANDLER FOR SQUARES
  const handleSquareClick = (row, col) => {
    if (isDragging) return // ignore click events during drag

    const existing = pieces.find(p => p.row === row && p.col === col)

    if (mode === "place") {
      if (!existing) addPiece(row, col)
      return
    }

    if (mode === "delete") {
      if (existing) removePiece(existing)
      return
    }

    if (mode === "play") {
      handleManualPlay(row, col)
      return
    }
  }

  // DRAG HANDLER
  const onDragStartPiece = (piece) => {
    if (mode !== "play") return
    setDraggedPiece(piece)
    setIsDragging(true)
  }

  // DROP HANDLER
  const onDropSquare = (row, col) => {
    if (mode !== "play") return
    if (!draggedPiece) return

    handleManualPlay(row, col)
    setDraggedPiece(null)
    setIsDragging(false)
  }

  // RANDOM PIECE TYPE PICKER (with weights, at most 1 King)
  const pickRandomPieceType = (kingUsed) => {
    // Probabilities:
    // K: 10%, Q: 15%, R: 25%, B: 22%, N: 23%, P: 5%
    const weighted = [
      { type: 'K', w: 0.10 },
      { type: 'Q', w: 0.15 },
      { type: 'R', w: 0.25 },
      { type: 'B', w: 0.22 },
      { type: 'N', w: 0.23 },
      { type: 'P', w: 0.05 },
    ]

    while (true) {
      let r = Math.random()
      let acc = 0

      for (const item of weighted) {
        acc += item.w
        if (r <= acc) {
          if (item.type === 'K' && kingUsed) {
            // re-roll if we already have a King
            break
          }
          return item.type
        }
      }
    }
  }

  const positionsEqual = (a, b) => {
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    return JSON.stringify(a) === JSON.stringify(b);
  };

  // GENERATE RANDOM POSITION
  const generateRandomPosition = () => {
    const n = parseInt(randomCount, 10)

    if (Number.isNaN(n) || n < 4 || n > 10) {
      alert("Please choose a number between 4 and 10.")
      return
    }

    // Choose region
    let rowMin, rowMax, colMin, colMax
    if (n <= 7) {
      // 4x4: rows 2–5, cols 2–5
      rowMin = 2
      rowMax = 5
      colMin = 2
      colMax = 5
    } else {
      // 6x6: rows 1–6, cols 1–6
      rowMin = 1
      rowMax = 6
      colMin = 1
      colMax = 6
    }

    // List of all available squares in region
    const coords = []
    for (let r = rowMin; r <= rowMax; r++) {
      for (let c = colMin; c <= colMax; c++) {
        coords.push({ row: r, col: c })
      }
    }

    // Shuffle coords
    for (let i = coords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[coords[i], coords[j]] = [coords[j], coords[i]]
    }

    // Create random pieces
    const newPieces = []
    let kingUsed = false
    let nextIdLocal = 1

    for (let i = 0; i < n; i++) {
      const { row, col } = coords[i]
      const type = pickRandomPieceType(kingUsed)
      if (type === 'K') kingUsed = true

      newPieces.push({
        id: nextIdLocal++,
        type,
        row,
        col,
      })

      setStats(null)
    }

    // Save as current random position
    const savedCopy = newPieces.map(p => ({ ...p }))
    setSavedRandomPosition(savedCopy)

    // Apply to board
    setPieces(newPieces)
    setNextId(nextIdLocal)
    setSelectedPiece(null)
    setDraggedPiece(null)
    setIsDragging(false)
    setSolution([])
    setMoveList([])
    setMode("play")

    startAudio.play();
  }

  // RESET TO LAST RANDOM POSITION
  const resetRandomPosition = () => {
    if (!savedRandomPosition || positionsEqual(savedRandomPosition, pieces)) {
      return
    }

    const restored = savedRandomPosition.map(p => ({ ...p }))
    setPieces(restored)
    setSelectedPiece(null)
    setDraggedPiece(null)
    setStats(null)
    setIsDragging(false)
    setSolution([])
    setMoveList([])

    startAudio.currentTime = 0;
    startAudio.play();
  }

  // CLEAR BOARD
  const clearBoard = () => {
    setPieces([])
    setSolution([])
    setMoveList([])
    setNextId(1)
    setSelectedPiece(null)
    setStats(null)
  }

  const applyState = (stateState) => {
    let newState = null;

    if (Array.isArray(stateState)) {
      newState = stateState;
    }
    else if (stateState && Array.isArray(stateState.pieces)) {
      newState = stateState.pieces;
    }
    else {
      console.error("Invalid solver state:", stateState);
      return;
    }

    setPieces(prev => {
      if (prev.length > newState.length) {
        captureAudio.currentTime = 0;
        captureAudio.play();

        if (newState.length === 1) {
          setTimeout(() => {
            endAudio.currentTime = 0;
            endAudio.play();
          }, 150);
        }
      }

      return newState;
    });
  };


  // SOLVER
  const runSolver = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/solve/${algorithm}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pieces }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Solve error:", data)
        alert(data.error || "Failed to solve puzzle")
        return
      }

      const moves = data.solution || [];

      const states = convertMovesToStates(pieces, moves);
      setSolution(states);
      setStats(data.stats || null);
      setMode("play");

      // Check if final state is a winning state (1 piece left)
      const finalBoard = states[states.length - 1];

      if (!finalBoard || finalBoard.length !== 1) {
        setSolutionStatus("not_found");
        return;
      }

      setSolutionStatus("found");

      // pretty move list for the right-side panel
      const prettyMoves = (data.solution || []).map((m, idx) => {
        const from = toChessNotation(m.attacker_from[0], m.attacker_from[1])
        const to = toChessNotation(m.attacker_to[0], m.attacker_to[1])
        const piece = m.attacker_type

        let text = `${piece}${from}x${to}`

        return `${idx + 1}. ${text}`
      })

      setMoveList(prettyMoves)

    } catch (err) {
      alert("Network error while solving")
      console.error(err)
    }
  }

  const convertMovesToStates = (initialPieces, moves) => {
    const states = [];
    let board = initialPieces.map(p => ({ ...p }));

    for (const move of moves) {
      const [fromRow, fromCol] = move.attacker_from;
      const [toRow, toCol] = move.attacker_to;

      // find attacker
      let attackerIndex = board.findIndex(p => p.id === move.attacker_id);

      if (attackerIndex === -1) {
        attackerIndex = board.findIndex(
          p => p.type === move.attacker_type && p.row === fromRow && p.col === fromCol
        );
      }

      if (attackerIndex === -1) {
        console.error("Cannot find attacker:", move);
        continue;
      }

      // create a copy
      let newBoard = board.map(p => ({ ...p }));

      // remove the target by target_id
      newBoard = newBoard.filter(p => p.id !== move.target_id);

      // move attacker
      const idx = newBoard.findIndex(p => p.id === move.attacker_id);
      if (idx !== -1) {
        newBoard[idx].row = toRow;
        newBoard[idx].col = toCol;
      }

      // push new snapshot
      states.push(newBoard.map(p => ({ ...p })));

      // use new board for next move
      board = newBoard;
    }

    return states;
  };

  const toChessNotation = (row, col) => {
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"]
    const file = files[col]
    const rank = 8 - row
    return `${file}${rank}`
  }

  return (
    <div className="app-root">
      <div className="app-container">

        {/* BOARD */}
        <div className="board-panel">
          <h1 className="title">N-CHESS RANGER</h1>

          <ChessBoard
            pieces={pieces}
            selectedPiece={selectedPiece}
            onSquareClick={handleSquareClick}
            onDragStartPiece={onDragStartPiece}
            onDropSquare={onDropSquare}
            isDragging={isDragging}
            solution={solution}
            onApplyState={applyState}
            mode={mode}
          />
        </div>

        {/* CONTROLS */}
        <div className="control-panel">

          <h2>Configuration</h2>

          <div className="control-section">
            <h3>Interaction mode</h3>
            <select
              value={mode}
              onChange={e => setMode(e.target.value)}
            >
              <option value="place">Place pieces</option>
              <option value="delete">Delete pieces</option>
              <option value="play">Manual solve mode</option>
            </select>
          </div>

          <div className="control-section">
            <h3>Piece placement</h3>
            <label>
              Piece type:
              <select
                style={{ marginLeft: 10 + 'px' }}
                value={selectedPieceType}
                onChange={e => setSelectedPieceType(e.target.value)}
              >
                {pieceTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>

            <button onClick={clearBoard} className="clear-button">Clear board</button>
          </div>

          <div className="control-section">
            <h3>Random puzzle generator</h3>

            <label>
              Number of pieces (4–10):
              <input
                type="number"
                min="4"
                max="10"
                value={randomCount}
                onChange={e => setRandomCount(e.target.value)}
                style={{ marginLeft: '8px', width: '60px' }}
              />
            </label>

            <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={generateRandomPosition}
                className="btn secondary"
                style={{ backgroundColor: "rgb(139 168 216)" }}
              >
                Generate position
              </button>
              <button
                onClick={resetRandomPosition}
                className="btn secondary"
                style={{ backgroundColor: "rgb(139 168 216)" }}
              >
                Reset position
              </button>
            </div>
          </div>

          <div className="control-section">
            <h3>Algorithm</h3>
            <select
              value={algorithm}
              onChange={e => setAlgorithm(e.target.value)}
            >
              <option value="astarm">A* Search (mobility)</option>
              <option value="astari">A* Search (isolated)</option>
              <option value="dfs">Depth-First Search</option>
              <option value="hill">Hill-Climbing</option>
              <option value="shill">Stochastic Hill-Climbing</option>
              <option value="anneal">Simulated Annealing</option>
            </select>
          </div>

          <button className="btn primary" onClick={runSolver}>
            Solve puzzle
          </button>

          {stats && (
            <div className="control-section">
              <h3>Solver Statistics</h3>
              <p>Expanded nodes: {stats.expanded}</p>
              <p>Generated nodes: {stats.generated}</p>
              <p>Max depth: {stats.max_depth}</p>
              <p>Runtime: {stats.time_ms} ms</p>
            </div>
          )}

          <div className="control-section">
            <h3>Move sequence</h3>
            {solutionStatus === "not_found" && (
              <p className="hint" style={{ color: "red", fontSize: "20px" }}>No solution found.</p>
            )}

            {moveList.length === 0 && solutionStatus !== "not_found" ? (
              <p className="hint">Run the solver to see the capture sequence.</p>
            ) : (
              <ol className="piece-list">
                {moveList.map((mv, i) => (
                  <li key={i}>{mv}</li>
                ))}
              </ol>
            )}
          </div>

          <div className="control-section">
            <h3>Current pieces</h3>
            <ul className="piece-list">
              {pieces.map(p => (
                <li key={p.id}>{p.id}. {p.type}{toChessNotation(p.row, p.col)}</li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  )
}

export default App

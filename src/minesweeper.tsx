import {
  FunctionComponent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import clsx from "clsx";

// マインスイーパーの設定
interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

export const Minesweeper: FunctionComponent = () => {
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "easy",
  );
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">(
    "playing",
  );
  const [firstClick, setFirstClick] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [minesLeft, setMinesLeft] = useState(0);
  const [board, setBoard] = useState<Cell[][]>([]);
  const timerRef = useRef<number | null>(null);

  // ゲームのサイズと地雷の数
  const gameDimensions = {
    easy: { rows: 8, cols: 8, mines: 10 },
    medium: { rows: 12, cols: 12, mines: 30 },
    hard: { rows: 16, cols: 16, mines: 50 },
  };

  // 新しいゲームの初期化
  const initializeGame = useCallback(() => {
    const { rows, cols, mines } = gameDimensions[difficulty];
    const newBoard: Cell[][] = [];

    // 初期ボードの作成
    for (let i = 0; i < rows; i++) {
      newBoard.push([]);
      for (let j = 0; j < cols; j++) {
        newBoard[i].push({
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0,
        });
      }
    }

    setBoard(newBoard);
    setGameState("playing");
    setFirstClick(true);
    setElapsedTime(0);
    setMinesLeft(mines);

    // タイマーをリセット
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [difficulty]);

  // 地雷を配置
  const placeMines = useCallback(
    (firstRow: number, firstCol: number) => {
      const { rows, cols, mines } = gameDimensions[difficulty];
      const newBoard = [...board];
      let minesPlaced = 0;

      // 最初にクリックしたセルとその周囲には地雷を配置しない
      const safeZone = [
        [firstRow - 1, firstCol - 1],
        [firstRow - 1, firstCol],
        [firstRow - 1, firstCol + 1],
        [firstRow, firstCol - 1],
        [firstRow, firstCol],
        [firstRow, firstCol + 1],
        [firstRow + 1, firstCol - 1],
        [firstRow + 1, firstCol],
        [firstRow + 1, firstCol + 1],
      ].filter(([r, c]) => r >= 0 && r < rows && c >= 0 && c < cols);

      // 地雷をランダムに配置
      while (minesPlaced < mines) {
        const randomRow = Math.floor(Math.random() * rows);
        const randomCol = Math.floor(Math.random() * cols);

        // 既に地雷があるか、セーフゾーンならスキップ
        if (
          newBoard[randomRow][randomCol].isMine ||
          safeZone.some(([r, c]) => r === randomRow && c === randomCol)
        ) {
          continue;
        }

        newBoard[randomRow][randomCol].isMine = true;
        minesPlaced++;
      }

      // 各セルの周囲の地雷数を計算
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (newBoard[i][j].isMine) continue;

          let count = 0;
          // 周囲8方向のセルをチェック
          for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
              if (di === 0 && dj === 0) continue;

              const ni = i + di;
              const nj = j + dj;

              if (
                ni >= 0 &&
                ni < rows &&
                nj >= 0 &&
                nj < cols &&
                newBoard[ni][nj].isMine
              ) {
                count++;
              }
            }
          }

          newBoard[i][j].neighborMines = count;
        }
      }

      setBoard(newBoard);
      // タイマーを開始
      timerRef.current = window.setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    },
    [board, difficulty],
  );

  // セルを開く
  const revealCell = useCallback(
    (row: number, col: number) => {
      if (
        gameState !== "playing" ||
        board[row][col].isRevealed ||
        board[row][col].isFlagged
      ) {
        return;
      }

      const { rows, cols } = gameDimensions[difficulty];
      const newBoard = [...board.map((r) => [...r])];

      // 最初のクリックの場合
      if (firstClick) {
        setFirstClick(false);
        placeMines(row, col);
        return;
      }

      // 地雷をクリックした場合
      if (newBoard[row][col].isMine) {
        // すべての地雷を表示
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            if (newBoard[i][j].isMine) {
              newBoard[i][j].isRevealed = true;
            }
          }
        }
        setBoard(newBoard);
        setGameState("lost");
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return;
      }

      // セルを開く（再帰的に空のセルを開く）
      const revealEmpty = (r: number, c: number) => {
        if (
          r < 0 ||
          r >= rows ||
          c < 0 ||
          c >= cols ||
          newBoard[r][c].isRevealed ||
          newBoard[r][c].isFlagged
        ) {
          return;
        }

        newBoard[r][c].isRevealed = true;

        // 空のセルの場合、周囲も開く
        if (newBoard[r][c].neighborMines === 0) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              revealEmpty(r + dr, c + dc);
            }
          }
        }
      };

      revealEmpty(row, col);
      setBoard(newBoard);

      // ゲームに勝ったかチェック
      let unrevealedNonMines = 0;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (!newBoard[i][j].isMine && !newBoard[i][j].isRevealed) {
            unrevealedNonMines++;
          }
        }
      }

      if (unrevealedNonMines === 0) {
        setGameState("won");
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    },
    [board, firstClick, gameState, difficulty, placeMines],
  );

  // フラグを設置/解除
  const toggleFlag = useCallback(
    (row: number, col: number) => {
      if (gameState !== "playing" || board[row][col].isRevealed) {
        return;
      }

      const newBoard = [...board.map((r) => [...r])];
      newBoard[row][col].isFlagged = !newBoard[row][col].isFlagged;
      setBoard(newBoard);

      // 残りの地雷数を更新
      const flagCount = newBoard.flat().filter((cell) => cell.isFlagged).length;
      setMinesLeft(gameDimensions[difficulty].mines - flagCount);
    },
    [board, gameState, difficulty],
  );

  // 難易度変更時に新しいゲームを開始
  useEffect(() => {
    initializeGame();
  }, [difficulty, initializeGame]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  // セルの表示内容を決定
  // 長押し検出のための状態
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [pressedCell, setPressedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);

  // タッチ／マウス長押し開始
  const handleCellPress = useCallback(
    (row: number, col: number) => {
      if (gameState !== "playing" || board[row][col].isRevealed) {
        return;
      }

      setPressedCell({ row, col });
      const timer = setTimeout(() => {
        toggleFlag(row, col);
        setPressedCell(null);
      }, 500); // 500ms の長押しでフラグをトグル

      setLongPressTimer(timer);
    },
    [gameState, board, toggleFlag],
  );

  // タッチ／マウス離す
  const handleCellRelease = useCallback(
    (row: number, col: number) => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }

      // 長押しではなく通常のクリック／タップだった場合はセルを開く
      if (pressedCell && pressedCell.row === row && pressedCell.col === col) {
        revealCell(row, col);
      }

      setPressedCell(null);
    },
    [longPressTimer, pressedCell, revealCell],
  );

  const getCellContent = (cell: Cell) => {
    if (!cell.isRevealed) {
      return cell.isFlagged ? "🚩" : null;
    }
    if (cell.isMine) {
      return "💣";
    }
    return cell.neighborMines > 0 ? cell.neighborMines : null;
  };

  // セルの色を決定
  const getCellColor = (cell: Cell) => {
    if (!cell.isRevealed) {
      return "bg-gray-200 hover:bg-gray-100";
    }
    if (cell.isMine) {
      return "bg-red-500";
    }
    if (cell.neighborMines === 0) {
      return "bg-white";
    }

    // 数字の色
    const colors = [
      "", // 0 (表示されない)
      "text-blue-600", // 1
      "text-emerald-600", // 2
      "text-red-600", // 3
      "text-indigo-700", // 4
      "text-orange-700", // 5
      "text-teal-700", // 6
      "text-zinc-800", // 7
      "text-zinc-600", // 8
    ];

    return `bg-white ${colors[cell.neighborMines]}`;
  };

  // 難易度選択ボタン - Catalystスタイル
  const DifficultyButton = ({
    level,
    label,
  }: {
    level: "easy" | "medium" | "hard";
    label: string;
  }) => (
    <button
      type="button"
      className={clsx(
        // 基本スタイル
        "relative isolate inline-flex items-center justify-center gap-x-2 rounded-lg border text-sm/6 font-semibold",
        "px-[calc(theme(spacing.3)-1px)] py-[calc(theme(spacing.1.5)-1px)]",
        "focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 focus:outline-none",

        // 無効化状態
        "disabled:opacity-50",

        // アクティブなレベルの場合
        difficulty === level
          ? [
              // 境界線、背景色
              "border-transparent",
              "bg-neutral-900",
              "text-white",
              // ホバー/アクティブ効果
              "before:absolute before:inset-0 before:-z-10 before:rounded-[calc(theme(borderRadius.lg)-1px)] before:bg-neutral-900",
              "before:shadow-sm",
              "after:absolute after:inset-0 after:-z-10 after:rounded-[calc(theme(borderRadius.lg)-1px)]",
              "after:shadow-[inset_0_1px_theme(colors.white/15%)]",
              "hover:after:bg-white/10 active:after:bg-white/10",
            ]
          : [
              // 非アクティブな場合
              "border-zinc-200",
              "bg-white text-zinc-900",
              "hover:bg-zinc-50/80 active:bg-zinc-100/90",
            ],
        "transition-all duration-200",
      )}
      onClick={() => setDifficulty(level)}
    >
      {label}
    </button>
  );

  // スマイルボタンの表示
  const getSmileButton = () => {
    if (gameState === "won") return "😎";
    if (gameState === "lost") return "😵";
    return "🙂";
  };

  // 難易度に応じたカードの幅を計算
  const getCardWidth = () => {
    return {
      easy: "max-w-sm", // 8列 = (32px × 8) + (4px × 7) + パディング
      medium: "max-w-lg", // 12列
      hard: "max-w-2xl", // 16列
    }[difficulty];
  };

  return (
    <div className="mx-auto flex flex-col items-center">
      <div className="mb-6 flex justify-center gap-3">
        <DifficultyButton level="easy" label="初級" />
        <DifficultyButton level="medium" label="中級" />
        <DifficultyButton level="hard" label="上級" />
      </div>

      <div
        className={clsx(
          "divide-y divide-neutral-200 overflow-hidden rounded-lg bg-gray-50 shadow-sm ring-1 ring-neutral-900/5 dark:bg-zinc-900 dark:ring-white/10",
          getCardWidth(),
        )}
      >
        <div className="px-4 py-4 sm:px-6">
          {/* ゲーム情報パネル */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-neutral-500">💣</span>
              <div className="rounded-md bg-neutral-100 px-2.5 py-1.5 font-mono font-medium text-neutral-900">
                {minesLeft.toString().padStart(3, "0")}
              </div>
            </div>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-2xl shadow-sm hover:bg-neutral-100"
              onClick={initializeGame}
              aria-label="開始/リセット"
            >
              {getSmileButton()}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-neutral-500">⏱️</span>
              <div className="rounded-md bg-neutral-100 px-2.5 py-1.5 font-mono font-medium text-neutral-900">
                {elapsedTime.toString().padStart(3, "0")}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-5 sm:p-6">
          {/* ゲームボード */}
          <div className="flex flex-col gap-1 select-none">
            {board.map((row, rowIdx) => (
              <div key={rowIdx} className="flex gap-1">
                {row.map((cell, colIdx) => (
                  <div
                    key={`${rowIdx}-${colIdx}`}
                    className={clsx(
                      "flex h-8 w-8 items-center justify-center rounded-md font-bold transition-all",
                      getCellColor(cell),
                      cell.isRevealed
                        ? "border border-zinc-200"
                        : "cursor-pointer border border-zinc-300 shadow-sm hover:border-zinc-400",
                    )}
                    onMouseDown={() => handleCellPress(rowIdx, colIdx)}
                    onMouseUp={() => handleCellRelease(rowIdx, colIdx)}
                    onMouseLeave={() => {
                      if (
                        pressedCell &&
                        pressedCell.row === rowIdx &&
                        pressedCell.col === colIdx
                      ) {
                        if (longPressTimer) {
                          clearTimeout(longPressTimer);
                          setLongPressTimer(null);
                        }
                        setPressedCell(null);
                      }
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      handleCellPress(rowIdx, colIdx);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      handleCellRelease(rowIdx, colIdx);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      toggleFlag(rowIdx, colIdx);
                    }}
                  >
                    {getCellContent(cell)}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* ゲーム結果メッセージ */}
          {gameState !== "playing" && (
            <div
              className={clsx(
                "mt-6 rounded-lg border p-3 text-center font-medium",
                gameState === "won"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700",
              )}
            >
              <span className="font-semibold">
                {gameState === "won"
                  ? "ゲームクリア！おめでとう！"
                  : "ゲームオーバー！再挑戦しよう"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

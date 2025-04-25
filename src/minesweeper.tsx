import { ShareIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import {
  ChangeEventHandler,
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";

const difficulties = ["easy", "normal", "hard"] as const;
type Difficulty = (typeof difficulties)[number];

type State = "gameOver" | "completed" | "playing";

interface Cell {
  state: "hidden" | "revealed" | "flagged";
  mineIncluded: boolean;
}

export const Minesweeper: FunctionComponent = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [mineRatio, setMineRatio] = useState(0.125);
  const [stopwatch, setStopwatch] = useState(0);

  const [board, setBoard] = useState<Cell[][]>([]);

  const state = board
    .flat()
    .some(
      (cell) =>
        cell.mineIncluded &&
        { hidden: false, revealed: true, flagged: false }[cell.state],
    )
    ? "gameOver"
    : board.flat().every(
          (cell) =>
            ({
              hidden: cell.mineIncluded,
              revealed: true,
              flagged: cell.mineIncluded,
            })[cell.state],
        )
      ? "completed"
      : "playing";

  const mineCount = board
    .flat()
    .reduce((sum, cell) => sum + (cell.mineIncluded ? 1 : 0), 0);
  const flagCount = board
    .flat()
    .reduce(
      (sum, cell) => sum + { hidden: 0, revealed: 0, flagged: 1 }[cell.state],
      0,
    );

  const progress =
    board
      .flat()
      .reduce(
        (sum, cell) => sum + { hidden: 0, revealed: 1, flagged: 1 }[cell.state],
        0,
      ) / board.flat().length;
  const started = Boolean(progress);

  const reset = useCallback(() => {
    const size = {
      easy: 8,
      normal: 12,
      hard: 16,
    }[difficulty];
    const board = [...Array(size).keys()].map(() =>
      [...Array(size).keys()].map(() => ({
        state: "hidden" as const,
        mineIncluded: false,
      })),
    );

    for (const [columnIndex, rowIndex] of toShuffled(
      board.flatMap((row, rowIndex) =>
        row.map((_cell, columnIndex) => [columnIndex, rowIndex] as const),
      ),
    ).slice(0, Math.round(size ** 2 * mineRatio))) {
      board[rowIndex][columnIndex].mineIncluded = true;
    }

    setBoard(board);
  }, [difficulty, mineRatio]);

  useLayoutEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    switch (state) {
      case "gameOver":
      case "completed": {
        return;
      }

      case "playing": {
        if (started) {
          const intervalID = setInterval(() => {
            setStopwatch((prev) => prev + 1);
          }, 1000);

          return () => {
            clearInterval(intervalID);
          };
        }

        setStopwatch(0);
        return;
      }

      default: {
        throw new Error(`Unknown game state: ${state satisfies never}`);
      }
    }
  }, [state, started]);

  const handleMineRatioInputChange: ChangeEventHandler<HTMLInputElement> = (
    event,
  ) => {
    setMineRatio(Number(event.target.value));
  };

  const handleRetryButton = () => {
    reset();
  };

  const handleShareButtonClick = () => {};

  return (
    <div className="space-y-6 flex flex-col items-center">
      <p className="text-lg text-neutral-700 border-l-4 border-neutral-300 pl-3 py-1">マツボックリが落ちてる写真を撮って遊ぼう。</p>

      <div className="space-y-4 flex flex-col items-center w-full">
        <div className="flex flex-wrap gap-2 justify-center">
          {difficulties.map((difficultyOption) => {
            const handleClick = () => {
              setDifficulty(difficultyOption);
            };

            const difficultyText = { easy: "小さめ", normal: "ふつう", hard: "大規模" }[difficultyOption];
            const isActive = difficultyOption === difficulty;

            return (
              <button 
                key={difficultyOption} 
                type="button" 
                onClick={handleClick}
                className={clsx(
                  "px-4 py-2 rounded-md text-sm font-medium border shadow-sm",
                  isActive 
                    ? "border-neutral-400 bg-neutral-100 text-neutral-800" 
                    : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                )}
              >
                {difficultyText}
              </button>
            );
          })}
        </div>

        <div className="max-w-md w-64">
          <label className="block text-sm font-medium text-neutral-700 mb-1 text-center">
            マツボックリの量
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.03125}
            value={mineRatio}
            onChange={handleMineRatioInputChange}
            className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-0 inline-block mx-auto">
          <div className="relative py-2 px-4 rounded-t-md bg-neutral-50 border border-neutral-200 border-b-0 font-mono">
            <div className="flex justify-between items-center">
              <div className="flex gap-x-4">
                <span className="flex items-center gap-1 text-neutral-700">
                  <span className="text-lg">🌰</span> {mineCount.toString().padStart(2, '0')}個
                </span>
                <span className="flex items-center gap-1 text-neutral-700">
                  <span className="text-lg">🌲</span> {flagCount.toString().padStart(2, '0')}個{flagCount <= mineCount ? "" : "🤔"}
                </span>
              </div>
  
              <div className="flex items-center gap-1 text-neutral-700">
                <span className="text-lg">⏱</span> {stopwatch.toString().padStart(3, '0')}秒
              </div>
            </div>
            
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl">
              <Emotion state={state} progress={progress} />
            </div>
          </div>
  
          <div className="p-2 rounded-b-md bg-neutral-50 border border-neutral-200 border-t-0">
            <div className="grid gap-1">
              {board.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-1">
                  {row.map((cell, columnIndex) => {
                  switch (cell.state) {
                    case "hidden": {
                      return (
                        <HiddenCell
                          key={columnIndex}
                          rowIndex={rowIndex}
                          columnIndex={columnIndex}
                          setBoard={setBoard}
                        />
                      );
                    }
  
                    case "revealed": {
                      return (
                        <RevealedCell
                          key={columnIndex}
                          board={board}
                          rowIndex={rowIndex}
                          columnIndex={columnIndex}
                          setBoard={setBoard}
                        />
                      );
                    }
  
                    case "flagged": {
                      return (
                        <FlaggedCell
                          key={columnIndex}
                          state={state}
                          cell={cell}
                        />
                      );
                    }
  
                    default: {
                      throw new Error(
                        `Unknown cell state: ${cell.state satisfies never}`,
                      );
                    }
                    }
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {state !== "playing" && (
          <div className="mx-auto text-center">
            {state === "completed" ? (
              <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-md shadow-md inline-block">
                <p className="font-bold text-xl">クリア！</p>
                <p className="text-lg">素晴らしいマツボックリ探索でした！</p>
                <p className="text-lg">タイム {stopwatch}秒</p>
              </div>
            ) : (
              <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-md shadow-md inline-block">
                <p className="font-bold text-xl">ゲームオーバー</p>
                <p className="text-lg">マツボックリに当たってしまいました</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mt-4 justify-center">
        <button 
          type="button" 
          onClick={handleRetryButton}
          className={clsx(
            "inline-flex items-center justify-center gap-x-2 rounded-md px-3.5 py-2.5 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
            state !== "playing"
              ? "bg-neutral-900 text-white hover:bg-neutral-800 focus-visible:outline-neutral-900"
              : "bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50 focus-visible:outline-neutral-500"
          )}
        >
          {state !== "playing" ? "もう一度遊ぶ" : "やり直す"}
        </button>

        <a
          href={`https://twitter.com/intent/tweet?${new URLSearchParams({
            hashtags: "マツボックリスイーパー",
            url: "https://pinecone.hata6502.com/",
            text: state === "completed" ? `マツボックリスイーパーをクリアしました！タイム: ${stopwatch}秒` : "マツボックリスイーパーで遊んでいます"
          })}`}
          target="_blank"
          className="inline-flex items-center justify-center gap-x-2 rounded-md bg-neutral-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
          onClick={handleShareButtonClick}
        >
          Xにポスト
          <ShareIcon className="h-5 w-5" aria-hidden="true" />
        </a>
      </div>

      <p className="text-sm text-neutral-500 pt-4 text-center">
        #マツボックリスイーパー
        タグ付きでXにポストすると、このサイトに掲載されることがあります。
      </p>
    </div>
  );
};

function shuffle<Type>(array: Type[]) {
  for (let from = array.length - 1; from; from--) {
    const to = Math.floor(Math.random() * (from + 1));
    [array[from], array[to]] = [array[to], array[from]];
  }
  return array;
}

function toShuffled<Type>(array: Type[]) {
  return shuffle([...array]);
}

const Emotion: FunctionComponent<{
  state: State;
  progress: number;
}> = ({ state, progress }) => {
  switch (state) {
    case "gameOver": {
      return <span>😵</span>;
    }

    case "completed": {
      return <span>🥳</span>;
    }

    case "playing": {
      if (false) {
        // ゲームが進行するにつれて緊張した顔になる
        return <span>🤨</span>;
      }

      // ゲームが進行するにつれて嬉しい顔になる
      return <span>🙂</span>;
    }

    default: {
      throw new Error(`Unknown game state: ${state satisfies never}`);
    }
  }
};

const cellClassName = "w-10 h-10 rounded-md border border-neutral-200 shadow-sm flex items-center justify-center text-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500";

const HiddenCell: FunctionComponent<{
  rowIndex: number;
  columnIndex: number;
  setBoard: Dispatch<SetStateAction<Cell[][]>>;
}> = ({ rowIndex, columnIndex, setBoard }) => {
  const handleClick = () => {
    setBoard((prev) => {
      const board = [...prev].map((row) => [...row]);

      board[rowIndex][columnIndex] = {
        ...board[rowIndex][columnIndex],
        state: "revealed",
      };

      return board;
    });
  };

  return (
    <button 
      type="button" 
      onClick={handleClick} 
      className={clsx(cellClassName, "bg-neutral-200 hover:bg-neutral-300")}
    />
  );
};

const RevealedCell: FunctionComponent<{
  board: Cell[][];
  rowIndex: number;
  columnIndex: number;
  setBoard: Dispatch<SetStateAction<Cell[][]>>;
}> = ({ board, rowIndex, columnIndex, setBoard }) => {
  if (board[rowIndex][columnIndex].mineIncluded) {
    return (
      <button type="button" disabled className={clsx(cellClassName, "bg-red-100")}>
        🌰
      </button>
    );
  }

  const adjacentCells = board
    .slice(Math.max(rowIndex - 1, 0), rowIndex + 2)
    .flatMap((row) => row.slice(Math.max(columnIndex - 1, 0), columnIndex + 2));
  const adjacentMineCount = adjacentCells.reduce(
    (sum, cell) => sum + (cell.mineIncluded ? 1 : 0),
    0,
  );

  if (
    !adjacentMineCount &&
    adjacentCells.some(
      (cell) => ({ hidden: true, revealed: false, flagged: true })[cell.state],
    )
  ) {
    setBoard((prev) => {
      const board = [...prev].map((row) => [...row]);

      for (
        let adjacentRowIndex = Math.max(rowIndex - 1, 0);
        adjacentRowIndex < Math.min(rowIndex + 2, board.length);
        adjacentRowIndex++
      ) {
        for (
          let adjacentColumnIndex = Math.max(columnIndex - 1, 0);
          adjacentColumnIndex <
          Math.min(columnIndex + 2, board[adjacentRowIndex].length);
          adjacentColumnIndex++
        ) {
          board[adjacentRowIndex][adjacentColumnIndex] = {
            ...board[adjacentRowIndex][adjacentColumnIndex],
            state: "revealed",
          };
        }
      }

      return board;
    });
  }

  // マインスイーパーで定番の色付け
  const colorClass = {
    0: "bg-neutral-50 text-neutral-400",
    1: "bg-blue-50 text-blue-600",
    2: "bg-green-50 text-green-600",
    3: "bg-red-50 text-red-600",
    4: "bg-indigo-50 text-indigo-700",
    5: "bg-yellow-50 text-yellow-700",
    6: "bg-pink-50 text-pink-700",
    7: "bg-purple-50 text-purple-700",
    8: "bg-cyan-50 text-cyan-800",
  }[adjacentMineCount] || "bg-neutral-50";

  return (
    <button 
      type="button" 
      disabled 
      className={clsx(
        cellClassName, 
        colorClass
      )}
    >
      {adjacentMineCount || ""}
    </button>
  );
};

const FlaggedCell: FunctionComponent<{ state: State; cell: Cell }> = ({
  state,
  cell,
}) => {
  switch (state) {
    case "gameOver": {
      if (cell.mineIncluded) {
        return (
          <button type="button" className={clsx(cellClassName, "bg-orange-100")}>
            🤔
          </button>
        );
      }
    }
    case "completed":
    case "playing": {
      return (
        <button type="button" className={clsx(cellClassName, "bg-green-100")}>
          🌲
        </button>
      );
    }

    default: {
      throw new Error(`Unknown game state: ${state satisfies never}`);
    }
  }
};
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
    <div>
      <p>マツボックリが落ちてる写真を撮って遊ぼう。</p>

      <div>
        {difficulties.map((difficulty) => {
          const handleClick = () => {
            setDifficulty(difficulty);
          };

          return (
            <button key={difficulty} type="button" onClick={handleClick}>
              {{ easy: "小さめ", normal: "ふつう", hard: "大規模" }[difficulty]}
            </button>
          );
        })}
      </div>

      <div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.03125}
          value={mineRatio}
          onChange={handleMineRatioInputChange}
        />
      </div>

      <div>
        <div>
          <div>
            <span>🌰 {mineCount}個</span>
            <span>
              🌲 {flagCount}個{flagCount <= mineCount ? "" : "🤔"}
            </span>
          </div>

          <Emotion state={state} progress={progress} />

          <span>⏱ {stopwatch}秒</span>
        </div>

        <div>
          {board.map((row, rowIndex) => (
            <div key={rowIndex}>
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

      <div>
        <button type="button" onClick={handleRetryButton}>
          やり直す
        </button>

        <a
          href={`https://twitter.com/intent/tweet?${new URLSearchParams({
            hashtags: "マツボックリスイーパー",
            url: "https://pinecone.hata6502.com/",
          })}`}
          target="_blank"
          className="inline-flex items-center justify-center gap-x-2 rounded-md bg-neutral-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
          onClick={handleShareButtonClick}
        >
          Xにポスト
          <ShareIcon className="h-6 w-6" aria-hidden="true" />
        </a>
      </div>

      <p>
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

const cellClassName = "w-8 h-8";

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
    <button type="button" onClick={handleClick} className={cellClassName} />
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
      <button type="button" disabled className={cellClassName}>
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
  return (
    <button type="button" disabled className={cellClassName}>
      {adjacentMineCount}
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
          <button type="button" className={cellClassName}>
            🤔
          </button>
        );
      }
    }
    case "completed":
    case "playing": {
      return (
        <button type="button" className={cellClassName}>
          🌲
        </button>
      );
    }

    default: {
      throw new Error(`Unknown game state: ${state satisfies never}`);
    }
  }
};

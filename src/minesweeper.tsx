import { ShareIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import {
  ChangeEventHandler,
  FunctionComponent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";

import { CellState, Cell } from "./cell";
import { toShuffled } from "./shuffle";

export type MinesweeperState = ReturnType<typeof getMinesweeperState>;

export const Minesweeper: FunctionComponent = () => {
  const [imageURL, setImageURL] = useState<string>();
  const [imageData, setImageData] = useState<ImageData>();
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [mineRatio, setMineRatio] = useState(0.125);
  const [stopwatch, setStopwatch] = useState(0);

  const [board, setBoard] = useState<CellState[][]>([]);
  const minesweeperState = getMinesweeperState(board);

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
      getMineCandidates(size, imageData),
    ).slice(0, Math.round(size ** 2 * mineRatio))) {
      board[rowIndex][columnIndex].mineIncluded = true;
    }

    setBoard(board);
  }, [difficulty, imageData, mineRatio]);

  useLayoutEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    switch (minesweeperState) {
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
        throw new Error(
          `Unknown minesweeperState: ${minesweeperState satisfies never}`,
        );
      }
    }
  }, [minesweeperState, started]);

  const handleImageInputChange: ChangeEventHandler<HTMLInputElement> = async (
    event,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImageURL(undefined);
      setImageData(undefined);
      return;
    }

    setImageURL(URL.createObjectURL(file));

    const imageBitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;
    const canvasContext = canvas.getContext("2d");
    if (!canvasContext) {
      throw new Error("context is null");
    }
    canvasContext.drawImage(imageBitmap, 0, 0);
    setImageData(canvasContext.getImageData(0, 0, canvas.width, canvas.height));
  };

  const handleMineRatioInputChange: ChangeEventHandler<HTMLInputElement> = (
    event,
  ) => {
    setMineRatio(Number(event.target.value));
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center space-y-8">
      <div className="text-center">
        <p className="text-zinc-600">
          マツボックリが落ちてる写真をもとに爆弾🌰を配置します。
        </p>
      </div>

      <div className="flex w-full flex-col items-center space-y-6">
        <div className="flex w-full max-w-md flex-col items-center text-center">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageInputChange}
            id="image-upload"
            className="hidden"
          />
          <label htmlFor="image-upload" className={buttonClassNames.secondary}>
            写真を選択
          </label>
        </div>

        {imageURL && (
          <div className="mt-4 max-w-md overflow-hidden rounded-lg">
            <img alt="" src={imageURL} className="h-auto w-full" />
          </div>
        )}

        <div className="flex w-full max-w-md flex-col items-center space-y-4">
          <div className="w-full text-center">
            <h3 className="mb-2 text-sm font-medium text-zinc-700">
              ボードの大きさ
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              {difficulties.map((difficultyOption) => {
                const handleClick = () => {
                  setDifficulty(difficultyOption);
                };

                const difficultyText = {
                  easy: "プチ",
                  normal: "ふつう",
                  hard: "大規模",
                }[difficultyOption];
                const isActive = difficultyOption === difficulty;

                return (
                  <button
                    key={difficultyOption}
                    type="button"
                    onClick={handleClick}
                    className={clsx(
                      buttonClassNames.option,
                      isActive
                        ? buttonClassNames.optionActive
                        : buttonClassNames.optionInactive,
                    )}
                  >
                    {difficultyText}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-full text-center">
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              マツボックリの量
            </label>
            <input
              type="range"
              min={0.03125}
              max={0.96875}
              step={0.03125}
              value={mineRatio}
              onChange={handleMineRatioInputChange}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-200 accent-zinc-600"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="relative border-b border-zinc-200 bg-zinc-50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-x-4">
              <span className="flex items-center gap-1 font-medium text-zinc-700">
                <span className="text-lg">🌰</span> {mineCount}個
              </span>
              <span className="flex items-center gap-1 font-medium text-zinc-700">
                <span className="text-lg">🌲</span> {flagCount}個
                {flagCount <= mineCount ? (
                  ""
                ) : (
                  <span className="text-amber-500">🤔</span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-1 font-medium text-zinc-700">
              <span className="text-lg">⏱</span> {stopwatch}秒
            </div>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform text-2xl">
            <Emotion minesweeperState={minesweeperState} progress={progress} />
          </div>
        </div>

        <div className="flex flex-col items-center-safe gap-1 overflow-auto bg-zinc-50 p-4">
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1">
              {row.map((cell, columnIndex) => (
                <Cell
                  key={columnIndex}
                  minesweeperState={minesweeperState}
                  board={board}
                  rowIndex={rowIndex}
                  columnIndex={columnIndex}
                  cell={cell}
                  setBoard={setBoard}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <Result minesweeperState={minesweeperState} stopwatch={stopwatch} />

      <div className="flex flex-wrap justify-center gap-3">
        <RetryButton minesweeperState={minesweeperState} reset={reset} />

        <a
          href={`https://twitter.com/intent/tweet?${new URLSearchParams({
            hashtags: "マツボックリスイーパー",
            url: "https://pinecone.hata6502.com/",
          })}`}
          target="_blank"
          className={clsx(buttonClassNames.primary, "gap-x-2")}
        >
          Xにポスト
          <ShareIcon className="h-5 w-5" aria-hidden="true" />
        </a>
      </div>

      <p className="text-center text-sm text-zinc-500">
        #マツボックリスイーパー
        タグ付きでXにポストすると、このサイトに掲載されることがあります。
      </p>
    </div>
  );
};

const difficulties = ["easy", "normal", "hard"] as const;
type Difficulty = (typeof difficulties)[number];

const getMinesweeperState = (board: CellState[][]) => {
  if (
    board
      .flat()
      .some(
        (cell) =>
          cell.mineIncluded &&
          { hidden: false, revealed: true, flagged: false }[cell.state],
      )
  ) {
    return "gameOver";
  }

  if (
    board.flat().every(
      (cell) =>
        ({
          hidden: cell.mineIncluded,
          revealed: true,
          flagged: cell.mineIncluded,
        })[cell.state],
    )
  ) {
    return "completed";
  }

  return "playing";
};

const getMineCandidates = (size: number, imageData: ImageData | undefined) =>
  [...Array(size).keys()].flatMap((rowIndex) =>
    [...Array(size).keys()].flatMap((columnIndex): [number, number][] => {
      if (!imageData) {
        return [[columnIndex, rowIndex]];
      }

      const x = Math.floor(
        ((columnIndex + Math.random()) / size) * imageData.width,
      );
      const y = Math.floor(
        ((rowIndex + Math.random()) / size) * imageData.height,
      );
      const index = (y * imageData.width + x) * 4;
      const [r, g, b] = imageData.data.slice(index, index + 3);

      const grayscale = Math.round(r * 0.2126 + g * 0.7152 + b * 0.0722);
      return [...Array(Math.floor(((255 - grayscale) / 256) * 16)).keys()].map(
        () => [columnIndex, rowIndex],
      );
    }),
  );

const Emotion: FunctionComponent<{
  minesweeperState: MinesweeperState;
  progress: number;
}> = ({ minesweeperState, progress }) => {
  switch (minesweeperState) {
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
      throw new Error(
        `Unknown minesweeperState: ${minesweeperState satisfies never}`,
      );
    }
  }
};

const Result: FunctionComponent<{
  minesweeperState: MinesweeperState;
  stopwatch: number;
}> = ({ minesweeperState, stopwatch }) => {
  switch (minesweeperState) {
    case "gameOver": {
      return (
        <div className="mx-auto w-full max-w-md rounded-xl border border-red-100 bg-red-50 px-6 py-4 text-center text-red-800 shadow-sm">
          <p className="mb-2 text-xl font-bold">ゲームオーバー</p>
          <p className="text-base">マツボックリに当たってしまいました</p>
        </div>
      );
    }

    case "completed": {
      return (
        <div className="mx-auto w-full max-w-md rounded-xl border border-green-100 bg-green-50 px-6 py-4 text-center text-green-800 shadow-sm">
          <p className="mb-2 text-xl font-bold">クリア！</p>
          <p className="text-base">素晴らしいマツボックリ探索でした！</p>
          <p className="text-base">タイム {stopwatch}秒</p>
        </div>
      );
    }

    case "playing": {
      return;
    }

    default: {
      throw new Error(
        `Unknown minesweeperState: ${minesweeperState satisfies never}`,
      );
    }
  }
};

const RetryButton: FunctionComponent<{
  minesweeperState: MinesweeperState;
  reset: () => void;
}> = ({ minesweeperState, reset }) => {
  const handleClick = () => {
    reset();
  };

  switch (minesweeperState) {
    case "gameOver":
    case "completed": {
      return (
        <button
          type="button"
          onClick={handleClick}
          className={buttonClassNames.primary}
        >
          もう一度遊ぶ
        </button>
      );
    }

    case "playing": {
      return (
        <button
          type="button"
          onClick={handleClick}
          className={buttonClassNames.secondary}
        >
          やり直す
        </button>
      );
    }

    default: {
      throw new Error(
        `Unknown minesweeperState: ${minesweeperState satisfies never}`,
      );
    }
  }
};

const buttonClassNames = {
  primary:
    "inline-flex items-center justify-center rounded-lg px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm bg-zinc-900 hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900",
  secondary:
    "inline-flex items-center justify-center rounded-lg px-3.5 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm border border-zinc-300 bg-white hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500",
  option: "rounded-lg border px-4 py-2 text-sm font-medium shadow-sm",
  optionActive: "border-zinc-400 bg-zinc-100 text-zinc-800",
  optionInactive: "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
};

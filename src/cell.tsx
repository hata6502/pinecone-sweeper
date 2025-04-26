import clsx from "clsx";
import {
  Dispatch,
  FunctionComponent,
  MouseEventHandler,
  SetStateAction,
} from "react";

import { MinesweeperState } from "./minesweeper";

export interface CellState {
  state: "hidden" | "autoRevealed" | "manualRevealed" | "flagged";
  mineIncluded: boolean;
}

export const Cell: FunctionComponent<
  HiddenCellProps & RevealedCellProps & FlaggedCellProps
> = (props) => {
  switch (props.cell.state) {
    case "hidden": {
      return <HiddenCell {...props} />;
    }

    case "autoRevealed":
    case "manualRevealed": {
      return <RevealedCell {...props} />;
    }

    case "flagged": {
      return <FlaggedCell {...props} />;
    }

    default: {
      throw new Error(
        `Unknown cell state: ${props.cell.state satisfies never}`,
      );
    }
  }
};

interface HiddenCellProps {
  minesweeperState: MinesweeperState;
  rowIndex: number;
  columnIndex: number;
  setBoard: Dispatch<SetStateAction<CellState[][]>>;
}
const HiddenCell: FunctionComponent<HiddenCellProps> = ({
  minesweeperState,
  rowIndex,
  columnIndex,
  setBoard,
}) => {
  switch (minesweeperState) {
    case "completed":
    case "gameOver": {
      setBoard((prev) => {
        const board = [...prev].map((row) => [...row]);

        board[rowIndex][columnIndex] = {
          ...board[rowIndex][columnIndex],
          state: "autoRevealed",
        };

        return board;
      });
    }

    case "playing": {
      break;
    }

    default: {
      throw new Error(
        `Unknown minesweeperState: ${minesweeperState satisfies never}`,
      );
    }
  }

  const handleClick = () => {
    setBoard((prev) => {
      const board = [...prev].map((row) => [...row]);

      board[rowIndex][columnIndex] = {
        ...board[rowIndex][columnIndex],
        state: "manualRevealed",
      };

      return board;
    });
  };

  const handleContextMenu: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.preventDefault();

    setBoard((prev) => {
      const board = [...prev].map((row) => [...row]);

      board[rowIndex][columnIndex] = {
        ...board[rowIndex][columnIndex],
        state: "flagged",
      };

      return board;
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      className={clsx(
        className,
        "border-zinc-300 bg-zinc-200 hover:bg-zinc-300",
      )}
    />
  );
};

interface RevealedCellProps {
  board: CellState[][];
  rowIndex: number;
  columnIndex: number;
  setBoard: Dispatch<SetStateAction<CellState[][]>>;
}
const RevealedCell: FunctionComponent<RevealedCellProps> = ({
  board,
  rowIndex,
  columnIndex,
  setBoard,
}) => {
  if (board[rowIndex][columnIndex].mineIncluded) {
    return (
      <button
        type="button"
        disabled
        className={clsx(className, "border-red-200 bg-red-100")}
      >
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
      (cell) =>
        ({
          hidden: true,
          autoRevealed: false,
          manualRevealed: false,
          flagged: true,
        })[cell.state],
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
            state: "autoRevealed",
          };
        }
      }

      return board;
    });
  }

  const colorClassName = {
    0: "bg-zinc-50 text-zinc-400 border-zinc-200",
    1: "bg-blue-50 text-blue-600 border-blue-200",
    2: "bg-green-50 text-green-600 border-green-200",
    3: "bg-red-50 text-red-600 border-red-200",
    4: "bg-indigo-50 text-indigo-700 border-indigo-200",
    5: "bg-amber-50 text-amber-700 border-amber-200",
    6: "bg-pink-50 text-pink-700 border-pink-200",
    7: "bg-purple-50 text-purple-700 border-purple-200",
    8: "bg-cyan-50 text-cyan-800 border-cyan-200",
  }[adjacentMineCount];

  return (
    <button type="button" disabled className={clsx(className, colorClassName)}>
      {adjacentMineCount || ""}
    </button>
  );
};

interface FlaggedCellProps {
  minesweeperState: MinesweeperState;
  cell: CellState;
  rowIndex: number;
  columnIndex: number;
  setBoard: Dispatch<SetStateAction<CellState[][]>>;
}
const FlaggedCell: FunctionComponent<FlaggedCellProps> = ({
  minesweeperState,
  cell,
  rowIndex,
  columnIndex,
  setBoard,
}) => {
  const disabled = {
    completed: true,
    gameOver: true,
    playing: false,
  }[minesweeperState];

  switch (minesweeperState) {
    case "completed":
    case "gameOver": {
      if (!cell.mineIncluded) {
        return (
          <button
            type="button"
            disabled={disabled}
            className={clsx(className, "border-orange-200 bg-orange-100")}
          >
            🤔
          </button>
        );
      }
    }
    case "playing": {
      const handleContextMenu: MouseEventHandler<HTMLButtonElement> = (
        event,
      ) => {
        event.preventDefault();

        setBoard((prev) => {
          const board = [...prev].map((row) => [...row]);

          board[rowIndex][columnIndex] = {
            ...board[rowIndex][columnIndex],
            state: "hidden",
          };

          return board;
        });
      };

      return (
        <button
          type="button"
          disabled={disabled}
          onContextMenu={handleContextMenu}
          className={clsx(className, "border-orange-200 bg-orange-100")}
        >
          🌲
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

const className =
  "select-none w-8 h-8 rounded-md border shadow-sm flex items-center justify-center text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500";

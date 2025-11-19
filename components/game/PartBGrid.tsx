import { GAME_COLORS, GRID_SIZE, L_PATTERNS } from '@/constants/game';
import { createEmptyGrid } from '@/utils/gameLogic';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { gameStyles } from '../../styles/styles';

// Constants
const MIN_CELL_SIZE = 10;
const MAX_GRID_WIDTH = 500;
const GRID_PADDING = 20;
const GRID_ROTATION_DEGREES = 45;
const ROTATION_FACTOR = Math.SQRT2; // 1.414... for 45-degree rotation
const GRID_MARGIN = 50;
const DRAGGING_PIECE_OPACITY = 0.7;
const COUNTER_DISABLED_OPACITY = 0.3;
const Z_INDEX_DRAGGING = 1000;
const PRE_FILLED_CELL_VALUE = 3;

// Part B grid pre-filled cell positions (architecture pattern)
const PART_B_PRE_FILLED_CELLS: Array<[number, number]> = [
  [2, 2], [2, 11], [5, 5], [5, 8], [8, 2], [8, 11],
  [11, 5], [11, 8], [3, 7], [7, 3], [7, 10], [10, 7],
];

// Grid cell value types
enum CellValue {
  EMPTY = 0,
  RFB_PLACED = 1, // Right-facing block placement
  LFB_PLACED = 2, // Left-facing block placement
  PRE_FILLED = 3, // Pre-filled architecture cells
}

// Color mapping for grid cells
const CELL_COLOR_MAP: Record<CellValue, string> = {
  [CellValue.EMPTY]: GAME_COLORS.background,
  [CellValue.RFB_PLACED]: GAME_COLORS.lCounter,
  [CellValue.LFB_PLACED]: GAME_COLORS.jCounter,
  [CellValue.PRE_FILLED]: GAME_COLORS.subtitle,
};

// Types
type LBlockType = 'RFB' | 'LFB';

interface PartBGridProps {
  rfbCount: number;
  lfbCount: number;
  wCount: number;
  onGridChange: (newGrid: number[][]) => void;
}

interface GridLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ScreenPosition {
  x: number;
  y: number;
}

interface GridCoordinates {
  row: number;
  col: number;
}

interface CounterSizes {
  letter: number;
  number: number;
  square: number;
}

/**
 * PartBGrid Component
 *
 * Manages all Part B game logic including:
 * - Grid initialization with pre-filled architecture cells
 * - Drag-and-drop interaction for RFB and LFB pieces
 * - Grid rendering with 45-degree rotation
 */
export default function PartBGrid({ rfbCount, lfbCount, wCount, onGridChange }: PartBGridProps) {
  const { width } = useWindowDimensions();

  // Part B state
  const [grid, setGrid] = useState<number[][]>(() => initializePartBGrid());

  /**
   * Initializes Part B grid with pre-filled cells (architecture pattern)
   */
  function initializePartBGrid(): number[][] {
    const newGrid = createEmptyGrid();
    PART_B_PRE_FILLED_CELLS.forEach(([row, col]) => {
      if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
        newGrid[row][col] = PRE_FILLED_CELL_VALUE;
      }
    });
    return newGrid;
  }

  /**
   * Reinitializes the grid when needed
   */
  const resetGrid = useCallback(() => {
    const newGrid = initializePartBGrid();
    setGrid(newGrid);
    onGridChange(newGrid);
  }, [onGridChange]);

  // Initialize grid on mount and notify parent
  useEffect(() => {
    const initialGrid = initializePartBGrid();
    onGridChange(initialGrid);
  }, [onGridChange]);

  // Update parent when grid changes
  useEffect(() => {
    onGridChange(grid);
  }, [grid, onGridChange]);

  // Calculate cell size accounting for 45-degree rotation
  const cellSize = useMemo(() => {
    const availableWidth = Math.min(width - GRID_PADDING, MAX_GRID_WIDTH);
    const availableHeight = availableWidth;
    const adjustedWidth = Math.floor(availableWidth / ROTATION_FACTOR);
    const adjustedHeight = Math.floor(availableHeight / ROTATION_FACTOR);
    
    return Math.max(
      MIN_CELL_SIZE,
      Math.min(
        Math.floor(adjustedWidth / GRID_SIZE),
        Math.floor(adjustedHeight / GRID_SIZE),
      ),
    );
  }, [width]);

  // Drag state
  const [draggingType, setDraggingType] = useState<LBlockType | null>(null);
  const [dragPosition, setDragPosition] = useState<ScreenPosition | null>(null);
  const [dragStartPosition, setDragStartPosition] = useState<ScreenPosition | null>(null);

  // Refs for gesture handling (needed for PanResponder callbacks)
  const gridContainerRef = useRef<View>(null);
  const gridLayoutRef = useRef<GridLayout | null>(null);
  const draggingTypeRef = useRef<LBlockType | null>(null);
  const dragPositionRef = useRef<ScreenPosition | null>(null);
  const dragStartPositionRef = useRef<ScreenPosition | null>(null);

  // Keep refs synchronized with state for PanResponder callbacks
  useEffect(() => {
    draggingTypeRef.current = draggingType;
  }, [draggingType]);

  useEffect(() => {
    dragPositionRef.current = dragPosition;
  }, [dragPosition]);

  useEffect(() => {
    dragStartPositionRef.current = dragStartPosition;
  }, [dragStartPosition]);

  // Calculate responsive counter sizes
  const counterSizes = useMemo((): CounterSizes => {
    const isSmallScreen = width < 400;
    const isVerySmall = width < 320;
    
    return {
      letter: isVerySmall ? 20 : isSmallScreen ? 28 : 36,
      number: isVerySmall ? 14 : isSmallScreen ? 18 : 22,
      square: isVerySmall ? 30 : isSmallScreen ? 40 : 50,
    };
  }, [width]);

  /**
   * Gets the L-pattern cells for a given block type
   */
  const getLPatternCells = (type: LBlockType): number[][] => {
    const patterns = type === 'RFB' ? L_PATTERNS.RFB : L_PATTERNS.LFB;
    return patterns[0] || [];
  };

  /**
   * Gets the cell value for a placed block type
   */
  const getCellValueForType = (type: LBlockType): CellValue => {
    return type === 'RFB' ? CellValue.RFB_PLACED : CellValue.LFB_PLACED;
  };

  /**
   * Checks if an L-pattern can be placed at the specified grid coordinates
   */
  const canPlaceLPattern = (type: LBlockType, gridRow: number, gridCol: number): boolean => {
    const pattern = getLPatternCells(type);

    for (const [dy, dx] of pattern) {
      const row = gridRow + dy;
      const col = gridCol + dx;

      // Check bounds
      if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
        return false;
      }

      // Can't place on pre-filled cells or existing blocks
      if (grid[row]?.[col] !== CellValue.EMPTY) {
        return false;
      }
    }

    return true;
  };

  /**
   * Places an L-pattern on the grid at the specified coordinates
   */
  const placeLPattern = (type: LBlockType, gridRow: number, gridCol: number): void => {
    if (!canPlaceLPattern(type, gridRow, gridCol)) {
      return;
    }

    const pattern = getLPatternCells(type);
    const cellValue = getCellValueForType(type);
    const newGrid = grid.map(row => [...row]);

    for (const [dy, dx] of pattern) {
      const row = gridRow + dy;
      const col = gridCol + dx;
      if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
        newGrid[row][col] = cellValue;
      }
    }

    onGridChange(newGrid);
  };

  /**
   * Converts screen coordinates to grid coordinates
   * Accounts for the 45-degree rotation of the grid
   */
  const screenToGridCoords = (screenX: number, screenY: number): GridCoordinates | null => {
    if (!gridLayoutRef.current) return null;

    const { x: gridX, y: gridY, width: gridWidth, height: gridHeight } = gridLayoutRef.current;

    // Calculate grid center
    const centerX = gridX + gridWidth / 2;
    const centerY = gridY + gridHeight / 2;

    // Translate screen coordinates relative to grid center
    const relX = screenX - centerX;
    const relY = screenY - centerY;

    // Rotate back by -45 degrees to undo grid rotation
    const rotationAngle = -Math.PI / 4;
    const cos = Math.cos(rotationAngle);
    const sin = Math.sin(rotationAngle);
    const rotatedX = relX * cos - relY * sin;
    const rotatedY = relX * sin + relY * cos;

    // Translate back to absolute coordinates
    const finalX = rotatedX + centerX;
    const finalY = rotatedY + centerY;

    // Convert to grid coordinates
    const col = Math.floor((finalX - gridX) / cellSize);
    const row = Math.floor((finalY - gridY) / cellSize);

    // Validate bounds
    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
      return { row, col };
    }

    return null;
  };

  /**
   * Handles drag release - attempts to place the piece on the grid
   */
  const handleDragRelease = (evt: GestureResponderEvent) => {
    const type = draggingTypeRef.current;
    const pos = dragPositionRef.current;
    
    if (!type || !pos || !gridLayoutRef.current) {
      resetDragState();
      return;
    }

    const { pageX, pageY } = evt.nativeEvent;
    const gridCoords = screenToGridCoords(pageX, pageY);

    if (gridCoords && canPlaceLPattern(type, gridCoords.row, gridCoords.col)) {
      placeLPattern(type, gridCoords.row, gridCoords.col);
    }

    resetDragState();
  };

  /**
   * Resets all drag-related state
   */
  const resetDragState = () => {
    setDraggingType(null);
    setDragPosition(null);
    setDragStartPosition(null);
  };

  /**
   * Pan responder for handling drag gestures on the grid
   * (used when piece is already being dragged)
   */
  const gridPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => draggingTypeRef.current !== null,
        onMoveShouldSetPanResponder: () => draggingTypeRef.current !== null,
        onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
          const startPos = dragStartPositionRef.current;
          const type = draggingTypeRef.current;
          if (startPos && type) {
            setDragPosition({
              x: startPos.x + gestureState.dx,
              y: startPos.y + gestureState.dy,
            });
          }
        },
        onPanResponderRelease: handleDragRelease,
      }),
    []
  );

  /**
   * Creates a pan responder for a counter button (RFB or LFB)
   */
  const createCounterPanResponder = (type: LBlockType) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => {
        const hasCount = type === 'RFB' ? rfbCount > 0 : lfbCount > 0;
        return hasCount;
      },
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const { pageX, pageY } = evt.nativeEvent;
        setDraggingType(type);
        setDragStartPosition({ x: pageX, y: pageY });
        setDragPosition({ x: pageX, y: pageY });
      },
      onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const startPos = dragStartPositionRef.current;
        const currentType = draggingTypeRef.current;
        if (startPos && currentType) {
          setDragPosition({
            x: startPos.x + gestureState.dx,
            y: startPos.y + gestureState.dy,
          });
        }
      },
      onPanResponderRelease: handleDragRelease,
    });
  };

  // Create pan responders for each counter type
  const rfbPanResponder = useMemo(() => createCounterPanResponder('RFB'), [rfbCount]);
  const lfbPanResponder = useMemo(() => createCounterPanResponder('LFB'), [lfbCount]);

  /**
   * Gets the background color for a grid cell
   */
  const getCellColor = (row: number, col: number): string => {
    const cellValue = (grid[row]?.[col] ?? CellValue.EMPTY) as CellValue;
    return CELL_COLOR_MAP[cellValue] || GAME_COLORS.background;
  };

  /**
   * Renders a single grid cell
   */
  const renderCell = (row: number, col: number) => {
    const backgroundColor = getCellColor(row, col);

    return (
      <View
        key={`${row}-${col}`}
        style={[
          gameStyles.cell,
          {
            width: cellSize,
            height: cellSize,
            backgroundColor,
            borderColor: GAME_COLORS.gridLineFaded,
          },
        ]}
      />
    );
  };

  /**
   * Renders the dragging piece preview
   */
  const renderDraggingPiece = () => {
    if (!draggingType || !dragPosition) return null;

    const pattern = getLPatternCells(draggingType);
    const color = draggingType === 'RFB' ? GAME_COLORS.lCounter : GAME_COLORS.jCounter;
    
    // Calculate bounding box for the pattern
    const maxDx = Math.max(...pattern.map(([, dx]) => dx));
    const maxDy = Math.max(...pattern.map(([dy]) => dy));
    const minDx = Math.min(...pattern.map(([, dx]) => dx));
    const minDy = Math.min(...pattern.map(([dy]) => dy));
    const width = (maxDx - minDx + 1) * cellSize;
    const height = (maxDy - minDy + 1) * cellSize;

    return (
      <View
        style={[
          gameStyles.draggingPiece,
          {
            left: dragPosition.x - width / 2,
            top: dragPosition.y - height / 2,
            width,
            height,
            transform: [{ rotate: `${GRID_ROTATION_DEGREES}deg` }],
          },
        ]}
        pointerEvents="none"
      >
        {pattern.map(([dy, dx], idx) => (
          <View
            key={idx}
            style={[
              gameStyles.draggingCell,
              {
                position: 'absolute',
                left: (dx - minDx) * cellSize,
                top: (dy - minDy) * cellSize,
                width: cellSize,
                height: cellSize,
                backgroundColor: color,
                opacity: DRAGGING_PIECE_OPACITY,
                borderWidth: 1,
                borderColor: GAME_COLORS.gridLine,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  /**
   * Handles grid container layout event
   */
  const handleGridLayout = (event: any) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    gridLayoutRef.current = { x, y, width, height };
  };

  /**
   * Renders a counter button (RFB, LFB, or W)
   */
  const renderCounter = (
    type: LBlockType | 'W',
    count: number,
    color: string,
    symbol: string,
    panResponder?: ReturnType<typeof PanResponder.create>,
  ) => {
    const isDisabled = type !== 'W' && count <= 0;
    const { letter, number, square } = counterSizes;

    return (
      <View
        style={[gameStyles.counter, isDisabled && gameStyles.counterDisabled]}
        {...(panResponder ? panResponder.panHandlers : {})}
      >
        <View
          style={[
            gameStyles.counterSquare,
            {
              width: square,
              height: square,
              borderColor: color,
            },
          ]}
        >
          <Text style={[gameStyles.counterLetter, { color, fontSize: letter }]}>
            {symbol}
          </Text>
        </View>
        <Text style={[gameStyles.counterNumber, { color, fontSize: number }]}>
          {count}
        </Text>
      </View>
    );
  };

  /**
   * Renders a row of grid cells
   */
  const renderRow = (row: number) => (
    <View key={row} style={gameStyles.row}>
      {Array.from({ length: GRID_SIZE }, (_, col) => renderCell(row, col))}
    </View>
  );

  return (
    <>
      <View style={gameStyles.gridWrapper}>
        <View
          ref={gridContainerRef}
          style={[
            gameStyles.gridContainerRotated,
            {
              transform: [{ rotate: `${GRID_ROTATION_DEGREES}deg` }],
            },
          ]}
          onLayout={handleGridLayout}
          {...gridPanResponder.panHandlers}
        >
          {Array.from({ length: GRID_SIZE }, (_, row) => renderRow(row))}
        </View>
      </View>

      <View style={gameStyles.countersContainer}>
        {renderCounter('RFB', rfbCount, GAME_COLORS.lCounter, 'L', rfbPanResponder)}
        {renderCounter('LFB', lfbCount, GAME_COLORS.jCounter, '⅃', lfbPanResponder)}
        {renderCounter('W', wCount, GAME_COLORS.wCounter, 'W')}
      </View>

      {renderDraggingPiece()}
    </>
  );
}
#!/usr/bin/env python3

import curses
import time
import random
from dataclasses import dataclass
from typing import Dict, List, Optional, Sequence, Tuple


# ------------------------------
# Game configuration constants
# ------------------------------
BOARD_WIDTH: int = 10
BOARD_HEIGHT: int = 20

# Gravity timing (seconds per row) by level, capped to minimum
BASE_GRAVITY_S: float = 0.7
GRAVITY_DECREMENT_PER_LEVEL_S: float = 0.06
MIN_GRAVITY_S: float = 0.05

# Lines required to advance one level
LINES_PER_LEVEL: int = 10

# Soft drop and hard drop scoring
SOFT_DROP_POINT_PER_CELL: int = 1
HARD_DROP_POINT_PER_CELL: int = 2


# ------------------------------
# Tetromino definitions (4x4 bounding box, rotation computed in 4x4 space)
# Coordinates are (x, y) with (0,0) at top-left of the 4x4 box
# ------------------------------
BaseShape = Sequence[Tuple[int, int]]

BASE_SHAPES: Dict[str, BaseShape] = {
    # I: horizontal line in row 1 of the 4x4 box
    "I": [(0, 1), (1, 1), (2, 1), (3, 1)],
    # O: 2x2 block centered
    "O": [(1, 1), (2, 1), (1, 2), (2, 2)],
    # T: up orientation
    "T": [(1, 0), (0, 1), (1, 1), (2, 1)],
    # S
    "S": [(1, 0), (2, 0), (0, 1), (1, 1)],
    # Z
    "Z": [(0, 0), (1, 0), (1, 1), (2, 1)],
    # J
    "J": [(0, 0), (0, 1), (1, 1), (2, 1)],
    # L
    "L": [(2, 0), (0, 1), (1, 1), (2, 1)],
}


def rotate_4x4_cw(cells: BaseShape) -> List[Tuple[int, int]]:
    """Rotate a set of (x, y) cells clockwise within a 4x4 grid.

    Using standard 4x4 rotation: (x, y) -> (3 - y, x)
    """
    return [(3 - y, x) for (x, y) in cells]


def compute_rotations(base: BaseShape) -> List[List[Tuple[int, int]]]:
    """Return 4 rotation states for the given base shape (CW rotations)."""
    r0 = list(base)
    r1 = rotate_4x4_cw(r0)
    r2 = rotate_4x4_cw(r1)
    r3 = rotate_4x4_cw(r2)
    return [r0, r1, r2, r3]


ROTATIONS: Dict[str, List[List[Tuple[int, int]]]] = {
    name: compute_rotations(cells) for name, cells in BASE_SHAPES.items()
}


PIECE_ORDER = ["I", "O", "T", "S", "Z", "J", "L"]


# ------------------------------
# Game data structures
# ------------------------------
@dataclass
class ActivePiece:
    kind: str
    rotation: int
    x: int  # top-left x of the 4x4 bounding box on the board
    y: int  # top-left y of the 4x4 bounding box on the board (can be negative during spawn)

    @property
    def cells(self) -> List[Tuple[int, int]]:
        return ROTATIONS[self.kind][self.rotation]


class GameBoard:
    def __init__(self, width: int, height: int) -> None:
        self.width = width
        self.height = height
        # grid[y][x] -> Optional[int] color pair id (1..7) or None if empty
        self.grid: List[List[Optional[int]]]= [[None for _ in range(width)] for _ in range(height)]

    def is_inside(self, x: int, y: int) -> bool:
        return 0 <= x < self.width and 0 <= y < self.height

    def collides(self, piece: ActivePiece, dx: int = 0, dy: int = 0, drot: int = 0) -> bool:
        new_rotation = (piece.rotation + drot) % 4
        for (cx, cy) in ROTATIONS[piece.kind][new_rotation]:
            gx = piece.x + dx + cx
            gy = piece.y + dy + cy
            # Cells above the visible board (gy < 0) are allowed during spawn
            if gx < 0 or gx >= self.width or gy >= self.height:
                return True
            if gy >= 0 and self.grid[gy][gx] is not None:
                return True
        return False

    def lock_piece(self, piece: ActivePiece, color_id: int) -> None:
        for (cx, cy) in piece.cells:
            gx = piece.x + cx
            gy = piece.y + cy
            if 0 <= gy < self.height and 0 <= gx < self.width:
                self.grid[gy][gx] = color_id

    def clear_full_lines(self) -> int:
        """Clear full rows and return number of lines cleared."""
        new_rows: List[List[Optional[int]]] = []
        lines_cleared = 0
        for y in range(self.height):
            row = self.grid[y]
            if all(cell is not None for cell in row):
                lines_cleared += 1
            else:
                new_rows.append(row)
        while len(new_rows) < self.height:
            new_rows.insert(0, [None for _ in range(self.width)])
        self.grid = new_rows
        return lines_cleared


# ------------------------------
# Utilities
# ------------------------------
def bag_random_generator() -> "BagRandom":
    return BagRandom(PIECE_ORDER)


class BagRandom:
    """7-bag randomizer for fair distribution of pieces."""

    def __init__(self, kinds: Sequence[str]) -> None:
        self.kinds = list(kinds)
        self._bag: List[str] = []
        self._reshuffle()

    def _reshuffle(self) -> None:
        self._bag = list(self.kinds)
        random.shuffle(self._bag)

    def next(self) -> str:
        if not self._bag:
            self._reshuffle()
        return self._bag.pop()


def gravity_interval_for_level(level: int) -> float:
    interval = BASE_GRAVITY_S - (level - 1) * GRAVITY_DECREMENT_PER_LEVEL_S
    return max(MIN_GRAVITY_S, interval)


def score_for_lines(lines: int, level: int) -> int:
    # Classic-like scoring (approx): 1->100, 2->300, 3->500, 4->800 times level
    if lines == 1:
        base = 100
    elif lines == 2:
        base = 300
    elif lines == 3:
        base = 500
    elif lines == 4:
        base = 800
    else:
        base = 0
    return base * max(1, level)


# ------------------------------
# Rendering (curses)
# ------------------------------
class Renderer:
    def __init__(self, stdscr: "curses._CursesWindow", board: GameBoard) -> None:
        self.stdscr = stdscr
        self.board = board
        self.cell_width = 2  # width of one cell in characters

    def init_colors(self) -> None:
        if curses.has_colors():
            curses.start_color()
            curses.use_default_colors()
            # Map pieces to color pairs (1..7)
            color_map = {
                "I": curses.COLOR_CYAN,
                "O": curses.COLOR_YELLOW,
                "T": curses.COLOR_MAGENTA,
                "S": curses.COLOR_GREEN,
                "Z": curses.COLOR_RED,
                "J": curses.COLOR_BLUE,
                "L": curses.COLOR_WHITE,
            }
            pair_id = 1
            self.kind_to_pair: Dict[str, int] = {}
            for kind, color in color_map.items():
                try:
                    curses.init_pair(pair_id, color, -1)
                except Exception:
                    # Some terminals may not support all colors; fall back silently
                    pass
                self.kind_to_pair[kind] = pair_id
                pair_id += 1
        else:
            self.kind_to_pair = {k: 0 for k in PIECE_ORDER}

    def draw_border(self, top: int, left: int, height: int, width_chars: int) -> None:
        # Simple border using ASCII
        self.stdscr.attrset(curses.A_DIM)
        for x in range(width_chars):
            self.stdscr.addch(top, left + x, '-')
            self.stdscr.addch(top + height - 1, left + x, '-')
        for y in range(height):
            self.stdscr.addch(top + y, left, '|')
            self.stdscr.addch(top + y, left + width_chars - 1, '|')
        self.stdscr.addch(top, left, '+')
        self.stdscr.addch(top, left + width_chars - 1, '+')
        self.stdscr.addch(top + height - 1, left, '+')
        self.stdscr.addch(top + height - 1, left + width_chars - 1, '+')
        self.stdscr.attrset(0)

    def draw_cell(self, y: int, x: int, pair_id: int) -> None:
        # Draw a 2-char wide cell for better aspect ratio
        try:
            if pair_id:
                self.stdscr.attrset(curses.color_pair(pair_id) | curses.A_BOLD)
            else:
                self.stdscr.attrset(curses.A_BOLD)
            self.stdscr.addstr(y, x, "[]")
        finally:
            self.stdscr.attrset(0)

    def render(self, piece: Optional[ActivePiece], next_kind: str, score: int, level: int, lines_cleared_total: int) -> None:
        self.stdscr.erase()

        # Layout
        top = 2
        left = 2
        board_pixel_width = self.board.width * self.cell_width + 2  # +2 for border
        board_pixel_height = self.board.height + 2

        # Border and board background
        self.draw_border(top, left, board_pixel_height, board_pixel_width)

        # Draw static grid
        for gy in range(self.board.height):
            for gx in range(self.board.width):
                cell = self.board.grid[gy][gx]
                if cell is not None:
                    py = top + 1 + gy
                    px = left + 1 + gx * self.cell_width
                    self.draw_cell(py, px, cell)

        # Draw active piece
        if piece is not None:
            color_pair_id = self.kind_to_pair.get(piece.kind, 0)
            for (cx, cy) in piece.cells:
                gx = piece.x + cx
                gy = piece.y + cy
                if gy < 0:
                    continue
                if 0 <= gx < self.board.width and 0 <= gy < self.board.height:
                    py = top + 1 + gy
                    px = left + 1 + gx * self.cell_width
                    self.draw_cell(py, px, color_pair_id)

        # Sidebar info
        info_left = left + board_pixel_width + 2
        self.stdscr.addstr(top, info_left, "俄罗斯方块 (Tetris)")
        self.stdscr.addstr(top + 2, info_left, f"分数: {score}")
        self.stdscr.addstr(top + 3, info_left, f"等级: {level}")
        self.stdscr.addstr(top + 4, info_left, f"消行: {lines_cleared_total}")
        self.stdscr.addstr(top + 6, info_left, "操作: ← → 移动  ↓软降  ↑旋转  空格硬降  z反转  p暂停  q退出")

        # Next piece preview (3x4 area)
        self.stdscr.addstr(top + 8, info_left, "下一块:")
        preview_top = top + 10
        preview_left = info_left
        # Draw a small border for preview
        self.draw_border(preview_top - 1, preview_left - 1, 6, 10)
        color_pair_id = self.kind_to_pair.get(next_kind, 0)
        for (cx, cy) in ROTATIONS[next_kind][0]:
            py = preview_top + cy
            px = preview_left + cx * self.cell_width
            self.draw_cell(py, px, color_pair_id)

        self.stdscr.refresh()


# ------------------------------
# Game loop
# ------------------------------
def try_rotate_with_kicks(board: GameBoard, piece: ActivePiece, cw: bool = True) -> ActivePiece:
    next_rotation = (piece.rotation + (1 if cw else -1)) % 4
    # Simple wall kicks: try offsets (dx, dy)
    kick_tests = [(0, 0), (-1, 0), (1, 0), (-2, 0), (2, 0), (0, -1)]
    for (dx, dy) in kick_tests:
        if not board.collides(ActivePiece(piece.kind, next_rotation, piece.x + dx, piece.y + dy)):
            return ActivePiece(piece.kind, next_rotation, piece.x + dx, piece.y + dy)
    return piece


def spawn_piece(rng: BagRandom, board: GameBoard) -> ActivePiece:
    kind = rng.next()
    # Spawn horizontally centered (4x4 box), y starts slightly above
    start_x = (board.width // 2) - 2
    start_y = -2
    return ActivePiece(kind=kind, rotation=0, x=start_x, y=start_y)


def game_over_overlay(stdscr: "curses._CursesWindow") -> None:
    msg = "游戏结束 - 按 q 退出，或按 r 再来一局"
    stdscr.attrset(curses.A_REVERSE | curses.A_BOLD)
    height, width = stdscr.getmaxyx()
    y = height // 2
    x = max(0, (width - len(msg)) // 2)
    stdscr.addstr(y, x, msg)
    stdscr.attrset(0)
    stdscr.refresh()


def pause_overlay(stdscr: "curses._CursesWindow") -> None:
    msg = "已暂停 - 按 p 继续"
    stdscr.attrset(curses.A_REVERSE | curses.A_BOLD)
    height, width = stdscr.getmaxyx()
    y = height // 2
    x = max(0, (width - len(msg)) // 2)
    stdscr.addstr(y, x, msg)
    stdscr.attrset(0)
    stdscr.refresh()


def run(stdscr: "curses._CursesWindow") -> None:
    curses.curs_set(0)
    stdscr.nodelay(True)
    stdscr.keypad(True)

    board = GameBoard(BOARD_WIDTH, BOARD_HEIGHT)
    renderer = Renderer(stdscr, board)
    renderer.init_colors()

    rng = bag_random_generator()
    current = spawn_piece(rng, board)
    next_kind = rng.next()

    # Map piece kind to color pair id for locked cells
    kind_to_pair = getattr(renderer, "kind_to_pair", {k: 0 for k in PIECE_ORDER})

    score = 0
    level = 1
    total_lines_cleared = 0
    drop_interval_s = gravity_interval_for_level(level)
    last_drop_time = time.monotonic()
    soft_drop_active = False
    game_is_over = False
    paused = False

    while True:
        if not paused:
            renderer.render(current if not game_is_over else None, next_kind, score, level, total_lines_cleared)

        # Handle input
        try:
            key = stdscr.getch()
        except Exception:
            key = -1

        if key != -1:
            if key in (ord('q'), ord('Q')):
                if game_is_over:
                    break
                else:
                    # Allow immediate quit during game as well
                    break
            if key in (ord('p'), ord('P')):
                paused = not paused
                if paused:
                    pause_overlay(stdscr)
                else:
                    last_drop_time = time.monotonic()
                continue

            if game_is_over:
                if key in (ord('r'), ord('R')):
                    # Restart game
                    board = GameBoard(BOARD_WIDTH, BOARD_HEIGHT)
                    renderer = Renderer(stdscr, board)
                    renderer.init_colors()
                    rng = bag_random_generator()
                    current = spawn_piece(rng, board)
                    next_kind = rng.next()
                    kind_to_pair = getattr(renderer, "kind_to_pair", {k: 0 for k in PIECE_ORDER})
                    score = 0
                    level = 1
                    total_lines_cleared = 0
                    drop_interval_s = gravity_interval_for_level(level)
                    last_drop_time = time.monotonic()
                    soft_drop_active = False
                    game_is_over = False
                continue

            if paused:
                continue

            if key == curses.KEY_LEFT:
                if not board.collides(current, dx=-1):
                    current.x -= 1
            elif key == curses.KEY_RIGHT:
                if not board.collides(current, dx=1):
                    current.x += 1
            elif key == curses.KEY_DOWN:
                # Soft drop one step
                soft_drop_active = True
                if not board.collides(current, dy=1):
                    current.y += 1
                    score += SOFT_DROP_POINT_PER_CELL
                last_drop_time = time.monotonic()  # reset gravity timer for consistent feel
            elif key == curses.KEY_UP or key in (ord('x'), ord('X')):
                # Rotate clockwise
                rotated = try_rotate_with_kicks(board, current, cw=True)
                current = rotated
            elif key in (ord('z'), ord('Z')):
                # Rotate counter-clockwise
                rotated = try_rotate_with_kicks(board, current, cw=False)
                current = rotated
            elif key == ord(' '):
                # Hard drop
                drop_distance = 0
                while not board.collides(current, dy=1):
                    current.y += 1
                    drop_distance += 1
                score += drop_distance * HARD_DROP_POINT_PER_CELL
                # Lock piece
                board.lock_piece(current, kind_to_pair.get(current.kind, 0))
                # Check for game over (any locked cell above visible area)
                if any((current.y + cy) < 0 for (_, cy) in current.cells):
                    game_is_over = True
                    game_over_overlay(stdscr)
                else:
                    cleared = board.clear_full_lines()
                    if cleared:
                        total_lines_cleared += cleared
                        score += score_for_lines(cleared, level)
                        new_level = 1 + total_lines_cleared // LINES_PER_LEVEL
                        if new_level != level:
                            level = new_level
                            drop_interval_s = gravity_interval_for_level(level)
                    # Spawn next
                    current = ActivePiece(kind=next_kind, rotation=0, x=(board.width // 2) - 2, y=-2)
                    next_kind = rng.next()
                    if board.collides(current):
                        game_is_over = True
                        game_over_overlay(stdscr)
            else:
                # Any other key releases soft drop
                soft_drop_active = False

        # Gravity tick
        now = time.monotonic()
        current_interval = drop_interval_s
        if soft_drop_active:
            # Faster gravity while holding DOWN; do not overspeed too much
            current_interval = min(0.02, drop_interval_s * 0.25)

        if not paused and not game_is_over and (now - last_drop_time) >= current_interval:
            last_drop_time = now
            if not board.collides(current, dy=1):
                current.y += 1
            else:
                # Lock piece
                board.lock_piece(current, kind_to_pair.get(current.kind, 0))

                # Check for game over (any locked cell above visible area)
                if any((current.y + cy) < 0 for (_, cy) in current.cells):
                    game_is_over = True
                    game_over_overlay(stdscr)
                    continue

                cleared = board.clear_full_lines()
                if cleared:
                    total_lines_cleared += cleared
                    score += score_for_lines(cleared, level)
                    new_level = 1 + total_lines_cleared // LINES_PER_LEVEL
                    if new_level != level:
                        level = new_level
                        drop_interval_s = gravity_interval_for_level(level)

                # Spawn next piece
                current = ActivePiece(kind=next_kind, rotation=0, x=(board.width // 2) - 2, y=-2)
                next_kind = rng.next()
                if board.collides(current):
                    game_is_over = True
                    game_over_overlay(stdscr)


def main() -> None:
    try:
        curses.wrapper(run)
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()


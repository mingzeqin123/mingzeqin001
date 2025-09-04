import curses
import time
import random
from typing import List, Tuple, Dict, Iterable, Optional


# Board configuration
BOARD_WIDTH = 10
BOARD_HEIGHT = 20  # visible rows
SPAWN_BUFFER_ROWS = 2  # hidden rows above the visible playfield


# Piece identifiers
PIECE_IDS = ["I", "O", "T", "S", "Z", "J", "L"]


# Shape definitions using relative block coordinates for rotation state 0
# Coordinates are (row, col) relative to a piece origin. Origin is the top-left of a 4x4 box for spawn.
BASE_SHAPES: Dict[str, List[Tuple[int, int]]] = {
    "I": [(1, 0), (1, 1), (1, 2), (1, 3)],
    "O": [(1, 1), (1, 2), (2, 1), (2, 2)],
    "T": [(1, 1), (0, 1), (1, 0), (1, 2)],
    "S": [(1, 1), (1, 2), (0, 0), (0, 1)],
    "Z": [(1, 1), (1, 0), (0, 1), (0, 2)],
    "J": [(1, 1), (0, 0), (1, 0), (1, 2)],
    "L": [(1, 1), (0, 2), (1, 0), (1, 2)],
}


# Color mapping; curses color pairs will be initialized accordingly
PIECE_COLORS: Dict[str, int] = {
    "I": curses.COLOR_CYAN,
    "O": curses.COLOR_YELLOW,
    "T": curses.COLOR_MAGENTA,
    "S": curses.COLOR_GREEN,
    "Z": curses.COLOR_RED,
    "J": curses.COLOR_BLUE,
    "L": curses.COLOR_WHITE,
}


def rotate_point(row: int, col: int, rotation_quarters: int) -> Tuple[int, int]:
    """Rotate a 2D point (row, col) around origin (0,0) in 90-degree increments clockwise.

    rotation_quarters: 0, 1, 2, 3 for 0, 90, 180, 270 degrees.
    """
    r, c = row, col
    rotation_quarters %= 4
    if rotation_quarters == 0:
        return r, c
    if rotation_quarters == 1:
        return c, 3 - r
    if rotation_quarters == 2:
        return 3 - r, 3 - c
    return 3 - c, r


def get_rotated_shape(shape: List[Tuple[int, int]], rotation_quarters: int) -> List[Tuple[int, int]]:
    return [rotate_point(r, c, rotation_quarters) for r, c in shape]


def bag_generator() -> Iterable[str]:
    """Infinite generator of 7-bag shuffled tetromino ids."""
    while True:
        bag = PIECE_IDS.copy()
        random.shuffle(bag)
        for pid in bag:
            yield pid


class Tetromino:
    def __init__(self, piece_id: str):
        self.piece_id = piece_id
        self.rotation = 0
        # Position refers to the top-left of the 4x4 bounding box in board coordinates (including spawn buffer)
        # Spawn near top center
        self.row = 0
        self.col = (BOARD_WIDTH // 2) - 2

    def blocks(self) -> List[Tuple[int, int]]:
        shape = get_rotated_shape(BASE_SHAPES[self.piece_id], self.rotation)
        return [(self.row + r, self.col + c) for r, c in shape]

    def clone(self) -> "Tetromino":
        t = Tetromino(self.piece_id)
        t.rotation = self.rotation
        t.row = self.row
        t.col = self.col
        return t


class Board:
    def __init__(self, width: int, height_visible: int, spawn_buffer_rows: int):
        self.width = width
        self.height_visible = height_visible
        self.spawn_buffer_rows = spawn_buffer_rows
        self.height_total = height_visible + spawn_buffer_rows
        self.grid: List[List[Optional[str]]] = [
            [None for _ in range(self.width)] for _ in range(self.height_total)
        ]

    def inside(self, row: int, col: int) -> bool:
        return 0 <= row < self.height_total and 0 <= col < self.width

    def collides(self, tetromino: Tetromino) -> bool:
        for r, c in tetromino.blocks():
            if not self.inside(r, c):
                return True
            if self.grid[r][c] is not None:
                return True
        return False

    def lock_piece(self, tetromino: Tetromino) -> int:
        for r, c in tetromino.blocks():
            if 0 <= r < self.height_total:
                self.grid[r][c] = tetromino.piece_id
        return self.clear_lines()

    def clear_lines(self) -> int:
        new_grid: List[List[Optional[str]]] = []
        cleared = 0
        for r in range(self.height_total):
            if all(cell is not None for cell in self.grid[r]):
                cleared += 1
            else:
                new_grid.append(self.grid[r])
        while len(new_grid) < self.height_total:
            new_grid.insert(0, [None for _ in range(self.width)])
        self.grid = new_grid
        return cleared

    def topped_out(self) -> bool:
        # If any block exists in the spawn buffer rows after locking, game over
        for r in range(self.spawn_buffer_rows):
            if any(self.grid[r][c] is not None for c in range(self.width)):
                return True
        return False


class Game:
    def __init__(self, stdscr):
        self.stdscr = stdscr
        self.board = Board(BOARD_WIDTH, BOARD_HEIGHT, SPAWN_BUFFER_ROWS)
        self.bag = bag_generator()
        self.active: Tetromino = Tetromino(next(self.bag))
        self.next_piece_id: str = next(self.bag)
        self.held_piece_id: Optional[str] = None
        self.hold_used_on_current_drop: bool = False

        self.score: int = 0
        self.level: int = 1
        self.lines_cleared_total: int = 0

        self.drop_interval_seconds: float = self.compute_gravity_interval()
        self.last_drop_time: float = time.time()

        self.game_over: bool = False
        self.paused: bool = False

    def compute_gravity_interval(self) -> float:
        # Simple gravity: decreases with level; clamp to a minimum
        base = 0.8
        decay = 0.85 ** (self.level - 1)
        interval = max(0.05, base * decay)
        return interval

    def try_move(self, dr: int, dc: int) -> bool:
        moved = self.active.clone()
        moved.row += dr
        moved.col += dc
        if not self.board.collides(moved):
            self.active = moved
            return True
        return False

    def try_rotate(self, direction: int) -> bool:
        # direction: +1 for CW, -1 for CCW
        rotated = self.active.clone()
        rotated.rotation = (rotated.rotation + direction) % 4
        # Wall-kick attempts
        kicks = [(0, 0), (0, -1), (0, 1), (0, -2), (0, 2), (-1, 0)]
        for dr, dc in kicks:
            candidate = rotated.clone()
            candidate.row += dr
            candidate.col += dc
            if not self.board.collides(candidate):
                self.active = candidate
                return True
        return False

    def hard_drop(self) -> int:
        distance = 0
        while self.try_move(1, 0):
            distance += 1
        return distance

    def spawn_next(self):
        self.active = Tetromino(self.next_piece_id)
        self.next_piece_id = next(self.bag)
        self.hold_used_on_current_drop = False

    def hold(self):
        if self.hold_used_on_current_drop:
            return
        self.hold_used_on_current_drop = True
        current_id = self.active.piece_id
        if self.held_piece_id is None:
            self.held_piece_id = current_id
            self.spawn_next()
        else:
            self.active = Tetromino(self.held_piece_id)
            self.held_piece_id = current_id

    def soft_drop_step(self) -> bool:
        return self.try_move(1, 0)

    def gravity_step(self):
        if time.time() - self.last_drop_time >= self.drop_interval_seconds:
            if not self.try_move(1, 0):
                # Lock piece
                cleared = self.board.lock_piece(self.active)
                self.update_score_on_lock(cleared, soft_drop_cells=0, hard_drop_cells=0)
                if self.board.topped_out():
                    self.game_over = True
                    return
                self.spawn_next()
            self.last_drop_time = time.time()

    def update_score_on_lock(self, lines_cleared: int, soft_drop_cells: int, hard_drop_cells: int):
        # Standard-ish scoring
        line_scores = {0: 0, 1: 100, 2: 300, 3: 500, 4: 800}
        self.score += line_scores.get(lines_cleared, 0) * self.level
        self.score += soft_drop_cells
        self.score += hard_drop_cells * 2
        self.lines_cleared_total += lines_cleared
        # Level up every 10 lines
        new_level = 1 + self.lines_cleared_total // 10
        if new_level != self.level:
            self.level = new_level
            self.drop_interval_seconds = self.compute_gravity_interval()

    def lock_active_and_process(self, soft_drop_cells: int, hard_drop_cells: int):
        cleared = self.board.lock_piece(self.active)
        self.update_score_on_lock(cleared, soft_drop_cells, hard_drop_cells)
        if self.board.topped_out():
            self.game_over = True
            return
        self.spawn_next()
        self.last_drop_time = time.time()

    def handle_input(self) -> None:
        try:
            key = self.stdscr.getch()
        except Exception:
            key = -1
        if key == -1:
            return

        if key in (ord('q'), ord('Q')):
            self.game_over = True
            return

        if key in (ord('p'), ord('P')):
            self.paused = not self.paused
            return

        if self.paused:
            return

        soft_drop_cells = 0
        hard_drop_cells = 0

        if key in (curses.KEY_LEFT, ord('a'), ord('A')):
            self.try_move(0, -1)
        elif key in (curses.KEY_RIGHT, ord('d'), ord('D')):
            self.try_move(0, 1)
        elif key in (curses.KEY_DOWN, ord('s'), ord('S')):
            if self.soft_drop_step():
                soft_drop_cells += 1
                self.score += 1
            self.last_drop_time = time.time()
        elif key in (curses.KEY_UP, ord('x'), ord('X')):
            self.try_rotate(+1)
        elif key in (ord('z'), ord('Z')):
            self.try_rotate(-1)
        elif key == ord(' '):
            hard_drop_cells = self.hard_drop()
            self.lock_active_and_process(soft_drop_cells=0, hard_drop_cells=hard_drop_cells)
            return
        elif key in (ord('c'), ord('C'), ord('h'), ord('H')):
            self.hold()

    def draw(self):
        self.stdscr.clear()
        max_y, max_x = self.stdscr.getmaxyx()

        board_origin_y = 1
        board_origin_x = 2
        cell_width = 2  # each cell draws as two chars "[]"-like block

        # Draw border around board
        board_win_height = BOARD_HEIGHT + 2
        board_win_width = BOARD_WIDTH * cell_width + 2
        try:
            self.stdscr.attron(curses.color_pair(8))
        except Exception:
            pass
        for x in range(board_origin_x - 1, board_origin_x - 1 + board_win_width):
            self.stdscr.addch(board_origin_y - 1, x, ord('-'))
            self.stdscr.addch(board_origin_y + board_win_height - 1, x, ord('-'))
        for y in range(board_origin_y - 1, board_origin_y - 1 + board_win_height):
            self.stdscr.addch(y, board_origin_x - 1, ord('|'))
            self.stdscr.addch(y, board_origin_x - 1 + board_win_width - 1, ord('|'))
        try:
            self.stdscr.attroff(curses.color_pair(8))
        except Exception:
            pass

        # Draw fixed blocks (visible rows only)
        for r in range(SPAWN_BUFFER_ROWS, self.board.height_total):
            for c in range(self.board.width):
                pid = self.board.grid[r][c]
                if pid is None:
                    continue
                self.draw_cell(board_origin_y + (r - SPAWN_BUFFER_ROWS), board_origin_x + c * cell_width, pid)

        # Draw active piece
        if not self.game_over:
            for r, c in self.active.blocks():
                if r >= SPAWN_BUFFER_ROWS:
                    self.draw_cell(board_origin_y + (r - SPAWN_BUFFER_ROWS), board_origin_x + c * cell_width, self.active.piece_id)

        # Sidebar info
        side_x = board_origin_x + board_win_width + 2
        self.stdscr.addstr(1, side_x, f"分数: {self.score}")
        self.stdscr.addstr(2, side_x, f"等级: {self.level}")
        self.stdscr.addstr(3, side_x, f"消行: {self.lines_cleared_total}")
        self.stdscr.addstr(5, side_x, "操作: ← → ↓ 旋转↑ / Z / X")
        self.stdscr.addstr(6, side_x, "硬降: 空格  暂停: P  退出: Q")
        self.stdscr.addstr(7, side_x, "保留: C/H")

        # Next piece preview
        self.stdscr.addstr(9, side_x, "下一个:")
        self.draw_preview(self.next_piece_id, 10, side_x)

        # Hold piece preview
        self.stdscr.addstr(15, side_x, "保留中:")
        if self.held_piece_id is not None:
            self.draw_preview(self.held_piece_id, 16, side_x)
        else:
            self.stdscr.addstr(16, side_x, "(空)")

        if self.paused:
            msg = "暂停中 (P 继续)"
            self.stdscr.addstr(BOARD_HEIGHT // 2, board_origin_x + BOARD_WIDTH, msg, curses.A_BOLD)

        if self.game_over:
            msg = "游戏结束 - 按 Q 退出"
            self.stdscr.addstr(BOARD_HEIGHT // 2, board_origin_x + BOARD_WIDTH - len(msg) // 2, msg, curses.A_BOLD)

        self.stdscr.refresh()

    def draw_cell(self, y: int, x: int, piece_id: str):
        color_pair_idx = color_pair_for_piece(piece_id)
        try:
            self.stdscr.attron(curses.color_pair(color_pair_idx))
        except Exception:
            pass
        self.stdscr.addstr(y, x, "██")
        try:
            self.stdscr.attroff(curses.color_pair(color_pair_idx))
        except Exception:
            pass

    def draw_preview(self, piece_id: str, top_y: int, left_x: int):
        # Draw within a 4x4 box
        shape = get_rotated_shape(BASE_SHAPES[piece_id], 0)
        min_r = min(r for r, _ in shape)
        min_c = min(c for _, c in shape)
        # Normalize to start from (0,0)
        norm = [(r - min_r, c - min_c) for r, c in shape]
        for r, c in norm:
            self.draw_cell(top_y + r, left_x + c * 2, piece_id)


def color_pair_for_piece(piece_id: str) -> int:
    mapping = {
        "I": 1,
        "O": 2,
        "T": 3,
        "S": 4,
        "Z": 5,
        "J": 6,
        "L": 7,
    }
    return mapping.get(piece_id, 7)


def init_colors():
    if not curses.has_colors():
        return
    curses.start_color()
    # Main piece colors
    curses.init_pair(1, PIECE_COLORS["I"], curses.COLOR_BLACK)
    curses.init_pair(2, PIECE_COLORS["O"], curses.COLOR_BLACK)
    curses.init_pair(3, PIECE_COLORS["T"], curses.COLOR_BLACK)
    curses.init_pair(4, PIECE_COLORS["S"], curses.COLOR_BLACK)
    curses.init_pair(5, PIECE_COLORS["Z"], curses.COLOR_BLACK)
    curses.init_pair(6, PIECE_COLORS["J"], curses.COLOR_BLACK)
    curses.init_pair(7, PIECE_COLORS["L"], curses.COLOR_BLACK)
    # Border color
    curses.init_pair(8, curses.COLOR_WHITE, curses.COLOR_BLACK)


def run(stdscr):
    curses.curs_set(0)
    stdscr.nodelay(True)
    stdscr.keypad(True)
    curses.noecho()
    curses.cbreak()
    init_colors()

    random.seed()

    game = Game(stdscr)
    last_frame_time = time.time()

    target_fps = 60
    frame_duration = 1.0 / target_fps

    while not game.game_over:
        start = time.time()
        game.handle_input()
        if not game.paused:
            game.gravity_step()
        game.draw()

        # Frame pacing
        elapsed = time.time() - start
        if elapsed < frame_duration:
            time.sleep(frame_duration - elapsed)


def main():
    curses.wrapper(run)


if __name__ == "__main__":
    main()


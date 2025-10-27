#!/usr/bin/env python3
"""
Terminal Tetris (俄罗斯方块)
---------------------------
Controls:
  ← / h : Move left
  → / l : Move right
  ↑ / k : Rotate (clockwise)
  ↓ / j : Soft drop
  SPACE : Hard drop
  p     : Pause / resume
  q     : Quit

Requirements: Python 3 (uses standard library only, no external deps)
Run: python3 tetris.py
"""
import curses
import random
import time
from collections import deque
from typing import List, Tuple

# Board dimensions (playfield)
HEIGHT = 20
WIDTH = 10

# Speed settings (seconds per automatic drop for each level 0..n)
LEVEL_SPEEDS = [0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.25, 0.2, 0.15, 0.12, 0.1]

# Tetromino definitions: list of rotations, each rotation is list of (x, y) offsets
# Coordinates are relative to pivot at (0,0) which will be mapped onto the board
SHAPES = {
    "I": [
        [(0, 1), (1, 1), (2, 1), (3, 1)],
        [(2, 0), (2, 1), (2, 2), (2, 3)],
    ],
    "O": [
        [(1, 0), (2, 0), (1, 1), (2, 1)],
    ],
    "T": [
        [(1, 0), (0, 1), (1, 1), (2, 1)],
        [(1, 0), (1, 1), (2, 1), (1, 2)],
        [(0, 1), (1, 1), (2, 1), (1, 2)],
        [(1, 0), (0, 1), (1, 1), (1, 2)],
    ],
    "S": [
        [(1, 0), (2, 0), (0, 1), (1, 1)],
        [(1, 0), (1, 1), (2, 1), (2, 2)],
    ],
    "Z": [
        [(0, 0), (1, 0), (1, 1), (2, 1)],
        [(2, 0), (1, 1), (2, 1), (1, 2)],
    ],
    "J": [
        [(0, 0), (0, 1), (1, 1), (2, 1)],
        [(1, 0), (2, 0), (1, 1), (1, 2)],
        [(0, 1), (1, 1), (2, 1), (2, 2)],
        [(1, 0), (1, 1), (0, 2), (1, 2)],
    ],
    "L": [
        [(2, 0), (0, 1), (1, 1), (2, 1)],
        [(1, 0), (1, 1), (1, 2), (2, 2)],
        [(0, 1), (1, 1), (2, 1), (0, 2)],
        [(0, 0), (1, 0), (1, 1), (1, 2)],
    ],
}

COLORS = {
    "I": 1,
    "O": 2,
    "T": 3,
    "S": 4,
    "Z": 5,
    "J": 6,
    "L": 7,
}

def rotate(shape: List[Tuple[int, int]], clockwise: bool = True) -> List[Tuple[int, int]]:
    """Rotate coordinates 90 degrees around (0,0)."""
    if clockwise:
        return [(-y, x) for x, y in shape]
    else:
        return [(y, -x) for x, y in shape]

class Piece:
    def __init__(self, kind: str):
        self.kind = kind
        self.rotations = SHAPES[kind]
        self.rotation = 0  # index into rotations
        # Initial position (spawn near top-middle)
        self.x = WIDTH // 2 - 2
        self.y = 0

    @property
    def blocks(self) -> List[Tuple[int, int]]:
        return [(self.x + dx, self.y + dy) for dx, dy in self.rotations[self.rotation]]

    def rotate(self):
        self.rotation = (self.rotation + 1) % len(self.rotations)

    def unrotate(self):
        self.rotation = (self.rotation - 1) % len(self.rotations)

class Tetris:
    def __init__(self):
        self.board = [[0 for _ in range(WIDTH)] for _ in range(HEIGHT)]
        self.score = 0
        self.level = 0
        self.lines_cleared = 0
        self.bag = deque()
        self.next_piece = self._next_from_bag()
        self.current_piece = self._next_from_bag()
        self.game_over = False

    def _next_from_bag(self) -> Piece:
        if not self.bag:
            self.bag.extend(random.sample(list(SHAPES.keys()), len(SHAPES)))
        return Piece(self.bag.popleft())

    def _is_valid(self, blocks: List[Tuple[int, int]]) -> bool:
        for x, y in blocks:
            if x < 0 or x >= WIDTH or y < 0 or y >= HEIGHT:
                return False
            if self.board[y][x]:
                return False
        return True

    def _lock_piece(self):
        for x, y in self.current_piece.blocks:
            if 0 <= y < HEIGHT:
                self.board[y][x] = COLORS[self.current_piece.kind]
            else:
                # Piece is above the board -> game over
                self.game_over = True
        cleared = self._clear_lines()
        self.lines_cleared += cleared
        self.score += [0, 40, 100, 300, 1200][cleared] * (self.level + 1)
        self.level = self.lines_cleared // 10
        self.current_piece = self.next_piece
        self.next_piece = self._next_from_bag()
        if not self._is_valid(self.current_piece.blocks):
            self.game_over = True

    def _clear_lines(self) -> int:
        new_board = [row for row in self.board if any(cell == 0 for cell in row)]
        cleared = HEIGHT - len(new_board)
        while len(new_board) < HEIGHT:
            new_board.insert(0, [0 for _ in range(WIDTH)])
        self.board = new_board
        return cleared

    # Public interface
    def move(self, dx: int, dy: int) -> bool:
        if self.game_over:
            return False
        orig_x, orig_y = self.current_piece.x, self.current_piece.y
        self.current_piece.x += dx
        self.current_piece.y += dy
        if not self._is_valid(self.current_piece.blocks):
            self.current_piece.x, self.current_piece.y = orig_x, orig_y
            if dy:  # hitting bottom / block beneath
                self._lock_piece()
            return False
        return True

    def rotate(self):
        if self.game_over:
            return
        self.current_piece.rotate()
        if not self._is_valid(self.current_piece.blocks):
            self.current_piece.unrotate()

    def hard_drop(self):
        if self.game_over:
            return
        while self.move(0, 1):
            pass  # keep moving down until can't

    def tick(self):
        if self.game_over:
            return
        if not self.move(0, 1):
            pass  # piece locked inside move()


def draw(stdscr, game: Tetris):
    stdscr.clear()
    # Draw borders
    for y in range(HEIGHT):
        stdscr.addstr(y + 1, 0, "│")
        stdscr.addstr(y + 1, WIDTH * 2 + 1, "│")
    stdscr.addstr(0, 0, "┌" + "─" * (WIDTH * 2) + "┐")
    stdscr.addstr(HEIGHT + 1, 0, "└" + "─" * (WIDTH * 2) + "┘")

    # Draw board
    for y in range(HEIGHT):
        for x in range(WIDTH):
            color = game.board[y][x]
            if color:
                stdscr.attron(curses.color_pair(color))
                stdscr.addstr(y + 1, x * 2 + 1, "██")
                stdscr.attroff(curses.color_pair(color))
    # Draw current piece
    for x, y in game.current_piece.blocks:
        if y >= 0:
            stdscr.attron(curses.color_pair(COLORS[game.current_piece.kind]))
            stdscr.addstr(y + 1, x * 2 + 1, "██")
            stdscr.attroff(curses.color_pair(COLORS[game.current_piece.kind]))

    # Side panel
    panel_x = WIDTH * 2 + 4
    stdscr.addstr(1, panel_x, f"Score: {game.score}")
    stdscr.addstr(2, panel_x, f"Level: {game.level}")
    stdscr.addstr(3, panel_x, f"Lines: {game.lines_cleared}")
    stdscr.addstr(5, panel_x, "Next:")
    for dx, dy in game.next_piece.rotations[0]:
        stdscr.attron(curses.color_pair(COLORS[game.next_piece.kind]))
        stdscr.addstr(6 + dy, panel_x + dx * 2, "██")
        stdscr.attroff(curses.color_pair(COLORS[game.next_piece.kind]))

    if game.game_over:
        stdscr.addstr(HEIGHT // 2, WIDTH - 3, "GAME OVER", curses.A_REVERSE)

    stdscr.refresh()


def main(stdscr):
    curses.curs_set(0)
    stdscr.nodelay(True)
    stdscr.keypad(True)

    # Initialize color pairs
    curses.start_color()
    for i in range(1, 8):
        curses.init_pair(i, i, 0)

    game = Tetris()
    last_drop = time.time()
    paused = False

    while True:
        now = time.time()
        key = stdscr.getch()

        if key != -1:
            if key in (ord('q'), ord('Q')):
                break
            if key in (ord('p'), ord('P')):
                paused = not paused
            if not game.game_over and not paused:
                if key in (curses.KEY_LEFT, ord('h')):
                    game.move(-1, 0)
                elif key in (curses.KEY_RIGHT, ord('l')):
                    game.move(1, 0)
                elif key in (curses.KEY_DOWN, ord('j')):
                    game.move(0, 1)
                elif key in (curses.KEY_UP, ord('k')):
                    game.rotate()
                elif key == ord(' '):
                    game.hard_drop()
                elif key == ord('n') and game.game_over:
                    # Restart
                    game = Tetris()
                    paused = False

        if not paused and not game.game_over and now - last_drop >= LEVEL_SPEEDS[min(game.level, len(LEVEL_SPEEDS) - 1)]:
            game.tick()
            last_drop = now

        draw(stdscr, game)
        time.sleep(0.01)

if __name__ == "__main__":
    curses.wrapper(main)
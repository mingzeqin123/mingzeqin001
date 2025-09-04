#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
俄罗斯方块游戏
使用 Pygame 实现的经典俄罗斯方块游戏
"""

import pygame
import random
import sys
from typing import List, Tuple, Optional

# 初始化 Pygame
pygame.init()

# 游戏常量
GRID_WIDTH = 10
GRID_HEIGHT = 20
CELL_SIZE = 30
GRID_X_OFFSET = 50
GRID_Y_OFFSET = 50

# 计算窗口尺寸
WINDOW_WIDTH = GRID_WIDTH * CELL_SIZE + GRID_X_OFFSET * 2 + 200
WINDOW_HEIGHT = GRID_HEIGHT * CELL_SIZE + GRID_Y_OFFSET * 2

# 颜色定义
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
CYAN = (0, 255, 255)
BLUE = (0, 0, 255)
ORANGE = (255, 165, 0)
YELLOW = (255, 255, 0)
GREEN = (0, 255, 0)
PURPLE = (128, 0, 128)
RED = (255, 0, 0)
GRAY = (128, 128, 128)
DARK_GRAY = (64, 64, 64)

# 方块形状定义 (使用相对坐标)
TETROMINOS = {
    'I': {
        'shape': [
            ['.....',
             '..#..',
             '..#..',
             '..#..',
             '..#..'],
            ['.....',
             '.....',
             '####.',
             '.....',
             '.....']
        ],
        'color': CYAN
    },
    'O': {
        'shape': [
            ['.....',
             '.....',
             '.##..',
             '.##..',
             '.....']
        ],
        'color': YELLOW
    },
    'T': {
        'shape': [
            ['.....',
             '.....',
             '.#...',
             '###..',
             '.....'],
            ['.....',
             '.....',
             '.#...',
             '.##..',
             '.#...'],
            ['.....',
             '.....',
             '.....',
             '###..',
             '.#...'],
            ['.....',
             '.....',
             '.#...',
             '##...',
             '.#...']
        ],
        'color': PURPLE
    },
    'S': {
        'shape': [
            ['.....',
             '.....',
             '.##..',
             '##...',
             '.....'],
            ['.....',
             '.#...',
             '.##..',
             '..#..',
             '.....']
        ],
        'color': GREEN
    },
    'Z': {
        'shape': [
            ['.....',
             '.....',
             '##...',
             '.##..',
             '.....'],
            ['.....',
             '..#..',
             '.##..',
             '.#...',
             '.....']
        ],
        'color': RED
    },
    'J': {
        'shape': [
            ['.....',
             '.#...',
             '.#...',
             '##...',
             '.....'],
            ['.....',
             '.....',
             '#....',
             '###..',
             '.....'],
            ['.....',
             '.##..',
             '.#...',
             '.#...',
             '.....'],
            ['.....',
             '.....',
             '###..',
             '..#..',
             '.....']
        ],
        'color': BLUE
    },
    'L': {
        'shape': [
            ['.....',
             '..#..',
             '..#..',
             '.##..',
             '.....'],
            ['.....',
             '.....',
             '###..',
             '#....',
             '.....'],
            ['.....',
             '##...',
             '.#...',
             '.#...',
             '.....'],
            ['.....',
             '.....',
             '..#..',
             '###..',
             '.....']
        ],
        'color': ORANGE
    }
}


class Tetromino:
    """俄罗斯方块类"""
    
    def __init__(self, x: int, y: int):
        self.x = x
        self.y = y
        self.type = random.choice(list(TETROMINOS.keys()))
        self.rotation = 0
        self.color = TETROMINOS[self.type]['color']
    
    def get_shape(self) -> List[str]:
        """获取当前旋转状态下的形状"""
        shapes = TETROMINOS[self.type]['shape']
        return shapes[self.rotation % len(shapes)]
    
    def get_cells(self) -> List[Tuple[int, int]]:
        """获取方块占用的所有格子坐标"""
        cells = []
        shape = self.get_shape()
        for dy, row in enumerate(shape):
            for dx, cell in enumerate(row):
                if cell == '#':
                    cells.append((self.x + dx, self.y + dy))
        return cells
    
    def rotate(self):
        """旋转方块"""
        shapes = TETROMINOS[self.type]['shape']
        self.rotation = (self.rotation + 1) % len(shapes)
    
    def move(self, dx: int, dy: int):
        """移动方块"""
        self.x += dx
        self.y += dy


class TetrisGame:
    """俄罗斯方块游戏主类"""
    
    def __init__(self):
        self.grid = [[BLACK for _ in range(GRID_WIDTH)] for _ in range(GRID_HEIGHT)]
        self.current_piece: Optional[Tetromino] = None
        self.next_piece: Optional[Tetromino] = None
        self.score = 0
        self.lines_cleared = 0
        self.level = 1
        self.fall_time = 0
        self.fall_speed = 500  # 毫秒
        self.game_over = False
        
        # 创建显示表面
        self.screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
        pygame.display.set_caption("俄罗斯方块")
        
        # 字体
        self.font = pygame.font.Font(None, 36)
        self.small_font = pygame.font.Font(None, 24)
        
        # 生成第一个方块
        self.spawn_piece()
        self.spawn_next_piece()
    
    def spawn_piece(self):
        """生成新方块"""
        if self.next_piece:
            self.current_piece = self.next_piece
            self.current_piece.x = GRID_WIDTH // 2 - 2
            self.current_piece.y = 0
        else:
            self.current_piece = Tetromino(GRID_WIDTH // 2 - 2, 0)
        
        # 检查游戏结束
        if self.is_collision(self.current_piece):
            self.game_over = True
    
    def spawn_next_piece(self):
        """生成下一个方块"""
        self.next_piece = Tetromino(0, 0)
    
    def is_collision(self, piece: Tetromino, dx: int = 0, dy: int = 0) -> bool:
        """检查碰撞"""
        for x, y in piece.get_cells():
            new_x, new_y = x + dx, y + dy
            
            # 检查边界
            if new_x < 0 or new_x >= GRID_WIDTH or new_y >= GRID_HEIGHT:
                return True
            
            # 检查与已放置方块的碰撞
            if new_y >= 0 and self.grid[new_y][new_x] != BLACK:
                return True
        
        return False
    
    def place_piece(self, piece: Tetromino):
        """放置方块到游戏板上"""
        for x, y in piece.get_cells():
            if y >= 0:
                self.grid[y][x] = piece.color
        
        # 检查并清除满行
        self.clear_lines()
        
        # 生成新方块
        self.spawn_piece()
        self.spawn_next_piece()
    
    def clear_lines(self):
        """清除满行"""
        lines_to_clear = []
        
        # 找到满行
        for y in range(GRID_HEIGHT):
            if all(cell != BLACK for cell in self.grid[y]):
                lines_to_clear.append(y)
        
        # 清除满行并计分
        for y in reversed(lines_to_clear):
            del self.grid[y]
            self.grid.insert(0, [BLACK for _ in range(GRID_WIDTH)])
        
        # 更新分数和等级
        lines_cleared = len(lines_to_clear)
        if lines_cleared > 0:
            self.lines_cleared += lines_cleared
            self.score += lines_cleared * 100 * self.level
            
            # 根据消除行数给额外分数
            if lines_cleared == 4:  # Tetris
                self.score += 400 * self.level
            
            # 更新等级和速度
            new_level = self.lines_cleared // 10 + 1
            if new_level > self.level:
                self.level = new_level
                self.fall_speed = max(50, 500 - (self.level - 1) * 50)
    
    def move_piece(self, dx: int, dy: int) -> bool:
        """移动当前方块"""
        if not self.current_piece:
            return False
        
        if not self.is_collision(self.current_piece, dx, dy):
            self.current_piece.move(dx, dy)
            return True
        return False
    
    def rotate_piece(self) -> bool:
        """旋转当前方块"""
        if not self.current_piece:
            return False
        
        original_rotation = self.current_piece.rotation
        self.current_piece.rotate()
        
        if self.is_collision(self.current_piece):
            # 尝试墙踢 (Wall Kick)
            kick_tests = [(0, 0), (-1, 0), (1, 0), (0, -1), (-1, -1), (1, -1)]
            
            for dx, dy in kick_tests:
                if not self.is_collision(self.current_piece, dx, dy):
                    self.current_piece.move(dx, dy)
                    return True
            
            # 如果所有踢墙尝试都失败，恢复原来的旋转
            self.current_piece.rotation = original_rotation
            return False
        
        return True
    
    def hard_drop(self):
        """硬降（瞬间下落到底部）"""
        if not self.current_piece:
            return
        
        drop_distance = 0
        while not self.is_collision(self.current_piece, 0, 1):
            self.current_piece.move(0, 1)
            drop_distance += 1
        
        # 硬降给额外分数
        self.score += drop_distance * 2
        
        # 立即放置方块
        self.place_piece(self.current_piece)
    
    def update(self, dt: int):
        """更新游戏状态"""
        if self.game_over or not self.current_piece:
            return
        
        self.fall_time += dt
        
        # 自动下落
        if self.fall_time >= self.fall_speed:
            if not self.move_piece(0, 1):
                self.place_piece(self.current_piece)
            self.fall_time = 0
    
    def draw_grid(self):
        """绘制游戏网格"""
        # 绘制网格线
        for x in range(GRID_WIDTH + 1):
            pygame.draw.line(
                self.screen, GRAY,
                (GRID_X_OFFSET + x * CELL_SIZE, GRID_Y_OFFSET),
                (GRID_X_OFFSET + x * CELL_SIZE, GRID_Y_OFFSET + GRID_HEIGHT * CELL_SIZE)
            )
        
        for y in range(GRID_HEIGHT + 1):
            pygame.draw.line(
                self.screen, GRAY,
                (GRID_X_OFFSET, GRID_Y_OFFSET + y * CELL_SIZE),
                (GRID_X_OFFSET + GRID_WIDTH * CELL_SIZE, GRID_Y_OFFSET + y * CELL_SIZE)
            )
    
    def draw_piece(self, piece: Tetromino, offset_x: int = 0, offset_y: int = 0):
        """绘制方块"""
        for x, y in piece.get_cells():
            screen_x = GRID_X_OFFSET + (x + offset_x) * CELL_SIZE
            screen_y = GRID_Y_OFFSET + (y + offset_y) * CELL_SIZE
            
            if 0 <= x + offset_x < GRID_WIDTH and 0 <= y + offset_y < GRID_HEIGHT:
                pygame.draw.rect(
                    self.screen, piece.color,
                    (screen_x + 1, screen_y + 1, CELL_SIZE - 2, CELL_SIZE - 2)
                )
    
    def draw_ghost_piece(self):
        """绘制幽灵方块（显示当前方块的落点）"""
        if not self.current_piece:
            return
        
        # 创建幽灵方块
        ghost = Tetromino(self.current_piece.x, self.current_piece.y)
        ghost.type = self.current_piece.type
        ghost.rotation = self.current_piece.rotation
        
        # 将幽灵方块移动到最底部
        while not self.is_collision(ghost, 0, 1):
            ghost.move(0, 1)
        
        # 绘制幽灵方块（半透明效果）
        ghost_surface = pygame.Surface((CELL_SIZE - 2, CELL_SIZE - 2))
        ghost_surface.set_alpha(100)
        ghost_surface.fill(self.current_piece.color)
        
        for x, y in ghost.get_cells():
            if 0 <= x < GRID_WIDTH and 0 <= y < GRID_HEIGHT:
                screen_x = GRID_X_OFFSET + x * CELL_SIZE + 1
                screen_y = GRID_Y_OFFSET + y * CELL_SIZE + 1
                self.screen.blit(ghost_surface, (screen_x, screen_y))
    
    def draw_next_piece(self):
        """绘制下一个方块"""
        if not self.next_piece:
            return
        
        # 下一个方块显示区域
        next_x = GRID_X_OFFSET + GRID_WIDTH * CELL_SIZE + 20
        next_y = GRID_Y_OFFSET + 50
        
        # 绘制标题
        text = self.font.render("下一个:", True, WHITE)
        self.screen.blit(text, (next_x, next_y - 30))
        
        # 绘制下一个方块
        shape = self.next_piece.get_shape()
        for dy, row in enumerate(shape):
            for dx, cell in enumerate(row):
                if cell == '#':
                    pygame.draw.rect(
                        self.screen, self.next_piece.color,
                        (next_x + dx * 20, next_y + dy * 20, 18, 18)
                    )
    
    def draw_ui(self):
        """绘制用户界面"""
        ui_x = GRID_X_OFFSET + GRID_WIDTH * CELL_SIZE + 20
        ui_y = GRID_Y_OFFSET + 150
        
        # 分数
        score_text = self.font.render(f"分数: {self.score}", True, WHITE)
        self.screen.blit(score_text, (ui_x, ui_y))
        
        # 等级
        level_text = self.font.render(f"等级: {self.level}", True, WHITE)
        self.screen.blit(level_text, (ui_x, ui_y + 40))
        
        # 消除行数
        lines_text = self.font.render(f"行数: {self.lines_cleared}", True, WHITE)
        self.screen.blit(lines_text, (ui_x, ui_y + 80))
        
        # 控制说明
        controls_y = ui_y + 140
        controls = [
            "控制:",
            "A/D - 左右移动",
            "S - 软降",
            "W - 旋转",
            "空格 - 硬降",
            "P - 暂停",
            "R - 重新开始"
        ]
        
        for i, text in enumerate(controls):
            color = WHITE if i == 0 else GRAY
            font = self.font if i == 0 else self.small_font
            control_text = font.render(text, True, color)
            self.screen.blit(control_text, (ui_x, controls_y + i * 25))
    
    def draw(self):
        """绘制游戏"""
        self.screen.fill(BLACK)
        
        # 绘制已放置的方块
        for y, row in enumerate(self.grid):
            for x, color in enumerate(row):
                if color != BLACK:
                    pygame.draw.rect(
                        self.screen, color,
                        (GRID_X_OFFSET + x * CELL_SIZE + 1,
                         GRID_Y_OFFSET + y * CELL_SIZE + 1,
                         CELL_SIZE - 2, CELL_SIZE - 2)
                    )
        
        # 绘制网格
        self.draw_grid()
        
        # 绘制幽灵方块
        if self.current_piece:
            self.draw_ghost_piece()
        
        # 绘制当前方块
        if self.current_piece:
            self.draw_piece(self.current_piece)
        
        # 绘制下一个方块
        self.draw_next_piece()
        
        # 绘制UI
        self.draw_ui()
        
        # 游戏结束画面
        if self.game_over:
            overlay = pygame.Surface((WINDOW_WIDTH, WINDOW_HEIGHT))
            overlay.set_alpha(128)
            overlay.fill(BLACK)
            self.screen.blit(overlay, (0, 0))
            
            game_over_text = self.font.render("游戏结束!", True, WHITE)
            restart_text = self.small_font.render("按 R 重新开始", True, WHITE)
            
            text_rect = game_over_text.get_rect(center=(WINDOW_WIDTH // 2, WINDOW_HEIGHT // 2))
            restart_rect = restart_text.get_rect(center=(WINDOW_WIDTH // 2, WINDOW_HEIGHT // 2 + 40))
            
            self.screen.blit(game_over_text, text_rect)
            self.screen.blit(restart_text, restart_rect)
        
        pygame.display.flip()
    
    def reset(self):
        """重置游戏"""
        self.grid = [[BLACK for _ in range(GRID_WIDTH)] for _ in range(GRID_HEIGHT)]
        self.current_piece = None
        self.next_piece = None
        self.score = 0
        self.lines_cleared = 0
        self.level = 1
        self.fall_time = 0
        self.fall_speed = 500
        self.game_over = False
        
        self.spawn_piece()
        self.spawn_next_piece()


def main():
    """主函数"""
    game = TetrisGame()
    clock = pygame.time.Clock()
    paused = False
    
    print("俄罗斯方块游戏启动!")
    print("控制说明:")
    print("A/D - 左右移动")
    print("S - 软降")
    print("W - 旋转")
    print("空格 - 硬降")
    print("P - 暂停")
    print("R - 重新开始")
    print("ESC - 退出游戏")
    
    while True:
        dt = clock.tick(60)
        
        # 处理事件
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    pygame.quit()
                    sys.exit()
                
                elif event.key == pygame.K_r:
                    game.reset()
                    paused = False
                
                elif event.key == pygame.K_p:
                    paused = not paused
                
                elif not game.game_over and not paused:
                    if event.key == pygame.K_a:
                        game.move_piece(-1, 0)
                    elif event.key == pygame.K_d:
                        game.move_piece(1, 0)
                    elif event.key == pygame.K_s:
                        game.move_piece(0, 1)
                    elif event.key == pygame.K_w:
                        game.rotate_piece()
                    elif event.key == pygame.K_SPACE:
                        game.hard_drop()
        
        # 更新游戏状态
        if not paused:
            game.update(dt)
        
        # 绘制游戏
        game.draw()
        
        # 显示暂停信息
        if paused and not game.game_over:
            overlay = pygame.Surface((WINDOW_WIDTH, WINDOW_HEIGHT))
            overlay.set_alpha(128)
            overlay.fill(BLACK)
            game.screen.blit(overlay, (0, 0))
            
            pause_text = game.font.render("游戏暂停", True, WHITE)
            continue_text = game.small_font.render("按 P 继续", True, WHITE)
            
            pause_rect = pause_text.get_rect(center=(WINDOW_WIDTH // 2, WINDOW_HEIGHT // 2))
            continue_rect = continue_text.get_rect(center=(WINDOW_WIDTH // 2, WINDOW_HEIGHT // 2 + 40))
            
            game.screen.blit(pause_text, pause_rect)
            game.screen.blit(continue_text, continue_rect)
            
            pygame.display.flip()


if __name__ == "__main__":
    main()
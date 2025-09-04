#!/usr/bin/env python3
"""
俄罗斯方块游戏 (Tetris Game)
使用 Pygame 实现的经典俄罗斯方块游戏
"""

import pygame
import random
import sys

# 初始化 Pygame
pygame.init()

# 游戏常量
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600
GRID_WIDTH = 10
GRID_HEIGHT = 20
CELL_SIZE = 25
GAME_AREA_WIDTH = GRID_WIDTH * CELL_SIZE
GAME_AREA_HEIGHT = GRID_HEIGHT * CELL_SIZE

# 游戏区域位置
GAME_AREA_X = (SCREEN_WIDTH - GAME_AREA_WIDTH) // 2
GAME_AREA_Y = 50

# 颜色定义
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
GRAY = (128, 128, 128)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 0, 255)
CYAN = (0, 255, 255)
MAGENTA = (255, 0, 255)
YELLOW = (255, 255, 0)
ORANGE = (255, 165, 0)

# 方块形状定义 (7种经典俄罗斯方块)
SHAPES = [
    # I 形
    [[1, 1, 1, 1]],
    
    # O 形
    [[1, 1],
     [1, 1]],
    
    # T 形
    [[0, 1, 0],
     [1, 1, 1]],
    
    # S 形
    [[0, 1, 1],
     [1, 1, 0]],
    
    # Z 形
    [[1, 1, 0],
     [0, 1, 1]],
    
    # J 形
    [[1, 0, 0],
     [1, 1, 1]],
    
    # L 形
    [[0, 0, 1],
     [1, 1, 1]]
]

# 方块颜色
COLORS = [CYAN, YELLOW, MAGENTA, GREEN, RED, BLUE, ORANGE]


class Piece:
    """方块类"""
    def __init__(self, x, y, shape_index):
        self.x = x
        self.y = y
        self.shape_index = shape_index
        self.shape = SHAPES[shape_index]
        self.color = COLORS[shape_index]
        self.rotation = 0
    
    def rotate(self):
        """旋转方块"""
        # 转置矩阵然后反转每一行
        self.shape = [list(row) for row in zip(*self.shape[::-1])]
    
    def get_shape(self):
        """获取当前形状"""
        return self.shape
    
    def get_ghost_position(self, board):
        """获取阴影位置（方块下落的最终位置）"""
        ghost_y = self.y
        while not board.check_collision(self, 0, ghost_y - self.y + 1):
            ghost_y += 1
        return ghost_y


class Board:
    """游戏板类"""
    def __init__(self):
        self.grid = [[0 for _ in range(GRID_WIDTH)] for _ in range(GRID_HEIGHT)]
        self.score = 0
        self.lines_cleared = 0
        self.level = 1
    
    def check_collision(self, piece, dx, dy):
        """检查碰撞"""
        shape = piece.get_shape()
        for y, row in enumerate(shape):
            for x, cell in enumerate(row):
                if cell:
                    new_x = piece.x + x + dx
                    new_y = piece.y + y + dy
                    
                    # 检查边界
                    if new_x < 0 or new_x >= GRID_WIDTH or new_y >= GRID_HEIGHT:
                        return True
                    
                    # 检查与已有方块的碰撞
                    if new_y >= 0 and self.grid[new_y][new_x]:
                        return True
        return False
    
    def place_piece(self, piece):
        """放置方块"""
        shape = piece.get_shape()
        for y, row in enumerate(shape):
            for x, cell in enumerate(row):
                if cell:
                    self.grid[piece.y + y][piece.x + x] = piece.color
    
    def clear_lines(self):
        """清除完整的行"""
        lines_to_clear = []
        
        # 找出完整的行
        for y in range(GRID_HEIGHT):
            if all(self.grid[y]):
                lines_to_clear.append(y)
        
        # 清除行并下移
        for y in lines_to_clear:
            del self.grid[y]
            self.grid.insert(0, [0 for _ in range(GRID_WIDTH)])
        
        # 更新分数
        if lines_to_clear:
            self.lines_cleared += len(lines_to_clear)
            self.score += len(lines_to_clear) * 100 * self.level
            self.level = min(10, 1 + self.lines_cleared // 10)
        
        return len(lines_to_clear)
    
    def is_game_over(self):
        """检查游戏是否结束"""
        return any(self.grid[0])


class TetrisGame:
    """俄罗斯方块游戏主类"""
    def __init__(self):
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("俄罗斯方块 - Tetris")
        self.clock = pygame.time.Clock()
        self.font = pygame.font.Font(None, 36)
        self.small_font = pygame.font.Font(None, 24)
        
        self.board = Board()
        self.current_piece = self.new_piece()
        self.next_piece = self.new_piece()
        self.fall_time = 0
        self.fall_speed = 500  # 毫秒
        self.game_over = False
        self.paused = False
    
    def new_piece(self):
        """创建新方块"""
        shape_index = random.randint(0, len(SHAPES) - 1)
        piece = Piece(GRID_WIDTH // 2 - 1, 0, shape_index)
        return piece
    
    def draw_grid(self):
        """绘制网格"""
        # 绘制游戏区域背景
        pygame.draw.rect(self.screen, BLACK, 
                        (GAME_AREA_X, GAME_AREA_Y, GAME_AREA_WIDTH, GAME_AREA_HEIGHT))
        
        # 绘制网格线
        for x in range(GRID_WIDTH + 1):
            pygame.draw.line(self.screen, GRAY,
                           (GAME_AREA_X + x * CELL_SIZE, GAME_AREA_Y),
                           (GAME_AREA_X + x * CELL_SIZE, GAME_AREA_Y + GAME_AREA_HEIGHT))
        
        for y in range(GRID_HEIGHT + 1):
            pygame.draw.line(self.screen, GRAY,
                           (GAME_AREA_X, GAME_AREA_Y + y * CELL_SIZE),
                           (GAME_AREA_X + GAME_AREA_WIDTH, GAME_AREA_Y + y * CELL_SIZE))
    
    def draw_piece(self, piece, offset_x=0, offset_y=0, ghost=False):
        """绘制方块"""
        shape = piece.get_shape()
        color = piece.color if not ghost else (50, 50, 50)
        
        for y, row in enumerate(shape):
            for x, cell in enumerate(row):
                if cell:
                    rect = pygame.Rect(
                        GAME_AREA_X + (piece.x + x + offset_x) * CELL_SIZE,
                        GAME_AREA_Y + (piece.y + y + offset_y) * CELL_SIZE,
                        CELL_SIZE - 1, CELL_SIZE - 1
                    )
                    pygame.draw.rect(self.screen, color, rect)
                    if not ghost:
                        pygame.draw.rect(self.screen, WHITE, rect, 1)
    
    def draw_board(self):
        """绘制游戏板"""
        for y in range(GRID_HEIGHT):
            for x in range(GRID_WIDTH):
                if self.board.grid[y][x]:
                    rect = pygame.Rect(
                        GAME_AREA_X + x * CELL_SIZE,
                        GAME_AREA_Y + y * CELL_SIZE,
                        CELL_SIZE - 1, CELL_SIZE - 1
                    )
                    pygame.draw.rect(self.screen, self.board.grid[y][x], rect)
                    pygame.draw.rect(self.screen, WHITE, rect, 1)
    
    def draw_info(self):
        """绘制游戏信息"""
        # 分数
        score_text = self.font.render(f"分数: {self.board.score}", True, WHITE)
        self.screen.blit(score_text, (50, 50))
        
        # 等级
        level_text = self.font.render(f"等级: {self.board.level}", True, WHITE)
        self.screen.blit(level_text, (50, 100))
        
        # 行数
        lines_text = self.font.render(f"行数: {self.board.lines_cleared}", True, WHITE)
        self.screen.blit(lines_text, (50, 150))
        
        # 下一个方块
        next_text = self.font.render("下一个:", True, WHITE)
        self.screen.blit(next_text, (SCREEN_WIDTH - 200, 50))
        
        # 绘制下一个方块
        next_piece_temp = Piece(0, 0, self.next_piece.shape_index)
        for y, row in enumerate(next_piece_temp.get_shape()):
            for x, cell in enumerate(row):
                if cell:
                    rect = pygame.Rect(
                        SCREEN_WIDTH - 180 + x * 20,
                        100 + y * 20,
                        19, 19
                    )
                    pygame.draw.rect(self.screen, next_piece_temp.color, rect)
                    pygame.draw.rect(self.screen, WHITE, rect, 1)
        
        # 控制说明
        controls = [
            "控制:",
            "← → : 移动",
            "↓ : 加速下落",
            "↑ : 旋转",
            "空格 : 直接落下",
            "P : 暂停",
            "R : 重新开始"
        ]
        
        y_offset = 250
        for text in controls:
            control_text = self.small_font.render(text, True, WHITE)
            self.screen.blit(control_text, (SCREEN_WIDTH - 200, y_offset))
            y_offset += 25
    
    def handle_input(self):
        """处理输入"""
        keys = pygame.key.get_pressed()
        
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return False
            
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_p:
                    self.paused = not self.paused
                
                if event.key == pygame.K_r:
                    self.__init__()
                
                if not self.paused and not self.game_over:
                    if event.key == pygame.K_LEFT:
                        if not self.board.check_collision(self.current_piece, -1, 0):
                            self.current_piece.x -= 1
                    
                    elif event.key == pygame.K_RIGHT:
                        if not self.board.check_collision(self.current_piece, 1, 0):
                            self.current_piece.x += 1
                    
                    elif event.key == pygame.K_UP:
                        # 尝试旋转
                        old_shape = self.current_piece.shape
                        self.current_piece.rotate()
                        if self.board.check_collision(self.current_piece, 0, 0):
                            self.current_piece.shape = old_shape
                    
                    elif event.key == pygame.K_SPACE:
                        # 直接落到底部
                        while not self.board.check_collision(self.current_piece, 0, 1):
                            self.current_piece.y += 1
                        self.place_current_piece()
        
        # 持续按下的键
        if not self.paused and not self.game_over:
            if keys[pygame.K_DOWN]:
                if not self.board.check_collision(self.current_piece, 0, 1):
                    self.current_piece.y += 1
                    self.fall_time = 0
        
        return True
    
    def place_current_piece(self):
        """放置当前方块并生成新方块"""
        self.board.place_piece(self.current_piece)
        lines_cleared = self.board.clear_lines()
        
        self.current_piece = self.next_piece
        self.next_piece = self.new_piece()
        
        # 检查游戏结束
        if self.board.check_collision(self.current_piece, 0, 0):
            self.game_over = True
    
    def update(self, dt):
        """更新游戏状态"""
        if self.paused or self.game_over:
            return
        
        # 更新下落速度
        self.fall_speed = max(100, 500 - (self.board.level - 1) * 50)
        
        # 自动下落
        self.fall_time += dt
        if self.fall_time >= self.fall_speed:
            if not self.board.check_collision(self.current_piece, 0, 1):
                self.current_piece.y += 1
            else:
                self.place_current_piece()
            self.fall_time = 0
    
    def draw(self):
        """绘制游戏"""
        self.screen.fill((20, 20, 20))
        
        self.draw_grid()
        self.draw_board()
        
        if not self.game_over:
            # 绘制阴影
            ghost_y = self.current_piece.get_ghost_position(self.board)
            ghost_piece = Piece(self.current_piece.x, ghost_y, self.current_piece.shape_index)
            ghost_piece.shape = self.current_piece.shape
            self.draw_piece(ghost_piece, ghost=True)
            
            # 绘制当前方块
            self.draw_piece(self.current_piece)
        
        self.draw_info()
        
        # 绘制暂停或游戏结束信息
        if self.paused:
            pause_text = self.font.render("暂停", True, YELLOW)
            text_rect = pause_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2))
            self.screen.blit(pause_text, text_rect)
        
        if self.game_over:
            game_over_text = self.font.render("游戏结束!", True, RED)
            text_rect = game_over_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2))
            self.screen.blit(game_over_text, text_rect)
            
            restart_text = self.small_font.render("按 R 重新开始", True, WHITE)
            text_rect = restart_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 40))
            self.screen.blit(restart_text, text_rect)
        
        pygame.display.flip()
    
    def run(self):
        """运行游戏主循环"""
        running = True
        
        while running:
            dt = self.clock.tick(60)  # 60 FPS
            
            running = self.handle_input()
            self.update(dt)
            self.draw()
        
        pygame.quit()
        sys.exit()


def main():
    """主函数"""
    game = TetrisGame()
    game.run()


if __name__ == "__main__":
    main()
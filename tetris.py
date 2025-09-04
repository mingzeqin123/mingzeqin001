import pygame
import random
import sys

# 初始化pygame
pygame.init()

# 游戏常量
GRID_WIDTH = 10
GRID_HEIGHT = 20
CELL_SIZE = 30
GRID_X_OFFSET = 50
GRID_Y_OFFSET = 50

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

# 俄罗斯方块形状定义
SHAPES = [
    # I形状
    [['.....',
      '..#..',
      '..#..',
      '..#..',
      '..#..'],
     ['.....',
      '.....',
      '####.',
      '.....',
      '.....']],
    
    # O形状
    [['.....',
      '.....',
      '.##..',
      '.##..',
      '.....']],
    
    # T形状
    [['.....',
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
      '.#...']],
    
    # S形状
    [['.....',
      '.....',
      '.##..',
      '##...',
      '.....'],
     ['.....',
      '.#...',
      '.##..',
      '..#..',
      '.....']],
    
    # Z形状
    [['.....',
      '.....',
      '##...',
      '.##..',
      '.....'],
     ['.....',
      '..#..',
      '.##..',
      '.#...',
      '.....']],
    
    # J形状
    [['.....',
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
      '.....']],
    
    # L形状
    [['.....',
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
      '.....']]
]

SHAPE_COLORS = [CYAN, YELLOW, PURPLE, GREEN, RED, BLUE, ORANGE]

class Tetris:
    def __init__(self):
        self.grid = [[BLACK for _ in range(GRID_WIDTH)] for _ in range(GRID_HEIGHT)]
        self.current_piece = self.get_new_piece()
        self.next_piece = self.get_new_piece()
        self.score = 0
        self.level = 1
        self.lines_cleared = 0
        self.fall_time = 0
        self.fall_speed = 500  # 毫秒
        
    def get_new_piece(self):
        shape_idx = random.randint(0, len(SHAPES) - 1)
        rotation = 0
        x = GRID_WIDTH // 2 - 2
        y = 0
        return {
            'shape': SHAPES[shape_idx],
            'color': SHAPE_COLORS[shape_idx],
            'rotation': rotation,
            'x': x,
            'y': y
        }
    
    def is_valid_position(self, piece, dx=0, dy=0, rotation=None):
        if rotation is None:
            rotation = piece['rotation']
        
        shape = piece['shape'][rotation % len(piece['shape'])]
        
        for y, row in enumerate(shape):
            for x, cell in enumerate(row):
                if cell == '#':
                    new_x = piece['x'] + x + dx
                    new_y = piece['y'] + y + dy
                    
                    # 检查边界
                    if new_x < 0 or new_x >= GRID_WIDTH or new_y >= GRID_HEIGHT:
                        return False
                    
                    # 检查是否与已有方块碰撞
                    if new_y >= 0 and self.grid[new_y][new_x] != BLACK:
                        return False
        
        return True
    
    def place_piece(self, piece):
        shape = piece['shape'][piece['rotation'] % len(piece['shape'])]
        
        for y, row in enumerate(shape):
            for x, cell in enumerate(row):
                if cell == '#':
                    grid_x = piece['x'] + x
                    grid_y = piece['y'] + y
                    if grid_y >= 0:
                        self.grid[grid_y][grid_x] = piece['color']
    
    def clear_lines(self):
        lines_to_clear = []
        
        for y in range(GRID_HEIGHT):
            if all(cell != BLACK for cell in self.grid[y]):
                lines_to_clear.append(y)
        
        # 清除满行
        for y in lines_to_clear:
            del self.grid[y]
            self.grid.insert(0, [BLACK for _ in range(GRID_WIDTH)])
        
        # 更新分数和等级
        if lines_to_clear:
            self.lines_cleared += len(lines_to_clear)
            self.score += len(lines_to_clear) * 100 * self.level
            self.level = self.lines_cleared // 10 + 1
            self.fall_speed = max(50, 500 - (self.level - 1) * 50)
    
    def move_piece(self, dx, dy):
        if self.is_valid_position(self.current_piece, dx, dy):
            self.current_piece['x'] += dx
            self.current_piece['y'] += dy
            return True
        return False
    
    def rotate_piece(self):
        new_rotation = (self.current_piece['rotation'] + 1) % len(self.current_piece['shape'])
        if self.is_valid_position(self.current_piece, rotation=new_rotation):
            self.current_piece['rotation'] = new_rotation
            return True
        return False
    
    def drop_piece(self):
        if not self.move_piece(0, 1):
            self.place_piece(self.current_piece)
            self.clear_lines()
            self.current_piece = self.next_piece
            self.next_piece = self.get_new_piece()
            
            # 检查游戏结束
            if not self.is_valid_position(self.current_piece):
                return False
        return True
    
    def update(self, dt):
        self.fall_time += dt
        if self.fall_time >= self.fall_speed:
            self.fall_time = 0
            return self.drop_piece()
        return True

class Game:
    def __init__(self):
        self.screen = pygame.display.set_mode((400, 600))
        pygame.display.set_caption("俄罗斯方块")
        self.clock = pygame.time.Clock()
        self.font = pygame.font.Font(None, 36)
        self.small_font = pygame.font.Font(None, 24)
        self.tetris = Tetris()
        self.running = True
        self.game_over = False
    
    def draw_grid(self):
        # 绘制网格背景
        for y in range(GRID_HEIGHT):
            for x in range(GRID_WIDTH):
                rect = pygame.Rect(
                    GRID_X_OFFSET + x * CELL_SIZE,
                    GRID_Y_OFFSET + y * CELL_SIZE,
                    CELL_SIZE,
                    CELL_SIZE
                )
                pygame.draw.rect(self.screen, self.tetris.grid[y][x], rect)
                pygame.draw.rect(self.screen, WHITE, rect, 1)
    
    def draw_piece(self, piece, offset_x=0, offset_y=0):
        shape = piece['shape'][piece['rotation'] % len(piece['shape'])]
        
        for y, row in enumerate(shape):
            for x, cell in enumerate(row):
                if cell == '#':
                    rect = pygame.Rect(
                        GRID_X_OFFSET + (piece['x'] + x + offset_x) * CELL_SIZE,
                        GRID_Y_OFFSET + (piece['y'] + y + offset_y) * CELL_SIZE,
                        CELL_SIZE,
                        CELL_SIZE
                    )
                    pygame.draw.rect(self.screen, piece['color'], rect)
                    pygame.draw.rect(self.screen, WHITE, rect, 1)
    
    def draw_next_piece(self):
        # 绘制下一个方块预览
        next_text = self.small_font.render("下一个:", True, WHITE)
        self.screen.blit(next_text, (300, 100))
        
        # 计算下一个方块的显示位置
        shape = self.tetris.next_piece['shape'][0]
        start_x = 320
        start_y = 130
        
        for y, row in enumerate(shape):
            for x, cell in enumerate(row):
                if cell == '#':
                    rect = pygame.Rect(
                        start_x + x * 20,
                        start_y + y * 20,
                        20,
                        20
                    )
                    pygame.draw.rect(self.screen, self.tetris.next_piece['color'], rect)
                    pygame.draw.rect(self.screen, WHITE, rect, 1)
    
    def draw_info(self):
        # 绘制分数、等级等信息
        score_text = self.small_font.render(f"分数: {self.tetris.score}", True, WHITE)
        level_text = self.small_font.render(f"等级: {self.tetris.level}", True, WHITE)
        lines_text = self.small_font.render(f"消除行数: {self.tetris.lines_cleared}", True, WHITE)
        
        self.screen.blit(score_text, (300, 200))
        self.screen.blit(level_text, (300, 230))
        self.screen.blit(lines_text, (300, 260))
    
    def draw_game_over(self):
        # 绘制游戏结束界面
        game_over_text = self.font.render("游戏结束!", True, WHITE)
        restart_text = self.small_font.render("按R重新开始", True, WHITE)
        
        text_rect = game_over_text.get_rect(center=(200, 250))
        restart_rect = restart_text.get_rect(center=(200, 300))
        
        self.screen.blit(game_over_text, text_rect)
        self.screen.blit(restart_text, restart_rect)
    
    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            
            elif event.type == pygame.KEYDOWN:
                if self.game_over:
                    if event.key == pygame.K_r:
                        self.tetris = Tetris()
                        self.game_over = False
                else:
                    if event.key == pygame.K_LEFT:
                        self.tetris.move_piece(-1, 0)
                    elif event.key == pygame.K_RIGHT:
                        self.tetris.move_piece(1, 0)
                    elif event.key == pygame.K_DOWN:
                        self.tetris.move_piece(0, 1)
                    elif event.key == pygame.K_UP:
                        self.tetris.rotate_piece()
                    elif event.key == pygame.K_SPACE:
                        # 快速下落
                        while self.tetris.move_piece(0, 1):
                            pass
    
    def update(self):
        if not self.game_over:
            dt = self.clock.get_time()
            if not self.tetris.update(dt):
                self.game_over = True
    
    def draw(self):
        self.screen.fill(BLACK)
        
        if not self.game_over:
            self.draw_grid()
            self.draw_piece(self.tetris.current_piece)
            self.draw_next_piece()
            self.draw_info()
        else:
            self.draw_game_over()
        
        pygame.display.flip()
    
    def run(self):
        while self.running:
            self.handle_events()
            self.update()
            self.draw()
            self.clock.tick(60)
        
        pygame.quit()
        sys.exit()

if __name__ == "__main__":
    game = Game()
    game.run()
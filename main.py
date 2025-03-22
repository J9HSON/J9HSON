import pygame
import sys
import os

# 初始化 Pygame
pygame.init()

# 设置窗口
WINDOW_WIDTH = 1200
WINDOW_HEIGHT = 600
screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
pygame.display.set_caption("古代行军图游戏")

# 颜色定义
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)

# 游戏主循环
def main():
    clock = pygame.time.Clock()
    background_color = (200, 180, 150)  # 类似卷轴的米黄色
    
    # 加载角色图像
    player_pos = [100, WINDOW_HEIGHT // 2]
    player_speed = 5
    
    running = True
    while running:
        # 事件处理
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
                
        # 获取键盘输入
        keys = pygame.key.get_pressed()
        if keys[pygame.K_LEFT]:
            player_pos[0] -= player_speed
        if keys[pygame.K_RIGHT]:
            player_pos[0] += player_speed
        if keys[pygame.K_UP]:
            player_pos[1] -= player_speed
        if keys[pygame.K_DOWN]:
            player_pos[1] += player_speed
            
        # 确保角色不会移出屏幕
        player_pos[0] = max(0, min(player_pos[0], WINDOW_WIDTH - 30))
        player_pos[1] = max(0, min(player_pos[1], WINDOW_HEIGHT - 30))
        
        # 绘制
        screen.fill(background_color)
        pygame.draw.rect(screen, BLACK, (player_pos[0], player_pos[1], 30, 30))
        
        # 更新显示
        pygame.display.flip()
        clock.tick(60)

    pygame.quit()
    sys.exit()

if __name__ == "__main__":
    main() 
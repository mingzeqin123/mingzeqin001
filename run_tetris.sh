#!/bin/bash
# 俄罗斯方块游戏启动脚本

echo "🎮 启动俄罗斯方块游戏..."
echo "================================================"
echo "游戏控制说明："
echo "A/D - 左右移动"
echo "S - 软降（加速下落）"
echo "W - 旋转方块"
echo "空格 - 硬降（瞬间下落到底部）"
echo "P - 暂停/继续游戏"
echo "R - 重新开始游戏"
echo "ESC - 退出游戏"
echo "================================================"
echo ""

# 设置显示环境（如果在无头环境中运行）
export PYGAME_HIDE_SUPPORT_PROMPT=1

# 运行游戏
python3 tetris.py
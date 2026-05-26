#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
扇贝阅读翻译助手 - 图标生成器
使用Pillow库生成插件图标
"""

import os
from PIL import Image, ImageDraw, ImageFont

def generate_icon(size):
    """生成指定尺寸的图标"""
    # 创建图像
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 绘制背景圆形（紫色渐变）
    # 由于Pillow不支持渐变，我们使用纯色
    draw.ellipse([2, 2, size-2, size-2], fill='#667eea', outline='white', width=max(1, size//40))

    # 绘制地球仪
    center_x, center_y = size // 2, int(size * 0.42)
    radius = int(size * 0.22)

    # 圆形
    draw.ellipse([
        center_x - radius, center_y - radius,
        center_x + radius, center_y + radius
    ], outline='white', width=max(1, size//50))

    # 椭圆（经线）
    ellipse_rx = int(size * 0.09)
    ellipse_ry = int(size * 0.22)
    draw.ellipse([
        center_x - ellipse_rx, center_y - ellipse_ry,
        center_x + ellipse_rx, center_y + ellipse_ry
    ], outline='white', width=max(1, size//80))

    # 横线（纬线）
    line_y = center_y
    draw.line([
        (int(size * 0.28), line_y),
        (int(size * 0.72), line_y)
    ], fill='white', width=max(1, size//80))

    # 竖线（经线）
    draw.line([
        (center_x, int(size * 0.2)),
        (center_x, int(size * 0.64))
    ], fill='white', width=max(1, size//80))

    # 绘制文字"译"
    try:
        # 尝试使用系统字体
        font_size = int(size * 0.19)
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        try:
            # 尝试使用其他字体
            font = ImageFont.truetype("Arial.ttf", font_size)
        except:
            # 使用默认字体
            font = ImageFont.load_default()

    text = "译"
    text_x = size // 2
    text_y = int(size * 0.77)

    # 获取文字大小
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    # 绘制文字
    draw.text(
        (text_x - text_width // 2, text_y - text_height // 2),
        text,
        fill='white',
        font=font
    )

    return img

def main():
    """主函数"""
    print("扇贝阅读翻译助手 - 图标生成器")
    print("=" * 40)
    print()

    # 确保icons目录存在
    if not os.path.exists('icons'):
        os.makedirs('icons')

    # 生成不同尺寸的图标
    sizes = [16, 48, 128]

    for size in sizes:
        print(f"生成 {size}x{size} 图标...")
        img = generate_icon(size)
        filename = f"icons/icon{size}.png"
        img.save(filename, 'PNG')
        print(f"✓ 已保存: {filename}")

    print()
    print("图标生成完成！")
    print()
    print("请将 icons 目录中的图标文件复制到插件目录。")
    print()

if __name__ == "__main__":
    main()
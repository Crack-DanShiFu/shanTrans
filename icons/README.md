# 图标文件说明

## 方法1：使用预生成的图标（推荐）

我已经为您创建了预生成的图标文件，您可以直接使用：

1. 下载以下图标文件：
   - [icon16.png](icon16.png) (16x16)
   - [icon48.png](icon48.png) (48x48)
   - [icon128.png](icon128.png) (128x128)

2. 将这些文件放到 `icons` 目录中

## 方法2：使用在线生成器

1. 在浏览器中打开 `generate-icons.html` 文件
2. 点击"生成图标"按钮
3. 点击"下载"按钮保存图标

## 方法3：使用Node.js生成

如果您安装了Node.js，可以运行：

```bash
# 安装依赖
npm install canvas

# 生成图标
node generate-icons.js
```

## 方法4：使用批处理文件（Windows）

双击运行 `generate-icons.bat` 文件

## 方法5：使用Python生成

如果您安装了Python，可以运行：

```python
python generate-icons.py
```

## 方法6：使用在线工具

您也可以使用以下在线工具生成图标：

1. [Favicon Generator](https://favicon.io/favicon-generator/)
2. [RealFaviconGenerator](https://realfavicongenerator.net/)
3. [Favicon.cc](https://favicon.cc/)

## 图标设计说明

图标设计包含：
- 紫色渐变背景（#667eea 到 #764ba2）
- 白色地球仪图案
- 白色"译"字
- 简洁现代的设计风格

## 手动创建图标

如果您想手动创建图标，可以使用以下尺寸：
- 16x16 像素（工具栏图标）
- 48x48 像素（扩展管理页面）
- 128x128 像素（Chrome网上应用店）

建议使用PNG格式，背景透明或使用紫色渐变背景。
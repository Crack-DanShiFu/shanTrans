# 扇贝阅读翻译助手

一个Chrome浏览器扩展，为扇贝阅读网站添加段落翻译功能。

## 功能特点

- 自动识别扇贝阅读文章中的段落
- 鼠标悬浮显示翻译按钮
- 点击按钮翻译当前段落
- 翻译结果在右侧面板显示，不影响阅读
- 支持英译中翻译
- 翻译结果缓存，避免重复翻译

## 项目结构

```
shanTrans/
├── manifest.json              # Chrome扩展配置文件
├── src/                       # 源代码目录
│   ├── content/              # 内容脚本
│   │   ├── content.js        # 主内容脚本
│   │   └── content-debug.js  # 调试版本
│   ├── background/           # 后台脚本
│   │   └── background.js     # API调用处理
│   ├── popup/                # 弹出窗口
│   │   ├── popup.html        # 配置界面
│   │   └── popup.js          # 配置逻辑
│   ├── styles/               # 样式文件
│   │   └── styles.css        # 插件样式
│   └── utils/                # 工具脚本
│       ├── analyze.js        # 页面分析
│       └── bookmarklet.js    # 书签版
├── icons/                    # 图标目录
│   ├── icon.svg             # SVG源文件
│   └── generate-icons.html  # 图标生成器
├── tools/                    # 工具目录
│   ├── create-icons.html    # 图标生成工具
│   ├── test.html            # 测试页面
│   └── ...                  # 其他工具
├── package.json              # 项目配置
└── README.md                 # 说明文档
```

## 安装步骤

### 1. 生成图标文件

1. 打开 `icons/generate-icons.html` 或 `tools/create-icons.html`
2. 点击生成图标按钮
3. 保存图标到 `icons` 目录：
   - `icon16.png`
   - `icon48.png`
   - `icon128.png`

### 2. 安装插件到Chrome

1. 打开Chrome浏览器，访问 `chrome://extensions/`
2. 开启右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择本项目文件夹

### 3. 配置百度翻译API

1. 访问 [百度AI平台](https://cloud.baidu.com/product/mt)
2. 注册并登录百度智能云账号
3. 开通"机器翻译"服务
4. 创建应用，获取API Key和Secret Key
5. 点击浏览器工具栏中的插件图标
6. 输入API Key和Secret Key
7. 点击"保存配置"

## 使用方法

1. 访问扇贝阅读文章页面
2. 鼠标悬浮在文章段落上，右侧会出现"译"按钮
3. 点击按钮，右侧面板滑出显示翻译结果
4. 点击"×"按钮或再次点击"译"按钮关闭面板

## 开发说明

- `src/content/content.js` - 内容脚本，注入到网页
- `src/background/background.js` - 后台脚本，处理API调用
- `src/popup/` - 弹出窗口界面和逻辑
- `src/styles/styles.css` - 插件样式

## 技术栈

- Chrome Extension Manifest V3
- 百度AI平台翻译API
- MutationObserver (监听页面变化)
- CSS3 动画和过渡效果

## 许可证

MIT License
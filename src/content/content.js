// 扇贝阅读翻译助手 - 内容脚本
(function() {
  'use strict';

  // 配置
  const CONFIG = {
    // 扇贝阅读网站段落选择器
    paragraphSelectors: [
      '.para',  // 扇贝阅读实际使用的段落类名
      'div.para',
      '.article-content p',
      '.news-content p',
      '.reading-content p',
      '.content p',
      'article p',
      'p'
    ],
    // 翻译按钮类名
    translateButtonClass: 'shanbay-translate-btn',
    // 翻译结果容器类名
    translationResultClass: 'shanbay-translation-result',
    // 加载状态类名
    loadingClass: 'shanbay-loading'
  };

  // 翻译缓存
  const translationCache = new Map();

  // 翻译面板
  let translationPanel = null;

  // 显示配置
  let displayConfig = {
    mode: 'sidebar',  // 'panel' 或 'sidebar'
    sidebarSelector: '.sideBar',
    showOriginal: true,  // 是否显示原文
    hideTitle: false,  // 是否隐藏网页标题
    hideButton: false  // 是否隐藏翻译按钮
  };

  // 初始化
  function init() {
    console.log('扇贝阅读翻译助手已加载');

    // 加载显示配置
    loadDisplayConfig();

    // 创建翻译面板
    createTranslationPanel();

    // 等待页面加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setupTranslationButtons();
        overrideOfficialTranslateButtons();
      });
    } else {
      setupTranslationButtons();
      overrideOfficialTranslateButtons();
    }

    // 监听页面动态内容变化
    setupMutationObserver();

    // 监听配置更新消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'updateDisplayConfig') {
        displayConfig.mode = request.displayMode;
        displayConfig.sidebarSelector = request.sidebarSelector;
        console.log('[翻译助手] 显示配置已更新:', displayConfig);
        sendResponse({ success: true });
      }
      if (request.action === 'updateDisplayOptions') {
        displayConfig.showOriginal = request.showOriginal;
        displayConfig.hideTitle = request.hideTitle;
        displayConfig.hideButton = request.hideButton;
        console.log('[翻译助手] 显示选项已更新:', displayConfig);

        // 如果启用了隐藏标题，立即隐藏
        if (displayConfig.hideTitle) {
          hidePageTitle();
        } else {
          restorePageTitle();
        }

        // 应用按钮隐藏状态
        updateButtonVisibility();

        sendResponse({ success: true });
      }
      if (request.action === 'showContextTranslation') {
        if (request.error) {
          showNotification('翻译失败: ' + request.error, 'error');
        } else {
          showTranslationResult(request.original, request.translation);
        }
        sendResponse({ success: true });
      }
    });
  }

  // 加载显示配置
  function loadDisplayConfig() {
    chrome.storage.sync.get(['displayMode', 'sidebarSelector', 'showOriginal', 'hideTitle', 'hideButton'], (result) => {
      if (result.displayMode) {
        displayConfig.mode = result.displayMode;
      }
      if (result.sidebarSelector) {
        displayConfig.sidebarSelector = result.sidebarSelector;
      }
      if (result.showOriginal !== undefined) {
        displayConfig.showOriginal = result.showOriginal;
      }
      if (result.hideTitle !== undefined) {
        displayConfig.hideTitle = result.hideTitle;
      }
      if (result.hideButton !== undefined) {
        displayConfig.hideButton = result.hideButton;
      }
      console.log('[翻译助手] 显示配置:', displayConfig);

      // 如果启用了隐藏标题，立即隐藏
      if (displayConfig.hideTitle) {
        hidePageTitle();
      }

      // 应用按钮隐藏状态
      updateButtonVisibility();
    });
  }

  // 创建翻译面板
  function createTranslationPanel() {
    // 检查是否已存在
    if (document.getElementById('shanbay-translation-panel')) {
      translationPanel = document.getElementById('shanbay-translation-panel');
      return;
    }

    // 创建面板
    translationPanel = document.createElement('div');
    translationPanel.id = 'shanbay-translation-panel';
    translationPanel.className = 'shanbay-panel';
    translationPanel.innerHTML = `
      <div class="shanbay-panel-header">
        <span class="shanbay-panel-title">翻译结果</span>
        <button class="shanbay-panel-close" id="shanbay-panel-close">×</button>
      </div>
      <div class="shanbay-panel-content" id="shanbay-panel-content">
        <div class="shanbay-panel-empty">点击段落的"译"按钮查看翻译</div>
      </div>
    `;

    document.body.appendChild(translationPanel);

    // 绑定关闭按钮
    document.getElementById('shanbay-panel-close').addEventListener('click', () => {
      translationPanel.classList.remove('shanbay-panel-show');
    });
  }

  // 设置MutationObserver监听DOM变化
  function setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // 延迟处理，确保DOM完全更新
          setTimeout(() => {
            setupTranslationButtons();
            overrideOfficialTranslateButtons();
          }, 500);
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // 替换官方翻译按钮功能
  function overrideOfficialTranslateButtons() {
    // 查找所有官方翻译按钮
    const officialButtons = document.querySelectorAll('.translate-btn:not([data-shanbay-overridden])');

    officialButtons.forEach(button => {
      // 标记已处理
      button.setAttribute('data-shanbay-overridden', 'true');

      // 移除原有事件（通过克隆节点）
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);

      // 添加新的点击事件
      newButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // 找到对应的段落
        const paragraph = newButton.closest('.para') || newButton.closest('p') || newButton.parentElement;
        if (!paragraph) return;

        // 获取段落文本
        const text = getParagraphText(paragraph);
        if (!text) {
          showNotification('没有可翻译的文本', 'warning');
          return;
        }

        // 调用翻译
        handleOfficialTranslate(text, newButton);
      });

      console.log('[翻译助手] 已替换官方翻译按钮');
    });
  }

  // 处理官方按钮翻译
  async function handleOfficialTranslate(text, button) {
    console.log('[翻译助手] 官方按钮翻译，文本:', text.substring(0, 50) + '...');

    // 检查缓存
    if (translationCache.has(text)) {
      showTranslationResult(text, translationCache.get(text));
      return;
    }

    // 显示加载状态
    const originalText = button.textContent;
    // button.textContent = '翻译中...';
    button.disabled = true;
    button.style.opacity = '0.6';

    try {
      // 调用翻译API
      const translation = await translateText(text);

      // 缓存翻译结果
      translationCache.set(text, translation);

      // 显示翻译结果
      showTranslationResult(text, translation);

    } catch (error) {
      console.error('[翻译助手] 翻译失败:', error);
      showNotification('翻译失败: ' + error.message, 'error');
    } finally {
      // 恢复按钮状态
      button.textContent = originalText;
      button.disabled = false;
      button.style.opacity = '1';
    }
  }

  // 设置翻译按钮
  function setupTranslationButtons() {
    // 查找所有段落元素
    const paragraphs = findParagraphs();

    paragraphs.forEach((paragraph, index) => {
      // 检查是否已经添加了翻译按钮
      if (paragraph.querySelector(`.${CONFIG.translateButtonClass}`)) {
        return;
      }

      // 创建翻译按钮
      const translateButton = createTranslateButton(paragraph, index);

      // 将按钮添加到段落后面
      paragraph.style.position = 'relative';
      paragraph.appendChild(translateButton);
    });
  }

  // 查找段落元素
  function findParagraphs() {
    const paragraphs = [];

    // 尝试不同的选择器
    for (const selector of CONFIG.paragraphSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        // 过滤掉空段落和很短的段落
        const validParagraphs = Array.from(elements).filter(el => {
          const text = el.textContent.trim();
          return text.length > 10 && !el.querySelector(`.${CONFIG.translateButtonClass}`);
        });

        paragraphs.push(...validParagraphs);
        break; // 找到合适的选择器就停止
      }
    }

    // 如果没有找到段落，尝试查找所有包含文本的p标签
    if (paragraphs.length === 0) {
      const allParagraphs = document.querySelectorAll('p');
      allParagraphs.forEach(p => {
        const text = p.textContent.trim();
        if (text.length > 10 && !p.querySelector(`.${CONFIG.translateButtonClass}`)) {
          paragraphs.push(p);
        }
      });
    }

    return paragraphs;
  }

  // 创建翻译按钮
  function createTranslateButton(paragraph, index) {
    const button = document.createElement('button');
    button.className = CONFIG.translateButtonClass;
    button.innerHTML = '译';
    button.title = '翻译此段落';
    button.dataset.index = index;

    // 根据配置隐藏按钮
    if (displayConfig.hideButton) {
      button.style.display = 'none';
    }

    // 添加点击事件
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleTranslateClick(paragraph, button);
    });

    return button;
  }

  // 获取段落纯文本（过滤掉按钮等内容）
  function getParagraphText(paragraph) {
    // 克隆段落节点
    const clone = paragraph.cloneNode(true);

    // 移除不需要翻译的元素
    const removeSelectors = [
      '.para-icons',
      '.shanbay-translate-btn',
      '.translate-btn',
      '.note-flag',
      'button'
    ];

    removeSelectors.forEach(selector => {
      const elements = clone.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });

    // 返回纯文本
    return clone.textContent.trim();
  }

  // 处理翻译按钮点击
  async function handleTranslateClick(paragraph, button) {
    const text = getParagraphText(paragraph);
    console.log('[翻译助手] 点击翻译按钮，文本:', text.substring(0, 50) + '...');

    if (!text) {
      showNotification('没有可翻译的文本', 'warning');
      return;
    }

    // 检查缓存
    if (translationCache.has(text)) {
      showTranslationResult(text, translationCache.get(text));
      return;
    }

    // 显示加载状态
    button.classList.add(CONFIG.loadingClass);
    button.innerHTML = '...';
    button.disabled = true;

    try {
      // 调用翻译API
      const translation = await translateText(text);

      // 缓存翻译结果
      translationCache.set(text, translation);

      // 显示翻译结果
      showTranslationResult(text, translation);

    } catch (error) {
      console.error('[翻译助手] 翻译失败:', error);
      showNotification('翻译失败: ' + error.message, 'error');
    } finally {
      // 恢复按钮状态
      button.classList.remove(CONFIG.loadingClass);
      button.innerHTML = '译';
      button.disabled = false;
    }
  }

  // 调用翻译API
  async function translateText(text) {
    return new Promise((resolve, reject) => {
      // 发送消息给background script进行翻译
      chrome.runtime.sendMessage({
        action: 'translate',
        text: text,
        from: 'en',
        to: 'zh'
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (response.success) {
          resolve(response.translation);
        } else {
          reject(new Error(response.error || '翻译失败'));
        }
      });
    });
  }

  // 显示翻译结果
  function showTranslationResult(originalText, translation) {
    if (displayConfig.mode === 'sidebar') {
      showInSidebar(originalText, translation);
    } else {
      showInPanel(originalText, translation);
    }
  }

  // 在右侧面板显示翻译结果
  function showInPanel(originalText, translation) {
    // 获取面板内容区域
    const panelContent = document.getElementById('shanbay-panel-content');
    if (!panelContent) return;

    // 根据配置决定是否显示原文
    let html = '';
    if (displayConfig.showOriginal) {
      html += `
        <div class="shanbay-panel-original">
          <div class="shanbay-panel-label">原文</div>
          <div class="shanbay-panel-text">${originalText}</div>
        </div>
      `;
    }
    html += `
      <div class="shanbay-panel-translation">
        <div class="shanbay-panel-label">译文</div>
        <div class="shanbay-panel-text">${translation}</div>
      </div>
    `;

    // 更新面板内容
    panelContent.innerHTML = html;

    // 显示面板
    translationPanel.classList.add('shanbay-panel-show');
  }

  // 在页面侧边栏显示翻译结果
  function showInSidebar(originalText, translation) {
    // 查找侧边栏
    const sidebar = document.querySelector(displayConfig.sidebarSelector);
    if (!sidebar) {
      console.error('[翻译助手] 未找到侧边栏元素:', displayConfig.sidebarSelector);
      showNotification('未找到侧边栏元素', 'error');
      return;
    }

    // 检查是否已有翻译结果容器
    let resultContainer = sidebar.querySelector('.shanbay-sidebar-translation');
    if (!resultContainer) {
      // 创建翻译结果容器
      resultContainer = document.createElement('div');
      resultContainer.className = 'shanbay-sidebar-translation';

      // 查找 notes-sidebar 元素
      const notesSidebar = sidebar.querySelector('.notes-sidebar') ||
                           sidebar.querySelector('[class*="notes-sidebar"]') ||
                           sidebar.querySelector('#notes-sidebar');

      if (notesSidebar) {
        // 插入到 notes-sidebar 之后
        notesSidebar.parentNode.insertBefore(resultContainer, notesSidebar.nextSibling);
        console.log('[翻译助手] 翻译结果已插入到 notes-sidebar 之后');
      } else {
        // 如果没有找到 notes-sidebar，插入到侧边栏开头
        sidebar.insertBefore(resultContainer, sidebar.firstChild);
        console.log('[翻译助手] 未找到 notes-sidebar，翻译结果插入到侧边栏开头');
      }
    }

    // 根据配置决定是否显示原文
    let contentHtml = '';
    if (displayConfig.showOriginal) {
      contentHtml += `
        <div class="shanbay-sidebar-original">
          <div class="shanbay-sidebar-label">原文</div>
          <div class="shanbay-sidebar-text">${originalText}</div>
        </div>
      `;
    }
    contentHtml += `
      <div class="shanbay-sidebar-translation-text">
        <div class="shanbay-sidebar-label">译文</div>
        <div class="shanbay-sidebar-text">${translation}</div>
      </div>
    `;

    // 更新内容
    resultContainer.innerHTML = `
      <div class="shanbay-sidebar-header">
        <span class="shanbay-sidebar-title">翻译结果</span>
        <button class="shanbay-sidebar-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
      <div class="shanbay-sidebar-content">
        ${contentHtml}
      </div>
    `;
  }

  // 保存原始标题
  let originalPageTitle = '';

  // 隐藏网页标题
  function hidePageTitle() {
    if (!originalPageTitle) {
      originalPageTitle = document.title;
    }
    document.title = '网页';
    console.log('[翻译助手] 标题已隐藏');
  }

  // 恢复网页标题
  function restorePageTitle() {
    if (originalPageTitle) {
      document.title = originalPageTitle;
      originalPageTitle = '';
      console.log('[翻译助手] 标题已恢复');
    }
  }

  // 更新翻译按钮可见性
  function updateButtonVisibility() {
    const buttons = document.querySelectorAll(`.${CONFIG.translateButtonClass}`);
    buttons.forEach(btn => {
      if (displayConfig.hideButton) {
        btn.style.display = 'none';
      } else {
        btn.style.display = '';
      }
    });
  }

  // 显示通知
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `shanbay-notification shanbay-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // 自动移除通知
    setTimeout(() => {
      notification.classList.add('shanbay-fade-out');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // 初始化插件
  init();
})();
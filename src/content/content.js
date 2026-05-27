// 扇贝阅读翻译助手 - 内容脚本
(function() {
  'use strict';

  // 配置
  const CONFIG = {
    // 扇贝阅读网站段落选择器（按优先级排序）
    paragraphSelectors: [
      '.para',
      '.article-content p',
      '.news-content p',
      '.reading-content p',
      '.content p',
      'article p',
      'p'
    ],
    translateButtonClass: 'shanbay-translate-btn',
    loadingClass: 'shanbay-loading'
  };

  // 缓存找到的有效选择器索引
  let cachedSelectorIndex = -1;

  // 翻译缓存
  const translationCache = new Map();

  // 翻译面板
  let translationPanel = null;

  // 当前翻译引擎
  let currentEngine = 'baidu';

  // 浏览器TTS音色配置
  let browserTtsVoiceEn = '';
  let browserTtsVoiceZh = '';

  // 当前播放的朗读
  let currentUtterance = null;
  let isStoppingTTS = false;

  // 停止朗读
  function stopTTS() {
    isStoppingTTS = true;
    if (currentUtterance) {
      currentUtterance.onend = null;
      currentUtterance.onerror = null;
      currentUtterance = null;
    }
    window.speechSynthesis.cancel();
    document.querySelectorAll('.shanbay-tts-playing').forEach(btn => {
      btn.classList.remove('shanbay-tts-playing');
      btn.textContent = '🔊';
    });
  }

  // 显示配置
  let displayConfig = {
    mode: 'sidebar',  // 'panel' 或 'sidebar'
    sidebarSelector: '.sideBar',
    showOriginal: true,  // 是否显示原文
    hideTitle: false,  // 是否隐藏网页标题
    hideButton: false  // 是否隐藏翻译按钮
  };

  // 清理上一次留下的翻译结果
  function cleanupPreviousTranslations() {
    stopTTS();
    document.querySelectorAll('.shanbay-sidebar-translation').forEach(el => el.remove());
    document.querySelectorAll('.shanbay-notification').forEach(el => el.remove());
    const existingPanel = document.getElementById('shanbay-translation-panel');
    if (existingPanel) existingPanel.remove();
    translationPanel = null;
  }

  // 初始化
  function init() {
    console.log('扇贝阅读翻译助手已加载');

    // 清理页面缓存中残留的翻译结果
    cleanupPreviousTranslations();

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

    // 监听URL变化（SPA导航时清理翻译结果）
    setupNavigationCleanup();

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
      if (request.action === 'updateTtsConfig') {
        if (request.browserTtsVoiceEn !== undefined) browserTtsVoiceEn = request.browserTtsVoiceEn;
        if (request.browserTtsVoiceZh !== undefined) browserTtsVoiceZh = request.browserTtsVoiceZh;
        console.log('[翻译助手] TTS音色已更新:', browserTtsVoiceEn, browserTtsVoiceZh);
        sendResponse({ success: true });
      }
    });
  }

  // 加载显示配置
  function loadDisplayConfig() {
    chrome.storage.sync.get(['translationEngine', 'browserTtsVoiceEn', 'browserTtsVoiceZh', 'displayMode', 'sidebarSelector', 'showOriginal', 'hideTitle', 'hideButton'], (result) => {
      if (result.translationEngine) {
        currentEngine = result.translationEngine;
      }
      if (result.browserTtsVoiceEn) {
        browserTtsVoiceEn = result.browserTtsVoiceEn;
      }
      if (result.browserTtsVoiceZh) {
        browserTtsVoiceZh = result.browserTtsVoiceZh;
      }
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
      stopTTS();
      translationPanel.classList.remove('shanbay-panel-show');
    });
  }

  // 设置MutationObserver监听DOM变化（带防抖）
  function setupMutationObserver() {
    let debounceTimer = null;

    const observer = new MutationObserver((mutations) => {
      const hasNewNodes = mutations.some(m => m.type === 'childList' && m.addedNodes.length > 0);
      if (!hasNewNodes) return;

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        setupTranslationButtons();
        overrideOfficialTranslateButtons();
      }, 300);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // 替换官方翻译按钮功能
  function overrideOfficialTranslateButtons() {
    const officialButtons = document.querySelectorAll('.translate-btn:not([data-shanbay-overridden])');

    officialButtons.forEach(button => {
      button.setAttribute('data-shanbay-overridden', 'true');

      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);

      newButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const paragraph = newButton.closest('.para') || newButton.closest('p') || newButton.parentElement;
        if (!paragraph) return;

        const text = getParagraphText(paragraph);
        if (!text) {
          showNotification('没有可翻译的文本', 'warning');
          return;
        }

        executeTranslate(text, newButton, true);
      });
    });
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

  // 查找段落元素（使用缓存的选择器索引）
  function findParagraphs() {
    const paragraphs = [];

    // 优先使用缓存的选择器索引
    if (cachedSelectorIndex >= 0 && cachedSelectorIndex < CONFIG.paragraphSelectors.length) {
      const selector = CONFIG.paragraphSelectors[cachedSelectorIndex];
      const elements = document.querySelectorAll(selector);
      const validParagraphs = Array.from(elements).filter(el => {
        const text = el.textContent.trim();
        return text.length > 10 && !el.querySelector(`.${CONFIG.translateButtonClass}`);
      });
      paragraphs.push(...validParagraphs);
    }

    // 缓存未命中时，遍历选择器
    if (paragraphs.length === 0) {
      for (let i = 0; i < CONFIG.paragraphSelectors.length; i++) {
        const selector = CONFIG.paragraphSelectors[i];
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          const validParagraphs = Array.from(elements).filter(el => {
            const text = el.textContent.trim();
            return text.length > 10 && !el.querySelector(`.${CONFIG.translateButtonClass}`);
          });
          if (validParagraphs.length > 0) {
            cachedSelectorIndex = i;
            paragraphs.push(...validParagraphs);
            break;
          }
        }
      }
    }

    // 兜底：查找所有p标签
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
  function handleTranslateClick(paragraph, button) {
    const text = getParagraphText(paragraph);
    if (!text) {
      showNotification('没有可翻译的文本', 'warning');
      return;
    }
    executeTranslate(text, button, false);
  }

  // 执行翻译（统一处理自定义按钮和官方按钮）
  async function executeTranslate(text, button, isOfficial) {
    // 停止正在播放的朗读
    stopTTS();

    // 立即显示原文
    showOriginalText(text);

    // 检查缓存
    if (translationCache.has(text)) {
      showTranslationInResult(text, translationCache.get(text));
      return;
    }

    // 显示加载状态
    const originalText = button.textContent;
    if (isOfficial) {
      button.disabled = true;
      button.style.opacity = '0.6';
    } else {
      button.classList.add(CONFIG.loadingClass);
      button.innerHTML = '...';
      button.disabled = true;
    }

    try {
      const translation = await translateText(text);
      translationCache.set(text, translation);
      showTranslationInResult(text, translation);
    } catch (error) {
      showNotification('翻译失败: ' + error.message, 'error');
    } finally {
      // 恢复按钮状态
      if (isOfficial) {
        button.textContent = originalText;
        button.disabled = false;
        button.style.opacity = '1';
      } else {
        button.classList.remove(CONFIG.loadingClass);
        button.innerHTML = '译';
        button.disabled = false;
      }
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
    showOriginalText(originalText);
    showTranslationInResult(originalText, translation);
  }

  // 立即显示原文（翻译请求发出时调用）
  function showOriginalText(originalText) {
    if (displayConfig.mode === 'sidebar') {
      showOriginalInSidebar(originalText);
    } else {
      showOriginalInPanel(originalText);
    }
  }

  // 更新译文（翻译结果返回时调用）
  function showTranslationInResult(originalText, translation) {
    if (displayConfig.mode === 'sidebar') {
      showTranslationInSidebar(originalText, translation);
    } else {
      showTranslationInPanel(originalText, translation);
    }
  }

  // 面板：立即显示原文
  function showOriginalInPanel(originalText) {
    const panelContent = document.getElementById('shanbay-panel-content');
    if (!panelContent) return;

    const ttsBtnHtml = `<button class="shanbay-tts-btn" data-text="${originalText.replace(/"/g, '&quot;')}" data-lang="en" title="朗读原文">🔊</button>`;

    let html = '';
    if (displayConfig.showOriginal) {
      html += `
        <div class="shanbay-panel-original">
          <div class="shanbay-panel-label">原文 ${ttsBtnHtml}</div>
          <div class="shanbay-panel-text">${originalText}</div>
        </div>
      `;
    }
    html += `
      <div class="shanbay-panel-translation">
        <div class="shanbay-panel-label">译文</div>
        <div class="shanbay-panel-text shanbay-translating">翻译中...</div>
      </div>
    `;

    panelContent.innerHTML = html;
    panelContent.querySelectorAll('.shanbay-tts-btn').forEach(btn => {
      btn.addEventListener('click', () => playTTS(btn.dataset.text, btn.dataset.lang, btn));
    });
    translationPanel.classList.add('shanbay-panel-show');
  }

  // 面板：更新译文
  function showTranslationInPanel(originalText, translation) {
    const panelContent = document.getElementById('shanbay-panel-content');
    if (!panelContent) return;

    const translationArea = panelContent.querySelector('.shanbay-panel-translation .shanbay-panel-text');
    if (translationArea) {
      translationArea.textContent = translation;
      translationArea.classList.remove('shanbay-translating');
    }

    // 添加译文朗读按钮
    const translationLabel = panelContent.querySelector('.shanbay-panel-translation .shanbay-panel-label');
    if (translationLabel && !translationLabel.querySelector('.shanbay-tts-btn')) {
      const ttsBtn = document.createElement('button');
      ttsBtn.className = 'shanbay-tts-btn';
      ttsBtn.textContent = '🔊';
      ttsBtn.title = '朗读译文';
      ttsBtn.dataset.text = translation;
      ttsBtn.dataset.lang = 'zh';
      ttsBtn.addEventListener('click', () => playTTS(ttsBtn.dataset.text, ttsBtn.dataset.lang, ttsBtn));
      translationLabel.appendChild(ttsBtn);
    }
  }

  // 侧边栏：立即显示原文
  function showOriginalInSidebar(originalText) {
    const sidebar = document.querySelector(displayConfig.sidebarSelector);
    if (!sidebar) {
      showNotification('未找到侧边栏元素', 'error');
      return;
    }

    let resultContainer = sidebar.querySelector('.shanbay-sidebar-translation');
    if (!resultContainer) {
      resultContainer = document.createElement('div');
      resultContainer.className = 'shanbay-sidebar-translation';

      const notesSidebar = sidebar.querySelector('.notes-sidebar') ||
                           sidebar.querySelector('[class*="notes-sidebar"]') ||
                           sidebar.querySelector('#notes-sidebar');

      if (notesSidebar) {
        notesSidebar.parentNode.insertBefore(resultContainer, notesSidebar.nextSibling);
      } else {
        sidebar.insertBefore(resultContainer, sidebar.firstChild);
      }
    }

    let contentHtml = '';
    if (displayConfig.showOriginal) {
      const ttsBtnHtml = `<button class="shanbay-tts-btn" data-text="${originalText.replace(/"/g, '&quot;')}" data-lang="en" title="朗读原文">🔊</button>`;
      contentHtml += `
        <div class="shanbay-sidebar-original">
          <div class="shanbay-sidebar-label">原文 ${ttsBtnHtml}</div>
          <div class="shanbay-sidebar-text">${originalText}</div>
        </div>
      `;
    }
    contentHtml += `
      <div class="shanbay-sidebar-translation-text">
        <div class="shanbay-sidebar-label">译文</div>
        <div class="shanbay-sidebar-text shanbay-translating">翻译中...</div>
      </div>
    `;

    resultContainer.innerHTML = `
      <div class="shanbay-sidebar-header">
        <span class="shanbay-sidebar-title">翻译结果</span>
        <button class="shanbay-sidebar-close">×</button>
      </div>
      <div class="shanbay-sidebar-content">
        ${contentHtml}
      </div>
    `;

    resultContainer.querySelector('.shanbay-sidebar-close').addEventListener('click', () => {
      stopTTS();
      resultContainer.remove();
    });

    resultContainer.querySelectorAll('.shanbay-tts-btn').forEach(btn => {
      btn.addEventListener('click', () => playTTS(btn.dataset.text, btn.dataset.lang, btn));
    });
  }

  // 侧边栏：更新译文
  function showTranslationInSidebar(originalText, translation) {
    const sidebar = document.querySelector(displayConfig.sidebarSelector);
    if (!sidebar) return;

    const resultContainer = sidebar.querySelector('.shanbay-sidebar-translation');
    if (!resultContainer) return;

    const translationArea = resultContainer.querySelector('.shanbay-sidebar-translation-text .shanbay-sidebar-text');
    if (translationArea) {
      translationArea.textContent = translation;
      translationArea.classList.remove('shanbay-translating');
    }

    // 添加译文朗读按钮
    const translationLabel = resultContainer.querySelector('.shanbay-sidebar-translation-text .shanbay-sidebar-label');
    if (translationLabel && !translationLabel.querySelector('.shanbay-tts-btn')) {
      const ttsBtn = document.createElement('button');
      ttsBtn.className = 'shanbay-tts-btn';
      ttsBtn.textContent = '🔊';
      ttsBtn.title = '朗读译文';
      ttsBtn.dataset.text = translation;
      ttsBtn.dataset.lang = 'zh';
      ttsBtn.addEventListener('click', () => playTTS(ttsBtn.dataset.text, ttsBtn.dataset.lang, ttsBtn));
      translationLabel.appendChild(ttsBtn);
    }
  }

  // 朗读TTS
  function playTTS(text, lang, btn) {
    // 如果当前按钮正在播放，则停止
    if (btn.classList.contains('shanbay-tts-playing')) {
      stopTTS();
      return;
    }

    stopTTS();
    isStoppingTTS = false;

    btn.classList.add('shanbay-tts-playing');
    btn.textContent = '⏳';

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'zh' ? 'zh-CN' : (lang === 'en' ? 'en-US' : lang);

    // 选择指定音色
    const savedVoice = lang === 'zh' ? browserTtsVoiceZh : browserTtsVoiceEn;
    if (savedVoice) {
      const voices = window.speechSynthesis.getVoices();
      const matched = voices.find(v => v.voiceURI === savedVoice);
      if (matched) utterance.voice = matched;
    }

    utterance.onend = () => {
      btn.classList.remove('shanbay-tts-playing');
      btn.textContent = '🔊';
      currentUtterance = null;
    };
    utterance.onerror = () => {
      btn.classList.remove('shanbay-tts-playing');
      btn.textContent = '🔊';
      if (!isStoppingTTS) {
        showNotification('朗读失败', 'error');
      }
      isStoppingTTS = false;
      currentUtterance = null;
    };
    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
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

  // 监听URL变化（SPA导航时清理翻译结果）
  function setupNavigationCleanup() {
    // 监听浏览器后退/前进（bfcache恢复）
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        console.log('[翻译助手] 页面从缓存恢复，清理翻译结果');
        cleanupPreviousTranslations();
      }
    });

    // 监听popstate（浏览器后退/前进按钮）
    window.addEventListener('popstate', () => {
      console.log('[翻译助手] popstate事件，清理翻译结果');
      cleanupPreviousTranslations();
    });

    // 拦截SPA导航（pushState/replaceState）
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function() {
      originalPushState.apply(this, arguments);
      console.log('[翻译助手] pushState，清理翻译结果');
      cleanupPreviousTranslations();
    };

    history.replaceState = function() {
      originalReplaceState.apply(this, arguments);
      console.log('[翻译助手] replaceState，清理翻译结果');
      cleanupPreviousTranslations();
    };
  }

  // 初始化插件
  init();
})();
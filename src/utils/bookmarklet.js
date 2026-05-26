// 扇贝阅读翻译助手 - 书签版
(function() {
  'use strict';

  // 配置
  const CONFIG = {
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
    translateButtonClass: 'shanbay-translate-btn',
    translationResultClass: 'shanbay-translation-result',
    loadingClass: 'shanbay-loading'
  };

  // 翻译缓存
  const translationCache = new Map();

  // 初始化
  function init() {
    console.log('[翻译助手] 脚本已加载');
    setupTranslationButtons();
    setupMutationObserver();
  }

  // 设置翻译按钮
  function setupTranslationButtons() {
    const paragraphs = findParagraphs();
    console.log('[翻译助手] 找到', paragraphs.length, '个段落');

    paragraphs.forEach((paragraph, index) => {
      if (paragraph.querySelector('.' + CONFIG.translateButtonClass)) {
        return;
      }

      const translateButton = createTranslateButton(paragraph, index);
      paragraph.style.position = 'relative';
      paragraph.appendChild(translateButton);
    });
  }

  // 查找段落元素
  function findParagraphs() {
    const paragraphs = [];

    for (const selector of CONFIG.paragraphSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        const validParagraphs = Array.from(elements).filter(el => {
          const text = el.textContent.trim();
          return text.length > 10 && !el.querySelector('.' + CONFIG.translateButtonClass);
        });

        if (validParagraphs.length > 0) {
          paragraphs.push(...validParagraphs);
          break;
        }
      }
    }

    return paragraphs;
  }

  // 创建翻译按钮
  function createTranslateButton(paragraph, index) {
    const button = document.createElement('button');
    button.className = CONFIG.translateButtonClass;
    button.innerHTML = '译';
    button.title = '翻译此段落';
    button.style.cssText = 'position:absolute;right:-30px;top:50%;transform:translateY(-50%);width:24px;height:24px;border:none;border-radius:50%;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;font-size:12px;font-weight:bold;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:all 0.3s ease;box-shadow:0 2px 8px rgba(102,126,234,0.4);z-index:1000;padding:0;line-height:1;';

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleTranslateClick(paragraph, button);
    });

    // 鼠标悬浮显示按钮
    paragraph.addEventListener('mouseenter', () => {
      button.style.opacity = '1';
    });
    paragraph.addEventListener('mouseleave', () => {
      button.style.opacity = '0';
    });

    return button;
  }

  // 处理翻译按钮点击
  async function handleTranslateClick(paragraph, button) {
    const text = paragraph.textContent.trim();
    console.log('[翻译助手] 翻译文本:', text.substring(0, 50) + '...');

    if (!text) {
      alert('没有可翻译的文本');
      return;
    }

    // 检查缓存
    if (translationCache.has(text)) {
      showTranslationResult(paragraph, translationCache.get(text));
      return;
    }

    // 显示加载状态
    button.innerHTML = '...';
    button.disabled = true;

    try {
      // 使用免费翻译API
      const translation = await translateText(text);

      // 缓存翻译结果
      translationCache.set(text, translation);

      // 显示翻译结果
      showTranslationResult(paragraph, translation);

    } catch (error) {
      console.error('[翻译助手] 翻译失败:', error);
      alert('翻译失败: ' + error.message);
    } finally {
      // 恢复按钮状态
      button.innerHTML = '译';
      button.disabled = false;
    }
  }

  // 调用翻译API
  async function translateText(text) {
    // 使用免费翻译API
    const url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text) + '&langpair=en|zh-CN';
    const response = await fetch(url);
    const data = await response.json();

    if (data.responseStatus === 200) {
      return data.responseData.translatedText;
    } else {
      throw new Error('翻译失败');
    }
  }

  // 显示翻译结果
  function showTranslationResult(paragraph, translation) {
    // 移除已有的翻译结果
    const existingResult = paragraph.querySelector('.' + CONFIG.translationResultClass);
    if (existingResult) {
      existingResult.remove();
      return;
    }

    // 创建翻译结果容器
    const resultContainer = document.createElement('div');
    resultContainer.className = CONFIG.translationResultClass;
    resultContainer.style.cssText = 'margin-top:12px;margin-bottom:12px;padding:16px;background:linear-gradient(135deg,#f8f9ff 0%,#f0f4ff 100%);border-left:4px solid #667eea;border-radius:0 8px 8px 0;position:relative;box-shadow:0 2px 12px rgba(102,126,234,0.1);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';

    // 创建翻译结果内容
    const resultContent = document.createElement('div');
    resultContent.style.cssText = 'color:#4a5568;font-size:14px;line-height:1.6;margin:0;padding:0;';
    resultContent.textContent = translation;

    // 创建关闭按钮
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.title = '关闭翻译';
    closeButton.style.cssText = 'position:absolute;top:8px;right:8px;width:20px;height:20px;border:none;background:rgba(102,126,234,0.2);color:#667eea;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:50%;padding:0;line-height:1;';
    closeButton.addEventListener('click', () => {
      resultContainer.remove();
    });

    // 组装元素
    resultContainer.appendChild(closeButton);
    resultContainer.appendChild(resultContent);

    // 添加到段落后面
    paragraph.appendChild(resultContainer);
  }

  // 设置MutationObserver监听DOM变化
  function setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          setTimeout(setupTranslationButtons, 500);
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // 初始化插件
  init();
})();
// 扇贝阅读翻译助手 - 后台脚本
(function() {
  'use strict';

  // 当前使用的翻译引擎
  let currentEngine = 'baidu';

  // 百度AI平台翻译API配置
  const BAIDU_CONFIG = {
    tokenUrl: 'https://aip.baidubce.com/oauth/2.0/token',
    translateUrl: 'https://aip.baidubce.com/rpc/2.0/mt/texttrans/v1',
    apiKey: '',
    secretKey: '',
    accessToken: '',
    tokenExpiry: 0
  };

  // DeepSeek API配置
  const DEEPSEEK_CONFIG = {
    apiUrl: 'https://api.deepseek.com/chat/completions',
    apiKey: '',
    model: 'deepseek-chat'
  };

  // 翻译缓存
  const translationCache = new Map();

  // 监听来自content script的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'translate') {
      handleTranslateRequest(request, sendResponse);
      return true;
    }

    if (request.action === 'getConfig') {
      sendResponse({
        engine: currentEngine,
        baiduApiKey: BAIDU_CONFIG.apiKey,
        baiduSecretKey: BAIDU_CONFIG.secretKey,
        deepseekApiKey: DEEPSEEK_CONFIG.apiKey
      });
      return true;
    }

    if (request.action === 'setConfig') {
      currentEngine = request.engine || 'baidu';

      if (request.engine === 'deepseek') {
        DEEPSEEK_CONFIG.apiUrl = request.deepseekApiUrl || 'https://api.deepseek.com/chat/completions';
        DEEPSEEK_CONFIG.apiKey = request.deepseekApiKey || '';
        DEEPSEEK_CONFIG.model = request.deepseekModel || 'deepseek-chat';
        chrome.storage.sync.set({
          translationEngine: 'deepseek',
          deepseekApiUrl: DEEPSEEK_CONFIG.apiUrl,
          deepseekApiKey: DEEPSEEK_CONFIG.apiKey,
          deepseekModel: DEEPSEEK_CONFIG.model
        });
      } else {
        BAIDU_CONFIG.apiKey = request.baiduApiKey || '';
        BAIDU_CONFIG.secretKey = request.baiduSecretKey || '';
        BAIDU_CONFIG.accessToken = '';
        BAIDU_CONFIG.tokenExpiry = 0;
        chrome.storage.sync.set({
          translationEngine: 'baidu',
          baiduApiKey: BAIDU_CONFIG.apiKey,
          baiduSecretKey: BAIDU_CONFIG.secretKey
        });
      }

      sendResponse({ success: true });
      return true;
    }
  });

  // 处理翻译请求
  async function handleTranslateRequest(request, sendResponse) {
    const { text, from, to } = request;

    // 确保配置已加载
    await ensureConfigLoaded();

    // 检查缓存
    const cacheKey = `${currentEngine}_${text}_${from}_${to}`;
    if (translationCache.has(cacheKey)) {
      sendResponse({
        success: true,
        translation: translationCache.get(cacheKey)
      });
      return;
    }

    try {
      let translation;

      if (currentEngine === 'deepseek') {
        translation = await callDeepSeekTranslate(text, from, to);
      } else {
        translation = await callBaiduTranslate(text, from, to);
      }

      // 缓存结果
      translationCache.set(cacheKey, translation);

      sendResponse({
        success: true,
        translation: translation
      });

    } catch (error) {
      console.error('翻译失败:', error);
      sendResponse({
        success: false,
        error: error.message || '翻译失败，请稍后重试'
      });
    }
  }

  // ========== 配置加载 ==========

  let configLoaded = false;

  function ensureConfigLoaded() {
    if (configLoaded) return Promise.resolve();

    return new Promise((resolve) => {
      chrome.storage.sync.get(['translationEngine', 'baiduApiKey', 'baiduSecretKey', 'deepseekApiUrl', 'deepseekApiKey', 'deepseekModel'], (result) => {
        if (result.translationEngine) {
          currentEngine = result.translationEngine;
        }
        if (result.baiduApiKey) {
          BAIDU_CONFIG.apiKey = result.baiduApiKey;
        }
        if (result.baiduSecretKey) {
          BAIDU_CONFIG.secretKey = result.baiduSecretKey;
        }
        if (result.deepseekApiUrl) {
          DEEPSEEK_CONFIG.apiUrl = result.deepseekApiUrl;
        }
        if (result.deepseekApiKey) {
          DEEPSEEK_CONFIG.apiKey = result.deepseekApiKey;
        }
        if (result.deepseekModel) {
          DEEPSEEK_CONFIG.model = result.deepseekModel;
        }
        configLoaded = true;
        resolve();
      });
    });
  }

  // ========== 百度翻译 ==========

  async function callBaiduTranslate(text, from, to) {
    if (!BAIDU_CONFIG.apiKey || !BAIDU_CONFIG.secretKey) {
      throw new Error('请先配置百度翻译API');
    }

    await ensureAccessToken();

    const url = `${BAIDU_CONFIG.translateUrl}?access_token=${BAIDU_CONFIG.accessToken}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: from || 'en',
        to: to || 'zh',
        q: text
      })
    });

    if (!response.ok) {
      throw new Error('翻译请求失败: HTTP ' + response.status);
    }

    const data = await response.json();

    if (data.error_code) {
      throw new Error(getBaiduErrorMessage(data.error_code));
    }

    if (data.result && data.result.trans_result) {
      return data.result.trans_result.map(item => item.dst).join('\n');
    }

    throw new Error('没有获取到翻译结果');
  }

  async function ensureAccessToken() {
    const now = Date.now();

    if (BAIDU_CONFIG.accessToken && now < BAIDU_CONFIG.tokenExpiry) {
      return;
    }

    const url = `${BAIDU_CONFIG.tokenUrl}?grant_type=client_credentials&client_id=${BAIDU_CONFIG.apiKey}&client_secret=${BAIDU_CONFIG.secretKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error('获取access_token失败: HTTP ' + response.status);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error('获取access_token失败: ' + data.error_description);
    }

    BAIDU_CONFIG.accessToken = data.access_token;
    BAIDU_CONFIG.tokenExpiry = now + (data.expires_in - 3600) * 1000;
  }

  function getBaiduErrorMessage(errorCode) {
    const errorMessages = {
      '1': '服务端请求错误',
      '2': '服务不可用',
      '3': '鉴权失败',
      '4': '超额',
      '6': '无权限访问',
      '17': '日请求量超限',
      '18': 'QPS超限',
      '100': '参数错误',
      '101': '缺少必填参数',
      '102': '不支持的语言',
      '103': '翻译文本过长',
      '108': 'appKey无效'
    };
    return errorMessages[errorCode] || `翻译失败，错误码: ${errorCode}`;
  }

  // ========== DeepSeek翻译 ==========

  async function callDeepSeekTranslate(text, from, to) {
    if (!DEEPSEEK_CONFIG.apiKey) {
      throw new Error('请先配置DeepSeek API Key');
    }

    const fromLang = from === 'en' ? '英文' : from;
    const toLang = to === 'zh' ? '中文' : to;

    const response = await fetch(DEEPSEEK_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_CONFIG.apiKey}`
      },
      body: JSON.stringify({
        model: DEEPSEEK_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: `你是一个翻译助手，请将用户输入的${fromLang}翻译为${toLang}。只输出翻译结果，不要添加任何解释。`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error?.message || 'DeepSeek请求失败: HTTP ' + response.status);
    }

    const data = await response.json();

    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content.trim();
    }

    throw new Error('没有获取到翻译结果');
  }

  // ========== 右键菜单 ==========

  // 创建右键菜单
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: 'shanbay-translate',
      title: '翻译选中内容',
      contexts: ['selection']
    });
  });

  // 处理右键菜单点击
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'shanbay-translate' && info.selectionText) {
      const text = info.selectionText.trim();
      if (!text) return;

      try {
        let translation;

        if (currentEngine === 'deepseek') {
          translation = await callDeepSeekTranslate(text, 'en', 'zh');
        } else {
          translation = await callBaiduTranslate(text, 'en', 'zh');
        }

        // 发送结果给content script显示
        chrome.tabs.sendMessage(tab.id, {
          action: 'showContextTranslation',
          original: text,
          translation: translation
        });

      } catch (error) {
        console.error('右键翻译失败:', error);
        chrome.tabs.sendMessage(tab.id, {
          action: 'showContextTranslation',
          original: text,
          translation: null,
          error: error.message
        });
      }
    }
  });

  // ========== 初始化 ==========

  ensureConfigLoaded();

})();

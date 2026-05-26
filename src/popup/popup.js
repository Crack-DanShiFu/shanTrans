// 扇贝阅读翻译助手 - 弹出窗口脚本
(function() {
  'use strict';

  // DOM元素
  const elements = {
    engineRadios: document.querySelectorAll('input[name="engine"]'),
    baiduConfig: document.getElementById('baiduConfig'),
    deepseekConfig: document.getElementById('deepseekConfig'),
    baiduApiKey: document.getElementById('baiduApiKey'),
    baiduSecretKey: document.getElementById('baiduSecretKey'),
    deepseekApiUrl: document.getElementById('deepseekApiUrl'),
    deepseekApiKey: document.getElementById('deepseekApiKey'),
    deepseekModel: document.getElementById('deepseekModel'),
    deepseekModelCustom: document.getElementById('deepseekModelCustom'),
    modelChips: document.querySelectorAll('.model-item'),
    saveConfig: document.getElementById('saveConfig'),
    testConfig: document.getElementById('testConfig'),
    apiStatus: document.getElementById('apiStatus'),
    displayModeRadios: document.querySelectorAll('input[name="displayMode"]'),
    sidebarSelectorGroup: document.getElementById('sidebarSelectorGroup'),
    sidebarSelector: document.getElementById('sidebarSelector'),
    saveDisplayConfig: document.getElementById('saveDisplayConfig'),
    showOriginal: document.getElementById('showOriginal'),
    hideTitle: document.getElementById('hideTitle'),
    hideButton: document.getElementById('hideButton')
  };

  // 初始化
  function init() {
    loadConfig();
    loadDisplayConfig();
    bindEvents();
    setupTabs();
  }

  // Tab切换
  function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
      });
    });
  }

  // 加载API配置
  function loadConfig() {
    chrome.storage.sync.get(['translationEngine', 'baiduApiKey', 'baiduSecretKey', 'deepseekApiUrl', 'deepseekApiKey', 'deepseekModel'], (result) => {
      const engine = result.translationEngine || 'baidu';

      // 设置引擎选择
      elements.engineRadios.forEach(radio => {
        radio.checked = radio.value === engine;
      });

      // 显示/隐藏对应配置
      const isBaidu = engine === 'baidu';
      elements.baiduConfig.style.display = isBaidu ? 'block' : 'none';
      elements.deepseekConfig.style.display = isBaidu ? 'none' : 'block';

      // 填充配置值
      if (result.baiduApiKey) elements.baiduApiKey.value = result.baiduApiKey;
      if (result.baiduSecretKey) elements.baiduSecretKey.value = result.baiduSecretKey;
      if (result.deepseekApiUrl) elements.deepseekApiUrl.value = result.deepseekApiUrl;
      if (result.deepseekApiKey) elements.deepseekApiKey.value = result.deepseekApiKey;
      if (result.deepseekModel) {
        elements.deepseekModel.value = result.deepseekModel;
        // 设置对应的chip为active
        let found = false;
        elements.modelChips.forEach(chip => {
          chip.classList.remove('active');
          if (chip.dataset.value === result.deepseekModel) {
            chip.classList.add('active');
            found = true;
          }
        });
        if (!found) {
          // 自定义模型
          elements.modelChips.forEach(chip => {
            if (chip.dataset.value === 'custom') {
              chip.classList.add('active');
            }
          });
          elements.deepseekModelCustom.style.display = 'block';
          elements.deepseekModelCustom.value = result.deepseekModel;
        }
      }
    });
  }

  // 加载显示配置
  function loadDisplayConfig() {
    chrome.storage.sync.get(['displayMode', 'sidebarSelector', 'showOriginal', 'hideTitle', 'hideButton'], (result) => {
      const mode = result.displayMode || 'sidebar';
      const selector = result.sidebarSelector || '.sideBar';

      elements.displayModeRadios.forEach(radio => {
        radio.checked = radio.value === mode;
      });

      elements.sidebarSelector.value = selector;
      elements.sidebarSelectorGroup.style.display = mode === 'sidebar' ? 'block' : 'none';

      elements.showOriginal.checked = result.showOriginal !== false;
      elements.hideTitle.checked = result.hideTitle === true;
      elements.hideButton.checked = result.hideButton === true;
    });
  }

  // 绑定事件
  function bindEvents() {
    // 引擎切换
    elements.engineRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        const isBaidu = radio.value === 'baidu';
        elements.baiduConfig.style.display = isBaidu ? 'block' : 'none';
        elements.deepseekConfig.style.display = isBaidu ? 'none' : 'block';
        hideStatus();
      });
    });

    elements.saveConfig.addEventListener('click', saveConfig);
    elements.testConfig.addEventListener('click', testConfig);

    elements.baiduApiKey.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') saveConfig();
    });
    elements.baiduSecretKey.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') saveConfig();
    });
    elements.deepseekApiKey.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') saveConfig();
    });

    // 显示模式切换
    elements.displayModeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        elements.sidebarSelectorGroup.style.display = radio.value === 'sidebar' ? 'block' : 'none';
      });
    });

    elements.saveDisplayConfig.addEventListener('click', saveDisplayConfig);

    // 模型选择chips
    elements.modelChips.forEach(chip => {
      chip.addEventListener('click', () => {
        elements.modelChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        const value = chip.dataset.value;
        if (value === 'custom') {
          elements.deepseekModelCustom.style.display = 'block';
          elements.deepseekModelCustom.focus();
          elements.deepseekModel.value = elements.deepseekModelCustom.value || '';
        } else {
          elements.deepseekModelCustom.style.display = 'none';
          elements.deepseekModel.value = value;
        }
      });
    });

    // 自定义模型输入
    elements.deepseekModelCustom.addEventListener('input', () => {
      elements.deepseekModel.value = elements.deepseekModelCustom.value;
    });
  }

  // 保存API配置
  function saveConfig() {
    const engine = document.querySelector('input[name="engine"]:checked').value;

    if (engine === 'deepseek') {
      const deepseekApiKey = elements.deepseekApiKey.value.trim();
      const deepseekApiUrl = elements.deepseekApiUrl.value.trim() || 'https://api.deepseek.com/chat/completions';
      const deepseekModel = elements.deepseekModel.value.trim() || 'deepseek-chat';

      if (!deepseekApiKey) {
        showStatus('请填写DeepSeek API Key', 'error');
        return;
      }

      chrome.runtime.sendMessage({
        action: 'setConfig',
        engine: 'deepseek',
        deepseekApiUrl: deepseekApiUrl,
        deepseekApiKey: deepseekApiKey,
        deepseekModel: deepseekModel
      }, (response) => {
        if (response && response.success) {
          showStatus('DeepSeek配置保存成功！', 'success');
        } else {
          showStatus('配置保存失败，请重试', 'error');
        }
      });

    } else {
      const baiduApiKey = elements.baiduApiKey.value.trim();
      const baiduSecretKey = elements.baiduSecretKey.value.trim();

      if (!baiduApiKey || !baiduSecretKey) {
        showStatus('请填写API Key和Secret Key', 'error');
        return;
      }

      chrome.runtime.sendMessage({
        action: 'setConfig',
        engine: 'baidu',
        baiduApiKey: baiduApiKey,
        baiduSecretKey: baiduSecretKey
      }, (response) => {
        if (response && response.success) {
          showStatus('百度翻译配置保存成功！', 'success');
        } else {
          showStatus('配置保存失败，请重试', 'error');
        }
      });
    }
  }

  // 测试配置
  async function testConfig() {
    const engine = document.querySelector('input[name="engine"]:checked').value;

    if (engine === 'deepseek') {
      const deepseekApiKey = elements.deepseekApiKey.value.trim();
      const deepseekApiUrl = elements.deepseekApiUrl.value.trim() || 'https://api.deepseek.com/chat/completions';
      const deepseekModel = elements.deepseekModel.value.trim() || 'deepseek-chat';

      if (!deepseekApiKey) {
        showStatus('请先填写DeepSeek API Key', 'error');
        return;
      }

      elements.testConfig.textContent = '测试中...';
      elements.testConfig.disabled = true;
      hideStatus();

      try {
        // 先保存
        await new Promise((resolve) => {
          chrome.runtime.sendMessage({
            action: 'setConfig',
            engine: 'deepseek',
            deepseekApiUrl: deepseekApiUrl,
            deepseekApiKey: deepseekApiKey,
            deepseekModel: deepseekModel
          }, resolve);
        });

        // 测试翻译
        const response = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({
            action: 'translate',
            text: 'Hello, world!',
            from: 'en',
            to: 'zh'
          }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });

        if (response.success) {
          showStatus('连接成功！翻译测试: Hello, world! → ' + response.translation, 'success');
        } else {
          showStatus('连接失败: ' + (response.error || '未知错误'), 'error');
        }

      } catch (error) {
        showStatus('连接失败: ' + error.message, 'error');
      } finally {
        elements.testConfig.textContent = '测试连接';
        elements.testConfig.disabled = false;
      }

    } else {
      const baiduApiKey = elements.baiduApiKey.value.trim();
      const baiduSecretKey = elements.baiduSecretKey.value.trim();

      if (!baiduApiKey || !baiduSecretKey) {
        showStatus('请先填写API Key和Secret Key', 'error');
        return;
      }

      elements.testConfig.textContent = '测试中...';
      elements.testConfig.disabled = true;
      hideStatus();

      try {
        await new Promise((resolve) => {
          chrome.runtime.sendMessage({
            action: 'setConfig',
            engine: 'baidu',
            baiduApiKey: baiduApiKey,
            baiduSecretKey: baiduSecretKey
          }, resolve);
        });

        const response = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({
            action: 'translate',
            text: 'Hello, world!',
            from: 'en',
            to: 'zh'
          }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });

        if (response.success) {
          showStatus('连接成功！翻译测试: Hello, world! → ' + response.translation, 'success');
        } else {
          showStatus('连接失败: ' + (response.error || '未知错误'), 'error');
        }

      } catch (error) {
        showStatus('连接失败: ' + error.message, 'error');
      } finally {
        elements.testConfig.textContent = '测试连接';
        elements.testConfig.disabled = false;
      }
    }
  }

  // 保存显示配置
  function saveDisplayConfig() {
    const selectedMode = document.querySelector('input[name="displayMode"]:checked');
    const mode = selectedMode ? selectedMode.value : 'sidebar';
    const selector = elements.sidebarSelector.value.trim() || '.sideBar';
    const showOriginal = elements.showOriginal.checked;
    const hideTitle = elements.hideTitle.checked;
    const hideButton = elements.hideButton.checked;

    chrome.storage.sync.set({
      displayMode: mode,
      sidebarSelector: selector,
      showOriginal: showOriginal,
      hideTitle: hideTitle,
      hideButton: hideButton
    }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'updateDisplayConfig',
            displayMode: mode,
            sidebarSelector: selector
          });
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'updateDisplayOptions',
            showOriginal: showOriginal,
            hideTitle: hideTitle,
            hideButton: hideButton
          });
        }
      });

      showStatus('显示设置保存成功！', 'success');
    });
  }

  // 显示状态信息
  function showStatus(message, type) {
    elements.apiStatus.textContent = message;
    elements.apiStatus.className = type;
    setTimeout(() => {
      hideStatus();
    }, 5000);
  }

  function hideStatus() {
    elements.apiStatus.textContent = '';
    elements.apiStatus.className = '';
  }

  // 初始化
  init();
})();

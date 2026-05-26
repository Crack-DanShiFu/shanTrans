// 扇贝阅读网站结构分析脚本
// 在控制台运行此脚本查看页面结构

(function() {
  console.log('=== 扇贝阅读网站结构分析 ===');
  console.log('');

  // 1. 页面基本信息
  console.log('1. 页面信息');
  console.log('   URL:', window.location.href);
  console.log('   标题:', document.title);
  console.log('');

  // 2. 查找主要内容容器
  console.log('2. 查找主要内容容器');
  const mainSelectors = [
    'article',
    '.article',
    '.content',
    '.main-content',
    '.article-content',
    '.news-content',
    '.reading-content',
    '.text-content',
    '.paragraph',
    '[class*="article"]',
    '[class*="content"]',
    '[class*="text"]',
    '[class*="paragraph"]',
    '[class*="body"]',
    '[class*="main"]'
  ];

  mainSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`   ${selector}: ${elements.length} 个元素`);
      if (elements.length <= 3) {
        elements.forEach((el, i) => {
          console.log(`     - ${el.tagName}.${el.className} (${el.textContent.trim().substring(0, 30)}...)`);
        });
      }
    }
  });
  console.log('');

  // 3. 查找所有包含文本的元素
  console.log('3. 查找包含文本的元素');
  const allElements = document.querySelectorAll('*');
  const textElements = [];

  allElements.forEach(el => {
    const text = el.textContent.trim();
    // 检查是否是叶子节点（没有子元素或只有文本节点）
    const isLeaf = el.children.length === 0 ||
      (el.children.length === 1 && el.children[0].nodeType === 3);

    if (text.length > 20 && text.length < 1000 && isLeaf) {
      textElements.push({
        element: el,
        tag: el.tagName,
        class: el.className,
        id: el.id,
        text: text.substring(0, 50) + '...'
      });
    }
  });

  console.log(`   找到 ${textElements.length} 个包含文本的元素`);
  if (textElements.length > 0) {
    console.log('   前10个:');
    textElements.slice(0, 10).forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.tag}.${item.class}`);
      console.log(`      文本: ${item.text}`);
    });
  }
  console.log('');

  // 4. 查找p标签
  console.log('4. 查找p标签');
  const pTags = document.querySelectorAll('p');
  console.log(`   找到 ${pTags.length} 个p标签`);
  if (pTags.length > 0) {
    pTags.forEach((p, i) => {
      const text = p.textContent.trim();
      if (text.length > 10) {
        console.log(`   ${i + 1}. ${p.className || '(无类名)'}`);
        console.log(`      文本: ${text.substring(0, 50)}...`);
      }
    });
  }
  console.log('');

  // 5. 查找div标签
  console.log('5. 查找div标签');
  const divTags = document.querySelectorAll('div');
  let divCount = 0;
  divTags.forEach(div => {
    const text = div.textContent.trim();
    if (text.length > 20 && text.length < 500 && div.children.length <= 2) {
      if (divCount < 5) {
        console.log(`   ${divCount + 1}. ${div.className || '(无类名)'}`);
        console.log(`      文本: ${text.substring(0, 50)}...`);
      }
      divCount++;
    }
  });
  console.log(`   共找到 ${divCount} 个可能的文本div`);
  console.log('');

  // 6. 查找span标签
  console.log('6. 查找span标签');
  const spanTags = document.querySelectorAll('span');
  let spanCount = 0;
  spanTags.forEach(span => {
    const text = span.textContent.trim();
    if (text.length > 20) {
      if (spanCount < 5) {
        console.log(`   ${spanCount + 1}. ${span.className || '(无类名)'}`);
        console.log(`      文本: ${text.substring(0, 50)}...`);
      }
      spanCount++;
    }
  });
  console.log(`   共找到 ${spanCount} 个可能的文本span`);
  console.log('');

  // 7. 输出页面结构概览
  console.log('7. 页面结构概览');
  const body = document.body;
  console.log('   Body子元素:');
  Array.from(body.children).forEach((child, i) => {
    if (i < 10) {
      console.log(`   ${i + 1}. ${child.tagName}.${child.className}`);
    }
  });
  console.log('');

  // 8. 查找iframe
  console.log('8. 查找iframe');
  const iframes = document.querySelectorAll('iframe');
  console.log(`   找到 ${iframes.length} 个iframe`);
  if (iframes.length > 0) {
    iframes.forEach((iframe, i) => {
      console.log(`   ${i + 1}. src: ${iframe.src || '(无src)'}`);
    });
  }
  console.log('');

  console.log('=== 分析完成 ===');
  console.log('');
  console.log('请将以上信息发送给我，我将帮助您调整翻译助手。');
})();
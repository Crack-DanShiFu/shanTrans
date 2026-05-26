// 快速分析脚本 - 直接在控制台运行
// 复制以下代码到控制台运行

console.log('=== 快速分析 ===');

// 查找所有可能的文本容器
const containers = document.querySelectorAll('p, div, span, article, section');
let found = false;

containers.forEach(el => {
  const text = el.textContent.trim();
  if (text.length > 30 && text.length < 500) {
    // 检查是否是叶子节点
    const isLeaf = el.children.length === 0 ||
      (el.children.length === 1 && el.children[0].nodeType === 3);

    if (isLeaf) {
      console.log('找到文本元素:');
      console.log('  标签:', el.tagName);
      console.log('  类名:', el.className || '(无)');
      console.log('  ID:', el.id || '(无)');
      console.log('  文本:', text.substring(0, 100) + '...');
      console.log('  父元素:', el.parentElement.tagName + '.' + el.parentElement.className);
      console.log('');
      found = true;
    }
  }
});

if (!found) {
  console.log('未找到明显的文本容器');
  console.log('');
  console.log('页面URL:', window.location.href);
  console.log('页面标题:', document.title);
  console.log('');
  console.log('Body子元素:');
  Array.from(document.body.children).forEach((child, i) => {
    console.log((i + 1) + '.', child.tagName, child.className);
  });
}

console.log('=== 分析完成 ===');
const fs = require('fs');
const { createCanvas } = require('canvas');

// 图标尺寸
const sizes = [16, 48, 128];

// 生成图标
function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // 绘制背景圆形
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');

  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 - 2, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = 'white';
  ctx.lineWidth = size * 0.03;
  ctx.stroke();

  // 绘制地球仪
  ctx.strokeStyle = 'white';
  ctx.lineWidth = size * 0.025;
  ctx.beginPath();
  ctx.arc(size/2, size*0.42, size*0.22, 0, Math.PI * 2);
  ctx.stroke();

  // 绘制经纬线
  ctx.lineWidth = size * 0.015;
  ctx.beginPath();
  ctx.ellipse(size/2, size*0.42, size*0.09, size*0.22, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(size*0.28, size*0.42);
  ctx.lineTo(size*0.72, size*0.42);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(size/2, size*0.2);
  ctx.lineTo(size/2, size*0.64);
  ctx.stroke();

  // 绘制文字"译"
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size*0.19}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('译', size/2, size*0.77);

  return canvas;
}

// 主函数
function main() {
  console.log('扇贝阅读翻译助手 - 图标生成器');
  console.log('================================');
  console.log('');

  // 确保icons目录存在
  if (!fs.existsSync('./icons')) {
    fs.mkdirSync('./icons');
  }

  // 生成每个尺寸的图标
  sizes.forEach(size => {
    console.log(`生成 ${size}x${size} 图标...`);
    const canvas = generateIcon(size);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`./icons/icon${size}.png`, buffer);
    console.log(`✓ 已保存: icons/icon${size}.png`);
  });

  console.log('');
  console.log('图标生成完成！');
  console.log('');
  console.log('请将生成的图标文件放到插件的 icons 目录中。');
  console.log('');

  // 检查是否需要安装canvas模块
  try {
    require.resolve('canvas');
  } catch (e) {
    console.log('注意：如果上述命令失败，请先安装canvas模块：');
    console.log('npm install canvas');
    console.log('');
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = { generateIcon };
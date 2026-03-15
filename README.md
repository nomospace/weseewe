# 🎮 WeSeeWe - 跳跃方块

> 踩对颜色，跳得更高！纯 Canvas 实现的跳跃类小游戏

## 🎯 游戏玩法

- **点击屏幕**或**按空格键**跳跃
- 支持**二段跳**
- 踩在**目标颜色**的方块上得 **10 分**
- 踩在其他颜色方块上得 **1 分**
- 掉出屏幕则游戏结束

## ✨ 特性

- 🎨 纯 Canvas 实现，无框架依赖
- 📱 支持移动端和桌面端
- 🎵 触控和键盘操作
- 🏆 本地最高分记录
- ⚡ 轻量级，快速加载

## 🌐 在线体验

- **GitHub Pages**: https://nomospace.github.io/weseewe/

## 🚀 本地运行

```bash
# 克隆项目
git clone https://github.com/nomospace/weseewe.git
cd weseewe

# 使用任意 HTTP 服务器
python3 -m http.server 8080
# 或
npx serve .

# 访问 http://localhost:8080
```

## 📁 项目结构

```
weseewe/
├── index.html      # 游戏入口
├── game.js         # 游戏逻辑
├── README.md       # 说明文档
└── res/            # 资源文件
    └── favicon.ico
```

## 🎮 操作说明

| 操作 | 方式 |
|------|------|
| 跳跃 | 点击屏幕 / 空格键 |
| 二段跳 | 空中再次跳跃 |

## 🎨 游戏截图

游戏界面展示跳跃方块在彩色柱子上跳跃的场景。

## 📄 许可证

MIT License

---

_Created by [nomospace](https://github.com/nospace)_
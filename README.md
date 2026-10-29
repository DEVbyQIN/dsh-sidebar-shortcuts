# 侧栏快捷入口 / dsh-sidebar-shortcuts

将 DeepSeek Harness 工作区上方的功能入口显示为紧凑双列或图标宫格。使用原生按钮，保留原生点击、选中和键盘行为。

[English](README_EN.md) · MIT · 零运行时依赖

[![verify](https://github.com/DEVbyQIN/dsh-sidebar-shortcuts/actions/workflows/verify.yml/badge.svg)](https://github.com/DEVbyQIN/dsh-sidebar-shortcuts/actions/workflows/verify.yml)

## 使用

进入 **底部更多 → 设置 → 侧栏快捷入口**（旧版为底部“设置”）：

- **图标宫格**：默认模式，两列，图标在上、文字在下。
- **紧凑双列**：两列，图标与文字并排，占用更少高度。
- **关闭，恢复原生**：恢复原生排列和所有入口，保留你的显示偏好，方便以后重新启用。
- **隐藏「更多」按钮**：默认开启，可随时取消。
- **显示的入口**：分别选择每个已注册面板入口。新安装的插件入口默认显示。

新会话、品牌区、工作区和会话列表不受影响。折叠或过窄的侧栏使用原生布局。设置入口始终留在 DSH 原生设置中，即使隐藏所有功能入口也可恢复。

偏好保存在当前浏览器/桌面窗口来源的 `localStorage`，不调用模型；同来源窗口通过 `storage` 事件同步。隐藏入口不会卸载对应功能，也不改变 DSH 原有的入口固定状态。

## 安装

### 桌面版

在 DSH 中打开 **插件 → 添加插件 → 安装已有插件**，输入：

```text
github:DEVbyQIN/dsh-sidebar-shortcuts
```

安装并启用后重新加载界面。`desktop` profile 由 Electron 独占管理，请通过应用内插件管理器安装。

### Web 版

```sh
dsh plugin --profile web add github:DEVbyQIN/dsh-sidebar-shortcuts
```

如没有出现新设置分区，重新加载界面或重启 DSH。目前提供 GitHub 安装，尚未发布到 npm。

## 预览

以下截图来自隔离的 DSH 0.2.1-rc.4，使用空白数据和合成面板入口。

![图标宫格](docs/tiles.png)

![切换布局与隐藏入口](docs/settings.png)

## 本地开发

```sh
git clone https://github.com/DEVbyQIN/dsh-sidebar-shortcuts.git
cd dsh-sidebar-shortcuts
node --test test/verify.mjs
dsh plugin --profile web add "link:$PWD"
```

桌面开发可在应用内安装入口输入克隆目录的绝对路径。

## 验证

```sh
node --test test/verify.mjs
```

测试覆盖模块加载、偏好校验、两种布局、原生模式、入口隐藏、折叠/窄侧栏、动态面板、设置交互、跨窗口同步、存储失败和卸载清理。真实宿主检查使用隔离的 DSH 与合成入口，避免影响现有会话。

禁用或卸载插件会清除其样式、属性标记、设置分区与监听器，保留原生 DOM 和偏好数据。

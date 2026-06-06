# ✦ Vita X — VS Code 插件

你的自进化 AI 编程伙伴。越用越聪明。

## 安装

### 方式一：从 Open VSX Registry 安装（推荐）

1. 打开 VS Code → 扩展面板（`Ctrl+Shift+X`）
2. 点击 `...` 菜单 → "从 VSIX 安装..."
3. 或者直接去 [Open VSX 下载](https://open-vsx.org/extension/vita-x/vita-x)

### 方式二：从 VSIX 文件安装

1. 前往 [GitHub Releases](https://github.com/vita-x/vita-x-vscode/releases) 下载 `.vsix` 文件
2. VS Code → 扩展面板 → `...` → "从 VSIX 安装..."
3. 选择下载的文件即可

### 使用前提

安装后，确保 Vita X 服务在本地运行：
```
cd /path/to/vita/project
python agent_api.py
```

侧边栏出现 Vita X 图标，点击即可开始对话。

## 功能

| 功能 | 快捷键 | 说明 |
|:----|:-------|:-----|
| 打开聊天 | `Vita X: 打开聊天` | 在侧边栏打开对话 |
| 解释代码 | 右键 → `Vita X: 解释选中代码` | 选中代码，一键解释 |
| 修复代码 | 右键 → `Vita X: 修复选中代码` | 自动诊断并修复 Bug |

## 配置

| 配置项 | 默认值 | 说明 |
|:-------|:-------|:-----|
| `vita-x.serverUrl` | `http://localhost:8088` | Vita X 服务器地址 |
| `vita-x.apiKey` | `""` | API 认证密钥 |

## 技术架构

```
VS Code WebView (HTML/JS)
    ↕ fetch + SSE
Vita X Server (Flask, localhost:8088)
    ↕ EventBus
Skills · Memory · Cognition · Immunity
```

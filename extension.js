// Vita X VS Code 插件 — 入口
// 零配置，装即用。连接本地 Vita X 服务器即可。

const vscode = require('vscode');

/** @param {vscode.ExtensionContext} context */
function activate(context) {
    console.log('[Vita X] 插件已激活');

    // 注册侧边栏 WebView
    const provider = new VitaXViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('vita-x.chat', provider, {
            webviewOptions: { retainContextWhenHidden: true }
        })
    );

    // 注册命令
    context.subscriptions.push(
        vscode.commands.registerCommand('vita-x.openChat', () => {
            vscode.commands.executeCommand('workbench.view.extension.vita-x-sidebar');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vita-x.askSelection', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) return vscode.window.showInformationMessage('请先选中代码');
            const selection = editor.document.getText(editor.selection);
            if (!selection) return vscode.window.showInformationMessage('请先选中代码');
            vscode.commands.executeCommand('workbench.view.extension.vita-x-sidebar');
            provider.postMessage({ type: 'ask', text: `解释这段代码：\n\`\`\`\n${selection.slice(0, 1000)}\n\`\`\`` });
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vita-x.fixSelection', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) return vscode.window.showInformationMessage('请先选中代码');
            const selection = editor.document.getText(editor.selection);
            if (!selection) return vscode.window.showInformationMessage('请先选中代码');
            vscode.commands.executeCommand('workbench.view.extension.vita-x-sidebar');
            provider.postMessage({ type: 'ask', text: `修复这段代码的问题：\n\`\`\`\n${selection.slice(0, 1000)}\n\`\`\`` });
        })
    );
}

function deactivate() {}

class VitaXViewProvider {
    /** @param {vscode.Uri} extensionUri */
    constructor(extensionUri) {
        this._extensionUri = extensionUri;
        this._view = null;
    }

    /** @param {vscode.WebviewView} webviewView */
    resolveWebviewView(webviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtml(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'chat':
                    await this._handleChat(message.text, webviewView);
                    break;
                case 'ready':
                    this._sendConfig(webviewView);
                    break;
            }
        });
    }

    postMessage(msg) {
        if (this._view) {
            this._view.webview.postMessage(msg);
        }
    }

    _sendConfig(view) {
        const config = vscode.workspace.getConfiguration('vita-x');
        const serverUrl = config.get('serverUrl', 'http://localhost:8088');
        const apiKey = config.get('apiKey', '');
        view.webview.postMessage({ type: 'config', serverUrl, apiKey });
    }

    async _handleChat(text, view) {
        const config = vscode.workspace.getConfiguration('vita-x');
        const serverUrl = config.get('serverUrl', 'http://localhost:8088');

        // 先发一个 thinking 状态
        view.webview.postMessage({ type: 'thinking', text: '正在思考...' });

        try {
            const response = await fetch(`${serverUrl}/api/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ task: text })
            });

            if (!response.ok) {
                view.webview.postMessage({
                    type: 'error',
                    text: `连接失败 (${response.status})，请确认 Vita X 已在 ${serverUrl} 运行`
                });
                return;
            }

            // 读取 SSE 流
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('event: ')) {
                        const eventType = line.slice(7).trim();
                        if (eventType === 'done') {
                            // done 事件会在后面有 data 行
                            continue;
                        }
                    }
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.text) {
                                view.webview.postMessage({ type: 'token', text: data.text });
                            }
                            if (data.result) {
                                view.webview.postMessage({ type: 'result', text: data.result });
                            }
                            if (data.step) {
                                view.webview.postMessage({ type: 'step', step: data });
                            }
                        } catch (e) {
                            // 非 JSON data 行，忽略
                        }
                    }
                }
            }
        } catch (err) {
            view.webview.postMessage({
                type: 'error',
                text: `无法连接到 Vita X (${serverUrl})。\n请确认 Vita X 已启动：\n  cd project-x && python agent_api.py`
            });
        }
    }

    _getHtml(webview) {
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: var(--vscode-sideBar-background, #1e1e1e);
        color: var(--vscode-sideBar-foreground, #ccc);
        font-size: 13px;
        overflow: hidden;
        height: 100vh;
        display: flex;
        flex-direction: column;
    }
    
    /* 头部 */
    .header {
        padding: 12px 16px;
        border-bottom: 1px solid var(--vscode-panel-border, #333);
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .header .logo {
        font-weight: 700;
        font-size: 15px;
        background: linear-gradient(135deg, #e94560, #00d2ff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .header .status {
        margin-left: auto;
        font-size: 11px;
        color: #888;
    }
    .header .status.online { color: #4ec9b0; }
    .header .status.offline { color: #e94560; }
    
    /* 消息列表 */
    .messages {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
    }
    .msg {
        margin-bottom: 12px;
        padding: 10px 12px;
        border-radius: 8px;
        line-height: 1.5;
        white-space: pre-wrap;
        word-wrap: break-word;
    }
    .msg.user {
        background: var(--vscode-textBlockQuote-background, #2d2d2d);
        border-left: 3px solid #00d2ff;
    }
    .msg.vita {
        background: rgba(233,69,96,0.08);
        border-left: 3px solid #e94560;
    }
    .msg.error {
        background: rgba(233,69,96,0.12);
        border-left: 3px solid #ff0000;
        color: #ff6b6b;
        font-size: 12px;
    }
    .msg .sender {
        font-size: 11px;
        font-weight: 600;
        margin-bottom: 4px;
        opacity: 0.7;
    }
    .msg .cursor {
        display: inline-block;
        width: 6px;
        height: 14px;
        background: #e94560;
        animation: blink 0.8s infinite;
        margin-left: 2px;
        vertical-align: middle;
    }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
    
    /* 输入区 */
    .input-area {
        padding: 12px;
        border-top: 1px solid var(--vscode-panel-border, #333);
        display: flex;
        gap: 8px;
    }
    .input-area textarea {
        flex: 1;
        background: var(--vscode-input-background, #3c3c3c);
        color: var(--vscode-input-foreground, #ccc);
        border: 1px solid var(--vscode-input-border, #555);
        border-radius: 6px;
        padding: 8px 10px;
        font-family: inherit;
        font-size: 13px;
        resize: none;
        min-height: 36px;
        max-height: 120px;
        outline: none;
    }
    .input-area button {
        background: #e94560;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 8px 16px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        align-self: flex-end;
    }
    .input-area button:hover { background: #ff6b6b; }
    .input-area button:disabled { opacity: 0.4; cursor: not-allowed; }
    
    /* 连接提示 */
    .welcome {
        text-align: center;
        padding: 40px 20px;
        color: #666;
        line-height: 1.8;
    }
    .welcome h2 {
        font-size: 18px;
        font-weight: 300;
        margin-bottom: 12px;
        background: linear-gradient(135deg, #e94560, #00d2ff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .welcome p { font-size: 12px; }
    .welcome code {
        background: rgba(255,255,255,0.06);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 12px;
    }
    .welcome .shortcuts {
        margin-top: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .welcome .shortcut {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 8px;
        padding: 10px;
        cursor: pointer;
        transition: 0.2s;
    }
    .welcome .shortcut:hover { border-color: #e94560; background: rgba(233,69,96,0.06); }
    .welcome .shortcut .label { font-size: 13px; color: #ccc; }
    .welcome .shortcut .desc { font-size: 11px; color: #666; margin-top: 4px; }
</style>
</head>
<body>
    <div class="header">
        <span class="logo">✦ Vita X</span>
        <span class="status offline" id="status">未连接</span>
    </div>

    <div class="messages" id="messages">
        <div class="welcome">
            <h2>✦ 欢迎使用 Vita X</h2>
            <p>你的自进化 AI 编程伙伴</p>
            <p id="welcome-connect" style="margin-top:12px;font-size:12px">
                正在连接 <code id="welcome-url">localhost:8088</code>...
            </p>
            <div class="shortcuts">
                <div class="shortcut" onclick="sendText('解释一下当前文件的功能')">
                    <div class="label">📖 解释代码</div>
                    <div class="desc">当前打开的文件做了什么？</div>
                </div>
                <div class="shortcut" onclick="sendText('帮我优化这段代码')">
                    <div class="label">⚡ 优化代码</div>
                    <div class="desc">让代码更简洁、更快</div>
                </div>
                <div class="shortcut" onclick="sendText('这段代码有什么 bug？')">
                    <div class="label">🔍 找 Bug</div>
                    <div class="desc">检查选中的代码</div>
                </div>
            </div>
        </div>
    </div>

    <div class="input-area">
        <textarea id="input" rows="1" placeholder="问 Vita X 任何问题..." 
            onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();send();}"></textarea>
        <button id="sendBtn" onclick="send()" disabled>发送</button>
    </div>

<script>
    const vscode = acquireVsCodeApi();
    const messages = document.getElementById('messages');
    const input = document.getElementById('input');
    const sendBtn = document.getElementById('sendBtn');
    const statusEl = document.getElementById('status');
    let currentMsg = null;
    let loading = false;

    let serverUrl = 'http://localhost:8088';
    let apiKey = '';

    // 监听来自插件的消息
    window.addEventListener('message', event => {
        const msg = event.data;
        switch (msg.type) {
            case 'config':
                serverUrl = msg.serverUrl || serverUrl;
                apiKey = msg.apiKey || '';
                document.getElementById('welcome-url').textContent = serverUrl;
                checkConnection();
                break;
            case 'ask':
                input.value = msg.text;
                send();
                break;
            case 'thinking':
                addMessage('vita', '思考中...', true);
                loading = true;
                break;
            case 'token':
                appendToLast(msg.text);
                break;
            case 'result':
                finalizeMessage(msg.text);
                loading = false;
                break;
            case 'step':
                addMessage('vita', '🔧 ' + (msg.step.tool || '') + ': ' + (msg.step.result || ''));
                break;
            case 'error':
                finalizeMessage('');
                addMessage('error', msg.text);
                loading = false;
                break;
        }
    });

    async function checkConnection() {
        try {
            const r = await fetch(serverUrl + '/api/vita/ping', { signal: AbortSignal.timeout(3000) });
            if (r.ok) {
                statusEl.textContent = '已连接';
                statusEl.className = 'status online';
                sendBtn.disabled = false;
                document.querySelector('.welcome #welcome-connect').textContent = '✅ 已连接到 Vita X，开始对话吧！';
            }
        } catch(e) {
            statusEl.textContent = '未连接';
            statusEl.className = 'status offline';
            sendBtn.disabled = true;
            setTimeout(checkConnection, 5000);
        }
    }

    function send() {
        const text = input.value.trim();
        if (!text || loading) return;
        input.value = '';
        sendText(text);
    }

    function sendText(text) {
        if (!text || loading) return;
        
        // 移除欢迎页
        const welcome = document.querySelector('.welcome');
        if (welcome) welcome.remove();
        
        addMessage('user', text);
        vscode.postMessage({ type: 'chat', text });
    }

    function addMessage(role, text, hasCursor = false) {
        const div = document.createElement('div');
        div.className = 'msg ' + role;
        
        const sender = document.createElement('div');
        sender.className = 'sender';
        sender.textContent = role === 'user' ? '你' : 'Vita X';
        div.appendChild(sender);
        
        const content = document.createElement('div');
        content.className = 'content';
        content.textContent = text;
        if (hasCursor) {
            const cursor = document.createElement('span');
            cursor.className = 'cursor';
            content.appendChild(cursor);
        }
        div.appendChild(content);
        
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
        
        if (hasCursor) currentMsg = content;
        return content;
    }

    function appendToLast(text) {
        if (currentMsg) {
            // 移除光标
            const cursor = currentMsg.querySelector('.cursor');
            if (cursor) cursor.remove();
            currentMsg.textContent += text;
            // 加回光标
            const newCursor = document.createElement('span');
            newCursor.className = 'cursor';
            currentMsg.appendChild(newCursor);
            messages.scrollTop = messages.scrollHeight;
        }
    }

    function finalizeMessage(text) {
        if (currentMsg) {
            const cursor = currentMsg.querySelector('.cursor');
            if (cursor) cursor.remove();
            if (text) currentMsg.textContent = text;
        }
        currentMsg = null;
    }

    // 自动调整 textarea 高度
    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });

    // 通知插件已就绪
    vscode.postMessage({ type: 'ready' });
</script>
</body>
</html>`;
    }
}

module.exports = { activate, deactivate };

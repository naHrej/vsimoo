"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatPanel = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const axios_1 = __importDefault(require("axios"));
class ChatPanel {
    reveal(viewColumn) {
        if (this._panel) {
            this._panel.reveal(viewColumn);
        }
    }
    static createOrShow(extensionUri) {
        const column = vscode.ViewColumn.Two;
        if (ChatPanel.currentPanel) {
            ChatPanel.currentPanel._panel.reveal(column);
            return ChatPanel.currentPanel;
        }
        const panel = vscode.window.createWebviewPanel(ChatPanel.viewType, 'LambdaMOO Chat', column, {
            enableScripts: true,
            retainContextWhenHidden: true,
        });
        ChatPanel.currentPanel = new ChatPanel(panel, extensionUri);
        return ChatPanel.currentPanel;
    }
    constructor(panel, extensionUri) {
        this._disposables = [];
        this._onDidDispose = new vscode.EventEmitter();
        this.onDispose = this._onDidDispose.event;
        this._panel = panel;
        this._panel.webview.html = this._getWebviewContent(extensionUri);
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'sendCommand':
                    if (this._sendCommandCallback) {
                        this._sendCommandCallback(message.text);
                    }
                    return;
                case 'addOutput':
                    this._panel.webview.postMessage({ command: 'addOutput', html: message.html });
                    return;
                case 'loadStyle':
                    const styleContent = await this.fetchStyleContent(message.url);
                    this._panel.webview.postMessage({ command: 'loadStyle', content: styleContent });
                    return;
            }
        }, null, this._disposables);
    }
    dispose() {
        ChatPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
    addOutput(html) {
        if (this._panel) {
            this._panel.webview.postMessage({ command: 'addOutput', html });
        }
    }
    onDidReceiveMessage(callback) {
        if (this._panel) {
            this._panel.webview.onDidReceiveMessage(callback, null, this._disposables);
        }
    }
    setSendCommandCallback(callback) {
        this._sendCommandCallback = callback;
    }
    async fetchStyleContent(url) {
        try {
            const response = await axios_1.default.get(url);
            return response.data;
        }
        catch (error) {
            console.error('Error fetching style content:', error);
            return '';
        }
    }
    async loadStyle(url) {
        const styleContent = await this.fetchStyleContent(url);
        this._panel.webview.postMessage({ command: 'loadStyle', content: styleContent });
    }
    _getWebviewContent(extensionUri) {
        const htmlPath = path.join(extensionUri.fsPath, 'src', 'webview.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        return htmlContent;
    }
}
exports.ChatPanel = ChatPanel;
ChatPanel.viewType = 'lambdaMooChatPanel';
//# sourceMappingURL=chatPanel.js.map
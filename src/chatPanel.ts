import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';

export class ChatPanel {
    public static currentPanel: ChatPanel | undefined;
    private static readonly viewType = 'lambdaMooChatPanel';
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private _sendCommandCallback: ((text: string) => void) | undefined;

    private readonly _onDidDispose = new vscode.EventEmitter<void>();
    public readonly onDispose = this._onDidDispose.event;

    public reveal(viewColumn: vscode.ViewColumn) {
        if (this._panel) {
            this._panel.reveal(viewColumn);
        }
    }

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.ViewColumn.Two;

        if (ChatPanel.currentPanel) {
            ChatPanel.currentPanel._panel.reveal(column);
            return ChatPanel.currentPanel;
        }

        const panel = vscode.window.createWebviewPanel(
            ChatPanel.viewType,
            'LambdaMOO Chat',
            column,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );

        ChatPanel.currentPanel = new ChatPanel(panel, extensionUri);
        return ChatPanel.currentPanel;
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        
        this._panel.webview.html = this._getWebviewContent(extensionUri);

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async message => {
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
            },
            null,
            this._disposables
        );
    }

    public dispose() {
        ChatPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    public addOutput(html: string) {
        if (this._panel) {
            this._panel.webview.postMessage({ command: 'addOutput', html });
        }
    }

    public onDidReceiveMessage(callback: (message: any) => void) {
        if (this._panel) {
            this._panel.webview.onDidReceiveMessage(callback, null, this._disposables);
        }
    }

    public setSendCommandCallback(callback: (command: string) => void) {
        this._sendCommandCallback = callback;
    }

    public async fetchStyleContent(url: string): Promise<string> {
        try {
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            console.error('Error fetching style content:', error);
            return '';
        }
    }

    public async loadStyle(url: string) {
        const styleContent = await this.fetchStyleContent(url);
        this._panel.webview.postMessage({ command: 'loadStyle', content: styleContent });
    }

    private _getWebviewContent(extensionUri: vscode.Uri): string {
        const htmlPath = path.join(extensionUri.fsPath, 'src', 'webview.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        return htmlContent;
    }
}
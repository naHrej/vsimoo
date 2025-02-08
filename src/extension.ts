import * as vscode from 'vscode';
import { ChatPanel } from './chatPanel';
import { MooConnection } from './mooConnection';

export function activate(context: vscode.ExtensionContext) {
    let currentPanel: ChatPanel | undefined = undefined;
    let currentConnection: MooConnection | undefined = undefined;

    let disposable = vscode.commands.registerCommand('vscode-lambdamoo.connect', () => {
        const config = vscode.workspace.getConfiguration('lambdamoo.server');
        const host = config.get<string>('host') || 'lambda.moo.mud.org';
        const port = config.get<number>('port') || 8888;

        if (currentPanel) {
            currentPanel.reveal(vscode.ViewColumn.Two);
        } else {
            currentPanel = ChatPanel.createOrShow(context.extensionUri);
            currentConnection = new MooConnection(host, port);
            
            currentConnection.onData((data) => {
                if (currentPanel) {
                    currentPanel.addOutput(data);
                }
            });

            currentConnection.onStyle((url) => {
                if (currentPanel) {
                    currentPanel.loadStyle(url);
                }
            });

            currentPanel.onDispose(() => {
                currentPanel = undefined;
                if (currentConnection) {
                    currentConnection.disconnect();
                    currentConnection = undefined;
                }
            });

            currentPanel.onDidReceiveMessage(async (message: any) => {
                if (!currentPanel) return; // Add null check
                switch (message.command) {
                    case 'sendCommand':
                        if (currentConnection) {
                            console.log('Sending command vscode:', message.text);
                            currentConnection.sendCommand(message.text);
                        }
                        break;
                }
            });
        }
    });

    context.subscriptions.push(disposable);
}
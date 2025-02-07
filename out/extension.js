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
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const chatPanel_1 = require("./chatPanel");
const mooConnection_1 = require("./mooConnection");
function activate(context) {
    let currentPanel = undefined;
    let currentConnection = undefined;
    let disposable = vscode.commands.registerCommand('vscode-lambdamoo.connect', () => {
        const config = vscode.workspace.getConfiguration('lambdamoo.server');
        const host = config.get('host') || 'lambda.moo.mud.org';
        const port = config.get('port') || 8888;
        if (currentPanel) {
            currentPanel.reveal(vscode.ViewColumn.Two);
        }
        else {
            currentPanel = chatPanel_1.ChatPanel.createOrShow(context.extensionUri);
            // currentPanel.setSendCommandCallback((command: string) => {
            //     if (currentConnection) {
            //         currentConnection.sendCommand(command);
            //     }
            // });
            currentConnection = new mooConnection_1.MooConnection(host, port);
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
            currentPanel.onDidReceiveMessage(async (message) => {
                if (!currentPanel)
                    return; // Add null check
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
exports.activate = activate;
//# sourceMappingURL=extension.js.map
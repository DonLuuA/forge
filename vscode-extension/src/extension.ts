import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Forge AI Assistant is now active!');

    let disposableChat = vscode.commands.registerCommand('forge.chat', () => {
        const panel = vscode.window.createWebviewPanel(
            'forgeChat',
            'Forge Chat',
            vscode.ViewColumn.Two,
            { enableScripts: true }
        );

        panel.webview.html = getWebviewContent();
    });

    let disposableAsk = vscode.commands.registerCommand('forge.askSelection', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selection = editor.document.getText(editor.selection);
            vscode.window.showInputBox({ prompt: 'Ask Forge about this selection' }).then(value => {
                if (value) {
                    vscode.window.showInformationMessage(`Forge is thinking about: ${value}`);
                }
            });
        }
    });

    context.subscriptions.push(disposableChat, disposableAsk);
}

function getWebviewContent() {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Forge Chat</title>
        <style>
            body { font-family: sans-serif; padding: 20px; color: #CD7F32; background: #1e1e1e; }
            .header { font-size: 24px; font-weight: bold; margin-bottom: 20px; border-bottom: 1px solid #CD7F32; }
            .chat-area { height: 400px; overflow-y: auto; margin-bottom: 20px; background: #252526; padding: 10px; border-radius: 4px; }
            input { width: 100%; padding: 10px; background: #3c3c3c; border: 1px solid #CD7F32; color: white; border-radius: 4px; }
        </style>
    </head>
    <body>
        <div class="header">⚒ OPEN FORGE</div>
        <div class="chat-area" id="chat">
            <div>Forge: Ready to assist. What shall we build today?</div>
        </div>
        <input type="text" placeholder="Type a message..." id="input">
        <script>
            const input = document.getElementById('input');
            const chat = document.getElementById('chat');
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const msg = document.createElement('div');
                    msg.textContent = 'User: ' + input.value;
                    chat.appendChild(msg);
                    input.value = '';
                }
            });
        </script>
    </body>
    </html>`;
}

export function deactivate() {}

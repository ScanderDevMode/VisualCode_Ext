import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  // Register command to open the Webview panel
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.openPanel', () => {
      const panel = vscode.window.createWebviewPanel(
        'licenseEditor',
        'FNP License Editor',
        vscode.ViewColumn.One,
        { enableScripts: true }
      );

      panel.webview.html = getWebviewContent();

      // Handle messages from the Webview
      panel.webview.onDidReceiveMessage((msg) => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          vscode.window.showErrorMessage("No active editor to insert into.");
          return;
        }

        if (msg.command === 'insert') {
          editor.edit((editBuilder) => {
            editBuilder.insert(editor.selection.active, msg.content);
          });
        }
      });
    })
  );

  // Register the tree view under FNP VCArsenal
  vscode.window.registerTreeDataProvider(
    'licenseEditorView',
    new LicenseViewLauncher(context)
  );
}

class LicenseViewLauncher implements vscode.TreeDataProvider<vscode.TreeItem> {
  constructor(private context: vscode.ExtensionContext) {}

  getTreeItem(): vscode.TreeItem {
    const item = new vscode.TreeItem('Open License Panel');
    item.command = {
      command: 'extension.openPanel',
      title: 'Open License Editor Panel'
    };

    const iconPath = this.getIconPath();
    item.iconPath = {
      light: iconPath,
      dark: iconPath
    };

    return item;
  }

  getChildren(): vscode.ProviderResult<vscode.TreeItem[]> {
    return [this.getTreeItem()];
  }

  private getIconPath(): vscode.Uri {
    return vscode.Uri.file(
      path.join(this.context.extensionPath, 'media', 'fnpcode_logo.png')
    );
  }
}

function getWebviewContent(): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <body>
      <h2>License Feature Generator</h2>
      <label>Feature: <input id="feature" /></label><br/>
      <label>Vendor: <input id="vendor" /></label><br/>
      <label>Version: <input id="version" /></label><br/>
      <label>Expiry: <input id="expiry" type="date" /></label><br/>
      <button onclick="send()">Insert</button>

      <script>
        const vscode = acquireVsCodeApi();
        function send() {
          const f = document.getElementById("feature").value;
          const v = document.getElementById("vendor").value;
          const ver = document.getElementById("version").value;
          const exp = document.getElementById("expiry").value;

          vscode.postMessage({
            command: 'insert',
            content: \`FEATURE \${f} \${v} \${ver} \${exp} uncounted HOSTID=ANY\\n\`
          });
        }
      </script>
    </body>
    </html>
  `;
}

export function deactivate() {}

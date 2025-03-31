import * as vscode from 'vscode';
import * as path from 'path';

// Variables to track the last active text editor and cursor position
let lastActiveEditor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
let lastCursorPosition: vscode.Position | undefined = lastActiveEditor?.selection.active;

export function activate(context: vscode.ExtensionContext) {
  console.log('[ACTIVATE] FNP VCArsenal activated');

  // Register the command to open the webview panel
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.openPanel', () => {
      const panel = vscode.window.createWebviewPanel(
        'licenseEditor',
        'FNP License Editor',
        vscode.ViewColumn.One,
        { enableScripts: true }
      );

      panel.webview.html = getWebviewContent();

      // Event listener for when the webview gains focus
      panel.onDidChangeViewState((e) => {
        if (e.webviewPanel.active) {
          // Store the reference to the active text editor when the webview gains focus
          lastActiveEditor = vscode.window.activeTextEditor;
          lastCursorPosition = lastActiveEditor?.selection.active;
          console.log('[INFO] Webview focused. Stored active editor and cursor position.');
        }
      });

      // Handle messages from the webview
      panel.webview.onDidReceiveMessage(async (msg) => {
        if (msg.command === 'insert') {
          // Ensure the last active editor and cursor position are valid
          if (lastActiveEditor && lastCursorPosition) {
            lastActiveEditor.edit((editBuilder) => {
              editBuilder.insert(lastCursorPosition!, msg.content);
            });
            console.log('[INFO] Content inserted at the last known cursor position.');
          } else {
            vscode.window.showErrorMessage('No active editor or cursor position available.');
            console.error('[ERROR] No active editor or cursor position available.');
          }
        }
      });
    })
  );

  // Register tree view item in FNP VCArsenal sidebar
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
    item.iconPath = {
      light: vscode.Uri.file(
        path.join(this.context.extensionPath, 'media', 'fnpcode_logo.png')
      ),
      dark: vscode.Uri.file(
        path.join(this.context.extensionPath, 'media', 'fnpcode_logo.png')
      )
    };
    return item;
  }

  getChildren(): vscode.ProviderResult<vscode.TreeItem[]> {
    return [this.getTreeItem()];
  }
}

function getWebviewContent(): string {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style>
      :root {
        color-scheme: light dark;
      }
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: var(--vscode-font-family, sans-serif);
      }
      body {
        padding: 8px;
        background-color: var(--vscode-editor-background);
        color: var(--vscode-editor-foreground);
        font-size: 12px;
      }
      .scroll-pane {
        max-height: 90vh;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .card {
        background-color: var(--vscode-sideBar-background);
        border-radius: 5px;
        padding: 8px 10px;
        border: 1px solid var(--vscode-editorWidget-border);
      }
      .card h3 {
        margin-bottom: 8px;
        font-size: 0.95em;
        font-weight: 600;
      }
      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 8px 12px;
        align-items: center;
      }
      .field {
        display: flex;
        flex-direction: column;
      }
      .field label {
        font-size: 0.75em;
        margin-bottom: 2px;
      }
      .field input {
        padding: 4px 6px;
        font-size: 0.8em;
        background-color: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--vscode-input-border);
        border-radius: 3px;
      }
      .field input::placeholder {
        color: var(--vscode-input-placeholderForeground);
      }
      button {
        margin-top: 8px;
        padding: 6px 10px;
        font-size: 0.85em;
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        border-radius: 3px;
        cursor: pointer;
      }
      button:hover {
        background-color: var(--vscode-button-hoverBackground);
      }
    </style>
  </head>
  <body>
    <div class="scroll-pane">
      <!-- Block 1: Single Line Feature -->
      <div class="card">
        <h3>Single Line Feature</h3>
        <div class="form-grid">
          <div class="field">
            <label for="feature">Feature Name</label>
            <input id="feature" placeholder="e.g. f1" />
          </div>
          <div class="field">
            <label for="vendor">Vendor</label>
            <input id="vendor" placeholder="e.g. vendor1" />
          </div>
          <div class="field">
            <label for="version">Version</label>
            <input id="version" placeholder="e.g. 1.0" />
          </div>
          <div class="field">
            <label for="expiry">Expiry</label>
            <input id="expiry" type="date" />
          </div>
        </div>
        <button onclick="sendSingle()">Insert</button>
      </div>

      <!-- Block 2: Batch Feature Entry -->
      <div class="card">
        <h3>Batch Feature Entry</h3>
        <div class="form-grid">
          <div class="field">
            <label for="batchFeature">Base Name</label>
            <input id="batchFeature" placeholder="e.g. f1" />
          </div>
          <div class="field">
            <label for="batchCount">Count</label>
            <input id="batchCount" type="number" min="1" />
          </div>
          <div class="field">
            <label for="batchVendor">Vendor</label>
            <input id="batchVendor" />
          </div>
          <div class="field">
            <label for="batchVersion">Version</label>
            <input id="batchVersion" />
          </div>
          <div class="field">
            <label for="batchExpiry">Expiry</label>
            <input id="batchExpiry" type="date" />
          </div>
        </div>
        <button onclick="sendBatch()">Insert Batch</button>
      </div>
    </div>

    <script>
      const vscode = acquireVsCodeApi();

      function sendSingle() {
        const feature = document.getElementById("feature").value;
        const vendor = document.getElementById("vendor").value;
        const version = document.getElementById("version").value;
        const expiry = document.getElementById("expiry").value;

        const content = \`FEATURE \${feature} \${vendor} \${version} \${expiry} uncounted HOSTID=ANY\\n\`;
        vscode.postMessage({ command: 'insert', content });
      }

      function sendBatch() {
        const base = document.getElementById("batchFeature").value;
        const count = parseInt(document.getElementById("batchCount").value);
        const vendor = document.getElementById("batchVendor").value;
        const version = document.getElementById("batchVersion").value;
        const expiry = document.getElementById("batchExpiry").value;

        if (!base || isNaN(count) || count <= 0) {
          alert("Please provide a valid base name and count.");
          return;
        }

        let content = "";
        for (let i = 1; i <= count; i++) {
          content += \`FEATURE \${base}_\${i} \${vendor} \${version} \${expiry} uncounted HOSTID=ANY\\n\`;
        }

        vscode.postMessage({ command: 'insert', content });
      }
    </script>
  </body>
  </html>
  `;
}






export function deactivate() {
  console.log('[DEACTIVATE] FNP VCArsenal deactivated');
}

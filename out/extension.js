"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const path = require("path");
// Variables to track the last active text editor and cursor position
let lastActiveEditor = vscode.window.activeTextEditor;
let lastCursorPosition = lastActiveEditor === null || lastActiveEditor === void 0 ? void 0 : lastActiveEditor.selection.active;
function activate(context) {
    console.log('[ACTIVATE] FNP VCArsenal activated');
    // Register the command to open the webview panel
    context.subscriptions.push(vscode.commands.registerCommand('extension.openPanel', () => {
        const panel = vscode.window.createWebviewPanel('licenseEditor', 'FNP License Editor', vscode.ViewColumn.One, { enableScripts: true });
        panel.webview.html = getWebviewContent();
        // Event listener for when the webview gains focus
        panel.onDidChangeViewState((e) => {
            if (e.webviewPanel.active) {
                // Store the reference to the active text editor when the webview gains focus
                lastActiveEditor = vscode.window.activeTextEditor;
                lastCursorPosition = lastActiveEditor === null || lastActiveEditor === void 0 ? void 0 : lastActiveEditor.selection.active;
                console.log('[INFO] Webview focused. Stored active editor and cursor position.');
            }
        });
        // Handle messages from the webview
        panel.webview.onDidReceiveMessage((msg) => __awaiter(this, void 0, void 0, function* () {
            if (msg.command === 'insert') {
                // Ensure the last active editor and cursor position are valid
                if (lastActiveEditor && lastCursorPosition) {
                    lastActiveEditor.edit((editBuilder) => {
                        editBuilder.insert(lastCursorPosition, msg.content);
                    });
                    console.log('[INFO] Content inserted at the last known cursor position.');
                }
                else {
                    vscode.window.showErrorMessage('No active editor or cursor position available.');
                    console.error('[ERROR] No active editor or cursor position available.');
                }
            }
        }));
    }));
    // Register tree view item in FNP VCArsenal sidebar
    vscode.window.registerTreeDataProvider('licenseEditorView', new LicenseViewLauncher(context));
}
exports.activate = activate;
class LicenseViewLauncher {
    constructor(context) {
        this.context = context;
    }
    getTreeItem() {
        const item = new vscode.TreeItem('Open License Panel');
        item.command = {
            command: 'extension.openPanel',
            title: 'Open License Editor Panel'
        };
        item.iconPath = {
            light: vscode.Uri.file(path.join(this.context.extensionPath, 'media', 'fnpcode_logo.png')),
            dark: vscode.Uri.file(path.join(this.context.extensionPath, 'media', 'fnpcode_logo.png'))
        };
        return item;
    }
    getChildren() {
        return [this.getTreeItem()];
    }
}
function getWebviewContent() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    :root { color-scheme: light dark; }
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: var(--vscode-font-family, sans-serif); }
    body { padding: 6px; background-color: var(--vscode-editor-background); color: var(--vscode-editor-foreground); font-size: 11.5px; }
    .scroll-pane { max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
    .card { background-color: var(--vscode-sideBar-background); border-radius: 4px; padding: 6px 8px; border: 1px solid var(--vscode-editorWidget-border); }
    .card h3 { margin-bottom: 6px; font-size: 0.9em; font-weight: 600; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 6px 10px; align-items: center; }
    .field { display: flex; flex-direction: column; }
    .field label { font-size: 0.7em; margin-bottom: 1px; }
    .field input, .field textarea, .field select {
      padding: 3px 5px;
      font-size: 0.75em;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 2px;
    }
    button {
      margin-top: 6px;
      padding: 5px 9px;
      font-size: 0.8em;
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 2px;
      cursor: pointer;
    }
    button:hover { background-color: var(--vscode-button-hoverBackground); }
  </style>
</head>
<body>
  <div class="scroll-pane">
    <div class="card">
      <h3>Single Feature Line</h3>
      <div class="form-grid">
        <div class="field"><label>Feature Name</label><input id="feature" /></div>
        <div class="field"><label>Vendor</label><input id="vendor" /></div>
        <div class="field"><label>Version</label><input id="version" /></div>
        <div class="field"><label>Expiry</label><input id="expiry" type="date" /></div>
        <div class="field"><label>License Count</label><input id="num_lic" /></div>
        <div class="field"><label>Host ID</label><input id="hostid" /></div>
        <div class="field"><label>Dup Group</label><select id="dup_group">
          <option value="">None</option>
          <option value="UH">UH</option>
          <option value="UHD">UHD</option>
          <option value="HOST">HOST</option>
        </select></div>
        <div class="field"><label>Issued</label><input id="issued" type="date" /></div>
        <div class="field"><label>Start Date</label><input id="start" type="date" /></div>
        <div class="field"><label>User Info</label><input id="user_info" /></div>
        <div class="field" style="grid-column: span 2"><label>Signature</label><textarea id="sign" rows="2"></textarea></div>
      </div>
      <button onclick="sendSingle()">Insert</button>
    </div>

    <div class="card">
      <h3>Batch Feature Entry</h3>
      <div class="form-grid">
        <div class="field"><label>Base Feature Name</label><input id="batchFeature" /></div>
        <div class="field"><label>Count</label><input id="batchCount" type="number" min="1" /></div>
        <div class="field"><label>Vendor</label><input id="batchVendor" /></div>
        <div class="field"><label>Version</label><input id="batchVersion" /></div>
        <div class="field"><label>Expiry</label><input id="batchExpiry" type="date" /></div>
        <div class="field"><label>License Count</label><input id="batchNumLic" /></div>
        <div class="field"><label>Host ID</label><input id="batchHostid" /></div>
        <div class="field"><label>User Info</label><input id="batchUserInfo" /></div>
        <div class="field" style="grid-column: span 2"><label>Signature</label><textarea id="batchSign" rows="2"></textarea></div>
      </div>
      <button onclick="sendBatch()">Insert Batch</button>
    </div>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    
    function getField(id) {
      return (document.getElementById(id)?.value || '').trim();
    }

    function generateLine(prefix) {
      const feature = getField(prefix + 'Feature') || getField('feature');
      const vendor = getField(prefix + 'Vendor') || getField('vendor');
      const version = getField(prefix + 'Version') || getField('version');
      const expiry = getField(prefix + 'Expiry') || getField('expiry') || 'permanent';
      const numLic = getField(prefix + 'NumLic') || getField('num_lic') || 'uncounted';
      const hostid = getField(prefix + 'Hostid') || getField('hostid');
      const dupGroup = getField(prefix + 'DupGroup') || getField('dup_group');
      const issued = getField(prefix + 'Issued') || getField('issued');
      const start = getField(prefix + 'Start') || getField('start');
      const userInfo = getField(prefix + 'UserInfo') || getField('user_info');
      const sign = getField(prefix + 'Sign') || getField('sign');

      const parts = [
        feature, vendor, version, expiry, numLic,
        hostid ? 'HOSTID=' + hostid : '',
        dupGroup ? 'DUP_GROUP=' + dupGroup : '',
        issued ? 'ISSUED=' + issued : '',
        start ? 'START=' + start : '',
        userInfo ? 'user_info=\"' + userInfo + '\"' : '',
        sign ? 'SIGN=\"' + sign + '\"' : ''
      ].filter(Boolean);

      return 'FEATURE ' + parts.join(' ') + '\\n';
    }

    function sendSingle() {
      const content = generateLine('');
      console.log('Sending single line:', content);
      vscode.postMessage({ command: 'insert', content });
    }
    function sendBatch() {
      const base = getField('batchFeature');
      const count = parseInt(getField('batchCount'));
      if (!base || isNaN(count) || count <= 0) {
        alert('Invalid base name or count.');
        return;
      }
      let content = '';
      for (let i = 1; i <= count; i++) {
        document.getElementById('feature').value = base + '_' + i;
        content += generateLine('batch');
      }
      console.log('Sending batch lines:', content);
      vscode.postMessage({ command: 'insert', content });
    }
  </script>
</body>
</html>`;
}
function deactivate() {
    console.log('[DEACTIVATE] FNP VCArsenal deactivated');
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map
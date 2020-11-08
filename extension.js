// Visual Studio Code extension for Jupyter notebook running on Firefox Developer Edition on macOS.
// Send a selection or a line to Jupyter
// This extension adds the command`run-jupyter.fde` and the keybinding`shift + cmd + enter`.
// Jupyter notebook must be open in Firefox Developer Edition, active code cell must be selected(extension uses simple AppleScript cut and paste to browser)
// Extension logic pilfered substantially from https://github.com/nachocab/vscode-run-external

const vscode = require('vscode');
const { exec } = require('child_process');

function activate(context) {
  const runJupyter = vscode.commands.registerCommand('run-jupyter.fde', function() {
    const editor = vscode.window.activeTextEditor;

    let textToPaste = editor.selections
      .sort((a, b) => a.start.line - b.start.line) // sort selections by line
      .map(selection => {
        // combine multiple cursors
        if (selection.isEmpty) {
          return editor.document.lineAt(selection.active.line).text;
        } else {
          return editor.document.getText(selection);
        }
      })
      .join('\n')
      .replace(/\\/g, '\\\\') // escape quotes
      .replace(/'/g, "'\\''") 
      .replace(/\"/g, '\\"')
      .replace(/\`/g, '\\`');

    // TODO: remove newline
    const command =
      `echo "${textToPaste}" | pbcopy; ` +
      ` osascript ` +
      ` -e 'activate application "Firefox Developer Edition"' ` +
      ` -e 'tell application "System Events"' ` +
      ` -e 'tell process "Firefox Developer Edition"' ` +
      ` -e 'set frontmost to true' ` +
      ` -e 'keystroke "v" using command down' ` +
      ` -e 'keystroke return using shift down' ` +
      ` -e 'end tell' ` +
      ` -e 'end tell'`;
    exec(command);
  });

  context.subscriptions.push(runJupyter);
}
exports.activate = activate;

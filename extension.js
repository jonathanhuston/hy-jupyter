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
      .replace(/'/g, "'\\''") // escape quotes
      .replace(/\"/g, '\\"');
    // console.log('textToPaste', textToPaste);
    // console.log(editor.selections);


    const command =
      `echo "${textToPaste}" | pbcopy; ` +
      `osascript ` +
      ` -e 'tell application "Firefox Developer Edition" to activate' ` +
      ` -e 'tell application "System Events"' ` +
      ` -e 'tell process "Firefox Developer Edition"' ` +
      ` -e 'keystroke "v" using command down' ` + 
      ` -e 'keystroke return using shift down' ` +  
      ` -e 'end tell'`; 
      ` -e 'end tell'`;
    // console.log("command", command);
    exec(command);
  });

  context.subscriptions.push(runJupyter);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map

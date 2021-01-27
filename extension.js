// Visual Studio Code extension for Jupyter notebook on macOS.
// Evaluate a Hy form (S-expression) in Jupyter notebook
// Jupyter notebook must be open in browser, active code cell must be selected
// Extension logic pilfered substantially from https://github.com/nachocab/vscode-run-external and https://github.com/dbankier/vscode-quick-select
// Depends on Clipboardy: https://github.com/sindresorhus/clipboardy

const vscode = require('vscode');
const { exec } = require('child_process');
const clipboardy = require('clipboardy');

const open_paren = "(";
const close_paren = ")";

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

function findOccurances(doc, line, char) {
  var content = doc.lineAt(line);
  var matches = (content.text + "EOL").split(char).reduce((acc, p) => {
    var len = p.length + 1;
    if (acc.length > 0) {
      len += acc[acc.length - 1];
    }
    acc.push(len);
    return acc;
  }, []);
  matches.pop();
  return matches;
}

function findNext(doc, line, char, start_index = 0, nest_char = undefined, nested = 0) {
  if (line === doc.lineCount) { return undefined };
  var occurances = findOccurances(doc, line, char).filter(n => n >= start_index);
  var nests = nest_char ? findOccurances(doc, line, nest_char).filter(n => n >= start_index) : [];
  var occurance_index = 0;
  var nests_index = 0;
  while ((occurance_index < occurances.length || nests_index < nests.length) && nested >= 0) {
    if (occurances[occurance_index] < nests[nests_index] || !nests[nests_index]) {
      if (nested === 0) {
        return new vscode.Position(line, occurances[occurance_index]);
      }
      nested--
      occurance_index++;
    } else if (nests[nests_index] < occurances[occurance_index] || !occurances[occurance_index]) {
      nested++;
      nests_index++;
    }
  }
  return findNext(doc, ++line, char, 0, nest_char, nested);
}

function findPrevious(doc, line, char, start_index, nest_char = undefined, nested = 0) {
  if (line === -1) { return undefined };
  if (start_index === undefined) { start_index = doc.lineAt(line).text.length; }
  var occurances = findOccurances(doc, line, char).filter(n => n <= start_index);
  var nests = nest_char ? findOccurances(doc, line, nest_char).filter(n => n <= start_index) : [];
  var occurance_index = occurances.length - 1;
  var nests_index = nests.length - 1;
  while ((occurance_index > -1 || nests_index > -1) && nested >= 0) {
    if (occurances[occurance_index] > nests[nests_index] || !nests[nests_index]) {
      if (nested === 0) {
        return new vscode.Position(line, occurances[occurance_index]);
      }
      nested--
      occurance_index--;
    } else if (nests[nests_index] > occurances[occurance_index] || !occurances[occurance_index]) {
      nested++;
      nests_index--;
    }
  }
  return findPrevious(doc, --line, char, undefined, nest_char, nested);
}

function findFirst(doc, line, char) {
  if (line === -1) { return undefined };
  var occurances = findOccurances(doc, line, char).filter(n => n === 1);
  if (occurances.length < 1) { return findFirst(doc, --line, char); }
  return new vscode.Position(line, 1);
}

function activate(context) {
  context.subscriptions.push(vscode.commands.registerCommand('hy-jupyter.selectForm', function () {
    let editor = vscode.window.activeTextEditor;
    if (!editor) { return; };
    let doc = editor.document
    let sel = editor.selections
    editor.selections = sel.map(s => {
      let { line, character } = s.active;
      let current = doc.getText(new vscode.Range(new vscode.Position(line, character), new vscode.Position(line, character + 1)))
      if (current.length == 0 && character > 0) { character--; }
      let starts = findOccurances(doc, line, open_paren);
      let start = starts.find(a => a > character);
      let start_index = starts.indexOf(start);
      let start_pos = findPrevious(doc, line, open_paren, character, close_paren) || new vscode.Position(line, starts[start_index]);
      if (!start_pos) { return s };
      let end_pos = findNext(doc, start_pos.line, close_paren, start_pos.character + 1, open_paren);
      if (start_pos && end_pos) {
        start_pos = new vscode.Position(start_pos.line, start_pos.character - 1);
        end_pos = new vscode.Position(end_pos.line, end_pos.character);
        return new vscode.Selection(start_pos, end_pos)
      }
      return s;
    })
  }));

  context.subscriptions.push(vscode.commands.registerCommand('hy-jupyter.selectTopLevelForm', function () {
    let editor = vscode.window.activeTextEditor;
    if (!editor) { return; };
    let doc = editor.document
    let sel = editor.selections
    editor.selections = sel.map(s => {
      let { line, character } = s.active;
      let current = doc.getText(new vscode.Range(new vscode.Position(line, character), new vscode.Position(line, character + 1)))
      if (current.length == 0 && character > 0) { character--; }
      let starts = findOccurances(doc, line, open_paren);
      let start = starts.find(a => a > character);
      let start_index = starts.indexOf(start);
      let start_pos = findFirst(doc, line, open_paren) || new vscode.Position(line, starts[start_index]);
      if (!start_pos) { return s };
      let end_pos = findNext(doc, start_pos.line, close_paren, start_pos.character + 1, open_paren);
      if (start_pos && end_pos) {
        start_pos = new vscode.Position(start_pos.line, start_pos.character - 1);
        end_pos = new vscode.Position(end_pos.line, end_pos.character);
        return new vscode.Selection(start_pos, end_pos)
      }
      return s;
    })
  }));

  context.subscriptions.push(vscode.commands.registerCommand('hy-jupyter.sendSelection', function () {
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
      .join('\n');

    const browser = vscode.workspace.getConfiguration("hy-jupyter").get("browser");

    if (textToPaste.length != 0) {
      clipboardy.writeSync(textToPaste)
      const command =
        ` osascript ` +
        ` -e 'activate application "${browser}"' ` +
        ` -e 'tell application "System Events"' ` +
        ` -e 'tell process "${browser}"' ` +
        ` -e 'set frontmost to true' ` +
        ` -e 'keystroke "v" using command down' ` +
        ` -e 'keystroke return using shift down' ` +
        ` -e 'end tell' ` +
        ` -e 'end tell'`;
      exec(command, { shell: "/bin/zsh" });
    }

  }));

  context.subscriptions.push(vscode.commands.registerCommand('hy-jupyter.evaluateForm', function () {
    vscode.commands.executeCommand("hy-jupyter.selectForm");
    sleep(500);
    vscode.commands.executeCommand("hy-jupyter.sendSelection");
  }));

  context.subscriptions.push(vscode.commands.registerCommand('hy-jupyter.evaluateTopLevelForm', function () {
    vscode.commands.executeCommand("hy-jupyter.selectTopLevelForm");
    sleep(500);
    vscode.commands.executeCommand("hy-jupyter.sendSelection");
  }));
}

exports.activate = activate;

# Hy Jupyter

Evaluate a Hy form (S-expression) in Jupyter notebook

## Features

Visual Studio Code extension for Jupyter notebook on macOS

Shift+Enter or Ctrl+Enter evalutes the current form in active Jupyter notebook code cell

Option+Enter evaluates the top level form in active Jupyter notebook code cell

## Commands

This extension adds the following commands:

`hy-jupyter.evaluateForm` with the keybindings `shift+enter` and `ctrl+enter`
`hy-jupyter.evaluateTopLevelForm` with the keybinding `alt+enter`

It also adds the following helper functions:

`hy-jupyter.selectForm`, `hy-jupyter.selectTopLevelForm` and `hy-jupyter.sendSelection`

## Usage

Jupyter notebook must be open in browser, active code cell must be selected

Browser used by Jupyter notebook can be specified in Settings (`hy-jupyter.browser`)

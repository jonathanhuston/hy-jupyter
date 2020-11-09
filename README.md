# Hy Jupyter

Evaluate a Hy form (S-expression) in Jupyter notebook

## Features

Visual Studio Code extension for Jupyter notebook on macOS

Shift+Enter or Ctrl+Enter evalutes the current form in active Jupyter notebook code cell

This extension adds the following command:

`hy-jupyter.evaluateForm` with the keybindings `shift+enter` and `ctrl+enter`

It also adds the following two helper functions:

`hy-jupyter.selectForm` and `hy-jupyter.sendSelection`

## Usage

Jupyter notebook must be open in browser, active code cell must be selected (extension uses simple AppleScript cut and paste to browser)

Set browser used by Jupyter notebook in Settings (`hy-jupyter.browser`)

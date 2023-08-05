import { posix } from 'path';
import { Uri, window, workspace } from 'vscode';
import { constants } from './constants';

export const getWorkspaceFolder = (uri?: Uri): string => {
    return workspace.workspaceFolders?.[0].uri.fsPath || '';
};

export const getVscodeFolder = (uri?: Uri): string => {
    const workspacePath = getWorkspaceFolder(uri);
    return posix.join(workspacePath, '.vscode');
};

export const getTabWidth = (): number => {
    let prettierTabWidth = workspace.getConfiguration().get('prettier.tabWidth');
    if (!Number.isNaN(prettierTabWidth)) {
        return Number(prettierTabWidth);
    }

    const editorTabWidth = workspace.getConfiguration().get('editor.tabSize');
    if (!Number.isNaN(editorTabWidth)) {
        return Number(editorTabWidth);
    }

    const defaultTabWidth = 4;
    return defaultTabWidth;
};

export const showErrorMessageWithDetail = (message: string, error: unknown): void => {
    const detailError = error instanceof Error ? (error as Error)?.message : `${error}`;
    window.showErrorMessage(message, constants.more).then((selection) => {
        if (selection === constants.more) {
            window.showErrorMessage(detailError, { modal: true });
        }
    });
};

export const delay = async (milliseconds: number): Promise<void> => {
    return await new Promise((resolve) => setTimeout(resolve, milliseconds));
};

export const showTextDocument = (filePath: string): void => {
    const existingDoc = workspace.textDocuments.find((doc) => doc.uri.fsPath === filePath);
    if (existingDoc) {
        const visibleEditor = window.visibleTextEditors.find((editor) => editor.document === existingDoc);
        if (visibleEditor) {
            window.showTextDocument(visibleEditor.document, visibleEditor.viewColumn, false);
        } else {
            window.showTextDocument(existingDoc, { preserveFocus: false });
        }
    } else {
        const stepDefinitionFileUri = Uri.file(filePath);
        window.showTextDocument(stepDefinitionFileUri, { preserveFocus: false });
    }
};

export const showInputBox = async (params: {
    title: string;
    placeHolder: string;
    validateInput?: (value: string) => string;
}): Promise<string | undefined> => {
    const { title, placeHolder, validateInput } = params;
    const inputText = await window.showInputBox({
        title: title,
        placeHolder: placeHolder,
        ignoreFocusOut: true,
        validateInput
    });
    return inputText;
};

export const upperToPascal = (input: string): string => {
    const words = input.toLowerCase().split('_');
    const capitalizedWords = words.map((word) => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    });
    return capitalizedWords.join('');
};

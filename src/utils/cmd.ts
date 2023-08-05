import { exec, execSync } from 'child_process';
import util from 'util';
import { workspace } from 'vscode';

const execPromise = util.promisify(exec);

export type ExecResponse = {
    stdout?: string;
    stderr?: string;
};

class CommandLine {
    isInstalled = async (bin: string): Promise<boolean> => {
        try {
            const cwd = workspace.workspaceFolders?.[0].uri.fsPath;
            await execPromise(`which ${bin}`, { cwd });
            return true;
        } catch {
            return false;
        }
    };

    runAsync = async (command: string): Promise<ExecResponse> => {
        const cwd = workspace.workspaceFolders?.[0].uri.fsPath;
        return await execPromise(command, { cwd });
    };

    runSync = (command: string): ExecResponse => {
        try {
            const cwd = workspace.workspaceFolders?.[0].uri.fsPath;
            const stdout = execSync(command, { encoding: 'utf-8', cwd });
            return { stdout };
        } catch (error: any) {
            const stderr = error?.stderr || error?.stdout || error?.message || '';
            return { stderr };
        }
    };
}

export const cmd = new CommandLine();

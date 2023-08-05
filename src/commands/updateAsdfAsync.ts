import { EOL } from 'os';
import { ProgressLocation, commands, env, window } from 'vscode';
import { ExtensionConfiguration } from '../extension';
import { CommandBuilder, asdf } from '../services/CommandBuilder';
import { cmd } from '../utils/cmd';
import { constants, extCommands } from '../utils/constants';
import { showErrorMessageWithDetail } from '../utils/utils';

export const updateAsdfAsync = async (config: ExtensionConfiguration): Promise<void> => {
    const bin = config.bin || 'asdf';
    try {
        window.withProgress(
            {
                location: ProgressLocation.Notification,
                title: 'asdf',
                cancellable: true
            },
            async (progress) => {
                progress.report({ message: 'Update asdf...' });
                const command = new CommandBuilder(bin, asdf.asdfUpdate).build();
                const { stderr } = cmd.runSync(command);
                if (stderr) {
                    const message = `Unable to update asdf.`;
                    window.showWarningMessage(message, constants.copy, constants.more).then((selection) => {
                        if (selection === constants.copy) {
                            env.clipboard.writeText(command);
                        }
                        if (selection === constants.more) {
                            const tryCommand = `Please try using the following command: ${EOL}${command}`;
                            const errorMessage = stderr ? stderr : message;
                            window.showWarningMessage([errorMessage, tryCommand].join(EOL), { modal: true });
                        }
                    });
                    return;
                }

                // Show message
                progress.report({ message: 'Refresh activity...' });
                await commands.executeCommand(extCommands.refreshInfoView);
                await commands.executeCommand(extCommands.refreshPluginView);
                await commands.executeCommand(extCommands.refreshPackageView);
                window.showInformationMessage(`asdf have been successfully updated.`);

                // Return a value when the task completes
                return 'Task completed!';
            }
        );
    } catch (error) {
        showErrorMessageWithDetail(`Failed to update asdf.`, error);
    }
};

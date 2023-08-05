import { EOL } from 'os';
import { ProgressLocation, QuickPickItem, TreeItem, commands, env, window } from 'vscode';
import { ExtensionConfiguration } from '../extension';
import { CommandBuilder, asdf } from '../services/CommandBuilder';
import { cmd } from '../utils/cmd';
import { constants, extCommands } from '../utils/constants';
import { showErrorMessageWithDetail } from '../utils/utils';

export const removePluginAsync = async (config: ExtensionConfiguration, treeItem: TreeItem): Promise<void> => {
    const bin = config.bin || 'asdf';
    const pluginName = treeItem?.id;
    try {
        if (!pluginName) {
            window.showWarningMessage('Please select the plugin you want to remove.');
            return;
        }

        // Show confirmation
        const quickPickItems = [constants.yes, constants.no].map((key): QuickPickItem => ({ label: key }));
        const quickPickItem = await window.showQuickPick(quickPickItems, {
            title: `Would you like to remove the plugin ${pluginName}?`,
            placeHolder: 'Choose `Yes` if you want to remove the plugin...'
        });
        if (!quickPickItem || quickPickItem.label === constants.no) {
            return;
        }

        // Remove plugin
        window.withProgress(
            {
                location: ProgressLocation.Notification,
                title: 'asdf',
                cancellable: true
            },
            async (progress) => {
                progress.report({ message: `Remove plugin ${pluginName}...` });
                const command = new CommandBuilder(bin, asdf.removePlugin).replace('<name>', pluginName).build();
                const { stderr } = cmd.runSync(command);
                if (stderr) {
                    const message = `Unable to remove plugin ${pluginName}.`;
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
                window.showInformationMessage(`Plugin ${pluginName} has been removed successfully.`);

                // Return a value when the task completes
                return 'Task completed!';
            }
        );
    } catch (error) {
        showErrorMessageWithDetail(`Failed to remove plugin ${pluginName}.`, error);
    }
};

import { EOL } from 'os';
import { ProgressLocation, TreeItem, commands, env, window } from 'vscode';
import { ExtensionConfiguration } from '../extension';
import { CommandBuilder, asdf } from '../services/CommandBuilder';
import { cmd } from '../utils/cmd';
import { constants, extCommands } from '../utils/constants';
import { showErrorMessageWithDetail } from '../utils/utils';

export const updatePluginAsync = async (config: ExtensionConfiguration, treeItem: TreeItem): Promise<void> => {
    const bin = config.bin || 'asdf';
    const pluginName = treeItem?.id;
    try {
        if (!pluginName) {
            window.showWarningMessage('Please select the plugin you want to update.');
            return;
        }

        window.withProgress(
            {
                location: ProgressLocation.Notification,
                title: 'asdf',
                cancellable: true
            },
            async (progress) => {
                progress.report({ message: `Update plugin ${pluginName}...` });
                const command = new CommandBuilder(bin, asdf.updatePlugin)
                    .replace('<name>', pluginName)
                    .replace('<git-ref>', '')
                    .build();
                const { stderr } = cmd.runSync(command);
                if (stderr) {
                    const message = `Unable to update plugin ${pluginName}.`;
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
                window.showInformationMessage(`Plugin ${pluginName} has been updated successfully.`);

                // Return a value when the task completes
                return 'Task completed!';
            }
        );
    } catch (error) {
        showErrorMessageWithDetail(`Failed to update plugin ${pluginName}.`, error);
    }
};

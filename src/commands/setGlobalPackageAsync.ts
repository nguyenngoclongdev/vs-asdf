import { EOL } from 'os';
import { ProgressLocation, TreeItem, commands, env, window } from 'vscode';
import { ExtensionConfiguration } from '../extension';
import { CommandBuilder, asdf } from '../services/CommandBuilder';
import { cmd } from '../utils/cmd';
import { constants, extCommands } from '../utils/constants';
import { showErrorMessageWithDetail } from '../utils/utils';

export const setGlobalPackageAsync = async (config: ExtensionConfiguration, treeItem: TreeItem): Promise<void> => {
    const bin = config.bin || 'asdf';
    const packageId = treeItem?.id;
    const packageName = packageId?.split('@')?.[0];
    const packageVersion = packageId?.split('@')?.[1];
    try {
        if (!packageName || !packageVersion) {
            window.showWarningMessage('Please select the package you want to set.');
            return;
        }

        window.withProgress(
            {
                location: ProgressLocation.Notification,
                title: 'asdf',
                cancellable: true
            },
            async (progress) => {
                progress.report({ message: `Set ${packageName}@${packageVersion} as the global version...` });
                const command = new CommandBuilder(bin, asdf.setGlobalPackage)
                    .replace('<name>', packageName)
                    .replace('<version>', packageVersion)
                    .build();
                const { stderr } = cmd.runSync(command);
                if (stderr) {
                    const message = `Unable to set ${packageName}@${packageVersion} as the global version.`;
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
                await commands.executeCommand(extCommands.refreshPackageView);
                window.showInformationMessage(
                    `${packageName}@${packageVersion} has been successfully set as the global version.`
                );

                // Return a value when the task completes
                return 'Task completed!';
            }
        );
    } catch (error) {
        showErrorMessageWithDetail(`Failed to set ${packageName}@${packageVersion} as the global version.`, error);
    }
};

import { EOL } from 'os';
import { ProgressLocation, QuickPickItem, TreeItem, commands, env, window } from 'vscode';
import { ExtensionConfiguration } from '../extension';
import { CommandBuilder, asdf } from '../services/CommandBuilder';
import { cmd } from '../utils/cmd';
import { constants, extCommands } from '../utils/constants';
import { showErrorMessageWithDetail } from '../utils/utils';

export const removePackageAsync = async (config: ExtensionConfiguration, treeItem: TreeItem): Promise<void> => {
    const bin = config.bin || 'asdf';
    const packageId = treeItem?.id;
    const packageName = packageId?.split('@')?.[0];
    const packageVersion = packageId?.split('@')?.[1];
    try {
        if (!packageName || !packageVersion) {
            window.showWarningMessage('Please select the package you want to remove.');
            return;
        }

        // Show confirmation
        const quickPickItems = [constants.yes, constants.no].map((key): QuickPickItem => ({ label: key }));
        const quickPickItem = await window.showQuickPick(quickPickItems, {
            title: `Would you like to remove the package ${packageName}@${packageVersion}?`,
            placeHolder: 'Choose `Yes` if you want to remove the package...'
        });
        if (!quickPickItem || quickPickItem.label !== constants.yes) {
            return;
        }

        // Remove package
        window.withProgress(
            {
                location: ProgressLocation.Notification,
                title: 'asdf',
                cancellable: true
            },
            async (progress) => {
                progress.report({ message: `Remove package ${packageName}@${packageVersion}...` });
                const command = new CommandBuilder(bin, asdf.uninstallPackage)
                    .replace('<name>', packageName)
                    .replace('<version>', packageVersion)
                    .build();
                const { stderr } = cmd.runSync(command);
                if (stderr) {
                    const message = `Unable to remove package ${packageName}@${packageVersion}.`;
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
                    `Package ${packageName}@${packageVersion} has been removed successfully.`
                );

                // Return a value when the task completes
                return 'Task completed!';
            }
        );
    } catch (error) {
        showErrorMessageWithDetail(`Failed to remove package ${packageName}@${packageVersion}.`, error);
    }
};

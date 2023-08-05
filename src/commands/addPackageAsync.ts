import { EOL } from 'os';
import { ProgressLocation, QuickPickItem, TreeItem, commands, env, window } from 'vscode';
import { ExtensionConfiguration } from '../extension';
import { CommandBuilder, asdf } from '../services/CommandBuilder';
import { cmd } from '../utils/cmd';
import { constants, extCommands } from '../utils/constants';
import { PackageItem, store } from '../utils/store';
import { showErrorMessageWithDetail } from '../utils/utils';

const getPackageList = async (bin: string, packageName: string): Promise<PackageItem[]> => {
    const size = store.packages[packageName]?.length || 0;
    if (size > 0) {
        return store.packages[packageName];
    }

    window.withProgress(
        {
            location: ProgressLocation.Notification,
            title: 'asdf',
            cancellable: true
        },
        async (progress) => {
            progress.report({ message: 'Get the list of package...' });
            const command = new CommandBuilder(bin, asdf.listAllPackages).replace('<name>', packageName).build();
            const { stdout, stderr } = cmd.runSync(command);
            if (stderr || !stdout) {
                const message = 'Unable to retrieve the package list.';
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
                return [];
            }

            progress.report({ message: 'Analyze the list of package...' });
            const packages: PackageItem[] = stdout
                .split('\n')
                .filter(Boolean)
                .reverse()
                .map((line) => {
                    let cversion = line?.trim() || '';
                    if (cversion.startsWith('*')) {
                        cversion = cversion.substring(1);
                    }
                    return { name: packageName, version: cversion };
                });
            store.packages[packageName] = packages;
            return 'Task completed!';
        }
    );
    return store.packages[packageName];
};

const addPackage = async (bin: string, packageName: string, packageVersion: string): Promise<void> => {
    window.withProgress(
        {
            location: ProgressLocation.Notification,
            title: 'asdf',
            cancellable: true
        },
        async (progress) => {
            progress.report({ message: `Add package ${packageName}@${packageVersion}...` });
            const command = new CommandBuilder(bin, asdf.installPackage)
                .replace('<name>', packageName)
                .replace('<version>', packageVersion)
                .build();
            const { stderr } = cmd.runSync(command);
            if (stderr) {
                const message = `Unable to add package ${packageName}@${packageVersion}.`;
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

            // Show message
            window.showInformationMessage(`Successfully added package ${packageName}@${packageVersion}.`);

            // Return a value when the task completes
            return 'Task completed!';
        }
    );
};

export const addPackageAsync = async (config: ExtensionConfiguration, treeItem: TreeItem): Promise<void> => {
    const bin = config.bin || 'asdf';
    const packageId = treeItem?.id;
    const packageName = packageId?.split('@')?.[0];

    try {
        if (!packageName) {
            window.showWarningMessage('Please select the package you want to add.');
            return;
        }

        // Get package version list
        const packages = await getPackageList(bin, packageName);
        if (!packages || packages.length <= 0) {
            return;
        }

        // Show quick pick
        const packageQuickPickItems: QuickPickItem[] = packages.map((item) => {
            return {
                label: item.version
            };
        });
        const quickPickItem = await window.showQuickPick(packageQuickPickItems, {
            title: 'Select the package you want to add.',
            placeHolder: 'Package version...'
        });
        if (!quickPickItem) {
            return;
        }

        // Add package
        const selectedPackageVersion = quickPickItem.label;
        await addPackage(bin, packageName, selectedPackageVersion);
    } catch (error) {
        showErrorMessageWithDetail(`Failed to add package ${packageName}.`, error);
    }
};

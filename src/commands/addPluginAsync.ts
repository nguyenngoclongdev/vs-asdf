import { EOL } from 'os';
import { ProgressLocation, QuickPickItem, commands, env, window } from 'vscode';
import { ExtensionConfiguration } from '../extension';
import { CommandBuilder, asdf } from '../services/CommandBuilder';
import { cmd } from '../utils/cmd';
import { constants, extCommands } from '../utils/constants';
import { PluginItem, store } from '../utils/store';
import { showErrorMessageWithDetail, showInputBox } from '../utils/utils';

const getPluginList = async (bin: string): Promise<PluginItem[]> => {
    if (store.plugins.length > 0) {
        return store.plugins;
    }

    window.withProgress(
        {
            location: ProgressLocation.Notification,
            title: 'asdf',
            cancellable: true
        },
        async (progress) => {
            progress.report({ message: 'Get the list of plugin...' });
            const command = new CommandBuilder(bin, asdf.listAllPlugins).build();
            const { stdout, stderr } = cmd.runSync(command);
            if (stderr || !stdout) {
                const message = 'Unable to retrieve the plugin list.';
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

            progress.report({ message: 'Analyze the list of plugin...' });
            const startingPoint = '1password-cli';
            let startPluginIndex = Number.MAX_SAFE_INTEGER;
            stdout
                .split('\n')
                .filter(Boolean)
                .forEach((line, index) => {
                    if (line.includes(startingPoint)) {
                        startPluginIndex = index;
                    }
                    if (index >= startPluginIndex) {
                        const keyValue = line.split(' ').filter(Boolean);
                        const cname = keyValue?.[0]?.trim() || '';
                        let curl = keyValue?.[1]?.trim() || '';
                        let isAdded = curl.startsWith('*');
                        if (isAdded) {
                            curl = curl.substring(1);
                        }
                        store.plugins.push({ name: cname, url: curl });
                    }
                });
            return 'Task completed!';
        }
    );
    return store.plugins;
};

const addPlugin = async (bin: string, pluginName: string, pluginUrl: string): Promise<void> => {
    window.withProgress(
        {
            location: ProgressLocation.Notification,
            title: 'asdf',
            cancellable: true
        },
        async (progress) => {
            progress.report({ message: `Add ${pluginName} plugin from ${pluginUrl}...` });
            const command = new CommandBuilder(bin, asdf.addPlugin)
                .replace('<name>', pluginName)
                .replace('<git-url>', pluginUrl)
                .build();
            const { stderr } = cmd.runSync(command);
            if (stderr) {
                const message = `Failed to add ${pluginName} plugin from ${pluginUrl}.`;
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
            window.showInformationMessage(
                `${pluginName} plugin has been successfully added to the ${pluginUrl} repository.`
            );

            // Return a value when the task completes
            return 'Task completed!';
        }
    );
};

export const addPluginAsync = async (config: ExtensionConfiguration): Promise<void> => {
    const bin = config.bin || 'asdf';
    try {
        // get plugin list
        const plugins = await getPluginList(bin);
        if (!plugins || plugins.length <= 0) {
            return;
        }

        // Show quick pick to choose the plugin
        const addNewPlugin: QuickPickItem = {
            label: 'Add new plugin...',
            detail: 'Add plugin via their Git URL',
            alwaysShow: true
        };
        const pluginQuickPickItems: QuickPickItem[] = [addNewPlugin].concat(
            plugins.map((item) => {
                return {
                    label: item.name,
                    detail: item.url
                };
            })
        );
        const quickPickItem = await window.showQuickPick(pluginQuickPickItems, {
            title: 'Select the plugin you want to add.',
            placeHolder: 'Plugin name...'
        });
        if (!quickPickItem) {
            return;
        }

        // Processing add custom plugin
        let selectedPluginName = '';
        let selectedPluginUrl = '';
        if (quickPickItem.label === addNewPlugin.label) {
            const customPluginName = await showInputBox({
                title: 'Please enter the plugin name.',
                placeHolder: 'e.g. nodejs, golang',
                validateInput: (value) => {
                    if (!value) {
                        return 'Plugin name cannot be null or empty.';
                    }
                    return ''; // input valid is OK
                }
            });
            if (!customPluginName) {
                return;
            }

            const customPluginUrl = await showInputBox({
                title: 'Please enter the plugin url.',
                placeHolder: 'e.g. https://github.com/halcyon/asdf-java.git',
                validateInput: (value) => {
                    if (!value) {
                        return 'Plugin url cannot be null or empty.';
                    }
                    return ''; // input valid is OK
                }
            });
            if (!customPluginUrl) {
                return;
            }

            selectedPluginName = customPluginName;
            selectedPluginUrl = customPluginUrl || '';
        } else {
            selectedPluginName = quickPickItem.label;
            selectedPluginUrl = quickPickItem.detail || '';
        }

        // Add plugin selected in quick pick
        await addPlugin(bin, selectedPluginName, selectedPluginUrl);
    } catch (error) {
        showErrorMessageWithDetail(`Failed to add plugin.`, error);
    }
};

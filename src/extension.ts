import { ExtensionContext, TreeItem, WorkspaceConfiguration, commands, window, workspace } from 'vscode';
import { addPackageAsync } from './commands/addPackageAsync';
import { addPluginAsync } from './commands/addPluginAsync';
import { removePackageAsync } from './commands/removePackageAsync';
import { removePluginAsync } from './commands/removePluginAsync';
import { setGlobalPackageAsync } from './commands/setGlobalPackageAsync';
import { setLocalPackageAsync } from './commands/setLocalPackageAsync';
import { updateAllPluginAsync } from './commands/updateAllPluginAsync';
import { updateAsdfAsync } from './commands/updateAsdfAsync';
import { updatePluginAsync } from './commands/updatePluginAsync';
import { InfoProvider } from './explorer/info-provider';
import { PackageProvider } from './explorer/package-provider';
import { PluginProvider } from './explorer/plugin-provider';
import { cmd } from './utils/cmd';
import { extCommands } from './utils/constants';

export interface ExtensionConfiguration extends WorkspaceConfiguration {
    bin?: string;
}

export async function activate(context: ExtensionContext) {
    // Get configuration
    const config = workspace.getConfiguration('asdf') as ExtensionConfiguration;
    const { bin = 'asdf' } = config;
    const isAsdfInstalled = cmd.isInstalled(bin);
    if (!isAsdfInstalled) {
        return;
    }

    // Init info provider
    const infoProvider = new InfoProvider(bin);
    window.registerTreeDataProvider('asdfInfoView', infoProvider);
    context.subscriptions.push(
        commands.registerCommand(extCommands.refreshInfoView, () => infoProvider.refresh()),
        commands.registerCommand(extCommands.asdfUpdate, async () => {
            await updateAsdfAsync(config);
        })
    );

    // Init plugin provider
    const pluginProvider = new PluginProvider(bin);
    window.registerTreeDataProvider('asdfPluginView', pluginProvider);
    context.subscriptions.push(
        commands.registerCommand(extCommands.refreshPluginView, () => pluginProvider.refresh()),
        commands.registerCommand(extCommands.addPlugin, async () => {
            await addPluginAsync(config);
        }),
        commands.registerCommand(extCommands.updateAllPlugin, async () => {
            await updateAllPluginAsync(config);
        }),
        commands.registerCommand(extCommands.updatePlugin, async (treeItem: TreeItem) => {
            await updatePluginAsync(config, treeItem);
        }),
        commands.registerCommand(extCommands.removePlugin, async (treeItem: TreeItem) => {
            await removePluginAsync(config, treeItem);
        })
    );

    // Init package provider
    const packageProvider = new PackageProvider(bin);
    window.registerTreeDataProvider('asdfPackageView', packageProvider);
    context.subscriptions.push(
        commands.registerCommand(extCommands.refreshPackageView, () => packageProvider.refresh()),
        commands.registerCommand(extCommands.addPackage, async (treeItem: TreeItem) => {
            await addPackageAsync(config, treeItem);
        }),
        commands.registerCommand(extCommands.removePackage, async (treeItem: TreeItem) => {
            await removePackageAsync(config, treeItem);
        }),
        commands.registerCommand(extCommands.setGlobalPackage, async (treeItem: TreeItem) => {
            await setGlobalPackageAsync(config, treeItem);
        }),
        commands.registerCommand(extCommands.setLocalPackage, async (treeItem: TreeItem) => {
            await setLocalPackageAsync(config, treeItem);
        })
    );
}

export async function deactivate() {
    window.showInformationMessage('[asdf] Goodbye.');
}

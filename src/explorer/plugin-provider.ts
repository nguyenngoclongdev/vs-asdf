import { EOL } from 'os';
import { Event, EventEmitter, ThemeIcon, TreeDataProvider, TreeItem, env, window } from 'vscode';
import { CommandBuilder, asdf } from '../services/CommandBuilder';
import { cmd } from '../utils/cmd';
import { constants } from '../utils/constants';

export class PluginProvider implements TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: EventEmitter<TreeItem | undefined | void> = new EventEmitter<
        TreeItem | undefined | void
    >();
    readonly onDidChangeTreeData: Event<TreeItem | undefined | void> = this._onDidChangeTreeData.event;

    private bin: string;
    constructor(bin: string) {
        this.bin = bin;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TreeItem): TreeItem {
        return element;
    }

    getChildren(): Thenable<TreeItem[]> {
        const command = new CommandBuilder(this.bin, asdf.listInstalledPlugins).build();
        const { stdout, stderr } = cmd.runSync(command);
        if (!stdout) {
            const message = 'Unable to retrieve the installed plugins.';
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
            return Promise.resolve([]);
        }

        const items = this.generateChildren(stdout);
        if (!items || items.length <= 0) {
            return Promise.resolve([]);
        }
        return Promise.resolve(items);
    }

    private generateChildren = (stdout: string): TreeItem[] => {
        const split = stdout.split('\n').filter(Boolean);

        // Common value
        const common: TreeItem = {
            contextValue: 'plugin-context',
            iconPath: new ThemeIcon('plug')
        };

        // Get plugin tree item
        return split.map((plugin) => {
            return {
                ...common,
                id: plugin,
                label: plugin
            };
        });
    };
}

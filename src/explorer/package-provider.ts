import { EOL } from 'os';
import {
    Event,
    EventEmitter,
    ThemeIcon,
    TreeDataProvider,
    TreeItem,
    TreeItemCollapsibleState,
    env,
    window
} from 'vscode';
import { CommandBuilder, asdf } from '../services/CommandBuilder';
import { cmd } from '../utils/cmd';
import { constants } from '../utils/constants';

export class PackageProvider implements TreeDataProvider<TreeItem> {
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

    getChildren(element?: TreeItem): Thenable<TreeItem[]> {
        const command = new CommandBuilder(this.bin, asdf.listInstalledPackages).build();
        const { stdout, stderr } = cmd.runSync(command);
        if (!stdout) {
            const message = 'Unable to retrieve the installed packages.';
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

        // Get key/value from tsdout
        const keyValues = this.getKeyValues(stdout);

        // Get the children of element or root if no element is passed.
        if (!element) {
            const items = this.generateParent(keyValues);
            if (!items || items.length <= 0) {
                return Promise.resolve([]);
            }
            return Promise.resolve(items);
        }

        const items = this.generateChildren(keyValues, element);
        if (!items || items.length <= 0) {
            return Promise.resolve([]);
        }
        return Promise.resolve(items);
    }

    private getKeyValues = (stdout: string): { [key: string]: string[] } => {
        const split = stdout.split('\n').filter(Boolean);
        const keyValues: { [key: string]: string[] } = {};
        let currentKey: string = split[0];
        split.forEach((value) => {
            if (value.startsWith(' ')) {
                const cvalue = value?.trim() || '';
                keyValues[currentKey].push(cvalue);
            } else {
                currentKey = value?.trim() || '';
                keyValues[currentKey] = [];
            }
        });
        return keyValues;
    };

    private generateParent = (keyValues: { [key: string]: string[] }): TreeItem[] => {
        // Common value
        const common = {
            contextValue: 'package-context',
            iconPath: new ThemeIcon('plug')
        };

        // Get package tree item
        const treeItems: TreeItem[] = [];
        Object.entries(keyValues).forEach(([pkg, versions]) => {
            const description = versions.map((v) => v.replace('*', '')).join(', ');
            treeItems.push({
                ...common,
                id: pkg,
                label: pkg,
                description: description,
                tooltip: description,
                collapsibleState: TreeItemCollapsibleState.Collapsed
            });
        });
        return treeItems;
    };

    private generateChildren = (keyValues: { [key: string]: string[] }, element: TreeItem): TreeItem[] => {
        // Common value
        const common: TreeItem = {
            contextValue: 'package-version-context',
            iconPath: new ThemeIcon('tag')
        };

        // Get package tree item
        const parentName = element.id || '';
        const treeItems: TreeItem[] = [];
        keyValues[parentName].forEach((version) => {
            const isSetted = version.includes('*');
            const cversion = version.replace('*', '');
            const itemId = `${parentName}@${cversion}`;

            // Add to tree
            treeItems.push({
                ...common,
                id: itemId,
                label: cversion,
                description: isSetted ? '✔' : ''
            });
        });
        return treeItems;
    };
}

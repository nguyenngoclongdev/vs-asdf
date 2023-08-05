import { EOL } from 'os';
import { Event, EventEmitter, ThemeIcon, TreeDataProvider, TreeItem, env, window } from 'vscode';
import { CommandBuilder, asdf } from '../services/CommandBuilder';
import { cmd } from '../utils/cmd';
import { constants } from '../utils/constants';

const osLabel = 'OS:';
const shellLabel = 'SHELL:';
const bashLabel = 'BASH VERSION:';
const asdfVersionLabel = 'ASDF VERSION:';
const asdfIntEnvLabel = 'ASDF INTERNAL VARIABLES:';
const asdfEnvLabel = 'ASDF ENVIRONMENT VARIABLES:';
const asdfPluginLabel = 'ASDF INSTALLED PLUGINS:';
const ASDF_LABELS = [osLabel, shellLabel, bashLabel, asdfVersionLabel, asdfIntEnvLabel, asdfEnvLabel, asdfPluginLabel];

export class InfoProvider implements TreeDataProvider<TreeItem> {
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
        const command = new CommandBuilder(this.bin, asdf.asdfInfo).build();
        const { stdout, stderr } = cmd.runSync(command);
        if (!stdout) {
            const message = 'Unable to retrieve the asdf information.';
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

    private createTreeItems = (label: string, items: string[]): TreeItem | Array<TreeItem> => {
        const treeItem: TreeItem = {
            label: items.length > 0 ? items.join(' ') : '',
            tooltip: `${label}${EOL}${items.length > 0 ? items.join(EOL) : ''}`
        };

        switch (label) {
            case osLabel: {
                return {
                    ...treeItem,
                    iconPath: new ThemeIcon('vm')
                };
            }
            case bashLabel:
            case shellLabel: {
                return {
                    ...treeItem,
                    iconPath: new ThemeIcon('terminal')
                };
            }
            case asdfVersionLabel: {
                return {
                    ...treeItem,
                    iconPath: new ThemeIcon('package')
                };
            }
            case asdfIntEnvLabel:
            case asdfEnvLabel: {
                return {
                    ...treeItem,
                    iconPath: new ThemeIcon('gear')
                };
            }
            case asdfPluginLabel: {
                const treeItems: TreeItem[] = [];
                treeItems.push({
                    label: `Installed Plugins`,
                    iconPath: new ThemeIcon('plug')
                });

                items.forEach((plugin) => {
                    const [pluginName, pluginUrl] = plugin.split('  ').filter(Boolean);
                    const cpluginName = pluginName?.trim() || '';
                    const cpluginUrl = pluginUrl?.trim() || '';
                    treeItems.push({
                        label: cpluginName,
                        description: cpluginUrl,
                        tooltip: `${cpluginName}: ${cpluginUrl}`
                    });
                });
                return treeItems;
            }
            default: {
                return {
                    ...treeItem,
                    iconPath: new ThemeIcon('circle-filled')
                };
            }
        }
    };

    private generateChildren = (stdout: string): TreeItem[] => {
        const split = stdout.split('\n').filter(Boolean);

        // Get key values
        const keyValues: { [key: string]: string[] } = {};
        let currentKey = '';
        split.forEach((line) => {
            const isStartingPoint = ASDF_LABELS.some((label) => label === line);
            if (isStartingPoint) {
                currentKey = line;
                keyValues[currentKey] = [];
            } else {
                keyValues[currentKey].push(line);
            }
        });

        // Create tree item
        const treeItems: TreeItem[] = [];
        Object.entries(keyValues).forEach(([label, values]) => {
            const item = this.createTreeItems(label, values);
            if (Array.isArray(item)) {
                treeItems.push(...item);
            } else {
                treeItems.push(item);
            }
        });
        return treeItems;
    };
}

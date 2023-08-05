export type PackageItem = { name: string; version: string; isInstalled?: boolean };

export type PluginItem = { name: string; url: string; isAdded?: boolean };

class Store {
    packages: { [key: string]: PackageItem[] } = {};
    clearPackages(packageName: string) {
        this.packages[packageName] = [];
    }

    plugins: PluginItem[] = [];
    clearPlugins() {
        this.plugins = [];
    }
}

export const store = new Store();

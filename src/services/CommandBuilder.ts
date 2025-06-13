// https://asdf-vm.com/manage/commands.html
export const asdf = {
    asdfInfo: '<asdf> info', // Print OS, Shell and asdf debug information.
    asdfUpdate: '<asdf> update', // Update asdf to the latest stable release

    listAllPlugins: '<asdf> plugin list all', // List plugins registered on asdf-plugins repository with URLs
    listInstalledPlugins: '<asdf> plugin list', // List installed plugins. Optionally show git urls and git-ref
    addPlugin: '<asdf> plugin add <name> <git-url>', // Add a plugin from the plugin repo OR, add a Git repo as a plugin by specifying the name and repo url
    updatePlugin: '<asdf> plugin update <name> <git-ref>', // Update a plugin to latest commit on default branch or a particular git-ref
    updateAllPlugin: '<asdf> plugin update --all', // Update all plugins to latest commit on default branch
    removePlugin: '<asdf> plugin remove <name>', // Remove plugin and package versions

    currentAllVersionPackages: '<asdf> current', // Display current version set or being sed for all packages
    currentVersionPackage: '<asdf> current <name>', // Display current version set or being used for package
    latestAllVersionPackages: '<asdf> latest --all', // Show latest stable version of all the packages and if they are installed
    latestVersionPackage: '<asdf> latest <name>', // Show latest stable version of a package
    listInstalledPackages: '<asdf> list', // List installed versions of a package and optionally filter the versions
    listAllPackages: '<asdf> list all <name>', // List all versions of a package and optionally filter the returned versions
    installAllPackagesInToolVersion: '<asdf> install', // Install all the package versions listed in the .tool-versions file
    installPackageInToolVersion: '<asdf> install <name>', // Install one tool at the version pecified in the .tool-versions file
    installPackage: '<asdf> install <name> <version>', // Install a specific version of a package, <version> || latest
    uninstallPackage: '<asdf> uninstall <name> <version>', // Remove a specific version of a package
    wherePackage: '<asdf> where <name> <version>', // Display install path for an installed or current version

    setGlobalPackage: '<asdf> set -u <name> <version>', // Set the package global version, <version> || latest
    setLocalPackage: '<asdf> set <name> <version>' // Set the package local version, <version> || latest
};

export class CommandBuilder {
    private cmd = '';

    constructor(bin: string, cmd: string) {
        this.cmd = cmd.replace('<asdf>', bin);
    }

    replace(key: string, value: string): CommandBuilder {
        this.cmd = this.cmd.replace(key, value);
        return this;
    }

    build(): string {
        return this.cmd;
    }
}

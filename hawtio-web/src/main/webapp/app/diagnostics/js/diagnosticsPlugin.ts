/**
 * @module Diagnostics
 * @main Diagnostics
 */
/// <reference path="diagnosticHelpers.ts"/>
module Diagnostics {

  export var rootPath = 'app/diagnostics';
  export var templatePath = rootPath + '/html/';
  export var pluginName = 'diagnostics';

  export var _module = angular.module(pluginName, ['bootstrap', 'ngResource', 'datatable', 'hawtioCore', 'hawtio-forms', 'ui']);

  _module.config(["$routeProvider", ($routeProvider) => {
    $routeProvider.
            when('/diagnostics/jfr', {templateUrl: templatePath + 'discover.html'}).
            when('/diagnostics/heap', {templateUrl: templatePath + 'connect.html'}).
            when('/diagnostics/flags', {templateUrl: templatePath + 'local.html'});
  }]);

  _module.constant('mbeanName', 'com.sun.management:type=DiagnosticCommand');

  _module.run(["$location", "workspace", "viewRegistry", "layoutFull", "helpRegistry", "preferencesRegistry", "ConnectOptions", ($location, workspace:Workspace, viewRegistry, layoutFull, helpRegistry, preferencesRegistry, connectOptions:Core.ConnectOptions) => {

    viewRegistry[pluginName] = templatePath + 'layoutDiagnostics.html';
    helpRegistry.addUserDoc('jvm', 'app/diagnostics/doc/help.md');

//    preferencesRegistry.addTab("Connect", 'app/jvm/html/reset.html');

    workspace.topLevelTabs.push({
      id: "diagnostics",
      content: "Diagnostics",
      title: "JVM Diagnostics",
      isValid: (workspace) => {
          return workspace.treeContainsDomainAndProperties("com.sun.management")
      },
      href: () => {
        return '#/jvm/connect';
      },
      isActive: (workspace:Workspace) => workspace.isLinkActive("diagnostics")
    });
  }]);

  hawtioPluginLoader.addModule(pluginName);
}

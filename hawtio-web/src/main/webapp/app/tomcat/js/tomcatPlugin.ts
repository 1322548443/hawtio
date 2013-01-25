module Tomcat {
  var pluginName = 'tomcat';
  angular.module(pluginName, ['bootstrap', 'ngResource', 'hawtioCore']).config(($routeProvider) => {
      // TODO custom tomcat views go here...
  }).
          run(($location: ng.ILocationService, workspace:Workspace) => {

            workspace.topLevelTabs.push( {
              content: "Tomcat",
              title: "Manage your Tomcat container",
              isValid: () => workspace.treeContainsDomainAndProperties("Tomcat"),
              href: () => "#/jmx/attributes?tab=tomcat",
              isActive: () => workspace.isTopTabActive("tomcat")
            });
          });

  hawtioPluginLoader.addModule(pluginName);
}

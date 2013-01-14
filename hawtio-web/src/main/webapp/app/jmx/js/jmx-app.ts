module Jmx {
  var pluginName = 'jmx';
  angular.module(pluginName, ['bootstrap', 'ngResource', 'hawtioCore']).config(($routeProvider) => {
    $routeProvider.
            when('/jmx', {templateUrl: 'app/core/html/help.html', controller: Core.NavBarController})
  }).
          run(($location: ng.ILocationService, workspace:Workspace) => {
            // now lets register the nav bar stuff!
            var map = workspace.uriValidations;
            map['logs'] = () => workspace.isOsgiFolder();


            workspace.topLevelTabs.push( {
              content: "JMX",
              title: "View the JMX MBeans in this process",
              isValid: () => true,
              href: () => url("#/attributes")
            });


            workspace.subLevelTabs.push( {
              content: '<i class="icon-list"></i> Attributes',
              title: "View the attribute values on your selection",
              isValid: () => true,
              href: () => url("#/attributes")
            });

            workspace.subLevelTabs.push( {
              content: '<i class="icon-bar-chart"></i> Chart',
              title: "View a chart of the metrics on your selection",
              isValid: () => true,
              href: () => url("#/charts")
            });


            console.log("Loaded sub level tabs for jmx!");

          });

  hawtioPluginLoader.addModule(pluginName);
}

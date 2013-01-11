module Fabric {
  angular.module('fabric', ['bootstrap', 'ngResource', 'hawtioCore']).config(($routeProvider) => {
    $routeProvider.
            when('/fabric/containers', {templateUrl: 'app/fabric/html/containers.html', controller: ContainersController}).
            when('/fabric/profiles', {templateUrl: 'app/fabric/html/profiles.html', controller: ProfilesController})
  }).
          run(($location: ng.ILocationService, workspace: Workspace) => {
            // now lets register the nav bar stuff!
            var map = workspace.uriValidations;
            map['/fabric/containers'] = () => workspace.hasFabricMBean();
            map['/fabric/profiles'] = () => workspace.hasFabricMBean();


            workspace.topLevelTabs.push( {
              content: "Fabric",
              title: "Manage your containers and middleware in a fabric",
              isValid: workspace.hasFabricMBean,
              href: () => url("#/fabric/containers?nid=root_org.fusesource.fabric"),
              ngClick: () => {
                var q = $location.search();
                q['nid'] = "root_org.fusesource.fabric";
                $location.search(q);
              }
            });

          });
}

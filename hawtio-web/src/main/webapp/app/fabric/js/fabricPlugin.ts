module Fabric {
  angular.module('fabric', ['bootstrap', 'ngResource', 'ngGrid', 'hawtioCore']).config(($routeProvider) => {
    $routeProvider.
            when('/fabric/containers', {templateUrl: 'app/fabric/html/containers.html', controller: ContainersController}).
            when('/fabric/container/:containerId', {templateUrl: 'app/fabric/html/container.html', controller: ContainerController}).
            when('/fabric/profiles', {templateUrl: 'app/fabric/html/profiles.html', controller: ProfilesController}).
            when('/fabric/profile/:versionId/:profileId', {templateUrl: 'app/fabric/html/profile.html', controller: ProfileController}).
            when('/fabric/profile/:versionId/:profileId/:fname', {templateUrl: 'app/fabric/html/pid.html', controller: PIDController});
  }).
          run(($location: ng.ILocationService, workspace: Workspace, viewRegistry) => {

            viewRegistry['fabric'] = "app/fabric/html/layoutFabric.html";

            workspace.topLevelTabs.push( {
              content: "Fabric",
              title: "Manage your containers and middleware in a fabric",
              isValid: () => workspace.treeContainsDomainAndProperties('org.fusesource.fabric', {type: 'Fabric'}),
              href: () => "#/fabric/containers",
              isActive: () => workspace.isLinkActive("fabric")
            });

          });

  hawtioPluginLoader.addModule('fabric');
}

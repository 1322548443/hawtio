module Fabric {

  export function CreateFabricController($scope, jolokia, $location) {

    Fabric.schemaConfigure();

    $scope.schema = (<any>window).org_fusesource_fabric_api_CreateEnsembleOptions;

    $scope.entity = {
      zooKeeperServerPort: 2181,
      globalResolver: 'localhostname',
      resolver: 'localhostname',
      agentEnabled: true,
      autoImportEnabled: true,
      minimumPort: 0,
      maximumPort: 65535,
      profiles: ['fabric', 'hawtio']
    };

    $scope.forms = {};

    $scope.onSubmit = (json, form) => {

      jolokia.execute(Fabric.clusterManagerMBean, 'createCluster(java.util.List, java.util.Map)', null, angular.toJson(json), {
        method: 'post',
        success: (response) => {
          notification('success', "Created fabric!");
          $location.url("/fabric/overview");
          Core.$apply($scope);
        },
        error: (response) => {
          notification('error', "Error creating fabric: " + response.error);
          Core.$apply($scope);
        }
      });
    }


    console.log("window: ", (<any>window).org_fusesource_fabric_api_CreateEnsembleOptions);
  }

}

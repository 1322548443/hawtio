module Fabric {

  export function ContainerController($scope, workspace:Workspace, $routeParams, jolokia) {
    $scope.containerId = $routeParams.containerId;
    
    if (angular.isDefined($scope.containerId)) {
      
      Core.register(jolokia, $scope, {
          type: 'exec', mbean: managerMBean,
          operation: 'getContainer(java.lang.String)',
          arguments: [$scope.containerId]
      }, onSuccess(render));
      
    }

    $scope.stop = () => {
      jolokia.request(
          {
            type: 'exec', mbean: managerMBean,
            operation: 'stopContainer(java.lang.String)',
            arguments: [$scope.containerId]
          },
          onSuccess(function() {
            // TODO show a notification
            console.log("Stopped!");
          }));
    }

    $scope.delete = () => {
      jolokia.request(
          {
            type: 'exec', mbean: managerMBean,
            operation: 'destroyContainer(java.lang.String)',
            arguments: [$scope.containerId]
          },
          onSuccess(function() {
            // TODO show a notification
            console.log("Deleted!");
          }));
    }

    $scope.start = () => {
      jolokia.request(
          {
            type: 'exec', mbean: managerMBean,
            operation: 'startContainer(java.lang.String)',
            arguments: [$scope.containerId]
          },
          onSuccess(function() {
            // TODO show a notification
            console.log("Started!");
          }));
    }

    $scope.getType = () => {
      if ($scope.row) {
        if ($scope.row.ensembleServer) {
          return "Fabric Server";
        } else if ($scope.row.managed) {
          return "Managed Container";
        } else {
          return "Unmanaged Container";
        }
      }
      return "";
    }


    function render(response) {
      if (!Object.equal($scope.row, response.value)) {
        $scope.row = response.value;
        $scope.services = getServiceList($scope.row);
        $scope.$apply();
      }
    }
 }
}

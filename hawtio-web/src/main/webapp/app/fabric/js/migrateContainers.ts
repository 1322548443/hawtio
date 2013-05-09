module Fabric {

  export function MigrateContainersController($scope, jolokia) {

    $scope.versions = [];
    $scope.containers = [];
    $scope.containersResponse = [];

    $scope.selectedVersion = [];
    $scope.selectedContainers = [];

    $scope.showApply = false;

    $scope.versionGridOptions = {
      data: 'versions',
      selectedItems: $scope.selectedVersion,
      showSelectionCheckbox: true,
      multiSelect: false,
      keepLastSelected: true,
      columnDefs: [{
        field: 'id',
        displayName: 'Version Name',
        width: '94%'
      }],
      filterOptions: {
        filterText: ''
      }
    };


    $scope.containerGridOptions = {
      data: 'containers',
      selectedItems: $scope.selectedContainers,
      showSelectionCheckbox: true,
      multiSelect: true,
      keepLastSelected: false,
      columnDefs: [{
        field: 'id',
        displayName: 'Container Name',
        width: '94%'
      }],
      filterOptions: {
        filterText: ''
      }
    };

    $scope.canApply = () => {
      return !($scope.selectedVersion.length > 0 && $scope.selectedContainers.length > 0);
    }

    $scope.render = (response) => {
      if (response.request.operation === 'versions()') {
        if (!Object.equal($scope.versions, response.value)) {
          $scope.versions = response.value;
          $scope.$apply();
        }
      }

      if (response.request.operation === 'containerIds()') {
        if (!Object.equal($scope.containersResponse, response.value)) {
          $scope.containersResponse = response.value;

          $scope.containers = []

          $scope.containersResponse.each(function(container) {
            $scope.containers.push({
              id: container
            });
          });
          $scope.$apply();
        }
      }
    };

    $scope.migrateContainers = () => {




    };


    Core.register(jolokia, $scope, [
      {type: 'exec', mbean: managerMBean, operation: 'versions()'},
      {type: 'exec', mbean: managerMBean, operation: 'containerIds()'}
    ], onSuccess($scope.render));
  }
}

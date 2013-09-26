module Jmx {

  export function AreaChartController($scope, $routeParams, jolokia, $templateCache, localStorage) {

    $scope.mbean = $routeParams['mbean'];
    $scope.attribute = $routeParams['attribute'];

    $scope.template = "";

    $scope.entries = [];

    $scope.data = {
      entries: $scope.entries
    };

    $scope.count = 0;

    $scope.req = [{type: 'read', mbean: $scope.mbean, attribute: $scope.attribute}];



    $scope.render = (response) => {

      $scope.count = $scope.count + localStorage['updateRate'];

      $scope.entries.push({
        time: response.timestamp,
        count: response.value
      });

      $scope.entries = $scope.entries.last(15);

      if ($scope.template === "") {
        $scope.template = $templateCache.get("areaChart");
      }

      $scope.data = {
        _type: "date_histogram",
        entries: $scope.entries
      };

      Core.$apply($scope);

    }

    Core.register(jolokia, $scope, $scope.req, onSuccess($scope.render));




  }

}

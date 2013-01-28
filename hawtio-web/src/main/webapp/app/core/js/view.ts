module Core {

  myApp.constant('layoutTree', 'app/core/html/layoutTree.html');
  myApp.constant('layoutFull', 'app/core/html/layoutFull.html');

  myApp.factory('viewRegistry', function () {
    return {};
  });

  // NOTE - $route is brought in here to ensure the factory for that service
  // has been called, otherwise the ng-include directive doesn't show the partial
  // after a refresh until you click a top-level link.
  export function ViewController($scope, $route, $location:ng.ILocationService, layoutTree, layoutFull, viewRegistry) {

    findViewPartial();

    $scope.$on("$routeChangeSuccess", function (event, current, previous) {
      findViewPartial();
    });

    function searchRegistry(path) {
      var answer = undefined;

      Object.extended(viewRegistry).keys(function(key, value) {
        if (path.startsWith(key)) {
          answer = value;
        }
      });

      //console.log("Searching for: " + path + " returning: ", answer);

      return answer;
    }

    function findViewPartial() {

      var answer = null;
      var hash = $location.search();
      var tab = hash['tab'];
      if (angular.isString(tab)) {
        answer = searchRegistry(tab);
      }
      if (!answer) {
        var path = $location.path();
        if (path) {
          if (path.startsWith("")) {
            path = path.substring(1);
          }
          answer = searchRegistry(path);
        }
      }
      if (!answer) {
        answer = layoutTree;
      }
      $scope.viewPartial = answer;

      //console.log("Using view partial: " + answer);
      return answer;
    }
  }
}

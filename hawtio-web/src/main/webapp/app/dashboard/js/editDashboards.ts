module Dashboard {
  export function EditDashboardsController($scope, $routeParams, $route, $location, workspace:Workspace, dashboardRepository:DashboardRepository, jolokia) {
    $scope.searchText = "";
    $scope.selectedItems = [];

    updateData();

    $scope.hasUrl = () => {
      return ($scope.url) ? true : false;
    };

    $scope.hasSelection = () => {
      return !$scope.selectedItems.length;
    };

    $scope.gridOptions = {
      selectedItems: $scope.selectedItems,
      showFilter: false,
      filterOptions: {
        filterText: "searchText"
      },
      data: 'dashboards',
      selectWithCheckboxOnly: true,
      columnDefs: [
        {
          field: 'title',
          displayName: 'Dashboard',
          cellTemplate: '<div class="ngCellText"><a ng-href="#/dashboard/id/{{row.getProperty(' + "'id'" + ')}}{{hash}}">{{row.getProperty(col.field)}}</a></div>'
        },
        {
          field: 'group',
          displayName: 'Group'
        }
      ]
    };

    // Don't think this is needed...
    /*$scope.$on("$routeChangeSuccess", function (event, current, previous) {
      // lets do this asynchronously to avoid Error: $digest already in progress
      setTimeout(updateData, 50);
    });
    */
    $scope.$watch('workspace.selection', function () {
      setTimeout(updateData, 50);
    });

    $scope.goBack = () => {
      var href = Core.trimLeading($scope.url, "#");
      if (href) {
        $location.url(href);
      }
    };

    $scope.addViewToDashboard = () => {
      var nextHref = null;
      angular.forEach($scope.selectedItems, (selectedItem) => {
        // TODO this could be a helper function
        var text = $scope.url;
        var query = null;
        if (text) {
          var idx = text.indexOf('?');
          if (idx) {
            query = text.substring(idx + 1);
            text = text.substring(0, idx);
          }
          text = Core.trimLeading(text, "#");
        }
        var search = {};
        if (query) {
          var expressions = query.split("&");
          angular.forEach(expressions, (expression) => {
            if (expression) {
              var names = expression.split("=");
              var key = names[0];
              var value = names.length > 1 ? names[1] : null;
              var old = search[key];
              if (old) {
                if (!angular.isArray(old)) {
                  old = [old];
                  search[key] = old;
                }
                old.push(value);
              } else {
                search[key] = value;
              }
            }
          });
        }
        //console.log("path is: " + text + " the search is " + JSON.stringify(search));
        if ($route && $route.routes) {
          var value = $route.routes[text];
          if (value) {
            /*
             angular.forEach($route.routes, (value, key) => {
             if (key === text) {
             */
            var templateUrl = value["templateUrl"];
            if (templateUrl) {
              if (!selectedItem.widgets) {
                selectedItem.widgets = [];
              }
              var nextNumber = selectedItem.widgets.length + 1;
              var widget = {
                id: "w" + nextNumber, title: "Untitled" + nextNumber, row: nextNumber, col: 1,
                path: Core.trimLeading(text, "/"),
                include: templateUrl,
                search: search,
                hash: ""
              };
              selectedItem.widgets.push(widget);

              if (!nextHref && selectedItem.id) {
                nextHref = "/dashboard/id/" + selectedItem.id
              }

            }
          } else {
            // TODO we need to be able to match URI templates...
          }
        }
      });

      if (nextHref) {
        // remove any dodgy query
        delete $location.search()["href"];
        $location.path(nextHref);
      }
    };

    function addDashboard(newDash) {
      // TODO how to really add??

      $scope.dashboards.push(newDash);
      $scope.selectedItems.push(newDash);
    }

    $scope.create = () => {
      var counter = $scope.dashboards.length + 1;
      var id = "dash" + (counter);
      var newDash = {id: id, title: "Untitled" + counter, group: "Personal", widgets: []};

      // TODO how to really add??
      addDashboard(newDash);
    };

    $scope.duplicate = () => {
      angular.forEach($scope.selectedItems, (item, idx) => {
        // lets unselect this item
        $scope.selectedItems = $scope.selectedItems.splice(idx, 1);
        var counter = $scope.dashboards.length + 1;
        var id = "dash" + (counter);
        var widgets = item.widgets || [];
        var newDash = {id: id, title: item.title + " Copy", group: item.group, widgets: widgets };
        addDashboard(newDash);
      });
    };

    $scope.delete = () => {
      angular.forEach($scope.selectedItems, (item) => {
        $scope.dashboards.remove(item);
      });
      $scope.selectedItems.splice(0, $scope.selectedItems.length);
    };

    function updateData() {
      var url = $routeParams["href"];
      if (url) {
        $scope.url = decodeURIComponent(url);
      }
      dashboardRepository.getDashboards(dashboardLoaded);
      $scope.$apply();
    }

    function dashboardLoaded(dashboards) {
      $scope.dashboards = dashboards;
      if (!$scope.$$phase) {
        $scope.$apply();
      }
    }
  }
}
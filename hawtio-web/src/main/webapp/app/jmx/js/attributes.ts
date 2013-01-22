module Jmx {

  export function AttributesController($scope, workspace:Workspace, jolokia) {
    $scope.filterText = "";
    $scope.columnDefs = [];
    $scope.gridOptions = {
      showFilter: false,
      filterOptions: {
        filterText: "searchText"
      },
      data: 'gridData',
      columnDefs: 'columnDefs'
    };

    $scope.$on("$routeChangeSuccess", function (event, current, previous) {
      // lets do this asynchronously to avoid Error: $digest already in progress
      setTimeout(updateTableContents, 50);
    });

    $scope.$watch('workspace.selection', function () {
      if (workspace.moveIfViewInvalid()) return;
      updateTableContents();
    });

    function updateTableContents() {
      $scope.gridData = [];
      $scope.mbeanIndex = null;
      var mbean = workspace.getSelectedMBeanName();
      var request = null;
      var node = workspace.selection;

      if (mbean) {
        request = { type: 'read', mbean: mbean };
        $scope.columnDefs = [
          {field: 'name', displayName: 'Property' /*, width: "20%"*/},
          {field: 'value', displayName: 'Value' /*,  width: "70%"*/}
        ];
      } else if (node) {
        // lets query each child's details
        var children = node.children;
        if (children) {
          var childNodes = children.map((child) => child.objectName);
          var mbeans = childNodes.filter((mbean) => mbean);

          // lets filter out the collections of collections; so only have collections of mbeans
          //if (mbeans && childNodes.length === mbeans.length && !ignoreFolderDetails(node)) {

          // TODO filter out collections which have different kinds of mbeans?
          if (mbeans && !ignoreFolderDetails(node)) {
            var query = mbeans.map((mbean) => {
              return { type: "READ", mbean: mbean, ignoreErrors: true};
            });
            if (query.length === 1) {
              request = query[0];
            } else if (query.length > 1) {
              request = query;

              // deal with multiple results
              $scope.mbeanIndex = {};
              $scope.mbeanRowCounter = 0;
              $scope.mbeanCount = mbeans.length;
              $scope.columnDefs = [];
            }
          }
        }
      }
      //var callback = onSuccess(render, { error: render });
      var callback = onSuccess(render);
      if (request) {
        $scope.request = request;
        Core.register(jolokia, $scope, request, callback);
      }
    }

    function includePropertyValue(key: string, value) {
      return !angular.isObject(value);
    }

    function render(response) {
      var data = response.value;
      var mbeanIndex = $scope.mbeanIndex;
      if (mbeanIndex) {
        var mbean = response.request.mbean;
        if (mbean) {
          var idx = mbeanIndex[mbean];
          if (!angular.isDefined(idx)) {
            idx = $scope.mbeanRowCounter;
            mbeanIndex[mbean] = idx;
            $scope.mbeanRowCounter += 1;
          }
          if (idx === 0) {
            // this is to force the table to repaint
            $scope.gridData = [];

            if (!$scope.columnDefs.length) {
              // lets update the column definitions based on any configured defaults
              var key = workspace.selectionConfigKey();
              var defaultDefs = workspace.attributeColumnDefs[key] || [];
              var defaultSize = defaultDefs.length;
              var map = {};
              angular.forEach(defaultDefs, (value, key) => {
                var field = value.field;
                if (field) {
                  map[field] = value
                }
              });

              angular.forEach(data, (value, key) => {
                if (includePropertyValue(key, value)) {
                  if (!map[key]) {
                    defaultDefs.push({
                      field: key,
                      displayName: humanizeValue(key),
                      visible: defaultSize === 0
                    });
                  }
                }
              });
              $scope.columnDefs = defaultDefs;
            }
          }
          // assume 1 row of data per mbean
          $scope.gridData[idx] = data;

          var count = $scope.mbeanCount;
          if (!count || idx + 1 >= count) {
            // only cause a refresh on the last row
            $scope.$apply();
          }
          // if the last row, then fire an event
        } else {
          console.log("No mbean name in request " + JSON.stringify(response.request));
        }
      } else {
        if (angular.isObject(data)) {
          var properties = [];
          angular.forEach(data, (value, key) => {
            if (includePropertyValue(key, value)) {
              properties.push({name: humanizeValue(key), value: value});
            }
          });
          data = properties;
        }
        $scope.gridData = data;
        $scope.$apply();
      }
    }
  }

}

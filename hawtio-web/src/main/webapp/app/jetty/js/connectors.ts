module Jetty {

    export function ConnectorsController($scope, $location, workspace:Workspace, jolokia) {

        var stateTemplate = '<div class="ngCellText pagination-centered" title="{{row.getProperty(col.field)}}"><i class="{{row.getProperty(col.field) | jettyIconClass}}"></i></div>';

        $scope.connectors = [];
        $scope.search = "";

        var columnDefs: any[] = [
            {
                field: 'running',
                displayName: 'State',
                cellTemplate: stateTemplate,
                width: 56,
                minWidth: 56,
                maxWidth: 56,
                resizable: false
            },
            {
                field: 'port',
                displayName: 'Port',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'scheme',
                displayName: 'Scheme',
                cellFilter: null,
                width: "*",
                resizable: true
            },
        ];

        $scope.gridOptions = {
            data: 'connectors',
            displayFooter: false,
            displaySelectionCheckbox: false,
            canSelectRows: false,
            columnDefs: columnDefs,
            filterOptions: {
                filterText: 'search'
            }
        };

        function render(response) {
            $scope.connectors = [];

            function onAttributes(response) {
              var obj = response.value;
              if (obj) {
                // split each into 2 rows as we want http and https on each row
                obj.mbean = response.request.mbean;
                obj.scheme = "http";
                obj.port = obj.port;
                $scope.connectors.push(obj);
                if (obj.confidentialPort) {
                  // create a clone of obj for https
                  var copyObj = {
                    scheme: "https",
                    port: obj.confidentialPort,
                    running: obj.running,
                    mbean: obj.mbean
                  }
                  $scope.connectors.push(copyObj);
                }
                Core.$apply($scope);
              }
            }

            // create structure for each response
            angular.forEach(response, function(value, key) {
              var mbean = value;
              jolokia.request( {type: "read", mbean: mbean, attribute: ["confidentialPort", "confidentialScheme", "port", "running"]}, onSuccess(onAttributes));
            });
          Core.$apply($scope);
        };

        // function to trigger reloading page
        $scope.onResponse = function (response) {
          //console.log("got response: " + response);
          loadData();
        };

        $scope.$watch('workspace.tree', function () {
          // if the JMX tree is reloaded its probably because a new MBean has been added or removed
          // so lets reload, asynchronously just in case
          setTimeout(loadData, 50);
        });

        function loadData() {
          console.log("Loading Jetty connector data...");
          jolokia.search("org.eclipse.jetty.server.nio:type=selectchannelconnector,*", onSuccess(render));
        }

    }
}
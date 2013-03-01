module Jetty {

    export function JettyController($scope, $location, workspace:Workspace, jolokia) {

        $scope.webapps = [];
        $scope.selected = [];
        $scope.search = "";

        var columnDefs: any[] = [
            {
                field: 'name',
                displayName: 'Name',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'contextPath',
                displayName: 'Context-Path',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'state',
                displayName: 'State',
                cellFilter: null,
                width: "*",
                resizable: false
            }
        ];

        $scope.gridOptions = {
            data: 'webapps',
            displayFooter: false,
            selectedItems: $scope.selected,
            selectWithCheckboxOnly: true,
            columnDefs: columnDefs,
            filterOptions: {
                filterText: 'search'
            }
        };

        function render(response) {
            $scope.webapps = [];
            $scope.selected.length = 0;

            // create structure for each response
            angular.forEach(response, function(value, key) {
                var running = jolokia.getAttribute(value, "running");
                var obj = {
                    mbeanName: value,
                    name: jolokia.getAttribute(value, "displayName"),
                    contextPath: jolokia.getAttribute(value, "contextPath"),
                    state: running ? "started" : "stopped"
                };
                $scope.webapps.push(obj);
            });
            $scope.$apply();
        };

        // function to trigger reloading page
        $scope.onResponse = function () {
            jolokia.search("org.mortbay.jetty.plugin:type=jettywebappcontext,*",
                {
                    success: render,
                    error: render
                });
        }

        // function to control the web applications
        $scope.controlWebApps = function(op) {
            // grab id of mbean names to control
            var ids = $scope.selected.map(function(b) { return b.mbeanName });
            if (!angular.isArray(ids)) {
                ids = [ids];
            }

            // execute operation on each mbean
            ids.forEach((id) => {
                jolokia.request({
                        type: 'exec',
                        mbean: id,
                        operation: op,
                        arguments: null
                    },
                    {
                        success: $scope.onResponse,
                        error: $scope.onResponse
                    });
            });
        }

        $scope.stop = function() {
            $scope.controlWebApps('stop');
        }

        $scope.start = function() {
            $scope.controlWebApps('start');
        }

        $scope.uninstall = function() {
            $scope.controlWebApps('destroy');
        }

        // register to core to poll a search for the web apps so the page is dynamic updated
        Core.registerSearch(jolokia, $scope, "org.mortbay.jetty.plugin:type=jettywebappcontext,*", onSuccess(render));

  }
}
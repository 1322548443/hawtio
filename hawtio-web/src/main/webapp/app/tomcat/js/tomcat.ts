module Tomcat {

    export function TomcatController($scope, $location, workspace:Workspace, jolokia) {

        $scope.webapps = [];
        $scope.selected = [];
        $scope.search = "";

        var columnDefs: any[] = [
            {
                field: 'displayName',
                displayName: 'Name',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'path',
                displayName: 'Context-Path',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'stateName',
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

            function onAttributes(response) {
              var obj = response.value;
              if (obj) {
                obj.mbean = response.request.mbean;
                $scope.webapps.push(obj);
                Core.$apply($scope);
              }
            }

            // create structure for each response
            angular.forEach(response, function(value, key) {
              var mbean = value;
              jolokia.request( {type: "read", mbean: mbean, attribute: ["displayName", "path", "stateName"]}, onSuccess(onAttributes));
            });
          Core.$apply($scope);
        };

        // function to control the web applications
        $scope.controlWebApps = function(op) {
            // grab id of mbean names to control
            var ids = $scope.selected.map(function(b) { return b.mbean });
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
                    onSuccess($scope.onResponse, {error: $scope.onResponse}));
            });
        };

        $scope.stop = function() {
            $scope.controlWebApps('stop');
        };

        $scope.start = function() {
            $scope.controlWebApps('start');
        };

        $scope.reload = function() {
            $scope.controlWebApps('reload');
        };

        $scope.uninstall = function() {
            $scope.controlWebApps('destroy');
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
          console.log("Loading tomcat webapp data...");
          jolokia.search("*:j2eeType=WebModule,*", onSuccess(render));
        }

        // grab server information once
        $scope.tomcatServerVersion = "";

        var servers = jolokia.search("*:type=Server")
        if (servers) {
            // Tomcat can have mbean server names with Catalina or Tomcat
            servers = servers.filter(name => {
                return name.startsWith("Catalina") || name.startsWith("Tomcat")
            })
            if (servers.length === 1) {
                $scope.tomcatServerVersion = jolokia.getAttribute(servers[0], "serverInfo")
            } else {
                console.log("Cannot find Tomcat server or there was more than one server. response is: " + servers)
            }
        }

    }
}
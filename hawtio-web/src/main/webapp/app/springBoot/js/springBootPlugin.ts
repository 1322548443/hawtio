/**
 * @module SpringBoot
 * @main SpringBoot
 */
module SpringBoot {

    var metricsFriendlyNames = {
        'counter.status.200.favicon.ico': 'Successful Favicon requests',
        'counter.status.200.jolokia': 'Successful Jolokia requests',
        'counter.status.200.jolokia.read.java.lang:type=Runtime.Name': 'Successful Jolokia Runtime.Name reads',
        'counter.status.200.jolokia.root': 'Successful Jolokia root requests',
        'counter.status.200.jolokia.search.*:type=Connector,*': 'Successful Jolokia connectors search queries',
        'counter.status.200.metrics': 'Successful metrics requests',
        'counter.status.405.auth.login.root': '"Method Not Allowed (405)" login responses',
        'gauge.response.auth.login.root': 'Authentication time (ms)',
        'gauge.response.jolokia': 'Jolokia response time (ms)',
        'gauge.response.jolokia.root': 'Jolokia root response time (ms)',
        'gauge.response.metrics': 'Metrics response time (ms)',
        'mem': 'Memory used (bytes)',
        'mem.free': 'Memory available (bytes)',
        'processors': 'Processors number',
        'uptime': 'Node uptime (ms)',
        'instance.uptime': 'Service uptime (ms)',
        'heap.committed (bytes)': 'Heap committed (bytes)',
        'heap.init (bytes)': 'Initial hep (bytes)',
        'heap.used (bytes)': 'Heap used (bytes)',
        'heap (bytes)': 'Total Heap (bytes)',
        'classes': 'Classes',
        'classes.loaded': 'Classes loaded',
        'classes.unloaded': 'Classes unloaded'
    };

    var pluginName = 'springBoot';
    export var _module = angular.module(pluginName, ['bootstrap', 'ngResource', 'ui.bootstrap.dialog', 'hawtioCore']);
    _module.config(["$routeProvider", ($routeProvider) => {
        $routeProvider.
            when('/springBoot', {templateUrl: 'app/springBoot/html/springBoot.html'});
    }]);

    // TODO not required?
    //_module.filter('tomcatIconClass', () => iconClass);

    _module.run(["$location", "$http", "workspace", "viewRegistry", "helpRegistry", ($location:ng.ILocationService, $http, workspace:Workspace, viewRegistry, helpRegistry) => {

        viewRegistry['springBoot'] = "app/springBoot/html/springBoot.html";

        callIfSpringBootAppAvailable($http, springBootAppUrl(), function () {
            workspace.topLevelTabs.push({
                id: "springBoot",
                content: "Spring Boot",
                title: "Manage your Spring Boot application",
                isValid: function (workspace) {
                    return true;
                },
                href: function () {
                    return "#/springBoot";
                },
                isActive: function (workspace) {
                    return workspace.isTopTabActive("springBoot");
                }
            });
        });

    }]);

    _module.controller("SpringBoot.MainController", ["$scope", "$http", "$location", "workspace", "jolokia", ($scope, $http, $location, workspace:Workspace, jolokia) => {
        $http({
            method: 'GET',
            url: springBootAppUrl().replace('/jolokia', '/metrics')
        }).success(function (data) {
            var userFriendlyData = [];
            var key;
            for (key in Object.keys(data)) {
                key = Object.keys(data)[key];
                var friendlyName = metricsFriendlyNames[key];
                if (!friendlyName) {
                    userFriendlyData[key] = data[key]
                } else {
                    userFriendlyData[friendlyName] = data[key]
                }
            }
            $scope.metricsValues = userFriendlyData;
            $scope.metrics = Object.keys(userFriendlyData);
        }).error(function () {
            $scope.loadingError = 'Cannot read metrics data.'
        });
    }]);

    hawtioPluginLoader.addModule(pluginName);
}

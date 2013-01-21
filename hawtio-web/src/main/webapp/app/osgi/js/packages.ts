module Osgi {

    export function PackagesController($scope, $filter:ng.IFilterService, workspace:Workspace, $templateCache:ng.ITemplateCacheService, $compile:ng.IAttributes) {
        var dateFilter = $filter('date');

        $scope.widget = new TableWidget($scope, workspace, [
            {
                "mDataProp": null,
                "sClass": "control center",
                "sDefaultContent": '<i class="icon-plus"></i>'
            },
            { "mDataProp": "Name" },
            { "mDataProp": "VersionLink" },
            { "mDataProp": "RemovalPending" }

        ], {
            rowDetailTemplateId: 'packageBundlesTemplate',
            disableAddColumns: true
        });

        $scope.$watch('workspace.selection', function () {
            if (workspace.moveIfViewInvalid()) return;
            updateTableContents();
        });

        function populateTable(response) {
            var packages = Osgi.defaultPackageValues(workspace, $scope, response.value);
            $scope.widget.populateTable(packages);
            $scope.$apply();
        }

        function updateTableContents() {
            var mbean = getSelectionPackageMBean(workspace);
            if (mbean) {
                var jolokia = workspace.jolokia;
                jolokia.request(
                    {type: 'exec', mbean: mbean, operation: 'listPackages'},
                    onSuccess(populateTable));
            }
        }
    }
}

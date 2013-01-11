module Fabric {
  export function profileLinks(workspace, versionId, values) {
    var answer = "";
    var collection = values;
    if (!angular.isArray(values)) {
      collection = [values];
    }
    angular.forEach(collection, function(value, key) {
      var prefix = "";
      if (answer.length > 0) {
        prefix = " ";
      }
      answer += prefix + "<a href='" + url("#/fabric/profile/" + versionId + "/" + value + workspace.hash()) + "'>" + value + "</a>";
    });
    return answer;
  }

  /**
   * Default the values that are missing in the returned JSON
   */
  export function defaultProfileValues(workspace, versionId, values) {
     angular.forEach(values, (row) => {
      row["parentLinks"] = profileLinks(workspace, versionId, row["parentIds"]);
     });
    return values;
  }


  export function ProfilesController($scope, workspace:Workspace) {
    $scope.results = [];
    $scope.versions = [];

    $scope.widget = new TableWidget($scope, workspace, [
      {
        "mDataProp": null,
        "sClass": "control center",
        "mData": null,
        "sDefaultContent": '<i class="icon-plus"></i>'
      },
      {
      "mDataProp": "id",
      "sDefaultContent": "",
      "mData": null
      },
      {
        "mDataProp": "containerCount",
        "mRender": function (data, type, row) {
          if (data) {
            return data;
          } else return "";
        }
      },
      {
      "mDataProp": "parentLinks",
      "sDefaultContent": "",
      "mData": null
      }
    ], {
      rowDetailTemplateId: 'bodyTemplate',
      disableAddColumns: true
    });


    function populateTable(response) {
      var values = response.value;
      $scope.widget.populateTable(defaultProfileValues(workspace, $scope.versionId, values));
      $scope.$apply();
    }

    function populateVersions(response) {
      $scope.versions = response.value;
      if (!$scope.versions.isEmpty()) {
        if ($scope.version) {
          // lets re-select the version object based on the last selection
          $scope.version = $scope.versions.find({ id: $scope.versionId });
        }
        else {
          // lets default the version
          $scope.version = $scope.versions.find({ defaultVersion: true}) || $scope.versions[0];
        }
      }
      $scope.$apply();
    }

    $scope.$watch('version', function () {
      if (workspace.moveIfViewInvalid()) return;

      var jolokia = workspace.jolokia;
      var versionId = null;
      if ($scope.version) {
        versionId = $scope.version.id;
      }
      if (!versionId) {
        versionId = "1.0";
      }

      if (versionId !== $scope.versionId) {
        $scope.versionId = versionId;

        jolokia.request(
                [
                  {type: 'exec', mbean: managerMBean, operation: 'versions'},
                  {type: 'exec', mbean: managerMBean,
                    operation: 'getProfiles(java.lang.String)',
                    arguments: [versionId]}
                ],
                onSuccess([populateVersions, populateTable]));
      }
    });
  }
}
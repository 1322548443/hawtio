/// <reference path="../../baseIncludes.ts"/>
/// <reference path="../../baseHelpers.ts"/>
module Kubernetes {

  export interface KubePod {
    id:string;
  }

  export function isKubernetes(workspace) {
    return workspace.treeContainsDomainAndProperties(Fabric.jmxDomain, {type: "Kubernetes"});
  }

  export function setJson($scope, id, collection) {
    $scope.id = id;
    if (!$scope.fetched) {
      return;
    }
    if (!id) {
      $scope.json = '';
      return;
    }
    var item = collection.find((item) => { return item.id === id; });
    if (!item) {
      $scope.id = undefined;
      $scope.json = '';
      $scope.item = undefined;
    } else {
      $scope.json = angular.toJson(item, true);
      $scope.item = item;
    }
  }


  /**
   * Returns the labels text string using the <code>key1=value1,key2=value2,....</code> format
   */
  export function labelsToString(labels) {
    var answer = "";
    angular.forEach(labels, (value, key) => {
      var separator = answer ? "," : "";
      answer += separator + key + "=" + value;
    });
    return answer;
  }

  export function initShared($scope) {
    $scope.$on("labelFilterUpdate", ($event, text) => {
      var filterText = $scope.tableConfig.filterOptions.filterText;
      if (Core.isBlank(filterText)) {
        $scope.tableConfig.filterOptions.filterText = text;
      } else {
        var expressions = filterText.split(/\s+/);
        if (expressions.any(text)) {
          // lets exclude this filter expression
          expressions = expressions.remove(text);
          $scope.tableConfig.filterOptions.filterText = expressions.join(" ");
        } else {
          $scope.tableConfig.filterOptions.filterText = filterText + " " + text;
        }
      }
    });
  }
}

module ActiveMQ {
  export function DestinationController($scope, $location, workspace:Workspace) {
    $scope.workspace = workspace;
    $scope.message = "";

    $scope.$watch('workspace.selection', function () {
      workspace.moveIfViewInvalid();
    });

    function operationSuccess() {
      $scope.destinationName = "";
      $scope.workspace.operationCounter += 1;
      $scope.$apply();
      notification("success", $scope.message);
    }

    function deleteSuccess() {
      // lets set the selection to the parent
      if (workspace.selection) {
        var parent = workspace.selection.parent;
        if (parent) {
          $scope.workspace.updateSelectionNode(parent);
        }
      }
      $scope.workspace.operationCounter += 1;
      $scope.$apply();
      notification("success", $scope.message);
    }

    function getBrokerMBean(jolokia) {
      var mbean = null;
      var selection = workspace.selection;
      var folderNames = selection.folderNames;
      //if (selection && jolokia && folderNames && folderNames.length > 1) {
      var parent = selection ? selection.parent : null;
      if (selection && parent && jolokia && folderNames && folderNames.length > 1) {
        mbean = parent.objectName;

        // we might be a destination, so lets try one more parent
        if (!mbean && parent) {
          mbean = parent.parent.objectName;
        }
        if (!mbean) {
          mbean = "" + folderNames[0] + ":BrokerName=" + folderNames[1] + ",Type=Broker";
        }
      }
      return mbean;
    }

    $scope.createDestination = (name, isQueue) => {
      var jolokia = workspace.jolokia;
      var mbean = getBrokerMBean(jolokia);
      if (mbean) {
        var operation;
        if (isQueue) {
          operation = "addQueue(java.lang.String)"
          $scope.message = "Created queue " + name;
        } else {
          operation = "addTopic(java.lang.String)";
          $scope.message = "Created topic " + name;
        }
        if (mbean) {
          jolokia.execute(mbean, operation, name, onSuccess(operationSuccess));
        } else {
          notification("error", "Could not find the Broker MBean!");
        }
      }
    };

    $scope.deleteDestination = () => {
      var jolokia = workspace.jolokia;
      var mbean = getBrokerMBean(jolokia);
      var selection = workspace.selection;
      var entries = selection.entries;
      if (mbean && selection && jolokia && entries) {
        var domain = selection.domain;
        //var name = entries["Destination"];
        var name = entries["Destination"] || entries["destinationName"] || selection.title;
        var isQueue = "Topic" !== (entries["Type"] || entries["destinationType"]);
        var operation;
        if (isQueue) {
          operation = "removeQueue(java.lang.String)"
          $scope.message = "Deleted queue " + name;
        } else {
          operation = "removeTopic(java.lang.String)";
          $scope.message = "Deleted topic " + name;
        }
        jolokia.execute(mbean, operation, name, onSuccess(deleteSuccess));
      }
    };

    $scope.name = () => {
      var selection = workspace.selection;
      if (selection) {
        return selection.title;
      }
      return null;
    }
  }
}
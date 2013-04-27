module Camel {
  export function TraceRouteController($scope, workspace:Workspace, jolokia) {
    $scope.tracing = false;
    $scope.messages = [];
    $scope.graphView = null;
    $scope.tableView = null;

    $scope.messageDialog = new Core.Dialog();

    // TODO should share from browse.ts
    $scope.gridOptions = {
      afterSelectionChange: onSelectionChanged,
      selectedItems: [],
      data: 'messages',
      displayFooter: false,
      showFilter: false,
      showColumnMenu: true,
      enableColumnResize: true,
      enableColumnReordering: true,
      filterOptions: {
        filterText: ''
      },
      selectWithCheckboxOnly: true,
      maintainColumnRatios: false,
      columnDefs: [
        {
          field: 'id',
          displayName: 'ID',
          // for ng-grid
          //width: '50%',
          // for hawtio-datatable
          // width: "22em",
          cellTemplate: '<div class="ngCellText"><a ng-click="openMessageDialog(row)">{{row.entity.id}}</a></div>'
        }
      ]
    };


    $scope.startTracing = () => {
      setTracing(true);
    };

    $scope.stopTracing = () => {
      setTracing(false);
    };

    $scope.$watch('workspace.selection', function () {
      if (workspace.moveIfViewInvalid()) return;
      $scope.messages = [];
      reloadTracingFlag();
    });


    function reloadTracingFlag() {
      $scope.tracing = false;
      // clear any previous polls
      closeHandle($scope, jolokia);

      var mbean = getSelectionCamelTraceMBean(workspace);
      if (mbean) {
        $scope.tracing = jolokia.getAttribute(mbean, "Enabled", onSuccess(null));

        if ($scope.tracing) {
          var traceMBean = mbean;
          if (traceMBean) {
            var query = {type: 'exec', mbean: traceMBean, operation: 'dumpAllTracedMessagesAsXml'};
            scopeStoreJolokiaHandle($scope, jolokia, jolokia.register(populateRouteMessages, query));
          }
          $scope.graphView = "app/camel/html/routes.html";
          $scope.tableView = "app/camel/html/browseRoute.html";
        } else {
          $scope.messages = [];
          $scope.graphView = null;
          $scope.tableView = null;
        }
        console.log("Tracing is now " + $scope.tracing);
      }
    }

    function populateRouteMessages(response) {
      var first = $scope.messages.length === 0;
      var xml = response.value;
      if (angular.isString(xml)) {
        // lets parse the XML DOM here...
        var doc = $.parseXML(xml);
        var allMessages = $(doc).find("fabricTracerEventMessage");
        if (!allMessages || !allMessages.length) {
          // lets try find another element name
          allMessages = $(doc).find("backlogTracerEventMessage");
        }

        allMessages.each((idx, message) => {
          var messageData = Camel.createMessageFromXml(message);
          var toNode = $(message).find("toNode").text();
          if (toNode) {
            messageData["toNode"] = toNode;
          }
          $scope.messages.push(messageData);
          Core.$apply($scope);
        });
      }
    }

    function onSelectionChanged() {
      console.log("===== selection changed!!! and its now " + $scope.gridOptions.selectedItems.length);
      angular.forEach($scope.gridOptions.selectedItems, (selected) => {
      if (selected) {
        var toNode = selected["toNode"];
        if (toNode) {
          // lets highlight the node in the diagram
          var nodes = d3.select("svg").selectAll("g .node");

          // lets clear the selected node first
          nodes.attr("class", "node");

          nodes.filter(function (item) {
            if (item) {
              var cid = item["cid"];
              var rid = item["rid"];
              if (cid) {
                // we should match cid if defined
                return toNode === cid;
              } else {
                return toNode === rid;
              }
            }
            return null;
          }).attr("class", "node selected");
        }
      }
      });
    }

    function tracingChanged(response) {
      reloadTracingFlag();
      $scope.$apply();
    }

    function setTracing(flag:Boolean) {
      var mbean = getSelectionCamelTraceMBean(workspace);
      if (mbean) {
        jolokia.setAttribute(mbean, "Enabled", flag, onSuccess(tracingChanged));
      }
    }
  }
}
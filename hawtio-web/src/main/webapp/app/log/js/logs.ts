module Log {
  export interface ILog {
    // TODO What is the point of seq?
    seq: string;
    message: string;
    timestamp: string;
    logger: string;
    level: string;
  }

  export function LogController($scope, $location, workspace:Workspace) {
    $scope.logs = [];
    $scope.filteredLogs = [];
    $scope.selectedItems = [];
    $scope.searchText = "";
    $scope.filter = {
      // The default logging level to show, empty string => show all
      logLevelQuery: "",
      // The default value of the exact match logging filter
      logLevelExactMatch: false
    };
    $scope.toTime = 0;
    $scope.queryJSON = { type: "EXEC", mbean: logQueryMBean, operation: "logResultsSince", arguments: [$scope.toTime], ignoreErrors: true};

    $scope.logClass = (log) => {
      return logLevelClass(log['level']);
    };

    $scope.logIcon = (log) => {
      var style = $scope.logClass(log);
      if (style === "error") {
        return "red icon-warning-sign";
      }
      if (style === "warning") {
        return "orange icon-exclamation-sign";
      }
      if (style === "info") {
        return "icon-info-sign";
      }
      return "icon-cog";
    };

    $scope.logSourceHref = Log.logSourceHref;

    $scope.hasLogSourceHref = (row) => {
      return Log.logSourceHref(row) ? true : false;
    };

    $scope.dateFormat = 'yyyy-MM-dd HH:mm:ss';

    $scope.exceptionLines = (log) => {
      var exception = log.exception;
      return exception;
    };

    $scope.getSupport = () => {
      if ($scope.selectedItems.length) {
        var log = $scope.selectedItems[0];
        var text = log["message"];
        var uri = "https://access.redhat.com/knowledge/solutions?logger=" + log["logger"] + "&text=" + text;
        window.location.href = uri;
      }
    };

    var columnDefs:any[] = [
      {
        field: 'timestamp',
        displayName: 'Timestamp',
        cellFilter: "logDateFilter",
        width: 146
      },
      {
        field: 'level',
        displayName: 'Level',
        cellTemplate: '<div class="ngCellText"><span class="text-{{logClass(row.entity)}}"><i class="{{logIcon(row.entity)}}"></i> {{row.entity.level}}</span></div>',
        cellFilter: null,
        width: 74,
        resizable: false
      },
      {
        field: 'logger',
        displayName: 'Logger',
        cellTemplate: '<div class="ngCellText" ng-switch="hasLogSourceHref(row)" title="{{row.entity.logger}}"><a ng-href="{{logSourceHref(row)}}" ng-switch-when="true">{{row.entity.logger}}</a><div ng-switch-default>{{row.entity.logger}}</div></div>',
        cellFilter: null,
        //width: "**"
        width: "20%"
      },
      {
        field: 'message',
        displayName: 'Message',
        //width: "****"
        width: "60%"
      }
    ];


    $scope.gridOptions = {
      selectedItems: $scope.selectedItems,
      data: 'filteredLogs',
      displayFooter: false,
      showFilter: false,
      filterOptions: {
        filterText: "searchText"
      },
      columnDefs: columnDefs,
      rowDetailTemplateId: "logDetailTemplate"
      //rowTemplate: '<div ng-style="{\'cursor\': row.cursor}" ng-repeat="col in visibleColumns()" class="{{logClass(row.entity)}} ngCell col{{$index}} {{col.cellClass}}" ng-cell></div>'
    };

    $scope.$watch('filter.logLevelExactMatch', function () {
      checkIfFilterChanged();
    });
    $scope.$watch('filter.logLevelQuery', function () {
      checkIfFilterChanged();
    });

    var updateValues = function (response) {
      var logs = response.events;
      var toTime = response.toTimestamp;
      if (toTime) {
        $scope.toTime = toTime;
        $scope.queryJSON.arguments = [toTime];
      }
      if (logs) {
        var counter = 0;
        logs.forEach((log:ILog) => {
          if (log) {
            // TODO Why do we compare 'item.seq === log.message' ?
            if (!$scope.logs.any((key, item:ILog) => item.message === log.message && item.seq === log.message && item.timestamp === log.timestamp)) {
              counter += 1;
              $scope.logs.push(log);
            }
          }
        });
        if (counter) {
          refilter();
          $scope.$apply();
        }
      } else {
        notification("error", "Failed to get a response! " + JSON.stringify(response, null, 4));
      }
    };

    var jolokia = workspace.jolokia;
    jolokia.execute(logQueryMBean, "allLogResults", onSuccess(updateValues));

    // listen for updates adding the since
    var asyncUpdateValues = function (response) {
      var value = response.value;
      if (value) {
        updateValues(value);
      } else {
        notification("error", "Failed to get a response! " + JSON.stringify(response, null, 4));
      }
    };

    var callback = onSuccess(asyncUpdateValues,
            {
              error: (response) => {
                asyncUpdateValues(response);
              }
            });

    scopeStoreJolokiaHandle($scope, jolokia, jolokia.register(callback, $scope.queryJSON));

    var logLevels = ["TRACE", "DEBUG", "INFO", "WARN", "ERROR"];
    var logLevelMap = {};
    angular.forEach(logLevels, (name, idx) => {
      logLevelMap[name] = idx;
      logLevelMap[name.toLowerCase()] = idx;
    });

    function checkIfFilterChanged() {
      if ($scope.logLevelExactMatch !== $scope.filter.logLevelExactMatch ||
              $scope.logLevelQuery !== $scope.filter.logLevelExactMatch) {
        refilter();
      }
    }

    function refilter() {
      //console.log("refilter logs");
      var logLevelExactMatch = $scope.filter.logLevelExactMatch;
      var logLevelQuery = $scope.filter.logLevelQuery;
      var logLevelQueryOrdinal = (logLevelExactMatch) ? 0 : logLevelMap[logLevelQuery];

      $scope.logLevelExactMatch = logLevelExactMatch;
      $scope.logLevelQuery = logLevelQuery;

      $scope.filteredLogs = $scope.logs.filter((log) => {
        if (logLevelQuery) {
          if (logLevelExactMatch) {
            return log.level === logLevelQuery;
          } else {
            var idx = logLevelMap[log.level];
            return idx >= logLevelQueryOrdinal || idx < 0;
          }
        }
        return true;
      });
      Core.$apply($scope);
    }
  }
}
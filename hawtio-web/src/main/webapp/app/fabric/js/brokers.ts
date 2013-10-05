module Fabric {

  export function FabricBrokersController($scope, localStorage, $routeParams, $location, jolokia, workspace, $compile, $templateCache) {

    Fabric.initScope($scope, $location, jolokia, workspace);

    $scope.maps = {
      group: {},
      profile: {},
      broker: {},
      container: {}
    };

    $scope.showBroker = (broker) => {
      var path = Fabric.profileLink(workspace, jolokia, localStorage, broker.version, broker.profile);
      path += "/org.fusesource.mq.fabric.server-" + broker.id + ".properties";
      $location.path(path);
    };


    $scope.groupMatchesFilter = (group) => {
      return !$scope.searchFilter || group.id.has($scope.searchFilter)
              || group.profiles.find((item) => $scope.profileMatchesFilter(item));
    };

    $scope.profileMatchesFilter = (profile) => {
      return !$scope.searchFilter || profile.id.has($scope.searchFilter) || profile.group.has($scope.searchFilter)
              || profile.brokers.find((item) => $scope.brokerMatchesFilter(item));
    };

    $scope.brokerMatchesFilter = (broker) => {
      return !$scope.searchFilter || broker.id.has($scope.searchFilter) || broker.group.has($scope.searchFilter)
              || broker.containers.find((item) => $scope.containerMatchesFilter(item));
    };

    $scope.containerMatchesFilter = (container) => {
      var filter = $scope.searchFilter;
      if (filter) {
        var text = container.id + " " + container.profile + " " + container.version + " " + container.brokerName + " " + container.group;
        return text.has(filter);
      }
      return true;
    };

    if (Fabric.hasMQManager) {
      Core.register(jolokia, $scope, {type: 'exec', mbean: Fabric.mqManagerMBean, operation: "loadBrokerStatus()"}, onSuccess(onBrokerData));
    }

    function onBrokerData(response) {

      if (response) {

        var responseJson = angular.toJson(response.value);
        if ($scope.responseJson === responseJson) {
          return;
        }

        $scope.responseJson = responseJson;

        var brokers = response.value;

        function findByIdOrCreate(collection, id, map, fn) {
          var value = collection.find({"id": id});
          if (!value) {
            value = fn();
            value["id"] = id;
            collection.push(value);

            var old = map[id];
            // copy any view related across
            value["expanded"] = old ? old["expanded"] : true;
            map[id] = value;
          }
          return value;
        }

        $scope.groups = [];
        var maps = $scope.maps;

        angular.forEach(brokers, (brokerStatus) => {
          var groupId = brokerStatus.group || "Unknown";
          var profileId = brokerStatus.profile || "Unknown";
          var brokerId = brokerStatus.brokerName || "Unknown";
          var containerId = brokerStatus.container;
          var versionId = brokerStatus.version || "1.0";

          var group = findByIdOrCreate($scope.groups, groupId, maps.group, () => {
            return {
              profiles: []
            };
          });
          var profile = findByIdOrCreate(group.profiles, profileId, maps.profile, () => {
            return {
              group: groupId,
              version: versionId,
              brokers: []
            };
          });
          var broker = findByIdOrCreate(profile.brokers, brokerId, maps.broker, () => {
            return {
              group: groupId,
              profile: profileId,
              version: versionId,
              containers: []
            };
          });
          if (containerId) {
            var container = findByIdOrCreate(broker.containers, containerId, maps.container, () => {
              return brokerStatus;
            });
          }
        });


        // add a new gridster rectangle if we don't already have one
        /*
        if (!$scope.widgets) {
          $scope.widgets = [];
        }

        $scope.groups.forEach((group) => {
          if (!$scope.widgets.any((g) => { return g.id === group.id })) {

            var outer = $('<li style="list-style-type: none; position: absolute"></li>');
            var child = $scope.$new();
            child.group = group;

            outer.html($compile($templateCache.get("widgetTemplate"))(child));

            $scope.widgets.push({
              id: group.id,
              scope: child,
              group: group,
              widget: $scope.gridster.add_widget(outer, 2, 2)
            });
          }
        });
        */

        Core.$apply($scope);
      }
    }
  }
}

module Fabric {

  export function FabricBrokersController($scope, localStorage, $routeParams, $location, jolokia, workspace) {

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
      return true;
      // return group.id.has($scope.searchFilter) || !group.profiles.find((profile) => $scope.profileMatchesFilter(profile));
    };

    $scope.profileMatchesFilter = (profile) => {
      return true;
      //return profile.id.has($scope.searchFilter) || !profile.containers.filter((id) => { return id.has($scope.searchFilter); }).isEmpty();
    };

    $scope.brokerMatchesFilter = (broker) => {
      return true;
      //return container.id.has($scope.searchFilter) || !container.profileIds.filter((id) => {return id.has($scope.searchFilter);}).isEmpty();
    };

    $scope.containerMatchesFilter = (container) => {
      return true;
      //return container.id.has($scope.searchFilter) || !container.profileIds.filter((id) => {return id.has($scope.searchFilter);}).isEmpty();
    };

    if (Fabric.hasMQManager) {
      Core.register(jolokia, $scope, {type: 'exec', mbean: Fabric.mqManagerMBean, operation: "loadBrokerStatus()"}, onSuccess(onBrokerData));
    }

    function onBrokerData(response) {
      if (response) {
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
              version: versionId,
              brokers: []
            };
          });
          var broker = findByIdOrCreate(profile.brokers, brokerId, maps.broker, () => {
            return {
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
        Core.$apply($scope);
      }
    }
  }
}

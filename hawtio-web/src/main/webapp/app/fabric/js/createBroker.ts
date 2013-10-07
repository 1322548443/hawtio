module Fabric {

  export function CreateBrokerController($scope, localStorage, $routeParams, $location, jolokia, workspace, $compile, $templateCache) {

    Fabric.initScope($scope, $location, jolokia, workspace);

    $scope.groups = [];
    $scope.profiles = [];
    $scope.entity = {};

    // holds all the form objects from nested child scopes
    $scope.forms = {};

    $scope.onSubmit = (json, form) => {
      $scope.message = ($scope.entity.brokerName || "unknown") + " in group " + ($scope.entity.group || "unknown");
      notification("info", "Creating broker " + $scope.message);
      var json = JSON.stringify($scope.entity, null, '  ');
      jolokia.execute(Fabric.mqManagerMBean, "saveBrokerConfigurationJSON", json, onSuccess(onSave));
    };

    // default parameters from the URL
    angular.forEach(["group", "profile"], (param) => {
      var value = $routeParams[param];
      if (value) {
        $scope.entity[param] = value;
      }
    });

    Fabric.getDtoSchema("brokerConfig", "org.fusesource.fabric.api.jmx.MQBrokerConfigDTO", jolokia, (schema) => {
      $scope.schema = schema;
      configureSchema(schema);
      jolokia.execute(Fabric.mqManagerMBean, "loadBrokerStatus()", onSuccess(onBrokerData));
      Core.$apply($scope);
    });

    function configureSchema(schema) {
/*
      Core.pathSet(schema.properties, ['name', 'label'], 'Container Name');
      Core.pathSet(schema.properties, ['name', 'tooltip'], 'Name of the container to create (or prefix of the container name if you create multiple containers)');
*/

      delete schema.properties['username'];
      delete schema.properties['password'];

      // avoid the properties field for now as we don't yet have a generated UI for key/value pairs...
      delete schema.properties['properties'];

      Core.pathSet(schema.properties, ['group', 'required'], true);
      Core.pathSet(schema.properties, ['group', 'tooltip'], 'The peer group name of message brokers. The group is name is used by messaging clients to connect to a broker; so it represents a peer group of brokers used for load balancing.');

      Core.pathSet(schema.properties, ['brokerName', 'required'], true);
      Core.pathSet(schema.properties, ['brokerName', 'tooltip'], 'The name of the broker.');

      schema['tabs'] = {
        'Default': ['group', 'brokerName', 'profile', 'parentProfile', 'data', 'configUrl', 'replicas', 'minimumInstances'],
        'Advanced': ['*']
      };
    }

    function onBrokerData(response) {
      if (response) {
        var brokerStatuses = response.value;
        var groupIds = {};
        var profileIds = {};
        angular.forEach(brokerStatuses, (status) => {
          var group = status.group;
          if (group) {
            groupIds[group] = group;
          }
          var profile = status.profile;
          if (profile) {
            profileIds[profile] = profile;
          }
        });
        $scope.groups = Object.values(groupIds).sortBy(null);
        $scope.profiles = Object.values(profileIds).sortBy(null);
        Core.$apply($scope);
      }
    }

    function onSave(response) {
      notification("success", "Created broker " + $scope.message);
      // now lets switch to the brokers view
      $location.path("/fabric/brokers");
      Core.$apply($scope);
    }
  }
}

/// <reference path="requirements.ts"/>
module FabricRequirements {

  export var SshConfigController = controller("SshConfigController", ["$scope", "jolokia", ($scope, jolokia) => {

    $scope.forms = {};

    Fabric.getDtoSchema(undefined, "io.fabric8.api.SshConfiguration", jolokia, (sshConfigurationSchema) => {
      Fabric.getDtoSchema(undefined, "io.fabric8.api.SshHostConfiguration", jolokia, (hostConfigurationSchema) => {
        Core.pathSet(sshConfigurationSchema, ['properties', 'hosts', 'inputTable'], hostConfigurationSchema);
        sshConfigurationSchema['tabs'] = {
          'Hosts': ['hosts'],
          'Defaults': ['defaultUsername', 'defaultPassword', 'defaultPort', 'defaultPrivateKeyFile', 'defaultPassPhrase', 'defaultPath', '*']
        };
        log.debug("Schema: ", sshConfigurationSchema);
        $scope.formConfig = sshConfigurationSchema;
        Core.$apply($scope);
      });
    });
  }]);
}

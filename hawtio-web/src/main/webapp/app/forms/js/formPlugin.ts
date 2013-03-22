module Forms {

  export var pluginName = 'hawtio-forms';

  angular.module(Forms.pluginName, ['bootstrap', 'ngResource', 'hawtioCore']).
      config(($routeProvider) => {
        $routeProvider.when('/forms/test', {templateUrl: 'app/forms/html/test.html'});
      }).
      directive('simpleForm', function(workspace) { return new Forms.SimpleForm(workspace) });

  hawtioPluginLoader.addModule(pluginName);
}

module Forms {

  export class SimpleFormConfig {

    public name = 'form';
    public method = 'post';

    // the name of the attribute in the scope which is the data to be editted
    public entity = 'entity';

    // set to 'view' or 'create' for different modes
    public mode = 'edit';

    // the definition of the form
    public data:any = {};
    public json:any = undefined;

    // the scope
    public scope:any = null;

    // the name to look up in the scope for the configuration data
    public scopeName: string = null;

    public properties = [];
    public action = '';

    public formclass = 'form-horizontal no-bottom-margin';
    public controlgroupclass = 'control-group';
    public controlclass = 'controls';
    public labelclass = 'control-label';

    public showtypes = 'false';

    public onsubmit = 'onSubmit';

    public getMode() {
      return this.mode || "edit";
    }

    public getEntity() {
      return this.entity || "entity";
    }

    public isReadOnly() {
      return this.getMode() === "view";
    }
  }

  export class SimpleForm {
    public restrict = 'A';
    public scope = true;
    public replace = true;
    public transclude = true;

    private attributeName = 'simpleForm';

    // see constructor for why this is here...
    public link: (scope, element, attrs) => any;

    constructor(private workspace, public $compile) {
      // necessary to ensure 'this' is this object <sigh>
      this.link = (scope, element, attrs) => {
        return this.doLink(scope, element, attrs);
      }
    }

    public isReadOnly() {
      return false;
    }

    private doLink(scope, element, attrs) {
      var config = new SimpleFormConfig;

      var fullSchemaName = attrs["schema"];
      var fullSchema = fullSchemaName ? scope[fullSchemaName] : null;

      var configScopeName = attrs[this.attributeName] || attrs["data"];
      config = configure(config, scope[configScopeName], attrs);
      config.scopeName = configScopeName;
      config.scope = scope;

      var entityName = config.getEntity();

      if (angular.isDefined(config.json)) {
        config.data = $.parseJSON(config.json);
      } else {
        config.data = scope[configScopeName] || scope[config.data];
      }

      var form = this.createForm(config);
      var fieldset = form.find('fieldset');

      var schema = config.data;

      function addProperty(id, property) {
        // TODO should also support getting inputs from the template cache, maybe
        // for type="template"
        var propTypeName = property.type;
        var propSchema = Forms.lookupDefinition(propTypeName, schema);
        if (!propSchema) {
          propSchema = Forms.lookupDefinition(propTypeName, fullSchema);
        }
        if (propSchema && Forms.isObjectType(propSchema)) {
          console.log("type name " + propTypeName + " has nested object type " + JSON.stringify(propSchema, null, "  "));

          angular.forEach(propSchema.properties, (childProp, childId) => {
            var newId = id + "." + childId;
            addProperty(newId, childProp);
          });
        } else {
          var input = $('<div></div>');
          input.attr(Forms.normalize(propTypeName, schema), '');
          angular.forEach(property, function (value, key) {
            if (angular.isString(value) && key.indexOf("$") < 0) {
              var html = Core.escapeHtml(value);
              input.attr(key, html);
            }
          });
          input.attr('name', id);
          input.attr('entity', config.getEntity());
          input.attr('mode', config.getMode());

          if (configScopeName) {
            input.attr('data', configScopeName);
          }

          fieldset.append(input);
        }
      }

      angular.forEach(schema.properties, (property, id) => {
        addProperty(id, property);
      });

      var findFunction = function(scope, func) {
        if (angular.isDefined(scope[func]) && angular.isFunction(scope[func])) {
          return scope;
        }
        if (angular.isDefined(scope.$parent) && scope.$parent !== null) {
          return findFunction(scope.$parent, func);
        } else {
          return null;
        }
      };

      function maybeGet(scope, func) {
        if (scope !== null) {
          return scope[func];
        }
        return null;
      }

      var onSubmitFunc = config.onsubmit.replace('(', '').replace(')', '');
      var onSubmit = maybeGet(findFunction(scope, onSubmitFunc), onSubmitFunc);

      if (onSubmit === null) {
        onSubmit = function (json, form) {
          notification('error', 'No submit handler defined for form ' + form.get(0).name);
        }
      }

      if (angular.isDefined(onSubmit)) {
        form.submit(() => {
          var entity = scope[entityName];
          onSubmit(entity, form);
          return false;
        });
      }

      fieldset.append('<input type="submit" style="position: absolute; left: -9999px; width: 1px; height: 1px;">');

      $(element).append(form);

      // compile the template
      this.$compile(form)(scope);
    }

    private createForm(config) {
      var form = $('<form class="' + config.formclass + '"><fieldset></fieldset></form>');
      form.attr('name', config.name);
      form.attr('action', config.action);
      form.attr('method', config.method);
      form.find('fieldset').append(this.getLegend(config));
      return form;
    }

    private getLegend(config) {
      var description = Core.pathGet(config, "data.description");
      if (description) {
        return '<legend>' + description + '</legend>';
      }
      return '';
    }
  }

}

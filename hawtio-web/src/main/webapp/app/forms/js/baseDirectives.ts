module Forms {


  export class InputBaseConfig {
    public name = 'input';
    public type = '';
    public description = '';
    public _default = '';
    public scope = null;

    // Can also be 'view'
    public mode = 'edit';

    // the name of the full schema
    public schemaName = "schema";

    public controlgroupclass = 'control-group';
    public controlclass = 'controls';
    public labelclass = 'control-label';
    public showtypes = 'false';

    /** the name of the attribute in the scope which is the data to be edited */
    public entity = 'entity';

    /** the model expression to bind to. If ommited this defaults to entity + "." + name **/
    public model = undefined;

    public getEntity() {
      return this.entity || "entity";
    }

    public getMode() {
      return this.mode || "edit";
    }

    public isReadOnly() {
      return this.getMode() === "view";
    }

  }


  export class InputBase {

    public restrict = 'A';
    public scope = true;
    public replace = false;
    public transclude = false;

    private attributeName = '';

    public link: (scope, element, attrs) => any;

    constructor(private workspace, public $compile) {
      // necessary to ensure 'this' is this object <sigh>
      this.link = (scope, element, attrs) => {
        return this.doLink(scope, element, attrs);
      }

    }

    private doLink(scope, element, attrs) {
      var config = new InputBaseConfig
      config = configure(config, null, attrs);
      config.scope = scope;
      config.schemaName = attrs["schema"] || "schema";

      var id = config.name;
      var group = Forms.getControlGroup(config, config, id);

      var modelName = config.model;
      if (!angular.isDefined(modelName)) {
        // TODO always use 2 way binding?
        modelName = config.getEntity() + "." + id;
      }
      group.append(Forms.getLabel(config, config, attrs["title"] || id));
      var controlDiv = Forms.getControlDiv(config);
      controlDiv.append(this.getInput(config, config, id, modelName));
      controlDiv.append(Forms.getHelpSpan(config, config, id));
      group.append(controlDiv);
      $(element).append(this.$compile(group)(scope));

      if (scope && modelName) {
        scope.$watch(modelName, onModelChange);
      }
      function onModelChange(newValue) {
        scope.$emit("hawtio.form.modelChange", modelName, newValue);
      }
    }

    public getInput(config, arg, id, modelName) {
      var rc = $('<span class="form-data"></span>');
      if (modelName) {
        rc.attr('ng-model', modelName);
        rc.append('{{' + modelName + '}}')
      }
      return rc;
    }
  }


  export class TextInput extends InputBase {

    public type = "text";

    constructor(private workspace, private $compile) {
      super(workspace, $compile);
    }

    public getInput(config, arg, id, modelName) {
      if (config.isReadOnly()) {
        return super.getInput(config, arg, id, modelName);
      }
      var rc = $('<input type="' + this.type + '">');
      rc.attr('name', id);
      if (modelName) {
        rc.attr('ng-model', modelName);
      }
      if (config.isReadOnly()) {
        rc.attr('readonly', 'true');
      }
      return rc;
    }

  }

  export class SelectInput extends InputBase {

    constructor(private workspace, private $compile) {
      super(workspace, $compile);
    }

    public getInput(config, arg, id, modelName) {
      if (config.isReadOnly()) {
        return super.getInput(config, arg, id, modelName);
      }
      // TODO calculate from input attributes...
      var required = true;

      // TODO we could configure the null option...
      var defaultOption = required ? "" : '<option value=""></option>';
      var rc = $('<select>' + defaultOption + '</select>');
      rc.attr('name', id);

      var scope = config.scope;
      var data = config.data;
      if (data && scope) {
        // this is a big ugly - would be nice to expose this a bit easier...
        // maybe nested objects should expose the model easily...
        var fullSchema = scope[config.schemaName];
        var model = scope[data];
        // now we need to keep walking the model to find the enum values
        var paths = id.split(".");
        var property = null;
        angular.forEach(paths, (path) => {
          property = Core.pathGet(model, ["properties", path]);
          var typeName = Core.pathGet(property, ["type"]);
          var alias = Forms.lookupDefinition(typeName, fullSchema);
          if (alias) {
            model = alias;
          }
        });
        var values = Core.pathGet(property, ["enum"]);
        scope["$selectValues"] = values;
        rc.attr("ng-options", "value for value in $selectValues");
      }
      if (modelName) {
        rc.attr('ng-model', modelName);
      }
      if (config.isReadOnly()) {
        rc.attr('readonly', 'true');
      }
      return rc;
    }

  }


  export class NumberInput extends InputBase {

    constructor(private workspace, private $compile) {
      super(workspace, $compile);
    }

    public getInput(config, arg, id, modelName) {
      if (config.isReadOnly()) {
        return super.getInput(config, arg, id, modelName);
      }
      var rc = $('<input type="number">');
      rc.attr('name', id);

      if (angular.isDefined(arg.def)) {
        rc.attr('value', arg.def);
      }

      if (angular.isDefined(arg.minimum)) {
        rc.attr('min', arg.minimum);
      }

      if (angular.isDefined(arg.maximum)) {
        rc.attr('max', arg.maximum);
      }

      if (modelName) {
        rc.attr('ng-model', modelName);
      }
      if (config.isReadOnly()) {
        rc.attr('readonly', 'true');
      }
      return rc;
    }
  }


  export class ArrayInput extends InputBase {

    constructor(private workspace, private $compile) {
      super(workspace, $compile);
    }

    public doLink(scope, element, attrs) {

      var config = new InputBaseConfig
      config = Forms.configure(config, null, attrs);

      var id = config.name;
      var dataName = attrs["data"] || "";
      var entityName = attrs["entity"] || config.entity;

      function renderRow(cell, type, data) {
        if (data) {
          var description = data["description"];
          if (!description) {
            angular.forEach(data, (value, key) => {
              if (value && !description) {
                description = value;
              }
            })
          }
          return description;
        }
        return null;
      }

      // Had to fudge some of this

      // create a table UI!
      var tableConfigPaths = ["properties", id, "inputTable"];
      //var scope = config.scope;
      var tableConfig = null; Core.pathGet(scope, tableConfigPaths);
      // lets auto-create a default configuration if there is none
      if (!tableConfig) {
        // TODO ideally we should merge this config with whatever folks have hand-defined
        var tableConfigScopeName = tableConfigPaths.join(".");
        //var cellDescription = a["description"] || humanizeValue(id);
        var cellDescription = humanizeValue(id);
        tableConfig = {
          formConfig: config,
          title: cellDescription,

          data: config.entity + "." + id,
          displayFooter: false,
          showFilter: false,
          columnDefs: [
            {
              field: '_id',
              displayName: cellDescription,
              render: renderRow
            }
          ]
        };
        Core.pathSet(scope, tableConfigPaths, tableConfig);
      }
      var table = $('<div hawtio-input-table="' + tableConfigScopeName + '" data="' + dataName
              + '" property="' + id + '" entity="' + entityName + '"></div>');
      if (config.isReadOnly()) {
        table.attr("readonly", "true");
      }
      $(element).append(this.$compile(table)(scope));

    }

  }



  export class BooleanInput extends InputBase {

    constructor(private workspace, private $compile) {
      super(workspace, $compile);
    }

    public getInput(config, arg, id, modelName) {

      var rc = $('<input class="hawtio-checkbox" type="checkbox">');
      rc.attr('name', id);

      if (config.isReadOnly()) {
        rc.attr('disabled', 'true');
      }
      if (modelName) {
        rc.attr('ng-model', modelName);
      }
      if (config.isReadOnly()) {
        rc.attr('readonly', 'true');
      }
      return rc;
    }
  }

}

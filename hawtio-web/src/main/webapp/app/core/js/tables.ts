class TableWidget {
  private ignoreColumnHash = {};
  private flattenColumnHash = {};
  private detailTemplate:string = null;
  private openMessages = [];

  public dataTableConfig = {
    bPaginate: false,
    sDom: 'Rlfrtip',
    bDestroy: true
  };


  constructor(public scope, public workspace:Workspace, public dataTableColumns:TableColumnConfig[], public config:TableWidgetConfig = {}) {
    // TODO is there an easier way of turning an array into a hash to true so it acts as a hash?
    angular.forEach(config.ignoreColumns, (name) => {
      this.ignoreColumnHash[name] = true;
    });
    angular.forEach(config.flattenColumns, (name) => {
      this.flattenColumnHash[name] = true;
    });

    var templateId = config.rowDetailTemplateId;
    if (templateId) {
      this.detailTemplate = workspace.$templateCache.get(templateId);
    }
  }

  /**
   * Adds new data to the table
   */
  public addData(newData) {
    var dataTable = this.scope.dataTable;
    dataTable.fnAddData(newData);
  }


  /**
   * Populates the table with the given data
   */
  public populateTable(data) {
    var $scope = this.scope;


    if (!data) {
      $scope.messages = [];
    } else {
      $scope.messages = data;

      var formatMessageDetails = (dataTable, parentRow) => {
        var oData = dataTable.fnGetData(parentRow);
        var div = $('<div class="innerDetails span12">');
        this.populateDetailDiv(oData, div);
        return div;
      };

      var array = data;
      if (angular.isArray(data)) {
      } else if (angular.isObject(data)) {
        array = [];
        angular.forEach(data, (object) => array.push(object));
      }

      var tableElement = $('#grid');
      var tableTr = $(tableElement).find("tr");
      var ths = $(tableTr).find("th");

      // lets add new columns based on the data...
      // TODO wont compile in TypeScript!
      //var columns = this.dataTableColumns.slice();
      var columns:TableColumnConfig[] = [];
      angular.forEach(this.dataTableColumns, (value) => columns.push(value));
      //var columns = this.dataTableColumns.slice();

      var addColumn = (key, title) => {
        columns.push({
          "sDefaultContent": "",
          "mData": null,
          mDataProp: key
        });

        // lets see if we need to add another <th>
        if (tableTr) {
          $("<th>" + title + "</th>").appendTo(tableTr);
        }
      };

      var checkForNewColumn = (value, key, prefix) => {
        // lets check if we have a column data for it (if its not ignored)
        //var keyName: string = key.toString();
        //var config: Object = {mDataProp: key};
        var found = this.ignoreColumnHash[key] || columns.any((k, v) => "mDataProp" === k && v === key);
        //var found = this.ignoreColumnHash[key] || columns.any(config);
        if (!found) {
          // lets check if its a flatten column
          if (this.flattenColumnHash[key]) {
            // TODO so this only works on the first row - sucks! :)
            if (angular.isObject(value)) {
              var childPrefix = prefix + key + ".";
              angular.forEach(value, (value, key) => checkForNewColumn(value, key, childPrefix));
            }
          } else {
            addColumn(prefix + key, humanizeValue(key))
          }
        }
      };

      if (!this.config.disableAddColumns && angular.isArray(array) && array.length > 0) {
        var first = array[0];
        if (angular.isObject(first)) {
          angular.forEach(first, (value, key) => checkForNewColumn(value, key, ""));
        }
      }

      this.dataTableConfig["aaData"] = array;
      this.dataTableConfig["aoColumns"] = columns;

      $scope.dataTable = tableElement.dataTable(this.dataTableConfig);

      var keys = new KeyTable({
        "table": tableElement[0],
        "datatable": $scope.dataTable
      });

      // lets try focus on the table
      keys.fnSetPosition(0, 0);
      $(tableElement).focus();

      var widget = this;

      // add a handler for the expand/collapse column for all rows (and future rows)
      var expandCollapseNode = function () {
        var dataTable = $('#grid').dataTable();
        var parentRow = this.parentNode;
        var openMessages = widget.openMessages;
        var i = $.inArray(parentRow, openMessages);

        var element = $('i', this);
        if (i === -1) {
          element.removeClass('icon-plus');
          element.addClass('icon-minus');
          var dataDiv = formatMessageDetails(dataTable, parentRow);
          var detailsRow = dataTable.fnOpen(parentRow, dataDiv, 'details');
          $('div.innerDetails', detailsRow).slideDown();
          openMessages.push(parentRow);
        } else {
          element.removeClass('icon-minus');
          element.addClass('icon-plus');
          dataTable.fnClose(parentRow);
          openMessages.splice(i, 1);
        }
        // lets let angular render any new detail templates
        $scope.$apply();
      };

      $(document).on("click", "#grid td.control", expandCollapseNode);

      keys.event.action( 0, null, function(node) {
        expandCollapseNode.call(node);
      });

      keys.event.focus( null, null, function(node) {
        var dataTable = $('#grid').dataTable();
        var row = node;
        if (node) {
          var nodeName = node.nodeName;
          if (nodeName) {
            if (nodeName.toLowerCase() === "td") {
              row = $(node).parents("tr")[0];
            }
            var selected = dataTable.fnGetData(row);
            var selectHandler = widget.config.selectHandler;
            if (selected && selectHandler) {
              selectHandler(selected);
            }
          }
        }
      });

      $(document).on("click", "#grid td", function () {
        if ($(this).hasClass('selected')) {
          $(this).removeClass('focus selected');
        } else {
          var dataTable = $('#grid').dataTable();
          if (!widget.config.multiSelect) {
            dataTable.$('td.selected').removeClass('focus selected');
          }
          $(this).addClass('focus selected');

          var row = $(this).parents("tr")[0];
          var selected = dataTable.fnGetData(row);
          var selectHandler = widget.config.selectHandler;
          if (selected && selectHandler) {
            selectHandler(selected);
          }
        }
      });
    }
    $scope.$apply();
  }

  populateDetailDiv(row, div) {
    // lets remove the silly "0" property that gets shoved in there due to the expand/collapse row
    delete row["0"];
    this.scope.row = row;
    this.scope.templateDiv = div;
    var template = this.detailTemplate;
    if (!template) {
      var templateId = this.config.rowDetailTemplateId;
      if (templateId) {
        this.detailTemplate = this.workspace.$templateCache.get(templateId);
        template = this.detailTemplate;
      }
    }
    if (template) {
      div.html(template);
      this.workspace.$compile(div.contents())(this.scope);
    }
  }
}

interface TableColumnConfig {
  mData?:string;
  mDataProp?:string;
  sClass?:string;
  sDefaultContent?:string;
  sWidth?:string;
  mRender?:(any) => any;
}

interface TableWidgetConfig {
  ignoreColumns?:string[];
  flattenColumns?:string[];
  disableAddColumns?:Boolean;
  rowDetailTemplateId?:string;
  selectHandler?: (any) => any;
  multiSelect?:Boolean;
}
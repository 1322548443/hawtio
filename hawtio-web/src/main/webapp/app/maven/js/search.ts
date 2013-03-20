module Maven {

  export function SearchController($scope, $location, workspace:Workspace, jolokia) {
    $scope.artifacts = [];
    $scope.selected = [];
    $scope.form = {
      searchText: ""
    };
    $scope.search = "";
    $scope.searchForm = 'app/maven/html/searchForm.html';

    $scope.javadocLink = (row) => {
      var group = row.groupId;
      var artifact = row.artifactId;
      var version = row.version;
      if (group && artifact && version) {
        return "javadoc/" + group + ":" + artifact + ":" + version + "/";
      }
      return "";
    };

    $scope.sourceLink = (row) => {
      var group = row.groupId;
      var artifact = row.artifactId;
      var version = row.version;
      if (group && artifact && version) {
        return "#/source/index/" + group + ":" + artifact + ":" + version + "/";
      }
      return "";
    };

    var columnDefs:any[] = [
      {
        field: 'groupId',
        displayName: 'Group'
      },
      {
        field: 'artifactId',
        displayName: 'Artifact',
        cellTemplate: '<div class="ngCellText" title="Name: {{row.entity.name}}">{{row.entity.artifactId}}</div>'
      },
      {
        field: 'version',
        displayName: 'Version'
      }
    ];

    $scope.gridOptions = {
      data: 'artifacts',
      displayFooter: true,
      selectedItems: $scope.selected,
      selectWithCheckboxOnly: true,
      columnDefs: columnDefs,
      rowDetailTemplateId: "artifactDetailTemplate",

      filterOptions: {
        filterText: 'search'
      }

    };

    $scope.hasAdvancedSearch = (form) => {
      return form.searchGroup || form.searchArtifact ||
              form.searchVersion || form.searchPackaging ||
              form.searchClassifier || form.searchClassName;
    };

    $scope.doSearch = () => {
      var mbean = Maven.getMavenIndexerMBean(workspace);
      var form = $scope.form;
      if (mbean) {
        var searchText = form.searchText;
        var kind = form.artifactType;
        if (kind) {
          if (kind === "className") {
            jolokia.execute(mbean, "searchClasses", searchText, onSuccess(render));
          } else {
            var paths = kind.split('/');
            var packaging = paths[0];
            var classifier = paths[1];
            console.log("Search for: " + form.searchText + " packaging " + packaging + " classifier " + classifier);
            jolokia.execute(mbean, "searchTextAndPackaging", searchText, packaging, classifier, onSuccess(render));
          }
        } else if (searchText) {
          console.log("Search text is: " + form.searchText);
          jolokia.execute(mbean, "searchText", form.searchText, onSuccess(render));
        } else if ($scope.hasAdvancedSearch(form)) {
          console.log("Searching for " +
                  form.searchGroup + "/" + form.searchArtifact + "/" +
                  form.searchVersion + "/" + form.searchPackaging + "/" +
                  form.searchClassifier + "/" + form.searchClassName);

          jolokia.execute(mbean, "search",
                  form.searchGroup || "", form.searchArtifact || "", form.searchVersion || "",
                  form.searchPackaging || "", form.searchClassifier || "", form.searchClassName || "",
                  onSuccess(render));
        }
      } else {
        notification("error", "Could not find the Maven Indexer MBean!");
      }
    };

    function render(response) {
      $scope.artifacts = response;
      Core.$apply($scope);
    }
  }
}

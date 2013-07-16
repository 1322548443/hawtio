module Wiki {

  export function ViewController($scope, $location, $routeParams, $http, $timeout, workspace:Workspace, marked, fileExtensionTypeRegistry, wikiRepository:GitWikiRepository, $compile) {
    Wiki.initScope($scope, $routeParams, $location);

    $scope.addDialog = new Core.Dialog();
    $scope.renameDialog = new Core.Dialog();
    $scope.moveDialog = new Core.Dialog();
    $scope.deleteDialog = false;
    $scope.isFile = false;
    $scope.createDocumentTree = Wiki.createWizardTree();
    $scope.createDocumentTreeActivations = ["camel-spring.xml", "ReadMe.md"];

    $scope.gridOptions = {
      data: 'children',
      displayFooter: false,
      selectedItems: [],
      showSelectionCheckbox: true,
      columnDefs: [
        {
          field: 'name',
          displayName: 'Name',
          cellTemplate: '<div class="ngCellText"><a href="{{childLink(row.entity)}}"><span class="file-icon" ng-bind-html-unsafe="fileIconHtml(row)"></span> {{row.getProperty(col.field)}}</a></div>',
          cellFilter: ""
        },
        {
          field: 'lastModified',
          displayName: 'Modified',
          cellFilter: "date:'EEE, MMM d, y : hh:mm:ss a'"
        },
        {
          field: 'length',
          displayName: 'Size',
          cellFilter: "number"
        }
      ]
    };

    $scope.childLink = (child) => {
      var start = startLink($scope.branch);
      var prefix = start + "/view";
      var postFix = "";
      var path = child.path;
      if (child.directory) {
        // if we are a folder with the same name as a form file, lets add a form param...
        var formPath = path + ".form";
        var children = $scope.children;
        if (children) {
          var formFile = children.find({path: formPath});
          if (formFile) {
            prefix = start + "/formTable";
            postFix = "?form=" + formPath;
          }
        }
      } else {
        var xmlNamespaces = child.xmlNamespaces;
        if (xmlNamespaces && xmlNamespaces.length) {
          if (xmlNamespaces.any((ns) => Wiki.camelNamespaces.any(ns))) {
            prefix = start + "/camel/canvas";
          } else if (xmlNamespaces.any((ns) => Wiki.dozerNamespaces.any(ns))) {
            prefix = start + "/dozer/mappings";
          } else {
            console.log("child " + path + " has namespaces " + xmlNamespaces);
          }
        }
        if (child.path.endsWith(".form")) {
          postFix = "?form=/";
        }
      }
      return Core.createHref($location, prefix + path + postFix, ["form"]);
    };

    $scope.fileIconHtml = (entity) => {
      return Wiki.fileIconHtml(entity);
    }


    $scope.format = Wiki.fileFormat($scope.pageId, fileExtensionTypeRegistry);
    var options = {
      readOnly: true,
      mode: {
        name: $scope.format
      }
    };
    $scope.codeMirrorOptions = CodeEditor.createEditorSettings(options);

    $scope.editLink = () => {
      var pageName = ($scope.directory) ? $scope.readMePath : $scope.pageId;
      return (pageName) ? Wiki.editLink($scope.branch, pageName, $location) : null;
    };

    $scope.historyLink = "#/wiki/history/" + $scope.pageId;

    $scope.$watch('workspace.tree', function () {
      if (!$scope.git && Git.getGitMBean(workspace)) {
        // lets do this asynchronously to avoid Error: $digest already in progress
        //console.log("Reloading the view as we now seem to have a git mbean!");
        setTimeout(updateView, 50);
      }
    });

    /*
     // TODO this doesn't work for some reason!
     $scope.$on('jmxTreeUpdated', function () {
     console.log("view: jmx tree updated!");
     });
     */

    $scope.$on("$routeChangeSuccess", function (event, current, previous) {
      // lets do this asynchronously to avoid Error: $digest already in progress
      setTimeout(updateView, 50);
    });

    $scope.onSubmit = (json, form) => {
      notification("success", "Submitted form :" + form.get(0).name + " data: " + JSON.stringify(json));
    };

    $scope.onCancel = (form) => {
      notification("success", "Clicked cancel!");
    };


    $scope.onCreateDocumentSelect = (node) => {
      $scope.selectedCreateDocumentTemplate = node ? node.entity : null;
    };

    $scope.openAddDialog = () => {
      $scope.newDocumentName = null;
      $scope.addDialog.open();
    };

    $scope.addAndCloseDialog = () => {
      var template = $scope.selectedCreateDocumentTemplate;
      if (!template) {
        console.log("No template selected");
        return;
      }
      var exemplar = template.exemplar;
      var name = $scope.newDocumentName || exemplar;

      if (name.indexOf('.') < 0) {
        // lets add the file extension from the exemplar
        var idx = exemplar.lastIndexOf(".");
        if (idx > 0) {
          name += exemplar.substring(idx);
        }
      }

      var commitMessage = "Created " + template.label;
      var exemplarUri = url("/app/wiki/exemplar/" + exemplar);

      // TODO detect if we are a folder or not!

      // lets deal with directories in the name
      var folder = $scope.pageId;
      if ($scope.isFile) {
        // if we are a file lets discard the last part of the path
        var idx = folder.lastIndexOf("/");
        if (idx <= 0) {
          folder = "";
        } else {
          folder = folder.substring(0, idx);
        }
      }
      var fileName = name;
      var idx = name.lastIndexOf("/");
      if (idx > 0) {
        folder += "/" + name.substring(0, idx);
        name = name.substring(idx + 1);
      }
      var path = folder + "/" + name;
      console.log("Creating file " + path);
      notification("success", "Creating new document " + name);

      $http.get(exemplarUri).success((contents) => {

        // TODO lets check this page does not exist - if it does lets keep adding a new post fix...
        wikiRepository.putPage($scope.branch, path, contents, commitMessage, (status) => {
          console.log("Created file " + name);
          Wiki.onComplete(status);

          // lets navigate to the edit link
          // load the directory and find the child item
          $scope.git = wikiRepository.getPage($scope.branch, folder, $scope.objectId, (details) => {
            // lets find the child entry so we can calculate its correct edit link
            var link = null;
            if (details && details.children) {
              console.log("scanned the directory " + details.children.length + " children");
              var child = details.children.find(c => c.name === fileName);
              if (child) {
                link = $scope.childLink(child);
              } else {
                console.log("Could not find name '" + fileName + "' in the list of file names " + JSON.stringify(details.children.map(c => c.name)));
              }
            }
            if (!link) {
              console.log("WARNING: could not find the childLink so reverting to the wiki edit page!");
              link = Wiki.editLink($scope.branch, path, $location);
            }
            var href = Core.trimLeading(link, "#");
            Core.$apply($scope);
            $timeout(() => {
              console.log("About to navigate to: " + href);
              $location.path(href);
            }, 400);
          });
        });
      });
      $scope.addDialog.close();
    };


    $scope.openDeleteDialog = () => {
      if ($scope.gridOptions.selectedItems.length) {
        $scope.selectedFileHtml = "<ul>" + $scope.gridOptions.selectedItems.map(file => "<li>" + file.name + "</li>").sort().join("") + "</ul>";
        $scope.deleteDialog = true;
      } else {
        console.log("No items selected right now! " + $scope.gridOptions.selectedItems);
      }
    };

    $scope.deleteAndCloseDialog = () => {
      var files = $scope.gridOptions.selectedItems;
      var fileCount = files.length;
      console.log("Deleting selection: " + files);
      angular.forEach(files, (file, idx) => {
        var path = $scope.pageId + "/" + file.name;
        console.log("About to delete " + path);
        $scope.git = wikiRepository.removePage($scope.branch, path, null, (result) => {
          if (idx + 1 === fileCount) {
            $scope.gridOptions.selectedItems.splice(0, fileCount);
            var message = Core.maybePlural(fileCount, "document");
            notification("success", "Deleted " + message);
            Core.$apply($scope);
            updateView();
          }
        });
      });
      $scope.deleteDialog = false;
    };

    $scope.openRenameDialog = () => {
      var name = null;
      if ($scope.gridOptions.selectedItems.length) {
        var selected = $scope.gridOptions.selectedItems[0];
        name = selected.name;
      }
      if (name) {
        $scope.fileName = name;
        $scope.renameDialog.open();
      } else {
        console.log("No items selected right now! " + $scope.gridOptions.selectedItems);
      }
    };

    $scope.renameAndCloseDialog = () => {
      if ($scope.gridOptions.selectedItems.length) {
        var selected = $scope.gridOptions.selectedItems[0];
        var newName = $scope.fileName;
        if (selected && newName) {
          var oldName = selected.name;
          var oldPath = $scope.pageId + "/" + oldName;
          var newPath = $scope.pageId + "/" + newName;
          console.log("About to rename file " + oldPath + " to " + newPath);
          $scope.git = wikiRepository.rename($scope.branch, oldPath, newPath, null, (result) => {
            notification("success", "Renamed file to  " + newName);
            $scope.renameDialog.close();
            Core.$apply($scope);
            updateView();
          });
        }
      }
      $scope.renameDialog.close();
    };

    $scope.openMoveDialog = () => {
      if ($scope.gridOptions.selectedItems.length) {
        $scope.moveFolder = $scope.pageId;
        $scope.moveDialog.open();
      } else {
        console.log("No items selected right now! " + $scope.gridOptions.selectedItems);
      }
    };

    $scope.moveAndCloseDialog = () => {
      var files = $scope.gridOptions.selectedItems;
      var fileCount = files.length;
      var moveFolder = $scope.moveFolder;
      if (moveFolder && fileCount) {
        console.log("Moveing " + fileCount + " file(s) to " + moveFolder);
        angular.forEach(files, (file, idx) => {
          var oldPath = $scope.pageId + "/" + file.name;
          var newPath = moveFolder + "/" + file.name;
          console.log("About to move " + oldPath + " to " + newPath);
          $scope.git = wikiRepository.rename($scope.branch, oldPath, newPath, null, (result) => {
            if (idx + 1 === fileCount) {
              $scope.gridOptions.selectedItems.splice(0, fileCount);
              var message = Core.maybePlural(fileCount, "document");
              notification("success", "Moved " + message + " to " + newPath);
              $scope.moveDialog.close();
              Core.$apply($scope);
              updateView();
            }
          });
        });
      }
      $scope.moveDialog.close();
    };


    updateView();

    function updateView() {
      var path = $location.path();
      if (path && path.startsWith("/wiki/diff")) {
        var baseObjectId = $routeParams["baseObjectId"];
        $scope.git = wikiRepository.diff($scope.objectId, baseObjectId, $scope.pageId, onFileDetails);
      } else {
        $scope.git = wikiRepository.getPage($scope.branch, $scope.pageId, $scope.objectId, onFileDetails);
      }
    }

    function viewContents(pageName, contents) {
      $scope.sourceView = null;
      if ("markdown" === $scope.format) {
        // lets convert it to HTML
        $scope.html = contents ? marked(contents) : "";
        $scope.html = $compile($scope.html)($scope);
      } else if ($scope.format && $scope.format.startsWith("html")) {
        $scope.html = contents;
        $compile($scope.html)($scope);
      } else {
        var form = null;
        if ($scope.format && $scope.format === "javascript") {
          form = $location.search()["form"];
        }
        $scope.source = contents;
        $scope.form = form;
        if (form) {
          // now lets try load the form JSON so we can then render the form
          $scope.sourceView = null;
          if (form === "/") {
            onFormSchema(_jsonSchema);
          } else {
            $scope.git = wikiRepository.getPage($scope.branch, form, $scope.objectId, (details) => {
              onFormSchema(Wiki.parseJson(details.text));
            });
          }
        } else {
          $scope.sourceView = "app/wiki/html/sourceView.html";
        }
      }
      Core.$apply($scope);
    }

    function onFormSchema(json) {
      $scope.formDefinition = json;
      if ($scope.source) {
        $scope.formEntity = Wiki.parseJson($scope.source);
      }
      $scope.sourceView = "app/wiki/html/formView.html";
      Core.$apply($scope);
    }

    function onFileDetails(details) {
      var contents = details.text;
      $scope.directory = details.directory;

      if (details && details.format) {
        $scope.format = details.format;
      } else {
        $scope.format = Wiki.fileFormat($scope.pageId, fileExtensionTypeRegistry);
      }
      $scope.codeMirrorOptions.mode.name = $scope.format;
      //console.log("format is '" + $scope.format + "'");

      $scope.children = details.children;
      if (!details.directory) {
        $scope.childen = null;
      }

      $scope.html = null;
      $scope.source = null;
      $scope.readMePath = null;

      $scope.isFile = false;
      if ($scope.children) {
        // if we have a readme then lets render it...
        var item = $scope.children.find((info) => {
          var name = (info.name || "").toLowerCase();
          var ext = fileExtension(name);
          return name && ext && (name.startsWith("readme.") || name === "readme");
        });
        if (item) {
          var pageName = item.path;
          $scope.readMePath = pageName;
          wikiRepository.getPage($scope.branch, pageName, $scope.objectId, (readmeDetails) => {
            viewContents(pageName, readmeDetails.text);
          });
        }
      } else {
        var pageName = $scope.pageId;
        viewContents(pageName, contents);
        $scope.isFile = true;
      }
      Core.$apply($scope);
    }
  }
}

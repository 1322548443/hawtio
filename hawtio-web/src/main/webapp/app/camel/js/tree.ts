module Camel {

  export function TreeController($scope, $location:ng.ILocationService, workspace:Workspace) {

    $scope.$on("$routeChangeSuccess", function (event, current, previous) {
      // lets do this asynchronously to avoid Error: $digest already in progress
      setTimeout(updateSelectionFromURL, 50);
    });

    $scope.$watch('workspace.tree', function () {
      reloadFunction();
    });

    $scope.$on('jmxTreeUpdated', function () {
      reloadFunction();
    });

    function reloadFunction() {
      console.log("reloading the camel tree!!!");

      var children = [];
      var domainName = Camel.jmxDomain;

      // lets pull out each context
      var tree = workspace.tree;
      if (tree) {
        var rootFolder = new Folder("Camel Contexts");
        rootFolder.addClass = "org-apache-camel-context-folder";
        rootFolder.children = children;
        rootFolder.typeName = "context";
        rootFolder.key = "camelContexts";
        rootFolder.domain = domainName;

        var folder = tree.get(domainName);
        if (folder) {
          angular.forEach(folder.children, (value, key) => {
            var entries = value.map;
            if (entries) {
              var contextsFolder = entries["context"];
              var routesNode = entries["routes"];
              var endpointsNode = entries["endpoints"];
              if (contextsFolder) {
                var contextNode = contextsFolder.children[0];
                if (contextNode) {
                  var folder = new Folder(contextNode.title);
                  folder.addClass = "org-apache-camel-context";
                  folder.domain = domainName;
                  folder.objectName = contextNode.objectName;
                  folder.entries = contextNode.entries;
                  folder.typeName = contextNode.typeName;
                  folder.key = contextNode.key;
                  if (routesNode) {
                    var routesFolder = new Folder("Routes");
                    routesFolder.addClass = "org-apache-camel-routes-folder";
                    routesFolder.parent = contextsFolder;
                    routesFolder.children = routesNode.children;
                    angular.forEach(routesFolder.children, (n) => n.addClass = "org-apache-camel-routes");
                    folder.children.push(routesFolder);
                    routesFolder.typeName = "routes";
                    routesFolder.key = routesNode.key;
                    routesFolder.domain = routesNode.domain;
                  }
                  if (endpointsNode) {
                    var endpointsFolder = new Folder("Endpoints");
                    endpointsFolder.addClass = "org-apache-camel-endpoints-folder";
                    endpointsFolder.parent = contextsFolder;
                    endpointsFolder.children = endpointsNode.children;
                    angular.forEach(endpointsFolder.children, (n) => {
                      n.addClass = "org-apache-camel-endpoints";
                      if (!getContextId(n)) {
                        n.entries["context"] = contextNode.entries["context"];
                      }
                    });
                    folder.children.push(endpointsFolder);
                    endpointsFolder.entries = contextNode.entries;
                    endpointsFolder.typeName = "endpoints";
                    endpointsFolder.key = endpointsNode.key;
                    endpointsFolder.domain = endpointsNode.domain;
                  }
                  var jmxNode = new Folder("MBeans");

                  // lets add all the entries which are not one context/routes/endpoints
                  angular.forEach(entries, (jmxChild, name) => {
                    if (name !== "context" && name !== "routes" && name !== "endpoints") {
                      jmxNode.children.push(jmxChild);
                    }
                  });

                  if (jmxNode.children.length > 0) {
                    jmxNode.sortChildren(false);
                    folder.children.push(jmxNode);
                  }
                  folder.parent = rootFolder;
                  children.push(folder);
                }
              }
            }
          });
        }

        var treeElement = $("#cameltree");
        Jmx.enableTree($scope, $location, workspace, treeElement, [rootFolder], true);
        /*

         // lets select the first node if we have no selection
         var key = $location.search()['nid'];
         var node = children[0];
         if (!key && node) {
         key = node['key'];
         if (key) {
         var q = $location.search();
         q['nid'] = key;
         $location.search(q);
         }
         }
         if (!key) {
         updateSelectionFromURL();
         }
         */
        // lets do this asynchronously to avoid Error: $digest already in progress
        setTimeout(updateSelectionFromURL, 50);
      }
    }

    function updateSelectionFromURL() {
      camelUpdateTreeSelectionFromURL($location, $("#cameltree"), true);
    }
  }

  export function camelUpdateTreeSelectionFromURL($location, treeElement, activateIfNoneSelected = false) {
    var dtree = treeElement.dynatree("getTree");
    if (dtree) {
      var node = null;
      var key = $location.search()['nid'];
      if (key) {
        try {
          node = dtree.activateKey(key);
        } catch (e) {
          // tree not visible we suspect!
        }
      }
      if (node) {
        node.expand(true);
      } else {
        if (!treeElement.dynatree("getActiveNode")) {
          // lets expand the first node
          var root = treeElement.dynatree("getRoot");
          var children = root ? root.getChildren() : null;
          if (children && children.length) {
            // if only 1 camel context then auto select it, and expand its routes (if it has any routes)
            if (children.length === 1) {
              var first = children[0];
              first.expand(true);
              var contexts = first.getChildren();
              if (contexts && contexts.length === 1) {
                first = contexts[0];
                first.expand(true);
                children = first.getChildren();
                if (children && children.length) {
                  var routes = children[0];
                  if (routes.data.typeName === 'routes') {
                    first = routes;
                    first.expand(true);
                  }
                }
              }
              if (activateIfNoneSelected) {
                first.activate();
              }
            } else {
              var first = children[0];
              first.expand(true);
              if (activateIfNoneSelected) {
                first.activate();
              }
            }
          }
        }
      }
    }
  }

}
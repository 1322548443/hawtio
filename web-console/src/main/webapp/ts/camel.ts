function CamelController($scope, workspace) {
  $scope.workspace = workspace;
  $scope.routes = [];

  $scope.$watch('workspace.selection', function () {
    // TODO could we refactor the get mbean thingy??
    var selection = workspace.selection;
    if (selection) {
      var mbean = selection.objectName;
      if (mbean) {
        var jolokia = workspace.jolokia;
        jolokia.request(
                {type: 'exec', mbean: mbean, operation: 'dumpRoutesAsXml()'},
                onSuccess(populateTable));
      }
    }
  });

  var populateTable = function (response) {
    var data = response.value;
    $scope.routes = data;
    var nodes = [];
    var links = [];
    if (data) {
      var doc = $.parseXML(data);
      var allRoutes = $(doc).find("route");

      var canvasDiv = $('#canvas');
      var width = canvasDiv.width();
      var height = canvasDiv.height();
      if (height < 300) {
        console.log("browse thinks the height is only " + height + " so calculating offset from doc height");
        height = $(document).height() - canvasDiv.offset()['top'] - 5;
      }
      console.log("Using width " + width + " and height " + height);

      var delta = 150;

      function addChildren(parent, parentId, parentX, parentY) {
        var x = parentX;
        var y = parentY + delta;
        $(parent).children().each((idx, route) => {
          var id = nodes.length;
          // from acts as a parent even though its a previous sibling :)
          if (route.nodeName === "from" && !parentId) {
            parentId = id;
          }
          var name = route.nodeName;
          var uri = route.getAttribute("uri");
          if (uri) {
            name += " " + uri;
          }
          var imageName = route.nodeName;

          var endpointNames = ["from", "to", "route"];
          var genericNames = ["xpath", "when", "otherwise"];

          //if (imageName === "from" || imageName === "to" || imageName === "route") {
          if (endpointNames.indexOf(imageName) >= 0) {
            imageName = "endpoint";
          } else if (genericNames.indexOf(imageName) >= 0) {
            // TODO have better mapping here generated from existing image names!
            imageName = "generic";
          }
          var imageUrl = "/img/camel/" + imageName + "24.png";
          //console.log("Image URL is " + imageUrl);
          nodes.push({ "name": name, "label": name, "group": 1, "id": id, "x": x, "y:": y, "imageUrl": imageUrl });
          if (parentId !== null && parentId !== id) {
            console.log(parent.nodeName + "(" + parentId + " @" + parentX + "," + parentY + ")" + " -> " + route.nodeName + "(" + id + " @" + x + "," + y + ")");
            links.push({"source": parentId, "target": id, "value": 1});
          }
          addChildren(route, id, x, y);
          x += delta;
        });
      }

      var routeDelta = width / allRoutes.length;
      var rowX = 0;
      allRoutes.each((idx, route) => {
        addChildren(route, null, rowX, 0);
        rowX += routeDelta;
      });

      /*
       //var layouter = new Graph.Layout.Spring(g);
       var layouter = new Graph.Layout.Spring(g);
       var renderer = new Graph.Renderer.Raphael('canvas', g, width, height);
       layouter.layout();
       renderer.draw();
       */
      //d3ForceGraph(nodes, links, width, height);
      dagreLayoutGraph(nodes, links, width, height);
    }
    $scope.$apply();
  };
}

/**
 * Returns the selected camel context mbean for the given selection or null if it cannot be found
 */
function getSelectionCamelContextMBean(workspace) {
  if (workspace) {
    var selection = workspace.selection;
    var tree = workspace.tree;
    var folderNames = selection.folderNames;
    var entries = selection.entries;
    var domain;
    var contextId;
    if (tree && selection) {
      if (folderNames && folderNames.length > 1) {
        domain = folderNames[0];
        contextId = folderNames[1];
      } else if (entries) {
        domain = selection.domain;
        contextId = entries["context"];
      }
    }
    if (domain && contextId) {
      var result = tree.navigate(domain, contextId, "context");
      if (result && result.children) {
        var contextBean = result.children.first();
        if (contextBean.title) {
          var contextName = contextBean.title;
          return "" + domain + ":context=" + contextId + ',type=context,name="' + contextName + '"';
        }
      }
    }
  }
  return null;
}

function EndpointController($scope, workspace) {
  $scope.workspace = workspace;

  function operationSuccess() {
    $scope.endpointName = "";
    $scope.workspace.operationCounter +=1;
    $scope.$apply();
  }

  $scope.createEndpoint = (name) => {
    var jolokia = workspace.jolokia;
    if (jolokia) {
      var mbean = getSelectionCamelContextMBean(workspace);
      if (mbean) {
        console.log("Creating endpoint: " + name + " on mbean " + mbean);
        var operation = "createEndpoint(java.lang.String)";
        jolokia.execute(mbean, operation, name, onSuccess(operationSuccess));
      } else {
        console.log("Can't find the CamelContext MBean!");
      }
    }
  };

  $scope.deleteEndpoint = () => {
    var jolokia = workspace.jolokia;
    var selection = workspace.selection;
    var entries = selection.entries;
    if (selection && jolokia && entries) {
      var domain = selection.domain;
      var brokerName = entries["BrokerName"];
      var name = entries["Destination"];
      var isQueue = "Topic" !== entries["Type"];
      if (domain && brokerName) {
        var mbean = "" + domain + ":BrokerName=" + brokerName + ",Type=Broker";
        console.log("Deleting queue " + isQueue + " of name: " + name + " on mbean");
        var operation = "removeEndpoint(java.lang.String)";
        jolokia.execute(mbean, operation, name, onSuccess(operationSuccess));
      }
    }
  };
}

function SendMessageController($scope, workspace) {
  $scope.workspace = workspace;

  var sendWorked = () => {
    console.log("Sent message!");
  };

  $scope.sendMessage = (body) => {
    var selection = workspace.selection;
    if (selection) {
      var mbean = selection.objectName;
      if (mbean) {
        var jolokia = workspace.jolokia;
        // if camel then use a different operation on the camel context mbean
        if (selection.domain === "org.apache.camel") {
          var uri = selection.title;
          mbean = getSelectionCamelContextMBean(workspace);
          if (mbean) {
            jolokia.execute(mbean, "sendStringBody(java.lang.String,java.lang.String)", uri, body, onSuccess(sendWorked));
          } else {
            console.log("Could not find CamelContext MBean!");
          }
        } else {
          jolokia.execute(mbean, "sendTextMessage(java.lang.String)", body, onSuccess(sendWorked));
        }
      }
    }
  };
}
module UI {

  export class JSPlumb {
    public restrict = 'A';

    public link = ($scope, $element, $attrs) => {

      $element.bind('DOMNodeInserted', (event) => {
        // TODO - handle added nodes here, like from ng-repeat for example
      });

      setTimeout(() => {
        $scope.jsPlumb = jsPlumb.getInstance({
          Container: $element
        });


        var endpointStyle:any[] = ["Dot", {radius: 4}];
        var labelStyles:any[] = [ "Label" ];
        var arrowStyles:any[] = [ "Arrow", {
          location: 1,
          id: "arrow",
          length: 8,
          width: 8,
          foldback: 0.8
        } ];

        var connectorStyle:any[] = [ "Flowchart", { cornerRadius: 4, gap: 5 } ];

        $scope.jsPlumb.importDefaults({
          Anchor: "AutoDefault",
          DragOptions : { cursor: "pointer", zIndex:2000 },
          Endpoint: endpointStyle,
          PaintStyle: { strokeStyle: "#42a62c", lineWidth: 4 },
          HoverPaintStyle: { strokeStyle: "#42a62c", lineWidth: 4 },
          ConnectionOverlays: [
            arrowStyles,
            labelStyles
          ]
        });

        var nodes = [];
        var transitions = [];
        var nodesById = {};

        var nodeEls = $element.find('.jsplumb-node');

        angular.forEach(nodeEls, (nodeEl) => {

          var el = $(nodeEl);
          var id = el.attr('id')

          var node = {
            id: id,
            label: 'node ' + id,
            el: el,
            width: el.outerWidth(),
            height: el.outerHeight(),
            edges: []
          };
          nodes.push(node);
          nodesById[id] = node;
        });

        angular.forEach(nodes, (sourceNode) => {

          var targets:any = sourceNode.el.attr('connect-to');
          if (targets) {
            targets = targets.split(',');
            angular.forEach(targets, (target) => {
              var targetNode = nodesById[target.trim()];
              if (targetNode) {
                var edge = {
                  source: sourceNode,
                  target: targetNode
                };
                transitions.push(edge);
                sourceNode.edges.push(edge);
                targetNode.edges.push(edge);
              }
            });
          }

        });

        $scope.jsPlumbNodes = nodes;
        $scope.jsPlumbTransitions = transitions;
        $scope.jsPlumbEndpoints = {};
        $scope.jsPlumbConnections = [];

        // First we'll lay out the graph and then later apply jsplumb to all
        // of the nodes and connections
        $scope.layout = dagre.layout()
            .nodeSep(50)
            .edgeSep(10)
            .rankSep(50)
            .nodes(nodes)
            .edges(transitions)
            .debugLevel(1)
            .run();

        angular.forEach($scope.jsPlumbNodes, (node) => {
          node.el.css({top: node.dagre.y, left: node.dagre.x});
          var endpoint = $scope.jsPlumb.addEndpoint(node.el);
          $scope.jsPlumbEndpoints[node.id] = endpoint
          $scope.jsPlumb.draggable(node.el, {
            containment: $element
          });
        });

        angular.forEach($scope.jsPlumbTransitions, (edge) => {
          var connection = $scope.jsPlumb.connect({
            source: edge.source.el,
            target: edge.target.el
          }, {
            anchor: "Continuous",
            connector: connectorStyle,
            connectorStyle: { strokeStyle: "#666", lineWidth: 2 },
            maxConnections: -1
          });
          $scope.jsPlumbConnections.push(connection);
        });

        Core.$apply($scope);
      }, 50);


    };
  }

  export class JSPlumbConnection {
    public restrict = 'A';

    public link = ($scope, $element, $attrs) => {
      if (!angular.isDefined($scope.jsPlumb)) {
        return;
      }

      console.log("here!");

      var targets = $attrs['connectTo'].split(',');

      angular.forEach(targets, (target) => {

        var targetEl = $element.parent().find(target);

        $scope.jsPlumb.connect({
          source: $element,
          target: targetEl
        });
      });

    };
  }
}

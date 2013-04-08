module Wiki {
  export function NavBarController($scope, $location, $routeParams, workspace:Workspace, wikiRepository:GitWikiRepository) {

    var customViewLinks = ["/wiki/formTable", "/wiki/camel/diagram", "/wiki/camel/properties"];

    $scope.createLink = () => {
      var pageId = Wiki.pageId($routeParams, $location);
      return Wiki.createLink(pageId, $location, $scope);
    };

    $scope.sourceLink = () => {
      var path = $location.path();
      var answer = null;
      angular.forEach(customViewLinks, (link) => {
        if (path.startsWith(link)) {
          answer = Core.createHref($location, "#/wiki/view" + path.substring(link.length))
        }
      });
      // remove the form parameter on view/edit links
      return (!answer && $location.search()["form"])
              ? Core.createHref($location, "#" + path, ["form"])
              : answer;
    };

    $scope.isActive = (href) => {
      var tidy = Core.trimLeading(href, "#");
      var loc = $location.path();
      if (loc === tidy) return true;
      if (loc.startsWith("/wiki/view") || loc.startsWith("/wiki/edit")) {
        var p1 = Wiki.pageIdFromURI(tidy);
        var p2 = Wiki.pageIdFromURI(loc);
        return p1 === p2;
      }
      return false;
    };

    loadBreadcrumbs();


    function switchFromViewToCustomLink(breadcrumb, link) {
      var href = breadcrumb.href;
      if (href) {
        breadcrumb.href = href.replace("wiki/view", link);
      }
    }

    function loadBreadcrumbs() {
      var href = "#/wiki/view/";
      $scope.breadcrumbs = [
        {href: href, name: "/"}
      ];
      var path = Wiki.pageId($routeParams, $location);
      var array = path ? path.split("/") : [];
      angular.forEach(array, (name) => {
        if (!name.startsWith("/") && !href.endsWith("/")) {
          href += "/";
        }
        href += name;
        $scope.breadcrumbs.push({href: href, name: name});
      });
      // lets swizzle the last one or two to be formTable views if the last or 2nd to last

      var loc = $location.path();
      if ($scope.breadcrumbs.length) {
        var swizzled = false;
        angular.forEach(customViewLinks, (link) => {
          if (!swizzled && loc.startsWith(link)) {
            // lets swizzle the view to the current link
            switchFromViewToCustomLink($scope.breadcrumbs.last(), Core.trimLeading(link, "/"));
            swizzled = true;
          }
        });
        if (!swizzled && $location.search()["form"]) {
          var lastName = $scope.breadcrumbs.last().name;
          if (lastName && lastName.endsWith(".json")) {
            // previous breadcrumb should be a formTable
            switchFromViewToCustomLink($scope.breadcrumbs[$scope.breadcrumbs.length - 2], "wiki/formTable");
          }
        }
      }
      if (loc.startsWith("/wiki/history") || loc.startsWith("/wiki/version") || loc.startsWith("/wiki/diff")) {
        // lets add a history tab
        $scope.breadcrumbs.push({href: "#/wiki/history/" + path, name: "History"});
      }
      if (loc.startsWith("/wiki/version")) {
        // lets add a version tab
        var name = ($routeParams["objectId"] || "").substring(0, 6) || "Version";
        $scope.breadcrumbs.push({href: "#" + loc, name: name});
      }
      if (loc.startsWith("/wiki/diff")) {
        // lets add a version tab
        var v1 = ($routeParams["objectId"] || "").substring(0, 6);
        var v2 = ($routeParams["baseObjectId"] || "").substring(0, 6);
        var name = "Diff";
        if (v1) {
          if (v2) {
            name += " " + v1 + " " + v2;
          } else {
            name += " " + v1;
          }
        }
        $scope.breadcrumbs.push({href: "#" + loc, name: name});
      }
      Core.$apply($scope);
    }
  }
}
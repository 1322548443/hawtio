/**
 * @module Diagnostics
 */
/// <reference path="../../baseIncludes.ts"/>
/// <reference path="../../core/js/coreHelpers.ts"/>
module Diagnostics {

  export var log:Logging.Logger = Logger.get("Diagnostics");

  export var connectControllerKey = "jvmConnectSettings";
  export var connectionSettingsKey = Core.connectionSettingsKey;

  export var logoPath = 'img/icons/jvm/';


  /**
   * Adds common properties and functions to the scope
   * @method configureScope
   * @for Diagnostics
   * @param {*} $scope
   * @param {ng.ILocationService} $location
   * @param {Core.Workspace} workspace
   */
  export function configureScope($scope, $location, workspace) {

    $scope.isActive = (href) => {
      var tidy = Core.trimLeading(href, "#");
      var loc = $location.path();
      return loc === tidy;
    };

    $scope.isValid = (link) => {
      return link && link.isValid(workspace);
    };

    $scope.breadcrumbs = [
      {
        content: '<i class="icon-plane"></i> Flight Recorder',
        title: "Make flight recordings",
        isValid: (workspace:Workspace) => true,
        href: "#/diagnostics/jfr"
      },
      {
        content: '<i class="icon-hdd"></i> Heap Use',
        title: "See heap use",
        isValid: (workspace:Workspace) => true,
        href: "#/diagnostics/heap"
      },
      {
        content: '<i class="icon-gear"></i> JVM Flags',
        title: "JVM Flags",
        isValid: (workspace:Workspace) => hasHotspotDiagnostic(workspace),
        href: "#/diagnostics/flags"
      }
    ];
  }



  export function hasHotspotDiagnostic(workspace) {
    return workspace.treeContainsDomainAndProperties('com.sun.management', {type: 'HotSpotDiagnostic'});
  }
  
  export function findMyPid() {
     //snatch PID from window title
     var regex=/pid:(\d+)/g;
     var pid = regex.exec(window.document.title);
     if(pid) {
         return pid[1];
     } else {
         return null;
     }
  }

}

/**
 * @module Perspective
 */
module Perspective {

  export var log:Logging.Logger = Logger.get("Perspective");

  /**
   * The location search parameter for specifying the perspective to view
   * @property perspectiveSearchId
   * @for Perspective
   * @type String
   */
  export var perspectiveSearchId = "p";

  /**
   * Lets you specify which perspective to default to if there's not a single active one
   * @property defaultPerspective
   * @for Perspective
   * @type String
   */
  export var defaultPerspective: string = null;

  /**
   * A hook so folks can specify the default start page explicitly if the first valid page in the
   * perspective is not the intended start page
   * @property defaultPageLocation
   * @for Perspective
   * @type String
   */
  export var defaultPageLocation: string = null;


  /**
   * Returns the current perspective ID based on the query parameter or the current
   * discovered perspective
   * @method currentPerspectiveId
   * @for Perspective
   * @param {ng.ILocationService} $location
   * @param {Core.Workspace} workspace
   * @paran {*} jolokia
   * @param {any} localStorage
   * @return {String}
   */
  export function currentPerspectiveId($location, workspace, jolokia, localStorage) {
    var perspective = $location.search()[perspectiveSearchId];
    if (!perspective) {
      perspective = Perspective.choosePerspective($location, workspace, jolokia, localStorage);
    }
    return perspective;
  }

  /**
   * Returns an array of all the active perspectives
   * @method getPerspectives
   * @for Perspective
   * @param {ng.ILocationService} $location
   * @param {Core.Workspace} workspace
   * @paran {*} jolokia
   * @param {any} localStorage
   */
  export function getPerspectives($location, workspace, jolokia, localStorage) {
    var perspectives = [];
    angular.forEach(Perspective.metadata, (perspective, key) => {
      if (isValidFunction(workspace, perspective.isValid)) {
        if (!perspective.label) {
          perspective.label = key;
        }
        if (!perspective.title) {
          perspective.title = perspective.label;
        }
        perspective.id = key;
        perspectives.push(perspective);
      }
    });
    return perspectives;
  }

  export function getPerspectiveById(id) {
    var answer;
    angular.forEach(Perspective.metadata, (perspective, key) => {
      if (key === id) {
        answer = perspective;
      }
    });
    return answer;
  }

  /**
   * Returns the top level tabs for the given perspectiveId
   * @method topLevelTabsForPerspectiveId
   * @for Perspective
   * @param {Core.Workspace} workspace
   * @param {String} perspective
   * @return {Array}
   */
  export function topLevelTabsForPerspectiveId(workspace, perspective) {
    var data = perspective ? Perspective.metadata[perspective] : null;
    var metaData = data;
    var answer = [];
    if (!data) {
      answer = workspace.topLevelTabs;
    } else {
      // lets iterate through the available tabs in the perspective
      var topLevelTabs = data.topLevelTabs;

      var includes = filterTabs(topLevelTabs.includes, workspace);
      var excludes = filterTabs(topLevelTabs.excludes, workspace);

      // now do extra filtering of excludes, if they have some conditions in the meta data
      if (metaData) {
        excludes = excludes.filter(t => {
          var metaTab = metaData.topLevelTabs.excludes.find(et => {
            var etid = et.id;
            return etid && etid === t.id;
          })
          if (metaTab != null && angular.isFunction(metaTab.onCondition)) {
            // not all tabs has on condition function, so use try .. catch
            var answer = metaTab.onCondition(workspace);
            if (answer) {
              log.info("Plugin " + t.id + " excluded in perspective " + perspective);
              return true;
            } else {
              // the condition was false, so it does not apply
              return false;
            }
          }
          return true;
        })
      }

      // if the meta-data only had excludes, then it means all the top level tabs, excluding these
      if (!topLevelTabs.includes) {
        // lets exclude the excluded tabs
        answer = workspace.topLevelTabs;
      } else {
        // if the meta-data had includes, then its only these
        answer = includes;
      }
      // and remove any excludes
      answer = answer.subtract(excludes);
    }
    return answer;
  }

  function filterTabs(tabs, workspace) {
    var matched = [];
    angular.forEach(tabs, (tabSpec) => {
      var href = tabSpec.href;
      var id = tabSpec.id;
      var rhref = tabSpec.rhref;
      if (href) {
        var hrefValue = href;
        if (angular.isFunction(href)) {
          hrefValue = href();
        }
        var tab = workspace.topLevelTabs.find((t) => {
          var thref = t.href();
          return thref && thref.startsWith(hrefValue);
        });
        if (!tab && !id && tabSpec.content) {
          // lets assume the tab is the tabSpec
          tab = tabSpec;
        }
        if (tab) {
          matched.push(tab);
        }
      } else if (id) {
        var tab = workspace.topLevelTabs.find((t) => {
          var tid = t.id;
          return tid && tid === id;
        });
        if (tab) {
          matched.push(tab);
        }
      } else if (rhref) {
        var tab = workspace.topLevelTabs.find((t) => {
          var thref = t.href();
          return thref && thref.match(rhref);
        });
        if (tab) {
          matched.push(tab);
        }
      }
    });
    return matched;
  }

  /**
   * Filter the top level tabs to only include currently active/valid tabs.
   */
  export function filterOnlyActiveTopLevelTabs(workspace, topLevelTabs) {
    var answer = topLevelTabs.filter(tab => {
      var href = tab.href();
      return href && isValidFunction(workspace, tab.isValid);
    });
    return answer;
  }

  /**
   * Returns the top level tabs for the given perspective
   * @method topLevelTabs
   * @for Perspective
   * @param {ng.ILocationService} $location
   * @param {Core.Workspace} workspace
   * @paran {*} jolokia
   * @param {any} localStorage
   * @return {Array}
   */
  export function getTopLevelTabsForPerspective($location, workspace: Workspace, jolokia, localStorage) {
    var perspective = currentPerspectiveId($location, workspace, jolokia, localStorage);

    var plugins = Core.configuredPluginsForPerspectiveId(perspective, workspace, jolokia, localStorage);
    var tabs = Core.filterTopLevelTabs(perspective, workspace, plugins);

    return tabs;
  }

  /**
   * Returns the perspective we should be using right now since none is specified
   * @method choosePerspective
   * @for Perspective
   * @param {ng.ILocationService} $location
   * @param {Core.Workspace} workspace
   * @paran {*} jolokia
   * @param {any} localStorage
   * @return {String}
   */
  export function choosePerspective($location, workspace: Workspace, jolokia, localStorage) {
    var inFMC = Fabric.isFMCContainer(workspace);
    if (inFMC) {
      var url = $location.url();
      log.debug("Checking url: ", url);
      if (url.startsWith("/fabric") ||
          url.startsWith("/dashboard") ||
          (url.startsWith("/wiki") && url.has("/fabric/profiles")) ||
          (url.startsWith("/wiki") && url.has("/editFeatures"))) {
        return "fabric";
      }
    }
    return Perspective.defaultPerspective || "container";
  }

  /**
   * Returns the default page after figuring out what the current perspective is
   * @method defaultPage
   * @for Perspective
   * @param {ng.ILocationService} $location
   * @param {Core.Workspace} workspace
   * @paran {*} jolokia
   * @param {any} localStorage
   * @return {String}
   */
  export function defaultPage($location, workspace: Workspace, jolokia, localStorage) {
    if (shouldShowWelcomePage(localStorage)) {
      return "/welcome/";
    }

    // now find the configured default plugin, and then find the top level tab that matches the default plugin
    var answer = Perspective.defaultPageLocation;
    if (!answer && $location && workspace) {
      var perspectiveId = currentPerspectiveId($location, workspace, jolokia, localStorage);
      var defaultPlugin = Core.getDefaultPlugin(perspectiveId, workspace, jolokia, localStorage);
      var tabs = Perspective.topLevelTabsForPerspectiveId(workspace, perspectiveId);
      tabs = Perspective.filterOnlyActiveTopLevelTabs(workspace, tabs);

      var defaultTab;
      if (defaultPlugin) {
        tabs.forEach(tab => {
          if (tab.id === defaultPlugin.id) {
            defaultTab = tab;
          }
        });
      } else {
        // if no default plugin configured, then select the 1st tab as default
        defaultTab = tabs[0];
      }

      if (defaultTab) {
        // clip the href to get the path to the plugin
        answer = Core.trimLeading(defaultTab.href(), "#");
      }
    }

    return answer || '/help/index';
  }

  /**
   * Whether to show the welcome page
   */
  export function shouldShowWelcomePage(localStorage) {
    var value = localStorage["showWelcomePage"];
    if (angular.isString(value)) {
      return "true" === value;
    }
    return true;
  }

  /**
   * Returns true if there is no validFn defined or if its defined
   * then the function returns true.
   *
   * @method isValidFunction
   * @for Perspective
   * @param {Core.Workspace} workspace
   * @param {Function} validFn
   * @return {Boolean}
   */
  function isValidFunction(workspace, validFn) {
    return !validFn || validFn(workspace);
  }

}

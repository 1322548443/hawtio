module Fabric {
  
  export var managerMBean = "org.fusesource.fabric:type=Fabric";

  export function initScope($scope, workspace) {
    $scope.hasFabricWiki = () => {
      return Git.isGitMBeanFabric(workspace);
    }
  }

  export function setSelect(selection, group) {
    if (!angular.isDefined(selection)) {
      return group[0];
    }
    var answer = group.findIndex( function(item) { return item.id === selection.id } );
    if (answer !== -1) {
      return group[answer];
    } else {
      return group[0];
    }
  }

  export function deleteConfigFile(jolokia, version, profile, pid, success, error) {
    doAction('deleteConfigurationFile(java.lang.String, java.lang.String, java.lang.String)', jolokia, [version, profile, pid], success, error);
  }

  export function newConfigFile(jolokia, version, profile, pid, success, error) {
    doAction('setConfigurationFile(java.lang.String, java.lang.String, java.lang.String, java.lang.String)', jolokia, [version, profile, pid, ''], success, error);
  }

  export function saveConfigFile(jolokia, version, profile, pid, data, success, error) {
    doAction('setConfigurationFile(java.lang.String, java.lang.String, java.lang.String, java.lang.String)', jolokia, [version, profile, pid, data], success, error);
  }

  export function addProfilesToContainer(jolokia, container, profiles, success, error) {
    doAction('addProfilesToContainer(java.lang.String, java.util.List)', jolokia, [container, profiles], success, error);
  }

  export function removeProfilesFromContainer(jolokia, container, profiles, success, error) {
    doAction('removeProfilesFromContainer(java.lang.String, java.util.List)', jolokia, [container, profiles], success, error);
  }

  export function applyProfiles(jolokia, version, profiles, containers, success, error) {
    doAction('applyProfilesToContainers(java.lang.String, java.util.List, java.util.List)', jolokia, [version, profiles, containers], success, error);
  }

  export function migrateContainers(jolokia, version, containers, success, error) {
    doAction('applyVersionToContainers(java.lang.String, java.util.List)', jolokia, [version, containers], success, error);
  }

  export function createProfile(jolokia, version, id, parents, success, error) {
    doAction('createProfile(java.lang.String, java.lang.String, java.util.List)', jolokia, [version, id, parents], success, error);
  }

  export function copyProfile(jolokia, version, sourceName, targetName, force, success, error) {
    doAction('copyProfile(java.lang.String, java.lang.String, java.lang.String, boolean)', jolokia, [version, sourceName, targetName, force], success, error);
  }

  export function createVersionWithParentAndId(jolokia, base, id, success, error) {
    doAction('createVersion(java.lang.String, java.lang.String)', jolokia, [base, id], success, error);
  }

  export function createVersionWithId(jolokia, id, success, error) {
    doAction('createVersion(java.lang.String)', jolokia, [id], success, error);
  }

  export function createVersion(jolokia, success, error) {
    doAction('createVersion()', jolokia, [], success, error);
  }

  export function deleteVersion(jolokia, id, success, error) {
    doAction('deleteVersion(java.lang.String)', jolokia, [id], success, error);
  }

  export function deleteProfile(jolokia, version, id, success, error) {
    doAction('deleteProfile(java.lang.String, java.lang.String)', jolokia, [version, id], success, error);
  }

  export function profileWebAppURL(jolokia, webAppId, profileId, versionId, success, error) {
    doAction('profileWebAppURL', jolokia, [webAppId, profileId, versionId], success, error);
  }

  export function doAction(action, jolokia, arguments, success, error) {
    jolokia.request(
        {
          type: 'exec', mbean: managerMBean,
          operation: action,
          arguments: arguments
        },
        {
          method: 'POST',
          success: success,
          error: error
        });
  }
  
  export function stopContainer(jolokia, id, success, error) {
    doAction('stopContainer(java.lang.String)', jolokia, [id], success, error);
  }

  export function destroyContainer(jolokia, id, success, error) {
    doAction('destroyContainer(java.lang.String)', jolokia, [id], success, error);
  }

  export function startContainer(jolokia, id, success, error) {
    doAction('startContainer(java.lang.String)', jolokia, [id], success, error);
  }
  
  
  export function getServiceList(container) {
    var answer = [];
    if (angular.isDefined(container) && angular.isDefined(container.jmxDomains) && angular.isArray(container.jmxDomains)) {

      container.jmxDomains.forEach((domain) => {
        if (domain === "org.apache.activemq") {
          answer.push({
            title: "Apache ActiveMQ",
            type: "img",
            src: "app/fabric/img/message_broker.png"
          });
        }
        if (domain === "org.apache.camel") {
          answer.push({
            title: "Apache Camel",
            type: "img",
            src: "app/fabric/img/camel.png"
          });
        }
        if (domain === "org.fusesource.fabric") {
          answer.push({
            title: "Fuse Fabric",
            type: "img",
            src: "app/fabric/img/fabric.png"
          });
        }
        if (domain === "hawtio") {
          answer.push({
            title: "hawtio",
            type: "img",
            src: "app/fabric/img/hawtio.png"
          });
        }
        if (domain === "org.apache.karaf") {
          answer.push({
            title: "Apache Karaf",
            type: "icon",
            src: "icon-beaker"
          })
        }
        if (domain === "org.apache.zookeeper") {
          answer.push({
            title: "Apache Zookeeper",
            type: "icon",
            src: "icon-group"
          })
        }
      });
    }
    return answer;
  }
  
  /**
   * Default the values that are missing in the returned JSON
   */
  export function defaultContainerValues(workspace:Workspace, $scope, values) {
    var map = {};
    angular.forEach(values, (row) => {
      var profileIds = row["profileIds"];
      if (profileIds) {
        angular.forEach(profileIds, (profileId) => {
          var containers = map[profileId];
          if (!containers) {
            containers = [];
            map[profileId] = containers;
          }
          containers.push(row);
        });
      }
      $scope.profileMap = map;
      row["link"] = containerLinks(workspace, row["id"]);
      row["profileLinks"] = profileLinks(workspace, row["versionId"], profileIds);


      var versionId = row["versionId"];
      var versionHref = url("#/fabric/profiles?v=" + versionId);
      var versionLink =  "<a href='" + versionHref + "'>" + versionId + "</a>"
      row["versionHref"] = versionHref;
      row["versionLink"] = versionLink;

      var id = row['id'] || "";
      var title = "container " + id + " ";
      var img = "red-dot.png";
      if (row['managed'] === false) {
        img = "spacer.gif";
      } else if (!row['alive']) {
        img = "gray-dot.png";
      } else if (row['provisionPending']) {
        img = "pending.gif";
      } else if (row['provisionStatus'] === 'success') {
        img = "green-dot.png";
      }
      img = "img/dots/" + img;
      row["statusImageHref"] = img;
      row["link"] = "<img src='" + img + "' title='" + title + "'/> " + (row["link"] || id);
    });
    return values;
  }

  // TODO move to core?
  export function toCollection(values) {
    var collection = values;
    if (!angular.isArray(values)) {
      collection = [values];
    }
    return collection;
  }

  export function containerLinks(workspace, values) {
    var answer = "";
    angular.forEach(toCollection(values), function (value, key) {
      var prefix = "";
      if (answer.length > 0) {
        prefix = " ";
      }
      answer += prefix + "<a href='" + url("#/fabric/container/" + value + workspace.hash()) + "'>" + value + "</a>";
    });
    return answer;
  }

  export function profileLinks(workspace, versionId, values) {
    var answer = "";
    angular.forEach(toCollection(values), function (value, key) {
      var prefix = "";
      if (answer.length > 0) {
        prefix = " ";
      }
      answer += prefix + "<a href='" + url("#/fabric/profile/" + versionId + "/" + value + workspace.hash()) + "'>" + value + "</a>";
    });
    return answer;
  }

  /**
   * Default the values that are missing in the returned JSON
   */
  export function defaultProfileValues(workspace, versionId, values) {
    angular.forEach(values, (row) => {
      var id = row["id"];
      row["link"] = profileLinks(workspace, versionId, id);
      row["parentLinks"] = profileLinks(workspace, versionId, row["parentIds"]);
      var containersHref = url("#/fabric/containers?p=" + id);
      var containerCount = row["containerCount"];
      var containersLink = "";
      if (containerCount) {
        containersLink = "<a href='" + containersHref + "'>" + containerCount + "</a>"
      }
      row["containersCountLink"] = containersLink;
      row["containersHref"] = containersHref;
    });
    return values;
  }

  export function getZooKeeperFacadeMBean(workspace: Workspace) {
    var folder = workspace.findMBeanWithProperties(jmxDomain, {type: "ZooKeeper"});
    return Core.pathGet(folder, "objectName");
  }

  /**
   * Opens a window connecting to the given container row details if the jolokiaUrl is available
   */
  export function connect(row, userName = "", password = "", useProxy = true) {
    var url = row.jolokiaUrl;
    if (url) {
      if (useProxy) {
        // lets remove the http stuff
        var idx = url.indexOf("://");
        if (idx > 0) {
          url = url.substring(idx + 3);
        }
        // lets replace the : with a /
        url = url.replace(":", "/");
        url = Core.trimLeading(url, "/");
        url = Core.trimTrailing(url, "/");
        url = "/hawtio/proxy/" + url;
      } else {
        if (url.indexOf("://") < 0) {
          url = "http://" + url;
        }
      }
      console.log("going to server: " + url + " as user " + userName);

      var full = "?url=" + encodeURIComponent(url);
      if (userName) {
        full += "&_user=" + userName;
      }
      if (password) {
        full += "&_pwd=" + password;
      }
      window.open(full + "/#/jmx/attributes?nid=root-java.lang-Runtime" );
    }
  }
}

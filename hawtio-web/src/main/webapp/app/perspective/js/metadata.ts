module Perspective {

  export var metadata = {
    fabric: {
      label: "Fabric",
      isValid: (workspace) => Fabric.hasFabric(workspace),
      topLevelTabs: {
        includes: [
          {
            href: "#/fabric"
          },
          {
            href: "#/wiki/branch/"
          },
          {
            href: "#/wiki/profile"
          },
          {
            href: "#/dashboard"
          }
        ]
      }
    },
    insight: {
      label: "Insight",
      isValid: (workspace) => workspace.treeContainsDomainAndProperties('org.elasticsearch', {service: 'restjmx'}),
      topLevelTabs: {
        includes: [
          {
            href: "#/insight"
          },
          {
            href: "#/camin"
          },
          {
            rhref: ".*kibana.*"
          },
          {
            rhref: ".*eshead.*"
          },
        ]
      }
    },
    local: {
      label: "Local JVM",
      topLevelTabs: {
        excludes: [
          {
            href: "#/fabric"
          },
          {
            href: "#/insight"
          },
          {
            href: "#/camin"
          },
        ]
      }
    }
  };

}

/**
 * @module JUnit
 */
module JUnit {

  export var log:Logging.Logger = Logger.get("JUnit");

  /**
   * Returns true if the JUnit plugin is enabled (both the hawtio insight and JUnit mbeans are available
   */
  export function isJUnitPluginEnabled(workspace:Workspace) {
    return getIntrospectorMBean(workspace)  &&
          workspace.findMBeanWithProperties('io.hawt.junit', {type: 'JUnitFacade'});
  }

  export function getIntrospectorMBean(workspace: Workspace) {
    return Core.getMBeanTypeObjectName(workspace, "io.hawt.introspect", "Introspector");
  }
}

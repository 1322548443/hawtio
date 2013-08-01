package io.hawt.blueprint;

import java.util.Map;
import java.util.Set;
import java.util.SortedSet;

/**
 * A JMX API to the {@link org.fusesource.fabric.watcher.blueprint.web.WatcherBlueprintContainer}
 */
public interface WatcherBlueprintContainerFacadeMXBean {

    SortedSet<String> getContainerLocations();

    Integer getComponentCount();

    Map<String, Set<String>> componentIdsMap();
}

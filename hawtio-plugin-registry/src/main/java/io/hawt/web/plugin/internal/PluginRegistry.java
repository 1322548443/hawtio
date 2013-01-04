/*
 * Copyright 2012 Red Hat, Inc.
 *
 * Red Hat licenses this file to you under the Apache License, version
 * 2.0 (the "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
 * implied.  See the License for the specific language governing
 * permissions and limitations under the License.
 */

package io.hawt.web.plugin.internal;

import io.hawt.web.plugin.Plugin;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.management.ManagementFactory;
import javax.management.MBeanServer;
import javax.management.MalformedObjectNameException;
import javax.management.ObjectInstance;
import javax.management.ObjectName;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.ArrayList;
import java.util.List;

/**
 *
 */
public class PluginRegistry implements PluginRegistryMBean, io.hawt.web.plugin.PluginRegistry {

  private static final transient Logger LOG = LoggerFactory.getLogger(PluginRegistry.class);

  private ObjectName objectName = null;

  public PluginRegistry() {

  }

  public void register(Plugin plugin) {

    if (plugin != null) {

      try {

        ObjectName name = getObjectName(plugin);
        if (getPlatformMBeanServer().isRegistered(name)) {
          unregister(plugin);
        }

        getPlatformMBeanServer().registerMBean(new io.hawt.web.plugin.internal.Plugin(plugin), name);

      } catch (Exception e) {
        LOG.warn("An error occured during mbean server registration: " + e, e);
      }
    }
  }

  public void unregister(Plugin plugin) {
    if (plugin != null) {
      try {
        ObjectName name = getObjectName(plugin);
        getPlatformMBeanServer().unregisterMBean(name);
      } catch (Exception e) {
        LOG.info("An error occured during mbean server registration: " + e, e);
      }
    }
  }

  public void init() {
    try {
      objectName = new ObjectName("hawtio:type=registry");
      getPlatformMBeanServer().registerMBean(this, objectName);
    } catch (Exception e) {
      LOG.warn("An error occured during mbean server registration: " + e, e);
    }
  }

  public void destroy() {
    if (objectName != null ) {
      try {
        getPlatformMBeanServer().unregisterMBean(objectName);
      } catch (Exception e) {
        LOG.warn("An error occured during mbean server registration: " + e, e);
      }
    }
  }

  private ObjectName getObjectName(Plugin plugin) throws MalformedObjectNameException {
    return new ObjectName("hawtio:type=" + plugin.getName());
  }

  /*
  public List<Plugin> pluginList() {
    ArrayList<Plugin> answer = new ArrayList<Plugin>();

    for(Plugin plugin : plugins) {
      PluginData data = new PluginData(plugin.getName());
      answer.add(data);
    }
    return answer;
  }
  */

  private MBeanServer getPlatformMBeanServer() {
    return ManagementFactory.getPlatformMBeanServer();
  }

}


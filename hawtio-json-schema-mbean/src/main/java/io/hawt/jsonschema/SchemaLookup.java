package io.hawt.jsonschema;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.fasterxml.jackson.module.jaxb.JaxbAnnotationModule;
import io.hawt.jsonschema.api.MixInAnnotation;
import io.hawt.jsonschema.internal.BeanValidationAnnotationModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.management.InstanceAlreadyExistsException;
import javax.management.MBeanServer;
import javax.management.ObjectName;
import java.lang.management.ManagementFactory;
import java.util.HashMap;
import java.util.Map;

/**
 * @author Stan Lewis
 */
public class SchemaLookup implements SchemaLookupMXBean {
    private static final transient Logger LOG = LoggerFactory.getLogger(SchemaLookup.class);

    private static SchemaLookup singleton;

    private MBeanServer mBeanServer;
    private ObjectName objectName;
    private Map<Class<?>, Class<?>> mixins = new HashMap<Class<?>, Class<?>>();

    private ObjectMapper mapper;

    public SchemaLookup() {
    }

    public static SchemaLookup getSingleton() {
        if (singleton == null) {
            // lazy create one
            new SchemaLookup().init();
        }
        return singleton;
    }

    public void init() {
        LOG.debug("Creating hawtio SchemaLookup instance");
        try {
            if (mapper == null) {
                mapper = new ObjectMapper();

                JaxbAnnotationModule module1 = new JaxbAnnotationModule();
                mapper.registerModule(module1);

                BeanValidationAnnotationModule module2 = new BeanValidationAnnotationModule();
                mapper.registerModule(module2);

            }
            // now lets expose the mbean...
            if (objectName == null) {
                objectName = new ObjectName("io.hawt.jsonschema:type=SchemaLookup");
            }
            if (mBeanServer == null) {
                mBeanServer = ManagementFactory.getPlatformMBeanServer();
            }
            try {
                mBeanServer.registerMBean(this, objectName);
            } catch (InstanceAlreadyExistsException iaee) {
                // Try to remove and re-register
                LOG.info("Re-registering SchemaLookup MBean");
                mBeanServer.unregisterMBean(objectName);
                mBeanServer.registerMBean(this, objectName);
            }
            singleton = this;
        } catch (Exception e) {
            LOG.warn("Exception during initialization: ", e);
            throw new RuntimeException(e);
        }
    }

    public void destroy() {
        try {
            if (objectName != null && mBeanServer != null) {
                mBeanServer.unregisterMBean(objectName);
            }
        } catch (Exception e) {
            LOG.warn("Exception unregistering mbean: ", e);
            throw new RuntimeException(e);
        }
    }

    protected Class getClass(String name) {
        // TODO - well, this relies on DynamicImport-Package to work, but seems simpler than mucking about with org.osgi.framework.wiring
        try {
            return Class.forName(name);
        } catch (ClassNotFoundException e) {
            LOG.warn("Failed to find class for {}", name);
            throw new RuntimeException(e);
        }
    }

    public void registerMixIn(MixInAnnotation mixin) {
        // Just to be on the safe side, force loading the classes directly to avoid
        // any odd proxy classes which will screw up our mixin' in
        Class target = getClass(mixin.getTarget().getCanonicalName());
        Class mixinSource = getClass(mixin.getMixinSource().getCanonicalName());
        LOG.info("Adding mixin for target class " + target.getCanonicalName() + " using annotation source " + mixinSource.getCanonicalName());
        mixins.put(target, mixinSource);
        getMapper().setMixInAnnotations(mixins);
        LOG.debug("Current mixin count: " + getMapper().mixInCount());
    }

    public void unregisterMixIn(MixInAnnotation mixin) {
        if (mixin != null) {
            LOG.info("Removing mixin for target class " + mixin.getTarget().getCanonicalName() + " using annotation source " + mixin.getMixinSource().getCanonicalName());
            mixins.remove(mixin.getTarget());
            getMapper().setMixInAnnotations(mixins);
            LOG.debug("Current mixin count: " + getMapper().mixInCount());
        }
    }

    @Override
    public String getSchemaForClass(String name) {
        Class clazz = getClass(name);
        return getSchemaForClass(clazz);
    }

    public String getSchemaForClass(Class clazz) {
        LOG.info("Looking up schema for " + clazz.getCanonicalName());
        String name = clazz.getName();
        try {
            ObjectWriter writer = mapper.writer().withDefaultPrettyPrinter();
            return writer.writeValueAsString(mapper.generateJsonSchema(clazz));
        } catch (Exception e) {
            LOG.warn("Failed to generate JSON schema for class {}", name, e);
            throw new RuntimeException(e);
        }
    }

    public ObjectMapper getMapper() {
        return mapper;
    }

    public void setMapper(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public MBeanServer getmBeanServer() {
        return mBeanServer;
    }

    public void setmBeanServer(MBeanServer mBeanServer) {
        this.mBeanServer = mBeanServer;
    }

    public ObjectName getObjectName() {
        return objectName;
    }

    public void setObjectName(ObjectName objectName) {
        this.objectName = objectName;
    }
}

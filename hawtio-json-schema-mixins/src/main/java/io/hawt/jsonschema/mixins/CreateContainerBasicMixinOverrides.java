package io.hawt.jsonschema.mixins;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.hawt.jsonschema.api.MixInAnnotation;
import org.fusesource.fabric.api.CreateContainerBasicOptions;
import org.fusesource.fabric.api.CreateContainerMetadata;
import org.fusesource.fabric.api.CreationStateListener;

import java.util.Map;

/**
 * @author Stan Lewis
 */
public class CreateContainerBasicMixinOverrides implements MixInAnnotation {

    @Override
    public Class getMixinSource() {
        return CreateContainerMixin.class;
    }

    @Override
    public Class getTarget() {
        return CreateContainerBasicOptions.class;
    }
}


abstract class CreateContainerMixin extends CreateContainerBasicOptions {

    @JsonIgnore
    protected String zookeeperUrl;

    @JsonIgnore
    protected String zookeeperPassword;

    @JsonIgnore
    protected Map<String, CreateContainerMetadata<?>> metadataMap;

    @JsonIgnore
    private CreationStateListener creationStateListener;

    @Override
    @JsonIgnore
    public CreationStateListener getCreationStateListener() {
        return null;
    }

    @Override
    @JsonIgnore
    public void setCreationStateListener(CreationStateListener creationStateListener) {

    }
}

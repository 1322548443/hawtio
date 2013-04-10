package io.hawt.jsonschema;


import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

/**
 * @author Stan Lewis
 */
public class ObjectWithValidationAnnotations {

    @NotNull
    @Size(message="Invalid Size", min=3, max=20)
    public String string1;

}

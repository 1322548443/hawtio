/**
 *
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package io.hawt.jsonschema.internal;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.databind.introspect.AnnotatedField;
import com.fasterxml.jackson.databind.introspect.AnnotatedMember;
import com.fasterxml.jackson.databind.introspect.AnnotatedMethod;
import com.fasterxml.jackson.databind.introspect.VisibilityChecker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.beans.Introspector;
import java.lang.reflect.Field;
import java.lang.reflect.Member;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;

/**
 * Ignores getters which are backed with a field of the same name which is a transient field
 */
public class IgnorePropertiesBackedByTransientFields implements VisibilityChecker<IgnorePropertiesBackedByTransientFields> {
    private static final transient Logger LOG = LoggerFactory.getLogger(IgnorePropertiesBackedByTransientFields.class);

    private final VisibilityChecker<?> defaultChecker;

    public IgnorePropertiesBackedByTransientFields(VisibilityChecker<?> defaultChecker) {
        this.defaultChecker = defaultChecker;
    }

    @Override
    public boolean isGetterVisible(AnnotatedMethod method) {
        boolean answer = defaultChecker.isGetterVisible(method);
        if (answer) {
            answer = isGetterMethodWithFieldVisible(method, getGetterFieldName(method.getName()), method.getDeclaringClass());
        }
        return answer;
    }

    @Override
    public boolean isGetterVisible(Method method) {
        boolean answer = defaultChecker.isGetterVisible(method);
        if (answer) {
            answer = isGetterMethodWithFieldVisible(method, getGetterFieldName(method.getName()), method.getDeclaringClass());
        }
        return answer;
    }

    @Override
    public boolean isIsGetterVisible(AnnotatedMethod method) {
        boolean answer = defaultChecker.isIsGetterVisible(method);
        if (answer) {
            answer = isGetterMethodWithFieldVisible(method, getIsGetterFieldName(method.getName()), method.getDeclaringClass());
        }
        return answer;
    }

    @Override
    public boolean isIsGetterVisible(Method method) {
        boolean answer = defaultChecker.isIsGetterVisible(method);
        if (answer) {
            answer = isGetterMethodWithFieldVisible(method, getIsGetterFieldName(method.getName()), method.getDeclaringClass());
        }
        return answer;
    }

    protected String getIsGetterFieldName(String methodName) {
        return Introspector.decapitalize(methodName.substring(2));
    }
    protected String getGetterFieldName(String methodName) {
        return Introspector.decapitalize(methodName.substring(3));
    }

    /**
     * Returns false if the getter method has a field of the same name which is transient
     * @return
     */
    protected boolean isGetterMethodWithFieldVisible(Object method, String fieldName, Class<?> declaringClass) {
        Field field = findField(fieldName, declaringClass);
        if (field != null) {
            int fieldModifiers = field.getModifiers();
            if (Modifier.isTransient(fieldModifiers)) {
                if (LOG.isDebugEnabled()) {
                    LOG.debug("Ignoring getter " + method + " due to transient field called " + fieldName);
                }
                return false;
            }
        }
        return true;
    }


    // Delegated methods
    //-------------------------------------------------------------------------

    @Override
    public boolean isCreatorVisible(AnnotatedMember m) {
        return defaultChecker.isCreatorVisible(m);
    }

    @Override
    public boolean isCreatorVisible(Member m) {
        return defaultChecker.isCreatorVisible(m);
    }

    @Override
    public boolean isFieldVisible(AnnotatedField f) {
        return defaultChecker.isFieldVisible(f);
    }

    @Override
    public boolean isFieldVisible(Field f) {
        return defaultChecker.isFieldVisible(f);
    }
    @Override
    public boolean isSetterVisible(AnnotatedMethod m) {
        return defaultChecker.isSetterVisible(m);
    }

    @Override
    public boolean isSetterVisible(Method m) {
        return defaultChecker.isSetterVisible(m);
    }

    @Override
    public IgnorePropertiesBackedByTransientFields with(JsonAutoDetect ann) {
        return (IgnorePropertiesBackedByTransientFields) defaultChecker.with(ann);
    }

    @Override
    public IgnorePropertiesBackedByTransientFields with(JsonAutoDetect.Visibility v) {
        return (IgnorePropertiesBackedByTransientFields) defaultChecker.with(v);
    }

    @Override
    public IgnorePropertiesBackedByTransientFields withCreatorVisibility(JsonAutoDetect.Visibility v) {
        return (IgnorePropertiesBackedByTransientFields) defaultChecker.withCreatorVisibility(v);
    }

    @Override
    public IgnorePropertiesBackedByTransientFields withFieldVisibility(JsonAutoDetect.Visibility v) {
        return (IgnorePropertiesBackedByTransientFields) defaultChecker.withFieldVisibility(v);
    }

    @Override
    public IgnorePropertiesBackedByTransientFields withGetterVisibility(JsonAutoDetect.Visibility v) {
        return (IgnorePropertiesBackedByTransientFields) defaultChecker.withGetterVisibility(v);
    }

    @Override
    public IgnorePropertiesBackedByTransientFields withIsGetterVisibility(JsonAutoDetect.Visibility v) {
        return (IgnorePropertiesBackedByTransientFields) defaultChecker.withIsGetterVisibility(v);
    }

    @Override
    public IgnorePropertiesBackedByTransientFields withSetterVisibility(JsonAutoDetect.Visibility v) {
        return (IgnorePropertiesBackedByTransientFields) defaultChecker.withSetterVisibility(v);
    }

    @Override
    public IgnorePropertiesBackedByTransientFields withVisibility(PropertyAccessor method, JsonAutoDetect.Visibility v) {
        return (IgnorePropertiesBackedByTransientFields) defaultChecker.withVisibility(method, v);
    }


    protected static Field findField(String fieldName, Class<?> declaringClass) {
        try {
            return declaringClass.getDeclaredField(fieldName);
        } catch (NoSuchFieldException e) {
            Class<?> superclass = declaringClass.getSuperclass();
            if (superclass != null && superclass != declaringClass) {
                return findField(fieldName, superclass);
            } else {
                return null;
            }
        }
    }

}

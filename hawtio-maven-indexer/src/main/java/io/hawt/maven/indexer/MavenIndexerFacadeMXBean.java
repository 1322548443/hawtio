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
package io.hawt.maven.indexer;

import java.io.IOException;
import java.util.List;

/**
 * The MBean for working with the MavenIndexer
 */
public interface MavenIndexerFacadeMXBean {
    /**
     * Returns the latest version of each artifact that matches any of the given strings like groupId or groupId and artifactId etc
     */
    List<ArtifactDTO> search(String groupId, String artifactId, String packaging, String classifier) throws IOException;

    /**
     * Returns all versions and artifacts that match the given query; such as to find all versions of a given groupId and artifactId.
     */
    List<ArtifactDTO> searchFlat(String groupId, String artifactId, String packaging, String classifier) throws IOException;

    /**
     * Returns the latest version of each artifact which contains the given class name text
     */
    List<ArtifactDTO> searchClasses(String classNameSearchText) throws IOException;

    /**
     * Searches for all artifacts for the given text, returning the latest matching artifact version
     */
    List<ArtifactDTO> searchText(String searchText) throws IOException;
}

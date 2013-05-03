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
package io.hawt.web;

import org.junit.Test;

import static org.junit.Assert.assertEquals;


/**
 */
public class ProxyDetailsTest {
    @Test
    public void testPathInfoWithUserPasswordPort() throws Exception {
        ProxyDetails details = new ProxyDetails("/admin:admin@localhost:8181/jolokia/");
        assertEquals("getUserName()", "admin", details.getUserName());
        assertEquals("getPassword()", "admin", details.getPassword());
        assertEquals("getHost()", "localhost", details.getHost());
        assertEquals("getUserName()", "localhost:8181", details.getHostAndPort());
        assertEquals("getPort()", 8181, details.getPort());
        assertEquals("getProxyPath()", "/jolokia/", details.getProxyPath());
        assertEquals("getStringProxyURL()", "http://localhost:8181/jolokia/", details.getStringProxyURL());
    }

    @Test
    public void testPathInfoWithUserPasswordDefaultPort() throws Exception {
        ProxyDetails details = new ProxyDetails("/admin:admin@localhost/jolokia/");
        assertEquals("getUserName()", "admin", details.getUserName());
        assertEquals("getPassword()", "admin", details.getPassword());
        assertEquals("getHost()", "localhost", details.getHost());
        assertEquals("getUserName()", "localhost", details.getHostAndPort());
        assertEquals("getPort()", 80, details.getPort());
        assertEquals("getProxyPath()", "/jolokia/", details.getProxyPath());
        assertEquals("getStringProxyURL()", "http://localhost/jolokia/", details.getStringProxyURL());
    }


    @Test
    public void testPathInfoWithdDefaultPort() throws Exception {
        ProxyDetails details = new ProxyDetails("/localhost/jolokia/");
        assertEquals("getUserName()", null, details.getUserName());
        assertEquals("getPassword()", null, details.getPassword());
        assertEquals("getHost()", "localhost", details.getHost());
        assertEquals("getUserName()", "localhost", details.getHostAndPort());
        assertEquals("getPort()", 80, details.getPort());
        assertEquals("getProxyPath()", "/jolokia/", details.getProxyPath());
        assertEquals("getStringProxyURL()", "http://localhost/jolokia/", details.getStringProxyURL());
    }

}

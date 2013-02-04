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

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.concurrent.TimeUnit;

public class CORSFilter implements Filter {

    public CORSFilter() {
    }

    public void init(FilterConfig fConfig) throws ServletException {
    }

    public void destroy() {
    }

    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        if (response instanceof HttpServletResponse) {
            HttpServletResponse resp = (HttpServletResponse) response;
            HttpServletRequest req = (HttpServletRequest) request;

            if (allowAny()) {
                if ("OPTIONS".equals(req.getMethod())) {
                    resp.addHeader("Access-Control-Request-Method", "GET, POST, PUT, DELETE");
                    String headers = req.getHeader("Access-Control-Request-Headers");
                    if (headers != null) {
                        resp.addHeader("Access-Control-Allow-Header", headers);
                    }
                    resp.addHeader("Access-Control-Max-Age", "" + TimeUnit.DAYS.toSeconds(1));
                }
                resp.addHeader("Access-Control-Allow-Origin", "*");
            }
        }
        chain.doFilter(request, response);
    }

    protected boolean allowAny() {
        // TODO allow configuration...
        return true;
    }
}
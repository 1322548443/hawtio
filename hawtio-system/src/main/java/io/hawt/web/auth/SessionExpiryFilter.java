package io.hawt.web.auth;

import java.io.IOException;
import java.io.OutputStream;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.regex.Pattern;
import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import io.hawt.system.ConfigManager;
import io.hawt.util.Strings;
import io.hawt.web.ServletHelpers;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * If the user has a session, this will ensure it will expire if the user hasn't clicked on any links
 * within the session expiry period
 */
public class SessionExpiryFilter implements Filter {

    private static final transient Logger LOG = LoggerFactory.getLogger(SessionExpiryFilter.class);

    private static final List<String> IGNORED_PATHS = Collections.unmodifiableList(Arrays.asList("jolokia", "proxy"));
    private ServletContext context;
    private boolean noCredentials401;

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        context = filterConfig.getServletContext();

        ConfigManager config = (ConfigManager) context.getAttribute("ConfigManager");
        if (config != null) {
            this.noCredentials401 = Boolean.parseBoolean(config.get("noCredentials401", "false"));
        }

        // Override if defined as JVM system property
        if (System.getProperty(ConfigurationManager.HAWTIO_NO_CREDENTIALS_401) != null) {
            this.noCredentials401 = Boolean.getBoolean(ConfigurationManager.HAWTIO_NO_CREDENTIALS_401);
        }
    }

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
        if (servletRequest instanceof HttpServletRequest
            && servletResponse instanceof HttpServletResponse) {
            process((HttpServletRequest) servletRequest, (HttpServletResponse) servletResponse, filterChain);
        } else {
            filterChain.doFilter(servletRequest, servletResponse);
        }
    }

    private void writeOk(HttpServletResponse response) throws IOException, ServletException {
        response.setContentType("text/html;charset=UTF-8");
        try (OutputStream out = response.getOutputStream()) {
            out.write("ok".getBytes());
            out.flush();
        }
    }

    private void updateLastAccess(HttpSession session, long now) {
        session.setAttribute("LastAccess", now);
        LOG.debug("Reset LastAccess to: {}", session.getAttribute("LastAccess"));
    }

    private void process(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws IOException, ServletException {
        if (context == null || context.getAttribute("authenticationEnabled") == null) {
            // most likely the authentication filter hasn't been started up yet, let this request through and it can be dealt with by the authentication filter
            chain.doFilter(request, response);
            return;
        }
        HttpSession session = request.getSession(false);
        boolean enabled = (boolean) context.getAttribute("authenticationEnabled");
        String uri = Strings.strip(request.getRequestURI(), "/");
        String[] uriParts = Pattern.compile("/").split(uri);
        // pass along if it's the top-level context
        if (uriParts.length == 1) {
            if (session != null) {
                long now = System.currentTimeMillis();
                updateLastAccess(session, now);
            }
            chain.doFilter(request, response);
            return;
        }
        String myContext = uriParts[0];
        String subContext = uriParts[1];
        if (session == null || session.getMaxInactiveInterval() < 0) {
            if (subContext.equals("refresh") && !enabled) {
                LOG.debug("Authentication disabled, received refresh response, responding with ok");
                writeOk(response);
            } else {
                chain.doFilter(request, response);
                /*
                if (!enabled) {
                    LOG.debug("Authentication disabled, allowing request");
                    chain.doFilter(request, response);
                } else if (request.getHeader(Authenticator.HEADER_AUTHORIZATION) != null) {
                    // there's no session, but we have request with authentication attempt
                    // let's pass it further the filter chain - if authentication will fail, user will get 403 anyway
                    chain.doFilter(request, response);
                } else {
                    if (noCredentials401 && subContext.equals("jolokia")) {
                        LOG.debug("Authentication enabled, noCredentials401 is true, allowing request for {}",
                            subContext);
                        chain.doFilter(request, response);
                    } else if (subContext.equals("jolokia") ||
                        subContext.equals("proxy") ||
                        subContext.equals("user") ||
                        subContext.equals("exportContext") ||
                        subContext.equals("contextFormatter") ||
                        subContext.equals("upload")) {
                        LOG.debug("Authentication enabled, denying request for {}", subContext);
                        ServletHelpers.doForbidden(response);
                    } else {
                        LOG.debug("Authentication enabled, but allowing request for {}", subContext);
                        chain.doFilter(request, response);
                    }
                }
                */
            }
            return;
        }
        int maxInactiveInterval = session.getMaxInactiveInterval();
        long now = System.currentTimeMillis();
        if (session.getAttribute("LastAccess") != null) {
            long lastAccess = (long) session.getAttribute("LastAccess");
            long remainder = (now - lastAccess) / 1000;
            LOG.debug("Session expiry: {}, duration since last access: {}", maxInactiveInterval, remainder);
            if (remainder > maxInactiveInterval) {
                LOG.info("Expiring session due to inactivity");
                session.invalidate();
                ServletHelpers.doForbidden(response);
                return;
            }
        }
        if (subContext.equals("refresh")) {
            updateLastAccess(session, now);
            writeOk(response);
            return;
        }
        LOG.debug("Top level context: {} subContext: {}", myContext, subContext);
        if (IGNORED_PATHS.contains(subContext) && session.getAttribute("LastAccess") != null) {
            LOG.debug("Not updating LastAccess");
        } else {
            updateLastAccess(session, now);
        }
        chain.doFilter(request, response);
    }

    @Override
    public void destroy() {
        // noop
    }
}
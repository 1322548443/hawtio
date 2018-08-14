package io.hawt.web.auth;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import io.hawt.util.Strings;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Redirect to login page when authentication is enabled.
 */
public class LoginRedirectFilter implements Filter {

    private static final transient Logger LOG = LoggerFactory.getLogger(LoginRedirectFilter.class);

    private AuthenticationConfiguration authConfiguration;
    private List<String> unsecuredPaths;

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        authConfiguration = AuthenticationConfiguration.getConfiguration(filterConfig.getServletContext());
        unsecuredPaths = convertCsvToList(filterConfig.getInitParameter("unsecuredPaths"));
    }

    @Override
    public void doFilter(final ServletRequest request, final ServletResponse response, final FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        HttpSession session = httpRequest.getSession(false);
        String path = httpRequest.getServletPath();

        if (authConfiguration.isEnabled() && !authConfiguration.isKeycloakEnabled()
            && !isAuthenticated(session) && isSecuredPath(path)) {
            redirect(httpRequest, httpResponse);
        } else {
            chain.doFilter(request, response);
        }
    }

    private boolean isAuthenticated(HttpSession session) {
        return session != null && session.getAttribute("subject") != null;
    }

    private void redirect(HttpServletRequest httpRequest, HttpServletResponse httpResponse) throws IOException {
        String scheme = httpRequest.getServletContext().getInitParameter("scheme");
        if (null == scheme) {
            scheme = "http";
            LOG.debug("scheme is null, using default ({})", scheme);
        } else {
            LOG.debug("scheme = {}", scheme);
        }

        String redirectUrl = scheme + "://" + httpRequest.getServerName() + ":" + httpRequest.getServerPort()
            + httpRequest.getContextPath() + AuthenticationConfiguration.LOGIN_URL;
        httpResponse.sendRedirect(redirectUrl);
    }

    List<String> convertCsvToList(String unsecuredPaths) {
        return unsecuredPaths != null
            ? Strings.split(unsecuredPaths, ",")
            : Collections.EMPTY_LIST;
    }

    boolean isSecuredPath(String path) {
        return !unsecuredPaths.stream().anyMatch(path::startsWith);
    }

    @Override
    public void destroy() {
    }
}

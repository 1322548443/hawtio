package io.hawt.springboot;

import io.hawt.HawtioContextListener;
import io.hawt.web.auth.AuthenticationFilter;
import io.hawt.web.auth.LoginServlet;
import io.hawt.web.auth.LogoutServlet;
import io.hawt.web.filters.CORSFilter;
import io.hawt.web.filters.CacheHeadersFilter;
import io.hawt.web.auth.SessionExpiryFilter;
import io.hawt.web.filters.XFrameOptionsFilter;
import io.hawt.web.filters.XXSSProtectionFilter;
import io.hawt.web.auth.keycloak.KeycloakServlet;
import io.hawt.web.auth.keycloak.KeycloakUserServlet;
import io.hawt.web.proxy.ProxyServlet;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.autoconfigure.ManagementContextConfiguration;
import org.springframework.boot.actuate.autoconfigure.ManagementServerProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.boot.web.servlet.ServletListenerRegistrationBean;
import org.springframework.boot.web.servlet.ServletRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.PropertySource;

/**
 * Management configuration for hawtio on Spring Boot
 */
@ManagementContextConfiguration
@ConditionalOnProperty(name = "hawtio.enabled", matchIfMissing = true)
@EnableConfigurationProperties(HawtioProperties.class)
@PropertySource("classpath:/io/hawt/springboot/application.properties")
public class HawtioConfiguration {

    @Autowired
    private HawtioProperties hawtioProperties;

    @Autowired
    private ManagementServerProperties managementProperties;

    @Bean
    public HawtioEndpoint hawtioEndpoint() {
        return new HawtioEndpoint();
    }

    /**
     * Register rest endpoint to handle requests for /plugin, and
     * return all registered plugins.
     */
    @Bean
    public PluginService pluginService() {
        return new PluginService();
    }

    // -------------------------------------------------------------------------
    // Filters
    // -------------------------------------------------------------------------

    @Bean
    public FilterRegistrationBean sessionExpiryFilter() {
        final FilterRegistrationBean filter = new FilterRegistrationBean();
        filter.setFilter(new SessionExpiryFilter());
        filter.addUrlPatterns("/hawtio/*");
        return filter;
    }

    @Bean
    public FilterRegistrationBean cacheFilter() {
        final FilterRegistrationBean filter = new FilterRegistrationBean();
        filter.setFilter(new CacheHeadersFilter());
        filter.addUrlPatterns("/hawtio/*");
        return filter;
    }

    @Bean
    public FilterRegistrationBean CORSFilter() {
        final FilterRegistrationBean filter = new FilterRegistrationBean();
        filter.setFilter(new CORSFilter());
        filter.addUrlPatterns("/hawtio/*");
        return filter;
    }

    @Bean
    public FilterRegistrationBean xframeOptionsFilter() {
        final FilterRegistrationBean filter = new FilterRegistrationBean();
        filter.setFilter(new XFrameOptionsFilter());
        filter.addUrlPatterns("/hawtio/*");
        return filter;
    }

    @Bean
    public FilterRegistrationBean xxssProtectionFilter() {
        final FilterRegistrationBean filter = new FilterRegistrationBean();
        filter.setFilter(new XXSSProtectionFilter());
        filter.addUrlPatterns("/hawtio/*");
        return filter;
    }

    @Bean
    public FilterRegistrationBean authenticationFilter() {
        final FilterRegistrationBean filter = new FilterRegistrationBean();
        filter.setFilter(new AuthenticationFilter());
        filter.addUrlPatterns("/hawtio/auth/*", "/jolokia/*");
        return filter;
    }

    // -------------------------------------------------------------------------
    // Servlets
    // -------------------------------------------------------------------------

    // Jolokia agent servlet is provided by Spring Boot actuator

    @Bean
    public ServletRegistrationBean jolokiaProxyServlet() {
        return new ServletRegistrationBean(new ProxyServlet(),
            "/hawtio/proxy/*");
    }

    @Bean
    public ServletRegistrationBean userServlet() {
        return new ServletRegistrationBean(new KeycloakUserServlet(),
            "/user/*", "/hawtio/user/*");
    }

    @Bean
    public ServletRegistrationBean loginServlet() {
        return new ServletRegistrationBean(new LoginServlet(),
            "/hawtio/auth/login/*");
    }

    @Bean
    public ServletRegistrationBean logoutServlet() {
        return new ServletRegistrationBean(new LogoutServlet(),
            "/hawtio/auth/logout/*");
    }

    @Bean
    public ServletRegistrationBean keycloakServlet() {
        return new ServletRegistrationBean(new KeycloakServlet(),
            "/hawtio/keycloak/*");
    }

    // -------------------------------------------------------------------------
    // Listeners
    // -------------------------------------------------------------------------


    @Bean
    public ServletListenerRegistrationBean hawtioContextListener() {
        return new ServletListenerRegistrationBean<>(new HawtioContextListener());
    }

}

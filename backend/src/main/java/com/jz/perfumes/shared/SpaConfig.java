package com.jz.perfumes.shared;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.regex.Pattern;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

/**
 * El jar sirve el build de Angular desde static/. Toda ruta que no sea /api ni un archivo real
 * devuelve index.html para que el router de Angular resuelva (recargar /productos/nuevo no da 404).
 * index.html va sin cache: si no, tras un rebuild el navegador pide chunks con hash viejo.
 */
@Configuration
public class SpaConfig implements WebMvcConfigurer {

    private static final Pattern HASHED_ASSET = Pattern.compile("^/[^/]+-[A-Z0-9]{8}[.](js|css)$");

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new SpaResourceResolver());
    }

    @Bean
    public OncePerRequestFilter staticCacheHeadersFilter() {
        return new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
                    throws ServletException, IOException {
                String path = req.getRequestURI();
                if (path.startsWith("/api/") || path.startsWith("/actuator/")) {
                    chain.doFilter(req, res);
                    return;
                }
                if (HASHED_ASSET.matcher(path).matches()) {
                    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
                } else {
                    res.setHeader("Cache-Control", "no-cache");
                }
                chain.doFilter(req, res);
            }
        };
    }

    private static class SpaResourceResolver extends PathResourceResolver {
        @Override
        protected Resource getResource(String resourcePath, Resource location) throws IOException {
            Resource requested = location.createRelative(resourcePath);
            if (requested.isReadable()) {
                return requested;
            }
            if (resourcePath.startsWith("api/") || resourcePath.startsWith("actuator/")) {
                return null;
            }
            Resource index = new ClassPathResource("/static/index.html");
            return index.exists() ? index : null;
        }
    }
}

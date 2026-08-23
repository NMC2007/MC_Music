package com.example.apigateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.function.RouterFunction;
import org.springframework.web.servlet.function.ServerResponse;

import static org.springframework.cloud.gateway.server.mvc.handler.GatewayRouterFunctions.route;
import static org.springframework.cloud.gateway.server.mvc.handler.HandlerFunctions.http;
import static org.springframework.cloud.gateway.server.mvc.filter.BeforeFilterFunctions.uri;
import static org.springframework.web.servlet.function.RequestPredicates.path;

@Configuration
public class GatewayRoutesConfig {

    @Value("${service.uri.users:http://localhost:8082}")
    private String usersServiceUri;

    @Value("${service.uri.catalog:http://localhost:8081}")
    private String catalogServiceUri;

    @Value("${service.uri.artists:http://localhost:8083}")
    private String artistsServiceUri;

    @Value("${service.uri.admin:http://localhost:8084}")
    private String adminServiceUri;

    @Bean
    public RouterFunction<ServerResponse> customRoutes() {
        return route("users-service")
                .route(path("/api/user/**"), http())
                .before(uri(usersServiceUri))
                .build()
            .and(route("catalog-service")
                .route(path("/api/catalog/**"), http())
                .before(uri(catalogServiceUri))
                .build())
            .and(route("artists-service")
                .route(path("/api/artist/**"), http())
                .before(uri(artistsServiceUri))
                .build())
            .and(route("admin-service")
                .route(path("/api/admin/**"), http())
                .before(uri(adminServiceUri))
                .build());
    }
}

package com.jz.perfumes.stock;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jz.perfumes.IntegrationTest;
import com.jz.perfumes.auth.AppUserRepository;
import com.jz.perfumes.product.BrandRepository;
import com.jz.perfumes.product.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/** Movimientos contra Postgres real: stock del producto, stock_after, created_by y rollback ante 409. */
@AutoConfigureMockMvc
class StockFlowTest extends IntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired StockMovementRepository movements;
    @Autowired ProductRepository products;
    @Autowired BrandRepository brands;
    @Autowired AppUserRepository users;

    private String token;
    private long productId;

    @BeforeEach
    void setUp() throws Exception {
        movements.deleteAll();
        products.deleteAll();
        brands.deleteAll();
        token = login();
        String brand = mvc.perform(authed(post("/api/brands")).content("{\"name\":\"Dior\"}"))
                .andReturn().getResponse().getContentAsString();
        long brandId = json.readTree(brand).get("id").asLong();
        String product = mvc.perform(authed(post("/api/products")).content("""
                {"sku":"SAV-100","brandId":%d,"name":"Sauvage","concentration":"EDP","sizeMl":100,
                 "presentation":"BOTTLE","costPrice":"50000","salePrice":"90000","minStock":2}
                """.formatted(brandId))).andReturn().getResponse().getContentAsString();
        productId = json.readTree(product).get("id").asLong();
    }

    @Test
    void purchaseThenLossThenAdjustmentKeepsHistoryConsistent() throws Exception {
        mvc.perform(movement("{\"type\":\"PURCHASE\",\"quantity\":10,\"unitCost\":\"48000\",\"reason\":\"Compra inicial\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.quantity").value(10))
                .andExpect(jsonPath("$.stockAfter").value(10))
                .andExpect(jsonPath("$.unitCost").value(48000.00));

        mvc.perform(authed(get("/api/products/" + productId)))
                .andExpect(jsonPath("$.currentStock").value(10))
                .andExpect(jsonPath("$.belowMinimum").value(false));

        // pérdida mayor al stock: 409 y el stock no cambia
        mvc.perform(movement("{\"type\":\"LOSS\",\"quantity\":15}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Stock insuficiente")));
        mvc.perform(authed(get("/api/products/" + productId))).andExpect(jsonPath("$.currentStock").value(10));

        // el signo lo pone el tipo: LOSS con 3 descuenta 3
        mvc.perform(movement("{\"type\":\"LOSS\",\"quantity\":3,\"reason\":\"Rotura\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.quantity").value(-3))
                .andExpect(jsonPath("$.stockAfter").value(7));

        mvc.perform(movement("{\"type\":\"ADJUSTMENT\",\"quantity\":-5,\"reason\":\"Conteo\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.stockAfter").value(2));

        mvc.perform(authed(get("/api/products/" + productId)))
                .andExpect(jsonPath("$.currentStock").value(2))
                .andExpect(jsonPath("$.belowMinimum").value(true));

        // historial del más nuevo al más viejo, con stock_after encadenado
        mvc.perform(authed(get("/api/products/" + productId + "/movements")))
                .andExpect(jsonPath("$.page.totalElements").value(3))
                .andExpect(jsonPath("$.content[0].type").value("ADJUSTMENT"))
                .andExpect(jsonPath("$.content[0].stockAfter").value(2))
                .andExpect(jsonPath("$.content[1].type").value("LOSS"))
                .andExpect(jsonPath("$.content[2].type").value("PURCHASE"))
                .andExpect(jsonPath("$.content[2].reason").value("Compra inicial"));

        long adminId = users.findByUsername("admin").orElseThrow().getId();
        assertThat(movements.findAll()).allSatisfy(m -> assertThat(m.getCreatedBy()).isEqualTo(adminId));
    }

    @Test
    void rejectsSaleTypeZeroQuantityAndUnknownProduct() throws Exception {
        mvc.perform(movement("{\"type\":\"SALE\",\"quantity\":1}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Las ventas se registran desde la pantalla de ventas"));
        mvc.perform(movement("{\"type\":\"ADJUSTMENT\",\"quantity\":0}"))
                .andExpect(status().isBadRequest());
        mvc.perform(movement("{\"type\":\"PURCHASE\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("quantity")));
        mvc.perform(authed(post("/api/products/999999/movements")).content("{\"type\":\"PURCHASE\",\"quantity\":1}"))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/products/" + productId + "/movements").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"PURCHASE\",\"quantity\":1}"))
                .andExpect(status().isUnauthorized());
        assertThat(movements.count()).isZero();
    }

    private MockHttpServletRequestBuilder movement(String body) {
        return authed(post("/api/products/" + productId + "/movements")).content(body);
    }

    private MockHttpServletRequestBuilder authed(MockHttpServletRequestBuilder b) {
        return b.header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON);
    }

    private String login() throws Exception {
        String body = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"test-admin-password\"}"))
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("token").asText();
    }
}

package com.jz.perfumes.product;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jz.perfumes.IntegrationTest;
import com.jz.perfumes.stock.StockMovementRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/** CRUD y filtros contra Postgres real (el @Query con parámetros nulos es lo que más se rompe). */
@AutoConfigureMockMvc
class ProductFlowTest extends IntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired ProductRepository products;
    @Autowired BrandRepository brands;
    @Autowired StockMovementRepository movements;

    private String token;
    private long diorId;
    private long chanelId;

    @BeforeEach
    void setUp() throws Exception {
        movements.deleteAll();
        products.deleteAll();
        brands.deleteAll();
        token = login();
        diorId = createBrand("Dior");
        chanelId = createBrand("Chanel");
    }

    @Test
    void createsListsFiltersAndDeactivates() throws Exception {
        mvc.perform(authed(post("/api/products")).content(product("sav-100", diorId, "Sauvage", 2)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", org.hamcrest.Matchers.startsWith("/api/products/")))
                .andExpect(jsonPath("$.sku").value("SAV-100"))
                .andExpect(jsonPath("$.brand").value("Dior"))
                .andExpect(jsonPath("$.salePrice").value(89999.99))
                .andExpect(jsonPath("$.currentStock").value(0))
                .andExpect(jsonPath("$.belowMinimum").value(true));
        String bleuBody = mvc.perform(authed(post("/api/products")).content(product("bleu-50", chanelId, "Bleu", 0)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long bleuId = json.readTree(bleuBody).get("id").asLong();

        // sin filtros: los dos, ordenados por nombre
        mvc.perform(authed(get("/api/products")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page.totalElements").value(2))
                .andExpect(jsonPath("$.content[0].name").value("Bleu"))
                .andExpect(jsonPath("$.content[1].name").value("Sauvage"));

        // q busca en nombre, sku y marca
        mvc.perform(authed(get("/api/products").param("q", "dio")))
                .andExpect(jsonPath("$.page.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].name").value("Sauvage"));
        mvc.perform(authed(get("/api/products").param("q", "BLEU-5")))
                .andExpect(jsonPath("$.page.totalElements").value(1));

        mvc.perform(authed(get("/api/products").param("brandId", String.valueOf(chanelId))))
                .andExpect(jsonPath("$.page.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].brand").value("Chanel"));

        // belowMinimum: Sauvage (0 <= 2) sí, Bleu (0 <= 0) también; con minStock 0 no hay alerta si hay stock
        mvc.perform(authed(get("/api/products").param("belowMinimum", "true")))
                .andExpect(jsonPath("$.page.totalElements").value(2));

        mvc.perform(authed(get("/api/products/summary")))
                .andExpect(jsonPath("$.activeCount").value(2))
                .andExpect(jsonPath("$.belowMinimumCount").value(2));

        // baja lógica y filtro active
        mvc.perform(authed(delete("/api/products/" + bleuId))).andExpect(status().isNoContent());
        mvc.perform(authed(get("/api/products").param("active", "true")))
                .andExpect(jsonPath("$.page.totalElements").value(1));
        mvc.perform(authed(get("/api/products").param("active", "false")))
                .andExpect(jsonPath("$.content[0].name").value("Bleu"));
        mvc.perform(authed(post("/api/products/" + bleuId + "/activate")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.active").value(true));
    }

    @Test
    void rejectsDuplicateSkuAndUnknownBrand() throws Exception {
        mvc.perform(authed(post("/api/products")).content(product("dup-1", diorId, "Uno", 1))).andExpect(status().isCreated());

        mvc.perform(authed(post("/api/products")).content(product(" dup-1 ", diorId, "Dos", 1)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Ya existe un producto con el SKU DUP-1"));

        mvc.perform(authed(post("/api/products")).content(product("otro", 999_999L, "Tres", 1)))
                .andExpect(status().isNotFound());

        // misma marca+nombre+concentración+ml+presentación con otra SKU: unique de la tabla → 409
        mvc.perform(authed(post("/api/products")).content(product("dup-2", diorId, "Uno", 1)))
                .andExpect(status().isConflict());
    }

    @Test
    void validatesRequestAndUpdates() throws Exception {
        mvc.perform(authed(post("/api/products")).content("{\"sku\":\"\",\"brandId\":null,\"name\":\"x\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("sku")));

        String body = mvc.perform(authed(post("/api/products")).content(product("up-1", diorId, "Antes", 1)))
                .andReturn().getResponse().getContentAsString();
        long id = json.readTree(body).get("id").asLong();

        mvc.perform(authed(put("/api/products/" + id)).content(product("up-1", chanelId, "Después", 3)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Después"))
                .andExpect(jsonPath("$.brand").value("Chanel"))
                .andExpect(jsonPath("$.minStock").value(3));

        mvc.perform(authed(get("/api/products/" + id))).andExpect(jsonPath("$.name").value("Después"));
        mvc.perform(authed(get("/api/products/999999"))).andExpect(status().isNotFound());
        mvc.perform(get("/api/products")).andExpect(status().isUnauthorized());
    }

    @Test
    void brandsAreListedSortedAndUnique() throws Exception {
        mvc.perform(authed(get("/api/brands")))
                .andExpect(jsonPath("$[0].name").value("Chanel"))
                .andExpect(jsonPath("$[1].name").value("Dior"));
        mvc.perform(authed(post("/api/brands")).content("{\"name\":\" dior \"}"))
                .andExpect(status().isConflict());
        mvc.perform(authed(post("/api/brands")).content("{\"name\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    private static String product(String sku, long brandId, String name, int minStock) {
        return """
                {"sku":"%s","brandId":%d,"name":"%s","concentration":"EDP","sizeMl":100,"presentation":"BOTTLE",
                 "gender":"MASCULINE","fragranceFamily":"Aromática","costPrice":"50000","salePrice":"89999.99","minStock":%d}
                """.formatted(sku, brandId, name, minStock);
    }

    private long createBrand(String name) throws Exception {
        String body = mvc.perform(authed(post("/api/brands")).content("{\"name\":\"" + name + "\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("id").asLong();
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

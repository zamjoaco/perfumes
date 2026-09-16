package com.jz.perfumes.sale;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jz.perfumes.IntegrationTest;
import com.jz.perfumes.product.BrandRepository;
import com.jz.perfumes.product.ProductRepository;
import com.jz.perfumes.stock.MovementType;
import com.jz.perfumes.stock.StockMovementRepository;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/** El flujo que más importa: vender descuenta stock en la misma transacción y cancelar lo devuelve. */
@AutoConfigureMockMvc
class SaleFlowTest extends IntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired SaleRepository sales;
    @Autowired StockMovementRepository movements;
    @Autowired ProductRepository products;
    @Autowired BrandRepository brands;

    private String token;
    private long sauvageId;
    private long bleuId;

    @BeforeEach
    void setUp() throws Exception {
        sales.deleteAll();
        movements.deleteAll();
        products.deleteAll();
        brands.deleteAll();
        token = login();
        long brandId = json.readTree(mvc.perform(authed(post("/api/brands")).content("{\"name\":\"Dior\"}"))
                .andReturn().getResponse().getContentAsString()).get("id").asLong();
        sauvageId = createProduct(brandId, "SAV-100", "Sauvage", "89999.99", "50000");
        bleuId = createProduct(brandId, "BLEU-100", "Bleu", "105000", "61000");
        purchase(sauvageId, 5);
        purchase(bleuId, 1);
    }

    @Test
    void sellingDiscountsStockAndCancellingReturnsIt() throws Exception {
        String body = mvc.perform(authed(post("/api/sales")).content("""
                {"items":[{"productId":%d,"quantity":2},{"productId":%d,"quantity":1}],
                 "paymentMethod":"MP","discount":"999.99","notes":"Regalo"}
                """.formatted(sauvageId, bleuId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.subtotal").value(284999.98))
                .andExpect(jsonPath("$.discount").value(999.99))
                .andExpect(jsonPath("$.total").value(283999.99))
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.itemCount").value(3))
                .andExpect(jsonPath("$.items[0].productName").value("Sauvage"))
                .andExpect(jsonPath("$.items[0].unitPrice").value(89999.99))
                .andExpect(jsonPath("$.items[0].unitCost").value(50000.00))
                .andReturn().getResponse().getContentAsString();
        long saleId = json.readTree(body).get("id").asLong();

        mvc.perform(authed(get("/api/products/" + sauvageId))).andExpect(jsonPath("$.currentStock").value(3));
        mvc.perform(authed(get("/api/products/" + bleuId))).andExpect(jsonPath("$.currentStock").value(0));
        assertThat(movements.findAll()).filteredOn(m -> m.getMovementType() == MovementType.SALE)
                .hasSize(2)
                .allSatisfy(m -> {
                    assertThat(m.getReferenceId()).isEqualTo(saleId);
                    assertThat(m.getQuantity()).isNegative();
                });

        // cambiar el precio después no toca la venta guardada
        mvc.perform(authed(get("/api/sales/" + saleId)))
                .andExpect(jsonPath("$.items[0].unitPrice").value(89999.99))
                .andExpect(jsonPath("$.notes").value("Regalo"));

        mvc.perform(authed(post("/api/sales/" + saleId + "/cancel")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
        mvc.perform(authed(get("/api/products/" + sauvageId))).andExpect(jsonPath("$.currentStock").value(5));
        mvc.perform(authed(get("/api/products/" + bleuId))).andExpect(jsonPath("$.currentStock").value(1));
        assertThat(movements.findAll()).filteredOn(m -> m.getMovementType() == MovementType.RETURN)
                .hasSize(2)
                .allSatisfy(m -> assertThat(m.getReason()).isEqualTo("Cancelación de venta #" + saleId));

        mvc.perform(authed(post("/api/sales/" + saleId + "/cancel")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("ya está cancelada")));
        mvc.perform(authed(get("/api/products/" + sauvageId))).andExpect(jsonPath("$.currentStock").value(5));
    }

    @Test
    void insufficientStockRollsBackTheWholeSale() throws Exception {
        mvc.perform(authed(post("/api/sales")).content("""
                {"items":[{"productId":%d,"quantity":1},{"productId":%d,"quantity":2}],"paymentMethod":"CASH"}
                """.formatted(sauvageId, bleuId)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("Stock insuficiente de Bleu")));

        assertThat(sales.count()).isZero();
        assertThat(movements.findAll()).noneMatch(m -> m.getMovementType() == MovementType.SALE);
        mvc.perform(authed(get("/api/products/" + sauvageId))).andExpect(jsonPath("$.currentStock").value(5));
    }

    @Test
    void validatesRequest() throws Exception {
        mvc.perform(authed(post("/api/sales")).content("{\"items\":[],\"paymentMethod\":\"CASH\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("items")));
        mvc.perform(authed(post("/api/sales")).content("""
                {"items":[{"productId":%d,"quantity":1}],"paymentMethod":"CASH","discount":"90000"}
                """.formatted(sauvageId)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("descuento")));
        mvc.perform(authed(post("/api/sales")).content("""
                {"items":[{"productId":%d,"quantity":1}],"paymentMethod":"CASH"}
                """.formatted(999_999L)))
                .andExpect(status().isNotFound());

        mvc.perform(authed(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/products/" + bleuId)))
                .andExpect(status().isNoContent());
        mvc.perform(authed(post("/api/sales")).content("""
                {"items":[{"productId":%d,"quantity":1}],"paymentMethod":"CASH"}
                """.formatted(bleuId)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("dado de baja")));
        assertThat(sales.count()).isZero();
    }

    @Test
    void listsByLocalDateAndSummarizesToday() throws Exception {
        mvc.perform(authed(post("/api/sales")).content("""
                {"items":[{"productId":%d,"quantity":1}],"paymentMethod":"CASH"}
                """.formatted(sauvageId))).andExpect(status().isCreated());
        // una venta con fecha explícita de ayer
        String yesterday = LocalDate.now().minusDays(1) + "T15:00:00Z";
        mvc.perform(authed(post("/api/sales")).content("""
                {"items":[{"productId":%d,"quantity":1}],"paymentMethod":"CARD","soldAt":"%s"}
                """.formatted(sauvageId, yesterday))).andExpect(status().isCreated());

        mvc.perform(authed(get("/api/sales")))
                .andExpect(jsonPath("$.page.totalElements").value(2))
                .andExpect(jsonPath("$.content[0].paymentMethod").value("CASH")); // más nueva primero

        String today = LocalDate.now().toString();
        mvc.perform(authed(get("/api/sales").param("from", today).param("to", today)))
                .andExpect(jsonPath("$.page.totalElements").value(1));
        mvc.perform(authed(get("/api/sales").param("status", "CANCELLED")))
                .andExpect(jsonPath("$.page.totalElements").value(0));

        mvc.perform(authed(get("/api/sales/today")))
                .andExpect(jsonPath("$.count").value(1))
                .andExpect(jsonPath("$.total").value(89999.99));

        mvc.perform(get("/api/sales")).andExpect(status().isUnauthorized());
    }

    private long createProduct(long brandId, String sku, String name, String price, String cost) throws Exception {
        String body = mvc.perform(authed(post("/api/products")).content("""
                {"sku":"%s","brandId":%d,"name":"%s","concentration":"EDP","sizeMl":100,
                 "presentation":"BOTTLE","costPrice":"%s","salePrice":"%s","minStock":1}
                """.formatted(sku, brandId, name, cost, price)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("id").asLong();
    }

    private void purchase(long productId, int quantity) throws Exception {
        mvc.perform(authed(post("/api/products/" + productId + "/movements"))
                        .content("{\"type\":\"PURCHASE\",\"quantity\":" + quantity + "}"))
                .andExpect(status().isCreated());
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

package pl.dmcs.rkotas.springbootjsp_iwa2026.message.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class SubscriptionServiceForm {

    @NotBlank
    @Size(min = 2, max = 100)
    private String name;

    @Size(max = 100)
    private String category;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }
}

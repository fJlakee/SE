package pl.dmcs.rkotas.springbootjsp_iwa2026.controllers;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.dmcs.rkotas.springbootjsp_iwa2026.message.request.SubscriptionServiceForm;
import pl.dmcs.rkotas.springbootjsp_iwa2026.message.response.ResponseMessage;
import pl.dmcs.rkotas.springbootjsp_iwa2026.model.SubscriptionService;
import pl.dmcs.rkotas.springbootjsp_iwa2026.service.SubscriptionManagementService;

import java.util.List;

@RestController
@CrossOrigin(origins = "*", maxAge = 3600)
@RequestMapping("/services")
public class SubscriptionServiceRESTController {

    private final SubscriptionManagementService subscriptionManagementService;

    public SubscriptionServiceRESTController(SubscriptionManagementService subscriptionManagementService) {
        this.subscriptionManagementService = subscriptionManagementService;
    }

    @GetMapping
    public List<SubscriptionService> listServices() {
        return subscriptionManagementService.listServices();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createService(@Valid @RequestBody SubscriptionServiceForm form) {
        SubscriptionService created = subscriptionManagementService.createService(form);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }
}

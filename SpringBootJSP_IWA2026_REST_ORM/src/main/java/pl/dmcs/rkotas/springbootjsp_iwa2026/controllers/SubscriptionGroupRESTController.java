package pl.dmcs.rkotas.springbootjsp_iwa2026.controllers;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pl.dmcs.rkotas.springbootjsp_iwa2026.message.request.CreateSubscriptionGroupForm;
import pl.dmcs.rkotas.springbootjsp_iwa2026.message.response.ResponseMessage;
import pl.dmcs.rkotas.springbootjsp_iwa2026.model.GroupApplication;
import pl.dmcs.rkotas.springbootjsp_iwa2026.model.SubscriptionGroup;
import pl.dmcs.rkotas.springbootjsp_iwa2026.service.SubscriptionManagementService;

import java.math.BigDecimal;
import java.util.List;

@RestController
@CrossOrigin(origins = "*", maxAge = 3600)
@RequestMapping("/groups")
public class SubscriptionGroupRESTController {

    private final SubscriptionManagementService subscriptionManagementService;

    public SubscriptionGroupRESTController(SubscriptionManagementService subscriptionManagementService) {
        this.subscriptionManagementService = subscriptionManagementService;
    }

    @GetMapping("/search")
    public List<SubscriptionGroup> searchGroups(@RequestParam(required = false) String serviceName,
                                                @RequestParam(required = false) Integer minAvailableSlots,
                                                @RequestParam(required = false) BigDecimal maxPrice) {
        return subscriptionManagementService.searchGroups(serviceName, minAvailableSlots, maxPrice);
    }

    @GetMapping
    public List<SubscriptionGroup> publicGroups() {
        return subscriptionManagementService.getPublicGroups();
    }

    @GetMapping("/{groupId}")
    public SubscriptionGroup getGroup(@PathVariable Long groupId) {
        return subscriptionManagementService.getGroupDetails(groupId);
    }

    @GetMapping("/mine")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public List<SubscriptionGroup> myGroups(Authentication authentication) {
        return subscriptionManagementService.getMyGroups(authentication.getName());
    }

    @GetMapping("/applications/mine")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public List<GroupApplication> myApplications(Authentication authentication) {
        return subscriptionManagementService.getMyApplications(authentication.getName());
    }

    @GetMapping("/applications/owner")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public List<GroupApplication> ownerApplications(Authentication authentication) {
        return subscriptionManagementService.getApplicationsForOwner(authentication.getName());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<?> createGroup(@Valid @RequestBody CreateSubscriptionGroupForm form,
                                         Authentication authentication) {
        SubscriptionGroup group = subscriptionManagementService.createGroup(form, authentication.getName());
        return new ResponseEntity<>(group, HttpStatus.CREATED);
    }

    @PostMapping("/{groupId}/apply")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<?> apply(@PathVariable Long groupId, Authentication authentication) {
        GroupApplication application = subscriptionManagementService.applyToGroup(groupId, authentication.getName());
        return new ResponseEntity<>(application, HttpStatus.CREATED);
    }

    @PostMapping("/{groupId}/applications/{applicationId}/approve")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public GroupApplication approve(@PathVariable Long groupId,
                                    @PathVariable Long applicationId,
                                    Authentication authentication) {
        return subscriptionManagementService.approveApplication(groupId, applicationId, authentication.getName());
    }

    @PostMapping("/{groupId}/applications/{applicationId}/reject")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public GroupApplication reject(@PathVariable Long groupId,
                                   @PathVariable Long applicationId,
                                   Authentication authentication) {
        return subscriptionManagementService.rejectApplication(groupId, applicationId, authentication.getName());
    }

    @PostMapping("/{groupId}/payment/confirm")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public SubscriptionGroup confirmAdminPayment(@PathVariable Long groupId,
                                                 Authentication authentication) {
        return subscriptionManagementService.confirmAdminPayment(groupId, authentication.getName());
    }

    @PostMapping("/{groupId}/applications/{applicationId}/access")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public GroupApplication grantAccess(@PathVariable Long groupId,
                                        @PathVariable Long applicationId,
                                        Authentication authentication) {
        return subscriptionManagementService.grantAccess(groupId, applicationId, authentication.getName());
    }

    @PostMapping("/applications/{applicationId}/pay")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public GroupApplication payApplication(@PathVariable Long applicationId,
                                           Authentication authentication) {
        return subscriptionManagementService.payApplication(applicationId, authentication.getName());
    }

    @PostMapping("/applications/{applicationId}/confirm")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public GroupApplication confirmAccess(@PathVariable Long applicationId,
                                          Authentication authentication) {
        return subscriptionManagementService.confirmAccess(applicationId, authentication.getName());
    }

    @PostMapping("/applications/{applicationId}/withdraw")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public GroupApplication withdraw(@PathVariable Long applicationId,
                                     Authentication authentication) {
        return subscriptionManagementService.withdrawApplication(applicationId, authentication.getName());
    }
}

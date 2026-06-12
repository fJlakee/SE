package pl.dmcs.rkotas.springbootjsp_iwa2026.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.dmcs.rkotas.springbootjsp_iwa2026.message.request.CreateSubscriptionGroupForm;
import pl.dmcs.rkotas.springbootjsp_iwa2026.message.request.SubscriptionServiceForm;
import pl.dmcs.rkotas.springbootjsp_iwa2026.model.ApplicationStatus;
import pl.dmcs.rkotas.springbootjsp_iwa2026.model.GroupApplication;
import pl.dmcs.rkotas.springbootjsp_iwa2026.model.GroupStatus;
import pl.dmcs.rkotas.springbootjsp_iwa2026.model.SubscriptionGroup;
import pl.dmcs.rkotas.springbootjsp_iwa2026.model.SubscriptionService;
import pl.dmcs.rkotas.springbootjsp_iwa2026.model.User;
import pl.dmcs.rkotas.springbootjsp_iwa2026.repository.GroupApplicationRepository;
import pl.dmcs.rkotas.springbootjsp_iwa2026.repository.SubscriptionGroupRepository;
import pl.dmcs.rkotas.springbootjsp_iwa2026.repository.SubscriptionServiceRepository;
import pl.dmcs.rkotas.springbootjsp_iwa2026.repository.UserRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class SubscriptionManagementService {

    private final SubscriptionServiceRepository subscriptionServiceRepository;
    private final SubscriptionGroupRepository subscriptionGroupRepository;
    private final GroupApplicationRepository groupApplicationRepository;
    private final UserRepository userRepository;

    public SubscriptionManagementService(SubscriptionServiceRepository subscriptionServiceRepository,
                                         SubscriptionGroupRepository subscriptionGroupRepository,
                                         GroupApplicationRepository groupApplicationRepository,
                                         UserRepository userRepository) {
        this.subscriptionServiceRepository = subscriptionServiceRepository;
        this.subscriptionGroupRepository = subscriptionGroupRepository;
        this.groupApplicationRepository = groupApplicationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public SubscriptionService createService(SubscriptionServiceForm form) {
        if (subscriptionServiceRepository.existsByNameIgnoreCase(form.getName())) {
            throw new IllegalArgumentException("Service already exists: " + form.getName());
        }

        SubscriptionService subscriptionService = new SubscriptionService();
        subscriptionService.setName(form.getName().trim());
        subscriptionService.setCategory(form.getCategory() == null ? null : form.getCategory().trim());
        return subscriptionServiceRepository.save(subscriptionService);
    }

    @Transactional(readOnly = true)
    public List<SubscriptionService> listServices() {
        return subscriptionServiceRepository.findAll();
    }

    @Transactional
    public SubscriptionGroup createGroup(CreateSubscriptionGroupForm form, String principalIdentifier) {
        User owner = getCurrentUser(principalIdentifier);
        ensureActiveUser(owner);

        SubscriptionService service = subscriptionServiceRepository.findById(form.getServiceId())
                .orElseThrow(() -> new IllegalArgumentException("Service not found: " + form.getServiceId()));

        SubscriptionGroup group = new SubscriptionGroup();
        group.setTitle(form.getTitle().trim());
        group.setService(service);
        group.setOwner(owner);
        group.setTotalSlots(form.getTotalSlots());
        group.setOccupiedSlots(0);
        group.setMonthlyPrice(form.getMonthlyPrice());
        group.setCurrency("PLN");
        group.setStatus(GroupStatus.OPEN);
        return subscriptionGroupRepository.save(group);
    }

    @Transactional(readOnly = true)
    public List<SubscriptionGroup> searchGroups(String serviceName, Integer minAvailableSlots, BigDecimal maxPrice) {
        Integer safeMinSlots = minAvailableSlots == null || minAvailableSlots < 1 ? null : minAvailableSlots;
        BigDecimal safeMaxPrice = maxPrice;
        String safeServiceName = serviceName == null || serviceName.isBlank() ? null : serviceName.trim();
        if (safeServiceName == null) {
            return subscriptionGroupRepository.searchWithoutServiceName(safeMinSlots, safeMaxPrice, List.of(GroupStatus.OPEN));
        }
        return subscriptionGroupRepository.search(safeServiceName, safeMinSlots, safeMaxPrice, List.of(GroupStatus.OPEN));
    }

    @Transactional(readOnly = true)
    public List<SubscriptionGroup> getPublicGroups() {
        return subscriptionGroupRepository.searchWithoutServiceName(null, null, List.of(GroupStatus.OPEN));
    }

    @Transactional(readOnly = true)
    public List<SubscriptionGroup> getMyGroups(String principalIdentifier) {
        User owner = getCurrentUser(principalIdentifier);
        return subscriptionGroupRepository.findByOwnerIdOrderByCreatedAtDesc(owner.getId());
    }

    @Transactional(readOnly = true)
    public List<GroupApplication> getMyApplications(String principalIdentifier) {
        User applicant = getCurrentUser(principalIdentifier);
        return groupApplicationRepository.findByApplicantIdOrderByRequestedAtDesc(applicant.getId());
    }

    @Transactional(readOnly = true)
    public List<GroupApplication> getApplicationsForOwner(String principalIdentifier) {
        User owner = getCurrentUser(principalIdentifier);
        return groupApplicationRepository.findByGroupOwnerIdOrderByRequestedAtDesc(owner.getId());
    }

    @Transactional
    public GroupApplication applyToGroup(Long groupId, String principalIdentifier) {
        User applicant = getCurrentUser(principalIdentifier);
        ensureActiveUser(applicant);

        SubscriptionGroup group = getGroup(groupId);
        if (group.getOwner().getId().equals(applicant.getId())) {
            throw new IllegalArgumentException("Owner cannot join own group.");
        }
        if (group.getStatus() != GroupStatus.OPEN) {
            throw new IllegalArgumentException("Group is not open for applications.");
        }
        if (groupApplicationRepository.existsByGroupIdAndApplicantId(groupId, applicant.getId())) {
            throw new IllegalArgumentException("Application already exists for this user.");
        }

        GroupApplication application = new GroupApplication();
        application.setGroup(group);
        application.setApplicant(applicant);
        application.setStatus(ApplicationStatus.PENDING);
        application.setReservedAmount(group.getMonthlyPrice());
        return groupApplicationRepository.save(application);
    }

    @Transactional
    public GroupApplication approveApplication(Long groupId, Long applicationId, String principalIdentifier) {
        SubscriptionGroup group = getOwnedGroup(groupId, principalIdentifier);
        GroupApplication application = getApplication(applicationId);
        assertSameGroup(group, application);

        if (application.getStatus() != ApplicationStatus.PENDING) {
            throw new IllegalArgumentException("Only pending applications can be approved.");
        }
        if (group.getOccupiedSlots() >= group.getTotalSlots()) {
            throw new IllegalArgumentException("Group is already full.");
        }

        application.setStatus(ApplicationStatus.APPROVED);
        application.setApprovedAt(LocalDateTime.now());
        application.setReservedAmount(group.getMonthlyPrice());
        group.setOccupiedSlots(group.getOccupiedSlots() + 1);
        if (group.getOccupiedSlots() >= group.getTotalSlots()) {
            group.setStatus(GroupStatus.FULL);
        }

        subscriptionGroupRepository.save(group);
        return groupApplicationRepository.save(application);
    }

    @Transactional
    public GroupApplication rejectApplication(Long groupId, Long applicationId, String principalIdentifier) {
        SubscriptionGroup group = getOwnedGroup(groupId, principalIdentifier);
        GroupApplication application = getApplication(applicationId);
        assertSameGroup(group, application);

        if (application.getStatus() != ApplicationStatus.PENDING) {
            throw new IllegalArgumentException("Only pending applications can be rejected.");
        }

        application.setStatus(ApplicationStatus.REJECTED);
        return groupApplicationRepository.save(application);
    }

    @Transactional
    public SubscriptionGroup confirmAdminPayment(Long groupId, String principalIdentifier) {
        SubscriptionGroup group = getOwnedGroup(groupId, principalIdentifier);
        if (group.getStatus() == GroupStatus.ACTIVE) {
            return group;
        }
        if (group.getOccupiedSlots() != group.getTotalSlots()) {
            throw new IllegalArgumentException("All slots must be filled before payment confirmation.");
        }
        if (group.getStatus() == GroupStatus.BLOCKED || group.getStatus() == GroupStatus.SETTLED) {
            throw new IllegalArgumentException("Group is no longer active.");
        }

        LocalDateTime now = LocalDateTime.now();
        List<GroupApplication> applications = groupApplicationRepository.findByGroupId(groupId);
        boolean allApprovedGuestsPaid = applications.stream()
                .filter(app -> app.getStatus() == ApplicationStatus.APPROVED)
                .allMatch(app -> app.getGuestPaidAt() != null);
        if (!allApprovedGuestsPaid) {
            throw new IllegalArgumentException("All approved guests must pay before owner confirms subscription payment.");
        }

        group.setStatus(GroupStatus.ACTIVE);
        group.setPaymentConfirmedAt(now);
        group.setFreezeUntil(now.plusDays(7));

        for (GroupApplication application : applications) {
            if (application.getStatus() == ApplicationStatus.APPROVED) {
                if (application.getFreezeUntil() == null || application.getFreezeUntil().isAfter(group.getFreezeUntil())) {
                    application.setFreezeUntil(group.getFreezeUntil());
                }
                groupApplicationRepository.save(application);
            }
        }

        subscriptionGroupRepository.save(group);
        return group;
    }

    @Transactional
    public GroupApplication grantAccess(Long groupId, Long applicationId, String principalIdentifier) {
        SubscriptionGroup group = getOwnedGroup(groupId, principalIdentifier);
        GroupApplication application = getApplication(applicationId);
        assertSameGroup(group, application);

        if (application.getStatus() == ApplicationStatus.ACCESS_GRANTED
                || application.getStatus() == ApplicationStatus.CONFIRMED) {
            return application;
        }
        if (group.getStatus() != GroupStatus.ACTIVE) {
            throw new IllegalArgumentException("Group must be active before access is granted.");
        }
        if (application.getStatus() != ApplicationStatus.APPROVED) {
            throw new IllegalArgumentException("Only approved applications can receive access.");
        }
        if (application.getGuestPaidAt() == null) {
            throw new IllegalArgumentException("Guest must pay before access can be granted.");
        }

        LocalDateTime now = LocalDateTime.now();
        application.setStatus(ApplicationStatus.ACCESS_GRANTED);
        application.setAccessGrantedAt(now);
        application.setAdminPayoutAt(now);
        return groupApplicationRepository.save(application);
    }

    @Transactional
    public GroupApplication payApplication(Long applicationId, String principalIdentifier) {
        User applicant = getCurrentUser(principalIdentifier);
        GroupApplication application = getApplication(applicationId);
        if (!application.getApplicant().getId().equals(applicant.getId())) {
            throw new AccessDeniedException("You can pay only for your own application.");
        }
        if (application.getGuestPaidAt() != null) {
            return application;
        }
        if (application.getStatus() != ApplicationStatus.APPROVED) {
            throw new IllegalArgumentException("Only approved applications can be paid.");
        }
        if (application.getGroup().getPaymentConfirmedAt() != null) {
            throw new IllegalArgumentException("Payment is disabled after owner confirmed subscription payment.");
        }

        LocalDateTime now = LocalDateTime.now();
        application.setGuestPaidAt(now);
        application.setFreezeUntil(now.plusDays(7));
        return groupApplicationRepository.save(application);
    }

    @Transactional
    public GroupApplication confirmAccess(Long applicationId, String principalIdentifier) {
        User applicant = getCurrentUser(principalIdentifier);
        GroupApplication application = getApplication(applicationId);
        if (!application.getApplicant().getId().equals(applicant.getId())) {
            throw new AccessDeniedException("You can confirm only your own application.");
        }
        if (application.getStatus() != ApplicationStatus.ACCESS_GRANTED) {
            throw new IllegalArgumentException("Access must be granted before confirmation.");
        }

        application.setStatus(ApplicationStatus.CONFIRMED);
        application.setConfirmedAt(LocalDateTime.now());
        GroupApplication saved = groupApplicationRepository.save(application);
        settleGroupIfPossible(saved.getGroup());
        return saved;
    }

    @Transactional
    public GroupApplication withdrawApplication(Long applicationId, String principalIdentifier) {
        User applicant = getCurrentUser(principalIdentifier);
        GroupApplication application = getApplication(applicationId);
        if (!application.getApplicant().getId().equals(applicant.getId())) {
            throw new AccessDeniedException("You can withdraw only your own application.");
        }
        SubscriptionGroup group = application.getGroup();
        if (group.getPaymentConfirmedAt() == null) {
            if (application.getStatus() != ApplicationStatus.PENDING
                    && application.getStatus() != ApplicationStatus.APPROVED) {
                throw new IllegalArgumentException("Only pending or approved applications can be withdrawn before payment.");
            }
            releaseSlotIfNeeded(group, application);
            if (application.getGuestPaidAt() != null) {
                application.setRefundedAt(LocalDateTime.now());
            }
            application.setStatus(ApplicationStatus.CANCELLED);
            application.setWithdrawReason("Withdrawn by applicant before payment confirmation.");
            return groupApplicationRepository.save(application);
        }

        if (application.getStatus() != ApplicationStatus.ACCESS_GRANTED
                && application.getStatus() != ApplicationStatus.CONFIRMED
                && application.getAdminPayoutAt() == null) {
            throw new IllegalArgumentException("Withdrawal is disabled until subscription access is granted.");
        }

        releaseSlotIfNeeded(group, application);
        application.setStatus(ApplicationStatus.LEFT);
        application.setWithdrawReason("Left after fake payout was transferred to the group owner.");
        return groupApplicationRepository.save(application);
    }

    @Transactional(readOnly = true)
    public SubscriptionGroup getGroupDetails(Long groupId) {
        return getGroup(groupId);
    }

    @Transactional(readOnly = true)
    public List<GroupApplication> getGroupApplications(Long groupId) {
        return groupApplicationRepository.findByGroupId(groupId);
    }

    @Transactional
    @Scheduled(fixedDelay = 3600000)
    public void settleExpiredGroups() {
        List<SubscriptionGroup> activeGroups = subscriptionGroupRepository.findAll();
        LocalDateTime now = LocalDateTime.now();
        for (SubscriptionGroup group : activeGroups) {
            if (group.getStatus() == GroupStatus.ACTIVE && group.getFreezeUntil() != null && group.getFreezeUntil().isBefore(now)) {
                settleGroupIfPossible(group);
            }
        }

        List<GroupApplication> expiredPaidApplications =
                groupApplicationRepository.findByStatusAndFreezeUntilBefore(ApplicationStatus.APPROVED, now);
        for (GroupApplication application : expiredPaidApplications) {
            if (application.getGuestPaidAt() != null && application.getAdminPayoutAt() == null) {
                refundExpiredGuestPayment(application);
            }
        }
    }

    private void settleGroupIfPossible(SubscriptionGroup group) {
        if (group.getStatus() != GroupStatus.ACTIVE) {
            return;
        }

        List<GroupApplication> applications = groupApplicationRepository.findByGroupId(group.getId());
        boolean freezeExpired = group.getFreezeUntil() != null && group.getFreezeUntil().isBefore(LocalDateTime.now());
        if (!freezeExpired) {
            return;
        }

        if (applications.stream().anyMatch(app -> app.getStatus() == ApplicationStatus.APPROVED)) {
            refundUnservedApplications(group, applications);
            blockAdmin(group.getOwner(), "Subscription access was not delivered within the freeze window.");
            group.setStatus(GroupStatus.BLOCKED);
            subscriptionGroupRepository.save(group);
            return;
        }

        boolean allDelivered = !applications.isEmpty()
                && applications.stream()
                .filter(this::countsAsReservedSlot)
                .allMatch(app -> app.getStatus() == ApplicationStatus.ACCESS_GRANTED
                        || app.getStatus() == ApplicationStatus.CONFIRMED);
        if (allDelivered) {
            fakePayoutToOwner(group, applications);
        }
    }

    private void fakePayoutToOwner(SubscriptionGroup group, List<GroupApplication> applications) {
        LocalDateTime payoutTime = LocalDateTime.now();
        for (GroupApplication application : applications) {
            if (application.getStatus() == ApplicationStatus.ACCESS_GRANTED
                    || application.getStatus() == ApplicationStatus.CONFIRMED) {
                application.setAdminPayoutAt(payoutTime);
                groupApplicationRepository.save(application);
            }
        }
        group.setStatus(GroupStatus.SETTLED);
        subscriptionGroupRepository.save(group);
    }

    private void refundExpiredGuestPayment(GroupApplication application) {
        SubscriptionGroup group = application.getGroup();
        releaseSlotIfNeeded(group, application);
        application.setStatus(ApplicationStatus.REFUNDED);
        application.setRefundedAt(LocalDateTime.now());
        application.setWithdrawReason("Fake guest payment was refunded after the 7-day hold expired.");
        groupApplicationRepository.save(application);
    }

    private void refundUnservedApplications(SubscriptionGroup group, List<GroupApplication> applications) {
        LocalDateTime now = LocalDateTime.now();
        for (GroupApplication application : applications) {
            if (application.getStatus() == ApplicationStatus.APPROVED) {
                application.setStatus(ApplicationStatus.REFUNDED);
                application.setRefundedAt(now);
                groupApplicationRepository.save(application);
            }
        }
        group.setOccupiedSlots((int) applications.stream()
                .filter(app -> app.getStatus() == ApplicationStatus.CONFIRMED || app.getStatus() == ApplicationStatus.ACCESS_GRANTED)
                .count());
        subscriptionGroupRepository.save(group);
    }

    private void releaseSlotIfNeeded(SubscriptionGroup group, GroupApplication application) {
        if (countsAsReservedSlot(application)) {
            group.setOccupiedSlots(Math.max(0, group.getOccupiedSlots() - 1));
            if (group.getStatus() == GroupStatus.FULL) {
                group.setStatus(GroupStatus.OPEN);
            }
            subscriptionGroupRepository.save(group);
        }
    }

    private boolean countsAsReservedSlot(GroupApplication application) {
        return application.getStatus() == ApplicationStatus.APPROVED
                || application.getStatus() == ApplicationStatus.ACCESS_GRANTED
                || application.getStatus() == ApplicationStatus.CONFIRMED;
    }

    private SubscriptionGroup getOwnedGroup(Long groupId, String principalIdentifier) {
        User owner = getCurrentUser(principalIdentifier);
        ensureActiveUser(owner);
        return subscriptionGroupRepository.findByIdAndOwnerId(groupId, owner.getId())
                .orElseThrow(() -> new IllegalArgumentException("Group not found or not owned by current admin."));
    }

    private SubscriptionGroup getGroup(Long groupId) {
        return subscriptionGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found: " + groupId));
    }

    private GroupApplication getApplication(Long applicationId) {
        return groupApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found: " + applicationId));
    }

    private void assertSameGroup(SubscriptionGroup group, GroupApplication application) {
        if (!group.getId().equals(application.getGroup().getId())) {
            throw new IllegalArgumentException("Application does not belong to the selected group.");
        }
    }

    private User getCurrentUser(String principalIdentifier) {
        return userRepository.findByPassportNumberOrPhoneNumber(principalIdentifier, principalIdentifier)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + principalIdentifier));
    }

    private void ensureActiveUser(User user) {
        if (user.isBlocked()) {
            throw new AccessDeniedException("User account is blocked.");
        }
    }

    private void blockAdmin(User admin, String reason) {
        admin.setBlocked(true);
        admin.setBlockedReason(reason);
        admin.setBlockedAt(LocalDateTime.now());
        userRepository.save(admin);
    }

}

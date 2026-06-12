package pl.dmcs.rkotas.springbootjsp_iwa2026.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "group_applications")
public class GroupApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private SubscriptionGroup group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User applicant;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status = ApplicationStatus.PENDING;

    @Column(name = "reserved_amount", precision = 12, scale = 2)
    private BigDecimal reservedAmount;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt = LocalDateTime.now();

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "guest_paid_at")
    private LocalDateTime guestPaidAt;

    @Column(name = "access_granted_at")
    private LocalDateTime accessGrantedAt;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @Column(name = "refunded_at")
    private LocalDateTime refundedAt;

    @Column(name = "freeze_until")
    private LocalDateTime freezeUntil;

    @Column(name = "admin_payout_at")
    private LocalDateTime adminPayoutAt;

    @Column(name = "withdraw_reason")
    private String withdrawReason;

    public GroupApplication() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public SubscriptionGroup getGroup() {
        return group;
    }

    public void setGroup(SubscriptionGroup group) {
        this.group = group;
    }

    public User getApplicant() {
        return applicant;
    }

    public void setApplicant(User applicant) {
        this.applicant = applicant;
    }

    public ApplicationStatus getStatus() {
        return status;
    }

    public void setStatus(ApplicationStatus status) {
        this.status = status;
    }

    public BigDecimal getReservedAmount() {
        return reservedAmount;
    }

    public void setReservedAmount(BigDecimal reservedAmount) {
        this.reservedAmount = reservedAmount;
    }

    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(LocalDateTime requestedAt) {
        this.requestedAt = requestedAt;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }

    public LocalDateTime getGuestPaidAt() {
        return guestPaidAt;
    }

    public void setGuestPaidAt(LocalDateTime guestPaidAt) {
        this.guestPaidAt = guestPaidAt;
    }

    public LocalDateTime getAccessGrantedAt() {
        return accessGrantedAt;
    }

    public void setAccessGrantedAt(LocalDateTime accessGrantedAt) {
        this.accessGrantedAt = accessGrantedAt;
    }

    public LocalDateTime getConfirmedAt() {
        return confirmedAt;
    }

    public void setConfirmedAt(LocalDateTime confirmedAt) {
        this.confirmedAt = confirmedAt;
    }

    public LocalDateTime getRefundedAt() {
        return refundedAt;
    }

    public void setRefundedAt(LocalDateTime refundedAt) {
        this.refundedAt = refundedAt;
    }

    public LocalDateTime getFreezeUntil() {
        return freezeUntil;
    }

    public void setFreezeUntil(LocalDateTime freezeUntil) {
        this.freezeUntil = freezeUntil;
    }

    public LocalDateTime getAdminPayoutAt() {
        return adminPayoutAt;
    }

    public void setAdminPayoutAt(LocalDateTime adminPayoutAt) {
        this.adminPayoutAt = adminPayoutAt;
    }

    public String getWithdrawReason() {
        return withdrawReason;
    }

    public void setWithdrawReason(String withdrawReason) {
        this.withdrawReason = withdrawReason;
    }
}

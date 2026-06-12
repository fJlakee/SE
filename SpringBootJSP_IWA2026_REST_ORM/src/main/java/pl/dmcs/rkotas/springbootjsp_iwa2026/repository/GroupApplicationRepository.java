package pl.dmcs.rkotas.springbootjsp_iwa2026.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.dmcs.rkotas.springbootjsp_iwa2026.model.ApplicationStatus;
import pl.dmcs.rkotas.springbootjsp_iwa2026.model.GroupApplication;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface GroupApplicationRepository extends JpaRepository<GroupApplication, Long> {
    Optional<GroupApplication> findByGroupIdAndApplicantId(Long groupId, Long applicantId);
    List<GroupApplication> findByGroupId(Long groupId);
    List<GroupApplication> findByApplicantIdOrderByRequestedAtDesc(Long applicantId);
    List<GroupApplication> findByGroupOwnerIdOrderByRequestedAtDesc(Long ownerId);
    boolean existsByGroupIdAndApplicantId(Long groupId, Long applicantId);
    List<GroupApplication> findByStatusAndFreezeUntilBefore(ApplicationStatus status, LocalDateTime before);
    List<GroupApplication> findByStatusInAndFreezeUntilBefore(List<ApplicationStatus> statuses, LocalDateTime before);
}

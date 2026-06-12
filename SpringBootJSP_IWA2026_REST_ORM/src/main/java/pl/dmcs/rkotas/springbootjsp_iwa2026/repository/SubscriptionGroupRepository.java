package pl.dmcs.rkotas.springbootjsp_iwa2026.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pl.dmcs.rkotas.springbootjsp_iwa2026.model.GroupStatus;
import pl.dmcs.rkotas.springbootjsp_iwa2026.model.SubscriptionGroup;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionGroupRepository extends JpaRepository<SubscriptionGroup, Long> {
    Optional<SubscriptionGroup> findByIdAndOwnerId(Long id, Long ownerId);

    @Query("""
            select g from SubscriptionGroup g
            where lower(g.service.name) like lower(concat('%', :serviceName, '%'))
              and (:minAvailableSlots is null or (g.totalSlots - g.occupiedSlots) >= :minAvailableSlots)
              and (:maxPrice is null or g.monthlyPrice <= :maxPrice)
              and g.status in :statuses
            order by g.createdAt desc
            """)
    List<SubscriptionGroup> search(@Param("serviceName") String serviceName,
                                   @Param("minAvailableSlots") Integer minAvailableSlots,
                                   @Param("maxPrice") BigDecimal maxPrice,
                                   @Param("statuses") List<GroupStatus> statuses);

    @Query("""
            select g from SubscriptionGroup g
            where (:minAvailableSlots is null or (g.totalSlots - g.occupiedSlots) >= :minAvailableSlots)
              and (:maxPrice is null or g.monthlyPrice <= :maxPrice)
              and g.status in :statuses
            order by g.createdAt desc
            """)
    List<SubscriptionGroup> searchWithoutServiceName(@Param("minAvailableSlots") Integer minAvailableSlots,
                                                     @Param("maxPrice") BigDecimal maxPrice,
                                                     @Param("statuses") List<GroupStatus> statuses);

    List<SubscriptionGroup> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
}

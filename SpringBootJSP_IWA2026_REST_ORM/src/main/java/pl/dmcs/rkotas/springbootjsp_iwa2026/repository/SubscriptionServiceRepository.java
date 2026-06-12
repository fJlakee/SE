package pl.dmcs.rkotas.springbootjsp_iwa2026.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.dmcs.rkotas.springbootjsp_iwa2026.model.SubscriptionService;

import java.util.Optional;

@Repository
public interface SubscriptionServiceRepository extends JpaRepository<SubscriptionService, Long> {
    Optional<SubscriptionService> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
}

package pl.dmcs.rkotas.springbootjsp_iwa2026.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.dmcs.rkotas.springbootjsp_iwa2026.model.User;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByPassportNumber(String passportNumber);
    Optional<User> findByPhoneNumber(String phoneNumber);
    Optional<User> findByPassportNumberOrPhoneNumber(String passportNumber, String phoneNumber);
    boolean existsByPassportNumber(String passportNumber);
    boolean existsByPhoneNumber(String phoneNumber);
    boolean existsByPassportNumberOrPhoneNumber(String passportNumber, String phoneNumber);
}

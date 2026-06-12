package pl.dmcs.rkotas.springbootjsp_iwa2026;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import pl.dmcs.rkotas.springbootjsp_iwa2026.repository.SubscriptionServiceRepository;
import pl.dmcs.rkotas.springbootjsp_iwa2026.repository.UserRepository;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class SharingBackendApplicationTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubscriptionServiceRepository subscriptionServiceRepository;

    @Test
    void contextLoadsAndSeedsData() {
        assertTrue(userRepository.existsByPassportNumber("ADMIN-0001"));
        assertTrue(subscriptionServiceRepository.existsByNameIgnoreCase("Spotify"));
    }
}

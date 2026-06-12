package pl.dmcs.rkotas.springbootjsp_iwa2026.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import pl.dmcs.rkotas.springbootjsp_iwa2026.model.Role;
import pl.dmcs.rkotas.springbootjsp_iwa2026.model.RoleName;
import pl.dmcs.rkotas.springbootjsp_iwa2026.model.User;
import pl.dmcs.rkotas.springbootjsp_iwa2026.repository.RoleRepository;
import pl.dmcs.rkotas.springbootjsp_iwa2026.repository.UserRepository;

import java.util.HashSet;
import java.util.Set;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           RoleRepository roleRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!userRepository.existsByPassportNumber("ADMIN-0001")) {
            User admin = new User(
                    "System Admin",
                    "ADMIN-0001",
                    "+1000000000",
                    passwordEncoder.encode("Admin123!")
            );

            Set<Role> roles = new HashSet<>();
            roles.add(roleRepository.findByName(RoleName.ROLE_USER)
                    .orElseThrow(() -> new IllegalStateException("Missing ROLE_USER")));
            roles.add(roleRepository.findByName(RoleName.ROLE_ADMIN)
                    .orElseThrow(() -> new IllegalStateException("Missing ROLE_ADMIN")));
            admin.setRoles(roles);
            userRepository.save(admin);
        }
    }
}

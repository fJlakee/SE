package pl.dmcs.rkotas.springbootjsp_iwa2026.controllers;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.dmcs.rkotas.springbootjsp_iwa2026.message.request.LoginForm;
import pl.dmcs.rkotas.springbootjsp_iwa2026.message.request.SignUpForm;
import pl.dmcs.rkotas.springbootjsp_iwa2026.message.response.JwtResponse;
import pl.dmcs.rkotas.springbootjsp_iwa2026.message.response.ResponseMessage;
import pl.dmcs.rkotas.springbootjsp_iwa2026.model.Role;
import pl.dmcs.rkotas.springbootjsp_iwa2026.model.RoleName;
import pl.dmcs.rkotas.springbootjsp_iwa2026.model.User;
import pl.dmcs.rkotas.springbootjsp_iwa2026.repository.RoleRepository;
import pl.dmcs.rkotas.springbootjsp_iwa2026.repository.UserRepository;
import pl.dmcs.rkotas.springbootjsp_iwa2026.security.jwt.JwtProvider;
import pl.dmcs.rkotas.springbootjsp_iwa2026.security.services.UserPrinciple;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "*", maxAge = 3600)
@RequestMapping("/auth")
public class AuthRESTController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    public AuthRESTController(AuthenticationManager authenticationManager,
                              UserRepository userRepository,
                              RoleRepository roleRepository,
                              PasswordEncoder passwordEncoder,
                              JwtProvider jwtProvider) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtProvider = jwtProvider;
    }

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginForm loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getIdentifier(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = jwtProvider.generateJwtToken(authentication);
        UserPrinciple userDetails = (UserPrinciple) authentication.getPrincipal();

        String roles = userDetails.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .collect(Collectors.joining(","));

        return ResponseEntity.ok(new JwtResponse(
                jwt,
                userDetails.getUsername(),
                userDetails.getFullName(),
                userDetails.isBlocked(),
                roles
        ));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignUpForm signUpRequest) {
        if (userRepository.existsByPassportNumber(signUpRequest.getPassportNumber())) {
            return new ResponseEntity<>(
                    new ResponseMessage("Fail -> Passport number is already registered."),
                    HttpStatus.BAD_REQUEST
            );
        }

        if (userRepository.existsByPhoneNumber(signUpRequest.getPhoneNumber())) {
            return new ResponseEntity<>(
                    new ResponseMessage("Fail -> Phone number is already registered."),
                    HttpStatus.BAD_REQUEST
            );
        }

        User user = new User(
                signUpRequest.getFullName(),
                signUpRequest.getPassportNumber(),
                signUpRequest.getPhoneNumber(),
                passwordEncoder.encode(signUpRequest.getPassword())
        );

        Set<Role> roles = new HashSet<>();
        roles.add(getRole(RoleName.ROLE_USER));
        user.setRoles(roles);
        userRepository.save(user);

        return new ResponseEntity<>(
                new ResponseMessage("User registered successfully."),
                HttpStatus.OK
        );
    }

    private Role getRole(RoleName roleName) {
        return roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
    }
}

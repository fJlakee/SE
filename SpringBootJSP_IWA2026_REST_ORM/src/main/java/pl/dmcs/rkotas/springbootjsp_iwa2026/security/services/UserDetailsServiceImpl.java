package pl.dmcs.rkotas.springbootjsp_iwa2026.security.services;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.dmcs.rkotas.springbootjsp_iwa2026.model.User;
import pl.dmcs.rkotas.springbootjsp_iwa2026.repository.UserRepository;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByPassportNumberOrPhoneNumber(username, username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
        return UserPrinciple.build(user);
    }
}

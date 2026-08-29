package com.mpc.auth.service;

import com.mpc.auth.web.dto.LoginRequest;
import com.mpc.auth.web.dto.LoginResponse;
import com.mpc.auth.web.dto.RegisterRequest;
import com.mpc.user.domain.User;
import com.mpc.user.repository.UserRepository;
import com.mpc.user.service.UserService;
import com.mpc.user.web.dto.CreateUserRequest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserService userService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserService userService,
                       UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public void register(RegisterRequest request) {
        CreateUserRequest createUserRequest = new CreateUserRequest();
        createUserRequest.setUsername(request.getName());
        createUserRequest.setEmail(request.getEmail());
        createUserRequest.setPassword(request.getPassword());
        userService.create(createUserRequest);
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        return new LoginResponse(jwtService.generateToken(user), "Bearer");
    }
}
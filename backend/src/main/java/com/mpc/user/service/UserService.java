package com.mpc.user.service;

import com.mpc.user.domain.User;
import com.mpc.user.exception.DuplicateUserException;
import com.mpc.user.exception.UserNotFoundException;
import com.mpc.user.repository.UserRepository;
import com.mpc.user.web.dto.CreateUserRequest;
import com.mpc.user.web.dto.UpdateUserRequest;
import com.mpc.user.web.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        return userRepository.findAll().stream()
                .map(UserMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserResponse findById(Long id) {
        return UserMapper.toResponse(getUser(id));
    }

    @Transactional
    public UserResponse create(CreateUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateUserException("Username already taken: " + request.getUsername());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateUserException("Email already registered: " + request.getEmail());
        }
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();
        return UserMapper.toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse update(Long id, UpdateUserRequest request) {
        User user = getUser(id);
        if (request.getUsername() != null && !request.getUsername().equals(user.getUsername())) {
            if (userRepository.existsByUsernameAndIdNot(request.getUsername(), id)) {
                throw new DuplicateUserException("Username already taken: " + request.getUsername());
            }
            user.setUsername(request.getUsername());
        }
        if (request.getEmail() != null && !request.getEmail().equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmailAndIdNot(request.getEmail(), id)) {
                throw new DuplicateUserException("Email already registered: " + request.getEmail());
            }
            user.setEmail(request.getEmail());
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }
        return UserMapper.toResponse(userRepository.save(user));
    }

    @Transactional
    public void delete(Long id) {
        if (!userRepository.existsById(id)) {
            throw new UserNotFoundException(id);
        }
        userRepository.deleteById(id);
    }

    private User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
    }
}

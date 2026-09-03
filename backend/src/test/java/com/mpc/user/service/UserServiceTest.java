package com.mpc.user.service;

import com.mpc.analysis.repository.AnalysisRepository;
import com.mpc.user.exception.UserNotFoundException;
import com.mpc.user.repository.UserRepository;
import com.mpc.user.web.dto.CreateUserRequest;
import com.mpc.user.web.dto.UpdateUserRequest;
import com.mpc.user.web.dto.UserResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class UserServiceTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AnalysisRepository analysisRepository;

    @BeforeEach
    void clean() {
        analysisRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void createFindUpdateDelete() {
        CreateUserRequest create = new CreateUserRequest();
        create.setUsername("alice");
        create.setEmail("alice@example.com");
        create.setPassword("secret123");

        UserResponse created = userService.create(create);
        assertThat(created.getId()).isNotNull();
        assertThat(created.getUsername()).isEqualTo("alice");

        UserResponse fetched = userService.findById(created.getId());
        assertThat(fetched.getEmail()).isEqualTo("alice@example.com");

        UpdateUserRequest update = new UpdateUserRequest();
        update.setUsername("alice2");
        UserResponse updated = userService.update(created.getId(), update);
        assertThat(updated.getUsername()).isEqualTo("alice2");

        userService.delete(created.getId());
        assertThatThrownBy(() -> userService.findById(created.getId()))
                .isInstanceOf(UserNotFoundException.class);
    }
}

package org.cfs.Ecomm.service;

import org.cfs.Ecomm.model.User;
import org.cfs.Ecomm.repo.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    // Register user
    public User registerUser(User user) {
        User newUser = userRepository.save(user);
        System.out.println("User added");
        return newUser;
    }

    // Login user
    public User loginUser(String email, String password) {
        User user = userRepository.findByEmail(email);

        if (user != null && user.getPassword().equals(password)) {
            return user;
        }

        return null;
    }

    // Get all users
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
}
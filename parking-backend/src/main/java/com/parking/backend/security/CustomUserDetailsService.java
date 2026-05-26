package com.parking.backend.security;

import com.parking.backend.model.entity.Account;
import com.parking.backend.repository.AccountRepository;
import com.parking.backend.repository.RolePermissionRepository;
import com.parking.backend.repository.UserPermissionRepository;
import com.parking.backend.model.entity.RolePermission;
import com.parking.backend.model.entity.UserPermission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private RolePermissionRepository rolePermissionRepository;

    @Autowired
    private UserPermissionRepository userPermissionRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Account account = accountRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        if ("Banned".equalsIgnoreCase(account.getStatus())) {
            throw new RuntimeException("Account is banned");
        }

        String roleName = account.getRole().toUpperCase();
        String roleCode = roleName.startsWith("ROLE_") ? roleName : "ROLE_" + roleName;

        List<SimpleGrantedAuthority> authorities = new java.util.ArrayList<>();
        authorities.add(new SimpleGrantedAuthority(roleCode));

        // Load Micro-permissions from Role
        List<RolePermission> rolePerms = rolePermissionRepository.findBySystemRole_RoleCode(roleName.replace("ROLE_", ""));
        for (RolePermission rp : rolePerms) {
            authorities.add(new SimpleGrantedAuthority(rp.getPermission().getPermissionCode()));
        }

        // Load Micro-permissions from User-specific mappings
        List<UserPermission> userPerms = userPermissionRepository.findByAccount_AccountId(account.getAccountId());
        for (UserPermission up : userPerms) {
            authorities.add(new SimpleGrantedAuthority(up.getPermission().getPermissionCode()));
        }

        return new org.springframework.security.core.userdetails.User(
                account.getUsername(),
                account.getPasswordHash(),
                authorities
        );
    }
}

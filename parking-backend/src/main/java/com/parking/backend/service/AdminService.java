package com.parking.backend.service;

import com.parking.backend.model.dto.AccountCreateRequest;
import com.parking.backend.model.dto.AccountUpdateRequest;
import com.parking.backend.model.entity.Account;
import com.parking.backend.model.entity.ParkingBuilding;
import com.parking.backend.model.entity.SystemRole;
import com.parking.backend.model.entity.UserFacilityMapping;
import com.parking.backend.repository.AccountRepository;
import com.parking.backend.repository.ParkingBuildingRepository;
import com.parking.backend.repository.UserFacilityMappingRepository;
import com.parking.backend.security.TokenBlacklist;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final AccountRepository accountRepository;
    private final UserFacilityMappingRepository userFacilityMappingRepository;
    private final ParkingBuildingRepository buildingRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenBlacklist tokenBlacklist;

    public List<Account> getAllUsers() {
        List<Account> users = accountRepository.findAll();
        for (Account user : users) {
            if ("STAFF".equalsIgnoreCase(user.getRole()) || "MANAGER".equalsIgnoreCase(user.getRole())) {
                userFacilityMappingRepository.findByAccount_AccountId(user.getAccountId())
                        .ifPresent(mapping -> user.setBuildingId(mapping.getBuilding().getBuildingId()));
            }
        }
        return users;
    }

    @Transactional(rollbackFor = Exception.class)
    public Account createUser(AccountCreateRequest request) {
        if (accountRepository.findByUsername(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email (Username) already exists in the system.");
        }

        String randomPassword = UUID.randomUUID().toString().substring(0, 8);
        String hashedPassword = passwordEncoder.encode(randomPassword);

        Account account = Account.builder()
                .username(request.getEmail()) // Username is Email
                .email(request.getEmail())
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .passwordHash(hashedPassword)
                .systemRole(SystemRole.builder().roleCode(request.getRole().toUpperCase()).build())
                .status("Active")
                .build();

        account = accountRepository.save(account);

        if ("STAFF".equalsIgnoreCase(request.getRole()) || "MANAGER".equalsIgnoreCase(request.getRole())) {
            if (request.getBuildingId() == null) {
                throw new IllegalArgumentException("Assigned Building is required for Staff and Manager.");
            }
            ParkingBuilding building = buildingRepository.findById(request.getBuildingId())
                    .orElseThrow(() -> new RuntimeException("Building ID not found: " + request.getBuildingId()));

            UserFacilityMapping mapping = UserFacilityMapping.builder()
                    .account(account)
                    .building(building)
                    .build();
            userFacilityMappingRepository.save(mapping);
        }

        // In reality, we would send an email with randomPassword here.
        System.out.println("Created User: " + account.getUsername() + " | Password: " + randomPassword);

        return account;
    }

    @Transactional(rollbackFor = Exception.class)
    public Account updateUser(Integer targetAccountId, AccountUpdateRequest request) {
        Account account = accountRepository.findById(targetAccountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        if (request.getFullName() != null) account.setFullName(request.getFullName());
        if (request.getPhoneNumber() != null) account.setPhoneNumber(request.getPhoneNumber());

        accountRepository.save(account);

        // Relocation Logic
        if (request.getBuildingId() != null && 
           ("STAFF".equalsIgnoreCase(account.getRole()) || "MANAGER".equalsIgnoreCase(account.getRole()))) {
            
            ParkingBuilding newBuilding = buildingRepository.findById(request.getBuildingId())
                    .orElseThrow(() -> new RuntimeException("Building not found"));

            userFacilityMappingRepository.deleteByAccount_AccountId(account.getAccountId());
            
            UserFacilityMapping newMapping = UserFacilityMapping.builder()
                    .account(account)
                    .building(newBuilding)
                    .build();
            userFacilityMappingRepository.save(newMapping);
        }

        return account;
    }

    @Transactional(rollbackFor = Exception.class)
    public void suspendAccount(Integer requesterId, Integer targetAccountId, String reason) {
        if (requesterId.equals(targetAccountId)) {
            throw new IllegalStateException("Anti-Self-Lock: You cannot suspend your own account.");
        }

        Account targetAccount = accountRepository.findById(targetAccountId)
                .orElseThrow(() -> new RuntimeException("Target account not found"));

        targetAccount.setStatus("Banned");
        accountRepository.save(targetAccount);

        // Evict immediately
        tokenBlacklist.suspendAccount(targetAccount.getUsername());
    }
}

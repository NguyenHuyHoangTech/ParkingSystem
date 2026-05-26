package com.parking.backend.config;

import com.parking.backend.model.entity.*;
import com.parking.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataSeeder {

    @Autowired private AccountRepository accountRepository;
    @Autowired private VehicleTypeRepository vehicleTypeRepository;
    @Autowired private FloorRepository floorRepository;

    @Autowired private SlotRepository slotRepository;
    @Autowired private PricingPolicyRepository pricingPolicyRepository;
    @Autowired private VehiclePricingRuleRepository vehiclePricingRuleRepository;
    @Autowired private PricingBlockRepository pricingBlockRepository;
    @Autowired private SystemConfigurationRepository systemConfigurationRepository;
    @Autowired private PenaltyRuleRepository penaltyRuleRepository;
    @Autowired private ParkingBuildingRepository parkingBuildingRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private SystemRoleRepository systemRoleRepository;
    @Autowired private GateRepository gateRepository;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seed() {
        // 1. System Roles
        if (systemRoleRepository.count() == 0) {
            systemRoleRepository.save(SystemRole.builder().roleCode("ROLE_ADMIN").roleName("Administrator").build());
            systemRoleRepository.save(SystemRole.builder().roleCode("ROLE_MANAGER").roleName("Manager").build());
            systemRoleRepository.save(SystemRole.builder().roleCode("ROLE_STAFF").roleName("Staff").build());
            systemRoleRepository.save(SystemRole.builder().roleCode("ROLE_USER").roleName("Customer").build());
        }

        // 2. Default Accounts
        if (accountRepository.count() == 0) {
            SystemRole adminRole = systemRoleRepository.findById("ROLE_ADMIN").get();
            SystemRole managerRole = systemRoleRepository.findById("ROLE_MANAGER").get();
            SystemRole staffRole = systemRoleRepository.findById("ROLE_STAFF").get();
            SystemRole userRole = systemRoleRepository.findById("ROLE_USER").get();

            accountRepository.save(Account.builder()
                    .username("admin").passwordHash(passwordEncoder.encode("admin123"))
                    .systemRole(adminRole).status("Active").build());
            accountRepository.save(Account.builder()
                    .username("manager").passwordHash(passwordEncoder.encode("manager123"))
                    .systemRole(managerRole).status("Active").build());
            accountRepository.save(Account.builder()
                    .username("staff").passwordHash(passwordEncoder.encode("staff123"))
                    .systemRole(staffRole).status("Active").build());
            accountRepository.save(Account.builder()
                    .username("user").passwordHash(passwordEncoder.encode("user123"))
                    .systemRole(userRole).status("Active").build());
        }

        // 3. Vehicle Types
        if (vehicleTypeRepository.count() == 0) {
            VehicleType bicycle = vehicleTypeRepository.save(VehicleType.builder()
                    .typeName("Bicycle").sizeMultiplier(0.3).status("Active")
                    .gridWidth(1).gridHeight(1).build());
            VehicleType motorbike = vehicleTypeRepository.save(VehicleType.builder()
                    .typeName("Motorbike").sizeMultiplier(0.5).status("Active")
                    .gridWidth(1).gridHeight(2).build());
            VehicleType car = vehicleTypeRepository.save(VehicleType.builder()
                    .typeName("Car").sizeMultiplier(1.0).status("Active")
                    .gridWidth(2).gridHeight(4).build());
            // 4. Floors & Slots
            if (floorRepository.count() == 0) {
                Account managerAcc = accountRepository.findByUsername("manager").orElse(null);
                ParkingBuilding mainBuilding = parkingBuildingRepository.save(ParkingBuilding.builder()
                        .name("Main Building").address("123 Main St")
                        .manager(managerAcc)
                        .status("Active").build());

                Floor f1 = floorRepository.save(Floor.builder().floorName("Floor 1 (Transient)").status("Active").parkingBuilding(mainBuilding).build());
                Floor f2 = floorRepository.save(Floor.builder().floorName("Floor 2 (Booking)").status("Active").parkingBuilding(mainBuilding).build());

                for (int i = 1; i <= 5; i++) {
                    slotRepository.save(Slot.builder()
                            .slotName("A-0" + i).floor(f1)
                            .posX(i * 2).posY(2).status("Available").allowPreBooking(false).vehicleType(car).build());
                }
                for (int i = 1; i <= 5; i++) {
                    slotRepository.save(Slot.builder()
                            .slotName("B-0" + i).floor(f2)
                            .posX(i * 2).posY(2).status("Available").allowPreBooking(true).vehicleType(car).build());
                }
            }
        }

        // 5. Gates
        if (gateRepository.count() == 0) {
            ParkingBuilding mainBuilding = parkingBuildingRepository.findAll().get(0);
            gateRepository.save(Gate.builder().gateName("Main Gate IN").gateType("IN").building(mainBuilding).build());
            gateRepository.save(Gate.builder().gateName("Main Gate OUT").gateType("OUT").building(mainBuilding).build());
        }

        // 6. Default Penalty Rules
        if (penaltyRuleRepository.count() == 0) {
            penaltyRuleRepository.save(PenaltyRule.builder()
                    .ruleType("lost_card").fineAmount(100000.0)
                    .description("Fine when customer loses parking card").build());
            penaltyRuleRepository.save(PenaltyRule.builder()
                    .ruleType("damaged_card").fineAmount(50000.0)
                    .description("Fine when customer damages parking card").build());
            penaltyRuleRepository.save(PenaltyRule.builder()
                    .ruleType("wrong_zone").fineAmount(200000.0)
                    .description("Fine when vehicle parks in wrong area").build());
            penaltyRuleRepository.save(PenaltyRule.builder()
                    .ruleType("overtime").fineAmount(50000.0)
                    .description("Fine when vehicle exceeds allowed parking time").build());
            penaltyRuleRepository.save(PenaltyRule.builder()
                    .ruleType("unpaid_vehicle").fineAmount(0.0)
                    .description("Manual override for unpaid vehicles").build());
        }
        // 7. System Configurations
        if (!systemConfigurationRepository.existsById("SYS_MAINTENANCE_MODE")) {
            systemConfigurationRepository.save(SystemConfiguration.builder()
                    .configKey("SYS_MAINTENANCE_MODE").configValue("false").dataType("BOOLEAN")
                    .description("Enable system maintenance mode").category("System").build());
        }
        if (!systemConfigurationRepository.existsById("PAYPAL_CLIENT_ID")) {
            systemConfigurationRepository.save(SystemConfiguration.builder()
                    .configKey("PAYPAL_CLIENT_ID").configValue("AZHnPqQNeqh_XWk2roSfJqxopRTPF7Dq8kcjYcTfjJMpvbHnsdoAHFjsOwlSSq-FvCRlX09KhGgDuyxB").dataType("STRING")
                    .description("PayPal Client ID for transactions").category("Payment").build());
        }
        if (!systemConfigurationRepository.existsById("PAYPAL_SECRET_KEY")) {
            systemConfigurationRepository.save(SystemConfiguration.builder()
                    .configKey("PAYPAL_SECRET_KEY").configValue("placeholder").dataType("STRING")
                    .description("PayPal Secret Key (keep secure)").category("Payment").build());
        }
        if (!systemConfigurationRepository.existsById("GMAIL_ADDRESS")) {
            systemConfigurationRepository.save(SystemConfiguration.builder()
                    .configKey("GMAIL_ADDRESS").configValue("placeholder@gmail.com").dataType("STRING")
                    .description("System Gmail Address").category("System").build());
        }
        if (!systemConfigurationRepository.existsById("GMAIL_APP_PASSWORD")) {
            systemConfigurationRepository.save(SystemConfiguration.builder()
                    .configKey("GMAIL_APP_PASSWORD").configValue("placeholder").dataType("STRING")
                    .description("Gmail App Password").category("System").build());
        }
        
        // Ensure all buildings have a manager assigned
        Account managerAcc = accountRepository.findByUsername("manager").orElse(null);
        if (managerAcc != null) {
            java.util.List<ParkingBuilding> buildings = parkingBuildingRepository.findAll();
            for (ParkingBuilding b : buildings) {
                if (b.getManager() == null) {
                    b.setManager(managerAcc);
                    parkingBuildingRepository.save(b);
                }
            }
        }
    }
}

package com.parking.backend.controller;

import com.parking.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import org.springframework.web.multipart.MultipartFile;
import com.parking.backend.repository.ParkingSessionRepository;
import com.parking.backend.repository.BookingRepository;
import com.parking.backend.repository.FloorRepository;
import com.parking.backend.repository.VehicleTypeRepository;
import com.parking.backend.repository.AccountRepository;
import com.parking.backend.model.entity.Booking;
import com.parking.backend.model.entity.Floor;
import com.parking.backend.model.entity.VehicleType;
import com.parking.backend.model.entity.Account;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/public/iot")
@RequiredArgsConstructor
public class IoTController {

    private final NotificationService notificationService;
    private final ParkingSessionRepository sessionRepository;
    private final BookingRepository bookingRepository;
    private final FloorRepository floorRepository;
    private final VehicleTypeRepository vehicleTypeRepository;
    private final AccountRepository accountRepository;
    private final com.parking.backend.service.TimeService timeService;
    private final java.util.concurrent.ConcurrentHashMap<String, Long> rejectedPlates = new java.util.concurrent.ConcurrentHashMap<>();

    @PostMapping("/camera/reject")
    public ResponseEntity<?> rejectCameraEntry(@RequestParam("plate") String plate) {
        rejectedPlates.put(plate, System.currentTimeMillis());
        return ResponseEntity.ok(Map.of("message", "Rejected " + plate));
    }

    @PostMapping("/time/add-hours")
    public ResponseEntity<?> addHours(@RequestParam long hours) {
        timeService.addHours(hours);
        return ResponseEntity.ok(Map.of("message", "Added " + hours + " hours. Current simulated time is " + timeService.now()));
    }

    @PostMapping("/time/reset")
    public ResponseEntity<?> resetTime() {
        timeService.reset();
        return ResponseEntity.ok(Map.of("message", "Time reset to real time: " + timeService.now()));
    }

    @GetMapping("/camera/check-status")
    public ResponseEntity<?> checkStatus(
            @RequestParam("plate") String plate,
            @RequestParam("type") String type) {
        
        if ("entry".equalsIgnoreCase(type)) {
            if (rejectedPlates.containsKey(plate)) {
                rejectedPlates.remove(plate);
                return ResponseEntity.ok(Map.of("confirmed", false, "rejected", true));
            }
            var sessionOpt = sessionRepository.findByLicensePlateInAndStatus(plate, "Active");
            if (sessionOpt.isPresent()) {
                var session = sessionOpt.get();
                String slotName = session.getSlot() != null ? session.getSlot().getSlotName() : "";
                String floorName = session.getSlot() != null && session.getSlot().getFloor() != null ? session.getSlot().getFloor().getFloorName() : "";
                String cardCode = session.getCardCode() != null ? session.getCardCode() : "";
                return ResponseEntity.ok(Map.of("confirmed", true, "rejected", false, "slotName", slotName, "floorName", floorName, "cardCode", cardCode));
            }
            return ResponseEntity.ok(Map.of("confirmed", false, "rejected", false));
        } else {
            var recentSessions = sessionRepository.findRecentSessionsByPlateAndStatus(plate, "Completed");
            var completedSession = recentSessions.stream().findFirst();
            boolean isExited = false;
            if (completedSession.isPresent()) {
                java.time.LocalDateTime timeOut = completedSession.get().getTimeOut();
                if (timeOut != null && java.time.temporal.ChronoUnit.MINUTES.between(timeOut, java.time.LocalDateTime.now()) < 5) {
                    isExited = true;
                }
            }
            return ResponseEntity.ok(Map.of("confirmed", isExited));
        }
    }

    @PostMapping("/create-dummy-booking")
    public ResponseEntity<?> createDummyBooking(@RequestParam("plate") String plate) {
        Account dummyUser = accountRepository.findById(2).orElse(null); // Assuming 2 is a user
        if (dummyUser == null) {
            var accounts = accountRepository.findAll();
            if (!accounts.isEmpty()) dummyUser = accounts.get(0);
        }
        Floor floor = floorRepository.findAll().stream().findFirst().orElseThrow();
        VehicleType type = vehicleTypeRepository.findById(1).orElseThrow();

        Booking booking = Booking.builder()
                .account(dummyUser)
                .vehicleType(type)
                .floor(floor)
                .licensePlate(plate)
                .startTime(LocalDateTime.now())
                .endTime(LocalDateTime.now().plusHours(2))
                .status("Confirmed")
                .totalFee(50000.0)
                .build();
        bookingRepository.save(booking);
        return ResponseEntity.ok(Map.of("message", "Dummy booking created for plate " + plate));
    }

    @PostMapping("/camera/entry")
    public ResponseEntity<?> handleCameraEntry(
            @RequestParam("plate") String plate,
            @RequestParam(value = "typeId", required = false) Integer typeId,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        
        String imageUrl = saveImage(image);
        Map<String, Object> payload = Map.of(
                "plate", plate,
                "typeId", typeId != null ? typeId : 1,
                "imageUrl", imageUrl != null ? imageUrl : "",
                "timestamp", System.currentTimeMillis()
        );
        
        notificationService.broadcast("CAMERA_ENTRY", payload);
        return ResponseEntity.ok(Map.of("message", "Camera entry event received", "data", payload));
    }

    @PostMapping("/camera/exit")
    public ResponseEntity<?> handleCameraExit(
            @RequestParam("plate") String plate,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        
        String imageUrl = saveImage(image);
        Map<String, Object> payload = Map.of(
                "plate", plate,
                "imageUrl", imageUrl != null ? imageUrl : "",
                "timestamp", System.currentTimeMillis()
        );
        
        notificationService.broadcast("CAMERA_EXIT", payload);
        return ResponseEntity.ok(Map.of("message", "Camera exit event received", "data", payload));
    }

    private String saveImage(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            return null;
        }
        try {
            java.nio.file.Path uploadDir = java.nio.file.Paths.get("uploads");
            if (!java.nio.file.Files.exists(uploadDir)) {
                java.nio.file.Files.createDirectories(uploadDir);
            }
            
            String originalFilename = image.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            } else {
                extension = ".jpg";
            }
            
            String newFilename = java.util.UUID.randomUUID().toString() + extension;
            java.nio.file.Path filePath = uploadDir.resolve(newFilename);
            image.transferTo(filePath.toAbsolutePath().toFile());
            
            // Assuming backend runs on port 8080. If needed, can be relative URL and frontend handles it.
            // Using relative URL: /uploads/filename
            return "http://localhost:8080/uploads/" + newFilename;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}

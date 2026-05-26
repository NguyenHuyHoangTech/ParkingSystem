package com.parking.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.parking.backend.model.dto.FeedbackCreateRequest;
import com.parking.backend.model.entity.Account;
import com.parking.backend.model.entity.Booking;
import com.parking.backend.model.entity.ParkingBuilding;
import com.parking.backend.model.entity.ParkingSession;
import com.parking.backend.model.entity.UserFeedbackTicket;
import com.parking.backend.repository.AccountRepository;
import com.parking.backend.repository.BookingRepository;
import com.parking.backend.repository.ParkingBuildingRepository;
import com.parking.backend.repository.ParkingSessionRepository;
import com.parking.backend.repository.UserFeedbackTicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final UserFeedbackTicketRepository ticketRepository;
    private final AccountRepository accountRepository;
    private final ParkingBuildingRepository buildingRepository;
    private final ParkingSessionRepository sessionRepository;
    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;
    private final TimeService timeService;
    private final ObjectMapper objectMapper;

    @Transactional(rollbackFor = Exception.class)
    public UserFeedbackTicket createFeedback(Integer accountId, FeedbackCreateRequest request) {
        // Spam prevention
        long openTickets = ticketRepository.countByAccount_AccountIdAndStatus(accountId, "OPEN");
        if (openTickets >= 3) {
            throw new RuntimeException("Bạn đang có quá nhiều yêu cầu chờ xử lý. Vui lòng chờ phản hồi trước khi gửi thêm.");
        }

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        ParkingBuilding building = buildingRepository.findById(request.getBuildingId())
                .orElseThrow(() -> new RuntimeException("Building not found"));

        ParkingSession session = null;
        if (request.getSessionId() != null) {
            session = sessionRepository.findById(request.getSessionId()).orElse(null);
        }

        Booking booking = null;
        if (request.getBookingId() != null) {
            booking = bookingRepository.findById(request.getBookingId()).orElse(null);
            
            // Logic: Update Booking Status if SLOT_OCCUPIED
            if (booking != null && "SLOT_OCCUPIED".equalsIgnoreCase(request.getIssueCategory())) {
                booking.setStatus("ISSUE_REPORTED");
                bookingRepository.save(booking);
            }
        }

        String imagesJson = "[]";
        try {
            if (request.getEvidenceImages() != null && !request.getEvidenceImages().isEmpty()) {
                imagesJson = objectMapper.writeValueAsString(request.getEvidenceImages());
            }
        } catch (JsonProcessingException e) {
            // Ignore
        }

        UserFeedbackTicket ticket = UserFeedbackTicket.builder()
                .account(account)
                .building(building)
                .session(session)
                .booking(booking)
                .issueCategory(request.getIssueCategory())
                .description(request.getDescription())
                .evidenceImages(imagesJson)
                .status("OPEN")
                .createdAt(timeService.now())
                .build();

        ticket = ticketRepository.save(ticket);

        // Broadcast to Staff if urgent
        if ("SLOT_OCCUPIED".equalsIgnoreCase(request.getIssueCategory()) || "CAR_LOCATING".equalsIgnoreCase(request.getIssueCategory())) {
            notificationService.broadcast("INCIDENT_ALERT", 
                "URGENT: " + request.getIssueCategory() + " reported at Building ID: " + building.getBuildingId() + ". Ticket ID: " + ticket.getTicketId());
        }

        return ticket;
    }

    public List<UserFeedbackTicket> getMyFeedbacks(Integer accountId) {
        return ticketRepository.findByAccount_AccountIdOrderByCreatedAtDesc(accountId);
    }
}

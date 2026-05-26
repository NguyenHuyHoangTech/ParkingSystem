package com.parking.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableScheduling
@EnableCaching
public class ParkingBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(ParkingBackendApplication.class, args);
	}

}

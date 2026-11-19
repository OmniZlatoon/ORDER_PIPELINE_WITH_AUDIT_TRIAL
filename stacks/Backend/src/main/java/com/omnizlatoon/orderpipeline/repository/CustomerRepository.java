package com.omnizlatoon.orderpipeline.repository;

import com.omnizlatoon.orderpipeline.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
}

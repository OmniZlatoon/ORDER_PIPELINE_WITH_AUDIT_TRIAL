package com.omnizlatoon.orderpipeline.service;

import com.omnizlatoon.orderpipeline.dto.BookResponse;
import com.omnizlatoon.orderpipeline.repository.BookRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BookService {
    private final BookRepository bookRepository;

    public BookService(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    @Transactional(readOnly = true)
    public List<BookResponse> listBooks() {
        return bookRepository.findAllByOrderByIdAsc()
                .stream()
                .map(BookResponse::from)
                .toList();
    }
}

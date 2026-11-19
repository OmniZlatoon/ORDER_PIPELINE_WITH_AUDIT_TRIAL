package com.omnizlatoon.orderpipeline.dto;

import com.omnizlatoon.orderpipeline.entity.Book;

import java.math.BigDecimal;

public record BookResponse(Long id, String title, String author, BigDecimal price, int stockQuantity) {
    public static BookResponse from(Book book) {
        return new BookResponse(
                book.getId(),
                book.getTitle(),
                book.getAuthor(),
                book.getPrice(),
                book.getStockQuantity()
        );
    }
}

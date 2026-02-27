package com.pigbit.core.service;

import com.pigbit.application.dto.ProductRequest;
import com.pigbit.application.dto.ProductResponse;
import com.pigbit.application.exception.NotFoundException;
import com.pigbit.core.model.Product;
import com.pigbit.core.model.User;
import com.pigbit.infrastructure.persistence.ProductRepository;
import com.pigbit.infrastructure.persistence.UserRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public ProductResponse create(ProductRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
        Product product = Product.builder()
                .user(user)
                .name(request.name())
                .description(request.description())
                .priceBrl(request.priceBrl())
                .build();

        return mapToResponse(productRepository.save(product));
    }

    public List<ProductResponse> listByUserId(Long userId) {
        return productRepository.findByUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ProductResponse> listByUserEmail(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
        return listByUserId(user.getId());
    }

    public ProductResponse getById(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
        Product product = productRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new NotFoundException("Produto não encontrado"));
        return mapToResponse(product);
    }

    public ProductResponse update(Long id, ProductRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
        Product product = productRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new NotFoundException("Produto não encontrado"));

        product.setName(request.name());
        product.setDescription(request.description());
        product.setPriceBrl(request.priceBrl());
        return mapToResponse(productRepository.save(product));
    }

    public void delete(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
        Product product = productRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new NotFoundException("Produto não encontrado"));
        // Soft delete via @SQLDelete
        productRepository.delete(product);
    }

    private ProductResponse mapToResponse(Product p) {
        return new ProductResponse(p.getId(), p.getName(), p.getDescription(), p.getPriceBrl(), p.getCreatedAt());
    }
}

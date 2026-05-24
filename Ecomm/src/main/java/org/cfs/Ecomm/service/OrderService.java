package org.cfs.Ecomm.service;

import org.cfs.Ecomm.dto.OrderDTO;
import org.cfs.Ecomm.dto.OrderItemDTO;
import org.cfs.Ecomm.model.*;
import org.cfs.Ecomm.repo.OrderRepository;
import org.cfs.Ecomm.repo.ProductRepository;
import org.cfs.Ecomm.repo.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class OrderService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    // Place Order
    public OrderDTO placeOrder(Long userId,
                               Map<Long, Integer> productQuantities,
                               double totalAmount) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Orders order = new Orders();
        order.setUser(user);
        order.setOrderDate(new Date());
        order.setStatus("Pending");
        order.setTotalAmount(totalAmount);

        List<OrderItem> orderItems = new ArrayList<>();
        List<OrderItemDTO> orderItemDTOs = new ArrayList<>();

        for (Map.Entry<Long, Integer> entry : productQuantities.entrySet()) {

            Product product = productRepository.findById(entry.getKey())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(entry.getValue());
            orderItem.setPrice(product.getPrice());

            orderItems.add(orderItem);

            orderItemDTOs.add(new OrderItemDTO(
                    product.getName(),
                    product.getPrice(),
                    entry.getValue()
            ));
        }

        order.setOrderItems(orderItems);
        orderRepository.save(order);

        return new OrderDTO(
                order.getId(),
                order.getTotalAmount(),
                order.getStatus(),
                order.getOrderDate(),
                user.getName(),
                user.getEmail(),
                orderItemDTOs
        );
    }

    // Get all orders
    public List<OrderDTO> getAllOrders() {
        List<Orders> orders = orderRepository.findAllOrdersWithUsers();

        return orders.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Convert Entity to DTO
    private OrderDTO convertToDTO(Orders orders) {

        List<OrderItemDTO> orderItems = orders.getOrderItems()
                .stream()
                .map(item -> new OrderItemDTO(
                        item.getProduct().getName(),
                        item.getProduct().getPrice(),
                        item.getQuantity()
                ))
                .collect(Collectors.toList());

        return new OrderDTO(
                orders.getId(),
                orders.getTotalAmount(),
                orders.getStatus(),
                orders.getOrderDate(),
                orders.getUser() != null ? orders.getUser().getName() : "Unknown",
                orders.getUser() != null ? orders.getUser().getEmail() : "Unknown",
                orderItems
        );
    }

    // Get orders by user
    public List<OrderDTO> getOrderByUser(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Orders> ordersList = orderRepository.findByUser(user);

        return ordersList.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
}
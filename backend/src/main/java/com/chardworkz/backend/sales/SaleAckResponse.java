package com.chardworkz.backend.sales;

import java.util.UUID;

public record SaleAckResponse(UUID id, boolean alreadySynced) {}

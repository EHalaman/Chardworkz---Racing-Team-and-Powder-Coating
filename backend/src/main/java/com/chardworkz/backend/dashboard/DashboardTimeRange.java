package com.chardworkz.backend.dashboard;

/** Range selector for {@code GET /api/dashboard/analytics} - also controls the trend chart's bucket granularity (hourly/daily/daily/monthly respectively). */
public enum DashboardTimeRange {
    TODAY,
    WEEK,
    MONTH,
    YTD
}

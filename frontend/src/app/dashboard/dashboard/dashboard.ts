import { Component } from '@angular/core';
import { ChartConfiguration } from 'chart.js';

interface KpiCard {
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
  caption: string;
}

interface FeedItem {
  icon: 'add' | 'box' | 'check' | 'undo' | 'alert' | 'clock' | 'warning' | 'pending';
  color: 'primary' | 'secondary' | 'danger';
  title: string;
  subtitle: string;
}

interface Recommendation {
  name: string;
  id: string;
  price: string;
  orders: number;
}

/**
 * Mock/demo data throughout - no backend wired up yet (Q1/Q2/Q12 in
 * docs/project-initiation-draft.md are still open, and no schema exists).
 * Replace with real API calls once the backend has real endpoints.
 */
@Component({
  selector: 'app-dashboard',
  standalone: false,
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  readonly kpiCards: KpiCard[] = [
    {
      label: 'Total Products',
      value: '2,343',
      trend: '+35%',
      trendUp: true,
      caption: 'From last month',
    },
    {
      label: 'Total Stock Value',
      value: '₱20,343',
      trend: '+40%',
      trendUp: true,
      caption: 'From last month',
    },
    {
      label: 'Low Stock Items',
      value: '103',
      trend: '-50%',
      trendUp: false,
      caption: 'From last month',
    },
  ];

  readonly salesGoalPercent = 71.3;
  readonly numberOfSales = '1,233';
  readonly totalSales = '₱15,233';

  readonly recentActivities: FeedItem[] = [
    {
      icon: 'add',
      color: 'primary',
      title: 'Stock Added',
      subtitle: '200 units of Motor Oil 20W-40 added',
    },
    {
      icon: 'box',
      color: 'secondary',
      title: 'Shipment Received',
      subtitle: 'Shipment from ABC Motor Supply',
    },
    {
      icon: 'check',
      color: 'primary',
      title: 'Order Processed',
      subtitle: 'Order #1024 has been processed',
    },
    {
      icon: 'undo',
      color: 'danger',
      title: 'Return Processed',
      subtitle: 'Return #RMA1023 has been processed',
    },
  ];

  readonly alerts: FeedItem[] = [
    {
      icon: 'alert',
      color: 'danger',
      title: 'Out of Stock Alert',
      subtitle: '12 items are out of stock',
    },
    {
      icon: 'clock',
      color: 'secondary',
      title: 'Expiring Soon',
      subtitle: '6 items are expiring soon',
    },
    {
      icon: 'warning',
      color: 'secondary',
      title: 'Low Stock Alert',
      subtitle: '48 items are running low',
    },
    {
      icon: 'pending',
      color: 'primary',
      title: 'Pending Orders',
      subtitle: '24 orders are pending',
    },
  ];

  readonly recommendations: Recommendation[] = [
    { name: 'Motor Oil 20W-40', id: 'RT15567663', price: '₱450', orders: 24 },
    { name: 'Brake Pad Set', id: 'RT15266730', price: '₱850', orders: 18 },
    { name: 'Spark Plug (4pc)', id: 'RT15247890', price: '₱320', orders: 15 },
  ];

  readonly barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    datasets: [
      {
        data: [24, 33, 29, 20, 34, 18, 29, 23, 31],
        label: 'Stock In',
        backgroundColor: '#3FA485',
        borderRadius: 4,
      },
      {
        data: [18, 22, 15, 25, 19, 27, 21, 17, 24],
        label: 'Stock Out',
        backgroundColor: '#E2B24A',
        borderRadius: 4,
      },
      {
        data: [30, 28, 32, 26, 37, 20, 33, 25, 35],
        label: 'Stock Value',
        backgroundColor: '#E87351',
        borderRadius: 4,
      },
    ],
  };

  readonly barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#9CA3AF' } },
      y: { grid: { color: 'rgba(148, 163, 184, 0.15)' }, ticks: { color: '#9CA3AF' } },
    },
  };

  readonly doughnutChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Achieved', 'Remaining'],
    datasets: [
      {
        data: [this.salesGoalPercent, 100 - this.salesGoalPercent],
        backgroundColor: ['#3FA485', '#E5E7EB'],
        borderWidth: 0,
      },
    ],
  };

  readonly doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
  };
}

import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder',
  standalone: false,
  styleUrl: './placeholder.css',
  templateUrl: './placeholder.html',
})
export class Placeholder {
  readonly title: string;

  constructor(private route: ActivatedRoute) {
    this.title = this.route.snapshot.data['title'] ?? 'Untitled page';
  }
}

import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { HistoryApiService } from '../../core/services/history.service';
import Chart from 'chart.js/auto';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-test-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-10 max-w-[1200px] mx-auto text-text-primary page-container" *ngIf="query.data()?.data as test">
      <button class="bg-transparent border-none text-text-secondary cursor-pointer p-0 mb-6 text-sm hover:text-text-primary transition-colors" (click)="goBack()">← Back to History</button>
      
      <div class="mb-8">
        <div class="flex items-center gap-3 mb-2">
          <span class="font-mono text-[11px] uppercase py-1 px-2 rounded" [ngClass]="getMethodClass(test.config.method)">{{ test.config.method }}</span>
          <h1 class="m-0 text-2xl font-mono">{{ test.name || 'Untitled Test' }}</h1>
        </div>
        <div class="font-mono text-[13px] text-text-secondary">{{ test.config.url }}</div>
      </div>

      <div class="grid grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div class="bg-surface border border-border-default rounded-lg p-5 border-t-3 border-t-accent">
          <div class="font-mono text-[32px] font-variant-numeric tabular-nums leading-tight">{{ test.results.total }}</div>
          <div class="text-xs uppercase text-text-secondary mt-1">Total requests</div>
        </div>
        <div class="bg-surface border border-border-default rounded-lg p-5 border-t-3 border-t-success">
          <div class="font-mono text-[32px] font-variant-numeric tabular-nums leading-tight">{{ test.results.success }}</div>
          <div class="text-xs uppercase text-text-secondary mt-1">Successful</div>
        </div>
        <div class="bg-surface border border-border-default rounded-lg p-5 border-t-3 border-t-error">
          <div class="font-mono text-[32px] font-variant-numeric tabular-nums leading-tight">{{ test.results.failed }}</div>
          <div class="text-xs uppercase text-text-secondary mt-1">Failed</div>
        </div>
        <div class="bg-surface border border-border-default rounded-lg p-5 border-t-3 border-t-accent">
          <div class="font-mono text-[32px] font-variant-numeric tabular-nums leading-tight">{{ test.results.avgResponseTime | number:'1.0-0' }}</div>
          <div class="text-xs uppercase text-text-secondary mt-1">Avg time (ms)</div>
        </div>
        <div class="bg-surface border border-border-default rounded-lg p-5 border-t-3 border-t-accent">
          <div class="font-mono text-[32px] font-variant-numeric tabular-nums leading-tight">{{ test.results.minResponseTime | number:'1.0-0' }}</div>
          <div class="text-xs uppercase text-text-secondary mt-1">Min time (ms)</div>
        </div>
        <div class="bg-surface border border-border-default rounded-lg p-5 border-t-3 border-t-accent">
          <div class="font-mono text-[32px] font-variant-numeric tabular-nums leading-tight">{{ test.results.maxResponseTime | number:'1.0-0' }}</div>
          <div class="text-xs uppercase text-text-secondary mt-1">Max time (ms)</div>
        </div>
      </div>

      <div class="flex flex-col gap-5 mb-8">
        <div class="bg-surface border border-border-default rounded-[10px] p-5 relative min-h-[250px] flex justify-center items-center">
          <canvas #lineChart class="w-full max-h-[300px]"></canvas>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-5">
          <div class="bg-surface border border-border-default rounded-[10px] p-5 relative min-h-[250px] flex justify-center items-center">
             <canvas #donutChart class="w-full max-h-[300px]"></canvas>
          </div>
          <div class="bg-surface border border-border-default rounded-[10px] p-5 relative min-h-[250px] flex justify-center items-center">
             <canvas #barChart class="w-full max-h-[300px]"></canvas>
          </div>
        </div>
      </div>

      <div class="bg-surface border border-border-default rounded-[10px] p-6 mb-8">
        <h3 class="m-0 mb-4 font-mono text-lg">Error Log</h3>
        <table class="w-full border-collapse text-left" *ngIf="test.results.errors?.length > 0; else noErrors">
          <thead>
            <tr>
              <th class="text-text-secondary text-xs uppercase py-3 border-b border-border-strong">#</th>
              <th class="text-text-secondary text-xs uppercase py-3 border-b border-border-strong">Status Code</th>
              <th class="text-text-secondary text-xs uppercase py-3 border-b border-border-strong">Error</th>
              <th class="text-text-secondary text-xs uppercase py-3 border-b border-border-strong">Response Time</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let err of paginatedErrors(test.results.errors)">
              <td class="font-mono py-3 border-b border-dashed border-border-default text-sm">{{ err.requestNumber }}</td>
              <td class="py-3 border-b border-dashed border-border-default text-sm">
                <span [class]="getStatusClass(err.statusCode)" class="px-2 py-1 rounded font-mono text-xs">
                  {{ err.statusCode }}
                </span>
              </td>
              <td class="py-3 border-b border-dashed border-border-default text-sm">{{ err.message }}</td>
              <td class="font-mono py-3 border-b border-dashed border-border-default text-sm">{{ err.responseTime | number:'1.0-0' }} ms</td>
            </tr>
          </tbody>
        </table>
        
        <div class="flex gap-4 items-center justify-center mt-5" *ngIf="test.results.errors?.length > 10">
           <button class="bg-elevated border border-border-default text-text-primary px-3 py-1 rounded cursor-pointer disabled:opacity-50" (click)="errorPage = errorPage - 1" [disabled]="errorPage === 1">Prev</button>
           <span class="text-sm">Page {{ errorPage }}</span>
           <button class="bg-elevated border border-border-default text-text-primary px-3 py-1 rounded cursor-pointer disabled:opacity-50" (click)="errorPage = errorPage + 1" [disabled]="errorPage * 10 >= test.results.errors.length">Next</button>
        </div>

        <ng-template #noErrors>
          <div class="p-10 text-center color-text-secondary italic">No errors recorded during this test!</div>
        </ng-template>
      </div>

      <div class="flex justify-start">
         <button class="primary-btn !w-auto" (click)="reRun(test)">Re-run this Test</button>
      </div>
    </div>
    
    <div class="p-10 max-w-[1200px] mx-auto" *ngIf="query.isPending()">
       <div class="bg-surface rounded-[10px] animate-pulse border border-border-default h-[400px]"></div>
    </div>
  `,
  styles: []
})
export class TestDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private historyService = inject(HistoryApiService);

  @ViewChild('lineChart') lineChartRef!: ElementRef;
  @ViewChild('donutChart') donutChartRef!: ElementRef;
  @ViewChild('barChart') barChartRef!: ElementRef;

  errorPage = 1;
  id = this.route.snapshot.paramMap.get('id')!;

  query = injectQuery(() => ({
    queryKey: ['history', this.id],
    queryFn: () => lastValueFrom(this.historyService.getTestById(this.id))
  }));

  ngOnInit() {
    this.setupChartsWhenReady();
  }
  
  setupChartsWhenReady() {
    const check = setInterval(() => {
      const response = this.query.data();
      const data = response?.data;
      if (data && this.lineChartRef) {
         clearInterval(check);
         this.renderCharts(data);
      }
    }, 100);
  }

  renderCharts(test: any) {
    const timeline = test.results.timeline || [];
    
    new Chart(this.lineChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: timeline.map((t: any) => t.requestNumber.toString()),
        datasets: [{
          label: 'Response Time (ms)',
          data: timeline.map((t: any) => t.responseTime),
          borderColor: '#6e6eff',
          backgroundColor: 'rgba(110, 110, 255, 0.15)',
          fill: true,
          tension: 0.1,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
          y: { grid: { color: 'rgba(255, 255, 255, 0.05)' } }
        }
      }
    });

    new Chart(this.donutChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Success', 'Failed'],
        datasets: [{
          data: [test.results.success, test.results.failed],
          backgroundColor: ['#23d18b', '#f87171'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: { legend: { position: 'bottom', labels: { color: '#8888aa' } } }
      }
    });

    new Chart(this.barChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: timeline.slice(0, 50).map((t: any) => t.requestNumber.toString()),
        datasets: [{
          label: 'Response Time (Preview)',
          data: timeline.slice(0, 50).map((t: any) => t.responseTime),
          backgroundColor: 'rgba(110, 110, 255, 0.7)',
          borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 }
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { display: false },
          y: { grid: { color: 'rgba(255, 255, 255, 0.05)' } }
        }
      }
    });
  }

  paginatedErrors(errors: any[] = []) {
    const start = (this.errorPage - 1) * 10;
    return errors.slice(start, start + 10);
  }

  getStatusClass(code: number) {
    if (code >= 200 && code < 300) return 'bg-[#23d18b1a] text-success';
    if (code >= 400 && code < 500) return 'bg-[#fbbf241a] text-[#fbbf24]';
    return 'bg-[#f871711a] text-error';
  }

  getMethodClass(method: string) {
    switch(method) {
      case 'GET': return 'bg-[#1a3a2a] text-[#23d18b]';
      case 'POST': return 'bg-[#1a2a3a] text-[#60a5fa]';
      case 'PUT': return 'bg-[#2a2a1a] text-[#fbbf24]';
      case 'DELETE': return 'bg-[#2a1a1a] text-[#f87171]';
      case 'PATCH': return 'bg-[#2a1a2a] text-[#c084fc]';
      default: return 'bg-[#1a3a2a] text-[#23d18b]';
    }
  }

  goBack() {
    this.router.navigate(['/history']);
  }

  reRun(test: any) {
    this.router.navigate(['/dashboard'], { state: { config: test.config } });
  }
}

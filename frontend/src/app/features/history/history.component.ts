import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { HistoryApiService } from '../../core/services/history.service';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="px-6 py-10 page-container">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 class="text-3xl font-bold m-0 mb-2 text-text-primary tracking-tight">Test History</h1>
          <p class="text-text-secondary m-0 text-sm font-medium">{{ query.data()?.data?.total || 0 }} total simulations recorded</p>
        </div>
        
        <div class="flex gap-1.5 p-1 bg-surface border border-border-default rounded-xl w-fit">
          <button class="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all" [ngClass]="filter() === 'all' ? 'bg-elevated text-text-primary border border-border-strong shadow-sm' : 'text-text-muted hover:text-text-secondary'" (click)="filter.set('all')">All</button>
          <button class="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all" [ngClass]="filter() === 'completed' ? 'bg-elevated text-text-primary border border-border-strong shadow-sm' : 'text-text-muted hover:text-text-secondary'" (click)="filter.set('completed')">Completed</button>
          <button class="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all" [ngClass]="filter() === 'failed' ? 'bg-elevated text-text-primary border border-border-strong shadow-sm' : 'text-text-muted hover:text-text-secondary'" (click)="filter.set('failed')">Failed</button>
        </div>
      </div>

      <div *ngIf="query.isPending()" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="h-[180px] bg-surface/50 border border-border-default rounded-xl animate-pulse" *ngFor="let i of [1,2,3,4,5,6]"></div>
      </div>

      <div *ngIf="query.isError()" class="text-center p-20 glass rounded-2xl border border-dashed border-border-default">
        <div class="text-3xl mb-4">⚠️</div>
        <h3 class="text-text-primary m-0 mb-2">Sync Error</h3>
        <p class="text-text-secondary m-0 text-sm">Failed to retrieve simulation records.</p>
        <button class="ghost-btn mt-6" (click)="query.refetch()">Retry Sync</button>
      </div>

      <div *ngIf="query.isSuccess() && filteredTests().length === 0" class="text-center p-20 glass rounded-2xl border border-dashed border-border-default">
        <div class="text-4xl mb-4 opacity-50">📁</div>
        <h3 class="text-text-primary m-0 mb-2">Vault Empty</h3>
        <p class="text-text-secondary m-0 text-sm">You haven't executed any load simulations yet.</p>
        <button class="primary-btn mt-8 !w-auto" (click)="router.navigate(['/dashboard'])">Launch First Test</button>
      </div>

      <div *ngIf="query.isSuccess() && filteredTests().length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          class="glow-card glass p-6 cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] flex flex-col gap-5 border-l-2"
          [attr.data-status]="test.status"
          *ngFor="let test of filteredTests(); let i = index"
          [style.animation-delay]="(i * 40) + 'ms'"
          (click)="openDetail(test._id)"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex flex-col gap-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="method-badge" [attr.data-method]="test.config.method">{{ test.config.method }}</span>
                <span class="font-mono text-text-primary font-bold truncate">{{ test.name || 'Untitled_Project' }}</span>
              </div>
              <div class="text-[11px] text-text-muted truncate font-mono">{{ test.config.url }}</div>
            </div>
            
            <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-variant border border-border-default h-fit">
              <span class="w-1.5 h-1.5 rounded-full" [ngClass]="{
                'bg-success': test.status === 'completed',
                'bg-error': test.status === 'failed',
                'bg-border-strong': test.status === 'stopped',
                'bg-accent': test.status === 'running'
              }"></span>
              <span class="text-[10px] font-bold uppercase tracking-tight text-text-secondary">{{ getStatusLabel(test.status) }}</span>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
             <div class="flex flex-col">
                <span class="text-[10px] uppercase tracking-wider text-text-muted font-bold">Success Rate</span>
                <span class="text-lg font-mono text-text-primary">{{ test.results.successRate | number:'1.0-1' }}%</span>
             </div>
             <div class="flex flex-col">
                <span class="text-[10px] uppercase tracking-wider text-text-muted font-bold">Requests</span>
                <span class="text-lg font-mono text-text-primary">{{ test.results.total }}</span>
             </div>
          </div>

          <div class="mt-auto pt-4 border-t border-border-default/50 flex items-center justify-between">
            <span class="text-[11px] text-text-muted font-medium">{{ test.createdAt | date:'MMM d, h:mm a' }}</span>
            <div class="flex items-center gap-1">
               <button class="p-2 text-text-muted hover:text-text-primary transition-colors" (click)="$event.stopPropagation(); openDetail(test._id)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
               </button>
               <button class="p-2 text-text-muted hover:text-error transition-colors" (click)="$event.stopPropagation(); deleteTest(test._id)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .method-badge { @apply font-mono text-[9px] font-bold uppercase py-0.5 px-1.5 rounded border border-white/5; }
    .method-badge[data-method="GET"] { @apply bg-success/10 text-success border-success/20; }
    .method-badge[data-method="POST"] { @apply bg-blue-500/10 text-blue-400 border-blue-500/20; }
    .method-badge[data-method="PUT"] { @apply bg-yellow-500/10 text-yellow-400 border-yellow-500/20; }
    .method-badge[data-method="DELETE"] { @apply bg-error/10 text-error border-error/20; }
    .method-badge[data-method="PATCH"] { @apply bg-purple-500/10 text-purple-400 border-purple-500/20; }

    [data-status="completed"] { @apply border-l-success; }
    [data-status="failed"] { @apply border-l-error; }
    [data-status="stopped"] { @apply border-l-border-strong; opacity: 0.8; }
    [data-status="running"] { @apply border-l-accent animate-pulse; }
  `]
})
export class HistoryComponent {
  private historyService = inject(HistoryApiService);
  private router = inject(Router);
  queryClient = injectQueryClient();

  filter = signal<'all'|'completed'|'failed'>('all');

  query = injectQuery(() => ({
    queryKey: ['history'],
    queryFn: () => lastValueFrom(this.historyService.getTests())
  }));

  getStatusLabel(status: string) {
    if (status === 'stopped') return 'Stopped';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  deleteMutation = injectMutation(() => ({
    mutationFn: (id: string) => lastValueFrom(this.historyService.deleteTest(id)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['history'] });
    }
  }));

  filteredTests() {
    const data = Array.isArray(this.query.data()?.data?.data) ? this.query.data()!.data.data : [];
    
    if (this.filter() === 'completed') return data.filter((t: any) => t.status === 'completed');
    if (this.filter() === 'failed') return data.filter((t: any) => t.status === 'failed');
    return data;
  }

  openDetail(id: string) {
    this.router.navigate(['/test-detail', id]);
  }

  deleteTest(id: string) {
    if (confirm('Are you sure you want to delete this test result?')) {
      this.deleteMutation.mutate(id);
    }
  }
}

import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TestApiService } from '../../core/services/test-api.service';
import { SocketService, ProgressEvent, CompletedEvent } from '../../core/services/socket.service';
import { AuthService } from '../../core/services/auth.service';
import { HistoryApiService } from '../../core/services/history.service';
import Chart from 'chart.js/auto';
import { Subscription, lastValueFrom } from 'rxjs';

type AppState = 'empty' | 'running' | 'completed';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="px-6 py-8 page-container">
      <div class="grid gap-8 items-start md:grid-cols-[400px_1fr] animate-fadeSlideUp">
        <!-- CONFIG PANEL -->
        <div class="glow-card glass p-8 sticky top-24 z-10">
          <div class="flex items-center gap-2 mb-8">
            <div class="w-1.5 h-6 bg-accent rounded-full"></div>
            <h2 class="m-0 text-xl font-bold tracking-tight text-text-primary">Simulation Config</h2>
          </div>

          <form [formGroup]="testForm" (ngSubmit)="showWarningModal = true" class="space-y-6">
            <div>
              <label class="section-label">Test Identifier</label>
              <input type="text" formControlName="name" placeholder="E.g. Payment Gateway Sync" class="w-full bg-elevated border border-border-default rounded-xl px-4 py-3 text-[14px] text-text-primary font-sans transition-all focus:border-accent focus:ring-4 focus:ring-accent/10 focus:outline-none placeholder:text-text-muted">
            </div>

            <div>
              <label class="section-label">Target Endpoint</label>
              <div class="relative">
                <input type="text" formControlName="url" placeholder="https://api.gateway.com/v1" class="w-full bg-elevated border border-border-default rounded-xl pl-4 pr-12 py-3 text-[14px] text-text-primary font-mono transition-all focus:border-accent focus:ring-4 focus:ring-accent/10 focus:outline-none placeholder:text-text-muted" [class.border-error]="testForm.get('url')?.invalid && testForm.get('url')?.touched">
                <div class="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">🔗</div>
              </div>
              <div class="error-msg flex items-center gap-1.5 mt-2" *ngIf="testForm.get('url')?.invalid && testForm.get('url')?.touched">
                <span class="text-[10px]">⚠️</span> Invalid URL protocol or format
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="section-label">Method</label>
                <select formControlName="method" class="w-full bg-elevated border border-border-default rounded-xl px-4 py-3 text-[14px] font-mono font-bold tracking-wider transition-all focus:border-accent focus:outline-none" [ngClass]="{'text-success': testForm.get('method')?.value === 'GET', 'text-blue-400': testForm.get('method')?.value === 'POST', 'text-yellow-400': testForm.get('method')?.value === 'PUT', 'text-error': testForm.get('method')?.value === 'DELETE', 'text-purple-400': testForm.get('method')?.value === 'PATCH'}">
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>
              <div>
                <label class="section-label">Delay (ms)</label>
                <input type="number" formControlName="delay" placeholder="0" class="w-full bg-elevated border border-border-default rounded-xl px-4 py-3 text-[14px] text-text-primary focus:border-accent focus:outline-none">
              </div>
            </div>

            <div>
              <label class="section-label">Payload Headers (JSON)</label>
              <textarea formControlName="headers" placeholder='{ "X-Api-Key": "..." }' (blur)="validateJsonHeaders()" rows="3" class="w-full bg-elevated border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary font-mono transition-all focus:border-accent focus:outline-none resize-none"></textarea>
              <div class="error-msg" *ngIf="headerError">{{ headerError }}</div>
            </div>

            <div *ngIf="['POST', 'PUT', 'PATCH'].includes(testForm.get('method')?.value || '')" class="animate-fadeSlideUp">
              <label class="section-label">Request Body (JSON)</label>
              <textarea formControlName="body" placeholder='{ "user_id": 123 }' (blur)="validateJsonBody()" rows="4" class="w-full bg-elevated border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary font-mono focus:border-accent focus:outline-none resize-none"></textarea>
              <div class="error-msg" *ngIf="bodyError">{{ bodyError }}</div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col">
                <label class="section-label">Volume</label>
                <div class="flex items-center bg-elevated border border-border-default rounded-xl h-[46px] overflow-hidden">
                  <button type="button" class="w-12 h-full flex items-center justify-center text-text-secondary hover:bg-white/5 transition-colors" (click)="adjTotal(-10)">-</button>
                  <input type="number" formControlName="totalRequests" class="flex-1 bg-transparent border-none text-center text-[14px] font-mono font-bold text-text-primary focus:outline-none">
                  <button type="button" class="w-12 h-full flex items-center justify-center text-text-secondary hover:bg-white/5 transition-colors" (click)="adjTotal(10)">+</button>
                </div>
              </div>
              <div class="flex flex-col">
                <label class="section-label">Burst Rate</label>
                <div class="flex items-center bg-elevated border border-border-default rounded-xl h-[46px] overflow-hidden">
                  <button type="button" class="w-12 h-full flex items-center justify-center text-text-secondary hover:bg-white/5 transition-colors" (click)="adjConc(-5)">-</button>
                  <input type="number" formControlName="concurrency" class="flex-1 bg-transparent border-none text-center text-[14px] font-mono font-bold text-text-primary focus:outline-none">
                  <button type="button" class="w-12 h-full flex items-center justify-center text-text-secondary hover:bg-white/5 transition-colors" (click)="adjConc(5)">+</button>
                </div>
              </div>
            </div>
            
            <div class="pt-4" *ngIf="limits">
               <div class="flex justify-between text-[11px] font-bold uppercase tracking-widest text-text-muted mb-2">
                 <span>Quota Utilization</span>
                 <span>{{ limits.remaining }} / {{ limits.limit }} left</span>
               </div>
               <div class="h-1.5 bg-elevated rounded-full overflow-hidden p-[1px] border border-white/5">
                  <div class="h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(110,110,255,0.4)]" [style.width.%]="(limits.remaining / limits.limit) * 100" [ngClass]="{'bg-gradient-to-r from-error to-red-500': limits.remaining <= 3, 'bg-gradient-to-r from-accent to-blue-400': limits.remaining > 3}"></div>
               </div>
            </div>

            <button *ngIf="appState !== 'running'" type="submit" class="primary-btn mt-4 group" [disabled]="testForm.invalid || headerError || bodyError || !limits || limits.remaining === 0">
              <span class="flex items-center justify-center gap-2">
                Launch Stress Test
                <svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </span>
            </button>
            <button *ngIf="appState === 'running'" type="button" class="w-full bg-error/10 border border-error/30 text-error py-4 rounded-xl text-sm font-bold cursor-pointer transition-all hover:bg-error/20 active:scale-[0.98] animate-fadeSlideUp" (click)="stopTest()">Abort Simulation</button>
          </form>
        </div>

        <!-- RESULTS STAGE -->
        <div class="glow-card glass overflow-hidden min-h-[700px]">
          <!-- EMPTY STATE -->
          <div class="flex flex-col items-center justify-center h-full p-20 text-center animate-fadeSlideUp" *ngIf="appState === 'empty'">
             <div class="w-24 h-24 bg-accent/5 rounded-full flex items-center justify-center mb-8 border border-accent/10">
               <div class="text-4xl animate-pulse">⚡</div>
             </div>
             <h2 class="text-2xl font-bold tracking-tight text-text-primary mb-3">Orchestration Ready</h2>
             <p class="text-text-secondary max-w-[340px] leading-relaxed mx-auto">Configure your target endpoint on the left to initiate a high-concurrency load simulation.</p>
          </div>

          <!-- RUNNING STATE -->
          <div class="flex flex-col items-center justify-center h-full p-20 text-center animate-fadeSlideUp" *ngIf="appState === 'running' && progress">
             <div class="relative w-48 h-48 mb-12">
                <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(110, 110, 255, 0.05)" stroke-width="6"></circle>
                  <circle cx="50" cy="50" r="45" fill="none" stroke="url(#gradient)" stroke-width="6" stroke-linecap="round" [attr.stroke-dasharray]="282.7" [attr.stroke-dashoffset]="282.7 * (1 - progress.completed / progress.total)" class="transition-all duration-500"></circle>
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stop-color="#6e6eff" />
                      <stop offset="100%" stop-color="#23d18b" />
                    </linearGradient>
                  </defs>
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                   <div class="text-4xl font-mono font-bold text-text-primary">{{ (progress.completed / progress.total) * 100 | number:'1.0-0' }}%</div>
                   <div class="text-[10px] uppercase font-bold tracking-widest text-text-muted mt-1">Live Feed</div>
                </div>
             </div>
             
             <div class="flex items-center gap-1.5 mb-2">
                <span class="w-2 h-2 bg-success rounded-full animate-ping"></span>
                <span class="font-mono text-xl text-text-primary font-bold">{{ progress.completed }} / {{ progress.total }}</span>
             </div>
             <div class="text-xs font-medium text-text-secondary mb-10 tracking-wide">REQUESTS ORCHESTRATED</div>

             <div class="grid grid-cols-2 gap-3 w-full max-w-[400px]">
               <div class="p-4 bg-success/5 border border-success/10 rounded-2xl flex flex-col gap-1">
                 <span class="text-[10px] font-bold text-success uppercase tracking-wider">Success</span>
                 <span class="text-xl font-mono text-success">{{ progress.successCount }}</span>
               </div>
               <div class="p-4 bg-error/5 border border-error/10 rounded-2xl flex flex-col gap-1">
                 <span class="text-[10px] font-bold text-error uppercase tracking-wider">Failures</span>
                 <span class="text-xl font-mono text-error">{{ progress.failCount }}</span>
               </div>
             </div>

             <div class="mt-12 flex items-center gap-6">
               <div class="flex flex-col">
                 <span class="text-[10px] uppercase text-text-muted font-bold tracking-widest mb-1">Latency</span>
                 <span class="font-mono text-text-primary font-bold">{{ progress.lastResponseTime | number:'1.0-0' }}ms</span>
               </div>
               <div class="w-px h-8 bg-border-default/50"></div>
               <div class="flex flex-col" *ngIf="timeRemaining !== null">
                 <span class="text-[10px] uppercase text-text-muted font-bold tracking-widest mb-1">Estimated</span>
                 <span class="font-mono text-text-primary font-bold">~{{ timeRemaining | number:'1.0-0' }}s</span>
               </div>
             </div>
          </div>

          <!-- COMPLETED STATE -->
          <div class="animate-fadeSlideUp p-8" *ngIf="appState === 'completed' && finalResult">
              <div class="flex flex-col md:flex-row gap-4 items-center justify-between mb-10 border-b border-border-default/50 pb-8">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center text-success border border-success/20">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                  </div>
                  <div>
                    <h3 class="m-0 text-xl font-bold text-text-primary leading-tight">Simulation Finalized</h3>
                    <p class="m-0 text-xs text-text-secondary mt-1">Snapshot captured at {{ finalResult.createdAt | date:'short' }}</p>
                  </div>
                </div>
                <div class="flex gap-3">
                  <button class="ghost-btn !rounded-xl" (click)="viewHistory()">Archived Results</button>
                  <button class="primary-btn !w-auto !px-6 !rounded-xl" (click)="resetForm()">New Simulation</button>
                </div>
              </div>

              <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                <div class="p-5 bg-elevated/50 border border-border-default rounded-2xl flex flex-col gap-1 relative overflow-hidden group">
                  <div class="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span class="text-[10px] uppercase font-bold text-text-muted tracking-widest">Throughput</span>
                  <span class="text-3xl font-mono text-text-primary font-bold">{{ animatedData['total'] || 0 }}</span>
                  <div class="text-[10px] text-text-muted mt-1 font-medium">TOTAL REQUESTS</div>
                </div>
                <div class="p-5 bg-elevated/50 border border-border-default rounded-2xl flex flex-col gap-1 relative overflow-hidden group">
                  <div class="absolute inset-0 bg-success/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span class="text-[10px] uppercase font-bold text-success tracking-widest">Success Rate</span>
                  <span class="text-3xl font-mono text-success font-bold">{{ animatedData['rate'] || 0 }}%</span>
                  <div class="text-[10px] text-text-muted mt-1 font-medium">{{ animatedData['success'] || 0 }} DELIVERED</div>
                </div>
                <div class="p-5 bg-elevated/50 border border-border-default rounded-2xl flex flex-col gap-1 relative overflow-hidden group">
                  <div class="absolute inset-0 bg-error/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span class="text-[10px] uppercase font-bold text-error tracking-widest">Failures</span>
                  <span class="text-3xl font-mono text-error font-bold">{{ animatedData['failed'] || 0 }}</span>
                  <div class="text-[10px] text-text-muted mt-1 font-medium">REJECTED / TIMEOUT</div>
                </div>
                <div class="p-5 bg-elevated/50 border border-border-default rounded-2xl flex flex-col gap-1 relative overflow-hidden group">
                  <div class="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span class="text-[10px] uppercase font-bold text-accent tracking-widest">Avg Latency</span>
                  <span class="text-3xl font-mono text-accent font-bold">{{ animatedData['avg'] || 0 }}<span class="text-sm ml-1 font-sans">ms</span></span>
                  <div class="text-[10px] text-text-muted mt-1 font-medium">OVERALL RESPONSE</div>
                </div>
              </div>

              <!-- CHARTS -->
              <div class="space-y-6 mb-12">
                <div class="p-8 bg-surface/50 border border-border-default rounded-2xl">
                  <div class="section-label !mb-6">Latency Timeline (ms)</div>
                  <div class="h-[300px] w-full">
                    <canvas #lineChart></canvas>
                  </div>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
                  <div class="p-8 bg-surface/50 border border-border-default rounded-2xl flex flex-col h-[350px]">
                    <div class="section-label !mb-6 text-center">Outcome Distribution</div>
                    <div class="relative flex-1 flex items-center justify-center">
                      <canvas #donutChart></canvas>
                    </div>
                  </div>
                  <div class="p-8 bg-surface/50 border border-border-default rounded-2xl h-[350px]">
                    <div class="section-label !mb-6">Frequency Distribution (First 100)</div>
                    <div class="h-full">
                      <canvas #barChart></canvas>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ERROR LOG -->
              <div class="p-8 bg-surface/50 border border-border-default rounded-2xl overflow-hidden shadow-inner">
                <div class="flex items-center justify-between mb-8">
                  <h3 class="m-0 font-mono text-lg font-bold tracking-tight">Diagnostics Hub</h3>
                  <div class="px-2.5 py-1 bg-error/10 text-error rounded-md text-[10px] font-bold uppercase border border-error/20" *ngIf="finalResult.results.errors?.length > 0">
                    {{ finalResult.results.errors.length }} Anomalies Deteced
                  </div>
                </div>
                
                <div class="overflow-x-auto" *ngIf="finalResult.results.errors?.length > 0; else noErrors">
                  <table class="w-full border-collapse">
                    <thead>
                      <tr class="text-text-muted text-[10px] uppercase tracking-widest font-bold">
                        <th class="pb-4 border-b border-border-default">Idx</th>
                        <th class="pb-4 border-b border-border-default">Status Code</th>
                        <th class="pb-4 border-b border-border-default">Exception Detail</th>
                        <th class="pb-4 border-b border-border-default text-right">Latency</th>
                      </tr>
                    </thead>
                    <tbody class="text-sm">
                      <tr *ngFor="let err of paginatedErrors(finalResult.results.errors)" class="group hover:bg-white/5 transition-colors">
                        <td class="py-4 border-b border-border-default font-mono text-text-muted">{{ err.requestNumber }}</td>
                        <td class="py-4 border-b border-border-default">
                          <span [class]="getStatusClass(err.statusCode)" class="px-2 py-0.5 rounded font-mono text-[11px] font-bold border border-white/5 shadow-sm">{{ err.statusCode }}</span>
                        </td>
                        <td class="py-4 border-b border-border-default text-text-secondary font-medium">{{ err.message }}</td>
                        <td class="py-4 border-b border-border-default text-right font-mono text-text-primary text-[13px] font-bold">{{ err.responseTime | number:'1.0-0' }} ms</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="flex gap-4 items-center justify-center mt-8" *ngIf="finalResult.results.errors?.length > 10">
                   <button class="w-10 h-10 flex items-center justify-center bg-elevated border border-border-default rounded-xl text-text-secondary hover:text-text-primary hover:border-border-strong disabled:opacity-30" (click)="errorPage = errorPage - 1" [disabled]="errorPage === 1">←</button>
                   <span class="text-xs font-mono font-bold">{{ errorPage }}</span>
                   <button class="w-10 h-10 flex items-center justify-center bg-elevated border border-border-default rounded-xl text-text-secondary hover:text-text-primary hover:border-border-strong disabled:opacity-30" (click)="errorPage = errorPage + 1" [disabled]="errorPage * 10 >= finalResult.results.errors.length">→</button>
                </div>
                
                <ng-template #noErrors>
                  <div class="flex flex-col items-center justify-center py-12 text-center">
                    <div class="text-3xl mb-4 opacity-30">🛡️</div>
                    <p class="text-text-muted font-medium m-0">No anomalies detected. Target endpoint is responding reliably.</p>
                  </div>
                </ng-template>
              </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL OVERLAY -->
    <div class="fixed inset-0 z-[100] grid place-items-center p-6" *ngIf="showWarningModal">
      <div class="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" (click)="showWarningModal = false"></div>
      <div class="glow-card glass relative p-10 max-w-[440px] text-center animate-fadeSlideUp">
        <div class="w-16 h-16 bg-error/10 border border-error/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-error text-3xl">!</div>
        <h2 class="text-2xl font-bold tracking-tight text-text-primary m-0 mb-4">Verification Required</h2>
        <p class="text-sm text-text-secondary mb-8 leading-relaxed">
          Stress testing infrastructure can impact system stability. Ensure you have the professional authorization to execute high-load simulations against this endpoint.
        </p>
        <div class="grid grid-cols-2 gap-4">
          <button class="ghost-btn !py-3.5 !rounded-xl font-bold" (click)="showWarningModal = false">Back</button>
          <button class="primary-btn !py-3.5 !rounded-xl font-bold" (click)="confirmStartTest()">Commit Test</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .status-2xx { @apply bg-[#23d18b1a] text-success; }
    .status-4xx { @apply bg-[#fbbf241a] text-[#fbbf24]; }
    .status-5xx { @apply bg-[#f871711a] text-error; }
    
    input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private api = inject(TestApiService);
  private socketService = inject(SocketService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private historyApi = inject(HistoryApiService);
  private cdr = inject(ChangeDetectorRef);

  appState: AppState = 'empty';
  showWarningModal = false;
  socketSubs: Subscription[] = [];
  
  headerError = '';
  bodyError = '';
  limits: any = null;
  userId = '';

  progress: ProgressEvent | null = null;
  timeRemaining: number | null = null;
  testStartTime = 0;

  finalResult: any = null;
  animatedData: Record<string, number> = {};
  errorPage = 1;

  @ViewChild('lineChart') lineChartRef?: ElementRef;
  @ViewChild('donutChart') donutChartRef?: ElementRef;
  @ViewChild('barChart') barChartRef?: ElementRef;

  testForm = this.fb.group({
    name: [''],
    url: ['', [Validators.required, Validators.pattern(/^(http|https):\/\/[^ "]+$/)]],
    method: ['GET', Validators.required],
    headers: [''],
    body: [''],
    totalRequests: [50, [Validators.required, Validators.min(1), Validators.max(1000)]],
    concurrency: [10, [Validators.required, Validators.min(1), Validators.max(50)]],
    delay: [0, [Validators.min(0), Validators.max(5000)]]
  });

  async ngOnInit() {
    this.refreshLimits();
    const token = this.auth.getToken();
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }
    
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      this.userId = tokenPayload.sub;
    } catch (e) {
      console.error('Invalid token', e);
      this.router.navigate(['/login']);
      return;
    }

    this.socketService.joinRoom(this.userId);
    this.socketSubs.push(
      this.socketService.onProgress().subscribe(evt => {
        this.progress = evt;
        this.appState = 'running';
        const elapsedSeconds = (Date.now() - this.testStartTime) / 1000;
        const rate = (evt.completed || 1) / (elapsedSeconds || 1);
        this.timeRemaining = rate > 0 ? (evt.total - evt.completed) / rate : null;
      }),
      this.socketService.onCompleted().subscribe(async evt => {
        try {
          const res = await lastValueFrom(this.historyApi.getTestById(evt.resultId));
          if (res) {
            this.finalResult = res;
            this.appState = 'completed';
            this.animateCounters(this.finalResult.results);
            setTimeout(() => this.renderCharts(this.finalResult), 100);
          }
        } catch (err) {
          console.error('Failed to fetch final test results', err);
          this.appState = 'empty';
        } finally {
          this.refreshLimits();
          this.cdr.detectChanges();
        }
      }),
      this.socketService.onError().subscribe(err => {
        alert('Test Error: ' + err.message);
        this.appState = 'empty';
      }),
      this.socketService.onStopped().subscribe(evt => {
        this.appState = 'empty';
        this.refreshLimits();
      })
    );

    const state = this.router.getCurrentNavigation()?.extras.state;
    if (state && state['config']) {
      this.testForm.patchValue(state['config']);
    }
  }

  ngOnDestroy() {
    this.socketSubs.forEach(s => s.unsubscribe());
  }

  refreshLimits() {
    this.api.getLimits().subscribe({
      next: (res) => this.limits = res,
      error: () => this.limits = { remaining: 10, limit: 10 }
    });
  }

  validateJsonHeaders() {
    const val = this.testForm.get('headers')?.value;
    if (!val) { this.headerError = ''; return; }
    try { JSON.parse(val); this.headerError = ''; } 
    catch(e) { this.headerError = 'Invalid JSON format'; }
  }

  validateJsonBody() {
    const val = this.testForm.get('body')?.value;
    if (!val) { this.bodyError = ''; return; }
    try { JSON.parse(val); this.bodyError = ''; } 
    catch(e) { this.bodyError = 'Invalid JSON format'; }
  }

  adjTotal(val: number) {
    const curr = this.testForm.get('totalRequests')?.value || 50;
    this.testForm.get('totalRequests')?.setValue(Math.max(1, Math.min(1000, curr + val)));
  }

  adjConc(val: number) {
    const curr = this.testForm.get('concurrency')?.value || 10;
    this.testForm.get('concurrency')?.setValue(Math.max(1, Math.min(50, curr + val)));
  }

  confirmStartTest() {
    this.showWarningModal = false;
    this.testStartTime = Date.now();
    this.progress = null;
    this.timeRemaining = null;
    this.appState = 'running';

    const raw = this.testForm.value;
    const config: any = {
      ...raw,
      headers: raw.headers ? JSON.parse(raw.headers) : undefined,
      body: raw.body && ['POST','PUT','PATCH'].includes(raw.method!) ? JSON.parse(raw.body) : undefined,
      socketId: this.userId
    };

    this.api.runTest(config).subscribe({
      error: (err) => {
        alert(err.message || 'Failed to start');
        this.appState = 'empty';
      }
    });
  }

  stopTest() {
    this.api.stopTest().subscribe();
  }

  resetForm() {
    this.appState = 'empty';
    this.finalResult = null;
    this.progress = null;
  }

  viewHistory() {
    this.router.navigate(['/history']);
  }

  animateValue(key: string, start: number, end: number, duration: number) {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      this.animatedData[key] = Math.floor(progress * (end - start) + start);
      this.cdr.detectChanges();
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  animateCounters(res: any) {
    // Immediate fallback values to ensure visibility
    this.animatedData['total'] = res.total;
    this.animatedData['success'] = res.success;
    this.animatedData['failed'] = res.failed;
    this.animatedData['avg'] = Math.floor(res.avgResponseTime);
    this.animatedData['rate'] = Math.floor(res.successRate);
    this.cdr.detectChanges();

    // Start smooth animations
    this.animateValue('total', 0, res.total, 600);
    this.animateValue('success', 0, res.success, 600);
    this.animateValue('failed', 0, res.failed, 600);
    this.animateValue('avg', 0, res.avgResponseTime, 600);
    this.animateValue('rate', 0, res.successRate, 600);
  }

  renderCharts(test: any) {
    if (!this.lineChartRef || !this.donutChartRef || !this.barChartRef) return;
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
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
        scales: { x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } }, y: { grid: { color: 'rgba(255, 255, 255, 0.05)' } } }
      }
    });

    new Chart(this.donutChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Success', 'Failed'],
        datasets: [{ data: [test.results.success, test.results.failed], backgroundColor: ['#23d18b', '#f87171'], borderWidth: 0 }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'bottom', labels: { color: '#8888aa' } } } }
    });

    new Chart(this.barChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: timeline.slice(0, 50).map((t: any) => t.requestNumber.toString()),
        datasets: [{ label: 'Response Time (Preview)', data: timeline.slice(0, 50).map((t: any) => t.responseTime), backgroundColor: 'rgba(110, 110, 255, 0.7)', borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 } }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { grid: { color: 'rgba(255, 255, 255, 0.05)' } } }
      }
    });
  }

  paginatedErrors(errors: any[] = []) {
    const start = (this.errorPage - 1) * 10;
    return errors.slice(start, start + 10);
  }

  getStatusClass(code: number) {
    if (code >= 200 && code < 300) return 'status-2xx';
    if (code >= 400 && code < 500) return 'status-4xx';
    if (code >= 500) return 'status-5xx';
    return 'status-5xx';
  }
}

/**
 * Notification Queue System
 * Handles scalable processing of notifications with priority queuing and retry logic
 */

import { NotificationPayload, NotificationPreferences, NotificationResult } from './notificationService';

interface QueueItem {
  id: string;
  payload: NotificationPayload;
  preferences: NotificationPreferences;
  priority: 'low' | 'medium' | 'high' | 'critical';
  attempts: number;
  maxAttempts: number;
  nextRetry?: Date;
  createdAt: Date;
  scheduledFor?: Date;
}

interface QueueConfig {
  maxConcurrent: number;
  retryDelays: number[]; // Delays in milliseconds for each retry attempt
  maxQueueSize: number;
  processingInterval: number;
  deadLetterQueueSize: number;
}

interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  deadLetter: number;
  averageProcessingTime: number;
}

type QueueEventType = 'item_added' | 'item_processed' | 'item_failed' | 'queue_full' | 'processing_started' | 'processing_stopped';

interface QueueEvent {
  type: QueueEventType;
  data?: any;
  timestamp: Date;
}

type QueueEventListener = (event: QueueEvent) => void;

class NotificationQueue {
  private queue: QueueItem[] = [];
  private processing: Map<string, QueueItem> = new Map();
  private deadLetterQueue: QueueItem[] = [];
  private config: QueueConfig;
  private isProcessing = false;
  private processingInterval?: NodeJS.Timeout;
  private stats: QueueStats = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    deadLetter: 0,
    averageProcessingTime: 0
  };
  private processingTimes: number[] = [];
  private eventListeners: Map<QueueEventType, QueueEventListener[]> = new Map();

  constructor(config?: Partial<QueueConfig>) {
    this.config = {
      maxConcurrent: 5,
      retryDelays: [1000, 5000, 15000, 60000], // 1s, 5s, 15s, 1m
      maxQueueSize: 1000,
      processingInterval: 1000, // Check every second
      deadLetterQueueSize: 100,
      ...config
    };
  }

  // Add notification to queue
  async enqueue(
    payload: NotificationPayload,
    preferences: NotificationPreferences,
    options?: {
      priority?: 'low' | 'medium' | 'high' | 'critical';
      maxAttempts?: number;
      scheduledFor?: Date;
    }
  ): Promise<{ success: boolean; queueId?: string; error?: string }> {
    try {
      // Check queue size limit
      if (this.queue.length >= this.config.maxQueueSize) {
        this.emitEvent('queue_full', { queueSize: this.queue.length });
        return {
          success: false,
          error: 'Queue is full. Please try again later.'
        };
      }

      const queueItem: QueueItem = {
        id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        payload,
        preferences,
        priority: options?.priority || this.determinePriority(payload.severity),
        attempts: 0,
        maxAttempts: options?.maxAttempts || this.config.retryDelays.length + 1,
        createdAt: new Date(),
        scheduledFor: options?.scheduledFor
      };

      // Insert item based on priority
      this.insertByPriority(queueItem);
      this.updateStats();
      
      this.emitEvent('item_added', { queueId: queueItem.id, priority: queueItem.priority });
      
      // Start processing if not already running
      if (!this.isProcessing) {
        this.startProcessing();
      }

      return {
        success: true,
        queueId: queueItem.id
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown queue error'
      };
    }
  }

  // Start queue processing
  startProcessing(): void {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.emitEvent('processing_started', {});
    
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, this.config.processingInterval);
  }

  // Stop queue processing
  stopProcessing(): void {
    if (!this.isProcessing) return;
    
    this.isProcessing = false;
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
    
    this.emitEvent('processing_stopped', {});
  }

  // Process items in the queue
  private async processQueue(): Promise<void> {
    const now = new Date();
    
    // Process retry items first
    await this.processRetryItems(now);
    
    // Process new items if we have capacity
    while (this.processing.size < this.config.maxConcurrent && this.queue.length > 0) {
      const item = this.getNextItem(now);
      if (!item) break;
      
      // Move item to processing
      this.processing.set(item.id, item);
      this.updateStats();
      
      // Process item asynchronously
      this.processItem(item).catch(error => {
        console.error('Error processing queue item:', error);
      });
    }
  }

  // Process retry items that are ready
  private async processRetryItems(now: Date): Promise<void> {
    const retryItems = Array.from(this.processing.values())
      .filter(item => item.nextRetry && item.nextRetry <= now);
    
    for (const item of retryItems) {
      this.processItem(item).catch(error => {
        console.error('Error processing retry item:', error);
      });
    }
  }

  // Get next item to process
  private getNextItem(now: Date): QueueItem | null {
    // Find the highest priority item that's ready to be processed
    const readyItems = this.queue.filter(item => 
      !item.scheduledFor || item.scheduledFor <= now
    );
    
    if (readyItems.length === 0) return null;
    
    // Sort by priority (critical > high > medium > low)
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    readyItems.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // If same priority, process older items first
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
    
    const item = readyItems[0];
    
    // Remove from queue
    const index = this.queue.indexOf(item);
    if (index > -1) {
      this.queue.splice(index, 1);
    }
    
    return item;
  }

  // Process individual queue item
  private async processItem(item: QueueItem): Promise<void> {
    const startTime = Date.now();
    
    try {
      item.attempts++;
      
      // Import notification service dynamically to avoid circular dependency
      const { notificationService } = await import('./notificationService');
      
      const result = await notificationService.send(item.payload, item.preferences);
      
      const processingTime = Date.now() - startTime;
      this.recordProcessingTime(processingTime);
      
      if (result.success) {
        // Successfully processed
        this.processing.delete(item.id);
        this.stats.completed++;
        this.updateStats();
        
        this.emitEvent('item_processed', {
          queueId: item.id,
          result,
          processingTime,
          attempts: item.attempts
        });
      } else {
        // Failed - check if we should retry
        await this.handleFailedItem(item, result);
      }
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.recordProcessingTime(processingTime);
      
      const result: NotificationResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown processing error',
        provider: 'queue'
      };
      
      await this.handleFailedItem(item, result);
    }
  }

  // Handle failed queue item
  private async handleFailedItem(item: QueueItem, result: NotificationResult): Promise<void> {
    if (item.attempts < item.maxAttempts) {
      // Schedule retry
      const retryDelay = this.config.retryDelays[Math.min(item.attempts - 1, this.config.retryDelays.length - 1)];
      item.nextRetry = new Date(Date.now() + retryDelay);
      
      // Keep in processing map for retry
      this.emitEvent('item_failed', {
        queueId: item.id,
        result,
        attempts: item.attempts,
        nextRetry: item.nextRetry,
        willRetry: true
      });
    } else {
      // Max attempts reached - move to dead letter queue
      this.processing.delete(item.id);
      this.moveToDeadLetterQueue(item);
      this.stats.failed++;
      this.updateStats();
      
      this.emitEvent('item_failed', {
        queueId: item.id,
        result,
        attempts: item.attempts,
        willRetry: false,
        movedToDeadLetter: true
      });
    }
  }

  // Move item to dead letter queue
  private moveToDeadLetterQueue(item: QueueItem): void {
    // Add to dead letter queue
    this.deadLetterQueue.unshift(item);
    
    // Maintain dead letter queue size limit
    if (this.deadLetterQueue.length > this.config.deadLetterQueueSize) {
      this.deadLetterQueue.splice(this.config.deadLetterQueueSize);
    }
    
    this.stats.deadLetter = this.deadLetterQueue.length;
  }

  // Insert item by priority
  private insertByPriority(item: QueueItem): void {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    
    let insertIndex = this.queue.length;
    
    for (let i = 0; i < this.queue.length; i++) {
      if (priorityOrder[item.priority] > priorityOrder[this.queue[i].priority]) {
        insertIndex = i;
        break;
      }
    }
    
    this.queue.splice(insertIndex, 0, item);
  }

  // Determine priority based on severity
  private determinePriority(severity: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (severity) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  }

  // Record processing time for statistics
  private recordProcessingTime(time: number): void {
    this.processingTimes.push(time);
    
    // Keep only last 100 processing times
    if (this.processingTimes.length > 100) {
      this.processingTimes.shift();
    }
    
    // Update average
    this.stats.averageProcessingTime = 
      this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length;
  }

  // Update queue statistics
  private updateStats(): void {
    this.stats.pending = this.queue.length;
    this.stats.processing = this.processing.size;
  }

  // Event system
  addEventListener(type: QueueEventType, listener: QueueEventListener): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(listener);
  }

  removeEventListener(type: QueueEventType, listener: QueueEventListener): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitEvent(type: QueueEventType, data?: any): void {
    const event: QueueEvent = {
      type,
      data,
      timestamp: new Date()
    };
    
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in queue event listener:', error);
        }
      });
    }
  }

  // Public API methods
  getStats(): QueueStats {
    return { ...this.stats };
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  getProcessingCount(): number {
    return this.processing.size;
  }

  getDeadLetterQueue(): QueueItem[] {
    return [...this.deadLetterQueue];
  }

  // Clear dead letter queue
  clearDeadLetterQueue(): void {
    this.deadLetterQueue.length = 0;
    this.stats.deadLetter = 0;
  }

  // Retry items from dead letter queue
  retryDeadLetterItems(itemIds?: string[]): number {
    let requeued = 0;
    
    const itemsToRetry = itemIds 
      ? this.deadLetterQueue.filter(item => itemIds.includes(item.id))
      : [...this.deadLetterQueue];
    
    for (const item of itemsToRetry) {
      // Reset attempts and remove retry timestamp
      item.attempts = 0;
      item.nextRetry = undefined;
      
      // Move back to main queue
      this.insertByPriority(item);
      
      // Remove from dead letter queue
      const index = this.deadLetterQueue.indexOf(item);
      if (index > -1) {
        this.deadLetterQueue.splice(index, 1);
        requeued++;
      }
    }
    
    this.updateStats();
    this.stats.deadLetter = this.deadLetterQueue.length;
    
    return requeued;
  }

  // Pause/resume processing
  pause(): void {
    this.stopProcessing();
  }

  resume(): void {
    this.startProcessing();
  }

  // Clear all queues
  clear(): void {
    this.queue.length = 0;
    this.processing.clear();
    this.deadLetterQueue.length = 0;
    this.stats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      deadLetter: 0,
      averageProcessingTime: 0
    };
    this.processingTimes.length = 0;
  }
}

// Export singleton instance
export const notificationQueue = new NotificationQueue();
export default NotificationQueue;
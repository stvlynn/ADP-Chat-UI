import { EventEmitter } from 'events';

class EventHub extends EventEmitter {
  private componentListeners: Map<string, Set<string>> = new Map();

  constructor() {
    super();
    this.setMaxListeners(100);
  }

  registerComponent(componentId: string) {
    if (!this.componentListeners.has(componentId)) {
      this.componentListeners.set(componentId, new Set());
    }
    console.log(`📡 EventHub: Component ${componentId} registered`);
  }

  on(event: string, listener: (...args: any[]) => void): this {
    console.log(`📡 EventHub: Adding listener for event '${event}'`);
    super.on(event, listener);
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    try {
      if (event === 'client_msgContentChange') {
        console.log(`📡 EventHub: Emitting event '${event}' with ${args[0]?.chatsContent?.length || 0} messages`);
      }
      const result = super.emit(event, ...args);
      return result;
    } catch (error) {
      console.error(`EventHub emit error for event '${event}':`, error);
      return false;
    }
  }

  offComponentEvents(componentId: string) {
    console.log(`📡 EventHub: Cleaning up events for component ${componentId}`);
    const events = this.componentListeners.get(componentId);
    if (events) {
      console.log(`📡 EventHub: Removing ${events.size} events for component ${componentId}`);
      events.forEach(event => {
        this.removeAllListeners(event);
      });
      this.componentListeners.delete(componentId);
    }
  }
}

export const eventHub = new EventHub();
export default eventHub;
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const socket = io(API_URL);

class ApiService {
  constructor() {
    this.baseUrl = API_URL;
    this.token = null;
    this.googleToken = null;
    
    // Ensure we re-register the token if the socket reconnects
    socket.on('connect', () => {
      if (this.googleToken) {
        socket.emit('register_google_token', { googleToken: this.googleToken, userId: this.userId });
      }
    });
  }

  setToken(token) {
    this.token = token;
  }

  setGoogleToken(token, userId) {
    this.googleToken = token;
    this.userId = userId || this.userId;
    if (token) {
      socket.emit('register_google_token', { googleToken: token, userId: this.userId });
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    if (this.googleToken) {
      headers['X-Google-Token'] = this.googleToken;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      const msg = error.error || error.message || `Request failed with status ${response.status}`;
      const err = new Error(msg);
      err.status = response.status;
      throw err;
    }

    return response.json();
  }

  // Calendar endpoints
  async getCalendarEvents(timeMin, timeMax) {
    return this.request(`/api/calendar/events?timeMin=${timeMin}&timeMax=${timeMax}`);
  }

  // Task endpoints
  async getTasks() {
    return this.request('/api/tasks');
  }

  async createTask(task) {
    return this.request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateTask(taskId, updates) {
    return this.request(`/api/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTask(taskId) {
    return this.request(`/api/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  // Agent endpoints
  async runPlanner(tasks, events) {
    return this.request('/api/agents/plan', {
      method: 'POST',
      body: JSON.stringify({ tasks, events }),
    });
  }

  async runScheduler(tasks, events) {
    return this.request('/api/agents/schedule', {
      method: 'POST',
      body: JSON.stringify({ tasks, events }),
    });
  }

  async resolveConflict(conflictData) {
    return this.request('/api/agents/resolve-conflict', {
      method: 'POST',
      body: JSON.stringify(conflictData),
    });
  }

  async chat(message, context) {
    return this.request('/api/agents/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });
  }

  async getThinkingLog() {
    return this.request('/api/agents/thinking-log');
  }

  // Calendar endpoints
  async createCalendarEvent(eventData) {
    return this.request('/api/calendar/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async updateCalendarEvent(eventId, eventData) {
    return this.request(`/api/calendar/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  async deleteCalendarEvent(eventId) {
    return this.request(`/api/calendar/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  // Gmail endpoints
  async getGmailTriage() {
    return this.request('/api/gmail/triage');
  }

  // WhatsApp endpoints
  async sendWhatsAppMessage(to, message) {
    return this.request('/api/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify({ to, message }),
    });
  }
}

export const api = new ApiService();
export default api;

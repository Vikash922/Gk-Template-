import { VideoProject, MediaAsset, VideoTemplate } from '../types';

const DB_NAME = 'gk_video_editor_db';
const DB_VERSION = 1;

class ProjectStore {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported in this environment'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
        if (!db.objectStoreNames.contains('media_assets')) {
          const mediaStore = db.createObjectStore('media_assets', { keyPath: 'id' });
          mediaStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        if (!db.objectStoreNames.contains('templates')) {
          db.createObjectStore('templates', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => {
        console.warn('IndexedDB failed to open, falling back to localStorage');
        reject(request.error);
      };
    });

    return this.initPromise;
  }

  // ─── Project Operations ───
  async saveProject(project: VideoProject): Promise<void> {
    const updated = { ...project, updatedAt: Date.now() };
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('projects', 'readwrite');
        const store = tx.objectStore('projects');
        const req = store.put(updated);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Fallback to localStorage
      try {
        const list = this.getProjectsFromLocalStorage();
        const idx = list.findIndex((p) => p.id === updated.id);
        if (idx >= 0) list[idx] = updated;
        else list.unshift(updated);
        localStorage.setItem('gk_projects_fallback', JSON.stringify(list));
      } catch (err) {
        console.warn('Failed to save to localStorage fallback:', err);
      }
    }
  }

  async getProject(id: string): Promise<VideoProject | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('projects', 'readonly');
        const store = tx.objectStore('projects');
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      const list = this.getProjectsFromLocalStorage();
      return list.find((p) => p.id === id) || null;
    }
  }

  async getAllProjects(): Promise<VideoProject[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('projects', 'readonly');
        const store = tx.objectStore('projects');
        const req = store.getAll();
        req.onsuccess = () => {
          const results: VideoProject[] = req.result || [];
          results.sort((a, b) => b.updatedAt - a.updatedAt);
          resolve(results);
        };
        req.onerror = () => resolve([]);
      });
    } catch {
      return this.getProjectsFromLocalStorage();
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('projects', 'readwrite');
        const store = tx.objectStore('projects');
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = this.getProjectsFromLocalStorage().filter((p) => p.id !== id);
      localStorage.setItem('gk_projects_fallback', JSON.stringify(list));
    }
  }

  private getProjectsFromLocalStorage(): VideoProject[] {
    try {
      const raw = localStorage.getItem('gk_projects_fallback');
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  // ─── Media Assets ───
  async saveMediaAsset(asset: MediaAsset): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('media_assets', 'readwrite');
        const store = tx.objectStore('media_assets');
        const req = store.put(asset);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Could not store media asset in IndexedDB:', e);
    }
  }

  async getAllMediaAssets(): Promise<MediaAsset[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('media_assets', 'readonly');
        const store = tx.objectStore('media_assets');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  async deleteMediaAsset(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('media_assets', 'readwrite');
        const store = tx.objectStore('media_assets');
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Could not delete media asset:', e);
    }
  }

  async clearAllMediaAssets(): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('media_assets', 'readwrite');
        const store = tx.objectStore('media_assets');
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Could not clear media assets:', e);
    }
  }

  // ─── Template Operations ───
  async saveTemplate(template: VideoTemplate): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('templates', 'readwrite');
        const store = tx.objectStore('templates');
        const req = store.put(template);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      try {
        const list = this.getTemplatesFromLocalStorage();
        const idx = list.findIndex((t) => t.id === template.id);
        if (idx >= 0) list[idx] = template;
        else list.push(template);
        localStorage.setItem('gk_templates_fallback', JSON.stringify(list));
      } catch {}
    }
  }

  async getAllTemplates(): Promise<VideoTemplate[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('templates', 'readonly');
        const store = tx.objectStore('templates');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return this.getTemplatesFromLocalStorage();
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('templates', 'readwrite');
        const store = tx.objectStore('templates');
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = this.getTemplatesFromLocalStorage().filter((t) => t.id !== id);
      localStorage.setItem('gk_templates_fallback', JSON.stringify(list));
    }
  }

  private getTemplatesFromLocalStorage(): VideoTemplate[] {
    try {
      const raw = localStorage.getItem('gk_templates_fallback');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}

export const projectStore = new ProjectStore();

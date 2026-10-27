import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { UserIdentity, UserIdentitySchema, PersonalityMode } from '../types/index.js';
import { GraphEngine } from './graph.engine.js';
import { EventEngine } from './event.engine.js';

export type ExtendedIdentity = UserIdentity;

export class IdentityEngine {
  private filePath: string;
  private identity: ExtendedIdentity;

  constructor(
    private graph?: GraphEngine,
    private events?: EventEngine,
    customPath?: string
  ) {
    const dir = path.join(os.homedir(), '.second-brain');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.filePath = customPath || path.join(dir, 'identity.json');
    this.identity = this.loadFromDisk();
  }

  private loadFromDisk(): ExtendedIdentity {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch {
      // Fallback
    }
    return {
      name: 'Naveen',
      role: 'CEO & Founder',
      companies: ['Second Brain Core'],
      channels: ['Paradox Tamil'],
      skills: ['AI Systems', 'Software Engineering', 'Video Storytelling'],
      interests: ['AI', 'Startups', '3D Models', 'YouTube'],
      goals: ['Build the Universal Memory Layer for AI', 'Scale YouTube Channel to 1M'],
      activeMode: 'CEO',
      preferences: {},
    };
  }

  private saveToDisk(): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.identity, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save identity to disk:', err);
    }
  }

  async getIdentity(): Promise<ExtendedIdentity> {
    return { ...this.identity };
  }

  async updateIdentity(updates: Partial<ExtendedIdentity>): Promise<ExtendedIdentity> {
    this.identity = {
      ...this.identity,
      ...updates,
    };
    this.saveToDisk();

    // Mirror to Graph Node
    if (this.graph) {
      await this.graph.createNode('user_profile', 'User', {
        name: this.identity.name,
        role: this.identity.role,
        mode: this.identity.activeMode || 'CEO',
        companies: this.identity.companies || [],
        channels: this.identity.channels || [],
      });
    }

    if (this.events) {
      await this.events.recordEvent('IDENTITY_UPDATED', 'IDENTITY_ENGINE', {
        name: this.identity.name,
        role: this.identity.role,
        activeMode: this.identity.activeMode,
      });
    }

    return { ...this.identity };
  }

  async setMode(mode: PersonalityMode): Promise<ExtendedIdentity> {
    return this.updateIdentity({ activeMode: mode });
  }
}

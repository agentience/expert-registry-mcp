// Expert Registry MCP Server - Example Implementation Structure
// This demonstrates the key components and patterns for the MCP server

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListResourcesRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import chokidar from 'chokidar';

// Types
interface Expert {
  id: string;
  name: string;
  version: string;
  description: string;
  domains: string[];
  specializations: {
    technology: string;
    frameworks: string[];
    expertise_level: string;
  }[];
  workflow_compatibility: Record<string, number>;
  performance_metrics?: {
    average_adherence_score: number;
    successful_applications: number;
    total_applications: number;
  };
}

interface ExpertRegistry {
  version: string;
  last_updated: string;
  experts: Expert[];
}

interface TechnologyDetectionResult {
  technologies: string[];
  frameworks: string[];
  confidence: number;
}

interface ExpertSelectionResult {
  expert: Expert;
  score: number;
  reasoning: string;
}

// Core Services
class RegistryManager {
  private registryPath: string;
  private registry: ExpertRegistry | null = null;
  private watcher: chokidar.FSWatcher | null = null;

  constructor(registryPath: string) {
    this.registryPath = registryPath;
  }

  async initialize() {
    await this.loadRegistry();
    this.setupFileWatcher();
  }

  private async loadRegistry() {
    const content = await fs.readFile(this.registryPath, 'utf-8');
    this.registry = JSON.parse(content);
  }

  private setupFileWatcher() {
    this.watcher = chokidar.watch(this.registryPath, {
      persistent: true,
      ignoreInitial: true
    });

    this.watcher.on('change', async () => {
      console.log('Registry file changed, reloading...');
      await this.loadRegistry();
    });
  }

  async listExperts(filters?: { domain?: string; technology?: string }) {
    if (!this.registry) await this.loadRegistry();
    
    let experts = this.registry!.experts;
    
    if (filters?.domain) {
      experts = experts.filter(e => 
        e.domains.some(d => d.toLowerCase().includes(filters.domain!.toLowerCase()))
      );
    }
    
    if (filters?.technology) {
      experts = experts.filter(e =>
        e.specializations.some(s => 
          s.technology.toLowerCase().includes(filters.technology!.toLowerCase())
        )
      );
    }
    
    return experts;
  }

  async getExpert(id: string) {
    if (!this.registry) await this.loadRegistry();
    return this.registry!.experts.find(e => e.id === id);
  }
}

class SelectionEngine {
  private registryManager: RegistryManager;
  private cache: Map<string, { result: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(registryManager: RegistryManager) {
    this.registryManager = registryManager;
  }

  async detectTechnologies(scanPaths: string[]): Promise<TechnologyDetectionResult> {
    // Check cache
    const cacheKey = `tech_detect_${scanPaths.join(',')}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const technologies = new Set<string>();
    const frameworks = new Set<string>();

    for (const scanPath of scanPaths) {
      // Check package.json
      if (scanPath.includes('package.json')) {
        try {
          const content = await fs.readFile(scanPath, 'utf-8');
          const pkg = JSON.parse(content);
          
          // Analyze dependencies
          const deps = { ...pkg.dependencies, ...pkg.devDependencies };
          
          if (deps['@aws-amplify/backend']) {
            technologies.add('AWS Amplify Gen 2');
            frameworks.add('AWS Amplify');
          }
          if (deps['@cloudscape-design/components']) {
            technologies.add('AWS Cloudscape');
            frameworks.add('Cloudscape Design System');
          }
          if (deps['@aws-sdk/client-dynamodb']) {
            technologies.add('AWS DynamoDB');
            frameworks.add('AWS SDK');
          }
        } catch (e) {
          // Not a package.json or invalid JSON
        }
      }

      // Check file extensions
      try {
        const stats = await fs.stat(scanPath);
        if (stats.isDirectory()) {
          const files = await fs.readdir(scanPath);
          
          if (files.some(f => f.endsWith('.tsx') || f.endsWith('.jsx'))) {
            technologies.add('React');
          }
          if (files.some(f => f.includes('amplify'))) {
            technologies.add('AWS Amplify');
          }
        }
      } catch (e) {
        // Path doesn't exist
      }
    }

    const result = {
      technologies: Array.from(technologies),
      frameworks: Array.from(frameworks),
      confidence: technologies.size > 0 ? 0.8 : 0.3
    };

    this.setCache(cacheKey, result);
    return result;
  }

  async selectOptimalExpert(
    taskDescription: string,
    technologies: string[],
    taskType: string
  ): Promise<ExpertSelectionResult> {
    const experts = await this.registryManager.listExperts();
    const scores: Array<{ expert: Expert; score: number; breakdown: any }> = [];

    for (const expert of experts) {
      let score = 0;
      const breakdown = {
        technology_match: 0,
        workflow_compatibility: 0,
        performance_history: 0,
        capability_assessment: 0
      };

      // Technology match (35%)
      const techMatches = technologies.filter(tech =>
        expert.specializations.some(spec =>
          spec.technology.toLowerCase().includes(tech.toLowerCase())
        )
      );
      breakdown.technology_match = (techMatches.length / technologies.length) * 0.35;
      score += breakdown.technology_match;

      // Workflow compatibility (30%)
      const workflowScore = expert.workflow_compatibility[taskType] || 0.5;
      breakdown.workflow_compatibility = workflowScore * 0.30;
      score += breakdown.workflow_compatibility;

      // Performance history (25%)
      if (expert.performance_metrics) {
        const successRate = expert.performance_metrics.successful_applications / 
                          expert.performance_metrics.total_applications;
        breakdown.performance_history = successRate * 0.25;
      } else {
        breakdown.performance_history = 0.5 * 0.25; // Default 50%
      }
      score += breakdown.performance_history;

      // Capability assessment (10%)
      breakdown.capability_assessment = 0.8 * 0.10; // Default high capability
      score += breakdown.capability_assessment;

      scores.push({ expert, score, breakdown });
    }

    // Sort by score
    scores.sort((a, b) => b.score - a.score);
    
    const winner = scores[0];
    return {
      expert: winner.expert,
      score: winner.score,
      reasoning: `Selected ${winner.expert.name} with score ${winner.score.toFixed(2)}`
    };
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.result;
    }
    return null;
  }

  private setCache(key: string, result: any) {
    this.cache.set(key, { result, timestamp: Date.now() });
  }
}

class ContextManager {
  private contextsPath: string;
  private contextCache: Map<string, string> = new Map();

  constructor(contextsPath: string) {
    this.contextsPath = contextsPath;
  }

  async loadContext(expertId: string): Promise<string> {
    if (this.contextCache.has(expertId)) {
      return this.contextCache.get(expertId)!;
    }

    const contextPath = path.join(this.contextsPath, `${expertId}.md`);
    const content = await fs.readFile(contextPath, 'utf-8');
    
    this.contextCache.set(expertId, content);
    return content;
  }

  async injectContext(prompt: string, expertId: string, injectionPoints: string[]): Promise<string> {
    const context = await this.loadContext(expertId);
    
    // Simple injection strategy - prepend expert context
    const expertSection = `
## Expert Context: ${expertId}

${context}

## Original Task
`;

    return expertSection + prompt;
  }
}

// MCP Server Implementation
class ExpertRegistryMCPServer {
  private server: Server;
  private registryManager: RegistryManager;
  private selectionEngine: SelectionEngine;
  private contextManager: ContextManager;

  constructor() {
    this.server = new Server(
      {
        name: 'expert-registry-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    // Initialize paths from environment or defaults
    const basePath = process.env.EXPERT_SYSTEM_PATH || './expert-system';
    
    this.registryManager = new RegistryManager(
      path.join(basePath, 'registry/expert-registry.json')
    );
    
    this.selectionEngine = new SelectionEngine(this.registryManager);
    
    this.contextManager = new ContextManager(
      path.join(basePath, 'expert-contexts')
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // Tool handlers
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'expert_registry_list':
          return await this.handleRegistryList(args);
          
        case 'expert_registry_get':
          return await this.handleRegistryGet(args);
          
        case 'expert_detect_technologies':
          return await this.handleDetectTechnologies(args);
          
        case 'expert_select_optimal':
          return await this.handleSelectOptimal(args);
          
        case 'expert_load_context':
          return await this.handleLoadContext(args);
          
        case 'expert_inject_context':
          return await this.handleInjectContext(args);
          
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });

    // Resource handlers
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const experts = await this.registryManager.listExperts();
      
      return {
        resources: [
          {
            uri: 'expert://registry',
            name: 'Expert Registry',
            description: 'Current state of the expert registry',
            mimeType: 'application/json',
          },
          ...experts.map(expert => ({
            uri: `expert://context/${expert.id}`,
            name: `Expert Context: ${expert.name}`,
            description: expert.description,
            mimeType: 'text/markdown',
          })),
        ],
      };
    });
  }

  private async handleRegistryList(args: any) {
    const experts = await this.registryManager.listExperts(args);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(experts, null, 2),
        },
      ],
    };
  }

  private async handleRegistryGet(args: any) {
    const expert = await this.registryManager.getExpert(args.expertId);
    
    if (!expert) {
      throw new Error(`Expert not found: ${args.expertId}`);
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(expert, null, 2),
        },
      ],
    };
  }

  private async handleDetectTechnologies(args: any) {
    const result = await this.selectionEngine.detectTechnologies(
      args.scanPaths || ['./package.json', './src']
    );
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleSelectOptimal(args: any) {
    const result = await this.selectionEngine.selectOptimalExpert(
      args.taskDescription,
      args.technologies || [],
      args.taskType || 'general'
    );
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleLoadContext(args: any) {
    const context = await this.contextManager.loadContext(args.expertId);
    
    return {
      content: [
        {
          type: 'text',
          text: context,
        },
      ],
    };
  }

  private async handleInjectContext(args: any) {
    const enhanced = await this.contextManager.injectContext(
      args.prompt,
      args.expertId,
      args.injectionPoints || []
    );
    
    return {
      content: [
        {
          type: 'text',
          text: enhanced,
        },
      ],
    };
  }

  async start() {
    await this.registryManager.initialize();
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('Expert Registry MCP Server started');
  }
}

// Start the server
if (require.main === module) {
  const server = new ExpertRegistryMCPServer();
  server.start().catch(console.error);
}
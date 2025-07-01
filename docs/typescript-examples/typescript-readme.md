# Expert Registry MCP Server

**Last Updated: 2025-06-30**

## Overview

The Expert Registry MCP Server provides high-performance expert discovery, registration, and context injection capabilities for AI agents. It integrates seamlessly with the Multi-Agent AI Collaboration Framework to enhance agent capabilities with domain-specific expertise.

## Key Features

- **🚀 High Performance**: In-memory caching with intelligent invalidation
- **📁 File-Based Updates**: Hot reload on registry/context file changes  
- **🔍 Smart Discovery**: Automatic technology detection and expert matching
- **💉 Context Injection**: Sophisticated prompt enhancement with expert knowledge
- **📊 Analytics**: Performance tracking and optimization
- **🔄 Live Updates**: File watching for zero-downtime updates

## Installation

```bash
# Install globally
npm install -g @agentience/expert-registry-mcp

# Or add to your project
npm install @agentience/expert-registry-mcp
```

## Configuration

### Claude Desktop Configuration

Add to your Claude Desktop configuration file:

```json
{
  "mcpServers": {
    "expert-registry": {
      "command": "expert-registry-mcp",
      "env": {
        "EXPERT_SYSTEM_PATH": "/path/to/expert-system"
      }
    }
  }
}
```

### Environment Variables

- `EXPERT_SYSTEM_PATH`: Path to expert system directory (default: `./expert-system`)
- `CACHE_TTL`: Cache time-to-live in seconds (default: 300)
- `MAX_CACHE_SIZE`: Maximum cache size in MB (default: 100)

## Usage

### Basic Expert Discovery

```typescript
// Detect technologies in your project
const technologies = await callTool('expert_detect_technologies', {
  scanPaths: ['./src', './package.json']
});

// Select the best expert for your task
const expert = await callTool('expert_select_optimal', {
  taskDescription: 'Refactor authentication system using AWS Amplify',
  technologies: technologies.technologies,
  taskType: 'refactoring'
});
```

### Context Injection

```typescript
// Load expert context
const context = await callTool('expert_load_context', {
  expertId: expert.expert.id
});

// Inject into your prompt
const enhancedPrompt = await callTool('expert_inject_context', {
  prompt: 'Refactor the authentication system',
  expertId: expert.expert.id,
  injectionPoints: ['constraints', 'patterns', 'quality-criteria']
});
```

### Performance Tracking

```typescript
// Track expert usage
await callTool('expert_track_usage', {
  expertId: expert.expert.id,
  taskId: 'auth-refactor-001',
  outcome: {
    success: true,
    adherenceScore: 9.5,
    duration: 1800
  }
});

// Get analytics
const analytics = await callTool('expert_get_analytics', {
  expertId: expert.expert.id,
  timeRange: {
    start: '2025-06-01',
    end: '2025-06-30'
  }
});
```

## Available Tools

### Registry Management
- `expert_registry_list` - List experts with filtering
- `expert_registry_get` - Get expert details
- `expert_registry_search` - Search experts

### Expert Selection
- `expert_detect_technologies` - Detect project technologies
- `expert_select_optimal` - Select best expert for task
- `expert_assess_capability` - Assess expert capability

### Context Operations
- `expert_load_context` - Load expert knowledge
- `expert_inject_context` - Enhance prompts with expertise

### Analytics
- `expert_track_usage` - Record expert performance
- `expert_get_analytics` - Get performance metrics

## File Structure

```
expert-system/
├── registry/
│   └── expert-registry.json      # Central expert database
├── expert-contexts/
│   ├── aws-amplify-gen2.md      # Expert knowledge files
│   ├── aws-cloudscape.md
│   └── ...
└── performance/
    └── metrics.json              # Performance tracking
```

## Adding New Experts

1. Create expert definition in `expert-registry.json`:

```json
{
  "id": "react-native-expert",
  "name": "React Native Expert",
  "version": "1.0.0",
  "description": "Mobile app development with React Native",
  "domains": ["mobile", "cross-platform"],
  "specializations": [{
    "technology": "React Native",
    "frameworks": ["Expo", "React Navigation"],
    "expertise_level": "expert"
  }],
  "workflow_compatibility": {
    "feature": 0.9,
    "bug-fix": 0.8,
    "refactoring": 0.7
  }
}
```

2. Create context file `expert-contexts/react-native-expert.md`:

```markdown
# React Native Expert Context

## Constraints
- Performance optimization for mobile devices
- Platform-specific code organization
- Memory management best practices

## Patterns
- Component composition patterns
- Navigation architecture
- State management with Redux/MobX

## Quality Standards
- 60 FPS UI performance
- <3s app startup time
- Accessibility compliance
```

3. The server will automatically detect and load the new expert

## Performance Optimization

### Caching Strategy
- Registry cached for 24 hours
- Context files cached until changed
- Selection results cached for 5 minutes
- LRU eviction with 100MB limit

### Monitoring
- Response time tracking
- Cache hit rate monitoring
- Expert selection accuracy
- Resource usage metrics

## Integration with Workflows

The Expert Registry MCP Server integrates seamlessly with multi-agent workflows:

```bash
# Workflows automatically detect and use experts
@workflows/refactoring/refactoring-workflow-v5-template.md Please refactor the auth system
```

The workflow will:
1. Detect technologies in your project
2. Select the optimal expert
3. Inject expert context into agent prompts
4. Track adherence to expert patterns
5. Report expert-validated results

## Troubleshooting

### Common Issues

1. **Expert not found**
   - Verify expert ID in registry
   - Check file paths are correct
   - Ensure registry file is valid JSON

2. **Cache not updating**
   - File watcher may need restart
   - Check file permissions
   - Verify EXPERT_SYSTEM_PATH

3. **Performance issues**
   - Monitor cache size
   - Check for memory leaks
   - Review analytics for bottlenecks

### Debug Mode

Enable debug logging:

```bash
DEBUG=expert-registry:* expert-registry-mcp
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details
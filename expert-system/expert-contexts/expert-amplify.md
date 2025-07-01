# CLAUDE-amplify.md

This file provides guidance to Claude Code (claude.ai/code) when working with AWS Amplify Gen 2 code-first development in this repository.

## Project Overview

This is the IFTI project - a concrete moisture testing management application migrated from QCubed PHP to AWS serverless architecture using Amplify Gen 2's code-first approach with TypeScript, React, and DynamoDB.

**JIRA Project Key**: IFTI

## AWS Profile Configuration

**IMPORTANT**: All AWS CLI commands and deployment operations must use the AWS profile 'agentience-reserved-01' and region 'us-west-2':

```bash
export AWS_PROFILE=agentience-reserved-01
# or prefix commands with:
AWS_PROFILE=agentience-reserved-01 aws [command]
```

This profile is required for:
- Amplify deployments (`npx ampx sandbox`)
- IAM operations (role discovery, permission fixes)
- DynamoDB operations
- All AWS service interactions

## 🚨 CRITICAL DEPLOYMENT RESTRICTION 🚨

**CLAUDE MUST NEVER RUN SANDBOX DEPLOYMENTS**

Claude Code is ABSOLUTELY FORBIDDEN from running the following commands:
- `npm run sandbox`
- `npx ampx sandbox`
- `npm run deploy`
- Any command that deploys to AWS infrastructure

**ONLY THE USER** may perform sandbox deployments. Claude must:
1. **PREPARE** code and configuration changes
2. **VALIDATE** TypeScript compilation and compatibility
3. **INFORM** the user when changes are ready for deployment
4. **REQUEST** the user to run `npm run sandbox`
5. **WAIT** for user confirmation before proceeding with any testing

This restriction exists because:
- Sandbox deployments modify AWS infrastructure
- User must maintain control over AWS resource creation/modification
- Deployment timing should be controlled by the user
- Multiple concurrent sandbox instances can conflict

## Role Definition

You are an elite AWS Amplify Gen 2 implementation expert with exceptional abilities in researching and applying code-first, TypeScript-centric development patterns using AWS CDK-based libraries. You excel at augmenting your AWS expertise through systematic research to discover and implement Amplify Gen 2's code-first approach that replaces configuration-heavy workflows with TypeScript-defined backend infrastructure.

## Critical Rules

### Absolute Requirements
1. **TYPESCRIPT-FIRST MANDATE**: EXCLUSIVELY use Amplify Gen 2's code-first, TypeScript-centric approach with AWS CDK-based libraries
2. **REJECT GEN 1 PATTERNS**: ABSOLUTELY REJECT ALL Gen 1 configuration-heavy patterns, tooling-first approaches, and configuration files
3. **RESEARCH FIRST**: ALWAYS leverage MCP servers for documentation and error resolution
4. **KNOWLEDGE PERSISTENCE**: SAVE ALL learnings to `/docs/learnings` and tribal knowledge base
5. **ERROR RESOLUTION**: CHECK Amplify documentation MCP server FIRST for EVERY error - ZERO EXCEPTIONS

### Code-First Principles
```typescript
// ✅ CORRECT: Gen 2 Code-First Backend Definition
// amplify/backend.ts
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';

export const backend = defineBackend({
  auth,
  data,
  storage,
});
```

### Prohibited Gen 1 Patterns
```yaml
# ❌ NEVER SUGGEST OR USE THESE PATTERNS:
Gen 1 Anti-Patterns to REJECT:
  - amplify/backend/api/graphql/schema.graphql
  - amplify init / amplify add commands
  - amplify-meta.json configuration
  - team-provider-info.json
  - CloudFormation template modifications
  - Manual resource configuration
  - CLI-driven backend setup
  - Configuration-first approaches
```

## Essential Commands

Use these slash commands for Amplify Gen 2 development:
- `/dev-start [mode]` - Start development with TypeScript validation
- `/build-full [target]` - Build with resolver compilation and CDK validation
- `/test-all [scope]` - Comprehensive testing including backend tests
- `/aws-setup [action]` - AWS SSO authentication and environment setup
- `/amplify-research {query}` - Research Amplify Gen 2 documentation
- `/amplify-scaffold {type} {name}` - Generate code-first backend components

See `.claude/slash-commands.md` for detailed Amplify-specific workflows.

## Architecture

### Core Components
- **Frontend**: React 18 + Vite with Cloudscape Design System
- **Backend**: AWS Amplify Gen 2 (TypeScript-first) with AppSync GraphQL
- **Database**: DynamoDB hybrid schema (existing tables + Amplify managed)
- **Authentication**: Cognito with automated group management
- **Build System**: ESBuild for resolvers, Vite for frontend

### Key Directories
```
ifti-app/
├── src/
│   ├── services/          # TypeScript service layer (extends BaseService)
│   ├── components/        # React components with Cloudscape
│   └── types/            # Shared TypeScript definitions
├── amplify/
│   ├── data/resource.ts   # GraphQL schema definition (code-first)
│   ├── backend.ts         # Main backend configuration (defineBackend)
│   ├── auth/resource.ts   # Authentication configuration (defineAuth)
│   └── custom/dynamoDBTables.ts # External DynamoDB integration
├── resolvers-src/         # TypeScript resolvers (compiled to JavaScript)
└── scripts/              # Development utilities
```

## TypeScript-First Implementation

### Backend Definition Pattern
```typescript
// amplify/backend.ts
import { defineBackend } from '@aws-amplify/backend';
export const backend = defineBackend({
  auth,
  data,
  storage,
});
```

### Data Schema Definition
```typescript
// amplify/data/resource.ts
import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Todo: a
    .model({
      content: a.string(),
      done: a.boolean(),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
```

### Auth Configuration
```typescript
// amplify/auth/resource.ts
import { defineAuth } from '@aws-amplify/backend';
export const auth = defineAuth({
  // Code-first auth configuration
});
```

## Critical Constraints

### AppSync Resolver Limitations
- **No modern JavaScript**: No `new Date()`, `for` loops, `async/await`, external imports
- **No function passing**: Cannot pass functions as arguments to other functions (e.g., `.filter(Boolean)`, `.map(fn)`)
- **No recursive function calls**: Functions cannot call themselves
- **No function assignment**: Cannot reassign functions or return them as values
- **No dynamic function invocation**: Cannot store functions in objects and call them dynamically
- **Compilation Required**: Write TypeScript, compile to AppSync-compatible JavaScript
- **Runtime Restrictions**: Limited to `@aws-appsync/utils` and basic JavaScript
- **Use manual loops instead**: Replace `.filter()`, `.map()`, `.forEach()` with explicit `for` loops or `if` statements

### Service Layer Pattern
All services extend `BaseService` and use:
- `ValidationService` for input validation
- `ErrorHandler` for consistent error handling
- `@aws-appsync/utils` for GraphQL operations

## Development Patterns

### Adding GraphQL Operations
1. Define schema in `amplify/data/resource.ts` using `a.schema()`
2. Create TypeScript resolver in `resolvers-src/`
3. Build: `npm run resolvers:build`
4. Test: `npm run resolvers:validate:all`
5. Validate AppSync compatibility: `npm run validate:appsync`

### Service Implementation
```typescript
export class NewService extends BaseService {
  async operation(params: Params): Promise<Result> {
    this.validator.validateRequired(params, ['requiredField']);
    return this.executeWithErrorHandling(async () => {
      // TypeScript implementation with CDK patterns
    }, 'NewService.operation');
  }
}
```

## Error Resolution Protocol

### Mandatory First Action
⚠️ **ZERO EXCEPTIONS**: For EVERY error encountered, IMMEDIATELY check Amplify documentation MCP server BEFORE any other troubleshooting steps.

### Error Category Specific Searches
| Error Category | Primary Search Pattern | Alternative Patterns |
|----------------|----------------------|---------------------|
| Schema Errors | `"Amplify Gen 2 schema [ERROR_MESSAGE]"` | `"a.schema TypeScript error"`, `"defineData schema validation"` |
| Auth Errors | `"Amplify Gen 2 auth [ERROR_MESSAGE]"` | `"defineAuth TypeScript error"`, `"Cognito integration error"` |
| Data Errors | `"Amplify Gen 2 data [ERROR_MESSAGE]"` | `"defineData TypeScript error"`, `"DynamoDB integration error"` |
| TypeScript Errors | `"Amplify Gen 2 TypeScript [ERROR_MESSAGE]"` | `"TypeScript compilation error"`, `"type definition error"` |
| CDK Errors | `"Amplify Gen 2 CDK [ERROR_MESSAGE]"` | `"CDK construct error"`, `"CloudFormation error"` |

### Knowledge Tracking
Always document errors and solutions using tribal knowledge system:
```javascript
// Track in tribal with mandatory fields
{
  error_type: "AMPLIFY_GEN2_CODE_FIRST",
  error_message: "[ERROR]",
  framework: "AWS_AMPLIFY_GEN2",
  language: "TypeScript",
  approach: "CODE_FIRST",
  solution_description: "[SOLUTION]",
  solution_code_fix: "[TYPESCRIPT_CODE]",
  solution_explanation: "[EXPLANATION]",
  documentation_references: ["[GEN2_DOC_URL]"],
  type_definitions: "[CDK_TYPE_DEFINITION]",
  cdk_integration: "[CDK_PATTERN]"
}
```

## Testing & Validation

Use these slash commands for Amplify Gen 2 testing:
- `/test-all [scope]` - Comprehensive testing with TypeScript validation
- `/troubleshoot-resolvers` - AppSync resolver issue diagnosis
- `/amplify-research {error}` - Documentation research for errors

### TypeScript Validation Protocol
1. Use `/amplify-research` for CDK-based documentation
2. Extract TypeScript definitions from Amplify Gen 2 docs  
3. Implement using `defineBackend()`, `defineData()`, `defineAuth()` patterns
4. Leverage full IntelliSense and code completion
5. Test with `/build-full` for strict TypeScript checking
6. Verify CDK construct integration
7. Document successful patterns using `/error-track`

## DynamoDB Integration

### Existing Tables
- Uses `ifti_` prefix convention (ifti_core, ifti_commissioner, etc.)
- Hybrid approach connecting external tables to Amplify
- IAM roles auto-configured for table access

### Table Configuration
1. Define in `amplify/config/environment.ts`
2. Add data source in `amplify/backend.ts`
3. Create resolver with proper permissions using TypeScript patterns

## Cloudscape Design System Integration

### Component Discovery
Use `react-design-systems-mcp` for TypeScript-focused component generation:
- Search components with TypeScript focus
- Generate component code with `typescript: true`
- Implement patterns with TypeScript-based customizations
- Integrate with code-first Amplify backend

### Component Categories
- Navigation: Type-safe app layout and navigation patterns
- Data Display: Type-safe tables, cards, and collections
- User Input: Type-safe forms with validation
- Integration: TypeScript data binding with Amplify Gen 2

## Quality Checklist

### Pre-deployment Verification
```yaml
Security:
  - [ ] TypeScript-defined IAM roles follow least privilege
  - [ ] Code-first authentication flows secured
  - [ ] CDK-based encryption configurations

Performance:
  - [ ] TypeScript-optimized data schemas
  - [ ] Code-first DynamoDB index definitions
  - [ ] CDK-defined Lambda configurations

Standards:
  - [ ] Full TypeScript type coverage
  - [ ] CDK construct best practices followed
  - [ ] IntelliSense documentation complete
  - [ ] Code-first error handling comprehensive

Integration:
  - [ ] AWS service experts consulted for TypeScript patterns
  - [ ] CDK-based architecture reviewed
```

## Migration Context

This project represents a QCubed PHP to AWS serverless migration with:
- **Legacy Integration**: `/migration/` contains migration utilities
- **DynamoDB Transfer**: `/dynamodb-transfer/` for data migration
- **Documentation**: Extensive migration guides in `/docs/`

## Troubleshooting

Use these slash commands for common Amplify Gen 2 issues:
- `/troubleshoot-resolvers` - Resolver compilation and TypeScript issues
- `/troubleshoot-aws` - Authentication and profile problems  
- `/amplify-research {error}` - Research specific error solutions
- `/error-track` - Document solutions in tribal knowledge

## Key Principles

1. **ALWAYS** use TypeScript-first backend definitions
2. **ALWAYS** leverage AWS CDK-based libraries
3. **ALWAYS** take advantage of IntelliSense and code completion
4. **NEVER** accept Gen 1 configuration-heavy patterns
5. **ALWAYS** define infrastructure in TypeScript code
6. **ALWAYS** use `defineBackend()`, `defineData()`, `defineAuth()`
7. **ALWAYS** validate with CDK construct patterns
8. **ALWAYS** document code-first solutions in tribal
9. **ALWAYS** check Amplify documentation MCP server FIRST for ANY error
10. **ALWAYS** prioritize modern developer experience with full TypeScript integration
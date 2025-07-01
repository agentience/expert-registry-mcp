# CLAUDE-cloudscape.md

This file provides specialized guidance to Claude Code for implementing AWS Cloudscape Design System components in the IFTI project's AWS Amplify Gen 2 architecture.

## Project Overview

This is the IFTI project - a concrete moisture testing management application migrated from QCubed PHP to AWS serverless architecture using Amplify Gen 2's code-first approach with TypeScript, React, and DynamoDB.

**JIRA Project Key**: IFTI

## Custom Slash Commands

### `/sprint-review` - Generate Sprint Review Document

**Description:** Automatically generates a comprehensive sprint review document by querying Jira for resolved issues and creating a structured markdown report.

**Usage:**
```
/sprint-review [start-date] [sprint-number]
```

**Examples:**
```bash
# Generate review for last 7 days
/sprint-review

# Generate review since June 20th
/sprint-review 2025-06-20

# Generate review with custom sprint number
/sprint-review 2025-06-20 27
```

**Process:**
1. Parse command parameters (defaults to 7 days ago if no date provided)
2. Query Jira using `mcp__mcp-atlassian__jira_search` for resolved issues since start date
3. Analyze issue data (story points, types, key achievements)
4. Generate comprehensive markdown document following established template
5. Save to `sprint-reviews/sprint-{number}-{date}.md`

**Implementation Files:**
- `.claude/slash-commands.md` - Command documentation
- `.claude/commands/sprint-review.js` - Command logic
- `.claude/handlers/sprint-review-handler.md` - Execution handler
- `.claude/commands.json` - Command registry

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

You are an elite AWS Cloudscape Design System specialist with exceptional expertise in implementing pixel-perfect, accessible, and performant AWS web applications. You excel at leveraging the React Design Systems MCP server to provide comprehensive Cloudscape component implementations while seamlessly integrating with AWS Amplify Gen 2's TypeScript-first backend architecture.

## Project Overview

This is the IFTI project - a concrete moisture testing management application migrated from QCubed PHP to AWS serverless architecture using:
- **Frontend**: React 18 + Vite with AWS Cloudscape Design System
- **Backend**: AWS Amplify Gen 2 (TypeScript-first) with AppSync GraphQL
- **Database**: DynamoDB hybrid schema (existing tables + Amplify managed)
- **Authentication**: Cognito with automated group management

**JIRA Project Key**: IFTI

## Critical Rules (Must Follow)

### Cloudscape Design System Exclusivity
1. **CLOUDSCAPE COMPONENTS ONLY**: Use AWS Cloudscape components exclusively, never generic HTML elements or other UI libraries for interface elements
2. **DESIGN TOKEN COMPLIANCE**: Always use Cloudscape design tokens for colors, spacing, typography, and motion
3. **ACCESSIBILITY FIRST**: Implement proper ARIA attributes, keyboard navigation, and WCAG compliance using Cloudscape patterns
4. **AWS INTEGRATION PATTERNS**: Follow AWS-specific component patterns for services like S3, DynamoDB, CloudWatch, and Lambda

### MCP Tool Integration Requirements
1. **VERIFY BEFORE IMPLEMENT**: Always use `mcp__react-design-systems-mcp__get_component_details` before implementing any Cloudscape component
2. **VALIDATE PROPS**: Use `mcp__react-design-systems-mcp__validate_component_props` to ensure correct prop usage
3. **DISCOVER PATTERNS**: Use `mcp__react-design-systems-mcp__search_patterns` for complex UI requirements
4. **GENERATE CODE**: Use `mcp__react-design-systems-mcp__generate_component_code` with `typescript: true` for implementation

### Amplify Gen 2 Integration
1. **TYPESCRIPT-FIRST**: Maintain consistency with Amplify Gen 2's code-first TypeScript approach
2. **SERVICE INTEGRATION**: Integrate with the existing service layer (`src/services/`) that extends `BaseService`
3. **ERROR HANDLING**: Use Cloudscape feedback components with the existing `ErrorHandler` patterns
4. **VALIDATION**: Integrate with existing `ValidationService` for form validation

## Cloudscape Implementation Standards

### Component Discovery Protocol
```typescript
// 1. Search for appropriate components
const searchResults = await mcp_react_design_systems_search_components({
  query: "data table with filtering",
  category: "data-display"
});

// 2. Get detailed component information
const tableDetails = await mcp_react_design_systems_get_component_details({
  componentId: "table",
  includeProperties: true,
  includeExamples: true
});

// 3. Validate props before implementation
const validation = await mcp_react_design_systems_validate_component_props({
  componentId: "table",
  props: {
    items: data,
    columnDefinitions: columns,
    loading: isLoading
  }
});
```

### Core Cloudscape Patterns

#### Data Display with useCollection Hook
```typescript
import { useCollection } from '@cloudscape-design/collection-hooks';
import { Table, Button, PropertyFilter } from '@cloudscape-design/components';

const ProjectTable = ({ projects }: { projects: Project[] }) => {
  const { items, collectionProps, filterProps, paginationProps } = useCollection(
    projects,
    {
      filtering: {
        empty: <EmptyState />,
        noMatch: <NoMatchState />
      },
      pagination: { pageSize: 10 },
      sorting: {},
      selection: {}
    }
  );

  return (
    <Table
      {...collectionProps}
      columnDefinitions={columnDefinitions}
      items={items}
      loading={loading}
      loadingText="Loading projects..."
      filter={
        <PropertyFilter
          {...filterProps}
          filteringProperties={filteringProperties}
        />
      }
      pagination={<Pagination {...paginationProps} />}
    />
  );
};
```

#### Form Implementation with Validation
```typescript
import { Form, FormField, Input, Button, Container } from '@cloudscape-design/components';

const ProjectForm = () => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  return (
    <Container>
      <Form
        actions={
          <Button variant="primary" onClick={handleSubmit}>
            Create Project
          </Button>
        }
        errorText={errors.form}
      >
        <FormField
          label="Project Name"
          errorText={errors.name}
          description="Enter a unique project name"
        >
          <Input
            value={formData.name || ''}
            onChange={({ detail }) => setFormData({ ...formData, name: detail.value })}
            placeholder="Enter project name"
          />
        </FormField>
      </Form>
    </Container>
  );
};
```

### AWS Service-Specific Patterns

#### S3 Integration
```typescript
import { S3ResourceSelector, FileUpload } from '@cloudscape-design/components';

const DocumentUpload = () => {
  return (
    <S3ResourceSelector
      resource={selectedResource}
      onChange={({ detail }) => setSelectedResource(detail.resource)}
      selectableItemsTypes={['buckets', 'objects']}
      visibleColumns={['Name', 'Type', 'Size', 'Last modified']}
    />
  );
};
```

#### DynamoDB Table Patterns
```typescript
import { Table, AttributeEditor } from '@cloudscape-design/components';

const DynamoDBItemEditor = () => {
  return (
    <AttributeEditor
      onAddButtonClick={() => setItems([...items, { key: "", value: "" }])}
      onRemoveButtonClick={({ detail: { itemIndex } }) => {
        setItems(items.filter((item, index) => index !== itemIndex));
      }}
      items={items}
      addButtonText="Add new attribute"
      removeButtonText="Remove"
      definition={[
        {
          label: "Key",
          control: (item, itemIndex) => (
            <Input
              value={item.key}
              onChange={({ detail }) => {
                setItems(items.map((entry, index) => 
                  index === itemIndex ? { ...entry, key: detail.value } : entry
                ));
              }}
            />
          )
        }
      ]}
    />
  );
};
```

## Design Token Implementation

### Color System
```typescript
// Use semantic tokens, not raw colors
const styles = {
  backgroundColor: "var(--awsui-color-background-container-content)",
  color: "var(--awsui-color-text-body-default)",
  borderColor: "var(--awsui-color-border-container-top)"
};

// Support all color modes
import { applyMode, Mode, applyDensity, Density } from '@cloudscape-design/global-styles';

applyMode(Mode.Dark);
applyDensity(Density.Comfortable);
```

### Spacing and Layout
```typescript
const containerStyles = {
  padding: "var(--awsui-space-s)",
  margin: "var(--awsui-space-scaled-m)",
  gap: "var(--awsui-space-xs)"
};
```

### Motion Tokens
```typescript
const animationStyles = {
  transition: "var(--awsui-motion-duration-fast) var(--awsui-motion-easing-ease-out)",
  animationDuration: "var(--awsui-motion-duration-slow)"
};
```

## Advanced Cloudscape Components

### Split Panel Implementation
```typescript
import { SplitPanel } from '@cloudscape-design/components';

const DetailView = ({ selectedItems }) => {
  return (
    <SplitPanel
      header="Project Details"
      i18nStrings={splitPanelI18nStrings}
      closeBehavior="hide"
      hidePreferencesButton={false}
    >
      {selectedItems.length === 1 && <ProjectDetails project={selectedItems[0]} />}
    </SplitPanel>
  );
};
```

### Wizard Component for Multi-Step Workflows
```typescript
import { Wizard } from '@cloudscape-design/components';

const ProjectCreationWizard = () => {
  return (
    <Wizard
      steps={[
        {
          title: "Basic Information",
          content: <BasicInfoStep />,
          isOptional: false
        },
        {
          title: "Configuration",
          content: <ConfigurationStep />,
          errorText: validationError
        },
        {
          title: "Review",
          content: <ReviewStep />
        }
      ]}
      onNavigate={({ detail }) => validateStep(detail.requestedStepIndex)}
      onSubmit={handleWizardSubmit}
    />
  );
};
```

### Code Editor Integration
```typescript
import { CodeEditor } from '@cloudscape-design/components';

const ConfigEditor = () => {
  return (
    <CodeEditor
      language="json"
      value={configCode}
      onChange={({ detail }) => setConfigCode(detail.value)}
      preferences={editorPreferences}
      onPreferencesChange={({ detail }) => setEditorPreferences(detail)}
      loading={isValidating}
      i18nStrings={codeEditorI18nStrings}
    />
  );
};
```

## Service Layer Integration

### Connecting to Existing Services
```typescript
import { ProjectService } from '../services/project/ProjectService';
import { ErrorHandler } from '../services/ErrorHandler';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const projectService = new ProjectService();

  const loadProjects = async () => {
    setLoading(true);
    try {
      const result = await projectService.listProjects();
      setProjects(result.items);
    } catch (err) {
      setError(ErrorHandler.handleError(err, 'ProjectList.loadProjects'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Table
      items={projects}
      loading={loading}
      errorText={error?.message}
      // ... other props
    />
  );
};
```

## Testing with Cloudscape Test Utils

### Component Testing
```typescript
import { render } from '@cloudscape-design/test-utils-core/dom';
import { createWrapper } from '@cloudscape-design/components/test-utils/dom';

describe('ProjectTable', () => {
  test('renders project data correctly', () => {
    const { container } = render(<ProjectTable projects={mockProjects} />);
    const wrapper = createWrapper(container);
    
    const table = wrapper.findTable();
    expect(table.findRows()).toHaveLength(5);
    expect(table.findColumnHeaders()[0].getElement()).toHaveTextContent('Project Name');
  });

  test('handles pagination correctly', async () => {
    const { container } = render(<ProjectTable projects={largeProjectList} />);
    const wrapper = createWrapper(container);
    
    const pagination = wrapper.findPagination();
    pagination.findNextPageButton().click();
    
    await waitFor(() => {
      expect(wrapper.findTable().findRows()).toHaveLength(10);
    });
  });
});
```

### Accessibility Testing
```typescript
import { validateComponentAccessibility } from '@cloudscape-design/test-utils-core/utils';

test('component meets accessibility standards', async () => {
  const { container } = render(<MyComponent />);
  await validateComponentAccessibility(container);
});
```

## Performance Optimization

### Cloudscape-Specific Optimizations
```typescript
import { useCallback, useMemo } from 'react';
import { useStableCallback } from '@cloudscape-design/collection-hooks';

const OptimizedTable = ({ data }) => {
  // Use Cloudscape's stable callback hook
  const handleSelectionChange = useStableCallback(({ detail }) => {
    setSelectedItems(detail.selectedItems);
  });

  // Memoize expensive computations
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      computed: expensiveComputation(item)
    }));
  }, [data]);

  return (
    <Table
      items={processedData}
      onSelectionChange={handleSelectionChange}
      // ... other props
    />
  );
};
```

## Error Handling Protocol

### Cloudscape Error Documentation
```typescript
// When encountering Cloudscape errors, document in tribal knowledge:
const errorTracking = {
  error_type: "CLOUDSCAPE_COMPONENT",
  error_message: "[ERROR_MESSAGE]",
  language: "TypeScript",
  framework: "CLOUDSCAPE",
  component: "[CLOUDSCAPE_COMPONENT]",
  code_snippet: "[CODE_SNIPPET]",
  solution_description: "[SOLUTION_DESCRIPTION]",
  solution_code_fix: "[SOLUTION_CODE]",
  solution_explanation: "[SOLUTION_EXPLANATION]",
  aws_integration: "[AMPLIFY_GEN2_PATTERN]"
};
```

## Quality Checklist

### Pre-Completion Verification
- [ ] All components use Cloudscape exclusively
- [ ] Design tokens implemented correctly for all color modes
- [ ] Accessibility features properly implemented
- [ ] Props validated using MCP tools
- [ ] Integration with existing service layer complete
- [ ] TypeScript types properly defined
- [ ] Error handling using Cloudscape feedback components
- [ ] Responsive behavior tested across screen sizes
- [ ] Performance optimized for large datasets
- [ ] Tests written using Cloudscape test utilities

### AWS Integration Verification
- [ ] Service-specific patterns implemented correctly
- [ ] Authentication flows integrated with Cognito
- [ ] Data flows compatible with DynamoDB patterns
- [ ] File upload integrated with S3 patterns
- [ ] Monitoring displays integrate with CloudWatch patterns

## Development Commands

Use these Cloudscape-focused slash commands:
- `/dev-start [mode]` - Start development with Cloudscape validation
- `/build-full [target]` - Build with Cloudscape asset optimization
- `/test-all [scope]` - Test including Cloudscape component validation
- `/cloudscape-discover {component}` - Research and generate components using MCP
- `/cloudscape-validate [scope]` - Design token compliance and accessibility testing

See `.claude/slash-commands.md` for detailed Cloudscape workflows.

## Documentation Structure

Maintain organized documentation in:
- `/docs/learnings/cloudscape/components/` - Component implementation guides
- `/docs/learnings/cloudscape/patterns/` - Reusable design patterns
- `/docs/learnings/cloudscape/integration/` - Amplify Gen 2 integration patterns
- `/docs/learnings/cloudscape/accessibility/` - Accessibility implementation patterns
- `/docs/learnings/cloudscape/errors/` - Common errors and solutions

## Key Principles

1. **CLOUDSCAPE EXCLUSIVELY**: Never use generic HTML elements or other UI libraries
2. **DESIGN TOKENS ALWAYS**: Use Cloudscape design tokens for all styling
3. **ACCESSIBILITY FIRST**: Implement proper WCAG compliance using Cloudscape patterns
4. **MCP VERIFICATION**: Always verify component APIs before implementation
5. **SERVICE INTEGRATION**: Seamlessly integrate with existing TypeScript service layer
6. **AWS PATTERNS**: Follow AWS-specific component patterns for cloud services
7. **PERFORMANCE OPTIMIZED**: Use Cloudscape's built-in performance patterns
8. **COMPREHENSIVE TESTING**: Test using Cloudscape test utilities
9. **DOCUMENTATION**: Maintain thorough documentation of patterns and solutions
10. **ERROR TRACKING**: Document all Cloudscape-specific errors in tribal knowledge
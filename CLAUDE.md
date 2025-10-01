# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Context Engineering Template Overview

This repository is a **Context Engineering Template** - a comprehensive framework for building AI applications using structured context rather than simple prompt engineering. It includes three main use cases: MCP servers with TypeScript/Cloudflare Workers, PydanticAI agents with Python, and template generation workflows.

## Core Commands & Workflow

### Primary Development Commands

```bash
# Context Engineering Workflow
/generate-prp INITIAL.md              # Generate Product Requirements Prompt from feature request
/execute-prp PRPs/your-feature.md     # Execute PRP to implement feature

# MCP Server Development (use-cases/mcp-server/)
cd use-cases/mcp-server
npm install                           # Install dependencies
npm run dev                          # Start local development server
npm run type-check                   # TypeScript validation
npm run test                         # Run tests
wrangler dev                         # Cloudflare Workers local development
wrangler deploy                      # Deploy to Cloudflare

# PydanticAI Development (use-cases/pydantic-ai/)
cd use-cases/pydantic-ai
python -m venv venv                  # Create virtual environment
source venv/bin/activate             # Activate virtual environment (Linux/Mac)
venv\Scripts\activate                # Activate virtual environment (Windows)
pip install -r requirements.txt     # Install dependencies (if exists)
python agent.py                     # Run agent examples
pytest tests/ -v                    # Run tests
ruff check --fix                    # Lint and fix Python code
```

### Available Command Patterns

When the user types these patterns, automatically execute the corresponding instructions:

#### 1. **Primer Command**

```
User input: "primer" or "prime" or "prime context"
Action: Read `.claude/commands/primer.md` and follow all instructions
```

#### 2. **Generate PRP Command**

```
User input: "prp generate" or "generate prp" or "generate prp from INITIAL.md"
Action: Read `.claude/commands/generate-prp.md` and execute instructions
```

#### 3. **Execute PRP Command**

```
User input: "prp execute <filename>" or "execute prp <filename>"
Example: "prp execute PRPs/feature-search.md"
Action:
  1. Read `.claude/commands/execute-prp.md`
  2. Read the specified PRP file
  3. Follow execute-prp instructions for that PRP
``

#### 4. **List PRPs Command**
```

User input: "prp list" or "list prps" or "show prps"
Action: List all files in PRPs/ directory with brief descriptions

```

## Architecture & Project Structure

### Context Engineering Framework

```

smartpdf/
├── .claude/ # Claude Code configuration
│ ├── commands/ # Custom slash commands
│ │ ├── generate-prp.md # PRP generation workflow
│ │ └── execute-prp.md # PRP execution workflow
│ └── settings.local.json # Tool permissions
├── PRPs/ # Product Requirements Prompts
│ ├── templates/ # PRP templates for different use cases
│ └── EXAMPLE_multi_agent_prp.md # Reference implementation
├── examples/ # Code examples (critical for pattern matching)
├── use-cases/ # Specific implementation patterns
│ ├── mcp-server/ # TypeScript MCP server with Cloudflare Workers
│ ├── pydantic-ai/ # Python AI agents with PydanticAI
│ └── template-generator/ # Template creation workflows
├── INITIAL.md # Template for feature requests
├── INITIAL_EXAMPLE.md # Example feature request
└── CLAUDE.md # This file

````

### Use Case Architectures

**MCP Server (use-cases/mcp-server/):**

- **Technology**: TypeScript, Cloudflare Workers, PostgreSQL
- **Authentication**: GitHub OAuth with HMAC-signed cookies
- **Architecture**: Agent-based MCP tools with dependency injection
- **Key Files**: `src/index.ts` (main), `src/tools/register-tools.ts` (modular tools)

**PydanticAI (use-cases/pydantic-ai/):**

- **Technology**: Python, PydanticAI framework, async/await patterns
- **Architecture**: Agent-tool-dependency pattern with structured outputs
- **Key Files**: `agent.py`, `tools.py`, `models.py`, `settings.py`

## Development Workflow

### Context Engineering Process

1. **Define Feature Requirements**

   - Edit `INITIAL.md` with specific feature description
   - Include examples from `examples/` folder
   - Reference relevant documentation URLs

2. **Generate PRP**

   ```bash
   /generate-prp INITIAL.md
````

- Researches codebase for patterns
- Gathers external documentation
- Creates comprehensive implementation blueprint
- Includes validation gates and success criteria

3. **Execute Implementation**

   ```bash
   /execute-prp PRPs/your-feature-name.md
   ```

   - Follows step-by-step implementation plan
   - Includes automated validation loops
   - Ensures all requirements are met

### Validation Requirements

**All implementations must pass:**

- Type checking (`npm run type-check` for TypeScript, `mypy` for Python)
- Linting (`ruff check` for Python, ESLint for TypeScript)
- Unit tests (`pytest` for Python, `vitest` for TypeScript)
- Integration tests with real services when applicable

## Code Standards & Patterns

### TypeScript/MCP Development

- **Dependency Management**: Use npm, follow `package.json` scripts
- **Architecture**: Modular tool registration pattern in `src/tools/`
- **Validation**: Zod schemas for all inputs, proper error handling
- **Authentication**: GitHub OAuth with role-based permissions
- **Testing**: Vitest with Cloudflare Workers test environment

### Python/PydanticAI Development

- **Environment**: Always use virtual environment for Python development
- **Dependencies**: Environment variables with `python-dotenv` and `pydantic-settings`
- **Agent Pattern**: `Agent → Tools → Dependencies → Models` architecture
- **Testing**: TestModel for development, real models for integration
- **Configuration**: `.env` files for API keys, never commit secrets

### Context Engineering Standards

- **Examples are Critical**: Place working code patterns in `examples/` folder
- **Documentation URLs**: Include specific documentation sections in PRPs
- **Validation Gates**: Every PRP must include executable validation commands
- **Pattern Reuse**: Study existing implementations before creating new ones

## Important Context Patterns

### PRP Generation Best Practices

- Research existing codebase patterns extensively
- Include specific URLs to documentation
- Reference concrete examples from `examples/` folder
- Define clear success criteria and validation steps
- Score confidence level (1-10) for implementation success

### Tool Development Patterns

**MCP Tools (TypeScript):**

```typescript
// Modular registration pattern
export function registerYourTools(server: McpServer, env: Env, props: Props) {
  server.tool("toolName", "Description", ZodSchema, async (args) => {
    // Implementation with proper error handling
  });
}
```

**PydanticAI Tools (Python):**

```python
@agent.tool
async def your_tool(ctx: RunContext[Dependencies], param: str) -> str:
    """Tool with proper context access and error handling."""
    return await external_service(ctx.deps.api_key, param)
```

### Security & Error Handling

- **Input Validation**: Zod schemas (TypeScript) or Pydantic models (Python)
- **Error Sanitization**: Never expose sensitive information in error messages
- **API Key Management**: Use environment variables with proper loading patterns
- **Permission Checking**: Role-based access control for privileged operations

## Testing & Validation

### Required Test Patterns

- **Unit Tests**: For all business logic and tool functions
- **Integration Tests**: For external service integrations
- **Agent Testing**: Use TestModel/FunctionModel for PydanticAI agents
- **MCP Testing**: Use MCP Inspector for server validation

### Validation Commands

**TypeScript Projects:**

```bash
npm run type-check && npm run test && npm run lint
```

**Python Projects:**

```bash
ruff check --fix && mypy . && pytest tests/ -v
```

## Environment Configuration

### Required Environment Variables

**MCP Server (.env in use-cases/mcp-server/):**

```
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
DATABASE_URL=postgresql://...
COOKIE_ENCRYPTION_KEY=your_32_char_key
SENTRY_DSN=https://...  # Optional for monitoring
```

**PydanticAI (.env in use-cases/pydantic-ai/):**

```
LLM_API_KEY=your_openai_key
LLM_PROVIDER=openai
LLM_MODEL=gpt-4
BRAVE_API_KEY=your_brave_key  # For search tools
```

## Key Integration Points

### Claude Desktop Integration

For MCP servers, use in Claude Desktop configuration:

```json
{
  "mcpServers": {
    "your-server": {
      "command": "npx",
      "args": ["mcp-remote", "http://localhost:8792/mcp"],
      "env": {}
    }
  }
}
```

### External Service Patterns

- **Database**: PostgreSQL with connection pooling and SQL injection protection
- **Authentication**: GitHub OAuth 2.0 with signed cookie approval system
- **AI Models**: Multi-provider support (OpenAI, Anthropic, Gemini) via PydanticAI
- **Web Search**: Brave Search API integration for research capabilities

## Session Management & Token Optimization

### Project Status Tracking

- **Update PROJECT_STATUS.md after each major task completion**
- Include current progress, blocking issues, and next steps
- This enables session recovery when unexpected disconnections occur

### Token Management Best Practices

- Use `/compact` command when context becomes lengthy during multi-task sessions
- Recommended triggers for `/compact`:
  - After completing 3-4 related tasks
  - When conversation history exceeds reasonable length
  - Before starting new major feature implementation
  - When switching between different project areas

### Session Recovery with `/primer`

- The `/primer` command automatically reads PROJECT_STATUS.md to understand current state
- Focus on immediate tasks and blocking issues rather than full project re-exploration
- Prioritize reading only relevant files based on current project status

# Using Gemini CLI for Large Codebase Analysis

When analyzing large codebases or multiple files that might exceed context limits,
use the Gemini CLI with its massive context window. Use `gemini -p` to leverage
Google Gemini's large context capacity.

### File and Directory Inclusion Syntax

Use the `@` syntax to include files and directories in your Gemini prompts.
The paths should be relative to WHERE you run the gemini command.

This Context Engineering template emphasizes comprehensive context over clever prompting, enabling AI assistants to implement complex features end-to-end with proper validation and error handling.

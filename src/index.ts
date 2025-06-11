#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

interface ToolSchema {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

interface FileSystemTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
}

class SampleToolsServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'sample-tools-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getAvailableTools(),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'calculate':
            return await this.handleCalculate(args);
          case 'generate_uuid':
            return await this.handleGenerateUuid(args);
          case 'reverse_string':
            return await this.handleReverseString(args);
          case 'current_time':
            return await this.handleCurrentTime(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private getAvailableTools(): ToolSchema[] {
    return [
      {
        name: 'calculate',
        description: 'Perform basic mathematical calculations',
        inputSchema: {
          type: 'object',
          properties: {
            expression: {
              type: 'string',
              description: 'Mathematical expression to evaluate (e.g., "2 + 3 * 4")',
            },
          },
          required: ['expression'],
        },
      },
      {
        name: 'generate_uuid',
        description: 'Generate a random UUID',
        inputSchema: {
          type: 'object',
          properties: {
            version: {
              type: 'number',
              description: 'UUID version (4 for random)',
              default: 4,
            },
          },
          required: [],
        },
      },
      {
        name: 'reverse_string',
        description: 'Reverse a given string',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'Text to reverse',
            },
          },
          required: ['text'],
        },
      },
      {
        name: 'current_time',
        description: 'Get current date and time',
        inputSchema: {
          type: 'object',
          properties: {
            format: {
              type: 'string',
              description: 'Format for the timestamp (iso, unix, readable)',
              default: 'iso',
            },
          },
          required: [],
        },
      },
    ];
  }

  private async handleCalculate(args: unknown): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { expression } = args as { expression: string };
    
    if (!expression || typeof expression !== 'string') {
      throw new Error('Expression is required and must be a string');
    }

    // Simple calculator - only allow basic math operations for security
    const sanitizedExpression = expression.replace(/[^0-9+\-*/().\s]/g, '');
    if (sanitizedExpression !== expression) {
      throw new Error('Invalid characters in expression. Only numbers and basic operators (+, -, *, /, parentheses) are allowed.');
    }

    try {
      // Use Function constructor for safe evaluation
      const result = Function(`"use strict"; return (${sanitizedExpression})`)();
      
      return {
        content: [
          {
            type: 'text',
            text: `${expression} = ${result}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Invalid mathematical expression: ${expression}`);
    }
  }

  private async handleGenerateUuid(args: unknown): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { version = 4 } = args as { version?: number };
    
    if (version !== 4) {
      throw new Error('Only UUID version 4 is supported');
    }

    // Simple UUID v4 generator
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });

    return {
      content: [
        {
          type: 'text',
          text: uuid,
        },
      ],
    };
  }

  private async handleReverseString(args: unknown): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { text } = args as { text: string };
    
    if (!text || typeof text !== 'string') {
      throw new Error('Text is required and must be a string');
    }

    const reversed = text.split('').reverse().join('');

    return {
      content: [
        {
          type: 'text',
          text: reversed,
        },
      ],
    };
  }

  private async handleCurrentTime(args: unknown): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { format = 'iso' } = args as { format?: string };
    
    const now = new Date();
    let timeString: string;

    switch (format) {
      case 'iso':
        timeString = now.toISOString();
        break;
      case 'unix':
        timeString = Math.floor(now.getTime() / 1000).toString();
        break;
      case 'readable':
        timeString = now.toLocaleString();
        break;
      default:
        throw new Error(`Unsupported format: ${format}. Use 'iso', 'unix', or 'readable'.`);
    }

    return {
      content: [
        {
          type: 'text',
          text: timeString,
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Sample Tools MCP Server running on stdio');
  }
}

const server = new SampleToolsServer();
server.run().catch(console.error);
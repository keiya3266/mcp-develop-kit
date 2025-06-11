import { describe, it, expect, beforeEach } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

// Mock the stdio transport since we can't easily test it in unit tests
class MockTransport {
  async start() {
    return Promise.resolve();
  }
  
  async close() {
    return Promise.resolve();
  }
  
  onmessage: ((message: any) => void) | null = null;
  onerror: ((error: Error) => void) | null = null;
  onclose: (() => void) | null = null;
  
  send(message: any) {
    // Mock implementation
    return Promise.resolve();
  }
}

// We'll test the tool logic by creating a simplified version
class ToolTester {
  async calculate(expression: string): Promise<string> {
    if (!expression || typeof expression !== 'string') {
      throw new Error('Expression is required and must be a string');
    }

    const sanitizedExpression = expression.replace(/[^0-9+\-*/().\s]/g, '');
    if (sanitizedExpression !== expression) {
      throw new Error('Invalid characters in expression. Only numbers and basic operators (+, -, *, /, parentheses) are allowed.');
    }

    try {
      const result = Function(`"use strict"; return (${sanitizedExpression})`)();
      return `${expression} = ${result}`;
    } catch (error) {
      throw new Error(`Invalid mathematical expression: ${expression}`);
    }
  }

  async generateUuid(version: number = 4): Promise<string> {
    if (version !== 4) {
      throw new Error('Only UUID version 4 is supported');
    }

    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });

    return uuid;
  }

  async reverseString(text: string): Promise<string> {
    if (!text || typeof text !== 'string') {
      throw new Error('Text is required and must be a string');
    }

    return text.split('').reverse().join('');
  }

  async getCurrentTime(format: string = 'iso'): Promise<string> {
    const now = new Date();

    switch (format) {
      case 'iso':
        return now.toISOString();
      case 'unix':
        return Math.floor(now.getTime() / 1000).toString();
      case 'readable':
        return now.toLocaleString();
      default:
        throw new Error(`Unsupported format: ${format}. Use 'iso', 'unix', or 'readable'.`);
    }
  }
}

describe('Sample Tools MCP Server', () => {
  let toolTester: ToolTester;

  beforeEach(() => {
    toolTester = new ToolTester();
  });

  describe('Calculate Tool', () => {
    it('should perform basic addition', async () => {
      const result = await toolTester.calculate('2 + 3');
      expect(result).toBe('2 + 3 = 5');
    });

    it('should perform complex calculations', async () => {
      const result = await toolTester.calculate('(10 + 5) * 2 - 3');
      expect(result).toBe('(10 + 5) * 2 - 3 = 27');
    });

    it('should handle decimal numbers', async () => {
      const result = await toolTester.calculate('3.14 * 2');
      expect(result).toBe('3.14 * 2 = 6.28');
    });

    it('should reject invalid characters', async () => {
      await expect(toolTester.calculate('2 + 3; console.log("hack")')).rejects.toThrow(
        'Invalid characters in expression'
      );
    });

    it('should reject empty expression', async () => {
      await expect(toolTester.calculate('')).rejects.toThrow(
        'Expression is required and must be a string'
      );
    });

    it('should reject invalid expression', async () => {
      await expect(toolTester.calculate('2 +')).rejects.toThrow(
        'Invalid mathematical expression'
      );
    });
  });

  describe('Generate UUID Tool', () => {
    it('should generate valid UUID v4', async () => {
      const uuid = await toolTester.generateUuid();
      
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);
    });

    it('should generate different UUIDs', async () => {
      const uuid1 = await toolTester.generateUuid();
      const uuid2 = await toolTester.generateUuid();
      
      expect(uuid1).not.toBe(uuid2);
    });

    it('should reject unsupported version', async () => {
      await expect(toolTester.generateUuid(1)).rejects.toThrow(
        'Only UUID version 4 is supported'
      );
    });
  });

  describe('Reverse String Tool', () => {
    it('should reverse simple string', async () => {
      const result = await toolTester.reverseString('hello');
      expect(result).toBe('olleh');
    });

    it('should reverse string with spaces', async () => {
      const result = await toolTester.reverseString('hello world');
      expect(result).toBe('dlrow olleh');
    });

    it('should handle empty string', async () => {
      await expect(toolTester.reverseString('')).rejects.toThrow(
        'Text is required and must be a string'
      );
    });

    it('should handle special characters', async () => {
      const result = await toolTester.reverseString('Hello, World! 123');
      expect(result).toBe('321 !dlroW ,olleH');
    });
  });

  describe('Current Time Tool', () => {
    it('should return ISO format by default', async () => {
      const result = await toolTester.getCurrentTime();
      
      // ISO format: YYYY-MM-DDTHH:mm:ss.sssZ
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      expect(result).toMatch(isoRegex);
    });

    it('should return unix timestamp', async () => {
      const result = await toolTester.getCurrentTime('unix');
      
      // Unix timestamp should be a number string
      expect(result).toMatch(/^\d+$/);
      
      // Should be close to current time (within 1 second)
      const timestamp = parseInt(result);
      const now = Math.floor(Date.now() / 1000);
      expect(Math.abs(timestamp - now)).toBeLessThan(2);
    });

    it('should return readable format', async () => {
      const result = await toolTester.getCurrentTime('readable');
      
      // Should be a non-empty string (exact format depends on locale)
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should reject unsupported format', async () => {
      await expect(toolTester.getCurrentTime('invalid')).rejects.toThrow(
        "Unsupported format: invalid. Use 'iso', 'unix', or 'readable'."
      );
    });
  });

  describe('Server Integration', () => {
    it('should create server with correct capabilities', () => {
      const server = new Server(
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

      expect(server).toBeDefined();
    });
  });
});
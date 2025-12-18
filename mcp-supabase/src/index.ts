#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

class SupabaseMCPServer {
  private server: Server;
  private supabase: SupabaseClient | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'supabase-mcp-server',
        version: '1.0.0',
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private initializeSupabase() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required'
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    return this.supabase;
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'supabase_query',
            description: 'Execute a SELECT query on Supabase database',
            inputSchema: {
              type: 'object',
              properties: {
                table: {
                  type: 'string',
                  description: 'The table name to query',
                },
                select: {
                  type: 'string',
                  description: 'Columns to select (default: "*")',
                  default: '*',
                },
                filters: {
                  type: 'object',
                  description: 'Filters to apply (key-value pairs)',
                  additionalProperties: true,
                },
                limit: {
                  type: 'number',
                  description: 'Limit the number of results',
                },
                orderBy: {
                  type: 'object',
                  properties: {
                    column: { type: 'string' },
                    ascending: { type: 'boolean', default: true },
                  },
                },
              },
              required: ['table'],
            },
          },
          {
            name: 'supabase_insert',
            description: 'Insert data into a Supabase table',
            inputSchema: {
              type: 'object',
              properties: {
                table: {
                  type: 'string',
                  description: 'The table name to insert into',
                },
                data: {
                  type: 'object',
                  description: 'The data to insert',
                  additionalProperties: true,
                },
              },
              required: ['table', 'data'],
            },
          },
          {
            name: 'supabase_update',
            description: 'Update data in a Supabase table',
            inputSchema: {
              type: 'object',
              properties: {
                table: {
                  type: 'string',
                  description: 'The table name to update',
                },
                data: {
                  type: 'object',
                  description: 'The data to update',
                  additionalProperties: true,
                },
                filters: {
                  type: 'object',
                  description: 'Filters to identify rows to update',
                  additionalProperties: true,
                },
              },
              required: ['table', 'data', 'filters'],
            },
          },
          {
            name: 'supabase_delete',
            description: 'Delete data from a Supabase table',
            inputSchema: {
              type: 'object',
              properties: {
                table: {
                  type: 'string',
                  description: 'The table name to delete from',
                },
                filters: {
                  type: 'object',
                  description: 'Filters to identify rows to delete',
                  additionalProperties: true,
                },
              },
              required: ['table', 'filters'],
            },
          },
          {
            name: 'supabase_schema',
            description: 'Get schema information for a table',
            inputSchema: {
              type: 'object',
              properties: {
                table: {
                  type: 'string',
                  description: 'The table name to get schema for',
                },
              },
              required: ['table'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (!this.supabase) {
        this.initializeSupabase();
      }

      try {
        switch (name) {
          case 'supabase_query':
            return await this.handleQuery(args);
          case 'supabase_insert':
            return await this.handleInsert(args);
          case 'supabase_update':
            return await this.handleUpdate(args);
          case 'supabase_delete':
            return await this.handleDelete(args);
          case 'supabase_schema':
            return await this.handleSchema(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new McpError(ErrorCode.InternalError, `Supabase operation failed: ${errorMessage}`);
      }
    });
  }

  private async handleQuery(args: any) {
    const { table, select = '*', filters, limit, orderBy } = args;
    
    let query = this.supabase!.from(table).select(select);

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        query = query.eq(key, value);
      }
    }

    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ data, count: data?.length }, null, 2),
        },
      ],
    };
  }

  private async handleInsert(args: any) {
    const { table, data } = args;
    
    const { data: result, error } = await this.supabase!
      .from(table)
      .insert(data)
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ inserted: result }, null, 2),
        },
      ],
    };
  }

  private async handleUpdate(args: any) {
    const { table, data, filters } = args;
    
    let query = this.supabase!.from(table).update(data);

    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }

    const { data: result, error } = await query.select();

    if (error) {
      throw new Error(error.message);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ updated: result }, null, 2),
        },
      ],
    };
  }

  private async handleDelete(args: any) {
    const { table, filters } = args;
    
    let query = this.supabase!.from(table).delete();

    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }

    const { data: result, error } = await query.select();

    if (error) {
      throw new Error(error.message);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ deleted: result }, null, 2),
        },
      ],
    };
  }

  private async handleSchema(args: any) {
    const { table } = args;
    
    // This is a simplified schema query - you might want to use pg_catalog queries for more detail
    const { data, error } = await this.supabase!
      .from(table)
      .select('*')
      .limit(1);

    if (error) {
      throw new Error(error.message);
    }

    const schema = data && data.length > 0 ? Object.keys(data[0]) : [];

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ table, columns: schema }, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Supabase MCP server running on stdio');
  }
}

const server = new SupabaseMCPServer();
server.run().catch(console.error);

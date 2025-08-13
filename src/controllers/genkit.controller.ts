import { Request, Response } from 'express';
import { z } from 'zod';
import { genkitService } from '../services/genkit.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

// Validation schema for completion requests
const completionSchema = z.object({
  prompt: z.string().min(1).max(10000),
  systemPrompt: z.string().max(2000).optional(),
  maxTokens: z.number().int().min(1).max(4096).optional(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  topK: z.number().int().min(1).max(100).optional(),
  stopSequences: z.array(z.string()).max(5).optional(),
  stream: z.boolean().optional().default(false),
});

export const createCompletion = asyncHandler(async (req: AuthRequest, res: Response) => {
  const params = completionSchema.parse(req.body);
  
  logger.info('Completion request', { 
    userId: req.user?.id,
    stream: params.stream,
    promptLength: params.prompt.length 
  });

  if (params.stream) {
    // Set up SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering
    
    // Send initial connection message
    res.write('data: {"type":"connection","status":"connected"}\n\n');
    
    try {
      const stream = genkitService.streamCompletion(params);
      
      for await (const chunk of stream) {
        // Send each chunk as SSE event
        const event = JSON.stringify({ type: 'content', content: chunk });
        res.write(`data: ${event}\n\n`);
        
        // Flush the response to ensure data is sent immediately
        if (res.flush) res.flush();
      }
      
      // Send completion event
      res.write('data: {"type":"done","status":"completed"}\n\n');
      res.end();
    } catch (error) {
      logger.error('Streaming error:', error);
      const errorEvent = JSON.stringify({ 
        type: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      res.write(`data: ${errorEvent}\n\n`);
      res.end();
    }
  } else {
    // Non-streaming response
    const result = await genkitService.generateCompletion(params);
    
    res.json({
      status: 'success',
      data: result,
    });
  }
});

// Alternative streaming endpoint using chunked transfer encoding
export const streamCompletion = asyncHandler(async (req: AuthRequest, res: Response) => {
  const params = completionSchema.parse(req.body);
  
  logger.info('Stream completion request', { 
    userId: req.user?.id,
    promptLength: params.prompt.length 
  });

  // Set headers for streaming JSON
  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('X-Accel-Buffering', 'no');
  
  try {
    const stream = genkitService.streamCompletion(params);
    
    for await (const chunk of stream) {
      // Send each chunk as newline-delimited JSON
      res.write(JSON.stringify({ chunk }) + '\n');
      
      // Flush the response
      if (res.flush) res.flush();
    }
    
    // Send final metadata
    res.write(JSON.stringify({ 
      done: true,
      metadata: {
        model: 'gemini-1.5-pro',
        timestamp: new Date().toISOString(),
      }
    }) + '\n');
    
    res.end();
  } catch (error) {
    logger.error('Streaming error:', error);
    res.write(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }) + '\n');
    res.end();
  }
});

// Health check endpoint for Genkit
export const checkGenkitHealth = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    status: 'success',
    service: 'genkit',
    healthy: true,
    model: 'gemini-1.5-pro',
    timestamp: new Date().toISOString(),
  });
});
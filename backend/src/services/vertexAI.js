const { PredictionServiceClient } = require('@google-cloud/aiplatform');
const { helpers } = require('@google-cloud/aiplatform');

/**
 * Vertex AI Service - Gemini Integration
 * 
 * Provides AI-powered features:
 * - Content moderation (NSFW, violence, hate speech)
 * - Text embeddings for semantic search
 * - Video analysis
 * - Caption generation
 */

class VertexAIService {
  constructor() {
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT || 'mixillo';
    this.location = process.env.VERTEX_AI_LOCATION || 'us-central1';
    
    // Initialize Prediction Service Client
    const clientOptions = {
      apiEndpoint: `${this.location}-aiplatform.googleapis.com`,
    };
    
    // Use service account key if provided
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      clientOptions.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    }
    
    this.client = new PredictionServiceClient(clientOptions);
    
    // Gemini Pro model
    this.geminiModel = 'gemini-1.5-pro-002';
    this.geminiVisionModel = 'gemini-1.5-flash-002';
    
    console.log(`✅ Vertex AI initialized: ${this.projectId} (${this.location})`);
  }

  /**
   * Get model endpoint
   */
  getEndpoint(modelId) {
    return `projects/${this.projectId}/locations/${this.location}/publishers/google/models/${modelId}`;
  }

  /**
   * Moderate text content (captions, comments)
   * @param {String} text - Text to moderate
   * @returns {Object} Moderation results
   */
  async moderateText(text) {
    try {
      const endpoint = this.getEndpoint(this.geminiModel);
      
      const prompt = `Analyze the following text for inappropriate content. Rate from 0-100 for:
- NSFW content (sexual, explicit)
- Violence or gore
- Hate speech or discrimination  
- Harassment or bullying
- Spam or misleading content

Text: "${text}"

Respond in JSON format:
{
  "nsfw": 0-100,
  "violence": 0-100,
  "hate": 0-100,
  "harassment": 0-100,
  "spam": 0-100,
  "overall": 0-100,
  "flags": ["issue1", "issue2"],
  "recommendation": "approve|review|reject",
  "explanation": "brief reason"
}`;

      const instance = {
        content: prompt
      };
      
      const parameter = {
        temperature: 0.2,
        maxOutputTokens: 1024,
        topP: 0.8,
        topK: 40
      };

      const request = {
        endpoint,
        instances: [helpers.toValue(instance)],
        parameters: helpers.toValue(parameter),
      };

      const [response] = await this.client.predict(request);
      const prediction = response.predictions[0];
      
      // Parse JSON response
      const resultText = prediction.structValue?.fields?.content?.stringValue || 
                        prediction.stringValue || 
                        JSON.stringify(prediction);
      
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          scores: {
            nsfw: result.nsfw || 0,
            violence: result.violence || 0,
            hate: result.hate || 0,
            harassment: result.harassment || 0,
            spam: result.spam || 0,
            overall: result.overall || 0
          },
          flags: result.flags || [],
          recommendation: result.recommendation || 'approve',
          explanation: result.explanation || '',
          provider: 'vertex-ai'
        };
      }
      
      // Fallback if JSON parsing fails
      return {
        success: true,
        scores: { nsfw: 0, violence: 0, hate: 0, harassment: 0, spam: 0, overall: 0 },
        flags: [],
        recommendation: 'approve',
        explanation: 'No issues detected',
        provider: 'vertex-ai'
      };
      
    } catch (error) {
      console.error('Vertex AI text moderation error:', error);
      throw new Error(`Text moderation failed: ${error.message}`);
    }
  }

  /**
   * Analyze video thumbnail for inappropriate content
   * @param {String} imageUrl - URL to video thumbnail
   * @returns {Object} Moderation results
   */
  async moderateImage(imageUrl) {
    try {
      const endpoint = this.getEndpoint(this.geminiVisionModel);
      
      const prompt = `Analyze this image for inappropriate content. Rate from 0-100 for:
- NSFW content (nudity, sexual content)
- Violence or gore
- Hate symbols or extremism
- Disturbing content

Respond in JSON format:
{
  "nsfw": 0-100,
  "violence": 0-100,
  "hate": 0-100,
  "disturbing": 0-100,
  "overall": 0-100,
  "flags": ["issue1", "issue2"],
  "recommendation": "approve|review|reject",
  "detectedObjects": ["object1", "object2"]
}`;

      const instance = {
        content: prompt,
        image: {
          gcsUri: imageUrl.startsWith('gs://') ? imageUrl : null,
          bytesBase64Encoded: imageUrl.startsWith('gs://') ? null : imageUrl
        }
      };
      
      const parameter = {
        temperature: 0.2,
        maxOutputTokens: 1024,
        topP: 0.8,
        topK: 40
      };

      const request = {
        endpoint,
        instances: [helpers.toValue(instance)],
        parameters: helpers.toValue(parameter),
      };

      const [response] = await this.client.predict(request);
      const prediction = response.predictions[0];
      
      const resultText = prediction.structValue?.fields?.content?.stringValue || 
                        prediction.stringValue || 
                        JSON.stringify(prediction);
      
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          scores: {
            nsfw: result.nsfw || 0,
            violence: result.violence || 0,
            hate: result.hate || 0,
            disturbing: result.disturbing || 0,
            overall: result.overall || 0
          },
          flags: result.flags || [],
          recommendation: result.recommendation || 'approve',
          detectedObjects: result.detectedObjects || [],
          provider: 'vertex-ai'
        };
      }
      
      return {
        success: true,
        scores: { nsfw: 0, violence: 0, hate: 0, disturbing: 0, overall: 0 },
        flags: [],
        recommendation: 'approve',
        detectedObjects: [],
        provider: 'vertex-ai'
      };
      
    } catch (error) {
      console.error('Vertex AI image moderation error:', error);
      throw new Error(`Image moderation failed: ${error.message}`);
    }
  }

  /**
   * Generate text embeddings for semantic search
   * @param {String} text - Text to embed (caption, hashtags)
   * @returns {Array} 768-dimensional embedding vector
   */
  async generateEmbedding(text) {
    try {
      const endpoint = this.getEndpoint('textembedding-gecko@003');
      
      const instance = {
        content: text,
        task_type: 'RETRIEVAL_DOCUMENT'
      };
      
      const request = {
        endpoint,
        instances: [helpers.toValue(instance)],
      };

      const [response] = await this.client.predict(request);
      const prediction = response.predictions[0];
      
      // Extract embedding vector
      const embedding = prediction.structValue?.fields?.embeddings?.listValue?.values[0]?.listValue?.values?.map(v => v.numberValue) ||
                       prediction.listValue?.values?.map(v => v.numberValue) ||
                       [];
      
      return {
        success: true,
        embedding,
        dimensions: embedding.length,
        provider: 'vertex-ai'
      };
      
    } catch (error) {
      console.error('Vertex AI embedding error:', error);
      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  /**
   * Generate video caption from thumbnail
   * @param {String} imageUrl - Video thumbnail URL
   * @returns {Object} Caption suggestions
   */
  async generateCaption(imageUrl) {
    try {
      const endpoint = this.getEndpoint(this.geminiVisionModel);
      
      const prompt = `Describe this video thumbnail in 1-2 sentences. Be engaging and concise. Focus on the main subject and action.`;

      const instance = {
        content: prompt,
        image: {
          gcsUri: imageUrl.startsWith('gs://') ? imageUrl : null,
          bytesBase64Encoded: imageUrl.startsWith('gs://') ? null : imageUrl
        }
      };
      
      const parameter = {
        temperature: 0.7,
        maxOutputTokens: 256,
        topP: 0.95,
        topK: 40
      };

      const request = {
        endpoint,
        instances: [helpers.toValue(instance)],
        parameters: helpers.toValue(parameter),
      };

      const [response] = await this.client.predict(request);
      const prediction = response.predictions[0];
      
      const caption = prediction.structValue?.fields?.content?.stringValue || 
                     prediction.stringValue || 
                     'Amazing content!';
      
      return {
        success: true,
        caption: caption.trim(),
        provider: 'vertex-ai'
      };
      
    } catch (error) {
      console.error('Vertex AI caption generation error:', error);
      throw new Error(`Caption generation failed: ${error.message}`);
    }
  }

  /**
   * Analyze hashtags and suggest related ones
   * @param {Array} hashtags - Existing hashtags
   * @param {String} caption - Video caption
   * @returns {Array} Suggested hashtags
   */
  async suggestHashtags(hashtags, caption) {
    try {
      const endpoint = this.getEndpoint(this.geminiModel);
      
      const prompt = `Given these hashtags: ${hashtags.join(', ')}
And caption: "${caption}"

Suggest 5 relevant hashtags to increase discoverability. Focus on trending topics and related themes.
Respond as JSON array: ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]`;

      const instance = {
        content: prompt
      };
      
      const parameter = {
        temperature: 0.7,
        maxOutputTokens: 256,
        topP: 0.9,
        topK: 40
      };

      const request = {
        endpoint,
        instances: [helpers.toValue(instance)],
        parameters: helpers.toValue(parameter),
      };

      const [response] = await this.client.predict(request);
      const prediction = response.predictions[0];
      
      const resultText = prediction.structValue?.fields?.content?.stringValue || 
                        prediction.stringValue || 
                        '[]';
      
      const jsonMatch = resultText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          suggestions: suggestions.map(tag => tag.replace('#', '').toLowerCase()),
          provider: 'vertex-ai'
        };
      }
      
      return {
        success: true,
        suggestions: [],
        provider: 'vertex-ai'
      };
      
    } catch (error) {
      console.error('Vertex AI hashtag suggestion error:', error);
      throw new Error(`Hashtag suggestion failed: ${error.message}`);
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      // Simple test with text moderation
      const result = await this.moderateText('Hello world');
      return {
        status: 'healthy',
        provider: 'vertex-ai',
        project: this.projectId,
        location: this.location,
        success: result.success
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        provider: 'vertex-ai',
        error: error.message
      };
    }
  }
}

// Singleton instance
let vertexAIService = null;

/**
 * Get VertexAI service instance
 */
function getVertexAI() {
  if (!vertexAIService) {
    vertexAIService = new VertexAIService();
  }
  return vertexAIService;
}

module.exports = getVertexAI();
module.exports.VertexAIService = VertexAIService;

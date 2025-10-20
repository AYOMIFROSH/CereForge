// src/services/giphyService.ts

const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY;
const GIPHY_BASE_URL = 'https://api.giphy.com/v1';

export interface GiphyImage {
  id: string;
  title: string;
  images: {
    fixed_height: {
      url: string;
      width: string;
      height: string;
    };
    fixed_height_small: {
      url: string;
      width: string;
      height: string;
    };
    original: {
      url: string;
      width: string;
      height: string;
    };
  };
  url: string;
}

export interface GiphyResponse {
  data: GiphyImage[];
  pagination: {
    total_count: number;
    count: number;
    offset: number;
  };
}

class GiphyService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = GIPHY_API_KEY;
    this.baseUrl = GIPHY_BASE_URL;
  }

  /**
   * Fetch trending GIFs
   */
  async getTrendingGifs(limit: number = 20, offset: number = 0): Promise<GiphyResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/gifs/trending?api_key=${this.apiKey}&limit=${limit}&offset=${offset}&rating=g`
      );
      
      if (!response.ok) {
        throw new Error(`Giphy API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching trending GIFs:', error);
      throw error;
    }
  }

  /**
   * Search GIFs
   */
  async searchGifs(query: string, limit: number = 20, offset: number = 0): Promise<GiphyResponse> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(
        `${this.baseUrl}/gifs/search?api_key=${this.apiKey}&q=${encodedQuery}&limit=${limit}&offset=${offset}&rating=g`
      );
      
      if (!response.ok) {
        throw new Error(`Giphy API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error searching GIFs:', error);
      throw error;
    }
  }

  /**
   * Fetch trending Stickers
   */
  async getTrendingStickers(limit: number = 20, offset: number = 0): Promise<GiphyResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/stickers/trending?api_key=${this.apiKey}&limit=${limit}&offset=${offset}&rating=g`
      );
      
      if (!response.ok) {
        throw new Error(`Giphy API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching trending stickers:', error);
      throw error;
    }
  }

  /**
   * Search Stickers
   */
  async searchStickers(query: string, limit: number = 20, offset: number = 0): Promise<GiphyResponse> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(
        `${this.baseUrl}/stickers/search?api_key=${this.apiKey}&q=${encodedQuery}&limit=${limit}&offset=${offset}&rating=g`
      );
      
      if (!response.ok) {
        throw new Error(`Giphy API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error searching stickers:', error);
      throw error;
    }
  }

  /**
   * Fetch trending Clips (GIFs with sound)
   * Note: Clips use the same endpoint as GIFs but we filter for clips
   */
  async getTrendingClips(limit: number = 20, offset: number = 0): Promise<GiphyResponse> {
    try {
      // Use search with 'clips' tag to get video clips
      const response = await fetch(
        `${this.baseUrl}/gifs/search?api_key=${this.apiKey}&q=video clip&limit=${limit}&offset=${offset}&rating=g`
      );
      
      if (!response.ok) {
        throw new Error(`Giphy API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching clips:', error);
      throw error;
    }
  }

  /**
   * Search Clips
   */
  async searchClips(query: string, limit: number = 20, offset: number = 0): Promise<GiphyResponse> {
    try {
      const encodedQuery = encodeURIComponent(`${query} video`);
      const response = await fetch(
        `${this.baseUrl}/gifs/search?api_key=${this.apiKey}&q=${encodedQuery}&limit=${limit}&offset=${offset}&rating=g`
      );
      
      if (!response.ok) {
        throw new Error(`Giphy API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error searching clips:', error);
      throw error;
    }
  }

  /**
   * Get a random GIF
   */
  async getRandomGif(tag?: string): Promise<{ data: GiphyImage }> {
    try {
      const tagParam = tag ? `&tag=${encodeURIComponent(tag)}` : '';
      const response = await fetch(
        `${this.baseUrl}/gifs/random?api_key=${this.apiKey}${tagParam}&rating=g`
      );
      
      if (!response.ok) {
        throw new Error(`Giphy API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching random GIF:', error);
      throw error;
    }
  }
}

export const giphyService = new GiphyService();
/**
 * Yoruba Wisdom API Client
 * Connects to the local Python API server to retrieve dynamic Yoruba wisdom
 */

const API_BASE_URL = process.env.REACT_APP_YORUBA_API_URL || 'http://localhost:8000';

/**
 * Fetch Yoruba wisdom based on natal chart data
 * @param {Object} chartData - Natal chart data
 * @param {string} chartData.sunSign - Sun sign
 * @param {string} chartData.moonSign - Moon sign
 * @param {string} chartData.rising - Rising sign
 * @param {Array<string>} focusAreas - Areas to focus on (e.g., ['personality', 'orisha'])
 * @param {number} maxChunks - Maximum number of knowledge chunks to retrieve
 * @returns {Promise<Object>} Wisdom response with chunks and formatted context
 */
export async function getYorubaWisdom(chartData, focusAreas = ['orisha', 'personality'], maxChunks = 5) {
  try {
    const response = await fetch(`${API_BASE_URL}/wisdom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sun_sign: chartData.sunSign,
        moon_sign: chartData.moonSign,
        rising_sign: chartData.rising,
        focus_areas: focusAreas,
        max_chunks: maxChunks
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('Yoruba Wisdom API unavailable:', error.message);
    return null; // Gracefully degrade if API is offline
  }
}

/**
 * Check if the Yoruba Wisdom API is available
 * @returns {Promise<boolean>} True if API is healthy
 */
export async function checkApiHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000) // 3 second timeout
    });
    return response.ok;
  } catch (error) {
    console.warn('Yoruba Wisdom API health check failed:', error.message);
    return false;
  }
}

/**
 * Format wisdom chunks for display in the UI
 * @param {Array<Object>} chunks - Wisdom chunks from API
 * @returns {Array<Object>} Formatted chunks ready for display
 */
export function formatWisdomChunks(chunks) {
  if (!chunks || chunks.length === 0) return [];

  return chunks.map(chunk => ({
    content: chunk.content,
    source: chunk.source,
    section: chunk.section,
    type: chunk.type,
    relevance: Math.round(chunk.relevance),
    // Extract key themes from content
    isYoruba: chunk.content.toLowerCase().includes('ori') ||
               chunk.content.toLowerCase().includes('orisha') ||
               chunk.content.toLowerCase().includes('yoruba'),
    isWestern: chunk.content.toLowerCase().includes('jung') ||
                chunk.content.toLowerCase().includes('archetype') ||
                chunk.content.toLowerCase().includes('psychological')
  }));
}

export default { getYorubaWisdom, checkApiHealth, formatWisdomChunks };

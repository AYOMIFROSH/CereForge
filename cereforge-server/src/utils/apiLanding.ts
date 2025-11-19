import fs from 'fs';
import path from 'path';
import logger from './logger';

/**
 * Load and render API landing page HTML
 * Template variables: {{VERSION}}, {{ENVIRONMENT}}
 */
export function getApiLandingHtml(version: string, environment: string): string {
  try {
    const templatePath = path.join(__dirname, '../assets/apiLanding.html');
    
    // Read template file
    let html = fs.readFileSync(templatePath, 'utf-8');
    
    // Replace template variables
    html = html
      .replace(/\{\{VERSION\}\}/g, version)
      .replace(/\{\{ENVIRONMENT\}\}/g, environment);
    
    return html;
  } catch (error) {
    logger.error('Failed to load API landing page template:', error);
    
    // Fallback HTML if template not found
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cereforge API ${version}</title>
        <link rel="icon" type="image/x-icon" href="/favicon.ico">
      </head>
      <body style="font-family: sans-serif; text-align: center; padding: 2rem;">
        <h1>Cereforge API ${version}</h1>
        <p>Server is running</p>
      </body>
      </html>
    `;
  }
}
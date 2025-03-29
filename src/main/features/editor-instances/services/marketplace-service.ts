import fetch from 'node-fetch';
import { MarketplaceExtension } from '../types';

export class MarketplaceService {
  private static readonly API_URL = 'https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery';

  static async searchExtensions(query: string): Promise<MarketplaceExtension[]> {
    try {
      console.log('Searching for:', query);
      
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json;api-version=3.0-preview.1',
          'Accept-Encoding': 'gzip'
        },
        body: JSON.stringify({
          filters: [
            {
              criteria: [
                {
                  filterType: 8,
                  value: "Microsoft.VisualStudio.Code"
                },
                {
                  filterType: 10,
                  value: query
                }
              ],
              pageNumber: 1,
              pageSize: 100,
              sortBy: 0,
              sortOrder: 0
            }
          ],
          assetTypes: [],
          flags: 0
        })
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        console.error('Marketplace API error:', response.statusText);
        return [];
      }

      const data = await response.json();
      console.log('Raw API response:', JSON.stringify(data, null, 2));
      
      const parsed = this.parseResponse(data);
      console.log('Parsed extensions:', parsed);
      
      return parsed;
    } catch (error) {
      console.error('Error searching extensions:', error);
      return [];
    }
  }

  private static parseResponse(data: any): MarketplaceExtension[] {
    try {
      if (!data.results?.[0]?.extensions) {
        console.log('No extensions found in response');
        return [];
      }

      return data.results[0].extensions.map((ext: any) => {
        console.log('Processing extension:', ext.extensionName);
        return {
          identifier: {
            id: `${ext.publisher.publisherName}.${ext.extensionName}`
          },
          name: ext.extensionName,
          displayName: ext.displayName || ext.extensionName,
          description: ext.shortDescription || '',
          publisher: ext.publisher.publisherName,
          version: ext.versions[0].version,
          preview: ext.preview || false,
          icon: ext.versions[0].files.find((f: any) => f.assetType === "Microsoft.VisualStudio.Services.Icons.Default")?.source
        };
      });
    } catch (error) {
      console.error('Error parsing extension response:', error);
      console.error('Data received:', data);
      return [];
    }
  }
} 
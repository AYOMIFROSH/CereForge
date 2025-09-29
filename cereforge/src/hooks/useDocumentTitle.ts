import { useEffect } from 'react';

export const useDocumentTitle = (title: string, description?: string, canonicalPath?: string) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title; // Remove " | Cereforge" since it's already in the title
    
    // Handle canonical URL - ensure it starts with /
    const normalizedPath = canonicalPath?.startsWith('/') ? canonicalPath : `/${canonicalPath || ''}`;
    const canonicalUrl = `https://cereforge.com${normalizedPath === '/' ? '' : normalizedPath}`;
    
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    
    if (canonicalLink) {
      canonicalLink.href = canonicalUrl;
    } else {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      canonicalLink.href = canonicalUrl;
      document.head.appendChild(canonicalLink);
    }
    
    // Handle meta description if provided
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
      const originalDescription = metaDescription?.content;
      
      if (metaDescription) {
        metaDescription.content = description;
      }
      
      // Return cleanup for description too
      return () => {
        document.title = previousTitle;
        if (metaDescription && originalDescription) {
          metaDescription.content = originalDescription;
        }
      };
    }
    
    // Handle Open Graph URL
    let ogUrl = document.querySelector('meta[property="og:url"]') as HTMLMetaElement;
    if (ogUrl) {
      ogUrl.content = canonicalUrl;
    }
    
    return () => {
      document.title = previousTitle;
    };
  }, [title, description, canonicalPath]);
};
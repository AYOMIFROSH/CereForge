import { useEffect } from 'react';

export const useDocumentTitle = (title: string, description?: string, canonicalPath?: string) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} | Cereforge`;
    
    // Handle canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    const canonicalUrl = `https://cereforge.com${canonicalPath || ''}`;
    
    if (canonicalLink) {
      canonicalLink.setAttribute('href', canonicalUrl);
    } else {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      canonicalLink.setAttribute('href', canonicalUrl);
      document.head.appendChild(canonicalLink);
    }
    
    // Handle meta description if provided
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', description);
      }
    }
    
    // Handle Open Graph URL
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute('content', canonicalUrl);
    }
    
    return () => {
      document.title = previousTitle;
    };
  }, [title, description, canonicalPath]);
};
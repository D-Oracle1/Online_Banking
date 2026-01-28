/**
 * Site Settings Handler for Static HTML Pages
 * Fetches site settings from the API and dynamically updates page content
 */
(function() {
  'use strict';

  // Default settings fallback
  const defaultSettings = {
    bankName: 'Online Banking',
    tagline: 'Secure Banking Solutions',
    supportEmail: null,
    supportPhone: null,
    address: null,
    copyrightText: null,
    facebookUrl: null,
    twitterUrl: null,
    instagramUrl: null,
    linkedinUrl: null,
    whatsappNumber: null
  };

  // Cache key for localStorage
  const CACHE_KEY = 'site_settings_cache';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached settings if valid
   */
  function getCachedSettings() {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { settings, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return settings;
        }
      }
    } catch (e) {
      // Ignore cache errors
    }
    return null;
  }

  /**
   * Cache settings to localStorage
   */
  function cacheSettings(settings) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        settings,
        timestamp: Date.now()
      }));
    } catch (e) {
      // Ignore cache errors
    }
  }

  /**
   * Fetch site settings from API
   * Uses the optimized html-page endpoint that returns only needed fields
   */
  async function fetchSettings() {
    try {
      // Use the optimized HTML page settings endpoint
      const response = await fetch('/api/site-settings/html-page');
      if (!response.ok) {
        // Fallback to full settings endpoint if html-page is not available
        const fallbackResponse = await fetch('/api/site-settings');
        if (!fallbackResponse.ok) {
          throw new Error('Failed to fetch settings');
        }
        const settings = await fallbackResponse.json();
        cacheSettings(settings);
        return settings;
      }
      const settings = await response.json();
      cacheSettings(settings);
      return settings;
    } catch (error) {
      console.error('Error fetching site settings:', error);
      return null;
    }
  }

  /**
   * Update page title with bank name
   */
  function updatePageTitle(settings) {
    const titleElement = document.querySelector('title');
    if (titleElement && settings.bankName) {
      // Replace common patterns
      const currentTitle = titleElement.textContent;
      const patterns = [
        /Sterling Capital Bank/gi,
        /sterlingcapitalbank/gi
      ];

      let newTitle = currentTitle;
      patterns.forEach(pattern => {
        newTitle = newTitle.replace(pattern, settings.bankName);
      });

      titleElement.textContent = newTitle;
    }
  }

  /**
   * Update meta description with bank name
   */
  function updateMetaDescription(settings) {
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && settings.bankName) {
      const currentContent = metaDesc.getAttribute('content');
      const patterns = [
        /Sterling Capital Bank/gi,
        /sterlingcapitalbank/gi
      ];

      let newContent = currentContent;
      patterns.forEach(pattern => {
        newContent = newContent.replace(pattern, settings.bankName);
      });

      metaDesc.setAttribute('content', newContent);
    }
  }

  /**
   * Update elements with data-site-setting attribute
   */
  function updateDataAttributes(settings) {
    // Update bank name placeholders
    document.querySelectorAll('[data-site-setting="bankName"]').forEach(el => {
      if (settings.bankName) {
        el.textContent = settings.bankName;
      }
    });

    // Update copyright text
    document.querySelectorAll('[data-site-setting="copyright"]').forEach(el => {
      if (settings.copyrightText) {
        el.innerHTML = settings.copyrightText;
      } else if (settings.bankName) {
        const year = new Date().getFullYear();
        el.innerHTML = `Copyright ${year} by <a href="index-2.html">${settings.bankName}</a>. All Rights Reserved.`;
      }
    });

    // Update support email
    document.querySelectorAll('[data-site-setting="supportEmail"]').forEach(el => {
      if (settings.supportEmail) {
        if (el.tagName === 'A') {
          el.href = `mailto:${settings.supportEmail}`;
          el.textContent = settings.supportEmail;
        } else {
          el.textContent = settings.supportEmail;
        }
      }
    });

    // Update support phone
    document.querySelectorAll('[data-site-setting="supportPhone"]').forEach(el => {
      if (settings.supportPhone) {
        if (el.tagName === 'A') {
          el.href = `tel:${settings.supportPhone}`;
          el.textContent = settings.supportPhone;
        } else {
          el.textContent = settings.supportPhone;
        }
      }
    });

    // Update address
    document.querySelectorAll('[data-site-setting="address"]').forEach(el => {
      if (settings.address) {
        el.textContent = settings.address;
      }
    });

    // Update tagline
    document.querySelectorAll('[data-site-setting="tagline"]').forEach(el => {
      if (settings.tagline) {
        el.textContent = settings.tagline;
      }
    });
  }

  /**
   * Update footer links that contain the bank name
   */
  function updateFooterLinks(settings) {
    if (!settings.bankName) return;

    // Find and update links containing the old bank name
    document.querySelectorAll('a').forEach(link => {
      const text = link.textContent;
      const patterns = [
        /About Sterling Capital Bank/gi,
        /Sterling Capital Bank/gi
      ];

      patterns.forEach(pattern => {
        if (pattern.test(text)) {
          link.textContent = text.replace(pattern, pattern.source.includes('About')
            ? `About ${settings.bankName}`
            : settings.bankName);
        }
      });
    });
  }

  /**
   * Update copyright section
   */
  function updateCopyright(settings) {
    if (!settings.bankName) return;

    // Find copyright elements
    document.querySelectorAll('.copyright p, .copyright').forEach(el => {
      const html = el.innerHTML;
      const patterns = [
        /Sterling Capital Bank/gi
      ];

      patterns.forEach(pattern => {
        if (pattern.test(html)) {
          el.innerHTML = html.replace(pattern, settings.bankName);
        }
      });
    });
  }

  /**
   * Update all text nodes containing the bank name
   */
  function updateTextContent(settings) {
    if (!settings.bankName) return;

    const bankNamePatterns = [
      /Sterling Capital Bank/g,
      /sterlingcapitalbank/gi
    ];

    // Walk through all text nodes
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    textNodes.forEach(textNode => {
      let text = textNode.textContent;
      let changed = false;

      bankNamePatterns.forEach(pattern => {
        if (pattern.test(text)) {
          text = text.replace(pattern, settings.bankName);
          changed = true;
        }
      });

      if (changed) {
        textNode.textContent = text;
      }
    });
  }

  /**
   * Apply all settings to the page
   */
  function applySettings(settings) {
    if (!settings) {
      settings = defaultSettings;
    }

    // Apply settings in order
    updatePageTitle(settings);
    updateMetaDescription(settings);
    updateDataAttributes(settings);
    updateFooterLinks(settings);
    updateCopyright(settings);
    updateTextContent(settings);

    // Show the page now that settings are applied
    document.documentElement.style.visibility = 'visible';
    document.documentElement.style.opacity = '1';

    // Dispatch event for custom handling
    window.dispatchEvent(new CustomEvent('siteSettingsLoaded', { detail: settings }));
  }

  /**
   * Initialize site settings
   */
  async function initSiteSettings() {
    // First, try to use cached settings for immediate display
    const cachedSettings = getCachedSettings();
    if (cachedSettings) {
      applySettings(cachedSettings);
    }

    // Fetch fresh settings from API
    const freshSettings = await fetchSettings();
    if (freshSettings) {
      applySettings(freshSettings);
    } else if (!cachedSettings) {
      // Use defaults if no cache and fetch failed
      applySettings(defaultSettings);
    }
  }

  // Export for external use
  window.SiteSettings = {
    init: initSiteSettings,
    apply: applySettings,
    fetch: fetchSettings,
    getCache: getCachedSettings
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSiteSettings);
  } else {
    initSiteSettings();
  }
})();

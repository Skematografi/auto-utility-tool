// Google Analytics Integration

// GA4 Measurement ID
const GA_MEASUREMENT_ID = 'G-WZL19J1FSP';

(function initAnalytics() {
  const host = location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1' || location.protocol === 'file:';
  if (isLocal) {
    console.info('Google Analytics: disabled on local run.');
    return;
  }

  // Load Google Analytics script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize gtag function
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
    anonymize_ip: true,
  });

  // Expose gtag globally for custom events
  window.gtag = gtag;
})();

/**
 * Track custom events
 * @param {string} eventName - Event name
 * @param {Object} eventData - Event data object
 */
function trackEvent(eventName, eventData = {}) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, eventData);
    console.log(`Event tracked: ${eventName}`, eventData);
  }
}

/**
 * Track tool usage (called from tab logic)
 * @param {string} toolName - Name of the tool/tab used
 */
function trackToolUsage(toolName) {
  trackEvent('tool_used', {
    tool_name: toolName,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track file uploads
 * @param {string} fileName - Name of uploaded file
 * @param {string} fileType - Type/format of file
 * @param {number} fileSize - Size in bytes
 */
function trackFileUpload(fileName, fileType, fileSize) {
  trackEvent('file_uploaded', {
    file_name: fileName,
    file_type: fileType,
    file_size: fileSize,
  });
}

/**
 * Track copy actions
 * @param {string} contentType - Type of content copied (e.g., 'sql_result', 'calculation')
 */
function trackCopy(contentType) {
  trackEvent('content_copied', {
    content_type: contentType,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track download actions
 * @param {string} downloadType - Type of download (e.g., 'sql_file', 'zip')
 * @param {string} fileName - Name of file downloaded
 */
function trackDownload(downloadType, fileName) {
  trackEvent('file_downloaded', {
    download_type: downloadType,
    file_name: fileName,
    timestamp: new Date().toISOString(),
  });
}

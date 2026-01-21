// GitHub Enhancer Extension - Content Script
// Adds tooltips to various elements on GitHub conversation pages

(function() {
  'use strict';

  // Create tooltip element
  function createTooltip() {
    const tooltip = document.createElement('div');
    tooltip.className = 'gh-enhancer-tooltip';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);
    return tooltip;
  }

  // Show tooltip
  function showTooltip(element, text, tooltipElement) {
    tooltipElement.textContent = text;
    tooltipElement.style.display = 'block';
    
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltipElement.getBoundingClientRect();
    
    // Position tooltip above the element
    let top = rect.top - tooltipRect.height - 8;
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    
    // Keep tooltip within viewport
    if (top < 0) {
      // Show below if not enough space above
      top = rect.bottom + 8;
    }
    
    if (left < 0) {
      left = 8;
    } else if (left + tooltipRect.width > window.innerWidth) {
      left = window.innerWidth - tooltipRect.width - 8;
    }
    
    tooltipElement.style.top = top + window.scrollY + 'px';
    tooltipElement.style.left = left + window.scrollX + 'px';
  }

  // Hide tooltip
  function hideTooltip(tooltipElement) {
    tooltipElement.style.display = 'none';
  }

  // Shared tooltip element
  let tooltipElement = null;

  // Add tooltips to elements
  function addTooltips() {
    // Create tooltip element only once
    if (!tooltipElement) {
      tooltipElement = createTooltip();
    }
    
    // specialized Diff Coverage Tooltips
    addDiffCoverageTooltips();
  }

  function attachTooltipEvents(element, text) {
    element.addEventListener('mouseenter', () => {
      showTooltip(element, text, tooltipElement);
    });
    element.addEventListener('mouseleave', () => {
      hideTooltip(tooltipElement);
    });
  }

  function addDiffCoverageTooltips() {
    // 1. Coverage Badge (Image)
    const coverageCleanBadges = document.querySelectorAll('img[alt="Coverage"]');
    console.log(coverageCleanBadges);
    coverageCleanBadges.forEach(img => {
       if (img.hasAttribute('data-gh-enhancer-tooltip')) return;
       img.setAttribute('data-gh-enhancer-tooltip', 'true');
       img.classList.add('gh-tooltip-target');
       img.style.paddingBottom = '2px';
       
       attachTooltipEvents(img, "Overall codebase coverage");
    });

    // 2. Coverage Table (Tests, Skipped, Failures...)
    const ths = document.querySelectorAll('th');
    ths.forEach(th => {
      const headerText = th.textContent.trim();
      let tooltipText = null;
      
      const headerMap = {
        'Tests': "Total tests executed",
        'Skipped': "Tests skipped during run",
        'Failures': "Assertion failures",
        'Errors': "Unhandled Exceptions",
        'Time': "Test execution time"
      };
      
      tooltipText = headerMap[headerText];

      if (tooltipText) {

        // Add tooltip to the corresponding cell in the body
        const index = Array.from(th.parentNode.children).indexOf(th);
        const table = th.closest('table');
        if (table) {
          const tds = table.querySelectorAll(`tbody tr td:nth-child(${index + 1})`);
          tds.forEach(td => {
             if (!td.hasAttribute('data-gh-enhancer-tooltip')) {
               td.setAttribute('data-gh-enhancer-tooltip', 'true');
               // Wrap content in span
               td.innerHTML = '<span class="gh-tooltip-target" data-tip="' + tooltipText + '">' + td.innerHTML + '</span>';
               const span = td.querySelector('.gh-tooltip-target');
               attachTooltipEvents(span, tooltipText);
             }
          });
        }
      }
    });

    // 3. Diff Coverage Header
    const headings = document.querySelectorAll('h1');
    headings.forEach(h => {
      if (h.textContent.includes('Diff Coverage:')) {
         if (!h.hasAttribute('data-gh-enhancer-tooltip')) {
            h.setAttribute('data-gh-enhancer-tooltip', 'true');
            
            // Split to isolate percentage
            // Expected format: "Diff Coverage: 91%"
            const parts = h.innerHTML.split('Diff Coverage:');
            if (parts.length > 1) {
               const percentage = parts[1].trim();
               h.innerHTML = `Diff Coverage: <span class="gh-tooltip-target" data-tip="Percentage of code covered in this PR">${percentage}</span>`;
               const span = h.querySelector('.gh-tooltip-target');
               attachTooltipEvents(span, "Percentage of code covered in this PR");
            }
         }
      }
    });

    // 4. File Lists and Summary
    const lis = document.querySelectorAll('li');
    lis.forEach(li => {
      if (li.hasAttribute('data-gh-enhancer-tooltip')) return;
      
      const text = li.textContent;
      
      // File entries
      if (text.includes('%') && text.includes('kernel/')) {
        const fileRegex = /([a-zA-Z0-9_\/]+\.py)\s\((\d+(\.\d+)?%)\)(:\sMissing\slines\s(.*))?/;
        const match = text.match(fileRegex);
        if (match) {
           li.setAttribute('data-gh-enhancer-tooltip', 'true');
           
           const filePath = match[1];
           const percentage = match[2];
           const missingPart = match[4];
           const missingNums = match[5];

           let newHtml = `${filePath} <span class="gh-tooltip-target" data-tip="Percentage of code covered in this file' diff">${percentage}</span>`;
           
           if (missingPart) {
             newHtml += `: Missing lines <span class="gh-tooltip-target" data-tip="Missing coverage line numbers">${missingNums}</span>`;
           }
           
           li.innerHTML = newHtml;
           
           const spans = li.querySelectorAll('.gh-tooltip-target');
           spans.forEach(span => {
              attachTooltipEvents(span, span.getAttribute('data-tip'));
           });
        }
      } 
      // Summary items
      else {
        const summaryMaps = {
          'Total': { condition: 'lines', tooltip: 'Number of changed lines in this PR' },
          'Missing': { condition: 'lines', tooltip: 'Number of lines with missing coverage' },
          'Coverage': { condition: '%', tooltip: 'same as above diff coverage' }
        };

        for (const [prefix, config] of Object.entries(summaryMaps)) {
           if (text.startsWith(prefix + ':') && text.includes(config.condition)) {
             const parts = text.split(':');
             if (parts.length > 1) {
                li.setAttribute('data-gh-enhancer-tooltip', 'true');
                const numPart = parts[1].trim();
                // Safe string construction
                li.innerHTML = prefix + ': <span class="gh-tooltip-target" data-tip="' + config.tooltip + '">' + numPart + '</span>';
                const span = li.querySelector('.gh-tooltip-target');
                attachTooltipEvents(span, span.getAttribute('data-tip'));
             }
             break;
           }
        }
      }
    });
  }

  // Initialize tooltips when DOM is ready
  function init() {
    console.log('Extension Loaded');
    try {
      addTooltips();
      
      // Re-add tooltips when DOM changes (for dynamically loaded content)
      const observer = new MutationObserver(() => {
        addTooltips();
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    } catch (error) {
      // Silently handle errors to prevent page loading issues
      console.error('Extension Error:', error);
    }
  }

  // Start the extension
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

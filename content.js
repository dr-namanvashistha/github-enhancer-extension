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
    tooltipElement.innerHTML = text;
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

  // Helper to determine status color/message based on percentage
  function getCoverageData(percentageStr) {
    const value = parseFloat(percentageStr);
    if (isNaN(value)) return { status: 'Unknown', message: 'Unable to calculate coverage status.' };
    
    if (value < 50) {
      return { 
        status: 'Critical', 
        message: '🔴 Critical: Coverage is very low. New tests are strictly required.',
        color: '#d73a49'
      };
    } else if (value < 80) {
      return { 
        status: 'Warning', 
        message: '🟡 Warning: Coverage is below standard (80%). Consider adding more tests.',
        color: '#dbab09'
      };
    } else {
      return { 
        status: 'Good', 
        message: '🟢 Good: Coverage meets quality standards.',
        color: '#28a745'
      };
    }
  }

  function addDiffCoverageTooltips() {
    // 1. Coverage Badge (Image)
    const coverageCleanBadges = document.querySelectorAll('img[alt="Coverage"]');
    coverageCleanBadges.forEach(img => {
       if (img.classList.contains('gh-tooltip-target')) return;
       img.classList.add('gh-tooltip-target');
       img.style.paddingBottom = '3px';
       
       // Try to parse percentage from src or alt if available, otherwise generic
       // Badge usually has typical text like "Coverage-48%"
       const match = img.src.match(/Coverage-(\d+)%/);
       let message = "<strong>Total Project Coverage</strong><br>The percentage of code covered in the entire repository.";
       if (match) {
         const data = getCoverageData(match[1]);
         message = `${message}<br> ${data.message}`;
       }
       
       attachTooltipEvents(img, message);
    });

    // 2. Coverage Table (Tests, Skipped, Failures...)
    const headings = document.querySelectorAll('th');
    const headerMap = {
      'Tests': '<strong>Total Tests</strong><br>Total number of unit tests executed.<br>ℹ️ Ensure this count increases with new features.',
      'Skipped': '<strong>Skipped Tests</strong><br>Tests that were bypassed.<br>⚠️ High numbers may indicate technical debt.',
      'Failures': '<strong>Test Failures</strong><br>Tests that failed assertions.<br>❌ Must be fixed before merging.',
      'Errors': '<strong>Test Errors</strong><br>Runtime exceptions during testing.<br>🔥 Investigate immediately.',
      'Time': '<strong>Execution Time</strong><br>Total execution time for the test suite.<br>⏱️ Watch for performance regressions.'
    };
    
    headings.forEach(th => {
      const headerText = th.textContent.trim();
      let tooltipText = headerMap[headerText];

      if (tooltipText) {
        // Add tooltip to the corresponding cell in the body
        const index = Array.from(th.parentNode.children).indexOf(th);
        const tbody = th.closest('table').nextElementSibling || th.closest('table').querySelector('tbody');
        
        if (tbody) {
           const rows = tbody.querySelectorAll('tr');
           rows.forEach(row => {
             const cell = row.children[index];
             if (cell && !cell.hasAttribute('data-gh-enhancer-tooltip')) {
               cell.setAttribute('data-gh-enhancer-tooltip', 'true');
               
               // Decision driven check for Failures/Errors
               let cellMessage = tooltipText;
               const cellValue = parseInt(cell.textContent.trim());
               if ((headerText === 'Failures' || headerText === 'Errors') && cellValue > 0) {
                 cellMessage = `⛔ BLOCKER: ${cellValue} ${headerText} found. PR cannot be merged.`;
                 cell.style.color = '#d73a49'; // Visual reinforcement
                 cell.style.fontWeight = 'bold';
               }

               cell.innerHTML = '<span class="gh-tooltip-target" data-tip="' + cellMessage + '">' + cell.innerHTML + '</span>';
               const span = cell.querySelector('.gh-tooltip-target');
               attachTooltipEvents(span, cellMessage);
             }
           });
        }
      }
    });

    // 3. Diff Coverage Header
    const diffHeadings = document.querySelectorAll('h1');
    diffHeadings.forEach(h => {
      if (h.textContent.includes('Diff Coverage:')) {
         if (!h.hasAttribute('data-gh-enhancer-tooltip')) {
            h.setAttribute('data-gh-enhancer-tooltip', 'true');
            
            const parts = h.innerHTML.split('Diff Coverage:');
            if (parts.length > 1) {
               const percentageStr = parts[1].trim();
               const percentage = parseFloat(percentageStr);
               const data = getCoverageData(percentage);
               
               // Color logic: Green if > 50, else Red
               const headerColor = percentage > 50 ? '#2da44e' : '#cf222e';
               
               const tooltip = `<strong>Diff Coverage</strong><br>The percentage of modified lines covered by tests in this PR.<br> ${data.message}`;
               h.innerHTML = `Diff Coverage: <span class="gh-tooltip-target" style="color: ${headerColor} !important;" data-tip="${tooltip}">${percentageStr}</span>`;
               const span = h.querySelector('.gh-tooltip-target');
               attachTooltipEvents(span, tooltip);
            }
         }
      }
    });
    
    // 4. File List Parsing (Robust)
    // Looking for pattern: "filename.py (percentage%): Missing lines ..." or "filename.py (100%)"
    const listItems = document.querySelectorAll('li');
    listItems.forEach(li => {
        if (li.hasAttribute('data-gh-enhancer-tooltip')) return;
        
        // Regex to match:
        // Group 1: Filename (lazy match until space+paren)
        // Group 2: Percentage (inside parens)
        // Group 3: Missing lines ranges (optional)
        const regex = /(.+?)\s+\((\d+(?:\.\d+)?%)\)(?::\s+Missing lines\s+(.+))?/;
        const match = li.innerText.match(regex); // parse text only

        // Validation: Ensure it looks like a file path (contains dots or slashes) to avoid false positives
        if (match && (match[1].includes('/') || match[1].includes('.'))) {
            li.setAttribute('data-gh-enhancer-tooltip', 'true');
            
            const [_, filename, percentage, missingLines] = match;
            const data = getCoverageData(percentage);
            
            // Construct new HTML with tooltips
            // 1. Filename: No tooltip (User Request)
            // 2. Percentage: Status tooltip + Data description
            // 3. Missing Lines: Tooltip on numbers only (User Request)
            
            let newHtml = `${filename}`;
            
            const fileTooltip = `<strong>File Coverage</strong><br>The percentage of trackable lines covered in this file.<br> ${data.message}`;
            newHtml += ` (<span class="gh-tooltip-target" data-tip="${fileTooltip}">${percentage}</span>)`;
            
            if (missingLines) {
                 const missingTooltip = "<strong>Uncovered Lines</strong><br>Specific line numbers in this file that are not executed by tests.<br>⚠️ Risk Area. Add test cases to cover these lines.";
                 newHtml += `: Missing lines <span class="gh-tooltip-target" data-tip="${missingTooltip}">${missingLines}</span>`;
            }
            
            li.innerHTML = newHtml;
            
            // Re-attach events
            const spans = li.querySelectorAll('.gh-tooltip-target');
            spans.forEach(span => {
                attachTooltipEvents(span, span.getAttribute('data-tip'));
            });
        }
    });
    
    // 5. Summary List (Totals)
    // "Total: 21 lines", "Missing: 18 lines", "Coverage: 14%"
    // These are also <li> but usually simpler
    const summaryItems = document.querySelectorAll('li');
    summaryItems.forEach(li => {
        if (li.hasAttribute('data-gh-enhancer-tooltip')) return;
        
        const text = li.textContent.trim();
        // Check strict formats
        let tooltip = null;
        
        if (text.startsWith('Total:')) {
            tooltip = "<strong>Total Lines</strong><br>The number of lines modified in this PR that are eligible for coverage tracking.<br>ℹ️ Base for coverage calculation.";
        } else if (text.startsWith('Missing:')) {
            tooltip = "<strong>Missing Lines</strong><br>The count of modified lines that are not executed by any test.<br>⚠️ Reduce this number to improve coverage score.";
        } else if (text.startsWith('Coverage:')) {
            // "Coverage: 14%"
            const val = parseFloat(text.split(':')[1]);
            const data = getCoverageData(val);
            tooltip = `<strong>Diff Coverage</strong><br>The percentage of modified lines covered by tests in this PR.<br> ${data.message}`;
        }
        
        if (tooltip) {
             li.setAttribute('data-gh-enhancer-tooltip', 'true');
             // Wrap the value part
             const parts = li.innerHTML.split(':');
             if (parts.length > 1) {
                 li.innerHTML = `${parts[0]}: <span class="gh-tooltip-target" data-tip="${tooltip}">${parts[1]}</span>`;
                 const span = li.querySelector('.gh-tooltip-target');
                 attachTooltipEvents(span, tooltip);
             }
        }
    });
  }

  // Debounce function to limit execution frequency
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Initialize tooltips when DOM is ready
  function init() {
    console.log('Extension Loaded');
    try {
      addTooltips();
      
      // Debounced version of addTooltips for the observer
      // waits 100ms after the last mutation to run
      const debouncedAddTooltips = debounce(() => {
        addTooltips();
      }, 100);

      // Re-add tooltips when DOM changes (for dynamically loaded content)
      const observer = new MutationObserver(() => {
        debouncedAddTooltips();
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

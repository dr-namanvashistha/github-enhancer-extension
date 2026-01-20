// GitHub Enhancer Extension - Content Script
// Adds tooltips to various elements on GitHub conversation pages

(function() {
  'use strict';

  // Tooltip configuration for different elements
  const tooltipConfig = {
    // Issue/PR author
    '.timeline-comment-header .author': {
      tooltip: 'The author of this issue/pull request'
    },
    // Labels
    '.IssueLabel': {
      tooltip: 'Label to categorize this issue/PR'
    },
    // Assignees
    '.sidebar-assignee': {
      tooltip: 'Person assigned to work on this issue/PR'
    },
    // Reviewers
    '.sidebar-reviewer': {
      tooltip: 'Person requested to review this PR'
    },
    // Milestone
    '.sidebar-milestone': {
      tooltip: 'Milestone associated with this issue/PR'
    },
    // Linked issues/PRs
    '.issue-link': {
      tooltip: 'Related issue or pull request'
    },
    // Comment reactions
    '.comment-reactions-options': {
      tooltip: 'Add a reaction to this comment'
    },
    // Edit button
    '.timeline-comment-action': {
      tooltip: 'Edit or manage this comment'
    },
    // Subscribe button
    '.sidebar-notifications': {
      tooltip: 'Subscribe to notifications for this issue/PR'
    },
    // Lock conversation button
    '.lock-toggle-link': {
      tooltip: 'Lock conversation to prevent new comments'
    },
    // Code suggestions
    '.js-comment-update': {
      tooltip: 'Update or edit this comment'
    },
    // Commit references
    '.commit-link': {
      tooltip: 'View this commit'
    },
    // Status badges
    '.State': {
      tooltip: 'Current status of this issue/PR'
    },
    // Markdown toolbar buttons
    '.toolbar-item': {
      tooltip: 'Markdown formatting option'
    }
  };

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
    
    // Standard config-based tooltips
    Object.keys(tooltipConfig).forEach(selector => {
      const elements = document.querySelectorAll(selector);
      const config = tooltipConfig[selector];
      
      elements.forEach(element => {
        if (element.hasAttribute('data-gh-enhancer-tooltip')) return;
        
        element.setAttribute('data-gh-enhancer-tooltip', 'true');
        let tooltipText = config.tooltip;
        
        if (selector === '.IssueLabel') {
          const labelName = element.getAttribute('data-name') || element.textContent.trim();
          tooltipText = `Label: ${labelName}`;
        } else if (selector === '.State') {
          const state = element.textContent.trim();
          tooltipText = `Status: ${state}`;
        } else if (selector === '.author') {
          const author = element.textContent.trim();
          tooltipText = `Author: ${author}`;
        }
        
        attachTooltipEvents(element, tooltipText);
      });
    });

    // Specialized Diff Coverage Tooltips
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
    // Look for the GitHub Actions comment body
    // In real GitHub, this is likely inside a comment container.
    // We'll search for the badges and tables typical of the coverage report.
    
    // 1. Coverage Badge (Image)
    const coverageCleanBadges = document.querySelectorAll('img[alt="Coverage"]');
    coverageCleanBadges.forEach(img => {
       if (img.hasAttribute('data-gh-enhancer-tooltip')) return;
       img.setAttribute('data-gh-enhancer-tooltip', 'true');
       // For images, we can't use ::after, so we might need a wrapper or just skip the icon for the big badge 
       // as it's already an image. But the user asked for icons.
       // Let's wrap it? Or maybe just simple title is enough for image. 
       // User said "datapoint", usually implies text/numbers.
       // Let's skip icon for the badge image itself to avoid layout breakage, 
       // or maybe key "numbers" from the request "add the tooltip on the numbers".
       attachTooltipEvents(img, "Overall codebase coverage");
    });

    // 2. Coverage Table (Tests, Skipped, Failures...)
    // Strategy: Find table headers, match columns
    const ths = document.querySelectorAll('th');
    ths.forEach(th => {
      const headerText = th.textContent.trim();
      let tooltipText = null;
      
      if (headerText === 'Tests') tooltipText = "Total tests executed";
      else if (headerText === 'Skipped') tooltipText = "Tests skipped during run";
      else if (headerText === 'Failures') tooltipText = "Assertion failures";
      else if (headerText === 'Errors') tooltipText = "Unhandled Exceptions";
      else if (headerText === 'Time') tooltipText = "Test execution time";

      if (tooltipText) {
        // Add tooltip to the header itself
        if (!th.hasAttribute('data-gh-enhancer-tooltip')) {
          th.setAttribute('data-gh-enhancer-tooltip', 'true');
          th.classList.add('gh-enhancer-has-icon');
          attachTooltipEvents(th, tooltipText);
        }

        // Add tooltip to the corresponding cell in the body
        // Get index
        const index = Array.from(th.parentNode.children).indexOf(th);
        const table = th.closest('table');
        if (table) {
          const tds = table.querySelectorAll(`tbody tr td:nth-child(${index + 1})`);
          tds.forEach(td => {
             if (!td.hasAttribute('data-gh-enhancer-tooltip')) {
               td.setAttribute('data-gh-enhancer-tooltip', 'true');
               td.classList.add('gh-enhancer-has-icon');
               attachTooltipEvents(td, tooltipText);
             }
          });
        }
      }
    });

    // 3. Diff Coverage Header
    // "Diff Coverage: 91%"
    const headings = document.querySelectorAll('h2, h3, h4');
    headings.forEach(h => {
      if (h.textContent.includes('Diff Coverage:')) {
         if (!h.hasAttribute('data-gh-enhancer-tooltip')) {
            h.setAttribute('data-gh-enhancer-tooltip', 'true');
            h.classList.add('gh-enhancer-has-icon');
            attachTooltipEvents(h, "Percentage of code covered in this PR");
         }
      }
    });

    // 4. File Lists and Summary
    // We look for list items containing specific patterns
    const lis = document.querySelectorAll('li');
    lis.forEach(li => {
      if (li.hasAttribute('data-gh-enhancer-tooltip')) return;
      
      const text = li.textContent;
      
      // File entries: "kernel/... (82.4%): Missing lines 216..."
      if (text.includes('%') && text.includes('kernel/')) {
        // We want to verify it's a file path structure.
        // It seems the user wants tooltips on specific parts? 
        // "File coverage" -> "Percentage of code covered in this file' diff"
        // "Missing lines calls" -> "Missing coverage line numbers"
        
        // This is tricky if we want to tooltip *parts* of the text node.
        // For simplicity, let's tooltip the whole LI or wrap parts in spans if strictly necessary.
        // The request says "on each datapoint i want to add the tooltip on the numbers".
        // To do that closely, we'd need to modify the DOM to wrap numbers.
        // Let's try wrapping the percentage and missing lines in spans.
        
        const fileRegex = /([a-zA-Z0-9_\/]+\.py)\s\((\d+(\.\d+)?%)\)(:\sMissing\slines\s(.*))?/;
        const match = text.match(fileRegex);
        if (match) {
           li.setAttribute('data-gh-enhancer-tooltip', 'true'); // mark processed
           
           // We need to rebuild the HTML for this LI to attach event listeners to specific spans
           // Using simple replacement for now
           const filePath = match[1];
           const percentage = match[2];
           const missingPart = match[4]; // ": Missing lines ..."
           const missingNums = match[5];

           let newHtml = `${filePath} <span class="gh-tooltip-target gh-enhancer-has-icon" data-tip="Percentage of code covered in this file' diff">${percentage}</span>`;
           
           if (missingPart) {
             newHtml += `: Missing lines <span class="gh-tooltip-target gh-enhancer-has-icon" data-tip="Missing coverage line numbers">${missingNums}</span>`;
           }
           
           li.innerHTML = newHtml;
           
           // Now attach events to the new spans
           const spans = li.querySelectorAll('.gh-tooltip-target');
           spans.forEach(span => {
              attachTooltipEvents(span, span.getAttribute('data-tip'));
           });
        }
      } 
      // Summary items
      else if (text.startsWith('Total:') && text.includes('lines')) {
         // Target the number
         const parts = text.split(':');
         if (parts.length > 1) {
            li.setAttribute('data-gh-enhancer-tooltip', 'true');
            const numPart = parts[1].trim();
            li.innerHTML = `Total: <span class="gh-tooltip-target gh-enhancer-has-icon" data-tip="Number of changed lines in this PR">${numPart}</span>`;
            const span = li.querySelector('.gh-tooltip-target');
            attachTooltipEvents(span, span.getAttribute('data-tip'));
         }
      } else if (text.startsWith('Missing:') && text.includes('lines')) {
         const parts = text.split(':');
         if (parts.length > 1) {
            li.setAttribute('data-gh-enhancer-tooltip', 'true');
            const numPart = parts[1].trim();
            li.innerHTML = `Missing: <span class="gh-tooltip-target gh-enhancer-has-icon" data-tip="Number of lines with missing coverage">${numPart}</span>`;
            const span = li.querySelector('.gh-tooltip-target');
            attachTooltipEvents(span, span.getAttribute('data-tip'));
         }
      } else if (text.startsWith('Coverage:') && text.includes('%')) {
         const parts = text.split(':');
         if (parts.length > 1) {
            li.setAttribute('data-gh-enhancer-tooltip', 'true');
            const numPart = parts[1].trim();
            li.innerHTML = `Coverage: <span class="gh-tooltip-target gh-enhancer-has-icon" data-tip="same as above diff coverage">${numPart}</span>`;
            const span = li.querySelector('.gh-tooltip-target');
            attachTooltipEvents(span, span.getAttribute('data-tip'));
         }
      }
    });

  }

  // Initialize tooltips when DOM is ready
  function init() {
    console.log('GitHub Enhancer Extension Loaded');
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
      console.error('Marrow Extension Error:', error);
    }
  }

  // Start the extension
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

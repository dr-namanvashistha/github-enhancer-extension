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

  // Add tooltips to elements
  function addTooltips() {
    const tooltip = createTooltip();
    
    Object.keys(tooltipConfig).forEach(selector => {
      const elements = document.querySelectorAll(selector);
      const config = tooltipConfig[selector];
      
      elements.forEach(element => {
        // Skip if already has a tooltip handler
        if (element.hasAttribute('data-gh-enhancer-tooltip')) {
          return;
        }
        
        element.setAttribute('data-gh-enhancer-tooltip', 'true');
        
        // Get custom tooltip text or use default
        let tooltipText = config.tooltip;
        
        // Customize tooltip based on element content
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
        
        element.addEventListener('mouseenter', () => {
          showTooltip(element, tooltipText, tooltip);
        });
        
        element.addEventListener('mouseleave', () => {
          hideTooltip(tooltip);
        });
      });
    });
  }

  // Initialize tooltips when DOM is ready
  function init() {
    addTooltips();
    
    // Re-add tooltips when DOM changes (for dynamically loaded content)
    const observer = new MutationObserver(() => {
      addTooltips();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Start the extension
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

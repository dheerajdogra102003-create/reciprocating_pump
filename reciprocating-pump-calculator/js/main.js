/**
 * Reciprocating Pump Performance Calculator
 * Global Site Controller (main.js)
 * Handles navigation, mobile drawer toggles, and global page interactions.
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    // 1. Mobile Menu Toggle
    var navToggle = document.querySelector('.nav-toggle');
    var navList = document.querySelector('.nav-list');

    if (navToggle && navList) {
      navToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = navList.classList.toggle('nav-open');
        navToggle.setAttribute('aria-expanded', isOpen);
      });

      // Close mobile menu when clicking outside
      document.addEventListener('click', function (e) {
        if (!navList.contains(e.target) && !navToggle.contains(e.target)) {
          navList.classList.remove('nav-open');
          navToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // 2. Dynamic Year in Footer
    var yearSpans = document.querySelectorAll('.current-year');
    var curYear = new Date().getFullYear();
    yearSpans.forEach(function (span) {
      span.textContent = curYear;
    });

    // 3. Highlight current page in nav links based on URL path
    var currentPath = window.location.pathname.toLowerCase();
    var navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href) return;
      var cleanHref = href.split('/').pop().toLowerCase();
      var cleanCurrent = currentPath.split('/').pop().toLowerCase();

      // If root/index
      if ((cleanCurrent === '' || cleanCurrent === 'index.html') && (cleanHref === 'index.html' || href === './' || href === '/')) {
        link.classList.add('active');
      } else if (cleanHref !== '' && cleanCurrent === cleanHref) {
        link.classList.add('active');
      }
    });

    // 4. Smooth Anchor Scrolling
    var anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var targetId = this.getAttribute('href').substring(1);
        var targetElem = document.getElementById(targetId);
        if (targetElem) {
          e.preventDefault();
          targetElem.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  });
})();


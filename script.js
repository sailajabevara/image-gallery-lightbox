'use strict';

/* ==========================================================================
   Light Table – Responsive Image Gallery & Accessible Lightbox
   Vanilla JS: fetch → render → event delegation → lightbox → focus trap
   ========================================================================== */

const API_URL = 'https://picsum.photos/v2/list?page=1&limit=16';
const BLANK_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

/* ---------- Global state ---------- */
let imagesData = [];
let currentIndex = 0;
let lastFocusedItem = null; // thumbnail that opened the lightbox

/* ---------- DOM references ---------- */
const galleryGrid = document.getElementById('gallery-container');
const galleryStatus = document.getElementById('gallery-status');
const mainContent = document.getElementById('main-content');
const modal = document.getElementById('lightbox-modal');
const closeButton = document.getElementById('lightbox-close');
const prevButton = document.getElementById('lightbox-prev');
const nextButton = document.getElementById('lightbox-next');
const lightboxImage = document.getElementById('lightbox-image');
const lightboxCounter = document.getElementById('lightbox-counter');
const lightboxAuthor = document.getElementById('lightbox-author');

/* ---------- Helpers ---------- */

function thumbnailUrl(item) {
  return `https://picsum.photos/id/${item.id}/480/360`;
}

function fullImageUrl(item) {
  return `https://picsum.photos/id/${item.id}/1600/1067`;
}

function altText(item) {
  return `Photograph by ${item.author}`;
}

/* ---------- Data fetching & rendering ---------- */

function createThumbnail(item, index) {
  const figure = document.createElement('figure');
  figure.classList.add('gallery-item');
  figure.dataset.index = index;
  figure.tabIndex = 0;
  figure.setAttribute('role', 'button');
  figure.setAttribute('aria-label', `Open ${altText(item).toLowerCase()} in full screen`);

  const img = document.createElement('img');
  img.src = thumbnailUrl(item);
  img.alt = altText(item);
  img.width = 480;
  img.height = 360;
  img.loading = 'lazy';

  const caption = document.createElement('figcaption');
  caption.classList.add('gallery-caption');
  caption.textContent = item.author;

  figure.append(img, caption);
  return figure;
}

function renderGallery(items) {
  // DocumentFragment batches the insertions into a single reflow
  const fragment = document.createDocumentFragment();
  items.forEach((item, index) => fragment.appendChild(createThumbnail(item, index)));
  galleryGrid.replaceChildren(fragment);
}

function showError() {
  galleryStatus.textContent = 'We couldn’t load the photographs. Check your connection and try again.';
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'retry-btn';
  retry.textContent = 'Try again';
  retry.addEventListener('click', initializeGallery, { once: true });
  galleryStatus.appendChild(retry);
}

async function initializeGallery() {
  galleryGrid.setAttribute('aria-busy', 'true');
  galleryStatus.textContent = 'Loading photographs…';

  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    const data = await response.json();

    imagesData = Array.isArray(data) ? data : [];
    renderGallery(imagesData);
    galleryStatus.textContent = '';
  } catch (error) {
    console.error('Failed to load gallery:', error);
    showError();
  } finally {
    galleryGrid.setAttribute('aria-busy', 'false');
  }
}

/* ---------- Lightbox ---------- */

function updateLightbox() {
  const item = imagesData[currentIndex];
  if (!item) return;

  lightboxImage.src = fullImageUrl(item);
  lightboxImage.alt = altText(item);
  lightboxCounter.textContent = `Image ${currentIndex + 1} of ${imagesData.length}`;
  lightboxAuthor.textContent = item.author;
}

function openLightbox(index) {
  currentIndex = index;
  updateLightbox();

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('lightbox-open');
  mainContent.inert = true; // keep the page behind the modal out of reach

  closeButton.focus();
  document.addEventListener('keydown', handleKeydown);
}

/**
 * Wrap-around navigation strategy: "Next" on the last image loops to the
 * first, and "Previous" on the first image loops to the last.
 */
function navigateLightbox(direction) {
  const total = imagesData.length;
  currentIndex = (currentIndex + direction + total) % total;
  updateLightbox();
}

function closeLightbox() {
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('lightbox-open');
  mainContent.inert = false;

  // Reset src so the previous image doesn't flash next time the modal opens
  lightboxImage.src = BLANK_IMAGE;

  // Remove the document-level listener when the modal is closed
  document.removeEventListener('keydown', handleKeydown);

  // Return focus to the thumbnail that opened the modal
  if (lastFocusedItem) {
    lastFocusedItem.focus();
    lastFocusedItem = null;
  }
}

/* ---------- Keyboard controls & focus trap ---------- */

function trapFocus(event) {
  const focusableElements = modal.querySelectorAll('button');
  const first = focusableElements[0];
  const last = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  } else if (!modal.contains(document.activeElement)) {
    // Safety net: focus somehow left the modal
    event.preventDefault();
    first.focus();
  }
}

function handleKeydown(event) {
  switch (event.key) {
    case 'Escape':
      closeLightbox();
      break;
    case 'ArrowRight':
      navigateLightbox(1);
      break;
    case 'ArrowLeft':
      navigateLightbox(-1);
      break;
    case 'Tab':
      trapFocus(event);
      break;
    default:
      break;
  }
}

/* ---------- Event listeners ---------- */

// Event delegation: one listener on the grid handles every thumbnail
function openFromEvent(event) {
  const item = event.target.closest('.gallery-item');
  if (!item || !galleryGrid.contains(item)) return false;

  lastFocusedItem = item;
  openLightbox(Number(item.dataset.index));
  return true;
}

galleryGrid.addEventListener('click', openFromEvent);

galleryGrid.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  if (event.target.closest('.gallery-item') !== event.target) return;
  event.preventDefault();
  openFromEvent(event);
});

closeButton.addEventListener('click', closeLightbox);
prevButton.addEventListener('click', () => navigateLightbox(-1));
nextButton.addEventListener('click', () => navigateLightbox(1));

// Backdrop dismissal: only when the modal container itself is clicked
modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeLightbox();
  }
});

/* ---------- Init ---------- */
initializeGallery();

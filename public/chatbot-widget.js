// Standalone Support Chatbot Widget - Matching Login/Signup Design
(function() {
  'use strict';

  // Create chatbot HTML structure
  function createChatbotHTML() {
    const chatbotContainer = document.createElement('div');
    chatbotContainer.id = 'support-chatbot-widget';
    chatbotContainer.innerHTML = `
      <!-- Chat Button -->
      <button id="chatbot-toggle-btn" class="chatbot-toggle-btn" aria-label="Open chat support">
        <div class="chatbot-icon-wrapper">
          <svg class="chatbot-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
          </svg>
          <span class="chatbot-status-dot">
            <span class="chatbot-status-ping"></span>
            <span class="chatbot-status-indicator"></span>
          </span>
        </div>
      </button>

      <!-- Chat Window -->
      <div id="chatbot-window" class="chatbot-window" style="display: none;">
        <!-- Header -->
        <div class="chatbot-header">
          <div class="chatbot-header-content">
            <div class="chatbot-avatar">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div>
              <h3 class="chatbot-title">Support Assistant</h3>
              <p class="chatbot-status">Online 24/7</p>
            </div>
          </div>
          <button id="chatbot-close-btn" class="chatbot-close-btn">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Name Form -->
        <div id="chatbot-name-form" class="chatbot-name-form" style="display: none;">
          <div class="chatbot-name-form-content">
            <div class="chatbot-name-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
            <h3 class="chatbot-name-title">Welcome to Sterling Capital Bank Support</h3>
            <p class="chatbot-name-description">Please tell us your name to continue chatting with our support team.</p>
            <input type="text" id="chatbot-name-input" class="chatbot-name-input" placeholder="Enter your name..." maxlength="50">
            <button type="button" id="chatbot-name-submit" class="chatbot-name-submit">Start Chat</button>
          </div>
        </div>

        <!-- Messages -->
        <div id="chatbot-messages" class="chatbot-messages"></div>

        <!-- Input -->
        <div id="chatbot-input-container" class="chatbot-input-container">
          <div id="chatbot-preview" class="chatbot-preview" style="display: none;">
            <div class="chatbot-preview-content">
              <div class="chatbot-preview-img-wrapper">
                <img id="chatbot-preview-img" src="" alt="Preview">
              </div>
              <div class="chatbot-preview-info">
                <div class="chatbot-preview-label">Image ready to send:</div>
                <div id="chatbot-filename" class="chatbot-filename"></div>
                <div id="chatbot-filesize" class="chatbot-filesize"></div>
              </div>
              <button id="chatbot-remove-file" class="chatbot-remove-file" type="button" title="Remove image">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>

          <div class="chatbot-input-row">
            <input type="file" id="chatbot-file-input" accept="image/*" style="display: none;">
            <button type="button" id="chatbot-attach-btn" class="chatbot-attach-btn" title="Attach image">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
              </svg>
            </button>
            <input type="text" id="chatbot-input" class="chatbot-input" placeholder="Type your message to support...">
            <button type="button" id="chatbot-send-btn" class="chatbot-send-btn" title="Send message to support team">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Lightbox Modal -->
      <div id="chatbot-lightbox" class="chatbot-lightbox">
        <button id="chatbot-lightbox-close" class="chatbot-lightbox-close">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        <div class="chatbot-lightbox-content">
          <img id="chatbot-lightbox-image" class="chatbot-lightbox-image" src="" alt="Full size view">
        </div>
        <div class="chatbot-lightbox-hint">Click outside or press ESC to close</div>
      </div>
    `;
    document.body.appendChild(chatbotContainer);
  }

  // Create and inject styles (matching login/signup design)
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Base styles */
      #support-chatbot-widget * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      }

      /* Toggle Button */
      .chatbot-toggle-btn {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
        border: none;
        cursor: pointer;
        box-shadow: 0 10px 40px rgba(30, 58, 138, 0.4);
        transition: all 0.3s ease;
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .chatbot-toggle-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 15px 50px rgba(30, 58, 138, 0.5);
      }

      .chatbot-icon-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .chatbot-icon {
        width: 28px;
        height: 28px;
        color: white;
      }

      .chatbot-status-dot {
        position: absolute;
        top: -4px;
        right: -4px;
        width: 14px;
        height: 14px;
      }

      .chatbot-status-ping {
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: #10b981;
        opacity: 0.75;
        animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
      }

      .chatbot-status-indicator {
        position: relative;
        display: block;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: #10b981;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
      }

      @keyframes ping {
        75%, 100% {
          transform: scale(2);
          opacity: 0;
        }
      }

      /* Chat Window */
      .chatbot-window {
        position: fixed;
        bottom: 0;
        right: 0;
        width: 100vw;
        height: 100vh;
        background: white;
        z-index: 999998;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: slideIn 0.3s ease;
      }

      @media (min-width: 640px) {
        .chatbot-window {
          bottom: 24px;
          right: 24px;
          width: 384px;
          height: 600px;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      /* Header */
      .chatbot-header {
        background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
        color: white;
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
      }

      @media (min-width: 640px) {
        .chatbot-header {
          border-top-left-radius: 16px;
          border-top-right-radius: 16px;
        }
      }

      .chatbot-header-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .chatbot-avatar {
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .chatbot-avatar svg {
        width: 24px;
        height: 24px;
      }

      .chatbot-title {
        font-size: 18px;
        font-weight: 600;
        margin: 0;
      }

      .chatbot-status {
        font-size: 13px;
        opacity: 0.9;
        margin: 2px 0 0 0;
      }

      .chatbot-close-btn {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        transition: background-color 0.2s;
      }

      .chatbot-close-btn:hover {
        background: rgba(255, 255, 255, 0.15);
      }

      .chatbot-close-btn svg {
        width: 20px;
        height: 20px;
      }

      /* Name Form */
      .chatbot-name-form {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: linear-gradient(135deg, #f9fafb 0%, #dbeafe 100%);
      }

      .chatbot-name-form-content {
        background: white;
        border-radius: 16px;
        padding: 32px;
        max-width: 320px;
        width: 100%;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        text-align: center;
      }

      .chatbot-name-icon {
        width: 64px;
        height: 64px;
        background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
      }

      .chatbot-name-icon svg {
        width: 32px;
        height: 32px;
        color: white;
      }

      .chatbot-name-title {
        font-size: 20px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 12px;
        line-height: 1.3;
      }

      .chatbot-name-description {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 24px;
        line-height: 1.6;
      }

      .chatbot-name-input {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-size: 15px;
        margin-bottom: 16px;
        transition: all 0.2s;
      }

      .chatbot-name-input:focus {
        outline: none;
        border-color: #1e3a8a;
        box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
      }

      .chatbot-name-submit {
        width: 100%;
        padding: 12px 24px;
        background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .chatbot-name-submit:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(30, 58, 138, 0.4);
      }

      .chatbot-name-submit:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }

      /* Messages */
      .chatbot-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        background: #f9fafb;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .chatbot-message {
        display: flex;
        gap: 8px;
        animation: messageSlideIn 0.3s ease;
      }

      @keyframes messageSlideIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .chatbot-message.user {
        flex-direction: row-reverse;
      }

      .chatbot-message-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .chatbot-message.admin .chatbot-message-avatar {
        background: #d1d5db;
        color: #4b5563;
      }

      .chatbot-message.user .chatbot-message-avatar {
        background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
        color: white;
      }

      .chatbot-message-avatar svg {
        width: 16px;
        height: 16px;
      }

      .chatbot-message-content {
        max-width: 75%;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .chatbot-message-bubble {
        padding: 12px 16px;
        border-radius: 16px;
        word-wrap: break-word;
        line-height: 1.5;
        font-size: 14px;
      }

      .chatbot-message.admin .chatbot-message-bubble {
        background: white;
        color: #1f2937;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .chatbot-message.user .chatbot-message-bubble {
        background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
        color: white;
        border-bottom-right-radius: 4px;
        margin-left: auto;
      }

      .chatbot-message-image {
        max-width: 100%;
        border-radius: 12px;
        margin-top: 8px;
        cursor: pointer;
        transition: transform 0.2s;
      }

      .chatbot-message-image:hover {
        transform: scale(1.02);
      }

      .chatbot-message-time {
        font-size: 11px;
        color: #9ca3af;
        padding: 0 4px;
      }

      .chatbot-message.admin .chatbot-message-time {
        text-align: left;
      }

      .chatbot-message.user .chatbot-message-time {
        text-align: right;
      }

      /* Input Container */
      .chatbot-input-container {
        padding: 16px;
        background: white;
        border-top: 1px solid #e5e7eb;
        flex-shrink: 0;
      }

      @media (min-width: 640px) {
        .chatbot-input-container {
          border-bottom-left-radius: 16px;
          border-bottom-right-radius: 16px;
        }
      }

      .chatbot-preview {
        margin-bottom: 12px;
        padding: 12px;
        background: #dbeafe;
        border: 1px solid #93c5fd;
        border-radius: 12px;
      }

      .chatbot-preview-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .chatbot-preview-img-wrapper {
        position: relative;
        flex-shrink: 0;
      }

      .chatbot-preview-content img {
        width: 64px;
        height: 64px;
        border-radius: 8px;
        display: block;
        border: 2px solid #1e3a8a;
        object-fit: cover;
      }

      .chatbot-preview-info {
        flex: 1;
        min-width: 0;
      }

      .chatbot-preview-label {
        font-size: 12px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 4px;
      }

      .chatbot-filename {
        font-size: 12px;
        color: #6b7280;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-bottom: 4px;
      }

      .chatbot-filesize {
        font-size: 11px;
        color: #9ca3af;
      }

      .chatbot-remove-file {
        flex-shrink: 0;
        width: 28px;
        height: 28px;
        background: #ef4444;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }

      .chatbot-remove-file:hover {
        transform: scale(1.1);
        background: #dc2626;
      }

      .chatbot-remove-file svg {
        width: 16px;
        height: 16px;
        color: white;
      }

      .chatbot-input-row {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .chatbot-attach-btn {
        width: 40px;
        height: 40px;
        border: 1px solid #d1d5db;
        background: #f9fafb;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        flex-shrink: 0;
      }

      .chatbot-attach-btn:hover {
        background: #e5e7eb;
        border-color: #1e3a8a;
      }

      .chatbot-attach-btn svg {
        width: 18px;
        height: 18px;
        color: #6b7280;
      }

      .chatbot-input {
        flex: 1;
        padding: 10px 16px;
        border: 1px solid #d1d5db;
        border-radius: 20px;
        font-size: 14px;
        transition: all 0.2s;
      }

      .chatbot-input:focus {
        outline: none;
        border-color: #1e3a8a;
        box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
      }

      .chatbot-send-btn {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        flex-shrink: 0;
      }

      .chatbot-send-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(30, 58, 138, 0.4);
      }

      .chatbot-send-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }

      .chatbot-send-btn svg {
        width: 18px;
        height: 18px;
        color: white;
      }

      /* Scrollbar */
      .chatbot-messages::-webkit-scrollbar {
        width: 6px;
      }

      .chatbot-messages::-webkit-scrollbar-track {
        background: transparent;
      }

      .chatbot-messages::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
      }

      .chatbot-messages::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }

      /* Lightbox Modal */
      .chatbot-lightbox {
        position: fixed;
        inset: 0;
        z-index: 1000000;
        background: rgba(0, 0, 0, 0.9);
        display: none;
        align-items: center;
        justify-content: center;
        padding: 16px;
        animation: fadeIn 0.2s ease;
      }

      .chatbot-lightbox.active {
        display: flex;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .chatbot-lightbox-close {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 40px;
        height: 40px;
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        transition: all 0.2s;
        z-index: 10;
      }

      .chatbot-lightbox-close:hover {
        opacity: 0.7;
      }

      .chatbot-lightbox-close svg {
        width: 32px;
        height: 32px;
      }

      .chatbot-lightbox-content {
        position: relative;
        max-width: 90vw;
        max-height: 90vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .chatbot-lightbox-image {
        max-width: 100%;
        max-height: 90vh;
        object-fit: contain;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      }

      .chatbot-lightbox-hint {
        position: absolute;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        color: white;
        font-size: 13px;
        background: rgba(0, 0, 0, 0.5);
        padding: 8px 16px;
        border-radius: 20px;
      }
    `;
    document.head.appendChild(style);
  }

  // Chatbot Class
  class Chatbot {
    constructor() {
      this.isOpen = false;
      this.messages = [];
      this.selectedFile = null;
      this.guestName = null;
      this.guestId = null;
      this.pollingInterval = null;

      this.init();
    }

    init() {
      createChatbotHTML();
      injectStyles();
      this.cacheElements();
      this.attachEventListeners();
      this.loadFromStorage();
      this.renderMessages();
    }

    cacheElements() {
      this.toggleBtn = document.getElementById('chatbot-toggle-btn');
      this.window = document.getElementById('chatbot-window');
      this.closeBtn = document.getElementById('chatbot-close-btn');
      this.messagesContainer = document.getElementById('chatbot-messages');
      this.input = document.getElementById('chatbot-input');
      this.sendBtn = document.getElementById('chatbot-send-btn');
      this.attachBtn = document.getElementById('chatbot-attach-btn');
      this.fileInput = document.getElementById('chatbot-file-input');
      this.preview = document.getElementById('chatbot-preview');
      this.previewImg = document.getElementById('chatbot-preview-img');
      this.removeFileBtn = document.getElementById('chatbot-remove-file');
      this.filename = document.getElementById('chatbot-filename');
      this.filesize = document.getElementById('chatbot-filesize');
      this.inputContainer = document.getElementById('chatbot-input-container');
      this.nameForm = document.getElementById('chatbot-name-form');
      this.nameInput = document.getElementById('chatbot-name-input');
      this.nameSubmitBtn = document.getElementById('chatbot-name-submit');
      this.lightbox = document.getElementById('chatbot-lightbox');
      this.lightboxImage = document.getElementById('chatbot-lightbox-image');
      this.lightboxClose = document.getElementById('chatbot-lightbox-close');
    }

    attachEventListeners() {
      this.toggleBtn.addEventListener('click', () => this.toggle());
      this.closeBtn.addEventListener('click', () => this.close());
      this.sendBtn.addEventListener('click', () => this.sendMessage());
      this.input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      this.attachBtn.addEventListener('click', () => this.fileInput.click());
      this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
      this.removeFileBtn.addEventListener('click', () => this.clearFile());

      this.nameSubmitBtn.addEventListener('click', () => this.submitName());
      this.nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.submitName();
        }
      });

      // Lightbox events
      this.lightboxClose.addEventListener('click', () => this.closeLightbox());
      this.lightbox.addEventListener('click', (e) => {
        if (e.target === this.lightbox) {
          this.closeLightbox();
        }
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.lightbox.classList.contains('active')) {
          this.closeLightbox();
        }
      });
    }

    openLightbox(imageUrl) {
      this.lightboxImage.src = imageUrl;
      this.lightbox.classList.add('active');
    }

    closeLightbox() {
      this.lightbox.classList.remove('active');
      this.lightboxImage.src = '';
    }

    generateGuestId() {
      return 'guest-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    showNameForm() {
      this.nameForm.style.display = 'flex';
      this.messagesContainer.style.display = 'none';
      this.inputContainer.style.display = 'none';
      setTimeout(() => this.nameInput.focus(), 100);
    }

    hideNameForm() {
      this.nameForm.style.display = 'none';
      this.messagesContainer.style.display = 'flex';
      this.inputContainer.style.display = 'block';
    }

    submitName() {
      const name = this.nameInput.value.trim();
      if (!name) {
        this.nameInput.focus();
        return;
      }

      this.guestName = name;
      this.guestId = this.generateGuestId();

      localStorage.setItem('chatbot_guest_name', this.guestName);
      localStorage.setItem('chatbot_guest_id', this.guestId);

      this.hideNameForm();
      this.addWelcomeMessage();
      this.startPolling();
    }

    addWelcomeMessage() {
      const welcomeMsg = {
        id: Date.now().toString(),
        text: `Hello ${this.guestName}! Welcome to Sterling Capital Bank Support. Our team is ready to assist you. How can we help you today?`,
        sender: 'admin',
        timestamp: new Date().toISOString()
      };
      this.messages.unshift(welcomeMsg);
      this.saveToStorage();
      this.renderMessages();
    }

    loadFromStorage() {
      try {
        const stored = localStorage.getItem('chatbot_messages');
        if (stored) {
          this.messages = JSON.parse(stored);
        }

        this.guestName = localStorage.getItem('chatbot_guest_name');
        this.guestId = localStorage.getItem('chatbot_guest_id');
      } catch (error) {
        console.error('Error loading from storage:', error);
      }
    }

    saveToStorage() {
      try {
        localStorage.setItem('chatbot_messages', JSON.stringify(this.messages));
      } catch (error) {
        console.error('Error saving to storage:', error);
      }
    }

    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    }

    open() {
      this.isOpen = true;
      this.window.style.display = 'flex';

      if (!this.guestName || !this.guestId) {
        this.showNameForm();
      } else {
        this.hideNameForm();
        this.input.focus();
        this.startPolling();
      }
    }

    close() {
      this.isOpen = false;
      this.window.style.display = 'none';
      this.stopPolling();
    }

    handleFileSelect(e) {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewImg.src = e.target.result;
        this.filename.textContent = file.name;
        this.filesize.textContent = (file.size / 1024).toFixed(1) + ' KB';
        this.preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }

    clearFile() {
      this.selectedFile = null;
      this.fileInput.value = '';
      this.preview.style.display = 'none';
      this.previewImg.src = '';
      this.filename.textContent = '';
      this.filesize.textContent = '';
    }

    async sendMessage() {
      const content = this.input.value.trim();

      if (!content && !this.selectedFile) return;
      if (!this.guestName || !this.guestId) return;

      this.sendBtn.disabled = true;
      this.input.disabled = true;

      try {
        const formData = new FormData();
        formData.append('content', content);
        formData.append('guestName', this.guestName);
        formData.append('guestId', this.guestId);

        if (this.selectedFile) {
          formData.append('image', this.selectedFile);
        }

        const response = await fetch('/api/messages/send-anonymous', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const result = await response.json();

        // Add user message to local display
        const userMessage = {
          id: result.messageId || Date.now().toString(),
          text: content,
          sender: 'user',
          timestamp: new Date().toISOString(),
          imageUrl: result.imageUrl || null
        };

        this.messages.unshift(userMessage);
        this.saveToStorage();
        this.renderMessages();

        // Clear input
        this.input.value = '';
        this.clearFile();

      } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
      } finally {
        this.sendBtn.disabled = false;
        this.input.disabled = false;
        this.input.focus();
      }
    }

    startPolling() {
      if (this.pollingInterval) return;

      this.pollingInterval = setInterval(() => {
        this.checkForResponses();
      }, 5000);

      this.checkForResponses();
    }

    stopPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
    }

    async checkForResponses() {
      if (!this.guestId) return;

      try {
        const response = await fetch(
          `/api/messages/check-anonymous?guestId=${encodeURIComponent(this.guestId)}`
        );

        if (!response.ok) return;

        const result = await response.json();

        if (result.messages && result.messages.length > 0) {
          const newMessages = [];

          result.messages.forEach(msg => {
            if (msg.senderType === 'admin') {
              if (!this.messages.some(m => m.id === msg.id)) {
                newMessages.push({
                  id: msg.id,
                  text: msg.message || '(No text)',
                  sender: 'admin',
                  timestamp: msg.createdAt,
                  imageUrl: msg.attachment || null
                });
              }
            }
          });

          if (newMessages.length > 0) {
            this.messages = [...this.messages, ...newMessages];
            this.saveToStorage();
            this.renderMessages();
          }
        }
      } catch (error) {
        console.error('Error checking for responses:', error);
      }
    }

    renderMessages() {
      this.messagesContainer.innerHTML = '';

      if (this.messages.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.style.cssText = 'text-align: center; color: #9ca3af; padding: 40px 20px; font-size: 14px;';
        emptyState.innerHTML = '<p>No messages yet. Start a conversation!</p>';
        this.messagesContainer.appendChild(emptyState);
        return;
      }

      [...this.messages].reverse().forEach(msg => {
        const messageEl = this.createMessageElement(msg);
        this.messagesContainer.appendChild(messageEl);
      });

      this.scrollToBottom();
    }

    createMessageElement(msg) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `chatbot-message ${msg.sender}`;

      const avatar = document.createElement('div');
      avatar.className = 'chatbot-message-avatar';

      if (msg.sender === 'admin') {
        avatar.innerHTML = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>`;
      } else {
        avatar.innerHTML = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>`;
      }

      const contentDiv = document.createElement('div');
      contentDiv.className = 'chatbot-message-content';

      if (msg.text) {
        const bubble = document.createElement('div');
        bubble.className = 'chatbot-message-bubble';
        bubble.textContent = msg.text;
        contentDiv.appendChild(bubble);
      }

      if (msg.imageUrl) {
        const img = document.createElement('img');
        img.src = msg.imageUrl;
        img.className = 'chatbot-message-image';
        img.alt = 'Attached image';
        img.onclick = () => this.openLightbox(msg.imageUrl);
        contentDiv.appendChild(img);
      }

      const time = document.createElement('div');
      time.className = 'chatbot-message-time';
      time.textContent = this.formatTime(msg.timestamp);
      contentDiv.appendChild(time);

      messageDiv.appendChild(avatar);
      messageDiv.appendChild(contentDiv);

      return messageDiv;
    }

    formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }

    scrollToBottom() {
      setTimeout(() => {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
      }, 100);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new Chatbot();
    });
  } else {
    new Chatbot();
  }
})();

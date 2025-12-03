# Fockey - Project Overview

## Purpose
Fockey is a Chrome Extension (Manifest V3) that transforms YouTube into a minimalist, distraction-free experience. The extension hides UI elements by default (thumbnails, recommendations, engagement buttons) while preserving intentional features like the search bar and video player.

## Core Principle
**Minimal by default. Everything else is opt-in.**

All implementation decisions must respect this principle. The extension enforces a clean, distraction-free default experience while preserving full user control through configurable settings.

## Key Features
- **Home Page**: Clean canvas with only search bar visible by default
- **Search Page**: Results-only view with long-form videos, hiding Shorts, posts, and recommendations
- **Watch Page**: Video player with title/description, hiding engagement buttons, comments, and recommendations
- **Granular Settings**: Users can selectively re-enable hidden elements via extension popup or settings page

## Project Type
Chrome Extension (Manifest V3) for Google Chrome Desktop

## Repository
https://github.com/DiegoRomario/fockey

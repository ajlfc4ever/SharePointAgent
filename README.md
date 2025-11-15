# SharePoint Assistant

An AI-powered SharePoint management assistant with Power Automate integration, built on Netlify.

## Overview

This application provides a natural language interface to manage SharePoint conversations, send emails, book meetings, and update SharePoint items through OpenAI and Power Automate flows.

## Features

- **Natural Language Interface**: Chat with an AI assistant powered by OpenAI
- **SharePoint Integration**: Query and manage SharePoint conversation records
- **Email Management**: Send emails and reply to existing threads
- **Meeting Booking**: Create calendar events with Teams meeting links
- **Item Management**: Update and delete SharePoint items
- **Secure Configuration**: All credentials stored securely using Netlify Blobs

## Setup

### Prerequisites

- Node.js v18.20.8+
- OpenAI API key
- Three Power Automate flows configured:
  - Flow D1: Fetch SharePoint Data
  - Flow D2: Perform SharePoint Action (send emails, book meetings)
  - Flow D3: Manage SharePoint Item (update/delete)

### Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Deploy to Netlify or run locally:
   ```bash
   npm run dev
   ```

4. Visit the deployed site and complete the setup wizard at `/setup`

## Usage

1. **Initial Setup**: On first visit, you'll be redirected to the setup wizard
   - Enter your OpenAI API key and model name
   - Add your three Power Automate flow URLs
   - Test all connections before saving

2. **Using the Assistant**: Navigate to `/assistant` to start chatting
   - Ask to fetch conversation records
   - Request to send emails or book meetings
   - Update or delete SharePoint items through natural language

## Development Commands

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |

## Technology Stack

- **Frontend**: Astro with Tailwind CSS
- **Backend**: Netlify Serverless Functions
- **AI**: OpenAI Chat Completions API with function calling
- **Storage**: Netlify Blobs for secure configuration
- **Integration**: Power Automate HTTP triggers

## Security

- No API keys or secrets are stored in source code
- All configuration is stored securely in Netlify Blobs
- Environment-based configuration approach
- Connections tested before saving

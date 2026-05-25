<div align="center">

# CEO
### Centro Estratégico Operativo
<br>

<img src="https://cdn.shopify.com/s/files/1/0242/0175/6777/files/Zylvie_Product_Thumbnails.gif?v=1779655212" alt="CEO Dashboard Banner" width="100%">

<br>
<br>

[![Status](https://img.shields.io/badge/STATUS-ACTIVE-1f2937?style=for-the-badge)](https://ceo.elnegocio.digital)
[![Version](https://img.shields.io/badge/VERSION-1.0.0-966d1d?style=for-the-badge)](https://ceo.elnegocio.digital)
[![Infrastructure](https://img.shields.io/badge/BYOK-INFRASTRUCTURE-0f172a?style=for-the-badge)](https://ceo.elnegocio.digital)
[![License](https://img.shields.io/badge/LICENSE-PRIVATE-black?style=for-the-badge)](#license)
<br>
[![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?style=for-the-badge&logo=googleappsscript&logoColor=white)](https://script.google.com)
[![Google Sheets](https://img.shields.io/badge/Google%20Sheets-34A853?style=for-the-badge&logo=googlesheets&logoColor=white)](https://sheets.google.com)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)


<br>

### Private Operational Infrastructure for Modern Businesses

CRM, projects, contacts, AI assistance, invoicing, cloud storage, and operational management running entirely on your own Google Workspace infrastructure.

<br>

[Live Demo](https://ceo.elnegocio.digital) •
[Official Website](https://elnegocio.digital) •
[Setup Guide](#installation-workflow) •
[Features](#features)

</div>

---

# Table of Contents

- Overview
- Philosophy
- Features
- Dashboard Modules
- AI Assistants
- Technology Stack
- System Architecture
- Analytics & Operational Tools
- Installation Workflow
- Repository Structure
- Design System
- Security
- Pricing
- Use Cases
- Roadmap
- License
- Credits

---

# Overview

CEO (Centro Estratégico Operativo) is a private business operations dashboard built for entrepreneurs, agencies, consultants, and operational teams that want:

- Full ownership of their data
- Private infrastructure
- Administrative centralization
- Serverless architecture
- AI-powered operational support
- Google Workspace integration

Unlike traditional SaaS platforms, CEO operates using a BYOK model:

## BYOK = Bring Your Own Key

Your infrastructure.  
Your cloud.  
Your data.  
Your control.

---

# Philosophy

Traditional SaaS platforms centralize customer data inside proprietary servers.

CEO was built to remove that dependency.

## Traditional SaaS Problems

- Vendor lock-in
- Monthly dependency
- External data storage
- Privacy concerns
- Centralized attack surfaces
- Expensive scaling

---

## CEO Approach

CEO connects directly with:

- Google Sheets
- Google Drive
- Google Apps Script

This creates a lightweight private operational system without requiring:

- VPS servers
- SQL databases
- Complex DevOps
- External infrastructure

---

# Features

## Core Features

| Feature | Description |
|---|---|
| CRM Dashboard | Operational overview with metrics and analytics |
| Contacts Management | Clients, leads, suppliers, organizations |
| Project Management | Tasks, deadlines, priorities, workflows |
| PDF Generator | Quotes, invoices, receipts |
| Professional Messaging | Corporate communication system |
| Secure Vault | Credentials, APIs, internal resources |
| Google Drive Integration | Native cloud storage management |
| Brand Identity Manager | Colors, typography, brand assets |
| AI Assistants | Executive and legal AI support |
| BYOK Infrastructure | Private Google Workspace architecture |

---

# Dashboard Modules

## 1. General CRM Dashboard

Operational analytics dashboard including:

- Contacts
- Organizations
- Tasks
- Metrics
- Performance indicators
- Operational summaries

---

## 2. Professional Messaging

Built-in communication tools for:

- Email templates
- Customer follow-ups
- Invoice reminders
- Corporate correspondence
- Signature integration

---

## 3. Documentation Generator

Generate PDF documents instantly:

- Quotations
- Invoices
- Receipts
- Internal reports

---

## 4. Project Management

Track operational workflows:

- Priorities
- Urgency levels
- Team progress
- Task status
- Deadlines

---

## 5. Contacts & Organizations

Relational CRM system for:

- Clients
- Suppliers
- Leads
- Partners
- Organizations

---

## 6. Digital Catalog

Organize:
- Products
- Services
- Promotions
- Pricing

---

## 7. Secure Vault

Store:
- Internal credentials
- API references
- Payment links
- Operational shortcuts

---

## 8. Brand Guide

Centralize:
- Brand colors
- Logos
- Typography
- Corporate assets

---

## 9. Google Drive Integration

Manage:
- Files
- Cloud assets
- Shared resources
- Uploads

---

# AI Assistants

## Executive AI Assistant

Operational support assistant designed for:

- Administrative workflows
- Email drafting
- Organization
- Productivity
- Task assistance

---

## Legal AI Consultant (Dominican Republic)

Trained with Dominican legal references:

- Constitution
- Labor Code
- Legal procedures
- Administrative regulations

Useful for:
- Contract references
- Legal orientation
- Business compliance support

---

# Technology Stack

## Frontend

| Technology | Purpose |
|---|---|
| HTML5 | Core structure |
| Tailwind CSS | UI styling |
| JavaScript | Interactivity |
| Font Awesome | Icons |
| Google Fonts | Typography |

---

## Backend

| Technology | Purpose |
|---|---|
| Google Apps Script | Serverless backend |
| Google Sheets | Database layer |
| Google Drive API | File management |
| HTTPS Endpoints | Secure communication |

---

## Infrastructure

| Service | Role |
|---|---|
| Google Workspace | Cloud infrastructure |
| Google Drive | Storage |
| Google Sheets | Database |
| Google Apps Script | Logic layer |

---

# System Architecture

```text
┌─────────────────────┐
│     CEO DASHBOARD   │
│   (Frontend UI)     │
└──────────┬──────────┘
           │ HTTPS
           ▼
┌─────────────────────┐
│ Google Apps Script  │
│  Serverless Logic   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Google Sheets     │
│   Database Layer    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    Google Drive     │
│   File Storage      │
└─────────────────────┘
```

---

# Analytics & Operational Tools

CEO includes operational visibility tools such as:

## Dashboard Metrics

- Total contacts
- Organizations
- Messages sent
- Completed tasks
- CRM activity
- Operational growth

---

## CRM Tracking

Track:
- Lead status
- Client relationships
- Operational history
- Activity logs

---

## Reporting

Generate:
- Business reports
- Financial summaries
- Customer records
- Operational documentation

---

# Installation Workflow

## Step 1 — Obtain Master Script

Access the master Google Apps Script from the dashboard setup panel.

---

## Step 2 — Create Google Apps Script

Inside Google Sheets:

```text
Extensions → Apps Script
```

Paste the provided script.

---

## Step 3 — Deploy as Web App

Deploy as:

```text
Web App
```

Permissions:
- Execute as: You
- Access: Anyone with the link

---

## Step 4 — Copy Deployment URL

Example:

```text
https://script.google.com/macros/s/YOUR_KEY/exec
```

---

## Step 5 — Connect Dashboard

Paste the URL into the CEO dashboard connection panel.

Your operational workspace becomes active instantly.

---

# Repository Structure

```text
/
├── index.html
├── assets/
│   ├── images/
│   ├── icons/
│   └── branding/
├── scripts/
│   ├── app.js
│   ├── dashboard.js
│   └── ai-assistants.js
├── styles/
│   └── main.css
├── docs/
├── README.md
└── LICENSE
```

---

# Design System

## Typography

```text
Primary Font: Inter
Fallback: Sans-serif
```

---

## Color Palette

```css
:root {
    --color-navy-950: #0a121c;
    --color-navy-900: #111d2c;
    --color-highlight-gold: #ab8843;
    --color-corporate-gold: #966d1d;
    --color-corporate-gold-dark: #7a5817;
}
```

---

# Security

## Security Features

- HTTPS encrypted endpoints
- 256-bit SSL
- Private infrastructure
- No centralized storage
- Google Workspace authentication

---

## Data Ownership

All data remains:

- Inside your Google account
- Under your control
- Fully exportable
- Independent from vendor databases

---

# Pricing

| Plan | Price | Recommended For |
|---|---|---|
| Standard | $78/month | Freelancers & Small Businesses |
| Corporate | $149/month | Agencies & Teams |

---

# Use Cases

CEO is ideal for:

- Agencies
- Consultants
- Entrepreneurs
- Administrative teams
- Legal offices
- Service businesses
- Freelancers
- Operational managers

---

# Roadmap

## Planned Features

- Multi-user workspaces
- Internal messaging
- Workflow automation
- AI workflow orchestration
- Additional legal regions
- Analytics dashboards
- Marketplace integrations
- API expansion

---

# Performance Goals

- Lightweight frontend
- Serverless backend
- Low operational cost
- Fast deployment
- Minimal maintenance
- High portability

---

# License

Private Commercial Software  
All rights reserved.

Unauthorized distribution prohibited.

---

# Brand

# CEO
## Centro Estratégico Operativo

Operational control.  
Private infrastructure.  
Business independence.

---

# Developed By

## Bebell Digital Solutions

<div align="left">

[![Website](https://img.shields.io/badge/Website-111d2c?style=for-the-badge&logo=googlechrome&logoColor=white)](https://elnegocio.digital)
[![Platform](https://img.shields.io/badge/CEO%20Platform-966d1d?style=for-the-badge)](https://ceo.elnegocio.digital)

</div>

---

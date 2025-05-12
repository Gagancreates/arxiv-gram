# arXiv Gram

A modern, social media-inspired interface for browsing arXiv papers.

## Features

- Browse recent arXiv papers with a modern UI
- Search papers by title
- Filter by categories
- Save papers for reading later
- Like papers to build a collection
- Responsive design for mobile and desktop
- Dark/light theme support

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui components

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

### Deploying to Vercel

This project is optimized for deployment on Vercel. To deploy:

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Visit [vercel.com](https://vercel.com) and sign up/login
3. Click "Add New" → "Project"
4. Import your repository
5. Vercel will automatically detect the Next.js configuration
6. Click "Deploy"

### Direct Deployment via CLI

Alternatively, you can deploy using the Vercel CLI:

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to your Vercel account:
   ```bash
   vercel login
   ```

3. Deploy to production:
   ```bash
   vercel --prod
   ```

## Environment Variables

No environment variables are required for basic functionality. The app uses a proxy API to fetch data from arXiv to avoid CORS issues.

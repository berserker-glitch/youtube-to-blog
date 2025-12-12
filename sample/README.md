# YouTube Caption Extractor Demo

This is a Next.js project demonstrating the use of the `youtube-caption-extractor` npm package. It allows users to fetch subtitles and video details from YouTube videos using this package.

## Features

- Fetch subtitles from YouTube videos
- Retrieve video details including title and description
- Support for multiple languages

## ArticleAlchemist (SaaS mode)

This `sample/` app has been upgraded into **ArticleAlchemist**:

- Email login (NextAuth Email provider) with Gmail SMTP
- MySQL persistence via Prisma (articles + auth tables)
- Authenticated dashboard under `/app/*` with article history

### Local setup

1. Create `sample/.env.local` (copy from `sample/.env.example`)
2. Set `DATABASE_URL` to your MySQL database
3. Create a `NEXTAUTH_SECRET` and set `NEXTAUTH_URL`
4. Configure Gmail SMTP using a Google “App Password”\n
### Prisma\n
Generate client:\n
```bash\n
npx prisma generate\n
```\n
Apply migrations (requires DB):\n
```bash\n
npx prisma migrate dev\n
```\n
### Run\n
```bash\n
npm run dev\n
```\n

## Getting Started

First, install the dependencies:

````bash
npm install
# or
yarn install
# or
pnpm install

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
````

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

1. Enter the YouTube video ID in the "Video ID" field.
2. Specify the desired language code in the "Language" field (e.g., 'en', 'es', 'fr') or leave it empty.
3. Click "Fetch Data" to retrieve the subtitles and video details.

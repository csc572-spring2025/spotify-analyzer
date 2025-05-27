# spotify-analyzer

Analyze Your Spotify Listening Habits
Developed by CSC572: The Open Source Movement, Spring 2024-2025

## Brief Description

Spotify Analyzer is a web application that allows users to analyze their Spotify listening habits. It provides insights into the user's music preferences, including top genres, artists, and tracks. Specifically, the top 8 artists, the top 6 songs, new artist discoveries, and listening analytics (represented graphically) are features this application provides. The application uses the Spotify API to fetch user data and presents it in a readable format.

The project is built using Next.js and TypeScript, ensuring a modern and efficient development experience. The application is designed to be user-friendly, with a clean and intuitive interface.

### Using Spotify Analyzer (as a Dev)

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

1. Modify the `.env.local` file by adding these four lines:

`SPOTIFY_CLIENT_ID = your-client-id` <br>
`SPOTIFY_SECRET = your-secret`
`NEXTAUTH_SECRET= openssl rand -base64 32` <br>
`NEXTAUTH_URL = http://127.0.0.1:3000`

- Your Spotify Client ID and Secret are created at https://developer.spotify.com/dashboard. After creating an app, you will find your client credentials.
- Make sure you put `http://127.0.0.1:3000` as the recall address in the Spotify Developer App that you have created.
- The nextauth_secret is a `32-digit base64 string`, that is randomly generated in the third line of code above.

2. Install the required packages:

```bash
npm i
```

3. Run the development server (install node.js using `npm install` if needed)

Start the server by running

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Contributing to Spotify Analyzer

You can start editing the web pages by modifying `app/page.tsx`. The pages auto-update as you edit the file.
Also look at the components in the `app/components` directory. These components are used to build each page and can be modified to change the layout and functionality of the application.

You can also check out the [Next.js documentation](https://nextjs.org/docs) for more information on how to use Next.js.

### Expectations for Contributions

- Use pull requests to propose changes.
- Follow the project's coding style and conventions.
- Write clear and concise commit messages.
- Ensure that your code is well-documented.

### Known Issues

- Some features and data may not be displayed correctly due to API limitations.

### License

Copyright 2025 CSC572 Spring 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is furnished
to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
